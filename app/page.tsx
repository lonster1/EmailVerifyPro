import Image from 'next/image';
import Link from 'next/link';
import { DollarSign, CheckCircle2, Zap, Code2, Plug, Shield, Upload, Search, Download, ArrowRight } from 'lucide-react';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { ProcessStep } from '@/components/landing/ProcessStep';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section - Dark Navy with Split Layout */}
      <section className="section-dark py-24 lg:py-32">
        <div className="container max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-white">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                Professional Email Verification at 70% Lower Cost
              </h1>
              <p className="text-xl lg:text-2xl mb-4 opacity-90">
                Never-expiring credits. 99% accuracy. Built for agencies and developers.
              </p>
              <p className="text-lg mb-8 opacity-80">
                Protect your sender reputation without breaking the bank.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Start Free - 100 Credits
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/pricing">
                    View Pricing <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Dashboard Image */}
            <div className="relative">
              <Image
                src="/images/hero-dashboard.png"
                alt="EmailVerify Pro dashboard showing email verification results"
                width={600}
                height={450}
                className="rounded-lg shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section - White */}
      <section className="section-light py-24">
        <div className="container max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to Maintain Clean Email Lists
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional-grade email verification with enterprise features at startup-friendly prices
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={DollarSign}
              title="Never-Expiring Credits"
              description="Buy once, use forever. No monthly resets, no wasted credits. Perfect for agencies with unpredictable email volumes."
              stats={[
                "$15 for 10,000 credits",
                "$0.0015 per verification",
                "70% cheaper than competitors"
              ]}
            />

            <FeatureCard
              icon={CheckCircle2}
              title="99% Verification Accuracy"
              description="Professional-grade verification powered by advanced SMTP validation, disposable email detection, and spam trap identification."
              stats={[
                "Syntax & domain validation",
                "Real-time SMTP checks",
                "<2% bounce rate guarantee"
              ]}
            />

            <FeatureCard
              icon={Zap}
              title="Lightning-Fast API"
              description="Real-time verification in 0.5 seconds. Bulk processing at 3,000+ emails per minute. Your campaigns don't wait."
              stats={[
                "<300ms API response (p95)",
                "3,000+ emails/minute bulk",
                "Zero downtime deployments"
              ]}
            />

            <FeatureCard
              icon={Code2}
              title="Built for Developers"
              description="Clean REST API with excellent documentation. Interactive code examples in 5+ languages. Webhook support for async operations."
              stats={[
                "Interactive API docs (Swagger)",
                "Code examples: cURL, Python, Node.js",
                "Webhook support"
              ]}
            />

            <FeatureCard
              icon={Plug}
              title="Seamless Automation"
              description="Native integrations with n8n, Zapier, and Make.com. Connect email verification to your existing workflows without writing code."
              stats={[
                "n8n community node",
                "Zapier app",
                "Make.com module"
              ]}
            />

            <FeatureCard
              icon={Shield}
              title="Your Data, Protected"
              description="Military-grade encryption, automatic 30-day data deletion, and full GDPR compliance. Your email lists are safe with us."
              stats={[
                "TLS 1.3 & AES-256 encryption",
                "30-day auto data purging",
                "GDPR & CCPA compliant"
              ]}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section - Dark Navy */}
      <section className="section-dark py-24">
        <div className="container max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Verify Emails in 3 Simple Steps
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              From upload to download in minutes. No technical knowledge required.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 max-w-5xl mx-auto">
            <ProcessStep
              number="01"
              icon={Upload}
              title="Upload Your List"
              description="Drag and drop your CSV file or paste emails directly. Or integrate via our API for real-time verification."
            />

            <ProcessStep
              number="02"
              icon={Search}
              title="We Verify Every Email"
              description="Our system checks syntax, domain validity, and performs real-time SMTP verification in seconds."
            />

            <ProcessStep
              number="03"
              icon={Download}
              title="Download Clean Results"
              description="Get your verified list with detailed results for each email. Export as CSV or access via API."
              showArrow={false}
            />
          </div>
        </div>
      </section>

      {/* Stats Section - White (Existing) */}
      <section className="section-light py-16">
        <div className="container max-w-5xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <h3 className="text-4xl font-bold text-primary mb-2">99%</h3>
              <p className="text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-4xl font-bold text-primary mb-2">Never Expire</h3>
              <p className="text-muted-foreground">Lifetime Credits</p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-4xl font-bold text-primary mb-2">&lt;300ms</h3>
              <p className="text-muted-foreground">API Response</p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-4xl font-bold text-primary mb-2">Real-time</h3>
              <p className="text-muted-foreground">Verification</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
