import { useCallback, useEffect, useSyncExternalStore } from 'react';
import api, { clearApiCache, getApiGeneration } from '../api';
let account = null;
let snapshot = {};
const empty = Object.freeze([]);
const listeners = new Set();
const subscribe = callback => { listeners.add(callback); return () => listeners.delete(callback); };
const emit = () => listeners.forEach(callback => callback());
const setResource = (name, value) => {
  snapshot = { ...snapshot, [name]: typeof value === 'function' ? value(snapshot[name] || empty) : value };
  emit();
};
export function useStudyData(resources) {
  const token = localStorage.getItem('token');
  const key = resources.join(',');
  const data = useSyncExternalStore(subscribe, () => snapshot);
  const reload = useCallback(async () => {
    const version = getApiGeneration();
    const result = await Promise.all(key.split(',').map(name => api.get('/' + name)));
    if (localStorage.getItem('token') !== token || getApiGeneration() !== version) return;
    const next = { error: null };
    key.split(',').forEach((name, index) => { next[name] = result[index].data; });
    snapshot = { ...snapshot, ...next }; emit();
    return next;
  }, [key, token]);
  useEffect(() => {
    if (account !== token) { account = token; snapshot = {}; emit(); }
    const load = () => { reload().catch(error => {
      if (localStorage.getItem('token') !== token) return;
      snapshot = { ...snapshot, error: error.response?.data?.message || 'Could not load your data. Try again.' }; emit();
    }); };
    const focus = () => { clearApiCache(); load(); };
    load();
    window.addEventListener('study-data-changed', load);
    window.addEventListener('focus', focus);
    return () => {
      window.removeEventListener('study-data-changed', load);
      window.removeEventListener('focus', focus);
    };
  }, [reload, token]);
  const output = { reload, error: data.error };
  for (const name of resources) {
    output[name] = account === token ? data[name] || empty : empty;
    output['set' + name[0].toUpperCase() + name.slice(1)] = value => setResource(name, value);
  }
  return output;
}
