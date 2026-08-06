import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Initiative from '../models/initiativeModel.js';
import User from '../models/userModel.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { fallbackUsers } from './authController.js';

// Seed initial fallback initiatives for CSJMU campus
const fallbackInitiatives: any[] = [
  {
    _id: 'init_1',
    title: 'CSJMU Bio-Diversity Tree Plantation Drive',
    description: 'Planting 500 indigenous neem and banyan saplings near the CSJMU Central Library complex.',
    category: 'TreePlantation',
    location: 'Central Library Lawn, CSJMU',
    organizerName: 'Prof. R.K. Sharma',
    targetParticipants: 100,
    currentParticipants: ['usr_1', 'usr_2', 'usr_3'],
    status: 'Active',
    pointsReward: 50,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'init_2',
    title: 'Departmental E-Waste Disposal Drive',
    description: 'Safe collection of old circuit boards, monitors, batteries, and discarded cables across all engineering labs.',
    category: 'EWasteCollection',
    location: 'UIET Building Gate 2, CSJMU',
    organizerName: 'Eco-Club CSJMU',
    targetParticipants: 60,
    currentParticipants: ['usr_1'],
    status: 'Active',
    pointsReward: 75,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'init_3',
    title: 'Solar & Energy Audit Campaign',
    description: 'Assessing energy consumption patterns across campus hostels to optimize AC and lighting schedules.',
    category: 'EnergyAudit',
    location: 'Hostel Block A & B, CSJMU',
    organizerName: 'Energy Conservation Cell',
    targetParticipants: 40,
    currentParticipants: [],
    status: 'Upcoming',
    pointsReward: 100,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'init_4',
    title: 'Zero-Single-Use-Plastic Awareness Workshop',
    description: 'Campus-wide workshop on eco-friendly paper bags, composting, and plastic-free cafeteria practices.',
    category: 'AwarenessCampaign',
    location: 'Auditorium Hall 1, CSJMU',
    organizerName: 'Green Student Army',
    targetParticipants: 150,
    currentParticipants: ['usr_2'],
    status: 'Upcoming',
    pointsReward: 30,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Get all initiatives
 * GET /api/initiatives
 */
export const getInitiatives = asyncHandler(async (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const initiatives = await Initiative.find()
      .populate('organizer', 'name email department')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      results: initiatives.length,
      initiatives,
    });
  } else {
    return res.status(200).json({
      status: 'success',
      results: fallbackInitiatives.length,
      note: 'Loaded from campus sample dataset (MongoDB disconnected)',
      initiatives: fallbackInitiatives,
    });
  }
});

/**
 * Create a new initiative
 * POST /api/initiatives
 */
export const createInitiative = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, category, location, targetParticipants } = req.body;

  if (!title || !description || !category) {
    throw new AppError('Please provide title, description, and category', 400);
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const initiative = await Initiative.create({
      title,
      description,
      category,
      location: location || 'CSJMU Campus, Kanpur',
      targetParticipants: targetParticipants || 50,
      organizer: req.user._id,
      currentParticipants: [req.user._id],
      status: 'Active',
    });

    // Reward organizer with 100 Green Points
    await User.findByIdAndUpdate(req.user._id, { $inc: { greenPoints: 100 } });

    return res.status(201).json({
      status: 'success',
      initiative,
    });
  } else {
    const newInit = {
      _id: 'init_' + Math.random().toString(36).substring(2, 11),
      title,
      description,
      category,
      location: location || 'CSJMU Campus, Kanpur',
      organizerName: req.user.name || 'Campus Volunteer',
      targetParticipants: Number(targetParticipants) || 50,
      currentParticipants: [req.user.id || req.user._id],
      status: 'Active',
      pointsReward: 50,
      createdAt: new Date().toISOString(),
    };

    fallbackInitiatives.unshift(newInit);

    // Increment user points in fallback store
    if (req.user && req.user.email) {
      const stored = fallbackUsers.get(req.user.email.toLowerCase());
      if (stored) {
        stored.greenPoints = (stored.greenPoints || 0) + 100;
        req.user.greenPoints = stored.greenPoints;
      }
    }

    return res.status(201).json({
      status: 'success',
      note: 'Initiative created in fallback store',
      initiative: newInit,
    });
  }
});

/**
 * Join an initiative & earn Green Points
 * POST /api/initiatives/:id/join
 */
export const joinInitiative = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;

  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const initiative = await Initiative.findById(id);

    if (!initiative) {
      throw new AppError('Initiative not found', 404);
    }

    const alreadyJoined = initiative.currentParticipants.some(
      (p) => p.toString() === userId.toString()
    );

    if (alreadyJoined) {
      throw new AppError('You have already registered for this initiative', 400);
    }

    initiative.currentParticipants.push(userId as any);
    await initiative.save();

    // Reward user with 50 Green Points
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { greenPoints: 50 } },
      { new: true }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Successfully registered for initiative! Earned +50 Green Points.',
      initiative,
      updatedGreenPoints: updatedUser?.greenPoints,
    });
  } else {
    const initiative = fallbackInitiatives.find((item) => item._id === id);

    if (!initiative) {
      throw new AppError('Initiative not found', 404);
    }

    if (initiative.currentParticipants.includes(userId)) {
      throw new AppError('You have already registered for this initiative', 400);
    }

    initiative.currentParticipants.push(userId);

    // Update fallback user points
    let newPoints = (req.user.greenPoints || 0) + 50;
    if (req.user && req.user.email) {
      const stored = fallbackUsers.get(req.user.email.toLowerCase());
      if (stored) {
        stored.greenPoints = (stored.greenPoints || 0) + 50;
        newPoints = stored.greenPoints;
        req.user.greenPoints = newPoints;
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Successfully registered for initiative! Earned +50 Green Points.',
      initiative,
      updatedGreenPoints: newPoints,
    });
  }
});

/**
 * Get Green Points Leaderboard
 * GET /api/initiatives/leaderboard
 */
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const topUsers = await User.find()
      .select('name email role department greenPoints')
      .sort({ greenPoints: -1 })
      .limit(10);

    return res.status(200).json({
      status: 'success',
      leaderboard: topUsers,
    });
  } else {
    const sampleLeaderboard = [
      { id: '1', name: 'Aarav Sharma', department: 'Computer Science & Engineering', greenPoints: 350, role: 'student' },
      { id: '2', name: 'Priya Verma', department: 'Biotechnology', greenPoints: 280, role: 'student' },
      { id: '3', name: 'Dr. Suresh Kumar', department: 'Environmental Sciences', greenPoints: 250, role: 'faculty' },
      { id: '4', name: 'Rohan Gupta', department: 'Electronics & Communication', greenPoints: 210, role: 'student' },
      { id: '5', name: 'Ananya Singh', department: 'Mechanical Engineering', greenPoints: 180, role: 'student' },
    ];

    // Include registered fallback users
    fallbackUsers.forEach((u) => {
      sampleLeaderboard.push({
        id: u._id,
        name: u.name,
        department: u.department,
        greenPoints: u.greenPoints || 0,
        role: u.role,
      });
    });

    sampleLeaderboard.sort((a, b) => b.greenPoints - a.greenPoints);

    return res.status(200).json({
      status: 'success',
      note: 'Leaderboard loaded with sample campus champions',
      leaderboard: sampleLeaderboard.slice(0, 10),
    });
  }
});
