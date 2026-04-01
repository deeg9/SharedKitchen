import { supabase } from './supabase';

export interface VisionResult {
  intent: 'scan' | 'identify' | 'extract';
  items?: Array<{ name: string; category?: string; quantity?: string; brand?: string }>;
  dish?: { name: string; confidence: number; description?: string };
  raw?: any;
}

export class VisionRateLimitError extends Error {
  limit: number;
  used: number;
  remaining: number;
  constructor(message: string, limit: number, used: number) {
    super(message);
    this.name = 'VisionRateLimitError';
    this.limit = limit;
    this.used = used;
    this.remaining = Math.max(0, limit - used);
  }
}

export async function compressForVision(
  uri: string
): Promise<{ base64: string; width: number; height: number }> {
  // Lazy import — expo-image-manipulator requires a dev build (not Expo Go)
  const ImageManipulator = await import('expo-image-manipulator');
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.6, base64: true }
  );
  return { base64: result.base64!, width: result.width, height: result.height };
}

export async function analyzePhoto(
  imageUri: string,
  intent: 'scan' | 'identify' | 'extract'
): Promise<VisionResult> {
  const { base64 } = await compressForVision(imageUri);

  console.log('[Vision] Calling edge function via supabase.functions.invoke...', { intent });

  const { data, error } = await supabase.functions.invoke('analyze-food-photo', {
    body: { image: base64, intent },
  });

  console.log('[Vision] Response:', { error: error?.message, dataKeys: data ? Object.keys(data) : null });

  if (error) {
    // Try to read the response body for the actual error message
    try {
      const ctx = (error as any).context;
      if (ctx && !ctx.bodyUsed) {
        const body = await ctx.json();
        console.error('[Vision] Server error body:', JSON.stringify(body));
        throw new Error(body?.error ?? error.message ?? 'Vision analysis failed');
      }
    } catch (readErr: any) {
      if (readErr.message && readErr.message !== error.message) {
        throw readErr; // re-throw if we got a better error from the body
      }
    }
    console.error('[Vision] Error details:', error);
    throw new Error(error.message ?? 'Vision analysis failed');
  }

  if (data?.type === 'vision_limit_exceeded') {
    throw new VisionRateLimitError(
      data.error ?? 'Monthly vision limit reached',
      data.limit ?? 5,
      data.used ?? 0,
    );
  }

  return data as VisionResult;
}
