
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';
// TODO: Import and implement proper authentication/authorization middleware
// import { isAdmin } from '@/lib/auth'; // Example auth check

interface Params {
  params: { id: string };
}

// PUT (update) a user by ID (Admin only)
export async function PUT(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  // --- Authorization Check ---
  // const authorized = await isAdmin(req);
  // if (!authorized) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }
  // --- End Placeholder Auth Check ---

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    // Only allow updating specific fields like 'role', 'status', potentially 'name'
    // Exclude sensitive fields like passwordHash, email (usually not changeable by admin directly)
    const { role, status, name } = await req.json() as Partial<Pick<IUser, 'role' | 'status' | 'name'>>;

    const updateData: Partial<Pick<IUser, 'role' | 'status' | 'name'>> = {};
    if (role && ['user', 'admin'].includes(role)) {
      updateData.role = role;
    }
     if (status && ['Active', 'Inactive'].includes(status)) {
       updateData.status = status;
     }
     if (name && typeof name === 'string' && name.trim()) {
         updateData.name = name.trim();
     }


    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid update fields provided' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash'); // Exclude password hash from response

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser, message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
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

  // --- Authorization Check ---
  // const authorized = await isAdmin(req);
  // if (!authorized) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }
  // --- End Placeholder Auth Check ---

   // Prevent deleting the user themselves if they are the only admin? (Optional safeguard)

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Consider related data cleanup (e.g., anonymizing orders) if necessary

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// GET a single user by ID (Admin only - maybe useful for user detail view)
export async function GET(req: NextRequest, { params }: Params) {
    await connectDb();
    const { id } = params;

    // --- Authorization Check ---
    // const authorized = await isAdmin(req);
    // if (!authorized) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    // }
    // --- End Placeholder Auth Check ---


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
        console.error(`Error fetching user ${id}:`, error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
