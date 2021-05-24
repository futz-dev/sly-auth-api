import { Joi, SERVICE_NAME, STAGE, Table } from '@scaffoldly/serverless-util';
import { ACCOUNTS_TABLE } from 'src/constants';
import { AccountsRowBase } from 'src/interfaces/models';

// TODO: Move typing helpers to serverless-util
export default class AccountsModel {
  private table: Table;

  constructor() {
    this.table = new Table(
      ACCOUNTS_TABLE,
      SERVICE_NAME,
      STAGE,
      {
        id: Joi.string().required(),
        sk: Joi.string().required(),
        detail: Joi.any(), // TODO: Define schema
      },
      'id',
      'sk',
    );
  }

  // TODO: Operations from dynamodb type
  create = async <T>(row: T, options = { overwrite: false }): Promise<T> => {
    const { attrs: t }: { attrs: T } = (await this.table.model.create(row, options)) || {};
    return t;
  };

  get = async <T>(keys: AccountsRowBase): Promise<T> => {
    const { attrs: t }: { attrs: T } = (await this.table.model.get(keys.id, keys.sk, {})) || {};
    return t;
  };

  update = async <T>(row: T): Promise<T> => {
    const { attrs: t }: { attrs: T } = (await this.table.model.update(row, {})) || {};
    return t;
  };
}
