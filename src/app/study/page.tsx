"use client";

import { useState, useEffect } from 'react';
import {
  BookMarked,
  Clock,
  PlayCircle,
  FlaskConical,
  Microscope,
  Database,
  Stethoscope,
  ShieldAlert,
  Search,
  Calendar as CalendarIcon,
  CalendarDays,
  BookOpen,
  Loader2,
  CheckCircle2,
  Brain,
  AlertCircle,
  Building2,
  FileText,
  Eye,
  Check,
  X,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStudyPlans, getGameDeadlineEvent, type CalendarEventData } from '@/app/actions/study-plan';
import { StudyScheduleTimeline, type StudyPlanRecord } from '@/components/study/StudyScheduleTimeline';
import {
  getSubjectMetrics,
  getCategories,
  getLearningModules,
  updateLessonStatus,
  getUserLessonCompletions,
  type SubjectMetrics,
  type LearningModuleData
} from '@/app/actions/study';
import { getUserSettingsAction } from '@/app/actions/user';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ModuleViewerDialog, type LearningModule as DialogLearningModule } from '@/components/study/ModuleViewerDialog';

const ICON_MAP: Record<string, any> = {
  "FlaskConical": FlaskConical,
  "Microscope": Microscope,
  "Database": Database,
  "Stethoscope": Stethoscope,
  "ShieldAlert": ShieldAlert,
  "BookMarked": BookMarked,
  "Clinical Chemistry": FlaskConical,
  "Hematology": Microscope,
  "Microbiology": Database,
  "Immunology & Serology and Immunohematology": Stethoscope,
  "Clinical Microscopy & Parasitology": FlaskConical,
  "Histopathology & MT Laws": ShieldAlert,
  "Histopathology and Medtech Laws": ShieldAlert,
};

