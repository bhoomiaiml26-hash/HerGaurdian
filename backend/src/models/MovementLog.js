import mongoose from 'mongoose';

const movementLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      enum: ['stretching', 'walking', 'mobility', 'yoga', 'desk-break', 'other'],
      default: 'stretching',
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 360,
    },
    effort: {
      type: String,
      enum: ['gentle', 'moderate', 'invigorating', ''],
      default: 'gentle',
    },
    completed: {
      type: Boolean,
      default: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      default: () => new Date().toISOString().split('T')[0],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true }
);

movementLogSchema.index({ user: 1, date: -1 });

const MovementLog = mongoose.model('MovementLog', movementLogSchema);
export default MovementLog;
