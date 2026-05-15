import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../api';
import moment from 'moment';
import { subjectIdOf } from '../utils/topic';

export default function CreateEntityModal({ type, onClose, onSuccess, userObjectId, subjects, topics, sessionPrefill }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  
  // Initialize form data based on type
  useEffect(() => {
    if (type === 'subject') {
      setFormData({ name: '', type: 'academic', userObjectId });
    } else if (type === 'topic') {
      setFormData({ name: '', subjectObjectId: subjects[0]?._id || '', userObjectId });
    } else if (type === 'session') {
      const pf = sessionPrefill || {};
      const defaultSubject = pf.subjectObjectId || subjects[0]?._id || '';
      const related = topics.filter((t) => subjectIdOf(t) === defaultSubject);
      const defaultTopic =
        (pf.topicObjectId && related.some((t) => t._id === pf.topicObjectId) ? pf.topicObjectId : null) ||
        related[0]?._id ||
        topics[0]?._id ||
        '';
      setFormData({
        subjectObjectId: defaultSubject,
        topicObjectId: defaultTopic,
        date: pf.date || moment().format('YYYY-MM-DD'),
        startTime: pf.startTime || '09:00',
        endTime: pf.endTime || '10:00',
        userObjectId,
      });
    } else if (type === 'block') {
      setFormData({ 
        title: '', 
        type: 'lecture', 
        date: moment().format('YYYY-MM-DD'), 
        startTime: '09:00', 
        endTime: '10:00', 
        userObjectId 
      });
    }
  }, [type, userObjectId, subjects, topics, sessionPrefill]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'subject') await api.post('/subjects', formData);
      if (type === 'topic') await api.post('/topics', formData);
      if (type === 'session') await api.post('/sessions', formData);
      if (type === 'block') await api.post('/blocks', formData);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'An error occurred');
    }
  };

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setFormData(prev => ({ ...prev, subjectObjectId: subId }));
    // Auto select first topic of this subject
    if (type === 'session') {
      const relatedTopics = topics.filter((t) => subjectIdOf(t) === subId);
      if (relatedTopics.length > 0) {
        setFormData(prev => ({ ...prev, topicObjectId: relatedTopics[0]._id }));
      } else {
        setFormData(prev => ({ ...prev, topicObjectId: '' }));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg fun-card p-8 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-50 hover:opacity-100 hover:text-sunset-pink transition-colors">
          <X size={24} />
        </button>

        <h2 className="text-3xl font-serif font-semibold mb-2 capitalize text-sunset-orange tracking-tight">
          Add {type}
        </h2>
        <p className="font-sans text-base text-text-muted mb-6 tracking-tight leading-relaxed">Fill in the fields below.</p>

        {error && <div className="bg-sunset-pink/15 text-sunset-pink p-3 rounded-xl mb-4 font-sans text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
          
          {/* SUBJECT FIELDS */}
          {type === 'subject' && (
            <>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Name</label>
                <input type="text" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Type</label>
                <select className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.type || 'academic'} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="academic">Academic</option>
                  <option value="hobby">Hobby</option>
                  <option value="project">Project</option>
                </select>
              </div>
            </>
          )}

          {/* TOPIC FIELDS */}
          {type === 'topic' && (
            <>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Name</label>
                <input type="text" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Subject</label>
                <select required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.subjectObjectId || ''} onChange={e => setFormData({...formData, subjectObjectId: e.target.value})}>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </>
          )}

          {/* SESSION FIELDS */}
          {type === 'session' && (
            <>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Subject</label>
                <select required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.subjectObjectId || ''} onChange={handleSubjectChange}>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Topic</label>
                {topics.filter((t) => subjectIdOf(t) === formData.subjectObjectId).length === 0 ? (
                  <p className="text-sm text-text-muted rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 leading-relaxed">
                    No topics under this subject yet. Add a topic in the library and pick this subject, then create a session.
                  </p>
                ) : (
                  <select
                    required
                    className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight"
                    value={formData.topicObjectId || ''}
                    onChange={(e) => setFormData({ ...formData, topicObjectId: e.target.value })}
                  >
                    {topics
                      .filter((t) => subjectIdOf(t) === formData.subjectObjectId)
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Date</label>
                <input type="date" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Start Time (HH:MM)</label>
                  <input type="time" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div className="w-1/2">
                  <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">End Time (HH:MM)</label>
                  <input type="time" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>
            </>
          )}

          {/* BLOCK FIELDS */}
          {type === 'block' && (
            <>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Title</label>
                <input type="text" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Type</label>
                <select className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.type || 'lecture'} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="lecture">Lecture</option>
                  <option value="sleep">Sleep</option>
                  <option value="work">Work</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Date</label>
                <input type="date" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">Start Time (HH:MM)</label>
                  <input type="time" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div className="w-1/2">
                  <label className="block font-sans text-sm font-medium text-text-muted mb-1.5 tracking-tight">End Time (HH:MM)</label>
                  <input type="time" required className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-3 py-2.5 focus:border-sunset-orange outline-none font-sans text-text-main tracking-tight" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={type === 'session' && topics.filter((t) => subjectIdOf(t) === formData.subjectObjectId).length === 0}
            className="fun-button w-full mt-6 text-base disabled:opacity-45 disabled:pointer-events-none"
          >
            Save {type}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
