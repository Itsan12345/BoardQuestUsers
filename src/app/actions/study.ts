'use server';

import { prisma } from '@/lib/prisma';
import clientPromise from '@/lib/mongodb-client';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { SUBJECT_AREAS } from '@/lib/game-logic';

export interface LearningModuleData {
  id: string;
  title: string;
  description?: string | null;
  fileUrls: string[];
  order: number;
  isPublished: boolean;
  categoryId: string;
  authorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getLearningModules = unstable_cache(
  async (): Promise<LearningModuleData[]> => {
    if (typeof (prisma as any).learningModule?.findMany === 'function') {
      try {
        const modules = await (prisma as any).learningModule.findMany({
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        });
        return JSON.parse(JSON.stringify(modules)).map((m: any) => ({
          ...m,
          categoryId: m.subjectId ? m.subjectId.toString() : (m.categoryId ? m.categoryId.toString() : '')
        }));
      } catch (err) {
        // Fallback silently to raw MongoDB client
      }
    }

    try {
      const client = await clientPromise;
      const db = client.db('boardquest');
      const docs = await db.collection('LearningModule').find({ isPublished: true }).sort({ order: 1 }).toArray();
      return docs.map(doc => ({
        id: doc._id.toString(),
        title: doc.title || 'Untitled Module',
        description: doc.description || null,
        fileUrls: Array.isArray(doc.fileUrls) ? doc.fileUrls : [],
        order: typeof doc.order === 'number' ? doc.order : 0,
        isPublished: doc.isPublished !== false,
        categoryId: doc.subjectId ? doc.subjectId.toString() : (doc.categoryId ? doc.categoryId.toString() : ''),
        authorId: doc.authorId ? doc.authorId.toString() : null,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
      }));
    } catch (rawErr) {
      console.error('Failed to fetch learning modules via MongoDB client:', rawErr);
      return [];
    }
  },
  ['curriculum_modules'],
  { revalidate: 3600, tags: ['curriculum_modules'] }
);

const CURRICULUM_LESSONS_MAP: Record<string, { id: string; title: string; duration: string }[]> = {
  'Clinical Chemistry': [
    { id: 'cc1', title: 'Carbohydrate Metabolism & Disorders', duration: '45m' },
    { id: 'cc2', title: 'Lipid Profile & Lipoproteins', duration: '60m' },
    { id: 'cc3', title: 'Renal Function Tests & NPNs', duration: '40m' },
  ],
  'Hematology': [
    { id: 'hem1', title: 'RBC Morphology & Anemias', duration: '50m' },
    { id: 'hem2', title: 'WBC Disorders & Leukemias', duration: '75m' },
  ],
  'Microbiology': [
    { id: 'mic1', title: 'Bacteriology: Gram Positives', duration: '65m' },
    { id: 'mic2', title: 'Enterobacteriaceae & Non-fermenters', duration: '90m' },
  ],
  'Immunology & Serology and Immunohematology': [
    { id: 'bb1', title: 'ABO & Rh Blood Group Systems', duration: '55m' },
    { id: 'bb2', title: 'Blood Component Therapy', duration: '50m' },
  ],
  'Clinical Microscopy & Parasitology': [
    { id: 'cm1', title: 'Routine Urinalysis: Physical & Chemical', duration: '40m' },
    { id: 'cm2', title: 'CSF & Other Body Fluids Analysis', duration: '50m' },
  ],
  'Histopathology & MT Laws': [
    { id: 'hp1', title: 'Tissue Fixation & Processing', duration: '50m' },
    { id: 'law1', title: 'RA 5527: Phil MedTech Act of 1969', duration: '45m' },
  ],
  'Histopathology and Medtech Laws': [
    { id: 'hp1', title: 'Tissue Fixation & Processing', duration: '50m' },
    { id: 'law1', title: 'RA 5527: Phil MedTech Act of 1969', duration: '45m' },
  ],
};

export async function getCurriculumLessonsForSubject(subject: string) {
  if (CURRICULUM_LESSONS_MAP[subject]) {
    return CURRICULUM_LESSONS_MAP[subject];
  }
  const clean = subject.trim().toLowerCase();
  for (const [key, lessons] of Object.entries(CURRICULUM_LESSONS_MAP)) {
    if (key.trim().toLowerCase() === clean) {
      return lessons;
    }
  }
  const slug = subject.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return [
    { id: `${slug}-1`, title: `${subject} Fundamentals & Core Concepts`, duration: '45m' },
    { id: `${slug}-2`, title: `${subject} Protocols & Comprehensive Review`, duration: '60m' },
  ];
}

export async function syncSubjectMastery(userId: string, subject: string) {
  try {
    const lessons = await getCurriculumLessonsForSubject(subject);
    const validLessonIds = lessons.map(l => l.id);
    const totalLessons = lessons.length;

    const completedLessons = await prisma.lessonCompletion.count({
      where: {
        userId,
        subject,
        status: 'completed',
        lessonId: { in: validLessonIds }
      },
    });
    const completion = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    const examResults = await prisma.examResult.findMany({
      where: { userId, subject },
      select: { accuracy: true, score: true, total: true },
    });

    const totalQAnswered = examResults.reduce((sum, result) => sum + (result.total || 0), 0);
    const totalCorrect = examResults.reduce((sum, result) => sum + (result.score || 0), 0);
    const rawAccuracy = totalQAnswered > 0 ? (totalCorrect / totalQAnswered) * 100 : 0;

    // Volume Weight Factor: Requires answering at least 100 questions for full accuracy weight (matches 1 full 100-question PRC board paper per subject)
    const volumeWeight = Math.min(1.0, totalQAnswered / 100);

    let proficiency = 0;
    if (totalQAnswered > 0) {
      proficiency = Math.round(rawAccuracy * volumeWeight);
    }

    let status = "Not Started";
    if (totalQAnswered === 0 && completion === 0) {
      status = "Not Started";
    } else if (proficiency >= 80 && totalQAnswered >= 25) {
      status = "Mastered";
    } else if (proficiency >= 65 && totalQAnswered >= 15) {
      status = "Proficient";
    } else if (proficiency >= 35 || totalQAnswered >= 1) {
      status = "In Training";
    } else {
      status = "Needs Focus";
    }

    await prisma.subjectMastery.upsert({
      where: { userId_subject: { userId, subject } },
      update: { proficiency, status },
      create: { userId, subject, proficiency, status },
    });
  } catch (error) {
    console.error(`Failed to sync SubjectMastery for ${subject}:`, error);
  }
}

export interface SubjectMetrics {
  subject: string;
  completion: number; // 0-100: percentage of lessons completed
  mastery: number; // 0-100: raw accuracy
  proficiency: number; // 0-100: volume-weighted proficiency
  totalQuestionsAnswered: number;
  totalCorrect: number;
  masteryStatus: 'Not Started' | 'In Training' | 'Proficient' | 'Mastered' | 'Needs Focus';
}

export const getCategories = unstable_cache(
  async (): Promise<{ id: string; name: string; icon?: string | null }[]> => {
    // 1. Try Prisma ORM Subject table
    if (typeof (prisma as any).subject?.findMany === 'function') {
      try {
        const subjects = await (prisma as any).subject.findMany({
          select: { id: true, name: true, icon: true },
          orderBy: { createdAt: 'asc' }
        });
        if (subjects && subjects.length > 0) {
          return JSON.parse(JSON.stringify(subjects));
        }
      } catch (err) {}
    }

    // 2. Query MongoDB 'Subject' collection directly
    try {
      const client = await clientPromise;
      const db = client.db('boardquest');
      const subjectDocs = await db.collection('Subject').find({}).sort({ createdAt: 1 }).toArray();
      if (subjectDocs && subjectDocs.length > 0) {
        return subjectDocs.map(doc => ({
          id: doc._id.toString(),
          name: doc.name || 'Untitled Subject',
          icon: doc.icon || null
        }));
      }
    } catch (rawErr) {
      console.error('Failed to fetch subjects via MongoDB client:', rawErr);
    }

    // If no subjects exist in Subject collection, return empty array
    return [];
  },
  ['curriculum_categories'],
  { revalidate: 3600, tags: ['curriculum_categories'] }
);

export const getSubjects = getCategories;

export async function getUserLessonCompletions(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return {};

    const completions = await prisma.lessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true, status: true }
    });

    const map: Record<string, string> = {};
    completions.forEach(c => {
      map[c.lessonId] = c.status;
    });

    return map;
  } catch (error) {
    console.error('Failed to get lesson completions:', error);
    return {};
  }
}

