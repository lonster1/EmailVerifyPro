'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Determine credit balance color
  const getCreditColor = (balance: number) => {
    if (balance > 1000) return 'text-score-high';
    if (balance > 100) return 'text-score-medium';
    return 'text-score-low';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[hsl(var(--section-dark))] text-white">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">EmailVerify Pro</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/billing"
                className="text-sm font-medium text-white/70 transition-colors hover:text-primary"
              >
                Billing
              </Link>

              {/* ADMIN-ONLY Navigation */}
              {user?.role === 'ADMIN' && (
                <Link
                  href="/dashboard/admin"
                  className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
                >
                  Admin Tools
                </Link>
              )}
            </nav>
          </div>

          {/* Credits & User Menu */}
          <div className="flex items-center gap-4">
            {/* Credit Balance */}
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-white/20 px-4 py-2">
              <span className="text-sm text-white/70">Credits:</span>
              <span className={`text-sm font-bold ${user.hasUnlimitedCredits ? 'text-primary' : getCreditColor(user.creditsBalance)}`}>
                {user.hasUnlimitedCredits ? '∞ Unlimited' : user.creditsBalance.toLocaleString()}
              </span>
              {!user.hasUnlimitedCredits && (
                <Link href="/dashboard/billing">
                  <Button variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90">
                    Buy More
                  </Button>
                </Link>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-white/70">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-white/10 hover:text-white">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 EmailVerify Pro. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-primary">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
