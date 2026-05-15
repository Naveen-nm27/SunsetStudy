import { useState, useEffect } from 'react';
import moment from 'moment';
import { Clock, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import CreateEntityModal from '../components/CreateEntityModal';

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [createModalType, setCreateModalType] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [blocksRes, sessionsRes, subjectsRes, topicsRes] = await Promise.all([
        api.get('/blocks'),
        api.get('/sessions'),
        api.get('/subjects'),
        api.get('/topics'),
      ]);

      const today = moment().startOf('day');
      setSubjects(subjectsRes.data);
      setTopics(topicsRes.data);

      const blockEvents = blocksRes.data.map((b) => ({
        id: b._id,
        title: b.title,
        startTime: b.startTime,
        endTime: b.endTime,
        type: 'block',
        blockType: b.type,
        resource: b,
      }));

      const sessionEvents = sessionsRes.data
        .filter((s) => moment(s.date).startOf('day').isSame(today))
        .map((s) => ({
          id: s._id,
          title: `Study: ${s.topicObjectId?.name || 'Topic'}`,
          startTime: s.startTime,
          endTime: s.endTime,
          type: 'session',
          status: s.status,
          resource: s,
        }));

      const allEvents = [...blockEvents, ...sessionEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
      setEvents(allEvents);
    } catch (err) {
      console.error(err);
    }
  };

  const markSessionComplete = async (id) => {
    try {
      await api.patch(`/sessions/${id}`, { status: 'completed' });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEntity = async (type, id) => {
    try {
      if (type === 'block') await api.delete(`/blocks/${id}`);
      if (type === 'session') await api.delete(`/sessions/${id}`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full relative">
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

      <main className="w-full p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-serif font-bold mb-2">Today&apos;s timeline</h2>
            <p className="font-mono text-base text-text-muted uppercase tracking-widest">
              {moment().format('dddd, MMMM Do YYYY')}
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

        <div className="flex flex-col gap-6 w-full relative">
          <div className="absolute left-6 top-4 bottom-4 w-1 rounded-full z-0 bg-gradient-to-b from-sunset-orange/25 via-sunset-purple/30 to-sunset-deep/40" />

          <AnimatePresence>
            {events.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif text-base leading-relaxed italic opacity-70 ml-16 max-w-xl">
                Your schedule is clear for today. Add blocks or sessions from the buttons above, or use Library for
                bulk planning.
              </motion.p>
            ) : (
              events.map((ev, index) => {
                const isCompleted = ev.status === 'completed';
                const isBlock = ev.type === 'block';

                let cardColor = 'fun-card';
                let dotColor = 'bg-sunset-yellow';

                if (isBlock) {
                  dotColor = 'bg-sunset-pink';
                } else if (isCompleted) {
                  cardColor = 'fun-card opacity-50 bg-bg-base';
                  dotColor = 'bg-text-muted';
                } else {
                  dotColor = 'bg-sunset-orange';
                }

                return (
                  <motion.div
                    key={ev.id + index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-16 z-10"
                  >
                    <div className={`absolute left-[22px] top-6 w-4 h-4 rounded-full border-2 border-bg-base ${dotColor} z-10`} />

                    <div className={`${cardColor} p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                      <div className="flex-1">
                        <p className="font-mono text-sm font-bold opacity-80 mb-2 flex items-center gap-2">
                          <Clock size={14} /> {moment(ev.startTime, 'HH:mm').format('h:mm A')} —{' '}
                          {moment(ev.endTime, 'HH:mm').format('h:mm A')}
                        </p>
                        <h3 className={`text-xl font-serif font-bold ${isCompleted ? 'line-through opacity-70' : ''}`}>
                          {ev.title}
                        </h3>
                        {isBlock && (
                          <p className="font-mono text-xs uppercase mt-2 opacity-60">Fixed commitment • {ev.blockType}</p>
                        )}
                        {!isBlock && <p className="font-mono text-xs uppercase mt-2 opacity-60">Study session</p>}
                      </div>

                      <div className="flex items-center gap-3">
                        {!isBlock && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => markSessionComplete(ev.id)}
                            className="fun-button flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                          >
                            <CheckCircle size={16} /> Complete
                          </button>
                        )}

                        {!isBlock && isCompleted && (
                          <div className="font-mono text-xs uppercase font-bold opacity-60 flex items-center gap-2">
                            <CheckCircle size={16} /> Done
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteEntity(ev.type, ev.id)}
                          className="p-3 text-sunset-pink hover:text-sunset-pink/70 transition-colors opacity-50 hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