export async function getSubjectMetrics(): Promise<SubjectMetrics[]> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return [];
    }

    let subjects = [
      'Clinical Chemistry',
      'Microbiology',
      'Hematology',
      'Immunology & Serology and Immunohematology',
      'Clinical Microscopy & Parasitology',
      'Histopathology and Medtech Laws',
    ];

    try {
      if (typeof (prisma as any).subject?.findMany === 'function') {
        const dbCategories = await (prisma as any).subject.findMany({
          select: { name: true },
          orderBy: { createdAt: 'asc' }
        });
        if (dbCategories && dbCategories.length > 0) {
          subjects = dbCategories.map((c: any) => c.name);
        }
      }
    } catch (dbErr) {
      console.warn('Database timeout on subject fetch, using fallback subjects list:', dbErr);
    }

    const [allCompletions, allExamResults, allMasteryRecords, categoriesList, allModulesList] = await Promise.all([
      prisma.lessonCompletion.findMany({
        where: { userId, status: 'completed' },
        select: { subject: true, lessonId: true }
      }),
      prisma.examResult.findMany({
        where: { userId },
        select: { subject: true, accuracy: true, score: true, total: true }
      }),
      prisma.subjectMastery.findMany({
        where: { userId },
        select: { subject: true, proficiency: true, status: true }
      }),
      getCategories().catch(() => []),
      getLearningModules().catch(() => [])
    ]);

    if (categoriesList && categoriesList.length > 0) {
      subjects = categoriesList.map(c => c.name);

      // Clean up orphan SubjectMastery records in MongoDB for non-existent subjects
      prisma.subjectMastery.deleteMany({
        where: {
          userId,
          subject: { notIn: subjects }
        }
      }).catch(err => console.warn('SubjectMastery cleanup notice:', err));
    }

    const metrics: SubjectMetrics[] = [];

    for (const subject of subjects) {
      const normSubject = subject.trim().toLowerCase();
      const catMatch = categoriesList.find(c => c.name.trim().toLowerCase() === normSubject);
      const catId = catMatch?.id;

      let validLessonIds: Set<string>;
      let totalLessons = 0;

      const dynamicModulesForCat = catId ? allModulesList.filter(m => m.categoryId === catId) : [];

      if (dynamicModulesForCat.length > 0) {
        validLessonIds = new Set(dynamicModulesForCat.map(m => m.id));
        totalLessons = dynamicModulesForCat.length;
      } else {
        const fallbackLessons = await getCurriculumLessonsForSubject(subject);
        validLessonIds = new Set(fallbackLessons.map(l => l.id));
        totalLessons = fallbackLessons.length;
      }

      const completedLessons = allCompletions.filter(
        c => (c.subject === subject || (c.subject && c.subject.trim().toLowerCase() === normSubject)) && validLessonIds.has(c.lessonId)
      ).length;

      const examResults = allExamResults.filter(
        e => e.subject === subject || (e.subject && e.subject.trim().toLowerCase() === normSubject)
      );

      const dbMastery = allMasteryRecords.find(
        m => m.subject === subject || (m.subject && m.subject.trim().toLowerCase() === normSubject)
      );

      const completion = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

      const totalQAnswered = examResults.reduce((sum, result) => sum + (result.total || 0), 0);
      const totalCorrect = examResults.reduce((sum, result) => sum + (result.score || 0), 0);
      const rawAccuracy = totalQAnswered > 0 ? (totalCorrect / totalQAnswered) * 100 : 0;

      // Volume Weight Factor: Requires answering at least 100 questions for full accuracy weight (matches 1 full 100-question PRC board paper per subject)
      const volumeWeight = Math.min(1.0, totalQAnswered / 100);

      let proficiency = 0;
      if (totalQAnswered > 0) {
        proficiency = Math.round(rawAccuracy * volumeWeight);
      } else if (dbMastery && typeof dbMastery.proficiency === 'number') {
        proficiency = dbMastery.proficiency;
      } else {
        proficiency = 0;
      }

      let masteryStatus: 'Not Started' | 'In Training' | 'Proficient' | 'Mastered' | 'Needs Focus' = 'Not Started';
      if (totalQAnswered === 0 && completion === 0) {
        masteryStatus = 'Not Started';
      } else if (proficiency >= 80 && totalQAnswered >= 25) {
        masteryStatus = 'Mastered';
      } else if (proficiency >= 65 && totalQAnswered >= 15) {
        masteryStatus = 'Proficient';
      } else if (proficiency >= 35 || totalQAnswered >= 1) {
        masteryStatus = 'In Training';
      } else {
        masteryStatus = 'Needs Focus';
      }

      metrics.push({
        subject,
        completion,
        mastery: Math.round(rawAccuracy),
        proficiency,
        totalQuestionsAnswered: totalQAnswered,
        totalCorrect,
        masteryStatus,
      });
    }

    return metrics;
  } catch (error) {
    console.error('Failed to get subject metrics:', error);
    return [];
  }
}

