import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000' });
const cache = new Map();
let generation = 0;
export const getApiGeneration = () => generation;
export function clearApiCache() { cache.clear(); generation++; }
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => {
  if (response.config.method !== 'get') {
    clearApiCache();
    window.dispatchEvent(new Event('study-data-changed'));
    const session = response.data;
    if (['post', 'patch'].includes(response.config.method) && response.config.url?.startsWith('/sessions') && session?.status === 'completed') {
      window.dispatchEvent(new CustomEvent('session-completed', { detail: session }));
    }
  }
  return response;
}, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/users/')) {
    clearApiCache(); localStorage.removeItem('token'); localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-expired'));
  }
  return Promise.reject(error);
});
const originalGet = api.get.bind(api);
api.get = (url, config = {}) => {
  // GETs share in-flight requests and short-lived results per account.
  const key = JSON.stringify([localStorage.getItem('token'), url, config.params]);
  const entry = cache.get(key);
  if (entry && (entry.pending || entry.expires > Date.now())) return entry.promise;
  const version = generation;
  const next = { pending: true, expires: 0 };
  next.promise = originalGet(url, config).then(response => {
    next.pending = false; next.expires = Date.now() + 30000;
    if (generation !== version && cache.get(key) === next) cache.delete(key);
    return response;
  }, error => { if (cache.get(key) === next) cache.delete(key); throw error; });
  cache.set(key, next);
  return next.promise;
};
export default api;
