// GetContact API functions — server-only (API routes)
import crypto from 'crypto';
import { config } from './config';

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

/** HMAC-SHA256 signature: base64(hmac_sha256("timestamp-message", hex2bin(key))) */
export function getcontactSignature(
  timestamp: string,
  message: string,
  key: string
): string {
  const hmac = crypto.createHmac('sha256', Buffer.from(key, 'hex'));
  hmac.update(`${timestamp}-${message}`);
  return hmac.digest('base64');
}

/** AES-256-ECB encrypt */
export function getcontactEncrypt(data: string, passphrase: string): string {
  const cipher = crypto.createCipheriv(
    'aes-256-ecb',
    Buffer.from(passphrase, 'hex'),
    null
  );
  cipher.setAutoPadding(true);
  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ]);
  return encrypted.toString('base64');
}

/** AES-256-ECB decrypt */
export function getcontactDecrypt(data: string, passphrase: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-ecb',
    Buffer.from(passphrase, 'hex'),
    null
  );
  decipher.setAutoPadding(true);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

// ---------------------------------------------------------------------------
// Header builder
// ---------------------------------------------------------------------------

function buildHeaders(
  token: string,
  timestamp: string,
  signature: string,
  clientDeviceId?: string,
  encrypted: boolean = true
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-os': config.GTC_ANDROID_OS,
    'x-app-version': config.GTC_APP_VERSION,
    'x-client-device-id': clientDeviceId || config.GTC_CLIENT_DEVICE_ID,
    'x-lang': config.GTC_LANG,
    'x-token': token,
    'x-req-timestamp': timestamp,
    'x-country-code': config.GTC_COUNTRY_CODE,
    'x-encrypted': encrypted ? '1' : '0',
    'x-req-signature': signature,
  };
  return headers;
}

// ---------------------------------------------------------------------------
// Generic API caller
// ---------------------------------------------------------------------------

interface ApiResponse {
  httpCode: number;
  body: string;
}

async function callGetContactAPI(
  endpoint: string,
  bodyObj: Record<string, any>,
  finalKey: string,
  token: string,
  clientDeviceId?: string,
  encrypted: boolean = true
): Promise<ApiResponse> {
  const bodyJson = JSON.stringify(bodyObj);
  const timestamp = Date.now().toString();
  const signature = getcontactSignature(
    timestamp,
    bodyJson,
    config.GTC_HMAC_SECRET_KEY
  );

  const postBody = encrypted
    ? JSON.stringify({ data: getcontactEncrypt(bodyJson, finalKey) })
    : bodyJson;

  const headers = buildHeaders(
    token,
    timestamp,
    signature,
    clientDeviceId,
    encrypted
  );

  // Remove x-token when empty (e.g. register calls)
  if (!token) {
    delete headers['x-token'];
  }

  const response = await fetch(
    `${config.GTC_API_BASE_URL}${endpoint}`,
    {
      method: 'POST',
      headers,
      body: postBody,
    }
  );

  const responseBody = await response.text();
  return {
    httpCode: response.status,
    body: responseBody,
  };
}

// ---------------------------------------------------------------------------
// GetContact API functions
// ---------------------------------------------------------------------------

export async function callApiSubscription(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { token };
  return callGetContactAPI('/v2.8/subscription', body, finalKey, token, clientDeviceId);
}

export async function callApiSearch(
  phoneNumber: string,
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = {
    phoneNumber,
    source: config.GTC_SOURCE,
    searchSource: config.GTC_SEARCH_SOURCE,
    token,
  };
  return callGetContactAPI('/v2.8/search', body, finalKey, token, clientDeviceId);
}

export async function callApiNumberDetail(
  phoneNumber: string,
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { phoneNumber, token };
  return callGetContactAPI('/v2.8/number-detail', body, finalKey, token, clientDeviceId);
}

export async function callApiVerifyCode(
  validationCode: string,
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { validationCode, token };
  return callGetContactAPI('/v2.8/verify-code', body, finalKey, token, clientDeviceId);
}

export async function callApiRefreshCode(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { token };
  return callGetContactAPI('/v2.8/refresh-code', body, finalKey, token, clientDeviceId);
}

export async function callApiRegister(
  clientPublicKey: number,
  clientDeviceId: string
): Promise<ApiResponse> {
  const body = { clientPublicKey };
  // Register is NOT encrypted and has no token
  return callGetContactAPI(
    '/v2.8/register',
    body,
    '', // no finalKey
    '', // no token
    clientDeviceId,
    false // not encrypted
  );
}

export async function callApiInitBasic(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { token };
  return callGetContactAPI('/v2.8/init-basic', body, finalKey, token, clientDeviceId);
}

export async function callApiAdSettings(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { token };
  return callGetContactAPI('/v2.8/ad-settings', body, finalKey, token, clientDeviceId);
}

