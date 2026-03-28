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
    'x-req-timestamp': timestamp,
    'x-country-code': 'id',
    'x-encrypted': encrypted ? '1' : '0',
    'x-req-signature': signature,
  };

  // Only add x-token when it's not empty
  if (token) {
    headers['x-token'] = token;
  }

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
  // BUG FIX: Match PHP reference — include countryCode, source should be "search", no searchSource
  const body = {
    countryCode: config.GTC_COUNTRY_CODE,
    phoneNumber,
    source: 'search',
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
  // BUG FIX: Match PHP reference — include countryCode and source
  const body = {
    countryCode: config.GTC_COUNTRY_CODE,
    phoneNumber,
    source: 'profile',
    token,
  };
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
  // BUG FIX: Match PHP reference — include all device/carrier fields
  const body = {
    carrierCountryCode: config.GTC_CARRIER_COUNTRY_CODE,
    carrierName: config.GTC_CARRIER_NAME,
    carrierNetworkCode: config.GTC_CARRIER_NETWORK_CODE,
    countryCode: config.GTC_COUNTRY_CODE,
    deepLink: null,
    deviceName: config.GTC_DEVICE_NAME,
    deviceType: config.GTC_DEVICE_TYPE,
    email: null,
    notificationToken: '',
    oldToken: null,
    peerKey: clientPublicKey,
    timeZone: config.GTC_TIME_ZONE,
    token: '',
  };
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
  // BUG FIX: Match PHP reference — include carrier/device fields
  const body = {
    carrierCountryCode: config.GTC_CARRIER_COUNTRY_CODE,
    carrierName: config.GTC_CARRIER_NAME,
    carrierNetworkCode: config.GTC_CARRIER_NETWORK_CODE,
    countryCode: config.GTC_COUNTRY_CODE,
    deviceName: config.GTC_DEVICE_NAME,
    notificationToken: '',
    timeZone: config.GTC_TIME_ZONE,
    token,
  };
  return callGetContactAPI('/v2.8/init-basic', body, finalKey, token, clientDeviceId);
}

export async function callApiAdSettings(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  // BUG FIX: Match PHP reference — include source field
  const body = {
    source: 'init',
    token,
  };
  return callGetContactAPI('/v2.8/ad-settings', body, finalKey, token, clientDeviceId);
}

export async function callApiInitIntro(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  // BUG FIX: Match PHP reference — include carrier/device fields
  const body = {
    carrierCountryCode: config.GTC_CARRIER_COUNTRY_CODE,
    carrierName: config.GTC_CARRIER_NAME,
    carrierNetworkCode: config.GTC_CARRIER_NETWORK_CODE,
    countryCode: config.GTC_COUNTRY_CODE,
    deviceName: config.GTC_DEVICE_NAME,
    hasRouting: false,
    notificationToken: '',
    timeZone: config.GTC_TIME_ZONE,
    token,
  };
  return callGetContactAPI('/v2.8/init-intro', body, finalKey, token, clientDeviceId);
}

