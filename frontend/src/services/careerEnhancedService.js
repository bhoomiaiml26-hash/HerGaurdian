/**
 * Enhanced Career & Grants API service.
 */
import api from './api';

// ── ROADMAPS ────────────────────────────────────────────────────────────────

export const getRoadmaps = () =>
  api.get('/career/roadmaps').then((r) => r.data);

export const createRoadmap = (data) =>
  api.post('/career/roadmaps', data).then((r) => r.data);

export const updateRoadmap = (id, data) =>
  api.put(`/career/roadmaps/${id}`, data).then((r) => r.data);

export const toggleRoadmapTask = (id, stageIndex, taskIndex, completed) =>
  api.patch(`/career/roadmaps/${id}/task`, { stageIndex, taskIndex, completed }).then((r) => r.data);

export const deleteRoadmap = (id) =>
  api.delete(`/career/roadmaps/${id}`).then((r) => r.data);

// ── SKILL GAP ANALYZER ───────────────────────────────────────────────────────

export const analyzeSkillGap = (data) =>
  api.post('/career/skill-gap', data).then((r) => r.data);

