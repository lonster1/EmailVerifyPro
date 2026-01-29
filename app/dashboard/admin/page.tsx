'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [prismaStudioStatus, setPrismaStudioStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Check Prisma Studio availability
  useEffect(() => {
    const checkPrismaStudio = async () => {
      try {
        const response = await fetch('http://localhost:5557', {
          method: 'GET',
          mode: 'no-cors' // Avoid CORS issues
        });
        setPrismaStudioStatus('online');
      } catch {
        setPrismaStudioStatus('offline');
      }
    };

    checkPrismaStudio();
    const interval = setInterval(checkPrismaStudio, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return null; // Will redirect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, credits, and system configuration
        </p>
      </div>

      {/* Prisma Studio Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Prisma Studio</h2>
            <p className="text-sm text-muted-foreground">
              Direct database access for managing users, credits, and all data
            </p>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-2 w-2 rounded-full ${
                prismaStudioStatus === 'online' ? 'bg-green-500' :
                prismaStudioStatus === 'offline' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`} />
              <span className="text-sm">
                {prismaStudioStatus === 'checking' && 'Checking status...'}
                {prismaStudioStatus === 'online' && 'Prisma Studio is running'}
                {prismaStudioStatus === 'offline' && 'Prisma Studio is offline'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-x-2">
            {prismaStudioStatus === 'online' ? (
              <a
                href="http://localhost:5557"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  Open Prisma Studio
                </Button>
              </a>
            ) : (
              <Button disabled variant="outline">
                Not Available
              </Button>
            )}
          </div>
        </div>

        {/* Instructions for offline state */}
        {prismaStudioStatus === 'offline' && (
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Prisma Studio is not running.</strong>
              <br />
              To start it, run this command in your project directory:
              <pre className="mt-2 p-2 bg-muted rounded text-sm">
                npx prisma studio
              </pre>
              It will start on <code>http://localhost:5557</code>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Features Available in Prisma Studio */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">What You Can Do in Prisma Studio</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>View and edit all user accounts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Manage credit balances (increase, decrease, set to unlimited)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Change user roles (USER ↔ ADMIN)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>View verification history and transaction logs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Delete or modify any database records</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Run raw SQL queries for advanced operations</span>
          </li>
        </ul>
      </Card>

      {/* Security Warning */}
      <Alert variant="destructive">
        <AlertDescription>
          <strong>Security Warning:</strong> Prisma Studio provides full database access.
          Only use this tool when necessary and ensure you understand the impact of any changes.
          Always backup data before making bulk modifications.
        </AlertDescription>
      </Alert>

      {/* Future Features Placeholder */}
      <Card className="p-6 border-dashed">
        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          Custom admin dashboard with user management UI, credit adjustment forms,
          and analytics will be added in future updates.
        </p>
      </Card>
    </div>
  );
}
