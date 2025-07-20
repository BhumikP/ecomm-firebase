
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  await connectDb();

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Omit passwordHash from the returned user data
    const { passwordHash, ...userData } = user.toObject();

    // Set cookies for middleware authentication
    const response = NextResponse.json({
        message: 'Login successful',
        user: userData
    }, { status: 200 });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    };
    
    // Use the 'cookies().set' from next/headers
    cookies().set('isLoggedIn', 'true', cookieOptions);
    cookies().set('userRole', userData.role, cookieOptions);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
