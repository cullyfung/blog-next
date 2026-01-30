import React from 'react';
import { HorizontalIcon } from '@/components/icons';
import { PeekabooLink } from '@/components/links';
import { AdvancedImageContainer } from '@/components/ui/advanced-image';
import { DarkToggle } from '@/components/ui/dark-toggle';
import { LinkCard } from '@/components/ui/link-card';
import { LinkPreview } from '@/components/ui/link-preview';
import { createMarkdownHeaderComponent } from '@/components/ui/markdown-render';
import { Mermaid } from '@/components/ui/mermaid';
import type { CodeTheme } from '@/lib/shiki/types';

export type MdxComponent =
  | React.ComponentType<unknown>
  | ((props: unknown) => React.ReactNode);

export type MdxComponents = Record<string, MdxComponent>;

type CodeBlockComponentProps = {
  code?: string;
  language?: string;
  preProps?: React.HTMLAttributes<HTMLPreElement>;
  codeProps?: React.HTMLAttributes<HTMLElement>;
  codeChildren?: React.ReactNode;
  codeTheme?: CodeTheme;
};

type CodeGroupComponentProps = Record<string, unknown> & {
  codeTheme?: CodeTheme;
};

type MdxPreProps = React.HTMLAttributes<HTMLPreElement> & {
  node?: unknown;
  children?: React.ReactNode;
};

export function extractCodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractCodeText).join('');
  }
  if (React.isValidElement(node)) {
    return extractCodeText(node.props.children);
  }
  return '';
}

export function getCodeLanguage(className?: string | string[]) {
  if (!className) return undefined;
  const classNames = Array.isArray(className)
    ? className
    : className.split(' ');
  const match = classNames.find((name) => name.startsWith('language-'));
  return match ? match.replace('language-', '') : undefined;
}

const baseMdxComponents = {
  darktoggle: DarkToggle,
  linkcard: LinkCard,
  linkpreview: LinkPreview,
  peekaboolink: PeekabooLink,
  hr: HorizontalIcon,
  mermaid: Mermaid,
  img: AdvancedImageContainer,
  h1: createMarkdownHeaderComponent('h1'),
  h2: createMarkdownHeaderComponent('h2'),
  h3: createMarkdownHeaderComponent('h3'),
  h4: createMarkdownHeaderComponent('h4'),
  h5: createMarkdownHeaderComponent('h5'),
  h6: createMarkdownHeaderComponent('h6'),
  table: (rawProps: unknown) => {
    const props = rawProps as React.ComponentPropsWithoutRef<'table'>;
    return (
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 ">
        <table className="table" {...props} />
      </div>
    );
  },
} as MdxComponents;

export function createMdxPre(
  CodeBlockComponent: React.ComponentType<CodeBlockComponentProps>,
  codeTheme?: CodeTheme,
) {
  return function MdxPre(rawProps: unknown) {
    const props = rawProps as MdxPreProps;
    const codeChild = React.Children.toArray(props.children).find(
      (child): child is React.ReactElement =>
        React.isValidElement(child) &&
        (child.type === 'code' ||
          (typeof child.type === 'string' && child.type === 'code')),
    );

    const { node: _node, children: _children, ...preProps } = props;

    if (!codeChild) {
      return <pre {...preProps} />;
    }

    const {
      children: codeChildren,
      node: _codeNode,
      ...codeProps
    } = (codeChild.props || {}) as React.HTMLAttributes<HTMLElement> & {
      node?: unknown;
      children?: React.ReactNode;
    };

    const codeText = extractCodeText(codeChildren);
    const codeClassName = codeProps.className as string | string[] | undefined;
    const language = getCodeLanguage(codeClassName);

    return (
      <CodeBlockComponent
        code={codeText}
        language={language}
        preProps={preProps}
        codeProps={codeProps}
        codeChildren={codeChildren}
        codeTheme={codeTheme}
      />
    );
  };
}

export function createMdxComponentsBase({
  codeTheme,
  CodeBlockComponent,
  CodeGroupComponent,
}: {
  codeTheme?: CodeTheme;
  CodeBlockComponent: React.ComponentType<CodeBlockComponentProps>;
  CodeGroupComponent: React.ComponentType<CodeGroupComponentProps>;
}): MdxComponents {
  const MdxPre = createMdxPre(CodeBlockComponent, codeTheme);

  return {
    ...baseMdxComponents,
    pre: MdxPre,
    codeblock: (rawProps: unknown) => {
      const props = rawProps as CodeBlockComponentProps;
      return (
        <CodeBlockComponent
          code={props.code}
          language={props.language}
          preProps={props.preProps}
          codeProps={props.codeProps}
          codeTheme={codeTheme}
        />
      );
    },
    CodeGroup: (rawProps: unknown) => {
      const props = rawProps as CodeGroupComponentProps;
      return <CodeGroupComponent {...props} codeTheme={codeTheme} />;
    },
    codegroup: (rawProps: unknown) => {
      const props = rawProps as CodeGroupComponentProps;
      return <CodeGroupComponent {...props} codeTheme={codeTheme} />;
    },
  };
}

export function createMdxComponentsCache(
  factory: (codeTheme?: CodeTheme) => MdxComponents,
) {
  const stringCache = new Map<string, MdxComponents>();
  const objectCache = new WeakMap<object, MdxComponents>();

  return (codeTheme?: CodeTheme) => {
    if (!codeTheme) {
      const cached = stringCache.get('default');
      if (cached) return cached;
      const created = factory();
      stringCache.set('default', created);
      return created;
    }

    if (typeof codeTheme === 'object') {
      const cached = objectCache.get(codeTheme);
      if (cached) return cached;
      const created = factory(codeTheme);
      objectCache.set(codeTheme, created);
      return created;
    }

    const key = `string:${codeTheme}`;
    const cached = stringCache.get(key);
    if (cached) return cached;
    const created = factory(codeTheme);
    stringCache.set(key, created);
    return created;
  };
}
