
// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Setting from '@/models/Setting';

// GET public settings, specifically for announcement bar
export async function GET(req: NextRequest) {
  await connectDb();

  try {
    const settings = await Setting.findOne({ configKey: 'global_settings' }).select('announcementText announcementLink isAnnouncementActive');
    
    if (settings && settings.isAnnouncementActive) {
      return NextResponse.json({
        announcementText: settings.announcementText,
        announcementLink: settings.announcementLink,
        isAnnouncementActive: settings.isAnnouncementActive,
      }, { status: 200 });
    }
    
    // If no settings or announcement is not active, return non-active status
    return NextResponse.json({ isAnnouncementActive: false }, { status: 200 });

  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
