import {
  login,
  sendVerificationCode,
  verifyEmailAndSignUp,
  sendPasswordResetCode,
  verifyAndResetPassword,
} from '@/app/actions/auth';

export async function loginAction(formData: FormData) {
  return login(formData);
}

export async function sendVerificationCodeAction(email: string, name: string) {
  return sendVerificationCode(email, name);
}

export async function verifyEmailAndSignUpAction(formData: FormData) {
  return verifyEmailAndSignUp(formData);
}

export async function sendPasswordResetCodeAction(email: string) {
  return sendPasswordResetCode(email);
}

export async function verifyAndResetPasswordAction(formData: FormData) {
  return verifyAndResetPassword(formData);
}

