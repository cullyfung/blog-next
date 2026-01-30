import type { HTMLAttributes } from 'react';
import type { StringLiteralUnion, ThemeRegistrationAny } from 'shiki/types.mjs';

export type CodeThemeValue = ThemeRegistrationAny | StringLiteralUnion<any>;

export type CodeTheme =
  | CodeThemeValue
  | {
      light: CodeThemeValue;
      dark: CodeThemeValue;
    };

export interface ShikiCodeProps {
  codeTheme?: CodeTheme;
  language?: string;
  code: string;
}

export interface ShikiRenderData {
  html: string | null;
  preProps: HTMLAttributes<HTMLPreElement>;
  codeProps: HTMLAttributes<HTMLElement>;
}
