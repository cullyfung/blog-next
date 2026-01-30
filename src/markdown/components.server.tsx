import { CodeBlock } from '@/components/ui/code-block/CodeBlock';
import { CodeGroupServer } from '@/components/ui/code-block/CodeGroupServer';
import type { CodeTheme } from '@/lib/shiki/types';
import {
  createMdxComponentsBase,
  createMdxComponentsCache,
} from './components-base';

const getMdxComponentsServer = createMdxComponentsCache((codeTheme) =>
  createMdxComponentsBase({
    codeTheme,
    CodeBlockComponent: CodeBlock,
    CodeGroupComponent: CodeGroupServer,
  }),
);

export const mdxComponentsServer = getMdxComponentsServer();

export function createMdxComponentsServer({
  codeTheme,
}: {
  codeTheme?: CodeTheme;
} = {}) {
  return getMdxComponentsServer(codeTheme);
}
