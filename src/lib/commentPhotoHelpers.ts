import { supabase } from './supabase';

/**
 * Compresses and uploads a comment photo to Supabase Storage.
 * Returns the public URL or null on error (non-blocking).
 *
 * Compression: 1200px width, 70% JPEG quality.
 * Storage path: {userId}/{timestamp}.jpg in comment-photos bucket.
 */
export async function uploadCommentPhoto(
  userId: string,
  imageUri: string
): Promise<string | null> {
  try {
    // Lazy import — expo-image-manipulator requires a dev build (not Expo Go)
    const ImageManipulator = await import('expo-image-manipulator');

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1200 } }],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.7,
        base64: true,
      }
    );

    if (!result.base64) {
      console.warn('[commentPhotoHelpers] uploadCommentPhoto: no base64 data returned');
      return null;
    }

    // Convert base64 to ArrayBuffer for upload
    const binaryString = atob(result.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = `${userId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('comment-photos')
      .upload(filePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.warn('[commentPhotoHelpers] uploadCommentPhoto upload error:', uploadError.message);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('comment-photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('[commentPhotoHelpers] uploadCommentPhoto exception:', err);
    return null;
  }
}
