import {
  Controller,
  Get,
  Post,
  Route,
  Body,
  Request,
  Res,
  TsoaResponse,
  Response,
  Security,
} from 'tsoa';
import { env } from '../env';
import { LoginRequest, AuthorizeRequest } from '../interfaces/requests';
import {
  AuthorizeResponse,
  JWKSResponse,
  ProviderResponse,
  TokenResponse,
  TokenResponseHeaders,
} from '../interfaces/responses';
import { HttpRequest } from '../serverless-util/http';
import JwtService from '../services/JwtService';
import LoginService from '../services/LoginService';
import ProviderService from '../services/ProviderService';

// TODO Lob off /auth
@Route(`/api/v1/oauth2`)
export class Oauth2ControllerV1 extends Controller {
  loginService: LoginService;

  jwtService: JwtService;

  providerService: ProviderService;

  constructor() {
    super();
    this.loginService = new LoginService();
    this.jwtService = new JwtService();
    this.providerService = new ProviderService();
  }

  @Post()
  // 401, 500
  @Response<TokenResponse, TokenResponseHeaders>(200)
  public async login(
    @Body() login: LoginRequest,
    @Request() request: HttpRequest,
    @Res() res: TsoaResponse<200, TokenResponse, TokenResponseHeaders>,
  ): Promise<TokenResponse> {
    const { tokenResponse, headers } = await this.loginService.login(login, request);
    const response = res(200, tokenResponse, headers);
    return response;
  }

  @Post('refresh')
  @Security('jwt')
  public async refresh(
    @Request() request: HttpRequest,
    @Res() res: TsoaResponse<200, TokenResponse, TokenResponseHeaders>,
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
  public async getProviders(): Promise<ProviderResponse> {
    // TODO: Move the ProviderDetail generation into ProviderService
    const response: ProviderResponse = {
      APPLE: env.env_vars.APPLE_CLIENT_ID
        ? { name: 'Apple', clientId: env.env_vars.APPLE_CLIENT_ID, enabled: true }
        : { enabled: false },
      GOOGLE: env.env_vars.GOOGLE_CLIENT_ID
        ? { name: 'Google', clientId: env.env_vars.GOOGLE_CLIENT_ID, enabled: true }
        : { enabled: false },
      EMAIL: (await this.providerService.isDomainVerified(env.env_vars.MAIL_DOMAIN))
        ? { name: 'Email', clientId: env.env_vars.MAIL_DOMAIN, enabled: true }
        : { enabled: false },
    };

    return response;
  }
}
