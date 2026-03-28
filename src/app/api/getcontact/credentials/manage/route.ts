import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import {
  getCredentials,
  getCredentialById,
  addCredential,
  updateCredential,
  deleteCredential,
} from '@/lib/credentials';

// GET: List all credentials for the authenticated user
export async function GET() {
  const user = await validateSession();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const credentials = await getCredentials(user.id);
    return NextResponse.json({
      success: true,
      credentials: credentials.filter((c) => !c.deleted),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching credentials:', msg);
    return NextResponse.json({ success: false, message: 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST: Add new credential
export async function POST(request: NextRequest) {
  const user = await validateSession();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { description, finalKey, token, clientDeviceId } = body;

    if (!finalKey || !token) {
      return NextResponse.json({ success: false, message: 'finalKey and token are required' }, { status: 400 });
    }

    const credential = await addCredential(user.id, {
      description: description || '',
      finalKey,
      token,
      clientDeviceId: clientDeviceId || '',
    });

    return NextResponse.json({ success: true, credential }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error adding credential:', msg);
    return NextResponse.json({ success: false, message: 'Failed to add credential' }, { status: 500 });
  }
}

// PUT: Update credential
export async function PUT(request: NextRequest) {
  const user = await validateSession();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, description, finalKey, token, clientDeviceId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Credential ID is required' }, { status: 400 });
    }

    const existing = await getCredentialById(Number(id));
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Credential not found' }, { status: 404 });
    }

    const credential = await updateCredential(Number(id), {
      description: description || existing.description,
      finalKey: finalKey || existing.finalKey,
      token: token || existing.token,
      clientDeviceId: clientDeviceId || existing.clientDeviceId,
    });

    return NextResponse.json({ success: true, credential });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating credential:', msg);
    return NextResponse.json({ success: false, message: 'Failed to update credential' }, { status: 500 });
  }
}

// DELETE: Soft delete credential
export async function DELETE(request: NextRequest) {
  const user = await validateSession();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Credential ID is required' }, { status: 400 });
    }

    const existing = await getCredentialById(Number(id));
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Credential not found' }, { status: 404 });
    }

    await deleteCredential(Number(id));
    return NextResponse.json({ success: true, message: 'Credential deleted' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting credential:', msg);
    return NextResponse.json({ success: false, message: 'Failed to delete credential' }, { status: 500 });
  }
}
