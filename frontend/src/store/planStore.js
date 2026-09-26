import { create } from 'zustand';

export const usePlanStore = create((set) => ({
  currentPlanId: null,
  currentIdea: '',

  setCurrentPlan: (id, idea) =>
    set({ currentPlanId: id, currentIdea: idea }),

  clearPlan: () =>
    set({ currentPlanId: null, currentIdea: '' }),
}));
