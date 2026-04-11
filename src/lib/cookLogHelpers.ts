import { supabase } from './supabase';

/**
 * Compresses and uploads a cook log photo to Supabase Storage.
 * Returns the public URL or null on error (non-blocking).
 *
 * Compression: 1200px width, 80% JPEG quality.
 * Storage path: {recipeId}/{userId}/{timestamp}.jpg in cook-log-photos bucket.
 */
export async function uploadCookLogPhoto(
  recipeId: string,
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
        compress: 0.8,
        base64: true,
      }
    );

    if (!result.base64) {
      console.warn('[cookLogHelpers] uploadCookLogPhoto: no base64 data returned');
      return null;
    }

    // Convert base64 to ArrayBuffer for upload
    const binaryString = atob(result.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = `${recipeId}/${userId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('cook-log-photos')
      .upload(filePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.warn('[cookLogHelpers] uploadCookLogPhoto upload error:', uploadError.message);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('cook-log-photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('[cookLogHelpers] uploadCookLogPhoto exception:', err);
    return null;
  }
}

/**
 * Deletes a cook log photo from Supabase Storage.
 * Extracts the file path from the public URL (everything after /cook-log-photos/).
 */
export async function deleteCookLogPhoto(photoUrl: string): Promise<void> {
  try {
    const marker = '/cook-log-photos/';
    const idx = photoUrl.indexOf(marker);
    if (idx === -1) {
      console.warn('[cookLogHelpers] deleteCookLogPhoto: could not extract path from URL');
      return;
    }

    const filePath = photoUrl.substring(idx + marker.length);

    const { error } = await supabase.storage
      .from('cook-log-photos')
      .remove([filePath]);

    if (error) {
      console.warn('[cookLogHelpers] deleteCookLogPhoto error:', error.message);
    }
  } catch (err) {
    console.warn('[cookLogHelpers] deleteCookLogPhoto exception:', err);
  }
}
