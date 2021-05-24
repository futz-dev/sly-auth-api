import { GetSecret, SetSecret } from '@scaffoldly/serverless-util';
import { env } from 'src/env';
import { v4 as uuidv4 } from 'uuid';
import { JWT, JWK, JWKECKey, JWKS } from 'jose';
import { DecodedJwtPayload, GeneratedKeys, JwtPayload } from 'src/interfaces/Jwt';
import { LoginRow, RefreshRow } from 'src/interfaces/models';
import {
  ExpressRequest,
  extractAuthorization,
  extractToken,
  HttpRequest,
} from 'src/serverless-util/http';
import { cleanseObject } from 'src/util';
import Cookies from 'cookies';
import { JWT_REFRESH_TOKEN_MAX_AGE, REFRESH_COOKIE_PREFIX } from 'src/constants';
import AccountsModel from 'src/models/AccountsModel';
import moment, { Moment } from 'moment';
import { TokenResponse } from 'src/interfaces/responses';
import axios from 'axios';

const JWKS_SECRET_NAME = 'jwks';
const DOMAIN = env.env_vars.SERVERLESS_API_DOMAIN.split('.').reverse().join('.');

const jwksCache: { [url: string]: { keys: JWKS.KeyStore; expires: Moment } } = {};

export default class JwtService {
  accountsModel: AccountsModel;

  constructor() {
    this.accountsModel = new AccountsModel();
  }

  getPublicKey = async (): Promise<JWKECKey> => {
    const keys = await this.getOrCreateKeys();
    return keys.publicKey.jwk;
  };

  createEmptyToken = (
    loginRow: LoginRow,
    request: HttpRequest,
    customPath?: string,
  ): TokenResponse => {
    const { headers } = request;
    let { path } = customPath ? { path: customPath } : request;
    const { Host } = headers;
    const ssl = headers['X-Forwarded-Proto'] === 'https';

    path = path.replace(/\/refresh$/gim, '');

    const obj: JwtPayload = {
      ...cleanseObject(loginRow.detail.payload),
      id: loginRow.id,
      sk: loginRow.sk,
      refreshUrl: `${ssl ? 'https' : 'http'}://${Host}${path}/refresh`,
      authorizeUrl: `${ssl ? 'https' : 'http'}://${Host}${path}/authorize`,
      certsUrl: `${ssl ? 'https' : 'http'}://${Host}${path}/certs`,
    };

    return {
      ...loginRow.detail,
      payload: obj,
      token: null,
    };
  };

  private getOrCreateKeys = async (): Promise<GeneratedKeys> => {
    let keys = await GetSecret(JWKS_SECRET_NAME);

    if (!keys) {
      const generatedKeys = this.generateKeys(env.env_vars.SERVERLESS_API_DOMAIN);

      await SetSecret(JWKS_SECRET_NAME, JSON.stringify(generatedKeys), true);
      keys = await GetSecret(JWKS_SECRET_NAME);
      if (!keys) {
        throw new Error('Unknown issue generating/storing JWKS');
      }
    }

    return JSON.parse(Buffer.from(keys, 'base64').toString('utf8'));
  };

  createToken = async (
    loginRow: LoginRow,
    request: HttpRequest,
    customPath?: string,
  ): Promise<TokenResponse> => {
    const response = this.createEmptyToken(loginRow, request, customPath);

    const keys = await this.getOrCreateKeys();
    const key = JWK.asKey(keys.privateKey.jwk);
    const token = JWT.sign(response.payload, key, {
      audience: this.generateAudience(loginRow.id),
      expiresIn: '60 minute',
      header: {
        typ: 'JWT',
      },
      subject: loginRow.id,
      issuer: response.payload.certsUrl,
    });

    response.token = token;

    return response;
  };

