export interface MtleSubjectScore {
  subject: string;
  shortName: string;
  weight: number; // e.g. 0.20 for 20%
  score: number; // 0-100
  lessonCompletion: number; // 0-100
  masteryScore: number; // 0-100
  examScore: number; // 0-100
  questionsAttempted: number;
  status: 'Critical' | 'Warning' | 'Passing' | 'Mastered';
  notes?: string;
}

export type PrcStatus = 'PASSED' | 'CONDITIONAL' | 'FAILED';

export interface PrcTierInfo {
  tier: 'topnotcher' | 'honors' | 'ready' | 'borderline' | 'critical';
  title: string;
  badge: string;
  color: string;
  description: string;
  bgGradient: string;
}

export interface MtleReadinessResult {
  predictedGwa: number; // 0 - 100
  prcStatus: PrcStatus;
  statusTitle: string;
  statusDescription: string;
  tierInfo: PrcTierInfo;
  confidenceScore: number; // 0 - 100
  confidenceRating: 'Preliminary' | 'Moderate' | 'High' | 'Very High';
  totalQuestionsAttempted: number;
  totalExamsTaken: number;
  failedSubjectsCount: number;
  criticalSubjectsCount: number; // subjects < 50%
  failingWeightSum: number; // sum of weights of subjects < 75%
  belowCutoffWeightSum: number; // sum of weights of subjects < 50%
  subjects: MtleSubjectScore[];
  strongestSubject: MtleSubjectScore | null;
  weakestSubject: MtleSubjectScore | null;
  remediationAdvice: {
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    targetSubject: string;
    pointsNeeded: number;
  }[];
}

// Official PRC / RA 5527 Weight Specifications
export const PRC_SUBJECT_WEIGHTS_MAP: Record<string, { weight: number; shortName: string }> = {
  'Clinical Chemistry': { weight: 0.20, shortName: 'Clin Chem' },
  'Microbiology': { weight: 0.20, shortName: 'Microbio' },
  'Microbiology and Parasitology': { weight: 0.20, shortName: 'Microbio' },
  'Hematology': { weight: 0.20, shortName: 'Hematology' },
  'Immunology & Serology and Immunohematology': { weight: 0.20, shortName: 'Immuno/BB' },
  'Blood Banking & Serology': { weight: 0.20, shortName: 'Immuno/BB' },
  'Clinical Microscopy & Parasitology': { weight: 0.10, shortName: 'Microscopy' },
  'Clinical Microscopy': { weight: 0.10, shortName: 'Microscopy' },
  'Histopathology and Medtech Laws': { weight: 0.10, shortName: 'Histo/MT Laws' },
  'Histopathology & MT Laws': { weight: 0.10, shortName: 'Histo/MT Laws' },
};

export const STANDARD_MTLE_SUBJECTS = [
  'Clinical Chemistry',
  'Microbiology',
  'Hematology',
  'Immunology & Serology and Immunohematology',
  'Clinical Microscopy & Parasitology',
  'Histopathology and Medtech Laws',
];

export const PASSING_GWA_THRESHOLD = 75.0;
export const CRITICAL_SUBJECT_CUTOFF = 50.0;
export const TOPNOTCHER_THRESHOLD = 90.0;
export const HONORS_THRESHOLD = 85.0;
export const BORDERLINE_THRESHOLD = 70.0;

/**
 * Maps any subject name variations from the database to standard MTLE canonical names and weights.
 */
export function normalizeMtleSubject(rawName: string): { canonicalName: string; weight: number; shortName: string } {
  const clean = rawName.trim();
  if (PRC_SUBJECT_WEIGHTS_MAP[clean]) {
    return {
      canonicalName: clean,
      weight: PRC_SUBJECT_WEIGHTS_MAP[clean].weight,
      shortName: PRC_SUBJECT_WEIGHTS_MAP[clean].shortName,
    };
  }

  const lower = clean.toLowerCase();
  if (lower.includes('chem')) {
    return { canonicalName: 'Clinical Chemistry', weight: 0.20, shortName: 'Clin Chem' };
  }
  if (lower.includes('microb')) {
    return { canonicalName: 'Microbiology', weight: 0.20, shortName: 'Microbio' };
  }
  if (lower.includes('hemat')) {
    return { canonicalName: 'Hematology', weight: 0.20, shortName: 'Hematology' };
  }
  if (lower.includes('immuno') || lower.includes('serolog') || lower.includes('blood bank')) {
    return { canonicalName: 'Immunology & Serology and Immunohematology', weight: 0.20, shortName: 'Immuno/BB' };
  }
  if (lower.includes('microscop') || lower.includes('urinalysis') || lower.includes('fluid')) {
    return { canonicalName: 'Clinical Microscopy & Parasitology', weight: 0.10, shortName: 'Microscopy' };
  }
  if (lower.includes('histo') || lower.includes('law')) {
    return { canonicalName: 'Histopathology and Medtech Laws', weight: 0.10, shortName: 'Histo/MT Laws' };
  }

  return { canonicalName: clean, weight: 0.10, shortName: clean.split(' ')[0] };
}

