import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

/* ─── Context ─────────────────────────────────────────────────── */
const ConfirmCtx = createContext(null);

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}

/* ─── Provider ────────────────────────────────────────────────── */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { message, resolve }

  /**
   * Replaces window.confirm(). Returns a Promise<boolean>.
   * Usage: const ok = await confirm('Are you sure?');
   */
  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setDialog({ message, resolve });
    });
  }, []);

  const handle = (answer) => {
    dialog?.resolve(answer);
    setDialog(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {createPortal(
        <AnimatePresence>
          {dialog && (
            <motion.div
              key="confirm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-bg-base/70 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) handle(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                className="fun-card w-full max-w-sm p-7 shadow-[8px_8px_0_var(--c-shadow-deep)] border-sunset-orange/30"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-2.5 rounded-xl bg-sunset-yellow/15 border border-sunset-yellow/30 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-sunset-orange" />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-text-muted font-bold mb-1">
                      Confirm
                    </p>
                    <p className="font-sans text-base text-text-main leading-relaxed">
                      {dialog.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => handle(false)}
                    className="fun-button-secondary text-sm py-2 px-5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handle(true)}
                    className="fun-button text-sm py-2 px-5"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </ConfirmCtx.Provider>
  );
}
