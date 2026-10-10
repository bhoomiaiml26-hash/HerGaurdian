import mongoose from 'mongoose';

const wellnessGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: ['mindfulness', 'movement', 'sleep', 'checkin', 'hydration', 'cycle', 'other'],
      default: 'mindfulness',
    },
    frequency: {
      type: String,
      enum: ['daily', '3x_week', '5x_week', 'weekly'],
      default: 'daily',
    },
    targetCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    currentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

wellnessGoalSchema.index({ user: 1, status: 1 });

const WellnessGoal = mongoose.model('WellnessGoal', wellnessGoalSchema);
export default WellnessGoal;
