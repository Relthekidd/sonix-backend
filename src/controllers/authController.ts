import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel, CreateUserData } from '@/models/User';
import { ArtistModel } from '@/models/Artist';
import { AuthRequest } from '@/middleware/authMiddleware';

export class AuthController {
  static async getMe(req: AuthRequest, res: Response) {
    return res.status(200).json({
      success: true,
      message: 'Authenticated user info',
      data: req.user
    });
  }

  static async changePassword(_req: AuthRequest, res: Response) {
    // Implement your password change logic here
    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  }

  static async refreshToken(_req: AuthRequest, res: Response) {
    // Implement your refresh token logic here
    return res.status(200).json({ success: true, data: { token: 'new.jwt.token' } });
  }

  static async register(req: Request, res: Response) {
    try {
      const { email, password, displayName, firstName, lastName, role } = req.body;

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      const userData: CreateUserData = {
        email,
        password_hash: hashedPassword,
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        role: role || 'listener'
      };

      const user = await UserModel.create(userData);

      if (role === 'artist') {
        await ArtistModel.create({
          user_id: user.id,
          stage_name: displayName
        });
      }

      const secret = process.env.JWT_SECRET as string;
      const expiresIn = ((process.env.JWT_EXPIRES_IN as string) || '7d') as any;
      if (!secret) throw new Error('JWT_SECRET not set');

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        secret,
        { expiresIn }
      );

      const { password_hash, ...userResponse } = user;

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      await UserModel.updateLastLogin(user.id);

      const secret = process.env.JWT_SECRET as string;
      const expiresIn = ((process.env.JWT_EXPIRES_IN as string) || '7d') as any;
      if (!secret) throw new Error('JWT_SECRET not set');

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        secret,
        { expiresIn }
      );

      const { password_hash, ...userResponse } = user;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}