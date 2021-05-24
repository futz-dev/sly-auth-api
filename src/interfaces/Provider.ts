export type Provider = 'GOOGLE' | 'APPLE' | 'EMAIL';

export interface ProviderDetail {
  enabled: boolean;
  name?: string;
  clientId?: string;
}
