'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { ArrowRight } from 'lucide-react';

const pricingTiers = [
  {
    credits: 10000,
    price: 15,
    badge: undefined,
  },
  {
    credits: 25000,
    price: 30,
    badge: 'Best Value',
    isPopular: true,
  },
  {
    credits: 50000,
    price: 55,
    badge: 'Popular',
    isPopular: false,
  },
  {
    credits: 100000,
    price: 100,
    badge: undefined,
  },
  {
    credits: 500000,
    price: 400,
    badge: undefined,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground">
              No hidden fees. No expiring credits. Pay only for what you use.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto">
            {pricingTiers.map((tier) => (
              <PricingCard
                key={tier.credits}
                credits={tier.credits}
                price={tier.price}
                badge={tier.badge}
                isPopular={tier.isPopular}
                onSelect={() => {
                  window.location.href = '/register';
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              What's Included in Every Plan
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Never-Expiring Credits</h3>
                    <p className="text-sm text-muted-foreground">
                      Your credits never expire. Use them whenever you need, no time pressure.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Full API Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete programmatic access to verify emails via our RESTful API.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Bulk Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload CSV files and verify thousands of emails in minutes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Free Unknown Results</h3>
                    <p className="text-sm text-muted-foreground">
                      Unknown verification results don't consume any credits.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Duplicate Detection</h3>
                    <p className="text-sm text-muted-foreground">
                      Only pay once for duplicate emails in the same batch.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h3 className="font-semibold mb-1">Email Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Get help when you need it from our support team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <PricingFAQ />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start with 100 Free Credits
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Test our service risk-free. No credit card required.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
