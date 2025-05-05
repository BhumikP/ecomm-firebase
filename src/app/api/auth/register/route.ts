// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

export async function POST(req: NextRequest) {
  await connectDb();

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 }); // Conflict
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      name,
      email,
      passwordHash,
      role: 'user', // Default role
      joinedDate: new Date(),
      status: 'Active'
    });

    await newUser.save();

     // Omit passwordHash from the returned user data
    const { passwordHash: _, ...userData } = newUser.toObject();

    // In a real application, you might automatically log the user in
    // by generating a JWT/session token here.
     return NextResponse.json({
        message: 'User registered successfully',
        user: userData
     }, { status: 201 }); // Created

  } catch (error) {
    console.error('Registration error:', error);
     if ((error as any).name === 'ValidationError') {
       return NextResponse.json({ message: 'Validation failed', errors: (error as any).errors }, { status: 400 });
     }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
