'use server';

import { prisma } from '@/lib/prisma';
import clientPromise from '@/lib/mongodb-client';
import { cookies } from 'next/headers';
import { unstable_cache, revalidateTag } from 'next/cache';

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

    const topicStats = await getSubjectTopicMasteryAction(subject, userId).catch(() => null);
    const totalTopics = topicStats?.totalTopics || 0;
    const passingTopics = (topicStats?.masteredCount || 0) + (topicStats?.proficientCount || 0);
    const topicCoverage = totalTopics > 0 ? Math.round((passingTopics / totalTopics) * 100) : 0;
    const meetsProficientCoverage = totalTopics > 0 && topicCoverage >= 75;
    const meetsMasteredCoverage = totalTopics > 0 && topicCoverage >= 85;

    let status = "Not Started";
    if (totalQAnswered === 0 && completion === 0) {
      status = "Not Started";
    } else if (proficiency >= 90 && completion >= 50 && meetsMasteredCoverage) {
      status = "Mastered";
    } else if (proficiency >= 75 && completion >= 25 && meetsProficientCoverage) {
      status = "Proficient";
    } else if (proficiency >= 50 || completion > 0 || totalQAnswered > 0) {
      status = "In Training";
    } else {
      status = "Needs Focus";
    }

    await prisma.subjectMastery.upsert({
      where: { userId_subject: { userId, subject } },
      update: { proficiency, status },
      create: { userId, subject, proficiency, status },
    });

    try {
      const client = await clientPromise;
      const db = client.db('boardquest');
      const { ObjectId } = await import('mongodb');
      const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
      await db.collection('SubjectMastery').updateOne(
        {
          subject,
          $or: [
            { userId },
            ...(userObjId ? [{ userId: userObjId }] : [])
          ]
        },
        {
          $set: {
            topicCoverage,
            passingTopics,
            totalTopics,
            updatedAt: new Date()
          }
        }
      );
    } catch (_) {}
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
  topicCoverage?: number; // 0-100: percentage of syllabus topics attempted with passing accuracy (≥70%)
  totalTopics?: number;
  passingTopics?: number;
}

export async function getCategories(): Promise<{ id: string; name: string; icon?: string | null }[]> {
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
}

export const getSubjects = getCategories;

