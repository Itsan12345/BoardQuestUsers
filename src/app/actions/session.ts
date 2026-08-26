'use server';

import { cookies, headers } from 'next/headers';
import clientPromise from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

export interface ActiveSessionRecord {
  id: string;
  sessionId: string;
  deviceName: string;
  os: string;
  browser: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

/**
 * Parses user-agent header into clean OS and Browser info
 */
function parseUserAgent(ua: string) {
  let os = 'Desktop PC';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11 PC';
  else if (/windows/i.test(ua)) os = 'Windows PC';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS / Laptop';
  else if (/iphone/i.test(ua)) os = 'iPhone';
  else if (/ipad/i.test(ua)) os = 'iPad';
  else if (/android/i.test(ua)) os = 'Android Device';
  else if (/linux/i.test(ua)) os = 'Linux PC';

  let browser = 'Web Client';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';

  return {
    os,
    browser,
    deviceName: `${os} • ${browser}`,
  };
}

/**
 * Records or updates current active session in MongoDB
 */
export async function trackActiveSessionAction() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return null;

    let sessionId = cookieStore.get('bq_session_token')?.value;
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      cookieStore.set('bq_session_token', sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    const headerStore = await headers();
    const ua = headerStore.get('user-agent') || 'Unknown Device';
    const { os, browser, deviceName } = parseUserAgent(ua);

    const client = await clientPromise;
    const db = client.db();

    let userObjId: ObjectId | null = null;
    try {
      userObjId = new ObjectId(userId);
    } catch (e) {}

    await db.collection('UserSession').updateOne(
      { userId: userObjId || userId, sessionId },
      {
        $set: {
          userId: userObjId || userId,
          sessionId,
          deviceName,
          os,
          browser,
          userAgent: ua,
          lastActive: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return sessionId;
  } catch (error) {
    console.error('Failed to track active session:', error);
    return null;
  }
}

/**
 * Gets all active sessions for the current authenticated user
 */
export async function getActiveSessionsAction(): Promise<{
  success: boolean;
  sessions: ActiveSessionRecord[];
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, sessions: [], error: 'Not authenticated' };

    // Update current session activity timestamp first
    const currentSessionId = await trackActiveSessionAction();

    const client = await clientPromise;
    const db = client.db();

    let userObjId: ObjectId | null = null;
    try {
      userObjId = new ObjectId(userId);
    } catch (e) {}

    const query = userObjId
      ? { $or: [{ userId }, { userId: userObjId }] }
      : { userId };

    // Fetch all user sessions active within the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessions = await db
      .collection('UserSession')
      .find({
        ...query,
        lastActive: { $gte: thirtyDaysAgo },
      })
      .sort({ lastActive: -1 })
      .toArray();

    const formattedSessions: ActiveSessionRecord[] = sessions.map(s => {
      const isCurrent = s.sessionId === currentSessionId;
      return {
        id: s._id.toString(),
        sessionId: s.sessionId,
        deviceName: s.deviceName || `${s.os || 'Desktop'} • ${s.browser || 'Web Client'}`,
        os: s.os || 'Desktop PC',
        browser: s.browser || 'Web Client',
        lastActive: s.lastActive ? new Date(s.lastActive).toISOString() : new Date().toISOString(),
        isCurrent,
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    return { success: true, sessions: formattedSessions };
  } catch (error: any) {
    console.error('Failed to fetch active sessions:', error);
    return { success: false, sessions: [], error: error.message };
  }
}

/**
 * Terminates/logs out a specific remote device session
 */
export async function terminateSessionAction(sessionIdToTerminate: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const client = await clientPromise;
    const db = client.db();

    let userObjId: ObjectId | null = null;
    try {
      userObjId = new ObjectId(userId);
    } catch (e) {}

    const query = userObjId
      ? { $or: [{ userId }, { userId: userObjId }], sessionId: sessionIdToTerminate }
      : { userId, sessionId: sessionIdToTerminate };

    await db.collection('UserSession').deleteOne(query);

    revalidatePath('/profile');
    return { success: true, message: 'Device session terminated successfully.' };
  } catch (error: any) {
    console.error('Failed to terminate session:', error);
    return { success: false, error: error.message || 'Failed to terminate session' };
  }
}
