interface IconProps {
  name: 'check' | 'chevron';
  className?: string;
}

/** Minimal line icons (currentColor, decorative) so symbols render the same on every platform. */
export function Icon({ name, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`inline-block shrink-0 ${className}`}
    >
      {name === 'check' ? <path d="M3 8.5l3.2 3L13 4.5" /> : <path d="M3.5 6l4.5 4.5L12.5 6" />}
    </svg>
  );
}
