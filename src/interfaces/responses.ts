import { DecodedJwtPayload, JwtPayload } from '../serverless-util';
import { AccountDetail } from './Account';
import { Jwk } from './Jwt';
import { LoginDetail } from './Login';
import { AccountRow } from './models';
import { Provider, ProviderDetail } from './Provider';

export interface JWKSResponse {
  keys: Jwk[];
}

export type ProviderResponse = {
  [provider in Provider]: ProviderDetail;
};

export interface TokenResponse extends LoginDetail<JwtPayload> {
  token: string;
}

export type Header = 'set-cookie' | 'x-auth-refresh';

export type TokenResponseHeaders = { [header in Header]?: string };

export type TokenResponseWithHeaders = {
  tokenResponse: TokenResponse;
  headers: TokenResponseHeaders;
};

export interface AuthorizeResponse {
  authorized: boolean;
  id?: string;
  payload?: DecodedJwtPayload;
  detail?: string;
}

export interface AccountResponse extends AccountRow {
  id: string;
  sk: string;
  detail: AccountDetail;
}