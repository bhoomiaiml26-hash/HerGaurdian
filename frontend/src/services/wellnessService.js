import api from "./api";

// ── Check-ins ────────────────────────────────────────────────────────────────
export const getCheckins = async (limit = 30) => {
  const response = await api.get("/wellness/checkins", { params: { limit } });
  return response.data;
};

export const saveCheckin = async (payload) => {
  const response = await api.post("/wellness/checkins", payload);
  return response.data;
};

export const updateCheckin = async (id, payload) => {
  const response = await api.put(`/wellness/checkins/${id}`, payload);
  return response.data;
};

export const deleteCheckin = async (id) => {
  const response = await api.delete(`/wellness/checkins/${id}`);
  return response.data;
};

// ── Menstrual logs ───────────────────────────────────────────────────────────
export const getMenstrualLogs = async (limit = 60) => {
  const response = await api.get("/wellness/menstrual", { params: { limit } });
  return response.data;
};

export const createMenstrualLog = async (payload) => {
  const response = await api.post("/wellness/menstrual", payload);
  return response.data;
};

export const updateMenstrualLog = async (id, payload) => {
  const response = await api.put(`/wellness/menstrual/${id}`, payload);
  return response.data;
};

export const deleteMenstrualLog = async (id) => {
  const response = await api.delete(`/wellness/menstrual/${id}`);
  return response.data;
};

// ── Sleep ────────────────────────────────────────────────────────────────────
export const getSleepLogs = async (limit = 30) => {
  const response = await api.get("/wellness/sleep", { params: { limit } });
  return response.data;
};

export const saveSleepLog = async (payload) => {
  const response = await api.post("/wellness/sleep", payload);
  return response.data;
};

export const deleteSleepLog = async (id) => {
  const response = await api.delete(`/wellness/sleep/${id}`);
  return response.data;
};

// ── Movement ─────────────────────────────────────────────────────────────────
export const getMovementLogs = async (limit = 40) => {
  const response = await api.get("/wellness/movement", { params: { limit } });
  return response.data;
};

export const createMovementLog = async (payload) => {
  const response = await api.post("/wellness/movement", payload);
  return response.data;
};

export const deleteMovementLog = async (id) => {
  const response = await api.delete(`/wellness/movement/${id}`);
  return response.data;
};

// ── Journal (private) ────────────────────────────────────────────────────────
export const getJournalEntries = async (limit = 30) => {
  const response = await api.get("/wellness/journal", { params: { limit } });
  return response.data;
};

export const createJournalEntry = async (payload) => {
  const response = await api.post("/wellness/journal", payload);
  return response.data;
};

export const updateJournalEntry = async (id, payload) => {
  const response = await api.put(`/wellness/journal/${id}`, payload);
  return response.data;
};

export const deleteJournalEntry = async (id) => {
  const response = await api.delete(`/wellness/journal/${id}`);
  return response.data;
};

// ── Goals ────────────────────────────────────────────────────────────────────
export const getGoals = async () => {
  const response = await api.get("/wellness/goals");
  return response.data;
};

export const createGoal = async (payload) => {
  const response = await api.post("/wellness/goals", payload);
  return response.data;
};

export const updateGoal = async (id, payload) => {
  const response = await api.put(`/wellness/goals/${id}`, payload);
  return response.data;
};

export const incrementGoal = async (id) => {
  const response = await api.patch(`/wellness/goals/${id}/increment`);
  return response.data;
};

export const deleteGoal = async (id) => {
  const response = await api.delete(`/wellness/goals/${id}`);
  return response.data;
};

// ── Wind-down routine ────────────────────────────────────────────────────────
export const getWindDownRoutine = async () => {
  const response = await api.get("/wellness/winddown");
  return response.data;
};

export const saveWindDownRoutine = async (payload) => {
  const response = await api.put("/wellness/winddown", payload);
  return response.data;
};

// ── Insights ─────────────────────────────────────────────────────────────────
export const getInsights = async () => {
  const response = await api.get("/wellness/insights");
  return response.data;
};

/** Optional AI rephrase of an already-computed insight (consent required). */
export const explainInsight = async (title, observation) => {
  const response = await api.post("/wellness/ai/explain", {
    title,
    observation,
    consent: true,
  });
  return response.data;
};

/** Optional AI reflection on ONE journal entry (consent required). */
export const reflectOnEntry = async (entryId) => {
  const response = await api.post("/wellness/ai/reflect", {
    entryId,
    consent: true,
  });
  return response.data;
};
