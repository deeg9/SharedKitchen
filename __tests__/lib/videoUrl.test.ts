import { isVideoUrl, VIDEO_URL_PATTERNS } from '../../src/lib/videoUrl';

describe('isVideoUrl', () => {
  // VURL-01: TikTok URLs
  describe('TikTok URLs', () => {
    it('detects standard TikTok video URL', () => {
      expect(isVideoUrl('https://www.tiktok.com/@user/video/123')).toBe(true);
    });

    it('detects TikTok short link (vm.tiktok.com)', () => {
      expect(isVideoUrl('https://vm.tiktok.com/abc123/')).toBe(true);
    });

    it('detects TikTok with complex username', () => {
      expect(isVideoUrl('https://www.tiktok.com/@chef.mike_99/video/7890123456789')).toBe(true);
    });
  });

  // VURL-02: Instagram URLs
  describe('Instagram URLs', () => {
    it('detects Instagram reel URL', () => {
      expect(isVideoUrl('https://www.instagram.com/reel/ABC123/')).toBe(true);
    });

    it('detects Instagram post URL', () => {
      expect(isVideoUrl('https://www.instagram.com/p/ABC123/')).toBe(true);
    });
  });

  // VURL-03: YouTube URLs
  describe('YouTube URLs', () => {
    it('detects standard YouTube watch URL', () => {
      expect(isVideoUrl('https://www.youtube.com/watch?v=abc123')).toBe(true);
    });

    it('detects YouTube short link (youtu.be)', () => {
      expect(isVideoUrl('https://youtu.be/abc123')).toBe(true);
    });

    it('detects YouTube Shorts URL', () => {
      expect(isVideoUrl('https://www.youtube.com/shorts/abc123')).toBe(true);
    });
  });

  // VURL-04: Non-video URLs return false (fall through to HTML pipeline)
  describe('non-video URLs', () => {
    it('returns false for recipe blog URL', () => {
      expect(isVideoUrl('https://www.allrecipes.com/recipe/123')).toBe(false);
    });

    it('returns false for generic URL', () => {
      expect(isVideoUrl('https://google.com')).toBe(false);
    });

    it('returns false for non-URL string', () => {
      expect(isVideoUrl('not a url')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isVideoUrl('')).toBe(false);
    });
  });

  // Export verification
  describe('exports', () => {
    it('exports VIDEO_URL_PATTERNS array', () => {
      expect(Array.isArray(VIDEO_URL_PATTERNS)).toBe(true);
      expect(VIDEO_URL_PATTERNS.length).toBeGreaterThanOrEqual(3);
    });
  });
});
