import mongoose from 'mongoose';

// Career roadmap: user-specific AI-generated career plan
const careerRoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    careerGoal: {
      type: String,
      required: [true, 'Career goal is required'],
      trim: true,
      maxlength: [300, 'Career goal cannot exceed 300 characters'],
    },
    educationLevel: { type: String, trim: true, default: '' },
    currentSkills: { type: String, trim: true, default: '' },
    availableHoursPerWeek: { type: Number, default: null },
    learningPace: { type: String, enum: ['slow', 'moderate', 'intensive', ''], default: '' },
    budget: { type: String, enum: ['free', 'low', 'moderate', 'flexible', ''], default: '' },
    // Generated roadmap stored as structured text/JSON
    roadmapContent: {
      type: String,
      default: '',
    },
    stages: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        tasks: [{ title: { type: String }, completed: { type: Boolean, default: false } }],
        order: { type: Number },
      },
    ],
    notes: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

careerRoadmapSchema.index({ user: 1 });

const CareerRoadmap = mongoose.model('CareerRoadmap', careerRoadmapSchema);
export default CareerRoadmap;
