
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb-client';

export type StudyPlanTargetInput = Date | string | { startDate?: Date | string; endDate?: Date | string; targetDate?: Date | string };

export async function saveStudyPlan(targets: Record<string, StudyPlanTargetInput>) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, error: 'Aspirant session not found. Please log in.' };
    }

    // Server-side validation against active ReviewCenterProgram deadline
    const program = await getReviewCenterProgram();
    if (program && program.endDate) {
      const deadline = new Date(program.endDate);
      deadline.setHours(23, 59, 59, 999);

      for (const [subject, val] of Object.entries(targets)) {
        let endDateVal = new Date();
        let startDateVal: Date | null = null;
        if (val instanceof Date) {
          endDateVal = new Date(val);
        } else if (typeof val === 'string') {
          endDateVal = new Date(val);
        } else if (val && typeof val === 'object') {
          const rawEnd = (val as any).endDate || (val as any).targetDate;
          if (rawEnd) endDateVal = new Date(rawEnd);
          if ((val as any).startDate) startDateVal = new Date((val as any).startDate);
        }

        if (endDateVal.getTime() > deadline.getTime() || (startDateVal && startDateVal.getTime() > deadline.getTime())) {
          return {
            success: false,
            error: `Target period for ${subject} cannot exceed the Institutional Final Deadline.`
          };
        }
      }
    }

    const client = await clientPromise;
    const db = client.db('boardquest');

    const operations = Object.entries(targets).map(([subject, val]) => {
      let startDateVal = new Date();
      let endDateVal = new Date();

      if (val instanceof Date) {
        endDateVal = new Date(val);
      } else if (typeof val === 'string') {
        endDateVal = new Date(val);
      } else if (val && typeof val === 'object') {
        const rawEnd = (val as any).endDate || (val as any).targetDate;
        if (rawEnd) endDateVal = new Date(rawEnd);
        if (val.startDate) startDateVal = new Date(val.startDate);
      }

      return db.collection('StudyPlan').updateOne(
        { userId, subject },
        {
          $set: {
            userId,
            subject,
            startDate: startDateVal,
            endDate: endDateVal,
            updatedAt: new Date()
          },
          $unset: {
            targetDate: ""
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    });

    await Promise.all(operations);

    revalidatePath('/');
    revalidatePath('/study');
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Failed to save study plan via MongoDB driver:', error);
    return { success: false, error: 'Tactical sync failed.' };
  }
}

export interface StudyBlockInput {
  subject: string;
  startDate: string | Date;
  endDate: string | Date;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  goal?: string;
  targetQuestions?: number;
  targetAccuracy?: number;
  notes?: string;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
}

export async function saveStudyBlock(input: StudyBlockInput) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, error: 'Aspirant session not found. Please log in.' };
    }

    if (!input.subject || !input.startDate || !input.endDate) {
      return { success: false, error: 'Subject, start date, and end date are required.' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDateVal = new Date(input.startDate);
    const endDateVal = new Date(input.endDate);
    startDateVal.setHours(0, 0, 0, 0);
    endDateVal.setHours(23, 59, 59, 999);

    if (isNaN(startDateVal.getTime()) || isNaN(endDateVal.getTime())) {
      return { success: false, error: 'Invalid dates provided.' };
    }

    if (startDateVal.getTime() > endDateVal.getTime()) {
      return { success: false, error: 'Start date cannot be after end date.' };
    }

    if (endDateVal.getTime() < today.getTime()) {
      return {
        success: false,
        error: 'Cannot schedule a study block for dates that have already passed.'
      };
    }

    // Ensure start date cannot be in the past
    let effectiveStart = startDateVal;
    if (effectiveStart.getTime() < today.getTime()) {
      effectiveStart = today;
    }

    // Server-side validation against active ReviewCenterProgram deadline
    const program = await getReviewCenterProgram();
    if (program && program.endDate) {
      const deadline = new Date(program.endDate);
      deadline.setHours(23, 59, 59, 999);

      if (endDateVal.getTime() > deadline.getTime() || effectiveStart.getTime() > deadline.getTime()) {
        return {
          success: false,
          error: `Target period for ${input.subject} cannot exceed the Institutional Final Deadline.`
        };
      }
    }

    const client = await clientPromise;
    const db = client.db('boardquest');

    await db.collection('StudyPlan').updateOne(
      { userId, subject: input.subject },
      {
        $set: {
          userId,
          subject: input.subject,
          startDate: effectiveStart,
          endDate: endDateVal,
          priority: input.priority || 'MEDIUM',
          goal: typeof input.goal === 'string' ? input.goal.trim() : '',
          targetQuestions: typeof input.targetQuestions === 'number' ? input.targetQuestions : 50,
          targetAccuracy: typeof input.targetAccuracy === 'number' ? input.targetAccuracy : 75,
          notes: typeof input.notes === 'string' ? input.notes.trim() : '',
          status: input.status || 'IN_PROGRESS',
          updatedAt: new Date()
        },
        $unset: {
          targetDate: ""
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    revalidatePath('/');
    revalidatePath('/study');
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Failed to save study block via MongoDB driver:', error);
    return { success: false, error: 'Failed to save study block.' };
  }
}

export async function deleteStudyBlock(subject: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, error: 'Aspirant session not found.' };
    }

    const client = await clientPromise;
    const db = client.db('boardquest');

    await db.collection('StudyPlan').deleteOne({ userId, subject });

    revalidatePath('/');
    revalidatePath('/study');
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete study block via MongoDB driver:', error);
    return { success: false, error: 'Failed to delete study block.' };
  }
}

