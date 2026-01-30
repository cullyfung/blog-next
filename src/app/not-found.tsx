'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LinearBorderContainer } from '@/components/ui/container';

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="bg-background text-text relative flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <LinearBorderContainer>
          <div className="relative w-full max-w-[640px] overflow-hidden border border-white/5">
            {/* Glassmorphic background effects */}
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="from-accent/20 absolute -inset-32 bg-linear-to-br via-transparent to-transparent blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
            </div>

            <div className="relative p-10 sm:p-12">
              <div>
                <p className="text-text-tertiary mb-3 text-xs font-semibold tracking-[0.55em] uppercase">
                  404
                </p>
                <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Page Not Found
                </h1>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">
                  The page you're looking for doesn't exist. It may have been
                  moved or deleted. Please check the URL or return to the home
                  page to continue exploring.
                </p>

                <div className="bg-material-medium/40 border-fill-tertiary mb-6 rounded-2xl border px-5 py-4 text-sm">
                  <p className="text-text-secondary">
                    Current path:{' '}
                    <span className="text-text font-medium">{pathname}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="primary"
                    className="glassmorphic-btn flex-1"
                    onClick={() => router.push('/')}
                  >
                    Back to Home
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => router.back()}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </LinearBorderContainer>
      </div>
    </div>
  );
}
