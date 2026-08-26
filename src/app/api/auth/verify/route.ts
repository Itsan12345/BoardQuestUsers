import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      // User doesn't exist, clear the cookie
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.delete('user_id');
      response.cookies.delete('bq_session_token');
      return response;
    }

    // Verify if current device session token is still active in MongoDB UserSession
    const sessionToken = cookieStore.get('bq_session_token')?.value;
    if (sessionToken) {
      const client = await clientPromise;
      const db = client.db();

      let userObjId: ObjectId | null = null;
      try {
        userObjId = new ObjectId(userId);
      } catch (e) {}

      const query = userObjId
        ? { $or: [{ userId }, { userId: userObjId }], sessionId: sessionToken }
        : { userId, sessionId: sessionToken };

      const activeSession = await db.collection('UserSession').findOne(query);

      if (!activeSession) {
        // Session was logged out / revoked remotely by another device!
        const response = NextResponse.json({ authenticated: false, message: 'Session revoked' }, { status: 401 });
        response.cookies.delete('user_id');
        response.cookies.delete('bq_session_token');
        return response;
      }
    }

    return NextResponse.json({ authenticated: true, user }, { status: 200 });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
