import { z } from 'zod';
import mongoose from 'mongoose';
import { Subject } from './subjects.model.js';
import { Topic } from '../topics/topics.model.js';
import { validate } from './subjects.validation.js';
import { withTopicLock } from '../../utils/topicLock.js';
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Colors must use #RRGGBB').optional();
const topicSchema = z.object({ name: z.string().trim().min(1).max(200), color }).strict();
const subjectSchema = z.object({
  name: z.string().trim().min(3).max(200),
  type: z.enum(['academic', 'hobby', 'project']).default('academic'),
  description: z.string().max(5000).optional(), color,
  topics: z.array(z.union([z.string().trim().min(1).max(200), topicSchema])).max(200).default([]),
}).strict();
export const importSubjectsSchema = z.object({ subjects: z.array(subjectSchema).min(1).max(50) }).strict()
  .superRefine(({ subjects }, ctx) => {
    const names = new Set(); let total = 0;
    subjects.forEach((subject, index) => {
      const key = subject.type + ':' + subject.name.toLowerCase();
      if (names.has(key)) ctx.addIssue({ code: 'custom', path: ['subjects', index, 'name'], message: 'Duplicate subject in file' });
      names.add(key);
      const topics = new Set();
      subject.topics.forEach((topic, topicIndex) => {
        const name = (typeof topic === 'string' ? topic : topic.name).toLowerCase();
        if (topics.has(name)) ctx.addIssue({ code: 'custom', path: ['subjects', index, 'topics', topicIndex], message: 'Duplicate topic in subject' });
        topics.add(name);
      });
      total += subject.topics.length;
    });
    if (total > 2000) ctx.addIssue({ code: 'custom', path: ['subjects'], message: 'Import at most 2000 topics at once' });
  });
export const validateSubjectImport = validate(importSubjectsSchema);
export const importSubjectsService = (subjects, userObjectId) => withTopicLock('import:' + userObjectId, async () => {
  const existing = await Subject.find({ userObjectId }).select('name type').lean();
  const names = new Set(existing.map(s => s.type + ':' + s.name.toLowerCase()));
  const added = [], topics = [], skipped = [];
  for (const { topics: nested, ...subject } of subjects) {
    if (names.has(subject.type + ':' + subject.name.toLowerCase())) { skipped.push(subject.name); continue; }
    const _id = new mongoose.Types.ObjectId();
    added.push({ ...subject, _id, userObjectId });
    nested.forEach(topic => topics.push({ ...(typeof topic === 'string' ? { name: topic } : topic),
      _id: new mongoose.Types.ObjectId(), subjectObjectId: _id, userObjectId }));
  }
  try {
    if (added.length) await Subject.insertMany(added);
    if (topics.length) await Topic.insertMany(topics);
    return { importedSubjects: added.length, importedTopics: topics.length, skipped };
  } catch (error) {
    // Roll back only the generated IDs belonging to this import.
    await Topic.deleteMany({ _id: { $in: topics.map(t => t._id) }, userObjectId });
    await Subject.deleteMany({ _id: { $in: added.map(s => s._id) }, userObjectId });
    throw error;
  }
});
export async function importSubjects(req, res) {
  try { res.status(201).json(await importSubjectsService(req.body.subjects, req.user.id)); }
  catch (error) { res.status(500).json({ message: error.message }); }
}
