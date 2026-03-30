import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';

export interface VisionResult {
  intent: 'scan' | 'identify';
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
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { format: SaveFormat.JPEG, compress: 0.6, base64: true }
  );
  return { base64: result.base64!, width: result.width, height: result.height };
}

export async function analyzePhoto(
  imageUri: string,
  intent: 'scan' | 'identify'
): Promise<VisionResult> {
  const { base64 } = await compressForVision(imageUri);
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-food-photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': anonKey ?? '',
    },
    body: JSON.stringify({ image: base64, intent }),
  });

  let data: any;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    throw new Error(`Server error (${response.status}). Please try again.`);
  }

  if (!response.ok) {
    if (response.status === 429 && data?.type === 'vision_limit_exceeded') {
      throw new VisionRateLimitError(
        data.error ?? 'Monthly vision limit reached',
        data.limit ?? 5,
        data.used ?? 0
      );
    }
    throw new Error(data.error ?? `Vision analysis failed (${response.status})`);
  }

  return data as VisionResult;
}
