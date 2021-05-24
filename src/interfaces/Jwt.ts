import { JWKECKey } from 'jose';

export interface PemJwk {
  pem: string;
  jwk: JWKECKey;
}

export interface GeneratedKeys {
  issuer: string;
  publicKey: PemJwk;
  privateKey: PemJwk;
}

export type CleansedObject = { [key: string]: string | number | boolean };

export interface JwtPayload extends CleansedObject {
  id: string;
  sk: string;
  refreshUrl: string;
  authorizeUrl: string;
  certsUrl: string;
}

export interface DecodedJwtPayload extends JwtPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

export interface RefreshDetail {
  sk: string;
  token: string;
  expires: number;
  header: string;
}
