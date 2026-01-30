import type { HTMLAttributes, ReactNode } from 'react';
import { renderShiki } from '@/lib/shiki/server';
import type { CodeTheme } from '@/lib/shiki/types';
import { CodeBlockClient, type CodeBlockTab } from './CodeBlockClient';

interface CodeTab {
  label: string;
  code: string;
  language?: string;
}

interface CodeBlockProps {
  tabs?: CodeTab[] | CodeTab | null;
  code?: string;
  language?: string;
  className?: string;
  preProps?: HTMLAttributes<HTMLPreElement>;
  codeProps?: HTMLAttributes<HTMLElement>;
  codeChildren?: ReactNode;
  codeTheme?: CodeTheme;
}

export async function CodeBlock({
  tabs,
  code,
  language = 'bash',
  className,
  preProps,
  codeProps,
  codeChildren,
  codeTheme,
}: CodeBlockProps) {
  const codeContent: CodeTab[] = (() => {
    if (Array.isArray(tabs) && tabs.length > 0) {
      return tabs;
    }
    if (tabs && !Array.isArray(tabs)) {
      const maybe = tabs as CodeTab;
      if (maybe.code) {
        return [maybe];
      }
    }
    if (code) {
      return [{ label: language, code, language }];
    }
    return [];
  })();

  if (codeContent.length === 0) return null;

  const tabsWithShiki: CodeBlockTab[] = await Promise.all(
    codeContent.map(async (tab) => {
      const resolvedLanguage = tab.language || language || 'text';
      const rendered = await renderShiki({
        code: tab.code,
        language: resolvedLanguage,
        codeTheme,
      });

      return {
        ...tab,
        language: resolvedLanguage,
        html: rendered.html,
        preProps: rendered.preProps,
        codeProps: rendered.codeProps,
      };
    }),
  );

  return (
    <CodeBlockClient
      tabs={tabsWithShiki}
      className={className}
      preProps={preProps}
      codeProps={codeProps}
      codeChildren={codeChildren}
    />
  );
}
