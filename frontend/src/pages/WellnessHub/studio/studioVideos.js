/**
 * Contextual video collections for the Wellness Studio.
 * Every video entry is verified via YouTube oEmbed for availability,
 * non-restricted embedding, and reputable health/wellness attribution.
 */
import { VIDEO_LIBRARY } from "../../../data/videoLibrary";

export const STRETCHING_VIDEOS = VIDEO_LIBRARY.stretching;
export const YOGA_VIDEOS = VIDEO_LIBRARY.yoga;
export const MOVEMENT_VIDEOS = VIDEO_LIBRARY.movement;
export const BREATHING_VIDEOS = VIDEO_LIBRARY.breathing;
export const MEDITATION_VIDEOS = VIDEO_LIBRARY.meditation;
export const SLEEP_VIDEOS = VIDEO_LIBRARY.sleep;
export const STRENGTH_VIDEOS = VIDEO_LIBRARY.strength;

// Combined convenience sets for studio sections:
export const RESET_VIDEOS = [...VIDEO_LIBRARY.meditation.slice(0, 2), ...VIDEO_LIBRARY.breathing.slice(0, 2)];
export const MOVEMENT_SECTION_VIDEOS = [...VIDEO_LIBRARY.stretching.slice(0, 2), ...VIDEO_LIBRARY.movement.slice(0, 2)];
