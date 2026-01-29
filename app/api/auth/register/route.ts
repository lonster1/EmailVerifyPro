import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, isValidEmail, isValidPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error: 'Password must be at least 8 characters and contain both letters and numbers'
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with 100 free credits
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        creditsBalance: 100,
        isVerified: false, // Email verification can be added later
      },
      select: {
        id: true,
        email: true,
        role: true,
        creditsBalance: true,
        hasUnlimitedCredits: true,
        createdAt: true,
      },
    });

    // Create initial credit transaction record
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 100,
        type: 'PURCHASE',
        balanceAfter: 100,
        description: 'Welcome bonus - 100 free credits',
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      hasUnlimitedCredits: user.hasUnlimitedCredits,
    });

    // Create response with token in cookie
    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          creditsBalance: user.creditsBalance,
          hasUnlimitedCredits: user.hasUnlimitedCredits,
        },
        token,
      },
      { status: 201 }
    );

    // Set cookie in HTTP response (more reliable than client-side)
    response.cookies.set('token', token, {
      httpOnly: false, // Allow client-side access for localStorage sync
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
