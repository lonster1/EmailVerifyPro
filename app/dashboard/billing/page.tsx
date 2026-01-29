'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

const creditPackages = [
  { credits: 10000, price: 15, label: '10K' },
  { credits: 25000, price: 30, label: '25K', badge: 'Best Value' },
  { credits: 50000, price: 55, label: '50K', badge: 'Popular' },
  { credits: 100000, price: 100, label: '100K' },
  { credits: 500000, price: 400, label: '500K' },
];

export default function BillingPage() {
  const { user, token, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/credits/transactions?limit=20', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handlePurchase = async (packageType: string) => {
    if (!token) return;

    setPurchasingPackage(packageType);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageType }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        alert(`Failed to create checkout session: ${error.error}`);
        setPurchasingPackage(null);
      }
    } catch (error) {
      console.error('Failed to initiate purchase:', error);
      alert('An error occurred. Please try again.');
      setPurchasingPackage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Credits</h1>
        <p className="text-muted-foreground mt-2">
          Manage your credits and view transaction history
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Payment successful! Your credits have been added to your account.
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <XCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Payment was canceled. No charges were made.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Your available email verification credits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            {user?.hasUnlimitedCredits ? (
              <>
                <span className="text-4xl font-bold">∞</span>
                <span className="text-lg text-muted-foreground">Unlimited Credits</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold">{user?.creditsBalance.toLocaleString()}</span>
                <span className="text-lg text-muted-foreground">credits</span>
              </>
            )}
          </div>
          {!user?.hasUnlimitedCredits && (
            <p className="text-sm text-muted-foreground mt-2">
              Credits never expire and can be used anytime
            </p>
          )}
        </CardContent>
      </Card>

      {/* Purchase Credits */}
      {!user?.hasUnlimitedCredits && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Credits</CardTitle>
            <CardDescription>
              Select a package to add credits to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creditPackages.map((pkg) => {
                const costPerEmail = (pkg.price / pkg.credits).toFixed(4);
                const isPurchasing = purchasingPackage === pkg.label;

                return (
                  <Card key={pkg.label} className="relative">
                    {pkg.badge && (
                      <div className="absolute -top-2 right-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        {pkg.badge}
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-2xl">${pkg.price}</CardTitle>
                      <CardDescription>
                        {pkg.credits.toLocaleString()} credits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        ${costPerEmail} per email
                      </p>
                      <Button
                        className="w-full gap-2"
                        onClick={() => handlePurchase(pkg.label)}
                        disabled={!!purchasingPackage}
                      >
                        {isPurchasing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Need more than 500K credits?{' '}
                <Link href="/support" className="text-primary hover:underline inline-flex items-center gap-1">
                  Contact us
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
                {' '}for custom pricing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent credit transactions (last 20)</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Type</th>
                    <th className="text-left py-3 px-2 font-medium">Description</th>
                    <th className="text-right py-3 px-2 font-medium">Amount</th>
                    <th className="text-right py-3 px-2 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b last:border-0">
                      <td className="py-3 px-2 text-sm">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            transaction.type === 'PURCHASE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                              : transaction.type === 'USAGE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {transaction.description}
                      </td>
                      <td
                        className={`py-3 px-2 text-sm text-right font-medium ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-sm text-right">
                        {transaction.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