/**
 * Evaluates PRC status and tiers based on GWA and individual subject scores.
 */
export function evaluatePrcStatus(
  gwa: number,
  subjectScores: { subject: string; score: number; weight: number }[]
): {
  prcStatus: PrcStatus;
  statusTitle: string;
  statusDescription: string;
  tierInfo: PrcTierInfo;
} {
  const criticalSubjects = subjectScores.filter(s => s.score < CRITICAL_SUBJECT_CUTOFF);
  const belowCutoffWeightSum = criticalSubjects.reduce((sum, s) => sum + s.weight, 0);

  let prcStatus: PrcStatus = 'PASSED';
  let statusTitle = 'BOARD READY (PASSED)';
  let statusDescription = 'Your predicted general average meets the official 75.00% PRC licensure threshold with no critical subject deficiencies.';

  if (gwa < PASSING_GWA_THRESHOLD) {
    prcStatus = 'FAILED';
    statusTitle = 'REMEDIATION NEEDED (AT RISK)';
    statusDescription = `Predicted GWA (${gwa.toFixed(2)}%) is below the passing cutoff of 75.00%. Target high-yield areas to bridge the gap.`;
  } else if (criticalSubjects.length > 0) {
    // GWA >= 75 but has subject(s) below 50%
    if (belowCutoffWeightSum < 0.60) {
      prcStatus = 'CONDITIONAL';
      statusTitle = 'CONDITIONAL EXAMINEE';
      statusDescription = `Your overall GWA (${gwa.toFixed(2)}%) is passing, but ${criticalSubjects.map(s => s.subject).join(', ')} is below the 50.00% disqualification cutoff.`;
    } else {
      prcStatus = 'FAILED';
      statusTitle = 'FAILED (SUBJECT DEFICIENCY)';
      statusDescription = `Failed in 60% or more of subject weights despite overall score. Focus on low-scoring subjects immediately.`;
    }
  }

  // Determine Tier Info
  let tierInfo: PrcTierInfo;
  if (gwa >= TOPNOTCHER_THRESHOLD && criticalSubjects.length === 0) {
    tierInfo = {
      tier: 'topnotcher',
      title: 'Topnotcher Potential',
      badge: 'National Top 10 Tier',
      color: '#EAB308',
      description: 'Exceptional mastery across all core disciplines. Positioned for national topnotcher placement.',
      bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    };
  } else if (gwa >= HONORS_THRESHOLD && criticalSubjects.length === 0) {
    tierInfo = {
      tier: 'honors',
      title: "Dean's Honors Tier",
      badge: 'High Passing (>85%)',
      color: '#10B981',
      description: 'Strong competency and high consistency across laboratory science areas.',
      bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    };
  } else if (gwa >= PASSING_GWA_THRESHOLD && criticalSubjects.length === 0) {
    tierInfo = {
      tier: 'ready',
      title: 'Board Ready',
      badge: 'Passing Trajectory (75-84%)',
      color: '#3B82F6',
      description: 'Solid passing foundation. Reinforce weaker subjects to ensure high confidence on exam day.',
      bgGradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    };
  } else if (gwa >= BORDERLINE_THRESHOLD) {
    tierInfo = {
      tier: 'borderline',
      title: 'Borderline Zone',
      badge: 'At-Risk (70-74%)',
      color: '#F97316',
      description: 'Just below or near the passing mark. Targeted review of high-weight subjects can quickly elevate your score.',
      bgGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    };
  } else {
    tierInfo = {
      tier: 'critical',
      title: 'Remediation Required',
      badge: 'Critical Intervention (<70%)',
      color: '#EF4444',
      description: 'Significant score gap across essential subjects. Follow the prescribed study plan and guidance recommendations.',
      bgGradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    };
  }

  return { prcStatus, statusTitle, statusDescription, tierInfo };
}

/**
 * Calculates confidence based on attempted questions and quiz/exam volume.
 */
