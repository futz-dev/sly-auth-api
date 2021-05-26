import { HttpError } from '@scaffoldly/serverless-util';
import * as Google from 'google-auth-library';
import { env } from 'src/env';
import { LoginDetail, VerificationResultBase } from 'src/interfaces/Login';
import { LoginRow } from 'src/interfaces/models';
import { AuthorizeRequest, LoginRequest } from 'src/interfaces/requests';
import AccountsModel from 'src/models/AccountsModel';
import {
  AuthorizeResponse,
  TokenResponseHeaders,
  TokenResponseWithHeaders,
} from '../interfaces/responses';
import { DecodedJwtPayload, HttpRequest, extractToken } from '../serverless-util';
import JwtService from './JwtService';
import TotpService from './TotpService';

export default class LoginService {
  jwtService: JwtService;

  totpService: TotpService;

  accountsModel: AccountsModel;

  constructor() {
    this.jwtService = new JwtService();
    this.totpService = new TotpService();
    this.accountsModel = new AccountsModel();
  }

  login = async (login: LoginRequest, request: HttpRequest): Promise<TokenResponseWithHeaders> => {
    const loginRow = await this.verifyLogin(login);

    if (!loginRow.detail.verified) {
      return {
        tokenResponse: this.jwtService.createEmptyToken(loginRow, request),
        headers: {},
      };
    }

    const refreshRow = await this.jwtService.createRefreshToken(loginRow, request);
    const token = await this.jwtService.createToken(loginRow, request);

    const headers: TokenResponseHeaders = {
      'set-cookie': refreshRow.detail.header,
    };

    if (request.headers['x-auth-refresh']) {
      headers['x-auth-refresh'] = request.headers['x-auth-refresh'] as string;
    }

    return { tokenResponse: token, headers };
  };

  refresh = async (request: HttpRequest): Promise<TokenResponseWithHeaders> => {
    let refreshRow = await this.jwtService.fetchRefreshRow(request);
    if (!refreshRow) {
      console.warn(`Unable to find refresh record`);
      throw new HttpError(403, 'Unable to find/match refresh record');
    }

    const { id, detail } = refreshRow;
    const { sk } = detail;

    const loginRow: LoginRow = await this.accountsModel.get({ id, sk });

    if (!loginRow) {
      console.warn(`Unable to find existing login with ${id} ${sk}`);
      throw new HttpError(403, 'Unable to find existing login');
    }

    console.log(`Generating new tokens for ${id} ${sk}`);

    // Tiny hack for consistency: lob off `/refresh` from the event path
    let { path } = request;
    path = path.split('/').slice(0, -1).join('/');

    refreshRow = await this.jwtService.createRefreshToken(
      loginRow,
      request,
      refreshRow.detail.token,
    );
    const tokenResponse = await this.jwtService.createToken(loginRow, request, path);
    const headers: TokenResponseHeaders = {
      'x-auth-refresh': 'true',
      'set-cookie': refreshRow.detail.header,
    };

    return { tokenResponse, headers };
  };

  authorize = async (authorize: AuthorizeRequest): Promise<AuthorizeResponse> => {
    const response: AuthorizeResponse = {
      id: undefined,
      authorized: false,
      payload: undefined,
      detail: undefined,
    };

    if (!authorize || !authorize.token) {
      response.detail = 'Missing token from authorize request';
      return response;
    }

    const token = extractToken(authorize.token);
    if (!token) {
      response.detail = 'Unable to extract token';
      return response;
    }

    let payload: DecodedJwtPayload;
    try {
      payload = await this.jwtService.verifyJwt(token);
    } catch (e) {
      response.detail = e.message || e.name || 'Unexpected error verifying JWT';
      return response;
    }

    response.id = payload.id;
    response.authorized = true;
    response.payload = payload;

    return response;
  };

  private verifyLogin = async (login: LoginRequest): Promise<LoginRow> => {
    const email = login.email.trim().toLowerCase();

    let loginDetail: LoginDetail<LoginRequest>;
    const id = this.jwtService.generateAudience(email);

    if (login.provider === 'GOOGLE') {
      const result = await this.verifyGoogleToken(login.idToken);
      loginDetail = {
        ...result,
        id,
        provider: login.provider,
        payload: login,
      };
    }

    if (login.provider === 'EMAIL') {
      const result = await this.verifyEmail(id, email, login.code);
      loginDetail = {
        ...result,
        id,
        provider: login.provider,
        payload: login,
      };
    }

    if (!loginDetail) {
      throw new HttpError(400, 'Unknown provider');
    }

    const loginRow: LoginRow = await this.accountsModel.create(
      {
        id: loginDetail.id,
        sk: `login_${loginDetail.provider}_${loginDetail.id}`,
        detail: loginDetail,
      },
      { overwrite: true },
    );

    return loginRow;
  };

  private verifyGoogleToken = async (token: string): Promise<VerificationResultBase> => {
    const client = new Google.OAuth2Client({ clientId: env.env_vars.GOOGLE_CLIENT_ID });

    let result: Google.LoginTicket;
    try {
      result = await client.verifyIdToken({ idToken: token });
    } catch (e) {
      throw new HttpError(401, 'Unauthorized', e);
    }

    if (!result) {
      throw new HttpError(500, 'Verification result was not set');
    }

    const payload = result.getPayload();

    if (!payload) {
      throw new HttpError(500, 'Verification payload was not set');
    }

    const { sub } = payload;

    if (!sub) {
      throw new HttpError(500, 'Verification sub was not set');
    }

    return { verified: true, verificationMethod: 'NONE' };
  };

  private verifyEmail = async (
    id: string,
    email: string,
    code: string,
  ): Promise<VerificationResultBase> => {
    if (code) {
      const verified = await this.totpService.verifyTotp(id, email, code);
      return { verified, verificationMethod: 'EMAIL' };
    }

    const verificationMethod = await this.totpService.sendTotp(id, email);
    return { verified: false, verificationMethod };
  };
}
