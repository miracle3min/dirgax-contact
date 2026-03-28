import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, username: user.username, displayName: user.display_name },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
