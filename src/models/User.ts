import { supabase } from '@/database/supabaseClient';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'listener' | 'artist' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: 'listener' | 'artist' | 'admin';
}

export interface UpdateUserData {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: 'listener' | 'artist' | 'admin';
  password_hash?: string;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    if (!data) {
      console.error('Supabase insert returned no data:', userData);
      throw new Error('Failed to create user');
    }
    return data;
  }

  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;
    return data;
  }

  static async update(id: string, updateData: UpdateUserData): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
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
      .from('users')
      .delete()
      .eq('id', id);
    return !error;
  }

  static async verifyPassword(_password: string, _hash: string): Promise<boolean> {
    // Implement password check logic (e.g., bcrypt.compare) in your service/controller
    return false;
  }

  static async updateLastLogin(id: string): Promise<void> {
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);
  }
}