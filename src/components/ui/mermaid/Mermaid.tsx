'use client';

import type { Element } from 'hast';
import { toText } from 'hast-util-to-text';
import { nanoid } from 'nanoid';
import { memo, useEffect, useState } from 'react';

import { AdvancedImage } from '@/components/ui/advanced-image';
import { useIsDark } from '@/hooks/use-dark-mode';

export const Mermaid = memo((props: { children: string; node: Element }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [svg, setSvg] = useState('');
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  const text = toText(props.node, {
    whitespace: 'pre',
  });

  const isDark = useIsDark();

  useEffect(() => {
    if (text) {
      setError('');
      setLoading(true);

      import('mermaid').then(async (mo) => {
        const mermaid = mo.default;

        // 重新初始化 Mermaid 以应用新主题
        mermaid.initialize({
          theme: isDark ? 'dark' : 'default',
          startOnLoad: false,
        });

        const id = nanoid();
        let result;
        try {
          result = await mermaid.render(`mermaid-${id}`, text);
        } catch (error) {
          document.getElementById(`dmermaid-${id}`)?.remove();
          if (error instanceof Error) {
            setError(error.message);
          }
          setSvg('');
          setWidth(undefined);
          setHeight(undefined);
        }

        if (result) {
          setSvg(result.svg);

          const match = result.svg.match(/viewBox="[^"]*\s([\d.]+)\s([\d.]+)"/);
          if (match?.[1] && match?.[2]) {
            setWidth(Number.parseInt(match?.[1], 10));
            setHeight(Number.parseInt(match?.[2], 10));
          }
          setError('');
        }
        setLoading(false);
      });
    }
  }, [text, isDark]);

  return loading ? (
    <div className="flex min-h-[50px] items-center justify-center rounded-lg bg-[#ECECFD] text-sm dark:bg-[#1F2020]">
      Mermaid Loading...
    </div>
  ) : svg ? (
    <div>
      <AdvancedImage
        alt="mermaid"
        src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`}
        width={width}
        height={height}
      />
    </div>
  ) : (
    <div className="flex min-h-[50px] items-center justify-center rounded-lg bg-red-100 text-sm">
      {error || 'Error'}
    </div>
  );
});
