import { motion } from 'framer-motion';
import { STATS } from '../utils/constants';

export default function Stats() {
  return (
    <section className="py-12 border-y border-card-border bg-background" id="stats">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="flex items-center justify-center max-sm:flex-col max-sm:gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`flex-1 text-center px-8 py-4 relative
                max-sm:px-0 max-sm:py-4
                ${i < STATS.length - 1 ? 'after:content-[\'\'] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-12 after:bg-card-border max-sm:after:w-12 max-sm:after:h-px max-sm:after:right-auto max-sm:after:left-1/2 max-sm:after:top-auto max-sm:after:bottom-0 max-sm:after:-translate-x-1/2 max-sm:after:translate-y-0' : ''}
              `}
            >
              <div className="text-[clamp(2rem,4vw,2.75rem)] font-heading text-primary-text tracking-tight leading-tight">
                {stat.number}
              </div>
              <div className="text-sm text-secondary-text mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
