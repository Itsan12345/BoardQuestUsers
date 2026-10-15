"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X, Lock } from 'lucide-react';

export interface ChapterNode {
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
}

export interface ChapterWorldMapProps {
  selectedSubject: string;
  subjectNodes: ChapterNode[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onLaunchExpedition: (nodeId: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD') => void;
  onClose: () => void;
  nodeStars: Record<string, number>;
  nodeClears?: Record<string, { EASY?: boolean; MEDIUM?: boolean; HARD?: boolean }>;
}

export const ChapterWorldMap: React.FC<ChapterWorldMapProps> = ({
  selectedSubject,
  subjectNodes,
  selectedNodeId,
  onSelectNode,
  onLaunchExpedition,
  onClose,
  nodeStars,
  nodeClears = {},
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  // Helper to check if a node is unlocked based on previous node completion
  const isNodeUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    const prevNodeId = subjectNodes[index - 1]?.id;
    if (!prevNodeId) return false;

    const clears = nodeClears[prevNodeId];
    if (clears) {
      return !!(clears.EASY && clears.MEDIUM && clears.HARD);
    }
    return (nodeStars[prevNodeId] || 0) >= 3;
  };

  // Helper to check if a specific difficulty is unlocked for a node:
  // - EASY is always unlocked if the node is unlocked
  // - MEDIUM requires EASY clear
  // - HARD requires MEDIUM clear
  const isDifficultyUnlocked = (nodeId: string, diff: 'EASY' | 'MEDIUM' | 'HARD'): boolean => {
    const clears = nodeClears[nodeId] || {};
    if (diff === 'EASY') return true;
    if (diff === 'MEDIUM') return !!clears.EASY;
    if (diff === 'HARD') return !!(clears.EASY && clears.MEDIUM);
    return false;
  };

  const selectedNode = subjectNodes.find(n => n.id === selectedNodeId) || subjectNodes[0];
  const selectedNodeIndex = subjectNodes.findIndex(n => n.id === selectedNode.id);
  const isSelectedUnlocked = isNodeUnlocked(selectedNodeIndex);
  const selectedNodeClears = isSelectedUnlocked ? (nodeClears[selectedNode.id] || {}) : {};
  const currentStars = isSelectedUnlocked
    ? ((selectedNodeClears.EASY ? 1 : 0) + (selectedNodeClears.EASY && selectedNodeClears.MEDIUM ? 1 : 0) + (selectedNodeClears.EASY && selectedNodeClears.MEDIUM && selectedNodeClears.HARD ? 1 : 0) || 0)
    : 0;

  // Auto-select the next un-cleared unlocked difficulty when selected node changes
  React.useEffect(() => {
    const clears = nodeClears[selectedNode.id] || {};
    if (!clears.EASY) {
      setSelectedDifficulty('EASY');
    } else if (!clears.MEDIUM) {
      setSelectedDifficulty('MEDIUM');
    } else {
      setSelectedDifficulty('HARD');
    }
  }, [selectedNode.id, nodeClears]);

  const isCurrentDiffUnlocked = isDifficultyUnlocked(selectedNode.id, selectedDifficulty);

  return (
    <div className="w-full h-full h-screen max-h-screen bg-[#160d08] text-white p-2.5 sm:p-5 md:p-6 font-bytebounce relative animate-in fade-in duration-200 overflow-hidden flex flex-col justify-between gap-2 sm:gap-4">

      {/* Top Parchment Header Bar */}
      <div className="flex items-center justify-between border-b-2 sm:border-b-4 border-[#4a2e16] pb-1.5 sm:pb-3 shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm min-[360px]:text-base sm:text-2xl md:text-3xl lg:text-4xl text-amber-400 tracking-wider leading-tight truncate drop-shadow-[2px_2px_0_#000]">
            {selectedSubject} Overworld Trail
          </h2>
          <p className="text-[8.5px] min-[360px]:text-[10px] sm:text-xs md:text-sm text-amber-200/80 font-sans mt-0.5 leading-tight truncate sm:whitespace-normal">
            Defeat Easy ➔ Medium ➔ Hard to unlock the next encounter along the path!
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Badge variant="outline" className="hidden sm:inline-flex bg-amber-500/20 text-amber-300 border-amber-500/50 text-[10px] sm:text-sm px-3 py-1 uppercase font-mono shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            ⭐ PROGRESSION MODE
          </Badge>
          <button
            onClick={onClose}
            aria-label="Close World Map"
            className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 sm:w-10 sm:h-10 rounded-full bg-[#4a2e16] border-2 border-amber-400 text-amber-200 flex items-center justify-center text-sm sm:text-xl font-bold hover:bg-red-600 hover:text-white transition-colors shadow-lg shrink-0 active:scale-95"
          >
            <X className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* 16-Bit Gamified Overworld Map Canvas - Expanded on Mobile to Fill Gaps, 2.38/1 on Web */}
      <div className="relative w-full flex-1 min-h-0 sm:flex-none sm:aspect-[2.38/1] sm:min-h-[220px] sm:max-h-[58vh] bg-[#23170c] border-3 sm:border-6 border-[#4a2e16] rounded-xl sm:rounded-3xl shadow-2xl flex flex-col justify-center overflow-hidden my-1 sm:my-auto shrink-0">

        {/* Pixel-Art World Map Landscape Background - Covers Full Height on Mobile, Full Width Aspect Ratio on Web */}
        {(() => {
          const s = selectedSubject.toLowerCase();
          const mapSrc = (s.includes('immuno') || s.includes('serolog'))
            ? '/ui/ImmunoHematology_worldmap.png'
            : s.includes('chem')
              ? '/ui/ClinicalChem_worldmap.png'
              : (s.includes('microscop') || s.includes('parasit'))
                ? '/ui/ClinicalMicroscopy_worldmap.png'
                : (s.includes('histo') || s.includes('patholog'))
                  ? '/ui/Histopathology_worldmap.png'
                  : s.includes('microb')
                    ? '/ui/Microbiology_worldmap.png'
                    : s.includes('hema')
                      ? '/ui/Hematology_worldmap.png'
                      : null;

          if (mapSrc) {
            return (
              <Image
                src={mapSrc}
                alt={`${selectedSubject} World Map`}
                fill
                className="object-cover sm:object-fill object-center"
                style={{ imageRendering: 'pixelated' }}
                priority
                sizes="(max-width: 768px) 100vw, 1400px"
              />
            );
          }

          return (
            <>
              {/* Thematic Grid Texture for other subjects */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#3e2b19] via-[#24170d] to-[#120a05] opacity-90" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#3a2514_1px,transparent_1px),linear-gradient(to_bottom,#3a2514_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:24px_24px] opacity-25" />
            </>
          );
        })()}

        {/* Subtle Ambient Overlay */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />

        {/* SVG Connecting Diagonal Trail */}
        {(() => {
          const s = selectedSubject.toLowerCase();
          const isMicroscopy = s.includes('microscop') || s.includes('parasit');
          const isImmuno = s.includes('immuno') || s.includes('serolog');
          const isHisto = s.includes('histo') || s.includes('patholog');
          const isChem = s.includes('chem');
          const isMicrobio = s.includes('microb') && !isMicroscopy;
          const isHema = s.includes('hema') && !isImmuno;

          const trailColor = isChem ? "#f472b6" : isImmuno ? "#38bdf8" : isHisto ? "#10b981" : isMicrobio ? "#a3e635" : isHema ? "#ef4444" : isMicroscopy ? "#f59e0b" : "#ffd700";
          const trailBorder = isChem ? "#831843" : isImmuno ? "#0f172a" : isHisto ? "#064e3b" : isMicrobio ? "#365314" : isHema ? "#7f1d1d" : isMicroscopy ? "#78350f" : "#b8860b";
          const trailShadow = isChem ? "#500724" : isImmuno ? "#020617" : isHisto ? "#022c22" : isMicrobio ? "#1a2e05" : isHema ? "#450a0a" : isMicroscopy ? "#451a03" : "#804d00";

          return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Shadow Path */}
              <path
                d="M 0 84 L 10 82 L 36 73 L 64 69 L 88 76 L 100 76"
                fill="none"
                stroke={trailShadow}
                strokeWidth="5"
                strokeLinecap="square"
              />
              {/* Border Path */}
              <path
                d="M 0 84 L 10 82 L 36 73 L 64 69 L 88 76 L 100 76"
                fill="none"
                stroke={trailBorder}
                strokeWidth="3.5"
                strokeLinecap="square"
              />
              {/* Main Glowing Trail */}
              <path
                d="M 0 84 L 10 82 L 36 73 L 64 69 L 88 76 L 100 76"
                fill="none"
                stroke={trailColor}
                strokeWidth="2.2"
                strokeLinecap="square"
              />
            </svg>
          );
        })()}

        {/* Diagonal Gamified Nodes */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {subjectNodes.map((node, index) => {
            const unlocked = isNodeUnlocked(index);
            const clears = unlocked ? (nodeClears[node.id] || {}) : {};
            const stars = unlocked
              ? ((clears.EASY ? 1 : 0) + (clears.EASY && clears.MEDIUM ? 1 : 0) + (clears.EASY && clears.MEDIUM && clears.HARD ? 1 : 0) || 0)
              : 0;
            const isSelected = selectedNodeId === node.id;
            const isBossNode = index === subjectNodes.length - 1;
            const s = selectedSubject.toLowerCase();
            const isMicroscopy = s.includes('microscop') || s.includes('parasit');
            const isImmuno = s.includes('immuno') || s.includes('serolog');
            const isHisto = s.includes('histo') || s.includes('patholog');
            const isChem = s.includes('chem');
            const isMicrobio = s.includes('microb') && !isMicroscopy;
            const isHema = s.includes('hema') && !isImmuno;

            // Responsive Diagonal Positions placed down on the meadow ground (4-Stage Layout)
            const nodeCoords = [
              { left: '10%', top: '82%' },
              { left: '36%', top: '73%' },
              { left: '64%', top: '69%' },
              { left: '88%', top: '76%' },
            ][index] || { left: `${(index + 1) * 20}%`, top: '75%' };

            return (
              <div
                key={node.id}
                style={{ left: nodeCoords.left, top: nodeCoords.top }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group pointer-events-auto z-30"
                onClick={() => onSelectNode(node.id)}
              >
                {/* Floating Star Badges above Node */}
                <div className={cn(
                  "flex items-center gap-0.5 bg-black/85 px-1 min-[360px]:px-1.5 py-0.5 rounded-full shadow-lg mb-0.5 sm:mb-1 border",
                  isChem
                    ? "border-pink-500/60"
                    : isImmuno
                      ? "border-cyan-500/60"
                      : isHisto
                        ? "border-emerald-500/60"
                        : isMicrobio
                          ? "border-lime-500/60"
                          : isHema
                            ? "border-red-500/60"
                            : isMicroscopy
                              ? "border-amber-600/60"
                              : "border-amber-500/50"
                )}>
                  {[1, 2, 3].map((s) => (
                    <span
                      key={s}
                      className={cn(
                        "text-[8px] min-[360px]:text-[9px] sm:text-xs leading-none",
                        s <= stars
                          ? isChem
                            ? "text-pink-300 drop-shadow-[0_0_4px_rgba(244,114,182,0.9)]"
                            : isImmuno
                              ? "text-cyan-300 drop-shadow-[0_0_4px_rgba(56,189,248,0.9)]"
                              : isHisto
                                ? "text-emerald-300 drop-shadow-[0_0_4px_rgba(16,185,129,0.9)]"
                                : isMicrobio
                                  ? "text-lime-300 drop-shadow-[0_0_4px_rgba(163,230,53,0.9)]"
                                  : isHema
                                    ? "text-red-400 drop-shadow-[0_0_4px_rgba(239,68,68,0.9)]"
                                    : "text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.9)]"
                          : "text-slate-600 opacity-40"
                      )}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Chunky Pixelated Square RPG Node Box */}
                <div
                  className={cn(
                    "aspect-square w-7.5 min-[360px]:w-8.5 min-[400px]:w-10 sm:w-13 md:w-14 rounded-sm flex items-center justify-center font-bytebounce transition-all duration-200 shadow-xl active:scale-95 relative cursor-pointer",
                    !unlocked
                      ? "bg-[#1a120c]/90 border-2 border-slate-700 text-slate-500 shadow-[0_3px_0_0_#0d0805]"
                      : isChem
                        ? isSelected
                          ? "bg-[#f472b6] border-2 border-[#831843] text-[#500724] shadow-[0_3px_0_0_#700a2a,0_0_16px_rgba(244,114,182,0.85)] ring-1.5 ring-pink-200"
                          : "bg-[#db2777] border-2 border-[#831843] text-[#fff1f2] shadow-[0_3px_0_0_#700a2a,0_0_10px_rgba(219,39,119,0.4)] hover:brightness-110"
                        : isImmuno
                          ? isSelected
                            ? "bg-[#38bdf8] border-2 border-[#0f172a] text-[#082f49] shadow-[0_3px_0_0_#075985,0_0_16px_rgba(56,189,248,0.85)] ring-1.5 ring-cyan-200"
                            : "bg-[#0284c7] border-2 border-[#0f172a] text-[#f0f9ff] shadow-[0_3px_0_0_#075985,0_0_10px_rgba(2,132,199,0.4)] hover:brightness-110"
                          : isHisto
                            ? isSelected
                              ? "bg-[#34d399] border-2 border-[#064e3b] text-[#022c22] shadow-[0_3px_0_0_#022c22,0_0_16px_rgba(52,211,153,0.85)] ring-1.5 ring-emerald-200"
                              : "bg-[#059669] border-2 border-[#064e3b] text-[#ecfdf5] shadow-[0_3px_0_0_#022c22,0_0_10px_rgba(5,150,105,0.4)] hover:brightness-110"
                            : isMicrobio
                              ? isSelected
                                ? "bg-[#a3e635] border-2 border-[#365314] text-[#14532d] shadow-[0_3px_0_0_#1a2e05,0_0_16px_rgba(163,230,53,0.85)] ring-1.5 ring-lime-200"
                                : "bg-[#65a30d] border-2 border-[#365314] text-[#f7fee7] shadow-[0_3px_0_0_#1a2e05,0_0_10px_rgba(163,230,53,0.45)] hover:brightness-110"
                              : isHema
                                ? isSelected
                                  ? "bg-[#f87171] border-2 border-[#7f1d1d] text-[#450a0a] shadow-[0_3px_0_0_#450a0a,0_0_16px_rgba(248,113,113,0.85)] ring-1.5 ring-red-200"
                                  : "bg-[#dc2626] border-2 border-[#7f1d1d] text-[#fef2f2] shadow-[0_3px_0_0_#450a0a,0_0_10px_rgba(239,68,68,0.45)] hover:brightness-110"
                                : isMicroscopy
                                  ? isSelected
                                    ? "bg-[#fbbf24] border-2 border-[#78350f] text-[#3d1a04] shadow-[0_3px_0_0_#5c2408,0_0_15px_rgba(251,191,36,0.75)] ring-1.5 ring-amber-200"
                                    : "bg-[#d97706] border-2 border-[#78350f] text-[#3d1a04] shadow-[0_3px_0_0_#5c2408,0_0_10px_rgba(217,119,6,0.4)] hover:brightness-110"
                                  : isSelected
                                    ? "bg-[#ffe066] border-2 border-[#b87a00] text-[#7a3b00] shadow-[0_3px_0_0_#804d00,0_0_15px_rgba(255,215,0,0.7)] ring-1.5 ring-white/90"
                                    : "bg-[#ffd700] border-2 border-[#b8860b] text-[#7a3b00] shadow-[0_3px_0_0_#804d00,0_0_8px_rgba(255,215,0,0.3)] hover:brightness-110"
                  )}
                >
                  {!unlocked ? (
                    <Lock className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 sm:w-4.5 sm:h-4.5 text-slate-400" />
                  ) : (
                    <span className="text-base min-[360px]:text-lg sm:text-2xl md:text-3xl font-black leading-none drop-shadow-[1px_1px_0_#fff]">
                      {node.nodeNumber}
                    </span>
                  )}

                  {isBossNode && unlocked && (
                    <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 sm:w-4 sm:h-4 bg-red-600 rounded-full border border-yellow-300 flex items-center justify-center text-[6px] min-[360px]:text-[7px] sm:text-[8px] shadow-md animate-pulse">
                      👑
                    </div>
                  )}
                </div>

                {/* Bottom Node Stage Label */}
                {(() => {
                  const stageLabel = node.tier === 'minion' || index === 0
                    ? 'Minion'
                    : node.tier === 'mini-boss' || index === 1
                      ? 'Mini-Boss'
                      : node.tier === 'boss' || index === 2
                        ? 'Boss'
                        : 'Final Boss';

                  return (
                    <p
                      className={cn(
                        "text-[7px] min-[360px]:text-[8px] sm:text-xs font-mono font-bold mt-0.5 sm:mt-1 text-center bg-black/70 px-1 min-[360px]:px-1.5 py-0.5 rounded border transition-colors shadow whitespace-nowrap",
                        isSelected
                          ? isChem
                            ? "text-pink-300 border-pink-400/60"
                            : isImmuno
                              ? "text-cyan-300 border-cyan-400/60"
                              : isHisto
                                ? "text-emerald-300 border-emerald-400/60"
                                : isMicrobio
                                  ? "text-lime-300 border-lime-400/60"
                                  : isHema
                                    ? "text-red-300 border-red-400/60"
                                    : "text-amber-300 border-amber-400/60"
                          : unlocked
                            ? isChem
                              ? "text-pink-100/90 border-white/10"
                              : isImmuno
                                ? "text-cyan-100/90 border-white/10"
                                : isHisto
                                  ? "text-emerald-100/90 border-white/10"
                                  : isMicrobio
                                    ? "text-lime-100/90 border-white/10"
                                    : isHema
                                      ? "text-red-100/90 border-white/10"
                                      : "text-amber-100/90 border-white/10"
                            : "text-slate-500 border-white/10"
                      )}
                    >
                      {node.nodeNumber}. {stageLabel}
                    </p>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Node Inspector Banner */}
      {selectedNode && (
        <div className="bg-[#24170d] border-2 sm:border-4 border-[#4a2e16] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4 shrink-0 relative overflow-hidden">

          {/* Left Details Panel */}
          <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {(() => {
                const stageName = selectedNode.tier === 'minion' || selectedNode.nodeNumber === 1
                  ? 'MINION'
                  : selectedNode.tier === 'mini-boss' || selectedNode.nodeNumber === 2
                    ? 'MINI-BOSS'
                    : selectedNode.tier === 'boss' || selectedNode.nodeNumber === 3
                      ? 'CHAPTER BOSS'
                      : 'FINAL BOSS';
                return (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[8px] min-[360px]:text-[9px] sm:text-xs font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5",
                      isSelectedUnlocked ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-red-950/40 text-red-400 border-red-800/40"
                    )}
                  >
                    {isSelectedUnlocked ? `STAGE #${selectedNode.nodeNumber} (${stageName}) UNLOCKED` : `🔒 STAGE #${selectedNode.nodeNumber} (${stageName}) LOCKED`}
                  </Badge>
                );
              })()}
              <h3 className="text-xs min-[360px]:text-sm sm:text-lg md:text-xl font-bold text-amber-400 tracking-wider leading-tight truncate">{selectedNode.title}</h3>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map((s) => (
                  <span key={s} className={cn("text-[9px] sm:text-sm", s <= currentStars ? "text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" : "text-slate-600 opacity-40")}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs text-amber-100/90 font-sans leading-snug line-clamp-1 sm:line-clamp-none">{selectedNode.subtopic}</p>

            <div className="flex items-center gap-1 sm:gap-2 text-[7.5px] min-[360px]:text-[8.5px] sm:text-xs text-amber-300 font-mono pt-0.5 overflow-x-auto no-scrollbar whitespace-nowrap">
              <span className={cn(
                "px-2 sm:px-2.5 py-0.5 rounded-md border font-bold shrink-0 flex items-center gap-1.5 shadow-sm",
                selectedNode.tier === 'final-boss' || selectedNode.nodeNumber === 4
                  ? "bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-red-500/25 border-amber-400/50 text-amber-300 animate-pulse"
                  : selectedNode.tier === 'boss' || selectedNode.nodeNumber === 3
                    ? "bg-red-950/40 border-red-500/40 text-red-300"
                    : selectedNode.tier === 'mini-boss' || selectedNode.nodeNumber === 2
                      ? "bg-orange-950/40 border-orange-500/40 text-orange-300"
                      : "bg-amber-950/40 border-amber-500/40 text-amber-300"
              )}>
                {selectedNode.bossIcon || (selectedNode.nodeNumber === 4 ? '👑' : selectedNode.nodeNumber === 3 ? '⚔️' : selectedNode.nodeNumber === 2 ? '👹' : '👾')} {selectedNode.bossName}
                <span className="text-[7.5px] sm:text-[9px] uppercase tracking-wider bg-amber-400 text-black px-1.5 py-0.2 rounded font-black">
                  {selectedNode.tier === 'final-boss' || selectedNode.nodeNumber === 4
                    ? 'SOLO FINAL BOSS'
                    : selectedNode.tier === 'boss' || selectedNode.nodeNumber === 3
                      ? 'CHAPTER BOSS'
                      : selectedNode.tier === 'mini-boss' || selectedNode.nodeNumber === 2
                        ? 'MINI-BOSS'
                        : 'MINION'}
                </span>
              </span>
            </div>
          </div>

          {/* Difficulty Selector & Launch Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto relative z-10">
            {isSelectedUnlocked && (
              <div className="flex items-center bg-black/60 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-amber-500/30 w-full sm:w-auto justify-stretch sm:justify-center gap-1">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => {
                  const isDiffUnlocked = isDifficultyUnlocked(selectedNode.id, diff);
                  const isCleared = isDiffUnlocked && !!selectedNodeClears[diff];
                  return (
                    <button
                      key={diff}
                      disabled={!isDiffUnlocked}
                      onClick={() => isDiffUnlocked && setSelectedDifficulty(diff)}
                      className={cn(
                        "flex-1 sm:flex-none px-2 sm:px-2.5 py-1 text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs font-mono rounded-md sm:rounded-lg transition-all uppercase font-bold text-center flex items-center justify-center gap-1",
                        !isDiffUnlocked
                          ? "bg-black/40 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50"
                          : selectedDifficulty === diff
                            ? diff === 'EASY' ? "bg-emerald-500 text-black shadow-md ring-1 ring-emerald-300" : diff === 'HARD' ? "bg-red-500 text-white shadow-md ring-1 ring-red-300" : "bg-amber-500 text-black shadow-md ring-1 ring-amber-300"
                            : isCleared
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60"
                              : "text-slate-300 hover:text-white"
                      )}
                    >
                      {!isDiffUnlocked && <Lock className="w-2.5 h-2.5 text-slate-500 shrink-0" />}
                      <span>{diff}</span>
                      {isCleared && <span className="text-emerald-400 font-black">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              size="lg"
              disabled={!isSelectedUnlocked || !isCurrentDiffUnlocked}
              onClick={() => isSelectedUnlocked && isCurrentDiffUnlocked && onLaunchExpedition(selectedNode.id, selectedDifficulty)}
              className={cn(
                "w-full sm:w-auto font-bytebounce text-[11px] min-[360px]:text-xs sm:text-sm uppercase tracking-wider h-8 min-[360px]:h-9 sm:h-11 px-3 sm:px-5 border-2 shrink-0 active:scale-95 transition-transform flex items-center justify-center",
                isSelectedUnlocked && isCurrentDiffUnlocked
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black border-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                  : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-70"
              )}
            >
              {!isSelectedUnlocked
                ? `🔒 LOCKED (Clear Stage ${selectedNode.nodeNumber - 1} First)`
                : !isCurrentDiffUnlocked
                  ? `🔒 ${selectedDifficulty} LOCKED`
                  : `LAUNCH ${selectedDifficulty} EXPEDITION ⚔️`}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChapterWorldMap;
