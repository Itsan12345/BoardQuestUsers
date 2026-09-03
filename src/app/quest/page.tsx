"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Skull,
  Zap,
  FlaskConical,
  Microscope,
  Database,
  Stethoscope,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Star,
  Target,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Award,
  Trophy,
  BookOpen,
  Swords,
  Maximize,
  Minimize,
  Clock,
  Activity,
  Biohazard,
  Flame,
  Package,
  ShoppingBag,
  Compass,
  RotateCw,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { QuizInterface, Question } from '@/components/quiz/QuizInterface';
import { ChapterWorldMap } from '@/components/quiz/ChapterWorldMap';
import { SUBJECT_AREAS, XP_PER_QUESTION, calculatePlayerStats } from '@/lib/game-logic';
import { provideExamFeedback } from '@/ai/flows/provide-exam-feedback';
import { getQuestQuestions } from '@/app/actions/arena';
import { completeQuest, getNodeStarsAction, getNodeClearsAction, saveNodeClearAction } from '@/app/actions/quest';
import { getCategories } from '@/app/actions/study';
import { getUserProfile, saveUserInventory, purchaseReagentAction, getUserSettingsAction } from '@/app/actions/user';
import { calculateEarnedBadges, type Badge as BadgeType } from '@/lib/badge-system';
import { playSfx } from '@/lib/audio-manager';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BossSpriteAnimator, type BossAnimState } from '@/components/game/BossSpriteAnimator';
import { HitEffectAnimator } from '@/components/game/HitEffectAnimator';

const SUBJECT_METADATA: Record<string, {
  name: string;
  icon: any;
  color: string;
  enemy: string;
  imageUrl?: string;
  backgroundUrl?: string;
  arenaBackgroundUrl?: string;
  difficulty: number;
  biome: string;
  description: string;
  idleSpriteUrl?: string;
  attackSpriteUrl?: string;
  heavyAttackSpriteUrl?: string;
  attackProjectileUrl?: string;
  idleFrames?: number;
  attackFrames?: number;
  heavyAttackFrames?: number;
  attackProjectileFrames?: number;
  idleFrameWidth?: number;
  attackFrameWidth?: number;
  heavyFrameWidth?: number;
  idleFrameHeight?: number;
  attackFrameHeight?: number;
  heavyFrameHeight?: number;
}> = {
  "Clinical Chemistry": {
    name: "Clinical Chemistry",
    icon: FlaskConical,
    color: "bg-primary",
    enemy: "Hyperglycemic Specter",
    imageUrl: "/images/ClinChem256.png",
    backgroundUrl: "/images/ClinChem256_bg.png",
    arenaBackgroundUrl: "/ui/background_clinicalchem.png",
    difficulty: 4,
    biome: "Crystal Peak Archipelago",
    description: "The air is thick with the scent of ozone and reagents. Master the metabolic currents.",
  },
  "Hematology": {
    name: "Hematology",
    icon: Microscope,
    color: "bg-accent",
    enemy: "Sickle-Cell Reaper",
    imageUrl: "/images/Hema256.png",
    backgroundUrl: "/images/Hema256_bg.png",
    difficulty: 3,
    biome: "The Sanguine Marshes",
    description: "Crimson rivers flow through iron-rich soil. Study the life force within.",
    idleSpriteUrl: "/images/bosses/hematology_finalboss_idleAnimation.png",
    attackSpriteUrl: "/images/bosses/hematology_finalboss_heavyAttackAnimation.png",
    heavyAttackSpriteUrl: "/images/bosses/hematology_finalboss_heavyAttackAnimation.png",
    idleFrames: 6,
    attackFrames: 8,
    heavyAttackFrames: 8,
    idleFrameWidth: 128,
    idleFrameHeight: 128,
    attackFrameWidth: 192,
    attackFrameHeight: 160,
    heavyFrameWidth: 192,
    heavyFrameHeight: 160,
  },
  "Microbiology": {
    name: "Microbiology",
    icon: Database,
    color: "bg-primary",
    enemy: "Biohazard Overlord",
    imageUrl: "/images/MicroBio256.png",
    backgroundUrl: "/images/MicroBio256_bg.png",
    difficulty: 5,
    biome: "Toxic Spore Jungles",
    description: "Invisible dangers lurk in every shadow. Identification is survival."
  },
  "Immunology & Serology and Immunohematology": {
    name: "Immunology & Serology and Immunohematology",
    icon: Stethoscope,
    color: "bg-accent",
    enemy: "Anti-Serum Hydra",
    imageUrl: "/images/ImmunoHema256.png",
    backgroundUrl: "/images/ImmunoHema256_bg.png",
    difficulty: 5,
    biome: "The Serum Sea",
    description: "Navigate the complex tides of antigens and antibodies."
  },
  "Clinical Microscopy & Parasitology": {
    name: "Clinical Microscopy & Parasitology",
    icon: FlaskConical,
    color: "bg-primary",
    enemy: "Crystal Golem",
    imageUrl: "/images/ClinMicro256.png",
    backgroundUrl: "/images/ClinMicro256_bg.png",
    difficulty: 2,
    biome: "Amber Sediment Cliffs",
    description: "Examine the smallest details that reveal the greatest truths.",
    idleSpriteUrl: "/images/bosses/clinmicro_finalboss_idleAnimation.png",
    attackSpriteUrl: "/images/bosses/clinmicro_finalboss_normalAttackAnimation.png",
    heavyAttackSpriteUrl: "/images/bosses/clinmicro_finalboss_heavyAttackAnimation.png",
    idleFrames: 7,
    attackFrames: 17,
    heavyAttackFrames: 11,
  },
  "Histopathology & MT Laws": {
    name: "Histopathology & MT Laws",
    icon: ShieldAlert,
    color: "bg-accent",
    enemy: "Legal Beholder",
    imageUrl: "/images/Hispatho256.png",
    backgroundUrl: "/images/Hispatho256_bg.png",
    difficulty: 3,
    biome: "The Citadel of Codes",
    description: "Where science meets the letter of the law. Preserve the ethics."
  },
  "Histopathology and Medtech Laws": {
    name: "Histopathology and Medtech Laws",
    icon: ShieldAlert,
    color: "bg-accent",
    enemy: "Legal Beholder",
    imageUrl: "/images/Hispatho256.png",
    backgroundUrl: "/images/Hispatho256_bg.png",
    difficulty: 3,
    biome: "The Citadel of Codes",
    description: "Where science meets the letter of the law. Preserve the ethics."
  },
  "Histopathology & Medtech Laws": {
    name: "Histopathology & Medtech Laws",
    icon: ShieldAlert,
    color: "bg-accent",
    enemy: "Legal Beholder",
    imageUrl: "/images/Hispatho256.png",
    backgroundUrl: "/images/Hispatho256_bg.png",
    difficulty: 3,
    biome: "The Citadel of Codes",
    description: "Where science meets the letter of the law. Preserve the ethics."
  }
};

function getSubjectMeta(subjectName: string) {
  if (SUBJECT_METADATA[subjectName]) {
    return SUBJECT_METADATA[subjectName];
  }
  const lower = subjectName.toLowerCase();
  if (lower.includes('histopath') || lower.includes('medtech laws') || lower.includes('mt laws')) {
    return {
      name: subjectName,
      icon: ShieldAlert,
      color: "bg-accent",
      enemy: "Legal Beholder",
      imageUrl: "/images/Hispatho256.png",
      backgroundUrl: "/images/Hispatho256_bg.png",
      difficulty: 3,
      biome: "The Citadel of Codes",
      description: "Where science meets the letter of the law. Preserve the ethics."
    };
  }
  if (lower.includes('microscopy') || lower.includes('parasito')) {
    return SUBJECT_METADATA["Clinical Microscopy & Parasitology"];
  }
  if (lower.includes('chem')) {
    return SUBJECT_METADATA["Clinical Chemistry"];
  }
  if (lower.includes('hema') && !lower.includes('immuno')) {
    return SUBJECT_METADATA["Hematology"];
  }
  if (lower.includes('microbio')) {
    return SUBJECT_METADATA["Microbiology"];
  }
  if (lower.includes('immuno') || lower.includes('serology')) {
    return SUBJECT_METADATA["Immunology & Serology and Immunohematology"];
  }

  return {
    name: subjectName,
    icon: FlaskConical,
    color: "bg-primary",
    enemy: "Exam Guardian",
    imageUrl: "/images/Hispatho256.png",
    backgroundUrl: "/images/Hispatho256_bg.png",
    arenaBackgroundUrl: "/ui/background_clinicalchem.png",
    difficulty: 3,
    biome: "Laboratory Science Realm",
    description: `Master topics in ${subjectName} to prove your expertise.`
  };
}

type UserAnswerRecord = {
  questionIndex: number;
  questionId?: string;
  selectedLetter: string;
  isCorrect: boolean;
  difficulty?: string;
};

