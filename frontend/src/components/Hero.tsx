import { Link } from 'react-router-dom';
import { Play, FileText, Database, Code2, CalendarDays, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

interface MockStep {
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
}

const mockSteps: MockStep[] = [
  { icon: FileText,     label: 'Requirements', color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  { icon: Database,     label: 'DB Schema',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Code2,        label: 'API List',     color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  { icon: CalendarDays, label: 'Sprint Plan',  color: 'text-blue-400',    bg: 'bg-blue-500/10' },
];

// Suppress unused import warning — Play is kept for potential future use
void Play;

export default function Hero() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section className="relative pt-[180px] pb-16 overflow-hidden min-h-[90vh] flex items-center justify-center" id="home">
      {/* Background orbs */}
      <div className="hero-gradient absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.06)_0%,transparent_60%)] blur-[100px] animate-float" />
        <div className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] bg-[radial-gradient(circle_at_center,rgba(67,56,202,0.05)_0%,transparent_60%)] blur-[100px] animate-float-reverse" />
      </div>

      <div className="relative z-10 text-center max-w-[720px] mx-auto px-6">
        {/* Headline */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
          }}
          className="text-[clamp(2.5rem,5vw,4.5rem)] font-heading leading-[1.1] text-primary-text mb-6 flex flex-wrap justify-center gap-x-[clamp(0.4rem,1.5vw,0.8rem)] gap-y-2"
        >
          {['Plan,', 'Build', '&', 'Ship', 'Products', 'with', 'AI.'].map((word, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 14, stiffness: 100 } },
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-lg text-secondary-text max-w-[540px] mx-auto mb-10 leading-relaxed"
        >
          Turn raw product ideas into structured requirements, database schemas,
          API blueprints, and sprint plans — powered by AI.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.95 }}
          className="flex items-center justify-center gap-4 max-sm:flex-col"
        >
          <Link
            to={isAuthenticated ? '/new' : '/login'}
            className="inline-flex items-center justify-center gap-2 font-semibold text-base
              px-10 py-3.5 rounded-full bg-accent text-white
              shadow-[0_2px_12px_rgba(79,70,229,0.4)]
              hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)]
              hover:-translate-y-0.5 transition-all duration-300 max-sm:w-full"
          >
            Get Started
          </Link>
        </motion.div>

        {/* Product Flow Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-20 relative mx-auto w-full max-w-[900px]"
        >
          <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />

          <div className="relative bg-card/30 backdrop-blur-3xl border border-white/10 rounded-2xl p-1 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-background/50 rounded-t-xl">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="mx-auto bg-card/50 text-secondary-text text-xs font-mono px-4 py-1 rounded-full border border-white/5">
                planify.ai/dashboard
              </div>
            </div>

            <div className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-background/20 rounded-b-xl">
              {/* Idea Input */}
              <div className="bg-background/80 border border-white/5 rounded-xl p-5 w-full md:w-[280px] shrink-0 text-left relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-violet-500" />
                <div className="text-sm font-semibold text-primary-text mb-2">Raw Idea</div>
                <div className="text-sm text-secondary-text leading-relaxed font-mono mt-3">
                  &ldquo;I want to build a fitness app that tracks workouts and generates custom meal plans using AI.&rdquo;
                </div>
                <div className="h-1 bg-card-border rounded-full mt-6 overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                    className="h-full bg-accent/60 rounded-full"
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col gap-2 relative shrink-0">
                <ArrowRight className="w-6 h-6 text-accent hidden md:block animate-pulse" />
                <div className="md:hidden h-8 w-px bg-accent mx-auto opacity-50" />
              </div>

              {/* Generated Outputs */}
              <div className="grid grid-cols-2 gap-4 w-full">
                {mockSteps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5 + idx * 0.15, duration: 0.5 }}
                    className="bg-card/80 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col gap-4 relative group shadow-lg hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-9 h-9 rounded-lg ${step.bg} border border-white/5 flex items-center justify-center shadow-inner`}>
                        <step.icon className={`w-4 h-4 ${step.color}`} />
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500/80" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-primary-text mb-2">{step.label}</div>
                      <div className="space-y-2 w-full">
                        <div className="h-1.5 w-full bg-card-border rounded-full opacity-50" />
                        <div className="h-1.5 w-4/5 bg-card-border rounded-full opacity-50" />
                        <div className="h-1.5 w-full bg-card-border rounded-full opacity-50" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
