import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Flag,
  Trash2,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCommunityPosts,
  createCommunityPost,
  getCommunityPost,
  addCommunityReply,
  togglePostLike,
  toggleReplyLike,
  reportCommunityItem,
  deleteCommunityPost
} from '../../../services/communityService';

const topics = [
  { id: 'all', label: 'All Circles' },
  { id: 'student', label: 'Student Support' },
  { id: 'workplace', label: 'Career & Workplace' },
  { id: 'rights', label: 'Understanding Rights' },
  { id: 'digital-safety', label: 'Digital Safety' },
  { id: 'growth', label: 'Personal Growth' },
];

export default function SupportCirclesTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Post Creator Modal
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTopic, setPostTopic] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [pseudonym, setPseudonym] = useState('EmpoweredVoice');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Expanded Post (for replies)
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [expandedPostData, setExpandedPostData] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [replyPseudonym, setReplyPseudonym] = useState('CourageousPeer');
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Report Modal
  const [reportingItem, setReportingItem] = useState(null); // { targetType, targetId }
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDetails, setReportDetails] = useState('');

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await getCommunityPosts({
        topic: selectedTopic,
        search: searchQuery,
        sort: sortBy,
      });
      if (res.success) {
        setPosts(res.posts || []);
      }
    } catch (_err) {
      console.error('Error loading community posts:', _err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPosts();
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCommunityPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        topic: postTopic,
        isAnonymous,
        pseudonym: isAnonymous ? pseudonym.trim() : '',
      });

      if (res.success) {
        toast.success('Your post has been published to the community!');
        setIsCreatingPost(false);
        setPostTitle('');
        setPostContent('');
        loadPosts();
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      toast.error('Failed to publish post. Please check your login session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await togglePostLike(postId);
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  hasLiked: res.hasLiked,
                  upvoteCount: res.upvoteCount,
                }
              : p
          )
        );
      }
    } catch (_err) {
    }
  };

  const handleExpandReplies = async (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setExpandedPostData(null);
      return;
    }

    setExpandedPostId(postId);
    setLoadingReplies(true);
    try {
      const res = await getCommunityPost(postId);
      if (res.success) {
        setExpandedPostData(res);
      }
    } catch (_err) {
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleAddReply = async (postId) => {
    if (!replyContent.trim()) return;
    try {
      const res = await addCommunityReply(postId, {
        content: replyContent.trim(),
        isAnonymous: replyAnonymous,
        pseudonym: replyAnonymous ? replyPseudonym.trim() : '',
      });

      if (res.success) {
        toast.success('Reply added!');
        setReplyContent('');
        // Update expanded post replies
        setExpandedPostData((prev) => ({
          ...prev,
          replies: [...(prev?.replies || []), res.reply],
        }));
        // Update post list reply count
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, replyCount: (p.replyCount || 0) + 1 } : p
          )
        );
      }
    } catch (_err) {
      toast.error('Failed to post reply. Please login first.');
    }
  };

  const handleToggleReplyLike = async (replyId) => {
    try {
      const res = await toggleReplyLike(replyId);
      if (res.success && expandedPostData) {
        setExpandedPostData((prev) => ({
          ...prev,
          replies: (prev.replies || []).map((r) =>
            r._id === replyId
              ? { ...r, hasLiked: res.hasLiked, upvoteCount: res.upvoteCount }
              : r
          ),
        }));
      }
    } catch (_err) {
      toast.error('Login required to upvote');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete your post?')) return;
    try {
      const res = await deleteCommunityPost(postId);
      if (res.success) {
        toast.success('Post removed');
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        if (expandedPostId === postId) {
          setExpandedPostId(null);
          setExpandedPostData(null);
        }
      }
    } catch (_err) {
      toast.error('Failed to delete post');
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportingItem) return;
    try {
      const res = await reportCommunityItem({
        targetType: reportingItem.targetType,
        targetId: reportingItem.targetId,
        reason: reportReason,
        details: reportDetails.trim(),
      });
      if (res.success) {
        toast.success('Thank you. Report received for safety moderation.');
        setReportingItem(null);
        setReportDetails('');
      }
    } catch (_err) {
      toast.error('Failed to submit report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Safe Space Notice */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
                Community Support Circles
              </h2>
              <p className="text-xs text-[#78726B]">
                A safe, peer-moderated space for mutual guidance, student issues, and workplace solidarity.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreatingPost(!isCreatingPost)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8C3737] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#752B2B] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{isCreatingPost ? 'Close Form' : 'Share With Circle'}</span>
          </button>
        </div>
      </div>

      {/* Community Guidelines Banner */}
      <div className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4 text-xs text-[#4F4A45] flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-[#8C3737] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Safe Space Guidelines:</strong> Posts in Community Circles are public to all HerGuardian AI members. Treat everyone with dignity. <em>Never post personal phone numbers, physical addresses, or unverified accusations against private individuals.</em> Peer advice is for mutual encouragement and does not substitute medical or legal counsel.
        </p>
      </div>

      {/* Post Creator Form */}
      <AnimatePresence>
        {isCreatingPost && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreatePost}
            className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4 overflow-hidden"
          >
            <h3 className="font-serif text-base font-bold text-[#1E1B18] pb-2 border-b border-[#EDE6E2]">
              Create a Community Post
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Topic Circle *
                </label>
                <select
                  value={postTopic}
                  onChange={(e) => setPostTopic(e.target.value)}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                >
                  <option value="general">General Support</option>
                  <option value="student">Student Support &amp; Campus</option>
                  <option value="workplace">Career &amp; Workplace Challenges</option>
                  <option value="rights">Understanding Rights &amp; Law</option>
                  <option value="digital-safety">Digital Safety &amp; Cyber Awareness</option>
                  <option value="growth">Personal Growth &amp; Life Skills</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Privacy &amp; Display Name
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-1.5 text-xs text-[#1E1B18] cursor-pointer">
                    <input
                      type="radio"
                      name="anon"
                      checked={!isAnonymous}
                      onChange={() => setIsAnonymous(false)}
                      className="text-[#8C3737] focus:ring-[#8C3737]"
                    />
                    <span>My Account Name</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#1E1B18] cursor-pointer">
                    <input
                      type="radio"
                      name="anon"
                      checked={isAnonymous}
                      onChange={() => setIsAnonymous(true)}
                      className="text-[#8C3737] focus:ring-[#8C3737]"
                    />
                    <span>Use Pseudonym</span>
                  </label>
                </div>
              </div>
            </div>

            {isAnonymous && (
              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Choose a Pseudonym / Avatar Name
                </label>
                <input
                  type="text"
                  value={pseudonym}
                  onChange={(e) => setPseudonym(e.target.value)}
                  placeholder="e.g. CourageousVoice, BraveSparrow, ResilientLotus"
                  className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Post Title *
              </label>
              <input
                type="text"
                required
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="e.g. How did you handle internal POSH complaints without retaliation?"
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                What would you like to discuss? *
              </label>
              <textarea
                rows={4}
                required
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share your perspective or ask for advice from fellow women in the community..."
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3 text-xs text-[#1E1B18] leading-relaxed focus:border-[#8C3737] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="rounded-lg border border-[#EDE6E2] bg-white px-4 py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white hover:bg-[#752B2B] disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : 'Publish to Circle'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter Topics & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Topics Pills */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedTopic === t.id
                  ? 'bg-[#8C3737] text-white shadow-xs'
                  : 'border border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#78726B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full rounded-lg border border-[#EDE6E2] bg-white pl-8 pr-3 py-1.5 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            />
          </form>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-[#EDE6E2] bg-white px-2.5 py-1.5 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
          >
            <option value="newest">Newest First</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-12 text-center text-xs text-[#78726B]">
          Loading circle conversations...
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-[#A8A29E] mb-2" />
          <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
            No Discussions in this Circle Yet
          </h3>
          <p className="text-xs text-[#78726B] mt-1 max-w-sm mx-auto">
            Be the first to start a conversation or ask for support. Click "Share With Circle" above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isExpanded = expandedPostId === post._id;

            return (
              <div
                key={post._id}
                className="rounded-2xl border border-[#EDE6E2] bg-white p-5 shadow-xs space-y-3"
              >
                {/* Post Top Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737] capitalize">
                      {post.topic}
                    </span>
                    <span className="text-xs font-semibold text-[#1E1B18]">
                      {post.authorName}
                    </span>
                    {post.isAnonymous && (
                      <span className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[9px] font-medium text-[#6B7280]">
                        Pseudonym
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#78726B]">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Post Title & Content */}
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#4F4A45] mt-1.5 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Post Bottom Controls */}
                <div className="pt-3 border-t border-[#EDE6E2] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {/* Helpful Upvote */}
                    <button
                      onClick={() => handleToggleLike(post._id)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        post.hasLiked
                          ? 'bg-[#F6EFEA] text-[#8C3737]'
                          : 'text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#1E1B18]'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{post.upvoteCount || 0} Helpful</span>
                    </button>

                    {/* Replies */}
                    <button
                      onClick={() => handleExpandReplies(post._id)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{post.replyCount || 0} Replies</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Report */}
                    <button
                      onClick={() => setReportingItem({ targetType: 'post', targetId: post._id })}
                      className="text-[11px] text-[#78726B] hover:text-[#BA2626] transition-colors flex items-center gap-1"
                      title="Report violation"
                    >
                      <Flag className="h-3 w-3" />
                      <span className="hidden sm:inline">Report</span>
                    </button>

                    {/* Delete if owner */}
                    {post.isOwner && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="text-[11px] text-[#BA2626] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Replies Drawer */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 pt-4 border-t border-[#EDE6E2] space-y-4"
                  >
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#78726B]">
                      Replies ({expandedPostData?.replies?.length || 0})
                    </h4>

                    {loadingReplies ? (
                      <p className="text-xs text-[#78726B]">Loading responses...</p>
                    ) : (
                      <div className="space-y-2.5">
                        {(expandedPostData?.replies || []).map((reply) => (
                          <div
                            key={reply._id}
                            className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#1E1B18]">
                                  {reply.authorName}
                                </span>
                                {reply.isAnonymous && (
                                  <span className="text-[9px] text-[#78726B] bg-white px-1 rounded border border-[#EDE6E2]">
                                    Pseudonym
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#78726B]">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[#4F4A45] leading-relaxed whitespace-pre-line">
                              {reply.content}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => handleToggleReplyLike(reply._id)}
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                  reply.hasLiked ? 'text-[#8C3737]' : 'text-[#78726B] hover:text-[#1E1B18]'
                                }`}
                              >
                                <ThumbsUp className="h-3 w-3" />
                                <span>{reply.upvoteCount || 0}</span>
                              </button>
                              <button
                                onClick={() => setReportingItem({ targetType: 'reply', targetId: reply._id })}
                                className="text-[10px] text-[#A8A29E] hover:text-[#BA2626]"
                              >
                                Report
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Reply Input */}
                    <div className="rounded-xl border border-[#EDE6E2] bg-[#FAF8F6] p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#1E1B18]">Leave a supportive reply:</span>
                        <label className="flex items-center gap-1 cursor-pointer text-[#78726B]">
                          <input
                            type="checkbox"
                            checked={replyAnonymous}
                            onChange={(e) => setReplyAnonymous(e.target.checked)}
                            className="text-[#8C3737] rounded"
                          />
                          <span>Reply using Pseudonym</span>
                        </label>
                      </div>

                      {replyAnonymous && (
                        <input
                          type="text"
                          value={replyPseudonym}
                          onChange={(e) => setReplyPseudonym(e.target.value)}
                          placeholder="Your pseudonym..."
                          className="w-full rounded border border-[#EDE6E2] bg-white px-2 py-1 text-xs text-[#1E1B18]"
                        />
                      )}

                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write your constructive message..."
                          className="flex-1 rounded-lg border border-[#EDE6E2] bg-white p-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                        />
                        <button
                          onClick={() => handleAddReply(post._id)}
                          className="self-end rounded-lg bg-[#8C3737] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#752B2B] transition-colors"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-[#BA2626]">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-serif text-base font-bold">Report Community Content</h3>
            </div>
            <p className="text-xs text-[#78726B]">
              Help maintain a secure and respectful environment. Reports are reviewed by human moderators.
            </p>

            <form onSubmit={handleReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2 text-xs text-[#1E1B18]"
                >
                  <option value="harassment">Harassment or Abusive Conduct</option>
                  <option value="spam">Spam or Irrelevant Advertisement</option>
                  <option value="misinformation">Dangerous / False Information</option>
                  <option value="private_info">Revealing Private / Contact Details</option>
                  <option value="other">Other Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context regarding the guideline violation..."
                  className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2 text-xs text-[#1E1B18]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingItem(null)}
                  className="rounded-lg border border-[#EDE6E2] px-4 py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#BA2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#9B1C1C]"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
