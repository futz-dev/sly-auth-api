import { Provider } from './Provider';

export interface LoginRequestBase<T extends Provider> {
  provider: T;
  email: string;
}

export interface GoogleLoginRequest extends LoginRequestBase<'GOOGLE'> {
  name?: string;
  id: string;
  idToken: string;
  authToken: string;
  photoUrl?: string;
}

export interface EmailLoginRequest extends LoginRequestBase<'EMAIL'> {
  code?: string;
}

export type LoginRequest = EmailLoginRequest | GoogleLoginRequest;

export interface AuthorizeRequest {
  token: string;
  scopes?: string[];
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';
  host: string;
  path: string;
}
