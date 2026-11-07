"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchPerformanceInitialData,
  fetchPerformanceRefreshedData,
  fetchUserSettingsActionSafe,
  fetchUserStatsActionSafe,
} from '../api';
import {
  calculateFullMastery,
  calculateRadarData,
  calculateSummaryStats,
  findNextObjective,
  calculateDaysRemaining,
} from '../utils';
import type {
  SubjectAccuracyHistoryItem,
  NextObjective,
} from '../types';

export function usePerformanceData() {
  const [user, setUser] = useState<any>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [subjectMetrics, setSubjectMetrics] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [nextObjective, setNextObjective] = useState<NextObjective | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<SubjectAccuracyHistoryItem[]>([]);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadInitialData = useCallback(async () => {
    try {
      const { stats, plans, metrics, dbCategories, historyData, settings } =
        await fetchPerformanceInitialData();

      setUser(stats);
      setUserSettings(settings);
      setSubjectMetrics(metrics);
      setPerformanceHistory(historyData);

      const fetchedCategoryNames =
        dbCategories && dbCategories.length > 0
          ? dbCategories.map((c: any) => c.name)
          : metrics && metrics.length > 0
          ? metrics.map((m: any) => m.subject)
          : [];

      setCategories(fetchedCategoryNames);

      const objective = findNextObjective(plans);
      if (objective) {
        setNextObjective(objective);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Listen for setting and stats updates across the app
    const handleSettingsUpdated = async () => {
      const settings = await fetchUserSettingsActionSafe();
      if (settings) setUserSettings(settings);
    };

    const handleStatsUpdated = async () => {
      try {
        const [stats, { metrics, historyData, settings }] = await Promise.all([
          fetchUserStatsActionSafe(),
          fetchPerformanceRefreshedData(),
        ]);
        if (stats) setUser(stats);
        if (metrics) setSubjectMetrics(metrics);
        if (historyData) setPerformanceHistory(historyData);
        if (settings) setUserSettings(settings);
      } catch (err) {
        console.error('Failed to update stats/settings:', err);
      }
    };

    window.addEventListener('bq_settings_updated', handleSettingsUpdated);
    window.addEventListener('bq_stats_updated', handleStatsUpdated);

    // Refresh metrics every 30 seconds
    const metricsRefreshInterval = setInterval(async () => {
      try {
        const { metrics, historyData, settings } = await fetchPerformanceRefreshedData();
        setSubjectMetrics(metrics);
        if (historyData) setPerformanceHistory(historyData);
        if (settings) setUserSettings(settings);
      } catch (err) {
        console.error('Failed to refresh performance metrics:', err);
      }
    }, 30000);

    return () => {
      window.removeEventListener('bq_settings_updated', handleSettingsUpdated);
      window.removeEventListener('bq_stats_updated', handleStatsUpdated);
      clearInterval(metricsRefreshInterval);
    };
  }, [loadInitialData]);

  // Derived state
  const fullMastery = useMemo(() => {
    return calculateFullMastery(categories, subjectMetrics);
  }, [categories, subjectMetrics]);

  const radarData = useMemo(() => {
    return calculateRadarData(fullMastery);
  }, [fullMastery]);

  const summaryStats = useMemo(() => {
    return calculateSummaryStats(fullMastery, user?.xp || 0, performanceHistory);
  }, [fullMastery, user?.xp, performanceHistory]);

  const daysRemaining = useMemo(() => {
    return calculateDaysRemaining(nextObjective);
  }, [nextObjective]);

  return {
    user,
    setUser,
    userSettings,
    setUserSettings,
    subjectMetrics,
    categories,
    nextObjective,
    loading,
    performanceHistory,
    scorecardOpen,
    setScorecardOpen,
    settingsOpen,
    setSettingsOpen,
    fullMastery,
    radarData,
    summaryStats,
    daysRemaining,
  };
}

