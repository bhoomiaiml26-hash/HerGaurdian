import mongoose from 'mongoose';

const opportunityPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  roles: { type: [String], default: [] },
  cities: { type: [String], default: [] },
  workModes: { type: [String], enum: ['remote', 'hybrid', 'onsite'], default: [] },
  levels: { type: [String], enum: ['intern', 'entry', 'mid', 'senior'], default: [] },
  skills: { type: [String], default: [] },
  includeGlobal: { type: Boolean, default: true },
  lastVisitAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('OpportunityPreference', opportunityPreferenceSchema);