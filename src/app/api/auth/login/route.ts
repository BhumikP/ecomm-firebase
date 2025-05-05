// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

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

    // Passwords match, login successful
    // Omit passwordHash from the returned user data
    const { passwordHash, ...userData } = user.toObject();

    // In a real application, you would typically generate a JWT or session token here
    // and return it to the client. For this example, we just return user data.
    // The client-side will use localStorage which is NOT secure for production.

    return NextResponse.json({
        message: 'Login successful',
        user: userData
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
