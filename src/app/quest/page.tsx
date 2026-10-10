"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Skull,
  FlaskConical,
  Microscope,
  Database,
  Stethoscope,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Target,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Award,
  Trophy,
  Swords,
  Maximize,
  Minimize,
  Flame,
  Compass,
  RotateCw,
  X,
  Lock,
  AlertTriangle,
  Check,
  Settings,
  Volume2,
  Pin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { QuizInterface, Question } from '@/components/quiz/QuizInterface';
import { ChapterWorldMap } from '@/components/quiz/ChapterWorldMap';
import { XP_PER_QUESTION, calculatePlayerStats } from '@/lib/game-logic';
import { provideExamFeedback } from '@/ai/flows/provide-exam-feedback';
import { getQuestQuestions } from '@/app/actions/arena';
import { completeQuest, getNodeClearsAction, saveNodeClearAction } from '@/app/actions/quest';
import { getCategories } from '@/app/actions/study';
import { getUserProfile, saveUserInventory, purchaseReagentAction, getUserSettingsAction, saveUserSettingsAction, saveArenaOnboardingAction } from '@/app/actions/user';
import { QuestArenaOnboardingModal } from '@/components/quest/QuestArenaOnboardingModal';
import { calculateEarnedBadges, type Badge as BadgeType } from '@/lib/badge-system';
import { getLocalTodayDateString } from '@/lib/notifications';
import { playSfx, preloadSpecterSounds, preloadBiohazardSounds, preloadStaphSentinelSounds, preloadCrystalGolemSounds, preloadMicrobeSwarmSounds, preloadSickleCellReaperSounds, preloadAcidSlimeSounds, preloadDebuffSound, playDebuffSound, preloadBossBattleMusic, playBossBattleMusic, stopBossBattleMusic, stopFinalBossMusic, preloadLearningModeMusic, playLearningModeMusic, stopLearningModeMusic, preloadTestModeMusic, playTestModeMusic, stopTestModeMusic, preloadAnemiaShadeSounds, preloadErythrocyteColossusSounds, preloadHydraSounds, preloadImmuneArchonSounds, preloadKetoacidosisSounds, preloadLegalBeholderSounds, preloadHyperglycemicMutantSounds, preloadGramPositiveSounds, preloadSickleCellMinionSounds, preloadFungalSporeSounds, preloadReagentStripSlimeSounds } from '@/lib/audio-manager';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BossSpriteAnimator, type BossAnimState } from '@/components/game/BossSpriteAnimator';
import { HitEffectAnimator } from '@/components/game/HitEffectAnimator';
import { UndergroundSpikesAnimator } from '@/components/game/UndergroundSpikesAnimator';
import { JudicialHammerAnimator } from '@/components/game/JudicialHammerAnimator';
import { UndergroundBlastAnimator } from '@/components/game/UndergroundBlastAnimator';
import { HydraLightningAnimator } from '@/components/game/HydraLightningAnimator';
import { ArchonThunderAnimator } from '@/components/game/ArchonThunderAnimator';
import { AnemiaSlashAnimator } from '@/components/game/AnemiaSlashAnimator';
import { ColossusFistAnimator } from '@/components/game/ColossusFistAnimator';
import { ParaffinBallsAnimator } from '@/components/game/ParaffinBallsAnimator';
import { FixationNailedAnimator } from '@/components/game/FixationNailedAnimator';

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
  normalAttackSfxUrl?: string;
  heavyAttackSfxUrl?: string;
  attackProjectileUrl?: string;
  undergroundSpikesUrl?: string;
  undergroundSpikesFrames?: number;
  lightningAttackUrl?: string;
  lightningAttackFrames?: number;
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
  idleDuration?: number;
  idleFps?: number;
}> = {
  "Clinical Chemistry": {
    name: "Clinical Chemistry",
    icon: FlaskConical,
    color: "bg-primary",
    enemy: "Hyperglycemic Specter",
    imageUrl: "/images/ClinChem256.png",
    backgroundUrl: "/images/ClinChem256_bg1.webp",
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
    backgroundUrl: "/images/Hema256_bg.webp",
    difficulty: 3,
    biome: "The Sanguine Marshes",
    description: "Crimson rivers flow through iron-rich soil. Study the life force within.",
  },
  "Microbiology": {
    name: "Microbiology",
    icon: Database,
    color: "bg-primary",
    enemy: "Biohazard Overlord",
    imageUrl: "/images/MicroBio256.png",
    backgroundUrl: "/images/MicroBio256_bg.webp",
    normalAttackSfxUrl: "/SoundEffects/BiohazardOverlordNormalAttack.mp3",
    heavyAttackSfxUrl: "/SoundEffects/BiohazardOverlordHeavyAttack.mp3",
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
    backgroundUrl: "/images/ImmunoHema256_bg.webp",
    normalAttackSfxUrl: "/SoundEffects/AntiSerumHydraNormalAttack.mp3",
    heavyAttackSfxUrl: "/SoundEffects/AntiSerumHydraHeavyAttack.mp3",
    difficulty: 5,
    biome: "The Serum Sea",
    description: "Navigate the complex tides of antigens and antibodies.",
  },
  "Clinical Microscopy & Parasitology": {
    name: "Clinical Microscopy & Parasitology",
    icon: FlaskConical,
    color: "bg-primary",
    enemy: "Crystal Golem",
    imageUrl: "/images/ClinMicro256.png",
    backgroundUrl: "/images/ClinMicro256_bg.webp",
    difficulty: 2,
    biome: "Amber Sediment Cliffs",
    description: "Examine the smallest details that reveal the greatest truths.",
  },
  "Histopathology & MT Laws": {
    name: "Histopathology & MT Laws",
    icon: ShieldAlert,
    color: "bg-accent",
    enemy: "Legal Beholder",
    imageUrl: "/images/Hispatho256.png",
    backgroundUrl: "/images/Hispatho256_bg.webp",
    difficulty: 3,
    biome: "The Citadel of Codes",
    description: "Where science meets the letter of the law. Preserve the ethics.",
  },
  "Histopathology and Medtech Laws": {
    name: "Histopathology and Medtech Laws",
    icon: ShieldAlert,
    color: "bg-accent",
    enemy: "Legal Beholder",
    imageUrl: "/images/Hispatho256.png",
    backgroundUrl: "/images/Hispatho256_bg.webp",
    difficulty: 3,
    biome: "The Citadel of Codes",
    description: "Where science meets the letter of the law. Preserve the ethics.",
  },
  "Histopathology & Medtech Laws": {
    name: "Histopathology & Medtech Laws",
    icon: ShieldAlert,
    color: "bg-accent",
    enemy: "Legal Beholder",
    imageUrl: "/images/Hispatho256.png",
    backgroundUrl: "/images/Hispatho256_bg.webp",
    difficulty: 3,
    biome: "The Citadel of Codes",
    description: "Where science meets the letter of the law. Preserve the ethics.",
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
      backgroundUrl: "/images/Hispatho256_bg.webp",
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
    backgroundUrl: "/images/Hispatho256_bg.webp",
    arenaBackgroundUrl: "/ui/background_clinicalchem.png",
    difficulty: 3,
    biome: "Laboratory Science Realm",
    description: `Master topics in ${subjectName} to prove your expertise.`
  };
}

