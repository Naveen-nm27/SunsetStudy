import { createContext, useContext } from 'react';
export const StudyTimerContext = createContext(null);
export function useStudyTimer() {
  const context = useContext(StudyTimerContext);
  if (!context) throw new Error('Study timer requires StudyTimerProvider');
  return context;
}