export default function LearningQuest() {
  const { toast } = useToast();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [quizMode, setQuizMode] = useState<'learning' | 'test' | 'boss-battle'>('learning');
  const [modeSelectDialogOpen, setModeSelectDialogOpen] = useState(false);
  const [leaveConfirmDialogOpen, setLeaveConfirmDialogOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<'mode' | 'details' | 'limit'>('mode');
  const [mobileModalStep, setMobileModalStep] = useState<'info' | 'action'>('info');
  const [score, setScore] = useState(0);
  const [fetchingExplanations, setFetchingExplanations] = useState<Record<number, boolean>>({});
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch dynamic categories directly from MongoDB Category collection
  useEffect(() => {
    async function loadCategories() {
      try {
        const [cats, userSettings] = await Promise.all([
          getCategories().catch(() => []),
          getUserSettingsAction().catch(() => null),
        ]);
        if (cats && cats.length > 0) {
          const names = cats.map(c => c.name);
          setDynamicCategories(names);

          // Priority 1: URL search param ?subject=
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlSubject = searchParams?.get('subject');

          // Priority 2: Priority Focus Subject from Account Settings
          const settingsFocus = userSettings?.focusSubject;
          const savedFocus = settingsFocus !== undefined ? settingsFocus : (typeof window !== 'undefined' ? localStorage.getItem('bq_pref_focus_subject') : null);
          const validFocus = savedFocus && savedFocus !== 'none' ? savedFocus : null;

          if (urlSubject && names.includes(urlSubject)) {
            setSelectedSubject(urlSubject);
          } else if (validFocus && names.includes(validFocus)) {
            setSelectedSubject(validFocus);
          } else {
            setSelectedSubject(names[0]);
          }
        }
      } catch (err) {
        console.error("Error loading categories from MongoDB:", err);
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleRescan = async () => {
    setCategoriesLoading(true);
    try {
      const cats = await getCategories().catch(() => []);
      if (cats && cats.length > 0) {
        const names = cats.map(c => c.name);
        setDynamicCategories(names);
        setSelectedSubject(names[0]);
      } else {
        setDynamicCategories([]);
      }
    } catch (err) {
      console.error("Error re-scanning categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Sync fullscreen state with native browser events (e.g. hitting ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await fullscreenRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([]);
  const [confidence, setConfidence] = useState<string | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<BadgeType[]>([]);
  const [questStartTime, setQuestStartTime] = useState<number | null>(null);
  const [questCompletionTime, setQuestCompletionTime] = useState<number>(0);
  const [confidenceSubmitted, setConfidenceSubmitted] = useState(false);
  const [confidenceDialogOpen, setConfidenceDialogOpen] = useState(false);
  const [thankYouDialogOpen, setThankYouDialogOpen] = useState(false);
  const [judgementText, setJudgementText] = useState<string | null>(null);
  const isFinishingRef = useRef(false);
  const hasSubmittedConfidenceRef = useRef(false);
  const hasShownThankYouRef = useRef(false);

  // Cutscene State
  const [introPhase, setIntroPhase] = useState<'hidden' | 'cutscene' | 'vs' | 'active'>('active');

  // RPG States
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [isAnimating, setIsAnimating] = useState<"player" | "enemy" | null>(null);

  // Advanced Boss Mechanics States
  const [turnCount, setTurnCount] = useState(0);
  const [bossShieldActive, setBossShieldActive] = useState(false);
  const [playerPoisoned, setPlayerPoisoned] = useState(false);
  const [battleOutcome, setBattleOutcome] = useState<'victory' | 'defeat' | null>(null);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [bossDifficulty, setBossDifficulty] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userLastName, setUserLastName] = useState<string>('Aspirant');
  const [streak, setStreak] = useState(0);
  const [bossAnimState, setBossAnimState] = useState<BossAnimState>('idle');
  const [playerAnimState, setPlayerAnimState] = useState<'idle' | 'attack'>('idle');

  // Bookworm Adventures 3-Stage Progression & Chapter Map State
  interface SubjectNodeConfig {
    id: string;
    nodeNumber: number;
    title: string;
    subtopic: string;
    minionName: string;
    minionIcon: string;
    miniBossName: string;
    miniBossIcon: string;
    bossName: string;
    bossIcon: string;
    idleSpriteUrl?: string;
    attackSpriteUrl?: string;
    heavyAttackSpriteUrl?: string;
    attackProjectileUrl?: string;
    idleFrames?: number;
    attackFrames?: number;
    heavyAttackFrames?: number;
    attackProjectileFrames?: number;
    idleFrameWidth?: number;
    attackFrameWidth?: number;
    heavyFrameWidth?: number;
    idleFrameHeight?: number;
    attackFrameHeight?: number;
    heavyFrameHeight?: number;
    minionIdleSpriteUrl?: string;
    minionAttackSpriteUrl?: string;
    minionHeavyAttackSpriteUrl?: string;
    minionIdleFrames?: number;
    minionAttackFrames?: number;
    minionHeavyAttackFrames?: number;
    minionIdleFrameWidth?: number;
    minionAttackFrameWidth?: number;
    minionHeavyFrameWidth?: number;
    minionIdleFrameHeight?: number;
    minionAttackFrameHeight?: number;
    minionHeavyFrameHeight?: number;
  }

  const [battleStage, setBattleStage] = useState<1 | 2 | 3>(1);
  const [learningStage, setLearningStage] = useState<1 | 2 | 3>(1);
  const [learningWaveEnemies, setLearningWaveEnemies] = useState<{
    minion: { name: string; icon: string; badge: string };
    enforcer: { name: string; icon: string; badge: string };
    boss: { name: string; icon: string; badge: string; idleSprite: string | null; attackSprite: string | null; heavyAttackSprite: string | null; idleFrames: number; attackFrames: number; heavyAttackFrames: number };
  } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cc-1');
  const [showChapterMap, setShowChapterMap] = useState<boolean>(false);
  const [nodeStars, setNodeStars] = useState<Record<string, number>>({});
  const [nodeClears, setNodeClears] = useState<Record<string, { EASY?: boolean; MEDIUM?: boolean; HARD?: boolean }>>({});

  const CHAPTER_NODES_PER_SUBJECT: Record<string, SubjectNodeConfig[]> = {
    "Clinical Chemistry": [
      { id: 'cc-1', nodeNumber: 1, title: 'Carbohydrates & Lipids', subtopic: 'Glucose Metabolism, HbA1c & Lipoproteins', minionName: 'Acid Slime', minionIcon: '🧪', miniBossName: 'Hyperglycemic Mutant', miniBossIcon: '🧬', bossName: 'Hyperglycemic Specter', bossIcon: '⚗️' },
      { id: 'cc-2', nodeNumber: 2, title: 'Enzymology & Electrolytes', subtopic: 'Troponin, CK-MB, AST, Potassium & Blood pH', minionName: 'Kinase Swarm', minionIcon: '⚡', miniBossName: 'Ischemia Fiend', miniBossIcon: '🔥', bossName: 'Renal Behemoth', bossIcon: '💔' },
      {
        id: 'cc-3',
        nodeNumber: 3,
        title: '👑 Hyperglycemic Specter (FINAL BOSS)',
        subtopic: 'Comprehensive Clinical Chemistry Licensure Challenge',
        minionName: 'Lab Sentinel',
        minionIcon: '🛡️',
        miniBossName: 'Board Examiner Specter',
        miniBossIcon: '📜',
        bossName: 'Hyperglycemic Specter',
        bossIcon: '👑',
        idleSpriteUrl: '/images/bosses/clinchem_finalboss_IdleAnimation.png',
        attackSpriteUrl: '/images/bosses/clinchem_finalboss_normalAttackprojectileAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/clinchem_finalboss_heavyAttackAnimation.png',
        attackProjectileUrl: '/images/bosses/clinchem_finalboss_normalAttackprojectileAnimation.png',
        idleFrames: 6,
        attackFrames: 5,
        heavyAttackFrames: 13,
        attackProjectileFrames: 5,
        idleFrameWidth: 128,
        attackFrameWidth: 128,
        attackFrameHeight: 128,
        heavyFrameWidth: 480,
        heavyFrameHeight: 256,
      },
    ],
    "Microbiology": [
      {
        id: 'mb-1',
        nodeNumber: 1,
        title: 'Bacteriology & Gram Staining',
        subtopic: 'Gram Positive & Negative Cocci & Bacilli',
        minionName: 'Microbe Swarm',
        minionIcon: '🦠',
        miniBossName: 'Staph Sentinel',
        miniBossIcon: '🧬',
        bossName: 'Gram Positive Overlord',
        bossIcon: '👾',
        minionIdleSpriteUrl: '/images/bosses/microbio_chapterOneMinion_IdleAnimation.png',
        minionAttackSpriteUrl: '/images/bosses/microbio_chapterOneMinion_normalAttackAnimation.png',
        minionHeavyAttackSpriteUrl: '/images/bosses/microbio_chapterOneMinion_heavyAttackAnimation.png',
        minionIdleFrames: 8,
        minionAttackFrames: 14,
        minionHeavyAttackFrames: 10,
        minionIdleFrameWidth: 128,
        minionIdleFrameHeight: 128,
        minionAttackFrameWidth: 257,
        minionAttackFrameHeight: 218,
        minionHeavyFrameWidth: 257,
        minionHeavyFrameHeight: 218,
      },
      { id: 'mb-2', nodeNumber: 2, title: 'Mycology, Virology & Parasitology', subtopic: 'Fungi, Viral Replication, Antigens & Protozoa', minionName: 'Spore Cloud', minionIcon: '🍄', miniBossName: 'Retrovirus Fiend', miniBossIcon: '💥', bossName: 'Viral Apex Lord', bossIcon: '🐉' },
      { id: 'mb-3', nodeNumber: 3, title: '👑 Biohazard Overlord (FINAL BOSS)', subtopic: 'Antimicrobial Resistance & Comprehensive Microbiology', minionName: 'Resistant Strain', minionIcon: '💊', miniBossName: 'Lab Director Phantom', miniBossIcon: '📜', bossName: 'Biohazard Overlord', bossIcon: '👑' },
    ],
    "Hematology": [
      { id: 'hem-1', nodeNumber: 1, title: 'RBC Anomalies & Anemias', subtopic: 'Hemoglobin Synthesis & Microcytic Anemias', minionName: 'Sickle Cell', minionIcon: '🩸', miniBossName: 'Anemia Shade', miniBossIcon: '👻', bossName: 'Erythrocyte Colossus', bossIcon: '👑' },
      { id: 'hem-2', nodeNumber: 2, title: 'WBC Disorders & Leukemias', subtopic: 'Neutrophils, Acute/Chronic Leukemias & Bone Marrow', minionName: 'Blast Cell', minionIcon: '💥', miniBossName: 'Leukemic Fiend', miniBossIcon: '⚡', bossName: 'White Cell Warlord', bossIcon: '🗡️' },
      {
        id: 'hem-3',
        nodeNumber: 3,
        title: '👑 Sickle-Cell Reaper (FINAL BOSS)',
        subtopic: 'Hemostasis, Coagulation Cascades & Comprehensive Exam',
        minionName: 'Clot Particle',
        minionIcon: '🧱',
        miniBossName: 'Hematopathologist Ghost',
        miniBossIcon: '📜',
        bossName: 'Sickle-Cell Reaper',
        bossIcon: '👑',
        idleSpriteUrl: '/images/bosses/hematology_finalboss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hematology_finalboss_heavyAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/hematology_finalboss_heavyAttackAnimation.png',
        idleFrames: 6,
        attackFrames: 8,
        heavyAttackFrames: 8,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 192,
        attackFrameHeight: 160,
        heavyFrameWidth: 192,
        heavyFrameHeight: 160,
      },
    ],
    "Immunology & Serology and Immunohematology": [
      { id: 'is-1', nodeNumber: 1, title: 'Immunity & Serological Testing', subtopic: 'Innate/Adaptive Immunity, ELISA & Agglutination', minionName: 'Lymphocyte Swarm', minionIcon: '🛡️', miniBossName: 'Antigen Titan', miniBossIcon: '🧬', bossName: 'Immune Archon', bossIcon: '👑' },
      { id: 'is-2', nodeNumber: 2, title: 'ABO & Rh Blood Group System', subtopic: 'Blood Group Antigens, Antibodies & Rh Discrepancies', minionName: 'ABO Antigen', minionIcon: '🩸', miniBossName: 'Rh Aggressive Golem', miniBossIcon: '🪨', bossName: 'Immunohematology Colossus', bossIcon: '👑' },
      { id: 'is-3', nodeNumber: 3, title: '👑 Anti-Serum Hydra (FINAL BOSS)', subtopic: 'Transfusion Reactions, Crossmatching & Blood Bank', minionName: 'Hemolytic Cell', minionIcon: '💥', miniBossName: 'Serology Examiner Phantom', miniBossIcon: '📜', bossName: 'Anti-Serum Hydra', bossIcon: '👑' },
    ],
    "Clinical Microscopy & Parasitology": [
      { id: 'cm-1', nodeNumber: 1, title: 'Urinalysis Physical & Chemical Exam', subtopic: 'Color, Clarity, Specific Gravity & Reagents', minionName: 'Reagent Strip Slime', minionIcon: '🧪', miniBossName: 'Nitrite Spectre', miniBossIcon: '👻', bossName: 'Clinical Microscopy Overlord', bossIcon: '👑' },
      { id: 'cm-2', nodeNumber: 2, title: 'Microscopic Sediments & Body Fluids', subtopic: 'Casts, Crystals, Synovial, Serous & CSF Analysis', minionName: 'Hyaline Cast', minionIcon: '💧', miniBossName: 'Oxalate Golem', miniBossIcon: '🪨', bossName: 'Sediment Colossus', bossIcon: '🩸' },
      { id: 'cm-3', nodeNumber: 3, title: '👑 Crystal Golem (FINAL BOSS)', subtopic: 'Intestinal Parasites, Helminths & Comprehensive Board Exam', minionName: 'Protozoan Cyst', minionIcon: '🦠', miniBossName: 'Pathology Director Phantom', miniBossIcon: '📜', bossName: 'Crystal Golem', bossIcon: '👑', idleSpriteUrl: "/images/bosses/clinmicro_finalboss_idleAnimation.png", attackSpriteUrl: "/images/bosses/clinmicro_finalboss_normalAttackAnimation.png", heavyAttackSpriteUrl: "/images/bosses/clinmicro_finalboss_heavyAttackAnimation.png", idleFrames: 7, attackFrames: 17, heavyAttackFrames: 11 },
    ],
    "Histopathology and Medtech Laws": [
      { id: 'hp-1', nodeNumber: 1, title: 'Tissue Processing, Microtomy & Staining', subtopic: 'Formalin Fixation, Sectioning & H&E Staining', minionName: 'Formalin Slime', minionIcon: '🧪', miniBossName: 'Paraffin Golem', miniBossIcon: '🪨', bossName: 'Fixation Overlord', bossIcon: '👑' },
      { id: 'hp-2', nodeNumber: 2, title: 'RA 5527 & MedTech Ethics', subtopic: 'Philippine Medical Technology Act of 1969', minionName: 'Statute Page', minionIcon: '📜', miniBossName: 'Legal Guardian', miniBossIcon: '🛡️', bossName: 'Jurisprudence Archon', bossIcon: '⚖️' },
      { id: 'hp-3', nodeNumber: 3, title: '👑 Legal Beholder (FINAL BOSS)', subtopic: 'Biosafety, Lab Quality Assurance & Comprehensive Challenge', minionName: 'Biohazard Swarm', minionIcon: '☣️', miniBossName: 'Board Examiner Phantom', miniBossIcon: '📜', bossName: 'Legal Beholder', bossIcon: '👑' },
    ],
  };

  const getSubjectNodes = (subject: string): SubjectNodeConfig[] => {
    return CHAPTER_NODES_PER_SUBJECT[subject] || [
      { id: `${subject}-1`, nodeNumber: 1, title: `${subject} Foundations`, subtopic: 'Core Diagnostic Principles', minionName: 'Lab Minion', minionIcon: '🧪', miniBossName: 'Diagnostic Spectre', miniBossIcon: '👻', bossName: `${subject} Overlord`, bossIcon: '👑' },
      { id: `${subject}-2`, nodeNumber: 2, title: `${subject} Advanced Concepts`, subtopic: 'Pathology & Testing Methodologies', minionName: 'Reagent Swarm', minionIcon: '💧', miniBossName: 'Assay Golem', miniBossIcon: '🪨', bossName: `${subject} Titan`, bossIcon: '⚡' },
      { id: `${subject}-3`, nodeNumber: 3, title: `👑 ${subject} Sovereign (FINAL BOSS)`, subtopic: 'Comprehensive Licensure Board Challenge', minionName: 'Board Sentinel', minionIcon: '🛡️', miniBossName: 'Senior Examiner Specter', miniBossIcon: '📜', bossName: `Master ${subject} Colossus`, bossIcon: '👑' },
    ];
  };

  const getLearningWaveState = (
    questions: Question[],
    userAnswersList: { isCorrect: boolean; difficulty?: string }[],
    subject: string,
    waveEnemies: any
  ) => {
    if (!questions || questions.length === 0) {
      return {
        waveStage: 1,
        name: 'Lab Minion',
        badge: 'MINION 👾',
        icon: '🧪',
        hp: 100,
        maxHp: 100,
        damagePerQ: 34,
        idleSprite: null,
        attackSprite: null,
        heavyAttackSprite: null,
      };
    }

    const currentQIndex = Math.min(questions.length - 1, userAnswersList.length);
    const currentQ = questions[currentQIndex] || questions[0];
    const currentDiff = String(currentQ?.difficulty || 'EASY').toUpperCase();

    const waveStage = currentDiff === 'EASY' ? 1 : currentDiff === 'MEDIUM' ? 2 : 3;

    // Filter questions that belong to the current wave difficulty
    const waveQuestions = questions.filter(q => String(q.difficulty || 'EASY').toUpperCase() === currentDiff);
    const waveQCount = Math.max(1, waveQuestions.length);

    // Count ONLY CORRECT answers for THIS wave difficulty!
    const correctInWave = userAnswersList.filter((ans, idx) => {
      const qDiff = String(ans.difficulty || questions[idx]?.difficulty || 'EASY').toUpperCase();
      return ans.isCorrect && qDiff === currentDiff;
    }).length;

    const damagePerQ = 100 / waveQCount;
    const currentHp = Math.max(0, Math.round(100 - (correctInWave * damagePerQ)));

    const totalCorrect = userAnswersList.filter(a => a.isCorrect).length;
    const isFinished = userAnswersList.length >= questions.length;
    const isPassing = (totalCorrect / Math.max(1, questions.length)) >= 0.75;
    const effectiveHp = isFinished ? (isPassing ? 0 : Math.max(20, currentHp)) : currentHp;

    const waveMinion = waveEnemies?.minion;
    const waveEnforcer = waveEnemies?.enforcer;
    const waveBoss = waveEnemies?.boss;

    if (waveStage === 1) {
      return {
        waveStage: 1,
        name: waveMinion?.name || 'Reagent Strip Slime',
        badge: 'MINION 👾',
        icon: waveMinion?.icon || '🧪',
        hp: effectiveHp,
        maxHp: 100,
        damagePerQ,
        idleSprite: null,
        attackSprite: null,
        heavyAttackSprite: null,
      };
    } else if (waveStage === 2) {
      return {
        waveStage: 2,
        name: waveEnforcer?.name || 'Nitrite Spectre',
        badge: 'ENFORCER 👹',
        icon: waveEnforcer?.icon || '👻',
        hp: effectiveHp,
        maxHp: 100,
        damagePerQ,
        idleSprite: null,
        attackSprite: null,
        heavyAttackSprite: null,
      };
    } else {
      const meta = getSubjectMeta(subject);
      const activeNodes = getSubjectNodes(subject);
      const ch3Node = activeNodes.find(n => n.nodeNumber === 3) || activeNodes[0];

      return {
        waveStage: 3,
        name: waveBoss?.name || meta.enemy,
        badge: 'ELITE 👑',
        icon: waveBoss?.icon || '👑',
        hp: effectiveHp,
        maxHp: 100,
        damagePerQ,
        idleSprite: ch3Node?.idleSpriteUrl || meta?.idleSpriteUrl || null,
        attackSprite: ch3Node?.attackSpriteUrl || meta?.attackSpriteUrl || null,
        heavyAttackSprite: ch3Node?.heavyAttackSpriteUrl || meta?.heavyAttackSpriteUrl || null,
        attackProjectileUrl: ch3Node?.attackProjectileUrl || meta?.attackProjectileUrl || null,
        idleFrames: ch3Node?.idleFrames || meta?.idleFrames || 6,
        attackFrames: ch3Node?.attackFrames || meta?.attackFrames || 5,
        heavyAttackFrames: ch3Node?.heavyAttackFrames || meta?.heavyAttackFrames || 12,
        attackProjectileFrames: ch3Node?.attackProjectileFrames || meta?.attackProjectileFrames || 5,
        idleFrameWidth: ch3Node?.idleFrameWidth || meta?.idleFrameWidth || 128,
        attackFrameWidth: ch3Node?.attackFrameWidth || meta?.attackFrameWidth || 128,
        heavyFrameWidth: ch3Node?.heavyFrameWidth || meta?.heavyFrameWidth || 480,
        idleFrameHeight: ch3Node?.idleFrameHeight || meta?.idleFrameHeight || 128,
        attackFrameHeight: ch3Node?.attackFrameHeight || meta?.attackFrameHeight || 128,
        heavyFrameHeight: ch3Node?.heavyFrameHeight || meta?.heavyFrameHeight || 256,
      };
    }
  };

  // Helper to calculate Level-Scaled HP for Player and 3-Stage Enemies
  const calculatePlayerMaxHp = (level: number, hasShield: boolean) => {
    const base = 100 + (Math.max(1, level) - 1) * 15;
    return hasShield ? base + 20 : base;
  };

  const getPlayerMaxHp = () => {
    if (quizMode !== 'boss-battle') return 100;
    const hasShieldEffect = equippedItem === 'erlenmeyer_shield' && (inventory.erlenmeyer_shield || 0) > 0;
    return calculatePlayerMaxHp(userLevel, hasShieldEffect);
  };

  const calculateEnemyStageHp = (stage: 1 | 2 | 3, level: number, difficulty: string) => {
    const safeLevel = Math.max(1, level);
    const playerStats = calculatePlayerStats(safeLevel, 0, null);

    // Number of base correct hits needed to defeat enemy
    const turnsToDefeat = stage === 1 ? 5 : stage === 2 ? 8 : 12;
    const modeMul = difficulty === 'EASY' ? 0.75 : difficulty === 'HARD' ? 1.4 : 1.0;

    return Math.round(playerStats.totalDamage * turnsToDefeat * modeMul);
  };

  // Load Saved Node Stars & Clears from Database (User Scoped)
  useEffect(() => {
    let isMounted = true;
    async function loadNodeStarsAndClears() {
      try {
        const result = await getNodeClearsAction();
        if (result && isMounted) {
          setNodeClears(result.nodeClears || {});
          setNodeStars(result.nodeStars || {});
          try {
            localStorage.setItem('boardquest_node_clears', JSON.stringify(result.nodeClears || {}));
            localStorage.setItem('boardquest_node_stars', JSON.stringify(result.nodeStars || {}));
          } catch (e) { }
        }
      } catch (e) {
        console.warn('Failed to load node clears:', e);
      }
    }
    loadNodeStarsAndClears();
    return () => {
      isMounted = false;
    };
  }, []);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string, target: 'player' | 'enemy', text: string, color: string }[]>([]);
  const [hitFlash, setHitFlash] = useState(false);
  const [hitEffectTarget, setHitEffectTarget] = useState<'player' | 'enemy' | null>(null);
  const [hitEffectKey, setHitEffectKey] = useState<number>(0);

  // Inventory & Consumables State
  const [userXp, setUserXp] = useState<number>(100);
  const [inventory, setInventory] = useState<Record<string, number>>({
    erlenmeyer_shield: 2,
    pipette_clarity: 2,
    buffered_saline: 2,
  });
  const [equippedItem, setEquippedItem] = useState<string | null>('erlenmeyer_shield');

  // Ensure playerHealth never exceeds max HP when unequipping items or changing stats
  useEffect(() => {
    const currentMax = getPlayerMaxHp();
    setPlayerHealth(prev => Math.min(prev, currentMax));
  }, [equippedItem, inventory, userLevel, quizMode]);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedItemSlot, setSelectedItemSlot] = useState<string>('erlenmeyer_shield');
  const [salineUsedThisBattle, setSalineUsedThisBattle] = useState(false);
  const [clarityUsedThisBattle, setClarityUsedThisBattle] = useState(false);

  const MAX_REAGENT_CAP = 5;
  const [isInventoryLoaded, setIsInventoryLoaded] = useState(false);

  // Load Inventory, Equipped Item, and User XP from localStorage on mount
  useEffect(() => {
    try {
      const savedInv = localStorage.getItem('boardquest_reagent_inventory');
      if (savedInv) {
        setInventory(JSON.parse(savedInv));
      }
      const savedEquipped = localStorage.getItem('boardquest_equipped_reagent');
      if (savedEquipped !== null) {
        setEquippedItem(savedEquipped === 'none' ? null : savedEquipped);
      }
    } catch (e) {
      console.error('Error loading inventory from localStorage:', e);
    } finally {
      setIsInventoryLoaded(true);
    }
  }, []);

  // Preload Inventory Assets on Mount for Instant Dialog Rendering
  useEffect(() => {
    const assetsToPreload = [
      '/ui/Inventory_bg.png',
      '/ui/Inventory_icon.png',
      '/ui/Inventory_available_exp.png',
      '/ui/Inventory_weekly_bg.png',
      '/ui/Inventory_slot.png',
      '/ui/Inventory_shop_bg.png',
    ];
    assetsToPreload.forEach(src => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  // Sync state changes to localStorage and DB only after initialization
  useEffect(() => {
    if (!isInventoryLoaded) return;
    try {
      localStorage.setItem('boardquest_reagent_inventory', JSON.stringify(inventory));
      localStorage.setItem('boardquest_equipped_reagent', equippedItem || 'none');
      saveUserInventory(inventory, equippedItem).catch(err => {
        console.warn('Silent fallback for saveUserInventory:', err);
      });
    } catch (e) {
      console.error('Error saving inventory to DB:', e);
    }
  }, [inventory, equippedItem, isInventoryLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem('boardquest_user_xp', userXp.toString());
    } catch (e) {
      console.error('Error saving user XP:', e);
    }
  }, [userXp]);

  const getScaledCost = (baseCost: number, level: number) => {
    return Math.floor(baseCost * (1 + (Math.max(1, level) - 1) * 0.25));
  };

  const handleBuyReagent = async (itemId: string, name: string, cost: number) => {
    const currentCount = inventory[itemId] || 0;
    if (currentCount >= MAX_REAGENT_CAP) {
      toast({
        variant: "destructive",
        title: "Carrying Cap Reached! 🎒",
        description: `You can carry a maximum of ${MAX_REAGENT_CAP} charges of ${name} at a time.`,
      });
      return;
    }

    if (userXp < cost) {
      toast({
        variant: "destructive",
        title: "Insufficient XP ⚡",
        description: `You need ${cost} XP to purchase ${name}. Complete more quests to earn XP!`,
      });
      return;
    }

    const newXp = userXp - cost;
    const newInventory = { ...inventory, [itemId]: currentCount + 1 };

    setUserXp(newXp);
    setInventory(newInventory);

    try {
      localStorage.setItem('boardquest_user_xp', newXp.toString());
      localStorage.setItem('boardquest_reagent_inventory', JSON.stringify(newInventory));
      await purchaseReagentAction(itemId, cost, newInventory);
    } catch (e) {
      console.error('Failed to save purchase to DB:', e);
    }

    toast({
      title: "Reagent Purchased! 🧪✨",
      description: `+1 charge of ${name} added to your inventory!`,
    });
  };

  const addFloatingText = (target: 'player' | 'enemy', text: string, color: string) => {
    const floatingEnabled = typeof window !== 'undefined' ? localStorage.getItem('bq_pref_floating_damage') !== 'false' : true;
    if (!floatingEnabled) return;

    const id = Math.random().toString(36).substring(2, 9);
    setFloatingTexts(prev => [...prev, { id, target, text, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1500);
  };

  const CONSUMABLE_ITEMS_LIST = [
    {
      id: 'erlenmeyer_shield',
      name: 'Erlenmeyer Shield',
      icon: '🛡️',
      color: 'border-blue-500/60 bg-blue-950/50 text-blue-300',
      effect: '+20 Bonus Max & Starting HP in Boss Battles',
      desc: 'Reinforced lab flask infused with protective saline.',
      cost: getScaledCost(50, userLevel),
      baseCost: 50,
    },
    {
      id: 'pipette_clarity',
      name: 'Pipette of Clarity',
      icon: '✨',
      color: 'border-purple-500/60 bg-purple-950/50 text-purple-300',
      effect: 'Eliminates 1 incorrect option (50:50 hint)',
      desc: 'Precision micro-pipette that filters erroneous choices.',
      cost: getScaledCost(75, userLevel),
      baseCost: 75,
    },
    {
      id: 'buffered_saline',
      name: 'Buffered Saline',
      icon: '💧',
      color: 'border-emerald-500/60 bg-emerald-950/50 text-emerald-300',
      effect: 'Nullifies 1st poison or debuff from boss',
      desc: 'Neutralizes toxic afflictions and corrosive acid.',
      cost: getScaledCost(60, userLevel),
      baseCost: 60,
    },
  ];

  const activeSelectedItem = CONSUMABLE_ITEMS_LIST.find(i => i.id === selectedItemSlot) || CONSUMABLE_ITEMS_LIST[0];

  // Weekly Restock Timer State
  const [restockCountdown, setRestockCountdown] = useState<string>('');

  const getNextResetTimestamp = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = (8 - (day === 0 ? 7 : day)) % 7;
    const nextMon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (diff === 0 ? 7 : diff), 0, 0, 0));
    return nextMon.getTime();
  };

  useEffect(() => {
    const updateCountdown = () => {
      const target = getNextResetTimestamp();
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setRestockCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check Weekly Supply Drop on mount
  useEffect(() => {
    const lastRestockStr = localStorage.getItem('boardquest_last_reagent_restock');
    const now = Date.now();
    let shouldRestock = false;

    if (!lastRestockStr) {
      shouldRestock = true;
    } else {
      const lastTime = parseInt(lastRestockStr, 10);
      if (now - lastTime >= 7 * 24 * 60 * 60 * 1000) {
        shouldRestock = true;
      }
    }

    if (shouldRestock) {
      localStorage.setItem('boardquest_last_reagent_restock', now.toString());
      setInventory(prev => ({
        erlenmeyer_shield: Math.min(5, (prev.erlenmeyer_shield || 0) + 1),
        pipette_clarity: Math.min(5, (prev.pipette_clarity || 0) + 1),
        buffered_saline: Math.min(5, (prev.buffered_saline || 0) + 1),
      }));
      toast({
        title: "🎁 Weekly Guild Supply Drop Claimed!",
        description: "+1 free charge added to all consumable reagents!",
      });
    }
  }, []);

  const inventoryDialogJSX = (
    <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
      <DialogContent
        container={isFullscreen ? (fullscreenRef.current || undefined) : undefined}
        className="w-[95vw] max-w-[340px] min-[375px]:max-w-[380px] sm:max-w-[460px] bg-transparent border-none p-0 text-white shadow-2xl z-[100] font-bytebounce flex items-center justify-center select-none [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Inventory</DialogTitle>

        {/* Parchment / Leather Frame Container - Naturally scaled to fit content on all screens */}
        <div className="relative w-full p-2.5 min-[360px]:p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2.5 overflow-hidden rounded-xl bg-[#2b1408] border-2 border-[#5c2a1a] shadow-2xl">
          {/* Main Inventory Background */}
          <Image
            src="/ui/Inventory_bg.png"
            alt="Inventory Background"
            fill
            className="object-fill object-center pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
            unoptimized
            priority
          />

          {/* Close Button */}
          <button
            onClick={() => setInventoryDialogOpen(false)}
            aria-label="Close Inventory"
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-5.5 h-5.5 min-[360px]:w-6 min-[360px]:h-6 sm:w-7 sm:h-7 bg-[#3d1a16] text-[#e8b298] hover:bg-red-700 hover:text-white rounded border border-[#693327] flex items-center justify-center font-bold text-[10px] sm:text-xs z-30 transition-colors active:scale-95 shadow-md"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Top Header Section */}
          <div className="relative z-10 pt-0.5">
            <div className="flex items-center justify-between gap-1.5 pr-6 sm:pr-8">
              {/* Left: Satchel Icon + INVENTORY Title */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Image
                  src="/ui/Inventory_icon.png"
                  alt="Inventory Icon"
                  width={28}
                  height={28}
                  className="w-5 h-5 sm:w-7 sm:h-7 object-contain shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                  unoptimized
                />
                <h2 className="font-bytebounce text-xl min-[360px]:text-2xl sm:text-4xl text-[#3d1a16] tracking-wider leading-none drop-shadow-[1px_1px_0_#f4cfbd]">
                  INVENTORY
                </h2>
              </div>

              {/* Right: Available XP Pill */}
              <div className="relative h-5.5 min-[360px]:h-6 sm:h-7.5 px-2 sm:px-2.5 flex items-center justify-center shrink-0">
                <Image
                  src="/ui/Inventory_available_exp.png"
                  alt="Available EXP"
                  fill
                  className="object-fill"
                  style={{ imageRendering: 'pixelated' }}
                  unoptimized
                />
                <span className="relative z-10 font-bytebounce text-amber-300 text-[10px] min-[360px]:text-[11px] sm:text-sm font-bold flex items-center gap-0.5 tracking-wider leading-none drop-shadow-[1px_1px_0_#000]">
                  ⚡ {userXp} XP
                </span>
              </div>
            </div>

            {/* Top Divider */}
            <div className="w-full h-[1.5px] sm:h-[2px] bg-[#3d1a16] mt-1 sm:mt-1.5 opacity-90" />
          </div>

          {/* Top Weekly Supply Banner */}
          <div className="relative z-10 w-full h-6 min-[360px]:h-6.5 sm:h-7.5 px-2 sm:px-2.5 flex items-center justify-between shrink-0">
            <Image
              src="/ui/Inventory_weekly_bg.png"
              alt="Weekly Supply Banner"
              fill
              className="object-fill"
              style={{ imageRendering: 'pixelated' }}
              unoptimized
            />
            <div className="relative z-10 flex items-center justify-between w-full text-white font-bytebounce text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs px-0.5 leading-none">
              <span className="text-amber-100 flex items-center gap-1">
                Weekly Drop: <span className="text-emerald-400 font-bold">+1 Free Charge</span>
              </span>
              <span className="text-amber-300/90 font-mono text-[7.5px] min-[360px]:text-[8.5px] sm:text-[10px]">
                Restock: <span className="text-amber-200 font-bold">{restockCountdown || 'Calculating...'}</span>
              </span>
            </div>
          </div>

          {/* 6x3 Inventory Slot Grid (18 Slots) */}
          <div className="relative z-10">
            <div className="grid grid-cols-6 gap-1 min-[360px]:gap-1.5 sm:gap-2">
              {/* Consumable Item Slots */}
              {CONSUMABLE_ITEMS_LIST.map((item) => {
                const count = inventory[item.id] || 0;
                const isEquipped = equippedItem === item.id;
                const isSelected = selectedItemSlot === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemSlot(item.id)}
                    className={cn(
                      "relative aspect-square flex items-center justify-center transition-all duration-150 active:scale-95 group cursor-pointer",
                      isSelected ? "scale-105 z-30" : "hover:scale-102"
                    )}
                  >
                    {/* Slot Background */}
                    <Image
                      src="/ui/Inventory_slot.png"
                      alt="Inventory Slot"
                      fill
                      className="object-fill pointer-events-none"
                      style={{ imageRendering: 'pixelated' }}
                      unoptimized
                    />

                    {/* Item Icon */}
                    <span
                      className={cn(
                        "relative z-20 text-base min-[360px]:text-lg sm:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform",
                        isSelected && "scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.85)]"
                      )}
                    >
                      {item.icon}
                    </span>

                    {/* Stack Count Badge */}
                    <span className="absolute bottom-0.5 right-0.5 sm:right-1 z-30 font-bytebounce text-[7.5px] min-[360px]:text-[8.5px] sm:text-xs font-bold text-amber-200 drop-shadow-[1px_1px_0_#000] leading-none">
                      {count}/{MAX_REAGENT_CAP}
                    </span>

                    {/* Equipped Badge */}
                    {isEquipped && (
                      <span className="absolute top-0.5 left-0.5 z-30 bg-emerald-500 text-black text-[5.5px] min-[360px]:text-[6px] sm:text-[7px] font-black uppercase px-0.5 rounded border border-black animate-pulse leading-none">
                        EQ
                      </span>
                    )}

                    {/* 16-Bit Gamified RPG Reticle Corner Brackets & Floating Pointer */}
                    {isSelected && (
                      <>
                        {/* Top-Left Bracket */}
                        <div className="absolute -top-0.5 -left-0.5 z-40 w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 border-t-2 border-l-2 border-yellow-200 shadow-[0_0_4px_#f59e0b]" />
                        {/* Top-Right Bracket */}
                        <div className="absolute -top-0.5 -right-0.5 z-40 w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 border-t-2 border-r-2 border-yellow-200 shadow-[0_0_4px_#f59e0b]" />
                        {/* Bottom-Left Bracket */}
                        <div className="absolute -bottom-0.5 -left-0.5 z-40 w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 border-b-2 border-l-2 border-yellow-200 shadow-[0_0_4px_#f59e0b]" />
                        {/* Bottom-Right Bracket */}
                        <div className="absolute -bottom-0.5 -right-0.5 z-40 w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 border-b-2 border-r-2 border-yellow-200 shadow-[0_0_4px_#f59e0b]" />

                        {/* Floating Retro RPG Cursor Triangle pointer above slot */}
                        <div className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 z-40 text-yellow-300 text-[7px] min-[360px]:text-[8px] sm:text-[10px] animate-bounce leading-none drop-shadow-[0_0_5px_#f59e0b] select-none pointer-events-none font-sans font-bold">
                          ▼
                        </div>
                      </>
                    )}
                  </button>
                );
              })}

              {/* 15 Empty Slots */}
              {Array.from({ length: 15 }).map((_, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square flex items-center justify-center opacity-90"
                >
                  <Image
                    src="/ui/Inventory_slot.png"
                    alt="Empty Slot"
                    fill
                    className="object-fill pointer-events-none"
                    style={{ imageRendering: 'pixelated' }}
                    unoptimized
                  />
                  <span className="relative z-10 text-amber-900/30 text-[8px] sm:text-xs font-mono select-none">
                    +
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Divider */}
          <div className="relative z-10 w-full h-[1.5px] sm:h-[2px] bg-[#3d1a16] opacity-90" />

          {/* Bottom Selected Item / Shop Action Panel */}
          <div className="relative z-10 w-full min-h-[58px] min-[360px]:min-h-[64px] sm:min-h-[78px] p-1.5 min-[360px]:p-2 sm:p-2.5 flex items-center shrink-0">
            <Image
              src="/ui/Inventory_shop_bg.png"
              alt="Inventory Shop Panel"
              fill
              className="object-fill"
              style={{ imageRendering: 'pixelated' }}
              unoptimized
            />
            {activeSelectedItem ? (
              <div className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-2.5 w-full">
                {/* Left details */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <span className="text-xl min-[360px]:text-2xl sm:text-3xl shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {activeSelectedItem.icon}
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                      <h4 className="font-bold text-amber-300 font-bytebounce text-[11px] min-[360px]:text-xs sm:text-base tracking-wide leading-tight truncate">
                        {activeSelectedItem.name}
                      </h4>
                      <span className="text-[6.5px] min-[360px]:text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-black/40 px-1 py-0.5 rounded text-amber-200 border border-amber-500/30 leading-none">
                        Stock: {inventory[activeSelectedItem.id] || 0}/{MAX_REAGENT_CAP}
                      </span>
                      {equippedItem === activeSelectedItem.id && (
                        <span className="text-[6.5px] min-[360px]:text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-emerald-500 text-black px-1 py-0.5 rounded border border-black leading-none animate-pulse">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-[7.5px] min-[360px]:text-[8.5px] sm:text-[10px] text-amber-100/90 font-sans leading-tight line-clamp-1">
                      {activeSelectedItem.desc}
                    </p>
                    <p className="text-[7px] min-[360px]:text-[8px] sm:text-[9.5px] font-bold text-amber-300 leading-tight truncate">
                      ✨ {activeSelectedItem.effect}
                    </p>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-col gap-1 sm:gap-1.5 shrink-0">
                  {equippedItem === activeSelectedItem.id ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setEquippedItem(null);
                        const newMax = calculatePlayerMaxHp(userLevel, false);
                        setPlayerHealth(prev => Math.min(prev, newMax));
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bytebounce text-[9px] min-[360px]:text-[10px] sm:text-xs uppercase tracking-wider h-5.5 min-[360px]:h-6 sm:h-7 px-1.5 sm:px-2.5 border border-red-400 shadow-md whitespace-nowrap active:scale-95 leading-none"
                    >
                      Unequip
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={(inventory[activeSelectedItem.id] || 0) <= 0}
                      onClick={() => setEquippedItem(activeSelectedItem.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black font-bytebounce text-[9px] min-[360px]:text-[10px] sm:text-xs uppercase tracking-wider h-5.5 min-[360px]:h-6 sm:h-7 px-1.5 sm:px-2.5 border border-emerald-300 disabled:opacity-30 shadow-md whitespace-nowrap active:scale-95 leading-none"
                    >
                      Equip
                    </Button>
                  )}

                  <Button
                    size="sm"
                    disabled={(inventory[activeSelectedItem.id] || 0) >= MAX_REAGENT_CAP}
                    onClick={() => handleBuyReagent(activeSelectedItem.id, activeSelectedItem.name, activeSelectedItem.cost)}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bytebounce text-[9px] min-[360px]:text-[10px] sm:text-xs uppercase tracking-wider h-5.5 min-[360px]:h-6 sm:h-7 px-1.5 sm:px-2.5 border border-amber-300 shadow-md flex items-center justify-center gap-0.5 whitespace-nowrap disabled:opacity-40 active:scale-95 leading-none"
                  >
                    {(inventory[activeSelectedItem.id] || 0) >= MAX_REAGENT_CAP ? (
                      `MAX (5/5)`
                    ) : (
                      `Buy +1 (⚡${activeSelectedItem.cost})`
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const handleUseClarity = () => {
    if (clarityUsedThisBattle || (inventory.pipette_clarity || 0) <= 0) return;
    setClarityUsedThisBattle(true);
    addFloatingText('player', 'HINT ACTIVATED! 🧪✨', 'text-purple-400');
    toast({
      title: "Pipette of Clarity! 🧪✨",
      description: "1 incorrect distractor has been eliminated!",
    });
    setInventory(prev => ({ ...prev, pipette_clarity: Math.max(0, (prev.pipette_clarity || 0) - 1) }));
  };

  // Fetch User Info on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const profile = await getUserProfile();
        if (profile?.level) setUserLevel(profile.level);
        if (profile?.xp !== undefined) {
          setUserXp(profile.xp);
          try {
            localStorage.setItem('boardquest_user_xp', profile.xp.toString());
          } catch (e) { }
        }
        if (profile?.name) {
          const parts = profile.name.trim().split(/\s+/);
          setUserLastName(parts[parts.length - 1]);
        }
      } catch (e) {
        console.error("Failed to load user level");
      }
    }
    fetchUser();
  }, []);

  // Monitor Boss Battle Health for Early Win/Loss
  useEffect(() => {
    if (isStarted && !isFinished && quizMode === 'boss-battle') {
      if (enemyHealth <= 0) {
        const currentScore = userAnswers.filter(a => a.isCorrect).length;
        handleFinish(currentScore, 'victory');
      } else if (playerHealth <= 0) {
        const currentScore = userAnswers.filter(a => a.isCorrect).length;
        handleFinish(currentScore, 'defeat');
      }
    }
  }, [enemyHealth, playerHealth, isStarted, isFinished, quizMode, userAnswers]);

  // Cutscene Timers
  useEffect(() => {
    if (!isStarted) {
      document.body.style.overflow = '';
      return;
    }

    if (introPhase === 'cutscene' || introPhase === 'vs') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    if (introPhase === 'cutscene') {
      const timer = setTimeout(() => setIntroPhase('vs'), 2500); // Wait 2.5s showing just the background
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }

    if (introPhase === 'vs') {
      const timer = setTimeout(() => setIntroPhase('active'), 1200); // 1.2s for characters to slide in before quiz appears
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [introPhase, isStarted]);

  // Scroll selected item into view naturally from the left
  useEffect(() => {
    if (carouselRef.current) {
      const selectedIdx = dynamicCategories.indexOf(selectedSubject);
      const selectedButton = carouselRef.current.querySelector(`button:nth-child(${selectedIdx + 1})`) as HTMLElement;
      if (selectedButton) {
        if (selectedIdx === 0) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          selectedButton.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }
    }
  }, [selectedSubject, dynamicCategories]);

  const startQuest = async (limit: number = 50, specificDifficulty?: string) => {
    setIsLoading(true);
    setUserAnswers([]);
    setScore(0);
    setConfidence(null);
    setEarnedBadges([]);
    setConfidenceSubmitted(false);
    setConfidenceDialogOpen(false);
    setThankYouDialogOpen(false);
    setQuestStartTime(Date.now());
    isFinishingRef.current = false;
    hasSubmittedConfidenceRef.current = false;
    hasShownThankYouRef.current = false;
    setBossAnimState('idle');
    setPlayerAnimState('idle');
    setIsAnimating(null);
    setJudgementText(null);
    try {
      if (quizMode === 'boss-battle' && specificDifficulty) {
        setBossDifficulty(specificDifficulty);
      }
      const selected = await getQuestQuestions(selectedSubject, quizMode, limit, specificDifficulty);

      if (!selected || selected.length === 0) {
        toast({
          variant: "destructive",
          title: "No Questions Found",
          description: "There are currently no questions available for this region in the database.",
        });
        return;
      }
      setQuestions(selected);
      const hasShieldEffect = equippedItem === 'erlenmeyer_shield' && (inventory.erlenmeyer_shield || 0) > 0;
      const startingHp = getPlayerMaxHp();

      // Erlenmeyer Shield Consumable Effect
      if (quizMode === 'boss-battle' && hasShieldEffect) {
        addFloatingText('player', '+20 SHIELD HP! 🧪🛡️', 'text-blue-400');
        setInventory(prev => ({ ...prev, erlenmeyer_shield: Math.max(0, (prev.erlenmeyer_shield || 0) - 1) }));
      }

      setPlayerHealth(startingHp);
      setSalineUsedThisBattle(false);
      setClarityUsedThisBattle(false);

      let bossStartingHp = 100;
      if (quizMode === 'boss-battle') {
        const activeNodes = getSubjectNodes(selectedSubject);
        const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
        const isChapter3FinalBoss = currentActiveNode.nodeNumber === 3;

        const initialStage = isChapter3FinalBoss ? 3 : 1;
        setBattleStage(initialStage);
        bossStartingHp = calculateEnemyStageHp(initialStage, userLevel, specificDifficulty || 'MEDIUM');
      } else if (quizMode === 'learning') {
        setLearningStage(1);
        const activeNodes = getSubjectNodes(selectedSubject);
        const randomNode1 = activeNodes[Math.floor(Math.random() * activeNodes.length)] || activeNodes[0];
        const randomNode2 = activeNodes[Math.floor(Math.random() * activeNodes.length)] || activeNodes[0];
        const randomNode3 = activeNodes[Math.floor(Math.random() * activeNodes.length)] || activeNodes[0];
        const subjectMeta = getSubjectMeta(selectedSubject);

        setLearningWaveEnemies({
          minion: {
            name: randomNode1.minionName || 'Reagent Strip Slime',
            icon: randomNode1.minionIcon || '🧪',
            badge: 'MINION 👾',
          },
          enforcer: {
            name: randomNode2.miniBossName || 'Nitrite Spectre',
            icon: randomNode2.miniBossIcon || '👻',
            badge: 'ENFORCER 👹',
          },
          boss: {
            name: randomNode3.bossName || subjectMeta.enemy,
            icon: randomNode3.bossIcon || '👑',
            badge: 'ELITE 👑',
            idleSprite: randomNode3.idleSpriteUrl || subjectMeta.idleSpriteUrl || null,
            attackSprite: randomNode3.attackSpriteUrl || subjectMeta.attackSpriteUrl || null,
            heavyAttackSprite: randomNode3.heavyAttackSpriteUrl || subjectMeta.heavyAttackSpriteUrl || null,
            idleFrames: randomNode3.idleFrames || subjectMeta.idleFrames || 7,
            attackFrames: randomNode3.attackFrames || subjectMeta.attackFrames || 17,
            heavyAttackFrames: randomNode3.heavyAttackFrames || subjectMeta.heavyAttackFrames || 11,
          },
        });
      }
      setEnemyHealth(bossStartingHp);
      setTurnCount(0);
      setBossShieldActive(false);
      setPlayerPoisoned(false);
      setBattleOutcome(null);
      setShowBattleLog(false);

      const activeBg = getSubjectMeta(selectedSubject)?.arenaBackgroundUrl || getSubjectMeta(selectedSubject)?.backgroundUrl;
      if (quizMode === 'boss-battle' && activeBg) {
        setIntroPhase('cutscene');
      } else {
        setIntroPhase('hidden');
        setTimeout(() => setIntroPhase('vs'), 50); // slight delay to trigger CSS transition
      }

      setIsStarted(true);
      setIsFinished(false);

      // Ensure we start at the top of the page so the cutscene is fully visible
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Island Storm Detected",
        description: "An error occurred while fetching quest data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean, index: number, letter: string, action?: 'heavy' | 'normal' | 'defend', questionData?: Question) => {
    setUserAnswers(prev => [...prev, {
      questionIndex: index,
      selectedLetter: letter,
      isCorrect,
      questionId: questionData?.id,
      difficulty: questionData?.difficulty
    }]);

    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      playSfx('correct');
      if (quizMode === 'boss-battle') {
        setTimeout(() => playSfx('attack'), 150);
      }
    } else {
      setStreak(0);
      playSfx('wrong');
    }

    let enemyDmg = 0;
    let playerDmg = 0;
    let playerHeal = 0;
    let isCritHit = false;

    let newPoisonedState = playerPoisoned;
    let newShieldState = bossShieldActive;

    if (quizMode === 'boss-battle') {
      const playerStats = calculatePlayerStats(userLevel, streak, equippedItem);

      // Roll Critical Strike chance based on Player's Crit Rate attribute
      isCritHit = isCorrect && (Math.random() * 100 < playerStats.critRate);
      const critMultiplier = isCritHit ? 1.5 : 1.0;

      // Base boss hit scales to player's Max HP (~22% of player's Max HP before defense)
      const enemyBaseHit = playerStats.maxHp * 0.22;

      // Apply poison tick at the very start of the turn
      if (playerPoisoned) {
        playerDmg += playerStats.maxHp * 0.08;
      }

      if (action) {
        if (action === 'heavy') {
          if (isCorrect) {
            enemyDmg = playerStats.totalDamage * 1.8 * critMultiplier;
            newShieldState = false; // Heavy shatters the shield!
          } else {
            playerDmg += enemyBaseHit * 1.5;
          }
        } else if (action === 'defend') {
          if (isCorrect) {
            playerHeal += playerStats.totalDamage * 1.2;
            newPoisonedState = false; // Cures poison!
          } else {
            playerDmg += enemyBaseHit * 0.5;
          }
        } else {
          // normal
          if (isCorrect) {
            if (!bossShieldActive || battleStage !== 3) {
              enemyDmg = playerStats.totalDamage * critMultiplier;
            } else {
              // Shield absorbed the hit (Only Chapter Boss at Stage 3 has shield!)
              enemyDmg = 0;
              toast({ title: "Shield Absorbed Attack! 🛡️", description: "Normal attacks deal 0 damage while the Boss shield is active. Use Heavy Attack to shatter it!", variant: "destructive" });
            }
          } else {
            playerDmg += enemyBaseHit;
          }
        }

        // Aggressive & Enraged Phase Multipliers:
        // Boss <= 60% HP and > 20% HP -> 1.5x damage on player mistake
        // Boss <= 20% HP (Enraged) -> 2.0x damage on player mistake (Enemies NEVER heal HP!)
        if (battleStage === 3 && !isCorrect) {
          if (enemyHealth <= 20 && enemyHealth > 0) {
            playerDmg *= 2.0;
          } else if (enemyHealth <= 60 && enemyHealth > 20) {
            playerDmg *= 1.5;
          }
        }

        const playerMul = bossDifficulty === 'EASY' ? 1.4 : bossDifficulty === 'HARD' ? 0.75 : 1;
        const willEnemyBeDefeated = isCorrect && (enemyHealth - (enemyDmg * playerMul) <= 0);

        // Poison Infliction Mechanics: (Only if boss is NOT being defeated on this turn)
        if (battleStage >= 2 && !isCorrect && !willEnemyBeDefeated && enemyHealth > 0 && Math.random() < 0.25) {
          newPoisonedState = true;
          toast({
            title: "POISONED! ☠️",
            description: battleStage === 2
              ? "The Mini-Boss inflicted a toxic debuff! Use Defend to cure it."
              : "The Chapter Boss inflicted a toxic debuff! Use Defend to cure it.",
            variant: "destructive"
          });
        }

        // Buffered Saline Consumable Effect (Nullifies 1st Poison/Debuff)
        if (equippedItem === 'buffered_saline' && !salineUsedThisBattle && (inventory.buffered_saline || 0) > 0) {
          if (newPoisonedState || (!isCorrect && playerDmg > 0)) {
            newPoisonedState = false;
            setSalineUsedThisBattle(true);
            addFloatingText('player', 'DEBUFF NULLIFIED! 🧪💧', 'text-emerald-400');
            toast({
              title: "Buffered Saline Activated! 🧪💧",
              description: "Your Buffered Saline neutralized the toxic affliction!",
            });
            setInventory(prev => ({ ...prev, buffered_saline: Math.max(0, (prev.buffered_saline || 0) - 1) }));
          }
        }

        // Shield Mechanics: ONLY the Stage 3 Chapter Boss casts shield! (Every 4 turns, and NOT when defeated!)
        if (battleStage === 3 && (turnCount + 1) % 4 === 0 && !willEnemyBeDefeated && enemyHealth > 0) {
          newShieldState = true;
          toast({ title: "Boss Casts Shield! 🛡️", description: "The Chapter Boss puts up a magical shield. Only Heavy attacks can shatter it!", variant: "destructive" });
        } else if (battleStage < 3 || willEnemyBeDefeated) {
          newShieldState = false;
        }

      } else {
        if (isCorrect) enemyDmg = playerStats.totalDamage * critMultiplier;
        else playerDmg = playerStats.totalDamage;
      }

      const bossMul = bossDifficulty === 'EASY' ? 0.7 : bossDifficulty === 'HARD' ? 1.5 : 1;
      const playerMul = bossDifficulty === 'EASY' ? 1.4 : bossDifficulty === 'HARD' ? 0.75 : 1;

      // Apply difficulty multiplier to player attack
      enemyDmg = enemyDmg * playerMul;

      // Apply Player Defense Attribute Mitigation to Incoming Boss Damage:
      const defenseMitigation = 100 / (100 + playerStats.defense);
      playerDmg = playerDmg * bossMul * defenseMitigation;

      playerHeal *= playerMul;
    } else if (quizMode === 'learning') {
      const waveState = getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies);
      if (isCorrect) {
        enemyDmg = waveState.damagePerQ;
        const currentMaxHp = getPlayerMaxHp();
        // Reward player with heal ONLY when player is below max HP
        if (playerHealth < currentMaxHp) {
          playerHeal = Math.min(15, currentMaxHp - playerHealth);
        } else {
          playerHeal = 0;
        }
      } else {
        enemyDmg = 0; // Enemy takes ZERO damage on player mistakes!
        // Player HP Scaling: Allow ~35% mistake budget (minimum 5 allowed mistakes) across total questions
        const totalQCount = questions.length || 10;
        const allowedMistakes = Math.max(5, Math.ceil(totalQCount * 0.35));
        playerDmg = 100 / allowedMistakes;
      }
    } else {
      // Learning Mode & Test Mode: 100 HP proportional scaling across total questions
      const baseStepDamage = 100 / (questions.length || 5);
      if (isCorrect) {
        enemyDmg = baseStepDamage;
      } else {
        playerDmg = baseStepDamage;
      }
    }

    // Apply health changes (Enemies NEVER heal)
    if (enemyDmg > 0) {
      const applyEnemyDamage = () => {
        setIsAnimating("enemy");
        setHitEffectTarget('enemy');
        setHitEffectKey(k => k + 1);
        const nextHp = Math.max(0, enemyHealth - enemyDmg);

        if (quizMode === 'boss-battle' && nextHp <= 0) {
          const activeNodes = getSubjectNodes(selectedSubject);
          const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
          const isChapter3FinalBoss = currentActiveNode.nodeNumber === 3;

          if (isChapter3FinalBoss || battleStage === 3) {
            setEnemyHealth(0);
            setBossShieldActive(false);
            setPlayerPoisoned(false);
          } else if (battleStage === 1) {
            setBattleStage(2);
            setBossShieldActive(false);
            setBossAnimState('idle');
            setPlayerAnimState('idle');
            const stage2Hp = calculateEnemyStageHp(2, userLevel, bossDifficulty || 'MEDIUM');
            setEnemyHealth(stage2Hp);
            addFloatingText('enemy', '👾 MINION DEFEATED! 👹 MINI-BOSS ENTERS!', 'text-amber-300');
            toast({
              title: "👾 Stage 1 Clear!",
              description: "You defeated the Minion! Prepare to face the Mini-Boss!",
            });
          } else if (battleStage === 2) {
            setBattleStage(3);
            setBossShieldActive(false);
            setBossAnimState('idle');
            setPlayerAnimState('idle');
            const stage3Hp = calculateEnemyStageHp(3, userLevel, bossDifficulty || 'MEDIUM');
            setEnemyHealth(stage3Hp);
            addFloatingText('enemy', '👹 MINI-BOSS DEFEATED! 👑 CHAPTER BOSS APPEARS!', 'text-red-400');
            toast({
              title: "👹 Stage 2 Clear!",
              description: "The Mini-Boss has fallen! The Chapter Boss enters the arena!",
            });
          }
        } else if (quizMode === 'learning' && nextHp <= 0) {
          if (learningStage === 1) {
            setLearningStage(2);
            setEnemyHealth(100);
            setIsAnimating("enemy");
            setBossAnimState('idle');
            setPlayerAnimState('idle');
            addFloatingText('enemy', '👾 MINION DEFEATED! 👹 ENFORCER ENTERS!', 'text-amber-300 font-black');
            toast({
              title: "👾 Wave 1 Cleared!",
              description: "You defeated the Minion! Prepare to face the Enforcer!",
            });
          } else if (learningStage === 2) {
            setLearningStage(3);
            setEnemyHealth(100);
            setIsAnimating("enemy");
            setBossAnimState('idle');
            setPlayerAnimState('idle');
            addFloatingText('enemy', '👹 ENFORCER DEFEATED! 👑 ELITE BOSS APPEARS!', 'text-red-400 font-black');
            toast({
              title: "👹 Wave 2 Cleared!",
              description: "The Enforcer has fallen! The Elite Boss enters the arena!",
            });
          } else {
            setEnemyHealth(100);
            setIsAnimating("enemy");
            addFloatingText('enemy', '👑 ELITE BOSS DEFEATED!', 'text-yellow-300 font-black');
          }
        } else {
          setEnemyHealth(nextHp);
        }

        addFloatingText(
          'enemy',
          `-${Math.ceil(enemyDmg)} ${isCritHit ? '⚡ CRITICAL STRIKE!' : action === 'heavy' ? 'HEAVY HIT!' : 'DMG!'}`,
          isCritHit ? 'text-amber-300 font-black' : 'text-yellow-400'
        );
      };

      if (isCorrect) {
        setBossAnimState('idle');
        setPlayerAnimState('attack');
        setTimeout(() => setPlayerAnimState('idle'), 1200);
        setTimeout(applyEnemyDamage, 450);
      } else {
        applyEnemyDamage();
      }
    }

    if (playerDmg > 0) {
      const applyPlayerDamage = () => {
        setIsAnimating("player");
        setHitEffectTarget('player');
        setHitEffectKey(k => k + 1);
        const nextHp = Math.max(0, playerHealth - playerDmg);
        setPlayerHealth(nextHp);

        addFloatingText('player', `-${Math.ceil(playerDmg)} DMG!`, 'text-red-500');
        const flashEnabled = typeof window !== 'undefined' ? localStorage.getItem('bq_pref_hit_flash') !== 'false' : true;
        if (flashEnabled) {
          setHitFlash(true);
          setTimeout(() => setHitFlash(false), 300);
        }

        if (nextHp <= 0 && !isFinishingRef.current) {
          if (quizMode === 'learning') {
            // Second Wind / Revive Mechanic for Learning Mode: Allows complete question & explanation coverage!
            setPlayerHealth(100);
            addFloatingText('player', '🧪 SECOND WIND! HP RESTORED!', 'text-emerald-400 font-black');
            playSfx('heal');
            toast({
              title: "🧪 Second Wind Activated!",
              description: "In Learning Mode, every question is a learning opportunity. Keep pushing forward!",
            });
          } else {
            // Boss-Battle & Test Mode: Strict Game Over Defeat
            addFloatingText('player', '💀 ASPIRANT DEFEATED!', 'text-red-600 font-black');
            setJudgementText('GAME OVER');
            playSfx('wrong');
            toast({
              variant: "destructive",
              title: "💀 Defeated in Arena!",
              description: "Your health dropped to 0. Review your answer performance to strengthen your weak areas!",
            });

            setTimeout(() => {
              setJudgementText(null);
              const currentScore = userAnswers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
              handleFinish(currentScore, 'defeat');
            }, 1800);
          }
        }
      };

      // Trigger Boss Attack animation & physical lunge ONLY on player mistake (!isCorrect)
      if (!isCorrect) {
        if (quizMode === 'learning') {
          // In Learning Mode (no action cards), randomize 50/50 between Normal Attack and Heavy Attack on wrong answer!
          const attackType = Math.random() < 0.5 ? 'normal_attack' : 'heavy_attack';
          setBossAnimState(attackType);
          const impactDelay = attackType === 'heavy_attack' ? 320 : 300;
          setTimeout(applyPlayerDamage, impactDelay);
          setTimeout(() => setBossAnimState('idle'), 950);
        } else {
          setBossAnimState(action === 'heavy' ? 'heavy_attack' : 'normal_attack');
          const impactDelay = action === 'heavy' ? 320 : 300;
          setTimeout(applyPlayerDamage, impactDelay);
          setTimeout(() => setBossAnimState('idle'), 950);
        }
      } else {
        setBossAnimState('idle');
        applyPlayerDamage();
      }
    }

    if (playerHeal > 0) {
      const currentMaxHp = getPlayerMaxHp();
      const actualHeal = Math.min(playerHeal, Math.max(0, currentMaxHp - playerHealth));
      if (actualHeal > 0) {
        setIsAnimating("player");
        playSfx('heal');
        setPlayerHealth(prev => Math.min(currentMaxHp, prev + actualHeal));
        addFloatingText('player', `+${Math.ceil(actualHeal)} HEALED!`, 'text-emerald-400 font-black');
      }
    }

    // In Learning Mode: If this was the final question, execute the 75% PRC Licensure Passing Threshold verdict!
    if (quizMode === 'learning' && userAnswers.length + 1 >= questions.length) {
      const currentTotalCorrect = userAnswers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
      const isOverallPassing = (currentTotalCorrect / questions.length) >= 0.75;

      // Step 1: Immediately drain losing entity's HP to 0 HP with impact animation
      setTimeout(() => {
        if (isOverallPassing) {
          setEnemyHealth(0);
          setHitEffectTarget('enemy');
          setHitEffectKey(k => k + 1);
          setPlayerAnimState('attack');
          addFloatingText('enemy', '💥 FINISHING STRIKE! 👑 BOSS DEFEATED!', 'text-amber-300 font-black');
        } else {
          setPlayerHealth(0);
          setHitEffectTarget('player');
          setHitEffectKey(k => k + 1);
          addFloatingText('player', '💀 ASPIRANT DEFEATED!', 'text-red-500 font-black');
        }
      }, 400);

      // Step 2: Once HP has visibly drained to 0, display the floating verdict and fanfare
      setTimeout(() => {
        if (isOverallPassing) {
          setJudgementText('YOU WON');
          playSfx('victory');
        } else {
          setJudgementText('YOU FAILED');
          playSfx('defeat');
        }
      }, 1100);
    }

    setPlayerPoisoned(newPoisonedState);
    setBossShieldActive(newShieldState);
    setTurnCount(prev => prev + 1);

    setTimeout(() => setIsAnimating(null), 500);
  };

  const handleRequestExplanation = async (index: number) => {
    const qToExplain = questions[index];
    const userAns = userAnswers.find(ua => ua.questionIndex === index);

    if (!qToExplain || !userAns || qToExplain.explanation) return;

    setFetchingExplanations(prev => ({ ...prev, [index]: true }));
    try {
      const feedback = await provideExamFeedback({
        questionId: qToExplain.id,
        question: qToExplain.question,
        correctAnswer: qToExplain.correctAnswer,
        userAnswer: userAns.selectedLetter
      });

      setQuestions(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = { ...updated[index], explanation: feedback.explanation };
        }
        return updated;
      });
    } catch (e) {
      console.error("Failed to fetch explanation", e);
    } finally {
      setFetchingExplanations(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleFinish = (finalScore: number, outcome?: 'victory' | 'defeat') => {
    if (isFinishingRef.current) return; // Prevent stale closures from double-calling
    isFinishingRef.current = true;

    setScore(finalScore);

    let finalOutcome = outcome;
    if (!finalOutcome) {
      if (quizMode === 'boss-battle') {
        if (enemyHealth <= 0) {
          finalOutcome = 'victory';
        } else if (playerHealth <= 0) {
          finalOutcome = 'defeat';
        } else {
          // If questions ended while player survived with HP > 0, judge outcome by accuracy!
          const actualTotal = userAnswers.length || finalScore || 1;
          const calcAcc = (finalScore / actualTotal) * 100;
          finalOutcome = calcAcc >= 60 ? 'victory' : 'defeat';
          if (finalOutcome === 'victory') {
            setEnemyHealth(0);
          } else {
            setPlayerHealth(0);
          }
        }
      } else if (quizMode === 'learning') {
        // Approach 1: PRC Board Licensure Passing Benchmark (75%)
        const actualTotal = questions.length || 10;
        const passPercent = (finalScore / actualTotal) * 100;
        finalOutcome = passPercent >= 75 ? 'victory' : 'defeat';
        if (finalOutcome === 'victory') {
          setEnemyHealth(0); // Finishing strike: Boss defeated
        } else {
          setPlayerHealth(0); // Boss counter: Player defeated
        }
      } else {
        // Test mode: standard 60% passing baseline
        finalOutcome = finalScore >= Math.ceil(questions.length * 0.6) ? 'victory' : 'defeat';
        if (finalOutcome === 'victory') {
          setEnemyHealth(0); // Player wins, Enemy dies
        } else {
          setPlayerHealth(0); // Enemy wins, Player dies
        }
      }
    }
    setBattleOutcome(finalOutcome!);

    if (quizMode !== 'learning') {
      if (finalOutcome === 'victory') {
        playSfx('victory');
      } else {
        playSfx('defeat');
      }
    }

    if (questStartTime) {
      const completionTime = Math.floor((Date.now() - questStartTime) / 1000);
      setQuestCompletionTime(completionTime);

      // Calculate earned badges
      const badges = calculateEarnedBadges({
        score: finalScore,
        totalQuestions: questions.length,
        confidenceLevel: 'Shaky',
        completionTime,
        streak: 0,
      });
      setEarnedBadges(badges);
    }

    // Show Judgement Text
    if (quizMode === 'learning') {
      setJudgementText(finalOutcome === 'victory' ? 'YOU WON' : 'YOU FAILED');
    } else {
      setJudgementText(finalOutcome === 'victory' ? 'VICTORY' : 'GAME OVER');
    }

    // Wait 2 seconds for animation, then show finished screen
    setTimeout(() => {
      setJudgementText(null);
      setIsFinished(true);

      const confEnabled = typeof window !== 'undefined' ? localStorage.getItem('bq_pref_confidence_prompts') !== 'false' : true;
      if (confEnabled) {
        setTimeout(() => setConfidenceDialogOpen(true), 300);
      } else {
        handleConfidenceSubmit('Steady');
      }
    }, 2000);
  };

  const handleConfidenceSubmit = async (selectedLevel: string) => {
    if (hasSubmittedConfidenceRef.current) return;
    hasSubmittedConfidenceRef.current = true;

    setConfidence(selectedLevel);
    setConfidenceSubmitted(true);
    setConfidenceDialogOpen(false);
    setIsSavingResults(true);

    try {
      // Calculate difficulty clears: Defeating Easy, Medium, and Hard unlocks next chapter node!
      const actualTotal = quizMode === 'boss-battle' ? (userAnswers.length || score) : questions.length;
      const accuracyPercent = actualTotal > 0 ? Math.round((score / actualTotal) * 100) : 0;
      const isVictory = quizMode === 'boss-battle' ? battleOutcome === 'victory' : accuracyPercent >= 60;

      if (selectedNodeId && isVictory) {
        const currentDiff = (bossDifficulty || 'MEDIUM').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
        saveNodeClearAction(selectedNodeId, currentDiff, selectedSubject);
        setNodeClears(prevClears => {
          const prevNodeClears = prevClears[selectedNodeId] || {};
          const updatedNodeClears = { ...prevNodeClears, [currentDiff]: true };
          const updatedClearsMap = { ...prevClears, [selectedNodeId]: updatedNodeClears };
          try {
            localStorage.setItem('boardquest_node_clears', JSON.stringify(updatedClearsMap));
          } catch (e) { }

          const totalStars = (updatedNodeClears.EASY ? 1 : 0) + (updatedNodeClears.MEDIUM ? 1 : 0) + (updatedNodeClears.HARD ? 1 : 0);
          setNodeStars(prevStars => {
            const updatedStarsMap = { ...prevStars, [selectedNodeId]: Math.max(prevStars[selectedNodeId] || 0, totalStars) };
            try {
              localStorage.setItem('boardquest_node_stars', JSON.stringify(updatedStarsMap));
            } catch (e) { }
            return updatedStarsMap;
          });

          return updatedClearsMap;
        });
      }

      const result = await completeQuest({
        score,
        totalQuestions: questions.length,
        confidenceLevel: selectedLevel as any,
        completionTime: questCompletionTime,
        questMode: quizMode,
        subject: selectedSubject,
        userAnswers: userAnswers.map(ua => ({
          questionId: ua.questionId || '',
          isCorrect: ua.isCorrect,
          difficulty: ua.difficulty
        })).filter(ua => ua.questionId !== '')
      });

      if (result.success) {
        // Recalculate badges with actual confidence level
        const updatedBadges = calculateEarnedBadges({
          score,
          totalQuestions: questions.length,
          confidenceLevel: selectedLevel as any,
          completionTime: questCompletionTime,
          streak: 0,
        });
        setEarnedBadges(updatedBadges);

        // Open thank you dialog strictly once after a short delay
        if (!hasShownThankYouRef.current) {
          hasShownThankYouRef.current = true;
          setTimeout(() => setThankYouDialogOpen(true), 200);
        }

        window.dispatchEvent(new CustomEvent('bq_stats_updated'));

        toast({
          title: quizMode === 'boss-battle' ? "👑 Chapter Boss Conquered!" : "Quest Completed!",
          description: quizMode === 'boss-battle'
            ? `⚔️ Glorious Victory! You vanquished the boss and conquered this chapter in ${selectedSubject}!`
            : result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save quest results.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsSavingResults(false);
    }
  };

  const subjectMeta = getSubjectMeta(selectedSubject);
  const EnemyIcon = subjectMeta.icon;

  if (isFinished) {
    const isVictor = quizMode === 'boss-battle' ? battleOutcome === 'victory' : ((score / questions.length) >= 0.75);

    return (
      <div
        ref={fullscreenRef}
        className={cn("min-h-full flex flex-col bg-background text-foreground", isFullscreen ? "h-screen w-screen overflow-y-auto" : "")}
      >
        <div className="flex-1 max-w-4xl w-full mx-auto py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in zoom-in duration-500">
          {/* For standard learning/test modes, show the original header */}
          {quizMode !== 'boss-battle' && (
            <header className="text-center space-y-3 sm:space-y-4 md:space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/15 blur-2xl rounded-full scale-125 md:scale-150 animate-pulse" />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-card rounded-full flex items-center justify-center border-4 border-primary shadow-2xl mx-auto">
                  {isVictor ? <Award className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-primary" /> : <Skull className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-muted-foreground" />}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline text-primary tracking-tighter">
                  {isVictor ? "BATTLE VICTORY" : "QUEST DEFEAT"}
                </h2>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] sm:text-[10px] md:text-xs">
                  Expedition for {selectedSubject}
                </p>
              </div>

              <div className="flex justify-center items-center gap-4 sm:gap-8 md:gap-12 py-3 sm:py-4">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black font-headline text-primary">{score}/{questions.length}</div>
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Accuracy</div>
                </div>
                <div className="h-8 sm:h-10 md:h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black font-headline text-accent">+{score * XP_PER_QUESTION}</div>
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">XP Earned</div>
                </div>
              </div>
            </header>
          )}

          {/* Dedicated Boss Battle Game Over Screen */}
          {quizMode === 'boss-battle' && !showBattleLog && (
            <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 md:space-y-10 py-6 sm:py-10 animate-in fade-in zoom-in duration-500">
              {/* The Outcome Banner */}
              <div className={cn(
                "w-full max-w-2xl py-8 sm:py-12 px-4 sm:px-8 text-center rounded-2xl sm:rounded-[2rem] border-2 sm:border-4 shadow-2xl backdrop-blur-md transition-all",
                battleOutcome === 'victory'
                  ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/50 shadow-emerald-500/10"
                  : "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/50 shadow-rose-500/10"
              )}>
                <h1 className={cn(
                  "text-3xl sm:text-5xl md:text-6xl font-black font-headline uppercase tracking-tight",
                  battleOutcome === 'victory' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {battleOutcome === 'victory' ? 'VICTORY!' : 'DEFEAT!'}
                </h1>
                <p className={cn(
                  "text-xs sm:text-base md:text-lg font-bold uppercase tracking-widest mt-2 sm:mt-4 leading-relaxed",
                  battleOutcome === 'victory' ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                )}>
                  {battleOutcome === 'victory' ? 'The Boss has been vanquished!' : (playerHealth <= 0 && enemyHealth > 0) ? 'Your HP reached 0! The boss has defeated you!' : 'You have run out of chances to defeat the Boss and failed'}
                </p>
              </div>

              {/* Boss Battle Stats */}
              <div className="flex justify-center items-center gap-6 sm:gap-8 md:gap-12 py-2 sm:py-4">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black font-headline text-primary">{score}</div>
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Correct Answers</div>
                </div>
                <div className="h-8 sm:h-10 md:h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black font-headline text-accent">+{score * XP_PER_QUESTION}</div>
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">XP Earned</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-lg mt-2 sm:mt-4">
                <Button
                  onClick={() => setShowBattleLog(true)}
                  className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-black/80 dark:border-white/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.15)] bg-amber-400 hover:bg-amber-500 text-black hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  Review Battle Log
                </Button>
              </div>
            </div>
          )}

          {/* Motivational Cards (Only show if not in Boss-Battle, or if reviewing the log) */}
          {(quizMode !== 'boss-battle' || showBattleLog) && (
            <>
              {score === 0 && (
                <Card className="border border-orange-500/30 dark:border-orange-500/40 shadow-lg bg-gradient-to-br from-orange-500/10 via-card to-rose-500/10 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4">
                    <p className="text-base sm:text-lg md:text-xl font-black text-foreground">Tough Expedition, Aspirant! 💪</p>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                      Even the greatest champions face setbacks. This is your learning moment! Every question you encounter strengthens your knowledge for the next quest.
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wide">
                      💡 Tip: Review the topics from this quest and try again. Better luck next time!
                    </p>
                  </CardContent>
                </Card>
              )}

              {score > 0 && score < Math.ceil(questions.length / 2) && (
                <Card className="border border-amber-500/30 dark:border-amber-500/40 shadow-lg bg-gradient-to-br from-amber-500/10 via-card to-yellow-500/10 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4">
                    <p className="text-base sm:text-lg md:text-xl font-black text-foreground">Nice Effort, Aspirant! 🌟</p>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                      You're on the right path! You've grasped some key concepts. Keep reinforcing these topics and you'll see significant improvement on your next expedition.
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide">
                      💡 Tip: Focus on the questions you missed—they're your learning opportunities!
                    </p>
                  </CardContent>
                </Card>
              )}

              {score >= Math.ceil(questions.length / 2) && score < questions.length && (
                <Card className="border border-sky-500/30 dark:border-sky-500/40 shadow-lg bg-gradient-to-br from-sky-500/10 via-card to-cyan-500/10 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4">
                    <p className="text-base sm:text-lg md:text-xl font-black text-foreground">Great Job, Aspirant! 🚀</p>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                      You're demonstrating solid knowledge! You're well on your way to mastery. A few more focused study sessions and you'll be unstoppable. Keep up the momentum!
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-sky-600 dark:text-sky-400 font-semibold uppercase tracking-wide">
                      💡 Tip: You're almost there! One more push to achieve perfect mastery.
                    </p>
                  </CardContent>
                </Card>
              )}

              {score === questions.length && score > 0 && (
                <Card className="border border-amber-500/50 dark:border-amber-400/60 shadow-xl bg-gradient-to-br from-amber-500/15 via-card to-yellow-500/15 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4">
                    <p className="text-base sm:text-lg md:text-xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">PERFECT SCORE! 👑✨</p>
                    <p className="text-xs sm:text-sm md:text-base text-foreground font-bold leading-relaxed">
                      PHENOMENAL! You've achieved PERFECT MASTERY! You are a true champion among aspirants. This is the peak of excellence—celebrate this victory!
                    </p>
                    <div className="flex justify-center gap-2 text-2xl animate-bounce">
                      🏆 ⭐ 🏆
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide">
                      You've earned extra respect in the BoardQuest arena!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Earned Badges Section */}
              {earnedBadges.length > 0 && (
                <Card className="border border-amber-500/30 dark:border-amber-400/30 shadow-lg bg-gradient-to-br from-amber-500/10 via-card to-yellow-500/10 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <p className="text-[10px] sm:text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 sm:mb-6 text-center">🏆 Badges Earned</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                      {earnedBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className="bg-card/80 dark:bg-card/50 p-3.5 sm:p-5 rounded-xl border border-amber-500/30 text-center space-y-2 shadow-sm flex flex-col items-center justify-center hover:scale-105 transition-all duration-300"
                        >
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 my-1 drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)]">
                            <Image
                              src={badge.spriteUrl || `/ui/${badge.id}-badge.png`}
                              alt={badge.title}
                              fill
                              className="object-contain"
                              style={{ imageRendering: 'pixelated' }}
                              unoptimized
                            />
                          </div>
                          <p className="font-bold text-xs sm:text-sm text-foreground tracking-wide">{badge.title}</p>
                          <p className="text-[9px] sm:text-[10px] text-amber-600/90 dark:text-amber-400/90 font-semibold">{badge.name}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </>
          )}

          {/* Confidence Dialog */}
          <Dialog open={confidenceDialogOpen} onOpenChange={setConfidenceDialogOpen}>
            <DialogContent
              container={isFullscreen ? (fullscreenRef.current || undefined) : undefined}
              className="sm:max-w-md border border-border bg-card text-card-foreground shadow-2xl p-4 sm:p-6 rounded-2xl z-[110]"
            >
              <DialogHeader className="text-center space-y-2 sm:space-y-3">
                <DialogTitle className="font-headline text-xl sm:text-2xl text-foreground">⚡ Aspirant's Conviction</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">How confident are you in your answers?</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 py-4 sm:py-6">
                {[
                  {
                    level: 'Shaky',
                    emoji: '🔥',
                    color: 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400',
                    selectedColor: 'bg-rose-500/25 border-rose-500 ring-2 ring-rose-400 text-rose-800 dark:text-rose-300',
                    description: 'Low Confidence',
                  },
                  {
                    level: 'Steady',
                    emoji: '⚡',
                    color: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400',
                    selectedColor: 'bg-amber-500/25 border-amber-500 ring-2 ring-amber-400 text-amber-800 dark:text-amber-300',
                    description: 'Balanced Confidence',
                  },
                  {
                    level: 'Unyielding',
                    emoji: '💫',
                    color: 'bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary',
                    selectedColor: 'bg-primary/25 border-primary ring-2 ring-primary/60 text-primary',
                    description: 'High Confidence',
                  },
                ].map((option) => (
                  <button
                    key={option.level}
                    onClick={() => {
                      if (!confidenceSubmitted) {
                        handleConfidenceSubmit(option.level);
                      }
                    }}
                    className={cn(
                      'relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-center transform',
                      confidence === option.level ? option.selectedColor : option.color,
                      !confidenceSubmitted && 'hover:scale-105 active:scale-95'
                    )}
                    disabled={isSavingResults}
                  >
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="text-2xl sm:text-3xl">{option.emoji}</div>
                      <div className="font-black text-xs leading-tight">{option.level}</div>
                      <div className="text-[8px] sm:text-[9px] opacity-80 font-bold">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Thank You Dialog */}
          <Dialog open={thankYouDialogOpen} onOpenChange={setThankYouDialogOpen}>
            <DialogContent
              container={isFullscreen ? (fullscreenRef.current || undefined) : undefined}
              className="sm:max-w-md border border-primary/30 bg-card text-card-foreground shadow-2xl p-6 rounded-2xl animate-in fade-in zoom-in duration-500 z-[110]"
            >
              <DialogTitle className="sr-only">Quest Completion</DialogTitle>
              <div className="space-y-4 sm:space-y-6 text-center py-4 sm:py-8 px-2">
                {/* Trophy Animation */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 border-4 border-primary/30 shadow-2xl animate-bounce">
                      <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  </div>
                </div>

                {/* Main Message */}
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black font-headline text-primary tracking-tight">
                    Thank You, Aspirant!
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-semibold leading-relaxed">
                    Your conviction has been recorded and your quest success has been logged to your profile!
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>


          {/* AI Tutor Summary (Only show if not in Boss-Battle, or if reviewing the log) */}
          {(quizMode !== 'boss-battle' || showBattleLog) && (
            <Card className="border border-border shadow-xl bg-card overflow-hidden rounded-2xl md:rounded-[2rem]">
              <CardHeader className="bg-muted/40 border-b border-border p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <CardTitle className="font-headline text-lg sm:text-xl md:text-2xl flex items-center gap-2 text-foreground">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                      Battle Log
                    </CardTitle>
                    <CardDescription className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                      Post-Battle Rationale
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-2.5 sm:px-3 py-1 uppercase font-bold text-[8px] sm:text-[9px] md:text-[10px]">
                    {quizMode} Mode Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {questions.map((q, idx) => {
                    const userAns = userAnswers.find(ua => ua.questionIndex === idx);
                    if (!userAns) return null;

                    const isCorrect = userAns.isCorrect;

                    return (
                      <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-border last:border-0 px-2 md:px-4">
                        <AccordionTrigger className="hover:no-underline py-3.5 sm:py-4 md:py-6 px-2 md:px-4">
                          <div className="flex items-start text-left gap-3 sm:gap-4 md:gap-6">
                            <div className="mt-0.5 sm:mt-1 shrink-0">
                              {isCorrect ? (
                                <div className="bg-emerald-500/15 dark:bg-emerald-950/60 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-emerald-500/30">
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                              ) : (
                                <div className="bg-rose-500/15 dark:bg-rose-950/60 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-rose-500/30">
                                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs sm:text-sm text-foreground leading-snug line-clamp-2 sm:line-clamp-1">{q.question}</p>
                              <div className="flex gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                                <Badge variant={isCorrect ? "secondary" : "destructive"} className="text-[7.5px] sm:text-[8px] h-4 font-black uppercase tracking-tighter">
                                  {isCorrect ? "Mastered" : "Review"}
                                </Badge>
                                <Badge variant="outline" className="text-[7.5px] sm:text-[8px] h-4 font-black uppercase tracking-tighter border-primary/20 text-primary">
                                  {q.type?.replace('_', ' ') || "MCQ"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-2 sm:px-4 md:px-6 pb-4 sm:pb-6 md:pb-8 pt-1">
                          <div className="bg-muted/30 dark:bg-muted/20 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-5 md:p-8 space-y-3 sm:space-y-4 md:space-y-6 border border-border">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 md:gap-6">
                              <div className="p-3 sm:p-4 bg-card rounded-xl border border-border shadow-sm">
                                <p className="text-[8px] sm:text-[9px] uppercase font-black text-muted-foreground mb-1">Aspirant Choice</p>
                                <p className={cn("font-bold text-xs sm:text-sm", isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                  {q.type === 'TRUE_FALSE' && userAns?.selectedLetter
                                    ? (userAns.selectedLetter === 'A' ? 'True (Option A)' : userAns.selectedLetter === 'B' ? 'False (Option B)' : userAns.selectedLetter)
                                    : userAns?.selectedLetter ? `Option ${userAns.selectedLetter}` : 'None'}
                                </p>
                              </div>
                              <div className="p-3 sm:p-4 bg-card rounded-xl border border-border shadow-sm">
                                <p className="text-[8px] sm:text-[9px] uppercase font-black text-muted-foreground mb-1">Correct Rationale</p>
                                <p className="font-bold text-xs sm:text-sm text-primary">
                                  {q.type === 'TRUE_FALSE'
                                    ? (q.correctAnswer === 'A' ? 'True (Option A)' : q.correctAnswer === 'B' ? 'False (Option B)' : q.correctAnswer)
                                    : `Option ${q.correctAnswer}`}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-black font-headline text-primary flex items-center gap-1.5 sm:gap-2 uppercase text-[9px] sm:text-[10px] tracking-widest">
                                <BrainCircuit className="w-3.5 h-3.5" />
                                AI LOGICAL ANALYSIS
                              </h4>
                              <div className="bg-card/90 dark:bg-card/60 p-3 sm:p-4 md:p-6 rounded-xl border border-dashed border-primary/20">
                                {q.explanation ? (
                                  <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground italic">
                                    {q.explanation}
                                  </p>
                                ) : fetchingExplanations[idx] ? (
                                  <div className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2">
                                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                                    <p className="text-[9px] sm:text-[10px] font-bold text-primary animate-pulse">INTERPRETING DATA...</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-start gap-2">
                                    <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground italic">
                                      Want to know why this is the correct answer?
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRequestExplanation(idx)}
                                      className="text-xs text-primary border-primary hover:bg-primary hover:text-white"
                                    >
                                      <BrainCircuit className="w-3 h-3 mr-2" />
                                      Ask AI Tutor
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pb-12 w-full max-w-xl mx-auto px-2 sm:px-0 mt-6 sm:mt-8">
            <Button
              onClick={() => {
                setIsStarted(false);
                setIsFinished(false);
                setShowBattleLog(false);
              }}
              className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-black/80 dark:border-white/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.15)] bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
            >
              Re-Enter Arena
            </Button>
            <Link href="/" className="flex-1 flex">
              <Button className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-black/80 dark:border-white/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.15)] bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isStarted) {
    const maxPlayerHp = getPlayerMaxHp();
    const diffBase = bossDifficulty === 'EASY' ? 400 : bossDifficulty === 'HARD' ? 800 : 600;
    const levelScaling = bossDifficulty === 'EASY' ? 5 : bossDifficulty === 'HARD' ? 12 : 8;

    let maxEnemyHp = 100;
    if (quizMode === 'boss-battle') {
      const calculatedHp = Math.floor(diffBase + (userLevel * levelScaling));
      const playerMul = bossDifficulty === 'EASY' ? 1.5 : bossDifficulty === 'HARD' ? 0.7 : 1;
      const maxPossibleDamage = questions.length * 25 * playerMul;
      const safeHpCap = Math.max(100, Math.floor(maxPossibleDamage * 0.8));
      maxEnemyHp = Math.min(calculatedHp, safeHpCap);
    }

    return (
      <div
        ref={fullscreenRef}
        className={cn(
          "min-h-full flex flex-col bg-background transition-transform",
          isFullscreen ? "h-screen w-screen" : "",
          (introPhase === 'cutscene' || introPhase === 'vs') ? "overflow-hidden" : (isFullscreen ? "overflow-y-auto no-scrollbar" : "no-scrollbar"),
          hitFlash && "animate-shake"
        )}
      >
        {/* Exit Confirmation Dialog */}
        <Dialog open={leaveConfirmDialogOpen} onOpenChange={setLeaveConfirmDialogOpen}>
          <DialogContent
            container={isFullscreen ? fullscreenRef.current : undefined}
            className="sm:max-w-md border border-destructive/40 bg-card text-card-foreground shadow-2xl p-4 sm:p-6 rounded-2xl"
          >
            <DialogHeader className="text-center space-y-2 sm:space-y-3">
              <DialogTitle className="font-headline text-xl sm:text-2xl text-destructive flex items-center justify-center gap-2">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                Retreat from Battle?
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Are you certain you wish to retreat? Leaving the arena now means you will forfeit all potential XP and badges from this session.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-4 sm:mt-6">
              <Button
                variant="outline"
                className="flex-1 font-bold border-2"
                onClick={() => setLeaveConfirmDialogOpen(false)}
              >
                Return to Battle
              </Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold shadow-lg shadow-destructive/20"
                onClick={() => {
                  setLeaveConfirmDialogOpen(false);
                  setIsStarted(false);
                }}
              >
                Flee Arena
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <main className={cn("flex-1 flex flex-col relative", introPhase !== 'active' && "overflow-hidden")}>
          <div
            className={cn(
              "relative overflow-hidden border-b flex flex-col transition-all duration-1000 ease-in-out shrink-0",
              introPhase === 'cutscene' ? "h-[85vh] md:h-[100vh]" : "h-[35vh] md:h-[45vh]",
              !(SUBJECT_METADATA[selectedSubject]?.arenaBackgroundUrl || SUBJECT_METADATA[selectedSubject]?.backgroundUrl) && "bg-gradient-to-b from-primary to-black"
            )}
            style={{
              containerType: 'inline-size',
              ...((SUBJECT_METADATA[selectedSubject]?.arenaBackgroundUrl || SUBJECT_METADATA[selectedSubject]?.backgroundUrl) ? {
                backgroundImage: `url('${SUBJECT_METADATA[selectedSubject]?.arenaBackgroundUrl || SUBJECT_METADATA[selectedSubject]?.backgroundUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {})
            }}
          >
            {/* Dark Overlay that fades in after cutscene intro */}
            <div className={cn(
              "absolute inset-0 transition-all duration-1000",
              introPhase === 'cutscene' ? "bg-black/0 backdrop-blur-none" : "bg-black/60 backdrop-blur-sm"
            )} />

            {/* Hit Flash Overlay */}
            <div className={cn(
              "absolute inset-0 bg-red-600 z-40 pointer-events-none transition-opacity duration-300",
              hitFlash ? "opacity-30" : "opacity-0"
            )} />

            {/* Gamified Battle Simulation Floating Verdict (No Box/Container) */}
            {judgementText && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/65 backdrop-blur-md animate-in fade-in duration-500 pointer-events-none p-4 select-none">
                {/* Ambient Radial Color Glow */}
                <div className={cn(
                  "absolute w-72 sm:w-96 h-40 sm:h-48 rounded-full blur-3xl pointer-events-none -translate-y-2 opacity-60",
                  (judgementText === 'VICTORY' || judgementText === 'YOU WON') ? "bg-emerald-500/50" : "bg-red-500/50"
                )} />

                {/* Header Subtitle Tag */}
                <div className="flex items-center gap-2 z-10 mb-1 animate-in slide-in-from-top-3 duration-500">
                  {quizMode === 'boss-battle' ? (
                    (judgementText === 'VICTORY' || judgementText === 'YOU WON') ? (
                      <>
                        <Swords className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
                        <span className="text-[11px] sm:text-sm md:text-base font-bytebounce uppercase tracking-widest font-black text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                          CHAPTER BOSS CONQUERED • VICTORY ACHIEVED
                        </span>
                        <Swords className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
                      </>
                    ) : (
                      <>
                        <Skull className="w-4 h-4 md:w-5 md:h-5 text-red-400 animate-bounce" />
                        <span className="text-[11px] sm:text-sm md:text-base font-bytebounce uppercase tracking-widest font-black text-red-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                          ASPIRANT DEFEATED • HEALTH REACHED 0 HP
                        </span>
                        <Skull className="w-4 h-4 md:w-5 md:h-5 text-red-400 animate-bounce" />
                      </>
                    )
                  ) : (
                    (judgementText === 'VICTORY' || judgementText === 'YOU WON') ? (
                      <>
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
                        <span className="text-[11px] sm:text-sm md:text-base font-bytebounce uppercase tracking-widest font-black text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                          QUEST CLEARED • 75%+ LICENSURE BENCHMARK MET
                        </span>
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] sm:text-sm md:text-base font-bytebounce uppercase tracking-widest font-black text-red-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                          QUEST FAILED • BELOW 75% PASSING GRADE
                        </span>
                      </>
                    )
                  )}
                </div>

                {/* Giant RPG Floating Title */}
                <h2 className={cn(
                  "font-bytebounce text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-wider leading-none animate-in zoom-in-75 duration-700 z-10 my-0.5",
                  (judgementText === 'VICTORY' || judgementText === 'YOU WON')
                    ? "text-emerald-300 drop-shadow-[0_0_35px_rgba(16,185,129,0.95)]"
                    : "text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.95)]"
                )}>
                  {quizMode === 'boss-battle'
                    ? (judgementText === 'VICTORY' || judgementText === 'YOU WON' ? 'VICTORY' : 'GAME OVER')
                    : (judgementText === 'VICTORY' || judgementText === 'YOU WON' ? 'YOU WON' : 'YOU FAILED')}
                </h2>

                {/* Floating Instruction Subtitle */}
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white/90 font-mono tracking-tight max-w-md text-center z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] mt-1">
                  {quizMode === 'boss-battle' ? (
                    (judgementText === 'VICTORY' || judgementText === 'YOU WON')
                      ? "You vanquished the Chapter Boss and conquered the arena!"
                      : "Your health dropped to 0 HP. Review your battle log and try again!"
                  ) : (
                    (judgementText === 'VICTORY' || judgementText === 'YOU WON')
                      ? "Outstanding performance! Click Finish Quest below to view your full scorecard & claim rewards."
                      : "Passing standard not reached. Review the AI Tutor Logic Analysis below to master these concepts!"
                  )}
                </p>
              </div>
            )}

            <header className="px-4 py-3 flex items-center justify-between relative z-10 w-full drop-shadow-md">
              <Button variant="ghost" size="icon" onClick={() => setLeaveConfirmDialogOpen(true)} className="rounded-full shrink-0 text-white hover:bg-white/20">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div className="text-center min-w-0 flex-1 px-4">
                <h1 className="text-white font-black font-headline text-sm md:text-lg uppercase leading-none truncate">{selectedSubject}</h1>
                <p className="text-[8px] md:text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">
                  {quizMode === 'learning' ? 'Intel Gathering' : 'Battle Simulation'}
                </p>
              </div>
              <div className="flex shrink-0 justify-end items-center gap-2" >
                {introPhase === 'cutscene' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIntroPhase('vs')}
                    className="font-black uppercase tracking-widest text-[8px] md:text-[10px] animate-pulse h-8"
                  >
                    Skip Cutscene
                  </Button>
                )}
                {quizMode === 'boss-battle' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setInventoryDialogOpen(true)}
                    className="rounded-full text-amber-300 hover:bg-white/20 h-8 w-8 relative flex items-center justify-center p-1 active:scale-95 transition-transform"
                    title="Open Reagent Inventory"
                  >
                    <Image
                      src="/ui/Inventory_icon.png"
                      alt="Inventory"
                      width={22}
                      height={22}
                      className="w-5 h-5 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                      unoptimized
                    />
                    {equippedItem && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black animate-pulse" />
                    )}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-full text-white hover:bg-white/20 h-8 w-8" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            </header>

            {/* Health Bars Stacked on Mobile, Floating on Desktop */}
            {/* Enemy */}
            {(() => {
              const activeNodes = getSubjectNodes(selectedSubject);
              const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];

              const currentQ = questions[Math.min(questions.length - 1, userAnswers.length)] || questions[0];
              const currentDiff = String(currentQ?.difficulty || 'EASY').toUpperCase();

              let activeEnemyName = subjectMeta.enemy;
              let activeEnemyBadge = 'BOSS 👑';
              let idleSprite: string | null = null;
              let attackSprite: string | null = null;
              let heavyAttackSprite: string | null = null;
              let displayEnemyHp = enemyHealth;

              let waveState: any = null;

              if (quizMode === 'boss-battle') {
                activeEnemyName = battleStage === 1 ? currentActiveNode.minionName : battleStage === 2 ? currentActiveNode.miniBossName : currentActiveNode.bossName;
                activeEnemyBadge = battleStage === 1 ? 'MINION 👾' : battleStage === 2 ? 'MINI-BOSS 👹' : 'BOSS 👑';
                const isChapter3FinalBoss = currentActiveNode?.nodeNumber === 3;
                const isBossStageOrCh3 = battleStage === 3 || isChapter3FinalBoss;

                if (battleStage === 1 && currentActiveNode?.minionIdleSpriteUrl) {
                  idleSprite = currentActiveNode.minionIdleSpriteUrl || null;
                  attackSprite = currentActiveNode.minionAttackSpriteUrl || currentActiveNode.minionIdleSpriteUrl || null;
                  heavyAttackSprite = currentActiveNode.minionHeavyAttackSpriteUrl || currentActiveNode.minionAttackSpriteUrl || null;
                } else if (isBossStageOrCh3) {
                  idleSprite = currentActiveNode?.idleSpriteUrl || subjectMeta?.idleSpriteUrl || null;
                  attackSprite = currentActiveNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl || null;
                  heavyAttackSprite = currentActiveNode?.heavyAttackSpriteUrl || subjectMeta?.heavyAttackSpriteUrl || null;
                }
                displayEnemyHp = enemyHealth;
              } else if (quizMode === 'learning') {
                waveState = getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies);
                activeEnemyName = waveState.name;
                activeEnemyBadge = waveState.badge;
                idleSprite = waveState.idleSprite;
                attackSprite = waveState.attackSprite;
                heavyAttackSprite = waveState.heavyAttackSprite;
                displayEnemyHp = enemyHealth <= 0 ? 0 : waveState.hp;
              } else {
                activeEnemyName = subjectMeta.enemy;
                activeEnemyBadge = 'BOSS 👑';
                idleSprite = currentActiveNode?.idleSpriteUrl || subjectMeta?.idleSpriteUrl || null;
                attackSprite = currentActiveNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl || null;
                heavyAttackSprite = currentActiveNode?.heavyAttackSpriteUrl || subjectMeta?.heavyAttackSpriteUrl || null;
                displayEnemyHp = enemyHealth;
              }

              const isMinionStageWithSprite = quizMode === 'boss-battle' && battleStage === 1 && !!currentActiveNode?.minionIdleSpriteUrl;

              const effectiveIdleFrames = isMinionStageWithSprite
                ? (currentActiveNode.minionIdleFrames || 8)
                : (waveState?.idleFrames || currentActiveNode?.idleFrames || subjectMeta?.idleFrames || 7);

              const effectiveAttackFrames = isMinionStageWithSprite
                ? (currentActiveNode.minionAttackFrames || 14)
                : (waveState?.attackFrames || currentActiveNode?.attackFrames || subjectMeta?.attackFrames || 17);

              const effectiveHeavyAttackFrames = isMinionStageWithSprite
                ? (currentActiveNode.minionHeavyAttackFrames || 10)
                : (waveState?.heavyAttackFrames || currentActiveNode?.heavyAttackFrames || subjectMeta?.heavyAttackFrames || 11);

              const effectiveIdleFrameWidth = isMinionStageWithSprite
                ? (currentActiveNode.minionIdleFrameWidth || 128)
                : (waveState?.idleFrameWidth || currentActiveNode?.idleFrameWidth || subjectMeta?.idleFrameWidth || 128);

              const effectiveAttackFrameWidth = isMinionStageWithSprite
                ? (currentActiveNode.minionAttackFrameWidth || 257)
                : (waveState?.attackFrameWidth || currentActiveNode?.attackFrameWidth || subjectMeta?.attackFrameWidth || 128);

              const effectiveHeavyFrameWidth = isMinionStageWithSprite
                ? (currentActiveNode.minionHeavyFrameWidth || 257)
                : (waveState?.heavyFrameWidth || currentActiveNode?.heavyFrameWidth || subjectMeta?.heavyFrameWidth || 176);

              const effectiveIdleFrameHeight = isMinionStageWithSprite
                ? (currentActiveNode.minionIdleFrameHeight || 128)
                : (waveState?.idleFrameHeight || currentActiveNode?.idleFrameHeight || subjectMeta?.idleFrameHeight || 128);

              const effectiveAttackFrameHeight = isMinionStageWithSprite
                ? (currentActiveNode.minionAttackFrameHeight || 218)
                : (waveState?.attackFrameHeight || currentActiveNode?.attackFrameHeight || subjectMeta?.attackFrameHeight || 128);

              const effectiveHeavyFrameHeight = isMinionStageWithSprite
                ? (currentActiveNode.minionHeavyFrameHeight || 218)
                : (waveState?.heavyFrameHeight || currentActiveNode?.heavyFrameHeight || subjectMeta?.heavyFrameHeight || 128);

              const stageMaxHp = quizMode === 'boss-battle'
                ? calculateEnemyStageHp(battleStage, userLevel, bossDifficulty || 'MEDIUM')
                : 100;

              return (
                <div className={cn(
                  "absolute top-14 right-4 md:top-16 md:right-8 transition-all duration-1000 ease-out z-10 flex flex-col items-end",
                  (introPhase === 'cutscene' || introPhase === 'hidden') ? 'translate-x-[150%]' : 'translate-x-0',
                  isAnimating === "enemy" && "animate-shake scale-110"
                )}>
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded-lg shadow-2xl min-w-[120px] md:min-w-[160px]">
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <span className="text-[8px] md:text-[10px] font-black text-white uppercase truncate">{activeEnemyName}</span>
                      <div className="flex items-center gap-1">
                        {bossShieldActive && <span className="text-[7px] md:text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-black shrink-0 animate-pulse" title="Immune to Normal Attacks">SHIELDED</span>}
                        {quizMode === 'boss-battle' && enemyHealth <= 20 && enemyHealth > 0 ? (
                          <span className="text-[7px] md:text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black shrink-0 animate-pulse" title="2.0x damage on player mistakes!">ENRAGED</span>
                        ) : quizMode === 'boss-battle' && enemyHealth <= 60 && enemyHealth > 0 ? (
                          <span className="text-[7px] md:text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-black shrink-0" title="Double damage on player mistakes!">AGGRESSIVE</span>
                        ) : null}
                        <span className="text-[7px] md:text-[8px] bg-primary text-white px-1.5 py-0.5 rounded font-black shrink-0">{activeEnemyBadge}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-0.5 px-0.5 mt-0.5">
                      <span className="text-[6px] md:text-[8px] font-bold text-white/70 tracking-widest uppercase">HP</span>
                      <span className="text-[7.5px] md:text-[9.5px] font-black text-white">{Math.ceil(displayEnemyHp)} / {stageMaxHp}</span>
                    </div>
                    <div className="h-1.5 md:h-2 w-full bg-background/10 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (displayEnemyHp / stageMaxHp) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-end pr-2 md:pr-4 mt-2 relative items-center min-h-[96px]">
                    <div className="relative inline-flex items-center justify-center">
                      {idleSprite && attackSprite ? (
                        <BossSpriteAnimator
                          idleSpriteUrl={idleSprite}
                          attackSpriteUrl={attackSprite}
                          heavyAttackSpriteUrl={heavyAttackSprite || undefined}
                          attackProjectileUrl={waveState?.attackProjectileUrl || currentActiveNode?.attackProjectileUrl || subjectMeta?.attackProjectileUrl || undefined}
                          attackProjectileFrames={waveState?.attackProjectileFrames || currentActiveNode?.attackProjectileFrames || subjectMeta?.attackProjectileFrames || 5}
                          idleFrames={effectiveIdleFrames}
                          attackFrames={effectiveAttackFrames}
                          heavyAttackFrames={effectiveHeavyAttackFrames}
                          idleFrameWidth={effectiveIdleFrameWidth}
                          attackFrameWidth={effectiveAttackFrameWidth}
                          heavyFrameWidth={effectiveHeavyFrameWidth}
                          idleFrameHeight={effectiveIdleFrameHeight}
                          attackFrameHeight={effectiveAttackFrameHeight}
                          heavyFrameHeight={effectiveHeavyFrameHeight}
                          animState={introPhase === 'active' ? bossAnimState : 'idle'}
                          onAttackComplete={() => setBossAnimState('idle')}
                          scale={1.35}
                          isHit={isAnimating === "enemy"}
                          isEnraged={quizMode === 'boss-battle' && enemyHealth <= 20 && enemyHealth > 0}
                          isShielded={bossShieldActive}
                        />
                      ) : (
                        <EnemyIcon className="w-16 h-16 md:w-24 md:h-24 text-white drop-shadow-glow" />
                      )}
                      {/* Enemy Hit Animation directly on boss/enemy chest/neck */}
                      <HitEffectAnimator
                        isActive={hitEffectTarget === 'enemy'}
                        triggerKey={hitEffectKey}
                        scale={2.2}
                        className="top-[32%] left-[48%]"
                      />
                    </div>
                    {/* Enemy Floating Text */}
                    {floatingTexts.filter(ft => ft.target === 'enemy').map(ft => (
                      <div key={ft.id} className={cn("absolute -top-4 right-10 font-bytebounce text-2xl md:text-3xl animate-float-up pointer-events-none z-50 whitespace-nowrap", ft.color)} style={{ textShadow: '2px 2px 0 #000' }}>
                        {ft.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Player Character Sprite & Info Card */}
            <div className={cn(
              "absolute bottom-0 left-0 transition-all duration-1000 ease-out z-10 flex items-end gap-2 md:gap-3",
              (introPhase === 'cutscene' || introPhase === 'hidden') ? '-translate-x-[150%]' : 'translate-x-0',
              isAnimating === "player" && "animate-shake scale-105"
            )}>
              {/* Standalone Foreground Player Character Sprite - Completely flush to bottom-left */}
              <div className={cn(
                "relative flex flex-col items-center justify-end shrink-0 -mb-4 md:-mb-6 -ml-2 md:-ml-4 transition-all transform-gpu z-20",
                playerAnimState === 'attack' && "animate-player-lunge"
              )}>
                {/* Ground Shadow for Player Character */}
                <div className="absolute bottom-4 w-36 md:w-52 h-5 bg-black/70 rounded-[100%] blur-md scale-y-50 pointer-events-none" />

                <div className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-84 lg:h-84 shrink-0 transition-transform">
                  <Image
                    src="/images/player/userPlayer_placeholder.png"
                    alt="Aspirant Character Sprite"
                    width={300}
                    height={300}
                    className="w-full h-full object-contain object-bottom filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
                    style={{ imageRendering: 'pixelated' }}
                    unoptimized
                  />
                  {/* Player Hit Animation directly on player chest/body */}
                  <HitEffectAnimator
                    isActive={hitEffectTarget === 'player'}
                    triggerKey={hitEffectKey}
                    scale={2.2}
                    className="top-[45%] left-[52%]"
                  />
                </div>

                {/* Player Floating Text - Directly on top of player sprite head */}
                {floatingTexts.filter(ft => ft.target === 'player').map(ft => (
                  <div key={ft.id} className={cn("absolute top-6 sm:top-10 md:top-14 left-1/2 -translate-x-1/2 font-bytebounce text-3xl md:text-5xl animate-float-up pointer-events-none z-50 whitespace-nowrap", ft.color)} style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
                    {ft.text}
                  </div>
                ))}
              </div>

              {/* Player Health & Stats Card */}
              {(() => {
                const maxPlayerHp = getPlayerMaxHp();

                return (
                  <div className="bg-black/50 backdrop-blur-md border border-white/15 p-2 md:p-3 rounded-lg shadow-2xl min-w-[120px] md:min-w-[170px] relative mb-3 ml-1">
                    {streak >= 2 && (
                      <div className="absolute -top-3.5 -right-2 z-30 animate-bounce">
                        <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 border border-yellow-300 text-white font-bytebounce text-xs md:text-sm px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] flex items-center gap-1 whitespace-nowrap">
                          <Flame className="w-3 h-3 text-yellow-200 fill-yellow-200 animate-pulse" />
                          {streak}x COMBO
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <span className="text-[7px] md:text-[8px] font-black text-white uppercase">Aspirant {userLastName}</span>
                      <div className="flex items-center gap-1">
                        {playerPoisoned && <span className="text-[7px] md:text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded font-black shrink-0 animate-pulse" title="Taking damage every turn! Defend to cure.">POISONED</span>}
                        <span className="text-[7px] md:text-[8px] bg-background text-primary px-1.5 py-0.5 rounded font-black shrink-0">LVL {userLevel}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-0.5 px-0.5 mt-0.5">
                      <span className="text-[6px] md:text-[8px] font-bold text-white/70 tracking-widest uppercase">HP</span>
                      <span className="text-[7.5px] md:text-[9.5px] font-black text-white">{Math.ceil(Math.min(playerHealth, maxPlayerHp))} / {maxPlayerHp}</span>
                    </div>
                    <div className="h-1.5 md:h-2 w-full bg-background/10 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, (Math.min(playerHealth, maxPlayerHp) / maxPlayerHp) * 100)}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className={cn(
            "flex-1 bg-background transition-transform duration-700 ease-out z-20",
            introPhase === 'active' ? 'translate-y-0' : 'translate-y-[100%]'
          )}>
            <QuizInterface
              questions={questions}
              onFinish={handleFinish}
              onAnswer={handleAnswer}
              onRequestExplanation={handleRequestExplanation}
              isLoading={isLoading}
              mode={quizMode}
              battleStage={battleStage}
              bossShieldActive={bossShieldActive}
              playerPoisoned={playerPoisoned}
              streak={streak}
              equippedItem={equippedItem}
              clarityUsedThisBattle={clarityUsedThisBattle}
              onUseClarity={handleUseClarity}
            />
          </div>
        </main>
        {inventoryDialogJSX}
      </div>
    );
  }

  return (
    <div
      ref={fullscreenRef}
      className={cn(
        "min-h-full flex flex-col pb-20 md:pb-12 overflow-hidden relative bg-black",
        isFullscreen ? "h-screen w-screen" : ""
      )}
      style={{
        backgroundImage: `url('${(getSubjectMeta(selectedSubject)).backgroundUrl || ''}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'local',
        transition: 'background-image 0.6s ease-in-out',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px] transition-all duration-600" />

      <header id="tour-quest-header" className="px-6 md:px-8 pt-6 md:pt-8 pb-4 space-y-1 relative z-10">
        <div className="absolute top-6 right-6 md:top-8 md:right-8 z-50">
          <Button
            variant="outline"
            size="icon"
            className="bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-md transition-all shadow-lg"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0 mb-6 pr-12">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-black font-headline leading-tight tracking-tight text-white">
              Select Your <br />
              <span className="text-primary" style={{
                textShadow: '2px 2px 0 #ffffff, -2px -2px 0 #8B0000, 2px -2px 0 #8B0000, -2px 2px 0 #8B0000',
                WebkitTextStroke: '2px #fbfbfb',
                fontFamily: "'Poppins', sans-serif"
              }}>
                Quest Region
              </span>
            </h1>
          </div>
        </div>

        <p className="text-[11px] font-bold text-slate-200 uppercase tracking-[0.15em]">
          MASTER EACH LABORATORY SCIENCE
        </p>
      </header>

      <div id="tour-quest-map" className={cn(
        "flex-1 flex flex-col justify-center py-6 md:py-10 relative z-10 overflow-hidden",
        isFullscreen && (!categoriesLoading && dynamicCategories.length === 0) ? "my-auto items-center" : ""
      )}>
        {categoriesLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] space-y-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-white font-bytebounce text-lg tracking-widest uppercase">
              Loading Quest Regions...
            </p>
          </div>
        ) : dynamicCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] px-6 text-center max-w-xl mx-auto my-auto space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-black/80 border-2 border-amber-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Compass className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bytebounce text-amber-400 tracking-widest uppercase font-bold" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                NO QUEST REGIONS DISCOVERED
              </h3>
              <p className="text-xs md:text-sm text-slate-300 font-sans max-w-sm md:max-w-md mx-auto leading-relaxed opacity-90 font-medium">
                There are currently no active subject domains configured in the database. Please contact your Review Center Administrator or check your connection.
              </p>
            </div>
            <Button
              onClick={handleRescan}
              disabled={categoriesLoading}
              className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 md:px-8 md:py-3 rounded-full shadow-lg border border-amber-400/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCw className={cn("w-4 h-4 text-white", categoriesLoading && "animate-spin")} />
              Re-Scan Laboratory Realms
            </Button>
          </div>
        ) : (
          <div ref={carouselRef} className="flex overflow-x-auto gap-4 md:gap-8 px-8 md:px-12 no-scrollbar snap-x snap-mandatory items-center min-h-[400px] md:min-h-[500px]">
            {dynamicCategories.map((subject) => {
              const meta = getSubjectMeta(subject);
              const isSelected = selectedSubject === subject;
              const Icon = meta.icon;

              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={cn(
                    "flex-shrink-0 snap-center transition-all duration-500 transform outline-none flex flex-col items-center",
                    isSelected ? "scale-100 w-64 md:w-80" : "scale-75 w-48 md:w-56 opacity-35"
                  )}
                >
                  <div className="relative w-full flex flex-col items-center">
                    <div className={cn(
                      "relative w-full aspect-square transition-all duration-500",
                      isSelected ? "animate-float" : ""
                    )}>
                      {meta.imageUrl ? (
                        <div className="relative w-full h-full transform hover:scale-105 transition-transform">
                          <Image src={meta.imageUrl} alt={subject} fill className="object-contain" priority={isSelected} />
                        </div>
                      ) : (
                        <div className={cn("w-full h-full rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 flex flex-col items-center justify-center text-white shadow-2xl relative overflow-hidden group border-4 border-white/50", meta.color)}>
                          <Icon className="w-10 h-10 md:w-12 md:h-12" />
                        </div>
                      )}
                    </div>

                    <div className={cn("mt-2 text-center space-y-3 md:space-y-2 transition-all", isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
                      <div className="space-y-1 w-full px-2">
                        <p className="text-[8px] md:text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80" style={{ fontFamily: "'Poppins', sans-serif" }}>{meta.biome}</p>
                        <h3 className="text-3xl sm:text-4xl md:text-[3rem] font-bytebounce text-white leading-none break-words" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>{subject}</h3>
                      </div>
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("w-3 h-3 md:w-4 md:h-4", i < meta.difficulty ? "text-primary fill-primary" : "text-white/30")} />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-background/10 border-primary/40 text-white font-bold px-2 md:px-3 py-1 flex items-center gap-1 text-[8px] md:text-[10px]">
                            <Target className="w-2.5 h-2.5 md:w-3 md:h-3" /> {meta.enemy}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!categoriesLoading && dynamicCategories.length > 0 && (
        <div id="tour-quest-inventory" className="px-6 md:px-8 mt-6 md:mt-10 relative z-20">
          <div className="flex justify-center w-full mt-4">
            <button
              onClick={() => {
                setSetupStep('mode');
                setModeSelectDialogOpen(true);
              }}
              disabled={isLoading}
              className="relative w-full max-w-md md:max-w-2xl h-24 md:h-36 group hover:scale-105 active:scale-95 hover:brightness-110 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            >
              <Image
                src="/ui/btn-enterArena.png"
                alt="Enter Battle Arena"
                fill
                className="object-contain"
                style={{ imageRendering: 'pixelated' }}
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center pb-2">
                {isLoading && (
                  <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Mode Selection Dialog */}
      <Dialog open={modeSelectDialogOpen} onOpenChange={setModeSelectDialogOpen}>
        <DialogContent container={fullscreenRef.current} className="sm:max-w-3xl bg-transparent border-none shadow-none p-0 flex justify-center items-center [&>button]:hidden">
          <DialogTitle className="sr-only">Select a session mode</DialogTitle>
          <div className="relative w-[800px] max-w-full aspect-[4/3] flex items-center justify-center overflow-hidden">
            <Image
              src={
                setupStep === 'details'
                  ? quizMode === 'learning'
                    ? "/ui/LearningMode_OverviewModal.png"
                    : quizMode === 'test'
                      ? "/ui/TestMode_OverviewModal.png"
                      : "/ui/BossBattleMode_OverviewModal.png"
                  : "/ui/modal-bg.png"
              }
              alt="Select Mode Background"
              fill
              className="object-contain"
              style={{ imageRendering: 'pixelated' }}
              unoptimized
            />

            {/* Custom Pixelated Close Button */}
            <button
              onClick={() => setModeSelectDialogOpen(false)}
              className="absolute top-[15.5%] right-[2%] z-50 flex items-center justify-center transition-all cursor-pointer group active:translate-y-0.5"
            >
              <span
                className="font-bytebounce text-white/90 group-hover:text-red-400 transition-colors text-2xl md:text-5xl leading-none"
                style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000' }}
              >
                X
              </span>
            </button>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-[14%] px-[4.5%] pb-[5%]">
              <div className="flex justify-center items-center gap-2 md:gap-3 w-full h-full">

                {setupStep === 'mode' ? (
                  <>
                    {/* Learning Mode Button */}
                    <button
                      onClick={() => { setQuizMode('learning'); setSetupStep('details'); setMobileModalStep('info'); }}
                      className="relative flex-1 h-full max-h-[80%] group hover:scale-105 active:scale-95 hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Image src="/ui/btn-learning.png" alt="Learning Mode" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                      <div className="absolute inset-x-0 bottom-[22%] flex items-center justify-center">
                        <span
                          className="font-bytebounce text-white text-2xl md:text-[2.2rem] leading-[0.75] text-center"
                          style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000' }}
                        >
                          LEARNING<br />MODE
                        </span>
                      </div>
                    </button>

                    {/* Test Mode Button */}
                    <button
                      onClick={() => { setQuizMode('test'); setSetupStep('details'); setMobileModalStep('info'); }}
                      className="relative flex-1 h-full max-h-[80%] group hover:scale-105 active:scale-95 hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Image src="/ui/btn-test.png" alt="Test Mode" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                      <div className="absolute inset-x-0 bottom-[22%] flex items-center justify-center">
                        <span
                          className="font-bytebounce text-white text-2xl md:text-[2.2rem] leading-[0.75] text-center"
                          style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000' }}
                        >
                          TEST<br />MODE
                        </span>
                      </div>
                    </button>

                    {/* Boss Battle Button */}
                    <button
                      onClick={() => {
                        setQuizMode('boss-battle');
                        setModeSelectDialogOpen(false);
                        setShowChapterMap(true);
                      }}
                      className="relative flex-1 h-full max-h-[80%] group hover:scale-105 active:scale-95 hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Image src="/ui/btn-boss.png" alt="Boss Battle" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                      <div className="absolute inset-x-0 bottom-[22%] flex items-center justify-center">
                        <span
                          className="font-bytebounce text-white text-2xl md:text-[2.2rem] leading-[0.75] text-center"
                          style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000' }}
                        >
                          BOSS<br />BATTLE
                        </span>
                      </div>
                    </button>
                  </>
                ) : setupStep === 'details' ? (
                  <div className="flex flex-col w-full h-full p-1 min-[375px]:p-2 md:p-6 overflow-hidden no-scrollbar animate-in fade-in zoom-in-95 relative justify-between">

                    {/* INFO SECTION */}
                    <div className={cn("flex-1 flex flex-col justify-center md:justify-end relative md:pt-2", mobileModalStep === 'action' ? "hidden md:flex" : "flex")}>
                      {quizMode === 'learning' && (
                        <div className="flex-1 flex flex-col space-y-2 min-[375px]:space-y-3 md:space-y-5 overflow-hidden justify-center md:justify-end items-center">
                          <div className="text-center space-y-0.5">
                            <p className="text-white/90 text-[9px] min-[375px]:text-[11px] sm:text-xs md:text-lg max-w-lg mx-auto font-bold leading-tight min-[375px]:leading-snug sm:leading-relaxed" style={{ textShadow: '1px 1px 0 #000' }}>
                              Hone your skills with immediate AI Tutor rationale after every answer. Master the basics at your own pace.
                            </p>
                          </div>

                          {/* 3 PNG Banners for Learning Mode */}
                          <div className="flex flex-row justify-center items-center gap-1.5 min-[375px]:gap-2.5 md:gap-1 w-full px-1 min-[375px]:px-2 md:px-12">
                            <div className="relative flex-1 h-12 min-[375px]:h-14 sm:h-20 md:h-22 transition-transform">
                              <Image src="/ui/IMMIEDIATEFEEDBACK_BANNER.png" alt="Immediate Feedback" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                            </div>
                            <div className="relative flex-1 h-12 min-[375px]:h-14 sm:h-20 md:h-22 transition-transform">
                              <Image src="/ui/AITUTORANALYSIS_BANNER.png" alt="AI Tutor Analysis" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                            </div>
                            <div className="relative flex-1 h-12 min-[375px]:h-14 sm:h-20 md:h-22 transition-transform">
                              <Image src="/ui/PRECISIONTRAINING_BANNER.png" alt="Precision Training" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                            </div>
                          </div>
                        </div>
                      )}

                      {quizMode === 'test' && (
                        <div className="flex-1 flex flex-col space-y-2 min-[375px]:space-y-3 md:space-y-4.5 overflow-hidden justify-center md:justify-end items-center">
                          <div className="text-center space-y-0.5">
                            <p className="text-white/90 text-[9px] min-[375px]:text-[11px] sm:text-sm md:text-lg max-w-lg mx-auto font-bold leading-tight min-[375px]:leading-snug sm:leading-relaxed" style={{ textShadow: '1px 1px 0 #000' }}>
                              A grueling test of endurance. No immediate feedback, no second chances. Only your final score matters.
                            </p>
                          </div>

                          {/* 3 PNG Banners for Test Mode */}
                          <div className="flex flex-row justify-center items-center gap-1.5 min-[375px]:gap-2.5 md:gap-1 w-full px-1 min-[375px]:px-2 md:px-12">
                            <div className="relative flex-1 h-12 min-[375px]:h-14 sm:h-20 md:h-22 transition-transform">
                              <Image src="/ui/CONTINUOUSFLOW-btn.png" alt="Continuous Flow" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                            </div>
                            <div className="relative flex-1 h-12 min-[375px]:h-14 sm:h-20 md:h-22 transition-transform">
                              <Image src="/ui/GRADEDASSESSMENT-btn.png" alt="Graded Assessment" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                            </div>
                            <div className="relative flex-1 h-12 min-[375px]:h-14 sm:h-20 md:h-22 transition-transform">
                              <Image src="/ui/ADAPTIVEDIFFICULTY-btn.png" alt="Adaptive Difficulty" fill className="object-contain" style={{ imageRendering: 'pixelated' }} unoptimized />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mobile Back to Modes */}
                      {mobileModalStep === 'info' && (
                        <div className="md:hidden mt-auto pt-1 pb-0.5 w-full flex justify-center">
                          <button
                            onClick={() => setSetupStep('mode')}
                            className="text-white/70 hover:text-white font-bytebounce text-[10px] min-[375px]:text-xs uppercase tracking-widest transition-colors"
                            style={{ textShadow: '1px 1px 0 #000' }}
                          >
                            &larr; Back to Modes
                          </button>
                        </div>
                      )}

                      {/* Mobile Next Arrow */}
                      {mobileModalStep === 'info' && (
                        <button
                          onClick={() => setMobileModalStep('action')}
                          className="md:hidden absolute right-1 bottom-1 bg-white/10 hover:bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/20 z-10 animate-pulse"
                        >
                          <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>

                    {/* ACTION SECTION */}
                    <div className={cn("mt-auto pt-1 md:pt-4 w-full max-w-2xl mx-auto flex-col items-center gap-1 md:gap-3 shrink-0 relative", mobileModalStep === 'info' ? "hidden md:flex" : "flex", mobileModalStep === 'action' ? "border-transparent h-full justify-center" : "")}>
                      {/* Mobile Back Arrow */}
                      {mobileModalStep === 'action' && (
                        <button
                          onClick={() => setMobileModalStep('info')}
                          className="md:hidden absolute left-1 bottom-1 bg-white/10 hover:bg-white/20 p-1 rounded-full backdrop-blur-md border border-white/20 z-10"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-white" />
                        </button>
                      )}
                      {quizMode !== 'boss-battle' ? (
                        <>
                          <div className="w-full border-t border-white/20 my-1 md:my-1" />
                          <div className="flex items-center justify-center gap-2">
                            <h4 className="font-bytebounce text-white/90 text-sm min-[375px]:text-base md:text-xl tracking-widest text-center mb-1 md:mb-0" style={{ textShadow: '1px 1px 0 #000' }}>Select Question Limit</h4>
                          </div>
                          {quizMode === 'learning' ? (
                            <div className="flex flex-wrap justify-center items-center gap-1 min-[375px]:gap-1.5 md:gap-3 w-full mt-2.5 md:mt-0">
                              {[10, 20, 30, 40, 50].map((num) => {
                                const savedQuota = typeof window !== 'undefined' ? parseInt(localStorage.getItem('bq_pref_daily_quota') || '50', 10) : 50;
                                const isTargetGoal = savedQuota === num;
                                return (
                                  <button
                                    key={num}
                                    onClick={() => startQuest(num)}
                                    className={cn(
                                      "relative flex-1 min-w-[42px] min-[375px]:min-w-[54px] md:min-w-[100px] max-w-[65px] min-[375px]:max-w-[85px] md:max-w-[130px] aspect-[2.6/1] group hover:scale-105 active:scale-95 transition-all cursor-pointer",
                                      isTargetGoal ? "scale-105 brightness-110 drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" : "hover:brightness-110"
                                    )}
                                  >
                                    {isTargetGoal && (
                                      <div className="absolute -top-2.5 md:-top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap bg-[#FFC700] text-black text-[6.5px] min-[375px]:text-[7.5px] md:text-[10px] font-bytebounce font-bold px-0.5 min-[375px]:px-1 py-0 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-0.5">
                                        SELECTED GOAL
                                      </div>
                                    )}
                                    <Image
                                      src={`/ui/${num}QUESTIONS-btn.png`}
                                      alt={`${num} Questions`}
                                      fill
                                      className="object-contain"
                                      style={{ imageRendering: 'pixelated' }}
                                      unoptimized
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-wrap justify-center items-center gap-1.5 min-[375px]:gap-2.5 md:gap-3 w-full max-w-xl mx-auto px-1 min-[375px]:px-2 mt-3.5 md:mt-0">
                              {[
                                { count: 20, src: '/ui/Quick20-btn.png', alt: 'Quick (20)' },
                                { count: 50, src: '/ui/STANDARD50-btn.png', alt: 'Standard (50)' },
                                { count: 100, src: '/ui/FULL100-btn.png', alt: 'Full (100)' },
                              ].map(({ count, src, alt }) => {
                                const savedQuota = typeof window !== 'undefined' ? parseInt(localStorage.getItem('bq_pref_daily_quota') || '50', 10) : 50;
                                const isTargetGoal = savedQuota === count;
                                return (
                                  <button
                                    key={count}
                                    onClick={() => startQuest(count)}
                                    className={cn(
                                      "relative flex-1 min-w-[65px] min-[375px]:min-w-[85px] md:min-w-[150px] max-w-[100px] min-[375px]:max-w-[130px] md:max-w-[195px] aspect-[2.7/1] group hover:scale-105 active:scale-95 transition-all cursor-pointer",
                                      isTargetGoal ? "scale-105 brightness-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]" : "hover:brightness-110"
                                    )}
                                  >
                                    {isTargetGoal && (
                                      <div className="absolute -top-2.5 md:-top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap bg-[#FFC700] text-black text-[7.5px] min-[375px]:text-[8.5px] md:text-xs font-bytebounce font-bold px-1 min-[375px]:px-1.5 py-0 md:py-0.5 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-0.5">
                                        SELECTED GOAL
                                      </div>
                                    )}
                                    <Image
                                      src={src}
                                      alt={alt}
                                      fill
                                      className="object-contain"
                                      style={{ imageRendering: 'pixelated' }}
                                      unoptimized
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h4 className="font-bytebounce text-purple-300 text-xl tracking-widest text-center">Select Boss Difficulty</h4>
                          <div className="flex flex-wrap justify-center gap-1.5 md:gap-3 w-full">
                            {(() => {
                              const prefDiff = typeof window !== 'undefined' ? localStorage.getItem('bq_pref_default_diff') || 'MEDIUM' : 'MEDIUM';
                              return (
                                <>
                                  <Button
                                    onClick={() => startQuest(999, 'EASY')}
                                    className={cn(
                                      "flex-1 min-w-[90px] h-10 md:h-12 text-sm md:text-lg font-bytebounce border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-green-500 hover:bg-green-600 hover:-translate-y-0.5 transition-transform relative",
                                      prefDiff === 'EASY' && "border-amber-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                                    )}
                                  >
                                    {prefDiff === 'EASY' && (
                                      <div className="absolute -top-2.5 right-1 z-20 bg-[#FFC700] text-black text-[8px] md:text-[9px] font-bytebounce font-bold px-1 py-0 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase tracking-wider">
                                        ⭐ PRESET
                                      </div>
                                    )}
                                    Easy
                                  </Button>
                                  <Button
                                    onClick={() => startQuest(999, 'MEDIUM')}
                                    className={cn(
                                      "flex-1 min-w-[90px] h-10 md:h-12 text-sm md:text-lg font-bytebounce border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-yellow-500 hover:bg-yellow-600 hover:-translate-y-0.5 transition-transform relative",
                                      prefDiff === 'MEDIUM' && "border-amber-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                                    )}
                                  >
                                    {prefDiff === 'MEDIUM' && (
                                      <div className="absolute -top-2.5 right-1 z-20 bg-[#FFC700] text-black text-[8px] md:text-[9px] font-bytebounce font-bold px-1 py-0 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase tracking-wider">
                                        ⭐ PRESET
                                      </div>
                                    )}
                                    Medium
                                  </Button>
                                  <Button
                                    onClick={() => startQuest(999, 'HARD')}
                                    className={cn(
                                      "flex-1 min-w-[90px] h-10 md:h-12 text-sm md:text-lg font-bytebounce border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-red-500 hover:bg-red-600 hover:-translate-y-0.5 transition-transform relative",
                                      prefDiff === 'HARD' && "border-amber-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                                    )}
                                  >
                                    {prefDiff === 'HARD' && (
                                      <div className="absolute -top-2.5 right-1 z-20 bg-[#FFC700] text-black text-[8px] md:text-[9px] font-bytebounce font-bold px-1 py-0 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase tracking-wider">
                                        ⭐ PRESET
                                      </div>
                                    )}
                                    Hard
                                  </Button>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      )}
                      <Button variant="ghost" onClick={() => setSetupStep('mode')} className="hidden md:flex text-white/60 hover:text-white hover:bg-transparent h-8 text-xs font-bold uppercase tracking-wider">
                        &larr; Back to Modes
                      </Button>
                    </div>
                  </div>
                ) : null}

              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chapter World Map Dialog */}
      <Dialog open={showChapterMap && !isStarted && !isFinished} onOpenChange={setShowChapterMap}>
        <DialogContent container={fullscreenRef.current} className="w-screen h-screen max-w-none max-h-none border-none rounded-none p-0 bg-[#160d08] flex flex-col overflow-hidden z-[100] [&>button]:hidden">
          <DialogTitle className="sr-only">Chapter Overworld Map</DialogTitle>
          <ChapterWorldMap
            selectedSubject={selectedSubject}
            subjectNodes={getSubjectNodes(selectedSubject)}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            onLaunchExpedition={(nodeId, difficulty) => {
              setSelectedNodeId(nodeId);
              setShowChapterMap(false);
              startQuest(999, difficulty);
            }}
            onClose={() => setShowChapterMap(false)}
            nodeStars={nodeStars}
            nodeClears={nodeClears}
          />
        </DialogContent>
      </Dialog>
      {inventoryDialogJSX}
    </div>
  );
}
