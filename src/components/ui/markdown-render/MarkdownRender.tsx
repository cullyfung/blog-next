import type { ExtraProps } from 'hast-util-to-jsx-runtime';

export function createMarkdownHeaderComponent(tag: string) {
  const MarkdownHeader: React.FC<
    React.ClassAttributes<HTMLHeadingElement> &
      React.HTMLAttributes<HTMLHeadingElement> &
      ExtraProps
  > = ({ children, ...rest }) => {
    const Tag = tag as any;

    return (
      <Tag {...rest} className="flex items-center">
        {children}
        <a
          className="anchor flex items-center"
          tabIndex={-1}
          href={rest.id ? `#${rest.id}` : undefined}
        >
          <i className="i-mingcute-hashtag-fill icon-hashtag text-accent" />
        </a>
      </Tag>
    );
  };

  return MarkdownHeader;
}