export async function getStudyPlans(): Promise<any[]> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) return [];

    const client = await clientPromise;
    const db = client.db('boardquest');
    const docs = await db.collection('StudyPlan').find({ userId }).sort({ endDate: 1 }).toArray();

    return docs.map(doc => ({
      id: doc._id.toString(),
      userId: doc.userId,
      subject: doc.subject,
      startDate: doc.startDate ? new Date(doc.startDate).toISOString() : (doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString()),
      endDate: doc.endDate ? new Date(doc.endDate).toISOString() : (doc.targetDate ? new Date(doc.targetDate).toISOString() : new Date().toISOString()),
      priority: doc.priority || 'MEDIUM',
      goal: doc.goal || '',
      targetQuestions: typeof doc.targetQuestions === 'number' ? doc.targetQuestions : 50,
      targetAccuracy: typeof doc.targetAccuracy === 'number' ? doc.targetAccuracy : 75,
      notes: doc.notes || '',
      status: doc.status || 'IN_PROGRESS',
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch study plans via MongoDB client:', error);
    return [];
  }
}

export interface ReviewCenterProgramData {
  id: string;
  title: string;
  description?: string;
  companyName: string;
  category?: string;
  startDate?: string;
  endDate: string;
  status: string;
}

export async function getReviewCenterProgram(): Promise<ReviewCenterProgramData | null> {
  try {
    try {
      const p = await (prisma as any).reviewCenterProgram.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      });
      if (p) return JSON.parse(JSON.stringify(p));
    } catch (_) {
      // Fall through to raw command
    }

    const rawResult: any = await prisma.$runCommandRaw({
      find: "ReviewCenterProgram",
      filter: { status: "ACTIVE" },
      limit: 1
    });

    let firstBatch = rawResult?.cursor?.firstBatch;

    if (!firstBatch || firstBatch.length === 0) {
      const rawResultFallback: any = await prisma.$runCommandRaw({
        find: "ReviewCenterProgram",
        limit: 1
      });
      firstBatch = rawResultFallback?.cursor?.firstBatch;
    }

    if (firstBatch && firstBatch.length > 0) {
      const doc = firstBatch[0];
      const endDateVal = doc.endDate?.$date || doc.endDate;
      const startDateVal = doc.startDate?.$date || doc.startDate;
      const idVal = doc._id?.$oid || doc._id;

      return {
        id: String(idVal),
        title: doc.title || 'Review Period',
        description: doc.description || '',
        companyName: doc.companyName || 'berndt review center',
        category: doc.category || 'Board Review',
        startDate: startDateVal ? new Date(startDateVal).toISOString() : undefined,
        endDate: endDateVal ? new Date(endDateVal).toISOString() : new Date(2026, 10, 30).toISOString(),
        status: doc.status || 'ACTIVE'
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch ReviewCenterProgram:', error);
    return null;
  }
}

