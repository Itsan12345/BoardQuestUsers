"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Download,
  BookOpen,
  Sparkles,
  Loader2,
  FileCheck,
  Check,
  NotebookPen,
  Copy,
  Trash2,
  Clock,
  Bookmark,
  FileDown,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { saveStudyNote, getUserStudyNote } from '@/app/actions/study';

export interface LearningModule {
  id: string;
  title: string;
  description?: string | null;
  fileUrls: string[];
  order?: number;
  isPublished?: boolean;
  status?: 'completed' | 'in-progress' | 'not-started';
}

interface ModuleViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: LearningModule | null;
  subjectTitle: string;
  onToggleComplete: (moduleId: string) => Promise<void>;
}

export function ModuleViewerDialog({
  open,
  onOpenChange,
  module,
  subjectTitle,
  onToggleComplete,
}: ModuleViewerDialogProps) {
  const { toast } = useToast();
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'materials' | 'notes'>('materials');
  const [mobileTab, setMobileTab] = useState<'reader' | 'materials' | 'notes'>('reader');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Student Study Notes State
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load saved notes for this module from DB & localStorage
  useEffect(() => {
    if (module?.id) {
      setActiveFileIndex(0);
      setMobileTab('reader');
      try {
        const localSaved = localStorage.getItem(`bq_study_notes_${module.id}`);
        if (localSaved) setNotes(localSaved);
      } catch {}

      getUserStudyNote(module.id).then((dbNotes) => {
        if (dbNotes) {
          setNotes(dbNotes);
          setLastSaved('Auto-Saved');
        } else {
          setLastSaved(null);
        }
      }).catch(() => {});
    }
  }, [module?.id]);

  // Auto-save notes on change
  const handleNotesChange = (val: string) => {
    setNotes(val);
    setLastSaved('Saving...');
    if (module?.id) {
      try {
        localStorage.setItem(`bq_study_notes_${module.id}`, val);
      } catch {}

      saveStudyNote(module.id, val).then(() => {
        setLastSaved('Auto-Saved');
      }).catch(() => {
        setLastSaved('Auto-Saved');
      });
    }
  };

  if (!module) return null;

  const files = module.fileUrls || [];
  const activeFileUrl = files[activeFileIndex] || null;
  const isCompleted = module.status === 'completed';

  const cleanFilename = (url: string, index: number) => {
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      const decoded = decodeURIComponent(lastPart).replace(/^[a-z0-9_-]+_/i, '');
      if (decoded.length > 3) return decoded;
    } catch {}
    return `Study Document #${index + 1}`;
  };

  const handleCompleteClick = async () => {
    setIsSubmitting(true);
    try {
      await onToggleComplete(module.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyNotes = () => {
    if (!notes.trim()) return;
    navigator.clipboard.writeText(notes);
    toast({
      title: "Notes Copied!",
      description: "Your study notes have been copied to your clipboard.",
    });
  };

  const handleExportNotes = () => {
    if (!notes.trim()) return;
    const blob = new Blob([`STUDY NOTES - ${subjectTitle}: ${module.title}\n=========================================\n\n${notes}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Notes_${module.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Notes Exported",
      description: "Saved notes as text file.",
    });
  };

  const handleAddBookmarkTag = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const docName = activeFileUrl ? cleanFilename(activeFileUrl, activeFileIndex) : 'Document';
    const tag = `\n\n📌 [Note @ ${timestamp} - ${docName}]:\n`;
    handleNotesChange(notes + tag);
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[96vw] sm:w-[92vw] h-[94vh] max-h-[940px] p-0 gap-0 border-2 border-border/80 rounded-3xl overflow-hidden bg-background shadow-2xl flex flex-col font-sans">
        {/* System Theme Header */}
        <DialogHeader className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border bg-gradient-to-r from-primary/10 via-card to-card text-foreground shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-md">
                LEARNING MODULE
              </span>
              <span className="text-muted-foreground text-xs font-semibold">•</span>
              <span className="text-foreground text-xs font-bold uppercase tracking-tight truncate max-w-[160px] sm:max-w-none">
                {subjectTitle}
              </span>
              {typeof module.order === 'number' && (
                <span className="text-muted-foreground text-xs font-medium">
                  Module #{module.order}
                </span>
              )}
            </div>
            <DialogTitle className="text-base sm:text-xl font-headline font-bold text-foreground truncate">
              {module.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Mobile View Switcher Tabs (< lg) */}
        <div className="flex lg:hidden border-b border-border bg-muted/40 p-1.5 shrink-0">
          <div className="w-full grid grid-cols-3 gap-1">
            <button
              onClick={() => setMobileTab('reader')}
              className={cn(
                "py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                mobileTab === 'reader'
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>PDF Reader</span>
            </button>

            <button
              onClick={() => setMobileTab('materials')}
              className={cn(
                "py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                mobileTab === 'materials'
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs ({files.length})</span>
            </button>

            <button
              onClick={() => setMobileTab('notes')}
              className={cn(
                "py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative",
                mobileTab === 'notes'
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              <NotebookPen className="w-3.5 h-3.5" />
              <span>Notes</span>
              {notes.trim().length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Panel: Tabbed Navigation (Materials / Notes) - Desktop & Mobile viewable */}
          <div className={cn(
            "lg:col-span-4 border-r border-border/80 bg-muted/20 flex flex-col min-h-0 overflow-hidden",
            mobileTab === 'reader' ? "hidden lg:flex" : "flex"
          )}>
            {/* Desktop Tab Header Selector */}
            <div className="hidden lg:block p-3 border-b border-border/60 bg-background/80 shrink-0">
              <Tabs value={activeSidebarTab} onValueChange={(val) => setActiveSidebarTab(val as any)} className="w-full">
                <TabsList className="w-full grid grid-cols-2 p-1 bg-muted rounded-xl">
                  <TabsTrigger
                    value="materials"
                    className="rounded-lg text-xs font-bold py-1.5 flex items-center justify-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Materials ({files.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="rounded-lg text-xs font-bold py-1.5 flex items-center justify-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-colors relative"
                  >
                    <NotebookPen className="w-3.5 h-3.5" />
                    <span>My Notes</span>
                    {notes.trim().length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Materials & Overview Content */}
            {(activeSidebarTab === 'materials' || mobileTab === 'materials') && mobileTab !== 'notes' && (
              <div className="flex-1 p-3.5 sm:p-5 flex flex-col gap-4 overflow-y-auto min-h-0">
                {/* Module Overview */}
                <div className="space-y-2 bg-background p-3.5 sm:p-4 rounded-2xl border border-border/80 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Module Overview
                  </h4>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    {module.description || "No overview description provided for this module."}
                  </p>
                </div>

                {/* Document Attachments Switcher */}
                <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Reading Documents ({files.length})
                    </h4>
                  </div>

                  {files.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/30">
                      <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-muted-foreground">No PDF documents uploaded for this module.</p>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1 pr-1">
                      <div className="space-y-2">
                        {files.map((fileUrl, idx) => {
                          const isActive = activeFileIndex === idx;
                          const fileName = cleanFilename(fileUrl, idx);

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setActiveFileIndex(idx);
                                setMobileTab('reader');
                              }}
                              className={cn(
                                "group p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 text-left",
                                isActive
                                  ? "bg-primary/10 border-primary shadow-xs text-primary font-bold"
                                  : "bg-background border-border hover:border-primary/40 hover:bg-muted/50 text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div className={cn(
                                  "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-colors",
                                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                )}>
                                  <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold tracking-tight truncate group-hover:text-primary">
                                    {fileName}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-medium">PDF Study Material • Tap to read</p>
                                </div>
                              </div>

                              <a
                                href={fileUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                title="Download document"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}

            {/* Notes Content */}
            {(activeSidebarTab === 'notes' || mobileTab === 'notes') && (
              <div className="flex-1 p-3.5 sm:p-4 flex flex-col gap-3 min-h-0 bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <NotebookPen className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">My Study Notebook</span>
                  </div>
                  {lastSaved && (
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {lastSaved}
                    </span>
                  )}
                </div>

                {/* Quick Note Actions Toolbar */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddBookmarkTag}
                    className="h-7 px-2.5 text-[10px] font-bold gap-1 rounded-lg border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"
                  >
                    <Bookmark className="w-3 h-3 text-primary" />
                    <span>+ Timestamp</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyNotes}
                    disabled={!notes.trim()}
                    className="h-7 px-2 text-[10px] font-semibold gap-1 rounded-lg"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportNotes}
                    disabled={!notes.trim()}
                    className="h-7 px-2 text-[10px] font-semibold gap-1 rounded-lg"
                  >
                    <FileDown className="w-3 h-3" />
                    <span>Export</span>
                  </Button>
                  {notes.trim().length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNotesChange('')}
                      className="h-7 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Notes Textarea */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <Textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Take key notes, formulas, or review pointers while reading the PDF..."
                    className="flex-1 resize-none bg-muted/30 border-2 border-border/80 rounded-2xl p-3.5 text-xs font-mono leading-relaxed focus-visible:ring-primary/30"
                  />
                </div>

                {/* Notes Footer */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold px-1 shrink-0">
                  <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                  <span>Notes are saved automatically</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: PDF Viewer Frame - Visible on Desktop or Mobile 'reader' tab */}
          <div className={cn(
            "lg:col-span-8 bg-muted/40 p-2 sm:p-4 flex flex-col min-h-[350px] lg:min-h-0 relative",
            mobileTab !== 'reader' ? "hidden lg:flex" : "flex"
          )}>
            {activeFileUrl ? (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-border/80 bg-background shadow-xs relative flex flex-col">
                {/* PDF Viewer Header Bar */}
                <div className="px-3.5 sm:px-4 py-2 bg-muted/80 border-b border-border flex items-center justify-between text-foreground shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold tracking-tight truncate text-foreground">
                      {cleanFilename(activeFileUrl, activeFileIndex)}
                    </span>
                  </div>

                  {files.length > 1 && (
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-0.5 bg-background border border-border rounded-md shrink-0">
                      Doc {activeFileIndex + 1} of {files.length}
                    </span>
                  )}
                </div>

                {/* PDF Iframe Viewer */}
                <iframe
                  src={`${activeFileUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full border-0 rounded-b-2xl bg-white"
                  title={module.title}
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center p-8 text-center bg-background text-foreground">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm uppercase text-foreground tracking-tight">Study Text & Materials</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Select a document from the left panel to begin reading your study material.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* System Theme Bottom Action Bar */}
        <div className="p-3.5 sm:p-5 border-t border-border bg-card text-card-foreground shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0",
              isCompleted ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-primary/10 text-primary border border-primary/20"
            )}>
              {isCompleted ? <FileCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <BookOpen className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">
                {isCompleted ? "You completed this reading module!" : "Finished reading this module?"}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold line-clamp-1">
                {isCompleted
                  ? "Your subject completion score and mastery metrics have been updated."
                  : "Mark complete once you've finished studying the materials."}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <Button
              onClick={handleCompleteClick}
              disabled={isSubmitting}
              className={cn(
                "w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-7 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2",
                isCompleted
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-emerald-500/20"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : isCompleted ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Completed ✓</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Completed</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
