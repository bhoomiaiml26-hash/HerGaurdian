/**
 * Footprint Scanner API service.
 */
import api from './api';
import { createWorker } from 'tesseract.js';

// ── SCAN ANALYSIS ────────────────────────────────────────────────────────────

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export const analyzeScan = (payload, defaultScanType = 'text') => {
  const body = typeof payload === 'string'
    ? { text: payload, scanType: defaultScanType }
    : { scanType: defaultScanType, ...payload };
  return api.post('/footprint/analyze', body).then((r) => r.data);
};

// ── SCAN HISTORY ─────────────────────────────────────────────────────────────

export const getScanHistory = (params = {}) =>
  api.get('/footprint/scans', { params }).then((r) => r.data);

export const getScanById = (id) =>
  api.get(`/footprint/scans/${id}`).then((r) => r.data);

export const updateFindingStatus = (scanId, findingIndex, status) =>
  api.patch(`/footprint/scans/${scanId}/findings/${findingIndex}`, { status }).then((r) => r.data);

export const deleteScan = (id) =>
  api.delete(`/footprint/scans/${id}`).then((r) => r.data);

export const deleteAllScans = () =>
  api.delete('/footprint/scans').then((r) => r.data);

// ── OCR ──────────────────────────────────────────────────────────────────────

/**
 * Extract text from an uploaded image using browser-side Tesseract.js.
 * The image never leaves the browser — fully privacy-preserving.
 */
export async function extractTextFromImage(imageSource, onProgress) {
  let worker = null;
  try {
    if (onProgress) onProgress('Initializing OCR engine…', 10);

    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.min(95, Math.max(20, Math.round(m.progress * 100)));
          onProgress(`Reading text from image… ${pct}%`, pct);
        }
      },
    });

    if (onProgress) onProgress('Extracting text…', 80);
    const ret = await worker.recognize(imageSource);
    const text = ret.data?.text?.trim() || '';
    const confidence = ret.data?.confidence || 0;
    await worker.terminate();
    worker = null;

    if (onProgress) onProgress('Text extraction complete', 100);
    return { text, confidence: Math.round(confidence) };
  } catch {
    if (worker) { try { await worker.terminate(); } catch { /* ignore */ } }
    throw new Error('Could not read text from this image. Try uploading a clearer screenshot.');
  }
}
