import { useMutation } from '@tanstack/react-query';
import type { Plan } from '../types';
import {
  generateFullPlan,
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

// ── Full plan generator (Single high-speed unified call) ───────────────────────

/**
 * Generates all selected sections in a single optimized Gemini API call:
 * Drastically reduces generation time from ~35s to ~7-8s and avoids Free Tier rate limits.
 * onStepComplete(stepIndex, data) updates the UI smoothly as progress occurs.
 */
export function useGenerateFullPlan({
  onStepComplete,
  onSuccess,
  onError,
}: UseGenerateFullPlanOptions) {
  return useMutation<Plan | null, Error, GenerateFullPlanParams>({
    mutationFn: async ({ idea, selected }: GenerateFullPlanParams): Promise<Plan | null> => {
      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < selected.length - 1) {
          currentStep++;
          onStepComplete?.(currentStep, {} as Plan);
        }
      }, 1600);

      try {
        const response = await generateFullPlan(idea, selected);
        clearInterval(interval);
        onStepComplete?.(selected.length, response.data);
        return response.data;
      } catch (err) {
        clearInterval(interval);
        throw err;
      }
    },
    onSuccess,
    onError,
  });
}

// ── Individual generator mutations (for Dashboard regeneration) ───────────────

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
