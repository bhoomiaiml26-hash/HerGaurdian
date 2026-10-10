import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  company: { type: String, default: null, trim: true, maxlength: 200 },
  location: { type: String, default: null, trim: true, maxlength: 300 },
  city: { type: String, default: null, trim: true, maxlength: 120 },
  country: { type: String, default: null, trim: true, maxlength: 120 },
  isRemote: { type: Boolean, default: null },
  workMode: { type: String, enum: ['remote', 'hybrid', 'onsite', 'unknown'], default: 'unknown' },
  level: { type: String, enum: ['intern', 'entry', 'mid', 'senior', 'unknown'], default: 'unknown' },
  skills: { type: [String], default: [] },
  description: { type: String, default: '', maxlength: 1000 },
  url: { type: String, required: true, trim: true },
  source: { type: String, required: true, trim: true },
  region: { type: String, enum: ['india', 'global'], required: true },
  postedAt: { type: Date, default: null },
  fetchedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

opportunitySchema.index({ url: 1 }, { unique: true });
opportunitySchema.index({ postedAt: -1, region: 1 });
opportunitySchema.index({ expiresAt: 1 });
opportunitySchema.index({ source: 1, fetchedAt: -1 });
opportunitySchema.index({ title: 'text', company: 'text', skills: 'text' });

export default mongoose.model('Opportunity', opportunitySchema);