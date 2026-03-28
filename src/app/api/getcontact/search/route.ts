import { NextRequest, NextResponse } from 'next/server';
import { decryptData } from '@/lib/encrypt';
import { getCredentialById } from '@/lib/credentials';
import { callApiSearch, callApiNumberDetail, getcontactDecrypt } from '@/lib/getcontact';

function normalizePhoneNumber(phone: string): string {
  let normalized = phone.trim().replace(/[\s\-()]/g, '');

  // If starts with 0, replace with +62 (Indonesian number)
  if (normalized.startsWith('0')) {
    normalized = '+62' + normalized.substring(1);
  }

  // If starts with 62 (without +), add +
  if (normalized.startsWith('62') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  // Ensure it starts with +
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, phoneNumber, searchType } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Credential ID is required' },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!searchType || !['profile', 'tags'].includes(searchType)) {
      return NextResponse.json(
        { message: 'Invalid search type. Must be "profile" or "tags"' },
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

    // Normalize the phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    let apiResult: { httpCode: number; body: string };

    if (searchType === 'profile') {
      apiResult = await callApiSearch(
        normalizedPhone,
        credential.token,
        credential.finalKey,
        credential.clientDeviceId
      );
    } else {
      apiResult = await callApiNumberDetail(
        normalizedPhone,
        credential.token,
        credential.finalKey,
        credential.clientDeviceId
      );
    }

    const parsed = JSON.parse(apiResult.body);

    // Handle captcha required (403)
    if (apiResult.httpCode === 403 || parsed?.meta?.errorCode === 'CAPTCHA_REQUIRED') {
      return NextResponse.json(
        {
          message: 'Captcha verification required',
          captchaRequired: true,
          data: parsed,
        },
        { status: 403 }
      );
    }

    if (apiResult.httpCode !== 200 && apiResult.httpCode !== 201) {
      return NextResponse.json(
        {
          message: parsed?.meta?.errorMessage || 'API request failed',
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
      message: 'Success',
      searchType,
      phoneNumber: normalizedPhone,
      data: result.data || result,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
