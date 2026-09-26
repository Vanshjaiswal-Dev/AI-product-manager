import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, FileText, Database, Code2, CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { usePlans } from '../hooks/usePlans';
import { usePlanStore } from '../store/planStore';
import Breadcrumbs from '../components/Breadcrumbs';

const sectionIcons = {
  requirements: { chipClass: 'bg-orange-500/10 border border-orange-500/20 text-orange-400',  label: 'Reqs',   Icon: FileText },
  schema:       { chipClass: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',  label: 'Schema', Icon: Database },
  apis:         { chipClass: 'bg-violet-500/10 border border-violet-500/20 text-violet-400', label: 'APIs',   Icon: Code2 },
  sprintPlan:   { chipClass: 'bg-blue-500/10 border border-blue-500/20 text-blue-400',       label: 'Sprint', Icon: CalendarDays },
};

const topBorders = [
  'border-t-orange-500',
  'border-t-emerald-500',
  'border-t-violet-500',
  'border-t-blue-500',
];

export default function History() {
  const navigate = useNavigate();
  const setCurrentPlan = usePlanStore((s) => s.setCurrentPlan);
  const { data, isLoading, error } = usePlans();

  const plans = data?.data || [];

  const handleCardClick = (plan) => {
    setCurrentPlan(plan._id, plan.idea);
    navigate(`/dashboard/${plan._id}`);
  };

  // Determine which sections a plan has generated
  const getSections = (plan) => {
    const sections = [];
    if (plan.requirements) sections.push('requirements');
    if (plan.schema) sections.push('schema');
    if (plan.apis) sections.push('apis');
    if (plan.sprintPlan) sections.push('sprintPlan');
    return sections;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
          <p className="text-lg font-semibold text-primary-text">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold text-primary-text mb-2">Failed to load history</h2>
          <p className="text-sm text-secondary-text">{error.response?.data?.message || 'Something went wrong.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-6 py-8 pb-16">
        <Breadcrumbs />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8 max-sm:flex-col max-sm:items-start max-sm:gap-4"
        >
          <h1 className="text-3xl font-heading font-extrabold text-primary-text">Generation History</h1>
        </motion.div>

        {plans.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-[72px] h-[72px] rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-heading font-bold text-primary-text mb-2">No history yet</h2>
            <p className="text-sm text-secondary-text mb-6">
              Start by creating your first product plan. Your past generations will appear here.
            </p>
            <Link
              to="/new"
              className="inline-flex items-center justify-center gap-2 font-semibold text-sm
                px-8 py-3 rounded-full bg-accent text-white
                shadow-[0_2px_12px_rgba(79,70,229,0.4)]
                hover:bg-accent-hover transition-all duration-300"
            >
              Create Your First Plan
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5 max-sm:grid-cols-1">
            {plans.map((plan, i) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onClick={() => handleCardClick(plan)}
                className={`bg-card border border-card-border rounded-xl p-6 cursor-pointer
                  transition-all duration-300 relative overflow-hidden
                  border-t-[3px] ${topBorders[i % topBorders.length]}
                  hover:border-gray-500 hover:shadow-lg hover:-translate-y-1`}
              >
                <div className="text-xs text-secondary-text mb-3">
                  {new Date(plan.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                <div className="text-base font-medium text-primary-text leading-snug mb-4 line-clamp-3">
                  {plan.idea}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {getSections(plan).map((sec) => {
                    const info = sectionIcons[sec];
                    if (!info) return null;
                    return (
                      <span key={sec} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${info.chipClass}`}>
                        <info.Icon className="w-3 h-3" />
                        {info.label}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
