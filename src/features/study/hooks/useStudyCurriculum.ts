"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchStudyInitialData,
  refreshStudyMetrics,
  updateLessonStatusAction,
  refreshStudyPlansAction,
} from '../api';
import { ICON_MAP } from '../utils';
import type {
  SubjectMetrics,
  LearningModuleData,
  CalendarEventData,
  StudyPlanRecord,
  CurriculumCategory,
  CurriculumLesson,
} from '../types';
import type { LearningModule as DialogLearningModule } from '@/components/study/ModuleViewerDialog';
import { BookMarked } from 'lucide-react';

export function useStudyCurriculum() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [focusSubject, setFocusSubject] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumCategory[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string; icon?: string | null }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [targetDates, setTargetDates] = useState<Record<string, Date>>({});
  const [subjectPlans, setSubjectPlans] = useState<Record<string, { startDate: Date; endDate: Date }>>({});
  const [subjectMetrics, setSubjectMetrics] = useState<Record<string, SubjectMetrics>>({});
  const [program, setProgram] = useState<CalendarEventData | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab State: 'modules' vs 'timeline'
  const [activeTab, setActiveTab] = useState<'modules' | 'timeline'>('modules');
  const [rawPlans, setRawPlans] = useState<StudyPlanRecord[]>([]);

  // Search & PDF Viewer Dialog State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerModule, setViewerModule] = useState<DialogLearningModule | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const refreshStudyPlans = useCallback(async () => {
    try {
      const plans = await refreshStudyPlansAction();
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
              endDate: new Date(rawEnd),
            };
          }
        });
        setTargetDates(dates);
        setSubjectPlans(plansMap);
      }
    } catch (err) {
      console.error('Failed to refresh study plans:', err);
    }
  }, []);

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
        const {
          dbCategories,
          dbModules,
          plans,
          metrics,
          programData,
          lessonCompletionsMap,
          userSettings,
        } = await fetchStudyInitialData();

        if (plans && Array.isArray(plans)) {
          setRawPlans(plans);
        }

        const compMap: Record<string, string> = lessonCompletionsMap || {};
        const modulesList: LearningModuleData[] = dbModules || [];

        setProgram(programData);

        const baseList = dbCategories && Array.isArray(dbCategories) ? dbCategories : [];
        setAvailableCategories(baseList);

        if (baseList.length === 0) {
          setCurriculum([]);
          setSelectedCategoryId(null);
        } else {
          const dynamicCurriculum: CurriculumCategory[] = baseList.map((cat: any) => {
            const catId = cat.id;

            const dynamicModulesForCat = modulesList.filter(
              (m) =>
                m.categoryId === catId ||
                (m.categoryId && m.categoryId.toString() === catId)
            );

            const lessons: CurriculumLesson[] = dynamicModulesForCat.map((m, idx) => ({
              id: m.id,
              title: m.title,
              description: m.description || 'Uploaded learning module',
              duration: `${m.fileUrls.length || 0} PDF ${
                m.fileUrls.length === 1 ? 'Doc' : 'Docs'
              }`,
              fileUrls: m.fileUrls || [],
              order: m.order || idx + 1,
              isDynamic: true,
              status: compMap[m.id] || 'not-started',
            }));

            return {
              id: cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              title: cat.name,
              icon:
                cat.icon && ICON_MAP[cat.icon]
                  ? ICON_MAP[cat.icon]
                  : ICON_MAP[cat.name] || BookMarked,
              adminModuleCount: dynamicModulesForCat.length,
              hasUploadedModules: dynamicModulesForCat.length > 0,
              lessons,
            };
          });

          // Check URL param ?subject= or Focus Subject from settings
          const searchParams =
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search)
              : null;
          const urlSubject = searchParams?.get('subject');
          const settingsFocus = userSettings?.focusSubject;
          const savedFocus =
            settingsFocus !== undefined
              ? settingsFocus
              : typeof window !== 'undefined'
              ? localStorage.getItem('bq_pref_focus_subject')
              : null;
          const validFocus = savedFocus && savedFocus !== 'none' ? savedFocus : null;
          const prioritySubject = urlSubject || validFocus;

          if (validFocus) {
            setFocusSubject(validFocus);
          } else {
            setFocusSubject(null);
          }

          if (prioritySubject) {
            dynamicCurriculum.sort((a, b) => {
              if (a.title.toLowerCase() === prioritySubject.toLowerCase()) return -1;
              if (b.title.toLowerCase() === prioritySubject.toLowerCase()) return 1;
              return 0;
            });
          }

          setCurriculum(dynamicCurriculum);
          setSelectedCategoryId((prev) => {
            if (prioritySubject) {
              const matched = dynamicCurriculum.find(
                (c) => c.title.toLowerCase() === prioritySubject.toLowerCase()
              );
              if (matched) return matched.id;
            }
            const existsInNew = dynamicCurriculum.some((c) => c.id === prev);
            return existsInNew && prev ? prev : dynamicCurriculum[0]?.id || null;
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
                endDate: new Date(rawEnd),
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

    // Refresh metrics every 30 seconds
    const metricsRefreshInterval = setInterval(async () => {
      try {
        const metrics = await refreshStudyMetrics();
        if (metrics && Array.isArray(metrics)) {
          const metricsMap: Record<string, SubjectMetrics> = {};
          metrics.forEach((m: any) => {
            metricsMap[m.subject] = m;
          });
          setSubjectMetrics(metricsMap);
        }
      } catch (err) {
        // silent catch
      }
    }, 30000);

    const handleSettingsUpdate = () => {
      try {
        const updatedFocus = localStorage.getItem('bq_pref_focus_subject');
        setFocusSubject(updatedFocus && updatedFocus !== 'none' ? updatedFocus : null);
      } catch {
        // silent catch
      }
    };

    const handleStatsUpdate = async () => {
      try {
        const metrics = await refreshStudyMetrics();
        if (metrics && Array.isArray(metrics)) {
          const metricsMap: Record<string, SubjectMetrics> = {};
          metrics.forEach((m: any) => {
            metricsMap[m.subject] = m;
          });
          setSubjectMetrics(metricsMap);
        }
      } catch {
        // silent catch
      }
    };

    window.addEventListener('bq_settings_updated', handleSettingsUpdate);
    window.addEventListener('bq_stats_updated', handleStatsUpdate);

    return () => {
      clearInterval(metricsRefreshInterval);
      window.removeEventListener('bq_settings_updated', handleSettingsUpdate);
      window.removeEventListener('bq_stats_updated', handleStatsUpdate);
    };
  }, []);

  const selectedCategory = useMemo(() => {
    return curriculum.find((c) => c.id === selectedCategoryId) || null;
  }, [curriculum, selectedCategoryId]);

  const handleToggleComplete = useCallback(
    async (lessonId: string) => {
      if (!selectedCategory) return;
      const currentLesson = selectedCategory.lessons.find((l) => l.id === lessonId);
      if (!currentLesson) return;

      const nextStatus =
        currentLesson.status === 'completed' ? 'not-started' : 'completed';

      try {
        const updated = await updateLessonStatusAction(
          selectedCategory.title,
          lessonId,
          nextStatus
        );
        if (updated) {
          setCurriculum((prev) =>
            prev.map((cat) => {
              if (cat.title === selectedCategory.title) {
                return {
                  ...cat,
                  lessons: cat.lessons.map((l) =>
                    l.id === lessonId ? { ...l, status: nextStatus } : l
                  ),
                };
              }
              return cat;
            })
          );

          if (viewerModule && viewerModule.id === lessonId) {
            setViewerModule((prev) => (prev ? { ...prev, status: nextStatus } : null));
          }

          try {
            const metrics = await refreshStudyMetrics();
            if (metrics && Array.isArray(metrics)) {
              const metricsMap: Record<string, SubjectMetrics> = {};
              metrics.forEach((m: any) => {
                metricsMap[m.subject] = m;
              });
              setSubjectMetrics(metricsMap);
            }
          } catch {
            // silent catch
          }

          toast({
            title: nextStatus === 'completed' ? 'Module Completed ✓' : 'Module Reset',
            description:
              nextStatus === 'completed'
                ? 'Awesome work! Your subject completion bar has been updated.'
                : 'Module status reset to not started.',
          });
        }
      } catch {
        toast({
          variant: 'destructive',
          title: 'Action Failed',
          description:
            'Failed to update lesson status. Please check your connection and try again.',
        });
      }
    },
    [selectedCategory, viewerModule, toast]
  );

  const handleOpenViewer = useCallback(
    (lesson: CurriculumLesson) => {
      setViewerModule({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        fileUrls: lesson.fileUrls || [],
        order: lesson.order,
        status: lesson.status,
      });
      setIsViewerOpen(true);

      if (selectedCategory) {
        try {
          localStorage.setItem(
            'bq_last_studied',
            JSON.stringify({
              subject: selectedCategory.title,
              subjectId: selectedCategory.id,
              moduleId: lesson.id,
              moduleTitle: lesson.title,
              timestamp: Date.now(),
            })
          );
          window.dispatchEvent(new CustomEvent('bq_last_studied_updated'));
        } catch {
          // silent catch
        }
      }
    },
    [selectedCategory]
  );

  // Filter matching categories by search query
  const matchingCategories = useMemo(() => {
    if (!searchQuery.trim()) return curriculum;
    const q = searchQuery.toLowerCase();
    return curriculum.filter((cat) => {
      const matchesSubject = cat.title.toLowerCase().includes(q);
      const matchesModule = cat.lessons?.some(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.description && l.description.toLowerCase().includes(q)) ||
          (l.fileUrls && l.fileUrls.some((url: string) => url.toLowerCase().includes(q)))
      );
      return matchesSubject || matchesModule;
    });
  }, [curriculum, searchQuery]);

  // Auto-switch selected category if searching matches another subject
  useEffect(() => {
    if (searchQuery.trim() && matchingCategories.length > 0) {
      const isSelectedInMatching = matchingCategories.some(
        (c) => c.id === selectedCategoryId
      );
      if (!isSelectedInMatching) {
        setSelectedCategoryId(matchingCategories[0].id);
      }
    }
  }, [searchQuery, matchingCategories, selectedCategoryId]);

  return {
    mounted,
    focusSubject,
    curriculum,
    availableCategories,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    targetDates,
    subjectPlans,
    subjectMetrics,
    program,
    loading,
    activeTab,
    setActiveTab,
    rawPlans,
    searchQuery,
    setSearchQuery,
    viewerModule,
    setViewerModule,
    isViewerOpen,
    setIsViewerOpen,
    matchingCategories,
    refreshStudyPlans,
    handleToggleComplete,
    handleOpenViewer,
  };
}

