import { useMutation } from '@tanstack/react-query';
import {
  generateRequirements,
  generateSchema,
  generateApis,
  generateSprintPlan,
} from '../services/api';

/**
 * Chains all 4 generators sequentially:
 * 1. generate-requirements → creates Plan doc, returns planId
 * 2. generate-schema → updates same Plan doc
 * 3. generate-apis → updates same Plan doc
 * 4. generate-sprint-plan → updates same Plan doc
 *
 * onStepComplete(stepIndex, data) is called after each step so the UI
 * can show progress (e.g. "Generating schema... 2/4").
 */
export function useGenerateFullPlan({ onStepComplete, onSuccess, onError }) {
  return useMutation({
    mutationFn: async ({ idea, selected }) => {
      let planId = null;
      let finalData = null;
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

      return finalData; // final complete Plan
    },
    onSuccess,
    onError,
  });
}

/**
 * Individual generator mutations for re-generating a single section
 * from the Dashboard page.
 */
export function useGenerateRequirements() {
  return useMutation({
    mutationFn: ({ idea, planId }) => generateRequirements(idea, planId),
  });
}

export function useGenerateSchema() {
  return useMutation({
    mutationFn: ({ idea, planId }) => generateSchema(idea, planId),
  });
}

export function useGenerateApis() {
  return useMutation({
    mutationFn: ({ idea, planId }) => generateApis(idea, planId),
  });
}

export function useGenerateSprintPlan() {
  return useMutation({
    mutationFn: ({ idea, planId }) => generateSprintPlan(idea, planId),
  });
}
