import * as ImageManipulator from 'expo-image-manipulator';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from '../../src/lib/supabase';
import { compressForVision, analyzePhoto, VisionRateLimitError } from '../../src/lib/vision';

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('vision', () => {
  describe('VisionRateLimitError', () => {
    it('sets name, limit, used, and remaining correctly', () => {
      const err = new VisionRateLimitError('limit reached', 5, 3);
      expect(err.name).toBe('VisionRateLimitError');
      expect(err.message).toBe('limit reached');
      expect(err.limit).toBe(5);
      expect(err.used).toBe(3);
      expect(err.remaining).toBe(2);
    });

    it('clamps remaining to 0 when used exceeds limit', () => {
      const err = new VisionRateLimitError('over', 5, 7);
      expect(err.remaining).toBe(0);
    });
  });

  describe('compressForVision', () => {
    it('calls manipulateAsync with correct params and returns result', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        base64: 'abc123',
        width: 1024,
        height: 768,
      });

      const result = await compressForVision('file:///photo.jpg');

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file:///photo.jpg',
        [{ resize: { width: 1024 } }],
        { format: 'jpeg', compress: 0.6, base64: true }
      );
      expect(result).toEqual({ base64: 'abc123', width: 1024, height: 768 });
    });
  });

  describe('analyzePhoto', () => {
    const mockSession = {
      data: { session: { access_token: 'test-token' } },
    };

    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSession);
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        base64: 'compressed-base64',
        width: 1024,
        height: 768,
      });
    });

    it('compresses image and calls fetch with correct URL/headers/body on success', async () => {
      const visionResult = {
        intent: 'scan',
        items: [{ name: 'Milk', category: 'Dairy & Eggs', quantity: '1' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]) as any,
        json: async () => visionResult,
      });

      const result = await analyzePhoto('file:///photo.jpg', 'scan');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/analyze-food-photo',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
            'apikey': 'test-anon-key',
          },
          body: JSON.stringify({ image: 'compressed-base64', intent: 'scan' }),
        })
      );
      expect(result).toEqual(visionResult);
    });

    it('throws VisionRateLimitError on 429 with vision_limit_exceeded type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['content-type', 'application/json']]) as any,
        json: async () => ({
          type: 'vision_limit_exceeded',
          error: 'Monthly limit reached',
          limit: 5,
          used: 5,
        }),
      });

      await expect(analyzePhoto('file:///photo.jpg', 'scan')).rejects.toThrow(VisionRateLimitError);
    });

    it('throws generic Error on non-OK non-429 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'application/json']]) as any,
        json: async () => ({ error: 'Internal server error' }),
      });

      await expect(analyzePhoto('file:///photo.jpg', 'scan')).rejects.toThrow('Internal server error');
    });

    it('throws Error on non-JSON content-type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]) as any,
      });

      await expect(analyzePhoto('file:///photo.jpg', 'scan')).rejects.toThrow('Server error');
    });
  });
});
