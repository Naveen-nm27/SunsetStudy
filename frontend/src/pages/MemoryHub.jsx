import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import moment from 'moment';
import { Brain, ChevronRight, ExternalLink } from 'lucide-react';
import api from '../api';
import ForgettingCurveChart from '../components/ForgettingCurveChart';
import { REVIEW_INTERVAL_DAYS } from '../constants/spacedRepetition';
import { subjectIdOf, topicIdFromSession } from '../utils/topic';

export default function MemoryHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

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

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-10">
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

      <div className="grid lg:grid-cols-[minmax(0,280px)_1fr] gap-8 items-start">
        <aside className="fun-card p-5 space-y-5">
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
              {topics.map((t) => (
                <option key={t._id} value={t._id}>
                  {subjectNameById.get(subjectIdOf(t)) || 'Subject'} — {t.name}
                </option>
              ))}
            </select>
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
              {topicSessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {moment(s.date).format('MMM D')} · {s.status} · {s.startTime}–{s.endTime}
                </option>
              ))}
            </select>
          </div>

          {selectedTopic && (
            <dl className="space-y-3 font-mono text-sm uppercase text-text-muted border-t border-border-color pt-4">
              <div className="flex justify-between gap-2">
                <dt>Status</dt>
                <dd className="text-text-main font-bold normal-case">{selectedTopic.status}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Review stage</dt>
                <dd className="text-text-main font-bold">{stage}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Next interval</dt>
                <dd className="text-sunset-orange font-bold">{nextInterval}d after completion</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt>Next review</dt>
                <dd className="text-text-main font-bold normal-case">
                  {selectedTopic.nextReviewDate
                    ? moment(selectedTopic.nextReviewDate).format('dddd, MMM D YYYY')
                    : '—'}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt>Last studied</dt>
                <dd className="text-text-main font-bold normal-case">
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
        </aside>

        <section className="space-y-6">
          {selectedTopic && (
            <ForgettingCurveChart topic={selectedTopic} sessions={sessions} selectedSessionId={selectedSessionId} />
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
