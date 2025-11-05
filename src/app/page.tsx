import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4 py-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <span className="inline-flex items-center rounded-full border border-primary/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          <Zap className="mr-1 h-3 w-3" /> Visual RSS Builder
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Build feeds from any website with point-and-click precision
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Paste a URL, highlight the elements that matter, and publish RSS, Atom, or JSON feeds that stay fresh automatically. Everything runs on your infrastructure.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Go to dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/auth/sign-in" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Sign in to manage feeds
          </Link>
        </div>
      </div>
    </div>
  );
}
