
// src/app/api/banners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Banner from '@/models/Banner';

// GET active banners for the landing page
export async function GET(req: NextRequest) {
  await connectDb();
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ banners }, { status: 200 });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return NextResponse.json({ message: 'Internal server error while fetching banners' }, { status: 500 });
  }
}
