import mongoose from 'mongoose';

const communityReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'reply'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ['harassment', 'spam', 'misinformation', 'private_info', 'other'],
    },
    details: {
      type: String,
      trim: true,
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

communityReportSchema.index({ targetId: 1 });
communityReportSchema.index({ reporter: 1 });

const CommunityReport = mongoose.model('CommunityReport', communityReportSchema);
export default CommunityReport;
