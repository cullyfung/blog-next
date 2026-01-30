import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import type { Element, Root } from 'hast';
import { toHtml } from 'hast-util-to-html';
import type { CSSProperties, HTMLAttributes } from 'react';
import type { ShikiTransformer } from 'shiki';
import { visit } from 'unist-util-visit';
import type { CodeTheme, CodeThemeValue, ShikiRenderData } from './types';

export const shikiTransformers: ShikiTransformer[] = [
  transformerMetaHighlight(),
  transformerNotationDiff(),
  transformerNotationHighlight(),
];

export const defaultCodeTheme = {
  light: 'vitesse-light',
  dark: 'vitesse-black',
} as const satisfies Record<'light' | 'dark', CodeThemeValue>;

export function resolveCodeTheme(
  codeTheme?: CodeTheme,
): Record<'light' | 'dark', CodeThemeValue> {
  if (!codeTheme) {
    return defaultCodeTheme;
  }
  if (
    typeof codeTheme === 'object' &&
    'light' in codeTheme &&
    'dark' in codeTheme
  ) {
    return codeTheme;
  }
  return {
    light: codeTheme,
    dark: codeTheme,
  };
}

export function isThemeString(theme: CodeThemeValue): theme is string {
  return typeof theme === 'string';
}

export function getThemeKey(theme: CodeThemeValue): string | undefined {
  if (typeof theme === 'string') return theme;
  const maybeName = (theme as { name?: unknown })?.name;
  return typeof maybeName === 'string' ? maybeName : undefined;
}

export function getThemeKeys(theme: {
  light: CodeThemeValue;
  dark: CodeThemeValue;
}) {
  return [theme.light, theme.dark]
    .map((item) => getThemeKey(item))
    .filter((item): item is string => Boolean(item));
}

export function resolveLanguage(
  language: string | undefined,
  available: string[],
) {
  if (language && available.includes(language)) {
    return language;
  }
  return 'text';
}

export function extractShikiData(tree: Root): ShikiRenderData {
  let preNode: Element | undefined;
  let codeNode: Element | undefined;

  visit(tree, 'element', (node) => {
    if (node.tagName === 'pre') {
      preNode = node;
    }
    if (node.tagName === 'code') {
      codeNode = node;
    }
  });

  const preProps = extractPropsFromElement<HTMLPreElement>(preNode);
  const codeProps = extractPropsFromElement<HTMLElement>(codeNode);
  const codeHtml = codeNode
    ? toHtml({ type: 'root', children: codeNode.children } as Root)
    : '';

  return {
    html: codeHtml || null,
    preProps,
    codeProps,
  };
}

function extractPropsFromElement<T extends HTMLElement>(
  node?: Element,
): HTMLAttributes<T> {
  if (!node?.properties) {
    return {};
  }

  const props: HTMLAttributes<T> = {};
  const { className, style, ...rest } = node.properties;

  if (className) {
    props.className = Array.isArray(className)
      ? className.join(' ')
      : String(className);
  }

  if (style) {
    if (typeof style === 'string') {
      props.style = parseStyle(style);
    } else if (typeof style === 'object') {
      props.style = style as CSSProperties;
    }
  }

  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith('data-') && value != null) {
      (props as Record<string, string | number | boolean>)[key] = value as
        | string
        | number
        | boolean;
    }
  }

  return props;
}

function parseStyle(styleText: string): CSSProperties {
  return styleText
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .reduce((acc, rule) => {
      const [property, value] = rule.split(':').map((part) => part.trim());
      if (!property || !value) {
        return acc;
      }
      const key = property.startsWith('--')
        ? property
        : property.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      (acc as Record<string, string>)[key] = value;
      return acc;
    }, {} as CSSProperties);
}
