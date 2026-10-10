import mongoose from 'mongoose';

// Saved opportunities (scholarships, grants, internships, courses)
const savedOpportunitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    opportunityId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    organization: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['job', 'scholarship', 'grant', 'fellowship', 'internship', 'course', 'program', 'other'],
      default: 'other',
    },
    deadline: { type: Date, default: null },
    applicationUrl: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['interested', 'preparing', 'applied', 'result_received'],
      default: 'interested',
    },
    notes: { type: String, trim: true, default: '', maxlength: 2000 },
    documents: [
      {
        name: { type: String, trim: true },
        prepared: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

savedOpportunitySchema.index({ user: 1 });
savedOpportunitySchema.index({ user: 1, opportunityId: 1 }, { unique: true });

const SavedOpportunity = mongoose.model('SavedOpportunity', savedOpportunitySchema);
export default SavedOpportunity;
