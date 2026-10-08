import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import api from '../api';
import { useToast } from '../hooks/uiContexts';
import { getFriendlyErrorMessage } from '../utils/apiErrors';
const SUBJECT_TEMPLATE = { subjects: [{ name: 'Mathematics', type: 'academic', color: '#F97316',
  description: 'Semester one', topics: ['Algebra', { name: 'Calculus', color: '#EC4899' }] }] };
export default function SubjectImport({ onImported, subjects }) {
  const input = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const template = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(SUBJECT_TEMPLATE, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sunsetstudy-subjects.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const read = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setError(''); setPreview(null);
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a JSON file smaller than 1 MB.');
      const parsed = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
      const body = Array.isArray(parsed) ? { subjects: parsed } : parsed;
      if (!Array.isArray(body.subjects) || !body.subjects.length || body.subjects.length > 50) throw new Error('Provide 1–50 subjects in a subjects array.');
      let total = 0;
      const names = new Set();
      for (const subject of body.subjects) {
        if (!subject || typeof subject.name !== 'string' || subject.name.trim().length < 3) throw new Error('Each subject needs a name with at least 3 characters.');
        if (!['academic', 'hobby', 'project'].includes(subject.type || 'academic')) throw new Error('Subject type must be academic, hobby, or project.');
        const key = (subject.type || 'academic') + ':' + subject.name.trim().toLowerCase();
        if (names.has(key)) throw new Error('Remove duplicate subjects from the file.');
        names.add(key);
        if (subject.topics && (!Array.isArray(subject.topics) || subject.topics.length > 200)) throw new Error('Each subject can have at most 200 topics.');
        for (const topic of subject.topics || []) {
          if (typeof (typeof topic === 'string' ? topic : topic?.name) !== 'string' || !(typeof topic === 'string' ? topic : topic.name).trim()) throw new Error('Each topic needs a name.');
        }
        total += (subject.topics || []).length;
      }
      if (total > 2000) throw new Error('Import at most 2000 topics at once.');
      setPreview(body);
    } catch (err) { setError(err instanceof SyntaxError ? 'This file is not valid JSON.' : err.message); }
  };
  const submit = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/subjects/import', preview);
      toast(`Imported ${data.importedSubjects} subjects and ${data.importedTopics} topics. ${data.skipped.length} existing subjects skipped.`, 'success');
      setPreview(null); await onImported?.();
    } catch (err) { setError(getFriendlyErrorMessage(err, 'Could not import this file.')); }
    finally { setBusy(false); }
  };
  return <section className="fun-card p-5 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-serif text-xl font-bold">Import your subjects</h2><p className="text-sm text-text-muted">Upload JSON with subjects and nested topics. Matching subjects are skipped, including their topics.</p></div>
      <div className="flex gap-2 flex-wrap">
        <button className="fun-button-secondary inline-flex gap-2 items-center" onClick={template}><Download size={16} /> Example JSON</button>
        <button className="fun-button inline-flex gap-2 items-center" disabled={busy} onClick={() => input.current.click()}><Upload size={16} /> Choose JSON</button>
        <input ref={input} type="file" accept=".json,application/json" onChange={read} className="hidden" aria-label="Import subjects JSON" />
      </div>
    </div>
    {error && <p role="alert" className="text-sunset-pink whitespace-pre-wrap">{error}</p>}
    {preview && <div className="border-t border-border-color pt-3 space-y-3">
      <p className="font-bold">Preview: {preview.subjects.length} subjects, {preview.subjects.reduce((sum, s) => sum + (s.topics || []).length, 0)} topics</p>
      <ul className="max-h-48 overflow-y-auto space-y-1">{preview.subjects.map((s, i) => {
        const exists = subjects.some(current => current.type === (s.type || 'academic') && current.name.toLowerCase() === s.name.trim().toLowerCase());
        return <li key={i}>{s.name} · {(s.topics || []).length} topics {exists && <span className="text-text-muted">(already exists; skipped)</span>}</li>;
      })}</ul>
      <div className="flex gap-3"><button className="fun-button" disabled={busy} onClick={submit}>{busy ? 'Importing…' : 'Import subjects'}</button><button disabled={busy} className="fun-button-secondary" onClick={() => setPreview(null)}>Cancel</button></div>
    </div>}
  </section>;
}
