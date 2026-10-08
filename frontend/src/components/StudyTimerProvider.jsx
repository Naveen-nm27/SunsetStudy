import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, Settings, X, Timer } from 'lucide-react';
import { StudyTimerContext } from '../hooks/useStudyTimer';
import { DEFAULT_TIMER_SETTINGS, normalizeTimerSettings, nextTimerPhase } from '../utils/pomodoro';
import { useConfirm } from '../hooks/uiContexts';
import { useToast } from '../hooks/uiContexts';
import api from '../api';
import MasteryChoice from './MasteryChoice';
import { getFriendlyErrorMessage } from '../utils/apiErrors';

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const idle = (settings) => ({ phase: 'focus', cycles: 0, remaining: settings.focus * 60, deadline: null, running: false, session: null });
const phaseNames = { focus: 'Focus', shortBreak: 'Short break', longBreak: 'Long break' };

function TimerDock({ timer, settings, setTimer, onFinish, finishing, onSettings, onClose }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [timer.running]);
  const remaining = timer.running ? Math.max(0, Math.ceil((timer.deadline - now) / 1000)) : timer.remaining;
  const time = Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0');
  const toggle = () => setTimer(current => current.running
    ? { ...current, running: false, remaining: Math.max(0, Math.ceil((current.deadline - Date.now()) / 1000)), deadline: null }
    : { ...current, running: true, deadline: Date.now() + current.remaining * 1000 });
  return <aside className="pomodoro-dock fun-card p-4" aria-label="Pomodoro timer">
    <div className="flex gap-3 justify-between items-start"><div><p className="font-semibold text-sm">{timer.session?.topicObjectId?.name || 'Study focus'}</p><p className="text-xs text-text-muted">{phaseNames[timer.phase]} · {timer.cycles} focus rounds completed</p></div>
      <div className="flex gap-2"><button aria-label="Timer settings" onClick={onSettings}><Settings size={17} /></button><button aria-label="Close timer" onClick={onClose}><X size={17} /></button></div>
    </div>
    <p className="font-mono text-4xl font-bold text-sunset-orange py-3 tabular-nums" role="timer" aria-label={phaseNames[timer.phase] + ' remaining'}>{time}</p>
    <div className="flex flex-wrap gap-2">
      <button className="fun-button inline-flex gap-2 items-center py-2" onClick={toggle}>{timer.running ? <Pause size={16} /> : <Play size={16} />}{timer.running ? 'Pause' : 'Start ' + phaseNames[timer.phase].toLowerCase()}</button>
      <button className="fun-button-secondary py-2" aria-label="Reset current phase" onClick={() => setTimer(current => ({ ...current, running: false, deadline: null, remaining: settings[current.phase] * 60 }))}><RotateCcw size={16} /></button>
      {timer.session && <button disabled={finishing} className="fun-button-secondary py-2" onClick={onFinish}>{finishing ? 'Saving…' : 'Finish session'}</button>}
    </div>
    <p className="text-xs text-text-muted mt-3">Breaks do not complete your session. Finish it when you are done studying.</p>
  </aside>;
}

