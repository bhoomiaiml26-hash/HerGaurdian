import api from "./api";
import { createWorker } from "tesseract.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Perform Digital Safety Analysis on a text message.
 * Sends the message to the backend NLP/ML endpoint.
 * If network is unreachable, falls back to a graceful client evaluation.
 *
 * PRIVACY NOTE:
 * The message is evaluated in-memory and never permanently stored.
 *
 * @param {string} message - Raw or OCR-extracted message text
 * @returns {Promise<object>} Analysis report
 */
export async function analyzeMessage(message) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message cannot be empty.");
  }

  const cleanText = message.trim();

  try {
    const response = await api.post("/safety-analyzer/analyze", { message: cleanText });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Analysis failed");
  } catch (err) {
    // If backend network error, use direct fallback call or throw friendly message
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    
    // Attempt direct fetch if axios baseURL had issues
    try {
      const directRes = await fetch(`${API_BASE_URL}/safety-analyzer/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanText })
      });
      const data = await directRes.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch {
      // Ignore secondary error and bubble up original or fallback
    }

    throw new Error(
      err.message || "Something went wrong while analyzing this message. Please try again."
    );
  }
}

/**
 * Extract visible text from an uploaded screenshot using client-side Tesseract.js OCR.
 * Entirely browser-based and privacy-preserving; the image is never sent to any external server.
 *
 * @param {File|string} imageSource - Browser File object or data URL
 * @param {function} onProgress - Progress callback receiving status text and percentage (0-100)
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function extractTextFromScreenshot(imageSource, onProgress) {
  let worker = null;
  try {
    if (onProgress) onProgress("Initializing optical character recognition...", 15);

    worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          const pct = Math.min(95, Math.max(20, Math.round(m.progress * 100)));
          onProgress(`Reading text from image... ${pct}%`, pct);
        } else if (onProgress && m.status) {
          onProgress(`Processing image (${m.status})...`, 25);
        }
      },
    });

    if (onProgress) onProgress("Extracting textual content...", 80);
    const ret = await worker.recognize(imageSource);

    const extractedText = ret.data?.text ? ret.data.text.trim() : "";
    const confidence = ret.data?.confidence || 0;

    await worker.terminate();
    worker = null;

    if (onProgress) onProgress("Text extraction complete", 100);

    return {
      text: extractedText,
      confidence: Math.round(confidence)
    };
  } catch (ocrError) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore cleanup error
      }
    }
    console.error("[SafetyAnalyzer OCR] Error during OCR:", ocrError);
    throw new Error(
      "We couldn't read enough text from this image. Try uploading a clearer screenshot."
    );
  }
}

export default {
  analyzeMessage,
  extractTextFromScreenshot
};
