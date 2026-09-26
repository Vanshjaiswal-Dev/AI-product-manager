import { MessageCircle, Code2, Briefcase } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="pt-16 pb-8 bg-background border-t border-card-border">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Top */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12 max-md:grid-cols-2 max-md:gap-8">
          {/* Brand */}
          <div className="max-w-[280px] max-md:col-span-2">
            <div className="flex items-center gap-3 font-heading text-2xl font-bold text-primary-text mb-4 tracking-wide">
              <Logo />
              Planify
            </div>
            <p className="text-sm text-secondary-text leading-relaxed">
              Turn raw ideas into structured product plans with the power of AI.
              Requirements, schemas, APIs, and sprints — all in one place.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-bold text-primary-text uppercase tracking-wider mb-4">Product</h4>
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-sm text-secondary-text hover:text-accent transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-secondary-text hover:text-accent transition-colors">Pricing</a>
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">Changelog</a>
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">Roadmap</a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-bold text-primary-text uppercase tracking-wider mb-4">Resources</h4>
            <div className="flex flex-col gap-3">
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">Documentation</a>
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">API Reference</a>
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">Blog</a>
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">Community</a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold text-primary-text uppercase tracking-wider mb-4">Company</h4>
            <div className="flex flex-col gap-3">
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">About</a>
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">Careers</a>
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">Contact</a>
              <a href="#" className="text-sm text-secondary-text hover:text-accent transition-colors">Privacy</a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-card-border flex items-center justify-between max-md:flex-col max-md:gap-4 max-md:text-center">
          <p className="text-sm text-secondary-text">
            &copy; {new Date().getFullYear()} Planify. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { Icon: MessageCircle, label: 'Twitter' },
              { Icon: Code2, label: 'GitHub' },
              { Icon: Briefcase, label: 'LinkedIn' },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-9 h-9 rounded-full bg-card flex items-center justify-center
                  transition-all duration-300 hover:bg-accent hover:text-white text-secondary-text border border-card-border"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
