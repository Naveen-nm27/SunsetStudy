/**
 * Brand wordmark — logo uses BungeeShade, variant controls colour scheme.
 * variant: default (app shell), gradient (vibrant hero on sunset strip)
 */
export default function BrandWordmark({ className = '' }) {
  // If className includes a text size, let it override. Otherwise, use huge default sizes.
  const hasSize = className.includes('text-');
  const size = hasSize ? '' : 'text-5xl sm:text-6xl md:text-7xl';
  const base = `tracking-tight leading-tight inline-block ${size} ${className}`;
  const logoStyle = { fontFamily: 'var(--font-logo)' };

  return (
    <span className={base} style={logoStyle}>
      <span className="text-sunset-deep dark:text-sunset-yellow">Sunset</span>
      <span className="text-sunset-orange dark:text-sunset-gold">Study</span>
    </span>
  );
}
