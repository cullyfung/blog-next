'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  BundledLanguage,
  BundledTheme,
  DynamicImportLanguageRegistration,
  DynamicImportThemeRegistration,
  HighlighterCore,
} from 'shiki';
import {
  defaultCodeTheme,
  extractShikiData,
  getThemeKey,
  getThemeKeys,
  isThemeString,
  resolveCodeTheme,
  resolveLanguage,
  shikiTransformers,
} from './shared';
import type { ShikiCodeProps, ShikiRenderData } from './types';

let highlighterCore: HighlighterCore | null = null;
let highlighterPromise: Promise<HighlighterCore> | null = null;

const getHighlighterCore = () => {
  if (highlighterCore) {
    return Promise.resolve(highlighterCore);
  }

  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [{ createHighlighterCore }, getWasm] = await Promise.all([
        import('shiki/core'),
        import('shiki/wasm').then((m) => m.default),
      ]);

      const core = await createHighlighterCore({
        themes: [
          import('shiki/themes/vitesse-light.mjs'),
          import('shiki/themes/vitesse-black.mjs'),
        ],
        langs: [],
        loadWasm: getWasm,
      });

      highlighterCore = core;
      return core;
    })();
  }

  return highlighterPromise;
};

let langModule: Record<
  BundledLanguage,
  DynamicImportLanguageRegistration
> | null = null;
let themeModule: Record<BundledTheme, DynamicImportThemeRegistration> | null =
  null;

export interface UseShikiResult extends ShikiRenderData {
  isLoading: boolean;
}

/**
 * Hook to get Shiki highlighted HTML using structure: 'inline'
 * Returns only spans with <br> for line breaks, no pre/code wrapper
 */
export function useShiki({
  code,
  language,
  codeTheme = defaultCodeTheme,
}: ShikiCodeProps): UseShikiResult {
  const [shiki, setShiki] = useState<HighlighterCore | null>(null);
  const [ready, setReady] = useState(false);
  const loadThemesRef = useRef([] as string[]);
  const loadLanguagesRef = useRef([] as string[]);
  const resolvedTheme = useMemo(() => resolveCodeTheme(codeTheme), [codeTheme]);

  // Load highlighter
  useEffect(() => {
    if (!code) return;
    let mounted = true;
    getHighlighterCore()
      .then((core) => {
        if (mounted) setShiki(core);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [code]);

  // Register language and themes
  useEffect(() => {
    if (!shiki || !language || !codeTheme || !code) return;
    let cancelled = false;

    async function register() {
      async function loadShikiLanguage(
        lang: string,
        languageModule: DynamicImportLanguageRegistration,
      ) {
        if (!shiki) return;
        if (!shiki.getLoadedLanguages().includes(lang)) {
          await shiki.loadLanguage(await languageModule());
        }
      }
      async function loadShikiTheme(
        theme: string,
        themeModule: DynamicImportThemeRegistration,
      ) {
        if (!shiki) return;
        if (!shiki.getLoadedThemes().includes(theme)) {
          await shiki.loadTheme(await themeModule());
        }
      }

      const [{ bundledLanguages }, { bundledThemes }] =
        langModule && themeModule
          ? [{ bundledLanguages: langModule }, { bundledThemes: themeModule }]
          : await Promise.all([
              import('shiki/langs') as Promise<{
                bundledLanguages: Record<
                  BundledLanguage,
                  DynamicImportLanguageRegistration
                >;
              }>,
              import('shiki/themes') as Promise<{
                bundledThemes: Record<
                  BundledTheme,
                  DynamicImportThemeRegistration
                >;
              }>,
            ]);

      langModule = bundledLanguages;
      themeModule = bundledThemes;

      const themeKeys = getThemeKeys(resolvedTheme);
      if (
        language &&
        loadLanguagesRef.current.includes(language) &&
        themeKeys.every((key) => loadThemesRef.current.includes(key))
      ) {
        if (!cancelled) setReady(true);
        return;
      }

      await Promise.all([
        (async () => {
          if (language) {
            const importFn = bundledLanguages[language as BundledLanguage];
            if (!importFn) return;
            await loadShikiLanguage(language, importFn);
            loadLanguagesRef.current.push(language);
          }
        })(),
        (async () => {
          const themes = [resolvedTheme.light, resolvedTheme.dark];
          await Promise.all(
            themes.map(async (theme) => {
              const themeKey = getThemeKey(theme);
              if (themeKey && loadThemesRef.current.includes(themeKey)) {
                return;
              }

              if (isThemeString(theme)) {
                const importFn = bundledThemes[theme as BundledTheme];
                if (importFn) {
                  await loadShikiTheme(theme, importFn);
                }
              } else {
                await shiki.loadTheme(theme);
              }

              if (themeKey && !loadThemesRef.current.includes(themeKey)) {
                loadThemesRef.current.push(themeKey);
              }
            }),
          );
        })(),
      ]);

      if (!cancelled) setReady(true);
    }

    setReady(false);
    register();
    return () => {
      cancelled = true;
    };
  }, [shiki, codeTheme, language, resolvedTheme, code]);

  const result = useMemo<ShikiRenderData | null>(() => {
    if (!shiki || !ready || !code) return null;

    try {
      const hastTree = shiki.codeToHast(code, {
        lang: resolveLanguage(language, shiki.getLoadedLanguages()),
        themes: resolvedTheme,
        transformers: shikiTransformers,
      });

      return extractShikiData(hastTree);
    } catch {
      return null;
    }
  }, [shiki, code, language, resolvedTheme, ready]);

  return {
    html: result?.html ?? null,
    preProps: result?.preProps ?? {},
    codeProps: result?.codeProps ?? {},
    isLoading: Boolean(code) && (!ready || !shiki),
  };
}
