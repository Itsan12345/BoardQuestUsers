'use server';

import { prisma } from '@/lib/prisma';
import clientPromise from '@/lib/mongodb-client';
import { cookies } from 'next/headers';

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

export async function getLearningModules(): Promise<LearningModuleData[]> {
  if (typeof (prisma as any).learningModule?.findMany === 'function') {
    try {
      const modules = await (prisma as any).learningModule.findMany({
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      });
      return JSON.parse(JSON.stringify(modules));
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
      categoryId: doc.categoryId ? doc.categoryId.toString() : '',
      authorId: doc.authorId ? doc.authorId.toString() : null,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    }));
  } catch (rawErr) {
    console.error('Failed to fetch learning modules via MongoDB client:', rawErr);
    return [];
  }
}

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
      select: { accuracy: true },
    });
    let mastery = 0;
    if (examResults.length > 0) {
      const totalAccuracy = examResults.reduce((sum, result) => sum + result.accuracy, 0);
      mastery = totalAccuracy / examResults.length;
    }

    let proficiency = 0;
    if (examResults.length === 0) {
      proficiency = completion;
    } else {
      proficiency = (completion + mastery) / 2;
    }
    proficiency = Math.round(proficiency);

    let status = "Not Started";
    if (mastery >= 90 || proficiency >= 90) status = "Mastered";
    else if (mastery >= 75 || proficiency >= 75) status = "Proficient";
    else if (mastery >= 60 || proficiency >= 60) status = "In Training";
    else status = "Not Started";

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
  mastery: number; // 0-100: based on actual quest performance
  masteryStatus: 'Not Started' | 'In Training' | 'Proficient' | 'Mastered';
}

export async function getCategories(): Promise<{ id: string; name: string }[]> {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.warn('Failed to fetch categories from DB, using standard fallback list:', error);
    return [
      { id: '1', name: 'Clinical Chemistry' },
      { id: '2', name: 'Microbiology' },
      { id: '3', name: 'Hematology' },
      { id: '4', name: 'Immunology & Serology and Immunohematology' },
      { id: '5', name: 'Clinical Microscopy & Parasitology' },
      { id: '6', name: 'Histopathology and Medtech Laws' },
    ];
  }
}

export async function getUserLessonCompletions(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return {};

    const completions = await prisma.lessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true, status: true }
    });

    const completionMap: Record<string, string> = {};
    completions.forEach(c => {
      completionMap[c.lessonId] = c.status;
    });

    return completionMap;
  } catch (error) {
    console.warn('Failed to get user lesson completions:', error);
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
      const dbCategories = await prisma.category.findMany({
        select: { name: true },
        orderBy: { createdAt: 'asc' }
      });
      if (dbCategories && dbCategories.length > 0) {
        subjects = dbCategories.map(c => c.name);
      }
    } catch (dbErr) {
      console.warn('Database timeout on category fetch, using fallback subjects list:', dbErr);
    }

    const [allCompletions, allExamResults, allMasteryRecords, categoriesList, allModulesList] = await Promise.all([
      prisma.lessonCompletion.findMany({
        where: { userId, status: 'completed' },
        select: { subject: true, lessonId: true }
      }),
      prisma.examResult.findMany({
        where: { userId },
        select: { subject: true, accuracy: true }
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

      let mastery = 0;
      if (examResults.length > 0) {
        const totalAccuracy = examResults.reduce((sum, result) => sum + result.accuracy, 0);
        mastery = totalAccuracy / examResults.length;
      } else if (dbMastery && typeof dbMastery.proficiency === 'number') {
        mastery = dbMastery.proficiency;
      }

      let masteryStatus: 'Not Started' | 'In Training' | 'Proficient' | 'Mastered' = 'Not Started';
      if (mastery >= 90) {
        masteryStatus = 'Mastered';
      } else if (mastery >= 75) {
        masteryStatus = 'Proficient';
      } else if (mastery >= 50) {
        masteryStatus = 'In Training';
      } else {
        masteryStatus = 'Not Started';
      }

      metrics.push({
        subject,
        completion,
        mastery: Math.round(mastery),
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

