
// src/app/api/admin/banners/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Banner, { IBanner } from '@/models/Banner';
import mongoose from 'mongoose';
// TODO: Implement proper admin authentication middleware

interface Params {
  params: { id: string };
}

// GET a single banner by ID (Admin only - might not be needed if list view is sufficient)
export async function GET(req: NextRequest, { params }: Params) {
  await connectDb();
  // TODO: Add admin auth check
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid banner ID format' }, { status: 400 });
  }

  try {
    const banner = await Banner.findById(id);
    if (!banner) {
      return NextResponse.json({ message: 'Banner not found' }, { status: 404 });
    }
    return NextResponse.json({ banner }, { status: 200 });
  } catch (error) {
    
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


// PUT to update an existing banner (Admin only)
export async function PUT(req: NextRequest, { params }: Params) {
  await connectDb();
  // TODO: Add admin auth check
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid banner ID format' }, { status: 400 });
  }

  try {
    const body = await req.json() as Partial<Pick<IBanner, 'title' | 'imageUrl' | 'altText' | 'linkUrl' | 'order' | 'dataAiHint' | 'isActive'>>;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }
    
    // Ensure required fields are not accidentally cleared if not provided for update
    const updateData: Partial<IBanner> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.altText !== undefined) updateData.altText = body.altText;
    if (body.linkUrl !== undefined) updateData.linkUrl = body.linkUrl;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.dataAiHint !== undefined) updateData.dataAiHint = body.dataAiHint;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;


    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return NextResponse.json({ message: 'Banner not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json(updatedBanner, { status: 200 });
  } catch (error: any) {
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a banner (Admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  await connectDb();
  // TODO: Add admin auth check
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid banner ID format' }, { status: 400 });
  }

  try {
    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return NextResponse.json({ message: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Banner deleted successfully' }, { status: 200 });
  } catch (error) {
    
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
