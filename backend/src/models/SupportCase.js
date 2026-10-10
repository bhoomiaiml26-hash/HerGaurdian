import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: String, default: '' },
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
});

const noteSchema = new mongoose.Schema({
  id: { type: String, required: true },
  date: { type: Date, default: Date.now },
  text: { type: String, required: true, trim: true },
});

const supportCaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General Support',
    },
    jurisdiction: {
      type: String,
      trim: true,
      default: 'National / General',
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    status: {
      type: String,
      enum: ['planning', 'in_progress', 'awaiting_response', 'follow_up_needed', 'resolved'],
      default: 'planning',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    incidentDate: {
      type: String,
      default: '',
    },
    targetResolutionDate: {
      type: String,
      default: '',
    },
    tasks: [taskSchema],
    notes: [noteSchema],
    savedResources: [
      {
        name: { type: String, trim: true },
        contact: { type: String, trim: true },
        url: { type: String, trim: true },
        category: { type: String, trim: true },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

supportCaseSchema.index({ user: 1, updatedAt: -1 });

const SupportCase = mongoose.model('SupportCase', supportCaseSchema);
export default SupportCase;
