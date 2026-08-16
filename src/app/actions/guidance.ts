'use server';

import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';

export interface GuidanceAssignmentRecord {
  id: string;
  studentId: string;
  advisorId: string;
  assignedById?: string;
  status: 'IN_PROGRESS' | 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'COMPLETED' | string;
  subjectCategory: string;
  reason: string;
  guidanceNotes: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  advisor: {
    id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
    location?: string;
  };
  studentAcknowledged?: boolean;
  assignedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Retrieves all guidance assignments for the authenticated student from MongoDB.
 * Enriches each assignment with advisor details from the AdminUser collection.
 */
export async function getStudentGuidanceAssignmentsAction(): Promise<{
  success: boolean;
  data: GuidanceAssignmentRecord[];
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, data: [], error: 'Not authenticated' };
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Get current user's document to also check by email or other identifiers
    const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    const userQuery: any = userObjId
      ? { $or: [{ _id: userObjId }, { _id: userId }] }
      : { _id: userId };

    const currentUser = await db.collection('User').findOne(userQuery);

    const studentQueries: any[] = [
      { studentId: userId },
      ...(userObjId ? [{ studentId: userObjId }] : []),
    ];

    if (currentUser?.email) {
      studentQueries.push({ studentEmail: currentUser.email.toLowerCase() });
      studentQueries.push({ email: currentUser.email.toLowerCase() });
    }

    // 2. Fetch all GuidanceAssignment documents for this student
    const assignments = await db
      .collection('GuidanceAssignment')
      .find({ $or: studentQueries })
      .sort({ createdAt: -1 })
      .toArray();

    if (!assignments || assignments.length === 0) {
      return { success: true, data: [] };
    }

    // 3. Collect unique advisor IDs and fetch their AdminUser details in bulk
    const advisorIds = assignments
      .map(a => a.advisorId)
      .filter(Boolean);

    const assignerIds = assignments
      .map(a => a.assignedById)
      .filter(Boolean);

    const allAdminIds = Array.from(new Set([...advisorIds, ...assignerIds]));

    const adminQueryIds: any[] = [];
    allAdminIds.forEach(id => {
      adminQueryIds.push(id);
      if (typeof id === 'string' && ObjectId.isValid(id)) {
        adminQueryIds.push(new ObjectId(id));
      }
    });

    const admins = await db
      .collection('AdminUser')
      .find({ _id: { $in: adminQueryIds } })
      .project({ password: 0 })
      .toArray();

    const adminMap = new Map<string, any>();
    admins.forEach(admin => {
      const stringId = admin._id.toString();
      adminMap.set(stringId, admin);
      adminMap.set(admin._id, admin);
    });

    // 4. Transform and enrich assignments
    const formattedData: GuidanceAssignmentRecord[] = assignments.map(doc => {
      const advisorDoc = doc.advisorId ? adminMap.get(doc.advisorId.toString()) || adminMap.get(doc.advisorId) : null;
      const assignerDoc = doc.assignedById ? adminMap.get(doc.assignedById.toString()) || adminMap.get(doc.assignedById) : null;

      const advisorName = advisorDoc?.name || (doc.advisorName ? doc.advisorName : 'Faculty Academic Advisor');
      const advisorEmail = advisorDoc?.email || doc.advisorEmail || '';
      const advisorRole = advisorDoc?.role || doc.advisorRole || 'TEACHER';

      return {
        id: doc._id.toString(),
        studentId: doc.studentId?.toString() || userId,
        advisorId: doc.advisorId?.toString() || '',
        assignedById: doc.assignedById?.toString() || '',
        status: (doc.status || 'IN_PROGRESS').toUpperCase(),
        subjectCategory: doc.subjectCategory || 'General Academic Guidance',
        reason: doc.reason || 'Manual referral for board licensure examination guidance.',
        guidanceNotes: doc.guidanceNotes || '',
        resolutionNotes: doc.resolutionNotes || '',
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
        studentAcknowledged: !!doc.studentAcknowledged,
        advisor: {
          id: doc.advisorId?.toString() || '',
          name: advisorName,
          email: advisorEmail,
          role: advisorRole,
          phoneNumber: advisorDoc?.phoneNumber || '',
          location: advisorDoc?.location || 'Philippines',
        },
        assignedBy: assignerDoc ? {
          id: doc.assignedById?.toString() || '',
          name: assignerDoc.name || 'System Administrator',
          email: assignerDoc.email || '',
          role: assignerDoc.role || 'ADMIN',
        } : undefined,
      };
    });

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('Failed to fetch student guidance assignments:', error);
    return { success: false, data: [], error: 'Failed to load guidance assignments' };
  }
}

/**
 * Acknowledges a guidance assignment or records notes from the student
 */
export async function acknowledgeGuidanceAction(guidanceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const client = await clientPromise;
    const db = client.db();

    const gObjId = ObjectId.isValid(guidanceId) ? new ObjectId(guidanceId) : null;
    const filterQuery: any = gObjId
      ? { $or: [{ _id: gObjId }, { _id: guidanceId }] }
      : { _id: guidanceId };

    await db.collection('GuidanceAssignment').updateOne(
      filterQuery,
      {
        $set: {
          studentAcknowledged: true,
          studentAcknowledgedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to acknowledge guidance:', error);
    return { success: false, error: 'Failed to acknowledge guidance' };
  }
}
