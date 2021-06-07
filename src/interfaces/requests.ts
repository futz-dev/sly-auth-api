export type GoogleLoginRequest = {
  provider: 'GOOGLE';
  email: string;
  name?: string;
  id: string;
  idToken: string;
  authToken: string;
  photoUrl?: string;
};

export type EmailLoginRequest = {
  provider: 'EMAIL';
  email: string;
  code?: string;
};

export type LoginRequest = EmailLoginRequest | GoogleLoginRequest;

export interface AuthorizeRequest {
  token: string;
}

export interface AccountRequest {
  name: string;
  email: string;
  company?: string;
}
