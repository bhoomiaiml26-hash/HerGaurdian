import mongoose from 'mongoose';

const sleepLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD (typically morning of wakeup)
      required: true,
    },
    bedtime: {
      type: String, // HH:mm
      required: true,
    },
    wakeTime: {
      type: String, // HH:mm
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1440, // max 24 hours
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    windDownActivities: {
      type: [String],
      default: [],
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

sleepLogSchema.index({ user: 1, date: -1 });

const SleepLog = mongoose.model('SleepLog', sleepLogSchema);
export default SleepLog;
