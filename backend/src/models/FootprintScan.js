import mongoose from 'mongoose';

// FootprintScan: stores scan metadata and results; never stores full raw content
const footprintScanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scanType: {
      type: String,
      enum: ['text', 'url', 'screenshot'],
      required: true,
    },
    // Only stored if user consents; cleared when user deletes the report
    inputSummary: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200, // truncated preview only — never the full text
    },
    findings: [
      {
        type: { type: String, trim: true },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
        title: { type: String, trim: true },
        evidence: { type: String, trim: true, maxlength: 500 },
        recommendation: { type: String, trim: true, maxlength: 1000 },
        status: {
          type: String,
          enum: ['to_review', 'in_progress', 'resolved', 'not_applicable'],
          default: 'to_review',
        },
      },
    ],
    overallRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    findingCount: { type: Number, default: 0 },
    resolvedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

footprintScanSchema.index({ user: 1, createdAt: -1 });

const FootprintScan = mongoose.model('FootprintScan', footprintScanSchema);
export default FootprintScan;