export async function updateLessonStatus(
  subject: string,
  lessonId: string,
  status: 'completed' | 'in-progress' | 'not-started'
): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return false;
    }

    await prisma.lessonCompletion.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        status,
        subject,
      },
      create: {
        userId,
        subject,
        lessonId,
        status,
      },
    });

    await syncSubjectMastery(userId, subject);

    return true;
  } catch (error) {
    console.error('Failed to update lesson status:', error);
    return false;
  }
}

export interface SubjectAccuracyHistoryItem {
  subject: string;
  fullSubjectName: string;
  avgAccuracy: number;
  attemptCount: number;
  totalScore: number;
  totalQuestions: number;
}

export async function getSubjectPerformanceHistoryAction(): Promise<SubjectAccuracyHistoryItem[]> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return [];

    const [examResults, achievements] = await Promise.all([
      prisma.examResult.findMany({
        where: { userId },
        select: {
          subject: true,
          accuracy: true,
          score: true,
          total: true,
          timestamp: true,
        },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.achievement.findMany({
        where: { userId, type: 'quest' },
        select: {
          subject: true,
          accuracy: true,
          timestamp: true,
        },
      }),
    ]);

    const standardSubjects = [
      'Clinical Chemistry',
      'Microbiology',
      'Hematology',
      'Immunology & Serology and Immunohematology',
      'Clinical Microscopy & Parasitology',
      'Histopathology and Medtech Laws',
    ];

    const radarLabels: Record<string, string> = {
      'Clinical Chemistry': 'Chemistry',
      'Hematology': 'Hematology',
      'Microbiology': 'Microbiology',
      'Immunology & Serology and Immunohematology': 'Immunochem',
      'Clinical Microscopy & Parasitology': 'Microscopy',
      'Histopathology and Medtech Laws': 'Histopath',
      'Histopathology & MT Laws': 'Histopath',
    };

    const normalize = (name: string) => {
      const lower = (name || '').toLowerCase();
      if (lower.includes('chem')) return 'Clinical Chemistry';
      if (lower.includes('hemat')) return 'Hematology';
      if (lower.includes('microb')) return 'Microbiology';
      if (lower.includes('immuno') || lower.includes('serolog') || lower.includes('blood bank')) return 'Immunology & Serology and Immunohematology';
      if (lower.includes('microscop') || lower.includes('parasit') || lower.includes('urinalysis')) return 'Clinical Microscopy & Parasitology';
      if (lower.includes('histo') || lower.includes('law')) return 'Histopathology and Medtech Laws';
      return name;
    };

    return standardSubjects.map((subName) => {
      const canonical = normalize(subName);
      
      const relevantExams = examResults.filter(e => e.subject && normalize(e.subject) === canonical);
      const relevantAchievements = achievements.filter(a => a.subject && normalize(a.subject) === canonical && a.accuracy !== null && a.accuracy !== undefined);

      let avgAccuracy = 0;
      let attemptCount = relevantExams.length;
      let totalScore = relevantExams.reduce((sum, r) => sum + (r.score || 0), 0);
      let totalQuestions = relevantExams.reduce((sum, r) => sum + (r.total || 0), 0);

      if (relevantExams.length > 0) {
        const sumAcc = relevantExams.reduce((sum, r) => sum + (r.accuracy || 0), 0);
        avgAccuracy = Math.round(sumAcc / relevantExams.length);
      } else if (relevantAchievements.length > 0) {
        const sumAcc = relevantAchievements.reduce((sum, a) => sum + (a.accuracy || 0), 0);
        avgAccuracy = Math.round(sumAcc / relevantAchievements.length);
        attemptCount = relevantAchievements.length;
      }

      return {
        subject: radarLabels[canonical] || canonical.split(' ')[0],
        fullSubjectName: canonical,
        avgAccuracy,
        attemptCount,
        totalScore,
        totalQuestions,
      };
    });
  } catch (error) {
    console.error('Failed to get subject performance history:', error);
    return [];
  }
}

export async function saveStudyNote(moduleId: string, notes: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return false;

    const client = await clientPromise;
    const db = client.db('boardquest');
    await db.collection('StudyNote').updateOne(
      { userId, moduleId },
      { $set: { userId, moduleId, notes, updatedAt: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Failed to save study note to DB:', error);
    return false;
  }
}

export async function getUserStudyNote(moduleId: string): Promise<string> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return '';

    const client = await clientPromise;
    const db = client.db('boardquest');
    const noteDoc = await db.collection('StudyNote').findOne({ userId, moduleId });
    return noteDoc ? noteDoc.notes || '' : '';
  } catch (error) {
    console.warn('Failed to get study note from DB:', error);
    return '';
  }
}

