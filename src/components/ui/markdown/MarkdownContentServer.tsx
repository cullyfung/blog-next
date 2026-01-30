import type { Result as TocResult } from 'mdast-util-toc';
import type React from 'react';
import PostToc from '@/components/site/PostToc';
import type { CodeTheme } from '@/lib/shiki/types';
import { cn } from '@/lib/utils';
import { renderMarkdown } from '@/markdown';
import { createMdxComponentsServer } from '@/markdown/components.server';
import { MarkdownContentContainer } from './MarkdownContentContainer';

interface MarkdownContentServerProps {
  content?: string;
  className?: string;
  withToc?: boolean;
  strictMode?: boolean;
  onlyContent?: boolean;
  codeTheme?: CodeTheme;
  children?: React.ReactNode;
}

/**
 * Server Component for rendering Markdown content
 * Shiki highlighting happens on the server (sync)
 */
export function MarkdownContentServer({
  content,
  className,
  withToc,
  strictMode,
  onlyContent,
  codeTheme,
}: MarkdownContentServerProps) {
  if (!content) {
    return null;
  }

  // Parse markdown on server (Shiki highlighting is sync after initHighlighter)
  const parsedContent = renderMarkdown({
    content,
    strictMode,
    codeTheme,
    components: createMdxComponentsServer({ codeTheme }),
  });

  let toc: TocResult | undefined;
  if (!onlyContent && withToc) {
    toc = parsedContent?.toToc();
  }

  return (
    <MarkdownContentContainer className={cn('relative', className)}>
      <div className="post-content prose dark:prose-invert ">
        {parsedContent?.toElement()}
      </div>
      {toc && <PostToc data={toc} />}
    </MarkdownContentContainer>
  );
}
