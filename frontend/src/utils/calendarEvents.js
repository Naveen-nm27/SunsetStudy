import moment from 'moment';

function combineDateAndTime(dateVal, timeHHMM) {
  const day = moment.utc(dateVal).format('YYYY-MM-DD');
  const m = moment(`${day} ${timeHHMM || '00:00'}`, 'YYYY-MM-DD HH:mm');
  return m.isValid() ? m.toDate() : moment(dateVal).toDate();
}

function topicTitle(session) {
  return session?.topicObjectId?.name || 'Study session';
}

function weekdayName(d) {
  return moment(d).format('dddd').toLowerCase();
}

function eventWindow(date, startTime, endTime) {
  const start = combineDateAndTime(date, startTime);
  const end = combineDateAndTime(date, endTime);
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

function expandBlockAcrossRange(block, rangeStart, rangeEnd) {
  const startTime = block.startTime || '09:00';
  const endTime = block.endTime || '10:00';
  const recurringDays = (block.days || []).map((d) => String(d).toLowerCase());

  if (!block.recurring || recurringDays.length === 0) {
    return [
      {
        id: `block-${block._id}`,
        title: block.title,
        ...eventWindow(block.date, startTime, endTime),
        type: 'block',
        resource: block,
      },
    ];
  }

  const events = [];
  // Include the previous night's commitment when it overlaps the visible day.
  const cursor = moment(rangeStart).subtract(1, 'day').startOf('day');
  const last = moment(rangeEnd).endOf('day');
  while (cursor.isSameOrBefore(last, 'day')) {
    if (recurringDays.includes(weekdayName(cursor)) && cursor.format('YYYY-MM-DD') >= moment.utc(block.date).format('YYYY-MM-DD')) {
      events.push({
        id: `block-${block._id}-${cursor.format('YYYY-MM-DD')}`,
        title: block.title,
        ...eventWindow(cursor.format('YYYY-MM-DD'), startTime, endTime),
        type: 'block',
        resource: block,
      });
    }
    cursor.add(1, 'day');
  }
  return events;
}

export function buildCalendarEvents(sessions, blocks, rangeStart, rangeEnd) {
  const sessionEvents = (sessions || []).map((s) => ({
    id: `session-${s._id}`,
    title: topicTitle(s),
    ...eventWindow(s.date, s.startTime, s.endTime),
    type: 'session',
    status: s.status,
    resource: s,
  }));

  const blockEvents = (blocks || []).flatMap((b) => expandBlockAcrossRange(b, rangeStart, rangeEnd));
  return [...sessionEvents, ...blockEvents];
}

export function calendarRangeForView(date, view) {
  if (view === 'day') {
    return {
      start: moment(date).startOf('day').toDate(),
      end: moment(date).endOf('day').toDate(),
    };
  }
  return {
    start: moment(date).startOf('week').toDate(),
    end: moment(date).endOf('week').toDate(),
  };
}
