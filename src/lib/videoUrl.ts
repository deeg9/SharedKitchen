/**
 * Video URL detection for recipe import pipeline.
 * Pure function that identifies TikTok, Instagram, and YouTube URLs
 * so they can be routed to the video transcript extraction path
 * instead of the standard HTML recipe extraction path.
 */

export const VIDEO_URL_PATTERNS: RegExp[] = [
  /(?:tiktok\.com\/@[\w.-]+\/video|vm\.tiktok\.com)/i,
  /(?:instagram\.com\/(?:reel|p)\/)/i,
  /(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/i,
];

/**
 * Checks if a URL matches known video platform patterns.
 * Returns true for TikTok, Instagram Reels/Posts, YouTube, and YouTube Shorts.
 * Returns false for all other URLs (which fall through to the existing HTML pipeline).
 */
export function isVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some((pattern) => pattern.test(url));
}
