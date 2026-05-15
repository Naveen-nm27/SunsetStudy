import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

/* ─── Context ─────────────────────────────────────────────────── */
const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ─── Individual toast styles ─────────────────────────────────── */
const VARIANTS = {
  error: {
    icon: AlertCircle,
    barColor: 'var(--sun-ruby)',
    iconColor: 'text-sunset-pink',
    border: 'border-sunset-pink/40',
    title: 'Error',
  },
  success: {
    icon: CheckCircle2,
    barColor: 'var(--sun-gold)',
    iconColor: 'text-sunset-yellow dark:text-[#f8b51b]',
    border: 'border-sunset-yellow/40',
    title: 'Done',
  },
  info: {
    icon: Info,
    barColor: 'var(--sun-ember)',
    iconColor: 'text-sunset-orange',
    border: 'border-sunset-orange/35',
    title: 'Info',
  },
};

const DURATION = 4000; // ms

function Toast({ id, type, message, onDismiss }) {
  const v = VARIANTS[type] || VARIANTS.info;
  const Icon = v.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`relative w-full max-w-sm fun-card overflow-hidden ${v.border} shadow-[6px_6px_0_var(--c-shadow-deep)]`}
    >
      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[3px] rounded-b-full"
        style={{ backgroundColor: v.barColor }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: DURATION / 1000, ease: 'linear' }}
        onAnimationComplete={() => onDismiss(id)}
      />

      <div className="flex items-start gap-3 px-4 pt-4 pb-5">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${v.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs uppercase font-bold tracking-widest mb-0.5 text-text-muted">
            {v.title}
          </p>
          <p className="font-sans text-sm text-text-main leading-snug break-words">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 opacity-40 hover:opacity-90 transition-opacity mt-0.5"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Provider ────────────────────────────────────────────────── */
let _nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (message, type = 'info') => {
      const id = _nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      // Safety fallback in case animation callback doesn't fire
      timers.current[id] = setTimeout(() => dismiss(id), DURATION + 500);
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
          aria-live="polite"
          aria-label="Notifications"
        >
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <div key={t.id} className="pointer-events-auto">
                <Toast {...t} onDismiss={dismiss} />
              </div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
