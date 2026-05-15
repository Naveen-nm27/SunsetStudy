export function subjectIdOf(topic) {
  const s = topic?.subjectObjectId;
  if (s && typeof s === 'object' && s._id) return s._id;
  return s || '';
}

export function topicIdFromSession(session) {
  const t = session?.topicObjectId;
  if (t && typeof t === 'object' && t._id) return t._id;
  return t || '';
}
