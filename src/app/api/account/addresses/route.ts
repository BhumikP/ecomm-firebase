
// src/app/api/account/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

// POST: Add a new address to a user's address book
export async function POST(req: NextRequest) {
  await connectDb();
  try {
    const { userId, addressData } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required.' }, { status: 400 });
    }
    if (!addressData) {
      return NextResponse.json({ message: 'Address data is required.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // If the new address is marked as primary, un-set all other addresses
    if (addressData.isPrimary) {
      user.addresses?.forEach(addr => {
        addr.isPrimary = false;
      });
    }

    user.addresses?.push(addressData);
    const updatedUser = await user.save();
    
    // Omit password hash from the returned user data
    const { passwordHash, ...userData } = updatedUser.toObject();

    return NextResponse.json({ user: userData, message: 'Address added successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error adding address:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing address
export async function PUT(req: NextRequest) {
  await connectDb();
  try {
    const { userId, addressId, updateData } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json({ message: 'Valid userId and addressId are required.' }, { status: 400 });
    }
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'Update data is required.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user || !user.addresses) {
      return NextResponse.json({ message: 'User or addresses not found.' }, { status: 404 });
    }
    
    const addressIndex = user.addresses.findIndex(addr => addr._id?.toString() === addressId);
    if (addressIndex === -1) {
      return NextResponse.json({ message: 'Address not found.' }, { status: 404 });
    }
    
    // Handle setting as primary
    if (updateData.isPrimary) {
      user.addresses.forEach(addr => {
        addr.isPrimary = false;
      });
    }
    
    // Merge the updated data
    Object.assign(user.addresses[addressIndex], updateData);

    const updatedUser = await user.save();
    const { passwordHash, ...userData } = updatedUser.toObject();

    return NextResponse.json({ user: userData, message: 'Address updated successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}

// DELETE: Remove an address
export async function DELETE(req: NextRequest) {
  await connectDb();
  try {
    // Read userId and addressId from the request body
    const { userId, addressId } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json({ message: 'Valid userId and addressId are required in the request body.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user || !user.addresses) {
      return NextResponse.json({ message: 'User or addresses not found.' }, { status: 404 });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id?.toString() === addressId);
    if (addressIndex === -1) {
        return NextResponse.json({ message: 'Address not found.' }, { status: 404 });
    }

    const wasPrimary = user.addresses[addressIndex].isPrimary;
    user.addresses.splice(addressIndex, 1);

    // If the deleted address was primary, make the first remaining address primary
    if (wasPrimary && user.addresses.length > 0) {
        user.addresses[0].isPrimary = true;
    }

    const updatedUser = await user.save();
    const { passwordHash, ...userData } = updatedUser.toObject();

    return NextResponse.json({ user: userData, message: 'Address deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
