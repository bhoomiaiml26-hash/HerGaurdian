import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema(
  {
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
    topic: {
      type: String,
      required: [true, 'Topic category is required'],
      enum: [
        'general',
        'student',
        'workplace',
        'rights',
        'digital-safety',
        'growth',
      ],
      default: 'general',
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [4000, 'Content cannot exceed 4000 characters'],
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replyCount: {
      type: Number,
      default: 0,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'flagged'],
      default: 'active',
    },
  },
  { timestamps: true }
);

communityPostSchema.index({ topic: 1, createdAt: -1 });
communityPostSchema.index({ user: 1 });

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
export default CommunityPost;
