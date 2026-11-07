"use client";

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConsumableItem {
  id: string;
  name: string;
  icon?: string;
  imageUrl?: string;
  color?: string;
  effect: string;
  desc: string;
  cost: number;
  baseCost: number;
  requiredLevel: number;
  requiredXp: number;
}

export interface QuestInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container?: HTMLElement | null;
  userXp: number;
  restockCountdown?: string;
  consumableItems: ConsumableItem[];
  maxReagentCap: number;
  inventory: Record<string, number>;
  equippedItem: string | null;
  setEquippedItem: (item: string | null) => void;
  selectedItemSlot: string | null;
  setSelectedItemSlot: (slot: string) => void;
  userLevel: number;
  quizMode: string;
  setPlayerShield: (shield: number) => void;
  onBuyReagent: (itemId: string, name: string, cost: number) => void;
}

export const QuestInventoryDialog: React.FC<QuestInventoryDialogProps> = ({
  open,
  onOpenChange,
  container,
  userXp,
  restockCountdown,
  consumableItems,
  maxReagentCap,
  inventory,
  equippedItem,
  setEquippedItem,
  selectedItemSlot,
  setSelectedItemSlot,
  userLevel,
  quizMode,
  setPlayerShield,
  onBuyReagent,
}) => {
  const activeSelectedItem =
    consumableItems.find((i) => i.id === selectedItemSlot) || consumableItems[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={container || undefined}
        className="w-[96vw] max-w-[420px] sm:max-w-[580px] md:max-w-[680px] lg:max-w-[740px] bg-transparent border-none p-0 text-white shadow-2xl z-[100] font-bytebounce flex items-center justify-center select-none [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Inventory</DialogTitle>

        {/* Parchment / Leather Frame Container - Sized generously for maximum readability */}
        <div className="relative w-full p-2.5 sm:p-4 md:p-5 lg:p-6 flex flex-col gap-2 sm:gap-2.5 md:gap-3.5 overflow-hidden rounded-xl bg-[#2b1408] border-2 border-[#5c2a1a] shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto no-scrollbar">
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
            onClick={() => onOpenChange(false)}
            aria-label="Close Inventory"
            className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-6 h-6 sm:w-7.5 sm:h-7.5 md:w-9 md:h-9 bg-[#3d1a16] text-[#e8b298] hover:bg-red-700 hover:text-white rounded-md border-2 border-[#693327] flex items-center justify-center font-bold text-xs sm:text-sm z-30 transition-colors active:scale-95 shadow-md cursor-pointer"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 stroke-[2.5]" />
          </button>

          {/* Top Header Section */}
          <div className="relative z-10 pt-0.5">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 pr-8 sm:pr-10 md:pr-12">
              {/* Left: Satchel Icon + INVENTORY Title */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3">
                <Image
                  src="/ui/Inventory_icon.png"
                  alt="Inventory Icon"
                  width={36}
                  height={36}
                  className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 object-contain shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                  unoptimized
                />
                <h2 className="font-bytebounce text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#3d1a16] tracking-wider leading-none drop-shadow-[2px_2px_0_#f4cfbd]">
                  INVENTORY
                </h2>
              </div>

              {/* Right: Available XP Pill */}
              <div className="relative h-6 sm:h-7.5 md:h-8.5 lg:h-9 px-2 sm:px-3 md:px-4 flex items-center justify-center shrink-0">
                <Image
                  src="/ui/Inventory_available_exp.png"
                  alt="Available EXP"
                  fill
                  className="object-fill"
                  style={{ imageRendering: 'pixelated' }}
                  unoptimized
                />
                <span className="relative z-10 font-bytebounce text-amber-300 text-[10px] sm:text-xs md:text-sm lg:text-base font-bold flex items-center gap-0.5 sm:gap-1 tracking-wider leading-none drop-shadow-[1px_1px_0_#000]">
                  ⚡ {userXp} XP
                </span>
              </div>
            </div>

            {/* Top Divider */}
            <div className="w-full h-[2px] sm:h-[2.5px] bg-[#3d1a16] mt-1 sm:mt-1.5 md:mt-2 opacity-90" />
          </div>

          {/* Top Weekly Supply Banner */}
          <div className="relative z-10 w-full h-6 sm:h-7.5 md:h-9 px-2 sm:px-3 md:px-4 flex items-center justify-between shrink-0">
            <Image
              src="/ui/Inventory_weekly_bg.png"
              alt="Weekly Supply Banner"
              fill
              className="object-fill"
              style={{ imageRendering: 'pixelated' }}
              unoptimized
            />
            <div className="relative z-10 flex items-center justify-between w-full text-white font-bytebounce text-[9.5px] sm:text-xs md:text-sm lg:text-[15px] px-1 leading-none">
              <span className="text-amber-100 flex items-center gap-1 sm:gap-1.5 tracking-wide truncate mr-1.5 sm:mr-2">
                Weekly Drop:{' '}
                <span className="text-emerald-400 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] whitespace-nowrap">
                  +1 Free Charge
                </span>
              </span>
              <span className="text-amber-300 font-mono text-[8.5px] sm:text-[10px] md:text-xs tracking-wider shrink-0">
                Restock:{' '}
                <span className="text-amber-100 font-bold font-mono">
                  {restockCountdown || 'Calculating...'}
                </span>
              </span>
            </div>
          </div>

          {/* 6x3 Inventory Slot Grid (18 Slots) */}
          <div className="relative z-10">
            <div className="grid grid-cols-6 gap-1 sm:gap-2 md:gap-2.5 lg:gap-3">
              {/* Consumable Item Slots */}
              {consumableItems.map((item) => {
                const count = inventory[item.id] || 0;
                const isEquipped = equippedItem === item.id;
                const isSelected = selectedItemSlot === item.id;
                const isLocked = userLevel < item.requiredLevel;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemSlot(item.id)}
                    className={cn(
                      "relative aspect-square flex items-center justify-center transition-all duration-150 active:scale-95 group cursor-pointer",
                      isSelected ? "scale-105 z-30" : "hover:scale-102",
                      isLocked && "opacity-80 grayscale-[25%]"
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
                    {item.imageUrl ? (
                      <div
                        className={cn(
                          "relative z-20 w-[64%] h-[64%] max-w-[30px] max-h-[30px] sm:max-w-[38px] sm:max-h-[38px] md:max-w-[44px] md:max-h-[44px] flex items-center justify-center transition-all duration-150",
                          isSelected && "scale-115 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                        )}
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] pointer-events-none"
                          style={{ imageRendering: 'pixelated' }}
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "relative z-20 text-lg sm:text-2xl md:text-3xl lg:text-4xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] transition-transform",
                          isSelected && "scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                        )}
                      >
                        {item.icon}
                      </span>
                    )}

                    {/* Stack Count Badge */}
                    <span className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1.5 z-30 font-bytebounce text-[9px] sm:text-xs md:text-sm font-bold text-amber-200 [text-shadow:1px_1px_0_#000] leading-none">
                      {count}/{maxReagentCap}
                    </span>

                    {/* Equipped Badge */}
                    {isEquipped && (
                      <span className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 z-30 bg-emerald-500 text-black text-[6.5px] sm:text-[8px] md:text-[9.5px] font-black uppercase px-1 py-0.5 rounded border border-black animate-pulse leading-none shadow">
                        EQ
                      </span>
                    )}

                    {/* Level Lock Badge */}
                    {isLocked && (
                      <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 z-30 bg-black/85 text-amber-300 text-[6.5px] sm:text-[7.5px] md:text-[9px] font-black uppercase px-1 py-0.5 rounded border border-amber-500/70 leading-none shadow flex items-center gap-0.5">
                        🔒L{item.requiredLevel}
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
                        <div className="absolute -top-2 sm:-top-2.5 md:-top-3.5 left-1/2 -translate-x-1/2 z-40 text-yellow-300 text-[8px] sm:text-[10px] md:text-xs animate-bounce leading-none drop-shadow-[0_0_6px_#f59e0b] select-none pointer-events-none font-sans font-bold">
                          ▼
                        </div>
                      </>
                    )}
                  </button>
                );
              })}

              {/* Dynamic Empty Slots to keep 18-grid format (6x3) */}
              {Array.from({ length: Math.max(0, 18 - consumableItems.length) }).map((_, idx) => (
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
                  <span className="relative z-10 text-amber-900/40 text-[9px] sm:text-xs md:text-sm font-mono font-bold select-none">
                    +
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Divider */}
          <div className="relative z-10 w-full h-[2px] sm:h-[2.5px] bg-[#3d1a16] opacity-90" />

          {/* Bottom Selected Item / Shop Action Panel */}
          <div className="relative z-10 w-full min-h-[68px] sm:min-h-[82px] md:min-h-[96px] p-2 sm:p-2.5 md:p-3.5 flex items-center shrink-0 rounded-lg">
            <Image
              src="/ui/Inventory_shop_bg.png"
              alt="Inventory Shop Panel"
              fill
              className="object-fill"
              style={{ imageRendering: 'pixelated' }}
              unoptimized
            />
            {activeSelectedItem ? (
              (() => {
                const isSelectedLocked = userLevel < activeSelectedItem.requiredLevel;

                return (
                  <div className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-3 md:gap-4 w-full">
                    {/* Left details */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 min-w-0 flex-1">
                      {activeSelectedItem.imageUrl ? (
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                          <Image
                            src={activeSelectedItem.imageUrl}
                            alt={activeSelectedItem.name}
                            fill
                            className="object-contain"
                            style={{ imageRendering: 'pixelated' }}
                            unoptimized
                          />
                        </div>
                      ) : (
                        <span className="text-xl sm:text-2xl md:text-3xl shrink-0 drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]">
                          {activeSelectedItem.icon}
                        </span>
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
                          <h4 className="font-bold text-amber-300 font-bytebounce text-xs sm:text-sm md:text-base lg:text-lg tracking-wide leading-tight drop-shadow-[1px_1px_0_#000] truncate">
                            {activeSelectedItem.name}
                          </h4>
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 font-bytebounce text-[9.5px] sm:text-[11px] md:text-xs lg:text-[12.5px] bg-[#140b07] px-1.5 sm:px-2 py-0.5 rounded border border-amber-500/80 shadow-[0_1px_3px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] leading-none shrink-0 select-none">
                            <span className="text-amber-300 font-bold uppercase tracking-wider [text-shadow:1px_1px_0_#000]">
                              Stock:
                            </span>
                            <span className="text-white font-bold [text-shadow:1px_1px_0_#000]">
                              {inventory[activeSelectedItem.id] || 0}/{maxReagentCap}
                            </span>
                          </span>
                          {equippedItem === activeSelectedItem.id && (
                            <span className="inline-flex items-center font-bytebounce text-[9px] sm:text-[10.5px] md:text-xs uppercase tracking-wide bg-emerald-500 text-black px-1.5 sm:px-2 py-0.5 rounded border border-black leading-none animate-pulse shadow-sm font-bold shrink-0 select-none">
                              EQUIPPED
                            </span>
                          )}
                          {isSelectedLocked && (
                            <span className="inline-flex items-center font-bytebounce text-[9px] sm:text-[10.5px] md:text-xs uppercase tracking-wide bg-amber-950 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded border border-amber-500/80 leading-none shadow-sm font-bold shrink-0 select-none">
                              🔒 LVL {activeSelectedItem.requiredLevel} ({activeSelectedItem.requiredXp} XP)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs md:text-[13px] text-amber-100 font-sans leading-tight sm:leading-snug drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          {activeSelectedItem.desc}
                        </p>
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex flex-col gap-1 sm:gap-1.5 shrink-0">
                      {isSelectedLocked ? (
                        <Button
                          size="sm"
                          disabled
                          className="bg-zinc-800 text-amber-300/60 font-bytebounce text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider h-6 sm:h-7.5 md:h-8.5 px-2 sm:px-3 border border-zinc-700 opacity-60 shadow-none leading-none rounded cursor-not-allowed whitespace-nowrap"
                        >
                          <span className="sm:hidden">🔒 Lvl {activeSelectedItem.requiredLevel}</span>
                          <span className="hidden sm:inline">
                            🔒 Locked (Lvl {activeSelectedItem.requiredLevel})
                          </span>
                        </Button>
                      ) : equippedItem === activeSelectedItem.id ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setEquippedItem(null);
                            setPlayerShield(0);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bytebounce text-[10.5px] sm:text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider h-6 sm:h-7.5 md:h-8.5 px-2 sm:px-3 md:px-4 border border-red-400 shadow-md whitespace-nowrap active:scale-95 leading-none rounded cursor-pointer"
                        >
                          Unequip
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={(inventory[activeSelectedItem.id] || 0) <= 0}
                          onClick={() => {
                            setEquippedItem(activeSelectedItem.id);
                            if (activeSelectedItem.id === 'erlenmeyer_shield' && quizMode === 'boss-battle') {
                              setPlayerShield(20);
                            }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bytebounce text-[10.5px] sm:text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider h-6 sm:h-7.5 md:h-8.5 px-2 sm:px-3 md:px-4 border border-emerald-300 disabled:opacity-30 shadow-md whitespace-nowrap active:scale-95 leading-none rounded cursor-pointer"
                        >
                          Equip
                        </Button>
                      )}

                      <Button
                        size="sm"
                        disabled={isSelectedLocked || (inventory[activeSelectedItem.id] || 0) >= maxReagentCap}
                        onClick={() =>
                          onBuyReagent(
                            activeSelectedItem.id,
                            activeSelectedItem.name,
                            activeSelectedItem.cost
                          )
                        }
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bytebounce text-[10.5px] sm:text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider h-6 sm:h-7.5 md:h-8.5 px-2 sm:px-3 md:px-4 border border-amber-300 shadow-md flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap disabled:opacity-40 active:scale-95 leading-none rounded cursor-pointer"
                      >
                        {isSelectedLocked ? (
                          <>
                            <span className="sm:hidden">🔒 Lvl {activeSelectedItem.requiredLevel}</span>
                            <span className="hidden sm:inline">
                              🔒 Req. Lvl {activeSelectedItem.requiredLevel} ({activeSelectedItem.requiredXp} XP)
                            </span>
                          </>
                        ) : (inventory[activeSelectedItem.id] || 0) >= maxReagentCap ? (
                          `MAX (${maxReagentCap}/${maxReagentCap})`
                        ) : (
                          `Buy +1 (⚡${activeSelectedItem.cost})`
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
