
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import User from '@/models/User';
// TODO: Import and implement proper authentication/authorization middleware
// import { isAdmin } from '@/lib/auth'; // Example auth check

export async function GET(req: NextRequest) {
  await connectDb();

  // --- Authorization Check ---
  // In a real app, verify the request comes from an authenticated admin user.
  // This is a placeholder check. Replace with your actual auth logic.
  // const authorized = await isAdmin(req);
  // if (!authorized) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }
  // --- End Placeholder Auth Check ---

  try {
    // Select fields to return, excluding passwordHash
    const users = await User.find({}).select('-passwordHash').sort({ joinedDate: -1 }); // Sort by newest first

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
