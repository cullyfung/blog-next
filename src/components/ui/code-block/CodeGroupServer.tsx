import type { ReactNode } from 'react';
import type { CodeTheme } from '@/lib/shiki/types';
import { CodeBlock } from './CodeBlock';
import { extractCodeBlocksFromChildren } from './utils';

interface CodeGroupProps {
  children?: ReactNode;
  codeTheme?: CodeTheme;
  'data-code-blocks'?: string;
  dataCodeBlocks?: string;
  [key: string]: unknown;
}

interface CodeBlockData {
  code: string;
  language: string;
  label: string;
}

export function CodeGroupServer({
  children,
  codeTheme,
  'data-code-blocks': dataCodeBlocksKebab,
  dataCodeBlocks: dataCodeBlocksCamel,
  ...props
}: CodeGroupProps) {
  const dataCodeBlocks = [
    dataCodeBlocksKebab,
    dataCodeBlocksCamel,
    props.dataCodeBlocks,
    props['data-code-blocks'],
  ].find((value): value is string => typeof value === 'string');

  let tabs = [] as CodeBlockData[];

  if (dataCodeBlocks) {
    try {
      const blocks: CodeBlockData[] = JSON.parse(dataCodeBlocks);
      tabs = blocks.map((block) => ({
        label: block.label,
        code: block.code,
        language: block.language,
      }));
    } catch (error) {
      console.error('Failed to parse data-code-blocks:', error);
    }
  }

  if (tabs.length === 0) {
    tabs = extractCodeBlocksFromChildren(children);
  }

  if (tabs.length === 0) {
    return null;
  }

  return <CodeBlock tabs={tabs} codeTheme={codeTheme} />;
}
