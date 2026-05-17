import moment from 'moment';

export function startOfDayMs(d) {
  return moment(d).startOf('day').valueOf();
}

function plannedEndMs(session) {
  if (!session?.date || !session?.endTime) return null;
  const day = moment(session.date).format('YYYY-MM-DD');
  const m = moment(`${day} ${session.endTime}`, 'YYYY-MM-DD HH:mm', true);
  return m.isValid() ? m.valueOf() : null;
}

/** Actual finish instant for a completed session (falls back for legacy rows). */
export function sessionCompletionMs(session) {
  if (session?.status !== 'completed') return null;

  if (session.completedAt) {
    return moment(session.completedAt).valueOf();
  }
  if (session.updatedAt) {
    return moment(session.updatedAt).valueOf();
  }
  const endMs = plannedEndMs(session);
  if (endMs !== null) return endMs;
  return startOfDayMs(session.date);
}

/** Timeline position: completion time when done, planned day when still scheduled. */
export function sessionChartMs(session) {
  if (session?.status === 'completed') {
    return sessionCompletionMs(session);
  }
  return startOfDayMs(session.date);
}

export function formatSessionChartLabel(session, tMs) {
  if (session?.status === 'completed' && session.completedAt) {
    return moment(session.completedAt).format('MMM D, h:mm A');
  }
  if (session?.status === 'completed' && !moment(tMs).isSame(moment(tMs).startOf('day'))) {
    return moment(tMs).format('MMM D, h:mm A');
  }
  return moment(tMs).format('MMM D');
}
