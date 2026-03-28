import { NextRequest, NextResponse } from 'next/server';
import { encryptData, decryptData } from '@/lib/encrypt';
import {
  generateClientPrivateKey,
  generateClientPublicKey,
  generateFinalKey,
  callApiRegister,
  callApiInitBasic,
  callApiAdSettings,
  callApiInitIntro,
  callApiEmailCodeValidateStart,
  callApiCountry,
  callApiValidationStart,
  verifykitCallApiInit,
  verifykitCallApiCountry,
  verifykitCallApiStart,
  verifykitCallApiCheck,
  callApiVerifykitResult,
  getcontactDecrypt,
} from '@/lib/getcontact';
import { config } from '@/lib/config';
import crypto from 'crypto';

interface SessionData {
  phoneNumber: string;
  clientDeviceId: string;
  token: string;
  finalKey: string;
  deeplink?: string;
  reference?: string;
}

// BUG FIX: Generate 16 hex chars like PHP does (was UUID format)
function generateClientDeviceId(): string {
  return crypto.randomBytes(8).toString('hex').toLowerCase();
}

// Helper to parse API response and optionally decrypt
function parseApiResponse(apiResult: { httpCode: number; body: string }, finalKey?: string) {
  const parsed = JSON.parse(apiResult.body);
  let result = parsed;
  if (finalKey && parsed.data && typeof parsed.data === 'string') {
    try {
      const decrypted = getcontactDecrypt(parsed.data, finalKey);
      result = { ...parsed, data: JSON.parse(decrypted) };
    } catch {
      // Data might not be encrypted
    }
  }
  return { parsed: result, httpCode: apiResult.httpCode };
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phase = searchParams.get('phase');

  if (!phase || !['1', '2', '3'].includes(phase)) {
    return NextResponse.json(
      { message: 'Invalid phase. Must be 1, 2, or 3' },
      { status: 400 }
    );
  }

  try {
    switch (phase) {
      case '1':
        return await handlePhase1(request);
      case '2':
        return await handlePhase2(request);
      case '3':
        return await handlePhase3(request);
      default:
        return NextResponse.json({ message: 'Invalid phase' }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`Generate phase ${phase} error:`, error);
    return NextResponse.json(
      { message: `Phase ${phase} failed: ${error.message}` },
      { status: 500 }
    );
  }
}

async function handlePhase1(request: NextRequest) {
  const body = await request.json();
  const { phoneNumber } = body;

  if (!phoneNumber) {
    return NextResponse.json(
      { message: 'Phone number is required' },
      { status: 400 }
    );
  }

  // Normalize phone number (matching PHP logic)
  let normalizedPhone = phoneNumber.trim().replace(/[-\s]/g, '');
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+62' + normalizedPhone.substring(1);
  } else if (normalizedPhone.startsWith('62') && !normalizedPhone.startsWith('+')) {
    normalizedPhone = '+' + normalizedPhone;
  }

  // Generate unique keys and device ID
  const clientDeviceId = generateClientDeviceId();
  const privateKey = await generateClientPrivateKey();
  const publicKey = await generateClientPublicKey(privateKey);

  // Step 1: Register
  const registerResult = await callApiRegister(publicKey, clientDeviceId);

  // BUG FIX: PHP expects 201 for register, not 200
  if (registerResult.httpCode !== 201) {
    return NextResponse.json(
      { message: 'Registration failed', error: JSON.parse(registerResult.body) },
      { status: 400 }
    );
  }

  const registerParsed = JSON.parse(registerResult.body);

  // BUG FIX: Register returns unencrypted response, token and serverKey are under "result"
  const token = registerParsed?.result?.token || '';
  const serverPublicKey = registerParsed?.result?.serverKey || 0;

  if (!token) {
    return NextResponse.json({ message: 'Invalid token from register' }, { status: 500 });
  }
  if (!serverPublicKey) {
    return NextResponse.json({ message: 'Invalid server key from register' }, { status: 500 });
  }

  const finalKey = await generateFinalKey(privateKey, serverPublicKey);

  if (!finalKey) {
    return NextResponse.json({ message: 'Invalid final key' }, { status: 500 });
  }

  // Step 2: Init Basic
  const initBasicResult = await callApiInitBasic(token, finalKey, clientDeviceId);
  if (initBasicResult.httpCode !== 201) {
    return NextResponse.json(
      { message: 'Init basic failed: ' + initBasicResult.httpCode },
      { status: 400 }
    );
  }

  // Step 3: Ad Settings
  const adSettingsResult = await callApiAdSettings(token, finalKey, clientDeviceId);
  if (adSettingsResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'Ad settings failed: ' + adSettingsResult.httpCode },
      { status: 400 }
    );
  }

  // Step 4: Init Intro
  const initIntroResult = await callApiInitIntro(token, finalKey, clientDeviceId);
  if (initIntroResult.httpCode !== 201) {
    return NextResponse.json(
      { message: 'Init intro failed: ' + initIntroResult.httpCode },
      { status: 400 }
    );
  }

  // BUG FIX: Generate random fullname and email like PHP does (was passing empty strings)
  const fullname = 'User' + Math.floor(Math.random() * 999000 + 1000);
  const email = 'user' + Math.floor(Math.random() * 90000000 + 10000000) + '@gmail.com';

  // Step 5: Email Validate
  const emailResult = await callApiEmailCodeValidateStart(email, fullname, token, finalKey, clientDeviceId);
  if (emailResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'Email code validate start failed: ' + emailResult.httpCode },
      { status: 400 }
    );
  }

  // Step 6: Country
  const countryResult = await callApiCountry(token, finalKey, clientDeviceId);
  if (countryResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'Country failed: ' + countryResult.httpCode },
      { status: 400 }
    );
  }

  // Step 7: Validation Start
  const validationResult = await callApiValidationStart(token, finalKey, clientDeviceId);
  if (validationResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'Validation start failed: ' + validationResult.httpCode },
      { status: 400 }
    );
  }

  // BUG FIX: Strip country prefix for outsidePhoneNumber like PHP does
  let outsidePhoneNumber = normalizedPhone;
  if (outsidePhoneNumber.startsWith('+62')) {
    outsidePhoneNumber = outsidePhoneNumber.substring(3);
  }

  // Step 8: VFK Init — BUG FIX: Use VFK_FINAL_KEY, not getcontact finalKey
  const vfkInitResult = await verifykitCallApiInit(outsidePhoneNumber, clientDeviceId, config.VFK_FINAL_KEY);
  if (vfkInitResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'VFK init failed: ' + vfkInitResult.httpCode },
      { status: 400 }
    );
  }

  // Step 9: VFK Country
  const vfkCountryResult = await verifykitCallApiCountry(clientDeviceId, config.VFK_FINAL_KEY);
  if (vfkCountryResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'VFK country failed: ' + vfkCountryResult.httpCode },
      { status: 400 }
    );
  }

  // BUG FIX: Match PHP — only pass the 4 essential fields, not privateKey/vfkToken/etc.
  const sessionData: SessionData = {
    phoneNumber: normalizedPhone,
    clientDeviceId,
    token,
    finalKey,
  };

  const encryptedSession = encryptData(sessionData);

  return NextResponse.json({
    message: 'Data processed successfully',
    data: encryptedSession,
  });
}

