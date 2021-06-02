import { ErrorResponse, HttpRequest, HttpRequestWithUser } from '@scaffoldly/serverless-util';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  Response,
  Route,
  Security,
  Tags,
  TsoaResponse,
} from 'tsoa';
import { env } from '../env';
import { AuthorizeRequest, LoginRequest } from '../interfaces/requests';
import {
  AuthorizeResponse,
  JWKSResponse,
  LoginDetailResponse,
  ProviderResponse,
  TokenResponse,
} from '../interfaces/responses';
import AccountService from '../services/AccountService';
import JwtService from '../services/JwtService';
import LoginService from '../services/LoginService';
import ProviderService from '../services/ProviderService';

@Route(`/api/v1/jwt`)
@Tags('JWT')
export class JwtControllerV1 extends Controller {
  envVars = env.env_vars;

  loginService: LoginService;

  jwtService: JwtService;

  providerService: ProviderService;

  accountService: AccountService;

  constructor() {
    super();
    this.loginService = new LoginService();
    this.jwtService = new JwtService();
    this.providerService = new ProviderService();
    this.accountService = new AccountService();
  }

  @Post()
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Response<TokenResponse, { 'set-cookie'?: string }>(200)
  public async login(
    @Body() login: LoginRequest,
    @Request() request: HttpRequest,
    @Res()
    res: TsoaResponse<200, TokenResponse, { 'set-cookie'?: string }>,
  ): Promise<TokenResponse> {
    const { tokenResponse, headers } = await this.loginService.login(login, request);
    const response = res(200, tokenResponse, headers);
    return response;
  }

  @Get('me')
  @Security('jwt')
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  public async getLoginDetail(
    @Request() request: HttpRequestWithUser,
  ): Promise<LoginDetailResponse> {
    const response: LoginDetailResponse = {
      payload: request.user,
      providers: await this.loginService.providers('me', request.user),
    };
    return response;
  }

  @Post('refresh')
  @Security('jwt')
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Response<TokenResponse, { 'set-cookie'?: string; 'x-auth-refresh'?: string }>(200)
  public async refresh(
    @Request() request: HttpRequest,
    @Res()
    res: TsoaResponse<200, TokenResponse, { 'set-cookie'?: string; 'x-auth-refresh'?: string }>,
  ): Promise<TokenResponse> {
    const { tokenResponse, headers } = await this.loginService.refresh(request);
    const response = res(200, tokenResponse, headers);
    return response;
  }

  @Post('authorize')
  public async authorize(@Body() authorize: AuthorizeRequest): Promise<AuthorizeResponse> {
    const response = await this.loginService.authorize(authorize);
    return response;
  }

  @Get('certs')
  public async getCerts(): Promise<JWKSResponse> {
    const publicKey = await this.jwtService.getPublicKey();
    return { keys: [publicKey] };
  }

  @Get('providers')
  public getProviders(): ProviderResponse {
    // TODO: Move the ProviderDetail generation into ProviderService
    const response: ProviderResponse = {
      GOOGLE: this.envVars.GOOGLE_CLIENT_ID
        ? { name: 'Google', clientId: this.envVars.GOOGLE_CLIENT_ID, enabled: true }
        : { enabled: false },
      EMAIL: this.envVars.MAIL_DOMAIN
        ? { name: 'Email', clientId: this.envVars.MAIL_DOMAIN, enabled: true }
        : { enabled: false },
    };

    return response;
  }
}
