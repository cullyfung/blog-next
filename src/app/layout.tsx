import type { Metadata } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { Main } from '@/components/site';

import { Backtop } from '@/components/ui/backtop';
import { APP_DESCRIPTION, APP_NAME, OUR_DOMAIN } from '@/constants';
import { snProFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/providers';
import '@/styles/main.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: [
    {
      url: '/avatar.png',
      type: 'image/png',
    },
  ],
  alternates: {
    types: {
      'application/rss+xml': `${OUR_DOMAIN || 'https://localhost:2323'}/api/feed`,
    },
  },
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(snProFont.variable)}>
        <NextTopLoader color="var(--color-primary)" showSpinner={false} />
        <AppProviders>
          <Main>
            {children}
            {modal}
          </Main>
          <Backtop />
        </AppProviders>
      </body>
    </html>
  );
}
