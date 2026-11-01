// A truffle breaking through the sand under a lightning bolt.
export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M23.5 2 16 15h5.5L17 25l10-13.5h-5.8L25 2z" fill="#f4e7a1" />
      <path d="M2 34c6-4.5 10.5-5.5 18-5.5S32 29.5 38 34v4H2z" fill="#e0794a" />
      <ellipse cx="20" cy="30" rx="8.5" ry="6" fill="#efe7d6" />
      <path d="M12.5 31.5c3 1.6 11.6 1.8 15 0" stroke="#c9b48e" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
