import React from 'react';

interface ExtractedCodeBlock {
  label: string;
  code: string;
  language: string;
}

/**
 * Extract code blocks from React children (MDX <pre><code> elements)
 * Used by CodeGroup and CodeGroupFromDirective
 */
export function extractCodeBlocksFromChildren(
  children: React.ReactNode,
): ExtractedCodeBlock[] {
  const extracted: ExtractedCodeBlock[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    // If it's a <pre> element
    if (child.type === 'pre') {
      const codeChild = React.Children.toArray(child.props.children).find(
        (c): c is React.ReactElement =>
          React.isValidElement(c) &&
          (c.type === 'code' ||
            (typeof c.type === 'string' && c.type === 'code')),
      );

      if (codeChild) {
        // Extract language from className (language-xxx)
        const className = (codeChild.props.className as string) || '';
        const languageMatch = className.match(/language-(\w+)/);
        const language = languageMatch?.[1] || 'text';

        // Extract code content
        const code = String(codeChild.props.children || '').trim();

        // Extract label from first line comment
        const lines = code.split('\n');
        let label = language;
        let actualCode = code;

        const firstLine = lines[0]?.trim();
        if (firstLine) {
          // Support various comment formats: # label, // label, <!-- label -->
          const labelMatch = firstLine.match(
            /^(?:#|\/\/|<!--|\/\*)\s*(.+?)(?:-->|\*\/)?$/,
          );
          if (labelMatch) {
            label = labelMatch[1].trim();
            // Remove first line
            actualCode = lines.slice(1).join('\n').trim();
          }
        }

        extracted.push({
          label,
          code: actualCode,
          language,
        });
      }
    }
  });

  return extracted;
}