function isMajorSubject(subjectName: string): boolean {
  if (!subjectName) return false;
  if (SUBJECT_METADATA[subjectName]) {
    return true;
  }
  const lower = subjectName.toLowerCase();
  return (
    lower.includes('histopath') ||
    lower.includes('medtech laws') ||
    lower.includes('mt laws') ||
    lower.includes('microscopy') ||
    lower.includes('parasito') ||
    lower.includes('chem') ||
    (lower.includes('hema') && !lower.includes('immuno')) ||
    lower.includes('microbio') ||
    lower.includes('immuno') ||
    lower.includes('serology')
  );
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
  const [isFleeing, setIsFleeing] = useState(false);
  const [fleeProgress, setFleeProgress] = useState(false);
  const [setupStep, setSetupStep] = useState<'mode' | 'details' | 'limit'>('mode');
  const [mobileModalStep, setMobileModalStep] = useState<'info' | 'action'>('info');
  const [score, setScore] = useState(0);
  const [fetchingExplanations, setFetchingExplanations] = useState<Record<number, boolean>>({});
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('Clinical Chemistry');
  const [currentFocusSubject, setCurrentFocusSubject] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Topic Mastery Quest Target (from Performance Topic Mastery Modal)
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string | null>(null);

  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialCategoryLoadRef = useRef(true);
  const hasConsumedUrlTopicRef = useRef(false);

  // Fetch dynamic categories directly from MongoDB Category collection
  const loadCategories = useCallback(async (forcedFocus?: string | null) => {
    try {
      const [cats, userSettings] = await Promise.all([
        getCategories().catch(() => []),
        getUserSettingsAction().catch(() => null),
      ]);
      if (cats && cats.length > 0) {
        const names = cats.map(c => c.name);

        // Priority 1: URL search param ?subject= & ?topic=
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const urlSubject = searchParams?.get('subject');
        const urlTopic = searchParams?.get('topic');

        if (!hasConsumedUrlTopicRef.current && urlTopic && urlTopic.trim().length > 0) {
          hasConsumedUrlTopicRef.current = true;
          setSelectedTopicFilter(urlTopic.trim());
          setQuizMode(prev => prev === 'boss-battle' ? 'learning' : prev);
          setSetupStep('mode');
          setModeSelectDialogOpen(true);
          if (typeof window !== 'undefined') {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('topic');
            newUrl.searchParams.delete('subject');
            window.history.replaceState({}, '', newUrl.pathname + (newUrl.searchParams.toString() ? `?${newUrl.searchParams.toString()}` : ''));
          }
        }

        // Priority 2: Priority Focus Subject from Account Settings / forcedFocus / localStorage
        const settingsFocus = userSettings?.focusSubject;
        const savedFocus = forcedFocus !== undefined
          ? forcedFocus
          : (settingsFocus !== undefined
            ? settingsFocus
            : (typeof window !== 'undefined' ? localStorage.getItem('bq_pref_focus_subject') : null));
        const validFocus = savedFocus && savedFocus !== 'none' ? savedFocus : null;

        const normalizeName = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

        const findSubjectMatch = (target: string) => {
          return names.find(n => n === target)
            || names.find(n => normalizeName(n) === normalizeName(target))
            || names.find(n => {
              const nNorm = normalizeName(n);
              const tNorm = normalizeName(target);
              return (nNorm.includes('histopath') && tNorm.includes('histopath'))
                || (nNorm.includes('microscop') && tNorm.includes('microscop'))
                || (nNorm.includes('microbio') && tNorm.includes('microbio'))
                || (nNorm.includes('immuno') && tNorm.includes('immuno'))
                || (nNorm.includes('hema') && !nNorm.includes('immuno') && tNorm.includes('hema') && !tNorm.includes('immuno'))
                || (nNorm.includes('chem') && tNorm.includes('chem'));
            }) || null;
        };

        const matchedUrl = urlSubject ? findSubjectMatch(urlSubject) : null;
        const matchedFocus = validFocus ? findSubjectMatch(validFocus) : null;
        const effectivePriority = matchedUrl || matchedFocus;

        if (matchedFocus) {
          setCurrentFocusSubject(matchedFocus);
        } else {
          setCurrentFocusSubject(null);
        }

        // When a subject is prioritized, show it first in the list (on the left edge)
        let orderedNames = names;
        if (effectivePriority) {
          orderedNames = [effectivePriority, ...names.filter(n => n !== effectivePriority)];
        }
        setDynamicCategories(orderedNames);

        if (effectivePriority) {
          isProgrammaticScrollRef.current = true;
          setSelectedSubject(effectivePriority);
        } else if (isInitialCategoryLoadRef.current) {
          isProgrammaticScrollRef.current = true;
          setSelectedSubject(orderedNames[0]);
        } else {
          // Preserve currently selected subject if it still exists in updated categories
          setSelectedSubject(prev => (orderedNames.includes(prev) ? prev : orderedNames[0]));
        }
        if (urlSubject && typeof window !== 'undefined') {
          const cleanUrl = new URL(window.location.href);
          if (cleanUrl.searchParams.has('subject')) {
            cleanUrl.searchParams.delete('subject');
            window.history.replaceState({}, '', cleanUrl.pathname + (cleanUrl.searchParams.toString() ? `?${cleanUrl.searchParams.toString()}` : ''));
          }
        }
        isInitialCategoryLoadRef.current = false;
      }
    } catch (err) {
      console.error("Error loading categories from MongoDB:", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleRescan = async () => {
    setCategoriesLoading(true);
    await loadCategories();
  };

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const isCurrentlyFullscreen = () => {
    if (typeof document === 'undefined') return false;
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  // Sync fullscreen state with native browser events (e.g. hitting ESC, vendor events)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(isCurrentlyFullscreen());
    };

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    events.forEach(evt => document.addEventListener(evt, handleFullscreenChange));

    return () => {
      events.forEach(evt => document.removeEventListener(evt, handleFullscreenChange));
      stopBossBattleMusic();
      stopFinalBossMusic();
      stopLearningModeMusic();
      stopTestModeMusic();
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const activeFs = isCurrentlyFullscreen();
      if (!activeFs) {
        const el = fullscreenRef.current || document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        } else if ((el as any).mozRequestFullScreen) {
          await (el as any).mozRequestFullScreen();
        } else if ((el as any).msRequestFullscreen) {
          await (el as any).msRequestFullscreen();
        } else {
          // Native fullscreen not supported by browser/device - fallback to CSS fullscreen
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (err: any) {
      console.warn("Native fullscreen toggle error, falling back to CSS fullscreen:", err);
      setIsFullscreen(prev => !prev);
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
  const [earnedQuestXp, setEarnedQuestXp] = useState<number | null>(null);
  const [leveledUpDetails, setLeveledUpDetails] = useState<{ oldLevel: number; newLevel: number } | null>(null);
  const [showLevelUpPopup, setShowLevelUpPopup] = useState<boolean>(false);
  const [showArenaOnboarding, setShowArenaOnboarding] = useState<boolean>(false);
  const [initialProfileName, setInitialProfileName] = useState<string>('');
  const [showArenaSettingsDialog, setShowArenaSettingsDialog] = useState<boolean>(false);
  const [arenaSettingsTab, setArenaSettingsTab] = useState<'character' | 'audio'>('character');
  const [renameInput, setRenameInput] = useState<string>('');
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const [renameGender, setRenameGender] = useState<'male' | 'female'>('male');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [sfxVolume, setSfxVolume] = useState<number[]>([80]);
  const [ambientMusic, setAmbientMusic] = useState<boolean>(true);
  const [floatingDamageText, setFloatingDamageText] = useState<boolean>(true);
  const [hitScreenFlash, setHitScreenFlash] = useState<boolean>(true);
  const currentUserIdRef = useRef<string | null>(null);
  const [bossAnimState, setBossAnimState] = useState<BossAnimState>('idle');
  const [playerAnimState, setPlayerAnimState] = useState<'idle' | 'attack'>('idle');

  // Bookworm Adventures 3-Stage Progression & Chapter Map State
  interface SubjectNodeConfig {
    id: string;
    nodeNumber: number;
    tier?: 'minion' | 'mini-boss' | 'boss' | 'final-boss';
    title: string;
    subtopic: string;
    minionName?: string;
    minionIcon?: string;
    miniBossName?: string;
    miniBossIcon?: string;
    bossName: string;
    bossIcon: string;
    normalAttackSfxUrl?: string;
    heavyAttackSfxUrl?: string;
    minionNormalAttackSfxUrl?: string;
    minionHeavyAttackSfxUrl?: string;
    miniBossNormalAttackSfxUrl?: string;
    miniBossHeavyAttackSfxUrl?: string;
    idleSpriteUrl?: string;
    attackSpriteUrl?: string;
    heavyAttackSpriteUrl?: string;
    attackProjectileUrl?: string;
    undergroundSpikesUrl?: string;
    undergroundSpikesFrames?: number;
    hammerAttackUrl?: string;
    hammerAttackFrames?: number;
    undergroundBlastUrl?: string;
    undergroundBlastFrames?: number;
    lightningAttackUrl?: string;
    lightningAttackFrames?: number;
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
    idleDuration?: number;
    idleFps?: number;
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
    minionIdleDuration?: number;
    miniBossIdleSpriteUrl?: string;
    miniBossAttackSpriteUrl?: string;
    miniBossHeavyAttackSpriteUrl?: string;
    miniBossSlashSpriteUrl?: string;
    miniBossIdleFrames?: number;
    miniBossAttackFrames?: number;
    miniBossHeavyAttackFrames?: number;
    miniBossIdleFrameWidth?: number;
    miniBossAttackFrameWidth?: number;
    miniBossHeavyFrameWidth?: number;
    miniBossIdleFrameHeight?: number;
    miniBossAttackFrameHeight?: number;
    miniBossHeavyFrameHeight?: number;
    miniBossIdleDuration?: number;
    heavyAttackFistUrl?: string;
    heavyAttackFistFrames?: number;
    miniBossHeavyAttackBallsUrl?: string;
    miniBossHeavyBallsFrames?: number;
    heavyAttackNailedUrl?: string;
    heavyAttackNailedFrames?: number;
    heavyNailedFrames?: number;
    heavyNailedFrameWidth?: number;
    heavyNailedFrameHeight?: number;
  }

  const [battleStage, setBattleStage] = useState<1 | 2 | 3 | 4>(1);
  const [_learningStage, setLearningStage] = useState<1 | 2 | 3>(1);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const activeQuizIndexRef = useRef(0);
  useEffect(() => {
    activeQuizIndexRef.current = activeQuizIndex;
  }, [activeQuizIndex]);
  const [waveCharOffscreen, setWaveCharOffscreen] = useState(false);
  const [waveTransition, setWaveTransition] = useState<{
    stage: 'outcome' | 'arrival';
    fromWave: 1 | 2;
    toWave: 2 | 3;
    wasDefeated: boolean;
    incomingEnemyName: string;
    incomingEnemyBadge: string;
  } | null>(null);
  const [learningWaveEnemies, setLearningWaveEnemies] = useState<{
    minion: {
      name: string;
      icon: string;
      badge: string;
      idleSprite?: string | null;
      attackSprite?: string | null;
      heavyAttackSprite?: string | null;
      idleFrames?: number;
      attackFrames?: number;
      heavyAttackFrames?: number;
      idleFrameWidth?: number;
      idleFrameHeight?: number;
      attackFrameWidth?: number;
      attackFrameHeight?: number;
      heavyFrameWidth?: number;
      heavyFrameHeight?: number;
      idleDuration?: number;
      normalAttackSfxUrl?: string;
      heavyAttackSfxUrl?: string;
    };
    enforcer: {
      name: string;
      icon: string;
      badge: string;
      idleSprite?: string | null;
      attackSprite?: string | null;
      heavyAttackSprite?: string | null;
      slashSprite?: string | null;
      heavyAttackBallsUrl?: string | null;
      idleFrames?: number;
      attackFrames?: number;
      heavyAttackFrames?: number;
      idleFrameWidth?: number;
      idleFrameHeight?: number;
      attackFrameWidth?: number;
      attackFrameHeight?: number;
      heavyFrameWidth?: number;
      heavyFrameHeight?: number;
      idleDuration?: number;
      normalAttackSfxUrl?: string;
      heavyAttackSfxUrl?: string;
    };
    boss: {
      name: string;
      icon: string;
      badge: string;
      idleSprite: string | null;
      attackSprite: string | null;
      heavyAttackSprite: string | null;
      attackProjectileUrl?: string | null;
      attackProjectileFrames?: number;
      undergroundSpikesUrl?: string | null;
      undergroundSpikesFrames?: number;
      hammerAttackUrl?: string | null;
      hammerAttackFrames?: number;
      undergroundBlastUrl?: string | null;
      undergroundBlastFrames?: number;
      lightningAttackUrl?: string | null;
      lightningAttackFrames?: number;
      heavyAttackFistUrl?: string | null;
      heavyAttackFistFrames?: number;
      heavyAttackNailedUrl?: string | null;
      heavyAttackNailedFrames?: number;
      idleFrames: number;
      attackFrames: number;
      heavyAttackFrames: number;
      idleFrameWidth?: number;
      idleFrameHeight?: number;
      attackFrameWidth?: number;
      attackFrameHeight?: number;
      heavyFrameWidth?: number;
      heavyFrameHeight?: number;
      idleDuration?: number;
      idleFps?: number;
      normalAttackSfxUrl?: string;
      heavyAttackSfxUrl?: string;
    };
  } | null>(null);
  const [testModeEnemy, setTestModeEnemy] = useState<{
    tier: 'mini-boss' | 'boss' | 'final-boss';
    nodeId: string;
    name: string;
    icon: string;
    badge: string;
    idleSprite: string;
    attackSprite: string;
    heavyAttackSprite: string;
    slashSprite?: string | null;
    heavyAttackBallsUrl?: string | null;
    heavyAttackFistUrl?: string | null;
    heavyAttackNailedUrl?: string | null;
    attackProjectileUrl?: string | null;
    attackProjectileFrames?: number;
    undergroundSpikesUrl?: string | null;
    undergroundSpikesFrames?: number;
    hammerAttackUrl?: string | null;
    hammerAttackFrames?: number;
    undergroundBlastUrl?: string | null;
    undergroundBlastFrames?: number;
    lightningAttackUrl?: string | null;
    lightningAttackFrames?: number;
    idleFrames: number;
    attackFrames: number;
    heavyAttackFrames: number;
    idleFrameWidth?: number;
    idleFrameHeight?: number;
    attackFrameWidth?: number;
    attackFrameHeight?: number;
    heavyFrameWidth?: number;
    heavyFrameHeight?: number;
    idleDuration?: number;
    idleFps?: number;
    normalAttackSfxUrl?: string;
    heavyAttackSfxUrl?: string;
  } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cc-1');
  const [showChapterMap, setShowChapterMap] = useState<boolean>(false);
  const [nodeStars, setNodeStars] = useState<Record<string, number>>({});
  const [nodeClears, setNodeClears] = useState<Record<string, { EASY?: boolean; MEDIUM?: boolean; HARD?: boolean }>>({});

  // Synchronize selectedNodeId whenever selectedSubject changes so nodes don't cross-contaminate subjects
  useEffect(() => {
    const nodes = getSubjectNodes(selectedSubject);
    if (nodes && nodes.length > 0) {
      if (!nodes.some(n => n.id === selectedNodeId)) {
        setSelectedNodeId(nodes[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedNodeId]);

  const CHAPTER_NODES_PER_SUBJECT: Record<string, SubjectNodeConfig[]> = {
    "Clinical Chemistry": [
      {
        id: 'cc-1',
        nodeNumber: 1,
        tier: 'minion',
        title: 'Acid Slime (Minion)',
        subtopic: 'Glucose Metabolism, Fasting Glucose & HbA1c',
        minionName: 'Acid Slime',
        minionIcon: '🧪',
        bossName: 'Acid Slime',
        bossIcon: '🧪',
        idleSpriteUrl: '/images/bosses/clinchem_chapterOneMinion_IdleAnimation.png',
        attackSpriteUrl: '/images/bosses/clinchem_chapterOneMinion_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/clinchem_chapterOneMinion_heavyAttackAnimation.png',
        minionIdleSpriteUrl: '/images/bosses/clinchem_chapterOneMinion_IdleAnimation.png',
        minionAttackSpriteUrl: '/images/bosses/clinchem_chapterOneMinion_normalAttackAnimation.png',
        minionHeavyAttackSpriteUrl: '/images/bosses/clinchem_chapterOneMinion_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3',
        minionNormalAttackSfxUrl: '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3',
        minionHeavyAttackSfxUrl: '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3',
        idleFrames: 12,
        attackFrames: 7,
        heavyAttackFrames: 13,
        minionIdleFrames: 12,
        minionAttackFrames: 7,
        minionHeavyAttackFrames: 13,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 263,
        attackFrameHeight: 210,
        heavyFrameWidth: 263,
        heavyFrameHeight: 210,
        minionIdleFrameWidth: 128,
        minionIdleFrameHeight: 128,
        minionAttackFrameWidth: 263,
        minionAttackFrameHeight: 210,
        minionHeavyFrameWidth: 263,
        minionHeavyFrameHeight: 210,
        idleDuration: 2.8,
        minionIdleDuration: 2.8,
      },
      {
        id: 'cc-2',
        nodeNumber: 2,
        tier: 'mini-boss',
        title: 'Hyperglycemic Mutant (Mini-Boss)',
        subtopic: 'Lipids, Lipoproteins & Ketone Bodies',
        miniBossName: 'Hyperglycemic Mutant',
        miniBossIcon: '🧬',
        bossName: 'Hyperglycemic Mutant',
        bossIcon: '🧬',
        idleSpriteUrl: '/images/bosses/clinchem_chapterOneMiniBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/clinchem_chapterOneMiniBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/clinchem_chapterOneMiniBoss_heavyAttackAnimation.png',
        miniBossIdleSpriteUrl: '/images/bosses/clinchem_chapterOneMiniBoss_idleAnimation.png',
        miniBossAttackSpriteUrl: '/images/bosses/clinchem_chapterOneMiniBoss_normalAttackAnimation.png',
        miniBossHeavyAttackSpriteUrl: '/images/bosses/clinchem_chapterOneMiniBoss_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/SickleCellNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3',
        miniBossNormalAttackSfxUrl: '/SoundEffects/SickleCellNormalAttack.mp3',
        miniBossHeavyAttackSfxUrl: '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3',
        idleFrames: 9,
        attackFrames: 8,
        heavyAttackFrames: 8,
        miniBossIdleFrames: 9,
        miniBossAttackFrames: 8,
        miniBossHeavyAttackFrames: 8,
        idleFrameWidth: 183,
        idleFrameHeight: 194,
        attackFrameWidth: 250,
        attackFrameHeight: 210,
        heavyFrameWidth: 190,
        heavyFrameHeight: 154,
        miniBossIdleFrameWidth: 183,
        miniBossIdleFrameHeight: 194,
        miniBossAttackFrameWidth: 250,
        miniBossAttackFrameHeight: 210,
        miniBossHeavyFrameWidth: 190,
        miniBossHeavyFrameHeight: 154,
        idleDuration: 1.2,
        miniBossIdleDuration: 1.2,
      },
      {
        id: 'cc-3',
        nodeNumber: 3,
        tier: 'boss',
        title: 'Ketoacidosis Colossus (Chapter Boss)',
        subtopic: 'Electrolytes, Blood Gas & Acid-Base Balance',
        bossName: 'Ketoacidosis Colossus',
        bossIcon: '⚗️',
        idleSpriteUrl: '/images/bosses/clinchem_chapterOneBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/clinchem_chapterOneBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/clinchem_chapterOneBoss_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/KetoacidosisColossusNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/KetoacidosisColossusHeavyAttack.mp3',
        idleFrames: 7,
        attackFrames: 7,
        heavyAttackFrames: 8,
        idleFrameWidth: 304,
        idleFrameHeight: 273,
        attackFrameWidth: 379,
        attackFrameHeight: 307,
        heavyFrameWidth: 493,
        heavyFrameHeight: 639,
        idleDuration: 1.0,
      },
      {
        id: 'cc-4',
        nodeNumber: 4,
        tier: 'final-boss',
        title: '👑 Hyperglycemic Specter (FINAL BOSS)',
        subtopic: 'Comprehensive Clinical Chemistry Licensure Challenge',
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
        normalAttackSfxUrl: '/SoundEffects/HyperglemicSpecterNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/HyperglemicSpecterHeavyAttack.mp3',
        idleFrameWidth: 128,
        idleFrameHeight: 128,
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
        tier: 'minion',
        title: 'Microbe Swarm (Minion)',
        subtopic: 'Gram Staining, Cell Wall & Bacterial Morphology',
        minionName: 'Microbe Swarm',
        minionIcon: '🦠',
        bossName: 'Microbe Swarm',
        bossIcon: '🦠',
        idleSpriteUrl: '/images/bosses/microbio_chapterOneMinion_IdleAnimation.png',
        attackSpriteUrl: '/images/bosses/microbio_chapterOneMinion_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/microbio_chapterOneMinion_heavyAttackAnimation.png',
        minionIdleSpriteUrl: '/images/bosses/microbio_chapterOneMinion_IdleAnimation.png',
        minionAttackSpriteUrl: '/images/bosses/microbio_chapterOneMinion_normalAttackAnimation.png',
        minionHeavyAttackSpriteUrl: '/images/bosses/microbio_chapterOneMinion_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/MicrobeSwarmNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/MicrobeSwarmHeavyAttack.wav',
        minionNormalAttackSfxUrl: '/SoundEffects/MicrobeSwarmNormalAttack.mp3',
        minionHeavyAttackSfxUrl: '/SoundEffects/MicrobeSwarmHeavyAttack.wav',
        idleFrames: 8,
        attackFrames: 14,
        heavyAttackFrames: 10,
        minionIdleFrames: 8,
        minionAttackFrames: 14,
        minionHeavyAttackFrames: 10,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 257,
        attackFrameHeight: 218,
        heavyFrameWidth: 257,
        heavyFrameHeight: 218,
        minionIdleFrameWidth: 128,
        minionIdleFrameHeight: 128,
        minionAttackFrameWidth: 257,
        minionAttackFrameHeight: 218,
        minionHeavyFrameWidth: 257,
        minionHeavyFrameHeight: 218,
      },
      {
        id: 'mb-2',
        nodeNumber: 2,
        tier: 'mini-boss',
        title: 'Staph Sentinel (Mini-Boss)',
        subtopic: 'Gram-Positive Cocci, Catalase & Coagulase Tests',
        miniBossName: 'Staph Sentinel',
        miniBossIcon: '🧬',
        bossName: 'Staph Sentinel',
        bossIcon: '🧬',
        idleSpriteUrl: '/images/bosses/microbio_chapterOneMiniBoss_IdleAnimation.png',
        attackSpriteUrl: '/images/bosses/microbio_chapterOneMiniBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/microbio_chapterOneMiniBoss_normalAttackAnimation.png',
        miniBossIdleSpriteUrl: '/images/bosses/microbio_chapterOneMiniBoss_IdleAnimation.png',
        miniBossAttackSpriteUrl: '/images/bosses/microbio_chapterOneMiniBoss_normalAttackAnimation.png',
        miniBossHeavyAttackSpriteUrl: '/images/bosses/microbio_chapterOneMiniBoss_normalAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        miniBossNormalAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        miniBossHeavyAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        idleFrames: 7,
        attackFrames: 9,
        heavyAttackFrames: 9,
        miniBossIdleFrames: 7,
        miniBossAttackFrames: 9,
        miniBossHeavyAttackFrames: 9,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 160,
        attackFrameHeight: 157,
        heavyFrameWidth: 160,
        heavyFrameHeight: 157,
        miniBossIdleFrameWidth: 128,
        miniBossIdleFrameHeight: 128,
        miniBossAttackFrameWidth: 160,
        miniBossAttackFrameHeight: 157,
        miniBossHeavyFrameWidth: 160,
        miniBossHeavyFrameHeight: 157,
        idleDuration: 1.0,
        miniBossIdleDuration: 1.0,
      },
      {
        id: 'mb-3',
        nodeNumber: 3,
        tier: 'boss',
        title: 'Gram Positive Overlord (Chapter Boss)',
        subtopic: 'Streptococcus, Enterococcus & Spore-Forming Bacilli',
        bossName: 'Gram Positive Overlord',
        bossIcon: '👾',
        idleSpriteUrl: '/images/bosses/microbio_chapterOneBoss_IdleAnimation.png',
        attackSpriteUrl: '/images/bosses/microbio_chapterOneBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/microbio_chapterOneBoss_normalAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/GramPositiveNormal&HeavyAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/GramPositiveNormal&HeavyAttack.mp3',
        idleFrames: 7,
        attackFrames: 13,
        heavyAttackFrames: 13,
        idleFrameWidth: 128,
        idleFrameHeight: 150,
        attackFrameWidth: 247,
        attackFrameHeight: 189,
        heavyFrameWidth: 247,
        heavyFrameHeight: 189,
        idleDuration: 1.05,
      },
      {
        id: 'mb-4',
        nodeNumber: 4,
        tier: 'final-boss',
        title: '👑 Biohazard Overlord (FINAL BOSS)',
        subtopic: 'Antimicrobial Resistance & Comprehensive Microbiology',
        bossName: 'Biohazard Overlord',
        bossIcon: '👑',
        idleSpriteUrl: '/images/bosses/microbio_finalboss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/microbio_finalboss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/microbio_finalboss_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/BiohazardOverlordHeavyAttack.mp3',
        idleFrames: 6,
        attackFrames: 4,
        heavyAttackFrames: 10,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 128,
        attackFrameHeight: 128,
        heavyFrameWidth: 249,
        heavyFrameHeight: 192,
        idleDuration: 1.05,
      },
    ],
    "Hematology": [
      {
        id: 'hem-1',
        nodeNumber: 1,
        tier: 'minion',
        title: 'Sickle Cell (Minion)',
        subtopic: 'RBC Morphology, Indices & Poikilocytosis',
        minionName: 'Sickle Cell',
        minionIcon: '🩸',
        bossName: 'Sickle Cell',
        bossIcon: '🩸',
        idleSpriteUrl: '/images/bosses/hematology_chapterOneMinion_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hematology_chapterOneMinion_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/hematology_chapterOneMinion_heavyAttackAnimation.png',
        minionIdleSpriteUrl: '/images/bosses/hematology_chapterOneMinion_idleAnimation.png',
        minionAttackSpriteUrl: '/images/bosses/hematology_chapterOneMinion_normalAttackAnimation.png',
        minionHeavyAttackSpriteUrl: '/images/bosses/hematology_chapterOneMinion_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/SickleCellNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/SickleCellHeavyAttack.mp3',
        minionNormalAttackSfxUrl: '/SoundEffects/SickleCellNormalAttack.mp3',
        minionHeavyAttackSfxUrl: '/SoundEffects/SickleCellHeavyAttack.mp3',
        idleFrames: 7,
        attackFrames: 14,
        heavyAttackFrames: 15,
        minionIdleFrames: 7,
        minionAttackFrames: 14,
        minionHeavyAttackFrames: 15,
        idleFrameWidth: 165,
        idleFrameHeight: 157,
        attackFrameWidth: 494,
        attackFrameHeight: 434,
        heavyFrameWidth: 339,
        heavyFrameHeight: 292,
        minionIdleFrameWidth: 165,
        minionIdleFrameHeight: 157,
        minionAttackFrameWidth: 494,
        minionAttackFrameHeight: 434,
        minionHeavyFrameWidth: 339,
        minionHeavyFrameHeight: 292,
        idleDuration: 1.3,
        minionIdleDuration: 1.3,
      },
      {
        id: 'hem-2',
        nodeNumber: 2,
        tier: 'mini-boss',
        title: 'Anemia Shade (Mini-Boss)',
        subtopic: 'Microcytic & Hypochromic Anemias',
        miniBossName: 'Anemia Shade',
        miniBossIcon: '👻',
        bossName: 'Anemia Shade',
        bossIcon: '👻',
        idleSpriteUrl: '/images/bosses/hematology_chapterOneMiniBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hematology_chapterOneMiniBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_DashAnimation.png',
        miniBossSlashSpriteUrl: '/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_SlashAnimation.png',
        miniBossIdleSpriteUrl: '/images/bosses/hematology_chapterOneMiniBoss_idleAnimation.png',
        miniBossAttackSpriteUrl: '/images/bosses/hematology_chapterOneMiniBoss_normalAttackAnimation.png',
        miniBossHeavyAttackSpriteUrl: '/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_DashAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/SickleCellNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/SickleCellHeavyAttack.mp3',
        miniBossNormalAttackSfxUrl: '/SoundEffects/SickleCellNormalAttack.mp3',
        miniBossHeavyAttackSfxUrl: '/SoundEffects/SickleCellHeavyAttack.mp3',
        idleFrames: 7,
        attackFrames: 18,
        heavyAttackFrames: 15,
        miniBossIdleFrames: 7,
        miniBossAttackFrames: 18,
        miniBossHeavyAttackFrames: 15,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 128,
        attackFrameHeight: 128,
        heavyFrameWidth: 128,
        heavyFrameHeight: 128,
        miniBossIdleFrameWidth: 128,
        miniBossIdleFrameHeight: 128,
        miniBossAttackFrameWidth: 128,
        miniBossAttackFrameHeight: 128,
        miniBossHeavyFrameWidth: 128,
        miniBossHeavyFrameHeight: 128,
        idleDuration: 1.0,
        miniBossIdleDuration: 1.0,
      },
      {
        id: 'hem-3',
        nodeNumber: 3,
        tier: 'boss',
        title: 'Erythrocyte Colossus (Chapter Boss)',
        subtopic: 'Hemoglobin Synthesis & Hemoglobinopathies',
        bossName: 'Erythrocyte Colossus',
        bossIcon: '👑',
        idleSpriteUrl: '/images/bosses/hematology_chapterOneBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hematology_chapterOneBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/hematology_chapterOneBoss_heavyAttackGlintAnimation-1.png',
        heavyAttackFistUrl: '/images/bosses/hematology_chapterOneBoss_heavyAttackFistAnimation-2.png',
        normalAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/ErythrocyeColossusHeavyAttack.mp3',
        idleFrames: 8,
        attackFrames: 22,
        heavyAttackFrames: 14,
        heavyAttackFistFrames: 9,
        idleFrameWidth: 128,
        idleFrameHeight: 176,
        attackFrameWidth: 208,
        attackFrameHeight: 176,
        heavyFrameWidth: 176,
        heavyFrameHeight: 196,
        idleDuration: 1.0,
      },
      {
        id: 'hem-4',
        nodeNumber: 4,
        tier: 'final-boss',
        title: '👑 Sickle-Cell Reaper (FINAL BOSS)',
        subtopic: 'Hemostasis, Coagulation Cascades & Comprehensive Exam',
        bossName: 'Sickle-Cell Reaper',
        bossIcon: '👑',
        normalAttackSfxUrl: '/SoundEffects/SickleCellReaperNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/SickleCellReaperHeavyAttack.mp3',
        idleSpriteUrl: '/images/bosses/hematology_finalboss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hematology_finalboss_normalAttackGlintAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/hematology_finalboss_heavyAttackAnimation.png',
        undergroundSpikesUrl: '/images/bosses/hematology_finalboss_normalAttackUndergroundSpikesAnimation.png',
        undergroundSpikesFrames: 8,
        idleFrames: 6,
        attackFrames: 6,
        heavyAttackFrames: 8,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 128,
        attackFrameHeight: 128,
        heavyFrameWidth: 192,
        heavyFrameHeight: 160,
      },
    ],
    "Immunology & Serology and Immunohematology": [
      {
        id: 'is-1',
        nodeNumber: 1,
        tier: 'minion',
        title: 'Lymphocyte Swarm (Minion)',
        subtopic: 'Innate & Adaptive Immunity, B & T Cells',
        minionName: 'Lymphocyte Swarm',
        minionIcon: '🛡️',
        bossName: 'Lymphocyte Swarm',
        bossIcon: '🛡️',
        idleSpriteUrl: '/images/bosses/immunohema_chapterOneMinion_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/immunohema_chapterOneMinion_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/immunohema_chapterOneMinion_heavyAttackAnimation.png',
        minionIdleSpriteUrl: '/images/bosses/immunohema_chapterOneMinion_idleAnimation.png',
        minionAttackSpriteUrl: '/images/bosses/immunohema_chapterOneMinion_normalAttackAnimation.png',
        minionHeavyAttackSpriteUrl: '/images/bosses/immunohema_chapterOneMinion_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/MicrobeSwarmNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/MicrobeSwarmHeavyAttack.wav',
        minionNormalAttackSfxUrl: '/SoundEffects/MicrobeSwarmNormalAttack.mp3',
        minionHeavyAttackSfxUrl: '/SoundEffects/MicrobeSwarmHeavyAttack.wav',
        idleFrames: 11,
        attackFrames: 14,
        heavyAttackFrames: 10,
        minionIdleFrames: 11,
        minionAttackFrames: 14,
        minionHeavyAttackFrames: 10,
        idleFrameWidth: 257,
        idleFrameHeight: 218,
        attackFrameWidth: 257,
        attackFrameHeight: 218,
        heavyFrameWidth: 257,
        heavyFrameHeight: 218,
        minionIdleFrameWidth: 257,
        minionIdleFrameHeight: 218,
        minionAttackFrameWidth: 257,
        minionAttackFrameHeight: 218,
        minionHeavyFrameWidth: 257,
        minionHeavyFrameHeight: 218,
        idleDuration: 1.2,
        minionIdleDuration: 1.2,
      },
      {
        id: 'is-2',
        nodeNumber: 2,
        tier: 'mini-boss',
        title: 'Antigen Titan (Mini-Boss)',
        subtopic: 'Antigen-Antibody Binding & Agglutination Tests',
        miniBossName: 'Antigen Titan',
        miniBossIcon: '🧬',
        bossName: 'Antigen Titan',
        bossIcon: '🧬',
        idleSpriteUrl: '/images/bosses/immunohema_chapterOneMiniBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/immunohema_chapterOneMiniBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/immunohema_chapterOneMiniBoss_heavyAttackAnimation.png',
        miniBossIdleSpriteUrl: '/images/bosses/immunohema_chapterOneMiniBoss_idleAnimation.png',
        miniBossAttackSpriteUrl: '/images/bosses/immunohema_chapterOneMiniBoss_normalAttackAnimation.png',
        miniBossHeavyAttackSpriteUrl: '/images/bosses/immunohema_chapterOneMiniBoss_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/KetoacidosisColossusNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/CrystalGolemNormalAttack.mp3',
        miniBossNormalAttackSfxUrl: '/SoundEffects/KetoacidosisColossusNormalAttack.mp3',
        miniBossHeavyAttackSfxUrl: '/SoundEffects/CrystalGolemNormalAttack.mp3',
        idleFrames: 7,
        attackFrames: 8,
        heavyAttackFrames: 9,
        miniBossIdleFrames: 7,
        miniBossAttackFrames: 8,
        miniBossHeavyAttackFrames: 9,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 128,
        attackFrameHeight: 128,
        heavyFrameWidth: 183,
        heavyFrameHeight: 153,
        miniBossIdleFrameWidth: 128,
        miniBossIdleFrameHeight: 128,
        miniBossAttackFrameWidth: 128,
        miniBossAttackFrameHeight: 128,
        miniBossHeavyFrameWidth: 183,
        miniBossHeavyFrameHeight: 153,
        idleDuration: 1.0,
        miniBossIdleDuration: 1.0,
      },
      {
        id: 'is-3',
        nodeNumber: 3,
        tier: 'boss',
        title: 'Immune Archon (Chapter Boss)',
        subtopic: 'ELISA, Western Blot & Autoimmune Serology',
        bossName: 'Immune Archon',
        bossIcon: '👑',
        idleSpriteUrl: '/images/bosses/immunohema_chapterOneBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/immunohema_chapterOneBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/immunohema_chapterOneBoss_heavyAttackAnimation.png',
        lightningAttackUrl: '/images/bosses/immunohema_chapterOneBoss_heavyAttackThunderAnimation.png',
        lightningAttackFrames: 12,
        normalAttackSfxUrl: '/SoundEffects/ImmuneArchonNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/AntiSerumHydraHeavyAttack.mp3',
        idleFrames: 7,
        attackFrames: 11,
        heavyAttackFrames: 18,
        idleFrameWidth: 284,
        idleFrameHeight: 220,
        attackFrameWidth: 252,
        attackFrameHeight: 177,
        heavyFrameWidth: 247,
        heavyFrameHeight: 228,
        idleDuration: 1.05,
      },
      {
        id: 'is-4',
        nodeNumber: 4,
        tier: 'final-boss',
        title: '👑 Anti-Serum Hydra (FINAL BOSS)',
        subtopic: 'Transfusion Reactions, Crossmatching & Blood Bank',
        bossName: 'Anti-Serum Hydra',
        bossIcon: '👑',
        idleSpriteUrl: '/images/bosses/immunohema_chapterThreeFinalBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/immunohema_chapterThreeFinalBoss_normalAttackAnimation.png?v=4',
        heavyAttackSpriteUrl: '/images/bosses/immunohema_chapterThreeFinalBoss_heavyAttackGlintAnimation-1.png',
        lightningAttackUrl: '/images/bosses/immunohema_chapterThreeFinalBoss_heavyAttackLightningAnimation-2.png',
        normalAttackSfxUrl: '/SoundEffects/AntiSerumHydraNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/AntiSerumHydraHeavyAttack.mp3',
        idleFrames: 19,
        attackFrames: 31,
        heavyAttackFrames: 14,
        lightningAttackFrames: 12,
        idleFrameWidth: 143,
        idleFrameHeight: 144,
        attackFrameWidth: 384,
        attackFrameHeight: 256,
        heavyFrameWidth: 143,
        heavyFrameHeight: 144,
        idleDuration: 1.8,
      },
    ],
    "Clinical Microscopy & Parasitology": [
      {
        id: 'cm-1',
        nodeNumber: 1,
        tier: 'minion',
        title: 'Reagent Strip Slime (Minion)',
        subtopic: 'Urinalysis Physical & Chemical Examination',
        minionName: 'Reagent Strip Slime',
        minionIcon: '🧪',
        bossName: 'Reagent Strip Slime',
        bossIcon: '🧪',
        idleSpriteUrl: '/images/bosses/clinmicro_chapterOneMinion_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/clinmicro_chapterOneMinion_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/clinmicro_chapterOneMinion_heavyAttackAnimation.png',
        minionIdleSpriteUrl: '/images/bosses/clinmicro_chapterOneMinion_idleAnimation.png',
        minionAttackSpriteUrl: '/images/bosses/clinmicro_chapterOneMinion_normalAttackAnimation.png',
        minionHeavyAttackSpriteUrl: '/images/bosses/clinmicro_chapterOneMinion_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/ReagentStripSlimeNormal&HeavyAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/ReagentStripSlimeNormal&HeavyAttack.mp3',
        minionNormalAttackSfxUrl: '/SoundEffects/ReagentStripSlimeNormal&HeavyAttack.mp3',
        minionHeavyAttackSfxUrl: '/SoundEffects/ReagentStripSlimeNormal&HeavyAttack.mp3',
        idleFrames: 6,
        attackFrames: 21,
        heavyAttackFrames: 31,
        minionIdleFrames: 6,
        minionAttackFrames: 21,
        minionHeavyAttackFrames: 31,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 348,
        attackFrameHeight: 401,
        heavyFrameWidth: 348,
        heavyFrameHeight: 401,
        minionIdleFrameWidth: 128,
        minionIdleFrameHeight: 128,
        minionAttackFrameWidth: 348,
        minionAttackFrameHeight: 401,
        minionHeavyFrameWidth: 348,
        minionHeavyFrameHeight: 401,
        idleDuration: 1.0,
        minionIdleDuration: 1.0,
      },
      {
        id: 'cm-2',
        nodeNumber: 2,
        tier: 'mini-boss',
        title: 'Nitrite Spectre (Mini-Boss)',
        subtopic: 'Microscopic Urinalysis, Crystals & Casts',
        miniBossName: 'Nitrite Spectre',
        miniBossIcon: '👻',
        bossName: 'Nitrite Spectre',
        bossIcon: '👻',
        idleSpriteUrl: "/images/bosses/clinmicro_chapterOneMinionBoss_idleAnimation.png",
        attackSpriteUrl: "/images/bosses/clinmicro_chapterOneMinionBoss_normalAttackAnimation.png",
        heavyAttackSpriteUrl: "/images/bosses/clinmicro_chapterOneMinionBoss_heavyAttackAnimation.png",
        miniBossIdleSpriteUrl: "/images/bosses/clinmicro_chapterOneMinionBoss_idleAnimation.png",
        miniBossAttackSpriteUrl: "/images/bosses/clinmicro_chapterOneMinionBoss_normalAttackAnimation.png",
        miniBossHeavyAttackSpriteUrl: "/images/bosses/clinmicro_chapterOneMinionBoss_heavyAttackAnimation.png",
        idleFrames: 9,
        attackFrames: 9,
        heavyAttackFrames: 11,
        miniBossIdleFrames: 9,
        miniBossAttackFrames: 9,
        miniBossHeavyAttackFrames: 11,
        idleFrameWidth: 155,
        idleFrameHeight: 161,
        attackFrameWidth: 260,
        attackFrameHeight: 231,
        heavyFrameWidth: 370,
        heavyFrameHeight: 279,
        miniBossIdleFrameWidth: 155,
        miniBossIdleFrameHeight: 161,
        miniBossAttackFrameWidth: 260,
        miniBossAttackFrameHeight: 231,
        miniBossHeavyFrameWidth: 370,
        miniBossHeavyFrameHeight: 279,
        idleDuration: 1.4,
        miniBossIdleDuration: 1.4,
        normalAttackSfxUrl: "/SoundEffects/KetoacidosisColossusNormalAttack.mp3",
        heavyAttackSfxUrl: "/SoundEffects/FungalSporeNormalAttack.mp3",
        miniBossNormalAttackSfxUrl: "/SoundEffects/KetoacidosisColossusNormalAttack.mp3",
        miniBossHeavyAttackSfxUrl: "/SoundEffects/FungalSporeNormalAttack.mp3",
      },
      {
        id: 'cm-3',
        nodeNumber: 3,
        tier: 'boss',
        title: 'Urochrome Titan (Chapter Boss)',
        subtopic: 'CSF, Synovial & Serous Fluid Analysis',
        bossName: 'Urochrome Titan',
        bossIcon: '👑',
      },
      {
        id: 'cm-4',
        nodeNumber: 4,
        tier: 'final-boss',
        title: '👑 Crystal Golem (FINAL BOSS)',
        subtopic: 'Intestinal Parasites, Helminths & Comprehensive Board Exam',
        bossName: 'Crystal Golem',
        bossIcon: '👑',
        idleSpriteUrl: "/images/bosses/clinmicro_finalboss_idleAnimation.png",
        attackSpriteUrl: "/images/bosses/clinmicro_finalboss_normalAttackAnimation.png",
        heavyAttackSpriteUrl: "/images/bosses/clinmicro_finalboss_heavyAttackAnimation.png",
        normalAttackSfxUrl: "/SoundEffects/CrystalGolemNormalAttack.mp3",
        heavyAttackSfxUrl: "/SoundEffects/CrystalGolemHeavyAttack.mp3",
        idleFrames: 7,
        attackFrames: 17,
        heavyAttackFrames: 11,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 128,
        attackFrameHeight: 128,
        heavyFrameWidth: 176,
        heavyFrameHeight: 128,
      },
    ],
    "Histopathology and Medtech Laws": [
      {
        id: 'hp-1',
        nodeNumber: 1,
        tier: 'minion',
        title: 'GMS Fungal Spore (Minion)',
        subtopic: 'Tissue Processing, Fixation & Special Fungal Stains',
        minionName: 'GMS Fungal Spore',
        minionIcon: '🍄',
        bossName: 'GMS Fungal Spore',
        bossIcon: '🍄',
        idleSpriteUrl: '/images/bosses/hispatho_chapterOneMinion_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hispatho_chapterOneMinion_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/hispatho_chapterOneMinion_heavyAttackAnimation.png',
        minionIdleSpriteUrl: '/images/bosses/hispatho_chapterOneMinion_idleAnimation.png',
        minionAttackSpriteUrl: '/images/bosses/hispatho_chapterOneMinion_normalAttackAnimation.png',
        minionHeavyAttackSpriteUrl: '/images/bosses/hispatho_chapterOneMinion_heavyAttackAnimation.png',
        normalAttackSfxUrl: '/SoundEffects/FungalSporeNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/FungalSporeHeavyAttack.mp3',
        minionNormalAttackSfxUrl: '/SoundEffects/FungalSporeNormalAttack.mp3',
        minionHeavyAttackSfxUrl: '/SoundEffects/FungalSporeHeavyAttack.mp3',
        idleFrames: 5,
        attackFrames: 10,
        heavyAttackFrames: 13,
        minionIdleFrames: 5,
        minionAttackFrames: 10,
        minionHeavyAttackFrames: 13,
        idleFrameWidth: 128,
        idleFrameHeight: 127,
        attackFrameWidth: 244,
        attackFrameHeight: 196,
        heavyFrameWidth: 244,
        heavyFrameHeight: 196,
        minionIdleFrameWidth: 128,
        minionIdleFrameHeight: 127,
        minionAttackFrameWidth: 244,
        minionAttackFrameHeight: 196,
        minionHeavyFrameWidth: 244,
        minionHeavyFrameHeight: 196,
        idleDuration: 1.0,
        minionIdleDuration: 1.0,
      },
      {
        id: 'hp-2',
        nodeNumber: 2,
        tier: 'mini-boss',
        title: 'Paraffin Golem (Mini-Boss)',
        subtopic: 'Infiltration, Embedding, Microtomy & Sectioning',
        miniBossName: 'Paraffin Golem',
        miniBossIcon: '🪨',
        bossName: 'Paraffin Golem',
        bossIcon: '🪨',
        idleSpriteUrl: '/images/bosses/hispatho_chapterOneMiniBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hispatho_chapterOneMiniBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/hispatho_chapterOneMiniBoss_heavyAttackGlintAnimation-1.png',
        miniBossHeavyAttackBallsUrl: '/images/bosses/hispatho_chapterOneMiniBoss_heavyAttackBallsAnimation-2.png',
        miniBossIdleSpriteUrl: '/images/bosses/hispatho_chapterOneMiniBoss_idleAnimation.png',
        miniBossAttackSpriteUrl: '/images/bosses/hispatho_chapterOneMiniBoss_normalAttackAnimation.png',
        miniBossHeavyAttackSpriteUrl: '/images/bosses/hispatho_chapterOneMiniBoss_heavyAttackGlintAnimation-1.png',
        normalAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/LegalBeholderHeavyAttack.mp3',
        miniBossNormalAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        miniBossHeavyAttackSfxUrl: '/SoundEffects/LegalBeholderHeavyAttack.mp3',
        idleFrames: 7,
        attackFrames: 17,
        heavyAttackFrames: 13,
        miniBossHeavyBallsFrames: 12,
        miniBossIdleFrames: 7,
        miniBossAttackFrames: 17,
        miniBossHeavyAttackFrames: 13,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 160,
        attackFrameHeight: 128,
        heavyFrameWidth: 128,
        heavyFrameHeight: 128,
        miniBossIdleFrameWidth: 128,
        miniBossIdleFrameHeight: 128,
        miniBossAttackFrameWidth: 160,
        miniBossAttackFrameHeight: 128,
        miniBossHeavyFrameWidth: 128,
        miniBossHeavyFrameHeight: 128,
        idleDuration: 1.0,
        miniBossIdleDuration: 1.0,
      },
      {
        id: 'hp-3',
        nodeNumber: 3,
        tier: 'boss',
        title: 'Fixation Overlord (Chapter Boss)',
        subtopic: 'Formalin Fixation, Routine H&E & Section Mounting',
        bossName: 'Fixation Overlord',
        bossIcon: '👑',
        idleSpriteUrl: '/images/bosses/hispatho_chapterOneBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hispatho_chapterOneBoss_normalAttackAnimation.png',
        heavyAttackSpriteUrl: '/images/bosses/hispatho_chapterOneBoss_heavtAttackGlintAnimation-1.png',
        heavyAttackNailedUrl: '/images/bosses/hispatho_chapterOneBoss_heavtAttackNailedAnimation-2.png',
        normalAttackSfxUrl: '/SoundEffects/BiohazardOverlordNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/LegalBeholderHeavyAttack.mp3',
        idleFrames: 8,
        attackFrames: 15,
        heavyAttackFrames: 10,
        heavyNailedFrames: 15,
        idleFrameWidth: 128,
        idleFrameHeight: 128,
        attackFrameWidth: 256,
        attackFrameHeight: 176,
        heavyFrameWidth: 144,
        heavyFrameHeight: 191,
        heavyNailedFrameWidth: 256,
        heavyNailedFrameHeight: 128,
        idleDuration: 1.0,
      },
      {
        id: 'hp-4',
        nodeNumber: 4,
        tier: 'final-boss',
        title: '👑 Legal Beholder (FINAL BOSS)',
        subtopic: 'RA 5527, Biosafety & Comprehensive Board Exam',
        bossName: 'Legal Beholder',
        bossIcon: '👑',
        idleSpriteUrl: '/images/bosses/hispatho_chapterThreeFinalBoss_idleAnimation.png',
        attackSpriteUrl: '/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackGlintAnimation-1.png',
        heavyAttackSpriteUrl: '/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackGlintAnimation-1.png',
        undergroundBlastUrl: '/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackUndergroundBlastAnimation.png',
        hammerAttackUrl: '/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackHammerAnimation-2.png',
        normalAttackSfxUrl: '/SoundEffects/LegalBeholderNormalAttack.mp3',
        heavyAttackSfxUrl: '/SoundEffects/LegalBeholderHeavyAttack.mp3',
        idleFrames: 6,
        attackFrames: 12,
        heavyAttackFrames: 18,
        undergroundBlastFrames: 16,
        hammerAttackFrames: 11,
        idleFrameWidth: 160,
        idleFrameHeight: 140,
        attackFrameWidth: 160,
        attackFrameHeight: 140,
        heavyFrameWidth: 160,
        heavyFrameHeight: 140,
      },
    ],
  };

  const getSubjectNodes = useCallback((subject: string): SubjectNodeConfig[] => {
    if (CHAPTER_NODES_PER_SUBJECT[subject]) return CHAPTER_NODES_PER_SUBJECT[subject];
    if (subject.toLowerCase().includes('histo') || subject.toLowerCase().includes('law')) {
      return CHAPTER_NODES_PER_SUBJECT["Histopathology and Medtech Laws"];
    }
    return CHAPTER_NODES_PER_SUBJECT[subject] || [
      { id: `${subject}-1`, nodeNumber: 1, tier: 'minion', title: `${subject} Minion Encounter`, subtopic: 'Core Diagnostic Principles', bossName: `${subject} Minion`, bossIcon: '👾' },
      { id: `${subject}-2`, nodeNumber: 2, tier: 'mini-boss', title: `${subject} Mini-Boss Trial`, subtopic: 'Intermediate Pathologies', bossName: `${subject} Spectre`, bossIcon: '👹' },
      { id: `${subject}-3`, nodeNumber: 3, tier: 'boss', title: `${subject} Chapter Boss`, subtopic: 'Pathology & Testing Methodologies', bossName: `${subject} Overlord`, bossIcon: '👑' },
      { id: `${subject}-4`, nodeNumber: 4, tier: 'final-boss', title: `👑 ${subject} Sovereign (FINAL BOSS)`, subtopic: 'Comprehensive Licensure Board Challenge', bossName: `Master ${subject} Colossus`, bossIcon: '👑' },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLearningWaveState = useCallback((
    questions: Question[],
    userAnswersList: { isCorrect: boolean; difficulty?: string }[],
    subject: string,
    waveEnemies: any,
    overrideStage?: 1 | 2 | 3,
    customQIndex?: number
  ) => {
    const activeNodes = getSubjectNodes(subject || selectedSubject);
    const ch1Node = activeNodes.find(n => n.nodeNumber === 1) || activeNodes[0];
    const ch4Node = activeNodes.find(n => n.nodeNumber === 4 || n.tier === 'final-boss') || activeNodes[activeNodes.length - 1];
    const ch3Node = ch4Node;
    const ch3BossNode = activeNodes.find(n => n.nodeNumber === 3 || n.tier === 'boss') || ch1Node;
    const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || ch1Node;
    const subjectMeta = getSubjectMeta(subject || selectedSubject);
    const wave3BossNode = (currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4) ? ch4Node : ch3BossNode;

    const waveMinion = waveEnemies?.minion;
    const waveEnforcer = waveEnemies?.enforcer;
    const waveBoss = waveEnemies?.boss;

    if (!questions || questions.length === 0) {
      return {
        waveStage: 1,
        name: waveMinion?.name || currentActiveNode?.minionName || ch1Node?.minionName || 'Lab Minion',
        badge: 'MINION 👾',
        icon: waveMinion?.icon || currentActiveNode?.minionIcon || ch1Node?.minionIcon || '🧪',
        hp: 100,
        maxHp: 100,
        damagePerQ: 34,
        idleSprite: waveMinion?.idleSprite !== undefined ? waveMinion.idleSprite : (currentActiveNode?.minionIdleSpriteUrl || ch1Node?.minionIdleSpriteUrl || null),
        attackSprite: waveMinion?.attackSprite !== undefined ? waveMinion.attackSprite : (currentActiveNode?.minionAttackSpriteUrl || ch1Node?.minionAttackSpriteUrl || null),
        heavyAttackSprite: waveMinion?.heavyAttackSprite !== undefined ? waveMinion.heavyAttackSprite : (currentActiveNode?.minionHeavyAttackSpriteUrl || ch1Node?.minionHeavyAttackSpriteUrl || null),
        idleFrames: waveMinion?.idleFrames || currentActiveNode?.minionIdleFrames || ch1Node?.minionIdleFrames || 8,
        attackFrames: waveMinion?.attackFrames || currentActiveNode?.minionAttackFrames || ch1Node?.minionAttackFrames || 14,
        heavyAttackFrames: waveMinion?.heavyAttackFrames || currentActiveNode?.minionHeavyAttackFrames || ch1Node?.minionHeavyAttackFrames || 10,
        idleFrameWidth: waveMinion?.idleFrameWidth || currentActiveNode?.minionIdleFrameWidth || ch1Node?.minionIdleFrameWidth || 128,
        idleFrameHeight: waveMinion?.idleFrameHeight || currentActiveNode?.minionIdleFrameHeight || ch1Node?.minionIdleFrameHeight || 128,
        attackFrameWidth: waveMinion?.attackFrameWidth || currentActiveNode?.minionAttackFrameWidth || ch1Node?.minionAttackFrameWidth || 257,
        attackFrameHeight: waveMinion?.attackFrameHeight || currentActiveNode?.minionAttackFrameHeight || ch1Node?.minionAttackFrameHeight || 218,
        heavyFrameWidth: waveMinion?.heavyFrameWidth || currentActiveNode?.minionHeavyFrameWidth || ch1Node?.minionHeavyFrameWidth || 257,
        heavyFrameHeight: waveMinion?.heavyFrameHeight || currentActiveNode?.minionHeavyFrameHeight || ch1Node?.minionHeavyFrameHeight || 218,
        idleDuration: waveMinion?.idleDuration || currentActiveNode?.minionIdleDuration || ch1Node?.minionIdleDuration || 1.2,
        normalAttackSfxUrl: waveMinion?.normalAttackSfxUrl || currentActiveNode?.minionNormalAttackSfxUrl || ch1Node?.minionNormalAttackSfxUrl,
        heavyAttackSfxUrl: waveMinion?.heavyAttackSfxUrl || currentActiveNode?.minionHeavyAttackSfxUrl || ch1Node?.minionHeavyAttackSfxUrl,
      };
    }

    const effectiveQIndex = customQIndex !== undefined
      ? Math.min(questions.length - 1, customQIndex)
      : Math.min(questions.length - 1, userAnswersList.length);
    const currentQ = questions[effectiveQIndex] || questions[0];
    const currentDiff = overrideStage === 1
      ? 'EASY'
      : overrideStage === 2
        ? 'MEDIUM'
        : overrideStage === 3
          ? 'HARD'
          : String(currentQ?.difficulty || 'EASY').toUpperCase();

    const waveStage = overrideStage || (currentDiff === 'EASY' ? 1 : currentDiff === 'MEDIUM' ? 2 : 3);

    // Filter questions that belong to the current wave difficulty
    const waveQuestions = questions.filter(q => String(q.difficulty || 'EASY').toUpperCase() === currentDiff);
    const waveQCount = Math.max(1, waveQuestions.length);

    // Count ONLY CORRECT answers for THIS wave difficulty!
    const correctInWave = userAnswersList.filter((ans, idx) => {
      const qDiff = String(ans.difficulty || questions[idx]?.difficulty || 'EASY').toUpperCase();
      return ans.isCorrect && qDiff === currentDiff;
    }).length;

    // Scale player's damage per question across the total number of questions in this wave!
    // Each question deals (100 / waveQCount) damage, ensuring the enemy's HP depletes
    // smoothly across the entire wave and only reaches 0 HP upon answering all wave questions.
    const damagePerQ = 100 / waveQCount;
    const currentHp = Math.max(0, Math.round(100 - (correctInWave * damagePerQ)));

    const totalCorrect = userAnswersList.filter(a => a.isCorrect).length;
    const isFinished = userAnswersList.length >= questions.length;
    const isPassing = (totalCorrect / Math.max(1, questions.length)) >= 0.75;
    const effectiveHp = isFinished ? (isPassing ? 0 : Math.max(20, currentHp)) : currentHp;

    if (waveStage === 1) {
      return {
        waveStage: 1,
        name: waveMinion?.name || currentActiveNode?.minionName || ch1Node?.minionName || 'Lab Minion',
        badge: 'MINION 👾',
        icon: waveMinion?.icon || currentActiveNode?.minionIcon || ch1Node?.minionIcon || '🧪',
        hp: effectiveHp,
        maxHp: 100,
        damagePerQ,
        idleSprite: waveMinion?.idleSprite !== undefined ? waveMinion.idleSprite : (currentActiveNode?.minionIdleSpriteUrl || ch1Node?.minionIdleSpriteUrl || null),
        attackSprite: waveMinion?.attackSprite !== undefined ? waveMinion.attackSprite : (currentActiveNode?.minionAttackSpriteUrl || ch1Node?.minionAttackSpriteUrl || null),
        heavyAttackSprite: waveMinion?.heavyAttackSprite !== undefined ? waveMinion.heavyAttackSprite : (currentActiveNode?.minionHeavyAttackSpriteUrl || ch1Node?.minionHeavyAttackSpriteUrl || null),
        idleFrames: waveMinion?.idleFrames || currentActiveNode?.minionIdleFrames || ch1Node?.minionIdleFrames || 8,
        attackFrames: waveMinion?.attackFrames || currentActiveNode?.minionAttackFrames || ch1Node?.minionAttackFrames || 14,
        heavyAttackFrames: waveMinion?.heavyAttackFrames || currentActiveNode?.minionHeavyAttackFrames || ch1Node?.minionHeavyAttackFrames || 10,
        idleFrameWidth: waveMinion?.idleFrameWidth || currentActiveNode?.minionIdleFrameWidth || ch1Node?.minionIdleFrameWidth || 128,
        idleFrameHeight: waveMinion?.idleFrameHeight || currentActiveNode?.minionIdleFrameHeight || ch1Node?.minionIdleFrameHeight || 128,
        attackFrameWidth: waveMinion?.attackFrameWidth || currentActiveNode?.minionAttackFrameWidth || ch1Node?.minionAttackFrameWidth || 257,
        attackFrameHeight: waveMinion?.attackFrameHeight || currentActiveNode?.minionAttackFrameHeight || ch1Node?.minionAttackFrameHeight || 218,
        heavyFrameWidth: waveMinion?.heavyFrameWidth || currentActiveNode?.minionHeavyFrameWidth || ch1Node?.minionHeavyFrameWidth || 257,
        heavyFrameHeight: waveMinion?.heavyFrameHeight || currentActiveNode?.minionHeavyFrameHeight || ch1Node?.minionHeavyFrameHeight || 218,
        idleDuration: waveMinion?.idleDuration || currentActiveNode?.minionIdleDuration || ch1Node?.minionIdleDuration || 1.2,
        normalAttackSfxUrl: waveMinion?.normalAttackSfxUrl || currentActiveNode?.minionNormalAttackSfxUrl || ch1Node?.minionNormalAttackSfxUrl,
        heavyAttackSfxUrl: waveMinion?.heavyAttackSfxUrl || currentActiveNode?.minionHeavyAttackSfxUrl || ch1Node?.minionHeavyAttackSfxUrl,
      };
    } else if (waveStage === 2) {
      return {
        waveStage: 2,
        name: waveEnforcer?.name || currentActiveNode?.miniBossName || ch1Node?.miniBossName || 'Diagnostic Spectre',
        badge: 'MINI-BOSS 👹',
        icon: waveEnforcer?.icon || currentActiveNode?.miniBossIcon || ch1Node?.miniBossIcon || '👻',
        hp: effectiveHp,
        maxHp: 100,
        damagePerQ,
        idleSprite: waveEnforcer?.idleSprite !== undefined ? waveEnforcer.idleSprite : (currentActiveNode?.miniBossIdleSpriteUrl || ch1Node?.miniBossIdleSpriteUrl || null),
        attackSprite: waveEnforcer?.attackSprite !== undefined ? waveEnforcer.attackSprite : (currentActiveNode?.miniBossAttackSpriteUrl || ch1Node?.miniBossAttackSpriteUrl || null),
        heavyAttackSprite: waveEnforcer?.heavyAttackSprite !== undefined ? waveEnforcer.heavyAttackSprite : (currentActiveNode?.miniBossHeavyAttackSpriteUrl || ch1Node?.miniBossHeavyAttackSpriteUrl || null),
        slashSpriteUrl: waveEnforcer?.slashSprite || currentActiveNode?.miniBossSlashSpriteUrl || ch1Node?.miniBossSlashSpriteUrl || null,
        heavyAttackBallsUrl: (waveEnforcer as any)?.heavyAttackBallsUrl || (currentActiveNode as any)?.miniBossHeavyAttackBallsUrl || (ch1Node as any)?.miniBossHeavyAttackBallsUrl || null,
        idleFrames: waveEnforcer?.idleFrames || currentActiveNode?.miniBossIdleFrames || ch1Node?.miniBossIdleFrames || 7,
        attackFrames: waveEnforcer?.attackFrames || currentActiveNode?.miniBossAttackFrames || ch1Node?.miniBossAttackFrames || 17,
        heavyAttackFrames: waveEnforcer?.heavyAttackFrames || currentActiveNode?.miniBossHeavyAttackFrames || ch1Node?.miniBossHeavyAttackFrames || 13,
        idleFrameWidth: waveEnforcer?.idleFrameWidth || currentActiveNode?.miniBossIdleFrameWidth || ch1Node?.miniBossIdleFrameWidth || 128,
        idleFrameHeight: waveEnforcer?.idleFrameHeight || currentActiveNode?.miniBossIdleFrameHeight || ch1Node?.miniBossIdleFrameHeight || 128,
        attackFrameWidth: waveEnforcer?.attackFrameWidth || currentActiveNode?.miniBossAttackFrameWidth || ch1Node?.miniBossAttackFrameWidth || 160,
        attackFrameHeight: waveEnforcer?.attackFrameHeight || currentActiveNode?.miniBossAttackFrameHeight || ch1Node?.miniBossAttackFrameHeight || 128,
        heavyFrameWidth: waveEnforcer?.heavyFrameWidth || currentActiveNode?.miniBossHeavyFrameWidth || ch1Node?.miniBossHeavyFrameWidth || 128,
        heavyFrameHeight: waveEnforcer?.heavyFrameHeight || currentActiveNode?.miniBossHeavyFrameHeight || ch1Node?.miniBossHeavyFrameHeight || 128,
        idleDuration: waveEnforcer?.idleDuration || currentActiveNode?.miniBossIdleDuration || ch1Node?.miniBossIdleDuration || 1.0,
        normalAttackSfxUrl: waveEnforcer?.normalAttackSfxUrl || currentActiveNode?.miniBossNormalAttackSfxUrl || ch1Node?.miniBossNormalAttackSfxUrl,
        heavyAttackSfxUrl: waveEnforcer?.heavyAttackSfxUrl || currentActiveNode?.miniBossHeavyAttackSfxUrl || ch1Node?.miniBossHeavyAttackSfxUrl,
      };
    } else {
      return {
        waveStage: 3,
        name: waveBoss?.name || wave3BossNode?.bossName || subjectMeta.enemy,
        badge: (wave3BossNode?.nodeNumber === 4 || wave3BossNode?.tier === 'final-boss') ? 'FINAL BOSS 👑' : 'BOSS 👑',
        icon: waveBoss?.icon || wave3BossNode?.bossIcon || '👑',
        hp: effectiveHp,
        maxHp: 100,
        damagePerQ,
        idleSprite: waveBoss?.idleSprite !== undefined ? waveBoss.idleSprite : (wave3BossNode?.idleSpriteUrl || subjectMeta?.idleSpriteUrl || null),
        attackSprite: waveBoss?.attackSprite !== undefined ? waveBoss.attackSprite : (wave3BossNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl || null),
        heavyAttackSprite: waveBoss?.heavyAttackSprite !== undefined ? waveBoss.heavyAttackSprite : (wave3BossNode?.heavyAttackSpriteUrl || subjectMeta?.heavyAttackSpriteUrl || null),
        attackProjectileUrl: waveBoss?.attackProjectileUrl || wave3BossNode?.attackProjectileUrl || null,
        attackProjectileFrames: waveBoss?.attackProjectileFrames || wave3BossNode?.attackProjectileFrames || 5,
        undergroundSpikesUrl: waveBoss?.undergroundSpikesUrl || wave3BossNode?.undergroundSpikesUrl || null,
        undergroundSpikesFrames: waveBoss?.undergroundSpikesFrames || wave3BossNode?.undergroundSpikesFrames || 8,
        hammerAttackUrl: waveBoss?.hammerAttackUrl || ((wave3BossNode?.nodeNumber === 4 || wave3BossNode?.tier === 'final-boss') ? wave3BossNode?.hammerAttackUrl : null),
        hammerAttackFrames: waveBoss?.hammerAttackFrames || ((wave3BossNode?.nodeNumber === 4 || wave3BossNode?.tier === 'final-boss') ? wave3BossNode?.hammerAttackFrames : 11),
        undergroundBlastUrl: waveBoss?.undergroundBlastUrl || ((wave3BossNode?.nodeNumber === 4 || wave3BossNode?.tier === 'final-boss') ? wave3BossNode?.undergroundBlastUrl : null),
        undergroundBlastFrames: waveBoss?.undergroundBlastFrames || ((wave3BossNode?.nodeNumber === 4 || wave3BossNode?.tier === 'final-boss') ? wave3BossNode?.undergroundBlastFrames : 16),
        lightningAttackUrl: waveBoss?.lightningAttackUrl || wave3BossNode?.lightningAttackUrl || (subjectMeta as any)?.lightningAttackUrl || null,
        lightningAttackFrames: waveBoss?.lightningAttackFrames || wave3BossNode?.lightningAttackFrames || (subjectMeta as any)?.lightningAttackFrames || 12,
        heavyAttackFistUrl: waveBoss?.heavyAttackFistUrl || wave3BossNode?.heavyAttackFistUrl || null,
        heavyAttackFistFrames: waveBoss?.heavyAttackFistFrames || wave3BossNode?.heavyAttackFistFrames || 9,
        heavyAttackNailedUrl: waveBoss?.heavyAttackNailedUrl || wave3BossNode?.heavyAttackNailedUrl || null,
        heavyAttackNailedFrames: waveBoss?.heavyAttackNailedFrames || wave3BossNode?.heavyAttackNailedFrames || 15,
        idleFrames: waveBoss?.idleFrames || wave3BossNode?.idleFrames || ch3Node?.idleFrames || subjectMeta?.idleFrames || 6,
        attackFrames: waveBoss?.attackFrames || wave3BossNode?.attackFrames || ch3Node?.attackFrames || subjectMeta?.attackFrames || 5,
        heavyAttackFrames: waveBoss?.heavyAttackFrames || wave3BossNode?.heavyAttackFrames || ch3Node?.heavyAttackFrames || subjectMeta?.heavyAttackFrames || 13,
        idleFrameWidth: waveBoss?.idleFrameWidth || wave3BossNode?.idleFrameWidth || ch3Node?.idleFrameWidth || subjectMeta?.idleFrameWidth || 128,
        attackFrameWidth: waveBoss?.attackFrameWidth || wave3BossNode?.attackFrameWidth || ch3Node?.attackFrameWidth || subjectMeta?.attackFrameWidth || 128,
        heavyFrameWidth: waveBoss?.heavyFrameWidth || wave3BossNode?.heavyFrameWidth || ch3Node?.heavyFrameWidth || subjectMeta?.heavyFrameWidth || 480,
        idleFrameHeight: waveBoss?.idleFrameHeight || wave3BossNode?.idleFrameHeight || ch3Node?.idleFrameHeight || subjectMeta?.idleFrameHeight || 128,
        attackFrameHeight: waveBoss?.attackFrameHeight || wave3BossNode?.attackFrameHeight || ch3Node?.attackFrameHeight || subjectMeta?.attackFrameHeight || 128,
        heavyFrameHeight: waveBoss?.heavyFrameHeight || wave3BossNode?.heavyFrameHeight || ch3Node?.heavyFrameHeight || subjectMeta?.heavyFrameHeight || 256,
        idleDuration: waveBoss?.idleDuration || wave3BossNode?.idleDuration || ch3Node?.idleDuration || subjectMeta?.idleDuration || undefined,
        idleFps: waveBoss?.idleFps || wave3BossNode?.idleFps || ch3Node?.idleFps || subjectMeta?.idleFps || undefined,
        normalAttackSfxUrl: waveBoss?.normalAttackSfxUrl || wave3BossNode?.normalAttackSfxUrl || ch3Node?.normalAttackSfxUrl || subjectMeta?.normalAttackSfxUrl,
        heavyAttackSfxUrl: waveBoss?.heavyAttackSfxUrl || wave3BossNode?.heavyAttackSfxUrl || ch3Node?.heavyAttackSfxUrl || subjectMeta?.heavyAttackSfxUrl,
      };
    }
  }, [selectedSubject, selectedNodeId, getSubjectNodes]);

  // Helper to calculate Level-Scaled HP for Player and 3-Stage Enemies
  const calculatePlayerMaxHp = (level: number, hasShield: boolean) => {
    const base = 100 + (Math.max(1, level) - 1) * 15;
    return hasShield ? base + 20 : base;
  };

  const calculateEnemyStageHp = (stage: 1 | 2 | 3 | 4, level: number, difficulty: string) => {
    const safeLevel = Math.max(1, level);
    const playerStats = calculatePlayerStats(safeLevel, 0, null);

    // Number of base correct hits needed to defeat enemy
    // Stage 1 (Minion): 12 turns (~11 on Easy, 12 on Medium, 16 on Hard) ensuring Minion requires 10+ questions
    // Stage 2 (Mini-Boss): 15 turns
    // Stage 3 (Chapter Boss): 18 turns
    // Stage 4 (Final Boss): 22 turns
    const turnsToDefeat = stage === 1 ? 12 : stage === 2 ? 15 : stage === 3 ? 18 : 22;
    const modeMul = difficulty === 'EASY' ? 0.9 : difficulty === 'HARD' ? 1.3 : 1.0;

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
  const userXpRef = useRef<number>(100);
  useEffect(() => {
    userXpRef.current = userXp;
  }, [userXp]);
  const [inventory, setInventory] = useState<Record<string, number>>({
    erlenmeyer_shield: 2,
    pipette_clarity: 2,
    buffered_saline: 2,
  });
  const [equippedItem, setEquippedItem] = useState<string | null>('erlenmeyer_shield');

  const getPlayerMaxHp = useCallback(() => {
    if (quizMode !== 'boss-battle') return 100;
    const hasShieldEffect = equippedItem === 'erlenmeyer_shield' && (inventory.erlenmeyer_shield || 0) > 0;
    return calculatePlayerMaxHp(userLevel, hasShieldEffect);
  }, [quizMode, equippedItem, inventory.erlenmeyer_shield, userLevel]);

  // Ensure playerHealth never exceeds max HP when unequipping items or changing stats
  useEffect(() => {
    const currentMax = getPlayerMaxHp();
    setPlayerHealth(prev => Math.min(prev, currentMax));
  }, [getPlayerMaxHp]);
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

  // Preload Battle & Inventory Assets on Mount for Instant Rendering
  useEffect(() => {
    preloadSpecterSounds();
    preloadBiohazardSounds();
    preloadStaphSentinelSounds();
    preloadCrystalGolemSounds();
    preloadMicrobeSwarmSounds();
    preloadSickleCellReaperSounds();
    preloadAcidSlimeSounds();
    preloadAnemiaShadeSounds();
    preloadErythrocyteColossusSounds();
    preloadHydraSounds();
    preloadImmuneArchonSounds();
    preloadKetoacidosisSounds();
    preloadLegalBeholderSounds();
    preloadHyperglycemicMutantSounds();
    preloadGramPositiveSounds();
    preloadSickleCellMinionSounds();
    preloadFungalSporeSounds();
    preloadReagentStripSlimeSounds();
    preloadDebuffSound();
    preloadBossBattleMusic();
    preloadLearningModeMusic();
    preloadTestModeMusic();
    const assetsToPreload = [
      '/ui/Inventory_bg.png',
      '/ui/Inventory_icon.png',
      '/ui/Inventory_available_exp.png',
      '/ui/Inventory_weekly_bg.png',
      '/ui/Inventory_slot.png',
      '/ui/Inventory_shop_bg.png',
      '/images/player/userPlayer_placeholder.png',
      '/images/player/hitAnimation.png',
      '/ui/background_clinicalchem.png',
      '/images/bosses/hematology_chapterOneMinion_idleAnimation.png',
      '/images/bosses/hematology_chapterOneMinion_normalAttackAnimation.png',
      '/images/bosses/hematology_chapterOneMinion_heavyAttackAnimation.png',
      '/images/bosses/hispatho_chapterOneMinion_idleAnimation.png',
      '/images/bosses/hispatho_chapterOneMinion_normalAttackAnimation.png',
      '/images/bosses/hispatho_chapterOneMinion_heavyAttackAnimation.png',
      '/images/bosses/clinmicro_chapterOneMinion_idleAnimation.png',
      '/images/bosses/clinmicro_chapterOneMinion_normalAttackAnimation.png',
      '/images/bosses/clinmicro_chapterOneMinion_heavyAttackAnimation.png',
      '/images/bosses/immunohema_chapterOneMinion_idleAnimation.png',
      '/images/bosses/immunohema_chapterOneMinion_normalAttackAnimation.png',
      '/images/bosses/immunohema_chapterOneMinion_heavyAttackAnimation.png',
      '/images/bosses/immunohema_chapterOneMiniBoss_idleAnimation.png',
      '/images/bosses/immunohema_chapterOneMiniBoss_normalAttackAnimation.png',
      '/images/bosses/immunohema_chapterOneMiniBoss_heavyAttackAnimation.png',
      '/images/bosses/clinchem_chapterOneBoss_idleAnimation.png',
      '/images/bosses/clinchem_chapterOneBoss_normalAttackAnimation.png',
      '/images/bosses/clinchem_chapterOneBoss_heavyAttackAnimation.png',
      '/images/bosses/immunohema_chapterOneBoss_heavyAttackThunderAnimation.png',
      '/images/bosses/immunohema_chapterThreeFinalBoss_heavyAttackLightningAnimation-2.png',
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
  }, [toast]);

  const inventoryDialogJSX = (
    <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
      <DialogContent
        container={isFullscreen ? (fullscreenRef.current || undefined) : undefined}
        className="w-[96vw] max-w-[420px] sm:max-w-[580px] md:max-w-[680px] lg:max-w-[740px] bg-transparent border-none p-0 text-white shadow-2xl z-[100] font-bytebounce flex items-center justify-center select-none [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Inventory</DialogTitle>

        {/* Parchment / Leather Frame Container - Sized generously for maximum readability */}
        <div className="relative w-full p-3 sm:p-5 md:p-6 flex flex-col gap-2 sm:gap-3 md:gap-3.5 overflow-hidden rounded-xl bg-[#2b1408] border-2 border-[#5c2a1a] shadow-2xl">
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
            className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 md:top-4 md:right-4 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-[#3d1a16] text-[#e8b298] hover:bg-red-700 hover:text-white rounded-md border-2 border-[#693327] flex items-center justify-center font-bold text-xs sm:text-sm z-30 transition-colors active:scale-95 shadow-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 stroke-[2.5]" />
          </button>

          {/* Top Header Section */}
          <div className="relative z-10 pt-0.5">
            <div className="flex items-center justify-between gap-2 pr-9 sm:pr-12">
              {/* Left: Satchel Icon + INVENTORY Title */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Image
                  src="/ui/Inventory_icon.png"
                  alt="Inventory Icon"
                  width={36}
                  height={36}
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                  unoptimized
                />
                <h2 className="font-bytebounce text-2xl sm:text-3xl md:text-4xl lg:text-[44px] text-[#3d1a16] tracking-wider leading-none drop-shadow-[2px_2px_0_#f4cfbd]">
                  INVENTORY
                </h2>
              </div>

              {/* Right: Available XP Pill */}
              <div className="relative h-6.5 sm:h-8 md:h-9 px-2.5 sm:px-3.5 md:px-4 flex items-center justify-center shrink-0">
                <Image
                  src="/ui/Inventory_available_exp.png"
                  alt="Available EXP"
                  fill
                  className="object-fill"
                  style={{ imageRendering: 'pixelated' }}
                  unoptimized
                />
                <span className="relative z-10 font-bytebounce text-amber-300 text-xs sm:text-sm md:text-base font-bold flex items-center gap-1 tracking-wider leading-none drop-shadow-[1px_1px_0_#000]">
                  ⚡ {userXp} XP
                </span>
              </div>
            </div>

            {/* Top Divider */}
            <div className="w-full h-[2px] sm:h-[2.5px] bg-[#3d1a16] mt-1.5 sm:mt-2 opacity-90" />
          </div>

          {/* Top Weekly Supply Banner */}
          <div className="relative z-10 w-full h-7 sm:h-8.5 md:h-9.5 px-2.5 sm:px-4 md:px-5 flex items-center justify-between shrink-0">
            <Image
              src="/ui/Inventory_weekly_bg.png"
              alt="Weekly Supply Banner"
              fill
              className="object-fill"
              style={{ imageRendering: 'pixelated' }}
              unoptimized
            />
            <div className="relative z-10 flex items-center justify-between w-full text-white font-bytebounce text-[10.5px] sm:text-xs md:text-sm lg:text-[15px] px-1 leading-none">
              <span className="text-amber-100 flex items-center gap-1.5 tracking-wide">
                Weekly Drop: <span className="text-emerald-400 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">+1 Free Charge</span>
              </span>
              <span className="text-amber-300 font-mono text-[9.5px] sm:text-[11px] md:text-xs tracking-wider">
                Restock: <span className="text-amber-100 font-bold font-mono">{restockCountdown || 'Calculating...'}</span>
              </span>
            </div>
          </div>

          {/* 6x3 Inventory Slot Grid (18 Slots) */}
          <div className="relative z-10">
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 md:gap-3">
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
                        "relative z-20 text-xl sm:text-2xl md:text-3xl lg:text-4xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] transition-transform",
                        isSelected && "scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                      )}
                    >
                      {item.icon}
                    </span>

                    {/* Stack Count Badge */}
                    <span className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1.5 z-30 font-bytebounce text-[9.5px] sm:text-xs md:text-sm font-bold text-amber-200 drop-shadow-[1px_1px_0_#000] leading-none">
                      {count}/{MAX_REAGENT_CAP}
                    </span>

                    {/* Equipped Badge */}
                    {isEquipped && (
                      <span className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 z-30 bg-emerald-500 text-black text-[7px] sm:text-[8.5px] md:text-[10px] font-black uppercase px-1 py-0.5 rounded border border-black animate-pulse leading-none shadow">
                        EQ
                      </span>
                    )}

                    {/* 16-Bit Gamified RPG Reticle Corner Brackets & Floating Pointer */}
                    {isSelected && (
                      <>
                        {/* Top-Left Bracket */}
                        <div className="absolute -top-0.5 -left-0.5 z-40 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 border-t-2 border-l-2 border-yellow-200 shadow-[0_0_5px_#f59e0b]" />
                        {/* Top-Right Bracket */}
                        <div className="absolute -top-0.5 -right-0.5 z-40 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 border-t-2 border-r-2 border-yellow-200 shadow-[0_0_5px_#f59e0b]" />
                        {/* Bottom-Left Bracket */}
                        <div className="absolute -bottom-0.5 -left-0.5 z-40 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 border-b-2 border-l-2 border-yellow-200 shadow-[0_0_5px_#f59e0b]" />
                        {/* Bottom-Right Bracket */}
                        <div className="absolute -bottom-0.5 -right-0.5 z-40 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 border-b-2 border-r-2 border-yellow-200 shadow-[0_0_5px_#f59e0b]" />

                        {/* Floating Retro RPG Cursor Triangle pointer above slot */}
                        <div className="absolute -top-2.5 sm:-top-3 md:-top-3.5 left-1/2 -translate-x-1/2 z-40 text-yellow-300 text-[8px] sm:text-[10px] md:text-xs animate-bounce leading-none drop-shadow-[0_0_6px_#f59e0b] select-none pointer-events-none font-sans font-bold">
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
                  <span className="relative z-10 text-amber-900/40 text-[10px] sm:text-xs md:text-sm font-mono font-bold select-none">
                    +
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Divider */}
          <div className="relative z-10 w-full h-[2px] sm:h-[2.5px] bg-[#3d1a16] opacity-90" />

          {/* Bottom Selected Item / Shop Action Panel */}
          <div className="relative z-10 w-full min-h-[72px] sm:min-h-[88px] md:min-h-[104px] p-2 sm:p-3 md:p-3.5 flex items-center shrink-0 rounded-lg">
            <Image
              src="/ui/Inventory_shop_bg.png"
              alt="Inventory Shop Panel"
              fill
              className="object-fill"
              style={{ imageRendering: 'pixelated' }}
              unoptimized
            />
            {activeSelectedItem ? (
              <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3 md:gap-4 w-full">
                {/* Left details */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="text-2xl sm:text-3xl md:text-4xl shrink-0 drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]">
                    {activeSelectedItem.icon}
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h4 className="font-bold text-amber-300 font-bytebounce text-sm sm:text-base md:text-lg lg:text-xl tracking-wide leading-tight drop-shadow-[1px_1px_0_#000] truncate">
                        {activeSelectedItem.name}
                      </h4>
                      <span className="text-[7.5px] sm:text-[9.5px] md:text-[11px] font-bold uppercase tracking-wider bg-black/60 px-1.5 py-0.5 rounded text-amber-200 border border-amber-500/40 leading-none">
                        Stock: {inventory[activeSelectedItem.id] || 0}/{MAX_REAGENT_CAP}
                      </span>
                      {equippedItem === activeSelectedItem.id && (
                        <span className="text-[7.5px] sm:text-[9.5px] md:text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-black px-1.5 py-0.5 rounded border border-black leading-none animate-pulse">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-[13px] text-amber-100 font-sans leading-snug line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      {activeSelectedItem.desc}
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-[13px] font-bold text-amber-300 leading-snug drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] truncate">
                      ✨ {activeSelectedItem.effect}
                    </p>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                  {equippedItem === activeSelectedItem.id ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setEquippedItem(null);
                        const newMax = calculatePlayerMaxHp(userLevel, false);
                        setPlayerHealth(prev => Math.min(prev, newMax));
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bytebounce text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider h-6.5 sm:h-8 md:h-9 px-2.5 sm:px-3.5 md:px-4.5 border border-red-400 shadow-md whitespace-nowrap active:scale-95 leading-none rounded cursor-pointer"
                    >
                      Unequip
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={(inventory[activeSelectedItem.id] || 0) <= 0}
                      onClick={() => setEquippedItem(activeSelectedItem.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black font-bytebounce text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider h-6.5 sm:h-8 md:h-9 px-2.5 sm:px-3.5 md:px-4.5 border border-emerald-300 disabled:opacity-30 shadow-md whitespace-nowrap active:scale-95 leading-none rounded cursor-pointer"
                    >
                      Equip
                    </Button>
                  )}

                  <Button
                    size="sm"
                    disabled={(inventory[activeSelectedItem.id] || 0) >= MAX_REAGENT_CAP}
                    onClick={() => handleBuyReagent(activeSelectedItem.id, activeSelectedItem.name, activeSelectedItem.cost)}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bytebounce text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider h-6.5 sm:h-8 md:h-9 px-2.5 sm:px-3.5 md:px-4.5 border border-amber-300 shadow-md flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-40 active:scale-95 leading-none rounded cursor-pointer"
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

  const openArenaSettings = (tab: 'character' | 'audio' = 'character') => {
    setRenameInput(userLastName?.replace(/^aspirant\s+/i, '') || '');
    setRenameGender(avatarGender);
    setArenaSettingsTab(tab);
    setShowArenaSettingsDialog(true);
  };

  const handleSaveArenaSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNick = renameInput.trim();
    if (cleanNick.length < 2) return;
    setIsSavingSettings(true);
    try {
      setUserLastName(cleanNick);
      setAvatarGender(renameGender);

      if (typeof window !== 'undefined') {
        localStorage.setItem('bq_pref_sfx_vol', String(sfxVolume[0]));
        localStorage.setItem('bq_pref_ambient_music', String(ambientMusic));
        localStorage.setItem('bq_pref_floating_damage', String(floatingDamageText));
        localStorage.setItem('bq_pref_hit_flash', String(hitScreenFlash));
        if (currentUserIdRef.current) {
          localStorage.setItem(`bq_arena_nickname_${currentUserIdRef.current}`, cleanNick);
          localStorage.setItem(`bq_arena_gender_${currentUserIdRef.current}`, renameGender);
        }
      }

      const quota = typeof window !== 'undefined' ? parseInt(localStorage.getItem('bq_pref_daily_quota') || '50', 10) : 50;

      await Promise.all([
        saveArenaOnboardingAction({
          nickname: cleanNick,
          avatarGender: renameGender,
          dailyQuota: quota,
        }),
        saveUserSettingsAction({
          arenaNickname: cleanNick,
          avatarGender: renameGender,
          sfxVolume: sfxVolume[0],
          ambientMusic,
          floatingDamageText,
          hitScreenFlash,
        })
      ]);

      window.dispatchEvent(new CustomEvent('bq_settings_updated', {
        detail: {
          arenaNickname: cleanNick,
          avatarGender: renameGender,
          sfxVolume: sfxVolume[0],
          ambientMusic,
          floatingDamageText,
          hitScreenFlash
        }
      }));
      window.dispatchEvent(new CustomEvent('bq_stats_updated'));
      setShowArenaSettingsDialog(false);

      toast({
        title: "Arena Settings Saved!",
        description: `Your call-sign, avatar, and audio preferences have been updated.`,
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save arena settings.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const arenaSettingsDialogJSX = (
    <Dialog open={showArenaSettingsDialog} onOpenChange={setShowArenaSettingsDialog}>
      <DialogContent
        container={isFullscreen ? (fullscreenRef.current || undefined) : undefined}
        className="max-w-md w-full bg-card/95 border-2 border-primary/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl z-[120]"
      >
        <DialogHeader className="pb-1">
          <DialogTitle className="text-xl sm:text-2xl font-black font-headline text-foreground tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Arena Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Customize your combat persona, avatar, and in-game audio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveArenaSettings} className="space-y-4 pt-2">
          <Tabs value={arenaSettingsTab} onValueChange={(val) => setArenaSettingsTab(val as 'character' | 'audio')} className="w-full">
            <TabsList className="grid grid-cols-2 bg-muted/60 p-1 rounded-2xl border border-border/60 h-11">
              <TabsTrigger value="character" className="rounded-xl font-bold text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Swords className="w-3.5 h-3.5" />
                Character
              </TabsTrigger>
              <TabsTrigger value="audio" className="rounded-xl font-bold text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Volume2 className="w-3.5 h-3.5" />
                Audio & FX
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: CHARACTER */}
            <TabsContent value="character" className="space-y-4 pt-3 focus-visible:outline-none">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Arena Nickname</Label>
                <Input
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value.slice(0, 16))}
                  placeholder="Enter new nickname"
                  maxLength={16}
                  className="h-11 rounded-xl bg-muted/30 border-2 font-bold text-foreground text-sm"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                  <span>2–16 characters</span>
                  <span>{renameInput.trim().length}/16</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Avatar Gender</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRenameGender('male')}
                    className={cn(
                      "p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer relative text-left",
                      renameGender === 'male'
                        ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(239,68,68,0.25)] ring-2 ring-primary/40"
                        : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    {renameGender === 'male' && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-xl">♂️</span>
                    </div>
                    <div>
                      <div className="font-headline font-bold text-sm text-foreground">Male</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRenameGender('female')}
                    className={cn(
                      "p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer relative text-left",
                      renameGender === 'female'
                        ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(239,68,68,0.25)] ring-2 ring-primary/40"
                        : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    {renameGender === 'female' && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-xl">♀️</span>
                    </div>
                    <div>
                      <div className="font-headline font-bold text-sm text-foreground">Female</div>
                    </div>
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: AUDIO & FX */}
            <TabsContent value="audio" className="space-y-3 pt-3 focus-visible:outline-none">
              {/* Sound Effects Volume */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-primary" />
                    Sound Effects (SFX) Volume
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">{sfxVolume[0]}%</span>
                </div>
                <Slider
                  value={sfxVolume}
                  onValueChange={setSfxVolume}
                  max={100}
                  step={5}
                  className="py-1 cursor-pointer"
                />
              </div>

              {/* Ambient Music */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Background Ambient Music</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight">Enable atmospheric music during dungeon quizzes</span>
                </div>
                <Switch checked={ambientMusic} onCheckedChange={setAmbientMusic} />
              </div>

              {/* Floating Combat Text */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Floating Combat Text</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight">Render animated damage indicators when attacking</span>
                </div>
                <Switch checked={floatingDamageText} onCheckedChange={setFloatingDamageText} />
              </div>

              {/* Screen Flash on Damage */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Screen Flash on Damage</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight">Red pulse screen flash when taking damage</span>
                </div>
                <Switch checked={hitScreenFlash} onCheckedChange={setHitScreenFlash} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowArenaSettingsDialog(false)}
              className="h-10 rounded-xl px-4 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={renameInput.trim().length < 2 || isSavingSettings}
              className="h-10 rounded-xl px-5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md"
            >
              {isSavingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Save Settings
            </Button>
          </div>
        </form>
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

  // Fetch User Info on mount & whenever synced
  const fetchUser = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      if (profile?.id) currentUserIdRef.current = profile.id;
      if (profile?.name) setInitialProfileName(profile.name);
      const cachedNickname = profile?.id && typeof window !== 'undefined' ? localStorage.getItem(`bq_arena_nickname_${profile.id}`) : null;
      if (profile?.arenaNickname) {
        setUserLastName(profile.arenaNickname);
      } else if (cachedNickname) {
        setUserLastName(cachedNickname);
      } else if (profile?.name) {
        const parts = profile.name.trim().split(/\s+/);
        setUserLastName(parts[parts.length - 1]);
      }
      if (profile?.avatarGender) {
        setAvatarGender(profile.avatarGender as 'male' | 'female');
      } else if (profile?.id && typeof window !== 'undefined') {
        const cachedGender = localStorage.getItem(`bq_arena_gender_${profile.id}`) as 'male' | 'female' | null;
        if (cachedGender) setAvatarGender(cachedGender);
      }
      if (profile?.level) setUserLevel(profile.level);
      if (profile?.xp !== undefined) {
        setUserXp(profile.xp);
        userXpRef.current = profile.xp;
        try {
          localStorage.setItem('boardquest_user_xp', profile.xp.toString());
        } catch (e) { }
      }

      // Load user audio & combat settings
      try {
        const settings = await getUserSettingsAction();
        if (settings) {
          if (settings.sfxVolume !== undefined) setSfxVolume([settings.sfxVolume]);
          if (settings.ambientMusic !== undefined) setAmbientMusic(settings.ambientMusic);
          if (settings.floatingDamageText !== undefined) setFloatingDamageText(settings.floatingDamageText);
          if (settings.hitScreenFlash !== undefined) setHitScreenFlash(settings.hitScreenFlash);
        } else if (typeof window !== 'undefined') {
          const savedSfx = localStorage.getItem('bq_pref_sfx_vol');
          if (savedSfx) setSfxVolume([parseInt(savedSfx, 10)]);
          const savedMusic = localStorage.getItem('bq_pref_ambient_music');
          if (savedMusic !== null) setAmbientMusic(savedMusic === 'true');
          const savedFloating = localStorage.getItem('bq_pref_floating_damage');
          if (savedFloating !== null) setFloatingDamageText(savedFloating === 'true');
          const savedFlash = localStorage.getItem('bq_pref_hit_flash');
          if (savedFlash !== null) setHitScreenFlash(savedFlash === 'true');
        }
      } catch (err) {}

      // Trigger 3-Step Character Setup Onboarding for first-time visitors
      if (profile?.id) {
        const localCompleted = typeof window !== 'undefined' ? localStorage.getItem(`bq_arena_onboarding_completed_${profile.id}`) === 'true' : false;
        if (!profile.hasCompletedArenaOnboarding && !localCompleted) {
          setShowArenaOnboarding(true);
        }
      }
      return profile;
    } catch (e) {
      console.error("Failed to load user level", e);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for stats updates & window focus to keep player level & categories 100% synced dynamically
  useEffect(() => {
    let lastWindowSync = 0;

    const handleStatsUpdate = (e?: any) => {
      fetchUser();
      const updatedFocus = e?.detail?.focusSubject;
      loadCategories(updatedFocus);
    };

    const handleWindowFocusOrVisibility = () => {
      const now = Date.now();
      // Throttle window focus and visibility events to at most once every 3 seconds to avoid bursting in-flight requests
      if (now - lastWindowSync < 3000) return;
      lastWindowSync = now;
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchUser();
        loadCategories();
      }
    };

    window.addEventListener('bq_stats_updated', handleStatsUpdate);
    window.addEventListener('bq_settings_updated', handleStatsUpdate);
    window.addEventListener('visibilitychange', handleWindowFocusOrVisibility);
    window.addEventListener('focus', handleWindowFocusOrVisibility);
    return () => {
      window.removeEventListener('bq_stats_updated', handleStatsUpdate);
      window.removeEventListener('bq_settings_updated', handleStatsUpdate);
      window.removeEventListener('visibilitychange', handleWindowFocusOrVisibility);
      window.removeEventListener('focus', handleWindowFocusOrVisibility);
    };
  }, [fetchUser, loadCategories]);

  // Guard against non-major subjects or topic drills staying in Boss-Battle Mode
  useEffect(() => {
    if ((!isMajorSubject(selectedSubject) || selectedTopicFilter) && quizMode === 'boss-battle') {
      setQuizMode('learning');
      setShowChapterMap(false);
    }
  }, [selectedSubject, selectedTopicFilter, quizMode]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Update left/right scroll indicator visibility
  const updateScrollIndicators = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    // Tolerance to account for subpixel rendering and padding
    const hasOverflow = scrollWidth > clientWidth + 10;

    if (!hasOverflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
  }, []);

  const scrollLeftIsland = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const carouselRect = carousel.getBoundingClientRect();
    const carouselCenter = carouselRect.left + carouselRect.width / 2;
    const buttons = Array.from(carousel.querySelectorAll('button[data-subject]'));
    let closestIdx = dynamicCategories.indexOf(selectedSubject);
    let minDistance = Infinity;

    buttons.forEach((btn, idx) => {
      const rect = btn.getBoundingClientRect();
      const btnCenter = rect.left + rect.width / 2;
      const dist = Math.abs(carouselCenter - btnCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx > 0) {
      isProgrammaticScrollRef.current = true;
      setSelectedSubject(dynamicCategories[closestIdx - 1]);
    } else {
      carousel.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }, [dynamicCategories, selectedSubject]);

  const scrollRightIsland = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const carouselRect = carousel.getBoundingClientRect();
    const carouselCenter = carouselRect.left + carouselRect.width / 2;
    const buttons = Array.from(carousel.querySelectorAll('button[data-subject]'));
    let closestIdx = dynamicCategories.indexOf(selectedSubject);
    let minDistance = Infinity;

    buttons.forEach((btn, idx) => {
      const rect = btn.getBoundingClientRect();
      const btnCenter = rect.left + rect.width / 2;
      const dist = Math.abs(carouselCenter - btnCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx >= 0 && closestIdx < dynamicCategories.length - 1) {
      isProgrammaticScrollRef.current = true;
      setSelectedSubject(dynamicCategories[closestIdx + 1]);
    } else {
      carousel.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }, [dynamicCategories, selectedSubject]);

  // Scroll selected item into view centered
  useEffect(() => {
    if (carouselRef.current) {
      const selectedIdx = dynamicCategories.indexOf(selectedSubject);
      isProgrammaticScrollRef.current = true;
      const selectedButton = (carouselRef.current.querySelector(
        `button[data-subject="${CSS.escape(selectedSubject)}"]`
      ) as HTMLElement) || (selectedIdx >= 0 ? (carouselRef.current.querySelector(`button:nth-child(${selectedIdx + 1})`) as HTMLElement) : null);

      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
      if (programmaticScrollTimerRef.current) {
        clearTimeout(programmaticScrollTimerRef.current);
      }
      programmaticScrollTimerRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        updateScrollIndicators();
      }, 700);

      const timer = setTimeout(updateScrollIndicators, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedSubject, dynamicCategories, updateScrollIndicators]);

  // Sync selectedSubject when user swipes or scrolls through the carousel & update scroll indicators
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      updateScrollIndicators();
      if (isProgrammaticScrollRef.current) {
        return;
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!carousel || isProgrammaticScrollRef.current) return;
        const carouselRect = carousel.getBoundingClientRect();
        const carouselCenter = carouselRect.left + carouselRect.width / 2;
        const buttons = carousel.querySelectorAll('button[data-subject]');
        let closestSubject = selectedSubject;
        let minDistance = Infinity;

        buttons.forEach((btn) => {
          const rect = btn.getBoundingClientRect();
          const btnCenter = rect.left + rect.width / 2;
          const dist = Math.abs(carouselCenter - btnCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestSubject = btn.getAttribute('data-subject') || closestSubject;
          }
        });

        if (closestSubject && closestSubject !== selectedSubject) {
          setSelectedSubject(closestSubject);
        }
      }, 150);
    };

    const handleUserInteraction = () => {
      isProgrammaticScrollRef.current = false;
      if (programmaticScrollTimerRef.current) {
        clearTimeout(programmaticScrollTimerRef.current);
      }
    };

    updateScrollIndicators();
    carousel.addEventListener('scroll', handleScroll, { passive: true });
    carousel.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    carousel.addEventListener('touchstart', handleUserInteraction, { passive: true });
    carousel.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollIndicators();
      });
      resizeObserver.observe(carousel);
    }

    const timer = setTimeout(updateScrollIndicators, 300);

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      carousel.removeEventListener('pointerdown', handleUserInteraction);
      carousel.removeEventListener('touchstart', handleUserInteraction);
      carousel.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('resize', updateScrollIndicators);
      if (resizeObserver) resizeObserver.disconnect();
      clearTimeout(timeoutId);
      clearTimeout(timer);
    };
  }, [dynamicCategories, selectedSubject, updateScrollIndicators]);

  const startQuest = async (limit: number = 50, specificDifficulty?: string, topicOverride?: string | null) => {
    stopBossBattleMusic();
    stopFinalBossMusic();
    stopLearningModeMusic();
    stopTestModeMusic();
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
    setActiveQuizIndex(0);
    setWaveTransition(null);
    setWaveCharOffscreen(false);
    try {
      if (quizMode === 'boss-battle' && specificDifficulty) {
        setBossDifficulty(specificDifficulty);
      }
      const topicToUse = topicOverride !== undefined ? topicOverride : selectedTopicFilter;
      const [selected, freshProfile] = await Promise.all([
        getQuestQuestions(selectedSubject, quizMode, limit, specificDifficulty, topicToUse || undefined),
        getUserProfile().catch(() => null)
      ]);

      if (!selected || selected.length === 0) {
        toast({
          variant: "destructive",
          title: "No Questions Found",
          description: topicToUse
            ? `No approved questions found specifically for "${topicToUse}". Please select another topic or switch to "All Topics".`
            : "There are currently no questions available for this region in the database.",
        });
        return;
      }
      setQuestions(selected);

      // Clean up URL query parameters so refresh or next session isn't locked to topic or subject
      if (typeof window !== 'undefined' && (window.location.search.includes('topic=') || window.location.search.includes('subject='))) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Dynamically sync the latest Player level immediately before battle starts
      let currentLevelForBattle = userLevel;
      try {
        if (freshProfile?.id) currentUserIdRef.current = freshProfile.id;
        const cachedNickname = freshProfile?.id && typeof window !== 'undefined' ? localStorage.getItem(`bq_arena_nickname_${freshProfile.id}`) : null;
        if (freshProfile?.arenaNickname) {
          setUserLastName(freshProfile.arenaNickname);
        } else if (cachedNickname) {
          setUserLastName(cachedNickname);
        } else if (freshProfile?.name) {
          const parts = freshProfile.name.trim().split(/\s+/);
          setUserLastName(parts[parts.length - 1]);
        }
        if (freshProfile?.level) {
          currentLevelForBattle = freshProfile.level;
          setUserLevel(freshProfile.level);
        }
        if (freshProfile?.xp !== undefined) {
          setUserXp(freshProfile.xp);
          userXpRef.current = freshProfile.xp;
          try {
            localStorage.setItem('boardquest_user_xp', freshProfile.xp.toString());
          } catch (e) { }
        }
      } catch (e) {
        console.warn("Failed to load user profile on startQuest", e);
      }

      const hasShieldEffect = equippedItem === 'erlenmeyer_shield' && (inventory.erlenmeyer_shield || 0) > 0;
      const startingHp = quizMode === 'boss-battle' ? calculatePlayerMaxHp(currentLevelForBattle, hasShieldEffect) : 100;

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
        const initialStage = (currentActiveNode.nodeNumber as 1 | 2 | 3 | 4) || 1;

        setBattleStage(initialStage);
        bossStartingHp = calculateEnemyStageHp(initialStage, currentLevelForBattle, specificDifficulty || 'MEDIUM');
      } else if (quizMode === 'learning') {
        setLearningStage(1);
        const activeNodes = getSubjectNodes(selectedSubject);
        const minionNode = activeNodes.find(n => n.tier === 'minion' || n.nodeNumber === 1) || activeNodes[0];
        const miniBossNode = activeNodes.find(n => n.tier === 'mini-boss' || n.nodeNumber === 2) || activeNodes[1] || activeNodes[0];
        const ch1BossNode = activeNodes.find(n => n.tier === 'boss' || n.nodeNumber === 3) || activeNodes[2] || activeNodes[0];
        const finalBossNode = activeNodes.find(n => n.tier === 'final-boss' || n.nodeNumber === 4) || activeNodes[activeNodes.length - 1];
        const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || minionNode;
        const subjectMeta = getSubjectMeta(selectedSubject);
        const wave3BossNode = (currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4) ? finalBossNode : ch1BossNode;

        setLearningWaveEnemies({
          minion: {
            name: minionNode?.bossName || minionNode?.minionName || 'Lab Minion',
            icon: minionNode?.bossIcon || minionNode?.minionIcon || '🧪',
            badge: 'MINION 👾',
            idleSprite: minionNode?.idleSpriteUrl || minionNode?.minionIdleSpriteUrl || null,
            attackSprite: minionNode?.attackSpriteUrl || minionNode?.minionAttackSpriteUrl || null,
            heavyAttackSprite: minionNode?.heavyAttackSpriteUrl || minionNode?.minionHeavyAttackSpriteUrl || null,
            idleFrames: minionNode?.idleFrames || minionNode?.minionIdleFrames || 8,
            attackFrames: minionNode?.attackFrames || minionNode?.minionAttackFrames || 14,
            heavyAttackFrames: minionNode?.heavyAttackFrames || minionNode?.minionHeavyAttackFrames || 10,
            idleFrameWidth: minionNode?.idleFrameWidth || minionNode?.minionIdleFrameWidth || 128,
            idleFrameHeight: minionNode?.idleFrameHeight || minionNode?.minionIdleFrameHeight || 128,
            attackFrameWidth: minionNode?.attackFrameWidth || minionNode?.minionAttackFrameWidth || 257,
            attackFrameHeight: minionNode?.attackFrameHeight || minionNode?.minionAttackFrameHeight || 218,
            heavyFrameWidth: minionNode?.heavyFrameWidth || minionNode?.minionHeavyFrameWidth || 257,
            heavyFrameHeight: minionNode?.heavyFrameHeight || minionNode?.minionHeavyFrameHeight || 218,
            idleDuration: minionNode?.idleDuration || minionNode?.minionIdleDuration || 1.2,
            normalAttackSfxUrl: minionNode?.normalAttackSfxUrl || minionNode?.minionNormalAttackSfxUrl,
            heavyAttackSfxUrl: minionNode?.heavyAttackSfxUrl || minionNode?.minionHeavyAttackSfxUrl,
          },
          enforcer: {
            name: miniBossNode?.bossName || miniBossNode?.miniBossName || 'Diagnostic Spectre',
            icon: miniBossNode?.bossIcon || miniBossNode?.miniBossIcon || '👻',
            badge: 'MINI-BOSS 👹',
            idleSprite: miniBossNode?.idleSpriteUrl || miniBossNode?.miniBossIdleSpriteUrl || null,
            attackSprite: miniBossNode?.attackSpriteUrl || miniBossNode?.miniBossAttackSpriteUrl || null,
            heavyAttackSprite: miniBossNode?.heavyAttackSpriteUrl || miniBossNode?.miniBossHeavyAttackSpriteUrl || null,
            slashSprite: miniBossNode?.miniBossSlashSpriteUrl || null,
            heavyAttackBallsUrl: (miniBossNode as any)?.miniBossHeavyAttackBallsUrl || null,
            idleFrames: miniBossNode?.idleFrames || miniBossNode?.miniBossIdleFrames || 7,
            attackFrames: miniBossNode?.attackFrames || miniBossNode?.miniBossAttackFrames || 17,
            heavyAttackFrames: miniBossNode?.heavyAttackFrames || miniBossNode?.miniBossHeavyAttackFrames || 13,
            idleFrameWidth: miniBossNode?.idleFrameWidth || miniBossNode?.miniBossIdleFrameWidth || 128,
            idleFrameHeight: miniBossNode?.idleFrameHeight || miniBossNode?.miniBossIdleFrameHeight || 128,
            attackFrameWidth: miniBossNode?.attackFrameWidth || miniBossNode?.miniBossAttackFrameWidth || 160,
            attackFrameHeight: miniBossNode?.attackFrameHeight || miniBossNode?.miniBossAttackFrameHeight || 128,
            heavyFrameWidth: miniBossNode?.heavyFrameWidth || miniBossNode?.miniBossHeavyFrameWidth || 128,
            heavyFrameHeight: miniBossNode?.heavyFrameHeight || miniBossNode?.miniBossHeavyFrameHeight || 128,
            idleDuration: miniBossNode?.idleDuration || miniBossNode?.miniBossIdleDuration || 1.0,
            normalAttackSfxUrl: miniBossNode?.normalAttackSfxUrl || miniBossNode?.miniBossNormalAttackSfxUrl,
            heavyAttackSfxUrl: miniBossNode?.heavyAttackSfxUrl || miniBossNode?.miniBossHeavyAttackSfxUrl,
          },
          boss: {
            name: wave3BossNode?.bossName || subjectMeta.enemy,
            icon: wave3BossNode?.bossIcon || '👑',
            badge: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? 'FINAL BOSS 👑' : 'BOSS 👑',
            idleSprite: wave3BossNode?.idleSpriteUrl || subjectMeta?.idleSpriteUrl || null,
            attackSprite: wave3BossNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl || null,
            heavyAttackSprite: wave3BossNode?.heavyAttackSpriteUrl || subjectMeta?.heavyAttackSpriteUrl || null,
            attackProjectileUrl: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? (wave3BossNode?.attackProjectileUrl || finalBossNode?.attackProjectileUrl || null) : (wave3BossNode?.attackProjectileUrl || null),
            attackProjectileFrames: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? (wave3BossNode?.attackProjectileFrames || finalBossNode?.attackProjectileFrames || 5) : (wave3BossNode?.attackProjectileFrames || 5),
            undergroundSpikesUrl: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? (wave3BossNode?.undergroundSpikesUrl || finalBossNode?.undergroundSpikesUrl || null) : (wave3BossNode?.undergroundSpikesUrl || null),
            undergroundSpikesFrames: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? (wave3BossNode?.undergroundSpikesFrames || finalBossNode?.undergroundSpikesFrames || 8) : (wave3BossNode?.undergroundSpikesFrames || 8),
            hammerAttackUrl: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? (wave3BossNode?.hammerAttackUrl || finalBossNode?.hammerAttackUrl || null) : null,
            hammerAttackFrames: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? (wave3BossNode?.hammerAttackFrames || finalBossNode?.hammerAttackFrames || 11) : 11,
            undergroundBlastUrl: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? (wave3BossNode?.undergroundBlastUrl || finalBossNode?.undergroundBlastUrl || null) : null,
            undergroundBlastFrames: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? (wave3BossNode?.undergroundBlastFrames || finalBossNode?.undergroundBlastFrames || 16) : 16,
            lightningAttackUrl: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4 || wave3BossNode?.id === 'is-3') ? (wave3BossNode?.lightningAttackUrl || finalBossNode?.lightningAttackUrl || null) : null,
            lightningAttackFrames: (wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4 || wave3BossNode?.id === 'is-3') ? (wave3BossNode?.lightningAttackFrames || finalBossNode?.lightningAttackFrames || 12) : 12,
            heavyAttackNailedUrl: wave3BossNode?.heavyAttackNailedUrl || null,
            heavyAttackNailedFrames: wave3BossNode?.heavyAttackNailedFrames || 15,
            idleFrames: wave3BossNode?.idleFrames || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.idleFrames : undefined) || subjectMeta?.idleFrames || 6,
            attackFrames: wave3BossNode?.attackFrames || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.attackFrames : undefined) || subjectMeta?.attackFrames || 5,
            heavyAttackFrames: wave3BossNode?.heavyAttackFrames || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.heavyAttackFrames : undefined) || subjectMeta?.heavyAttackFrames || 13,
            idleFrameWidth: wave3BossNode?.idleFrameWidth || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.idleFrameWidth : undefined) || subjectMeta?.idleFrameWidth || 128,
            attackFrameWidth: wave3BossNode?.attackFrameWidth || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.attackFrameWidth : undefined) || subjectMeta?.attackFrameWidth || 128,
            heavyFrameWidth: wave3BossNode?.heavyFrameWidth || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.heavyFrameWidth : undefined) || subjectMeta?.heavyFrameWidth || 480,
            idleFrameHeight: wave3BossNode?.idleFrameHeight || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.idleFrameHeight : undefined) || subjectMeta?.idleFrameHeight || 128,
            attackFrameHeight: wave3BossNode?.attackFrameHeight || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.attackFrameHeight : undefined) || subjectMeta?.attackFrameHeight || 128,
            heavyFrameHeight: wave3BossNode?.heavyFrameHeight || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.heavyFrameHeight : undefined) || subjectMeta?.heavyFrameHeight || 256,
            idleDuration: wave3BossNode?.idleDuration || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.idleDuration : undefined) || subjectMeta?.idleDuration || undefined,
            idleFps: wave3BossNode?.idleFps || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.idleFps : undefined) || subjectMeta?.idleFps || undefined,
            normalAttackSfxUrl: wave3BossNode?.normalAttackSfxUrl || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.normalAttackSfxUrl : undefined) || subjectMeta?.normalAttackSfxUrl,
            heavyAttackSfxUrl: wave3BossNode?.heavyAttackSfxUrl || ((wave3BossNode?.tier === 'final-boss' || wave3BossNode?.nodeNumber === 4) ? finalBossNode?.heavyAttackSfxUrl : undefined) || subjectMeta?.heavyAttackSfxUrl,
          },
        });
      } else if (quizMode === 'test') {
        const activeNodes = getSubjectNodes(selectedSubject);
        const miniBossNode = activeNodes.find(n => n.tier === 'mini-boss' || n.nodeNumber === 2) || activeNodes[1];
        const ch1BossNode = activeNodes.find(n => n.tier === 'boss' || n.nodeNumber === 3) || activeNodes[2];
        const finalBossNode = activeNodes.find(n => n.tier === 'final-boss' || n.nodeNumber === 4) || activeNodes[activeNodes.length - 1];
        const subjectMeta = getSubjectMeta(selectedSubject);

        type TestCandidate = NonNullable<typeof testModeEnemy>;
        const candidates: TestCandidate[] = [];

        // 1. Mini-Boss Candidate
        if (miniBossNode?.idleSpriteUrl || miniBossNode?.miniBossIdleSpriteUrl) {
          candidates.push({
            tier: 'mini-boss',
            nodeId: miniBossNode.id,
            name: miniBossNode.bossName || miniBossNode.miniBossName || 'Diagnostic Spectre',
            icon: miniBossNode.bossIcon || miniBossNode.miniBossIcon || '👻',
            badge: 'MINI-BOSS 👹',
            idleSprite: miniBossNode.idleSpriteUrl || miniBossNode.miniBossIdleSpriteUrl!,
            attackSprite: miniBossNode.attackSpriteUrl || miniBossNode.miniBossAttackSpriteUrl || miniBossNode.idleSpriteUrl || miniBossNode.miniBossIdleSpriteUrl!,
            heavyAttackSprite: miniBossNode.heavyAttackSpriteUrl || miniBossNode.miniBossHeavyAttackSpriteUrl || miniBossNode.attackSpriteUrl || miniBossNode.idleSpriteUrl!,
            slashSprite: miniBossNode.miniBossSlashSpriteUrl || null,
            heavyAttackBallsUrl: (miniBossNode as any)?.miniBossHeavyAttackBallsUrl || null,
            idleFrames: miniBossNode.idleFrames || miniBossNode.miniBossIdleFrames || 7,
            attackFrames: miniBossNode.attackFrames || miniBossNode.miniBossAttackFrames || 17,
            heavyAttackFrames: miniBossNode.heavyAttackFrames || miniBossNode.miniBossHeavyAttackFrames || 13,
            idleFrameWidth: miniBossNode.idleFrameWidth || miniBossNode.miniBossIdleFrameWidth || 128,
            idleFrameHeight: miniBossNode.idleFrameHeight || miniBossNode.miniBossIdleFrameHeight || 128,
            attackFrameWidth: miniBossNode.attackFrameWidth || miniBossNode.miniBossAttackFrameWidth || 160,
            attackFrameHeight: miniBossNode.attackFrameHeight || miniBossNode.miniBossAttackFrameHeight || 128,
            heavyFrameWidth: miniBossNode.heavyFrameWidth || miniBossNode.miniBossHeavyFrameWidth || 128,
            heavyFrameHeight: miniBossNode.heavyFrameHeight || miniBossNode.miniBossHeavyFrameHeight || 128,
            idleDuration: miniBossNode.idleDuration || miniBossNode.miniBossIdleDuration || 1.0,
            normalAttackSfxUrl: miniBossNode.normalAttackSfxUrl || miniBossNode.miniBossNormalAttackSfxUrl,
            heavyAttackSfxUrl: miniBossNode.heavyAttackSfxUrl || miniBossNode.miniBossHeavyAttackSfxUrl,
          });
        }

        // 2. Chapter 1 Boss Candidate
        if (ch1BossNode?.idleSpriteUrl) {
          candidates.push({
            tier: 'boss',
            nodeId: ch1BossNode.id,
            name: ch1BossNode.bossName || subjectMeta.enemy,
            icon: ch1BossNode.bossIcon || '👑',
            badge: 'BOSS 👑',
            idleSprite: ch1BossNode.idleSpriteUrl,
            attackSprite: ch1BossNode.attackSpriteUrl || ch1BossNode.idleSpriteUrl,
            heavyAttackSprite: ch1BossNode.heavyAttackSpriteUrl || ch1BossNode.attackSpriteUrl || ch1BossNode.idleSpriteUrl,
            heavyAttackFistUrl: ch1BossNode.heavyAttackFistUrl || null,
            heavyAttackNailedUrl: ch1BossNode.heavyAttackNailedUrl || null,
            lightningAttackUrl: (ch1BossNode as any).lightningAttackUrl || null,
            lightningAttackFrames: (ch1BossNode as any).lightningAttackFrames || 12,
            idleFrames: ch1BossNode.idleFrames || 8,
            attackFrames: ch1BossNode.attackFrames || 15,
            heavyAttackFrames: ch1BossNode.heavyAttackFrames || 10,
            idleFrameWidth: ch1BossNode.idleFrameWidth || 128,
            idleFrameHeight: ch1BossNode.idleFrameHeight || 128,
            attackFrameWidth: ch1BossNode.attackFrameWidth || 256,
            attackFrameHeight: ch1BossNode.attackFrameHeight || 176,
            heavyFrameWidth: ch1BossNode.heavyFrameWidth || 144,
            heavyFrameHeight: ch1BossNode.heavyFrameHeight || 191,
            idleDuration: ch1BossNode.idleDuration || 1.0,
            normalAttackSfxUrl: ch1BossNode.normalAttackSfxUrl,
            heavyAttackSfxUrl: ch1BossNode.heavyAttackSfxUrl,
          });
        }

        // 3. Chapter 3 Final Boss Candidate
        if (finalBossNode?.idleSpriteUrl) {
          candidates.push({
            tier: 'final-boss',
            nodeId: finalBossNode.id,
            name: finalBossNode.bossName || subjectMeta.enemy,
            icon: finalBossNode.bossIcon || '👑',
            badge: 'FINAL BOSS 👑',
            idleSprite: finalBossNode.idleSpriteUrl,
            attackSprite: finalBossNode.attackSpriteUrl || finalBossNode.idleSpriteUrl,
            heavyAttackSprite: finalBossNode.heavyAttackSpriteUrl || finalBossNode.attackSpriteUrl || finalBossNode.idleSpriteUrl,
            attackProjectileUrl: finalBossNode.attackProjectileUrl || null,
            attackProjectileFrames: finalBossNode.attackProjectileFrames || 5,
            undergroundSpikesUrl: finalBossNode.undergroundSpikesUrl || null,
            undergroundSpikesFrames: finalBossNode.undergroundSpikesFrames || 8,
            hammerAttackUrl: finalBossNode.hammerAttackUrl || null,
            hammerAttackFrames: finalBossNode.hammerAttackFrames || 11,
            undergroundBlastUrl: finalBossNode.undergroundBlastUrl || null,
            undergroundBlastFrames: finalBossNode.undergroundBlastFrames || 16,
            lightningAttackUrl: finalBossNode.lightningAttackUrl || null,
            lightningAttackFrames: finalBossNode.lightningAttackFrames || 12,
            idleFrames: finalBossNode.idleFrames || 6,
            attackFrames: finalBossNode.attackFrames || 6,
            heavyAttackFrames: finalBossNode.heavyAttackFrames || 8,
            idleFrameWidth: finalBossNode.idleFrameWidth || 128,
            idleFrameHeight: finalBossNode.idleFrameHeight || 128,
            attackFrameWidth: finalBossNode.attackFrameWidth || 128,
            attackFrameHeight: finalBossNode.attackFrameHeight || 128,
            heavyFrameWidth: finalBossNode.heavyFrameWidth || 192,
            heavyFrameHeight: finalBossNode.heavyFrameHeight || 160,
            idleDuration: finalBossNode.idleDuration || 1.05,
            normalAttackSfxUrl: finalBossNode.normalAttackSfxUrl,
            heavyAttackSfxUrl: finalBossNode.heavyAttackSfxUrl,
          });
        }

        if (candidates.length > 0) {
          const chosen = candidates[Math.floor(Math.random() * candidates.length)];
          setTestModeEnemy(chosen);
          setSelectedNodeId(chosen.nodeId);
        } else {
          setTestModeEnemy(null);
          setSelectedNodeId(activeNodes[0].id);
        }
      }
      setEnemyHealth(bossStartingHp);
      setTurnCount(0);
      setBossShieldActive(false);
      setPlayerPoisoned(false);
      setBattleOutcome(null);
      setShowBattleLog(false);
      setEarnedQuestXp(null);
      setLeveledUpDetails(null);
      setShowLevelUpPopup(false);

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

  const handleQuestionChange = useCallback((nextIdx: number) => {
    if (nextIdx === activeQuizIndexRef.current) return;
    activeQuizIndexRef.current = nextIdx;

    if (quizMode === 'learning' && questions && questions.length > 0) {
      const currentQ = questions[activeQuizIndex] || questions[0];
      const nextQ = questions[nextIdx] || questions[questions.length - 1];
      const currentDiff = String(currentQ?.difficulty || 'EASY').toUpperCase();
      const nextDiff = String(nextQ?.difficulty || 'EASY').toUpperCase();
      const fromWave = currentDiff === 'EASY' ? 1 : currentDiff === 'MEDIUM' ? 2 : 3;
      const toWave = nextDiff === 'EASY' ? 1 : nextDiff === 'MEDIUM' ? 2 : 3;

      if (toWave > fromWave) {
        // A wave transition is occurring!
        const waveQuestions = questions.filter(q => String(q.difficulty || 'EASY').toUpperCase() === currentDiff);
        const requiredToDefeat = Math.max(1, Math.ceil(waveQuestions.length * 0.65));
        const correctInWave = userAnswers.filter((ans, idx) => {
          const qDiff = String(ans.difficulty || questions[idx]?.difficulty || 'EASY').toUpperCase();
          return ans.isCorrect && qDiff === currentDiff;
        }).length;
        const wasDefeated = correctInWave >= requiredToDefeat || enemyHealth <= 0;

        const nextWaveState = getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, toWave as 1 | 2 | 3, nextIdx);

        // Phase 1: Display the Previous Wave Outcome Tag & Verdict first
        if (wasDefeated) {
          try {
            playSfx('correct');
          } catch (e) {}
        }

        // Start characters sliding offscreen and display Phase 1 Outcome
        setWaveCharOffscreen(true);

        setWaveTransition({
          stage: 'outcome',
          fromWave: fromWave as 1 | 2,
          toWave: toWave as 2 | 3,
          wasDefeated,
          incomingEnemyName: nextWaveState.name,
          incomingEnemyBadge: nextWaveState.badge,
        });

        // Phase 2: After 1400ms, transition smoothly to the Next Wave Threat Arrival
        setTimeout(() => {
          try {
            playDebuffSound();
          } catch (e) {}

          activeQuizIndexRef.current = nextIdx;
          setActiveQuizIndex(nextIdx);
          setEnemyHealth(100);
          setLearningStage(toWave as 1 | 2 | 3);
          setWaveTransition(prev => prev ? { ...prev, stage: 'arrival' } : null);
        }, 1400);

        // After Phase 2 completes (2800ms): dissolve the banner, then smoothly show the slide-in transition of Player & Enemy into the clear arena
        setTimeout(() => {
          setWaveTransition(null);

          // Once banner overlay dissolves, trigger Player & Enemy to glide smoothly into the clear arena
          setTimeout(() => {
            setWaveCharOffscreen(false);
          }, 60);
        }, 2800);
        return;
      }
    }

    setActiveQuizIndex(nextIdx);
  }, [quizMode, questions, activeQuizIndex, userAnswers, enemyHealth, selectedSubject, learningWaveEnemies, getLearningWaveState]);

  const handleAnswer = (isCorrect: boolean, index: number, letter: string, action?: 'heavy' | 'normal' | 'defend', questionData?: Question) => {
    setUserAnswers(prev => [...prev, {
      questionIndex: index,
      selectedLetter: letter,
      isCorrect,
      questionId: questionData?.id,
      difficulty: questionData?.difficulty
    }]);

    // All XP, streaks, badges, and level-ups are strictly awarded upon completed quests via completeQuest

    const activeNodes = getSubjectNodes(selectedSubject);
    const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
    const isChapter3FinalBoss = currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4;
    const subjectMeta = getSubjectMeta(selectedSubject);
    let bossAttackResetDelay = 1000;

    let currentEnemyName = subjectMeta.enemy;
    const currentWaveStage = quizMode === 'learning'
      ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex).waveStage
      : null;

    if (quizMode === 'boss-battle') {
      currentEnemyName = currentActiveNode.bossName;
    } else if (quizMode === 'learning') {
      const waveState = getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex);
      currentEnemyName = waveState.name;
    } else if (quizMode === 'test' && testModeEnemy) {
      currentEnemyName = testModeEnemy.name;
    } else {
      currentEnemyName = subjectMeta.enemy;
    }

    const isBiohazardOverlord = Boolean(
      currentEnemyName?.toLowerCase().includes('biohazard') ||
      currentActiveNode?.bossName?.toLowerCase().includes('biohazard') ||
      currentActiveNode?.id === 'mb-3' ||
      currentActiveNode?.idleSpriteUrl?.includes('microbio_finalboss') ||
      currentActiveNode?.attackSpriteUrl?.includes('microbio_finalboss') ||
      (selectedSubject === 'Microbiology' && (
        isChapter3FinalBoss ||
        (quizMode === 'boss-battle' && (battleStage === 3 || isChapter3FinalBoss)) ||
        (quizMode === 'learning' && (currentWaveStage === 3 || currentEnemyName?.toLowerCase().includes('biohazard')))
      ))
    );

    const isSpecterBoss = !currentEnemyName?.toLowerCase().includes('nitrite') && Boolean(
      currentEnemyName?.toLowerCase().includes('specter') ||
      currentActiveNode?.bossName?.toLowerCase().includes('specter') ||
      currentActiveNode?.id === 'cc-3' ||
      currentActiveNode?.idleSpriteUrl?.includes('clinchem_finalboss') ||
      currentActiveNode?.attackSpriteUrl?.includes('clinchem_finalboss') ||
      (selectedSubject === 'Clinical Chemistry' && (
        isChapter3FinalBoss ||
        (quizMode === 'boss-battle' && isChapter3FinalBoss) ||
        (quizMode === 'learning' && currentWaveStage === 3 && (currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4 || currentActiveNode?.id === 'cc-4' || currentEnemyName?.toLowerCase().includes('specter')))
      ))
    );

    const plannedAttackType: 'normal_attack' | 'heavy_attack' = (quizMode === 'learning' || quizMode === 'test')
      ? (Math.random() < 0.5 ? 'normal_attack' : 'heavy_attack')
      : (action === 'heavy' ? 'heavy_attack' : 'normal_attack');

    const isSpecterNormalAttack = isSpecterBoss && plannedAttackType === 'normal_attack';

    const isCrystalGolemBoss = Boolean(
      currentEnemyName?.toLowerCase().includes('crystal golem') ||
      currentActiveNode?.bossName?.toLowerCase().includes('crystal golem') ||
      currentActiveNode?.id === 'cm-3' ||
      currentActiveNode?.idleSpriteUrl?.includes('clinmicro_finalboss') ||
      currentActiveNode?.attackSpriteUrl?.includes('clinmicro_finalboss') ||
      ((selectedSubject.toLowerCase().includes('microscopy') || selectedSubject.toLowerCase().includes('parasit')) && (
        isChapter3FinalBoss ||
        (quizMode === 'boss-battle' && (battleStage === 3 || isChapter3FinalBoss)) ||
        (quizMode === 'learning' && (currentWaveStage === 3 || currentEnemyName?.toLowerCase().includes('crystal golem')))
      ))
    );

    const isMicrobeSwarm = Boolean(
      currentEnemyName?.toLowerCase().includes('microbe swarm') ||
      currentActiveNode?.minionName?.toLowerCase().includes('microbe swarm') ||
      ((quizMode === 'boss-battle' ? battleStage === 1 : quizMode === 'learning' ? currentWaveStage === 1 : false) && currentActiveNode?.id === 'mb-1')
    );

    const isSickleCellMinion = Boolean(
      (currentEnemyName?.toLowerCase().includes('sickle cell') && !currentEnemyName?.toLowerCase().includes('reaper')) ||
      ((quizMode === 'boss-battle' ? battleStage === 1 : quizMode === 'learning' ? currentWaveStage === 1 : false) && (
        currentActiveNode?.minionName?.toLowerCase().includes('sickle cell') ||
        currentActiveNode?.minionIdleSpriteUrl?.includes('hematology_chapterOneMinion') ||
        (selectedSubject === 'Hematology' && currentActiveNode?.id === 'hem-1')
      ))
    );

    const isAnemiaShade = Boolean(
      currentEnemyName?.toLowerCase().includes('anemia') ||
      ((quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? currentWaveStage === 2 : false) && (
        currentActiveNode?.miniBossName?.toLowerCase().includes('anemia') ||
        currentActiveNode?.miniBossIdleSpriteUrl?.includes('hematology_chapterOneMiniBoss') ||
        (selectedSubject === 'Hematology' && (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-2'))
      ))
    );

    const isSickleCellReaper = !isSickleCellMinion && !isAnemiaShade && Boolean(
      currentEnemyName?.toLowerCase().includes('reaper') ||
      (currentEnemyName?.toLowerCase().includes('sickle') && !currentEnemyName?.toLowerCase().includes('sickle cell')) ||
      currentActiveNode?.bossName?.toLowerCase().includes('reaper') ||
      currentActiveNode?.id === 'hem-4' ||
      currentActiveNode?.idleSpriteUrl?.includes('hematology_finalboss') ||
      currentActiveNode?.attackSpriteUrl?.includes('hematology_finalboss') ||
      currentActiveNode?.heavyAttackSpriteUrl?.includes('hematology_finalboss') ||
      (selectedSubject === 'Hematology' && (currentActiveNode?.id === 'hem-4' || currentActiveNode?.tier === 'final-boss') && (quizMode === 'learning' ? currentWaveStage === 3 : true))
    );

    const isStaphSentinel = Boolean(
      currentEnemyName?.toLowerCase().includes('staph') ||
      currentActiveNode?.miniBossName?.toLowerCase().includes('staph') ||
      ((quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? currentWaveStage === 2 : false) && (currentActiveNode?.id === 'mb-1' || currentActiveNode?.id === 'mb-2'))
    );

    const isReagentStripSlime = Boolean(
      currentEnemyName?.toLowerCase().includes('reagent strip') ||
      (currentEnemyName?.toLowerCase().includes('slime') && !currentEnemyName?.toLowerCase().includes('acid')) ||
      currentActiveNode?.minionName?.toLowerCase().includes('reagent strip') ||
      currentActiveNode?.minionIdleSpriteUrl?.includes('clinmicro_chapterOneMinion') ||
      (selectedSubject.toLowerCase().includes('microscopy') && currentActiveNode?.id === 'cm-1' && (quizMode === 'boss-battle' ? battleStage === 1 : quizMode === 'learning' ? currentWaveStage === 1 : false))
    );

    const isAcidSlime = !isSpecterBoss && !isReagentStripSlime && Boolean(
      currentEnemyName?.toLowerCase().includes('acid slime') ||
      (currentEnemyName?.toLowerCase().includes('slime') && !currentEnemyName?.toLowerCase().includes('reagent')) ||
      currentActiveNode?.minionName?.toLowerCase().includes('acid slime') ||
      currentActiveNode?.minionIdleSpriteUrl?.includes('clinchem_chapterOneMinion') ||
      (selectedSubject === 'Clinical Chemistry' && currentActiveNode?.id === 'cc-1' && (quizMode === 'boss-battle' ? battleStage === 1 : quizMode === 'learning' ? currentWaveStage === 1 : false))
    );

    const isGmsFungalSpore = Boolean(
      (currentEnemyName?.toLowerCase().includes('fungal spore') && !currentEnemyName?.toLowerCase().includes('paraffin')) ||
      (currentEnemyName?.toLowerCase().includes('gms') && !currentEnemyName?.toLowerCase().includes('paraffin')) ||
      ((quizMode === 'boss-battle' ? battleStage === 1 : quizMode === 'learning' ? currentWaveStage === 1 : false) && (
        currentActiveNode?.minionName?.toLowerCase().includes('fungal spore') ||
        currentActiveNode?.minionIdleSpriteUrl?.includes('hispatho_chapterOneMinion') ||
        ((selectedSubject.toLowerCase().includes('histo') || selectedSubject.toLowerCase().includes('law')) && currentActiveNode?.id === 'hp-1')
      ))
    );

    const isGramPositiveBoss = Boolean(
      currentEnemyName?.toLowerCase().includes('gram positive') ||
      currentActiveNode?.bossName?.toLowerCase().includes('gram positive') ||
      ((quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? currentWaveStage === 3 : false) && (currentActiveNode?.id === 'mb-1' || currentActiveNode?.id === 'mb-3'))
    );

    const isLymphocyteSwarm = Boolean(
      currentEnemyName?.toLowerCase().includes('lymphocyte') ||
      currentActiveNode?.minionName?.toLowerCase().includes('lymphocyte') ||
      currentActiveNode?.minionIdleSpriteUrl?.includes('immunohema_chapterOneMinion') ||
      ((selectedSubject.toLowerCase().includes('immuno') || selectedSubject.toLowerCase().includes('serology')) && currentActiveNode?.id === 'is-1' && (quizMode === 'boss-battle' ? battleStage === 1 : quizMode === 'learning' ? currentWaveStage === 1 : false))
    );

    const isHyperglycemicMutant = !isSpecterBoss && Boolean(
      currentEnemyName?.toLowerCase().includes('mutant') ||
      currentEnemyName?.toLowerCase().includes('hyperglemic mutant') ||
      currentEnemyName?.toLowerCase().includes('hyperglycemic mutant') ||
      currentActiveNode?.miniBossName?.toLowerCase().includes('mutant') ||
      currentActiveNode?.miniBossIdleSpriteUrl?.includes('clinchem_chapterOneMiniBoss') ||
      (selectedSubject === 'Clinical Chemistry' && (currentActiveNode?.id === 'cc-1' || currentActiveNode?.id === 'cc-2') && (quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? currentWaveStage === 2 : false))
    );

    const isHydraBoss = Boolean(
      currentEnemyName?.toLowerCase().includes('hydra') ||
      currentActiveNode?.bossName?.toLowerCase().includes('hydra') ||
      ((selectedSubject.toLowerCase().includes('immuno') || selectedSubject.toLowerCase().includes('serology')) && (currentActiveNode?.id === 'is-4' || currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4) && (quizMode === 'boss-battle' ? (battleStage === 3 || battleStage === 4) : quizMode === 'learning' ? currentWaveStage === 3 : false))
    );

    const isKetoacidosisColossus = Boolean(
      currentEnemyName?.toLowerCase().includes('ketoacidosis') ||
      (currentEnemyName?.toLowerCase().includes('colossus') && !currentEnemyName?.toLowerCase().includes('erythrocyte')) ||
      currentActiveNode?.bossName?.toLowerCase().includes('ketoacidosis') ||
      (currentActiveNode?.bossName?.toLowerCase().includes('colossus') && !currentActiveNode?.bossName?.toLowerCase().includes('erythrocyte')) ||
      (selectedSubject === 'Clinical Chemistry' && (currentActiveNode?.id === 'cc-1' || currentActiveNode?.id === 'cc-3') && (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? currentWaveStage === 3 : false))
    );

    const isLegalBeholder = Boolean(
      currentEnemyName?.toLowerCase().includes('legal beholder') ||
      currentActiveNode?.bossName?.toLowerCase().includes('legal beholder') ||
      ((selectedSubject.toLowerCase().includes('histo') || selectedSubject.toLowerCase().includes('law')) && (currentActiveNode?.id === 'hp-4' || currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4) && (quizMode === 'boss-battle' ? (battleStage === 3 || battleStage === 4) : quizMode === 'learning' ? currentWaveStage === 3 : false))
    );

    const isAntigenTitan = !isLymphocyteSwarm && Boolean(
      currentEnemyName?.toLowerCase().includes('antigen') ||
      ((quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? currentWaveStage === 2 : (quizMode === 'test' ? testModeEnemy?.tier === 'mini-boss' : false)) && (
        currentActiveNode?.miniBossName?.toLowerCase().includes('antigen') ||
        currentActiveNode?.miniBossIdleSpriteUrl?.includes('immunohema_chapterOneMiniBoss') ||
        ((selectedSubject.toLowerCase().includes('immuno') || selectedSubject.toLowerCase().includes('serology')) && (currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-2'))
      ))
    );

    const isErythrocyteColossusBoss = !isSickleCellMinion && !isAnemiaShade && !isSickleCellReaper && Boolean(
      currentEnemyName?.toLowerCase().includes('erythrocyte') ||
      currentActiveNode?.bossName?.toLowerCase().includes('erythrocyte') ||
      currentActiveNode?.idleSpriteUrl?.includes('hematology_chapterOneBoss') ||
      (selectedSubject === 'Hematology' && (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-3') && (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? currentWaveStage === 3 : false))
    );

    const isParaffinGolem = !isGmsFungalSpore && !isLegalBeholder && Boolean(
      currentEnemyName?.toLowerCase().includes('paraffin') ||
      (currentEnemyName?.toLowerCase().includes('golem') && !currentEnemyName?.toLowerCase().includes('crystal')) ||
      currentActiveNode?.miniBossName?.toLowerCase().includes('paraffin') ||
      currentActiveNode?.miniBossIdleSpriteUrl?.includes('hispatho_chapterOneMiniBoss') ||
      ((selectedSubject.toLowerCase().includes('histo') || selectedSubject.toLowerCase().includes('law')) && (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-2') && (quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? currentWaveStage === 2 : false))
    );

    const isFixationOverlord = !isGmsFungalSpore && !isParaffinGolem && !isLegalBeholder && Boolean(
      currentEnemyName?.toLowerCase().includes('fixation') ||
      currentActiveNode?.bossName?.toLowerCase().includes('fixation') ||
      currentActiveNode?.idleSpriteUrl?.includes('hispatho_chapterOneBoss') ||
      ((selectedSubject.toLowerCase().includes('histo') || selectedSubject.toLowerCase().includes('law')) && (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-3') && (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? currentWaveStage === 3 : false))
    );

    const isNitriteSpectreBoss = Boolean(
      currentEnemyName?.toLowerCase().includes('nitrite') ||
      currentActiveNode?.miniBossName?.toLowerCase().includes('nitrite') ||
      currentActiveNode?.bossName?.toLowerCase().includes('nitrite') ||
      currentActiveNode?.id === 'cm-2'
    );
    const shouldSuppressWrongSfx = isSpecterBoss || isSpecterNormalAttack || isBiohazardOverlord || isCrystalGolemBoss || isMicrobeSwarm || isSickleCellMinion || isSickleCellReaper || isStaphSentinel || isAcidSlime || isGramPositiveBoss || isGmsFungalSpore || isLymphocyteSwarm || isHyperglycemicMutant || isHydraBoss || isKetoacidosisColossus || isLegalBeholder || isAntigenTitan || isAnemiaShade || isErythrocyteColossusBoss || isParaffinGolem || isFixationOverlord || isNitriteSpectreBoss;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      playSfx('correct');
      if (quizMode === 'boss-battle' || quizMode === 'learning') {
        setTimeout(() => playSfx('attack'), 150);
      }
    } else {
      setStreak(0);
      if (!shouldSuppressWrongSfx) {
        playSfx('wrong');
      }
    }

    let enemyDmg = 0;
    let playerDmg = 0;
    let playerHeal = 0;
    let isCritHit = false;

    let newPoisonedState = playerPoisoned;
    let newShieldState = bossShieldActive;
    let didInflictPoison = false;

    if (quizMode === 'boss-battle') {
      const playerStats = calculatePlayerStats(userLevel, streak, equippedItem);

      // Roll Critical Strike chance based on Player's Crit Rate attribute
      isCritHit = isCorrect && (Math.random() * 100 < playerStats.critRate);
      const critMultiplier = isCritHit ? 1.5 : 1.0;

      // Base boss hit scales to player's Max HP (~22% of player's Max HP before defense)
      const enemyBaseHit = playerStats.maxHp * 0.22;

      // Apply poison tick at the very start of the turn (skip if Player selected Defend/Heal)
      if (playerPoisoned && action !== 'defend') {
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
            playerDmg = 0; // Ensure zero damage when Defend/Heal is used
          } else {
            playerDmg += enemyBaseHit * 0.5;
          }
        } else {
          // normal
          if (isCorrect) {
            if (!bossShieldActive || (battleStage !== 3 && battleStage !== 4)) {
              enemyDmg = playerStats.totalDamage * critMultiplier;
            } else {
              // Shield absorbed the hit (Stage 3 Chapter Boss and Stage 4 Final Boss have shields!)
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
        if ((battleStage === 3 || battleStage === 4) && !isCorrect) {
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
          didInflictPoison = true;
          newPoisonedState = true;
          toast({
            title: "POISONED! ☠️",
            description: battleStage === 2
              ? "The Mini-Boss inflicted a toxic debuff! Use Defend to cure it."
              : battleStage === 4
                ? "The Final Boss inflicted a toxic debuff! Use Defend to cure it."
                : "The Chapter Boss inflicted a toxic debuff! Use Defend to cure it.",
            variant: "destructive"
          });
        }

        // Buffered Saline Consumable Effect (Nullifies 1st Poison/Debuff)
        if (equippedItem === 'buffered_saline' && !salineUsedThisBattle && (inventory.buffered_saline || 0) > 0) {
          if (newPoisonedState || (!isCorrect && playerDmg > 0)) {
            newPoisonedState = false;
            didInflictPoison = false;
            setSalineUsedThisBattle(true);
            addFloatingText('player', 'DEBUFF NULLIFIED! 🧪💧', 'text-emerald-400');
            toast({
              title: "Buffered Saline Activated! 🧪💧",
              description: "Your Buffered Saline neutralized the toxic affliction!",
            });
            setInventory(prev => ({ ...prev, buffered_saline: Math.max(0, (prev.buffered_saline || 0) - 1) }));
          }
        }

        // Shield Mechanics: Stage 3 Chapter Boss and Stage 4 Final Boss cast shield! (Every 4 turns, and NOT when defeated!)
        if ((battleStage === 3 || battleStage === 4) && (turnCount + 1) % 4 === 0 && !willEnemyBeDefeated && enemyHealth > 0) {
          newShieldState = true;
          toast({
            title: "Boss Casts Shield! 🛡️",
            description: battleStage === 4
              ? "The Final Boss puts up an impervious shield. Only Heavy attacks can shatter it!"
              : "The Chapter Boss puts up a magical shield. Only Heavy attacks can shatter it!",
            variant: "destructive"
          });
        } else if ((battleStage < 3 && battleStage !== 4) || willEnemyBeDefeated) {
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
      const waveState = getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex);
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
          setEnemyHealth(0);
          setBossShieldActive(false);
          setPlayerPoisoned(false);
          const currentScore = userAnswers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
          // Allow player's winning attack animation (1200ms) to complete smoothly before Victory displays!
          setTimeout(() => {
            playBossBattleMusic('victory');
            handleFinish(currentScore, 'victory');
          }, 800);
        } else if (quizMode === 'learning' && nextHp <= 0) {
          setEnemyHealth(0);
          setIsAnimating("enemy");
          setBossAnimState('idle');
          if (currentWaveStage === 1) {
            addFloatingText('enemy', '👾 MINION DEFEATED!', 'text-amber-300 font-black');
            toast({
              title: "👾 Wave 1 Minion Slain!",
              description: "You defeated the Minion! Complete the wave to face the Mini-Boss!",
            });
          } else if (currentWaveStage === 2) {
            addFloatingText('enemy', '👹 MINI-BOSS DEFEATED!', 'text-red-400 font-black');
            toast({
              title: "👹 Wave 2 Mini-Boss Slain!",
              description: "The Mini-Boss has fallen! The Final Boss awaits!",
            });
          } else {
            addFloatingText('enemy', '👑 BOSS DEFEATED!', 'text-yellow-300 font-black');
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
        if (didInflictPoison) {
          playDebuffSound();
          addFloatingText('player', '☠️ POISONED!', 'text-purple-400 font-black');
        }
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
            // Allow the enemy's fatal attack animation to finish completely before Game Over displays!
            setTimeout(() => {
              addFloatingText('player', '💀 ASPIRANT DEFEATED!', 'text-red-600 font-black');
              setJudgementText('GAME OVER');
              if (quizMode === 'boss-battle') {
                playBossBattleMusic('defeat');
              } else if (quizMode === 'test') {
                playTestModeMusic('defeat');
              } else {
                playSfx('wrong');
              }
              toast({
                variant: "destructive",
                title: "💀 Defeated in Arena!",
                description: "Your health dropped to 0. Review your answer performance to strengthen your weak areas!",
              });

              if (quizMode === 'boss-battle') {
                // For Boss-Battle Mode, handleFinish will transition ONLY after MusicWhenLostInBossBattleMode has played!
                const currentScore = userAnswers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
                handleFinish(currentScore, 'defeat');
              } else if (quizMode === 'test') {
                // For Test Mode, handleFinish will transition ONLY after MusicWhenLostInTestMode has played!
                const currentScore = userAnswers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
                handleFinish(currentScore, 'defeat');
              } else {
                setTimeout(() => {
                  setJudgementText(null);
                  const currentScore = userAnswers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
                  handleFinish(currentScore, 'defeat');
                }, 1800);
              }
            }, 800);
          }
        }
      };

      // Trigger Boss Attack animation & physical lunge ONLY on player mistake (!isCorrect)
      if (!isCorrect) {
        const activeNodes = getSubjectNodes(selectedSubject);
        const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
        const subjectMeta = getSubjectMeta(selectedSubject);
        const isSpikesAttack = !isSickleCellMinion && !isAnemiaShade && Boolean(
          currentEnemyName?.toLowerCase().includes('reaper') ||
          (quizMode !== 'test' && (currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4 || currentActiveNode?.id === 'hem-4' || currentActiveNode?.bossName?.toLowerCase().includes('reaper')) && (currentActiveNode?.undergroundSpikesUrl || subjectMeta?.undergroundSpikesUrl)) ||
          (quizMode === 'test' && testModeEnemy?.tier === 'final-boss' && selectedSubject === 'Hematology') ||
          (selectedSubject === 'Hematology' && (currentActiveNode?.id === 'hem-4' || currentActiveNode?.tier === 'final-boss'))
        );
        const isGramPositiveBoss = Boolean(
          currentEnemyName?.toLowerCase().includes('gram positive') ||
          (quizMode === 'boss-battle' && battleStage === 3 && (currentActiveNode?.id === 'mb-1' || currentActiveNode?.id === 'mb-3')) ||
          (quizMode === 'learning' && currentWaveStage === 3 && (currentActiveNode?.id === 'mb-1' || currentActiveNode?.id === 'mb-3'))
        );
        const isStaphSentinel = Boolean(
          currentEnemyName?.toLowerCase().includes('staph') ||
          (quizMode === 'boss-battle' && battleStage === 2 && (currentActiveNode?.id === 'mb-1' || currentActiveNode?.id === 'mb-2')) ||
          (quizMode === 'learning' && currentWaveStage === 2 && (currentActiveNode?.id === 'mb-1' || currentActiveNode?.id === 'mb-2'))
        );
        const isBiohazardBoss = Boolean(
          currentEnemyName?.toLowerCase().includes('biohazard') ||
          ((quizMode === 'boss-battle' || quizMode === 'learning') && (currentActiveNode?.id === 'mb-4' || currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4))
        );
        const isCrystalGolemBoss = Boolean(
          currentEnemyName?.toLowerCase().includes('crystal golem') ||
          ((quizMode === 'boss-battle' || quizMode === 'learning') && (currentActiveNode?.id === 'cm-4' || currentActiveNode?.tier === 'final-boss' || (currentActiveNode?.nodeNumber === 4 && (selectedSubject.toLowerCase().includes('microscopy') || selectedSubject.toLowerCase().includes('parasit')))))
        );
        const isLegalBeholderBoss = Boolean(
          currentEnemyName?.toLowerCase().includes('legal beholder') ||
          ((quizMode === 'boss-battle' || quizMode === 'learning') && (currentActiveNode?.id === 'hp-4' || currentActiveNode?.tier === 'final-boss' || (currentActiveNode?.nodeNumber === 4 && (selectedSubject.toLowerCase().includes('histo') || selectedSubject.toLowerCase().includes('law')))))
        );
        const isHydraBoss = Boolean(
          currentEnemyName?.toLowerCase().includes('hydra') ||
          (
            (selectedSubject.toLowerCase().includes('immuno') || selectedSubject.toLowerCase().includes('serology')) &&
            (currentActiveNode?.id === 'is-4' || currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4 || currentActiveNode?.bossName?.toLowerCase().includes('hydra')) &&
            (quizMode === 'boss-battle'
              ? (battleStage === 3 || battleStage === 4 || isChapter3FinalBoss)
              : quizMode === 'learning'
                ? (currentWaveStage === 3 || isChapter3FinalBoss)
                : isChapter3FinalBoss)
          )
        );

        const attackType = plannedAttackType;
        setBossAnimState(attackType);
        const isSpikes = attackType === 'normal_attack' && isSpikesAttack;
        const isGramPositiveHeavy = isGramPositiveBoss && attackType === 'heavy_attack';
        const isGramPositiveNormal = isGramPositiveBoss && attackType === 'normal_attack';
        const isStaphSentinelHeavy = isStaphSentinel && attackType === 'heavy_attack';
        const isStaphSentinelNormal = isStaphSentinel && attackType === 'normal_attack';
        const isBiohazardHeavy = isBiohazardBoss && attackType === 'heavy_attack';
        const isBiohazardNormal = isBiohazardBoss && attackType === 'normal_attack';
        const isLegalBeholderNormal = isLegalBeholderBoss && attackType === 'normal_attack';
        const isLegalBeholderHeavy = isLegalBeholderBoss && attackType === 'heavy_attack';
        const isCrystalGolemHeavy = isCrystalGolemBoss && attackType === 'heavy_attack';
        const isCrystalGolemNormal = isCrystalGolemBoss && attackType === 'normal_attack';
        const isMicrobeSwarmHeavy = isMicrobeSwarm && attackType === 'heavy_attack';
        const isMicrobeSwarmNormal = isMicrobeSwarm && attackType === 'normal_attack';
        const isSickleCellReaperHeavy = isSickleCellReaper && attackType === 'heavy_attack';
        const isSickleCellMinionHeavy = isSickleCellMinion && attackType === 'heavy_attack';
        const isSickleCellMinionNormal = isSickleCellMinion && attackType === 'normal_attack';
        const isAcidSlimeHeavy = isAcidSlime && attackType === 'heavy_attack';
        const isAcidSlimeNormal = isAcidSlime && attackType === 'normal_attack';
        const isGmsFungalSporeHeavy = isGmsFungalSpore && attackType === 'heavy_attack';
        const isGmsFungalSporeNormal = isGmsFungalSpore && attackType === 'normal_attack';
        const isReagentStripSlimeHeavy = isReagentStripSlime && attackType === 'heavy_attack';
        const isReagentStripSlimeNormal = isReagentStripSlime && attackType === 'normal_attack';
        const isLymphocyteSwarmHeavy = isLymphocyteSwarm && attackType === 'heavy_attack';
        const isLymphocyteSwarmNormal = isLymphocyteSwarm && attackType === 'normal_attack';
        const isHydraHeavy = isHydraBoss && attackType === 'heavy_attack';
        const isHydraNormal = isHydraBoss && attackType === 'normal_attack';
        const isHyperglycemicMutantHeavy = isHyperglycemicMutant && attackType === 'heavy_attack';
        const isHyperglycemicMutantNormal = isHyperglycemicMutant && attackType === 'normal_attack';
        const isKetoacidosisColossusHeavy = isKetoacidosisColossus && attackType === 'heavy_attack';
        const isKetoacidosisColossusNormal = isKetoacidosisColossus && attackType === 'normal_attack';
        const isAntigen = !isLymphocyteSwarm && Boolean(
          currentEnemyName?.toLowerCase().includes('antigen') ||
          ((quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? currentWaveStage === 2 : (quizMode === 'test' ? testModeEnemy?.tier === 'mini-boss' : false)) && (
            currentActiveNode?.miniBossName?.toLowerCase().includes('antigen') ||
            currentActiveNode?.miniBossIdleSpriteUrl?.includes('immunohema_chapterOneMiniBoss') ||
            ((selectedSubject.toLowerCase().includes('immuno') || selectedSubject.toLowerCase().includes('serology')) && (currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-2'))
          ))
        );
        const isAntigenTitanHeavy = isAntigen && attackType === 'heavy_attack';
        const isAntigenTitanNormal = isAntigen && attackType === 'normal_attack';
        const isAnemia = !isSickleCellMinion && Boolean(
          currentEnemyName?.toLowerCase().includes('anemia') ||
          ((quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? currentWaveStage === 2 : (quizMode === 'test' ? testModeEnemy?.tier === 'mini-boss' : false)) && (
            currentActiveNode?.miniBossName?.toLowerCase().includes('anemia') ||
            currentActiveNode?.miniBossIdleSpriteUrl?.includes('hematology_chapterOneMiniBoss') ||
            (selectedSubject === 'Hematology' && (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-2'))
          ))
        );
        const isAnemiaShadeHeavy = isAnemia && attackType === 'heavy_attack';
        const isAnemiaShadeNormal = isAnemia && attackType === 'normal_attack';
        const isImmuneArchonBoss = !isLymphocyteSwarm && !isHydraBoss && Boolean(
          currentEnemyName?.toLowerCase().includes('immune archon') ||
          (currentEnemyName?.toLowerCase().includes('archon') && !currentEnemyName?.toLowerCase().includes('hydra')) ||
          currentActiveNode?.bossName?.toLowerCase().includes('immune archon') ||
          currentActiveNode?.idleSpriteUrl?.includes('immunohema_chapterOneBoss') ||
          (
            (selectedSubject.toLowerCase().includes('immuno') || selectedSubject.toLowerCase().includes('serology')) &&
            (currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-3') &&
            (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? currentWaveStage === 3 : true)
          )
        );
        const isImmuneArchonHeavy = isImmuneArchonBoss && attackType === 'heavy_attack';
        const isImmuneArchonNormal = isImmuneArchonBoss && attackType === 'normal_attack';
        const isErythrocyteColossusHeavy = isErythrocyteColossusBoss && attackType === 'heavy_attack';
        const isErythrocyteColossusNormal = isErythrocyteColossusBoss && attackType === 'normal_attack';
        const isParaffinGolemHeavy = isParaffinGolem && attackType === 'heavy_attack';
        const isParaffinGolemNormal = isParaffinGolem && attackType === 'normal_attack';
        const isFixationOverlordHeavy = isFixationOverlord && attackType === 'heavy_attack';
        const isFixationOverlordNormal = isFixationOverlord && attackType === 'normal_attack';
        const isNitriteSpectreHeavy = isNitriteSpectreBoss && attackType === 'heavy_attack';
        const isNitriteSpectreNormal = isNitriteSpectreBoss && attackType === 'normal_attack';


        const resetDelay = isSpikes
          ? 1050
          : isNitriteSpectreHeavy
            ? 2700
            : isNitriteSpectreNormal
              ? 2600
          : isFixationOverlordHeavy
            ? 1550
            : isFixationOverlordNormal
              ? 2600
          : isParaffinGolemHeavy
            ? 1150
            : isParaffinGolemNormal
              ? 2600
          : isErythrocyteColossusHeavy
            ? 1150
            : isErythrocyteColossusNormal
              ? 2600
              : isImmuneArchonHeavy
            ? 1120
            : isImmuneArchonNormal
              ? 900
              : isAnemiaShadeHeavy
            ? 1550
            : isAnemiaShadeNormal
              ? 1250
              : isHydraNormal
                ? 1860
                : isHydraHeavy
                  ? 1120
                  : isGramPositiveHeavy
                    ? 1650
                    : isGramPositiveNormal
                      ? 1100
                      : isStaphSentinelHeavy
                        ? 1420
                        : isStaphSentinelNormal
                          ? 950
                          : isBiohazardHeavy
                            ? 1200
                            : isBiohazardNormal
                              ? 860
                              : isLegalBeholderHeavy
                                ? 1150
                                : isLegalBeholderNormal
                                  ? 1050
                                  : isHyperglycemicMutantHeavy
                                    ? 950
                                    : isHyperglycemicMutantNormal
                                      ? 800
                                      : isKetoacidosisColossusHeavy
                                        ? 900
                                        : isKetoacidosisColossusNormal
                                          ? 750
                                          : isAntigenTitanHeavy
                                            ? 900
                                            : isAntigenTitanNormal
                                              ? 750
                                              : isCrystalGolemHeavy
                                                ? 1000
                                                : isCrystalGolemNormal
                                                  ? 880
                                                  : isAcidSlimeHeavy
                                                    ? 1200
                                                    : isAcidSlimeNormal
                                                      ? 950
                                                      : isMicrobeSwarmHeavy
                                                        ? 1120
                                                        : isMicrobeSwarmNormal
                                                          ? 1020
                                                          : isSickleCellMinionHeavy
                                                            ? 1050
                                                            : isSickleCellMinionNormal
                                                              ? 900
                                                              : isSickleCellReaperHeavy
                                                                ? 1080
                                                                : isLymphocyteSwarmHeavy
                                                                  ? 960
                                                                  : isLymphocyteSwarmNormal
                                                                    ? 920
                                                                    : isGmsFungalSporeHeavy
                                                                      ? 1020
                                                                      : isGmsFungalSporeNormal
                                                                        ? 880
                                                                        : isReagentStripSlimeHeavy
                                                                          ? 1150
                                                                          : isReagentStripSlimeNormal
                                                                            ? 900
                                                                            : (isGramPositiveBoss ? 1100 : 950);

        const impactDelay = isSpikes
          ? 650
          : isNitriteSpectreHeavy
            ? 550
            : isNitriteSpectreNormal
              ? 600
          : isFixationOverlordHeavy
            ? 660
            : isFixationOverlordNormal
              ? 750
          : isParaffinGolemHeavy
            ? 700
            : isParaffinGolemNormal
              ? 750
          : isErythrocyteColossusHeavy
            ? 460
            : isErythrocyteColossusNormal
              ? 1050
              : isImmuneArchonHeavy
            ? 420
            : isImmuneArchonNormal
              ? 380
              : isAnemiaShadeHeavy
            ? 750
            : isAnemiaShadeNormal
              ? 700
              : isHydraNormal
                ? 820
                : isHydraHeavy
                  ? 420
                  : isLegalBeholderHeavy
                    ? 700
                    : isLegalBeholderNormal
                      ? 650
                      : isKetoacidosisColossusHeavy
                        ? 480
                        : isKetoacidosisColossusNormal
                          ? 280
                          : isAntigenTitanHeavy
                            ? 480
                            : isAntigenTitanNormal
                              ? 280
                              : isHyperglycemicMutantHeavy
                                ? 430
                                : isHyperglycemicMutantNormal
                                  ? 360
                                  : isLymphocyteSwarmHeavy
                                    ? 420
                                    : isLymphocyteSwarmNormal
                                      ? 320
                                      : isBiohazardHeavy
                                        ? 340
                                        : isBiohazardNormal
                                          ? 260
                                          : isCrystalGolemHeavy
                                            ? 320
                                            : isCrystalGolemNormal
                                              ? 280
                                              : isMicrobeSwarmHeavy
                                                ? 350
                                                : isMicrobeSwarmNormal
                                                  ? 270
                                                  : isSickleCellReaperHeavy
                                                    ? 340
                                                    : isSickleCellMinionHeavy
                                                      ? 380
                                                      : isSickleCellMinionNormal
                                                        ? 270
                                                        : isAcidSlimeHeavy
                                                          ? 340
                                                          : isAcidSlimeNormal
                                                            ? 270
                                                            : isGmsFungalSporeHeavy
                                                              ? 360
                                                              : isGmsFungalSporeNormal
                                                                ? 280
                                                                : isReagentStripSlimeHeavy
                                                                  ? 330
                                                                  : isReagentStripSlimeNormal
                                                                    ? 320
                                                                    : (isGramPositiveBoss ? 350 : (isStaphSentinel ? 340 : (attackType === 'heavy_attack' ? 320 : 300)));

        setTimeout(applyPlayerDamage, impactDelay);
        if (isGramPositiveHeavy) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 950);
        } else if (isStaphSentinelHeavy) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 840);
        } else if (isAcidSlimeHeavy) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 680);
        } else if (isReagentStripSlimeHeavy) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 660);
        } else if (isAnemiaShadeHeavy) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 750);
        } else if (isImmuneArchonHeavy) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 420);
        } else if (isImmuneArchonNormal) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 380);
        } else if (isErythrocyteColossusNormal) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 1050);
        } else if (isParaffinGolemNormal) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 750);
        } else if (isParaffinGolemHeavy) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 700);
        } else if (isFixationOverlordNormal) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 750);
        } else if (isFixationOverlordHeavy) {
          setTimeout(() => {
            setIsAnimating("player");
            setHitEffectTarget('player');
            setHitEffectKey(k => k + 1);
          }, 660);
        }
        bossAttackResetDelay = resetDelay;
        setTimeout(() => setBossAnimState('idle'), resetDelay);
      } else {
        setBossAnimState('idle');
        applyPlayerDamage();
      }
    }

    if (didInflictPoison && playerDmg <= 0) {
      setTimeout(() => {
        playDebuffSound();
        addFloatingText('player', '☠️ POISONED!', 'text-purple-400 font-black');
      }, 350);
    }

    if (playerHeal > 0) {
      // Dynamically remove any damage floating texts on player so only the clean HEALED text appears
      setFloatingTexts(prev => prev.filter(ft => !(ft.target === 'player' && ft.text.includes('DMG!'))));
      const currentMaxHp = getPlayerMaxHp();
      const actualHeal = Math.min(playerHeal, Math.max(0, currentMaxHp - playerHealth));
      if (actualHeal > 0) {
        setIsAnimating("player");
        playSfx('heal');
        setPlayerHealth(prev => Math.min(currentMaxHp, prev + actualHeal));
        addFloatingText('player', `+${Math.ceil(actualHeal)} HEALED!`, 'text-emerald-400 font-black');
      }
    }

    // In Learning Mode: If this was the final question, play the last attack first, then display Victory/Defeat verdict!
    if (quizMode === 'learning' && userAnswers.length + 1 >= questions.length) {
      const currentTotalCorrect = userAnswers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
      const isOverallPassing = (currentTotalCorrect / questions.length) >= 0.75;

      // Allow the final question's attack animation (player lunge or enemy counter) to complete first!
      const attackDuration = isCorrect ? 1250 : Math.max(1350, bossAttackResetDelay + 200);

      setTimeout(() => {
        setPlayerAnimState('idle');
        setBossAnimState('idle');

        if (isOverallPassing) {
          setEnemyHealth(0);
          setHitEffectTarget('enemy');
          setHitEffectKey(k => k + 1);
          addFloatingText('enemy', '👑 BOSS DEFEATED!', 'text-amber-300 font-black');
          setJudgementText('YOU WON');
        } else {
          setPlayerHealth(0);
          setHitEffectTarget('player');
          setHitEffectKey(k => k + 1);
          addFloatingText('player', '💀 ASPIRANT DEFEATED!', 'text-red-500 font-black');
          setJudgementText('YOU FAILED');
        }
      }, attackDuration);
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
      const optionsArray = (
        Array.isArray(qToExplain.options) && qToExplain.options.length > 0
          ? qToExplain.options
          : (qToExplain.type === 'TRUE_FALSE' ? ['True', 'False'] : [])
      );

      const formattedOptions = optionsArray.map((opt, optIdx) => {
        const letter = String.fromCharCode(65 + optIdx);
        return `${letter}. ${opt}`;
      });

      // Resolve full letter and text for user's chosen answer
      const userLetter = (userAns.selectedLetter || '').trim();
      let resolvedUserAnswer = userLetter;
      if (/^[A-Za-z]$/.test(userLetter)) {
        const optIdx = userLetter.toUpperCase().charCodeAt(0) - 65;
        if (optIdx >= 0 && optIdx < optionsArray.length) {
          resolvedUserAnswer = `${userLetter.toUpperCase()}. ${optionsArray[optIdx]}`;
        }
      } else {
        const foundIdx = optionsArray.findIndex(opt => opt && opt.trim().toLowerCase() === userLetter.toLowerCase());
        if (foundIdx !== -1) {
          resolvedUserAnswer = `${String.fromCharCode(65 + foundIdx)}. ${optionsArray[foundIdx]}`;
        }
      }

      // Resolve full letter and text for correct answer
      const correctRaw = (qToExplain.correctAnswer || '').trim();
      let resolvedCorrectAnswer = correctRaw;
      if (/^[A-Za-z]$/.test(correctRaw)) {
        const optIdx = correctRaw.toUpperCase().charCodeAt(0) - 65;
        if (optIdx >= 0 && optIdx < optionsArray.length) {
          resolvedCorrectAnswer = `${correctRaw.toUpperCase()}. ${optionsArray[optIdx]}`;
        }
      } else {
        const foundIdx = optionsArray.findIndex(opt => opt && opt.trim().toLowerCase() === correctRaw.toLowerCase());
        if (foundIdx !== -1) {
          resolvedCorrectAnswer = `${String.fromCharCode(65 + foundIdx)}. ${optionsArray[foundIdx]}`;
        }
      }

      const feedback = await provideExamFeedback({
        questionId: qToExplain.id,
        question: qToExplain.question,
        options: formattedOptions.length > 0 ? formattedOptions : undefined,
        correctAnswer: resolvedCorrectAnswer,
        userAnswer: resolvedUserAnswer
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
    setBossAnimState('idle');
    setPlayerAnimState('idle');

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

    const transitionToPostBattle = () => {
      setJudgementText(null);
      setIsFinished(true);

      const confEnabled = typeof window !== 'undefined' ? localStorage.getItem('bq_pref_confidence_prompts') !== 'false' : true;
      if (confEnabled) {
        setTimeout(() => setConfidenceDialogOpen(true), 300);
      } else {
        handleConfidenceSubmit('Steady');
      }
    };

    if (quizMode === 'boss-battle') {
      // Transition to post-battle STRICTLY after MusicWhenWonInBossBattleMode / MusicWhenLostInBossBattleMode finishes playing!
      const outcomeType = finalOutcome === 'victory' ? 'victory' : 'defeat';
      playBossBattleMusic(outcomeType, () => {
        transitionToPostBattle();
      });
    } else if (quizMode === 'learning') {
      // Transition to post-battle STRICTLY after MusicWhenWinInLearningMode / MusicWhenLostInLearningMode finishes playing!
      const outcomeType = finalOutcome === 'victory' ? 'victory' : 'defeat';
      playLearningModeMusic(outcomeType, () => {
        transitionToPostBattle();
      });
    } else if (quizMode === 'test') {
      // Transition to post-battle STRICTLY after MusicWhenWinInTestMode / MusicWhenLostInTestMode finishes playing!
      const outcomeType = finalOutcome === 'victory' ? 'victory' : 'defeat';
      playTestModeMusic(outcomeType, () => {
        transitionToPostBattle();
      });
    } else {
      if (finalOutcome === 'victory') {
        playSfx('victory');
      } else {
        playSfx('defeat');
      }
      // Standard encounters: wait 2 seconds for animation, then show finished screen
      setTimeout(transitionToPostBattle, 2000);
    }
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
      // Node clears and stars are EXCLUSIVELY earned in Boss-Battle Mode on unlocked nodes!
      if (quizMode === 'boss-battle' && selectedNodeId && battleOutcome === 'victory') {
        const activeNodes = getSubjectNodes(selectedSubject);
        const nodeIndex = activeNodes.findIndex(n => n.id === selectedNodeId);
        const isNodeUnlockedForClear = (idx: number): boolean => {
          if (idx <= 0) return true;
          const prevNodeId = activeNodes[idx - 1]?.id;
          if (!prevNodeId) return false;
          const prevClears = nodeClears[prevNodeId];
          return !!(prevClears?.EASY && prevClears?.MEDIUM && prevClears?.HARD);
        };

        if (nodeIndex !== -1 && isNodeUnlockedForClear(nodeIndex)) {
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
        if (result.totalXp !== undefined) {
          setEarnedQuestXp(result.totalXp);
        }

        // Immediately sync and reflect the Player's level and XP dynamically
        let didLevelUp = false;
        if (result.newLevel) {
          const prevLevel = userLevel;
          setUserLevel(result.newLevel);
          if (result.newLevel > prevLevel) {
            didLevelUp = true;
            setLeveledUpDetails({ oldLevel: prevLevel, newLevel: result.newLevel });
            setShowLevelUpPopup(true);
            playSfx('victory');
            toast({
              title: `🎉 LEVEL UP! Level ${result.newLevel}!`,
              description: `Congratulations, Aspirant! You advanced from Level ${prevLevel} to Level ${result.newLevel}!`,
            });
            addFloatingText('player', `LEVEL UP! LVL ${result.newLevel} ⭐`, 'text-yellow-300 font-bytebounce text-2xl font-black animate-bounce');
          }
        }
        if (result.newTotalXp !== undefined) {
          setUserXp(result.newTotalXp);
          userXpRef.current = result.newTotalXp;
          try {
            localStorage.setItem('boardquest_user_xp', result.newTotalXp.toString());
          } catch (e) { }
        }

        // Recalculate badges with actual confidence level
        const updatedBadges = calculateEarnedBadges({
          score,
          totalQuestions: questions.length,
          confidenceLevel: selectedLevel as any,
          completionTime: questCompletionTime,
          streak: 0,
        });
        setEarnedBadges(updatedBadges);

        // Open thank you dialog strictly once after a short delay (or after dismissing Level Up popup)
        if (!hasShownThankYouRef.current) {
          hasShownThankYouRef.current = true;
          if (!didLevelUp) {
            setTimeout(() => setThankYouDialogOpen(true), 200);
          }
        }

        try {
          localStorage.removeItem('bq_today_quest_date');
          localStorage.removeItem('bq_today_questions_count');
          const todayKey = getLocalTodayDateString();
          const targetUserId = currentUserIdRef.current;
          if (targetUserId) {
            const savedDate = localStorage.getItem(`bq_today_date_${targetUserId}`);
            const currentCount = (savedDate === todayKey) ? parseInt(localStorage.getItem(`bq_today_questions_${targetUserId}`) || '0', 10) : 0;
            const questCount = questions.length || userAnswers.length || 1;
            const nextCount = Math.max(currentCount, questCount);
            localStorage.setItem(`bq_today_date_${targetUserId}`, todayKey);
            localStorage.setItem(`bq_today_questions_${targetUserId}`, nextCount.toString());
          }
        } catch (e) {}

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
                {selectedTopicFilter && (
                  <div className="flex justify-center pt-1.5 px-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-xs max-w-full flex-wrap justify-center text-center">
                      🎯 Topic Drill: <span className="text-foreground font-black break-words">{selectedTopicFilter}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-center items-center gap-4 sm:gap-8 md:gap-12 py-3 sm:py-4">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black font-headline text-primary">{score}/{questions.length}</div>
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score</div>
                </div>
                <div className="h-8 sm:h-10 md:h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black font-headline text-accent">+{earnedQuestXp !== null ? earnedQuestXp : (score * XP_PER_QUESTION)}</div>
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
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black font-headline text-accent">+{earnedQuestXp !== null ? earnedQuestXp : (score * XP_PER_QUESTION)}</div>
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
          <Dialog open={confidenceDialogOpen} onOpenChange={(open) => {
            setConfidenceDialogOpen(open);
            if (!open && !hasSubmittedConfidenceRef.current) {
              handleConfidenceSubmit('Steady');
            }
          }}>
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

          {/* Dedicated Big Gamified RPG Level Up Celebration Display (Strictly Borderless, No Card Box) */}
          {showLevelUpPopup && leveledUpDetails && (
            <div
              onClick={() => {
                setShowLevelUpPopup(false);
                setTimeout(() => setThankYouDialogOpen(true), 250);
              }}
              className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-4 cursor-pointer select-none bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            >
              {/* Free-Floating Gamified RPG Typography - Strictly Borderless, No Card */}
              <div className="relative z-10 flex flex-col items-center text-center max-w-3xl animate-in zoom-in-75 duration-500 space-y-4 sm:space-y-6">
                
                {/* Decorative Glowing Arcade Stars (Stationary) */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 text-amber-300 text-xl sm:text-3xl drop-shadow-[0_0_15px_rgba(252,211,77,0.8)]">
                  <span>★</span>
                  <span className="text-3xl sm:text-4xl text-yellow-200">★</span>
                  <span>★</span>
                </div>

                {/* Massive RPG "LEVEL UP!" Title */}
                <h1
                  className="text-6xl sm:text-8xl md:text-9xl font-black font-bytebounce tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-500 uppercase select-none drop-shadow-[0_0_35px_rgba(245,158,11,0.9)]"
                  style={{
                    textShadow: '0 0 25px rgba(251, 191, 36, 0.8), 0 0 50px rgba(245, 158, 11, 0.5)',
                  }}
                >
                  LEVEL UP!
                </h1>

                {/* Giant Level Transition (LV. Old ➔ LV. New) */}
                <div className="flex items-center justify-center gap-5 sm:gap-12 my-2 sm:my-4 font-bytebounce select-none">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest text-muted-foreground uppercase">Previous</span>
                    <span className="text-4xl sm:text-6xl md:text-7xl font-black text-white/40 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                      LV.{leveledUpDetails.oldLevel}
                    </span>
                  </div>

                  {/* Pulsing RPG Golden Arrow */}
                  <div className="text-3xl sm:text-5xl md:text-6xl text-amber-400 animate-pulse font-black drop-shadow-[0_0_25px_rgba(251,191,36,1)]">
                    ➔
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest text-amber-400 uppercase drop-shadow">New Rank</span>
                    <span className="text-6xl sm:text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-amber-400 drop-shadow-[0_0_45px_rgba(250,204,21,1)] transform scale-110">
                      LV.{leveledUpDetails.newLevel}
                    </span>
                  </div>
                </div>

                {/* Floating Gamified Stat Increases (No Box/Card) */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 text-sm sm:text-base md:text-lg font-bold font-bytebounce tracking-wider select-none">
                  <span className="flex items-center gap-1.5 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">
                    <span>▲</span> +15 MAX HP BOOSTED
                  </span>
                  {earnedQuestXp !== null && earnedQuestXp > 0 && (
                    <>
                      <span className="text-white/30">•</span>
                      <span className="flex items-center gap-1.5 text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.8)]">
                        <span>⚡</span> +{earnedQuestXp} XP GAINED
                      </span>
                    </>
                  )}
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1.5 text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]">
                    <span>⚔️</span> POWER LEVEL INCREASED
                  </span>
                </div>

                {/* Retro Click Anywhere to Dismiss Prompt */}
                <div className="pt-8 sm:pt-14 flex flex-col items-center">
                  <span className="text-xs sm:text-sm text-white/50 tracking-[0.25em] uppercase font-bytebounce animate-pulse">
                    Click anywhere to dismiss
                  </span>
                </div>
              </div>
            </div>
          )}


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
                          <div className="bg-muted/30 dark:bg-muted/20 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 border border-border">
                            {/* Question Clinical Image Reference if present */}
                            {q.imageUrl && (
                              <div className="relative w-full max-w-md h-40 sm:h-52 rounded-xl overflow-hidden border border-border/60 bg-black/10 mx-auto">
                                <Image
                                  src={q.imageUrl}
                                  alt="Clinical Specimen Reference"
                                  fill
                                  className="object-contain p-2"
                                  unoptimized={!q.imageUrl.includes('supabase.co')}
                                />
                              </div>
                            )}

                            {/* Full Choice Breakdown */}
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                  Choices & Answer Breakdown
                                </p>
                                {isCorrect ? (
                                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                    <CheckCircle2 className="w-3 h-3" /> Answered Correctly
                                  </span>
                                ) : (
                                  <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                                    <XCircle className="w-3 h-3" /> Incorrect Attempt
                                  </span>
                                )}
                              </div>

                              {q.type === 'SHORT_ANSWER' ? (
                                <div className="space-y-2">
                                  <div className={cn(
                                    "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium",
                                    isCorrect
                                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                                      : "bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-200"
                                  )}>
                                    <span className="text-muted-foreground text-xs font-bold shrink-0">Your Answer:</span>
                                    <span className="font-bold truncate">{userAns?.selectedLetter || 'No response'}</span>
                                    <Badge variant={isCorrect ? "default" : "destructive"} className="text-[8px] uppercase">
                                      {isCorrect ? "Correct" : "Incorrect"}
                                    </Badge>
                                  </div>
                                  {!isCorrect && (
                                    <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs sm:text-sm">
                                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">Expected Answer:</span>
                                      <span className="font-bold truncate">{q.correctAnswer}</span>
                                      <Badge className="bg-emerald-600 text-white text-[8px] uppercase">Correct</Badge>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-2">
                                  {(Array.isArray(q.options) && q.options.length > 0 ? q.options : (q.type === 'TRUE_FALSE' ? ['True', 'False'] : [])).map((optionText, optIdx) => {
                                    const letter = String.fromCharCode(65 + optIdx);
                                    const trimmedUserAns = userAns?.selectedLetter?.trim();
                                    const trimmedOptText = optionText?.trim();
                                    const isSelectedByUser =
                                      trimmedUserAns?.toUpperCase() === letter ||
                                      (!!trimmedUserAns && !!trimmedOptText && trimmedUserAns.toLowerCase() === trimmedOptText.toLowerCase());
                                    const trimmedCorrect = q.correctAnswer?.trim();
                                    const isThisCorrect =
                                      trimmedCorrect?.toUpperCase() === letter ||
                                      (!!trimmedCorrect && !!trimmedOptText && trimmedCorrect.toLowerCase() === trimmedOptText.toLowerCase());
                                    const choiceImg = q.choiceImages?.[optIdx];

                                    let badgeBg = "bg-muted text-muted-foreground";
                                    let cardBg = "bg-card/70 border-border/60 text-foreground";
                                    let statusBadge = null;

                                    if (isThisCorrect) {
                                      cardBg = "bg-emerald-500/10 border-emerald-500/50 text-foreground dark:text-emerald-100 ring-1 ring-emerald-500/30";
                                      badgeBg = "bg-emerald-500 text-white";
                                      statusBadge = (
                                        <span className="ml-auto inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                          <CheckCircle2 className="w-3 h-3" />
                                          {isSelectedByUser ? "Your Correct Answer" : "Correct Answer"}
                                        </span>
                                      );
                                    } else if (isSelectedByUser && !isThisCorrect) {
                                      cardBg = "bg-rose-500/10 border-rose-500/50 text-foreground dark:text-rose-100 ring-1 ring-rose-500/30";
                                      badgeBg = "bg-rose-500 text-white";
                                      statusBadge = (
                                        <span className="ml-auto inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
                                          <XCircle className="w-3 h-3" />
                                          Your Choice
                                        </span>
                                      );
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        className={cn(
                                          "p-2.5 sm:p-3 rounded-xl border flex items-center gap-3 transition-all text-xs sm:text-sm",
                                          cardBg
                                        )}
                                      >
                                        <div className={cn("w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs", badgeBg)}>
                                          {letter}
                                        </div>
                                        {choiceImg && (
                                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-border/50 shrink-0 bg-black/10">
                                            <Image src={choiceImg} alt={`Choice ${letter}`} fill className="object-contain p-1" unoptimized={!choiceImg.includes('supabase.co')} />
                                          </div>
                                        )}
                                        <span className={cn(
                                          "font-semibold flex-1 leading-snug break-words",
                                          isThisCorrect && "font-bold text-emerald-950 dark:text-emerald-200",
                                          isSelectedByUser && !isThisCorrect && "font-bold text-rose-950 dark:text-rose-200"
                                        )}>
                                          {optionText}
                                        </span>
                                        {statusBadge}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
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

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pb-12 w-full max-w-2xl mx-auto px-2 sm:px-0 mt-6 sm:mt-8">
            {selectedTopicFilter ? (
              <>
                {/* Dynamic Drill Again Button: Preserves topic filter and re-opens the mode selection dialog */}
                <Button
                  onClick={() => {
                    stopBossBattleMusic();
                    stopFinalBossMusic();
                    stopLearningModeMusic();
                    stopTestModeMusic();
                    setIsStarted(false);
                    setIsFinished(false);
                    setShowBattleLog(false);
                    setEarnedQuestXp(null);
                    setLeveledUpDetails(null);
                    setSetupStep('mode');
                    setModeSelectDialogOpen(true);
                    fetchUser();
                  }}
                  className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-black/80 dark:border-white/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.15)] bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
                >
                  🎯 Drill Again
                </Button>

                {/* Return to Arena / All Topics Button: Clears topic filter and returns to main arena carousel */}
                <Button
                  variant="outline"
                  onClick={() => {
                    stopBossBattleMusic();
                    stopFinalBossMusic();
                    stopLearningModeMusic();
                    stopTestModeMusic();
                    setIsStarted(false);
                    setIsFinished(false);
                    setShowBattleLog(false);
                    setEarnedQuestXp(null);
                    setLeveledUpDetails(null);
                    setSelectedTopicFilter(null);
                    fetchUser();
                  }}
                  className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-primary/40 bg-card hover:bg-muted text-foreground hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
                >
                  All Topics / Arena
                </Button>

                {/* Back to Dashboard */}
                <Link href="/" className="flex-1 flex" onClick={() => { stopBossBattleMusic(); stopFinalBossMusic(); stopLearningModeMusic(); stopTestModeMusic(); setSelectedTopicFilter(null); }}>
                  <Button className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-black/80 dark:border-white/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.15)] bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap">
                    Back to Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    stopBossBattleMusic();
                    stopFinalBossMusic();
                    stopLearningModeMusic();
                    stopTestModeMusic();
                    setIsStarted(false);
                    setIsFinished(false);
                    setShowBattleLog(false);
                    setEarnedQuestXp(null);
                    setLeveledUpDetails(null);
                    setSelectedTopicFilter(null);
                    fetchUser();
                  }}
                  className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-black/80 dark:border-white/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.15)] bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
                >
                  Re-Enter Arena
                </Button>
                <Link href="/" className="flex-1 flex" onClick={() => { stopBossBattleMusic(); stopFinalBossMusic(); stopLearningModeMusic(); stopTestModeMusic(); setSelectedTopicFilter(null); }}>
                  <Button className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-black/80 dark:border-white/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.15)] bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap">
                    Back to Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        {arenaSettingsDialogJSX}
      </div>
    );
  }

  const handleFleeArena = () => {
    stopBossBattleMusic();
    stopFinalBossMusic();
    stopLearningModeMusic();
    stopTestModeMusic();
    setLeaveConfirmDialogOpen(false);
    setIsFleeing(true);
    setFleeProgress(false);
    playSfx('flee');
    setHitFlash(true);
    addFloatingText('player', 'ARENA WITHDRAWAL', 'text-red-400 font-bytebounce text-2xl font-black tracking-widest');

    setTimeout(() => {
      setFleeProgress(true);
    }, 60);

    setTimeout(() => {
      setHitFlash(false);
    }, 500);

    setTimeout(() => {
      setIsFleeing(false);
      setIsStarted(false);
      setSelectedTopicFilter(null);
      toast({
        title: "Tactical Retreat",
        description: "You safely withdrew from the arena. XP and session rewards were forfeited.",
      });
    }, 2800);
  };

  if (isStarted) {
    const _maxPlayerHp = getPlayerMaxHp();
    const diffBase = bossDifficulty === 'EASY' ? 400 : bossDifficulty === 'HARD' ? 800 : 600;
    const levelScaling = bossDifficulty === 'EASY' ? 5 : bossDifficulty === 'HARD' ? 12 : 8;

    let _maxEnemyHp = 100;
    if (quizMode === 'boss-battle') {
      const calculatedHp = Math.floor(diffBase + (userLevel * levelScaling));
      const playerMul = bossDifficulty === 'EASY' ? 1.5 : bossDifficulty === 'HARD' ? 0.7 : 1;
      const maxPossibleDamage = questions.length * 25 * playerMul;
      const safeHpCap = Math.max(100, Math.floor(maxPossibleDamage * 0.8));
      _maxEnemyHp = Math.min(calculatedHp, safeHpCap);
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
        {/* Gamified Pixelated Flee Arena Overlay */}
        {isFleeing && (
          <div className="fixed inset-0 z-[150] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto select-none overflow-hidden py-6 px-4">
            {/* Ambient Retro Crimson Glow & CRT Scanlines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.35)_0%,_rgba(0,0,0,0.98)_80%)] animate-pulse pointer-events-none" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_2px,transparent_2px,transparent_4px)] pointer-events-none opacity-60" />

            {/* Retro Cinema Top Strip */}
            <div className="relative z-10 w-full flex items-center justify-between border-y-2 border-black/80 dark:border-red-900/60 bg-black/85 px-4 py-2 font-bytebounce text-xs sm:text-sm uppercase tracking-widest text-amber-400 shadow-[0_2px_0_0_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 animate-ping" />
                <span className="font-black text-red-400">EMERGENCY PROTOCOL</span>
                <span className="text-zinc-600">::</span>
                <span className="text-zinc-300">SECTOR WITHDRAWAL</span>
              </div>
              <div className="hidden sm:block text-zinc-400 font-black tracking-widest">
                SYS.EVAC // ACTIVE
              </div>
            </div>

            {/* Main Center Content: Authentic Pixel RPG Battle Verdict */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-4 sm:space-y-5 max-w-xl mx-auto my-auto animate-in zoom-in-90 duration-300">
              {/* Gamified Header Subtitle Tag */}
              <div className="font-bytebounce uppercase tracking-widest font-black text-sm sm:text-base md:text-lg text-amber-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] border border-amber-500/40 bg-black/80 px-4 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                TACTICAL RETREAT • BATTLE ABANDONED
              </div>

              {/* Giant Pixelated Title */}
              <h1 className="font-bytebounce font-black text-6xl sm:text-8xl md:text-9xl tracking-wider uppercase text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.95)] [text-shadow:3px_3px_0_#000,5px_5px_0_rgba(0,0,0,0.9)] leading-none select-none my-0.5">
                FLED THE ARENA
              </h1>

              {/* Pixelated RPG Dialogue Box */}
              <div className="border-4 border-black dark:border-red-950/80 bg-neutral-950/95 p-4 sm:p-5 shadow-[5px_5px_0_0_rgba(0,0,0,1)] dark:shadow-[5px_5px_0_0_rgba(239,68,68,0.4)] max-w-md w-full relative">
                {/* 4 Corner Pixel Accents */}
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-amber-400" />
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400" />
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-amber-400" />
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-amber-400" />

                <div className="space-y-2 text-center">
                  <p className="font-bytebounce text-base sm:text-lg text-red-400 tracking-wider uppercase font-black">
                    STATUS: RETREAT CONFIRMED
                  </p>
                  <div className="h-0.5 w-full bg-red-900/60" />
                  <p className="font-bytebounce text-xs sm:text-sm text-zinc-300 tracking-wide uppercase leading-relaxed font-bold">
                    ALL SESSION XP, NODAL STARS, AND ENCOUNTER REWARDS HAVE BEEN FORFEITED!
                  </p>
                </div>
              </div>

              {/* Retro Pixel Evacuation Gauge */}
              <div className="w-64 sm:w-80 space-y-1.5 pt-1">
                <div className="flex justify-between font-bytebounce text-xs sm:text-sm tracking-widest text-zinc-400 uppercase font-black">
                  <span>DISENGAGING...</span>
                  <span className="text-amber-400">{fleeProgress ? '100% ESCAPED' : 'IN PROGRESS'}</span>
                </div>
                {/* Pixel bar frame */}
                <div className="h-4 w-full bg-black border-2 border-black dark:border-zinc-700 p-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all ease-linear"
                    style={{
                      width: fleeProgress ? '100%' : '0%',
                      transitionDuration: '2400ms',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Retro Cinema Bottom Strip */}
            <div className="relative z-10 w-full flex items-center justify-between border-y-2 border-black/80 dark:border-red-900/60 bg-black/85 px-4 py-2 font-bytebounce text-xs sm:text-sm uppercase tracking-widest text-zinc-400 shadow-[0_2px_0_0_rgba(0,0,0,1)]">
              <span>SECURITY: DISENGAGED</span>
              <span className="font-black text-red-400 tracking-widest">RETURNING TO MAP</span>
            </div>
          </div>
        )}

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
                onClick={handleFleeArena}
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
              !(getSubjectMeta(selectedSubject)?.arenaBackgroundUrl || getSubjectMeta(selectedSubject)?.backgroundUrl) && "bg-gradient-to-b from-primary to-black"
            )}
            style={{ containerType: 'inline-size' }}
          >
            {/* High-Performance Next.js Optimized Arena Background */}
            {(getSubjectMeta(selectedSubject)?.arenaBackgroundUrl || getSubjectMeta(selectedSubject)?.backgroundUrl) && (
              <Image
                src={(getSubjectMeta(selectedSubject)?.arenaBackgroundUrl || getSubjectMeta(selectedSubject)?.backgroundUrl) as string}
                alt="Arena Battleground"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center pointer-events-none z-0"
              />
            )}

            {/* Dark Overlay that fades in after cutscene intro */}
            <div className={cn(
              "absolute inset-0 transition-all duration-1000 z-[1] pointer-events-none",
              introPhase === 'cutscene' ? "bg-black/0 backdrop-blur-none" : "bg-black/60 backdrop-blur-sm"
            )} />

            {/* Hit Flash Overlay */}
            <div className={cn(
              "absolute inset-0 bg-red-600 z-40 pointer-events-none transition-opacity duration-300",
              hitFlash ? "opacity-30" : "opacity-0"
            )} />

            {/* Gamified RPG Wave Transition Overlay (Matches Floating Verdict Styling) */}
            {waveTransition && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/65 backdrop-blur-md animate-in fade-in duration-400 pointer-events-none p-4 select-none">
                {/* Ambient Radial Color Glow */}
                <div className={cn(
                  "absolute w-72 sm:w-96 h-40 sm:h-48 rounded-full blur-3xl pointer-events-none -translate-y-2 opacity-60 transition-all duration-700",
                  waveTransition.stage === 'outcome'
                    ? (waveTransition.wasDefeated ? "bg-emerald-500/50" : "bg-amber-500/50")
                    : (waveTransition.toWave === 3 ? "bg-red-500/60" : "bg-amber-500/60")
                )} />

                {/* Animated Phase Content Container */}
                <div key={waveTransition.stage} className="flex flex-col items-center justify-center text-center z-10 animate-in fade-in zoom-in-95 duration-500">
                  {waveTransition.stage === 'outcome' ? (
                    <>
                      {/* Stage 1: Previous Wave Outcome Tag */}
                      <div className="flex items-center gap-2 mb-1 animate-in slide-in-from-top-3 duration-400">
                        {waveTransition.wasDefeated ? (
                          <>
                            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
                            <span className="text-[11px] sm:text-sm md:text-base font-bytebounce uppercase tracking-widest font-black text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                              WAVE {waveTransition.fromWave} CLEARED • {waveTransition.fromWave === 1 ? "MINION ELIMINATED" : "MINI-BOSS SLAIN"}
                            </span>
                            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-400 animate-pulse" />
                            <span className="text-[11px] sm:text-sm md:text-base font-bytebounce uppercase tracking-widest font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                              WAVE {waveTransition.fromWave} TIMEOUT • ENEMY RETREATED
                            </span>
                            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-400 animate-pulse" />
                          </>
                        )}
                      </div>

                      {/* Stage 1: Giant RPG Outcome Title */}
                      <h2 className={cn(
                        "font-bytebounce text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-wider leading-none animate-in zoom-in-75 duration-500 my-0.5",
                        waveTransition.wasDefeated
                          ? "text-emerald-300 drop-shadow-[0_0_35px_rgba(16,185,129,0.95)]"
                          : "text-amber-400 drop-shadow-[0_0_35px_rgba(245,158,11,0.95)]"
                      )}>
                        {waveTransition.wasDefeated ? `WAVE ${waveTransition.fromWave} CLEARED` : `WAVE ${waveTransition.fromWave} TIMEOUT`}
                      </h2>

                      {/* Stage 1: Floating Subtitle Description */}
                      <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white/90 font-mono tracking-tight max-w-md text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] mt-1">
                        {waveTransition.wasDefeated
                          ? (waveTransition.fromWave === 1
                              ? "Minion eliminated! Prepare for higher threat escalation."
                              : "Mini-Boss vanquished! Brace for the final chapter confrontation.")
                          : (waveTransition.fromWave === 1
                              ? "Wave questions completed. The minion retreated as a stronger foe emerges!"
                              : "Wave questions completed. The mini-boss retreated as the final terror approaches!")}
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Stage 2: Next Wave Threat Tag */}
                      <div className="flex items-center gap-2 mb-1 animate-in slide-in-from-top-3 duration-400">
                        {waveTransition.toWave === 3 ? (
                          <>
                            <Skull className="w-4 h-4 md:w-5 md:h-5 text-red-400 animate-bounce" />
                            <span className="text-[11px] sm:text-sm md:text-base font-bytebounce uppercase tracking-widest font-black text-red-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                              CRITICAL THREAT • CHAPTER FINAL BOSS
                            </span>
                            <Skull className="w-4 h-4 md:w-5 md:h-5 text-red-400 animate-bounce" />
                          </>
                        ) : (
                          <>
                            <Swords className="w-4 h-4 md:w-5 md:h-5 text-amber-400 animate-pulse" />
                            <span className="text-[11px] sm:text-sm md:text-base font-bytebounce uppercase tracking-widest font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                              THREAT LEVEL ESCALATION • INCOMING MINI-BOSS
                            </span>
                            <Swords className="w-4 h-4 md:w-5 md:h-5 text-amber-400 animate-pulse" />
                          </>
                        )}
                      </div>

                      {/* Stage 2: Giant RPG Threat Title */}
                      <h2 className={cn(
                        "font-bytebounce text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-wider leading-none animate-in zoom-in-75 duration-500 my-0.5",
                        waveTransition.toWave === 3
                          ? "text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.95)]"
                          : "text-amber-300 drop-shadow-[0_0_35px_rgba(245,158,11,0.95)]"
                      )}>
                        {waveTransition.toWave === 3 ? "FINAL BOSS AWAKENS" : "MINI-BOSS APPROACHES"}
                      </h2>

                      {/* Stage 2: Floating Target Announcement Subtitle */}
                      <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white/90 font-mono tracking-tight max-w-md text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] mt-1">
                        {waveTransition.toWave === 3
                          ? `Target: ${waveTransition.incomingEnemyName} (${waveTransition.incomingEnemyBadge}). The ultimate licensure trial begins!`
                          : `Target: ${waveTransition.incomingEnemyName} (${waveTransition.incomingEnemyBadge}). Brace your defenses!`}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

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
                <p 
                  className="text-[8px] md:text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1 truncate max-w-[240px] xs:max-w-[300px] sm:max-w-md mx-auto"
                  title={questions[activeQuizIndex]?.topic?.trim() || (quizMode === 'learning' ? 'Intel Gathering' : 'Battle Simulation')}
                >
                  {questions[activeQuizIndex]?.topic?.trim() || (quizMode === 'learning' ? 'Intel Gathering' : 'Battle Simulation')}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="rounded-full text-white hover:bg-white/20 h-8 w-8 cursor-pointer pointer-events-auto"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            </header>

            {/* Health Bars Stacked on Mobile, Floating on Desktop */}
            {/* Enemy */}
            {(() => {
              const activeNodes = getSubjectNodes(selectedSubject);
              const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
              const isChapter3FinalBoss = currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4;

              const currentQ = questions[Math.min(questions.length - 1, userAnswers.length)] || questions[0];
              const _currentDiff = String(currentQ?.difficulty || 'EASY').toUpperCase();

              let activeEnemyName = subjectMeta.enemy;
              let activeEnemyBadge = 'BOSS 👑';
              let idleSprite: string | null = null;
              let attackSprite: string | null = null;
              let heavyAttackSprite: string | null = null;
              let displayEnemyHp = enemyHealth;

              let waveState: any = null;

              if (quizMode === 'boss-battle') {
                if (isChapter3FinalBoss) {
                  activeEnemyName = currentActiveNode.bossName;
                  activeEnemyBadge = 'FINAL BOSS 👑';
                  idleSprite = currentActiveNode?.idleSpriteUrl || subjectMeta?.idleSpriteUrl || null;
                  attackSprite = currentActiveNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl || null;
                  heavyAttackSprite = currentActiveNode?.heavyAttackSpriteUrl || subjectMeta?.heavyAttackSpriteUrl || null;
                } else {
                  activeEnemyName = battleStage === 1 ? (currentActiveNode.minionName || 'Minion') : battleStage === 2 ? (currentActiveNode.miniBossName || 'Mini-Boss') : currentActiveNode.bossName;
                  activeEnemyBadge = battleStage === 1 ? 'MINION 👾' : battleStage === 2 ? 'MINI-BOSS 👹' : 'BOSS 👑';

                  if (battleStage === 1 && currentActiveNode?.minionIdleSpriteUrl) {
                    idleSprite = currentActiveNode.minionIdleSpriteUrl || null;
                    attackSprite = currentActiveNode.minionAttackSpriteUrl || currentActiveNode.minionIdleSpriteUrl || null;
                    heavyAttackSprite = currentActiveNode.minionHeavyAttackSpriteUrl || currentActiveNode.minionAttackSpriteUrl || null;
                  } else if (battleStage === 2 && currentActiveNode?.miniBossIdleSpriteUrl) {
                    idleSprite = currentActiveNode.miniBossIdleSpriteUrl || null;
                    attackSprite = currentActiveNode.miniBossAttackSpriteUrl || currentActiveNode.miniBossIdleSpriteUrl || null;
                    heavyAttackSprite = currentActiveNode.miniBossHeavyAttackSpriteUrl || currentActiveNode.miniBossAttackSpriteUrl || null;
                  } else {
                    idleSprite = currentActiveNode?.idleSpriteUrl || subjectMeta?.idleSpriteUrl || null;
                    attackSprite = currentActiveNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl || null;
                    heavyAttackSprite = currentActiveNode?.heavyAttackSpriteUrl || subjectMeta?.heavyAttackSpriteUrl || null;
                  }
                }
                displayEnemyHp = enemyHealth;
              } else if (quizMode === 'learning') {
                waveState = getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex);
                activeEnemyName = waveState.name;
                activeEnemyBadge = waveState.badge;
                idleSprite = waveState.idleSprite;
                attackSprite = waveState.attackSprite;
                heavyAttackSprite = waveState.heavyAttackSprite;
                displayEnemyHp = enemyHealth <= 0 ? 0 : waveState.hp;
              } else if (quizMode === 'test' && testModeEnemy) {
                activeEnemyName = testModeEnemy.name;
                activeEnemyBadge = testModeEnemy.badge;
                idleSprite = testModeEnemy.idleSprite;
                attackSprite = testModeEnemy.attackSprite;
                heavyAttackSprite = testModeEnemy.heavyAttackSprite;
                displayEnemyHp = enemyHealth;
              } else {
                activeEnemyName = subjectMeta.enemy;
                activeEnemyBadge = 'BOSS 👑';
                idleSprite = currentActiveNode?.idleSpriteUrl || subjectMeta?.idleSpriteUrl || null;
                attackSprite = currentActiveNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl || null;
                heavyAttackSprite = currentActiveNode?.heavyAttackSpriteUrl || subjectMeta?.heavyAttackSpriteUrl || null;
                displayEnemyHp = enemyHealth;
              }

              const ch1Node = activeNodes.find(n => n.nodeNumber === 1) || activeNodes[0];
              const ch4Node = activeNodes.find(n => n.nodeNumber === 4 || n.tier === 'final-boss') || activeNodes[activeNodes.length - 1];
              const ch3Node = activeNodes.find(n => n.nodeNumber === 3 || n.tier === 'boss') || activeNodes[2] || activeNodes[0];
              const wave3BossNode = (currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4) ? ch4Node : ch3Node;
              const isMinionStageWithSprite = ((quizMode === 'boss-battle' && !isChapter3FinalBoss && battleStage === 1) || (quizMode === 'learning' && waveState?.waveStage === 1)) && !!(idleSprite || currentActiveNode?.minionIdleSpriteUrl || ch1Node?.minionIdleSpriteUrl);
              const isMiniBossStageWithSprite = ((quizMode === 'boss-battle' && !isChapter3FinalBoss && battleStage === 2) || (quizMode === 'learning' && waveState?.waveStage === 2) || (quizMode === 'test' && testModeEnemy?.tier === 'mini-boss')) && !!(idleSprite || currentActiveNode?.miniBossIdleSpriteUrl || ch1Node?.miniBossIdleSpriteUrl);

              const effectiveIdleFrames = (quizMode === 'test' && testModeEnemy)
                ? testModeEnemy.idleFrames
                : isMinionStageWithSprite
                  ? (waveState?.idleFrames || currentActiveNode.minionIdleFrames || ch1Node?.minionIdleFrames || 8)
                  : isMiniBossStageWithSprite
                    ? (waveState?.idleFrames || currentActiveNode.miniBossIdleFrames || ch1Node?.miniBossIdleFrames || 7)
                    : (waveState?.idleFrames || wave3BossNode?.idleFrames || ch3Node?.idleFrames || currentActiveNode?.idleFrames || subjectMeta?.idleFrames || 7);

              const effectiveAttackFrames = (quizMode === 'test' && testModeEnemy)
                ? testModeEnemy.attackFrames
                : isMinionStageWithSprite
                  ? (waveState?.attackFrames || currentActiveNode.minionAttackFrames || ch1Node?.minionAttackFrames || 14)
                  : isMiniBossStageWithSprite
                    ? (waveState?.attackFrames || currentActiveNode.miniBossAttackFrames || ch1Node?.miniBossAttackFrames || 9)
                    : (waveState?.attackFrames || wave3BossNode?.attackFrames || ch3Node?.attackFrames || currentActiveNode?.attackFrames || subjectMeta?.attackFrames || 17);

              const effectiveHeavyAttackFrames = (quizMode === 'test' && testModeEnemy)
                ? testModeEnemy.heavyAttackFrames
                : isMinionStageWithSprite
                  ? (waveState?.heavyAttackFrames || currentActiveNode.minionHeavyAttackFrames || ch1Node?.minionHeavyAttackFrames || 10)
                  : isMiniBossStageWithSprite
                    ? (waveState?.heavyAttackFrames || currentActiveNode.miniBossHeavyAttackFrames || ch1Node?.miniBossHeavyAttackFrames || 9)
                    : (waveState?.heavyAttackFrames || wave3BossNode?.heavyAttackFrames || ch3Node?.heavyAttackFrames || currentActiveNode?.heavyAttackFrames || subjectMeta?.heavyAttackFrames || 11);

              const effectiveIdleFrameWidth = (quizMode === 'test' && testModeEnemy)
                ? (testModeEnemy.idleFrameWidth || 128)
                : isMinionStageWithSprite
                  ? (waveState?.idleFrameWidth || currentActiveNode.minionIdleFrameWidth || ch1Node?.minionIdleFrameWidth || 128)
                  : isMiniBossStageWithSprite
                    ? (waveState?.idleFrameWidth || currentActiveNode.miniBossIdleFrameWidth || ch1Node?.miniBossIdleFrameWidth || 128)
                    : (waveState?.idleFrameWidth || wave3BossNode?.idleFrameWidth || ch3Node?.idleFrameWidth || currentActiveNode?.idleFrameWidth || subjectMeta?.idleFrameWidth || 128);

              const effectiveAttackFrameWidth = (quizMode === 'test' && testModeEnemy)
                ? (testModeEnemy.attackFrameWidth || 128)
                : isMinionStageWithSprite
                  ? (waveState?.attackFrameWidth || currentActiveNode.minionAttackFrameWidth || ch1Node?.minionAttackFrameWidth || 257)
                  : isMiniBossStageWithSprite
                    ? (waveState?.attackFrameWidth || currentActiveNode.miniBossAttackFrameWidth || ch1Node?.miniBossAttackFrameWidth || 160)
                    : (waveState?.attackFrameWidth || wave3BossNode?.attackFrameWidth || ch3Node?.attackFrameWidth || currentActiveNode?.attackFrameWidth || subjectMeta?.attackFrameWidth || 128);

              const effectiveHeavyFrameWidth = (quizMode === 'test' && testModeEnemy)
                ? (testModeEnemy.heavyFrameWidth || 128)
                : isMinionStageWithSprite
                  ? (waveState?.heavyFrameWidth || currentActiveNode.minionHeavyFrameWidth || ch1Node?.minionHeavyFrameWidth || 257)
                  : isMiniBossStageWithSprite
                    ? (waveState?.heavyFrameWidth || currentActiveNode.miniBossHeavyFrameWidth || ch1Node?.miniBossHeavyFrameWidth || 160)
                    : (waveState?.heavyFrameWidth || wave3BossNode?.heavyFrameWidth || ch3Node?.heavyFrameWidth || currentActiveNode?.heavyFrameWidth || subjectMeta?.heavyFrameWidth || 176);

              const effectiveIdleFrameHeight = (quizMode === 'test' && testModeEnemy)
                ? (testModeEnemy.idleFrameHeight || 128)
                : isMinionStageWithSprite
                  ? (waveState?.idleFrameHeight || currentActiveNode.minionIdleFrameHeight || ch1Node?.minionIdleFrameHeight || 128)
                  : isMiniBossStageWithSprite
                    ? (waveState?.idleFrameHeight || currentActiveNode.miniBossIdleFrameHeight || ch1Node?.miniBossIdleFrameHeight || 128)
                    : (waveState?.idleFrameHeight || wave3BossNode?.idleFrameHeight || ch3Node?.idleFrameHeight || currentActiveNode?.idleFrameHeight || subjectMeta?.idleFrameHeight || 128);

              const effectiveAttackFrameHeight = (quizMode === 'test' && testModeEnemy)
                ? (testModeEnemy.attackFrameHeight || 128)
                : isMinionStageWithSprite
                  ? (waveState?.attackFrameHeight || currentActiveNode.minionAttackFrameHeight || ch1Node?.minionAttackFrameHeight || 218)
                  : isMiniBossStageWithSprite
                    ? (waveState?.attackFrameHeight || currentActiveNode.miniBossAttackFrameHeight || ch1Node?.miniBossAttackFrameHeight || 157)
                    : (waveState?.attackFrameHeight || wave3BossNode?.attackFrameHeight || ch3Node?.attackFrameHeight || currentActiveNode?.attackFrameHeight || subjectMeta?.attackFrameHeight || 128);

              const effectiveHeavyFrameHeight = (quizMode === 'test' && testModeEnemy)
                ? (testModeEnemy.heavyFrameHeight || 128)
                : isMinionStageWithSprite
                  ? (waveState?.heavyFrameHeight || currentActiveNode.minionHeavyFrameHeight || ch1Node?.minionHeavyFrameHeight || 218)
                  : isMiniBossStageWithSprite
                    ? (waveState?.heavyFrameHeight || currentActiveNode.miniBossHeavyFrameHeight || ch1Node?.miniBossHeavyFrameHeight || 157)
                    : (waveState?.heavyFrameHeight || wave3BossNode?.heavyFrameHeight || ch3Node?.heavyFrameHeight || currentActiveNode?.heavyFrameHeight || subjectMeta?.heavyFrameHeight || 128);

              const effectiveIdleDuration = (quizMode === 'test' && testModeEnemy)
                ? testModeEnemy.idleDuration
                : isMinionStageWithSprite
                  ? (waveState?.idleDuration || currentActiveNode.minionIdleDuration || ch1Node?.minionIdleDuration || 2.8)
                  : isMiniBossStageWithSprite
                    ? (waveState?.idleDuration || currentActiveNode.miniBossIdleDuration || ch1Node?.miniBossIdleDuration || 1.0)
                    : (waveState?.idleDuration || wave3BossNode?.idleDuration || ch3Node?.idleDuration || currentActiveNode?.idleDuration || subjectMeta?.idleDuration || undefined);

              const stageMaxHp = quizMode === 'boss-battle'
                ? calculateEnemyStageHp(battleStage, userLevel, bossDifficulty || 'MEDIUM')
                : 100;

              const isCurrentMutant = Boolean(
                (quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? waveState?.waveStage === 2 : (quizMode === 'test' ? testModeEnemy?.tier === 'mini-boss' : false)) && (
                  activeEnemyName?.toLowerCase().includes('mutant') ||
                  activeEnemyName?.toLowerCase().includes('hyperglemic mutant') ||
                  activeEnemyName?.toLowerCase().includes('hyperglycemic mutant') ||
                  idleSprite?.includes('clinchem_chapterOneMiniBoss') ||
                  currentActiveNode?.miniBossIdleSpriteUrl?.includes('clinchem_chapterOneMiniBoss') ||
                  (selectedSubject === 'Clinical Chemistry' && (currentActiveNode?.id === 'cc-1' || currentActiveNode?.id === 'cc-2'))
                )
              );

              const isCurrentAcidSlime = Boolean(
                (quizMode === 'boss-battle' ? battleStage === 1 : quizMode === 'learning' ? waveState?.waveStage === 1 : false) && (
                  idleSprite?.includes('clinchem_chapterOneMinion') ||
                  attackSprite?.includes('clinchem_chapterOneMinion') ||
                  heavyAttackSprite?.includes('clinchem_chapterOneMinion') ||
                  activeEnemyName?.toLowerCase().includes('acid slime') ||
                  (activeEnemyName?.toLowerCase().includes('slime') && !activeEnemyName?.toLowerCase().includes('reagent')) ||
                  currentActiveNode?.minionIdleSpriteUrl?.includes('clinchem_chapterOneMinion') ||
                  (selectedSubject === 'Clinical Chemistry' && currentActiveNode?.id === 'cc-1')
                )
              );

              const isCurrentAntigenTitan = Boolean(
                (quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? waveState?.waveStage === 2 : (quizMode === 'test' ? testModeEnemy?.tier === 'mini-boss' : false)) && (
                  activeEnemyName?.toLowerCase().includes('antigen') ||
                  activeEnemyName?.toLowerCase().includes('antigen titan') ||
                  idleSprite?.includes('immunohema_chapterOneMiniBoss') ||
                  (selectedSubject === 'Immunology & Serology and Immunohematology' && (currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-2'))
                )
              );

              const isCurrentKetoacidosisColossus = Boolean(
                (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? waveState?.waveStage === 3 : (quizMode === 'test' ? testModeEnemy?.tier === 'boss' : false)) && (
                  activeEnemyName?.toLowerCase().includes('ketoacidosis') ||
                  (activeEnemyName?.toLowerCase().includes('colossus') && !activeEnemyName?.toLowerCase().includes('erythrocyte')) ||
                  idleSprite?.includes('clinchem_chapterOneBoss') ||
                  currentActiveNode?.idleSpriteUrl?.includes('clinchem_chapterOneBoss') ||
                  (selectedSubject === 'Clinical Chemistry' && (currentActiveNode?.id === 'cc-1' || currentActiveNode?.id === 'cc-3'))
                )
              );

              const isCurrentImmuneArchon = Boolean(
                (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? waveState?.waveStage === 3 : (quizMode === 'test' ? testModeEnemy?.tier === 'boss' : true)) && (
                  activeEnemyName?.toLowerCase().includes('immune archon') ||
                  (activeEnemyName?.toLowerCase().includes('archon') && !activeEnemyName?.toLowerCase().includes('hydra')) ||
                  idleSprite?.includes('immunohema_chapterOneBoss') ||
                  currentActiveNode?.idleSpriteUrl?.includes('immunohema_chapterOneBoss') ||
                  (selectedSubject === 'Immunology & Serology and Immunohematology' && (currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-3') && (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? waveState?.waveStage === 3 : true))
                )
              );

              const isCurrentErythrocyteColossus = Boolean(
                (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? waveState?.waveStage === 3 : (quizMode === 'test' ? testModeEnemy?.tier === 'boss' : true)) && (
                  activeEnemyName?.toLowerCase().includes('erythrocyte') ||
                  idleSprite?.includes('hematology_chapterOneBoss') ||
                  currentActiveNode?.idleSpriteUrl?.includes('hematology_chapterOneBoss') ||
                  (selectedSubject === 'Hematology' && (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-3') && (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? waveState?.waveStage === 3 : true))
                )
              );

              const isCurrentParaffinGolem = Boolean(
                (quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? waveState?.waveStage === 2 : (quizMode === 'test' ? testModeEnemy?.tier === 'mini-boss' : false)) && (
                  activeEnemyName?.toLowerCase().includes('paraffin') ||
                  idleSprite?.includes('hispatho_chapterOneMiniBoss') ||
                  currentActiveNode?.miniBossIdleSpriteUrl?.includes('hispatho_chapterOneMiniBoss') ||
                  ((selectedSubject.toLowerCase().includes('histo') || selectedSubject.toLowerCase().includes('law')) && (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-2') && (quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? waveState?.waveStage === 2 : false))
                )
              );

              const isCurrentFixationOverlord = Boolean(
                (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? waveState?.waveStage === 3 : (quizMode === 'test' ? testModeEnemy?.tier === 'boss' : false)) && (
                  activeEnemyName?.toLowerCase().includes('fixation') ||
                  idleSprite?.includes('hispatho_chapterOneBoss') ||
                  currentActiveNode?.idleSpriteUrl?.includes('hispatho_chapterOneBoss') ||
                  ((selectedSubject.toLowerCase().includes('histo') || selectedSubject.toLowerCase().includes('law')) && (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-3') && (quizMode === 'boss-battle' ? battleStage === 3 : quizMode === 'learning' ? waveState?.waveStage === 3 : false))
                )
              );

              const isCurrentNitriteSpectre = Boolean(
                activeEnemyName?.toLowerCase().includes('nitrite') ||
                idleSprite?.includes('clinmicro_chapterOneMinionBoss') ||
                currentActiveNode?.miniBossIdleSpriteUrl?.includes('clinmicro_chapterOneMinionBoss') ||
                ((selectedSubject.toLowerCase().includes('microscopy') || selectedSubject.toLowerCase().includes('parasit')) && currentActiveNode?.id === 'cm-2' && (quizMode === 'boss-battle' ? battleStage === 2 : quizMode === 'learning' ? waveState?.waveStage === 2 : false))
              );

              const isSpecialCenteredBoss = isCurrentMutant || isCurrentAcidSlime || isCurrentAntigenTitan || isCurrentKetoacidosisColossus || isCurrentImmuneArchon || isCurrentErythrocyteColossus || isCurrentParaffinGolem || isCurrentFixationOverlord || isCurrentNitriteSpectre;

              return (
                <div className={cn(
                  "absolute top-14 right-4 md:top-16 md:right-8 transition-all duration-1000 ease-out z-10 flex flex-col",
                  isSpecialCenteredBoss ? "bottom-0 items-center pointer-events-none" : "items-end",
                  (introPhase === 'cutscene' || introPhase === 'hidden' || waveCharOffscreen) ? 'translate-x-[150%]' : 'translate-x-0',
                  isAnimating === "enemy" && "animate-shake scale-110"
                )}>
                  <div className={cn(
                    "bg-black/60 backdrop-blur-md border border-white/15 p-1.5 sm:p-2 md:p-3 rounded-[4px] md:rounded-lg shadow-2xl w-[136px] sm:w-[155px] md:min-w-[160px] md:w-auto",
                    isSpecialCenteredBoss && "shrink-0 pointer-events-auto"
                  )}>
                    <div className="flex justify-between items-center mb-0.5 md:mb-1 gap-1 md:gap-2">
                      <span className="text-[7.5px] sm:text-[8.5px] md:text-[10px] font-black text-white uppercase truncate max-w-[70px] sm:max-w-[85px] md:max-w-none">{activeEnemyName}</span>
                      <div className="flex items-center gap-0.5 md:gap-1">
                        {bossShieldActive && <span className="text-[6.5px] sm:text-[7px] md:text-[8px] bg-blue-500 text-white px-1 md:px-1.5 py-0.5 rounded-[2px] md:rounded font-black shrink-0 animate-pulse" title="Immune to Normal Attacks">SHIELDED</span>}
                        {quizMode === 'boss-battle' && enemyHealth <= 20 && enemyHealth > 0 ? (
                          <span className="text-[6.5px] sm:text-[7px] md:text-[8px] bg-red-600 text-white px-1 md:px-1.5 py-0.5 rounded-[2px] md:rounded font-black shrink-0 animate-pulse" title="2.0x damage on player mistakes!">ENRAGED</span>
                        ) : quizMode === 'boss-battle' && enemyHealth <= 60 && enemyHealth > 0 ? (
                          <span className="text-[6.5px] sm:text-[7px] md:text-[8px] bg-orange-500 text-white px-1 md:px-1.5 py-0.5 rounded-[2px] md:rounded font-black shrink-0" title="Double damage on player mistakes!">AGGRESSIVE</span>
                        ) : null}
                        {displayEnemyHp <= 0 && (
                          <span className="text-[6.5px] sm:text-[7px] md:text-[8px] bg-red-600 text-white px-1 md:px-1.5 py-0.5 rounded-[2px] md:rounded font-black shrink-0 animate-pulse">DEFEATED ☠️</span>
                        )}
                        <span className="text-[6.5px] sm:text-[7px] md:text-[8px] bg-primary text-white px-1 md:px-1.5 py-0.5 rounded-[2px] md:rounded font-black shrink-0">{activeEnemyBadge}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-0.5 px-0.5 mt-0.5">
                      <span className="text-[6px] md:text-[8px] font-bold text-white/70 tracking-widest uppercase">HP</span>
                      <span className="text-[7.5px] sm:text-[8.5px] md:text-[9.5px] font-black text-white">{Math.ceil(displayEnemyHp)} / {stageMaxHp}</span>
                    </div>
                    <div className="h-1.5 md:h-2 w-full bg-background/10 rounded-[2px] md:rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-primary transition-all duration-500 rounded-[2px] md:rounded-full" style={{ width: `${Math.min(100, (displayEnemyHp / stageMaxHp) * 100)}%` }} />
                    </div>
                  </div>
                  <div className={cn(
                    isSpecialCenteredBoss
                      ? "flex-1 w-full min-h-0 flex items-center justify-center pointer-events-auto relative"
                      : "flex justify-end pr-2 md:pr-4 mt-2 relative items-center min-h-[96px]",
                    isCurrentAntigenTitan && "-translate-y-[44px] md:-translate-y-[48px]",
                    isCurrentKetoacidosisColossus && "-translate-y-[16px] md:-translate-y-[20px]",
                    isCurrentImmuneArchon && "-translate-y-[20px] md:-translate-y-[24px]",
                    isCurrentErythrocyteColossus && "translate-y-[8px] md:translate-y-[12px]",
                    isCurrentParaffinGolem && "-translate-y-[8px] md:-translate-y-[12px]",
                    isCurrentFixationOverlord && "translate-y-[52px] md:translate-y-[60px]",
                    isCurrentNitriteSpectre && "-translate-y-[8px] md:-translate-y-[12px]"
                  )}>
                    <div className={cn(
                      "relative inline-flex items-center justify-center transition-all duration-500 transform-gpu",
                      displayEnemyHp <= 0 && "opacity-40 grayscale filter blur-[0.5px] scale-95 transition-all duration-700"
                    )}>
                      {idleSprite && attackSprite ? (
                        <BossSpriteAnimator
                          bossName={activeEnemyName || currentActiveNode?.bossName}
                          normalAttackSfxUrl={
                            (activeEnemyName?.toLowerCase().includes('nitrite') || currentActiveNode?.id === 'cm-2')
                              ? '/SoundEffects/KetoacidosisColossusNormalAttack.mp3'
                              : (quizMode === 'test' && testModeEnemy?.normalAttackSfxUrl)
                                ? testModeEnemy.normalAttackSfxUrl
                                : (waveState?.normalAttackSfxUrl ||
                                  (activeEnemyName?.toLowerCase().includes('specter') && !activeEnemyName?.toLowerCase().includes('nitrite')
                                    ? '/SoundEffects/HyperglemicSpecterNormalAttack.mp3'
                                    : (activeEnemyName?.toLowerCase().includes('mutant') || ((currentActiveNode?.id === 'cc-1' || currentActiveNode?.id === 'cc-2') && (activeEnemyBadge?.includes('MINI-BOSS') || (quizMode === 'boss-battle' && battleStage === 2))))
                                      ? '/SoundEffects/SickleCellNormalAttack.mp3'
                                      : (activeEnemyName?.toLowerCase().includes('acid slime') || (activeEnemyName?.toLowerCase().includes('slime') && !activeEnemyName?.toLowerCase().includes('reagent')) || (currentActiveNode?.id === 'cc-1' && (activeEnemyBadge?.includes('MINION') || (quizMode === 'boss-battle' && battleStage === 1))))
                                        ? '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3'
                                        : (activeEnemyName?.toLowerCase().includes('reagent') || attackSprite?.includes('clinmicro_chapterOneMinion') || (currentActiveNode?.id === 'cm-1' && (activeEnemyBadge === 'MINION' || quizMode !== 'boss-battle')))
                                          ? '/SoundEffects/ReagentStripSlimeNormal&HeavyAttack.mp3'
                                          : (activeEnemyName?.toLowerCase().includes('gram positive') || ((currentActiveNode?.id === 'mb-1' || currentActiveNode?.id === 'mb-3') && (activeEnemyBadge === 'BOSS' || battleStage === 3)))
                                            ? '/SoundEffects/GramPositiveNormal&HeavyAttack.mp3'
                                            : activeEnemyName?.toLowerCase().includes('staph')
                                              ? '/SoundEffects/BiohazardOverlordNormalAttack.mp3'
                                              : (activeEnemyName?.toLowerCase().includes('reaper') || currentActiveNode?.id === 'hem-4' || attackSprite?.includes('hematology_finalboss'))
                                                ? '/SoundEffects/SickleCellReaperNormalAttack.mp3'
                                                : ((activeEnemyName?.toLowerCase().includes('sickle cell') && !activeEnemyName?.toLowerCase().includes('reaper')) || currentActiveNode?.id === 'hem-1')
                                                  ? '/SoundEffects/SickleCellNormalAttack.mp3'
                                                  : (activeEnemyName?.toLowerCase().includes('fungal spore') || activeEnemyName?.toLowerCase().includes('gms') || attackSprite?.includes('hispatho_chapterOneMinion') || (currentActiveNode?.id === 'hp-1' && (activeEnemyBadge === 'MINION' || quizMode !== 'boss-battle')))
                                                    ? '/SoundEffects/FungalSporeNormalAttack.mp3'
                                                    : activeEnemyName?.toLowerCase().includes('microbe swarm')
                                                      ? '/SoundEffects/MicrobeSwarmNormalAttack.mp3'
                                                      : (activeEnemyName?.toLowerCase().includes('lymphocyte') || attackSprite?.includes('immunohema_chapterOneMinion') || (currentActiveNode?.id === 'is-1' && (activeEnemyBadge === 'MINION' || quizMode !== 'boss-battle')))
                                                        ? '/SoundEffects/MicrobeSwarmNormalAttack.mp3'
                                                        : (activeEnemyName?.toLowerCase().includes('biohazard') || currentActiveNode?.id === 'mb-4')
                                                          ? '/SoundEffects/BiohazardOverlordNormalAttack.mp3'
                                                          : (activeEnemyName?.toLowerCase().includes('crystal golem') || currentActiveNode?.id === 'cm-4')
                                                            ? '/SoundEffects/CrystalGolemNormalAttack.mp3'
                                                            : (activeEnemyName?.toLowerCase().includes('antigen') || ((currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-2') && (activeEnemyBadge?.includes('MINI-BOSS') || (quizMode === 'boss-battle' && battleStage === 2))))
                                                              ? '/SoundEffects/KetoacidosisColossusNormalAttack.mp3'
                                                              : (activeEnemyName?.toLowerCase().includes('archon') || ((currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-3') && (activeEnemyBadge?.includes('BOSS') || (quizMode === 'boss-battle' && battleStage === 3))))
                                                                ? '/SoundEffects/ImmuneArchonNormalAttack.mp3'
                                                                : (currentActiveNode?.normalAttackSfxUrl || subjectMeta?.normalAttackSfxUrl)))
                          }
                          heavyAttackSfxUrl={
                            (activeEnemyName?.toLowerCase().includes('nitrite') || currentActiveNode?.id === 'cm-2')
                              ? '/SoundEffects/FungalSporeNormalAttack.mp3'
                              : (quizMode === 'test' && testModeEnemy?.heavyAttackSfxUrl)
                                ? testModeEnemy.heavyAttackSfxUrl
                                : (waveState?.heavyAttackSfxUrl ||
                                (activeEnemyName?.toLowerCase().includes('specter') && !activeEnemyName?.toLowerCase().includes('nitrite')
                                  ? '/SoundEffects/HyperglemicSpecterHeavyAttack.mp3'
                                  : (activeEnemyName?.toLowerCase().includes('mutant') || ((currentActiveNode?.id === 'cc-1' || currentActiveNode?.id === 'cc-2') && (activeEnemyBadge?.includes('MINI-BOSS') || (quizMode === 'boss-battle' && battleStage === 2))))
                                    ? '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3'
                                    : (activeEnemyName?.toLowerCase().includes('acid slime') || (activeEnemyName?.toLowerCase().includes('slime') && !activeEnemyName?.toLowerCase().includes('reagent')) || (currentActiveNode?.id === 'cc-1' && (activeEnemyBadge?.includes('MINION') || (quizMode === 'boss-battle' && battleStage === 1))))
                                      ? '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3'
                                      : (activeEnemyName?.toLowerCase().includes('reagent') || heavyAttackSprite?.includes('clinmicro_chapterOneMinion') || (currentActiveNode?.id === 'cm-1' && (activeEnemyBadge === 'MINION' || quizMode !== 'boss-battle')))
                                        ? '/SoundEffects/ReagentStripSlimeNormal&HeavyAttack.mp3'
                                        : (activeEnemyName?.toLowerCase().includes('gram positive') || ((currentActiveNode?.id === 'mb-1' || currentActiveNode?.id === 'mb-3') && (activeEnemyBadge === 'BOSS' || battleStage === 3)))
                                          ? '/SoundEffects/GramPositiveNormal&HeavyAttack.mp3'
                                          : activeEnemyName?.toLowerCase().includes('staph')
                                            ? '/SoundEffects/BiohazardOverlordNormalAttack.mp3'
                                            : (activeEnemyName?.toLowerCase().includes('reaper') || currentActiveNode?.id === 'hem-4' || heavyAttackSprite?.includes('hematology_finalboss'))
                                              ? '/SoundEffects/SickleCellReaperHeavyAttack.mp3'
                                              : ((activeEnemyName?.toLowerCase().includes('sickle cell') && !activeEnemyName?.toLowerCase().includes('reaper')) || currentActiveNode?.id === 'hem-1')
                                                ? '/SoundEffects/SickleCellHeavyAttack.mp3'
                                                : (activeEnemyName?.toLowerCase().includes('fungal spore') || activeEnemyName?.toLowerCase().includes('gms') || heavyAttackSprite?.includes('hispatho_chapterOneMinion') || (currentActiveNode?.id === 'hp-1' && (activeEnemyBadge === 'MINION' || quizMode !== 'boss-battle')))
                                                  ? '/SoundEffects/FungalSporeHeavyAttack.mp3'
                                                  : activeEnemyName?.toLowerCase().includes('microbe swarm')
                                                    ? '/SoundEffects/MicrobeSwarmHeavyAttack.wav'
                                                    : (activeEnemyName?.toLowerCase().includes('lymphocyte') || heavyAttackSprite?.includes('immunohema_chapterOneMinion') || (currentActiveNode?.id === 'is-1' && (activeEnemyBadge === 'MINION' || quizMode !== 'boss-battle')))
                                                      ? '/SoundEffects/MicrobeSwarmHeavyAttack.wav'
                                                      : (activeEnemyName?.toLowerCase().includes('biohazard') || currentActiveNode?.id === 'mb-4')
                                                        ? '/SoundEffects/BiohazardOverlordHeavyAttack.mp3'
                                                        : (activeEnemyName?.toLowerCase().includes('crystal golem') || currentActiveNode?.id === 'cm-4')
                                                          ? '/SoundEffects/CrystalGolemHeavyAttack.mp3'
                                                          : (activeEnemyName?.toLowerCase().includes('antigen') || ((currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-2') && (activeEnemyBadge?.includes('MINI-BOSS') || (quizMode === 'boss-battle' && battleStage === 2))))
                                                            ? '/SoundEffects/CrystalGolemNormalAttack.mp3'
                                                            : (activeEnemyName?.toLowerCase().includes('archon') || ((currentActiveNode?.id === 'is-1' || currentActiveNode?.id === 'is-3') && (activeEnemyBadge?.includes('BOSS') || (quizMode === 'boss-battle' && battleStage === 3))))
                                                              ? '/SoundEffects/AntiSerumHydraHeavyAttack.mp3'
                                                              : (currentActiveNode?.heavyAttackSfxUrl || subjectMeta?.heavyAttackSfxUrl)))
                          }
                          idleSpriteUrl={idleSprite}
                          attackSpriteUrl={attackSprite}
                          heavyAttackSpriteUrl={heavyAttackSprite || undefined}
                          slashSpriteUrl={waveState?.slashSpriteUrl || (quizMode === 'test' ? (testModeEnemy?.slashSprite || undefined) : undefined) || currentActiveNode?.miniBossSlashSpriteUrl || (activeEnemyName?.toLowerCase().includes('anemia') ? '/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_SlashAnimation.png' : undefined)}
                          attackProjectileUrl={waveState?.attackProjectileUrl || (quizMode === 'test' ? (testModeEnemy?.attackProjectileUrl || undefined) : undefined) || currentActiveNode?.attackProjectileUrl || subjectMeta?.attackProjectileUrl || undefined}
                          attackProjectileFrames={waveState?.attackProjectileFrames || (quizMode === 'test' ? (testModeEnemy?.attackProjectileFrames || 5) : null) || currentActiveNode?.attackProjectileFrames || subjectMeta?.attackProjectileFrames || 5}
                          undergroundSpikesUrl={
                            (isMinionStageWithSprite || isMiniBossStageWithSprite || (quizMode !== 'test' && !isChapter3FinalBoss && (activeEnemyName?.toLowerCase().includes('sickle cell') || activeEnemyName?.toLowerCase().includes('erythrocyte') || currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-3' || currentActiveNode?.bossName?.toLowerCase().includes('erythrocyte'))))
                              ? undefined
                              : (attackSprite?.includes('hematology_finalboss_normalAttackGlintAnimation')
                                ? (currentActiveNode?.undergroundSpikesUrl || subjectMeta?.undergroundSpikesUrl || '/images/bosses/hematology_finalboss_normalAttackUndergroundSpikesAnimation.png')
                                : (waveState?.undergroundSpikesUrl || (quizMode === 'test' ? (testModeEnemy?.undergroundSpikesUrl || undefined) : undefined) || currentActiveNode?.undergroundSpikesUrl || (isChapter3FinalBoss ? subjectMeta?.undergroundSpikesUrl : undefined))
                              )
                          }
                          undergroundSpikesFrames={
                            (isMinionStageWithSprite || isMiniBossStageWithSprite || (quizMode !== 'test' && !isChapter3FinalBoss && (activeEnemyName?.toLowerCase().includes('sickle cell') || activeEnemyName?.toLowerCase().includes('erythrocyte') || currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-3' || currentActiveNode?.bossName?.toLowerCase().includes('erythrocyte'))))
                              ? undefined
                              : (attackSprite?.includes('hematology_finalboss_normalAttackGlintAnimation')
                                ? (currentActiveNode?.undergroundSpikesFrames || subjectMeta?.undergroundSpikesFrames || 8)
                                : (waveState?.undergroundSpikesFrames || (quizMode === 'test' ? (testModeEnemy?.undergroundSpikesFrames || 8) : null) || currentActiveNode?.undergroundSpikesFrames || (isChapter3FinalBoss ? subjectMeta?.undergroundSpikesFrames : 8))
                              )
                          }
                          idleFrames={effectiveIdleFrames}
                          attackFrames={effectiveAttackFrames}
                          heavyAttackFrames={effectiveHeavyAttackFrames}
                          idleFrameWidth={effectiveIdleFrameWidth}
                          attackFrameWidth={effectiveAttackFrameWidth}
                          heavyFrameWidth={effectiveHeavyFrameWidth}
                          idleFrameHeight={effectiveIdleFrameHeight}
                          attackFrameHeight={effectiveAttackFrameHeight}
                          heavyFrameHeight={effectiveHeavyFrameHeight}
                          idleDuration={effectiveIdleDuration || waveState?.idleDuration || currentActiveNode?.idleDuration || subjectMeta?.idleDuration || undefined}
                          idleFps={waveState?.idleFps || currentActiveNode?.idleFps || subjectMeta?.idleFps || undefined}
                          animState={(introPhase === 'active' && !judgementText && !battleOutcome && !isFinished) ? bossAnimState : 'idle'}
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
              "absolute bottom-0 left-0 transition-all duration-1000 ease-out z-30 flex flex-col md:flex-row items-start md:items-end gap-1 md:gap-3",
              (introPhase === 'cutscene' || introPhase === 'hidden' || waveCharOffscreen) ? '-translate-x-[150%]' : 'translate-x-0',
              isAnimating === "player" && "animate-shake scale-105",
              isFleeing && "-translate-x-full opacity-0 duration-700 pointer-events-none"
            )}>
              {/* Standalone Foreground Player Character Sprite - Completely flush to bottom-left */}
              <div className={cn(
                "relative flex flex-col items-center justify-end shrink-0 -mb-4 md:-mb-6 -ml-2 md:-ml-4 transition-all transform-gpu z-20 order-2 md:order-1",
                playerAnimState === 'attack' && !judgementText && !battleOutcome && !isFinished && "animate-player-lunge"
              )}>
                {/* Ground Shadow for Player Character */}
                <div className="absolute bottom-4 w-36 md:w-52 h-5 bg-black/70 rounded-[100%] blur-md scale-y-50 pointer-events-none" />

                {/* Underground Spikes Eruption Animation directly beneath the Player - Sickle-Cell Reaper & Hematology Glint Attack */}
                {(() => {
                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const isChapter3FinalBoss = currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4 || currentActiveNode?.id === 'hem-4';
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;
                  const isMinionWithSprite = (quizMode === 'boss-battle' && !isChapter3FinalBoss && battleStage === 1 && !!currentActiveNode?.minionIdleSpriteUrl) || (quizMode === 'learning' && waveState?.waveStage === 1);
                  const isMiniBossWithSprite = (quizMode === 'boss-battle' && !isChapter3FinalBoss && battleStage === 2 && !!currentActiveNode?.miniBossIdleSpriteUrl) || (quizMode === 'learning' && waveState?.waveStage === 2);
                  if (isMinionWithSprite || isMiniBossWithSprite) return null;

                  // Strictly Final Boss Sickle-Cell Reaper (hem-4 / Final Boss).
                  // NEVER Minion (hem-1 Sickle Cell), Mini-Boss (hem-2 Anemia Shade), or Chapter Boss (hem-3 Erythrocyte Colossus)!
                  if (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-2' || currentActiveNode?.id === 'hem-3' || currentActiveNode?.bossName?.toLowerCase().includes('erythrocyte') || waveState?.name?.toLowerCase().includes('erythrocyte') || waveState?.idleSprite?.includes('hematology_chapterOneBoss')) {
                    return null;
                  }

                  const subjectMeta = getSubjectMeta(selectedSubject);
                  const currentEnemyAttackSprite = quizMode === 'boss-battle'
                    ? (isChapter3FinalBoss
                      ? (currentActiveNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl)
                      : (battleStage === 1 && currentActiveNode?.minionAttackSpriteUrl
                        ? currentActiveNode.minionAttackSpriteUrl
                        : battleStage === 2 && currentActiveNode?.miniBossAttackSpriteUrl
                          ? currentActiveNode.miniBossAttackSpriteUrl
                          : (currentActiveNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl)))
                    : (quizMode === 'learning'
                      ? waveState?.attackSprite
                      : (currentActiveNode?.attackSpriteUrl || subjectMeta?.attackSpriteUrl));

                  const isHematology = selectedSubject === 'Hematology' || (selectedSubject?.toLowerCase().includes('hematology') && !selectedSubject?.toLowerCase().includes('immuno'));
                  const isReaper = isChapter3FinalBoss || currentActiveNode?.bossName?.toLowerCase().includes('reaper') || Boolean(waveState?.name?.toLowerCase().includes('reaper')) || (quizMode === 'test' && (testModeEnemy?.tier === 'final-boss' && isHematology));

                  const spikesUrl = (quizMode === 'learning' ? waveState?.undergroundSpikesUrl : null) ||
                    (quizMode === 'test' ? testModeEnemy?.undergroundSpikesUrl : null) ||
                    currentActiveNode?.undergroundSpikesUrl ||
                    ((currentEnemyAttackSprite?.includes('hematology_finalboss') || (isHematology && isReaper))
                      ? '/images/bosses/hematology_finalboss_normalAttackUndergroundSpikesAnimation.png'
                      : '');
                  const spikesFrames = (quizMode === 'learning' ? waveState?.undergroundSpikesFrames : null) || (quizMode === 'test' ? (testModeEnemy?.undergroundSpikesFrames || 8) : null) || currentActiveNode?.undergroundSpikesFrames || 8;

                  const shouldRenderSpikes = Boolean(
                    spikesUrl && (
                      currentEnemyAttackSprite?.includes('hematology_finalboss') ||
                      (isChapter3FinalBoss && currentActiveNode?.undergroundSpikesUrl) ||
                      (quizMode === 'learning' && waveState?.waveStage === 3 && isReaper) ||
                      (quizMode === 'test' && isReaper)
                    )
                  );

                  if (!shouldRenderSpikes || !spikesUrl) return null;

                  return (
                    <UndergroundSpikesAnimator
                      isActive={bossAnimState === 'normal_attack'}
                      triggerKey={hitEffectKey}
                      spriteUrl={spikesUrl}
                      frames={spikesFrames}
                      delayMs={400}
                      durationMs={550}
                      scale={2.2}
                      className="bottom-1 md:bottom-2 left-1/2 -translate-x-1/2"
                    />
                  );
                })()}

                {/* Chapter 3 Histopathology Final Boss (Legal Beholder): Judicial Hammer Attack Overlay */}
                {(() => {
                  const isHistoSubject = Boolean(selectedSubject?.toLowerCase().includes('histo') || selectedSubject?.toLowerCase().includes('law'));
                  if (!isHistoSubject) return null;

                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;

                  // Strictly Chapter 3 Final Boss Legal Beholder (hp-4). NEVER Minion (hp-1), Mini-Boss (hp-2), or Chapter Boss (hp-3)
                  if (quizMode === 'test') {
                    if (testModeEnemy?.tier !== 'final-boss' || testModeEnemy?.name?.toLowerCase().includes('fixation') || testModeEnemy?.name?.toLowerCase().includes('paraffin')) {
                      return null;
                    }
                  } else if (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-2' || currentActiveNode?.id === 'hp-3' || currentActiveNode?.bossName?.toLowerCase().includes('fixation') || currentActiveNode?.miniBossName?.toLowerCase().includes('paraffin') || waveState?.name?.toLowerCase().includes('fixation') || waveState?.name?.toLowerCase().includes('paraffin') || waveState?.idleSprite?.includes('hispatho_chapterOneBoss')) {
                    return null;
                  }

                  const isChapter3FinalBoss = currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4 || currentActiveNode?.id === 'hp-4';
                  const isLegalBeholder = isChapter3FinalBoss || currentActiveNode?.bossName?.toLowerCase().includes('legal beholder') || Boolean(waveState?.name?.toLowerCase().includes('legal beholder')) || (quizMode === 'test' && testModeEnemy?.tier === 'final-boss');

                  const isLegalBeholderActive = quizMode === 'boss-battle'
                    ? (isLegalBeholder && (battleStage === 3 || battleStage === 4 || isChapter3FinalBoss))
                    : quizMode === 'learning'
                      ? (waveState?.waveStage === 3 && isLegalBeholder)
                      : quizMode === 'test'
                        ? (isLegalBeholder && testModeEnemy?.tier === 'final-boss')
                        : isChapter3FinalBoss;
                  if (!isLegalBeholderActive) return null;

                  const hammerUrl = (quizMode === 'learning' ? waveState?.hammerAttackUrl : null) || (quizMode === 'test' ? testModeEnemy?.hammerAttackUrl : null) || currentActiveNode?.hammerAttackUrl || (isLegalBeholder ? '/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackHammerAnimation-2.png' : null);
                  const hammerFrames = (quizMode === 'learning' ? waveState?.hammerAttackFrames : null) || (quizMode === 'test' ? testModeEnemy?.hammerAttackFrames : null) || currentActiveNode?.hammerAttackFrames || 11;
                  if (!hammerUrl) return null;
                  return (
                    <JudicialHammerAnimator
                      isActive={bossAnimState === 'normal_attack'}
                      spriteUrl={hammerUrl}
                      frames={hammerFrames}
                      delayMs={220}
                      durationMs={620}
                      scale={2.6}
                      className="bottom-4 sm:bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-30"
                    />
                  );
                })()}

                {/* Chapter 3 Histopathology Final Boss (Legal Beholder): Underground Blast Heavy Attack Overlay */}
                {(() => {
                  const isHistoSubject = Boolean(selectedSubject?.toLowerCase().includes('histo') || selectedSubject?.toLowerCase().includes('law'));
                  if (!isHistoSubject) return null;

                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;

                  // Strictly Chapter 3 Final Boss Legal Beholder (hp-4). NEVER Minion (hp-1), Mini-Boss (hp-2), or Chapter Boss (hp-3)
                  if (quizMode === 'test') {
                    if (testModeEnemy?.tier !== 'final-boss' || testModeEnemy?.name?.toLowerCase().includes('fixation') || testModeEnemy?.name?.toLowerCase().includes('paraffin')) {
                      return null;
                    }
                  } else if (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-2' || currentActiveNode?.id === 'hp-3' || currentActiveNode?.bossName?.toLowerCase().includes('fixation') || currentActiveNode?.miniBossName?.toLowerCase().includes('paraffin') || waveState?.name?.toLowerCase().includes('fixation') || waveState?.name?.toLowerCase().includes('paraffin') || waveState?.idleSprite?.includes('hispatho_chapterOneBoss')) {
                    return null;
                  }

                  const isChapter3FinalBoss = currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4 || currentActiveNode?.id === 'hp-4';
                  const isLegalBeholder = isChapter3FinalBoss || currentActiveNode?.bossName?.toLowerCase().includes('legal beholder') || Boolean(waveState?.name?.toLowerCase().includes('legal beholder')) || (quizMode === 'test' && testModeEnemy?.tier === 'final-boss');

                  const isLegalBeholderActive = quizMode === 'boss-battle'
                    ? (isLegalBeholder && (battleStage === 3 || battleStage === 4 || isChapter3FinalBoss))
                    : quizMode === 'learning'
                      ? (waveState?.waveStage === 3 && isLegalBeholder)
                      : quizMode === 'test'
                        ? (isLegalBeholder && testModeEnemy?.tier === 'final-boss')
                        : isChapter3FinalBoss;
                  if (!isLegalBeholderActive) return null;

                  const blastUrl = (quizMode === 'learning' ? waveState?.undergroundBlastUrl : null) || (quizMode === 'test' ? testModeEnemy?.undergroundBlastUrl : null) || currentActiveNode?.undergroundBlastUrl || (isLegalBeholder ? '/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackUndergroundBlastAnimation.png' : null);
                  const blastFrames = (quizMode === 'learning' ? waveState?.undergroundBlastFrames : null) || (quizMode === 'test' ? testModeEnemy?.undergroundBlastFrames : null) || currentActiveNode?.undergroundBlastFrames || 16;
                  if (!blastUrl) return null;
                  return (
                    <UndergroundBlastAnimator
                      isActive={bossAnimState === 'heavy_attack'}
                      spriteUrl={blastUrl}
                      frames={blastFrames}
                      delayMs={240}
                      durationMs={820}
                      scale={2.8}
                      className="bottom-0 md:bottom-2 left-1/2 -translate-x-1/2 z-30"
                    />
                  );
                })()}

                {/* Immunology & Serology and Immunohematology: Anti-Serum Hydra Heavy Attack Lightning Overlay */}
                {(() => {
                  const isImmunoSubject = Boolean(selectedSubject?.toLowerCase().includes('immuno') || selectedSubject?.toLowerCase().includes('serology'));
                  if (!isImmunoSubject) return null;

                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const isChapter3FinalBoss = currentActiveNode?.tier === 'final-boss' || currentActiveNode?.nodeNumber === 4 || currentActiveNode?.id === 'is-4';
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;

                  const isHydraActive = quizMode === 'boss-battle'
                    ? (isChapter3FinalBoss && (battleStage === 3 || battleStage === 4))
                    : quizMode === 'learning'
                      ? (isChapter3FinalBoss && waveState?.waveStage === 3)
                      : quizMode === 'test'
                        ? (testModeEnemy?.tier === 'final-boss' && (Boolean(testModeEnemy?.name?.toLowerCase().includes('hydra')) || testModeEnemy?.nodeId === 'is-4' || testModeEnemy?.nodeId === 'is-3'))
                        : false;

                  if (!isHydraActive) return null;

                  return (
                    <HydraLightningAnimator
                      isActive={bossAnimState === 'heavy_attack'}
                      className="bottom-6 sm:bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 z-30"
                    />
                  );
                })()}

                {/* Immunology & Serology and Immunohematology: Immune Archon Heavy Attack Thunder Overlay */}
                {(() => {
                  const isImmunoSubject = Boolean(selectedSubject?.toLowerCase().includes('immuno') || selectedSubject?.toLowerCase().includes('serology'));
                  if (!isImmunoSubject) return null;

                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const isChapterBoss = currentActiveNode?.nodeNumber === 3 || currentActiveNode?.tier === 'boss' || currentActiveNode?.id === 'is-3' || currentActiveNode?.id === 'is-1';
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;

                  const isArchonActive = quizMode === 'boss-battle'
                    ? ((isChapterBoss || Boolean(currentActiveNode?.bossName?.toLowerCase().includes('archon'))) && (battleStage === 3 || battleStage === 4))
                    : quizMode === 'learning'
                      ? ((isChapterBoss || Boolean(waveState?.name?.toLowerCase().includes('archon'))) && waveState?.waveStage === 3 && !waveState?.name?.toLowerCase().includes('hydra'))
                      : quizMode === 'test'
                        ? (testModeEnemy?.tier === 'boss' && (Boolean(testModeEnemy?.name?.toLowerCase().includes('archon')) || testModeEnemy?.nodeId === 'is-3' || testModeEnemy?.nodeId === 'is-1'))
                        : false;

                  if (!isArchonActive) return null;

                  return (
                    <ArchonThunderAnimator
                      isActive={bossAnimState === 'heavy_attack'}
                      className="bottom-6 sm:bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 z-30"
                    />
                  );
                })()}

                {/* Chapter 1 Histopathology Mini-Boss (Paraffin Golem): Heavy Attack Balls Overlay on Player Body */}
                {(() => {
                  const isHisto = selectedSubject?.toLowerCase().includes('histo') || selectedSubject?.toLowerCase().includes('law');
                  if (!isHisto) return null;

                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;

                  // Strictly Chapter 1 Mini-Boss Stage 2 (Paraffin Golem), NEVER Minion (GMS Fungal Spore) or Final Boss hp-4 (Legal Beholder)
                  const isParaffinActive = Boolean(
                    quizMode === 'boss-battle'
                      ? (battleStage === 2 && (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-2' || currentActiveNode?.miniBossName?.toLowerCase().includes('paraffin') || currentActiveNode?.miniBossIdleSpriteUrl?.includes('hispatho_chapterOneMiniBoss')))
                      : quizMode === 'learning'
                        ? (waveState?.waveStage === 2 && (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-2' || currentActiveNode?.miniBossName?.toLowerCase().includes('paraffin') || waveState?.name?.toLowerCase().includes('paraffin') || waveState?.idleSprite?.includes('hispatho_chapterOneMiniBoss')))
                        : quizMode === 'test'
                          ? (testModeEnemy?.tier === 'mini-boss' && (testModeEnemy?.name?.toLowerCase().includes('paraffin') || Boolean(testModeEnemy?.heavyAttackBallsUrl)))
                          : false
                  );

                  if (!isParaffinActive) return null;

                  const ballsUrl = (quizMode === 'learning' ? (waveState as any)?.heavyAttackBallsUrl : null) || (quizMode === 'test' ? testModeEnemy?.heavyAttackBallsUrl : null) || (currentActiveNode as any)?.miniBossHeavyAttackBallsUrl || '/images/bosses/hispatho_chapterOneMiniBoss_heavyAttackBallsAnimation-2.png';

                  return (
                    <ParaffinBallsAnimator
                      isActive={bossAnimState === 'heavy_attack'}
                      spriteUrl={ballsUrl}
                      frames={12}
                      delayMs={240}
                      durationMs={820}
                      scale={2.0}
                      className="-bottom-16 sm:-bottom-24 md:-bottom-[120px] left-1/2 sm:left-[52%] -translate-x-1/2 z-30"
                    />
                  );
                })()}

                {/* Chapter 1 Histopathology Boss (Fixation Overlord): Heavy Attack Nailed Overlay on Player Body */}
                {(() => {
                  const isHisto = selectedSubject?.toLowerCase().includes('histo') || selectedSubject?.toLowerCase().includes('law');
                  if (!isHisto) return null;

                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;

                  // Strictly Chapter 1 Boss Stage 3 (Fixation Overlord), NEVER Minion (GMS Fungal Spore), Mini-Boss (Paraffin Golem), or Final Boss hp-4 (Legal Beholder)
                  const isFixationActive = Boolean(
                    quizMode === 'boss-battle'
                      ? (battleStage === 3 && (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-3' || currentActiveNode?.bossName?.toLowerCase().includes('fixation') || currentActiveNode?.idleSpriteUrl?.includes('hispatho_chapterOneBoss')))
                      : quizMode === 'learning'
                        ? (waveState?.waveStage === 3 && (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-3' || currentActiveNode?.bossName?.toLowerCase().includes('fixation') || waveState?.name?.toLowerCase().includes('fixation') || waveState?.idleSprite?.includes('hispatho_chapterOneBoss')))
                        : quizMode === 'test'
                          ? (testModeEnemy?.tier === 'boss' && (testModeEnemy?.name?.toLowerCase().includes('fixation') || Boolean(testModeEnemy?.heavyAttackNailedUrl)))
                          : (currentActiveNode?.id === 'hp-1' || currentActiveNode?.id === 'hp-3' || currentActiveNode?.bossName?.toLowerCase().includes('fixation'))
                  );

                  if (!isFixationActive) return null;

                  const nailedUrl = (quizMode === 'learning' ? waveState?.heavyAttackNailedUrl : null) || (quizMode === 'test' ? testModeEnemy?.heavyAttackNailedUrl : null) || currentActiveNode?.heavyAttackNailedUrl || '/images/bosses/hispatho_chapterOneBoss_heavtAttackNailedAnimation-2.png';

                  return (
                    <FixationNailedAnimator
                      isActive={bossAnimState === 'heavy_attack'}
                      triggerKey={hitEffectKey}
                      spriteUrl={nailedUrl}
                      frames={15}
                      delayMs={240}
                      durationMs={960}
                      scale={2.2}
                      className="bottom-2 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40"
                    />
                  );
                })()}

                {/* Chapter 1 Hematology Boss (Erythrocyte Colossus): Heavy Attack Fist Overlay crushing Player's Body */}
                {(() => {
                  const isHematology = selectedSubject === 'Hematology' || (selectedSubject?.toLowerCase().includes('hematology') && !selectedSubject?.toLowerCase().includes('immuno'));
                  if (!isHematology) return null;

                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;

                  // Strictly Chapter 1 Boss Stage 3 (Erythrocyte Colossus), NEVER Minion (Sickle Cell) or Mini-Boss (Anemia Shade) or Final Boss hem-4 (Sickle-Cell Reaper)
                  const isErythrocyteActive = Boolean(
                    quizMode === 'boss-battle'
                      ? (battleStage === 3 && (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-3' || currentActiveNode?.bossName?.toLowerCase().includes('erythrocyte') || currentActiveNode?.idleSpriteUrl?.includes('hematology_chapterOneBoss')))
                      : quizMode === 'learning'
                        ? (waveState?.waveStage === 3 && (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-3' || currentActiveNode?.bossName?.toLowerCase().includes('erythrocyte') || waveState?.name?.toLowerCase().includes('erythrocyte') || waveState?.idleSprite?.includes('hematology_chapterOneBoss')))
                        : quizMode === 'test'
                          ? (testModeEnemy?.tier === 'boss' && (testModeEnemy?.name?.toLowerCase().includes('erythrocyte') || Boolean(testModeEnemy?.heavyAttackFistUrl)))
                          : (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-3' || currentActiveNode?.bossName?.toLowerCase().includes('erythrocyte'))
                  );

                  if (!isErythrocyteActive) return null;

                  const fistUrl = (quizMode === 'learning' ? (waveState as any)?.heavyAttackFistUrl : null) || (quizMode === 'test' ? testModeEnemy?.heavyAttackFistUrl : null) || (currentActiveNode as any)?.heavyAttackFistUrl || '/images/bosses/hematology_chapterOneBoss_heavyAttackFistAnimation-2.png';

                  return (
                    <ColossusFistAnimator
                      isActive={bossAnimState === 'heavy_attack'}
                      triggerKey={hitEffectKey}
                      spriteUrl={fistUrl}
                      sfxUrl="/SoundEffects/ErythrocyeColossusHeavyAttack.mp3"
                      frames={9}
                      delayMs={220}
                      durationMs={720}
                      scale={2.5}
                      className="bottom-0 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30"
                    />
                  );
                })()}

                {/* Chapter 1 Hematology Mini-Boss (Anemia Shade): Heavy Attack Slash Overlay directly on Player's Body */}
                {(() => {
                  const isHematology = selectedSubject === 'Hematology' || (selectedSubject?.toLowerCase().includes('hematology') && !selectedSubject?.toLowerCase().includes('immuno'));
                  if (!isHematology) return null;

                  const activeNodes = getSubjectNodes(selectedSubject);
                  const currentActiveNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
                  const waveState = quizMode === 'learning' ? getLearningWaveState(questions, userAnswers, selectedSubject, learningWaveEnemies, undefined, activeQuizIndex) : null;

                  // Strictly Stage 2 Mini-Boss (Anemia Shade), NEVER Stage 1 (Sickle Cell) or Stage 3 (Colossus) or Stage 4 (Reaper), and NEVER Antigen Titan
                  const isAnemiaActive = Boolean(
                    quizMode === 'boss-battle'
                      ? (battleStage === 2 && (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-2' || currentActiveNode?.miniBossName?.toLowerCase().includes('anemia')))
                      : quizMode === 'learning'
                        ? (waveState?.waveStage === 2 && (currentActiveNode?.id === 'hem-1' || currentActiveNode?.id === 'hem-2' || currentActiveNode?.miniBossName?.toLowerCase().includes('anemia') || waveState?.name?.toLowerCase().includes('anemia') || waveState?.idleSprite?.includes('hematology_chapterOneMiniBoss')))
                        : quizMode === 'test'
                          ? (testModeEnemy?.tier === 'mini-boss' && (testModeEnemy?.name?.toLowerCase().includes('anemia') || Boolean(testModeEnemy?.slashSprite)))
                          : false
                  );

                  if (!isAnemiaActive) return null;

                  const slashUrl = (quizMode === 'learning' ? waveState?.slashSpriteUrl : null) || (quizMode === 'test' ? testModeEnemy?.slashSprite : null) || currentActiveNode?.miniBossSlashSpriteUrl || '/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_SlashAnimation.png';

                  return (
                    <AnemiaSlashAnimator
                      isActive={bossAnimState === 'heavy_attack'}
                      triggerKey={hitEffectKey}
                      spriteUrl={slashUrl}
                      frames={15}
                      delayMs={620}
                      durationMs={740}
                      scale={2.6}
                      className="bottom-4 sm:bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-30"
                    />
                  );
                })()}

                <div className="relative z-10 w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-84 lg:h-84 shrink-0 transition-transform">
                  <Image
                    src="/images/player/userPlayer_placeholder.png"
                    alt="Aspirant Character Sprite"
                    width={300}
                    height={300}
                    priority
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
                  <div className="order-1 md:order-2 bg-black/60 backdrop-blur-md border border-white/15 p-1.5 sm:p-2 md:p-3 rounded-[4px] md:rounded-lg shadow-2xl w-[136px] sm:w-[155px] md:min-w-[170px] md:w-auto relative mb-0 md:mb-3 ml-2 md:ml-1 z-20">
                    {streak >= 2 && (
                      <div className="absolute -top-2.5 -right-1.5 md:-top-3.5 md:-right-2 z-30 animate-bounce">
                        <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 border border-yellow-300 text-white font-bytebounce text-[8px] sm:text-[9px] md:text-sm px-1.5 md:px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] flex items-center gap-0.5 md:gap-1 whitespace-nowrap">
                          <Flame className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-200 fill-yellow-200 animate-pulse" />
                          {streak}x COMBO
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-0.5 md:mb-1 gap-1 md:gap-2">
                      <span className="text-[7.5px] sm:text-[8.5px] md:text-[10px] font-black text-white uppercase truncate max-w-[75px] sm:max-w-[95px] md:max-w-none">
                        {userLastName?.replace(/^aspirant\s+/i, '') || 'Player'}
                      </span>
                      <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                        {playerPoisoned && <span className="text-[6.5px] sm:text-[7px] md:text-[8px] bg-green-500 text-white px-1 md:px-1.5 py-0.5 rounded-[2px] md:rounded font-black shrink-0 animate-pulse" title="Taking damage every turn! Defend to cure.">POISONED</span>}
                        <span className="text-[6.5px] sm:text-[7px] md:text-[8px] bg-background text-primary px-1 md:px-1.5 py-0.5 rounded-[2px] md:rounded font-black shrink-0">LVL {userLevel}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-0.5 px-0.5 mt-0.5">
                      <span className="text-[6px] md:text-[8px] font-bold text-white/70 tracking-widest uppercase">HP</span>
                      <span className="text-[7.5px] sm:text-[8.5px] md:text-[9.5px] font-black text-white">{Math.ceil(Math.min(playerHealth, maxPlayerHp))} / {maxPlayerHp}</span>
                    </div>
                    <div className="h-1.5 md:h-2 w-full bg-background/10 rounded-[2px] md:rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-emerald-500 transition-all duration-500 rounded-[2px] md:rounded-full" style={{ width: `${Math.min(100, (Math.min(playerHealth, maxPlayerHp) / maxPlayerHp) * 100)}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className={cn(
            "flex-1 bg-background transition-all duration-700 ease-out z-20",
            introPhase !== 'active'
              ? 'translate-y-[100%] opacity-0 pointer-events-none'
              : waveTransition
                ? 'opacity-0 pointer-events-none translate-y-6 duration-500'
                : 'translate-y-0 opacity-100'
          )}>
            <QuizInterface
              questions={questions}
              onFinish={handleFinish}
              onAnswer={handleAnswer}
              onRequestExplanation={handleRequestExplanation}
              isLoading={isLoading}
              mode={quizMode}
              battleStage={battleStage}
              isFinalBoss={quizMode === 'boss-battle' && (getSubjectNodes(selectedSubject).find(n => n.id === selectedNodeId)?.tier === 'final-boss' || getSubjectNodes(selectedSubject).find(n => n.id === selectedNodeId)?.nodeNumber === 4)}
              bossShieldActive={bossShieldActive}
              playerPoisoned={playerPoisoned}
              streak={streak}
              equippedItem={equippedItem}
              clarityUsedThisBattle={clarityUsedThisBattle}
              onUseClarity={handleUseClarity}
              onQuestionChange={handleQuestionChange}
            />
          </div>
        </main>
        {arenaSettingsDialogJSX}
        {inventoryDialogJSX}
      </div>
    );
  }

  return (
    <div
      ref={fullscreenRef}
      className={cn(
        "min-h-full flex flex-col pb-8 sm:pb-12 md:pb-16 overflow-y-auto overflow-x-hidden relative bg-[#0a0705] no-scrollbar",
        isFullscreen ? "fixed inset-0 z-[100] h-screen w-screen overflow-y-auto overflow-x-hidden" : ""
      )}
    >
      {/* High-Performance Smooth Cross-Fading Backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {(dynamicCategories.length > 0 ? dynamicCategories : Object.keys(SUBJECT_METADATA)).map((subject) => {
          const meta = getSubjectMeta(subject);
          const isCurrent = selectedSubject === subject;
          if (!meta.backgroundUrl) return null;
          return (
            <div
              key={subject}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                isCurrent ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              <Image
                src={meta.backgroundUrl}
                alt={`${subject} Background`}
                fill
                priority={isCurrent}
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          );
        })}
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px] transition-all duration-600 pointer-events-none z-[1]" />

      <header id="tour-quest-header" className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-2 sm:pb-3 space-y-1 relative z-10 shrink-0">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-50 pointer-events-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-black/50 border-white/30 text-white hover:bg-black/70 hover:border-white/50 backdrop-blur-md transition-all shadow-xl cursor-pointer pointer-events-auto h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openArenaSettings('character');
            }}
            title="Arena Settings"
            aria-label="Arena Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-black/50 border-white/30 text-white hover:bg-black/70 hover:border-white/50 backdrop-blur-md transition-all shadow-xl cursor-pointer pointer-events-auto h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFullscreen();
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 sm:gap-4 md:gap-0 mb-3 sm:mb-4 md:mb-6 pr-14 sm:pr-16">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline leading-tight tracking-tight text-white">
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

        <p className="text-[10px] sm:text-[11px] font-bold text-slate-200 uppercase tracking-[0.15em]">
          MASTER EACH LABORATORY SCIENCE
        </p>
      </header>

      <div className={cn(
        "flex-1 w-full min-w-0 max-w-full flex flex-col justify-center items-center py-1 sm:py-3 md:py-4 relative z-10 overflow-visible",
        isFullscreen && (!categoriesLoading && dynamicCategories.length === 0) ? "my-auto" : ""
      )}>
        <div id="tour-quest-map" className="w-full min-w-0 max-w-full flex flex-col justify-center items-center overflow-visible">
          {categoriesLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[240px] sm:min-h-[300px] md:min-h-[380px] space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-white font-bytebounce text-lg tracking-widest uppercase">
                Loading Quest Regions...
              </p>
            </div>
          ) : dynamicCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[240px] sm:min-h-[300px] md:min-h-[380px] px-6 text-center max-w-xl mx-auto my-auto space-y-4">
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
            <div className="relative w-full min-w-0 max-w-full flex items-center">
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={scrollLeftIsland}
                  aria-label="Previous laboratory realm"
                  className="absolute left-1 sm:left-3 md:left-6 top-[38%] sm:top-[40%] -translate-y-1/2 z-30 p-2 sm:p-2.5 md:p-3 rounded-full bg-black/20 hover:bg-black/45 active:bg-black/70 text-white/90 hover:text-white backdrop-blur-sm border border-white/25 hover:border-white/50 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto animate-in fade-in"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
                </button>
              )}

              <div
                ref={carouselRef}
                className="w-full min-w-0 max-w-full flex overflow-x-auto gap-4 md:gap-8 px-10 sm:px-16 md:px-24 pt-6 sm:pt-8 pb-3 sm:pb-4 no-scrollbar snap-x snap-mandatory items-center touch-pan-x min-h-[250px] sm:min-h-[310px] md:min-h-[390px] select-none"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {dynamicCategories.map((subject) => {
                  const meta = getSubjectMeta(subject);
                  const isSelected = selectedSubject === subject;
                  const Icon = meta.icon;

                  return (
                    <button
                      key={subject}
                      data-subject={subject}
                      onClick={() => {
                        isProgrammaticScrollRef.current = true;
                        setSelectedTopicFilter(null);
                        setSelectedSubject(subject);
                      }}
                      className={cn(
                        "flex-shrink-0 snap-center transition-all duration-500 transform outline-none flex flex-col items-center cursor-pointer overflow-visible",
                        isSelected ? "scale-100 w-48 sm:w-60 md:w-72 lg:w-80" : "scale-75 w-36 sm:w-44 md:w-52 lg:w-56 opacity-35"
                      )}
                    >
                      <div className="relative w-full flex flex-col items-center overflow-visible">
                        <div className={cn(
                          "relative w-full aspect-square max-h-[160px] sm:max-h-[220px] md:max-h-[280px] transition-all duration-500 overflow-visible",
                          isSelected ? "animate-float" : ""
                        )}>
                          {subject === currentFocusSubject && (
                            <div
                              className="absolute top-3 sm:top-5 right-4 sm:right-6 md:right-8 z-30 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-white shadow-[0_4px_14px_rgba(245,158,11,0.65)] border-2 border-amber-200/90 backdrop-blur-md pointer-events-none"
                              title="Pinned Priority Focus"
                            >
                              <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white -rotate-45 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                            </div>
                          )}
                          {meta.imageUrl ? (
                            <div className="relative w-full h-full transform hover:scale-105 transition-transform pointer-events-none">
                              <Image src={meta.imageUrl} alt={subject} fill className="object-contain pointer-events-none select-none" priority={isSelected} draggable={false} />
                            </div>
                          ) : (
                            <div className={cn("w-full h-full rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 flex flex-col items-center justify-center text-white shadow-2xl relative overflow-hidden group border-4 border-white/50", meta.color)}>
                              <Icon className="w-10 h-10 md:w-12 md:h-12" />
                            </div>
                          )}
                        </div>

                        <div className={cn("mt-1 sm:mt-2 text-center space-y-1.5 sm:space-y-2 md:space-y-2 transition-all", isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
                          <div className="space-y-0.5 sm:space-y-1 w-full px-2">
                            <p className="text-[7px] sm:text-[8px] md:text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80" style={{ fontFamily: "'Poppins', sans-serif" }}>{meta.biome}</p>
                            <h3 className="text-2xl sm:text-3xl md:text-[2.6rem] font-bytebounce text-white leading-none break-words" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>{subject}</h3>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3">
                            <div className="flex gap-2 items-center flex-wrap justify-center">
                              {subject === currentFocusSubject && (
                                <Badge variant="outline" className="bg-amber-500/20 border-amber-400/70 text-amber-300 font-bold px-2 md:px-2.5 py-0.5 md:py-1 flex items-center gap-1 text-[7px] sm:text-[8px] md:text-[9px] shadow-[0_0_10px_rgba(245,158,11,0.25)] backdrop-blur-sm">
                                  <Pin className="w-2.5 h-2.5 fill-amber-300 text-amber-300 -rotate-45" /> Pinned
                                </Badge>
                              )}
                              <Badge variant="outline" className="bg-background/10 border-primary/40 text-white font-bold px-2 md:px-3 py-0.5 md:py-1 flex items-center gap-1 text-[7px] sm:text-[8px] md:text-[10px]">
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

              {canScrollRight && (
                <button
                  type="button"
                  onClick={scrollRightIsland}
                  aria-label="Next laboratory realm"
                  className="absolute right-1 sm:right-3 md:right-6 top-[38%] sm:top-[40%] -translate-y-1/2 z-30 p-2 sm:p-2.5 md:p-3 rounded-full bg-black/20 hover:bg-black/45 active:bg-black/70 text-white/90 hover:text-white backdrop-blur-sm border border-white/25 hover:border-white/50 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto animate-in fade-in"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
                </button>
              )}
            </div>
          )}
        </div>

        {!categoriesLoading && dynamicCategories.length > 0 && (
          <div id="tour-quest-inventory" className="px-4 sm:px-6 md:px-8 mt-5 sm:mt-6 md:mt-8 relative z-20 shrink-0 w-full flex justify-center">
            <button
              onClick={() => {
                setSetupStep('mode');
                setModeSelectDialogOpen(true);
              }}
              disabled={isLoading}
              className="relative w-full max-w-[280px] sm:max-w-md md:max-w-xl h-20 sm:h-26 md:h-32 group hover:scale-105 active:scale-95 hover:brightness-110 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
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
        )}
      </div>

      {/* Mode Selection Dialog */}
      <Dialog 
        open={modeSelectDialogOpen} 
        onOpenChange={(open) => {
          setModeSelectDialogOpen(open);
          if (!open) {
            setSelectedTopicFilter(null);
            if (typeof window !== 'undefined') {
              const newUrl = new URL(window.location.href);
              if (newUrl.searchParams.has('topic') || newUrl.searchParams.has('subject')) {
                newUrl.searchParams.delete('topic');
                newUrl.searchParams.delete('subject');
                window.history.replaceState({}, '', newUrl.pathname + (newUrl.searchParams.toString() ? `?${newUrl.searchParams.toString()}` : ''));
              }
            }
          }
        }}
      >
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
              type="button"
              onClick={() => {
                setModeSelectDialogOpen(false);
                setSelectedTopicFilter(null);
                if (typeof window !== 'undefined') {
                  const newUrl = new URL(window.location.href);
                  if (newUrl.searchParams.has('topic') || newUrl.searchParams.has('subject')) {
                    newUrl.searchParams.delete('topic');
                    newUrl.searchParams.delete('subject');
                    window.history.replaceState({}, '', newUrl.pathname + (newUrl.searchParams.toString() ? `?${newUrl.searchParams.toString()}` : ''));
                  }
                }
              }}
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
                    {(() => {
                      const isMajor = isMajorSubject(selectedSubject);
                      const isTopicDrill = Boolean(selectedTopicFilter && selectedTopicFilter.trim().length > 0);
                      const isLocked = !isMajor || isTopicDrill;
                      return (
                        <button
                          onClick={() => {
                            if (!isMajor) {
                              toast({
                                title: "Campaign Mode Locked",
                                description: "Boss-Battle RPG campaign is exclusive to the 6 Core MTLE Board Exam Subjects. Please select Learning Mode or Test Mode.",
                              });
                              return;
                            }
                            if (isTopicDrill) {
                              toast({
                                title: "Campaign Mode Locked for Topic Drills",
                                description: `Boss-Battle follows the linear 4-node Chapter Map campaign. To drill "${selectedTopicFilter}", please select Learning Mode or Test Mode.`,
                              });
                              return;
                            }
                            setQuizMode('boss-battle');
                            setModeSelectDialogOpen(false);
                            setShowChapterMap(true);
                          }}
                          className={cn(
                            "relative flex-1 h-full max-h-[80%] transition-all",
                            !isLocked
                              ? "group hover:scale-105 active:scale-95 hover:brightness-110 cursor-pointer"
                              : "grayscale contrast-75 opacity-60 cursor-not-allowed"
                          )}
                          title={!isMajor ? "Exclusive to the 6 Core Board Exam Subjects" : isTopicDrill ? "Topic drills are exclusive to Learning Mode & Test Mode" : "Enter Boss Battle"}
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

                          {/* Padlock & Exclusivity Tag for Non-Major Subjects OR Topic Drills */}
                          {!isMajor ? (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/85 border border-amber-400/90 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)] mb-1">
                                <Lock className="w-4 h-4 md:w-5 md:h-5 text-amber-300" />
                              </div>
                              <span
                                className="font-bytebounce text-amber-300 text-[9px] min-[375px]:text-[11px] md:text-sm tracking-wider uppercase leading-tight bg-black/85 px-2 py-0.5 rounded border border-amber-500/40 shadow-md"
                                style={{ textShadow: '1px 1px 0 #000' }}
                              >
                                6 Core Subjects Only
                              </span>
                            </div>
                          ) : isTopicDrill ? (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/85 border border-amber-400/90 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)] mb-1">
                                <Lock className="w-4 h-4 md:w-5 md:h-5 text-amber-300" />
                              </div>
                              <span
                                className="font-bytebounce text-amber-300 text-[9px] min-[375px]:text-[11px] md:text-sm tracking-wider uppercase leading-tight bg-black/85 px-2 py-0.5 rounded border border-amber-500/40 shadow-md text-center"
                                style={{ textShadow: '1px 1px 0 #000' }}
                              >
                                Chapter Nodes Only
                              </span>
                            </div>
                          ) : null}
                        </button>
                      );
                    })()}
                  </>
                ) : setupStep === 'details' ? (
                  <div className="flex flex-col w-full h-full p-1 min-[375px]:p-2 md:p-6 overflow-hidden no-scrollbar animate-in fade-in zoom-in-95 relative justify-between">

                    {/* INFO SECTION */}
                    <div className={cn("flex-1 flex flex-col justify-center md:justify-end relative md:pt-2", mobileModalStep === 'action' ? "hidden md:flex" : "flex")}>
                      {quizMode === 'learning' && (
                        <div className="flex-1 flex flex-col space-y-2 min-[375px]:space-y-3 md:space-y-5 overflow-hidden justify-center md:justify-end items-center">
                          <div className="text-center space-y-0.5">
                            <p className="text-white/90 text-[9px] min-[375px]:text-[11px] sm:text-xs md:text-lg max-w-lg mx-auto font-bold leading-tight min-[375px]:leading-snug sm:leading-relaxed" style={{ textShadow: '1px 1px 0 #000' }}>
                              {selectedTopicFilter
                                ? `Targeted drill on "${selectedTopicFilter}". Hone your skills with immediate AI Tutor rationale after every answer.`
                                : "Hone your skills with immediate AI Tutor rationale after every answer. Master the basics at your own pace."}
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
                              {selectedTopicFilter
                                ? `Targeted endurance test on "${selectedTopicFilter}". No immediate feedback, no second chances. Only your final score matters.`
                                : "A grueling test of endurance. No immediate feedback, no second chances. Only your final score matters."}
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
      <Dialog open={showChapterMap && isMajorSubject(selectedSubject) && !isStarted && !isFinished} onOpenChange={setShowChapterMap}>
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
      <QuestArenaOnboardingModal
        isOpen={showArenaOnboarding}
        initialName={initialProfileName || userLastName}
        onComplete={async (data) => {
          setUserLastName(data.nickname);
          if (currentUserIdRef.current) {
            try {
              localStorage.setItem(`bq_arena_nickname_${currentUserIdRef.current}`, data.nickname);
              localStorage.setItem(`bq_arena_onboarding_completed_${currentUserIdRef.current}`, 'true');
              localStorage.setItem('bq_pref_daily_quota', data.dailyQuota.toString());
            } catch (e) {}
          }
          const res = await saveArenaOnboardingAction(data);
          if (res.success) {
            setUserLastName(data.nickname);
            window.dispatchEvent(new CustomEvent('bq_settings_updated'));
            window.dispatchEvent(new CustomEvent('bq_stats_updated'));
            setShowArenaOnboarding(false);
            toast({
              title: "Aspirant Character Ready!",
              description: `Welcome to Quest Arena, ${data.nickname}! Your daily goal of ${data.dailyQuota} questions/day is set.`,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Setup Failed",
              description: res.error || "Failed to save character profile",
            });
          }
        }}
      />

      {arenaSettingsDialogJSX}
      {inventoryDialogJSX}
    </div>
  );
}
