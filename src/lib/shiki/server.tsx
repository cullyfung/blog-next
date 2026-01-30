import {
  bundledLanguages,
  bundledThemes,
  createHighlighter as createHighlighterPrimitive,
  type Highlighter,
} from 'shiki';

import {
  defaultCodeTheme,
  extractShikiData,
  resolveCodeTheme,
  resolveLanguage,
  shikiTransformers,
} from './shared';
import type { ShikiCodeProps, ShikiRenderData } from './types';

let highlighter: Highlighter | undefined;

export const createHighlighter = async () => {
  if (!highlighter) {
    highlighter = await createHighlighterPrimitive({
      themes: Object.keys(bundledThemes),
      langs: Object.keys(bundledLanguages),
    });
  }
  return highlighter;
};

export async function renderShiki({
  code,
  codeTheme = defaultCodeTheme,
  language,
}: ShikiCodeProps): Promise<ShikiRenderData> {
  if (!code) {
    return {
      html: null,
      preProps: {},
      codeProps: {},
    };
  }

  const highlighter = await createHighlighter();
  const safeLanguage = resolveLanguage(language, Object.keys(bundledLanguages));
  const resolvedTheme = resolveCodeTheme(codeTheme);

  const rendered = highlighter.codeToHast(code, {
    lang: safeLanguage,
    themes: resolvedTheme,
    transformers: shikiTransformers,
  });

  return extractShikiData(rendered);
}
