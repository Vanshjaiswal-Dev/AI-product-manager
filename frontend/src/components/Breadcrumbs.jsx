import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-text mb-8 bg-card/40 border border-card-border px-3 py-1.5 rounded-full backdrop-blur-sm">
      <Link to="/dashboard" className="hover:text-primary-text transition-colors flex items-center gap-1.5">
        <Home className="w-3.5 h-3.5" />
        Home
      </Link>
      
      {pathnames.map((name, index) => {
        // Skip dynamic IDs in the breadcrumb for cleaner UI, or map them
        // For /dashboard/:id, the second part is just an ID. 
        // We'll just show "Dashboard" if it's the dashboard route.
        if (index > 0 && pathnames[0] === 'dashboard') {
          return null; // Skip rendering the ID part
        }

        const isLast = index === pathnames.length - 1 || (pathnames[0] === 'dashboard' && index === 0);
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        
        // Capitalize route name
        let label = name.charAt(0).toUpperCase() + name.slice(1);
        if (name === 'new') label = 'New Idea';

        return (
          <div key={name} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-card-border mx-0.5" />
            {isLast ? (
              <span className="text-primary-text">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-primary-text transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
