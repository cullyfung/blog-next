import { CodeBlockClient } from '@/components/ui/code-block/CodeBlockClient';
import { CodeGroup } from '@/components/ui/code-block/CodeGroup';
import type { CodeTheme } from '@/lib/shiki/types';
import {
  createMdxComponentsBase,
  createMdxComponentsCache,
} from './components-base';

const getMdxComponents = createMdxComponentsCache((codeTheme) =>
  createMdxComponentsBase({
    codeTheme,
    CodeBlockComponent: CodeBlockClient,
    CodeGroupComponent: CodeGroup,
  }),
);

export const mdxComponents = getMdxComponents();

export function createMdxComponents({
  codeTheme,
}: {
  codeTheme?: CodeTheme;
} = {}) {
  return getMdxComponents(codeTheme);
}
