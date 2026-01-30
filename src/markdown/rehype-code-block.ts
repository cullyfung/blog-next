import type { Element, Root, Text } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Rehype 插件：处理单个代码块，将其转换为 codeblock 标签
 * CodeGroup 由 remark-code-group 和 rehype-code-group 处理
 */
export const rehypeCodeBlock: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined) return;

      // 只处理 pre 标签（单个代码块）
      if (node.tagName === 'pre') {
        // 检查是否在 code-group 内部
        const isInGroup = isInsideCodeGroup(parent);

        if (!isInGroup) {
          // 独立的 code block：提取数据并转换
          const codeChild = node.children.find(
            (child: any) =>
              child.type === 'element' && child.tagName === 'code',
          ) as Element | undefined;

          if (codeChild) {
            // 提取 language
            const className =
              (codeChild.properties?.className as string[]) || [];
            const languageClass = className.find((c: string) =>
              c.startsWith('language-'),
            );
            const language = languageClass?.replace('language-', '') || 'text';

            // 跳过特殊语言（由其他插件处理）
            // mermaid 由 rehypeMermaid 处理
            const specialLanguages = ['mermaid'];
            if (specialLanguages.includes(language)) {
              return;
            }

            // 提取 code 文本
            const code = extractText(codeChild);

            // 转换为自定义 codeblock 标签
            parent.children[index] = {
              type: 'element',
              tagName: 'codeblock',
              properties: {
                code,
                language,
              },
              children: [],
            };
          }
        }
      }
    });
  };
};

/**
 * 检查节点是否在 code-group 内部
 */
function isInsideCodeGroup(node: any): boolean {
  if (!node) return false;

  // 检查是否是 codegroup 标签（由 remark-code-group 生成）
  if (node.type === 'element' && node.tagName === 'codegroup') {
    return true;
  }

  // 检查是否是 CodeGroup 标签（HTML 标签语法）
  if (node.type === 'element' && node.tagName === 'CodeGroup') {
    return true;
  }

  return false;
}

/**
 * 从 hast 节点提取文本内容
 */
function extractText(node: Element): string {
  let text = '';

  function traverse(n: any) {
    if (n.type === 'text') {
      text += (n as Text).value;
    } else if (n.children) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);
  return text.trim();
}
