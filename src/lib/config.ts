// Configuration constants - reads from environment with PHP-matching defaults

export const config = {
  // GetContact API
  GTC_API_BASE_URL: process.env.GTC_API_BASE_URL || 'https://pbssrv-centralevents.com',
  GTC_HMAC_SECRET_KEY:
    process.env.GTC_HMAC_SECRET_KEY ||
    '31426764382a642f3a6665497235466f3d236d5d785b722b4c657457442a495b494524324866782a2364292478587a78662d7a7b7578593f71703e2b7e365762',
  GTC_ANDROID_OS: process.env.GTC_ANDROID_OS || 'android 9',
  GTC_APP_VERSION: process.env.GTC_APP_VERSION || '8.4.0',
  GTC_CLIENT_DEVICE_ID: process.env.GTC_CLIENT_DEVICE_ID || '',
  GTC_LANG: process.env.GTC_LANG || 'en_US',
  GTC_COUNTRY_CODE: process.env.GTC_COUNTRY_CODE || 'id',
  GTC_SOURCE: process.env.GTC_SOURCE || 'search_page',
  GTC_SEARCH_SOURCE: process.env.GTC_SEARCH_SOURCE || 'true_caller',

  // VerifyKit
  VFK_API_BASE_URL: process.env.VFK_API_BASE_URL || 'https://web-rest.verifykit.com',
  VFK_APP_KEY: process.env.VFK_APP_KEY || '',
  VFK_SERVER_KEY: process.env.VFK_SERVER_KEY || '',
  VFK_CLIENT_IP: process.env.VFK_CLIENT_IP || '',
  VFK_LANG: process.env.VFK_LANG || 'en',

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
