import { supabase } from './supabase';
import { FeedPost, FeedPostInsert } from '../types/database';

/**
 * Creates a feed_post row in Supabase.
 * Fire-and-forget: returns null on error (never throws).
 */
export async function createFeedPost(params: {
  kitchenId: string;
  mealPlanId: string;
  recipeName: string;
  recipeImageUrl: string | null;
  mealDate: string;
  mealType: string;
}): Promise<FeedPost | null> {
  try {
    const insert: FeedPostInsert = {
      kitchen_id: params.kitchenId,
      meal_plan_id: params.mealPlanId,
      recipe_name: params.recipeName,
      recipe_image_url: params.recipeImageUrl,
      meal_date: params.mealDate,
      meal_type: params.mealType,
    };

    const { data, error } = await supabase
      .from('feed_posts')
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.warn('[feedHelpers] createFeedPost error:', error.message);
      return null;
    }

    return data as FeedPost;
  } catch (err) {
    console.warn('[feedHelpers] createFeedPost exception:', err);
    return null;
  }
}

/**
 * Compresses and uploads a meal photo to Supabase Storage,
 * then updates the feed_post row with the public URL.
 * Returns the public URL or null on error.
 */
export async function uploadMealPhoto(
  postId: string,
  imageUri: string
): Promise<string | null> {
  try {
    // Lazy import compressForVision (requires dev build, not Expo Go)
    const { compressForVision } = await import('./vision');
    const { base64 } = await compressForVision(imageUri);

    // Convert base64 to ArrayBuffer for upload
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = `${postId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('meal-photos')
      .upload(filePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.warn('[feedHelpers] uploadMealPhoto upload error:', uploadError.message);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('meal-photos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update the feed_post row with the photo URL
    const { error: updateError } = await supabase
      .from('feed_posts')
      .update({ photo_url: publicUrl })
      .eq('id', postId);

    if (updateError) {
      console.warn('[feedHelpers] uploadMealPhoto update error:', updateError.message);
      return null;
    }

    return publicUrl;
  } catch (err) {
    console.warn('[feedHelpers] uploadMealPhoto exception:', err);
    return null;
  }
}
