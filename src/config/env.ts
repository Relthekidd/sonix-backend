import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SUPABASE_JWT_SECRET) {
  throw new Error('❌ SUPABASE_JWT_SECRET is not set in environment variables.');
}

export const ENV = {
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET as string
};