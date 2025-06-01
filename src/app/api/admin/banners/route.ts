
// src/app/api/admin/banners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Banner, { IBanner } from '@/models/Banner';
// TODO: Implement proper admin authentication middleware

// GET all banners for admin panel
export async function GET(req: NextRequest) {
  await connectDb();
  // TODO: Add admin auth check
  try {
    const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ banners }, { status: 200 });
  } catch (error) {
    
    return NextResponse.json({ message: 'Internal server error while fetching banners' }, { status: 500 });
  }
}

// POST to create a new banner (Admin only)
export async function POST(req: NextRequest) {
  await connectDb();
  // TODO: Add admin auth check
  try {
    const body = await req.json() as Partial<Pick<IBanner, 'title' | 'imageUrl' | 'altText' | 'linkUrl' | 'order' | 'dataAiHint' | 'isActive'>>;

    if (!body.imageUrl || !body.altText) {
      return NextResponse.json({ message: 'Image URL and Alt Text are required.' }, { status: 400 });
    }

    const newBanner = new Banner({
      title: body.title || undefined,
      imageUrl: body.imageUrl,
      altText: body.altText,
      linkUrl: body.linkUrl || undefined,
      order: body.order || 0,
      dataAiHint: body.dataAiHint || undefined,
      isActive: body.isActive === undefined ? true : body.isActive,
    });

    const savedBanner = await newBanner.save();
    return NextResponse.json(savedBanner, { status: 201 });

  } catch (error: any) {
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error while creating banner' }, { status: 500 });
  }
}
