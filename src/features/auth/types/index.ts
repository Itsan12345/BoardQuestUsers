export interface AuthResponse {
  success: boolean;
  error?: string;
  devCode?: string;
}

export type SignupStep = 'info' | 'verify';
export type ForgotPasswordStep = 'request' | 'reset';

