import { Provider } from './Provider';

export interface LoginRequestBase {
  provider: Provider;
  email: string;
}

export interface GoogleLoginRequest extends LoginRequestBase {
  provider: 'GOOGLE';
  name?: string;
  id: string;
  idToken: string;
  authToken: string;
  photoUrl?: string;
}

export interface EmailLoginRequest extends LoginRequestBase {
  provider: 'EMAIL';
  code?: string;
}

export type LoginRequest = EmailLoginRequest | GoogleLoginRequest;

export interface AuthorizeRequest {
  token: string;
}

export interface AccountRequest {
  name: string;
  email: string;
  company?: string;
}
