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
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const credentials = await getCredentials(user.id);
    return NextResponse.json({
      message: 'Success',
      data: credentials.filter((c) => !c.deleted),
      usingDatabase: true,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching credentials:', msg);
    return NextResponse.json({ message: 'Failed to fetch credentials', error: msg }, { status: 500 });
  }
}

// POST: Add new credential
export async function POST(request: NextRequest) {
  const user = await validateSession();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { description, finalKey, token, clientDeviceId } = body;

    if (!finalKey || !token) {
      return NextResponse.json({ message: 'finalKey and token are required' }, { status: 400 });
    }

    const newCredential = await addCredential(user.id, {
      description: description || '',
      finalKey,
      token,
      clientDeviceId: clientDeviceId || '',
    });

    return NextResponse.json({ message: 'Credential added successfully', data: newCredential }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error adding credential:', msg);
    return NextResponse.json({ message: 'Failed to add credential', error: msg }, { status: 500 });
  }
}

// PUT: Update credential
export async function PUT(request: NextRequest) {
  const user = await validateSession();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, description, finalKey, token, clientDeviceId } = body;

    if (!id) {
      return NextResponse.json({ message: 'Credential ID is required' }, { status: 400 });
    }

    const existing = await getCredentialById(Number(id));
    if (!existing) {
      return NextResponse.json({ message: 'Credential not found' }, { status: 404 });
    }

    const updated = await updateCredential(Number(id), {
      description: description || existing.description,
      finalKey: finalKey || existing.finalKey,
      token: token || existing.token,
      clientDeviceId: clientDeviceId || existing.clientDeviceId,
    });

    return NextResponse.json({ message: 'Credential updated successfully', data: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating credential:', msg);
    return NextResponse.json({ message: 'Failed to update credential', error: msg }, { status: 500 });
  }
}

// DELETE: Soft delete credential
export async function DELETE(request: NextRequest) {
  const user = await validateSession();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: 'Credential ID is required' }, { status: 400 });
    }

    const existing = await getCredentialById(Number(id));
    if (!existing) {
      return NextResponse.json({ message: 'Credential not found' }, { status: 404 });
    }

    await deleteCredential(Number(id));
    return NextResponse.json({ message: 'Credential deleted successfully' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting credential:', msg);
    return NextResponse.json({ message: 'Failed to delete credential', error: msg }, { status: 500 });
  }
}
