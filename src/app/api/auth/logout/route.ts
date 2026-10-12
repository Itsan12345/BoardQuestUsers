import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const currentSessionId = cookieStore.get('bq_session_token')?.value;

    if (currentSessionId && userId) {
      try {
        const client = await clientPromise;
        const db = client.db('boardquest');
        let userObjId: ObjectId | null = null;
        try {
          userObjId = new ObjectId(userId);
        } catch {}

        const query = userObjId
          ? { $or: [{ userId }, { userId: userObjId }], sessionId: currentSessionId }
          : { userId, sessionId: currentSessionId };

        await db.collection('UserSession').deleteOne(query);
      } catch (err) {
        console.error('Error removing session in logout API:', err);
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Invalidate auth cookies
    response.cookies.set('user_id', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
    });

    response.cookies.set('bq_session_token', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    const response = NextResponse.json({ success: true });
    response.cookies.set('user_id', '', { path: '/', expires: new Date(0) });
    response.cookies.set('bq_session_token', '', { path: '/', expires: new Date(0) });
    return response;
  }
}