export async function revalidateCategoriesCache() {
  try {
    revalidateTag('curriculum_categories');
  } catch (err) {}
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

export async function getSubjectMetrics(explicitUserId?: string): Promise<SubjectMetrics[]> {
  try {
    let userId: string | undefined = explicitUserId;
    try {
      const cookieStore = await cookies();
      if (!userId) {
        userId = cookieStore.get('user_id')?.value;
      }

      if (!userId) {
        const sessionToken = cookieStore.get('bq_session_token')?.value;
        if (sessionToken) {
          const client = await clientPromise;
          const db = client.db('boardquest');
          const activeSession = await db.collection('UserSession').findOne({ sessionId: sessionToken });
          if (activeSession?.userId) {
            userId = activeSession.userId.toString();
          }
        }
      }
    } catch (_) {}

    if (!userId) {
      try {
        const client = await clientPromise;
        const db = client.db('boardquest');
        const latestSession = await db.collection('UserSession').findOne({}, { sort: { lastActive: -1, createdAt: -1 } });
        if (latestSession?.userId) {
          userId = latestSession.userId.toString();
        }
      } catch (_) {}
    }

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

    // Fetch topic mastery breakdowns for each subject to determine syllabus topic coverage
    const topicBreakdowns = await Promise.all(
      subjects.map(s => getSubjectTopicMasteryAction(s, userId).catch(() => null))
    );

    const metrics: SubjectMetrics[] = [];

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
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

      // Compute topic coverage gate (≥75% topics with passing accuracy for Proficient, ≥85% for Mastered)
      const topicStats = topicBreakdowns[i];
      const totalTopics = topicStats?.totalTopics ?? 0;
      const passingTopics = (topicStats?.masteredCount ?? 0) + (topicStats?.proficientCount ?? 0);
      const topicCoverage = totalTopics > 0 ? Math.round((passingTopics / totalTopics) * 100) : 0;
      const meetsProficientCoverage = totalTopics > 0 && topicCoverage >= 75;
      const meetsMasteredCoverage = totalTopics > 0 && topicCoverage >= 85;

      let masteryStatus: 'Not Started' | 'In Training' | 'Proficient' | 'Mastered' | 'Needs Focus' = 'Not Started';
      if (totalQAnswered === 0 && completion === 0) {
        masteryStatus = 'Not Started';
      } else if (proficiency >= 90 && completion >= 50 && meetsMasteredCoverage) {
        masteryStatus = 'Mastered';
      } else if (proficiency >= 75 && completion >= 25 && meetsProficientCoverage) {
        masteryStatus = 'Proficient';
      } else if (proficiency >= 50 || completion > 0 || totalQAnswered > 0) {
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
        topicCoverage,
        totalTopics,
        passingTopics,
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
      const totalScore = relevantExams.reduce((sum, r) => sum + (r.score || 0), 0);
      const totalQuestions = relevantExams.reduce((sum, r) => sum + (r.total || 0), 0);

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

export interface TopicMasteryDetail {
  id: string;
  name: string;
  description?: string;
  totalQuestions: number;
  attemptedQuestions: number;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  mastery: number;
  status: 'Mastered' | 'Proficient' | 'Needs Review' | 'Unattempted';
  lastPracticed?: string | null;
}

export interface SubjectTopicMasteryResponse {
  subject: string;
  totalTopics: number;
  masteredCount: number;
  proficientCount: number;
  needsReviewCount: number;
  unattemptedCount: number;
  totalQuestions: number;
  totalAnswered: number;
  overallAccuracy: number;
  topics: TopicMasteryDetail[];
}

export async function getSubjectTopicMasteryAction(
  subjectName: string,
  explicitUserId?: string
): Promise<SubjectTopicMasteryResponse> {
  try {
    let userId: string | undefined = explicitUserId;
    try {
      const cookieStore = await cookies();
      if (!userId) {
        userId = cookieStore.get('user_id')?.value;
      }
      if (!userId) {
        const sessionToken = cookieStore.get('bq_session_token')?.value;
        if (sessionToken) {
          const client = await clientPromise;
          const db = client.db('boardquest');
          const activeSession = await db.collection('UserSession').findOne({ sessionId: sessionToken });
          if (activeSession?.userId) {
            userId = activeSession.userId.toString();
          }
        }
      }
    } catch (_) {}

    const client = await clientPromise;
    const db = client.db('boardquest');

    // If still no userId, check if there is an active session in UserSession
    if (!userId) {
      try {
        const latestSession = await db.collection('UserSession').findOne({}, { sort: { lastActive: -1, createdAt: -1 } });
        if (latestSession?.userId) {
          userId = latestSession.userId.toString();
        }
      } catch (_) {}
    }

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleanSub = subjectName.trim();

    // 1. Resolve matching Subject records in database
    const subjectRegexes: RegExp[] = [
      new RegExp('^' + escapeRegex(cleanSub) + '$', 'i')
    ];

    if (cleanSub.toLowerCase().includes('histopath')) {
      subjectRegexes.push(/^Histopathology and Medtech Laws$/i);
      subjectRegexes.push(/^Histopathology & MT Laws$/i);
    } else if (cleanSub.toLowerCase().includes('microscopy') || cleanSub.toLowerCase().includes('parasit')) {
      subjectRegexes.push(/^Clinical Microscopy & Parasitology$/i);
    } else if (cleanSub.toLowerCase().includes('immuno')) {
      subjectRegexes.push(/^Immunology & Serology and Immunohematology$/i);
    }

    const matchingSubjects = await db.collection('Subject').find({
      $or: subjectRegexes.map(r => ({ name: r }))
    }).toArray();

    const idStrings: string[] = [];
    const idObjects: any[] = [];
    matchingSubjects.forEach(s => {
      idStrings.push(s._id.toString());
      idObjects.push(s._id);
    });

    // 2. Fetch canonical topics from Topic collection (if populated)
    const canonicalTopics = (idStrings.length > 0)
      ? await db.collection('Topic').find({
          $or: [
            { subjectId: { $in: idStrings } },
            { subjectId: { $in: idObjects } }
          ]
        }).toArray()
      : [];

    // 3. Fetch questions assigned to this subject
    const questionFilter: any = idStrings.length > 0
      ? {
          $or: [
            { categoryId: { $in: idStrings } },
            { categoryId: { $in: idObjects } },
            { subjectId: { $in: idStrings } },
            { subjectId: { $in: idObjects } }
          ]
        }
      : { topic: new RegExp(escapeRegex(cleanSub), 'i') };

    const questionDocs = await db.collection('Question').find(questionFilter).project({
      _id: 1,
      topic: 1,
      difficulty: 1,
      status: 1
    }).toArray();

    // 4. Fetch User Question Attempts for this user across these questions
    const attemptMap = new Map<string, { attempts: number; correct: number; lastAttempt?: string }>();
    if (userId && questionDocs.length > 0) {
      try {
        const { ObjectId } = await import('mongodb');
        const userConditions: any[] = [userId];
        if (ObjectId.isValid(userId)) {
          userConditions.push(new ObjectId(userId));
        }

        const qIdStrings = questionDocs.map(q => q._id.toString());
        const qObjIds = questionDocs.map(q => q._id);

        const attempts = await db.collection('UserQuestionAttempt').find({
          userId: { $in: userConditions },
          questionId: { $in: [...qIdStrings, ...qObjIds] }
        }).toArray();

        attempts.forEach(a => {
          const qId = a.questionId?.toString();
          if (qId) {
            const existing = attemptMap.get(qId);
            const numAttempts = typeof a.attempts === 'number' ? a.attempts : 1;
            const numCorrect = typeof a.correct === 'number' ? a.correct : 0;
            const lastAtt = a.lastAttempt ? new Date(a.lastAttempt).toISOString() : undefined;
            if (existing) {
              existing.attempts += numAttempts;
              existing.correct += numCorrect;
              if (lastAtt && (!existing.lastAttempt || new Date(lastAtt) > new Date(existing.lastAttempt))) {
                existing.lastAttempt = lastAtt;
              }
            } else {
              attemptMap.set(qId, {
                attempts: numAttempts,
                correct: numCorrect,
                lastAttempt: lastAtt
              });
            }
          }
        });
      } catch (attErr) {
        console.warn('Failed to fetch user question attempts for topic mastery:', attErr);
      }
    }

    // 5. Aggregate into Topic buckets
    const topicMap = new Map<string, {
      id: string;
      name: string;
      description?: string;
      totalQuestions: number;
      attemptedQuestions: number;
      totalAttempts: number;
      totalCorrect: number;
      lastPracticed?: string | null;
    }>();

    // Seed canonical topics
    canonicalTopics.forEach(t => {
      const norm = (t.name || '').trim().toLowerCase();
      if (!norm) return;
      topicMap.set(norm, {
        id: t._id.toString(),
        name: (t.name || '').trim(),
        description: t.description || undefined,
        totalQuestions: 0,
        attemptedQuestions: 0,
        totalAttempts: 0,
        totalCorrect: 0,
        lastPracticed: null
      });
    });

    // Populate question counts and user performance
    questionDocs.forEach(q => {
      const rawTopic = (q.topic || 'General Concepts').trim();
      const norm = rawTopic.toLowerCase();
      let entry = topicMap.get(norm);
      if (!entry) {
        entry = {
          id: q._id.toString(),
          name: rawTopic,
          totalQuestions: 0,
          attemptedQuestions: 0,
          totalAttempts: 0,
          totalCorrect: 0,
          lastPracticed: null
        };
        topicMap.set(norm, entry);
      }
      entry.totalQuestions++;

      const att = attemptMap.get(q._id.toString());
      if (att && att.attempts > 0) {
        entry.attemptedQuestions++;
        entry.totalAttempts += att.attempts;
        entry.totalCorrect += att.correct;
        if (att.lastAttempt) {
          if (!entry.lastPracticed || new Date(att.lastAttempt) > new Date(entry.lastPracticed)) {
            entry.lastPracticed = att.lastAttempt;
          }
        }
      }
    });

    // 6. Compute metrics and status for each topic
    let grandTotalQuestions = 0;
    let grandTotalAnswered = 0;
    let grandTotalAttempts = 0;
    let grandTotalCorrect = 0;

    let masteredCount = 0;
    let proficientCount = 0;
    let needsReviewCount = 0;
    let unattemptedCount = 0;

    const topics: TopicMasteryDetail[] = Array.from(topicMap.values()).map(t => {
      grandTotalQuestions += t.totalQuestions;
      grandTotalAnswered += t.attemptedQuestions;
      grandTotalAttempts += t.totalAttempts;
      grandTotalCorrect += t.totalCorrect;

      const accuracy = t.totalAttempts > 0 ? Math.round((t.totalCorrect / t.totalAttempts) * 100) : 0;
      const coverageRatio = t.totalQuestions > 0 ? Math.min(1.0, t.attemptedQuestions / Math.min(5, Math.max(1, t.totalQuestions))) : 0;
      const mastery = t.totalAttempts > 0 ? Math.round(accuracy * (0.6 + 0.4 * coverageRatio)) : 0;

      let status: 'Mastered' | 'Proficient' | 'Needs Review' | 'Unattempted' = 'Unattempted';
      if (t.totalAttempts === 0) {
        status = 'Unattempted';
        unattemptedCount++;
      } else if (accuracy >= 85 && t.attemptedQuestions >= Math.min(3, Math.max(1, t.totalQuestions))) {
        status = 'Mastered';
        masteredCount++;
      } else if (accuracy >= 70 && t.totalAttempts >= 2) {
        status = 'Proficient';
        proficientCount++;
      } else {
        status = 'Needs Review';
        needsReviewCount++;
      }

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        totalQuestions: t.totalQuestions,
        attemptedQuestions: t.attemptedQuestions,
        totalAttempts: t.totalAttempts,
        totalCorrect: t.totalCorrect,
        accuracy,
        mastery,
        status,
        lastPracticed: t.lastPracticed
      };
    });

    // Sort topics: Needs Review first, then Proficient, then Unattempted, then Mastered
    const statusWeight: Record<string, number> = {
      'Needs Review': 1,
      'Proficient': 2,
      'Unattempted': 3,
      'Mastered': 4
    };

    topics.sort((a, b) => {
      const wDiff = statusWeight[a.status] - statusWeight[b.status];
      if (wDiff !== 0) return wDiff;
      if (a.status === 'Needs Review' || a.status === 'Proficient') {
        return a.accuracy - b.accuracy; // lowest accuracy first
      }
      return b.totalQuestions - a.totalQuestions; // highest questions first
    });

    const overallAccuracy = grandTotalAttempts > 0
      ? Math.round((grandTotalCorrect / grandTotalAttempts) * 100)
      : 0;

    return {
      subject: matchingSubjects[0]?.name || subjectName,
      totalTopics: topics.length,
      masteredCount,
      proficientCount,
      needsReviewCount,
      unattemptedCount,
      totalQuestions: grandTotalQuestions,
      totalAnswered: grandTotalAnswered,
      overallAccuracy,
      topics
    };
  } catch (error) {
    console.error('Failed to get subject topic mastery:', error);
    return {
      subject: subjectName,
      totalTopics: 0,
      masteredCount: 0,
      proficientCount: 0,
      needsReviewCount: 0,
      unattemptedCount: 0,
      totalQuestions: 0,
      totalAnswered: 0,
      overallAccuracy: 0,
      topics: []
    };
  }
}


