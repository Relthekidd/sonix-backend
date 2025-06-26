import { supabase } from '@/database/supabaseClient';

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  added_by: string;
  position: number;
  added_at: Date;
}

export interface CreatePlaylistTrackData {
  playlist_id: string;
  track_id: string;
  added_by: string;
}

export class PlaylistTrackModel {
  static async addTrack(data: CreatePlaylistTrackData): Promise<PlaylistTrack> {
    const { data: result, error } = await supabase
      .from('playlist_tracks')
      .insert([data])
      .select()
      .single();
    if (error || !result) throw error || new Error('Failed to add track to playlist');
    return result;
  }

  static async removeTrack(playlistId: string, trackId: string): Promise<boolean> {
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);
    return !error;
  }

  static async getPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });
    if (error || !data) return [];
    return data;
  }
}