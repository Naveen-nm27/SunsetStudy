import { useState, useMemo } from 'react';
import moment from 'moment';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CheckCircle, Plus, Trash2, CalendarDays, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import CreateEntityModal from '../components/CreateEntityModal';
import { useToast } from '../hooks/uiContexts';
import { useConfirm } from '../hooks/uiContexts';
import { getFriendlyErrorMessage } from '../utils/apiErrors';
import { buildCalendarEvents, calendarRangeForView } from '../utils/calendarEvents';
import { useStudyData } from '../hooks/useStudyData';
import SessionStudyTimer from '../components/SessionStudyTimer';

const localizer = momentLocalizer(moment);

export default function TimelinePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { sessions, blocks, subjects, topics, setSessions, setBlocks, reload: fetchDashboardData, error: dataError } = useStudyData(['sessions', 'blocks', 'subjects', 'topics']);
  const [createModalType, setCreateModalType] = useState(null);
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');


  const range = useMemo(() => calendarRangeForView(date, view === Views.DAY ? 'day' : 'week'), [date, view]);

  const events = useMemo(
    () => buildCalendarEvents(sessions, blocks, range.start, range.end),
    [sessions, blocks, range.start, range.end]
  );

  const markSessionComplete = async (id) => {
    try {
      await api.patch(`/sessions/${id}`, { status: 'completed' });
      setSessions((prev) => prev.map((s) => (s._id === id ? { ...s, status: 'completed' } : s)));
      setSelected((prev) =>
        prev?.type === 'session' && prev.resource?._id === id
          ? { ...prev, status: 'completed', resource: { ...prev.resource, status: 'completed' } }
          : prev
      );
      toast('Session marked as completed', 'success');
    } catch (err) {
      toast(getFriendlyErrorMessage(err, "We couldn't complete that session."), 'error');
    }
  };

  const deleteEntity = async (type, id) => {
    const ok = await confirm(type === 'block' ? 'Delete this time block?' : 'Delete this session?');
    if (!ok) return;
    try {
      if (type === 'block') {
        await api.delete(`/blocks/${id}`);
        setBlocks((prev) => prev.filter((b) => b._id !== id));
      } else {
        await api.delete(`/sessions/${id}`);
        setSessions((prev) => prev.filter((s) => s._id !== id));
      }
      setSelected(null);
      toast(type === 'block' ? 'Block deleted' : 'Session deleted', 'success');
    } catch (err) {
      toast(getFriendlyErrorMessage(err, "We couldn't delete that."), 'error');
    }
  };

  const eventPropGetter = (event) => {
    if (event.type === 'block') return { className: 'rbc-event-block' };
    if (event.status === 'completed' || event.resource?.status === 'completed') {
      return { className: 'rbc-event-session-done' };
    }
    return { className: 'rbc-event-session' };
  };

  return (
    <div className="w-full relative">
      {dataError && <p role="alert">{dataError} <button onClick={() => fetchDashboardData()} className="fun-button-secondary">Retry</button></p>}
      {createModalType && (
        <CreateEntityModal
          type={createModalType}
          onClose={() => setCreateModalType(null)}
          onSuccess={fetchDashboardData}
          userObjectId={user.id}
          subjects={subjects}
          topics={topics}
        />
      )}

      <main className="w-full p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-serif font-bold mb-2">Today&apos;s timeline</h2>
            <p className="font-mono text-base text-text-muted uppercase tracking-widest">
              {moment(date).format('dddd, MMMM Do YYYY')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCreateModalType('subject')}
              className="fun-button-secondary py-2.5 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Subject
            </button>
            <button
              type="button"
              onClick={() => setCreateModalType('topic')}
              className="fun-button-secondary py-2.5 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Topic
            </button>
            <button
              type="button"
              onClick={() => setCreateModalType('session')}
              className="fun-button-secondary py-2.5 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Session
            </button>
            <button
              type="button"
              onClick={() => setCreateModalType('block')}
              className="fun-button-secondary py-2.5 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Block
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setView(Views.WEEK)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-sans font-medium ${
              view === Views.WEEK
                ? 'border-sunset-orange bg-sunset-orange/15 text-sunset-orange'
                : 'border-border-color text-text-muted hover:border-sunset-orange/50'
            }`}
          >
            <CalendarDays size={16} /> Week
          </button>
          <button
            type="button"
            onClick={() => setView(Views.DAY)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-sans font-medium ${
              view === Views.DAY
                ? 'border-sunset-orange bg-sunset-orange/15 text-sunset-orange'
                : 'border-border-color text-text-muted hover:border-sunset-orange/50'
            }`}
          >
            <Sun size={16} /> Day
          </button>
          <div className="ml-auto flex flex-wrap gap-3 font-mono text-[10px] uppercase text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sunset-pink" /> Blocks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sunset-yellow" /> Planned
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-text-muted/50" /> Completed
            </span>
          </div>
        </div>

        <div className="fun-card p-3 md:p-4 sunset-calendar overflow-hidden">
          <Calendar
            localizer={localizer}
            events={events}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            views={[Views.WEEK, Views.DAY]}
            defaultView={Views.WEEK}
            step={30}
            timeslots={2}
            style={{ minHeight: 640 }}
            eventPropGetter={eventPropGetter}
            onSelectEvent={setSelected}
            popup
            toolbar
          />
        </div>

        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="fun-card mt-6 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <p className="font-mono text-xs uppercase text-text-muted mb-1">
                {selected.type === 'block' ? `Block · ${selected.resource?.type || ''}` : `Session · ${selected.resource?.status || ''}`}
              </p>
              <h3 className="text-xl font-serif font-bold">{selected.title}</h3>
              <p className="font-mono text-xs text-text-muted mt-1">
                {moment(selected.start).format('ddd D MMM, h:mm A')} – {moment(selected.end).format('h:mm A')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selected.type === 'session' && <SessionStudyTimer session={selected.resource} />}
              {selected.type === 'session' && selected.resource?.status === 'planned' && (
                <button
                  type="button"
                  onClick={() => markSessionComplete(selected.resource._id)}
                  className="fun-button flex items-center gap-2 text-sm"
                >
                  <CheckCircle size={16} /> Complete
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteEntity(selected.type, selected.resource._id)}
                className="p-3 text-sunset-pink hover:text-sunset-pink/70 transition-colors"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
