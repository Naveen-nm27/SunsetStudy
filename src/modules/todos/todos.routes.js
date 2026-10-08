import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Todo } from './todos.model.js';
import { validate } from '../subjects/subjects.validation.js';
const router = express.Router();
export const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(300), completed: z.boolean().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(), dueDate: z.coerce.date().nullable().optional(),
}).strict();
const updateSchema = createTodoSchema.partial().refine(data => Object.keys(data).length > 0, 'At least one field is required');
router.get('/', async (req, res) => res.json(await Todo.find({ userObjectId: req.user.id }).sort({ completed: 1, createdAt: -1 }).lean()));
router.post('/', validate(createTodoSchema), async (req, res) => res.status(201).json(await Todo.create({ ...req.body, userObjectId: req.user.id })));
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Task not found' });
  next();
});
router.patch('/:id', validate(updateSchema), async (req, res) => {
  const todo = await Todo.findOneAndUpdate({ _id: req.params.id, userObjectId: req.user.id }, req.body, { new: true, runValidators: true }).lean();
  if (!todo) return res.status(404).json({ message: 'Task not found' });
  res.json(todo);
});
router.delete('/:id', async (req, res) => {
  const todo = await Todo.findOneAndDelete({ _id: req.params.id, userObjectId: req.user.id }).lean();
  if (!todo) return res.status(404).json({ message: 'Task not found' });
  res.json(todo);
});
export default router;
