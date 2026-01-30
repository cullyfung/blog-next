/**
 * Rehype plugin to handle code-group elements
 * Works after remarkDirectiveRehype has processed directives
 * Extracts code blocks from children and stores in data-code-blocks
 */

import type { Element, Root, Text } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

interface CodeBlockData {
  code: string;
  language: string;
  label: string;
}

export const rehypeCodeGroup: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, _index, _parent) => {
      // Only handle CodeGroup HTML tag syntax (PascalCase)
      // Directive syntax (:::code-group) is handled by remarkCodeGroup → <codegroup> tag
      if (node.tagName === 'CodeGroup') {
        // Extract from children for HTML tag syntax: <CodeGroup>
        const codeBlocks: CodeBlockData[] = [];

        visit(node, 'element', (child: Element) => {
          if (child.tagName === 'pre') {
            // Find code element inside pre
            const codeElement = child.children.find(
              (c): c is Element => c.type === 'element' && c.tagName === 'code',
            );

            if (codeElement) {
              // Extract language from className
              const className = codeElement.properties?.className;
              const languageMatch = Array.isArray(className)
                ? className.find(
                    (c: any) =>
                      typeof c === 'string' && c.startsWith('language-'),
                  )
                : typeof className === 'string' &&
                    className.startsWith('language-')
                  ? className
                  : null;

              const language =
                typeof languageMatch === 'string'
                  ? languageMatch.replace('language-', '')
                  : 'text';

              // Extract code text
              const textNode = codeElement.children.find(
                (c): c is Text => c.type === 'text',
              );
              const code = textNode?.value || '';

              // Extract label from data-meta or first line comment
              let label = language;

              // Try to get label from data-meta (for HTML syntax with meta)
              const dataMeta = codeElement.properties?.['data-meta'] as string;
              if (dataMeta) {
                const metaMatch = dataMeta.match(/\[(.+?)\]/);
                if (metaMatch) {
                  label = metaMatch[1];
                }
              }

              // Try to extract from first line comment
              if (label === language) {
                const lines = code.split('\n');
                const firstLine = lines[0]?.trim();
                if (firstLine) {
                  const commentMatch = firstLine.match(
                    /^(?:#|\/\/|<!--|\/\*)\s*(.+?)(?:-->|\*\/)?$/,
                  );
                  if (commentMatch) {
                    label = commentMatch[1].trim();
                  }
                }
              }

              codeBlocks.push({ code, language, label });
            }
          }
        });

        // Store in data-code-blocks and convert to codegroup tag
        if (codeBlocks.length > 0) {
          node.properties = node.properties || {};
          node.properties['data-code-blocks'] = JSON.stringify(codeBlocks);
          node.properties.dataCodeBlocks = JSON.stringify(codeBlocks); // Also camelCase

          // Change to lowercase codegroup tag (same as directive syntax)
          node.tagName = 'codegroup';

          // Clear children to avoid duplicate rendering
          node.children = [];
        }
      }
    });
  };
};
