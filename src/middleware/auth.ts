import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AppError } from './errorHandler.js';
import User from '../models/userModel.js';
import { fallbackUsers } from '../controllers/authController.js';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * JWT Authentication Middleware
 * Protects routes by checking for valid Authorization Bearer tokens
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token provided', 401));
  }

  try {
    const secret = process.env.JWT_SECRET || 'green_csjmu_fallback_secret_key_2026';
    const decoded: any = jwt.verify(token, secret);

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // Fetch user details excluding password
      const currentUser = await User.findById(decoded.id).select('-password');
      if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists', 401));
      }
      req.user = currentUser;
    } else {
      // Look up in fallback store
      let foundUser: any = null;
      for (const u of fallbackUsers.values()) {
        if (u._id === decoded.id) {
          foundUser = {
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department,
            greenPoints: u.greenPoints,
          };
          break;
        }
      }

      if (!foundUser) {
        return next(new AppError('The user belonging to this token no longer exists (Fallback Store)', 401));
      }

      req.user = foundUser;
    }

    next();
  } catch (err) {
    return next(new AppError('Not authorized, token invalid or expired', 401));
  }
};

/**
 * Role Authorization Middleware
 * Restricts access to specific user roles (e.g., admin, faculty)
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
