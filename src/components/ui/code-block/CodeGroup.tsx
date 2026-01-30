'use client';

import React from 'react';
import { CodeBlockClient } from './CodeBlockClient';
import { extractCodeBlocksFromChildren } from './utils';

interface CodeGroupProps {
  children?: React.ReactNode;
  'data-code-blocks'?: string;
  dataCodeBlocks?: string;
  [key: string]: unknown;
}

interface CodeBlockData {
  code: string;
  language: string;
  label: string;
}

/**
 * Unified CodeGroup component
 * Supports both HTML tag <CodeGroup> and directive :::code-group
 *
 * Usage:
 * 1. HTML tag syntax: <CodeGroup>...</CodeGroup>
 * 2. Directive syntax: :::code-group (converts to <codegroup data-code-blocks='...'>)
 */
export function CodeGroup({
  children,
  codeTheme: _codeTheme,
  'data-code-blocks': dataCodeBlocksKebab,
  dataCodeBlocks: dataCodeBlocksCamel,
  ...props
}: CodeGroupProps) {
  // Try to get data from attributes (directive syntax with data-code-blocks)
  const dataCodeBlocks = [
    dataCodeBlocksKebab,
    dataCodeBlocksCamel,
    props.dataCodeBlocks,
    props['data-code-blocks'],
  ].find((value): value is string => typeof value === 'string');

  const tabs = React.useMemo(() => {
    // Priority 1: Parse from data-code-blocks attribute (directive syntax)
    if (dataCodeBlocks) {
      try {
        const blocks: CodeBlockData[] = JSON.parse(dataCodeBlocks);
        return blocks.map((block) => ({
          label: block.label,
          code: block.code,
          language: block.language,
        }));
      } catch (error) {
        console.error('Failed to parse data-code-blocks:', error);
      }
    }

    // Priority 2: Extract from children (HTML tag syntax or fallback)
    return extractCodeBlocksFromChildren(children);
  }, [children, dataCodeBlocks]);

  if (tabs.length === 0) {
    return null;
  }

  return <CodeBlockClient tabs={tabs} />;
}
