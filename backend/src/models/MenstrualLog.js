import mongoose from 'mongoose';

const menstrualLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    endDate: {
      type: String, // YYYY-MM-DD
      default: '',
    },
    flow: {
      type: String,
      enum: ['spotting', 'light', 'medium', 'heavy', ''],
      default: 'medium',
    },
    painLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 2,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    mood: {
      type: String,
      default: '',
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

menstrualLogSchema.index({ user: 1, startDate: -1 });

const MenstrualLog = mongoose.model('MenstrualLog', menstrualLogSchema);
export default MenstrualLog;
