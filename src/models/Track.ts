import { supabase } from '@/database/supabaseClient';

export interface Track {
  id: string;
  artist_id: string;
  album_id?: string;
  title: string;
  lyrics?: string;
  audio_url: string;
  cover_url?: string;
  duration: number;
  track_number?: number;
  genres: string[];
  featured_artists: string[];
  is_explicit: boolean;
  is_published: boolean;
  play_count: number;
  like_count: number;
  price: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTrackData {
  artist_id: string;
  album_id?: string;
  title: string;
  lyrics?: string;
  audio_url: string;
  cover_url?: string;
  duration: number;
  track_number?: number;
  genres?: string[];
  featured_artists?: string[];
  is_explicit?: boolean;
  price?: number;
}

export interface UpdateTrackData {
  title?: string;
  lyrics?: string;
  cover_url?: string;
  track_number?: number;
  genres?: string[];
  featured_artists?: string[];
  is_explicit?: boolean;
  is_published?: boolean;
  price?: number;
}

export class TrackModel {
  static async create(trackData: CreateTrackData): Promise<Track> {
    const { data, error } = await supabase
      .from('tracks')
      .insert([{
        ...trackData,
        genres: trackData.genres || [],
        featured_artists: trackData.featured_artists || []
      }])
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to create track');
    return data;
  }

  static async findById(id: string): Promise<Track | null> {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  static async findByArtist(artistId: string, published = true): Promise<Track[]> {
    let query = supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', artistId);
    if (published) query = query.eq('is_published', true);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  }

  static async findByAlbum(albumId: string): Promise<Track[]> {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('album_id', albumId)
      .eq('is_published', true)
      .order('track_number', { ascending: true });
    if (error || !data) return [];
    return data;
  }

  static async update(id: string, updateData: UpdateTrackData): Promise<Track | null> {
    const { data, error } = await supabase
      .from('tracks')
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
      .from('tracks')
      .delete()
      .eq('id', id);
    return !error;
  }

  static async incrementPlayCount(id: string): Promise<void> {
    // Supabase does not support atomic increment in the same way as SQL, so you may need to use an RPC or fetch/update
    const { data, error } = await supabase
      .from('tracks')
      .select('play_count')
      .eq('id', id)
      .single();
    if (!error && data) {
      await supabase
        .from('tracks')
        .update({ play_count: (data.play_count || 0) + 1 })
        .eq('id', id);
    }
  }

  static async getTrending(limit = 50): Promise<Track[]> {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_published', true)
      .order('play_count', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data;
  }

  static async getRecentReleases(limit = 20): Promise<Track[]> {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data;
  }

  static async search(query: string, limit = 20): Promise<Track[]> {
    // Supabase full text search or ilike
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,lyrics.ilike.%${query}%`)
      .limit(limit);
    if (error || !data) return [];
    return data;
  }

  static async getByGenre(genre: string, limit = 20): Promise<Track[]> {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_published', true)
      .contains('genres', [genre])
      .limit(limit);
    if (error || !data) return [];
    return data;
  }
}