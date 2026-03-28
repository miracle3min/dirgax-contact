import { NextResponse } from 'next/server';
import { createUser, createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, displayName } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ success: false, message: 'Username must be 3-50 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Only allow alphanumeric and underscore for username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ success: false, message: 'Username can only contain letters, numbers, and underscores' }, { status: 400 });
    }

    const user = await createUser(username, password, displayName);
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: { id: user.id, username: user.username, displayName: user.display_name },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Username already taken' ? 409 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
