import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ArrowRight, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { useGenerateFullPlan } from '../hooks/useGeneratePlan';
import { usePlanStore } from '../store/planStore';
import Breadcrumbs from '../components/Breadcrumbs';
import { GENERATION_STEPS } from '../utils/constants';
import type { Plan } from '../types';

interface GenerateOption {
  id: string;
  label: string;
  Icon: React.ElementType;
  iconClass: string;
}

const generateOptions: GenerateOption[] = [
  { id: 'requirements', label: 'Requirements',  Icon: GENERATION_STEPS[0].Icon, iconClass: 'bg-orange-500' },
  { id: 'schema',       label: 'DB Schema',     Icon: GENERATION_STEPS[1].Icon, iconClass: 'bg-emerald-500' },
  { id: 'apis',         label: 'API List',       Icon: GENERATION_STEPS[2].Icon, iconClass: 'bg-violet-500' },
  { id: 'sprint',       label: 'Sprint Plan',    Icon: GENERATION_STEPS[3].Icon, iconClass: 'bg-blue-500' },
];

export default function IdeaInput() {
  const navigate = useNavigate();
  const setCurrentPlan = usePlanStore((s) => s.setCurrentPlan);
  const [idea, setIdea] = useState<string>('');
  const [selected, setSelected] = useState<string[]>(['requirements', 'schema', 'apis', 'sprint']);
  const [currentStep, setCurrentStep] = useState<number>(-1);

  const mutation = useGenerateFullPlan({
    onStepComplete: (stepIndex: number) => {
      setCurrentStep(stepIndex);
    },
    onSuccess: (plan: Plan | null) => {
      if (plan) {
        toast.success('Product plan generated successfully!');
        setCurrentPlan(plan._id, plan.idea);
        navigate(`/dashboard/${plan._id}`);
      }
    },
    onError: (error: Error) => {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to generate plan. Please try again.');
      setCurrentStep(-1);
    },
  });

  const toggleOption = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!idea.trim() || selected.length === 0) return;
    setCurrentStep(0);
    mutation.mutate({ idea: idea.trim(), selected });
  };

  const isGenerating = mutation.isPending;
  const selectedOptions = generateOptions.filter((opt) => selected.includes(opt.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 pb-24">
        <Breadcrumbs />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Lightbulb className="w-4 h-4" />
            New Product Idea
          </div>
          <h1 className="text-4xl font-heading font-extrabold text-primary-text tracking-tight mb-4">
            Describe Your Idea
          </h1>
          <p className="text-lg text-secondary-text leading-relaxed">
            Tell us about your product idea and we&apos;ll generate structured
            requirements, schemas, APIs, and sprint plans.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            /* ── Loading State ─────────────────────────────────── */
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-card-border rounded-2xl p-8 shadow-lg"
            >
              <div className="text-center mb-8">
                <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-heading font-bold text-primary-text mb-1">
                  Generating your product plan...
                </h2>
                <p className="text-sm text-secondary-text">
                  Our AI is analyzing your idea and creating structured outputs
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {selectedOptions.map((step, i) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      currentStep > i
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : currentStep === i
                        ? 'bg-accent/10 border border-accent/20'
                        : 'bg-background border border-card-border'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        currentStep > i
                          ? 'bg-emerald-500'
                          : currentStep === i
                          ? 'bg-accent'
                          : 'bg-card-border'
                      }`}
                    >
                      {currentStep > i ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : currentStep === i ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <step.Icon className="w-4 h-4 text-secondary-text" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        currentStep > i
                          ? 'text-emerald-500'
                          : currentStep === i
                          ? 'text-accent'
                          : 'text-secondary-text'
                      }`}
                    >
                      {step.label}
                    </span>
                    {currentStep > i && (
                      <span className="ml-auto text-xs text-emerald-500 font-semibold">Done</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ── Form ──────────────────────────────────────────── */
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-card border border-card-border rounded-2xl p-8 shadow-lg"
              onSubmit={handleSubmit}
            >
              <label className="block text-sm font-semibold text-primary-text mb-3" htmlFor="idea-input">
                Product Idea
              </label>
              <textarea
                id="idea-input"
                className="w-full min-h-[200px] p-4 px-5 border-[1.5px] border-card-border rounded-xl
                  text-base text-primary-text bg-background resize-y leading-relaxed
                  transition-all duration-300 placeholder:text-secondary-text
                  focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] focus:outline-none"
                placeholder="e.g. A mobile app for booking local home services like plumbing, electrical work, and cleaning. Users can browse service providers, view ratings, book appointments, and pay online..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                maxLength={2000}
              />
              <div className="text-right text-xs text-secondary-text mt-2">{idea.length}/2000</div>

              {/* Generation Options */}
              <label className="block text-sm font-semibold text-primary-text mb-3 mt-6">Generate Outputs</label>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 mb-6">
                {generateOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`flex items-center gap-3 p-4 border-[1.5px] rounded-xl cursor-pointer
                      transition-all duration-300 select-none
                      ${
                        selected.includes(opt.id)
                          ? 'border-accent bg-accent/5'
                          : 'border-card-border bg-background hover:border-gray-500 hover:bg-[#1C1C20]'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all duration-300
                      ${selected.includes(opt.id) ? 'bg-accent border-accent' : 'border-2 border-card-border'}`}
                    >
                      {selected.includes(opt.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${opt.iconClass}`}>
                      <opt.Icon className="w-[18px] h-[18px] text-white" />
                    </div>
                    <span className="text-sm font-semibold text-primary-text">{opt.label}</span>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!idea.trim() || selected.length === 0}
                  className="inline-flex items-center justify-center gap-2 font-semibold text-base
                    px-10 py-3.5 rounded-full bg-accent text-white
                    shadow-[0_2px_12px_rgba(79,70,229,0.4)]
                    hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)]
                    hover:-translate-y-0.5 transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Generate Plan
                  <ArrowRight className="w-[18px] h-[18px]" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
