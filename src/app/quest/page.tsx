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
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { QuizInterface, Question } from '@/components/quiz/QuizInterface';
import { ChapterWorldMap } from '@/components/quiz/ChapterWorldMap';
import { SUBJECT_AREAS, XP_PER_QUESTION } from '@/lib/game-logic';
import { provideExamFeedback } from '@/ai/flows/provide-exam-feedback';
import { getQuestQuestions } from '@/app/actions/arena';
import { completeQuest, getNodeStarsAction, getNodeClearsAction, saveNodeClearAction } from '@/app/actions/quest';
import { getCategories } from '@/app/actions/study';
import { getUserProfile, saveUserInventory, purchaseReagentAction } from '@/app/actions/user';
import { calculateEarnedBadges, type Badge as BadgeType } from '@/lib/badge-system';
import { playSfx } from '@/lib/audio-manager';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    description: "The air is thick with the scent of ozone and reagents. Master the metabolic currents."
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
    description: "Crimson rivers flow through iron-rich soil. Study the life force within."
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
    description: "Examine the smallest details that reveal the greatest truths."
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
        const cats = await getCategories();
        if (cats && cats.length > 0) {
          const names = cats.map(c => c.name);
          setDynamicCategories(names);

          // Priority 1: URL search param ?subject=
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlSubject = searchParams?.get('subject');

          // Priority 2: Priority Focus Subject from Account Settings
          const savedFocus = typeof window !== 'undefined' ? localStorage.getItem('bq_pref_focus_subject') : null;

          if (urlSubject && names.includes(urlSubject)) {
            setSelectedSubject(urlSubject);
          } else if (savedFocus && names.includes(savedFocus)) {
            setSelectedSubject(savedFocus);
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
  }

  const [battleStage, setBattleStage] = useState<1 | 2 | 3>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cc-1');
  const [showChapterMap, setShowChapterMap] = useState<boolean>(false);
  const [nodeStars, setNodeStars] = useState<Record<string, number>>({});
  const [nodeClears, setNodeClears] = useState<Record<string, { EASY?: boolean; MEDIUM?: boolean; HARD?: boolean }>>({});

  const CHAPTER_NODES_PER_SUBJECT: Record<string, SubjectNodeConfig[]> = {
    "Clinical Chemistry": [
      { id: 'cc-1', nodeNumber: 1, title: 'Carbohydrates & Lipids', subtopic: 'Glucose Metabolism, HbA1c & Lipoproteins', minionName: 'Acid Slime', minionIcon: '🧪', miniBossName: 'Hyperglycemic Mutant', miniBossIcon: '🧬', bossName: 'Hyperglycemic Specter', bossIcon: '⚗️' },
      { id: 'cc-2', nodeNumber: 2, title: 'Enzymology & Electrolytes', subtopic: 'Troponin, CK-MB, AST, Potassium & Blood pH', minionName: 'Kinase Swarm', minionIcon: '⚡', miniBossName: 'Ischemia Fiend', miniBossIcon: '🔥', bossName: 'Renal Behemoth', bossIcon: '💔' },
      { id: 'cc-3', nodeNumber: 3, title: '👑 The Licensure Colossus (FINAL BOSS)', subtopic: 'Comprehensive Clinical Chemistry Licensure Challenge', minionName: 'Lab Sentinel', minionIcon: '🛡️', miniBossName: 'Board Examiner Specter', miniBossIcon: '📜', bossName: 'The Licensure Colossus', bossIcon: '👑' },
    ],
    "Microbiology": [
      { id: 'mb-1', nodeNumber: 1, title: 'Bacteriology & Gram Staining', subtopic: 'Gram Positive & Negative Cocci & Bacilli', minionName: 'Microbe Swarm', minionIcon: '🦠', miniBossName: 'Staph Sentinel', miniBossIcon: '🧬', bossName: 'Gram Positive Overlord', bossIcon: '👾' },
      { id: 'mb-2', nodeNumber: 2, title: 'Mycology, Virology & Parasitology', subtopic: 'Fungi, Viral Replication, Antigens & Protozoa', minionName: 'Spore Cloud', minionIcon: '🍄', miniBossName: 'Retrovirus Fiend', miniBossIcon: '💥', bossName: 'Viral Apex Lord', bossIcon: '🐉' },
      { id: 'mb-3', nodeNumber: 3, title: '👑 Pathogen Sovereign (FINAL BOSS)', subtopic: 'Antimicrobial Resistance & Comprehensive Microbiology', minionName: 'Resistant Strain', minionIcon: '💊', miniBossName: 'Lab Director Phantom', miniBossIcon: '📜', bossName: 'Pathogen Sovereign', bossIcon: '👑' },
    ],
    "Hematology": [
      { id: 'hem-1', nodeNumber: 1, title: 'RBC Anomalies & Anemias', subtopic: 'Hemoglobin Synthesis & Microcytic Anemias', minionName: 'Sickle Cell', minionIcon: '🩸', miniBossName: 'Anemia Shade', miniBossIcon: '👻', bossName: 'Erythrocyte Colossus', bossIcon: '👑' },
      { id: 'hem-2', nodeNumber: 2, title: 'WBC Disorders & Leukemias', subtopic: 'Neutrophils, Acute/Chronic Leukemias & Bone Marrow', minionName: 'Blast Cell', minionIcon: '💥', miniBossName: 'Leukemic Fiend', miniBossIcon: '⚡', bossName: 'White Cell Warlord', bossIcon: '🗡️' },
      { id: 'hem-3', nodeNumber: 3, title: '👑 Heme Sovereign (FINAL BOSS)', subtopic: 'Hemostasis, Coagulation Cascades & Comprehensive Exam', minionName: 'Clot Particle', minionIcon: '🧱', miniBossName: 'Hematopathologist Ghost', miniBossIcon: '📜', bossName: 'Heme Sovereign', bossIcon: '👑' },
    ],
    "Immunology & Serology and Immunohematology": [
      { id: 'is-1', nodeNumber: 1, title: 'Immunity & Serological Testing', subtopic: 'Innate/Adaptive Immunity, ELISA & Agglutination', minionName: 'Lymphocyte Swarm', minionIcon: '🛡️', miniBossName: 'Antigen Titan', miniBossIcon: '🧬', bossName: 'Immune Archon', bossIcon: '👑' },
      { id: 'is-2', nodeNumber: 2, title: 'ABO & Rh Blood Group System', subtopic: 'Blood Group Antigens, Antibodies & Rh Discrepancies', minionName: 'ABO Antigen', minionIcon: '🩸', miniBossName: 'Rh Aggressive Golem', miniBossIcon: '🪨', bossName: 'Immunohematology Colossus', bossIcon: '👑' },
      { id: 'is-3', nodeNumber: 3, title: '👑 Licensure Immuno Sovereign (FINAL BOSS)', subtopic: 'Transfusion Reactions, Crossmatching & Blood Bank', minionName: 'Hemolytic Cell', minionIcon: '💥', miniBossName: 'Serology Examiner Phantom', miniBossIcon: '📜', bossName: 'Licensure Immuno Sovereign', bossIcon: '👑' },
    ],
    "Clinical Microscopy & Parasitology": [
      { id: 'cm-1', nodeNumber: 1, title: 'Urinalysis Physical & Chemical Exam', subtopic: 'Color, Clarity, Specific Gravity & Reagents', minionName: 'Reagent Strip Slime', minionIcon: '🧪', miniBossName: 'Nitrite Spectre', miniBossIcon: '👻', bossName: 'Clinical Microscopy Overlord', bossIcon: '👑' },
      { id: 'cm-2', nodeNumber: 2, title: 'Microscopic Sediments & Body Fluids', subtopic: 'Casts, Crystals, Synovial, Serous & CSF Analysis', minionName: 'Hyaline Cast', minionIcon: '💧', miniBossName: 'Oxalate Golem', miniBossIcon: '🪨', bossName: 'Sediment Colossus', bossIcon: '🩸' },
      { id: 'cm-3', nodeNumber: 3, title: '👑 Microscopy Sovereign (FINAL BOSS)', subtopic: 'Intestinal Parasites, Helminths & Comprehensive Board Exam', minionName: 'Protozoan Cyst', minionIcon: '🦠', miniBossName: 'Pathology Director Phantom', miniBossIcon: '📜', bossName: 'Microscopy Sovereign', bossIcon: '👑' },
    ],
    "Histopathology and Medtech Laws": [
      { id: 'hp-1', nodeNumber: 1, title: 'Tissue Processing, Microtomy & Staining', subtopic: 'Formalin Fixation, Sectioning & H&E Staining', minionName: 'Formalin Slime', minionIcon: '🧪', miniBossName: 'Paraffin Golem', miniBossIcon: '🪨', bossName: 'Fixation Overlord', bossIcon: '👑' },
      { id: 'hp-2', nodeNumber: 2, title: 'RA 5527 & MedTech Ethics', subtopic: 'Philippine Medical Technology Act of 1969', minionName: 'Statute Page', minionIcon: '📜', miniBossName: 'Legal Guardian', miniBossIcon: '🛡️', bossName: 'Jurisprudence Archon', bossIcon: '⚖️' },
      { id: 'hp-3', nodeNumber: 3, title: '👑 Licensure Juris Archon (FINAL BOSS)', subtopic: 'Biosafety, Lab Quality Assurance & Comprehensive Challenge', minionName: 'Biohazard Swarm', minionIcon: '☣️', miniBossName: 'Board Examiner Phantom', miniBossIcon: '📜', bossName: 'Licensure Juris Archon', bossIcon: '👑' },
    ],
  };

  const getSubjectNodes = (subject: string): SubjectNodeConfig[] => {
    return CHAPTER_NODES_PER_SUBJECT[subject] || [
      { id: `${subject}-1`, nodeNumber: 1, title: `${subject} Foundations`, subtopic: 'Core Diagnostic Principles', minionName: 'Lab Minion', minionIcon: '🧪', miniBossName: 'Diagnostic Spectre', miniBossIcon: '👻', bossName: `${subject} Overlord`, bossIcon: '👑' },
      { id: `${subject}-2`, nodeNumber: 2, title: `${subject} Advanced Concepts`, subtopic: 'Pathology & Testing Methodologies', minionName: 'Reagent Swarm', minionIcon: '💧', miniBossName: 'Assay Golem', miniBossIcon: '🪨', bossName: `${subject} Titan`, bossIcon: '⚡' },
      { id: `${subject}-3`, nodeNumber: 3, title: `👑 ${subject} Sovereign (FINAL BOSS)`, subtopic: 'Comprehensive Licensure Board Challenge', minionName: 'Board Sentinel', minionIcon: '🛡️', miniBossName: 'Senior Examiner Specter', miniBossIcon: '📜', bossName: `Master ${subject} Colossus`, bossIcon: '👑' },
    ];
  };

  // Helper to calculate Level-Scaled HP for Player and 3-Stage Enemies
  const calculatePlayerMaxHp = (level: number, hasShield: boolean) => {
    const base = 100 + (Math.max(1, level) - 1) * 15;
    return hasShield ? base + 20 : base;
  };

  const calculateEnemyStageHp = (stage: 1 | 2 | 3, level: number, difficulty: string) => {
    const baseHp = stage === 1 ? 80 : stage === 2 ? 130 : 220;
    const modeMul = difficulty === 'EASY' ? 0.85 : difficulty === 'HARD' ? 1.25 : 1.0;
    return Math.floor(baseHp * (1 + (Math.max(1, level) - 1) * 0.12) * modeMul);
  };

  // Load Saved Node Stars & Clears from Database (User Scoped)
  useEffect(() => {
    async function loadNodeStarsAndClears() {
      try {
        const result = await getNodeClearsAction();
        if (result) {
          setNodeClears(result.nodeClears || {});
          setNodeStars(result.nodeStars || {});
          try {
            localStorage.setItem('boardquest_node_clears', JSON.stringify(result.nodeClears || {}));
            localStorage.setItem('boardquest_node_stars', JSON.stringify(result.nodeStars || {}));
          } catch (e) { }
        }
      } catch (e) { }
    }
    loadNodeStarsAndClears();
  }, []);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string, target: 'player' | 'enemy', text: string, color: string }[]>([]);
  const [hitFlash, setHitFlash] = useState(false);

  // Inventory & Consumables State
  const [userXp, setUserXp] = useState<number>(100);
  const [inventory, setInventory] = useState<Record<string, number>>({
    erlenmeyer_shield: 2,
    pipette_clarity: 2,
    buffered_saline: 2,
  });
  const [equippedItem, setEquippedItem] = useState<string | null>('erlenmeyer_shield');
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedItemSlot, setSelectedItemSlot] = useState<string>('erlenmeyer_shield');
  const [salineUsedThisBattle, setSalineUsedThisBattle] = useState(false);
  const [clarityUsedThisBattle, setClarityUsedThisBattle] = useState(false);

  const MAX_REAGENT_CAP = 5;

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
    }
  }, []);

  // Sync state changes to localStorage and DB
  useEffect(() => {
    try {
      localStorage.setItem('boardquest_reagent_inventory', JSON.stringify(inventory));
      localStorage.setItem('boardquest_equipped_reagent', equippedItem || 'none');
      saveUserInventory(inventory, equippedItem);
    } catch (e) {
      console.error('Error saving inventory to DB:', e);
    }
  }, [inventory, equippedItem]);

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
      <DialogContent container={isFullscreen ? (fullscreenRef.current || undefined) : undefined} className="w-[94vw] sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar bg-[#1c2438] border-4 border-[#3b4763] text-white shadow-[0_0_30px_rgba(0,0,0,0.8)] p-3 sm:p-5 rounded-2xl z-[100] font-bytebounce">

        {/* Header & XP Display */}
        <div className="flex items-center justify-between border-b-2 border-[#3b4763] pb-2 sm:pb-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-[#2a354d] border-2 border-[#526287] p-1 sm:p-1.5 rounded-lg text-base sm:text-lg flex items-center justify-center shrink-0">
              🧪
            </div>
            <div>
              <DialogTitle className="font-bytebounce text-xl sm:text-3xl text-amber-400 tracking-wider flex items-center gap-1.5 leading-none">
                REAGENT INVENTORY
              </DialogTitle>
              <p className="text-[9px] sm:text-[10px] text-slate-300 font-sans tracking-wide mt-0.5">Select a slot to Equip or Buy (LVL {userLevel} Pricing)</p>
            </div>
          </div>
          <div className="bg-[#0f172a] border border-amber-500/40 px-2 sm:px-2.5 py-1 rounded-lg text-right shrink-0">
            <span className="text-[7.5px] sm:text-[8px] text-slate-400 uppercase tracking-wider block font-sans">Available XP</span>
            <span className="text-amber-400 font-bytebounce text-xs sm:text-base flex items-center gap-0.5 justify-end">
              ⚡ {userXp} XP
            </span>
          </div>
        </div>

        {/* Weekly Guild Restock Countdown Banner */}
        <div className="mt-2.5 bg-[#111827] border border-[#3b4763] px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-slate-300 font-sans text-[9px] sm:text-[10.5px] truncate">
              Weekly Supply: <span className="text-emerald-400 font-bold">+1 Free Charge</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] sm:text-[10px] bg-[#1e293b] px-2 py-0.5 rounded border border-[#334155] shrink-0">
            <span>Restock:</span>
            <span className="text-amber-400 font-bold">{restockCountdown || 'Calculating...'}</span>
          </div>
        </div>

        {/* 16-Bit Pixel RPG Grid Container */}
        <div className="mt-2.5 sm:mt-3 bg-[#111827] border-3 sm:border-4 border-[#374151] p-1.5 sm:p-2.5 rounded-xl shadow-inner relative">
          {/* Stone Accents */}
          <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#4b5563] opacity-40" />
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#4b5563] opacity-40" />
          <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#4b5563] opacity-40" />
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#4b5563] opacity-40" />

          {/* Grid Slots (6 columns x 3 rows = 18 slots) */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2">
            {/* Render consumable item slots */}
            {CONSUMABLE_ITEMS_LIST.map((item) => {
              const count = inventory[item.id] || 0;
              const isEquipped = equippedItem === item.id;
              const isSelected = selectedItemSlot === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemSlot(item.id)}
                  className={cn(
                    "relative aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center p-0.5 sm:p-1 select-none group",
                    isSelected
                      ? "bg-[#252f48] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105"
                      : isEquipped
                        ? "bg-[#1e293b] border-emerald-400"
                        : "bg-[#1e293b] border-[#334155] hover:border-slate-400 hover:bg-[#283549]"
                  )}
                >
                  {/* Icon */}
                  <span className="text-lg sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{item.icon}</span>

                  {/* Count Stack Badge (Bottom Right) */}
                  <span className="absolute bottom-0.5 right-0.5 sm:right-1 font-bytebounce text-[10px] sm:text-sm font-black text-white drop-shadow-[1px_1px_0_#000]">
                    {count}/{MAX_REAGENT_CAP}
                  </span>

                  {/* Equipped Tag Badge */}
                  {isEquipped && (
                    <span className="absolute top-0.5 left-0.5 bg-emerald-500 text-black text-[6px] sm:text-[7.5px] font-black uppercase px-0.5 sm:px-1 rounded shadow-sm border border-black animate-pulse">
                      EQ
                    </span>
                  )}

                  {/* Pixel Cursor Corner Brackets when selected */}
                  {isSelected && (
                    <>
                      <div className="absolute -top-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 border-t-2 border-l-2 border-amber-300" />
                      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 border-t-2 border-r-2 border-amber-300" />
                      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 border-b-2 border-l-2 border-amber-300" />
                      <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 border-b-2 border-r-2 border-amber-300" />
                    </>
                  )}
                </button>
              );
            })}

            {/* Render 15 empty/locked grid slots */}
            {Array.from({ length: 15 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-square bg-[#0f172a]/70 border-2 border-[#1e293b] rounded-lg flex items-center justify-center text-slate-700 select-none"
              >
                <span className="text-[9px] sm:text-[10px] opacity-20 font-mono">+</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Item Details & Command Action Panel */}
        {activeSelectedItem && (
          <div className="mt-2.5 sm:mt-3 bg-[#111827] border-2 border-[#3b4763] rounded-xl p-2.5 sm:p-4 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="text-2xl sm:text-4xl p-1.5 sm:p-2 bg-[#1e293b] border-2 border-[#3b4763] rounded-xl shrink-0">
                {activeSelectedItem.icon}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1 font-sans">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-amber-300 font-bytebounce text-sm sm:text-lg tracking-wide">{activeSelectedItem.name}</h4>
                  <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-white/10 px-1 sm:px-1.5 py-0.5 rounded text-amber-200">
                    Stock: {inventory[activeSelectedItem.id] || 0}/{MAX_REAGENT_CAP}
                  </span>
                  {equippedItem === activeSelectedItem.id && (
                    <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-black px-1 sm:px-1.5 py-0.5 rounded border border-black animate-pulse">
                      EQUIPPED
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-200 font-semibold leading-tight">{activeSelectedItem.desc}</p>
                <p className="text-[9.5px] sm:text-[11px] font-bold text-amber-400 leading-tight">✨ {activeSelectedItem.effect}</p>
              </div>
            </div>

            {/* RPG Action Buttons */}
            <div className="flex sm:flex-col gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-[#374151] sm:pl-3">
              {equippedItem === activeSelectedItem.id ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setEquippedItem(null)}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white font-bytebounce text-xs sm:text-sm uppercase tracking-wider h-7 sm:h-8 px-2.5 sm:px-3 border border-red-400 shadow-md whitespace-nowrap"
                >
                  Unequip
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={(inventory[activeSelectedItem.id] || 0) <= 0}
                  onClick={() => setEquippedItem(activeSelectedItem.id)}
                  className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-black font-bytebounce text-xs sm:text-sm uppercase tracking-wider h-7 sm:h-8 px-2.5 sm:px-3 border border-emerald-300 disabled:opacity-30 shadow-md whitespace-nowrap"
                >
                  Equip
                </Button>
              )}

              <Button
                size="sm"
                disabled={(inventory[activeSelectedItem.id] || 0) >= MAX_REAGENT_CAP}
                onClick={() => handleBuyReagent(activeSelectedItem.id, activeSelectedItem.name, activeSelectedItem.cost)}
                className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-black font-bytebounce text-xs sm:text-sm uppercase tracking-wider h-7 sm:h-8 px-2.5 sm:px-3 border border-amber-300 shadow-md flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-40"
              >
                {(inventory[activeSelectedItem.id] || 0) >= MAX_REAGENT_CAP ? (
                  `MAX CAP (5/5)`
                ) : (
                  `Buy +1 (⚡${activeSelectedItem.cost})`
                )}
              </Button>
            </div>
          </div>
        )}
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
    setConfidence(null);
    setEarnedBadges([]);
    setConfidenceSubmitted(false);
    setQuestStartTime(Date.now());
    isFinishingRef.current = false;
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
      // Level-scaled HP: 200 base + 5 per level
      let startingHp = quizMode === 'boss-battle' ? 200 + (userLevel * 5) : 100;

      // Erlenmeyer Shield Consumable Effect
      if (quizMode === 'boss-battle' && equippedItem === 'erlenmeyer_shield' && (inventory.erlenmeyer_shield || 0) > 0) {
        startingHp += 20;
        addFloatingText('player', '+20 SHIELD HP! 🧪🛡️', 'text-blue-400');
        setInventory(prev => ({ ...prev, erlenmeyer_shield: Math.max(0, (prev.erlenmeyer_shield || 0) - 1) }));
      }

      setPlayerHealth(startingHp);
      setSalineUsedThisBattle(false);
      setClarityUsedThisBattle(false);

      let bossStartingHp = 100;
      if (quizMode === 'boss-battle') {
        setBattleStage(1);
        bossStartingHp = calculateEnemyStageHp(1, userLevel, specificDifficulty || 'MEDIUM');
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
      setStreak(prev => prev + 1);
      playSfx('correct');
      if (quizMode === 'boss-battle') {
        setTimeout(() => playSfx('attack'), 150);
      }
    } else {
      setStreak(0);
      playSfx('wrong');
    }

    const baseDamage = quizMode === 'boss-battle' ? 25 : 100 / (questions.length || 5);
    let enemyDmg = 0;
    let playerDmg = 0;
    let playerHeal = 0;
    let enemyHeal = 0;

    let newPoisonedState = playerPoisoned;
    let newShieldState = bossShieldActive;

    // Apply poison tick at the very start of the turn
    if (quizMode === 'boss-battle' && playerPoisoned) {
      playerDmg += baseDamage * 0.5; // 50% of a normal hit in poison damage
    }

    // Evaluate Phase 3 Enrage Healing (if boss < 20% HP)
    if (quizMode === 'boss-battle' && enemyHealth > 0 && enemyHealth <= 20) {
      enemyHeal += baseDamage * 0.5; // Heals a bit every turn
    }

    if (quizMode === 'boss-battle' && action) {
      if (action === 'heavy') {
        if (isCorrect) {
          enemyDmg = baseDamage * 2;
          newShieldState = false; // Heavy shatters the shield!
        } else {
          playerDmg += baseDamage * 2;
        }
      } else if (action === 'defend') {
        if (isCorrect) {
          playerHeal += baseDamage * 1.5;
          newPoisonedState = false; // Cures poison!
        } else {
          playerDmg += baseDamage * 0.5;
        }
      } else {
        // normal
        if (isCorrect) {
          if (!bossShieldActive || battleStage !== 3) {
            enemyDmg = baseDamage;
          } else {
            // Shield absorbed the hit (Only Chapter Boss at Stage 3 has shield!)
            enemyDmg = 0;
            toast({ title: "Shield Absorbed Attack! 🛡️", description: "Normal attacks deal 0 damage while the Boss shield is active. Use Heavy Attack to shatter it!", variant: "destructive" });
          }
        } else {
          playerDmg += baseDamage;
        }
      }

      // Aggressive Phase 2: ONLY the Stage 3 Boss has aggressive phases! (Boss <= 60% HP and > 20% HP) -> Double damage on player mistake
      if (battleStage === 3 && !isCorrect && enemyHealth <= 60 && enemyHealth > 20) {
        playerDmg *= 2;
      }

      // Poison Infliction Mechanics:
      // Minion (Stage 1) -> NEVER poisons
      // Mini-Boss (Stage 2) & Boss (Stage 3) -> Inflict poison debuffs on player mistakes
      if (battleStage >= 2 && !isCorrect && Math.random() < 0.25) {
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
      if (quizMode === 'boss-battle' && equippedItem === 'buffered_saline' && !salineUsedThisBattle && (inventory.buffered_saline || 0) > 0) {
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

      // Shield Mechanics: ONLY the Stage 3 Chapter Boss casts shield! (Every 4 turns)
      if (battleStage === 3 && (turnCount + 1) % 4 === 0 && enemyHealth > 0) {
        newShieldState = true;
        toast({ title: "Boss Casts Shield! 🛡️", description: "The Chapter Boss puts up a magical shield. Only Heavy attacks can shatter it!", variant: "destructive" });
      } else if (battleStage < 3) {
        newShieldState = false;
      }

    } else {
      if (isCorrect) enemyDmg = baseDamage;
      else playerDmg = baseDamage;
    }

    if (quizMode === 'boss-battle') {
      const bossMul = bossDifficulty === 'EASY' ? 0.7 : bossDifficulty === 'HARD' ? 1.5 : 1;
      const playerMul = bossDifficulty === 'EASY' ? 1.5 : bossDifficulty === 'HARD' ? 0.7 : 1;

      // Level-scaled damage: Add a bonus 0.5 base damage per level
      const levelBonusDamage = userLevel * 0.5;

      enemyDmg = (enemyDmg + (enemyDmg > 0 ? levelBonusDamage : 0)) * playerMul;

      const bossBonusDamage = userLevel * 0.4;
      playerDmg = (playerDmg + (playerDmg > 0 ? bossBonusDamage : 0)) * bossMul;

      enemyHeal *= bossMul;
      playerHeal *= playerMul;
    }

    // Apply health changes
    if (enemyHeal > 0) {
      setIsAnimating("enemy");
      const diffBase = bossDifficulty === 'EASY' ? 400 : bossDifficulty === 'HARD' ? 800 : 600;
      const levelScaling = bossDifficulty === 'EASY' ? 5 : bossDifficulty === 'HARD' ? 12 : 8;
      const maxEnemyHp = quizMode === 'boss-battle' ? Math.floor(diffBase + (userLevel * levelScaling)) : 100;
      setEnemyHealth(prev => Math.min(maxEnemyHp, prev + enemyHeal));
      addFloatingText('enemy', `+${Math.ceil(enemyHeal)} HEALED!`, 'text-green-400');
    }

    if (enemyDmg > 0) {
      setIsAnimating("enemy");
      const nextHp = Math.max(0, enemyHealth - enemyDmg);
      if (quizMode === 'boss-battle' && nextHp <= 0) {
        if (battleStage === 1) {
          setBattleStage(2);
          setBossShieldActive(false);
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
          const stage3Hp = calculateEnemyStageHp(3, userLevel, bossDifficulty || 'MEDIUM');
          setEnemyHealth(stage3Hp);
          addFloatingText('enemy', '👹 MINI-BOSS DEFEATED! 👑 CHAPTER BOSS APPEARS!', 'text-red-400');
          toast({
            title: "👹 Stage 2 Clear!",
            description: "The Mini-Boss has fallen! The Chapter Boss enters the arena!",
          });
        } else {
          setEnemyHealth(0);
        }
      } else {
        setEnemyHealth(nextHp);
      }
      addFloatingText('enemy', `-${Math.ceil(enemyDmg)} ${action === 'heavy' ? 'CRITICAL HIT!' : 'DMG!'}`, 'text-yellow-400');
    }

    if (playerDmg > 0) {
      setIsAnimating("player");
      setPlayerHealth(prev => Math.max(0, prev - playerDmg));
      addFloatingText('player', `-${Math.ceil(playerDmg)} DMG!`, 'text-red-500');
      if (playerDmg >= baseDamage || quizMode === 'boss-battle') {
        const flashEnabled = typeof window !== 'undefined' ? localStorage.getItem('bq_pref_hit_flash') !== 'false' : true;
        if (flashEnabled) {
          setHitFlash(true);
          setTimeout(() => setHitFlash(false), 300);
        }
      }
    }

    if (playerHeal > 0) {
      setIsAnimating("player");
      playSfx('heal');
      const maxHp = quizMode === 'boss-battle' ? 200 + (userLevel * 5) : 100;
      setPlayerHealth(prev => Math.min(maxHp, prev + playerHeal));
      addFloatingText('player', `+${Math.ceil(playerHeal)} HEALED!`, 'text-green-400');
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
      } else {
        // In Learning/Test mode, force a visual victor based on the final score
        finalOutcome = finalScore > questions.length / 2 ? 'victory' : 'defeat';
        if (finalOutcome === 'victory') {
          setEnemyHealth(0); // Player wins, Enemy dies
        } else {
          setPlayerHealth(0); // Enemy wins, Player dies
        }
      }
    }
    setBattleOutcome(finalOutcome!);

    if (finalOutcome === 'victory') {
      playSfx('victory');
    } else {
      playSfx('defeat');
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
    setJudgementText(finalOutcome === 'victory' ? 'VICTORY' : 'GAME OVER');

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

        // Open thank you dialog after a short delay
        setTimeout(() => setThankYouDialogOpen(true), 200);

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
        className={cn("min-h-full flex flex-col bg-background", isFullscreen ? "h-screen w-screen overflow-y-auto" : "")}
      >
        <div className="flex-1 max-w-4xl w-full mx-auto py-8 md:py-12 px-4 md:px-6 space-y-8 md:space-y-12 animate-in fade-in zoom-in duration-500">
          {/* For standard learning/test modes, show the original header */}
          {quizMode !== 'boss-battle' && (
            <header className="text-center space-y-4 md:space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-125 md:scale-150 animate-pulse" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 bg-background rounded-full flex items-center justify-center border-4 border-primary shadow-2xl mx-auto">
                  {isVictor ? <Award className="w-12 h-12 md:w-16 md:h-16 text-primary" /> : <Skull className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-3xl md:text-5xl font-black font-headline text-primary tracking-tighter">
                  {isVictor ? "BATTLE VICTORY" : "QUEST DEFEAT"}
                </h2>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] md:text-xs">
                  Expedition for {selectedSubject}
                </p>
              </div>

              <div className="flex justify-center items-center gap-6 md:gap-12 py-4">
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-black font-headline text-primary">{score}/{questions.length}</div>
                  <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Accuracy</div>
                </div>
                <div className="h-10 md:h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-black font-headline text-accent">+{score * XP_PER_QUESTION}</div>
                  <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">XP Earned</div>
                </div>
              </div>
            </header>
          )}

          {/* Dedicated Boss Battle Game Over Screen */}
          {quizMode === 'boss-battle' && !showBattleLog && (
            <div className="flex flex-col items-center justify-center space-y-10 py-10 animate-in fade-in zoom-in duration-500">
              {/* The Outcome Banner */}
              <div className={cn(
                "w-full max-w-2xl py-12 text-center rounded-[2rem] border-4 shadow-2xl",
                battleOutcome === 'victory' ? "bg-green-100 border-green-500 shadow-green-200" : "bg-red-100 border-red-600 shadow-red-200"
              )}>
                <h1 className={cn("text-5xl md:text-6xl font-black font-headline uppercase tracking-tight", battleOutcome === 'victory' ? "text-green-700" : "text-red-700")}>
                  {battleOutcome === 'victory' ? 'VICTORY!' : 'DEFEAT!'}
                </h1>
                <p className={cn("text-base md:text-lg font-bold uppercase tracking-widest mt-4", battleOutcome === 'victory' ? "text-green-600" : "text-red-600")}>
                  {battleOutcome === 'victory' ? 'The Boss has been vanquished!' : (playerHealth <= 0 && enemyHealth > 0) ? 'Your HP reached 0! The boss has defeated you!' : 'You have ran out of chances to defeat the Boss and failed'}
                </p>
              </div>

              {/* Boss Battle Stats */}
              <div className="flex justify-center items-center gap-6 md:gap-12 py-4">
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-black font-headline text-primary">{score}</div>
                  <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Correct Answers</div>
                </div>
                <div className="h-10 md:h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-black font-headline text-accent">+{score * XP_PER_QUESTION}</div>
                  <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">XP Earned</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-lg mt-4">
                <Button
                  onClick={() => setShowBattleLog(true)}
                  className="w-full h-14 md:h-16 text-xl md:text-2xl font-bytebounce tracking-widest border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-amber-400 hover:bg-amber-500 text-black hover:-translate-y-1 transition-transform"
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
                <Card className="border border-border shadow-lg bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl overflow-hidden border-2 border-orange-200">
                  <CardContent className="p-6 md:p-8 text-center space-y-4">
                    <p className="text-lg md:text-xl font-black text-foreground">Tough Expedition, Aspirant! 💪</p>
                    <p className="text-sm md:text-base text-foreground font-medium">
                      Even the greatest champions face setbacks. This is your learning moment! Every question you encounter strengthens your knowledge for the next quest.
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold uppercase tracking-wide">
                      💡 Tip: Review the topics from this quest and try again. Better luck next time!
                    </p>
                  </CardContent>
                </Card>
              )}

              {score > 0 && score < Math.ceil(questions.length / 2) && (
                <Card className="border border-border shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl overflow-hidden border-2 border-yellow-200">
                  <CardContent className="p-6 md:p-8 text-center space-y-4">
                    <p className="text-lg md:text-xl font-black text-foreground">Nice Effort, Aspirant! 🌟</p>
                    <p className="text-sm md:text-base text-foreground font-medium">
                      You're on the right path! You've grasped some key concepts. Keep reinforcing these topics and you'll see significant improvement on your next expedition.
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold uppercase tracking-wide">
                      💡 Tip: Focus on the questions you missed—they're your learning opportunities!
                    </p>
                  </CardContent>
                </Card>
              )}

              {score >= Math.ceil(questions.length / 2) && score < questions.length && (
                <Card className="border border-border shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl overflow-hidden border-2 border-blue-200">
                  <CardContent className="p-6 md:p-8 text-center space-y-4">
                    <p className="text-lg md:text-xl font-black text-foreground">Great Job, Aspirant! 🚀</p>
                    <p className="text-sm md:text-base text-foreground font-medium">
                      You're demonstrating solid knowledge! You're well on your way to mastery. A few more focused study sessions and you'll be unstoppable. Keep up the momentum!
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold uppercase tracking-wide">
                      💡 Tip: You're almost there! One more push to achieve perfect mastery.
                    </p>
                  </CardContent>
                </Card>
              )}

              {score === questions.length && score > 0 && (
                <Card className="border border-border shadow-lg bg-gradient-to-br from-primary/10 via-yellow-50 to-primary/5 rounded-2xl overflow-hidden border-2 border-primary">
                  <CardContent className="p-6 md:p-8 text-center space-y-4 animate-pulse">
                    <p className="text-lg md:text-xl font-black bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">PERFECT SCORE! 👑✨</p>
                    <p className="text-sm md:text-base text-foreground font-bold">
                      PHENOMENAL! You've achieved PERFECT MASTERY! You are a true champion among aspirants. This is the peak of excellence—celebrate this victory!
                    </p>
                    <div className="flex justify-center gap-2 text-2xl animate-bounce">
                      🏆 ⭐ 🏆
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold uppercase tracking-wide">
                      You've earned extra respect in the BoardQuest arena!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Earned Badges Section */}
              {earnedBadges.length > 0 && (
                <Card className="border border-border shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl overflow-hidden border-2 border-yellow-300">
                  <CardContent className="p-6 md:p-8">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6 text-center">🏆 Badges Earned</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {earnedBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border-2 border-yellow-300 text-center space-y-1 animate-pulse"
                        >
                          <div className="text-2xl">✨</div>
                          <p className="font-bold text-xs md:text-sm text-foreground">{badge.title}</p>
                          <p className="text-[9px] text-slate-600">{badge.name}</p>
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
            <DialogContent className="sm:max-w-md border-2 border-primary/20 bg-gradient-to-br from-slate-50 to-white">
              <DialogHeader className="text-center space-y-4">
                <DialogTitle className="font-headline text-2xl">⚡ Aspirant's Conviction</DialogTitle>
                <DialogDescription className="text-sm">How confident are you in your answers?</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 py-6">
                {[
                  {
                    level: 'Shaky',
                    emoji: '🔥',
                    color: 'bg-red-50 border-red-200 hover:bg-red-100',
                    selectedColor: 'bg-red-100 border-red-500 ring-2 ring-red-300',
                    description: 'Low Confidence',
                  },
                  {
                    level: 'Steady',
                    emoji: '⚡',
                    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
                    selectedColor: 'bg-yellow-100 border-yellow-500 ring-2 ring-yellow-300',
                    description: 'Balanced Confidence',
                  },
                  {
                    level: 'Unyielding',
                    emoji: '💫',
                    color: 'bg-primary/5 border-primary/30 hover:bg-primary/15',
                    selectedColor: 'bg-primary/20 border-primary ring-2 ring-primary/50',
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
                      'relative p-4 rounded-xl border-2 transition-all duration-200 text-center transform',
                      confidence === option.level ? option.selectedColor : option.color,
                      !confidenceSubmitted && 'hover:scale-105'
                    )}
                    disabled={isSavingResults}
                  >
                    <div className="space-y-2">
                      <div className="text-3xl">{option.emoji}</div>
                      <div className="font-black text-xs leading-tight">{option.level}</div>
                      <div className="text-[9px] text-muted-foreground font-bold">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Thank You Dialog */}
          <Dialog open={thankYouDialogOpen} onOpenChange={setThankYouDialogOpen}>
            <DialogContent className="sm:max-w-md border-2 border-primary bg-gradient-to-br from-white via-slate-50 to-white animate-in fade-in zoom-in duration-500">
              <DialogTitle className="sr-only">Quest Completion</DialogTitle>
              <div className="space-y-6 text-center py-8 px-2">
                {/* Trophy Animation */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 border-4 border-primary/30 shadow-2xl animate-bounce">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>

                {/* Main Message */}
                <div className="space-y-3">
                  <p className="text-3xl md:text-4xl font-black font-headline text-primary tracking-tight">
                    Thank You, Aspirant!
                  </p>
                  <p className="text-sm md:text-base text-foreground font-bold leading-relaxed">
                    Your conviction has been recorded and your quest success has been logged to your profile!
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>


          {/* AI Tutor Summary (Only show if not in Boss-Battle, or if reviewing the log) */}
          {(quizMode !== 'boss-battle' || showBattleLog) && (
            <Card className="border border-border shadow-xl bg-background overflow-hidden rounded-[1.5rem] md:rounded-[2rem]">
              <CardHeader className="bg-muted/30 border-b p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-headline text-xl md:text-2xl flex items-center gap-2">
                      <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      Battle Log
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
                      Post-Battle Rationale
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary bg-background px-3 py-1 uppercase font-bold text-[8px] md:text-[10px]">
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
                      <AccordionItem key={idx} value={`item-${idx}`} className="border-b last:border-0 px-2 md:px-4">
                        <AccordionTrigger className="hover:no-underline py-4 md:py-6 px-2 md:px-4">
                          <div className="flex items-start text-left gap-4 md:gap-6">
                            <div className="mt-1 shrink-0">
                              {isCorrect ? (
                                <div className="bg-green-100 p-1.5 md:p-2 rounded-lg md:rounded-xl"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600" /></div>
                              ) : (
                                <div className="bg-red-100 p-1.5 md:p-2 rounded-lg md:rounded-xl"><XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs md:text-sm leading-snug line-clamp-1">{q.question}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={isCorrect ? "secondary" : "destructive"} className="text-[8px] h-3.5 font-black uppercase tracking-tighter">
                                  {isCorrect ? "Mastered" : "Review"}
                                </Badge>
                                <Badge variant="outline" className="text-[8px] h-3.5 font-black uppercase tracking-tighter border-primary/20 text-primary">
                                  {q.type?.replace('_', ' ') || "MCQ"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 md:px-6 pb-6 md:pb-8 pt-2">
                          <div className="bg-muted/30 rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6 border border-primary/5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                              <div className="p-4 bg-background rounded-xl border shadow-sm">
                                <p className="text-[9px] uppercase font-black text-muted-foreground mb-1">Aspirant Choice</p>
                                <p className={cn("font-bold text-sm", isCorrect ? "text-green-600" : "text-red-600")}>
                                  {q.type === 'TRUE_FALSE' && userAns?.selectedLetter
                                    ? (userAns.selectedLetter === 'A' ? 'True (Option A)' : userAns.selectedLetter === 'B' ? 'False (Option B)' : userAns.selectedLetter)
                                    : userAns?.selectedLetter ? `Option ${userAns.selectedLetter}` : 'None'}
                                </p>
                              </div>
                              <div className="p-4 bg-background rounded-xl border shadow-sm">
                                <p className="text-[9px] uppercase font-black text-muted-foreground mb-1">Correct Rationale</p>
                                <p className="font-bold text-sm text-primary">
                                  {q.type === 'TRUE_FALSE'
                                    ? (q.correctAnswer === 'A' ? 'True (Option A)' : q.correctAnswer === 'B' ? 'False (Option B)' : q.correctAnswer)
                                    : `Option ${q.correctAnswer}`}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-black font-headline text-primary flex items-center gap-2 uppercase text-[10px] tracking-widest">
                                <BrainCircuit className="w-3.5 h-3.5" />
                                AI LOGICAL ANALYSIS
                              </h4>
                              <div className="bg-background/80 p-4 md:p-6 rounded-xl border-2 border-dashed border-primary/10">
                                {q.explanation ? (
                                  <p className="text-xs md:text-sm leading-relaxed text-muted-foreground italic">
                                    {q.explanation}
                                  </p>
                                ) : fetchingExplanations[idx] ? (
                                  <div className="flex items-center gap-3 py-2">
                                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                                    <p className="text-[10px] font-bold text-primary animate-pulse">INTERPRETING DATA...</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-start gap-2">
                                    <p className="text-xs md:text-sm leading-relaxed text-muted-foreground italic">
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

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pb-12 w-full max-w-xl mx-auto px-4 sm:px-0 mt-8">
            <Button
              onClick={() => {
                setIsStarted(false);
                setIsFinished(false);
                setShowBattleLog(false);
              }}
              className="flex-1 h-14 md:h-16 text-lg md:text-2xl font-bytebounce tracking-widest border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-primary hover:bg-primary/90 text-white hover:-translate-y-1 transition-transform whitespace-nowrap"
            >
              Re-Enter Arena
            </Button>
            <Link href="/" className="flex-1 flex">
              <Button className="w-full h-14 md:h-16 text-lg md:text-2xl font-bytebounce tracking-widest border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white hover:bg-slate-100 text-black hover:-translate-y-1 transition-transform whitespace-nowrap">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isStarted) {
    const maxPlayerHp = quizMode === 'boss-battle' ? 200 + (userLevel * 5) : 100;
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
            className="sm:max-w-md border-2 border-destructive bg-gradient-to-br from-slate-50 to-white"
          >
            <DialogHeader className="text-center space-y-4">
              <DialogTitle className="font-headline text-2xl text-destructive flex items-center justify-center gap-2">
                <ShieldAlert className="w-6 h-6" />
                Retreat from Battle?
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-slate-600 leading-relaxed">
                Are you certain you wish to retreat? Leaving the arena now means you will forfeit all potential XP and badges from this session.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
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

        {judgementText && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
            <h1 className={cn(
              "text-6xl md:text-8xl font-black font-bytebounce uppercase tracking-widest animate-in zoom-in-50 duration-700 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]",
              judgementText === 'VICTORY' ? 'text-green-500' : 'text-red-500'
            )}>
              {judgementText}
            </h1>
          </div>
        )}

        <main className={cn("flex-1 flex flex-col relative", introPhase !== 'active' && "overflow-hidden")}>
          <div
            className={cn(
              "relative overflow-hidden border-b flex flex-col transition-all duration-1000 ease-in-out shrink-0",
              introPhase === 'cutscene' ? "h-[85vh] md:h-[100vh]" : "h-[35vh] md:h-[45vh]",
              !(SUBJECT_METADATA[selectedSubject]?.arenaBackgroundUrl || SUBJECT_METADATA[selectedSubject]?.backgroundUrl) && "bg-gradient-to-b from-primary to-black"
            )}
            style={{
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
              "absolute inset-0 bg-red-600 z-50 pointer-events-none transition-opacity duration-300",
              hitFlash ? "opacity-30" : "opacity-0"
            )} />

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
                    className="rounded-full text-amber-300 hover:bg-white/20 h-8 w-8 relative"
                    title="Open Reagent Inventory"
                  >
                    <Package className="h-4 w-4" />
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
              const activeEnemyName = quizMode === 'boss-battle'
                ? (battleStage === 1 ? currentActiveNode.minionName : battleStage === 2 ? currentActiveNode.miniBossName : currentActiveNode.bossName)
                : subjectMeta.enemy;
              const activeEnemyBadge = quizMode === 'boss-battle'
                ? (battleStage === 1 ? 'MINION 👾' : battleStage === 2 ? 'MINI-BOSS 👹' : 'BOSS 👑')
                : 'BOSS';
              const stageMaxHp = quizMode === 'boss-battle'
                ? calculateEnemyStageHp(battleStage, userLevel, bossDifficulty || 'MEDIUM')
                : 100;

              return (
                <div className={cn(
                  "absolute top-14 right-4 md:top-16 md:right-8 transition-all duration-1000 ease-out z-10",
                  (introPhase === 'cutscene' || introPhase === 'hidden') ? 'translate-x-[150%]' : 'translate-x-0',
                  isAnimating === "enemy" && "animate-shake scale-110"
                )}>
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded-lg shadow-2xl min-w-[120px] md:min-w-[160px]">
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <span className="text-[8px] md:text-[10px] font-black text-white uppercase truncate">{activeEnemyName}</span>
                      <div className="flex items-center gap-1">
                        {bossShieldActive && <span className="text-[7px] md:text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-black shrink-0 animate-pulse" title="Immune to Normal Attacks">SHIELDED</span>}
                        {quizMode === 'boss-battle' && enemyHealth <= 20 && enemyHealth > 0 ? (
                          <span className="text-[7px] md:text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black shrink-0 animate-pulse" title="Healing every turn!">ENRAGED</span>
                        ) : quizMode === 'boss-battle' && enemyHealth <= 60 && enemyHealth > 0 ? (
                          <span className="text-[7px] md:text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-black shrink-0" title="Double damage on player mistakes!">AGGRESSIVE</span>
                        ) : null}
                        <span className="text-[7px] md:text-[8px] bg-primary text-white px-1.5 py-0.5 rounded font-black shrink-0">{activeEnemyBadge}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-0.5 px-0.5 mt-0.5">
                      <span className="text-[6px] md:text-[8px] font-bold text-white/70 tracking-widest uppercase">HP</span>
                      <span className="text-[7.5px] md:text-[9.5px] font-black text-white">{Math.ceil(enemyHealth)} / {stageMaxHp}</span>
                    </div>
                    <div className="h-1.5 md:h-2 w-full bg-background/10 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (enemyHealth / stageMaxHp) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-end pr-2 md:pr-4 mt-2 relative">
                    <EnemyIcon className="w-12 h-12 md:w-20 md:h-20 text-white drop-shadow-glow" />
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

            {/* Player */}
            <div className={cn(
              "absolute bottom-4 left-4 md:bottom-6 md:left-8 transition-all duration-1000 ease-out z-10",
              (introPhase === 'cutscene' || introPhase === 'hidden') ? '-translate-x-[150%]' : 'translate-x-0',
              isAnimating === "player" && "animate-shake scale-110"
            )}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-background rounded-xl md:rounded-2xl rotate-3 flex items-center justify-center border-2 md:border-4 border-primary shadow-2xl">
                    <Shield className="w-6 h-6 md:w-10 md:h-10 text-primary" />
                  </div>
                  {/* Player Floating Text */}
                  {floatingTexts.filter(ft => ft.target === 'player').map(ft => (
                    <div key={ft.id} className={cn("absolute -top-6 left-2 font-bytebounce text-2xl md:text-3xl animate-float-up pointer-events-none z-50 whitespace-nowrap", ft.color)} style={{ textShadow: '2px 2px 0 #000' }}>
                      {ft.text}
                    </div>
                  ))}
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded-lg shadow-2xl min-w-[120px] md:min-w-[160px] relative">
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
                    <span className="text-[7.5px] md:text-[9.5px] font-black text-white">{Math.ceil(playerHealth)} / {maxPlayerHp}</span>
                  </div>
                  <div className="h-1.5 md:h-2 w-full bg-background/10 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-background transition-all duration-500" style={{ width: `${Math.min(100, (playerHealth / maxPlayerHp) * 100)}%` }} />
                  </div>
                </div>
              </div>
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

      <div id="tour-quest-map" className="flex-1 flex flex-col justify-center py-6 md:py-10 relative z-10 overflow-hidden">
        {categoriesLoading || dynamicCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] space-y-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-white font-bytebounce text-lg tracking-widest uppercase">
              Loading Quest Regions...
            </p>
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

      {/* Mode Selection Dialog */}
      <Dialog open={modeSelectDialogOpen} onOpenChange={setModeSelectDialogOpen}>
        <DialogContent container={fullscreenRef.current} className="sm:max-w-3xl bg-transparent border-none shadow-none p-0 flex justify-center items-center">
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
                            <h4 className="font-bytebounce text-white/90 text-sm min-[375px]:text-base md:text-xl tracking-widest text-center" style={{ textShadow: '1px 1px 0 #000' }}>Select Question Limit</h4>
                          </div>
                          {quizMode === 'learning' ? (
                            <div className="flex flex-wrap justify-center items-center gap-1 min-[375px]:gap-1.5 md:gap-3 w-full">
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
                                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap bg-[#FFC700] text-black text-[7.5px] min-[375px]:text-[8.5px] md:text-[10px] font-bytebounce font-bold px-1 py-0 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-0.5">
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
                            <div className="flex flex-wrap justify-center items-center gap-1.5 min-[375px]:gap-2.5 md:gap-3 w-full max-w-xl mx-auto px-1 min-[375px]:px-2">
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
                                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap bg-[#FFC700] text-black text-[9px] min-[375px]:text-[10px] md:text-xs font-bytebounce font-bold px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-0.5">
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
        <DialogContent container={fullscreenRef.current} className="w-screen h-screen max-w-none max-h-none border-none rounded-none p-0 bg-[#160d08] flex flex-col overflow-hidden z-50">
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
