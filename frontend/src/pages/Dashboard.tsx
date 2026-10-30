import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { usePlan } from '../hooks/usePlans';
import {
  useGenerateRequirements,
  useGenerateSchema,
  useGenerateApis,
  useGenerateSprintPlan,
} from '../hooks/useGeneratePlan';
import Breadcrumbs from '../components/Breadcrumbs';
import { DASHBOARD_TABS, CARD_BORDERS, METHOD_COLORS } from '../utils/constants';

type TabId = 'requirements' | 'schema' | 'apis' | 'sprint';

interface EmptySectionProps {
  label: string;
  isGenerating: boolean;
  onGenerate: () => void;
}

function EmptySection({ label, isGenerating, onGenerate }: EmptySectionProps) {
  return (
    <div className="text-center py-16 bg-card border border-card-border rounded-xl">
      <AlertCircle className="w-12 h-12 text-secondary-text mx-auto mb-4" />
      <h3 className="text-lg font-heading font-bold text-primary-text mb-1">{label} not generated yet</h3>
      <p className="text-sm text-secondary-text mb-6">
        This section was not generated during the initial plan creation.
      </p>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="inline-flex items-center justify-center gap-2 font-semibold text-sm
          px-6 py-2.5 rounded-full bg-accent text-white
          shadow-[0_2px_8px_rgba(249,115,22,0.3)]
          hover:bg-accent-hover hover:-translate-y-0.5 transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          `Generate ${label}`
        )}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('requirements');
  const queryClient = useQueryClient();
  const { data, isLoading, error } = usePlan(id);

  const reqMutation = useGenerateRequirements();
  const schemaMutation = useGenerateSchema();
  const apisMutation = useGenerateApis();
  const sprintMutation = useGenerateSprintPlan();

  const handleGenerate = (sectionId: TabId) => {
    if (!plan) return;
    const mutationMap = {
      requirements: reqMutation,
      schema: schemaMutation,
      apis: apisMutation,
      sprint: sprintMutation,
    };

    mutationMap[sectionId].mutate(
      { idea: plan.idea, planId: plan._id },
      {
        onSuccess: () => {
          toast.success('Generated successfully!');
          queryClient.invalidateQueries({ queryKey: ['plan', id] });
        },
        onError: (err: Error) => {
          const axiosError = err as AxiosError<{ message?: string }>;
          toast.error(axiosError.response?.data?.message || 'Failed to generate.');
        },
      }
    );
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-20 px-6">
          <div className="w-[72px] h-[72px] rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-primary-text mb-3">No product plan yet</h2>
          <p className="text-base text-secondary-text mb-8 max-w-sm mx-auto">
            You haven&apos;t generated or selected any product plan. Start by describing your first idea.
          </p>
          <Link
            to="/new"
            className="inline-flex items-center justify-center gap-2 font-semibold text-sm
              px-8 py-3 rounded-full bg-accent text-white
              shadow-[0_2px_12px_rgba(79,70,229,0.4)]
              hover:bg-accent-hover transition-all duration-300"
          >
            + New Idea
          </Link>
        </div>
      </div>
    );
  }

  const plan = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
          <p className="text-lg font-semibold text-primary-text">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    const axiosError = error as AxiosError<{ message?: string }> | null;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold text-primary-text mb-2">Plan not found</h2>
          <p className="text-sm text-secondary-text mb-6">
            {axiosError?.response?.data?.message || 'Could not load this plan.'}
          </p>
          <Link to="/history" className="inline-flex items-center gap-2 text-accent font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Link>
        </div>
      </div>
    );
  }

  const renderRequirements = () => {
    const req = plan.requirements;
    if (!req) {
      return (
        <EmptySection
          label="Requirements"
          isGenerating={reqMutation.isPending}
          onGenerate={() => handleGenerate('requirements')}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {/* Features */}
        <div className="bg-card border border-card-border rounded-xl p-6 border-l-[3px] border-l-orange-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-heading font-bold text-primary-text">Features</h3>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent">
              {req.features?.length || 0} items
            </span>
          </div>
          <div className="text-sm text-secondary-text leading-relaxed">
            <ul className="flex flex-col gap-2 mt-3">
              {req.features?.map((f, i) => (
                <li
                  key={i}
                  className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* User Stories */}
        <div className="bg-card border border-card-border rounded-xl p-6 border-l-[3px] border-l-emerald-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-heading font-bold text-primary-text">User Stories</h3>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              {req.userStories?.length || 0} stories
            </span>
          </div>
          <div className="text-sm text-secondary-text leading-relaxed">
            <ul className="flex flex-col gap-2 mt-3">
              {req.userStories?.map((s, i) => (
                <li
                  key={i}
                  className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-500"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderSchema = () => {
    const schema = plan.schema;
    if (!schema?.tables?.length) {
      return (
        <EmptySection
          label="Schema"
          isGenerating={schemaMutation.isPending}
          onGenerate={() => handleGenerate('schema')}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {schema.tables.map((table, i) => (
          <div
            key={i}
            className={`bg-card border border-card-border rounded-xl p-6 border-l-[3px] ${
              CARD_BORDERS[i % CARD_BORDERS.length]
            } hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-heading font-bold text-primary-text">{table.tableName}</h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent">
                {table.fields?.length || 0} fields
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-sm font-bold text-primary-text bg-background border-b border-card-border">
                      Field
                    </th>
                    <th className="text-left p-3 text-sm font-bold text-primary-text bg-background border-b border-card-border">
                      Type
                    </th>
                    <th className="text-left p-3 text-sm font-bold text-primary-text bg-background border-b border-card-border">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.fields?.map((field, j) => (
                    <tr key={j} className="border-b border-card-border last:border-0">
                      <td className="p-3 text-sm font-semibold text-primary-text">{field.name}</td>
                      <td className="p-3">
                        <span className="font-mono text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                          {field.type}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-secondary-text">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderApis = () => {
    const apis = plan.apis;
    if (!apis?.endpoints?.length) {
      return (
        <EmptySection
          label="APIs"
          isGenerating={apisMutation.isPending}
          onGenerate={() => handleGenerate('apis')}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {apis.endpoints.map((api, i) => (
          <div key={i} className="bg-card border border-card-border rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`inline-flex text-xs font-bold px-2.5 py-1 rounded font-mono tracking-wide ${
                  METHOD_COLORS[api.method] || 'bg-background border border-card-border text-secondary-text'
                }`}
              >
                {api.method}
              </span>
              <span className="font-mono text-sm text-primary-text bg-background border border-card-border px-2 py-0.5 rounded">
                {api.endpoint}
              </span>
            </div>
            <p className="text-sm text-secondary-text">{api.description}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderSprints = () => {
    const sp = plan.sprintPlan;
    if (!sp?.sprints?.length) {
      return (
        <EmptySection
          label="Sprint Plan"
          isGenerating={sprintMutation.isPending}
          onGenerate={() => handleGenerate('sprint')}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {sp.sprints.map((sprint, i) => (
          <div
            key={i}
            className={`bg-card border border-card-border rounded-xl p-6 border-l-[3px] ${
              CARD_BORDERS[i % CARD_BORDERS.length]
            } hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-bold text-primary-text">{sprint.sprintName}</h3>
              <span className="text-sm text-secondary-text">{sprint.duration}</span>
            </div>
            <div className="flex flex-col gap-3">
              {sprint.tasks?.map((task, j) => (
                <div key={j} className="flex items-center gap-3 p-3 bg-background border border-card-border rounded-lg">
                  <span className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">
                    {j + 1}
                  </span>
                  <span className="text-sm font-medium text-primary-text">{task}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const panels: Record<TabId, () => React.ReactNode> = {
    requirements: renderRequirements,
    schema: renderSchema,
    apis: renderApis,
    sprint: renderSprints,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-6 py-8 pb-16">
        <Breadcrumbs />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 mb-2 max-md:flex-col">
            <h1 className="text-3xl font-heading font-extrabold text-primary-text tracking-tight">Product Plan</h1>
            <span className="text-sm text-secondary-text">
              {plan.createdAt &&
                new Date(plan.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
            </span>
          </div>
          <p className="text-base text-secondary-text leading-relaxed max-w-[700px] mt-2">{plan.idea}</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-2 border-b-2 border-card-border mb-8 overflow-x-auto"
        >
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap
                border-b-2 -mb-[2px] rounded-t-lg cursor-pointer transition-all duration-300
                ${
                  activeTab === tab.id
                    ? 'text-accent border-b-accent bg-card'
                    : 'text-secondary-text border-b-transparent hover:text-primary-text hover:bg-card'
                }`}
            >
              <span className={`w-7 h-7 rounded-md flex items-center justify-center ${tab.iconBg}`}>
                <tab.Icon className="w-3.5 h-3.5 text-white" />
              </span>
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {panels[activeTab]?.()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
