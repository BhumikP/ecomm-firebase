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

    // Basic validation on server-side
    if (password.length < 6) {
        return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
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
    // Log the detailed error for server-side debugging
    console.error('Registration error:', error);

     if ((error as any).name === 'ValidationError') {
         // Log specific validation errors
         console.error('Validation Errors:', (error as any).errors);
       return NextResponse.json({ message: 'Validation failed', errors: (error as any).errors }, { status: 400 });
     }
      // Catch potential duplicate key errors (though the initial check should prevent most)
      if ((error as any).code === 11000) {
         console.error('Duplicate key error:', error);
         return NextResponse.json({ message: 'Email already in use (duplicate key)' }, { status: 409 });
      }

    // Generic internal server error for other issues
    return NextResponse.json({ message: 'Internal server error during registration' }, { status: 500 });
  }
}