async function handlePhase2(request: NextRequest) {
  const body = await request.json();
  const { data } = body;

  if (!data) {
    return NextResponse.json(
      { message: 'Session data from phase 1 is required' },
      { status: 400 }
    );
  }

  // Decrypt session data
  const decryptedData = decryptData(data);
  if (!decryptedData) {
    return NextResponse.json(
      { message: 'The form data is invalid. Please fill out and submit the form again from the start.' },
      { status: 400 }
    );
  }

  const sessionData: SessionData = typeof decryptedData === 'string'
    ? JSON.parse(decryptedData)
    : decryptedData;

  const { phoneNumber, clientDeviceId, token, finalKey } = sessionData;

  if (!phoneNumber || !clientDeviceId || !token || !finalKey) {
    return NextResponse.json(
      { message: 'The form data is invalid. Please fill out and submit the form again from the start.' },
      { status: 400 }
    );
  }

  // Step 1: VFK Start — BUG FIX: Use VFK_FINAL_KEY
  const vfkStartResult = await verifykitCallApiStart(
    phoneNumber,
    clientDeviceId,
    config.VFK_FINAL_KEY
  );

  if (vfkStartResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'VFK start failed: ' + vfkStartResult.httpCode },
      { status: 400 }
    );
  }

  // BUG FIX: VFK response is encrypted with VFK_FINAL_KEY, must decrypt
  const vfkStartParsed = JSON.parse(vfkStartResult.body);
  let vfkStartData: any;
  try {
    const decryptedVfk = getcontactDecrypt(vfkStartParsed.data, config.VFK_FINAL_KEY);
    vfkStartData = JSON.parse(decryptedVfk);
  } catch {
    return NextResponse.json(
      { message: 'Failed to decrypt VFK start response' },
      { status: 500 }
    );
  }

  // BUG FIX: Parse deeplink from result.deeplink (matching PHP)
  const deeplink = vfkStartData?.result?.deeplink || '';
  if (!deeplink) {
    return NextResponse.json(
      { message: 'Invalid deeplink' },
      { status: 500 }
    );
  }

  // BUG FIX: Extract verification code from deeplink matching PHP pattern
  // PHP: preg_match_all('/\*(.*?)\*/', urldecode($deeplink), $matches)
  // Then checks for format like eipvB-seNwn-CpnN0-B2nkU
  const decodedDeeplink = decodeURIComponent(deeplink);
  const matches = decodedDeeplink.match(/\*(.*?)\*/g);
  let verificationCode = '';

  if (matches) {
    for (const match of matches) {
      const candidate = match.replace(/\*/g, '');
      if (/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$/.test(candidate)) {
        verificationCode = candidate;
        break;
      }
    }
  }

  if (!verificationCode) {
    return NextResponse.json(
      { message: 'Verification code not found in deeplink' },
      { status: 404 }
    );
  }

  // Parse reference
  const reference = vfkStartData?.result?.reference || '';
  if (!reference) {
    return NextResponse.json(
      { message: 'Invalid reference' },
      { status: 500 }
    );
  }

  // Step 2: Validation Start again
  const validationResult = await callApiValidationStart(token, finalKey, clientDeviceId);
  if (validationResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'Validation start failed: ' + validationResult.httpCode },
      { status: 400 }
    );
  }

  // BUG FIX: Match PHP — include deeplink and reference in encrypted session
  const updatedSession: SessionData = {
    phoneNumber,
    clientDeviceId,
    token,
    finalKey,
    deeplink,
    reference,
  };

  const encryptedSession = encryptData(updatedSession);

  return NextResponse.json({
    message: 'Data processed successfully',
    data: encryptedSession,
    verificationCode,
  });
}

