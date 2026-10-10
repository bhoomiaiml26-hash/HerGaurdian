import mongoose from 'mongoose';

const communityReplySchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [60, 'Author name cannot exceed 60 characters'],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
      maxlength: [2000, 'Reply content cannot exceed 2000 characters'],
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isReported: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'flagged'],
      default: 'active',
    },
  },
  { timestamps: true }
);

communityReplySchema.index({ post: 1, createdAt: 1 });

const CommunityReply = mongoose.model('CommunityReply', communityReplySchema);
export default CommunityReply;
