import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getCredentials, addCredential, deleteCredential } from '@/lib/credentials';

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const credentials = await getCredentials(user.id);
    return NextResponse.json({ success: true, credentials });
  } catch (error) {
    console.error('Get credentials error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description, finalKey, token, clientDeviceId } = body;

    if (!finalKey || !token) {
      return NextResponse.json({ success: false, message: 'Final key and token are required' }, { status: 400 });
    }

    const credential = await addCredential(user.id, {
      description: description || '',
      finalKey,
      token,
      clientDeviceId: clientDeviceId || '',
    });

    return NextResponse.json({ success: true, credential });
  } catch (error) {
    console.error('Add credential error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Credential ID is required' }, { status: 400 });
    }

    await deleteCredential(Number(id));
    return NextResponse.json({ success: true, message: 'Credential deleted' });
  } catch (error) {
    console.error('Delete credential error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
