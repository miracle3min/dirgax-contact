# 🐛 Bug Report — dirgax-contact

Perbandingan dengan referensi: [naufalist/getcontact-web](https://github.com/naufalist/getcontact-web)

---

## Ringkasan

Ditemukan **18 bug** di berbagai file. Semua sudah diperbaiki.

---

## 1. API Endpoint Path Salah

### `callApiEmailCodeValidateStart`
- ❌ **Sebelum:** `/v2.8/email-code-validate-start`
- ✅ **Sesudah:** `/v2.8/email-code-validate/start`

### `callApiProfileSettings`
- ❌ **Sebelum:** `/v2.8/profile-settings`
- ✅ **Sesudah:** `/v2.8/profile/settings`

**File:** `src/lib/getcontact.ts`

---

## 2. Request Body Tidak Lengkap (7 Fungsi)

### `callApiSearch`
- ❌ Tidak ada `countryCode`, `source` = `"search_page"`, ada `searchSource`
- ✅ Tambah `countryCode`, `source` = `"search"`, hapus `searchSource`

### `callApiNumberDetail`
- ❌ Hanya `{ phoneNumber, token }`
- ✅ Tambah `countryCode` dan `source: "profile"`

### `callApiRegister`
- ❌ Hanya `{ clientPublicKey }`
- ✅ Tambah semua field: `carrierCountryCode`, `carrierName`, `carrierNetworkCode`, `countryCode`, `deepLink`, `deviceName`, `deviceType`, `email`, `notificationToken`, `oldToken`, `peerKey`, `timeZone`, `token`

### `callApiInitBasic`
- ❌ Hanya `{ token }`
- ✅ Tambah `carrierCountryCode`, `carrierName`, `carrierNetworkCode`, `countryCode`, `deviceName`, `notificationToken`, `timeZone`

### `callApiAdSettings`
- ❌ Hanya `{ token }`
- ✅ Tambah `source: "init"`

### `callApiInitIntro`
- ❌ Hanya `{ token }`
- ✅ Tambah `carrierCountryCode`, `carrierName`, `carrierNetworkCode`, `countryCode`, `deviceName`, `hasRouting`, `notificationToken`, `timeZone`

### `callApiCountry`
- ❌ Hanya `{ token }`
- ✅ Tambah `countryCode` (uppercase)

### `callApiValidationStart`
- ❌ Hanya `{ token }`
- ✅ Tambah `app: "verifykit"`, `countryCode`, `notificationToken`

### `callApiProfileSettings`
- ❌ Hanya `{ privateMode, token }`
- ✅ Tambah semua null fields: `blockCountrySpam`, `communicationSettings`, `howDoILook`, `landing`, `notificationSettings`, `serviceNumber`, `showCommunication`, `showPrivatePopup`, `telegramUsed`, `whatsappUsed`, `whoIsHere`

### `callApiEmailCodeValidateStart`
- ❌ Field `fullname` (lowercase n)
- ✅ Ganti jadi `fullName` (capital N)

**File:** `src/lib/getcontact.ts`

---

## 3. Key Generation API URL & Method Salah

### `generateClientPrivateKey`
- ❌ `GET /getcontact/generate-private-key` → response `{ privateKey }`
- ✅ `GET /getcontact/api/credentials/private-key` → response `{ data }`

### `generateClientPublicKey`
- ❌ `POST /getcontact/generate-public-key` dengan JSON body → response `{ publicKey }`
- ✅ `GET /getcontact/api/credentials/public-key?privateKey=...` → response `{ data }`

### `generateFinalKey`
- ❌ `POST /getcontact/generate-final-key` dengan JSON body → response `{ finalKey }`
- ✅ `GET /getcontact/api/credentials/final-key?privateKey=...&publicKey=...` → response `{ data }`

**File:** `src/lib/getcontact.ts`

---

## 4. VerifyKit Integration Salah Total

### API Base URL
- ❌ `https://web-rest.verifykit.com`
- ✅ `https://api.verifykit.com`

### API Version
- ❌ Endpoint `/v1.0/*`
- ✅ Endpoint `/v2.0/*`

### Headers
- ❌ `X-VFK-App-Key`, `X-VFK-Server-Key`, `X-VFK-Client-IP`, `X-VFK-Client-Agent`, `X-VFK-Lang`
- ✅ `X-VFK-Client-Device-Id`, `X-VFK-Client-Key`, `X-VFK-Sdk-Version`, `X-VFK-Os`, `X-VFK-App-Version`, `X-VFK-Encrypted`, `X-VFK-Lang`, `X-VFK-Req-Timestamp`, `X-VFK-Req-Signature`

### Enkripsi
- ❌ VFK calls tidak dienkripsi
- ✅ VFK calls dienkripsi dengan `VFK_FINAL_KEY` menggunakan AES-256-ECB

### Signature
- ❌ Tidak ada signature
- ✅ HMAC-SHA256 dengan `VFK_HMAC_SECRET_KEY`

### Request Bodies
- ❌ `verifykitCallApiInit`: hanya `{ outsidePhoneNumber, app }`
- ✅ Lengkap: `isCallPermissionGranted`, `countryCode`, `deviceName`, `installedApps`, `outsideCountryCode`, `outsidePhoneNumber`, `timezone`, `bundleId`

- ❌ `verifykitCallApiCountry`: kosong `{}`
- ✅ `{ countryCode, bundleId }`

- ❌ `verifykitCallApiStart`: `{ phoneNumber, countryCode }`
- ✅ `{ countryCode, phoneNumber, app: "whatsapp", bundleId }`

- ❌ `verifykitCallApiCheck`: `{ reference }`
- ✅ `{ reference, bundleId }`

**File:** `src/lib/getcontact.ts`

---

## 5. Client Device ID Format Salah

- ❌ `crypto.randomUUID()` → format UUID `550e8400-e29b-41d4-a716-446655440000`
- ✅ `crypto.randomBytes(8).toString('hex')` → 16 hex chars `174680a6f1765b5f`

**File:** `src/app/api/getcontact/generate/route.ts`

---

## 6. Config Values Hilang

Banyak config constants yang dibutuhkan PHP tidak ada di dirgax:
- `GTC_CARRIER_COUNTRY_CODE`, `GTC_CARRIER_NAME`, `GTC_CARRIER_NETWORK_CODE`
- `GTC_DEVICE_NAME`, `GTC_DEVICE_TYPE`, `GTC_TIME_ZONE`
- `GTC_OUTSIDE_COUNTRY_CODE`, `GTC_BUNDLE_ID`
- `VFK_HMAC_SECRET_KEY`, `VFK_CLIENT_KEY`, `VFK_FINAL_KEY`, `VFK_SDK_VERSION`, `VFK_OS`, `VFK_APP_VERSION`, `VFK_CLIENT_DEVICE_ID`

**File:** `src/lib/config.ts`, `.env.example`

---

## 7. Generate Credentials Phase Logic Salah

### Phase 1
- ❌ Tidak validate HTTP status codes per-step
- ❌ Passing empty strings ke `callApiEmailCodeValidateStart` (bukan random name/email)
- ❌ Register response parsing salah (`data.serverPublicKey` instead of `result.serverKey`)
- ❌ Menyimpan `privateKey`, `vfkToken`, `validationToken` ke session (tidak perlu)
- ✅ Validate semua status codes, generate random fullname/email, parse `result.token` & `result.serverKey`, simpan hanya 4 field essential

### Phase 2
- ❌ VFK response tidak didekripsi dengan `VFK_FINAL_KEY`
- ❌ Deeplink parsing pattern salah (`code[=\/]` vs `\*(.*?)\*`)
- ✅ Dekripsi VFK response, parse deeplink dengan regex yang benar

### Phase 3
- ❌ VFK check response tidak didekripsi
- ❌ Response format berbeda dari PHP
- ✅ Dekripsi dengan `VFK_FINAL_KEY`, extract `sessionId`, return format matching PHP

**File:** `src/app/api/getcontact/generate/route.ts`

---

## 8. Header Builder Bug

- ❌ `x-token` selalu ditambahkan lalu dihapus setelahnya
- ✅ `x-token` hanya ditambahkan jika ada value

**File:** `src/lib/getcontact.ts`

---

## File yang Diubah

| File | Status |
|------|--------|
| `src/lib/config.ts` | ✅ Fixed — Tambah 15+ config values |
| `src/lib/getcontact.ts` | ✅ Fixed — Rewrite besar (18+ bug) |
| `src/lib/encrypt.ts` | ✅ Fixed — Minor input handling |
| `src/app/api/getcontact/generate/route.ts` | ✅ Fixed — Phase logic rewrite |
| `.env.example` | ✅ Fixed — Tambah env vars baru |
