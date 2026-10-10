import mongoose from 'mongoose';

const opportunitySearchCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  city: { type: String, required: true, trim: true },
  country: { type: String, default: '', trim: true },
  role: { type: String, default: '', trim: true },
  level: { type: String, default: '', trim: true },
  lastFetchedAt: { type: Date, required: true },
  lastSuccessfulAt: { type: Date, default: null },
  resultCount: { type: Number, default: 0 },
  sourceCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
  sourceErrors: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model('OpportunitySearchCache', opportunitySearchCacheSchema);