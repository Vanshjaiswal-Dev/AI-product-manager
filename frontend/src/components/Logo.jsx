export default function Logo({ className = "w-8 h-8 text-accent" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="4" width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.1" />
      <path d="M12 9V23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path 
        d="M12 9H17.5C20.5376 9 23 11.4624 23 14.5C23 17.5376 20.5376 20 17.5 20H12" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
