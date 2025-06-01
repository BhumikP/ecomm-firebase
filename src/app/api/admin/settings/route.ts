
// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Setting, { ISetting } from '@/models/Setting';
// TODO: Add proper admin authentication/authorization middleware

const DEFAULT_SETTINGS_FROM_MODEL: Omit<ISetting, '_id' | 'configKey' | 'createdAt' | 'updatedAt'> = {
  storeName: 'eShop Simplified',
  supportEmail: 'support@eshop.com',
  taxPercentage: 0,
  shippingCharge: 0,
  announcementText: '',
  announcementLink: '',
  isAnnouncementActive: false,
};

// GET current store settings
export async function GET(req: NextRequest) {
  await connectDb();
  // TODO: Implement admin check
  // const isAdmin = await checkAdminAuth(req); // Placeholder
  // if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    let settingsDoc = await Setting.findOne({ configKey: 'global_settings' });
    
    let responseSettings: typeof DEFAULT_SETTINGS_FROM_MODEL;

    if (!settingsDoc) {
      // If no settings doc, return defaults (model defaults should apply on first save)
      responseSettings = DEFAULT_SETTINGS_FROM_MODEL;
    } else {
      // Ensure all fields are present, falling back to model defaults if somehow missing
      responseSettings = {
        storeName: settingsDoc.storeName ?? DEFAULT_SETTINGS_FROM_MODEL.storeName,
        supportEmail: settingsDoc.supportEmail ?? DEFAULT_SETTINGS_FROM_MODEL.supportEmail,
        taxPercentage: settingsDoc.taxPercentage ?? DEFAULT_SETTINGS_FROM_MODEL.taxPercentage,
        shippingCharge: settingsDoc.shippingCharge ?? DEFAULT_SETTINGS_FROM_MODEL.shippingCharge,
        announcementText: settingsDoc.announcementText ?? DEFAULT_SETTINGS_FROM_MODEL.announcementText,
        announcementLink: settingsDoc.announcementLink ?? DEFAULT_SETTINGS_FROM_MODEL.announcementLink,
        isAnnouncementActive: settingsDoc.isAnnouncementActive ?? DEFAULT_SETTINGS_FROM_MODEL.isAnnouncementActive,
      };
    }
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

    // Validate incoming data
    if (body.storeName !== undefined && (typeof body.storeName !== 'string' || body.storeName.trim() === '')) {
        return NextResponse.json({ message: 'Store name cannot be empty' }, { status: 400 });
    }
    if (body.supportEmail !== undefined && (typeof body.supportEmail !== 'string' || !body.supportEmail.includes('@'))) {
        return NextResponse.json({ message: 'Invalid support email' }, { status: 400 });
    }
    if (body.taxPercentage !== undefined && (typeof body.taxPercentage !== 'number' || body.taxPercentage < 0 || body.taxPercentage > 100)) {
        return NextResponse.json({ message: 'Tax percentage must be between 0 and 100' }, { status: 400 });
    }
     if (body.shippingCharge !== undefined && (typeof body.shippingCharge !== 'number' || body.shippingCharge < 0)) {
        return NextResponse.json({ message: 'Shipping charge must be non-negative' }, { status: 400 });
    }
    // Validations for new announcement fields
    if (body.announcementText !== undefined && typeof body.announcementText !== 'string') {
        return NextResponse.json({ message: 'Invalid announcement text format' }, { status: 400 });
    }
    if (body.announcementLink !== undefined && typeof body.announcementLink !== 'string') {
        return NextResponse.json({ message: 'Invalid announcement link format' }, { status: 400 });
    }
    if (body.isAnnouncementActive !== undefined && typeof body.isAnnouncementActive !== 'boolean') {
        return NextResponse.json({ message: 'Invalid value for announcement active status' }, { status: 400 });
    }
    
    // Construct the payload for update, explicitly including all fields from the body
    const updatePayload: Partial<ISetting> = {};
    if (body.storeName !== undefined) updatePayload.storeName = body.storeName;
    if (body.supportEmail !== undefined) updatePayload.supportEmail = body.supportEmail;
    if (body.taxPercentage !== undefined) updatePayload.taxPercentage = body.taxPercentage;
    if (body.shippingCharge !== undefined) updatePayload.shippingCharge = body.shippingCharge;
    // Add announcement fields to payload
    if (body.announcementText !== undefined) updatePayload.announcementText = body.announcementText;
    if (body.announcementLink !== undefined) updatePayload.announcementLink = body.announcementLink;
    if (body.isAnnouncementActive !== undefined) updatePayload.isAnnouncementActive = body.isAnnouncementActive;


    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
    }

    const updatedSettingsDoc = await Setting.findOneAndUpdate(
      { configKey: 'global_settings' },
      { $set: updatePayload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Construct response settings object from the updated document
    const responseSettings = {
        storeName: updatedSettingsDoc.storeName,
        supportEmail: updatedSettingsDoc.supportEmail,
        taxPercentage: updatedSettingsDoc.taxPercentage,
        shippingCharge: updatedSettingsDoc.shippingCharge,
        announcementText: updatedSettingsDoc.announcementText,
        announcementLink: updatedSettingsDoc.announcementLink,
        isAnnouncementActive: updatedSettingsDoc.isAnnouncementActive,
    };

    return NextResponse.json({ settings: responseSettings, message: 'Settings updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error while updating settings' }, { status: 500 });
  }
}
