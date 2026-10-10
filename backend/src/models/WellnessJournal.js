import mongoose from 'mongoose';

const wellnessJournalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    content: {
      type: String,
      required: [true, 'Journal content is required'],
      trim: true,
      maxlength: 5000,
    },
    moodTag: {
      type: String,
      default: '',
    },
    date: {
      type: String, // YYYY-MM-DD
      default: () => new Date().toISOString().split('T')[0],
    },
  },
  { timestamps: true }
);

wellnessJournalSchema.index({ user: 1, createdAt: -1 });

const WellnessJournal = mongoose.model('WellnessJournal', wellnessJournalSchema);
export default WellnessJournal;
