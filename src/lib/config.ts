// Configuration constants - reads from environment with PHP-matching defaults

export const config = {
  // GetContact API
  GTC_API_BASE_URL: process.env.GTC_API_BASE_URL || 'https://pbssrv-centralevents.com',
  GTC_HMAC_SECRET_KEY:
    process.env.GTC_HMAC_SECRET_KEY ||
    '31426764382a642f3a6665497235466f3d236d5d785b722b4c657457442a495b494524324866782a2364292478587a78662d7a7b7578593f71703e2b7e365762',
  GTC_ANDROID_OS: process.env.GTC_ANDROID_OS || 'android 9',
  GTC_APP_VERSION: process.env.GTC_APP_VERSION || '8.4.0',
  GTC_CLIENT_DEVICE_ID: process.env.GTC_CLIENT_DEVICE_ID || '174680a6f1765b5f',
  GTC_LANG: process.env.GTC_LANG || 'en_US',
  GTC_COUNTRY_CODE: process.env.GTC_COUNTRY_CODE || 'id',
  GTC_SOURCE: process.env.GTC_SOURCE || 'search',
  GTC_SEARCH_SOURCE: process.env.GTC_SEARCH_SOURCE || '',

  // GetContact device/carrier info (needed for register, init-basic, init-intro, etc.)
  GTC_CARRIER_COUNTRY_CODE: process.env.GTC_CARRIER_COUNTRY_CODE || '510',
  GTC_CARRIER_NAME: process.env.GTC_CARRIER_NAME || 'Indosat Ooredoo',
  GTC_CARRIER_NETWORK_CODE: process.env.GTC_CARRIER_NETWORK_CODE || '01',
  GTC_DEVICE_NAME: process.env.GTC_DEVICE_NAME || 'SM-G977N',
  GTC_DEVICE_TYPE: process.env.GTC_DEVICE_TYPE || 'Android',
  GTC_TIME_ZONE: process.env.GTC_TIME_ZONE || 'Asia/Bangkok',
  GTC_OUTSIDE_COUNTRY_CODE: process.env.GTC_OUTSIDE_COUNTRY_CODE || 'ID',
  GTC_BUNDLE_ID: process.env.GTC_BUNDLE_ID || 'app.source.getcontact',

  // VerifyKit
  VFK_API_BASE_URL: process.env.VFK_API_BASE_URL || 'https://api.verifykit.com',
  VFK_HMAC_SECRET_KEY:
    process.env.VFK_HMAC_SECRET_KEY ||
    '3452235d713252604a35562d325f765238695738485863672a705e6841544d3c7e6e45463028266f372b544e596f3829236b392825262e534a7e774f37653932',
  VFK_CLIENT_KEY: process.env.VFK_CLIENT_KEY || 'bhvbd7ced119dc6ad6a0b35bd3cf836555d6f71930d9e5a405f32105c790d',
  VFK_FINAL_KEY: process.env.VFK_FINAL_KEY || 'bd48d8c25293cfb537619cc93ae3d6e372eb2ddfffff4ab0eb000777144c7bfa',
  VFK_SDK_VERSION: process.env.VFK_SDK_VERSION || '0.11.4',
  VFK_OS: process.env.VFK_OS || 'android 9.0',
  VFK_APP_VERSION: process.env.VFK_APP_VERSION || '8.4.0',
  VFK_CLIENT_DEVICE_ID: process.env.VFK_CLIENT_DEVICE_ID || '174680a6f1765b5f',
  VFK_LANG: process.env.VFK_LANG || 'in_ID',

  // Legacy VFK keys (kept for backward compat, not used by PHP reference)
  VFK_APP_KEY: process.env.VFK_APP_KEY || '',
  VFK_SERVER_KEY: process.env.VFK_SERVER_KEY || '',
  VFK_CLIENT_IP: process.env.VFK_CLIENT_IP || '',

  // External tools API
  TOOLS_API_BASE_URL: process.env.TOOLS_API_BASE_URL || 'https://tools.naufalist.com',

  // Credential management
  USE_DATABASE: process.env.USE_DATABASE === 'true',
  CREDENTIALS_JSON: process.env.CREDENTIALS_JSON || '[]',

  // Form encryption
  FORM_SECRET_KEY: process.env.FORM_SECRET_KEY || 'default-secret-key-change-me',

  // Admin auth
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
} as const;

export type Config = typeof config;