export function calculateConfidenceScore(
  totalQuestions: number,
  totalExams: number
): { confidenceScore: number; confidenceRating: 'Preliminary' | 'Moderate' | 'High' | 'Very High' } {
  // Benchmark: 250+ questions and 5+ exams = 100% confidence
  const questionFactor = Math.min(75, (totalQuestions / 250) * 75);
  const examFactor = Math.min(25, (totalExams / 5) * 25);
  const rawScore = Math.round(questionFactor + examFactor);
  const confidenceScore = Math.max(10, Math.min(100, rawScore));

  let confidenceRating: 'Preliminary' | 'Moderate' | 'High' | 'Very High' = 'Preliminary';
  if (confidenceScore >= 85) confidenceRating = 'Very High';
  else if (confidenceScore >= 65) confidenceRating = 'High';
  else if (confidenceScore >= 40) confidenceRating = 'Moderate';
  else confidenceRating = 'Preliminary';

  return { confidenceScore, confidenceRating };
}

/**
 * Generates tailored, high-impact remediation recommendations based on PRC subject weights.
 */
export function generateRemediationAdvice(
  subjects: MtleSubjectScore[],
  currentGwa: number
) {
  const advice: {
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    targetSubject: string;
    pointsNeeded: number;
  }[] = [];

  // Check for critical <50% subjects first
  const criticals = subjects.filter(s => s.score < CRITICAL_SUBJECT_CUTOFF);
  criticals.forEach(c => {
    const diff = Math.ceil(CRITICAL_SUBJECT_CUTOFF - c.score);
    advice.push({
      title: `Critical Defect: ${c.subject}`,
      description: `Current predicted score (${c.score.toFixed(1)}%) will trigger a conditional/failing status. You need at least +${diff}% to clear the 50% PRC safety line.`,
      priority: 'HIGH',
      targetSubject: c.subject,
      pointsNeeded: diff,
    });
  });

  // Check 20% weight subjects below 75%
  const heavySub75 = subjects.filter(s => s.weight === 0.20 && s.score < PASSING_GWA_THRESHOLD && s.score >= CRITICAL_SUBJECT_CUTOFF);
  heavySub75.forEach(h => {
    const diff = Math.ceil(PASSING_GWA_THRESHOLD - h.score);
    const gwaGain = (diff * h.weight).toFixed(1);
    advice.push({
      title: `High-Yield Boost: ${h.subject} (20% Weight)`,
      description: `Improving ${h.subject} by +${diff}% will directly increase your overall Board GWA by +${gwaGain}%.`,
      priority: 'HIGH',
      targetSubject: h.subject,
      pointsNeeded: diff,
    });
  });

  // If GWA is passing, recommend optimization for honors/topnotcher
  if (currentGwa >= PASSING_GWA_THRESHOLD && advice.length === 0) {
    const lowest = [...subjects].sort((a, b) => a.score - b.score)[0];
    if (lowest && lowest.score < 90) {
      advice.push({
        title: `Topnotcher Push: Elevate ${lowest.subject}`,
        description: `Currently your lowest subject at ${lowest.score.toFixed(1)}%. Raising it to 90% pushes you towards the national Top 10 ranking tier.`,
        priority: 'MEDIUM',
        targetSubject: lowest.subject,
        pointsNeeded: Math.max(1, Math.ceil(90 - lowest.score)),
      });
    }
  }

  return advice.slice(0, 3);
}

/**
 * Calculates simulated GWA in real-time when user adjusts sliders in the "What-If" simulator.
 */
export function simulateWhatIfGwa(
  currentSubjects: MtleSubjectScore[],
  simulatedScores: Record<string, number>
): {
  simulatedGwa: number;
  delta: number;
  simulatedStatus: ReturnType<typeof evaluatePrcStatus>;
} {
  const evaluatedSubjects = currentSubjects.map(s => {
    const score = simulatedScores[s.subject] !== undefined ? simulatedScores[s.subject] : s.score;
    return {
      subject: s.subject,
      score: Math.max(0, Math.min(100, score)),
      weight: s.weight,
    };
  });

  const simulatedGwa = evaluatedSubjects.reduce((sum, s) => sum + s.score * s.weight, 0);
  const currentGwa = currentSubjects.reduce((sum, s) => sum + s.score * s.weight, 0);
  const delta = simulatedGwa - currentGwa;

  const simulatedStatus = evaluatePrcStatus(simulatedGwa, evaluatedSubjects);

  return {
    simulatedGwa: Math.round(simulatedGwa * 100) / 100,
    delta: Math.round(delta * 100) / 100,
    simulatedStatus,
  };
}
