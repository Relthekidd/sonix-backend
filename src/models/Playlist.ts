import { supabase } from '@/database/supabaseClient';

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  is_collaborative: boolean;
  total_tracks: number;
  total_duration: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePlaylistData {
  user_id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public?: boolean;
  is_collaborative?: boolean;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  cover_url?: string;
  is_public?: boolean;
  is_collaborative?: boolean;
}

export class PlaylistModel {
  static async create(data: CreatePlaylistData): Promise<Playlist> {
    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert([data])
      .select()
      .single();
    if (error || !playlist) throw error || new Error('Failed to create playlist');
    return playlist;
  }

  static async findById(id: string): Promise<Playlist | null> {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  static async findByUserId(userId: string): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  }

  static async getPublic(limit = 20, offset = 0): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error || !data) return [];
    return data;
  }

  static async update(id: string, updateData: UpdatePlaylistData): Promise<Playlist | null> {
    const { data, error } = await supabase
      .from('playlists')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return data;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id);
    return !error;
  }

  static async search(query: string, limit = 20): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('is_public', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);
    if (error || !data) return [];
    return data;
  }
}