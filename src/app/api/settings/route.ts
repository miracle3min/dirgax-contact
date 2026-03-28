import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getUserSettings, setUserSetting, deleteUserSetting } from '@/lib/credentials';

// GET all settings
export async function GET() {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getUserSettings(user.id);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST = upsert settings
export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid settings object' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      if (value === '' || value === null || value === undefined) {
        await deleteUserSetting(user.id, key);
      } else {
        await setUserSetting(user.id, key, String(value));
      }
    }

    const updated = await getUserSettings(user.id);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
