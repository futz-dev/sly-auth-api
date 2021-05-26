import { Body, Controller, Get, Patch, Path, Post, Request, Response, Route, Security } from 'tsoa';
import { AccountRequest } from '../interfaces/requests';
import { AccountResponse } from '../interfaces/responses';
import { ErrorResponse, HttpRequestWithUser } from '../serverless-util';
import AccountService from '../services/AccountService';

@Route(`/api/v1/account`)
export class AccountControllerV1 extends Controller {
  accountService: AccountService;

  constructor() {
    super();
    this.accountService = new AccountService();
  }

  @Get()
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public async getAccount(@Request() request: HttpRequestWithUser): Promise<AccountResponse> {
    return this.accountService.getAccount(request.user);
  }

  @Get('{id}')
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public async getAccountById(
    @Path('id') id: string,
    @Request() request: HttpRequestWithUser,
  ): Promise<AccountResponse> {
    return this.accountService.getAccountById(id, request.user);
  }

  @Post()
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public async createAccount(
    @Body() accountRequest: AccountRequest,
    @Request() request: HttpRequestWithUser,
  ): Promise<AccountResponse> {
    return this.accountService.createAccount(accountRequest, request.user);
  }

  @Patch()
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public async updateAccount(
    @Body() accountRequest: AccountRequest,
    @Request() request: HttpRequestWithUser,
  ): Promise<AccountResponse> {
    return this.accountService.createAccount(accountRequest, request.user);
  }
}
