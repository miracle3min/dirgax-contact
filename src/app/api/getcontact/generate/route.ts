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
import crypto from 'crypto';

interface SessionData {
  phoneNumber: string;
  clientDeviceId: string;
  token: string;
  finalKey: string;
  privateKey: number;
  vfkToken?: string;
  validationToken?: string;
  deeplink?: string;
  verificationCode?: string;
  reference?: string;
  sessionId?: string;
}

function generateClientDeviceId(): string {
  return crypto.randomUUID();
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

  // Generate unique keys and device ID
  const clientDeviceId = generateClientDeviceId();
  const privateKey = await generateClientPrivateKey();
  const publicKey = await generateClientPublicKey(privateKey);

  // Step 1: Register
  const registerResult = await callApiRegister(publicKey, clientDeviceId);
  const registerParsed = parseApiResponse(registerResult);

  if (registerResult.httpCode !== 200 && registerResult.httpCode !== 201) {
    return NextResponse.json(
      { message: 'Registration failed', error: registerParsed.parsed },
      { status: 400 }
    );
  }

  // Extract server public key and compute final key
  const serverPublicKey = registerParsed.parsed.data?.serverPublicKey ||
    registerParsed.parsed.data?.server_public_key || 0;
  const token = registerParsed.parsed.data?.token || '';
  const finalKey = await generateFinalKey(privateKey, serverPublicKey);

  // Step 2: Init Basic
  await callApiInitBasic(token, finalKey, clientDeviceId);

  // Step 3: Ad Settings
  await callApiAdSettings(token, finalKey, clientDeviceId);

  // Step 4: Init Intro
  await callApiInitIntro(token, finalKey, clientDeviceId);

  // Step 5: Email Validate
  await callApiEmailCodeValidateStart('', '', token, finalKey, clientDeviceId);

  // Step 6: Country
  await callApiCountry(token, finalKey, clientDeviceId);

  // Step 7: Validation Start
  const validationResult = await callApiValidationStart(token, finalKey, clientDeviceId);
  const validationParsed = parseApiResponse(validationResult, finalKey);
  const validationToken = validationParsed.parsed.data?.validationToken || '';

  // Step 8: VFK Init
  const vfkInitResult = await verifykitCallApiInit(phoneNumber, clientDeviceId, finalKey);
  const vfkInitParsed = parseApiResponse(vfkInitResult, finalKey);
  const vfkToken = vfkInitParsed.parsed.data?.vfkToken ||
    vfkInitParsed.parsed.data?.token || '';

  // Step 9: VFK Country
  await verifykitCallApiCountry(clientDeviceId, finalKey);

  // Encrypt session data for next phase
  const sessionData: SessionData = {
    phoneNumber,
    clientDeviceId,
    token,
    finalKey,
    privateKey,
    vfkToken,
    validationToken,
  };

  const encryptedSession = encryptData(JSON.stringify(sessionData));

  return NextResponse.json({
    message: 'Phase 1 complete. Proceed to phase 2.',
    phase: 1,
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
  let sessionData: SessionData;
  try {
    sessionData = JSON.parse(decryptData(data));
  } catch {
    return NextResponse.json(
      { message: 'Invalid or corrupted session data' },
      { status: 400 }
    );
  }

  const { phoneNumber, clientDeviceId, token, finalKey } = sessionData;

  // Step 1: VFK Start
  const vfkStartResult = await verifykitCallApiStart(
    phoneNumber,
    clientDeviceId,
    finalKey
  );
  const vfkStartParsed = parseApiResponse(vfkStartResult, finalKey);

  // Parse deeplink and reference from response
  const deeplink = vfkStartParsed.parsed.data?.deeplink ||
    vfkStartParsed.parsed.data?.url || '';
  const reference = vfkStartParsed.parsed.data?.reference || '';
  let verificationCode = '';

  // Try to extract verification code from deeplink
  if (deeplink) {
    const match = deeplink.match(/code[=\/]([a-zA-Z0-9]+)/);
    if (match) {
      verificationCode = match[1];
    }
  }

  // If no code from deeplink, try direct field
  if (!verificationCode) {
    verificationCode = vfkStartParsed.parsed.data?.verificationCode ||
      vfkStartParsed.parsed.data?.code || '';
  }

  // Step 2: Validation Start again with verification context
  await callApiValidationStart(token, finalKey, clientDeviceId);

  // Update session data
  sessionData.deeplink = deeplink;
  sessionData.verificationCode = verificationCode;
  sessionData.reference = reference;

  const encryptedSession = encryptData(JSON.stringify(sessionData));

  return NextResponse.json({
    message: 'Phase 2 complete. Proceed to phase 3.',
    phase: 2,
    data: encryptedSession,
    verificationCode: verificationCode || 'Check your phone for verification',
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
  let sessionData: SessionData;
  try {
    sessionData = JSON.parse(decryptData(data));
  } catch {
    return NextResponse.json(
      { message: 'Invalid or corrupted session data' },
      { status: 400 }
    );
  }

  const { clientDeviceId, token, finalKey, reference, sessionId } = sessionData;

  // Step 1: VFK Check
  const vfkCheckResult = await verifykitCallApiCheck(
    reference || '',
    clientDeviceId,
    finalKey
  );
  const vfkCheckParsed = parseApiResponse(vfkCheckResult, finalKey);

  // Extract sessionId from vfk check result
  const resolvedSessionId = sessionId ||
    vfkCheckParsed.parsed.data?.sessionId ||
    vfkCheckParsed.parsed.data?.session_id || '';

  // Step 2: VerifyKit Result
  const verifykitResult = await callApiVerifykitResult(
    resolvedSessionId,
    token,
    finalKey,
    clientDeviceId
  );
  const verifykitParsed = parseApiResponse(verifykitResult, finalKey);

  // Return final credentials
  return NextResponse.json({
    message: 'Credential generation complete!',
    phase: 3,
    credentials: {
      clientDeviceId: sessionData.clientDeviceId,
      token: sessionData.token,
      finalKey: sessionData.finalKey,
      validationDate: new Date().toISOString(),
    },
    result: verifykitParsed.parsed,
  });
}
