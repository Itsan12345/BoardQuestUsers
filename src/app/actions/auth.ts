
'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { SUBJECT_AREAS } from '@/lib/game-logic';
import bcrypt from 'bcryptjs';

import clientPromise from '@/lib/mongodb-client';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/mail';

export async function sendVerificationCode(email: string, name?: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    // 2. Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 3. Save to MongoDB EmailVerification collection
    const client = await clientPromise;
    const db = client.db();
    await db.collection('EmailVerification').updateOne(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          code,
          expiresAt,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 4. Send the verification email
    const mailResult = await sendVerificationEmail({
      email: normalizedEmail,
      name,
      code,
    });

    if (!mailResult.success) {
      return {
        success: false,
        error: mailResult.error || 'Failed to dispatch verification email. Please check your email settings or try again.',
      };
    }

    return {
      success: true,
      message: 'Verification code sent to your email.',
      devCode: process.env.NODE_ENV === 'development' ? mailResult.devCode : undefined,
    };
  } catch (error) {
    console.error('Send verification code error:', error);
    return {
      success: false,
      error: 'Failed to send verification code. Please try again.',
    };
  }
}

export async function verifyEmailAndSignUp(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;
  const name = (formData.get('name') as string || '').trim();
  const code = (formData.get('code') as string || '').trim();

  if (!email || !password || !name || !code) {
    return { success: false, error: 'All fields and the verification code are required.' };
  }

  try {
    // 1. Verify code in database
    const client = await clientPromise;
    const db = client.db();
    const verificationRecord = await db.collection('EmailVerification').findOne({ email });

    if (!verificationRecord) {
      return {
        success: false,
        error: 'No verification request found for this email. Please request a new code.',
      };
    }

    if (new Date() > new Date(verificationRecord.expiresAt)) {
      return {
        success: false,
        error: 'Verification code has expired. Please request a new code.',
      };
    }

    if (verificationRecord.code !== code) {
      return {
        success: false,
        error: 'Invalid verification code. Please check your email and try again.',
      };
    }

    // 2. Check if user already registered in the meantime
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user with Level 1, 0 XP
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        level: 1,
        xp: 0,
        streak: 0,
      },
    });

    // Mark user as verified in MongoDB
    await db.collection('User').updateOne(
      { email },
      { $set: { verified: true } }
    );

    // 4. Initialize Subject Mastery for dynamically created categories
    let dbCategories: { name: string }[] = [];
    try {
      dbCategories = await (prisma as any).subject?.findMany({ select: { name: true } }) || [];
    } catch (catErr) {
      console.warn('Could not fetch subjects for signup initialization:', catErr);
    }

    const activeSubjects = dbCategories.length > 0
      ? dbCategories.map(c => c.name)
      : SUBJECT_AREAS;

    await prisma.subjectMastery.createMany({
      data: activeSubjects.map(subject => ({
        userId: user.id,
        subject,
        proficiency: 0,
        minScore: 0,
        status: 'In Training',
      })),
    });

    // 5. Initialize clean UserSettings in MongoDB (no focus subject, no target exam date)
    await db.collection('UserSettings').updateOne(
      { userId: user.id },
      {
        $set: {
          userId: user.id,
          focusSubject: 'none',
          targetExamDate: null,
          targetBatch: '',
          school: '',
          dailyQuota: 50,
          defaultDifficulty: 'MEDIUM',
          confidencePrompts: true,
          sfxVolume: 80,
          ambientMusic: true,
          floatingDamageText: true,
          hitScreenFlash: true,
          streakAlerts: true,
          countdownAlerts: true,
          achievementAlerts: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 6. Clean up the used verification code and any legacy orphaned DailyLogin records for this email
    await Promise.all([
      db.collection('EmailVerification').deleteOne({ email }),
      db.collection('DailyLogin').deleteMany({
        $or: [{ studentEmail: email }, { userEmail: email }],
      }),
    ]);

    // 7. Set session cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set('user_id', user.id, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      });

      // Dynamically record daily login for student tracking and streak
      try {
        const { recordDailyLoginAction } = await import('@/app/actions/daily-login');
        await recordDailyLoginAction();
      } catch (loginTrackErr) {
        console.warn('Daily login tracking notice on signup:', loginTrackErr);
      }
    } catch {
      // Cookies context not available in non-HTTP environments (e.g. testing)
    }

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Verify & Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Account registration failed: ${errorMessage}` };
  }
}

export async function signUp(formData: FormData) {
  return verifyEmailAndSignUp(formData);
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Check if user is verified
    const client = await clientPromise;
    const db = client.db();
    const dbUser = await db.collection('User').findOne({ email });

    if (dbUser && dbUser.verified === false) {
      return {
        success: false,
        error: 'Your email is not verified. Please verify your email before logging in.',
      };
    }

    const cookieStore = await cookies();
    cookieStore.set('user_id', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Dynamically record daily login for student tracking and streak
    try {
      const { recordDailyLoginAction } = await import('@/app/actions/daily-login');
      await recordDailyLoginAction();
    } catch (loginTrackErr) {
      console.warn('Daily login tracking notice on login:', loginTrackErr);
    }

    // Dynamically record active device session
    try {
      const { trackActiveSessionAction } = await import('@/app/actions/session');
      await trackActiveSessionAction();
    } catch (sessionErr) {
      console.warn('Active session tracking notice on login:', sessionErr);
    }
    
    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Authentication service unavailable.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const currentSessionId = cookieStore.get('bq_session_token')?.value;

  if (currentSessionId) {
    try {
      const { terminateSessionAction } = await import('@/app/actions/session');
      await terminateSessionAction(currentSessionId);
    } catch (e) {}
  }

  cookieStore.set('user_id', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });

  cookieStore.set('bq_session_token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });
}

export async function sendPasswordResetCode(email: string) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  try {
    // 1. Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        success: false,
        error: 'No account found with this email address. Please check your spelling.',
      };
    }

    // 2. Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // 3. Save OTP in MongoDB PasswordReset collection
    const client = await clientPromise;
    const db = client.db();
    await db.collection('PasswordReset').updateOne(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          code,
          expiresAt,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 4. Send email
    const mailResult = await sendPasswordResetEmail({
      email: normalizedEmail,
      name: user.name,
      code,
    });

    if (!mailResult.success) {
      return {
        success: false,
        error: mailResult.error || 'Failed to dispatch password recovery email. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Password reset code has been dispatched to your email.',
      devCode: process.env.NODE_ENV === 'development' ? mailResult.devCode : undefined,
    };
  } catch (error) {
    console.error('Send password reset code error:', error);
    return {
      success: false,
      error: 'Failed to send recovery code. Please try again in a few moments.',
    };
  }
}

export async function verifyAndResetPassword(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase();
  const code = ((formData.get('code') as string) || '').trim();
  const newPassword = (formData.get('password') as string) || '';
  const confirmPassword = (formData.get('confirmPassword') as string) || '';

  if (!email || !code || !newPassword || !confirmPassword) {
    return { success: false, error: 'All fields and the recovery code are required.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match. Please verify and try again.' };
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  if (!hasNumber || !hasSpecial) {
    return {
      success: false,
      error: 'Password must contain at least 1 number and 1 special character.',
    };
  }

  try {
    // 1. Verify reset code in MongoDB
    const client = await clientPromise;
    const db = client.db();
    const resetRecord = await db.collection('PasswordReset').findOne({ email });

    if (!resetRecord) {
      return {
        success: false,
        error: 'No active password reset request found for this email. Please request a new code.',
      };
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return {
        success: false,
        error: 'The recovery code has expired. Please request a new code.',
      };
    }

    if (resetRecord.code !== code) {
      return {
        success: false,
        error: 'Invalid recovery code. Please check your email and try again.',
      };
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // 4. Delete used reset record
    await db.collection('PasswordReset').deleteOne({ email });

    return {
      success: true,
      message: 'Password has been successfully reset. You may now log in.',
    };
  } catch (error) {
    console.error('Verify & Reset password error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Password reset failed: ${errorMessage}`,
    };
  }
}
