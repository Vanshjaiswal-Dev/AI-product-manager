import { useMutation } from '@tanstack/react-query';
import type { Plan } from '../types';
import {
  generateRequirements,
  generateSchema,
  generateApis,
  generateSprintPlan,
} from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseGenerateFullPlanOptions {
  onStepComplete?: (stepIndex: number, data: Plan) => void;
  onSuccess?: (data: Plan | null) => void;
  onError?: (error: Error) => void;
}

interface GenerateFullPlanParams {
  idea: string;
  selected: string[];
}

interface SingleGenerateParams {
  idea: string;
  planId?: string;
}

// ── Full plan generator (chains all 4 steps) ──────────────────────────────────

/**
 * Chains all selected generators sequentially:
 * 1. generate-requirements → creates Plan doc, returns planId
 * 2. generate-schema       → updates same Plan doc
 * 3. generate-apis         → updates same Plan doc
 * 4. generate-sprint-plan  → updates same Plan doc
 *
 * onStepComplete(stepIndex, data) is called after each step so the UI
 * can show progress (e.g. "Generating schema... 2/4").
 */
export function useGenerateFullPlan({
  onStepComplete,
  onSuccess,
  onError,
}: UseGenerateFullPlanOptions) {
  return useMutation<Plan | null, Error, GenerateFullPlanParams>({
    mutationFn: async ({ idea, selected }: GenerateFullPlanParams): Promise<Plan | null> => {
      let planId: string | undefined;
      let finalData: Plan | null = null;
      let stepsCompleted = 0;

      if (selected.includes('requirements')) {
        const reqResult = await generateRequirements(idea);
        planId = reqResult.data._id;
        finalData = reqResult.data;
        stepsCompleted++;
        onStepComplete?.(stepsCompleted, reqResult.data);
      }

      if (selected.includes('schema')) {
        const schemaResult = await generateSchema(idea, planId);
        planId = schemaResult.data._id;
        finalData = schemaResult.data;
        stepsCompleted++;
        onStepComplete?.(stepsCompleted, schemaResult.data);
      }

      if (selected.includes('apis')) {
        const apisResult = await generateApis(idea, planId);
        planId = apisResult.data._id;
        finalData = apisResult.data;
        stepsCompleted++;
        onStepComplete?.(stepsCompleted, apisResult.data);
      }

      if (selected.includes('sprint')) {
        const sprintResult = await generateSprintPlan(idea, planId);
        planId = sprintResult.data._id;
        finalData = sprintResult.data;
        stepsCompleted++;
        onStepComplete?.(stepsCompleted, sprintResult.data);
      }

      return finalData;
    },
    onSuccess,
    onError,
  });
}

// ── Individual generator mutations ────────────────────────────────────────────

export function useGenerateRequirements() {
  return useMutation({
    mutationFn: ({ idea, planId }: SingleGenerateParams) =>
      generateRequirements(idea, planId),
  });
}

export function useGenerateSchema() {
  return useMutation({
    mutationFn: ({ idea, planId }: SingleGenerateParams) =>
      generateSchema(idea, planId),
  });
}

export function useGenerateApis() {
  return useMutation({
    mutationFn: ({ idea, planId }: SingleGenerateParams) =>
      generateApis(idea, planId),
  });
}

export function useGenerateSprintPlan() {
  return useMutation({
    mutationFn: ({ idea, planId }: SingleGenerateParams) =>
      generateSprintPlan(idea, planId),
  });
}
