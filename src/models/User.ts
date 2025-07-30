import { supabase } from '@/database/supabaseClient';
import bcrypt from 'bcryptjs';

const isTest = process.env.NODE_ENV === 'test';
const testUsers: User[] = [];
let idCounter = 1;

export function __clearTestUsers() {
  if (isTest) {
    testUsers.length = 0;
    idCounter = 1;
  }
}

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
    if (isTest) {
      const user: User = {
        id: String(idCounter++),
        role: userData.role ?? 'listener',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...userData,
      };
      testUsers.push(user);
      return user;
    }

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
    if (isTest) {
      return testUsers.find((u) => u.id === id) || null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  static async findByEmail(email: string): Promise<User | null> {
    if (isTest) {
      return testUsers.find((u) => u.email === email) || null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;
    return data;
  }

  static async update(id: string, updateData: UpdateUserData): Promise<User | null> {
    if (isTest) {
      const idx = testUsers.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      const existing = testUsers[idx]!;
      const updated: User = {
        ...existing,
        ...updateData,
        updated_at: new Date().toISOString(),
      };
      testUsers[idx] = updated;
      return updated;
    }

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
    if (isTest) {
      const idx = testUsers.findIndex((u) => u.id === id);
      if (idx !== -1) testUsers.splice(idx, 1);
      return true;
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    return !error;
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async updateLastLogin(id: string): Promise<void> {
    if (isTest) {
      const user = testUsers.find((u) => u.id === id);
      if (user) user.updated_at = new Date().toISOString();
      return;
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);
  }
}