import { Provider } from './Provider';
import { VerificationMethod } from './Totp';

export interface VerificationResultBase {
  verified: boolean;
  verificationMethod: VerificationMethod;
}

export interface LoginDetail<T> extends VerificationResultBase {
  id: string;
  provider: Provider;
  payload: T;
}
