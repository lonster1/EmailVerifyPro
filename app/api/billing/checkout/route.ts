import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic';

// Credit package definitions
const PACKAGES: Record<string, { credits: number; price: number }> = {
  '10K': { credits: 10000, price: 1500 }, // $15.00 in cents
  '25K': { credits: 25000, price: 3000 }, // $30.00
  '50K': { credits: 50000, price: 5500 }, // $55.00
  '100K': { credits: 100000, price: 10000 }, // $100.00
  '500K': { credits: 500000, price: 40000 }, // $400.00
};

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { packageType } = body;

    // Validate package type
    if (!packageType || !PACKAGES[packageType]) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      );
    }

    const pkg = PACKAGES[packageType];

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3001';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: payload.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packageType} Email Verification Credits`,
              description: `${pkg.credits.toLocaleString()} credits for email verification`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard/billing?success=true`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
      metadata: {
        userId: payload.userId,
        credits: pkg.credits.toString(),
        packageType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