  createRefreshToken = async (
    loginRow: LoginRow,
    request: ExpressRequest,
    token = uuidv4(),
  ): Promise<RefreshRow> => {
    const { headers } = request;
    const { Host } = headers;

    const cookie = new Cookies.Cookie(`${REFRESH_COOKIE_PREFIX}${loginRow.sk}`, token, {
      domain: Host as string,
      maxAge: parseInt(JWT_REFRESH_TOKEN_MAX_AGE, 10),
      overwrite: true,
      path: '/',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    const refreshRow: RefreshRow = await this.accountsModel.create(
      {
        id: loginRow.id,
        sk: `jwt_refresh_${loginRow.sk}`,
        detail: {
          sk: loginRow.sk,
          token,
          expires: moment().add(JWT_REFRESH_TOKEN_MAX_AGE, 'millisecond').unix(),
          header: cookie.toHeader(),
        },
      },
      { overwrite: true },
    );

    return refreshRow;
  };

  fetchRefreshRow = async (request: HttpRequest): Promise<RefreshRow> => {
    const authorization = extractAuthorization(request);

    if (!authorization) {
      console.warn('Missing authorization');
      return null;
    }

    const token = extractToken(authorization);
    if (!token) {
      console.warn('Missing token');
      return null;
    }

    const decoded = JWT.decode(token) as DecodedJwtPayload;
    if (!decoded) {
      console.warn('Unable to decode token');
      return null;
    }

    if (!decoded.id || !decoded.sk) {
      console.warn('Missing id or sk in token');
      return null;
    }

    const refreshRow: RefreshRow = await this.accountsModel.get({
      id: decoded.id,
      sk: `jwt_refresh_${decoded.sk}`,
    });

    if (!refreshRow) {
      console.warn(`Unable to find refresh record for ${decoded.id} ${decoded.sk}`);
      return null;
    }

    // Parse cookie from event header
    const cookie = this.extractRefreshCookie(request, decoded.sk);
    if (!cookie.value) {
      console.warn(`Unable to find cookie with name ${cookie.name}`);
      return null;
    }

    // Compare sly_jrt and decoded.sk value with result from DB
    if (refreshRow.detail.token !== cookie.value) {
      console.warn(
        `Token mismatch. Expected ${refreshRow.detail.token}, got ${cookie.value} from cookie ${cookie.name}`,
      );
      return null;
    }

    // TODO: Ensure social auth credentials are still good

    return refreshRow;
  };

  verifyJwt = async (jwt: string): Promise<DecodedJwtPayload> => {
    const decoded = JWT.decode(jwt) as DecodedJwtPayload;
    if (!decoded) {
      throw new Error('Unable to decode token');
    }

    const { aud, iss } = decoded;
    if (!aud) {
      throw new Error('Missing audience in decoded token');
    }

    if (!this.verifyAudience(aud)) {
      throw new Error('Invalid audience');
    }

    if (!iss) {
      throw new Error('Missing issuer in decoded token');
    }

    const keys = await this.getOrCreateKeys();
    const { issuer } = keys;
    if (!issuer) {
      throw new Error(`Unable to find secret: ${JWKS_SECRET_NAME}`);
    }

    const issuerUrl = new URL(iss);
    if (issuerUrl.hostname.indexOf(issuer) === -1) {
      throw new Error(
        `Issuer mismatch. Got: ${decoded.iss}; Expected hostname to contain: ${issuer}`,
      );
    }

    const jwks = await this.fetchJwks(decoded.iss);
    const verified = JWT.verify(jwt, jwks, {});

    if (!verified) {
      throw new Error('Unable to verify token');
    }

    if (verified instanceof Error) {
      throw verified;
    }

    return verified as DecodedJwtPayload;
  };

  private fetchJwks = async (url: string): Promise<JWKS.KeyStore> => {
    if (!url) {
      throw new Error('URL is required');
    }

    if (
      jwksCache[url] &&
      jwksCache[url].keys &&
      jwksCache[url].expires &&
      moment(jwksCache[url].expires).isAfter(moment())
    ) {
      return jwksCache[url].keys;
    }

    const response = await axios.get(url);

    if (!response || !response.data) {
      throw new Error(`Unable to get keys from url: ${url}`);
    }

    const { data } = response;

    const keys = JWKS.asKeyStore(data);

    // TODO Use Cache Control header
    jwksCache[url] = {
      expires: moment().add(6, 'hour'),
      keys,
    };

    return keys;
  };

  private generateKeys = (issuer: string): GeneratedKeys => {
    const kid = uuidv4();
    const key = JWK.generateSync('EC', 'P-256', { use: 'sig', kid }, true);
    console.log(`Generated a new key with kid: ${kid}`);

    return {
      issuer,
      publicKey: {
        pem: key.toPEM(false),
        jwk: key.toJWK(false),
      },
      privateKey: {
        pem: key.toPEM(true),
        jwk: key.toJWK(true),
      },
    };
  };

  private verifyAudience = (audience: string): boolean => {
    if (!audience) {
      console.warn('Missing audience');
      return false;
    }

    const parts = audience.split(':');
    if (parts.length < 3) {
      console.warn('Unable to parse audience');
      return false;
    }

    const [, , domain] = parts;
    if (!domain) {
      console.warn('Unable to find domain in audience');
    }

    if (domain === DOMAIN) {
      return true;
    }

    console.warn(`Domain mismatch. Got ${domain}, expected ${DOMAIN}`);
    return false;
  };

  private generateAudience = (id: string) => `urn:auth:${DOMAIN}:${id}`;

  private extractRefreshCookie = (request: HttpRequest, sk: string) => {
    const cookie = {
      name: `${REFRESH_COOKIE_PREFIX}${sk}`,
      value: null,
    };

    if (!request) {
      console.warn('Missing request');
      return cookie;
    }

    const { headers } = request;
    if (!headers) {
      console.warn('Missing headers');
      return cookie;
    }

    const { Cookie } = headers as Record<string, string>;
    if (!Cookie) {
      console.warn('Missing Cookie header');
      return cookie;
    }

    const cookies = Cookie.split(';');
    if (!cookies || cookies.length === 0) {
      console.warn('No cookies');
      return cookie;
    }

    return cookies.reduce((acc, item) => {
      if (acc.value) {
        return acc;
      }

      const [name, value] = item.trim().split('=');
      if (!name || !value) {
        console.warn(`Missing name or value in ${item}`);
        return acc;
      }

      if (name === acc.name) {
        acc.value = value;
      }

      return acc;
    }, cookie);
  };
}
