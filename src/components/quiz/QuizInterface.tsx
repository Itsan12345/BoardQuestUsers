"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Loader2, Sparkles, BrainCircuit, Shield, Flame, Swords, ArrowRight, CornerDownLeft, ZoomIn, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Question = {
  id?: string;
  question: string;
  options: string[];
  choiceImages?: (string | null)[];
  imageUrl?: string | null;
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
  type?: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  topic?: string;
};

interface QuizInterfaceProps {
  questions: Question[];
  onFinish: (score: number) => void;
  onAnswer?: (isCorrect: boolean, index: number, selectedLetter: string, moveType?: 'heavy' | 'normal' | 'defend', activeQuestion?: Question) => void;
  onRequestExplanation?: (index: number) => void;
  isLoading: boolean;
  mode: 'learning' | 'test' | 'boss-battle';
  battleStage?: 1 | 2 | 3 | 4;
  isFinalBoss?: boolean;
  bossShieldActive?: boolean;
  playerPoisoned?: boolean;
  streak?: number;
  equippedItem?: string | null;
  clarityUsedThisBattle?: boolean;
  onUseClarity?: () => void;
  onQuestionChange?: (index: number) => void;
}

export function QuizInterface({ questions, onFinish, onAnswer, onRequestExplanation, isLoading, mode, battleStage = 1, isFinalBoss, bossShieldActive, playerPoisoned, streak, equippedItem, clarityUsedThisBattle, onUseClarity, onQuestionChange }: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [score, setScore] = useState(0);
  const [isFetchingExplanation, setIsFetchingExplanation] = useState(false);

  const [activeMove, setActiveMove] = useState<'heavy' | 'normal' | 'defend' | null>(null);
  const [turnMap, setTurnMap] = useState<number[]>([]);
  const [eliminatedOptionLetters, setEliminatedOptionLetters] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextActionRef = useRef<HTMLDivElement>(null);
  const onQuestionChangeRef = useRef(onQuestionChange);

  useEffect(() => {
    onQuestionChangeRef.current = onQuestionChange;
  }, [onQuestionChange]);

  useEffect(() => {
    setEliminatedOptionLetters([]);
    setZoomedImage(null);
    onQuestionChangeRef.current?.(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomedImage) {
        setZoomedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage]);

  const handleUsePipetteOfClarity = () => {
    if (clarityUsedThisBattle || !onUseClarity || !currentQuestion?.options) return;
    if (currentQuestion.type === 'TRUE_FALSE' || currentQuestion.type === 'SHORT_ANSWER' || currentQuestion.options.length <= 2) return;
    const wrongOptions = optionLetters.filter(letter => letter !== currentQuestion.correctAnswer && !eliminatedOptionLetters.includes(letter));
    if (wrongOptions.length === 0) return;
    const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    setEliminatedOptionLetters(prev => [...prev, randomWrong]);
    onUseClarity();
  };

  useEffect(() => {
    if (questions && turnMap.length !== questions.length) {
      const newTurnMap = questions.map((_, i) => i);
      if (mode === 'test') {
        // CAT starts with Medium baseline
        const firstMediumIdx = newTurnMap.findIndex(i => String(questions[i]?.difficulty).toUpperCase() === 'MEDIUM');
        if (firstMediumIdx > 0) {
          const temp = newTurnMap[0];
          newTurnMap[0] = newTurnMap[firstMediumIdx];
          newTurnMap[firstMediumIdx] = temp;
        }
      }
      setTurnMap(newTurnMap);
    }
  }, [questions, mode, turnMap.length]);

  useEffect(() => {
    setIsFetchingExplanation(false);
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary/50" />
        </div>
        <div className="text-center">
          <p className="text-primary font-black uppercase tracking-widest text-sm">Synchronizing Quest Data</p>
          <p className="text-muted-foreground text-[10px] font-bold mt-1">LOADING ADMIN-SYNTHESIZED MODULES...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return <div className="text-center p-12 text-muted-foreground font-medium">No challenges in this region yet.</div>;
  }

  const currentQuestionIndex = turnMap[currentIndex] ?? currentIndex;
  const currentQuestion = questions[currentQuestionIndex];
  const optionLetters = Array.from({ length: currentQuestion?.options?.length || 0 }, (_, i) => String.fromCharCode(65 + i));

  const isValidImageUrl = (url: any): boolean => {
    return typeof url === 'string' && url.trim().length > 0 && url.trim() !== 'null' && url.trim() !== 'undefined';
  };

  const hasQuestionImage = isValidImageUrl(currentQuestion?.imageUrl);

  const hasChoiceImages = Boolean(
    currentQuestion?.choiceImages &&
    Array.isArray(currentQuestion.choiceImages) &&
    currentQuestion.choiceImages.some(img => isValidImageUrl(img))
  );

  const handleSelectMove = (move: 'heavy' | 'normal' | 'defend') => {
    setActiveMove(move);
    const targetDiff = move === 'heavy' ? 'HARD' : move === 'normal' ? 'MEDIUM' : 'EASY';
    
    const newTurnMap = [...turnMap];
    let foundIdxMapPos = newTurnMap.findIndex((qIdx, mapIdx) => mapIdx >= currentIndex && questions[qIdx]?.difficulty === targetDiff);
    
    if (foundIdxMapPos === -1) {
      foundIdxMapPos = newTurnMap.findIndex((qIdx, mapIdx) => mapIdx >= currentIndex);
    }
    
    if (foundIdxMapPos !== -1 && foundIdxMapPos !== currentIndex) {
      const temp = newTurnMap[currentIndex];
      newTurnMap[currentIndex] = newTurnMap[foundIdxMapPos];
      newTurnMap[foundIdxMapPos] = temp;
      setTurnMap(newTurnMap);
    }
  };

  const handleSubmit = (letter: string) => {
    if (isAnswered || isTransitioning) return;
    
    setSelectedAnswer(letter);
    const isCorrect = currentQuestion.type === 'SHORT_ANSWER' 
      ? letter.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
      : letter === currentQuestion.correctAnswer;
    setIsAnswered(letter !== null); // In Test mode, we still mark it as "selected"
    
    // Logic for Learning Mode vs Test Mode vs Boss Battle
    if (mode === 'learning') {
      setIsAnswered(true);
      if (isCorrect) setScore(s => s + 1);
      if (onAnswer) onAnswer(isCorrect, currentQuestionIndex, letter, undefined, currentQuestion);

      // Auto-smooth scroll down to explanation after battle animations complete if needed
      setTimeout(() => {
        if (nextActionRef.current) {
          nextActionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 1350);
    } else if (mode === 'boss-battle') {
      setIsAnswered(true);
      if (isCorrect) setScore(s => s + 1);
      if (onAnswer) onAnswer(isCorrect, currentQuestionIndex, letter, activeMove || undefined, currentQuestion);
      
      const transitionDelay = (!isCorrect && activeMove === 'heavy') ? 2100 : 1500;
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          if (onQuestionChange) onQuestionChange(nextIdx);
          setSelectedAnswer(null);
          setIsAnswered(false);
          setActiveMove(null);
        } else {
          onFinish(isCorrect ? score + 1 : score);
        }
      }, transitionDelay);
    } else {
      // Test Mode: Immediate feedback & synchronized animation transition
      const finalIsCorrect = isCorrect; 
      const newScore = finalIsCorrect ? score + 1 : score;
      setScore(newScore);
      setIsTransitioning(true);

      // Trigger the battle animation (player attack or enemy counter-attack) IMMEDIATELY upon answering!
      if (onAnswer) onAnswer(finalIsCorrect, currentQuestionIndex, letter, undefined, currentQuestion);

      // Allow animations to play out smoothly before transitioning to next question:
      // Correct answer: 1400ms (player strike, hit reaction & floating damage text)
      // Incorrect answer: 2300ms (enemy lunge/strike, player hit reaction, idle pause & return glide)
      const transitionDelay = finalIsCorrect ? 1400 : 2300;

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          // CAT Logic: Adapt difficulty
          const currentDiff = String(currentQuestion.difficulty || 'MEDIUM').toUpperCase();
          let targetDiff = currentDiff;
          if (finalIsCorrect) {
            targetDiff = currentDiff === 'EASY' ? 'MEDIUM' : 'HARD';
          } else {
            targetDiff = currentDiff === 'HARD' ? 'MEDIUM' : 'EASY';
          }

          const nextTurnMap = [...turnMap];
          let foundIdx = nextTurnMap.findIndex((qIdx, mapIdx) => mapIdx > currentIndex && String(questions[qIdx]?.difficulty).toUpperCase() === targetDiff);
          
          if (foundIdx === -1) {
            // Fallback if we run out of target difficulty
            foundIdx = nextTurnMap.findIndex((qIdx, mapIdx) => mapIdx > currentIndex);
          }

          if (foundIdx !== -1 && foundIdx !== currentIndex + 1) {
            const temp = nextTurnMap[currentIndex + 1];
            nextTurnMap[currentIndex + 1] = nextTurnMap[foundIdx];
            nextTurnMap[foundIdx] = temp;
            setTurnMap(nextTurnMap);
          }

          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          if (onQuestionChange) onQuestionChange(nextIdx);
          setSelectedAnswer(null);
          setIsAnswered(false);
          setIsTransitioning(false);
        } else {
          onFinish(newScore);
          setIsTransitioning(false);
        }
      }, transitionDelay);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (onQuestionChange) onQuestionChange(nextIdx);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setActiveMove(null);
      
      // Smoothly scroll window, document, and all parent containers (including fullscreen arena) to the very top
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
      }

      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        let parent = containerRef.current.parentElement;
        while (parent) {
          if (parent.scrollHeight > parent.clientHeight || parent.classList.contains('overflow-y-auto') || parent.classList.contains('overflow-auto')) {
            parent.scrollTo({ top: 0, behavior: 'smooth' });
          }
          parent = parent.parentElement;
        }
      }
    } else {
      onFinish(score);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col h-full overflow-y-auto pb-20 no-scrollbar relative select-none">
      <div className="px-6 pt-6 flex justify-between items-center mb-4 gap-4">
        <div className="flex flex-col">
          {mode !== 'boss-battle' ? (
            <span className="text-xs sm:text-[13px] font-bold text-foreground/80 uppercase tracking-wider">
               Quest {currentIndex + 1}{questions.length > 0 ? ` of ${questions.length}` : ''}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-[13px] font-bold text-foreground/80 uppercase tracking-wider">
                 Quest {currentIndex + 1}{questions.length > 0 ? ` of ${questions.length}` : ''}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-destructive uppercase tracking-wider">
                 (Survival Mode)
              </span>
            </div>
          )}
          <div className="flex gap-2 mt-1 flex-wrap items-center">
             <Badge variant="outline" className={cn("h-4 text-[8px] uppercase tracking-tighter", mode === 'learning' || mode === 'boss-battle' ? "border-primary text-primary" : "border-slate-500 text-muted-foreground")}>
               {mode === 'learning' ? <BrainCircuit className="w-2 h-2 mr-1" /> : mode === 'boss-battle' ? <Swords className="w-2 h-2 mr-1" /> : <Shield className="w-2 h-2 mr-1" />}
               {mode === 'learning' ? 'Learning Mode' : mode === 'boss-battle' ? 'Boss Battle Mode' : 'Test Mode'}
             </Badge>
             {mode === 'boss-battle' && (
               <Badge className={cn(
                 "h-4 text-[8px] uppercase font-mono tracking-wider font-bold px-2 rounded-full border shadow-xs flex items-center gap-1",
                 isFinalBoss ? "bg-red-500/20 text-red-500 border-red-500/50 animate-pulse" :
                 battleStage === 1 ? "bg-amber-500/15 text-amber-600 border-amber-500/40" :
                 battleStage === 2 ? "bg-purple-500/15 text-purple-600 border-purple-500/40" :
                 "bg-red-500/15 text-red-600 border-red-500/40 animate-pulse"
               )}>
                 <span>{isFinalBoss || battleStage === 4 ? '👑' : battleStage === 1 ? '👾' : battleStage === 2 ? '👹' : '⚔️'}</span>
                  <span>{isFinalBoss || battleStage === 4 ? 'SOLO FINAL BOSS' : battleStage === 1 ? 'STAGE 1: MINION' : battleStage === 2 ? 'STAGE 2: MINI-BOSS' : 'STAGE 3: CHAPTER BOSS'}</span>
               </Badge>
             )}
             {mode === 'learning' && (
               <Badge variant="default" className={cn(
                 "h-4 text-[8px] uppercase tracking-tighter",
                 currentQuestion.difficulty === 'EASY' ? "bg-green-500 hover:bg-green-600" :
                 currentQuestion.difficulty === 'MEDIUM' ? "bg-yellow-500 hover:bg-yellow-600" :
                 "bg-red-500 hover:bg-red-600"
               )}>
                 {currentQuestion.difficulty === 'EASY' ? 'Wave 1: Minion Phase' :
                  currentQuestion.difficulty === 'MEDIUM' ? 'Wave 2: Enforcer Phase' :
                  'Wave 3: Elite Phase'}
               </Badge>
             )}
             {streak !== undefined && streak >= 2 && (
               <Badge className="h-4 bg-gradient-to-r from-orange-500 via-amber-500 to-red-600 border border-amber-300 text-white font-black text-[8px] uppercase tracking-wider px-2 shadow-[0_0_8px_rgba(249,115,22,0.5)] flex items-center gap-1 animate-pulse">
                 <Flame className="w-2.5 h-2.5 text-yellow-200 fill-yellow-200" />
                 <span>{streak}x STREAK</span>
               </Badge>
             )}
          </div>
        </div>

        {mode === 'boss-battle' && equippedItem === 'pipette_clarity' && !clarityUsedThisBattle && !isAnswered && currentQuestion?.type !== 'TRUE_FALSE' && currentQuestion?.type !== 'SHORT_ANSWER' && (currentQuestion?.options?.length || 0) > 2 && (
          <Button
            size="sm"
            onClick={handleUsePipetteOfClarity}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-[9px] md:text-[10px] uppercase tracking-wider h-8 px-3 rounded-full shadow-lg shadow-purple-500/30 animate-pulse flex items-center gap-1.5 shrink-0 border border-purple-300"
          >
            <Image
              src="/images/bossbattleItems/PippeteofClarity.png"
              alt="Pipette of Clarity"
              width={18}
              height={18}
              className="w-4 h-4 object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              style={{ imageRendering: 'pixelated' }}
              unoptimized
            />
            Pipette Hint (50:50)
          </Button>
        )}
      </div>

      {mode === 'boss-battle' && !activeMove ? (
        <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-5 md:space-y-7 animate-in fade-in duration-500 w-full">
          <div className="text-center space-y-1.5 px-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-xs mb-0.5">
              <Swords className="w-3.5 h-3.5" />
              <span>Battle Turn Action</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-headline tracking-tight text-foreground drop-shadow-sm">Choose Your Move</h2>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">Select a combat card for this turn</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2.5 sm:gap-6 md:gap-8 w-full max-w-4xl px-2 sm:px-6">
            {/* Defend / Heal Card (Left - Matching Reference Image) */}
            <button
              type="button"
              onClick={() => handleSelectMove('defend')}
              className="group relative flex flex-col items-center cursor-pointer focus:outline-none transition-all duration-300 transform hover:-translate-y-2.5 hover:scale-[1.03] active:translate-y-1 active:scale-[0.98] w-full max-w-[280px] lg:max-w-[300px] mx-auto select-none"
            >
              <div className={cn(
                "relative w-full aspect-[56/72] transition-all duration-300 filter",
                playerPoisoned 
                  ? "drop-shadow-[0_0_18px_rgba(16,185,129,0.9)] animate-pulse" 
                  : "drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_12px_24px_rgba(16,185,129,0.7)]"
              )}>
                {/* Pixel Art Card Base */}
                <Image
                  src="/images/bossbattlecards/heal_btn.png"
                  alt="Defend / Heal Card"
                  fill
                  sizes="(max-width: 640px) 115px, (max-width: 1024px) 220px, 300px"
                  unoptimized
                  priority
                  className="object-fill [image-rendering:pixelated] select-none pointer-events-none"
                  draggable={false}
                />

                {/* Card Sheen on Hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-sm" />

                {/* Content Area Inside Card's Lower Plate (Proportionately centered & fully responsive) */}
                <div className="absolute inset-x-[7%] top-[49%] sm:top-[50%] bottom-[12%] sm:bottom-[13%] flex flex-col items-center justify-center text-center px-1 sm:px-2 gap-0 pointer-events-none">
                  {/* Title & Badges */}
                  <div className="w-full flex flex-col items-center">
                    <h3 className="font-bytebounce uppercase tracking-wide text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl leading-none text-[#4ade80] [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000]">
                      DEFEND / HEAL
                    </h3>
                    
                    {playerPoisoned && (
                      <span className="inline-block font-bytebounce text-[8px] sm:text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow-sm mt-0.5 animate-pulse border border-emerald-400 leading-none">
                        CURES POISON
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="w-full px-0.5 -mt-0.5 sm:-mt-1">
                    <p className="text-[7.5px] min-[360px]:text-[8.5px] sm:text-xs md:text-[13px] lg:text-[14px] font-bold text-white leading-tight sm:leading-snug [text-shadow:0_1px_2px_rgba(0,0,0,0.95)] max-w-full mx-auto">
                      <span className="sm:hidden">Restores HP & cures debuffs. Deals 0 boss damage.</span>
                      <span className="hidden sm:inline">Restores player HP & cures debuffs. Deals 0 damage to boss.</span>
                    </p>
                  </div>
                </div>
              </div>
            </button>
            
            {/* Heavy Attack Card (Center - Matching Reference Image) */}
            <button
              type="button"
              onClick={() => handleSelectMove('heavy')}
              className="group relative flex flex-col items-center cursor-pointer focus:outline-none transition-all duration-300 transform hover:-translate-y-2.5 hover:scale-[1.03] active:translate-y-1 active:scale-[0.98] w-full max-w-[280px] lg:max-w-[300px] mx-auto select-none"
            >
              <div className={cn(
                "relative w-full aspect-[56/72] transition-all duration-300 filter",
                bossShieldActive 
                  ? "drop-shadow-[0_0_18px_rgba(59,130,246,0.9)] animate-pulse" 
                  : "drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_12px_24px_rgba(239,68,68,0.75)]"
              )}>
                {/* Pixel Art Card Base */}
                <Image
                  src="/images/bossbattlecards/heavyAttack_btn.png"
                  alt="Heavy Attack Card"
                  fill
                  sizes="(max-width: 640px) 115px, (max-width: 1024px) 220px, 300px"
                  unoptimized
                  priority
                  className="object-fill [image-rendering:pixelated] select-none pointer-events-none"
                  draggable={false}
                />

                {/* Card Sheen on Hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-sm" />

                {/* Content Area Inside Card's Lower Plate (Proportionately centered & fully responsive) */}
                <div className="absolute inset-x-[7%] top-[51%] sm:top-[52%] bottom-[11%] sm:bottom-[12%] flex flex-col items-center justify-center text-center px-1 sm:px-2 gap-0 pointer-events-none">
                  {/* Title & Badges */}
                  <div className="w-full flex flex-col items-center">
                    <h3 className={cn(
                      "font-bytebounce uppercase tracking-wide text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl leading-none [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000]",
                      bossShieldActive ? "text-cyan-300" : "text-[#f87171]"
                    )}>
                      HEAVY ATTACK
                    </h3>
                    
                    {bossShieldActive && (
                      <span className="inline-block font-bytebounce text-[8px] sm:text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm mt-0.5 animate-pulse border border-blue-400 leading-none">
                        BREAKS SHIELD
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="w-full px-0.5 -mt-0.5 sm:-mt-1">
                    <p className="text-[7.5px] min-[360px]:text-[8.5px] sm:text-xs md:text-[13px] lg:text-[14px] font-bold text-white leading-tight sm:leading-snug [text-shadow:0_1px_2px_rgba(0,0,0,0.95)] max-w-full mx-auto">
                      <span className="sm:hidden">Deals massive damage. Counter-attacked if wrong!</span>
                      <span className="hidden sm:inline">Deals massive damage. If wrong, player takes heavy counter-attack!</span>
                    </p>
                  </div>
                </div>
              </div>
            </button>
            
            {/* Normal Attack Card (Right - Matching Reference Image) */}
            <button
              type="button"
              onClick={() => handleSelectMove('normal')}
              className="group relative flex flex-col items-center cursor-pointer focus:outline-none transition-all duration-300 transform hover:-translate-y-2.5 hover:scale-[1.03] active:translate-y-1 active:scale-[0.98] w-full max-w-[280px] lg:max-w-[300px] mx-auto select-none"
            >
              <div className={cn(
                "relative w-full aspect-[56/72] transition-all duration-300 filter",
                bossShieldActive 
                  ? "opacity-60 grayscale-[40%] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" 
                  : "drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_12px_24px_rgba(245,158,11,0.7)]"
              )}>
                {/* Pixel Art Card Base */}
                <Image
                  src="/images/bossbattlecards/normalAttack_btn.png"
                  alt="Normal Attack Card"
                  fill
                  sizes="(max-width: 640px) 115px, (max-width: 1024px) 220px, 300px"
                  unoptimized
                  priority
                  className="object-fill [image-rendering:pixelated] select-none pointer-events-none"
                  draggable={false}
                />

                {/* Card Sheen on Hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-sm" />

                {/* Content Area Inside Card's Lower Plate (Proportionately centered & fully responsive) */}
                <div className="absolute inset-x-[7%] top-[49%] sm:top-[50%] bottom-[12%] sm:bottom-[13%] flex flex-col items-center justify-center text-center px-1 sm:px-2 gap-0 pointer-events-none">
                  {/* Title & Badges */}
                  <div className="w-full flex flex-col items-center">
                    <h3 className={cn(
                      "font-bytebounce uppercase tracking-wide text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl leading-none [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000]",
                      bossShieldActive ? "text-slate-300" : "text-[#facc15]"
                    )}>
                      NORMAL ATTACK
                    </h3>
                    
                    {bossShieldActive && (
                      <span className="inline-block font-bytebounce text-[8px] sm:text-xs bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded shadow-sm mt-0.5 border border-slate-500 leading-none">
                        INEFFECTIVE
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="w-full px-0.5 -mt-0.5 sm:-mt-1">
                    <p className="text-[7.5px] min-[360px]:text-[8.5px] sm:text-xs md:text-[13px] lg:text-[14px] font-bold text-white leading-tight sm:leading-snug [text-shadow:0_1px_2px_rgba(0,0,0,0.95)] max-w-full mx-auto">
                      <span className="sm:hidden">Standard damage with balanced risk.</span>
                      <span className="hidden sm:inline">Answer a standard question. Deals reliable damage with balanced risk.</span>
                    </p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-6 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold leading-snug font-headline text-foreground">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Question Specimen Image with Zoom/Lightbox feature */}
          {hasQuestionImage && (
            <div className="px-4 sm:px-6 mb-6">
              <div 
                onClick={() => setZoomedImage({ url: currentQuestion.imageUrl!, title: "Clinical Specimen / Reference Slide" })}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-border/80 bg-muted/20 hover:border-primary/60 transition-all duration-300 shadow-sm hover:shadow-xl max-w-xl mx-auto flex flex-col p-2.5 sm:p-3 bg-gradient-to-b from-card to-muted/20 backdrop-blur-sm"
              >
                <div className="w-full flex items-center justify-between pb-2 px-1 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-primary">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Clinical Specimen / Reference Image
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors font-mono">
                    <ZoomIn className="w-3 h-3" />
                    Tap to Enlarge
                  </span>
                </div>

                <div className="relative w-full h-[220px] sm:h-[280px] md:h-[320px] flex items-center justify-center overflow-hidden rounded-xl bg-black/10 dark:bg-black/50 border border-border/40">
                  <Image
                    src={currentQuestion.imageUrl!}
                    alt="Question Specimen Reference"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    priority
                    unoptimized={!currentQuestion.imageUrl?.includes('supabase.co')}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-[1.5px]">
                    <Maximize2 className="w-4 h-4" />
                    <span>Enlarge Full Screen</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(() => {
            const renderOptions = () => {
              if (currentQuestion.type === 'SHORT_ANSWER') {
                return (
                  <div className="space-y-4">
                    <Input
                      value={selectedAnswer || ''}
                      onChange={(e) => !isAnswered && setSelectedAnswer(e.target.value)}
                      disabled={isAnswered}
                      placeholder="Type your answer here..."
                      className={cn(
                        "w-full text-lg p-6 rounded-2xl border-2 transition-all shadow-sm focus-visible:ring-primary focus-visible:border-primary",
                        isAnswered && (selectedAnswer?.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300" 
                          : "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-300")
                      )}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isAnswered && selectedAnswer) {
                          handleSubmit(selectedAnswer);
                        }
                      }}
                    />
                    
                    {isAnswered && (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Correct Answer</span>
                        </div>
                        <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">{currentQuestion.correctAnswer}</span>
                      </div>
                    )}
                    
                    {!isAnswered && (
                      <Button 
                        className="w-full font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                        size="lg"
                        disabled={!selectedAnswer?.trim()}
                        onClick={() => handleSubmit(selectedAnswer || '')}
                      >
                        Submit Answer <CornerDownLeft className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              }

              if (hasChoiceImages) {
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {currentQuestion.options.map((option, idx) => {
                      const letter = optionLetters[idx];
                      const isSelected = selectedAnswer === letter;
                      const isEliminated = eliminatedOptionLetters.includes(letter);
                      const choiceImg = currentQuestion.choiceImages?.[idx];
                      const hasThisImg = isValidImageUrl(choiceImg);

                      const isCorrect = isAnswered && letter === currentQuestion.correctAnswer;
                      const isWrong = isAnswered && isSelected && !isCorrect;

                      return (
                        <div
                          key={letter}
                          onClick={() => {
                            if (!isAnswered && !isTransitioning && !isEliminated) {
                              handleSubmit(letter);
                            }
                          }}
                          className={cn(
                            "flex flex-col p-3 sm:p-4 rounded-2xl border-2 transition-all text-left shadow-xs relative overflow-hidden cursor-pointer group select-none",
                            !isAnswered && !isTransitioning && !isEliminated && "bg-card border-border hover:border-primary/60 hover:bg-primary/5 hover:shadow-md dark:hover:bg-primary/10",
                            isCorrect && "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-emerald-500/20 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30",
                            isWrong && "bg-red-50 dark:bg-red-950/40 border-red-500 shadow-red-500/20 text-red-950 dark:text-red-200 ring-2 ring-red-500/30",
                            isAnswered && !isSelected && !isCorrect && "opacity-50 grayscale",
                            isEliminated && "opacity-40 grayscale bg-muted border-border cursor-not-allowed line-through"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn(
                                "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs sm:text-sm transition-all",
                                isCorrect ? "bg-green-500 text-white shadow-xs" : 
                                isWrong ? "bg-red-500 text-white shadow-xs" : 
                                isEliminated ? "bg-slate-300 text-slate-500" :
                                isSelected ? "bg-primary text-white" : "bg-muted text-primary border border-border"
                              )}>
                                {isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : isWrong ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  letter
                                )}
                              </div>
                              {option && option.trim().length > 0 && (
                                <span className={cn(
                                  "text-xs sm:text-sm font-bold truncate",
                                  isEliminated && "line-through text-slate-400",
                                  isCorrect ? "text-green-700 dark:text-green-300" : isWrong ? "text-red-700 dark:text-red-300" : "text-foreground"
                                )}>
                                  {option}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isEliminated && (
                                <span className="text-[7.5px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                                  Filtered Out 🧪
                                </span>
                              )}
                              {hasThisImg && (
                                <button
                                  type="button"
                                  title="Enlarge option image"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setZoomedImage({ url: choiceImg!, title: `Choice ${letter}: ${option || 'Clinical Specimen'}` });
                                  }}
                                  className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-border/40 hover:border-primary/40 bg-card/60"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {hasThisImg ? (
                            <div 
                              className="relative w-full h-36 sm:h-44 md:h-48 rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 border border-border/50 flex items-center justify-center group/img"
                            >
                              <Image
                                src={choiceImg!}
                                alt={`Option ${letter}`}
                                fill
                                sizes="(max-width: 640px) 100vw, 350px"
                                className="object-contain p-1.5 transition-transform duration-300 group-hover/img:scale-105"
                                unoptimized={!choiceImg?.includes('supabase.co')}
                              />
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomedImage({ url: choiceImg!, title: `Choice ${letter}: ${option || 'Clinical Specimen'}` });
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-xs hover:scale-110 z-10"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-24 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground font-semibold">
                              <span>{option}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const letter = optionLetters[idx];
                    const isSelected = selectedAnswer === letter;
                    const isEliminated = eliminatedOptionLetters.includes(letter);
                    
                    const isCorrect = isAnswered && letter === currentQuestion.correctAnswer;
                    const isWrong = isAnswered && isSelected && !isCorrect;

                    return (
                      <button
                        key={letter}
                        disabled={isAnswered || isTransitioning || isEliminated}
                        onClick={() => handleSubmit(letter)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-sm relative overflow-hidden text-foreground",
                          !isAnswered && !isTransitioning && !isEliminated && "bg-card border-border hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10",
                          isCorrect && "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200",
                          isWrong && "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-950 dark:text-red-200",
                          isAnswered && !isSelected && !isCorrect && "opacity-50 grayscale",
                          isEliminated && "opacity-40 grayscale bg-muted border-border cursor-not-allowed line-through"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm transition-all",
                          isCorrect ? "bg-green-500 text-white" : 
                          isWrong ? "bg-red-500 text-white" : 
                          isEliminated ? "bg-slate-300 text-slate-500" :
                          isSelected ? "bg-primary text-white" : "bg-muted text-primary"
                        )}>
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isWrong ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            letter
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-bold flex-1",
                          isEliminated && "line-through text-slate-400",
                          isCorrect ? "text-green-700" : isWrong ? "text-red-700" : "text-foreground"
                        )}>
                          {option}
                        </span>
                        {isEliminated && (
                          <span className="text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 shrink-0">
                            Filtered Out 🧪
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            };

            if (mode === 'learning') {
              return (
                <div className="px-4 sm:px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
                    {/* Left: 3/4 Size on Desktop (Options Column) */}
                    <div className="lg:col-span-3 space-y-3">
                      {renderOptions()}
                    </div>

                    {/* Right: 1/4 Size on Desktop (AI Tutor Logic Analysis Column) */}
                    <div 
                      ref={nextActionRef}
                      className={cn(
                        "lg:col-span-1 flex flex-col gap-4",
                        !isAnswered ? "hidden lg:flex" : "flex"
                      )}
                    >
                      {isAnswered ? (
                        <>
                          <div className="p-4 sm:p-5 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-xs">
                            <div className="flex items-center gap-2 mb-2.5">
                              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                                <Sparkles className="w-4 h-4 text-primary" />
                              </div>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-tight">
                                AI Tutor Logic Analysis
                              </p>
                            </div>
                            
                            {currentQuestion.explanation ? (
                              <p className="text-xs text-muted-foreground italic leading-relaxed whitespace-pre-line">
                                {currentQuestion.explanation}
                              </p>
                            ) : isFetchingExplanation ? (
                              <div className="flex items-center gap-2.5 py-3">
                                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                                <p className="text-[10px] font-bold text-primary animate-pulse">INTERPRETING DATA...</p>
                              </div>
                            ) : (
                              <div className="py-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setIsFetchingExplanation(true);
                                    if (onRequestExplanation) onRequestExplanation(currentQuestionIndex);
                                  }}
                                  className="w-full text-xs text-primary border-primary hover:bg-primary hover:text-white"
                                >
                                  <BrainCircuit className="w-3.5 h-3.5 mr-2" />
                                  Ask AI Tutor
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="w-full animate-in fade-in duration-300 delay-75 pb-4">
                            <Button 
                              onClick={handleNext}
                              size="lg"
                              className="w-full font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all rounded-xl border-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white py-5 text-xs sm:text-sm"
                            >
                              <span>{currentIndex < questions.length - 1 ? "Next Quest" : "Finish Quest"}</span>
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        /* Standby State on Desktop (1/4 Column) */
                        <div className="p-4 sm:p-5 bg-card/40 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-center p-6 min-h-[160px] text-muted-foreground/60 select-none">
                          <div className="bg-muted/40 p-2 rounded-xl mb-2.5">
                            <Sparkles className="w-4 h-4 text-primary/60" />
                          </div>
                          <p className="text-[10px] font-black text-foreground/75 uppercase tracking-widest mb-1">
                            AI Tutor Logic Analysis
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Select an answer to reveal clinical reasoning and step-by-step logic breakdown.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="px-4 sm:px-6 space-y-3">
                {renderOptions()}
              </div>
            );
          })()}
        </>
      )}

      {/* High-Resolution Specimen Lightbox Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-background/95 border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
                    {zoomedImage.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                    High-Resolution Clinical Asset
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setZoomedImage(null)}
                className="h-8 w-8 p-0 rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Specimen image display */}
            <div className="relative flex-1 min-h-[300px] h-[65vh] sm:h-[70vh] w-full flex items-center justify-center p-3 sm:p-6 bg-black/95 overflow-hidden">
              <Image
                src={zoomedImage.url}
                alt={zoomedImage.title}
                fill
                sizes="95vw"
                className="object-contain p-2 rounded-lg select-none"
                unoptimized={!zoomedImage.url?.includes('supabase.co')}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-border/50 bg-muted/20 text-[10px] sm:text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Interactive Diagnostic Viewer
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomedImage(null)}
                className="h-7 text-xs font-bold rounded-lg px-3"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
