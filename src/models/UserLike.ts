import { supabase } from '@/database/supabaseClient';

export interface UserLike {
  id: string;
  user_id: string;
  track_id: string;
  liked_at: Date;
}

export class UserLikeModel {
  static async likeTrack(userId: string, trackId: string): Promise<UserLike> {
    const { data, error } = await supabase
      .from('user_likes')
      .insert([{ user_id: userId, track_id: trackId }])
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to like track');
    return data;
  }

  static async unlikeTrack(userId: string, trackId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId);
    return !error;
  }
}