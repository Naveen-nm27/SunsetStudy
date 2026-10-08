import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { Todo } from '../src/modules/todos/todos.model.js';
import { Subject } from '../src/modules/subjects/subjects.model.js';
import { Topic } from '../src/modules/topics/topics.model.js';
import { Session } from '../src/modules/sessions/sessions.model.js';
import { importSubjectsService } from '../src/modules/subjects/subjects.import.js';
import { createSessionService, updateSessionByIdService } from '../src/modules/sessions/sessions.service.js';
import { deleteSubjectByIdService } from '../src/modules/subjects/subjects.service.js';
import { deleteTopicByIdService, advanceTopicReviewSchedule, updateTopicByIdService } from '../src/modules/topics/topics.service.js';
import { User } from '../src/modules/users/users.model.js';

const user = '507f1f77bcf86cd799439011', other = '507f1f77bcf86cd799439012';
const subjectId = '507f1f77bcf86cd799439013', topicId = '507f1f77bcf86cd799439014';
let server, base, token;
function query(value) {
  return { then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
    lean: async () => value, select() { return this; }, sort() { return this; }, populate() { return this; } };
}
before(async () => {
  process.env.JWT_SECRET = 'sunsetstudy-test-secret-only';
  token = jwt.sign({ id: user }, process.env.JWT_SECRET);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
async function request(path, method = 'GET', body, auth = token) {
  const response = await fetch(base + path, { method, headers: {
    ...(auth ? { Authorization: 'Bearer ' + auth } : {}), 'Content-Type': 'application/json',
  }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
test('All study, task, and user management APIs require authentication', async () => {
  for (const path of ['/todos', '/subjects', '/topics', '/blocks', '/sessions', '/users']) {
    assert.equal((await request(path, 'GET', undefined, null)).status, 401);
  }
  assert.equal((await request('/todos', 'GET', undefined, 'bad-token')).status, 401);
});
test('User management cannot access another account and passwords are hidden by default', async () => {
  for (const method of ['GET', 'PATCH', 'DELETE']) assert.equal((await request('/users/' + other, method, method === 'PATCH' ? { userName: 'changed' } : undefined)).status, 404);
  assert.equal(User.schema.path('userPassword').options.select, false);
});
test('Missing or malformed login credentials return a validation response', async () => {
  assert.equal((await request('/users/login', 'POST', {})).status, 400);
  assert.equal((await request('/users/login', 'POST', { userEmail: 'bad', userPassword: 'x' })).status, 400);
});
test('Task creation assigns ownership from JWT and rejects spoofed fields', async t => {
  t.mock.method(Todo, 'create', async data => ({ ...data, _id: topicId }));
  const result = await request('/todos', 'POST', { title: 'Read chapter', priority: 'high', dueDate: '2026-10-07' });
  assert.equal(result.status, 201); assert.equal(result.body.userObjectId, user);
  assert.equal(result.body.title, 'Read chapter');
  assert.equal((await request('/todos', 'POST', { title: 'Read chapter', userObjectId: other })).status, 400);
  assert.equal((await request('/todos', 'POST', { title: '   ' })).status, 400);
});
test('Task updates and deletes are scoped to the authenticated account', async t => {
  let filter;
  t.mock.method(Todo, 'findOneAndUpdate', value => { filter = value; return query(null); });
  assert.equal((await request('/todos/' + topicId, 'PATCH', { completed: true })).status, 404);
  assert.deepEqual(filter, { _id: topicId, userObjectId: user });
  t.mock.method(Todo, 'findOneAndDelete', value => { filter = value; return query(null); });
  assert.equal((await request('/todos/' + topicId, 'DELETE')).status, 404);
  assert.equal(filter.userObjectId, user);
  assert.equal((await request('/todos/bad-id', 'DELETE')).status, 404);
});
test('Invalid subject imports reject the entire request before database writes', async () => {
  assert.equal((await request('/subjects/import', 'POST', { subjects: [{ name: 'Valid' }, { name: '' }] })).status, 400);
  assert.equal((await request('/subjects/import', 'POST', { subjects: [{ name: 'Valid', userObjectId: other }] })).status, 400);
});
test('Create routes reject missing JSON bodies with a validation response', async () => {
  for (const path of ['/subjects', '/topics', '/sessions', '/blocks']) assert.equal((await request(path, 'POST')).status, 400);
});
test('Subject import skips existing subjects and assigns nested topics to generated owned IDs', async t => {
  let insertedSubjects, insertedTopics;
  t.mock.method(Subject, 'find', () => query([{ name: 'Existing', type: 'academic' }]));
  t.mock.method(Subject, 'insertMany', async data => { insertedSubjects = data; });
  t.mock.method(Topic, 'insertMany', async data => { insertedTopics = data; });
  const result = await importSubjectsService([
    { name: 'Existing', type: 'academic', topics: ['Skipped'] },
    { name: 'New subject', type: 'academic', topics: ['First', { name: 'Second' }] },
  ], user);
  assert.deepEqual(result, { importedSubjects: 1, importedTopics: 2, skipped: ['Existing'] });
  assert.equal(insertedSubjects[0].userObjectId, user);
  assert.equal(insertedTopics[0].subjectObjectId.toString(), insertedSubjects[0]._id.toString());
  assert.equal(insertedTopics[1].userObjectId, user);
});
test('Failed imports roll back only IDs created by that import', async t => {
  let added, cleanupSubjects, cleanupTopics;
  t.mock.method(Subject, 'find', () => query([]));
  t.mock.method(Subject, 'insertMany', async data => { added = data; });
  t.mock.method(Topic, 'insertMany', async () => { throw new Error('Write failed'); });
  t.mock.method(Subject, 'deleteMany', async filter => { cleanupSubjects = filter; });
  t.mock.method(Topic, 'deleteMany', async filter => { cleanupTopics = filter; });
  await assert.rejects(importSubjectsService([{ name: 'New subject', type: 'academic', topics: ['Topic'] }], user), /Write failed/);
  assert.deepEqual(cleanupSubjects._id.$in, [added[0]._id]);
  assert.equal(cleanupTopics._id.$in.length, 1); assert.equal(cleanupTopics.userObjectId, user);
});
test('Sessions reject a topic belonging to a different subject before saving', async t => {
  t.mock.method(Subject, 'findOne', () => query({ _id: subjectId, userObjectId: user, status: 'active' }));
  t.mock.method(Topic, 'findOne', () => query({ _id: topicId, userObjectId: user, subjectObjectId: other }));
  const result = await request('/sessions', 'POST', { subjectObjectId: subjectId, topicObjectId: topicId, date: '2026-10-07', startTime: '09:00', endTime: '10:00' });
  assert.equal(result.status, 400); assert.match(result.body.message, /does not belong/);
});
test('Duplicate planned sessions and sessions for paused mastered topics are rejected', async t => {
  t.mock.method(Topic, 'findById', () => query({ status: 'in progress' }));
  t.mock.method(Session, 'exists', async () => true);
  const data = { topicObjectId: topicId, date: '2026-10-07', startTime: '09:00', endTime: '10:00' };
  await assert.rejects(createSessionService(data), /already exists/);
  t.mock.method(Topic, 'findById', () => query({ status: 'done', continueStudying: false }));
  await assert.rejects(createSessionService(data), /mastered/);
});
test('Repeated completion is idempotent and completed sessions cannot be reopened', async t => {
  let saves = 0;
  const doc = { _id: topicId, topicObjectId: topicId, status: 'completed', startTime: '09:00', endTime: '10:00',
    completedAt: new Date('2026-10-01'), toObject() { return { ...this }; }, async save() { saves++; } };
  t.mock.method(Session, 'findById', () => query(doc));
  // Any unexpected review-history update would try to query Mongo and fail.
  const updated = await updateSessionByIdService(topicId, { status: 'completed' });
  assert.equal(updated.completedAt.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(saves, 1);
  await assert.rejects(updateSessionByIdService(topicId, { status: 'planned' }), /cannot be reopened/);
});
test('Parent deletion is blocked while study history exists', async t => {
  t.mock.method(Topic, 'exists', async () => true);
  t.mock.method(Session, 'exists', async () => true);
  await assert.rejects(deleteSubjectByIdService(subjectId), error => error.status === 409);
  await assert.rejects(deleteTopicByIdService(topicId), error => error.status === 409);
});
test('Review history recomputation ignores early sessions and restores the last review after deletion', async t => {
  const topic = { _id: topicId, continueStudying: false, async save() {} };
  const baseDate = Date.parse('2026-01-01T12:00:00Z');
  const dates = [0, 0, 1, 2, 4, 11, 25, 55, 115].map(day => ({ completedAt: new Date(baseDate + day * 86400000) }));
  t.mock.method(Topic, 'findById', () => query(topic));
  t.mock.method(Session, 'find', () => query(dates));
  await advanceTopicReviewSchedule(topicId);
  assert.equal(topic.status, 'done'); assert.equal(topic.nextReviewDate, null);
  dates.pop();
  await advanceTopicReviewSchedule(topicId);
  assert.equal(topic.status, 'in progress'); assert.equal(topic.masteredAt, null);
  assert.equal(topic.nextReviewDate.toISOString(), '2026-04-26T12:00:00.000Z');
});
test('Renaming a mastered topic and repeated opt-in requests preserve its optional due date', async t => {
  const due = new Date('2026-12-01T12:00:00Z');
  const topic = { _id: topicId, name: 'Before', status: 'done', masteredAt: new Date(), continueStudying: true, nextReviewDate: due, async save() {} };
  t.mock.method(Topic, 'findById', () => query(topic));
  await updateTopicByIdService(topicId, { name: 'After', status: 'done' });
  assert.equal(topic.nextReviewDate, due);
  await updateTopicByIdService(topicId, { continueStudying: true });
  assert.equal(topic.nextReviewDate, due);
  await updateTopicByIdService(topicId, { continueStudying: false });
  assert.equal(topic.nextReviewDate, null);
});
test('Optional practice preserves a manually completed topic rather than resetting mastery', async t => {
  const topic = { _id: topicId, status: 'done', masterySource: 'manual', masteredAt: new Date('2026-01-01'), continueStudying: true, async save() {} };
  t.mock.method(Topic, 'findById', () => query(topic));
  t.mock.method(Session, 'find', () => query([{ completedAt: new Date('2026-10-06T12:00:00Z') }]));
  await advanceTopicReviewSchedule(topicId);
  assert.equal(topic.status, 'done'); assert.equal(topic.masterySource, 'manual');
  assert.equal(topic.nextReviewDate.toISOString(), '2026-12-05T12:00:00.000Z');
});
