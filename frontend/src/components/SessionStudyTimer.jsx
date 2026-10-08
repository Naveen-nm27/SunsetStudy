import { Play } from 'lucide-react';
import { useStudyTimer } from '../hooks/useStudyTimer';
export default function SessionStudyTimer({ session }) {
  const { startSession, activeSessionId } = useStudyTimer();
  if (session.status !== 'planned') return null;
  return <button type="button" className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sunset-orange/15 text-sunset-orange text-xs font-bold"
    onClick={() => startSession(session)}><Play size={13} /> {activeSessionId === session._id ? 'Open Pomodoro' : 'Start studying'}</button>;
}
