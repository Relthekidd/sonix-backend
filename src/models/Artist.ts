import { supabase } from '@/database/supabaseClient';

export interface Artist {
  id: string;
  user_id: string;
  stage_name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  genres: string[];
  social_links?: Record<string, string>;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateArtistData {
  user_id: string;
  stage_name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  genres?: string[];
  social_links?: Record<string, string>;
}

export interface UpdateArtistData {
  stage_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  genres?: string[];
  social_links?: Record<string, string>;
}

export class ArtistModel {
  static async create(artistData: CreateArtistData): Promise<Artist> {
    const { data, error } = await supabase
      .from('artists')
      .insert([{ ...artistData, genres: artistData.genres || [] }])
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to create artist');
    return data;
  }

  static async findById(id: string): Promise<Artist | null> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  static async findByUserId(userId: string): Promise<Artist | null> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data;
  }

  static async update(id: string, updateData: UpdateArtistData): Promise<Artist | null> {
    const { data, error } = await supabase
      .from('artists')
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
      .from('artists')
      .delete()
      .eq('id', id);
    return !error;
  }

  static async search(query: string, limit = 20): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .or(`stage_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(limit);
    if (error || !data) return [];
    return data;
  }

  static async getTopArtists(limit = 10): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data;
  }

  static async getAll(limit = 20, offset = 0): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error || !data) return [];
    return data;
  }

  static async getUnverifiedArtists(): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('is_verified', false);
    if (error || !data) return [];
    return data;
  }

  static async updateVerificationStatus(id: string, is_verified: boolean): Promise<Artist | null> {
    const { data, error } = await supabase
      .from('artists')
      .update({ is_verified })
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return data;
  }
}