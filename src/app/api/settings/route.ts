
// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Setting from '@/models/Setting';

// GET public settings, including announcement bar and active payment gateway
export async function GET(req: NextRequest) {
  await connectDb();

  try {
    const settings = await Setting.findOne({ configKey: 'global_settings' }).select('announcementText announcementLink isAnnouncementActive activePaymentGateway taxPercentage shippingCharge').lean();
    
    if (settings) {
      return NextResponse.json({
        announcementText: settings.announcementText,
        announcementLink: settings.announcementLink,
        isAnnouncementActive: settings.isAnnouncementActive,
        activePaymentGateway: settings.activePaymentGateway || 'razorpay',
        taxPercentage: settings.taxPercentage,
        shippingCharge: settings.shippingCharge,
      }, { status: 200 });
    }
    
    // If no settings, return defaults
    return NextResponse.json({ 
        announcementText: '',
        announcementLink: '',
        isAnnouncementActive: false,
        activePaymentGateway: 'razorpay',
        taxPercentage: 0,
        shippingCharge: 0,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