export async function callApiEmailCodeValidateStart(
  email: string,
  fullname: string,
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  // BUG FIX: Use "fullName" (capital N) to match PHP reference, and fix endpoint path
  const body = { email, fullName: fullname, token };
  return callGetContactAPI(
    '/v2.8/email-code-validate/start', // BUG FIX: was "/v2.8/email-code-validate-start"
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
  // BUG FIX: Match PHP reference — include countryCode (uppercase)
  const body = {
    countryCode: config.GTC_COUNTRY_CODE.toUpperCase(),
    token,
  };
  return callGetContactAPI('/v2.8/country', body, finalKey, token, clientDeviceId);
}

export async function callApiValidationStart(
  token: string,
  finalKey: string,
  clientDeviceId?: string
): Promise<ApiResponse> {
  // BUG FIX: Match PHP reference — include app, countryCode, notificationToken
  const body = {
    app: 'verifykit',
    countryCode: config.GTC_COUNTRY_CODE,
    notificationToken: '',
    token,
  };
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
  // BUG FIX: Match PHP reference — include all null fields
  const body = {
    blockCountrySpam: null,
    communicationSettings: null,
    howDoILook: null,
    landing: null,
    notificationSettings: null,
    privateMode,
    serviceNumber: null,
    showCommunication: null,
    showPrivatePopup: null,
    telegramUsed: null,
    whatsappUsed: null,
    whoIsHere: null,
    token,
  };
  return callGetContactAPI(
    '/v2.8/profile/settings', // BUG FIX: was "/v2.8/profile-settings"
    body,
    finalKey,
    token,
    clientDeviceId
  );
}

// ---------------------------------------------------------------------------
// VerifyKit API functions
// BUG FIX: Complete rewrite to match PHP reference
// - Use VFK_HMAC_SECRET_KEY for signatures
// - Use VFK_FINAL_KEY for encryption
// - Use v2.0 endpoints (was v1.0)
// - Use correct VFK headers
// - Send encrypted body like PHP does
// ---------------------------------------------------------------------------

function buildVFKHeaders(
  clientDeviceId: string,
  timestamp: string,
  signature: string
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-VFK-Client-Device-Id': clientDeviceId || config.VFK_CLIENT_DEVICE_ID,
    'X-VFK-Client-Key': config.VFK_CLIENT_KEY,
    'X-VFK-Sdk-Version': config.VFK_SDK_VERSION,
    'X-VFK-Os': config.VFK_OS,
    'X-VFK-App-Version': config.VFK_APP_VERSION,
    'X-VFK-Encrypted': '1',
    'X-VFK-Lang': config.VFK_LANG,
    'X-VFK-Req-Timestamp': timestamp,
    'X-VFK-Req-Signature': signature,
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
  const bodyJson = JSON.stringify(bodyObj);
  const timestamp = Date.now().toString();

  // BUG FIX: Use VFK_HMAC_SECRET_KEY for signature (was not signing at all)
  const signature = getcontactSignature(
    timestamp,
    bodyJson,
    config.VFK_HMAC_SECRET_KEY
  );

  const headers = buildVFKHeaders(clientDeviceId, timestamp, signature);

  // BUG FIX: VFK calls are encrypted with VFK_FINAL_KEY
  const encryptedBody = JSON.stringify({
    data: getcontactEncrypt(bodyJson, config.VFK_FINAL_KEY),
  });

  const response = await fetch(`${config.VFK_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: encryptedBody,
  });
  const responseBody = await response.text();
  return { httpCode: response.status, body: responseBody };
}

export async function verifykitCallApiInit(
  outsidePhoneNumber: string,
  clientDeviceId: string,
  _finalKey: string
): Promise<VFKResponse> {
  // BUG FIX: Match PHP reference — full body with all fields
  const body = {
    isCallPermissionGranted: false,
    countryCode: config.GTC_COUNTRY_CODE,
    deviceName: 'marlin',
    installedApps: '{"whatsapp":1,"telegram":0,"viber":0}',
    outsideCountryCode: config.GTC_OUTSIDE_COUNTRY_CODE,
    outsidePhoneNumber,
    timezone: config.GTC_TIME_ZONE,
    bundleId: config.GTC_BUNDLE_ID,
  };
  // BUG FIX: Use v2.0 endpoint (was v1.0)
  return callVFKAPI('/v2.0/init', body, clientDeviceId);
}

export async function verifykitCallApiCountry(
  clientDeviceId: string,
  _finalKey: string
): Promise<VFKResponse> {
  // BUG FIX: Match PHP reference — include countryCode and bundleId
  const body = {
    countryCode: config.GTC_COUNTRY_CODE,
    bundleId: config.GTC_BUNDLE_ID,
  };
  // BUG FIX: Use v2.0 endpoint (was v1.0)
  return callVFKAPI('/v2.0/country', body, clientDeviceId);
}

export async function verifykitCallApiStart(
  phoneNumber: string,
  clientDeviceId: string,
  _finalKey: string
): Promise<VFKResponse> {
  // BUG FIX: Match PHP reference — include countryCode, app, bundleId
  const body = {
    countryCode: config.GTC_COUNTRY_CODE,
    phoneNumber,
    app: 'whatsapp',
    bundleId: config.GTC_BUNDLE_ID,
  };
  // BUG FIX: Use v2.0 endpoint (was v1.0)
  return callVFKAPI('/v2.0/start', body, clientDeviceId);
}

export async function verifykitCallApiCheck(
  reference: string,
  clientDeviceId: string,
  _finalKey: string
): Promise<VFKResponse> {
  // BUG FIX: Match PHP reference — include bundleId
  const body = {
    reference,
    bundleId: config.GTC_BUNDLE_ID,
  };
  // BUG FIX: Use v2.0 endpoint (was v1.0)
  return callVFKAPI('/v2.0/check', body, clientDeviceId);
}

// ---------------------------------------------------------------------------
// External key generation (naufalist tools API)
// BUG FIX: URLs and methods completely wrong — fixed to match PHP reference
// ---------------------------------------------------------------------------

export async function generateClientPrivateKey(): Promise<number> {
  // BUG FIX: Correct URL path (was /getcontact/generate-private-key)
  const res = await fetch(`${config.TOOLS_API_BASE_URL}/getcontact/api/credentials/private-key`);
  const data = await res.json();
  // BUG FIX: Response field is "data" not "privateKey"
  return data.data;
}

export async function generateClientPublicKey(privateKey: number): Promise<number> {
  // BUG FIX: Should be GET with query param, not POST with JSON body
  const res = await fetch(
    `${config.TOOLS_API_BASE_URL}/getcontact/api/credentials/public-key?privateKey=${privateKey}`
  );
  const data = await res.json();
  // BUG FIX: Response field is "data" not "publicKey"
  return data.data;
}

export async function generateFinalKey(
  privateKey: number,
  serverPublicKey: number
): Promise<string> {
  // BUG FIX: Should be GET with query params, not POST with JSON body
  const res = await fetch(
    `${config.TOOLS_API_BASE_URL}/getcontact/api/credentials/final-key?privateKey=${privateKey}&publicKey=${serverPublicKey}`
  );
  const data = await res.json();
  // BUG FIX: Response field is "data" not "finalKey"
  return data.data;
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
