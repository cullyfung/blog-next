import type { Root as HashRoot } from 'hast';
import { toHtml } from 'hast-util-to-html';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import jsYaml from 'js-yaml';
import type { Root as MdashRoot } from 'mdast';
import { toc } from 'mdast-util-toc';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import readingTime from 'reading-time';
import rehypeInferDescriptionMeta from 'rehype-infer-description-meta';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkBreaks from 'remark-breaks';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import remarkEmoji from 'remark-emoji';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';

import remarkGithubAlerts from 'remark-gh-alerts';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { toast } from 'sonner';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { consoleLog } from '@/lib/console';
import { isServer } from '@/lib/is';
import type { CodeTheme } from '@/lib/shiki/types';
import { createMdxComponents } from './components';
import { rehypeCodeGroup } from './rehype-code-group';
import { rehypeFixBlock } from './rehype-fix-block';
import { rehypeMermaid } from './rehype-mermaid';
import { rehypePeekabooLink } from './rehype-peekaboo-link';
import { remarkCodeGroup } from './remark-code-group';
import { remarkPangu } from './remark-pangu';
import sanitizeScheme from './sanitize-schema';

const processorCache = new Map<string, ReturnType<typeof unified>>();

function createProcessor(strictMode?: boolean) {
  return (
    unified()
      .use(remarkParse)
      .use(remarkGithubAlerts) // make sure this is before remarkBreaks
      .use(remarkBreaks)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkGfm, {
        singleTilde: false,
      })
      .use(remarkDirective)
      .use(remarkCodeGroup) // Process code-group directive before converting to rehype
      .use(remarkDirectiveRehype)
      .use(remarkMath, {
        singleDollarTextMath: false,
      })
      .use(remarkPangu)
      .use(remarkEmoji)
      .use(remarkRehype, {
        allowDangerousHtml: true,
      })
      .use(rehypeRaw)
      .use(rehypeCodeGroup) // Must be right after rehypeRaw to process wrapper elements
      .use(rehypeSlug)
      .use(rehypeSanitize, strictMode ? undefined : sanitizeScheme)
      .use(rehypeMermaid)
      .use(rehypePeekabooLink)
      // .use(rehypeTaskList) // 处理任务列表的 checkbox
      .use(rehypeFixBlock) // 必须放在其他 rehype 插件之后
      .use(rehypeInferDescriptionMeta)
      .use(rehypeKatex, {
        strict: false,
      })
      .use(rehypeStringify, { allowDangerousHtml: true })
  );
}

function getProcessor(strictMode?: boolean) {
  const key = strictMode ? 'strict' : 'default';
  const cached = processorCache.get(key);
  if (cached) {
    return cached;
  }
  const processor = createProcessor(strictMode);
  processorCache.set(key, processor);
  return processor;
}

export function renderMarkdown({
  content,
  strictMode,
  codeTheme,
  components,
}: {
  content: string;
  strictMode?: boolean;
  codeTheme?: CodeTheme;
  components?: Record<string, unknown>;
}) {
  let hastTree: HashRoot | undefined;
  let mdastTree: MdashRoot | undefined;

  const file = new VFile(content);

  try {
    const processor = getProcessor(strictMode);

    // markdown abstract syntax tree
    mdastTree = processor.parse(file);
    // hypertext abstract syntax tree
    hastTree = processor.runSync(mdastTree, file);
  } catch (error) {
    consoleLog('ERROR', 'renderMarkdown:', error);
    if (!isServer()) {
      toast.error((error as Error).message);
    }
  }
  return {
    tree: hastTree,
    toToc: () =>
      mdastTree &&
      toc(mdastTree, {
        tight: true,
        ordered: true,
      }),
    toHtml: () => hastTree && toHtml(hastTree),
    toElement: () =>
      hastTree &&
      toJsxRuntime(hastTree, {
        Fragment,
        components: components ?? createMdxComponents({ codeTheme }),
        ignoreInvalidStyle: true,
        jsx,
        jsxs,
        passNode: true,
      }),
    toMetadata: () => {
      const metadata = {
        frontMatter: undefined,
        images: [],
        audio: undefined,
        excerpt: undefined,
      } as {
        frontMatter?: Record<string, unknown>;
        images: string[];
        audio?: string;
        excerpt?: string;
      };

      metadata.excerpt = file.data.meta?.description || undefined;

      if (mdastTree) {
        visit(mdastTree, (node) => {
          if (node.type === 'yaml') {
            metadata.frontMatter = jsYaml.load(node.value) as Record<
              string,
              unknown
            >;
            metadata.frontMatter.readingTime = readingTime(node.value).text;
          }
        });
      }

      if (hastTree) {
        visit(hastTree, (node) => {
          if (node.type === 'element') {
            if (
              node.tagName === 'img' &&
              typeof node.properties.src === 'string'
            ) {
              metadata.images.push(node.properties.src);
            }
            if (node.tagName === 'audio') {
              if (typeof node.properties.cover === 'string') {
                metadata.images.push(node.properties.cover);
              }
              if (!metadata.audio && typeof node.properties.src === 'string') {
                metadata.audio = node.properties.src;
              }
            }
          }
        });
      }

      return metadata;
    },
  };
}
