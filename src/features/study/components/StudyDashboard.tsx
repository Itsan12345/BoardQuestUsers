"use client";

import { normalizeSubjectName } from '@/lib/game-logic';
import { StudyScheduleTimeline } from '@/components/study/StudyScheduleTimeline';
import { ModuleViewerDialog } from '@/components/study/ModuleViewerDialog';
import { useStudyCurriculum } from '../hooks';
import { StudyLoading } from './StudyLoading';
import { StudyEmptyState } from './StudyEmptyState';
import { StudyHeader } from './StudyHeader';
import { SubjectSelectorList } from './SubjectSelectorList';
import { SubjectMetricsCard } from './SubjectMetricsCard';
import { SubjectLessonsList } from './SubjectLessonsList';

export function StudyDashboard() {
  const {
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
    isViewerOpen,
    setIsViewerOpen,
    matchingCategories,
    refreshStudyPlans,
    handleToggleComplete,
    handleOpenViewer,
  } = useStudyCurriculum();

  if (loading) {
    return <StudyLoading />;
  }

  if (!selectedCategory || curriculum.length === 0) {
    return <StudyEmptyState />;
  }

  const selectedMetric = selectedCategory
    ? subjectMetrics[selectedCategory.title] ||
      Object.values(subjectMetrics).find(
        (m) => m.subject?.trim().toLowerCase() === selectedCategory.title.trim().toLowerCase()
      ) ||
      Object.values(subjectMetrics).find(
        (m) =>
          m.subject &&
          normalizeSubjectName(m.subject).toLowerCase() ===
            normalizeSubjectName(selectedCategory.title).toLowerCase()
      )
    : undefined;

  const filteredLessons = (selectedCategory?.lessons || []).filter((l) => {
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

  return (
    <div className="min-h-full pb-20 lg:pb-12 bg-background">
      <StudyHeader
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
          }
        }}
        program={program}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {activeTab === 'timeline' ? (
        <main className="p-3.5 sm:p-5 xl:p-6 max-w-7xl mx-auto">
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
        <main className="p-3.5 sm:p-5 xl:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 xl:gap-8 max-w-7xl mx-auto">
          {/* Subjects Sidebar / Mobile Carousel Selector */}
          <SubjectSelectorList
            displayCurriculum={displayCurriculum}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            targetDates={targetDates}
            subjectPlans={subjectPlans}
            focusSubject={focusSubject}
            mounted={mounted}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />

          {/* Selected Discipline Details & Modules */}
          <section className="lg:col-span-8 space-y-5 sm:space-y-6">
            <SubjectMetricsCard
              selectedCategory={selectedCategory}
              subjectPlan={subjectPlans[selectedCategory.title]}
              metric={selectedMetric}
              mounted={mounted}
              onOpenTimeline={() => {
                setActiveTab('timeline');
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'timeline');
                  window.history.replaceState({}, '', url.toString());
                }
              }}
            />

            <SubjectLessonsList
              selectedCategory={selectedCategory}
              filteredLessons={filteredLessons}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              onOpenViewer={handleOpenViewer}
            />
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

