import { useMemo, useState } from 'react';
import { CheckSquare, Plus, Trash2, Pencil } from 'lucide-react';
import api from '../api';
import { useStudyData } from '../hooks/useStudyData';
import { useToast } from '../hooks/uiContexts';
import { useConfirm } from '../hooks/uiContexts';
import { getFriendlyErrorMessage } from '../utils/apiErrors';
export default function TodosPage() {
  const { todos, reload, error } = useStudyData(['todos']);
  const [form, setForm] = useState({ title: '', priority: 'normal', dueDate: '' });
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('active');
  const [pending, setPending] = useState(false);
  const toast = useToast(), confirm = useConfirm();
  const visible = useMemo(() => todos.filter(t => filter === 'all' || t.completed === (filter === 'completed'))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || ({ high: 0, normal: 1, low: 2 }[a.priority] - { high: 0, normal: 1, low: 2 }[b.priority])), [todos, filter]);
  const save = async event => {
    event.preventDefault(); if (pending) return; setPending(true);
    try {
      const body = { ...form, dueDate: form.dueDate ? form.dueDate + 'T00:00:00.000Z' : null };
      if (editing) await api.patch('/todos/' + editing, body); else await api.post('/todos', body);
      setForm({ title: '', priority: 'normal', dueDate: '' }); setEditing(null); await reload();
    } catch (err) { toast(getFriendlyErrorMessage(err, 'Could not save this task.'), 'error'); }
    finally { setPending(false); }
  };
  const change = async (todo, remove = false) => {
    if (pending) return;
    if (remove && !await confirm('Delete this task?')) return;
    setPending(true);
    try {
      if (remove) await api.delete('/todos/' + todo._id);
      else await api.patch('/todos/' + todo._id, { completed: !todo.completed });
      if (remove && editing === todo._id) { setEditing(null); setForm({ title: '', priority: 'normal', dueDate: '' }); }
      await reload();
    } catch (err) { toast(getFriendlyErrorMessage(err, 'Could not update this task.'), 'error'); }
    finally { setPending(false); }
  };
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  return <main className="w-full max-w-4xl mx-auto p-6 md:p-10 space-y-6">
    <header><h1 className="text-4xl font-serif font-bold flex gap-3 items-center"><CheckSquare /> To-do list</h1><p className="text-text-muted mt-2">{todos.filter(t => !t.completed).length} tasks remaining. Make space for what matters today.</p></header>
    {error && <p role="alert">{error} <button onClick={() => reload()}>Retry</button></p>}
    <form onSubmit={save} className="fun-card p-5 grid gap-4 md:grid-cols-2">
      <label className="md:col-span-2">Task<input required maxLength={300} placeholder="What would you like to finish?" className="study-input w-full mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
      <label>Priority<select className="study-input w-full mt-1" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{['low', 'normal', 'high'].map(p => <option key={p}>{p}</option>)}</select></label>
      <label>Due date (optional)<input type="date" className="study-input w-full mt-1" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label>
      <div className="flex gap-3 md:col-span-2"><button disabled={pending} className="fun-button inline-flex items-center gap-2"><Plus size={16} /> {editing ? 'Save task' : 'Add task'}</button>{editing && <button type="button" className="fun-button-secondary" onClick={() => { setEditing(null); setForm({ title: '', priority: 'normal', dueDate: '' }); }}>Cancel</button>}</div>
    </form>
    <div className="flex gap-2">{['active', 'completed', 'all'].map(f => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} className={filter === f ? 'fun-button' : 'fun-button-secondary'}>{f}</button>)}</div>
    <ul className="space-y-3">{visible.map(todo => {
      const date = todo.dueDate?.slice(0, 10);
      return <li key={todo._id} className="fun-card p-4 flex items-start gap-3">
        <input type="checkbox" checked={todo.completed} disabled={pending} onChange={() => change(todo)} aria-label={'Complete ' + todo.title} className="mt-1 w-5 h-5 accent-orange-500" />
        <div className="flex-1 min-w-0"><p className={'break-words font-semibold ' + (todo.completed ? 'line-through text-text-muted' : '')}>{todo.title}</p><p className="text-sm text-text-muted">{todo.priority} priority {date && <span className={!todo.completed && date < today ? 'text-sunset-pink' : ''}>· Due {date}{!todo.completed && date < today ? ' (overdue)' : ''}</span>}</p></div>
        <button disabled={pending} onClick={() => { setEditing(todo._id); setForm({ title: todo.title, priority: todo.priority, dueDate: date || '' }); }} aria-label={'Edit ' + todo.title}><Pencil size={17} /></button>
        <button disabled={pending} onClick={() => change(todo, true)} aria-label={'Delete ' + todo.title} className="text-sunset-pink"><Trash2 size={18} /></button>
      </li>;
    })}</ul>
    {!visible.length && <p className="fun-card p-8 text-center text-text-muted">No {filter === 'all' ? '' : filter} tasks. {filter === 'active' ? 'Enjoy the breathing room.' : ''}</p>}
  </main>;
}
