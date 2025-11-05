import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'RSS Feed Generator',
  description: 'Visual builder for self-hosted RSS, Atom, and JSON feeds.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background text-foreground antialiased')}>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