export default function StudyTimerProvider({ children }) {
  const userId = read('user', {}).id || 'guest';
  const settingsKey = 'sunsetStudy_pomodoro_' + userId;
  const timerKey = 'sunsetStudy_activeTimer_' + userId;
  const [settings, setSettings] = useState(() => normalizeTimerSettings(read(settingsKey, DEFAULT_TIMER_SETTINGS)));
  const [timer, setTimer] = useState(() => {
    const saved = read(timerKey, null);
    return saved && ['focus', 'shortBreak', 'longBreak'].includes(saved.phase) && Number.isFinite(saved.remaining)
      && Number.isFinite(saved.cycles) && (!saved.running || Number.isFinite(saved.deadline))
      ? saved : idle(normalizeTimerSettings(read(settingsKey, DEFAULT_TIMER_SETTINGS)));
  });
  const [open, setOpen] = useState(() => Boolean(read(timerKey, null)?.running || read(timerKey, null)?.session));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(settings);
  const [mastery, setMastery] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const confirm = useConfirm(), toast = useToast();

  useEffect(() => { localStorage.setItem(timerKey, JSON.stringify(timer)); }, [timer, timerKey]);
  useEffect(() => {
    const sessionId = timer.session?._id;
    if (!sessionId) return;
    let disposed = false;
    const verify = () => api.get('/sessions/' + sessionId).then(({ data }) => {
      if (!disposed && data.status !== 'planned') setTimer(idle(settings));
    }).catch(error => {
      if (!disposed && error.response?.status === 404) setTimer(idle(settings));
    });
    verify();
    window.addEventListener('study-data-changed', verify);
    return () => { disposed = true; window.removeEventListener('study-data-changed', verify); };
  }, [timer.session?._id, settings]);
  useEffect(() => {
    if (!timer.running) return;
    const tick = () => {
      if (Date.now() < timer.deadline) return;
      let next = timer;
      let count = 0;
      do { next = nextTimerPhase(next, settings); count++; }
      while (next.running && next.deadline <= Date.now() && count < 1000);
      if (count === 1000) next = { ...next, running: false, deadline: null };
      setTimer(next);
      toast(phaseNames[timer.phase] + ' complete. ' + phaseNames[next.phase] + (next.running ? ' started.' : ' is ready.'), 'info');
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timer, settings, toast]);
  useEffect(() => {
    const completed = event => {
      const session = event.detail;
      setTimer(current => current.session?._id === session._id ? idle(settings) : current);
      const topic = session.topicObjectId;
      if (topic?.masteredAt && !topic.continueStudying) {
        const acknowledgement = 'sunsetStudy_mastery_' + userId + '_' + topic._id + '_' + topic.masteredAt;
        if (!localStorage.getItem(acknowledgement)) setMastery({ ...topic, acknowledgement });
      }
    };
    window.addEventListener('session-completed', completed);
    return () => window.removeEventListener('session-completed', completed);
  }, [settings, userId]);

  const startSession = useCallback(async session => {
    const topic = session.topicObjectId;
    if ((topic?.masteredAt || topic?.status === 'done') && !topic.continueStudying) {
      setMastery(topic); return;
    }
    if (timer.session?._id === session._id) { setOpen(true); return; }
    if ((timer.running || timer.session) && !await confirm('Switch sessions and reset the current Pomodoro?')) return;
    setTimer({ ...idle(settings), session, running: true, deadline: Date.now() + settings.focus * 60000 });
    setOpen(true);
  }, [timer.session, timer.running, settings, confirm]);
  const showTimer = useCallback(() => setOpen(true), []);
  const context = useMemo(() => ({ startSession, showTimer, activeSessionId: timer.session?._id }), [startSession, showTimer, timer.session?._id]);
  const finish = async () => {
    if (!timer.session || finishing) return;
    const sessionId = timer.session._id;
    setFinishing(true);
    try {
      await api.patch('/sessions/' + sessionId, { status: 'completed' });
      setTimer(idle(settings)); toast('Session completed and review schedule updated.', 'success');
    } catch (error) { toast(getFriendlyErrorMessage(error, 'Could not finish this session. Please retry.'), 'error'); }
    finally { setFinishing(false); }
  };
  const close = async () => {
    if (timer.running && !await confirm('Pause the Pomodoro and close it? You can reopen it from the navigation.')) return;
    setTimer(current => current.running ? { ...current, running: false, remaining: Math.max(0, Math.ceil((current.deadline - Date.now()) / 1000)), deadline: null } : current);
    setOpen(false);
  };
  const acknowledge = () => { if (mastery.acknowledgement) localStorage.setItem(mastery.acknowledgement, 'true'); setMastery(null); };
  return <StudyTimerContext.Provider value={context}>
    {children}
    {open && <div className="h-72" aria-hidden="true" />}
    {open && <TimerDock timer={timer} settings={settings} setTimer={setTimer} onFinish={finish} finishing={finishing}
      onSettings={() => { setDraft(settings); setEditing(true); }} onClose={close} />}
    {editing && <div className="study-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="timer-settings-title" className="fun-card p-6 w-full max-w-md space-y-4">
      <h2 id="timer-settings-title" className="font-serif text-2xl flex gap-2"><Timer /> Customize Pomodoro</h2>
      <p className="text-sm text-text-muted">Choose a pace that suits you. Pause the timer to change its settings.</p>
      <form className="space-y-4" onSubmit={event => {
        event.preventDefault();
        const next = normalizeTimerSettings(draft); setSettings(next); localStorage.setItem(settingsKey, JSON.stringify(next));
        setTimer(current => ({ ...current, remaining: next[current.phase] * 60, running: false, deadline: null }));
        setEditing(false);
      }}>
        {Object.entries({ focus: ['Focus minutes', 180], shortBreak: ['Short break minutes', 60], longBreak: ['Long break minutes', 120], rounds: ['Focus rounds before long break', 12] }).map(([key, [label, max]]) =>
          <label key={key} className="block">{label}<input required type="number" min="1" max={max} step="1" disabled={timer.running} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} className="study-input w-full mt-1" /></label>)}
        <label className="flex gap-2"><input type="checkbox" checked={draft.autoStart} disabled={timer.running} onChange={e => setDraft({ ...draft, autoStart: e.target.checked })} /> Automatically start the next focus or break</label>
        <div className="flex gap-3"><button disabled={timer.running} className="fun-button">Save settings</button><button type="button" className="fun-button-secondary" onClick={() => setEditing(false)}>Cancel</button></div>
      </form>
    </section></div>}
    {mastery && <div className="study-modal-backdrop"><div role="dialog" aria-modal="true" aria-label="Choose whether to keep studying" className="max-w-lg w-full"><MasteryChoice topic={mastery} onClose={acknowledge} /></div></div>}
  </StudyTimerContext.Provider>;
}
