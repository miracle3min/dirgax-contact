import { NextRequest, NextResponse } from 'next/server';
import { decryptData } from '@/lib/encrypt';
import { getCredentialById } from '@/lib/credentials';
import { callApiSubscription, getcontactDecrypt } from '@/lib/getcontact';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Credential ID is required' },
        { status: 400 }
      );
    }

    // Decrypt the credential ID
    let credentialId: string;
    try {
      credentialId = decryptData(id);
    } catch {
      return NextResponse.json(
        { message: 'Invalid credential ID' },
        { status: 400 }
      );
    }

    // Fetch the credential
    const credential = await getCredentialById(Number(credentialId));
    if (!credential) {
      return NextResponse.json(
        { message: 'Credential not found' },
        { status: 404 }
      );
    }

    // Call GetContact subscription API
    const apiResult = await callApiSubscription(
      credential.token,
      credential.finalKey,
      credential.clientDeviceId
    );
    const parsed = JSON.parse(apiResult.body);

    if (apiResult.httpCode !== 200 && apiResult.httpCode !== 201) {
      return NextResponse.json(
        { message: `API error: ${apiResult.httpCode}`, error: parsed },
        { status: 400 }
      );
    }

    // Decrypt response data if encrypted
    let result = parsed;
    if (parsed.data && typeof parsed.data === 'string') {
      try {
        const decrypted = getcontactDecrypt(parsed.data, credential.finalKey);
        result = { ...parsed, data: JSON.parse(decrypted) };
      } catch {
        // Data might not be encrypted
        result = parsed;
      }
    }

    return NextResponse.json({
      message: 'Success',
      data: result.data || result,
    });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
