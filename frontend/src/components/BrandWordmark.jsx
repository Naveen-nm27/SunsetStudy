/**
 * Brand wordmark — logo uses BungeeShade, variant controls colour scheme.
 * variant: default (app shell), gradient (vibrant hero on sunset strip)
 */
export default function BrandWordmark({ variant = 'default', className = '' }) {
  const size =
    'text-[clamp(13px,3.2vw,17px)] sm:text-[clamp(14px,2.8vw,18px)] md:text-[1.125rem]';
  const base = `tracking-tight leading-tight inline-block ${size} ${className}`;
  const logoStyle = { fontFamily: 'var(--font-logo)' };

  if (variant === 'gradient') {
    return (
      <span className={base} style={logoStyle}>
        <span className="text-[#f8b51b] drop-shadow-[2px_2px_0_#2f1a72]">Sunset</span>
        <span className="text-white drop-shadow-[2px_2px_0_#4f1d6e]">Study</span>
      </span>
    );
  }

  return (
    <span className={base} style={logoStyle}>
      <span className="text-sunset-deep dark:text-sunset-yellow">Sunset</span>
      <span className="text-sunset-orange dark:text-sunset-gold">Study</span>
    </span>
  );
}
