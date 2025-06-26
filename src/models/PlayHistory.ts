import { supabase } from '@/database/supabaseClient';

export interface PlayHistory {
  id: string;
  user_id: string;
  track_id: string;
  played_at: Date;
  play_duration?: number;
  completed: boolean;
  device_type?: string;
  ip_address?: string;
}

export interface CreatePlayHistoryData {
  user_id: string;
  track_id: string;
  play_duration?: number;
  completed?: boolean;
  device_type?: string;
  ip_address?: string;
}

export class PlayHistoryModel {
  static async create(data: CreatePlayHistoryData): Promise<PlayHistory> {
    const { data: result, error } = await supabase
      .from('play_history')
      .insert([{
        ...data,
        played_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error || !result) throw error || new Error('Failed to record play history');
    return result;
  }

  static async getUserHistory(userId: string, limit = 50): Promise<PlayHistory[]> {
    const { data, error } = await supabase
      .from('play_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data;
  }
}