
// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Setting, { ISetting } from '@/models/Setting';
// TODO: Add proper admin authentication/authorization middleware

const DEFAULT_SETTINGS: Omit<ISetting, '_id' | 'configKey' | 'createdAt' | 'updatedAt'> = {
  storeName: 'eShop Simplified',
  supportEmail: 'support@eshop.com',
  // maintenanceMode: false, // Removed
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
      // If no settings doc, return defaults directly (no need to create one here for GET)
      return NextResponse.json({ settings: DEFAULT_SETTINGS }, { status: 200 });
    }
    // Ensure only defined fields in the model are returned, or use a projection
    const responseSettings = {
        storeName: settings.storeName,
        supportEmail: settings.supportEmail,
        taxPercentage: settings.taxPercentage,
        shippingCharge: settings.shippingCharge,
        // maintenanceMode is no longer part of the model or response
    };
    return NextResponse.json({ settings: responseSettings }, { status: 200 });
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
    if (body.storeName !== undefined && (typeof body.storeName !== 'string' || body.storeName.trim() === '')) {
        return NextResponse.json({ message: 'Store name cannot be empty' }, { status: 400 });
    }
    if (body.supportEmail !== undefined && (typeof body.supportEmail !== 'string' || !body.supportEmail.includes('@'))) {
        return NextResponse.json({ message: 'Invalid support email' }, { status: 400 });
    }
    // Maintenance mode validation removed
    // if (typeof body.maintenanceMode !== 'boolean') {
    //     return NextResponse.json({ message: 'Invalid maintenance mode value' }, { status: 400 });
    // }
    if (body.taxPercentage !== undefined && (typeof body.taxPercentage !== 'number' || body.taxPercentage < 0 || body.taxPercentage > 100)) {
        return NextResponse.json({ message: 'Tax percentage must be between 0 and 100' }, { status: 400 });
    }
     if (body.shippingCharge !== undefined && (typeof body.shippingCharge !== 'number' || body.shippingCharge < 0)) {
        return NextResponse.json({ message: 'Shipping charge must be non-negative' }, { status: 400 });
    }
    
    const updatePayload: Partial<ISetting> = {};
    if(body.storeName !== undefined) updatePayload.storeName = body.storeName;
    if(body.supportEmail !== undefined) updatePayload.supportEmail = body.supportEmail;
    if(body.taxPercentage !== undefined) updatePayload.taxPercentage = body.taxPercentage;
    if(body.shippingCharge !== undefined) updatePayload.shippingCharge = body.shippingCharge;
    // maintenanceMode is no longer part of the update payload


    const updatedSettingsDoc = await Setting.findOneAndUpdate(
      { configKey: 'global_settings' },
      { $set: updatePayload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true } // Create if doesn't exist
    );

    // Construct response settings to exclude fields not in the model anymore
    const responseSettings = {
        storeName: updatedSettingsDoc.storeName,
        supportEmail: updatedSettingsDoc.supportEmail,
        taxPercentage: updatedSettingsDoc.taxPercentage,
        shippingCharge: updatedSettingsDoc.shippingCharge,
    };


    return NextResponse.json({ settings: responseSettings, message: 'Settings updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
