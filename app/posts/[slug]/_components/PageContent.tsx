'use client';

import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import type { FC, ReactNode } from 'react';

import { useHeaderAtom } from '@/hooks/useHeaderAtom';
import { Pager } from './Pager';

type ContentProps = {
  frontmatter: Frontmatter & {
    prev?: Frontmatter;
    next?: Frontmatter;
  };
  content: ReactNode;
};

export const PageContent: FC<ContentProps> = ({ frontmatter, content }) => {
  const { setHeaderAtom } = useHeaderAtom();
  const pageTitleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    setHeaderAtom({
      pageTitle: frontmatter.title,
      pageTitleElement: pageTitleRef.current
    });

    return () => {
      setHeaderAtom({
        pageTitle: '',
        pageTitleElement: null
      });
    };
  }, [frontmatter.title, setHeaderAtom]);

  return (
    <div className="font-mono">
      <h1
        ref={pageTitleRef}
        data-title="page-title"
        className=" my-3 w-[32rem] animate-slide-enter-in text-2xl font-bold"
      >
        {frontmatter.title}
      </h1>
      <p className="flex animate-slide-enter-in flex-row gap-2 text-[#555]">
        <span>{dayjs(frontmatter.date).format('MMM DD, YYYY')}</span>
        <span className="flex flex-row items-center">
          · {frontmatter.readingTime}
        </span>
      </p>
      <motion.article
        initial={{ opacity: 0, marginTop: 50 }}
        animate={{ opacity: 1, marginTop: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="prose dark:prose-invert"
      >
        {content}
      </motion.article>
      <Pager
        prev={frontmatter.prev}
        next={frontmatter.next}
      />
    </div>
  );
};
