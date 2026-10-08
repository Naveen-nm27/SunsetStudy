const pending = new Map();
// Serialize changes to a topic's session history within the API process.
export async function withTopicLock(topicId, work) {
  const key = String(topicId);
  const previous = pending.get(key) ?? Promise.resolve();
  const result = previous.catch(() => {}).then(work);
  pending.set(key, result);
  try { return await result; }
  finally { if (pending.get(key) === result) pending.delete(key); }
}