export async function callApiInitIntro(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { token };
  return callGetContactAPI('/v2.8/init-intro', body, finalKey, token, clientDeviceId);
}

export async function callApiEmailCodeValidateStart(
  email: string,
  fullname: string,
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { email, fullname, token };
  return callGetContactAPI(
    '/v2.8/email-code-validate-start',
    body,
    finalKey,
    token,
    clientDeviceId
  );
}

export async function callApiCountry(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { token };
  return callGetContactAPI('/v2.8/country', body, finalKey, token, clientDeviceId);
}

export async function callApiValidationStart(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { token };
  return callGetContactAPI('/v2.8/validation-start', body, finalKey, token, clientDeviceId);
}

export async function callApiVerifykitResult(
  sessionId: string,
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { sessionId, token };
  return callGetContactAPI(
    '/v2.8/verifykit-result',
    body,
    finalKey,
    token,
    clientDeviceId
  );
}

export async function callApiProfileSettings(
  privateMode: boolean,
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  const body = { privateMode, token };
  return callGetContactAPI(
    '/v2.8/profile-settings',
    body,
    finalKey,
    token,
    clientDeviceId
  );
}

// ---------------------------------------------------------------------------
// VerifyKit API functions
// ---------------------------------------------------------------------------

function buildVFKHeaders(clientDeviceId: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-VFK-App-Key': config.VFK_APP_KEY,
    'X-VFK-Server-Key': config.VFK_SERVER_KEY,
    'X-VFK-Client-IP': config.VFK_CLIENT_IP,
    'X-VFK-Client-Agent': clientDeviceId,
    'X-VFK-Lang': config.VFK_LANG,
  };
}

interface VFKResponse {
  httpCode: number;
  body: string;
}

async function callVFKAPI(
  endpoint: string,
  bodyObj: Record<string, any>,
  clientDeviceId: string
): Promise<VFKResponse> {
  const headers = buildVFKHeaders(clientDeviceId);
  const response = await fetch(`${config.VFK_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyObj),
  });
  const responseBody = await response.text();
  return { httpCode: response.status, body: responseBody };
}

export async function verifykitCallApiInit(
  outsidePhoneNumber: string,
  clientDeviceId: string,
  _finalKey: string
): Promise<VFKResponse> {
  const body = { outsidePhoneNumber, app: 'getcontact' };
  return callVFKAPI('/v1.0/init', body, clientDeviceId);
}

export async function verifykitCallApiCountry(
  clientDeviceId: string,
  _finalKey: string
): Promise<VFKResponse> {
  return callVFKAPI('/v1.0/country', {}, clientDeviceId);
}

export async function verifykitCallApiStart(
  phoneNumber: string,
  clientDeviceId: string,
  _finalKey: string
): Promise<VFKResponse> {
  const body = { phoneNumber, countryCode: config.GTC_COUNTRY_CODE };
  return callVFKAPI('/v1.0/start', body, clientDeviceId);
}

export async function verifykitCallApiCheck(
  reference: string,
  clientDeviceId: string,
  _finalKey: string
): Promise<VFKResponse> {
  const body = { reference };
  return callVFKAPI('/v1.0/check', body, clientDeviceId);
}

// ---------------------------------------------------------------------------
// External key generation (naufalist tools API)
// ---------------------------------------------------------------------------

export async function generateClientPrivateKey(): Promise<number> {
  const res = await fetch(`${config.TOOLS_API_BASE_URL}/getcontact/generate-private-key`);
  const data = await res.json();
  return data.privateKey;
}

export async function generateClientPublicKey(privateKey: number): Promise<number> {
  const res = await fetch(`${config.TOOLS_API_BASE_URL}/getcontact/generate-public-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ privateKey }),
  });
  const data = await res.json();
  return data.publicKey;
}

export async function generateFinalKey(
  privateKey: number,
  serverPublicKey: number
): Promise<string> {
  const res = await fetch(`${config.TOOLS_API_BASE_URL}/getcontact/generate-final-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ privateKey, serverPublicKey }),
  });
  const data = await res.json();
  return data.finalKey;
}

// ---------------------------------------------------------------------------
// Response parser helper
// ---------------------------------------------------------------------------

export function parseApiResponse(
  response: ApiResponse,
  finalKey?: string
): { meta: any; result: any; raw: string } {
  try {
    const json = JSON.parse(response.body);

    // If the response contains encrypted data, decrypt it
    if (json.data && finalKey) {
      try {
        const decrypted = getcontactDecrypt(json.data, finalKey);
        const parsed = JSON.parse(decrypted);
        return { meta: parsed.meta || json.meta, result: parsed.result, raw: decrypted };
      } catch {
        // Not encrypted or decryption failed, return as-is
      }
    }

    return { meta: json.meta, result: json.result, raw: response.body };
  } catch {
    return { meta: null, result: null, raw: response.body };
  }
}
