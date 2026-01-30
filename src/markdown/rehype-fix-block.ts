import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const BLOCK_TAGS = ['linkcard', 'darktoggle', 'linkpreview', 'peekaboolink'];

export const rehypeFixBlock: Plugin<Array<void>, Root> = () => (tree: Root) => {
  visit(tree, 'element', (node, _i, parent) => {
    if (
      BLOCK_TAGS.includes(node.tagName) &&
      parent &&
      parent.type === 'element' &&
      parent.tagName === 'p'
    ) {
      // 把 <p><linkcard /></p> 变成 <div class="block-tag"><linkcard /></div> 防止水合错误
      parent.tagName = 'div';
      parent.properties = {
        // 在tailwincss 配置了 block-tag 类
        className: 'block-tag',
      };
    }
  });
};
