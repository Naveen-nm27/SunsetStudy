import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Headphones, Gamepad2, Sparkles, ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import BrandWordmark from '../components/BrandWordmark';

export default function LandingPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const enterHref = token ? '/dashboard/memory' : '/register';
  const enterLabel = token ? 'Open app' : 'Start free';
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing-root dark min-h-screen relative w-full flex flex-col overflow-x-hidden bg-bg-base text-text-main">
      <div className="landing-night-sky" aria-hidden />
      <div className="sunset-atmosphere" aria-hidden />
      <div className="lofi-grain" aria-hidden />
      <div
        className="hidden dark:block fixed inset-0 -z-[8] pointer-events-none opacity-[0.5]"
        style={{
          background:
            'radial-gradient(ellipse 120% 80% at 20% 10%, #f8b51b22, transparent 50%), radial-gradient(ellipse 90% 60% at 90% 90%, #2f1a72cc, transparent 55%)',
        }}
      />

      <header className="relative z-20 pt-6 md:pt-10 px-5 md:px-12 flex flex-wrap justify-between items-center gap-4 max-w-6xl w-full mx-auto">
        <Link to="/" className="group flex items-center gap-3 shrink-0">
          <BrandWordmark className="group-hover:opacity-90 transition-opacity" />
        </Link>
        <div className="flex items-center gap-2 md:gap-3 font-sans text-base">

          <Link
            to="/login"
            className="px-4 py-2.5 rounded-xl font-medium tracking-tight border-2 border-border-color bg-bg-elevated/90 text-text-main hover:bg-bg-card transition-colors dark:border-white/15 dark:bg-transparent dark:text-white/95 dark:hover:bg-white/10"
          >
            Log in
          </Link>
          <Link
            to={enterHref}
            className="fun-button text-sm md:text-base py-2.5 px-5 md:px-6 !shadow-[4px_4px_0_var(--c-shadow-deep)] border-2 border-[color-mix(in_srgb,var(--sun-gold)_45%,transparent)] dark:!shadow-[4px_4px_0_#1a0d28] dark:border-[#f8b51b]/40"
          >
            {enterLabel}
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl w-full mx-auto px-5 md:px-12 pb-24 pt-10 md:pt-16 flex flex-col gap-16 md:gap-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-6"
          >
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-border-color bg-bg-elevated/95 px-4 py-2.5 font-mono text-base md:text-lg tracking-wide text-sunset-orange shadow-sm dark:border-[#f8b51b]/35 dark:bg-black/25 dark:text-[#f8b51b]">
              <Gamepad2 className="w-5 h-5 shrink-0 opacity-90" />
              Lofi study quest
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-sunset-deep dark:text-white leading-[1.12] tracking-tight drop-shadow-sm dark:drop-shadow-lg">
              Spaced Repetition Made Beautiful{' '}
              <span className="text-sunset-orange dark:text-[#f8b51b] not-italic">Study Smarter.</span>
              <br />
              <span className="text-text-muted dark:text-white/90 font-normal text-3xl sm:text-4xl md:text-5xl">
               “Sunset Your Stress, Not Your Memory.”
              </span>
            </h1>
            <p className="text-lg md:text-xl text-text-muted dark:text-white/80 max-w-xl leading-relaxed font-sans font-normal tracking-tight">
              A calm planner with retro soul: spaced repetition, session memory maps, and a timeline that feels like a
              cozy RPG pause menu.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to={enterHref} className="fun-button inline-flex items-center gap-2 text-base md:text-lg !px-7">
                {enterLabel} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/dashboard/memory"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-border-strong bg-bg-elevated px-6 py-3.5 text-base font-medium text-text-main tracking-tight hover:bg-bg-card transition-colors dark:border-white/25 dark:bg-black/20 dark:text-white/95 dark:hover:bg-black/30"
              >
                <Sparkles className="w-4 h-4 text-sunset-orange dark:text-[#f8b51b]" />
                See memory view
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="relative"
          >
            <div className="rounded-2xl border-4 border-border-strong bg-bg-card/95 p-1 shadow-[12px_12px_0_var(--c-shadow-deep)] ring-1 ring-sunset-yellow/15 backdrop-blur-md dark:border-[#2f1a72] dark:bg-[#0f0818]/85 dark:shadow-[12px_12px_0_#12081c]">
              <div className="rounded-xl overflow-hidden bg-bg-base border border-border-color dark:bg-[#120a1c] dark:border-[#4f1d6e]/80">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border-color bg-bg-elevated dark:border-[#4f1d6e]/60 dark:bg-[#2f1a72]/50">
                  <span className="h-2.5 w-2.5 rounded-full bg-sunset-pink" />
                  <span className="h-2.5 w-2.5 rounded-full bg-sunset-yellow" />
                  <span className="h-2.5 w-2.5 rounded-full bg-sunset-purple" />
                  <span className="ml-auto font-mono text-sunset-orange dark:text-[#f8b51b]/90 text-lg tracking-wide">
                    memory_map.exe
                  </span>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-bg-elevated border border-border-color dark:bg-[#4f1d6e]/80 dark:border-[#f8b51b]/25">
                      <Moon className="w-7 h-7 text-sunset-orange dark:text-[#f8b51b]" />
                    </div>
                    <div>
                      <p className="font-pixel text-base md:text-lg leading-relaxed text-sunset-orange dark:text-[#f8b51b] mb-2">
                        STATUS
                      </p>
                      <p className="font-sans text-text-main dark:text-white/90 text-base leading-relaxed tracking-tight">
                        Retention drops between reviews. SunsetStudy plots the curve per topic so your next session lands
                        before the boss fight with your brain.
                      </p>
                    </div>
                  </div>
                  <div className="relative h-40 md:h-48 rounded-lg bg-gradient-to-b from-sunset-purple/30 to-bg-base border border-border-color dark:from-[#2f1a72] dark:to-[#0f0818] dark:border-[#7e235d]/40 overflow-hidden">
                    <svg viewBox="0 0 400 160" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="landCurve" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f8b51b" />
                          <stop offset="45%" stopColor="#ef5a1b" />
                          <stop offset="100%" stopColor="#c72c3c" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M 20 30 Q 120 120 200 100 T 380 95"
                        fill="none"
                        stroke="url(#landCurve)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0.4 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                      />
                      <motion.circle
                        cx="120"
                        cy="88"
                        r="6"
                        fill="#f8b51b"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 }}
                      />
                      <motion.circle
                        cx="260"
                        cy="72"
                        r="6"
                        fill="#ef5a1b"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2 }}
                      />
                    </svg>
                    <p className="absolute bottom-3 left-4 font-mono text-sunset-orange/90 dark:text-[#f8b51b]/80 text-base tracking-wide">
                      FORGET ↓ REVIEW ↑
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          className="grid md:grid-cols-3 gap-6 md:gap-8"
        >
          {[
            {
              title: 'Memory hub',
              body: 'Pick a topic, highlight a session, and read the curve like a health bar for what you still know.',
              icon: Sparkles,
              accent: '#f8b51b',
            },
            {
              title: 'Lofi timeline',
              body: 'Today’s blocks and study slots in one scroll — calmer than a spreadsheet, still every deadline.',
              icon: Headphones,
              accent: '#ef5a1b',
            },
            {
              title: 'Retro + modern',
              body: 'Pixeboy accents, Nunito for a warm rounded UI, and Fredericka the Great for serif warmth: readable for long nights, playful enough to feel like home.',
              icon: Gamepad2,
              accent: '#c72c3c',
            },
          ].map(({ title, body, icon: Icon, accent }) => (
            <div
              key={title}
              className="fun-card p-6 md:p-7 border-2 shadow-[8px_8px_0_var(--c-shadow-deep)] dark:border-[#2f1a72]/40 dark:bg-black/25 dark:text-white dark:backdrop-blur-sm"
            >
              <div
                className="inline-flex p-3 rounded-xl mb-4 border-2"
                style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18` }}
              >
                <Icon className="w-6 h-6" style={{ color: accent }} />
              </div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold tracking-tight mb-3 text-text-main dark:text-white">
                {title}
              </h3>
              <p className="text-text-muted dark:text-white/75 leading-relaxed font-sans text-base tracking-tight">{body}</p>
            </div>
          ))}
        </motion.section>

        <footer className="text-center pb-8 pt-4 border-t border-border-color dark:border-white/10">
          <p className="font-mono text-lg text-sunset-orange dark:text-[#f8b51b]/85 tracking-wide">Press start on your next review →</p>
          <Link
            to={enterHref}
            className="mt-4 inline-block font-sans text-text-muted hover:text-sunset-orange dark:text-white/70 dark:hover:text-white text-base tracking-tight underline-offset-4 hover:underline"
          >
            {enterLabel}
          </Link>
        </footer>
      </main>
    </div>
  );
}
