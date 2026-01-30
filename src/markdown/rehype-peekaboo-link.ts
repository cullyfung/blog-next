import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

// 判断是否为外链
function isExternalLink(href: string): boolean {
  if (!href) return false;

  // 排除内部链接
  if (href.startsWith('/') || href.startsWith('#')) return false;

  // 排除相对路径
  if (!href.startsWith('http://') && !href.startsWith('https://')) return false;

  return true;
}

export const rehypePeekabooLink: Plugin<Array<void>, Root> = () => {
  return (tree: Root) => {
    visit(tree, { type: 'element', tagName: 'a' }, (node, i, parent) => {
      if (
        node.properties?.href &&
        isExternalLink(node.properties.href as string) &&
        typeof i === 'number'
      ) {
        const href = node.properties.href as string;

        // 创建 peekabooLink 组件节点
        const peekabooLinkNode = {
          type: 'element' as const,
          tagName: 'peekaboolink',
          properties: {
            href,
          },
          children: node.children,
        };

        // 替换原始链接节点
        if (parent?.children) {
          parent.children[i] = peekabooLinkNode;
        }
      }
    });
  };
};
