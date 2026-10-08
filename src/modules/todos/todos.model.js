import mongoose from 'mongoose';
const todoSchema = new mongoose.Schema({
  userObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 300 },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  dueDate: { type: Date, default: null },
}, { timestamps: true });
todoSchema.index({ userObjectId: 1, completed: 1, createdAt: -1 });
export const Todo = mongoose.model('Todo', todoSchema);
