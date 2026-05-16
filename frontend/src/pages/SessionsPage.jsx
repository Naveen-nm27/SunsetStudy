import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Plus, Trash2, Brain } from 'lucide-react';
import api from '../api';
import CreateEntityModal from '../components/CreateEntityModal';
import SessionStudyTimer from '../components/SessionStudyTimer';
import { topicIdFromSession, subjectIdOf } from '../utils/topic';
import { getSubjectColor } from '../utils/subjectColors';
import { useToast } from '../components/ToastProvider';
import { getFriendlyErrorMessage } from '../utils/apiErrors';
import { useConfirm } from '../components/ConfirmProvider';

export default function SessionsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const toast = useToast();
  const confirm = useConfirm();
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filterTopicId, setFilterTopicId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const completingRef = useRef(new Set());

  const load = async () => {
    const [sess, sub, top] = await Promise.all([
      api.get('/sessions'),
      api.get('/subjects'),
      api.get('/topics'),
    ]);
    setSessions(sess.data);
    setSubjects(sub.data);
    setTopics(top.data);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (!filterTopicId) return sessions;
    return sessions.filter((s) => topicIdFromSession(s) === filterTopicId);
  }, [sessions, filterTopicId]);

  const remove = async (id) => {
    const ok = await confirm('Delete this session?');
    if (!ok) return;
    try {
      await api.delete(`/sessions/${id}`);
      await load();
    } catch (e) {
      console.error(e);
      toast(getFriendlyErrorMessage(e, "We couldn't delete that session."), 'error');
    }
  };

  const mark = async (id, status) => {
    if (completingRef.current.has(id)) return;
    completingRef.current.add(id);
    try {
      await api.patch(`/sessions/${id}`, { status });
      await load();
      if (status === 'completed') toast('Session marked as completed', 'success');
    } catch (e) {
      console.error(e);
      toast(getFriendlyErrorMessage(e, "We couldn't update that session."), 'error');
    } finally {
      completingRef.current.delete(id);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      {createOpen && (
        <CreateEntityModal
          type="session"
          onClose={() => setCreateOpen(false)}
          onSuccess={load}
          userObjectId={user.id}
          subjects={subjects}
          topics={topics}
        />
      )}

      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Sessions</h1>
          <p className="font-mono text-sm uppercase tracking-widest text-text-muted mt-2 max-w-xl leading-relaxed">
            All planned and completed sessions. Jump to the forgetting curve for any row.
          </p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="fun-button text-sm flex items-center gap-2 self-start">
          <Plus size={16} /> New session
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="font-mono text-xs uppercase text-text-muted font-bold">Filter by topic</label>
        <select
          className="bg-bg-base border-2 border-border-color rounded-xl px-3 py-2 font-serif text-sm min-w-[200px]"
          value={filterTopicId}
          onChange={(e) => setFilterTopicId(e.target.value)}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="fun-card overflow-x-auto">
        <table className="w-full text-left text-base min-w-[640px]">
          <thead className="font-mono text-xs uppercase tracking-widest text-text-muted border-b border-border-color">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Topic</th>
              <th className="p-3">Time</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const tid = topicIdFromSession(s);
              const tname = s.topicObjectId?.name || topics.find((t) => t._id === tid)?.name || 'Topic';
              const subjectId = s.topicObjectId?.subjectObjectId?._id || s.topicObjectId?.subjectObjectId || null;
              const subColor = getSubjectColor(subjectId, subjects);
              return (
                <tr key={s._id} className="border-b border-border-color last:border-0 hover:bg-bg-card/50">
                  <td className="p-3 font-mono text-xs whitespace-nowrap align-top">
                    <div>{moment(s.date).format('MMM D, YYYY')}</div>
                    <SessionStudyTimer key={s._id} session={s} onComplete={() => mark(s._id, 'completed')} />
                  </td>
                  <td className="p-3 font-serif">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subColor }}
                      />
                      {tname}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs whitespace-nowrap">
                    {s.startTime} – {s.endTime}
                  </td>
                  <td className="p-3 font-mono text-xs">{s.status}</td>
                  <td className="p-3 text-right whitespace-nowrap space-x-1">
                    <Link
                      to={`/dashboard/memory?topic=${encodeURIComponent(tid)}&session=${encodeURIComponent(s._id)}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border-color text-xs font-mono uppercase font-bold text-sunset-orange hover:border-sunset-orange"
                      title="View on forgetting curve"
                    >
                      <Brain size={14} /> Curve
                    </Link>
                    {s.status === 'planned' && (
                      <button
                        type="button"
                        className="text-xs font-mono uppercase font-bold px-2 py-1 rounded-lg bg-sunset-yellow/20 text-sunset-deep dark:text-sunset-yellow"
                        onClick={() => mark(s._id, 'completed')}
                      >
                        Done
                      </button>
                    )}
                    <button type="button" className="p-2 text-sunset-pink opacity-70 hover:opacity-100" onClick={() => remove(s._id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-text-muted font-serif">
                  No sessions match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
