import { HttpError } from '@scaffoldly/serverless-util';
import { AccountRow, LoginRow } from '../interfaces/models';
import { AccountRequest } from '../interfaces/requests';
import { AccountResponse, ProviderResponse } from '../interfaces/responses';
import AccountsModel from '../models/AccountsModel';
import { DecodedJwtPayload } from '../serverless-util';

export default class AccountService {
  accountsModel: AccountsModel;

  constructor() {
    this.accountsModel = new AccountsModel();
  }

  async createAccount(request: AccountRequest, user: DecodedJwtPayload): Promise<AccountResponse> {
    const accountRow: AccountRow = await this.accountsModel.create({
      id: user.id,
      sk: 'primary',
      detail: request,
    });

    return accountRow as AccountResponse;
  }

  async updateAccount(request: AccountRequest, user: DecodedJwtPayload): Promise<AccountResponse> {
    let accountRow: AccountRow = await this.accountsModel.get({ id: user.id, sk: 'primary' });
    if (!accountRow) {
      throw new HttpError(404, 'Not found');
    }

    accountRow = await this.accountsModel.update({
      ...accountRow,
      detail: { ...accountRow.detail, ...request },
    });

    return accountRow as AccountResponse;
  }

  async getAccount(user: DecodedJwtPayload): Promise<AccountResponse> {
    const accountRow: AccountRow = await this.accountsModel.get({ id: user.id, sk: 'primary' });
    if (!accountRow) {
      throw new HttpError(404, 'Not found');
    }

    return accountRow as AccountResponse;
  }

  async getAccountById(id: string, user: DecodedJwtPayload): Promise<AccountResponse> {
    if (id !== user.id && id !== 'me') {
      throw new HttpError(403, 'Forbidden');
    }

    const accountRow: AccountRow = await this.getAccount(user);

    return accountRow as AccountResponse;
  }

  async getProviders(id: string, user: DecodedJwtPayload): Promise<ProviderResponse> {
    if (id !== user.id && id !== 'me') {
      throw new HttpError(403, 'Forbidden');
    }

    const [result]: [{ Items: [{ attrs: LoginRow }] }] = await this.accountsModel.model
      .query(user.id)
      .where('sk')
      .beginsWith('login_')
      .exec()
      .promise();

    return result.Items.reduce(
      (response, item) => {
        response[item.attrs.detail.provider] = { enabled: true, name: item.attrs.sk };
        return response;
      },
      { EMAIL: { enabled: false }, GOOGLE: { enabled: false } } as ProviderResponse,
    );
  }
}
