"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Loader2, Sparkles, BrainCircuit, Shield, Flame, Sword, ShieldPlus, Swords, ArrowRight, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Question = {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
  type?: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
};

interface QuizInterfaceProps {
  questions: Question[];
  onFinish: (score: number) => void;
  onAnswer?: (isCorrect: boolean, index: number, selectedLetter: string, moveType?: 'heavy' | 'normal' | 'defend', activeQuestion?: Question) => void;
  onRequestExplanation?: (index: number) => void;
  isLoading: boolean;
  mode: 'learning' | 'test' | 'boss-battle';
  battleStage?: 1 | 2 | 3;
  bossShieldActive?: boolean;
  playerPoisoned?: boolean;
  streak?: number;
  equippedItem?: string | null;
  clarityUsedThisBattle?: boolean;
  onUseClarity?: () => void;
}

export function QuizInterface({ questions, onFinish, onAnswer, onRequestExplanation, isLoading, mode, battleStage = 1, bossShieldActive, playerPoisoned, streak, equippedItem, clarityUsedThisBattle, onUseClarity }: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [score, setScore] = useState(0);
  const [isFetchingExplanation, setIsFetchingExplanation] = useState(false);

  const [activeMove, setActiveMove] = useState<'heavy' | 'normal' | 'defend' | null>(null);
  const [turnMap, setTurnMap] = useState<number[]>([]);
  const [eliminatedOptionLetters, setEliminatedOptionLetters] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextActionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEliminatedOptionLetters([]);
  }, [currentIndex]);

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
  }, [questions, mode]);

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
  const optionLetters = Array.from({ length: currentQuestion.options.length }, (_, i) => String.fromCharCode(65 + i));

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

      // Auto-smooth scroll down to explanation after battle animations complete
      setTimeout(() => {
        if (nextActionRef.current) {
          nextActionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1350);
    } else if (mode === 'boss-battle') {
      setIsAnswered(true);
      if (isCorrect) setScore(s => s + 1);
      if (onAnswer) onAnswer(isCorrect, currentQuestionIndex, letter, activeMove || undefined, currentQuestion);
      
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSelectedAnswer(null);
          setIsAnswered(false);
          setActiveMove(null);
        } else {
          onFinish(isCorrect ? score + 1 : score);
        }
      }, 1500);
    } else {
      // Test Mode: Brief visual feedback before transition
      const finalIsCorrect = isCorrect; 
      const newScore = finalIsCorrect ? score + 1 : score;
      setScore(newScore);
      setIsTransitioning(true);

      setTimeout(() => {
        if (onAnswer) onAnswer(finalIsCorrect, currentQuestionIndex, letter, undefined, currentQuestion);

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

          setCurrentIndex(currentIndex + 1);
          setSelectedAnswer(null);
          setIsAnswered(false);
          setIsTransitioning(false);
        } else {
          onFinish(newScore);
          setIsTransitioning(false);
        }
      }, 1000);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
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
    <div ref={containerRef} className="w-full flex flex-col h-full overflow-y-auto pb-20 no-scrollbar relative">
      <div className="px-6 pt-6 flex justify-between items-center mb-4 gap-4">
        <div className="flex flex-col">
          {mode !== 'boss-battle' ? (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
               Quest {currentIndex + 1} of {questions.length}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">
               Survival Mode
            </span>
          )}
          <div className="flex gap-2 mt-1 flex-wrap items-center">
             <Badge variant="outline" className={cn("h-4 text-[8px] uppercase tracking-tighter", mode === 'learning' || mode === 'boss-battle' ? "border-primary text-primary" : "border-slate-500 text-muted-foreground")}>
               {mode === 'learning' ? <BrainCircuit className="w-2 h-2 mr-1" /> : mode === 'boss-battle' ? <Swords className="w-2 h-2 mr-1" /> : <Shield className="w-2 h-2 mr-1" />}
               {mode === 'learning' ? 'Learning Mode' : mode === 'boss-battle' ? 'Boss Battle Mode' : 'Test Mode'}
             </Badge>
             {mode === 'boss-battle' && (
               <Badge className={cn(
                 "h-4 text-[8px] uppercase font-mono tracking-wider font-bold px-2 rounded-full border shadow-xs flex items-center gap-1",
                 battleStage === 1 ? "bg-amber-500/15 text-amber-600 border-amber-500/40" :
                 battleStage === 2 ? "bg-purple-500/15 text-purple-600 border-purple-500/40" :
                 "bg-red-500/15 text-red-600 border-red-500/40 animate-pulse"
               )}>
                 <span>{battleStage === 1 ? '👾' : battleStage === 2 ? '👹' : '👑'}</span>
                 <span>STAGE {battleStage} / 3</span>
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
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
            Pipette Hint (50:50)
          </Button>
        )}
      </div>

      {mode === 'boss-battle' && !activeMove ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-8 animate-in fade-in duration-500 w-full">
          <div className="text-center space-y-2 px-6">
            <h2 className="text-2xl md:text-3xl font-black font-headline text-foreground">Choose Your Move</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select an action for the next turn</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 md:gap-6 w-full max-w-5xl px-2 md:px-6">
            {/* Heavy Attack Card */}
            <button
              onClick={() => handleSelectMove('heavy')}
              className={cn("border-2 hover:shadow-xl transition-all p-2 sm:p-4 md:p-8 rounded-xl md:rounded-3xl flex flex-col items-center text-center space-y-2 md:space-y-6 group", 
                bossShieldActive ? "bg-blue-50 border-blue-400 hover:border-blue-600 shadow-blue-100" : "bg-background border-red-200 hover:border-red-500 hover:shadow-red-100"
              )}
            >
              <div className={cn("w-10 h-10 md:w-24 md:h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0", bossShieldActive ? "bg-blue-100" : "bg-red-50")}>
                <Flame className={cn("w-5 h-5 md:w-12 md:h-12", bossShieldActive ? "text-blue-600" : "text-red-600")} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col flex-1 justify-start">
                <h3 className={cn("font-black uppercase tracking-tight text-[8px] sm:text-[10px] md:text-lg leading-tight", bossShieldActive ? "text-blue-700" : "text-red-700")}>
                  Heavy Attack 
                  {bossShieldActive && <span className="block text-[6px] md:text-xs bg-blue-500 text-white px-1 md:px-2 py-0.5 rounded mt-1 md:mt-2 animate-pulse">BREAKS SHIELD</span>}
                </h3>
                <p className="text-[6.5px] sm:text-[8px] md:text-xs font-bold text-muted-foreground mt-1 md:mt-2 leading-[1.2] md:leading-relaxed">Attempt a hard difficulty question. If correct, it deals massive damage. If wrong, the player takes a heavy counter-attack.</p>
              </div>
            </button>
            
            {/* Normal Attack Card */}
            <button
              onClick={() => handleSelectMove('normal')}
              className={cn("border-2 transition-all p-2 sm:p-4 md:p-8 rounded-xl md:rounded-3xl flex flex-col items-center text-center space-y-2 md:space-y-6 group", 
                bossShieldActive ? "bg-muted/40 border-border opacity-60" : "bg-background border-primary/20 hover:border-primary hover:shadow-xl hover:shadow-primary/10"
              )}
            >
              <div className={cn("w-10 h-10 md:w-24 md:h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0", bossShieldActive ? "bg-muted" : "bg-primary/10")}>
                <Sword className={cn("w-5 h-5 md:w-12 md:h-12", bossShieldActive ? "text-muted-foreground" : "text-primary")} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col flex-1 justify-start">
                <h3 className={cn("font-black uppercase tracking-tight text-[8px] sm:text-[10px] md:text-lg leading-tight", bossShieldActive ? "text-muted-foreground" : "text-primary")}>
                  Normal Attack 
                  {bossShieldActive && <span className="block text-[6px] md:text-xs bg-slate-500 text-white px-1 md:px-2 py-0.5 rounded mt-1 md:mt-2">INEFFECTIVE</span>}
                </h3>
                <p className="text-[6.5px] sm:text-[8px] md:text-xs font-bold text-muted-foreground mt-1 md:mt-2 leading-[1.2] md:leading-relaxed">Answer a normal-difficulty question. Deals standard damage.</p>
              </div>
            </button>
            
            {/* Defend / Heal Card */}
            <button
              onClick={() => handleSelectMove('defend')}
              className={cn("border-2 hover:shadow-xl transition-all p-2 sm:p-4 md:p-8 rounded-xl md:rounded-3xl flex flex-col items-center text-center space-y-2 md:space-y-6 group", 
                playerPoisoned ? "bg-emerald-500/10 border-emerald-500 shadow-emerald-500/20 animate-pulse" : "bg-background border-emerald-500/30 hover:border-emerald-500 hover:shadow-emerald-500/10"
              )}
            >
              <div className="w-10 h-10 md:w-24 md:h-24 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <ShieldPlus className="w-5 h-5 md:w-12 md:h-12 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col flex-1 justify-start">
                <h3 className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight text-[8px] sm:text-[10px] md:text-lg leading-tight">
                  Defend / Heal 
                  {playerPoisoned && <span className="block text-[6px] md:text-xs bg-emerald-500 text-white px-1 md:px-2 py-0.5 rounded mt-1 md:mt-2">CURES POISON</span>}
                </h3>
                <p className="text-[6.5px] sm:text-[8px] md:text-xs font-bold text-muted-foreground mt-1 md:mt-2 leading-[1.2] md:leading-relaxed">Answer an easier question dealing no damage to the boss, but restoring the player's HP. Great for when they are close to dying.</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-6 mb-8">
            <h2 className="text-xl font-bold leading-snug font-headline text-foreground">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="px-6 space-y-3">
            {currentQuestion.type === 'SHORT_ANSWER' ? (
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
            ) : (
              currentQuestion.options.map((option, idx) => {
                const letter = optionLetters[idx];
                const isSelected = selectedAnswer === letter;
                const isEliminated = eliminatedOptionLetters.includes(letter);
                
                // Show correctness indicators
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
              })
            )}
          </div>

          {mode === 'learning' && isAnswered && (
            <div ref={nextActionRef} className="mx-6 mt-8 space-y-6">
              <div className="p-5 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="bg-primary/10 p-1.5 rounded-lg">
                     <Sparkles className="w-4 h-4 text-primary" />
                   </div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                     AI Tutor Logic Analysis
                   </p>
                 </div>
                 
                 {currentQuestion.explanation ? (
                   <p className="text-xs text-muted-foreground italic leading-relaxed">
                     {currentQuestion.explanation}
                   </p>
                 ) : isFetchingExplanation ? (
                   <div className="flex items-center gap-3 py-2">
                     <Loader2 className="w-3 h-3 text-primary animate-spin" />
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
                       className="text-xs text-primary border-primary hover:bg-primary hover:text-white"
                     >
                       <BrainCircuit className="w-3 h-3 mr-2" />
                       Ask AI Tutor
                     </Button>
                   </div>
                 )}
              </div>
              <div className="flex justify-end animate-in fade-in duration-500 delay-150 pb-6">
                <Button 
                  onClick={handleNext}
                  size="lg"
                  className="font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all rounded-xl border-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white px-8"
                >
                  {currentIndex < questions.length - 1 ? "Next Quest" : "Finish Quest"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
