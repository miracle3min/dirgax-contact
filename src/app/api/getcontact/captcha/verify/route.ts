import { NextRequest, NextResponse } from 'next/server';
import { decryptData } from '@/lib/encrypt';
import { getCredentialById } from '@/lib/credentials';
import { callApiVerifyCode, getcontactDecrypt } from '@/lib/getcontact';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, validationCode } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Credential ID is required' },
        { status: 400 }
      );
    }

    if (!validationCode) {
      return NextResponse.json(
        { message: 'Validation code is required' },
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

    // Call verify code API
    const apiResult = await callApiVerifyCode(
      validationCode,
      credential.token,
      credential.finalKey,
      credential.clientDeviceId
    );
    const parsed = JSON.parse(apiResult.body);

    if (apiResult.httpCode !== 200 && apiResult.httpCode !== 201) {
      return NextResponse.json(
        {
          message: parsed?.meta?.errorMessage || 'Captcha verification failed',
          error: parsed,
        },
        { status: apiResult.httpCode }
      );
    }

    // Decrypt response data if encrypted
    let result = parsed;
    if (parsed.data && typeof parsed.data === 'string') {
      try {
        const decrypted = getcontactDecrypt(parsed.data, credential.finalKey);
        result = { ...parsed, data: JSON.parse(decrypted) };
      } catch {
        result = parsed;
      }
    }

    return NextResponse.json({
      message: 'Captcha verified successfully',
      data: result.data || result,
    });
  } catch (error: any) {
    console.error('Captcha verify error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