async function handlePhase3(request: NextRequest) {
  const body = await request.json();
  const { data } = body;

  if (!data) {
    return NextResponse.json(
      { message: 'Session data from phase 2 is required' },
      { status: 400 }
    );
  }

  // Decrypt session data
  const decryptedData = decryptData(data);
  if (!decryptedData) {
    return NextResponse.json(
      { message: 'The form data is invalid. Please fill out and submit the form again from the start.' },
      { status: 400 }
    );
  }

  const sessionData: SessionData = typeof decryptedData === 'string'
    ? JSON.parse(decryptedData)
    : decryptedData;

  const { phoneNumber, clientDeviceId, token, finalKey, reference } = sessionData;

  if (!phoneNumber || !clientDeviceId || !reference || !finalKey || !token) {
    return NextResponse.json(
      { message: 'The form data is invalid. Please fill out and submit the form again from the start.' },
      { status: 400 }
    );
  }

  // Step 1: VFK Check — BUG FIX: Use VFK_FINAL_KEY
  const vfkCheckResult = await verifykitCallApiCheck(
    reference,
    clientDeviceId,
    config.VFK_FINAL_KEY
  );

  if (vfkCheckResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'VFK check failed: ' + vfkCheckResult.httpCode },
      { status: 400 }
    );
  }

  // BUG FIX: Decrypt VFK response with VFK_FINAL_KEY
  const vfkCheckParsed = JSON.parse(vfkCheckResult.body);
  let vfkCheckData: any;
  try {
    const decryptedVfk = getcontactDecrypt(vfkCheckParsed.data, config.VFK_FINAL_KEY);
    vfkCheckData = JSON.parse(decryptedVfk);
  } catch {
    return NextResponse.json(
      { message: 'Failed to decrypt VFK check response' },
      { status: 500 }
    );
  }

  // BUG FIX: Extract sessionId from result.sessionId
  const sessionId = vfkCheckData?.result?.sessionId || '';
  if (!sessionId) {
    return NextResponse.json(
      { message: 'Invalid session id' },
      { status: 500 }
    );
  }

  // Step 2: VerifyKit Result (getcontact endpoint)
  const verifykitResult = await callApiVerifykitResult(
    sessionId,
    token,
    finalKey,
    clientDeviceId
  );

  if (verifykitResult.httpCode !== 200) {
    return NextResponse.json(
      { message: 'Verifykit result failed: ' + verifykitResult.httpCode },
      { status: 400 }
    );
  }

  // BUG FIX: Decrypt the verifykit-result response with the getcontact finalKey
  const verifykitParsed = JSON.parse(verifykitResult.body);
  let verifykitData: any;
  try {
    const decryptedResult = getcontactDecrypt(verifykitParsed.data, finalKey);
    verifykitData = JSON.parse(decryptedResult);
  } catch {
    return NextResponse.json(
      { message: 'Failed to decrypt verifykit result' },
      { status: 500 }
    );
  }

  // BUG FIX: Extract validationDate from result
  const validationDate = verifykitData?.result?.validationDate || '';
  if (!validationDate) {
    return NextResponse.json(
      { message: 'Invalid validation date' },
      { status: 500 }
    );
  }

  // Return final credentials (matching PHP response format)
  return NextResponse.json({
    message: 'Data processed successfully',
    data: {
      clientDeviceId,
      token,
      finalKey,
      validationDate,
    },
  });
}
