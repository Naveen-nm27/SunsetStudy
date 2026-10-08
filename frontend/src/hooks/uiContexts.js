import { createContext, useContext } from 'react';
export const ConfirmCtx = createContext(null);
export const ToastCtx = createContext(null);
export const ThemeContext = createContext(null);
export function useConfirm() {
  const context = useContext(ConfirmCtx);
  if (!context) throw new Error('useConfirm requires ConfirmProvider');
  return context;
}
export function useToast() {
  const context = useContext(ToastCtx);
  if (!context) throw new Error('useToast requires ToastProvider');
  return context;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme requires ThemeProvider');
  return context;
}
