import mongoose from 'mongoose';

const wellnessCheckinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'neutral', 'low', 'stressed', ''],
      default: '',
    },
    energy: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    stress: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    sleepQuality: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    generalWellbeing: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
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

wellnessCheckinSchema.index({ user: 1, date: 1 }, { unique: true });
wellnessCheckinSchema.index({ user: 1, createdAt: -1 });

const WellnessCheckin = mongoose.model('WellnessCheckin', wellnessCheckinSchema);
export default WellnessCheckin;
