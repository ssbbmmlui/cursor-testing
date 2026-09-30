export function PlatformMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}
