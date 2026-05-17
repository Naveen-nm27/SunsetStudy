import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import moment from 'moment';
import { Brain, ChevronRight, ExternalLink, CalendarDays, Pencil, Check, X } from 'lucide-react';
import api from '../api';
import CreateEntityModal from '../components/CreateEntityModal';
import ForgettingCurveChart from '../components/ForgettingCurveChart';
import ReviewScheduleList from '../components/ReviewScheduleList';
import { REVIEW_INTERVAL_DAYS } from '../constants/spacedRepetition';
import { subjectIdOf, topicIdFromSession } from '../utils/topic';
import { sessionCompletionMs } from '../utils/sessionTimeline';
import { getSubjectColor } from '../utils/subjectColors';

export default function MemoryHub() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const CALENDAR_KEY = `sunsetStudy_calendarUrl_${user.id || 'guest'}`;
  const [calendarUrl, setCalendarUrl] = useState(() => localStorage.getItem(CALENDAR_KEY) || '');
  const [editingCalendar, setEditingCalendar] = useState(false);
  const [calendarDraft, setCalendarDraft] = useState('');
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionPrefill, setSessionPrefill] = useState(null);

  const saveCalendarUrl = (url) => {
    const trimmed = url.trim();
    // Prepend https:// if the user typed a bare domain
    const final =
      trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')
        ? `https://${trimmed}`
        : trimmed;
    setCalendarUrl(final);
    if (final) localStorage.setItem(CALENDAR_KEY, final);
    else localStorage.removeItem(CALENDAR_KEY);
    setEditingCalendar(false);
  };

  const load = async () => {
    try {
      const [tRes, sRes, sessRes] = await Promise.all([
        api.get('/topics'),
        api.get('/subjects'),
        api.get('/sessions'),
      ]);
      setTopics(tRes.data);
      setSubjects(sRes.data);
      setSessions(sessRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, [location.pathname]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (!topics.length) return;
    const tid = searchParams.get('topic');
    const sid = searchParams.get('session') || '';
    const resolvedTopic = tid && topics.some((t) => t._id === tid) ? tid : topics[0]._id;
    setSelectedTopicId(resolvedTopic);
    const ts = sessions.filter((s) => topicIdFromSession(s) === resolvedTopic);
    const sessionOk = sid && ts.some((s) => s._id === sid);
    setSelectedSessionId(sessionOk ? sid : '');
  }, [searchParams, topics, sessions]);

  const subjectNameById = useMemo(() => {
    const m = new Map();
    subjects.forEach((s) => m.set(s._id, s.name));
    return m;
  }, [subjects]);

  const selectedTopic = topics.find((t) => t._id === selectedTopicId) || null;

  const topicSessions = useMemo(() => {
    if (!selectedTopicId) return [];
    return sessions.filter((s) => topicIdFromSession(s) === selectedTopicId);
  }, [sessions, selectedTopicId]);

  const syncUrl = (tid, sid) => {
    const next = new URLSearchParams();
    if (tid) next.set('topic', tid);
    if (sid) next.set('session', sid);
    setSearchParams(next, { replace: true });
  };

  const onTopicChange = (tid) => {
    setSelectedTopicId(tid);
    setSelectedSessionId('');
    syncUrl(tid, '');
  };

  const onSessionChange = (sid) => {
    setSelectedSessionId(sid);
    syncUrl(selectedTopicId, sid);
  };

  const stage = selectedTopic?.reviewStage ?? 0;
  const nextInterval =
    stage < REVIEW_INTERVAL_DAYS.length ? REVIEW_INTERVAL_DAYS[stage] : REVIEW_INTERVAL_DAYS[REVIEW_INTERVAL_DAYS.length - 1];

  const scheduleReviewFromDate = ({ dateMs }) => {
    if (!selectedTopic) return;
    setSessionPrefill({
      subjectObjectId: subjectIdOf(selectedTopic),
      topicObjectId: selectedTopic._id,
      date: moment(dateMs).format('YYYY-MM-DD'),
      startTime: '09:00',
      endTime: '10:00',
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-10">
      {sessionPrefill && (
        <CreateEntityModal
          type="session"
          sessionPrefill={sessionPrefill}
          onClose={() => setSessionPrefill(null)}
          onSuccess={load}
          userObjectId={user.id}
          subjects={subjects}
          topics={topics}
        />
      )}
      <header className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-sunset-yellow/20 text-sunset-orange border border-border-color">
            <Brain size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-main">Memory &amp; forgetting curve</h1>
            <p className="font-mono text-sm uppercase tracking-widest text-text-muted mt-2 max-w-xl leading-relaxed">
              Pick a topic to see retention between reviews, your next review target, and how each session sits on the
              curve. This is the core of SunsetStudy.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/sessions"
          className="fun-button-secondary inline-flex items-center gap-2 text-sm self-start"
        >
          Plan sessions <ExternalLink size={14} />
        </Link>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-8 items-start">
        <aside className="fun-card p-6 md:p-7 space-y-6">
          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">
              Topic
            </label>
            <select
              className="w-full bg-bg-base border-2 border-border-color rounded-xl px-3 py-3 font-serif text-base text-text-main focus:border-sunset-orange outline-none"
              value={selectedTopicId}
              onChange={(e) => onTopicChange(e.target.value)}
            >
              {topics.length === 0 && <option value="">No topics yet</option>}
              {topics.map((t) => {
                const sid = subjectIdOf(t);
                const subColor = getSubjectColor(sid, subjects);
                return (
                  <option key={t._id} value={t._id}>
                    {subjectNameById.get(sid) || 'Subject'} — {t.name}
                  </option>
                );
              })}
            </select>
            {/* Colour strip for the selected topic */}
            {selectedTopic && (() => {
              const sid = subjectIdOf(selectedTopic);
              const subColor = getSubjectColor(sid, subjects);
              const activeColor = selectedTopic.color || subColor;
              const subName = subjectNameById.get(sid) || 'Subject';
              return (
                <div className="flex items-center gap-2 mt-3 bg-bg-elevated/50 p-2 rounded-lg border border-border-color/50">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: activeColor }}
                  />
                  <span className="font-sans text-sm font-medium text-text-muted">
                    {subName} {selectedTopic.color && <span className="opacity-70">(Custom Color)</span>}
                  </span>
                </div>
              );
            })()}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">
              Highlight session
            </label>
            <select
              className="w-full bg-bg-base border-2 border-border-color rounded-xl px-3 py-3 font-serif text-base text-text-main focus:border-sunset-orange outline-none"
              value={selectedSessionId}
              onChange={(e) => onSessionChange(e.target.value)}
            >
              <option value="">None</option>
              {topicSessions.map((s) => {
                const when =
                  s.status === 'completed' && sessionCompletionMs(s)
                    ? moment(sessionCompletionMs(s)).format('MMM D, h:mm A')
                    : moment(s.date).format('MMM D');
                return (
                  <option key={s._id} value={s._id}>
                    {when} · {s.status} · {s.startTime}–{s.endTime}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedTopic && (
            <dl className="grid grid-cols-2 gap-y-5 gap-x-4 font-mono text-sm text-text-muted border-t border-border-color pt-6">
              <div className="flex flex-col gap-1.5">
                <dt className="uppercase text-xs font-bold tracking-widest">Status</dt>
                <dd className="text-text-main font-bold normal-case text-base bg-bg-elevated px-3 py-1.5 rounded-lg border border-border-color w-fit">{selectedTopic.status}</dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="uppercase text-xs font-bold tracking-widest">Stage</dt>
                <dd className="text-text-main font-bold text-base px-1">{stage}</dd>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <dt className="uppercase text-xs font-bold tracking-widest">Next interval</dt>
                <dd className="text-sunset-orange font-bold text-base px-1">{nextInterval}d after completion</dd>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 bg-bg-elevated p-4 rounded-xl border border-border-color shadow-sm">
                <dt className="uppercase text-xs font-bold tracking-widest text-sunset-pink">Next review</dt>
                <dd className="text-text-main font-bold normal-case text-lg">
                  {selectedTopic.nextReviewDate
                    ? moment(selectedTopic.nextReviewDate).format('dddd, MMM D YYYY')
                    : '—'}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 pt-2">
                <dt className="uppercase text-xs font-bold tracking-widest">Last studied</dt>
                <dd className="text-text-main font-bold normal-case px-1">
                  {selectedTopic.lastStudiedAt ? moment(selectedTopic.lastStudiedAt).format('MMM D, YYYY h:mm A') : '—'}
                </dd>
              </div>
            </dl>
          )}

          <Link
            to="/dashboard/library"
            className="flex items-center justify-between font-mono text-xs uppercase font-bold text-sunset-pink hover:opacity-80 pt-2"
          >
            Manage subjects &amp; topics
            <ChevronRight size={16} />
          </Link>

          {/* ── Calendar quick-link ───────────────────────────── */}
          <div className="border-t border-border-color pt-4 space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-text-muted font-bold flex items-center gap-1.5">
              <CalendarDays size={12} />
              Calendar link
            </p>

            {editingCalendar ? (
              <div className="space-y-2">
                <input
                  id="calendar-url-input"
                  type="url"
                  autoFocus
                  placeholder="https://calendar.google.com/..."
                  className="w-full bg-bg-base border-2 border-border-color rounded-xl px-3 py-2 font-sans text-sm text-text-main focus:border-sunset-orange outline-none placeholder:text-text-muted/60"
                  value={calendarDraft}
                  onChange={(e) => setCalendarDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveCalendarUrl(calendarDraft);
                    if (e.key === 'Escape') setEditingCalendar(false);
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveCalendarUrl(calendarDraft)}
                    className="flex-1 fun-button text-xs py-2 flex items-center justify-center gap-1"
                  >
                    <Check size={13} /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCalendar(false)}
                    className="fun-button-secondary text-xs py-2 px-3 flex items-center gap-1"
                  >
                    <X size={13} />
                  </button>
                </div>
                {calendarUrl && (
                  <button
                    type="button"
                    onClick={() => saveCalendarUrl('')}
                    className="w-full font-mono text-xs text-sunset-pink hover:opacity-80 text-left"
                  >
                    Clear link
                  </button>
                )}
              </div>
            ) : calendarUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-2 fun-button text-xs py-2.5 px-3 truncate"
                  title={calendarUrl}
                >
                  <CalendarDays size={14} className="flex-shrink-0" />
                  <span className="truncate">Open calendar</span>
                  <ExternalLink size={12} className="flex-shrink-0 ml-auto opacity-70" />
                </a>
                <button
                  type="button"
                  onClick={() => { setCalendarDraft(calendarUrl); setEditingCalendar(true); }}
                  className="fun-button-secondary p-2.5 flex-shrink-0"
                  title="Change calendar URL"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setCalendarDraft(''); setEditingCalendar(true); }}
                className="w-full fun-button-secondary text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <CalendarDays size={14} /> Set calendar link
              </button>
            )}
          </div>
        </aside>

        <section className="space-y-6">
          {selectedTopic && (
            <>
              <ForgettingCurveChart
                topic={selectedTopic}
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onScheduleReview={scheduleReviewFromDate}
              />
              <ReviewScheduleList
                topic={selectedTopic}
                sessions={sessions}
                onScheduleReview={scheduleReviewFromDate}
              />
            </>
          )}

          {!selectedTopic && topics.length === 0 && (
            <div className="fun-card p-10 text-center">
              <p className="font-serif text-lg mb-2">Add a topic to begin</p>
              <p className="text-text-muted font-mono text-sm uppercase mb-6 leading-relaxed">
                Topics drive sessions and the forgetting curve.
              </p>
              <Link to="/dashboard/library" className="fun-button inline-block text-sm">
                Open library
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
