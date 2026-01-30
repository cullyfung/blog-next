/**
 * Remark plugin to handle :::code-group directive
 * Converts directive syntax to CodeGroup component
 */

import type { Code, Root } from 'mdast';
import type { ContainerDirective } from 'mdast-util-directive';
import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

/**
 * Extract labels from directive attributes
 * Example: :::code-group labels="npm, pnpm, yarn"
 *     or: :::code-group labels=[npm,pnpm,yarn]
 *
 * NOTE: Avoid spaces in unquoted attribute values as they will be treated as separate attributes
 *       ❌ labels=[npm, pnpm, yarn]  (will parse incorrectly)
 *       ✅ labels="npm, pnpm, yarn"  (correct with quotes)
 *       ✅ labels=[npm,pnpm,yarn]    (correct without spaces)
 */
function extractLabels(node: ContainerDirective): string[] | undefined {
  const labelsAttr = node.attributes?.labels;
  if (!labelsAttr) return undefined;

  // Remove optional square brackets if present
  // e.g., "npm, pnpm, yarn" or "[npm,pnpm,yarn]" or "npm,pnpm,yarn"
  let cleanedAttr = labelsAttr.trim();

  // Remove surrounding brackets if exist
  if (cleanedAttr.startsWith('[') && cleanedAttr.endsWith(']')) {
    cleanedAttr = cleanedAttr.slice(1, -1);
  }

  // Split by comma and trim each label
  return cleanedAttr
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Extract label from code meta string
 * Example: ```bash [pnpm]
 */
function extractLabelFromMeta(meta?: string | null): string | undefined {
  if (!meta) return undefined;
  const match = meta.match(/\[(.+?)\]/);
  return match?.[1];
}

/**
 * Remark plugin: :::code-group → CodeGroup component
 */
export const remarkCodeGroup: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(
      tree,
      'containerDirective',
      (node: ContainerDirective, _index, _parent) => {
        // Only handle code-group directives
        if (node.name !== 'code-group') return;

        // Processing code-group directive

        // Extract labels from directive attributes (if provided)
        const explicitLabels = extractLabels(node);

        // Find all code blocks inside the directive
        const codeBlocks: Array<{
          code: string;
          language: string;
          label: string;
          meta?: string;
        }> = [];

        visit(node, 'code', (codeNode: Code) => {
          const language = codeNode.lang || 'text';
          let code = codeNode.value;
          let label: string | undefined;
          let _labelFromComment = false;

          // Try to extract label from meta string first
          label = extractLabelFromMeta(codeNode.meta);

          // If no label in meta, try to extract from first line comment
          if (!label) {
            const lines = code.split('\n');
            const firstLine = lines[0]?.trim();

            // Match various comment formats: # label, // label, <!-- label -->, /* label */
            const commentMatch = firstLine?.match(
              /^(?:#|\/\/|<!--|\/\*)\s*(.+?)(?:-->|\*\/)?$/,
            );
            if (commentMatch) {
              label = commentMatch[1].trim();
              _labelFromComment = true;
              // Remove the comment line from code
              code = lines.slice(1).join('\n').trim();
            }
          }

          // If still no label, use language name
          if (!label) {
            label = language;
          }

          codeBlocks.push({
            code,
            language,
            label,
            meta: codeNode.meta || undefined,
          });
        });

        // If explicit labels provided, use them (override extracted labels)
        if (explicitLabels && explicitLabels.length === codeBlocks.length) {
          codeBlocks.forEach((block, i) => {
            block.label = explicitLabels[i];
          });
        }

        // Skip if no code blocks found
        if (codeBlocks.length === 0) return;

        // Transform the directive node into an HTML element node
        // Use custom tag name 'codegroup' (no hyphen for better compatibility)
        // Convert to 'html' type so it passes through remarkRehype correctly
        const htmlContent = `<codegroup data-code-blocks='${JSON.stringify(codeBlocks).replace(/'/g, '&apos;')}'></codegroup>`;

        // Replace the directive node with an HTML node
        (node as any).type = 'html';
        (node as any).value = htmlContent;
        delete (node as any).name;
        delete (node as any).attributes;
        delete (node as any).children;

        // Return SKIP to prevent further processing
        return [SKIP];
      },
    );
  };
};
