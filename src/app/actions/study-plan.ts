
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

