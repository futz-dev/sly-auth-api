export const { SERVICE_NAME, STAGE } = process.env;
export const { JWT_REFRESH_TOKEN_MAX_AGE } = process.env;
export const ACCOUNTS_TABLE = 'accounts';

export const REFRESH_COOKIE_PREFIX = '__Secure-sly_jrt_';

export const SENSITIVE_KEYS = [
  'password',
  'key',
  'x-api-key',
  'api-key',
  'token',
  'secret',
  'authtoken',
  'idtoken',
];
export const AUTH_PREFIXES = ['Bearer', 'jwt', 'Token'];

export const HEADER_X_AUTH_REFRESH = 'x-auth-refresh';
export const HEADER_SET_COOKIE = 'Set-Cookie';
