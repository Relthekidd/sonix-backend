import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

const isTest = process.env.NODE_ENV === 'test';
const noop: RequestHandler = (_req, _res, next) => next();

// General API rate limiting
export const generalLimiter = isTest ? noop : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
export const authLimiter = isTest ? noop : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiting
export const uploadLimiter = isTest ? noop : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limiting
export const searchLimiter = isTest ? noop : rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: {
    success: false,
    message: 'Search limit exceeded, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});