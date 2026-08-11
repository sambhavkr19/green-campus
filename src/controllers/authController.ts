import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken } from '../utils/generateToken.js';
import { AuthRequest } from '../middleware/auth.js';

// In-memory store fallback when MongoDB server is offline
export const fallbackUsers: Map<string, any> = new Map();

// Seed default demo accounts
const seedPasswordHash = bcrypt.hashSync('password123', 10);

fallbackUsers.set('student@csjmu.ac.in', {
  _id: 'usr_student_demo',
  name: 'Aarav Student',
  email: 'student@csjmu.ac.in',
  password: seedPasswordHash,
  role: 'student',
  department: 'Computer Science & Engineering',
  greenPoints: 250,
  createdAt: new Date(),
});

fallbackUsers.set('faculty@csjmu.ac.in', {
  _id: 'usr_faculty_demo',
  name: 'Dr. Sunita Sharma',
  email: 'faculty@csjmu.ac.in',
  password: seedPasswordHash,
  role: 'faculty',
  department: 'Environmental Sciences',
  greenPoints: 450,
  createdAt: new Date(),
});

fallbackUsers.set('admin@csjmu.ac.in', {
  _id: 'usr_admin_demo',
  name: 'Campus Admin',
  email: 'admin@csjmu.ac.in',
  password: seedPasswordHash,
  role: 'admin',
  department: 'Administration',
  greenPoints: 1000,
  createdAt: new Date(),
});

/**
 * Register a new user
 * POST /api/auth/register
 */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Please provide name, email, and password', 400);
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError('User with this email already exists', 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      department: department || 'Computer Science & Engineering',
    });

    const token = generateToken((user._id as any).toString(), user.role);

    return res.status(201).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        greenPoints: user.greenPoints,
      },
    });
  } else {
    // MongoDB fallback handling
    const normalizedEmail = email.toLowerCase().trim();
    if (fallbackUsers.has(normalizedEmail)) {
      throw new AppError('User with this email already exists (Fallback Store)', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const mockId = 'usr_' + Math.random().toString(36).substring(2, 11);

    const newUser = {
      _id: mockId,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'student',
      department: department || 'Computer Science & Engineering',
      greenPoints: 0,
      createdAt: new Date(),
    };

    fallbackUsers.set(normalizedEmail, newUser);
    const token = generateToken(mockId, newUser.role);

    return res.status(201).json({
      status: 'success',
      token,
      note: 'Processed via in-memory fallback store (MongoDB disconnected)',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        greenPoints: newUser.greenPoints,
      },
    });
  }
});

/**
 * Authenticate user & get token
 * POST /api/auth/login
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    // Explicitly select password since it has select: false in schema
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken((user._id as any).toString(), user.role);

    return res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        greenPoints: user.greenPoints,
      },
    });
  } else {
    // MongoDB fallback handling
    const normalizedEmail = email.toLowerCase().trim();
    const user = fallbackUsers.get(normalizedEmail);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      status: 'success',
      token,
      note: 'Processed via in-memory fallback store (MongoDB disconnected)',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        greenPoints: user.greenPoints,
      },
    });
  }
});

/**
 * Get all registered users from MongoDB
 * GET /api/auth/users
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      status: 'success',
      count: users.length,
      users,
    });
  } else {
    const users: any[] = [];
    fallbackUsers.forEach((u) => {
      users.push({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        greenPoints: u.greenPoints || 0,
        createdAt: u.createdAt || new Date(),
      });
    });
    return res.status(200).json({
      status: 'success',
      count: users.length,
      users,
    });
  }
});

/**
 * Get current logged in user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
});