export default function StudyPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [focusSubject, setFocusSubject] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string; icon?: string | null }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [targetDates, setTargetDates] = useState<Record<string, Date>>({});
  const [subjectPlans, setSubjectPlans] = useState<Record<string, { startDate: Date; endDate: Date }>>({});
  const [subjectMetrics, setSubjectMetrics] = useState<Record<string, SubjectMetrics>>({});
  const [program, setProgram] = useState<CalendarEventData | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab State: 'modules' (Curriculum Modules) vs 'timeline' (Study Schedule & Timeline)
  const [activeTab, setActiveTab] = useState<'modules' | 'timeline'>('modules');
  const [rawPlans, setRawPlans] = useState<StudyPlanRecord[]>([]);

  // Search & PDF Viewer Dialog State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerModule, setViewerModule] = useState<DialogLearningModule | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const refreshStudyPlans = async () => {
    try {
      const plans = await getStudyPlans();
      if (plans && Array.isArray(plans)) {
        setRawPlans(plans);
        const dates: Record<string, Date> = {};
        const plansMap: Record<string, { startDate: Date; endDate: Date }> = {};
        plans.forEach((p: any) => {
          const rawStart = p.startDate || p.createdAt;
          const rawEnd = p.endDate || p.targetDate || p.createdAt;
          if (rawEnd) dates[p.subject] = new Date(rawEnd);
          if (rawStart && rawEnd) {
            plansMap[p.subject] = {
              startDate: new Date(rawStart),
              endDate: new Date(rawEnd)
            };
          }
        });
        setTargetDates(dates);
        setSubjectPlans(plansMap);
      }
    } catch (err) {
      console.error('Failed to refresh study plans:', err);
    }
  };

  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'timeline' || tabParam === 'schedule' || tabParam === 'planner') {
        setActiveTab('timeline');
      }
    }

    async function loadData() {
      try {
        const [dbCategories, dbModules, plans, metrics, programData, lessonCompletionsMap, userSettings] = await Promise.all([
          getCategories().catch(() => []),
          getLearningModules().catch(() => []),
          getStudyPlans().catch(() => []),
          getSubjectMetrics().catch(() => []),
          getGameDeadlineEvent().catch(() => null),
          getUserLessonCompletions().catch(() => ({} as Record<string, string>)),
          getUserSettingsAction().catch(() => null),
        ]);

        if (plans && Array.isArray(plans)) {
          setRawPlans(plans);
        }

        const compMap: Record<string, string> = lessonCompletionsMap || {};
        const modulesList: LearningModuleData[] = dbModules || [];

        setProgram(programData);

        const baseList = (dbCategories && Array.isArray(dbCategories)) ? dbCategories : [];
        setAvailableCategories(baseList);

        if (baseList.length === 0) {
          setCurriculum([]);
          setSelectedCategoryId(null);
        } else {
          const dynamicCurriculum = baseList.map((cat: any) => {
            const catId = cat.id;

            // Find dynamic modules uploaded for this category
            const dynamicModulesForCat = modulesList.filter(m =>
              m.categoryId === catId ||
              (m.categoryId && m.categoryId.toString() === catId)
            );

            const lessons = dynamicModulesForCat.map((m, idx) => ({
              id: m.id,
              title: m.title,
              description: m.description || 'Uploaded learning module',
              duration: `${m.fileUrls.length || 0} PDF ${m.fileUrls.length === 1 ? 'Doc' : 'Docs'}`,
              fileUrls: m.fileUrls || [],
              order: m.order || idx + 1,
              isDynamic: true,
              status: compMap[m.id] || 'not-started'
            }));

            return {
              id: cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              title: cat.name,
              icon: (cat.icon && ICON_MAP[cat.icon]) ? ICON_MAP[cat.icon] : (ICON_MAP[cat.name] || BookMarked),
              adminModuleCount: dynamicModulesForCat.length,
              hasUploadedModules: dynamicModulesForCat.length > 0,
              lessons
            };
          });

          // Check URL param ?subject= or Focus Subject from settings
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlSubject = searchParams?.get('subject');
          const settingsFocus = userSettings?.focusSubject;
          const savedFocus = settingsFocus !== undefined ? settingsFocus : (typeof window !== 'undefined' ? localStorage.getItem('bq_pref_focus_subject') : null);
          const validFocus = savedFocus && savedFocus !== 'none' ? savedFocus : null;
          const prioritySubject = urlSubject || validFocus;

          if (validFocus) {
            setFocusSubject(validFocus);
          } else {
            setFocusSubject(null);
          }

          if (prioritySubject) {
            dynamicCurriculum.sort((a: any, b: any) => {
              if (a.title.toLowerCase() === prioritySubject.toLowerCase()) return -1;
              if (b.title.toLowerCase() === prioritySubject.toLowerCase()) return 1;
              return 0;
            });
          }

          setCurriculum(dynamicCurriculum);
          setSelectedCategoryId(prev => {
            if (prioritySubject) {
              const matched = dynamicCurriculum.find((c: any) => c.title.toLowerCase() === prioritySubject.toLowerCase());
              if (matched) return matched.id;
            }
            const existsInNew = dynamicCurriculum.some((c: any) => c.id === prev);
            return existsInNew && prev ? prev : dynamicCurriculum[0].id;
          });
        }

        const dates: Record<string, Date> = {};
        const plansMap: Record<string, { startDate: Date; endDate: Date }> = {};
        if (plans && Array.isArray(plans)) {
          plans.forEach((p: any) => {
            const rawStart = p.startDate || p.createdAt;
            const rawEnd = p.endDate || p.targetDate || p.createdAt;
            if (rawEnd) dates[p.subject] = new Date(rawEnd);
            if (rawStart && rawEnd) {
              plansMap[p.subject] = {
                startDate: new Date(rawStart),
                endDate: new Date(rawEnd)
              };
            }
          });
        }
        setTargetDates(dates);
        setSubjectPlans(plansMap);

        const metricsMap: Record<string, SubjectMetrics> = {};
        if (metrics && Array.isArray(metrics)) {
          metrics.forEach((m: any) => {
            metricsMap[m.subject] = m;
          });
        }
        setSubjectMetrics(metricsMap);
      } catch (err) {
        console.warn('Could not load study curriculum data from server:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Refresh metrics every 30 seconds to keep them in sync across pages
    const metricsRefreshInterval = setInterval(async () => {
      try {
        const metrics = await getSubjectMetrics();
        if (metrics && Array.isArray(metrics)) {
          const metricsMap: Record<string, SubjectMetrics> = {};
          metrics.forEach(m => {
            metricsMap[m.subject] = m;
          });
          setSubjectMetrics(metricsMap);
        }
      } catch (err) { }
    }, 30000);

    const handleSettingsUpdate = () => {
      try {
        const updatedFocus = localStorage.getItem('bq_pref_focus_subject');
        setFocusSubject(updatedFocus && updatedFocus !== 'none' ? updatedFocus : null);
      } catch { }
    };

    const handleStatsUpdate = async () => {
      try {
        const metrics = await getSubjectMetrics();
        if (metrics && Array.isArray(metrics)) {
          const metricsMap: Record<string, SubjectMetrics> = {};
          metrics.forEach(m => {
            metricsMap[m.subject] = m;
          });
          setSubjectMetrics(metricsMap);
        }
      } catch (err) { }
    };

    window.addEventListener('bq_settings_updated', handleSettingsUpdate);
    window.addEventListener('bq_stats_updated', handleStatsUpdate);

    return () => {
      clearInterval(metricsRefreshInterval);
      window.removeEventListener('bq_settings_updated', handleSettingsUpdate);
      window.removeEventListener('bq_stats_updated', handleStatsUpdate);
    };
  }, []);


  const handleToggleComplete = async (lessonId: string) => {
    if (!selectedCategory) return;
    const currentLesson = selectedCategory.lessons.find((l: any) => l.id === lessonId);
    if (!currentLesson) return;

    const nextStatus = currentLesson.status === 'completed' ? 'not-started' : 'completed';

    try {
      const updated = await updateLessonStatus(selectedCategory.title, lessonId, nextStatus);
      if (updated) {
        // Update local curriculum state immediately
        setCurriculum(prev => prev.map(cat => {
          if (cat.title === selectedCategory.title) {
            return {
              ...cat,
              lessons: cat.lessons.map((l: any) => l.id === lessonId ? { ...l, status: nextStatus } : l)
            };
          }
          return cat;
        }));

        // If the viewer dialog is open for this module, update its status as well
        if (viewerModule && viewerModule.id === lessonId) {
          setViewerModule(prev => prev ? { ...prev, status: nextStatus } : null);
        }

        // Refresh metrics
        try {
          const metrics = await getSubjectMetrics();
          if (metrics && Array.isArray(metrics)) {
            const metricsMap: Record<string, SubjectMetrics> = {};
            metrics.forEach(m => {
              metricsMap[m.subject] = m;
            });
            setSubjectMetrics(metricsMap);
          }
        } catch { }

        toast({
          title: nextStatus === 'completed' ? "Module Completed ✓" : "Module Reset",
          description: nextStatus === 'completed'
            ? "Awesome work! Your subject completion bar has been updated."
            : "Module status reset to not started.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Failed to update lesson status. Please check your connection and try again.",
      });
    }
  };

  const handleOpenViewer = (lesson: any) => {
    setViewerModule({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || '',
      fileUrls: lesson.fileUrls || [],
      order: lesson.order,
      status: lesson.status
    });
    setIsViewerOpen(true);

    if (selectedCategory) {
      try {
        localStorage.setItem('bq_last_studied', JSON.stringify({
          subject: selectedCategory.title,
          subjectId: selectedCategory.id,
          moduleId: lesson.id,
          moduleTitle: lesson.title,
          timestamp: Date.now()
        }));
        window.dispatchEvent(new CustomEvent('bq_last_studied_updated'));
      } catch (e) { }
    }
  };

  // Filter subjects matching search query (matches subject name or modules inside)
  const matchingCategories = curriculum.filter((cat: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesSubject = cat.title.toLowerCase().includes(q);
    const matchesModule = cat.lessons?.some((l: any) =>
      l.title.toLowerCase().includes(q) ||
      (l.description && l.description.toLowerCase().includes(q)) ||
      (l.fileUrls && l.fileUrls.some((url: string) => url.toLowerCase().includes(q)))
    );
    return matchesSubject || matchesModule;
  });

  // Automatically switch active subject if searching matches another subject or its modules
  useEffect(() => {
    if (searchQuery.trim() && matchingCategories.length > 0) {
      const isSelectedInMatching = matchingCategories.some(c => c.id === selectedCategoryId);
      if (!isSelectedInMatching) {
        setSelectedCategoryId(matchingCategories[0].id);
      }
    }
  }, [searchQuery, matchingCategories, selectedCategoryId]);

  const selectedCategory = (curriculum && curriculum.length > 0)
    ? (curriculum.find(c => c.id === selectedCategoryId) || curriculum[0])
    : null;

  const selectedMetric = selectedCategory ? (
    subjectMetrics[selectedCategory.title]
    || Object.values(subjectMetrics).find(m => m.subject?.trim().toLowerCase() === selectedCategory.title.trim().toLowerCase())
    || Object.values(subjectMetrics).find(m => {
      const s1 = m.subject?.trim().toLowerCase() || '';
      const s2 = selectedCategory.title.trim().toLowerCase();
      return s1.includes(s2) || s2.includes(s1);
    })
  ) : undefined;

  const currentProficiency = selectedMetric?.proficiency ?? selectedMetric?.mastery ?? 0;
  const currentCompletion = selectedMetric?.completion ?? 0;
  const currentMasteryStatus = selectedMetric?.masteryStatus || 'Not Started';

  // Filter lessons based on user search query
  const filteredLessons = (selectedCategory?.lessons || []).filter((l: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (selectedCategory?.title && selectedCategory.title.toLowerCase().includes(q)) return true;
    return (
      l.title.toLowerCase().includes(q) ||
      (l.description && l.description.toLowerCase().includes(q)) ||
      (l.fileUrls && l.fileUrls.some((url: string) => url.toLowerCase().includes(q)))
    );
  });

  const displayCurriculum = searchQuery.trim() ? matchingCategories : curriculum;

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Study Subjects...</p>
      </div>
    );
  }

  if (!selectedCategory || curriculum.length === 0) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-background text-center">
        <div className="max-w-lg space-y-6 flex flex-col items-center animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-lg">
            <BookMarked className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight font-headline">
              No Subjects Available
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium max-w-md mx-auto">
              There are currently no board exam subjects or learning modules uploaded in the database. Please contact your review center administrator to publish study materials.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase px-7 py-3 rounded-2xl shadow-lg transition-all"
            >
              Refresh Study Subjects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20 lg:pb-12 bg-background">
      <header id="tour-study-header" className="bg-background border-b px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
            <div className="space-y-1 sm:space-y-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-none uppercase" style={{ fontFamily: "'Inter-bold', sans-serif" }}>
                Study <span className="text-primary">Subjects</span>
              </h1>
              <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                Intel Gathering & Concept Mastery
              </p>
            </div>

            {/* Dynamic Review Center Program Deadline - Only displayed in Syllabus Curriculum tab */}
            {activeTab === 'modules' && (
              program ? (
                <div id="tour-study-program" className="bg-card border-2 border-border/80 hover:border-primary/30 transition-all rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-xs space-y-2 w-full sm:w-auto min-w-0 sm:min-w-[280px] lg:min-w-[340px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">Final Deadline</span>
                    </div>
                    {(() => {
                      const daysLeft = differenceInDays(new Date(program.endDate), new Date());
                      return (
                        <span className={cn(
                          "text-[8px] sm:text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider border shrink-0",
                          daysLeft <= 14
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40"
                        )}>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                        </span>
                      );
                    })()}
                  </div>

                  <div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tight leading-none">
                      {format(new Date(program.endDate), "MMMM dd, yyyy")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground truncate pt-0.5 border-t border-border/40">
                    <Building2 className="w-3 h-3 text-primary shrink-0" />
                    <span className="font-semibold text-foreground/90 capitalize truncate">
                      {program.authorName || program.companyName || 'Super Admin'}
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="font-medium truncate">{program.title}</span>
                    {program.labels && program.labels.length > 0 && (
                      <>
                        <span className="text-muted-foreground/60">•</span>
                        <span className="font-medium truncate capitalize">
                          {Array.isArray(program.labels) ? program.labels.join(', ') : String(program.labels)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-card border-2 border-border rounded-2xl p-3.5 sm:p-4 lg:p-5 flex items-center gap-3 text-foreground shadow-xs w-full sm:w-auto">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final Deadline</p>
                    <p className="text-xs font-bold text-foreground">Loading schedule...</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Segmented Tab Switcher: Curriculum vs Study Timeline */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center p-1 bg-muted/80 border border-border/80 rounded-2xl shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('modules');
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', 'modules');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeTab === 'modules'
                    ? "bg-card text-foreground shadow-sm border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Syllabus Curriculum</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('timeline');
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', 'timeline');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer relative",
                  activeTab === 'timeline'
                    ? "bg-card text-foreground shadow-sm border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>Study Schedule & Timeline</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              </button>
            </div>
          </div>

          {/* Search Bar (Only shown in Curriculum tab) */}
          {activeTab === 'modules' && (
            <div className="relative">
              <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects or modules..."
                className="pl-10 sm:pl-12 pr-10 h-11 sm:h-14 bg-muted border-2 border-border rounded-xl sm:rounded-2xl focus-visible:ring-primary/20 text-xs sm:text-sm font-medium"
              />
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-background transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {activeTab === 'timeline' ? (
        <main className="p-3.5 sm:p-6 max-w-7xl mx-auto">
          <StudyScheduleTimeline
            initialPlans={rawPlans}
            program={program}
            availableSubjects={availableCategories}
            subjectMetrics={Object.values(subjectMetrics)}
            onRefreshPlans={refreshStudyPlans}
            onSelectSubjectInCurriculum={(subjectTitle) => {
              const match = curriculum.find(
                (c) => c.title.toLowerCase() === subjectTitle.toLowerCase()
              );
              if (match) setSelectedCategoryId(match.id);
              setActiveTab('modules');
            }}
          />
        </main>
      ) : (
        <main className="p-3.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 max-w-7xl mx-auto">
        {/* Subjects Sidebar / Mobile Carousel Selector */}
        <aside id="tour-study-subjects" className="lg:col-span-4 space-y-3 sm:space-y-4">
          <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 sm:px-2">Subjects</h2>

          {displayCurriculum.length === 0 ? (
            <div className="p-5 sm:p-6 text-center bg-card border-2 border-dashed border-border/80 rounded-3xl space-y-3 shadow-xs">
              <Search className="w-6 h-6 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-foreground leading-snug">No subjects match "{searchQuery}"</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-bold rounded-xl h-8 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Horizontal Carousel (< lg) */}
              <div className="flex lg:hidden overflow-x-auto gap-2.5 pb-2 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 scrollbar-none shrink-0">
                {displayCurriculum.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategoryId === cat.id;
                  const uploadedCount = cat.adminModuleCount || 0;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-2xl transition-all border-2 shrink-0 min-w-[200px] text-left",
                        isActive
                          ? "bg-background border-primary shadow-md"
                          : "hover:bg-muted border-border bg-background"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl shrink-0 transition-colors",
                        isActive ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "font-bold text-xs uppercase tracking-tight truncate",
                          isActive ? "text-primary" : "text-foreground"
                        )}>
                          {cat.title}
                        </p>
                        <span className="text-[9px] font-semibold text-muted-foreground">
                          {uploadedCount > 0 ? `${uploadedCount} ${uploadedCount === 1 ? 'Module' : 'Modules'}` : '0 Modules'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Vertical Card Stack (>= lg) */}
              <div className="hidden lg:grid grid-cols-1 gap-2.5 sm:gap-3">
                {displayCurriculum.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategoryId === cat.id;
                  const catDate = targetDates[cat.title];
                  const catPlan = subjectPlans[cat.title];
                  const uploadedCount = cat.adminModuleCount || 0;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        "w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-2xl sm:rounded-3xl transition-all text-left border-2",
                        isActive
                          ? "bg-background border-primary shadow-lg"
                          : "hover:bg-muted border-border bg-background"
                      )}
                    >
                      <div className={cn(
                        "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shrink-0 transition-colors relative",
                        isActive ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 justify-between">
                          <p className={cn(
                            "font-semibold text-xs sm:text-sm uppercase tracking-tight truncate",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {cat.title}
                          </p>
                          {mounted && focusSubject && focusSubject.toLowerCase() === cat.title.toLowerCase() && (
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[8px] px-1.5 py-0 shrink-0">
                              ⭐ Focus
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase truncate">
                            <CalendarIcon className="w-3 h-3 shrink-0" />
                            <span>
                              {mounted && catPlan ? (
                                `${format(catPlan.startDate, "MMM dd")} - ${format(catPlan.endDate, "MMM dd")}`
                              ) : (
                                mounted && catDate ? format(catDate, "MMM dd, yyyy") : "No target set"
                              )}
                            </span>
                          </div>

                          <Badge variant="outline" className={cn(
                            "text-[9px] px-1.5 py-0 font-bold shrink-0",
                            uploadedCount > 0
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-secondary text-muted-foreground border-border"
                          )}>
                            {uploadedCount > 0 ? `${uploadedCount} ${uploadedCount === 1 ? 'Module' : 'Modules'}` : '0 Modules'}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>

        {/* Selected Discipline Details & Modules */}
        <section className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* Metrics Card */}
          <Card id="tour-study-metrics" className="border border-border shadow-xs rounded-2xl sm:rounded-[2rem] bg-muted border-2 border-border overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-4 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <div>
                    <CardTitle className="font-headline font-semibold text-lg sm:text-xl lg:text-2xl text-foreground uppercase">
                      {selectedCategory.title}
                    </CardTitle>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Subject Parameters</p>
                </div>

                {(() => {
                  const activeSubjectPlan = selectedCategory ? subjectPlans[selectedCategory.title] : undefined;

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('timeline');
                        if (typeof window !== 'undefined') {
                          const url = new URL(window.location.href);
                          url.searchParams.set('tab', 'timeline');
                          window.history.replaceState({}, '', url.toString());
                        }
                      }}
                      className={cn(
                        "group rounded-2xl border-2 px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer text-left",
                        activeSubjectPlan
                          ? "border-primary/40 bg-primary/10 hover:bg-primary/15 hover:border-primary/60 text-primary shadow-xs"
                          : "border-dashed border-border hover:border-primary/50 bg-card/60 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                      )}
                      title="Manage schedule in Study Schedule & Timeline"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        activeSubjectPlan ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                      )}>
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground leading-none">
                            Study Period Target
                          </p>
                          <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </div>
                        <p className="text-xs sm:text-[13px] font-black leading-tight text-foreground mt-0.5 truncate">
                          {mounted && activeSubjectPlan ? (
                            `${format(activeSubjectPlan.startDate, "MMM dd")} - ${format(activeSubjectPlan.endDate, "MMM dd, yyyy")}`
                          ) : (
                            <span className="text-muted-foreground group-hover:text-primary transition-colors">+ Schedule in Timeline</span>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })()}
              </div>
              <div className="space-y-3 sm:space-y-4 pt-2">
                {/* Completion Metric */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] sm:text-xs font-semibold uppercase text-foreground flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                      Completion
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-foreground">
                      {currentCompletion}%
                    </span>
                  </div>
                  <Progress value={currentCompletion} className="h-2 sm:h-2.5 bg-secondary" />
                </div>

                {/* Mastery Metric */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] sm:text-xs font-semibold uppercase text-primary flex items-center gap-1.5 sm:gap-2">
                      <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      Subject Proficiency (Quest Avg)
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-[11px] sm:text-xs font-semibold text-foreground">
                        {currentProficiency}%
                      </span>
                      <span 
                        title={
                          currentMasteryStatus === 'Mastered'
                            ? 'Mastered: ≥90% Proficiency, ≥85% Topic Mastery, and ≥75% Syllabus Completion'
                            : currentMasteryStatus === 'Proficient'
                            ? 'Proficient: ≥75% Proficiency, ≥75% Topic Mastery, and ≥25% Syllabus Completion'
                            : 'In Training: Reach ≥75% Proficiency, ≥75% Topic Mastery, and ≥25% Syllabus Completion to unlock Proficient'
                        }
                        className={cn(
                          "text-[8px] sm:text-[9px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full uppercase cursor-help",
                          currentMasteryStatus === 'Mastered' ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" :
                            currentMasteryStatus === 'Proficient' ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
                              currentMasteryStatus === 'In Training' ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" :
                                "bg-secondary text-slate-600 dark:text-slate-400"
                        )}
                      >
                        {currentMasteryStatus}
                      </span>
                    </div>
                  </div>
                  <Progress value={currentProficiency} className="h-2 sm:h-2.5 bg-secondary" />
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold">
                    {selectedMetric && selectedMetric.totalQuestionsAnswered > 0
                      ? `Based on Quest Arena performance (${selectedMetric.mastery}% accuracy • ${selectedMetric.totalQuestionsAnswered}/100 volume weight)`
                      : 'Based on your average performance in Quest Arena for this subject'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Modules List Card */}
          <Card className="border border-border shadow-xs rounded-2xl sm:rounded-[2rem] bg-background border-2 border-border overflow-hidden">
            <CardHeader className="bg-muted border-b p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <CardTitle className="font-headline text-base sm:text-lg font-semibold uppercase tracking-tight flex items-center gap-2.5 sm:gap-3">
                  <BookMarked className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  Learning Modules & Materials
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  Tap any module to view attached PDF study materials and mark complete.
                </p>
              </div>

              {filteredLessons.length > 0 ? (
                <Badge variant="outline" className="self-start sm:self-auto bg-primary/10 text-primary border-primary/30 font-bold text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-xl whitespace-nowrap shrink-0">
                  {filteredLessons.length} {filteredLessons.length === 1 ? 'Module' : 'Modules'}
                </Badge>
              ) : (
                <Badge variant="outline" className="self-start sm:self-auto bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-xl whitespace-nowrap shrink-0">
                  0 Modules Available
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className={filteredLessons.length === 0 ? "h-auto" : "h-[450px]"}>
                {filteredLessons.length === 0 ? (
                  <div className="p-10 sm:p-14 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-xs">
                      {searchQuery.trim() ? <Search className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                    </div>

                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h4 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-tight font-headline">
                        {searchQuery.trim()
                          ? "No matching modules found"
                          : "No Learning Modules Available Yet"}
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {searchQuery.trim()
                          ? `No learning modules in ${selectedCategory?.title || 'this subject'} match "${searchQuery}".`
                          : `Learning modules and study materials for ${selectedCategory?.title || 'this subject'} are currently being prepared by the review center admin team.`}
                      </p>
                    </div>

                    <div className="pt-1">
                      {searchQuery.trim() ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                        >
                          Clear Search Filter
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 px-3 py-1 rounded-xl">
                          Awaiting Upload
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {filteredLessons.map((lesson: any, idx: number) => {
                      const isCompleted = lesson.status === 'completed';
                      const pdfCount = lesson.fileUrls ? lesson.fileUrls.length : 0;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleOpenViewer(lesson)}
                          className="p-4 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-5 hover:bg-muted/60 transition-all cursor-pointer group min-w-0"
                        >
                          {/* Index Badge */}
                          <div className={cn(
                            "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all shadow-xs",
                            isCompleted
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : "bg-background border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                          )}>
                            {lesson.order || idx + 1}
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm lg:text-base text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                                {lesson.title}
                              </h4>
                              {isCompleted && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0 font-bold">
                                  ✓ Done
                                </Badge>
                              )}
                            </div>

                            {lesson.description && (
                              <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                                {lesson.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight pt-0.5">
                              {pdfCount > 0 ? (
                                <span className="flex items-center gap-1 text-primary font-bold">
                                  <FileText className="h-3 w-3" />
                                  {pdfCount} PDF Study {pdfCount === 1 ? 'Doc' : 'Docs'}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.duration || "45m Intel"}
                                </span>
                              )}

                              <span className="text-muted-foreground/40">•</span>
                              <span className="flex items-center gap-1 group-hover:underline">
                                <Eye className="h-3 w-3 text-primary" />
                                Open Viewer
                              </span>
                            </div>
                          </div>

                          {/* Open PDF Viewer Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenViewer(lesson);
                            }}
                            className={cn(
                              "h-9 w-9 sm:h-11 sm:w-11 shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all shadow-xs border-2",
                              isCompleted
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                : "bg-background border-border text-muted-foreground hover:bg-primary hover:text-white hover:border-primary"
                            )}
                            aria-label="Open PDF study module"
                            title={isCompleted ? "Completed - Click to Open PDF" : "Click to Open PDF"}
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5 stroke-[3]" />
                            ) : (
                              <PlayCircle className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </section>
      </main>
      )}

      {/* Coursera-Style PDF & Learning Module Viewer Dialog */}
      <ModuleViewerDialog
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        module={viewerModule}
        subjectTitle={selectedCategory?.title || ''}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
}
