import { JWKECKey } from 'jose';
import { HEADER_SET_COOKIE, HEADER_X_AUTH_REFRESH } from 'src/constants';
import { DecodedJwtPayload, JwtPayload } from './Jwt';
import { LoginDetail } from './Login';
import { Provider, ProviderDetail } from './Provider';

export interface JWKSResponse {
  keys: JWKECKey[];
}

export type ProviderResponse = {
  [provider in Provider]: ProviderDetail;
};

export interface TokenResponse extends LoginDetail<JwtPayload> {
  token: string;
}

export interface TokenResponseHeaders {
  [HEADER_X_AUTH_REFRESH]?: string;
  [HEADER_SET_COOKIE]?: string;
}

export type TokenResponseWithHeaders = {
  tokenResponse: TokenResponse;
  headers: TokenResponseHeaders;
};

export interface AuthorizeResponse {
  authorized: boolean;
  identity?: string;
  payload?: DecodedJwtPayload;
  error?: Error;
}
