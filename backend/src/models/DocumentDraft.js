import mongoose from 'mongoose';

const documentDraftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Draft title is required'],
      trim: true,
      maxlength: [200, 'Draft title cannot exceed 200 characters'],
    },
    templateType: {
      type: String,
      required: true,
      trim: true,
      default: 'General Formal Complaint',
    },
    recipient: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Recipient cannot exceed 300 characters'],
    },
    subject: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Subject cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Draft content is required'],
      default: '',
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportCase',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'ready', 'finalized'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

documentDraftSchema.index({ user: 1, updatedAt: -1 });

const DocumentDraft = mongoose.model('DocumentDraft', documentDraftSchema);
export default DocumentDraft;
