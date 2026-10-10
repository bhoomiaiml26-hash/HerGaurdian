import mongoose from 'mongoose';

const windDownItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    // Approximate time of day for this step, HH:mm (optional)
    time: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    // Whether the user wants a reminder for this step (uses existing reminder infra from the client)
    reminder: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const windDownRoutineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'My wind-down routine',
    },
    activities: {
      type: [windDownItemSchema],
      default: [],
      validate: [(v) => v.length <= 12, 'A routine can have at most 12 activities'],
    },
    // Master toggle so a user can turn reminders off entirely
    remindersEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const WindDownRoutine = mongoose.model('WindDownRoutine', windDownRoutineSchema);
export default WindDownRoutine;
