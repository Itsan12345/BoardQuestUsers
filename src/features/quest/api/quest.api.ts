import { getQuestQuestions } from '@/app/actions/arena';
import { completeQuest, getNodeClearsAction, saveNodeClearAction } from '@/app/actions/quest';
import { getCategories, getSubjectTopicMasteryAction, type TopicMasteryDetail } from '@/app/actions/study';
import {
  getUserProfile,
  saveUserInventory,
  purchaseReagentAction,
  getUserSettingsAction,
  saveUserSettingsAction,
  saveArenaOnboardingAction,
} from '@/app/actions/user';
import { provideExamFeedback } from '@/ai/flows/provide-exam-feedback';

export const questApi = {
  getQuestions: getQuestQuestions,
  completeQuest,
  getNodeClears: getNodeClearsAction,
  saveNodeClear: saveNodeClearAction,
  getCategories,
  getTopicMastery: getSubjectTopicMasteryAction,
  getUserProfile,
  saveUserInventory,
  purchaseReagent: purchaseReagentAction,
  getUserSettings: getUserSettingsAction,
  saveUserSettings: saveUserSettingsAction,
  saveArenaOnboarding: saveArenaOnboardingAction,
  provideExamFeedback,
};

export type { TopicMasteryDetail };

