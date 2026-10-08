import { useState } from 'react';
import { Trophy } from 'lucide-react';
import api from '../api';
import { useToast } from '../hooks/uiContexts';
import { getFriendlyErrorMessage } from '../utils/apiErrors';
export default function MasteryChoice({ topic, onChanged, onClose }) {
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const choose = async continueStudying => {
    setSaving(true);
    try {
      await api.patch('/topics/' + topic._id, { continueStudying });
      await onChanged?.();
      toast(continueStudying ? 'Optional reviews enabled every 60 days.' : 'Review schedule paused. You can resume from Memory.', 'success');
      onClose?.();
    } catch (error) { toast(getFriendlyErrorMessage(error, 'Could not save your choice.'), 'error'); }
    finally { setSaving(false); }
  };
  return <section className="fun-card p-5 mb-6 border-sunset-yellow space-y-3" aria-labelledby="mastery-title">
    <h2 id="mastery-title" className="font-serif text-xl font-bold flex items-center gap-2"><Trophy size={22} /> {topic.name}: mastered</h2>
    <p className="text-text-muted">{topic.continueStudying ? 'Optional reviews are enabled every 60 days. You can pause them at any time.' : 'Your review schedule has ended. Would you like to keep studying this topic?'}</p>
    <p className="text-sm text-text-muted">Mastery is a study milestone, not a guarantee of permanent memory.</p>
    <div className="flex flex-wrap gap-3">
      {!topic.continueStudying && <button disabled={saving} className="fun-button" onClick={() => choose(true)}>Keep studying</button>}
      <button disabled={saving} className="fun-button-secondary" onClick={() => choose(false)}>{topic.continueStudying ? 'Pause reviews' : 'Finish for now'}</button>
    </div>
  </section>;
}
