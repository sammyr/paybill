'use client';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-primary" />
      <circle cx="12" cy="12" r="4" fill="currentColor" className="text-primary" />
    </svg>
  );
}
