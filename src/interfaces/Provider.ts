export type Provider = 'GOOGLE' | 'EMAIL';

export interface ProviderDetail {
  enabled: boolean;
  name?: string;
  clientId?: string;
}
