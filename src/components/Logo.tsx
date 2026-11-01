export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="tg" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f2d7a6" />
          <stop offset="60%" stopColor="#c98f52" />
          <stop offset="100%" stopColor="#7a4a2a" />
        </radialGradient>
      </defs>
      <path d="M2 31 Q12 24 20 29 T38 28 V38 H2 Z" fill="#d9a35b" opacity=".35" />
      <ellipse cx="20" cy="22" rx="11" ry="9.5" fill="url(#tg)" />
      <circle cx="16" cy="19" r="1.2" fill="#7a4a2a" opacity=".5" />
      <circle cx="23" cy="24" r="1" fill="#7a4a2a" opacity=".5" />
      <circle cx="21" cy="17" r=".8" fill="#7a4a2a" opacity=".5" />
      <path d="M30 6 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1z" fill="#f2b45a" />
    </svg>
  );
}
