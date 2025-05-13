
// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Setting, { ISetting } from '@/models/Setting';
// TODO: Add proper admin authentication/authorization middleware

const DEFAULT_SETTINGS: Omit<ISetting, '_id' | 'configKey' | 'createdAt' | 'updatedAt'> = {
  storeName: 'eShop Simplified',
  supportEmail: 'support@eshop.com',
  maintenanceMode: false,
  taxPercentage: 0,
  shippingCharge: 0,
};

// GET current store settings
export async function GET(req: NextRequest) {
  await connectDb();
  // TODO: Implement admin check
  // const isAdmin = await checkAdminAuth(req); // Placeholder
  // if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    let settings = await Setting.findOne({ configKey: 'global_settings' });
    if (!settings) {
      // If no settings doc, create one with defaults or return defaults
      // settings = await Setting.create({ configKey: 'global_settings', ...DEFAULT_SETTINGS });
      return NextResponse.json({ settings: DEFAULT_SETTINGS }, { status: 200 });
    }
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST to update store settings
export async function POST(req: NextRequest) {
  await connectDb();
  // TODO: Implement admin check
  // const isAdmin = await checkAdminAuth(req); // Placeholder
  // if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const body = await req.json() as Partial<Omit<ISetting, '_id' | 'configKey' | 'createdAt' | 'updatedAt'>>;

    // Validate incoming data (basic example)
    if (typeof body.storeName !== 'string' || body.storeName.trim() === '') {
        return NextResponse.json({ message: 'Store name cannot be empty' }, { status: 400 });
    }
    if (typeof body.supportEmail !== 'string' || !body.supportEmail.includes('@')) {
        return NextResponse.json({ message: 'Invalid support email' }, { status: 400 });
    }
    if (typeof body.maintenanceMode !== 'boolean') {
        return NextResponse.json({ message: 'Invalid maintenance mode value' }, { status: 400 });
    }
    if (typeof body.taxPercentage !== 'number' || body.taxPercentage < 0 || body.taxPercentage > 100) {
        return NextResponse.json({ message: 'Tax percentage must be between 0 and 100' }, { status: 400 });
    }
     if (typeof body.shippingCharge !== 'number' || body.shippingCharge < 0) {
        return NextResponse.json({ message: 'Shipping charge must be non-negative' }, { status: 400 });
    }


    const updatedSettings = await Setting.findOneAndUpdate(
      { configKey: 'global_settings' },
      { $set: body },
      { new: true, upsert: true, runValidators: true } // Create if doesn't exist
    );

    return NextResponse.json({ settings: updatedSettings, message: 'Settings updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

    