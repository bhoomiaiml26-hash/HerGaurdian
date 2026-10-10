/**
 * Community & Rights API Service
 * Handles Discussion Circles, Private Support Cases, and Document Drafts
 */
import api from './api';

// ── COMMUNITY CIRCLES (DISCUSSIONS) ──────────────────────────────────────────

export const getCommunityPosts = (params = {}) =>
  api.get('/community/posts', { params }).then((r) => r.data);

export const createCommunityPost = (data) =>
  api.post('/community/posts', data).then((r) => r.data);

export const getCommunityPost = (id) =>
  api.get(`/community/posts/${id}`).then((r) => r.data);

export const addCommunityReply = (postId, data) =>
  api.post(`/community/posts/${postId}/replies`, data).then((r) => r.data);

export const togglePostLike = (postId) =>
  api.post(`/community/posts/${postId}/like`).then((r) => r.data);

export const toggleReplyLike = (replyId) =>
  api.post(`/community/replies/${replyId}/like`).then((r) => r.data);

export const reportCommunityItem = (data) =>
  api.post('/community/report', data).then((r) => r.data);

export const deleteCommunityPost = (postId) =>
  api.delete(`/community/posts/${postId}`).then((r) => r.data);

export const deleteCommunityReply = (replyId) =>
  api.delete(`/community/replies/${replyId}`).then((r) => r.data);

// ── PRIVATE SUPPORT CASES & TRACKER ──────────────────────────────────────────

export const getSupportCases = (params = {}) =>
  api.get('/support-cases', { params }).then((r) => r.data);

export const createSupportCase = (data) =>
  api.post('/support-cases', data).then((r) => r.data);

export const getSupportCase = (id) =>
  api.get(`/support-cases/${id}`).then((r) => r.data);

export const updateSupportCase = (id, data) =>
  api.put(`/support-cases/${id}`, data).then((r) => r.data);

export const deleteSupportCase = (id) =>
  api.delete(`/support-cases/${id}`).then((r) => r.data);

export const addCaseTask = (caseId, taskData) =>
  api.post(`/support-cases/${caseId}/tasks`, taskData).then((r) => r.data);

export const toggleCaseTask = (caseId, taskId, completed) =>
  api.put(`/support-cases/${caseId}/tasks/${taskId}`, { completed }).then((r) => r.data);

// ── COMPLAINT & LETTER DRAFTS ────────────────────────────────────────────────

export const getDocumentDrafts = () =>
  api.get('/drafts').then((r) => r.data);

export const saveDocumentDraft = (data) =>
  api.post('/drafts', data).then((r) => r.data);

export const getDocumentDraft = (id) =>
  api.get(`/drafts/${id}`).then((r) => r.data);

export const updateDocumentDraft = (id, data) =>
  api.put(`/drafts/${id}`, data).then((r) => r.data);

export const deleteDocumentDraft = (id) =>
  api.delete(`/drafts/${id}`).then((r) => r.data);
