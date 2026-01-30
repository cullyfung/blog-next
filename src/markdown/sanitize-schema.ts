import deepmerge from 'deepmerge';
import { defaultSchema } from 'rehype-sanitize';

const scheme = deepmerge(defaultSchema, {
  tagNames: [
    'video',
    'iframe',
    'style',
    'youtube',
    'toc',
    'anchor',
    'mention',
    'audio',
    'source',
    'mermaid',
    'aside',
    'rss',
    'linkcard',
    'darktoggle',
    'linkpreview',
    'peekaboolink',
    'merimad',
    ...['svg', 'path', 'circle'],
    // Custom code block elements
    'codeblock', // For single code blocks
    'codegroup', // For :::code-group directive
  ],
  // ancestors: {
  //   linkcard: ['root', 'section', 'div', 'article', 'blockquote'], // 允许出现在这些父级下
  //   darktoggle: ['root', 'section', 'div', 'article', 'blockquote']
  // },
  attributes: {
    '*': ['className', 'style'],
    video: ['src', 'controls', 'loop', 'muted', 'autoPlay', 'playsInline'],
    audio: [
      'src',
      'controls',
      'loop',
      'muted',
      'autoPlay',
      'name',
      'artist',
      'cover',
      'lrc',
    ],
    source: ['src', 'type'],
    iframe: ['src', 'allowFullScreen', 'frameborder', 'allow'],
    svg: [
      'xmlns',
      'width',
      'height',
      'viewBox',
      'fill',
      'stroke',
      'strokeLineCap',
      'strokeLineJoin',
      'strokeWidth',
    ],
    path: ['d', 'fill'],
    circle: ['cx', 'cy', 'r', 'fill'],
    rss: ['src', 'limit'],
    linkcard: ['title', 'href', 'image', 'description'],
    darktoggle: [],
    linkpreview: ['url'],
    peekaboolink: ['href'],
    mermaid: ['className', 'style'],
    div: [
      'className',
      'data-labels',
      'data-code',
      'data-language',
      'data-label',
      'dataLabels',
      'dataCode',
      'dataLanguage',
      'dataLabel',
    ],
    codeblock: [
      'code', // Code content
      'language', // Language
    ],
    codegroup: [
      'data-code-blocks', // For :::code-group directive
      'dataCodeBlocks', // camelCase version
    ],
  },
  protocols: {
    href: ['magnet', 'ed2k'],
  },
});

export default scheme;
