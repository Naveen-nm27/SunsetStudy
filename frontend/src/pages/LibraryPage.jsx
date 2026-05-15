import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import api from '../api';
import CreateEntityModal from '../components/CreateEntityModal';
import { subjectIdOf } from '../utils/topic';

export default function LibraryPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);

  const load = async () => {
    const [s, t] = await Promise.all([api.get('/subjects'), api.get('/topics')]);
    setSubjects(s.data);
    setTopics(t.data);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const subjectName = (id) => subjects.find((s) => s._id === id)?.name || '—';

  const delSubject = async (id) => {
    if (!window.confirm('Delete this subject? Topics may still reference it in the database.')) return;
    try {
      await api.delete(`/subjects/${id}`);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not delete subject');
    }
  };

  const delTopic = async (id) => {
    if (!window.confirm('Delete this topic and unlink future sessions manually if needed?')) return;
    try {
      await api.delete(`/topics/${id}`);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not delete topic');
    }
  };

  const saveSubject = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;
    try {
      await api.patch(`/subjects/${editingSubject._id}`, {
        name: editingSubject.name,
        type: editingSubject.type,
      });
      setEditingSubject(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const saveTopic = async (e) => {
    e.preventDefault();
    if (!editingTopic) return;
    try {
      await api.patch(`/topics/${editingTopic._id}`, {
        name: editingTopic.name,
        status: editingTopic.status,
      });
      setEditingTopic(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-10 space-y-10">
      {modalType && (
        <CreateEntityModal
          type={modalType}
          onClose={() => setModalType(null)}
          onSuccess={load}
          userObjectId={user.id}
          subjects={subjects}
          topics={topics}
        />
      )}

      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
          <form onSubmit={saveSubject} className="fun-card p-8 w-full max-w-md space-y-4">
            <h3 className="text-xl font-serif font-bold text-sunset-orange">Edit subject</h3>
            <div>
              <label className="block font-mono text-xs uppercase text-text-muted mb-1">Name</label>
              <input
                className="w-full bg-bg-base border-2 border-border-color rounded-xl px-3 py-2 font-serif"
                value={editingSubject.name}
                onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase text-text-muted mb-1">Type</label>
              <select
                className="w-full bg-bg-base border-2 border-border-color rounded-xl px-3 py-2 font-serif"
                value={editingSubject.type}
                onChange={(e) => setEditingSubject({ ...editingSubject, type: e.target.value })}
              >
                <option value="academic">Academic</option>
                <option value="hobby">Hobby</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" className="fun-button-secondary text-xs py-2" onClick={() => setEditingSubject(null)}>
                Cancel
              </button>
              <button type="submit" className="fun-button text-xs py-2">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
          <form onSubmit={saveTopic} className="fun-card p-8 w-full max-w-md space-y-4">
            <h3 className="text-xl font-serif font-bold text-sunset-orange">Edit topic</h3>
            <div>
              <label className="block font-mono text-xs uppercase text-text-muted mb-1">Name</label>
              <input
                className="w-full bg-bg-base border-2 border-border-color rounded-xl px-3 py-2 font-serif"
                value={editingTopic.name}
                onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase text-text-muted mb-1">Status</label>
              <select
                className="w-full bg-bg-base border-2 border-border-color rounded-xl px-3 py-2 font-serif"
                value={editingTopic.status}
                onChange={(e) => setEditingTopic({ ...editingTopic, status: e.target.value })}
              >
                <option value="not started">Not started</option>
                <option value="in progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" className="fun-button-secondary text-xs py-2" onClick={() => setEditingTopic(null)}>
                Cancel
              </button>
              <button type="submit" className="fun-button text-xs py-2">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-3xl font-serif font-bold">Subjects</h2>
          <button type="button" onClick={() => setModalType('subject')} className="fun-button-secondary text-xs py-2 flex items-center gap-1">
            <Plus size={14} /> Add subject
          </button>
        </div>
        <div className="fun-card overflow-x-auto">
          <table className="w-full text-base min-w-[520px]">
            <thead className="font-mono text-xs uppercase text-text-muted border-b border-border-color">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s._id} className="border-b border-border-color last:border-0">
                  <td className="p-3 font-serif font-bold">{s.name}</td>
                  <td className="p-3 font-mono text-xs uppercase">{s.type}</td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      type="button"
                      className="p-2 text-text-muted hover:text-sunset-orange"
                      onClick={() => setEditingSubject({ _id: s._id, name: s.name, type: s.type })}
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="p-2 text-sunset-pink opacity-80 hover:opacity-100" onClick={() => delSubject(s._id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-text-muted font-serif">
                    No subjects yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-3xl font-serif font-bold">Topics</h2>
          <button type="button" onClick={() => setModalType('topic')} className="fun-button-secondary text-xs py-2 flex items-center gap-1">
            <Plus size={14} /> Add topic
          </button>
        </div>
        <div className="fun-card overflow-x-auto">
          <table className="w-full text-base min-w-[560px]">
            <thead className="font-mono text-xs uppercase text-text-muted border-b border-border-color">
              <tr>
                <th className="text-left p-3">Topic</th>
                <th className="text-left p-3">Subject</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t._id} className="border-b border-border-color last:border-0">
                  <td className="p-3 font-serif font-bold">{t.name}</td>
                  <td className="p-3 font-mono text-xs">{subjectName(subjectIdOf(t))}</td>
                  <td className="p-3 font-mono text-xs">{t.status}</td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      type="button"
                      className="p-2 text-text-muted hover:text-sunset-orange"
                      onClick={() => setEditingTopic({ _id: t._id, name: t.name, status: t.status })}
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="p-2 text-sunset-pink opacity-80 hover:opacity-100" onClick={() => delTopic(t._id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {topics.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-muted font-serif">
                    No topics yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
