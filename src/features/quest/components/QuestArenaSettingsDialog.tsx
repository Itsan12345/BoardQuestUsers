"use client";

import React from 'react';
import {
  Settings,
  Swords,
  Volume2,
  Music,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface QuestArenaSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container?: HTMLElement | null;
  arenaSettingsTab: 'character' | 'audio';
  setArenaSettingsTab: (tab: 'character' | 'audio') => void;
  renameInput: string;
  setRenameInput: (val: string) => void;
  renameGender: 'male' | 'female';
  setRenameGender: (val: 'male' | 'female') => void;
  sfxVolume: number[];
  setSfxVolume: (val: number[]) => void;
  bgmVolume: number[];
  setBgmVolume: (val: number[]) => void;
  setAudioBgmVolume: (vol: number) => void;
  ambientMusic: boolean;
  setAmbientMusic: (val: boolean) => void;
  setAudioAmbientMusicEnabled: (enabled: boolean) => void;
  floatingDamageText: boolean;
  setFloatingDamageText: (val: boolean) => void;
  hitScreenFlash: boolean;
  setHitScreenFlash: (val: boolean) => void;
  isSavingSettings: boolean;
  onSave: (e?: React.FormEvent) => void;
}

export const QuestArenaSettingsDialog: React.FC<QuestArenaSettingsDialogProps> = ({
  open,
  onOpenChange,
  container,
  arenaSettingsTab,
  setArenaSettingsTab,
  renameInput,
  setRenameInput,
  renameGender,
  setRenameGender,
  sfxVolume,
  setSfxVolume,
  bgmVolume,
  setBgmVolume,
  setAudioBgmVolume,
  ambientMusic,
  setAmbientMusic,
  setAudioAmbientMusicEnabled,
  floatingDamageText,
  setFloatingDamageText,
  hitScreenFlash,
  setHitScreenFlash,
  isSavingSettings,
  onSave,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={container || undefined}
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

        <form onSubmit={onSave} className="space-y-4 pt-2">
          <Tabs
            value={arenaSettingsTab}
            onValueChange={(val) => setArenaSettingsTab(val as 'character' | 'audio')}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 bg-muted/60 p-1 rounded-2xl border border-border/60 h-11">
              <TabsTrigger
                value="character"
                className="rounded-xl font-bold text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Swords className="w-3.5 h-3.5" />
                Character
              </TabsTrigger>
              <TabsTrigger
                value="audio"
                className="rounded-xl font-bold text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
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
                  {/* Male Avatar Button */}
                  <button
                    type="button"
                    onClick={() => setRenameGender('male')}
                    className={cn(
                      "p-0 rounded-2xl border-2 flex flex-col items-center justify-end h-[140px] sm:h-[160px] transition-all duration-300 cursor-pointer relative group text-left overflow-hidden",
                      renameGender === 'male'
                        ? "border-blue-500 bg-gradient-to-t from-blue-500/20 via-blue-500/5 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-2 ring-blue-500/40"
                        : "border-border/60 bg-muted/15 hover:border-blue-400/50 hover:bg-muted/25"
                    )}
                  >
                    {/* Gender Emoji Badge */}
                    <div
                      className={cn(
                        "absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20 shadow-xs",
                        renameGender === 'male'
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-blue-300/50 scale-105"
                          : "bg-background/80 backdrop-blur-xs text-muted-foreground border border-border/70 group-hover:scale-105 group-hover:border-blue-400/50 group-hover:text-blue-500"
                      )}
                      title="Male Avatar"
                    >
                      <span className="text-sm sm:text-base leading-none select-none">♂️</span>
                    </div>

                    {/* Ambient Glow */}
                    {renameGender === 'male' && (
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
                    )}

                    {/* Avatar Preview Viewport */}
                    <div className="relative z-10 w-full flex items-end justify-center -mb-1">
                      <div
                        className="arena-settings-avatar-male relative overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105 origin-bottom"
                        style={{ imageRendering: 'pixelated' }}
                      >
                        <div className="absolute top-0 left-0 arena-settings-avatar-male-sheet" />
                      </div>
                    </div>
                  </button>

                  {/* Female Avatar Button */}
                  <button
                    type="button"
                    onClick={() => setRenameGender('female')}
                    className={cn(
                      "p-0 rounded-2xl border-2 flex flex-col items-center justify-end h-[140px] sm:h-[160px] transition-all duration-300 cursor-pointer relative group text-left overflow-hidden",
                      renameGender === 'female'
                        ? "border-rose-500 bg-gradient-to-t from-rose-500/20 via-rose-500/5 to-transparent shadow-[0_0_20px_rgba(244,63,94,0.25)] ring-2 ring-rose-500/40"
                        : "border-border/60 bg-muted/15 hover:border-rose-400/50 hover:bg-muted/25"
                    )}
                  >
                    {/* Gender Emoji Badge */}
                    <div
                      className={cn(
                        "absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20 shadow-xs",
                        renameGender === 'female'
                          ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)] ring-2 ring-rose-300/50 scale-105"
                          : "bg-background/80 backdrop-blur-xs text-muted-foreground border border-border/70 group-hover:scale-105 group-hover:border-rose-400/50 group-hover:text-rose-500"
                      )}
                      title="Female Avatar"
                    >
                      <span className="text-sm sm:text-base leading-none select-none">♀️</span>
                    </div>

                    {/* Ambient Glow */}
                    {renameGender === 'female' && (
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent pointer-events-none" />
                    )}

                    {/* Avatar Preview Viewport */}
                    <div className="relative z-10 w-full flex items-end justify-center -mb-1">
                      <div
                        className="arena-settings-avatar-female relative overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105 origin-bottom"
                        style={{ imageRendering: 'pixelated' }}
                      >
                        <div className="absolute top-0 left-0 arena-settings-avatar-female-sheet" />
                      </div>
                    </div>
                  </button>
                </div>
                <style jsx global>{`
                  /* Male Settings Avatar */
                  .arena-settings-avatar-male {
                    width: 104px;
                    height: 104px;
                  }
                  .arena-settings-avatar-male-sheet {
                    width: 728px; /* 104 * 7 */
                    height: 104px;
                    background-image: url('/images/player/maleCharacter_idleAnimation.png');
                    background-repeat: no-repeat;
                    background-size: 728px 104px;
                    animation: maleArenaSettingsIdle 0.8s steps(7) infinite;
                  }
                  @media (min-width: 640px) {
                    .arena-settings-avatar-male {
                      width: 120px;
                      height: 120px;
                    }
                    .arena-settings-avatar-male-sheet {
                      width: 840px; /* 120 * 7 */
                      height: 120px;
                      background-size: 840px 120px;
                    }
                  }

                  /* Female Settings Avatar */
                  .arena-settings-avatar-female {
                    width: 117px;
                    height: 104px;
                  }
                  .arena-settings-avatar-female-sheet {
                    width: 936px; /* 117 * 8 */
                    height: 104px;
                    background-image: url('/images/player/femaleCharacter_idleAnimation.png');
                    background-repeat: no-repeat;
                    background-size: 936px 104px;
                    animation: femaleArenaSettingsIdle 0.9s steps(8) infinite;
                  }
                  @media (min-width: 640px) {
                    .arena-settings-avatar-female {
                      width: 135px;
                      height: 120px;
                    }
                    .arena-settings-avatar-female-sheet {
                      width: 1080px; /* 135 * 8 */
                      height: 120px;
                      background-size: 1080px 120px;
                    }
                  }

                  @keyframes maleArenaSettingsIdle {
                    from { transform: translateX(0px); }
                    to { transform: translateX(-100%); }
                  }
                  @keyframes femaleArenaSettingsIdle {
                    from { transform: translateX(0px); }
                    to { transform: translateX(-100%); }
                  }
                `}</style>
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

              {/* Background Music (BGM) Volume */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-primary" />
                    Background Music (BGM) Volume
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">{bgmVolume[0]}%</span>
                </div>
                <Slider
                  value={bgmVolume}
                  onValueChange={(val) => {
                    setBgmVolume(val);
                    setAudioBgmVolume(val[0]);
                  }}
                  max={100}
                  step={5}
                  className="py-1 cursor-pointer"
                />
              </div>

              {/* Ambient Music */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Background Ambient Music</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    Enable atmospheric music during dungeon quizzes
                  </span>
                </div>
                <Switch
                  checked={ambientMusic}
                  onCheckedChange={(checked) => {
                    setAmbientMusic(checked);
                    setAudioAmbientMusicEnabled(checked);
                  }}
                />
              </div>

              {/* Floating Combat Text */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Floating Combat Text</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    Render animated damage indicators when attacking
                  </span>
                </div>
                <Switch checked={floatingDamageText} onCheckedChange={setFloatingDamageText} />
              </div>

              {/* Screen Flash on Damage */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Screen Flash on Damage</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    Red pulse screen flash when taking damage
                  </span>
                </div>
                <Switch checked={hitScreenFlash} onCheckedChange={setHitScreenFlash} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
};

