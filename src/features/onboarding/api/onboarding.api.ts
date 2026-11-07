import { saveStudyPlan } from '@/app/actions/study-plan';

export async function saveStudyPlanAction(targets: Record<string, Date>) {
  return saveStudyPlan(targets);
}

