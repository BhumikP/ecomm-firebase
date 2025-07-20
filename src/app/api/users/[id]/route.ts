
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import * as Sentry from "@sentry/nextjs"; // Import Sentry

interface Params {
  params: { id: string };
}

// Helper to get authenticated user info from cookies
async function getAuthFromCookies() {
    const cookieStore = cookies();
    const isLoggedIn = cookieStore.get('isLoggedIn')?.value === 'true';
    const userRole = cookieStore.get('userRole')?.value;
    // For getting userId, you might need to store it in a cookie or have another way to verify the session
    // For this example, we'll assume a session management system would provide the userId
    // Let's assume you store userId in another cookie for simplicity.
    const loggedInUserId = cookieStore.get('userId')?.value;
    return { isLoggedIn, userRole, loggedInUserId };
}

// PUT (update) a user by ID
export async function PUT(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  const { userRole, loggedInUserId } = await getAuthFromCookies();

  // --- Authorization Check ---
  const isOwner = loggedInUserId === id;
  const isAdmin = userRole === 'admin';
  
  if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  // --- End Auth Check ---

  try {
    const body = await req.json();

    const updateData: Partial<IUser> = {};

    // User can only update their own name
    if (body.name && isOwner) {
       if (typeof body.name === 'string' && body.name.trim()) {
         updateData.name = body.name.trim();
       }
    }

    // Admin can update name, role, and status
    if (isAdmin) {
      if (body.name && typeof body.name === 'string' && body.name.trim()) {
         updateData.name = body.name.trim();
      }
      if (body.role && ['user', 'admin'].includes(body.role)) {
        updateData.role = body.role;
      }
      if (body.status && ['Active', 'Inactive'].includes(body.status)) {
        updateData.status = body.status;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid update fields provided or insufficient permissions.' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // If a user updated their own name, and we are using a session/cookie that contains user data,
    // it would be good practice to update it here.
    // For this cookie-based setup, the client will update its localStorage.

    return NextResponse.json({ user: updatedUser, message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error, { extra: { userId: id, requestBody: await req.json().catch(() => ({})) } });
    console.error(`Error updating user ${id}:`, error);
     if ((error as any).name === 'ValidationError') {
       return NextResponse.json({ message: 'Validation failed', errors: (error as any).errors }, { status: 400 });
     }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a user by ID (Admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  const { userRole, loggedInUserId } = await getAuthFromCookies();
  
  // --- Authorization Check ---
  if (userRole !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  if (loggedInUserId === id) {
    return NextResponse.json({ message: 'Admins cannot delete their own account.' }, { status: 400 });
  }
  // --- End Auth Check ---

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error, { extra: { userId: id } });
    console.error(`Error deleting user ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// GET a single user by ID (Admin or owner)
export async function GET(req: NextRequest, { params }: Params) {
    await connectDb();
    const { id } = params;

    const { userRole, loggedInUserId } = await getAuthFromCookies();

    // --- Authorization Check ---
    const isOwner = loggedInUserId === id;
    const isAdmin = userRole === 'admin';
  
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    // --- End Auth Check ---

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    try {
        const user = await User.findById(id).select('-passwordHash');
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        Sentry.captureException(error, { extra: { userId: id } });
        console.error(`Error fetching user ${id}:`, error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
