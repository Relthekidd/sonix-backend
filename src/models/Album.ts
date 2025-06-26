import { supabase } from '@/database/supabaseClient';

export interface Album {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  type: 'album' | 'ep' | 'single';
  genres: string[];
  release_date?: string;
  is_published: boolean;
  total_tracks: number;
  total_duration: number;
  play_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAlbumData {
  artist_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  type?: 'album' | 'ep' | 'single';
  genres?: string[];
  release_date?: string;
}

export interface UpdateAlbumData {
  title?: string;
  description?: string;
  cover_url?: string;
  type?: 'album' | 'ep' | 'single';
  genres?: string[];
  release_date?: string;
  is_published?: boolean;
}

export class AlbumModel {
  static async create(albumData: CreateAlbumData): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .insert([{
        ...albumData,
        genres: albumData.genres || []
      }])
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to create album');
    return data;
  }

  static async findById(id: string): Promise<Album | null> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  static async findByArtist(artistId: string, published = true): Promise<Album[]> {
    let query = supabase
      .from('albums')
      .select('*')
      .eq('artist_id', artistId);
    if (published) query = query.eq('is_published', true);
    query = query.order('release_date', { ascending: false });
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  }

  static async update(id: string, updateData: UpdateAlbumData): Promise<Album | null> {
    const { data, error } = await supabase
      .from('albums')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        genres: updateData.genres || undefined
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return data;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', id);
    return !error;
  }

  static async getAll(limit = 50, offset = 0): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('is_published', true)
      .order('release_date', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error || !data) return [];
    return data;
  }

  static async search(query: string, limit = 20): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);
    if (error || !data) return [];
    return data;
  }

  static async getByGenre(genre: string, limit = 20): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('is_published', true)
      .contains('genres', [genre])
      .limit(limit);
    if (error || !data) return [];
    return data;
  }

  static async getNewReleases(limit = 20): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('is_published', true)
      .order('release_date', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data;
  }

  static async updateStats(id: string, totalTracks: number, totalDuration: number): Promise<void> {
    await supabase
      .from('albums')
      .update({
        total_tracks: totalTracks,
        total_duration: totalDuration,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  }
}