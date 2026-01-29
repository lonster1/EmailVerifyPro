\# Quick Start Guide for Claude Code  
\#\# EmailVerify Pro \- MVP Development (Phase 1\)

\*\*Target\*\*: Build functional MVP in 4 weeks    
\*\*Goal\*\*: 20 beta users, 100K verifications, $1K revenue

\---

\#\# Overview

This guide tells Claude Code exactly what to build in Phase 1 (Weeks 1-4) to create a functional MVP. Follow this sequentially—each section builds on the previous one.

\---

\#\# Week 1: Foundation & Authentication

\#\#\# Project Setup

\*\*1. Initialize Next.js Project\*\*  
\`\`\`bash  
npx create-next-app@latest email-verify-pro \--typescript \--tailwind \--app \--eslint  
cd email-verify-pro  
\`\`\`

\*\*Configuration:\*\*  
\- TypeScript: Yes  
\- Tailwind CSS: Yes  
\- App Router: Yes  
\- ESLint: Yes  
\- src/ directory: Yes (optional, recommended)

\*\*2. Install Core Dependencies\*\*  
\`\`\`bash  
npm install @prisma/client prisma  
npm install bcrypt jsonwebtoken  
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu  
npm install class-variance-authority clsx tailwind-merge  
npm install react-hook-form zod @hookform/resolvers  
npm install axios  
npm install @stripe/stripe-js stripe  
npm install \-D @types/bcrypt @types/jsonwebtoken  
\`\`\`

\*\*3. Environment Variables Setup\*\*

Create \`.env.local\`:  
\`\`\`env  
\# Database  
DATABASE\_URL="postgresql://user:password@localhost:5432/emailverify"

\# Auth  
JWT\_SECRET="your-super-secret-jwt-key-change-in-production"  
JWT\_EXPIRES\_IN="7d"

\# Reoon API  
REOON\_API\_KEY="your-reoon-api-key"  
REOON\_API\_URL="https://api.reoon.com/v1"

\# Stripe  
NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY="pk\_test\_..."  
STRIPE\_SECRET\_KEY="sk\_test\_..."  
STRIPE\_WEBHOOK\_SECRET="whsec\_..."

\# App  
NEXT\_PUBLIC\_APP\_URL="http://localhost:3000"  
\`\`\`

\*\*4. Database Setup (Prisma)\*\*

Initialize Prisma:  
\`\`\`bash  
npx prisma init  
\`\`\`

Create \`prisma/schema.prisma\`:  
\`\`\`prisma  
generator client {  
  provider \= "prisma-client-js"  
}

datasource db {  
  provider \= "postgresql"  
  url      \= env("DATABASE\_URL")  
}

model User {  
  id              String   @id @default(uuid())  
  email           String   @unique  
  passwordHash    String  
  role            Role     @default(USER)  
  creditsBalance  Int      @default(100)  
  isVerified      Boolean  @default(false)  
  createdAt       DateTime @default(now())  
  updatedAt       DateTime @updatedAt  
  lastLoginAt     DateTime?

  verifications   Verification\[\]  
  transactions    CreditTransaction\[\]  
  apiKeys         ApiKey\[\]

  @@map("users")  
}

enum Role {  
  USER  
  ADMIN  
}

model Verification {  
  id                    String   @id @default(uuid())  
  userId                String  
  type                  VerificationType  
  filename              String?  
  totalCount            Int  
  validCount            Int      @default(0)  
  invalidCount          Int      @default(0)  
  riskyCount            Int      @default(0)  
  unknownCount          Int      @default(0)  
  catchallCount         Int      @default(0)  
  creditsConsumed       Int  
  status                VerificationStatus  
  resultsUrl            String?  
  errorMessage          String?  
  processingTimeSeconds Float?  
  createdAt             DateTime @default(now())  
  completedAt           DateTime?  
  expiresAt             DateTime?

  user                  User     @relation(fields: \[userId\], references: \[id\])

  @@map("verifications")  
}

enum VerificationType {  
  SINGLE  
  BATCH  
  BULK  
}

enum VerificationStatus {  
  PENDING  
  PROCESSING  
  COMPLETED  
  FAILED  
}

model CreditTransaction {  
  id              String   @id @default(uuid())  
  userId          String  
  amount          Int  
  type            TransactionType  
  balanceAfter    Int  
  verificationId  String?  
  stripePaymentId String?  
  description     String?  
  createdAt       DateTime @default(now())

  user            User     @relation(fields: \[userId\], references: \[id\])

  @@map("credit\_transactions")  
}

enum TransactionType {  
  PURCHASE  
  USAGE  
  REFUND  
  ADMIN\_ADJUSTMENT  
}

model ApiKey {  
  id          String    @id @default(uuid())  
  userId      String  
  name        String  
  keyHash     String  
  keyPrefix   String  
  lastUsedAt  DateTime?  
  createdAt   DateTime  @default(now())  
  revokedAt   DateTime?

  user        User      @relation(fields: \[userId\], references: \[id\])

  @@map("api\_keys")  
}  
\`\`\`

Run migrations:  
\`\`\`bash  
npx prisma migrate dev \--name init  
npx prisma generate  
\`\`\`

\---

\#\#\# Authentication System

\*\*1. Create Auth Utilities\*\*

\`lib/auth.ts\`:  
\`\`\`typescript  
import bcrypt from 'bcrypt';  
import jwt from 'jsonwebtoken';  
import { User } from '@prisma/client';

const JWT\_SECRET \= process.env.JWT\_SECRET\!;  
const JWT\_EXPIRES\_IN \= process.env.JWT\_EXPIRES\_IN || '7d';

export async function hashPassword(password: string): Promise\<string\> {  
  return bcrypt.hash(password, 10);  
}

export async function comparePassword(password: string, hash: string): Promise\<boolean\> {  
  return bcrypt.compare(password, hash);  
}

export function generateToken(user: Pick\<User, 'id' | 'email' | 'role'\>): string {  
  return jwt.sign(  
    { userId: user.id, email: user.email, role: user.role },  
    JWT\_SECRET,  
    { expiresIn: JWT\_EXPIRES\_IN }  
  );  
}

export function verifyToken(token: string): { userId: string; email: string; role: string } | null {  
  try {  
    return jwt.verify(token, JWT\_SECRET) as any;  
  } catch (error) {  
    return null;  
  }  
}  
\`\`\`

\*\*2. Create API Routes\*\*

\`app/api/auth/register/route.ts\`:  
\`\`\`typescript  
import { NextResponse } from 'next/server';  
import { PrismaClient } from '@prisma/client';  
import { hashPassword, generateToken } from '@/lib/auth';  
import { z } from 'zod';

const prisma \= new PrismaClient();

const registerSchema \= z.object({  
  email: z.string().email(),  
  password: z.string().min(8),  
});

export async function POST(request: Request) {  
  try {  
    const body \= await request.json();  
    const { email, password } \= registerSchema.parse(body);

    // Check if user exists  
    const existing \= await prisma.user.findUnique({ where: { email } });  
    if (existing) {  
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });  
    }

    // Create user  
    const passwordHash \= await hashPassword(password);  
    const user \= await prisma.user.create({  
      data: {  
        email,  
        passwordHash,  
        creditsBalance: 100, // Free credits  
        isVerified: true, // Skip email verification for MVP  
      },  
    });

    // Generate token  
    const token \= generateToken(user);

    return NextResponse.json({  
      user: { id: user.id, email: user.email, credits: user.creditsBalance },  
      token,  
    });  
  } catch (error) {  
    console.error('Registration error:', error);  
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });  
  }  
}  
\`\`\`

\`app/api/auth/login/route.ts\`:  
\`\`\`typescript  
import { NextResponse } from 'next/server';  
import { PrismaClient } from '@prisma/client';  
import { comparePassword, generateToken } from '@/lib/auth';  
import { z } from 'zod';

const prisma \= new PrismaClient();

const loginSchema \= z.object({  
  email: z.string().email(),  
  password: z.string(),  
});

export async function POST(request: Request) {  
  try {  
    const body \= await request.json();  
    const { email, password } \= loginSchema.parse(body);

    // Find user  
    const user \= await prisma.user.findUnique({ where: { email } });  
    if (\!user) {  
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });  
    }

    // Verify password  
    const valid \= await comparePassword(password, user.passwordHash);  
    if (\!valid) {  
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });  
    }

    // Update last login  
    await prisma.user.update({  
      where: { id: user.id },  
      data: { lastLoginAt: new Date() },  
    });

    // Generate token  
    const token \= generateToken(user);

    return NextResponse.json({  
      user: { id: user.id, email: user.email, credits: user.creditsBalance },  
      token,  
    });  
  } catch (error) {  
    console.error('Login error:', error);  
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });  
  }  
}  
\`\`\`

\*\*3. Create Auth Pages\*\*

\`app/(auth)/login/page.tsx\`:  
\`\`\`typescript  
'use client';

import { useState } from 'react';  
import { useRouter } from 'next/navigation';  
import Link from 'next/link';

export default function LoginPage() {  
  const router \= useRouter();  
  const \[email, setEmail\] \= useState('');  
  const \[password, setPassword\] \= useState('');  
  const \[error, setError\] \= useState('');  
  const \[loading, setLoading\] \= useState(false);

  const handleSubmit \= async (e: React.FormEvent) \=\> {  
    e.preventDefault();  
    setError('');  
    setLoading(true);

    try {  
      const res \= await fetch('/api/auth/login', {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({ email, password }),  
      });

      const data \= await res.json();

      if (\!res.ok) {  
        setError(data.error || 'Login failed');  
        setLoading(false);  
        return;  
      }

      // Save token  
      localStorage.setItem('token', data.token);  
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard  
      router.push('/dashboard');  
    } catch (err) {  
      setError('An error occurred');  
      setLoading(false);  
    }  
  };

  return (  
    \<div className="min-h-screen flex items-center justify-center bg-gray-50"\>  
      \<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow"\>  
        \<div\>  
          \<h2 className="text-3xl font-bold text-center"\>Sign in to EmailVerify Pro\</h2\>  
        \</div\>  
        \<form className="mt-8 space-y-6" onSubmit={handleSubmit}\>  
          {error && (  
            \<div className="bg-red-50 text-red-600 p-3 rounded"\>{error}\</div\>  
          )}  
          \<div\>  
            \<label htmlFor="email" className="block text-sm font-medium text-gray-700"\>  
              Email address  
            \</label\>  
            \<input  
              id="email"  
              name="email"  
              type="email"  
              required  
              value={email}  
              onChange={(e) \=\> setEmail(e.target.value)}  
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"  
            /\>  
          \</div\>  
          \<div\>  
            \<label htmlFor="password" className="block text-sm font-medium text-gray-700"\>  
              Password  
            \</label\>  
            \<input  
              id="password"  
              name="password"  
              type="password"  
              required  
              value={password}  
              onChange={(e) \=\> setPassword(e.target.value)}  
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"  
            /\>  
          \</div\>  
          \<button  
            type="submit"  
            disabled={loading}  
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"  
          \>  
            {loading ? 'Signing in...' : 'Sign in'}  
          \</button\>  
          \<p className="text-center text-sm text-gray-600"\>  
            Don't have an account?{' '}  
            \<Link href="/register" className="text-blue-600 hover:text-blue-500"\>  
              Sign up  
            \</Link\>  
          \</p\>  
        \</form\>  
      \</div\>  
    \</div\>  
  );  
}  
\`\`\`

Similar structure for \`app/(auth)/register/page.tsx\`.

\---

\#\# Week 2: Core Verification Engine

\#\#\# Reoon API Integration

\*\*1. Create Reoon Client\*\*

\`lib/reoon.ts\`:  
\`\`\`typescript  
import axios from 'axios';

const REOON\_API\_KEY \= process.env.REOON\_API\_KEY\!;  
const REOON\_API\_URL \= process.env.REOON\_API\_URL || 'https://app.reoon.com/api/v1';

interface ReoonVerifyResponse {  
  status: 'valid' | 'invalid' | 'risky' | 'unknown' | 'catch\_all';  
  email: string;  
  score: number;  
  details: {  
    syntax: boolean;  
    domain: boolean;  
    mx: boolean;  
    smtp: boolean;  
    disposable: boolean;  
    role: boolean;  
  };  
}

export async function verifySingleEmail(email: string): Promise\<ReoonVerifyResponse\> {  
  try {  
    const response \= await axios.post(  
      \`${REOON\_API\_URL}/verify\`,  
      { email },  
      {  
        headers: {  
          'Authorization': \`Bearer ${REOON\_API\_KEY}\`,  
          'Content-Type': 'application/json',  
        },  
      }  
    );

    return response.data;  
  } catch (error) {  
    console.error('Reoon API error:', error);  
    throw new Error('Verification failed');  
  }  
}

export async function verifyBulkEmails(emails: string\[\]): Promise\<ReoonVerifyResponse\[\]\> {  
  // Implementation for bulk verification  
  // May need to batch requests or use Reoon's bulk endpoint if available  
  const results \= await Promise.all(emails.map(email \=\> verifySingleEmail(email)));  
  return results;  
}  
\`\`\`

\*\*2. Create Verification API Route\*\*

\`app/api/verify/single/route.ts\`:  
\`\`\`typescript  
import { NextResponse } from 'next/server';  
import { PrismaClient } from '@prisma/client';  
import { verifyToken } from '@/lib/auth';  
import { verifySingleEmail } from '@/lib/reoon';  
import { z } from 'zod';

const prisma \= new PrismaClient();

const verifySchema \= z.object({  
  email: z.string().email(),  
});

export async function POST(request: Request) {  
  try {  
    // Auth check  
    const token \= request.headers.get('authorization')?.replace('Bearer ', '');  
    if (\!token) {  
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });  
    }

    const payload \= verifyToken(token);  
    if (\!payload) {  
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });  
    }

    // Get user  
    const user \= await prisma.user.findUnique({ where: { id: payload.userId } });  
    if (\!user) {  
      return NextResponse.json({ error: 'User not found' }, { status: 404 });  
    }

    // Check credits  
    if (user.creditsBalance \< 1\) {  
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });  
    }

    // Parse request  
    const body \= await request.json();  
    const { email } \= verifySchema.parse(body);

    // Verify email with Reoon  
    const startTime \= Date.now();  
    const result \= await verifySingleEmail(email);  
    const processingTime \= (Date.now() \- startTime) / 1000;

    // Determine credit consumption (0 for unknown, 1 otherwise)  
    const creditsConsumed \= result.status \=== 'unknown' ? 0 : 1;

    // Save verification  
    const verification \= await prisma.verification.create({  
      data: {  
        userId: user.id,  
        type: 'SINGLE',  
        totalCount: 1,  
        validCount: result.status \=== 'valid' ? 1 : 0,  
        invalidCount: result.status \=== 'invalid' ? 1 : 0,  
        riskyCount: result.status \=== 'risky' ? 1 : 0,  
        unknownCount: result.status \=== 'unknown' ? 1 : 0,  
        catchallCount: result.status \=== 'catch\_all' ? 1 : 0,  
        creditsConsumed,  
        status: 'COMPLETED',  
        processingTimeSeconds: processingTime,  
        completedAt: new Date(),  
      },  
    });

    // Deduct credits and create transaction  
    if (creditsConsumed \> 0\) {  
      const updatedUser \= await prisma.user.update({  
        where: { id: user.id },  
        data: { creditsBalance: { decrement: creditsConsumed } },  
      });

      await prisma.creditTransaction.create({  
        data: {  
          userId: user.id,  
          amount: \-creditsConsumed,  
          type: 'USAGE',  
          balanceAfter: updatedUser.creditsBalance,  
          verificationId: verification.id,  
        },  
      });  
    }

    return NextResponse.json({  
      verification: {  
        id: verification.id,  
        result: result.status,  
        score: result.score,  
        details: result.details,  
        creditsConsumed,  
        processingTime,  
      },  
      creditsRemaining: user.creditsBalance \- creditsConsumed,  
    });  
  } catch (error) {  
    console.error('Verification error:', error);  
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });  
  }  
}  
\`\`\`

\---

\#\# Week 3: Dashboard & CSV Upload

\#\#\# Dashboard Page

\*\*1. Create Dashboard Layout\*\*

\`app/dashboard/layout.tsx\`:  
\`\`\`typescript  
import Link from 'next/link';  
import { redirect } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {  
  // Note: In production, check auth via middleware or server component  
    
  return (  
    \<div className="min-h-screen bg-gray-50"\>  
      \<nav className="bg-white shadow-sm border-b"\>  
        \<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"\>  
          \<div className="flex justify-between h-16"\>  
            \<div className="flex"\>  
              \<Link href="/dashboard" className="flex items-center"\>  
                \<span className="text-xl font-bold"\>EmailVerify Pro\</span\>  
              \</Link\>  
            \</div\>  
            \<div className="flex items-center space-x-4"\>  
              \<Link href="/dashboard" className="text-gray-700 hover:text-gray-900"\>  
                Dashboard  
              \</Link\>  
              \<Link href="/dashboard/billing" className="text-gray-700 hover:text-gray-900"\>  
                Billing  
              \</Link\>  
              \<Link href="/dashboard/api-keys" className="text-gray-700 hover:text-gray-900"\>  
                API Keys  
              \</Link\>  
              \<button className="text-gray-700 hover:text-gray-900"\>  
                Logout  
              \</button\>  
            \</div\>  
          \</div\>  
        \</div\>  
      \</nav\>  
      \<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"\>  
        {children}  
      \</main\>  
    \</div\>  
  );  
}  
\`\`\`

\*\*2. Create Dashboard Page\*\*

\`app/dashboard/page.tsx\`:  
\`\`\`typescript  
'use client';

import { useState, useEffect } from 'react';  
import Link from 'next/link';

export default function DashboardPage() {  
  const \[user, setUser\] \= useState\<any\>(null);  
  const \[email, setEmail\] \= useState('');  
  const \[verifying, setVerifying\] \= useState(false);  
  const \[result, setResult\] \= useState\<any\>(null);

  useEffect(() \=\> {  
    const userData \= localStorage.getItem('user');  
    if (userData) {  
      setUser(JSON.parse(userData));  
    }  
  }, \[\]);

  const handleVerify \= async (e: React.FormEvent) \=\> {  
    e.preventDefault();  
    setVerifying(true);  
    setResult(null);

    try {  
      const token \= localStorage.getItem('token');  
      const res \= await fetch('/api/verify/single', {  
        method: 'POST',  
        headers: {  
          'Content-Type': 'application/json',  
          'Authorization': \`Bearer ${token}\`,  
        },  
        body: JSON.stringify({ email }),  
      });

      const data \= await res.json();

      if (\!res.ok) {  
        alert(data.error || 'Verification failed');  
        setVerifying(false);  
        return;  
      }

      setResult(data);  
        
      // Update credits in localStorage  
      const updatedUser \= { ...user, credits: data.creditsRemaining };  
      setUser(updatedUser);  
      localStorage.setItem('user', JSON.stringify(updatedUser));  
        
    } catch (error) {  
      alert('An error occurred');  
    } finally {  
      setVerifying(false);  
    }  
  };

  return (  
    \<div className="space-y-6"\>  
      {/\* Credit Balance \*/}  
      \<div className="bg-white rounded-lg shadow p-6"\>  
        \<div className="flex justify-between items-center"\>  
          \<div\>  
            \<p className="text-sm text-gray-600"\>Credit Balance\</p\>  
            \<p className="text-3xl font-bold"\>{user?.credits || 0}\</p\>  
          \</div\>  
          \<Link  
            href="/dashboard/billing"  
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"  
          \>  
            Buy More \+  
          \</Link\>  
        \</div\>  
      \</div\>

      {/\* Single Email Verification \*/}  
      \<div className="bg-white rounded-lg shadow p-6"\>  
        \<h2 className="text-xl font-semibold mb-4"\>Verify Single Email\</h2\>  
        \<form onSubmit={handleVerify} className="space-y-4"\>  
          \<div className="flex gap-2"\>  
            \<input  
              type="email"  
              value={email}  
              onChange={(e) \=\> setEmail(e.target.value)}  
              placeholder="Enter email address..."  
              required  
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md"  
            /\>  
            \<button  
              type="submit"  
              disabled={verifying}  
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"  
            \>  
              {verifying ? 'Verifying...' : 'Verify'}  
            \</button\>  
          \</div\>  
        \</form\>

        {result && (  
          \<div className="mt-4 p-4 bg-gray-50 rounded-md"\>  
            \<h3 className="font-semibold mb-2"\>Result\</h3\>  
            \<div className="space-y-1"\>  
              \<p\>Status: \<span className={\`font-bold ${  
                result.verification.result \=== 'valid' ? 'text-green-600' :  
                result.verification.result \=== 'invalid' ? 'text-red-600' :  
                'text-yellow-600'  
              }\`}\>{result.verification.result}\</span\>\</p\>  
              \<p\>Quality Score: {result.verification.score}/100\</p\>  
              \<p\>Credits Used: {result.verification.creditsConsumed}\</p\>  
              \<p\>Processing Time: {result.verification.processingTime.toFixed(2)}s\</p\>  
            \</div\>  
          \</div\>  
        )}  
      \</div\>

      {/\* CSV Upload (Phase 1 \- Coming Soon) \*/}  
      \<div className="bg-white rounded-lg shadow p-6"\>  
        \<h2 className="text-xl font-semibold mb-4"\>Bulk CSV Verification\</h2\>  
        \<p className="text-gray-600 mb-4"\>Upload a CSV file to verify multiple emails at once.\</p\>  
        \<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"\>  
          \<p className="text-gray-500"\>Drag and drop CSV here, or click to browse\</p\>  
          \<input type="file" accept=".csv" className="hidden" /\>  
          \<button className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-md"\>  
            Coming Soon  
          \</button\>  
        \</div\>  
      \</div\>

      {/\* Recent Verifications (stub) \*/}  
      \<div className="bg-white rounded-lg shadow p-6"\>  
        \<h2 className="text-xl font-semibold mb-4"\>Recent Verifications\</h2\>  
        \<p className="text-gray-500 text-center py-8"\>No verifications yet\</p\>  
      \</div\>  
    \</div\>  
  );  
}  
\`\`\`

\---

\#\#\# CSV Upload Feature

\*\*Create API route for bulk upload:\*\*

\`app/api/verify/bulk/route.ts\`:  
\`\`\`typescript  
// Similar structure to single verification  
// Parse CSV, validate, queue for processing  
// Return job ID for status polling  
\`\`\`

\*\*Implementation steps:\*\*  
1\. Accept CSV file upload  
2\. Parse CSV (use \`papaparse\` library)  
3\. Create verification job in database  
4\. Process emails (can be synchronous for MVP, async for scale)  
5\. Store results  
6\. Allow download of results as CSV

\---

\#\# Week 4: Payments & Polish

\#\#\# Stripe Integration

\*\*1. Install Stripe\*\*  
\`\`\`bash  
npm install @stripe/stripe-js stripe  
\`\`\`

\*\*2. Create Checkout API\*\*

\`app/api/payment/create-checkout/route.ts\`:  
\`\`\`typescript  
import { NextResponse } from 'next/server';  
import Stripe from 'stripe';  
import { verifyToken } from '@/lib/auth';

const stripe \= new Stripe(process.env.STRIPE\_SECRET\_KEY\!, {  
  apiVersion: '2023-10-16',  
});

export async function POST(request: Request) {  
  try {  
    const token \= request.headers.get('authorization')?.replace('Bearer ', '');  
    const payload \= verifyToken(token\!);  
    if (\!payload) {  
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });  
    }

    const { package: packageType } \= await request.json();

    // Define packages  
    const packages \= {  
      '10k': { credits: 10000, price: 1500 }, // $15.00  
      '25k': { credits: 25000, price: 3000 }, // $30.00  
      '50k': { credits: 50000, price: 5500 }, // $55.00  
      '100k': { credits: 100000, price: 10000 }, // $100.00  
    };

    const pkg \= packages\[packageType as keyof typeof packages\];  
    if (\!pkg) {  
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });  
    }

    // Create Stripe checkout session  
    const session \= await stripe.checkout.sessions.create({  
      payment\_method\_types: \['card'\],  
      line\_items: \[  
        {  
          price\_data: {  
            currency: 'usd',  
            product\_data: {  
              name: \`${pkg.credits.toLocaleString()} Email Verification Credits\`,  
              description: 'Never-expiring credits for EmailVerify Pro',  
            },  
            unit\_amount: pkg.price,  
          },  
          quantity: 1,  
        },  
      \],  
      mode: 'payment',  
      success\_url: \`${process.env.NEXT\_PUBLIC\_APP\_URL}/dashboard/billing?success=true\`,  
      cancel\_url: \`${process.env.NEXT\_PUBLIC\_APP\_URL}/dashboard/billing?canceled=true\`,  
      client\_reference\_id: payload.userId,  
      metadata: {  
        userId: payload.userId,  
        credits: pkg.credits.toString(),  
      },  
    });

    return NextResponse.json({ url: session.url });  
  } catch (error) {  
    console.error('Checkout error:', error);  
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });  
  }  
}  
\`\`\`

\*\*3. Create Webhook Handler\*\*

\`app/api/webhooks/stripe/route.ts\`:  
\`\`\`typescript  
import { NextResponse } from 'next/server';  
import Stripe from 'stripe';  
import { PrismaClient } from '@prisma/client';

const stripe \= new Stripe(process.env.STRIPE\_SECRET\_KEY\!);  
const prisma \= new PrismaClient();  
const webhookSecret \= process.env.STRIPE\_WEBHOOK\_SECRET\!;

export async function POST(request: Request) {  
  const body \= await request.text();  
  const sig \= request.headers.get('stripe-signature')\!;

  let event: Stripe.Event;

  try {  
    event \= stripe.webhooks.constructEvent(body, sig, webhookSecret);  
  } catch (err) {  
    console.error('Webhook signature verification failed');  
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });  
  }

  // Handle checkout.session.completed  
  if (event.type \=== 'checkout.session.completed') {  
    const session \= event.data.object as Stripe.Checkout.Session;  
      
    const userId \= session.metadata?.userId;  
    const credits \= parseInt(session.metadata?.credits || '0');

    if (userId && credits \> 0\) {  
      // Add credits to user  
      const user \= await prisma.user.update({  
        where: { id: userId },  
        data: { creditsBalance: { increment: credits } },  
      });

      // Create transaction  
      await prisma.creditTransaction.create({  
        data: {  
          userId,  
          amount: credits,  
          type: 'PURCHASE',  
          balanceAfter: user.creditsBalance,  
          stripePaymentId: session.payment\_intent as string,  
          description: \`Purchased ${credits} credits\`,  
        },  
      });  
    }  
  }

  return NextResponse.json({ received: true });  
}  
\`\`\`

\*\*4. Create Billing Page\*\*

\`app/dashboard/billing/page.tsx\`:  
\`\`\`typescript  
'use client';

import { useState } from 'react';

const packages \= \[  
  { id: '10k', credits: 10000, price: 15, perEmail: 0.0015 },  
  { id: '25k', credits: 25000, price: 30, perEmail: 0.0012, badge: 'Best Value' },  
  { id: '50k', credits: 50000, price: 55, perEmail: 0.0011 },  
  { id: '100k', credits: 100000, price: 100, perEmail: 0.001 },  
\];

export default function BillingPage() {  
  const \[loading, setLoading\] \= useState\<string | null\>(null);

  const handlePurchase \= async (packageId: string) \=\> {  
    setLoading(packageId);

    try {  
      const token \= localStorage.getItem('token');  
      const res \= await fetch('/api/payment/create-checkout', {  
        method: 'POST',  
        headers: {  
          'Content-Type': 'application/json',  
          'Authorization': \`Bearer ${token}\`,  
        },  
        body: JSON.stringify({ package: packageId }),  
      });

      const data \= await res.json();

      if (data.url) {  
        window.location.href \= data.url;  
      }  
    } catch (error) {  
      alert('Payment failed');  
      setLoading(null);  
    }  
  };

  return (  
    \<div className="space-y-6"\>  
      \<h1 className="text-2xl font-bold"\>Purchase Credits\</h1\>

      \<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"\>  
        {packages.map((pkg) \=\> (  
          \<div  
            key={pkg.id}  
            className="bg-white rounded-lg shadow p-6 relative"  
          \>  
            {pkg.badge && (  
              \<div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded"\>  
                {pkg.badge}  
              \</div\>  
            )}  
            \<div className="mb-4"\>  
              \<p className="text-3xl font-bold"\>${pkg.price}\</p\>  
              \<p className="text-gray-600"\>{pkg.credits.toLocaleString()} credits\</p\>  
              \<p className="text-sm text-gray-500"\>${pkg.perEmail.toFixed(4)} per email\</p\>  
            \</div\>  
            \<button  
              onClick={() \=\> handlePurchase(pkg.id)}  
              disabled={loading \=== pkg.id}  
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"  
            \>  
              {loading \=== pkg.id ? 'Processing...' : 'Purchase'}  
            \</button\>  
          \</div\>  
        ))}  
      \</div\>

      \<div className="bg-gray-50 rounded-lg p-4"\>  
        \<p className="text-sm text-gray-600"\>  
          💡 \<strong\>Credits never expire.\</strong\> Buy once, use forever.  
        \</p\>  
      \</div\>  
    \</div\>  
  );  
}  
\`\`\`

\---

\#\# Deployment Checklist

\#\#\# Pre-Deployment

\- \[ \] Environment variables set in production  
\- \[ \] Database migrations run  
\- \[ \] Stripe webhook endpoint configured  
\- \[ \] Domain purchased and configured  
\- \[ \] SSL certificate active

\#\#\# Vercel Deployment  
\`\`\`bash  
\# Install Vercel CLI  
npm i \-g vercel

\# Deploy  
vercel \--prod  
\`\`\`

\#\#\# Railway Deployment (Database)

1\. Create Railway project  
2\. Add PostgreSQL service  
3\. Copy connection string to Vercel env vars  
4\. Run migrations: \`npx prisma migrate deploy\`

\---

\#\# Testing Checklist

\#\#\# Manual Testing

\- \[ \] User registration works  
\- \[ \] User login works  
\- \[ \] Single email verification works  
\- \[ \] Credits deducted correctly  
\- \[ \] Credit purchase flow works  
\- \[ \] Stripe webhook adds credits  
\- \[ \] Dashboard displays correct data  
\- \[ \] Logout works

\#\#\# API Testing  
\`\`\`bash  
\# Register  
curl \-X POST http://localhost:3000/api/auth/register \\  
  \-H "Content-Type: application/json" \\  
  \-d '{"email":"test@example.com","password":"password123"}'

\# Login  
curl \-X POST http://localhost:3000/api/auth/login \\  
  \-H "Content-Type: application/json" \\  
  \-d '{"email":"test@example.com","password":"password123"}'

\# Verify Email (use token from login)  
curl \-X POST http://localhost:3000/api/verify/single \\  
  \-H "Content-Type: application/json" \\  
  \-H "Authorization: Bearer YOUR\_TOKEN\_HERE" \\  
  \-d '{"email":"test@gmail.com"}'  
\`\`\`

\---

\#\# Success Criteria (End of Week 4\)

\#\#\# Functional Requirements Met

\- ✅ User can register and login  
\- ✅ User receives 100 free credits  
\- ✅ User can verify single email  
\- ✅ Credits deducted on verification  
\- ✅ User can purchase credits via Stripe  
\- ✅ Dashboard shows credit balance  
\- ✅ Basic verification history shown

\#\#\# Technical Requirements Met

\- ✅ Next.js 14 with App Router  
\- ✅ TypeScript throughout  
\- ✅ Tailwind CSS for styling  
\- ✅ PostgreSQL database  
\- ✅ Prisma ORM  
\- ✅ Reoon API integrated  
\- ✅ Stripe payments working  
\- ✅ Deployed to production

\#\#\# Ready for Beta

\- ✅ Invite 10-20 beta users  
\- ✅ Collect feedback  
\- ✅ Monitor for errors (Sentry)  
\- ✅ Track key metrics (PostHog)

\---

\#\# What's NOT in MVP (Phase 2\)

\- ❌ CSV bulk upload (basic version in week 3, polish in Phase 2\)  
\- ❌ OAuth login (email/password only)  
\- ❌ API keys management  
\- ❌ Webhooks  
\- ❌ Advanced analytics  
\- ❌ Subscription plans  
\- ❌ Admin panel  
\- ❌ Email notifications

\---

\#\# Next Steps After MVP

1\. \*\*Week 5\*\*: Launch to beta users, gather feedback  
2\. \*\*Week 6-8\*\*: Implement Phase 2 features based on feedback  
3\. \*\*Week 9\*\*: Public launch preparation  
4\. \*\*Week 10-12\*\*: Scale and grow

\---

\*\*END OF QUICK START GUIDE\*\*  
