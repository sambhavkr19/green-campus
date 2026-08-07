import { Request, Response } from 'express';
import mongoose from 'mongoose';
import RecyclingDeposit from '../models/recyclingModel.js';
import User from '../models/userModel.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { fallbackUsers } from './authController.js';

// Co2 impact factors per kg for different waste categories
const CO2_FACTOR: Record<string, number> = {
  EWaste: 3.5,     // 1kg e-waste recycled saves ~3.5kg CO2
  Plastic: 2.0,    // 1kg plastic recycled saves ~2.0kg CO2
  Paper: 1.2,      // 1kg paper recycled saves ~1.2kg CO2
  Metal: 4.0,      // 1kg metal recycled saves ~4.0kg CO2
  Glass: 0.5,      // 1kg glass recycled saves ~0.5kg CO2
};

// Points multiplier per kg
const POINTS_PER_KG: Record<string, number> = {
  EWaste: 20,
  Plastic: 15,
  Paper: 10,
  Metal: 25,
  Glass: 8,
};

// In-memory store fallback when MongoDB server is offline
const fallbackDeposits: any[] = [
  {
    _id: 'rec_101',
    userName: 'Aarav Sharma',
    itemType: 'EWaste',
    weightKg: 2.5,
    location: 'UIET Computer Lab 3',
    status: 'Verified',
    pointsEarned: 50,
    co2SavedKg: 8.75,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'rec_102',
    userName: 'Priya Verma',
    itemType: 'Plastic',
    weightKg: 4.0,
    location: 'Central Library Cafeteria',
    status: 'Verified',
    pointsEarned: 60,
    co2SavedKg: 8.0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'rec_103',
    userName: 'Rohan Gupta',
    itemType: 'Paper',
    weightKg: 8.5,
    location: 'Examination Cell, CSJMU',
    status: 'Pending',
    pointsEarned: 85,
    co2SavedKg: 10.2,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Submit a new recycling deposit log
 * POST /api/recycling
 */
export const submitDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemType, weightKg, location } = req.body;

  if (!itemType || !weightKg) {
    throw new AppError('Please specify itemType and weightKg', 400);
  }

  const weight = Number(weightKg);
  if (isNaN(weight) || weight <= 0) {
    throw new AppError('Weight must be a positive number in kg', 400);
  }

  const factor = CO2_FACTOR[itemType] || 1.5;
  const pointsRate = POINTS_PER_KG[itemType] || 10;

  const co2SavedKg = Number((weight * factor).toFixed(2));
  const pointsEarned = Math.round(weight * pointsRate);

  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const deposit = await RecyclingDeposit.create({
      user: req.user._id,
      userName: req.user.name,
      itemType,
      weightKg: weight,
      location: location || 'UIET Recycling Hub, CSJMU',
      status: 'Verified', // Auto-verify for campus hackathon demo
      co2SavedKg,
      pointsEarned,
    });

    // Credit user green points
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { greenPoints: pointsEarned },
    });

    return res.status(201).json({
      status: 'success',
      message: `Deposit logged! Saved ${co2SavedKg}kg CO2 emissions and earned +${pointsEarned} Green Points.`,
      deposit,
    });
  } else {
    const newDeposit = {
      _id: 'rec_' + Math.random().toString(36).substring(2, 11),
      userName: req.user.name || 'Campus Volunteer',
      itemType,
      weightKg: weight,
      location: location || 'UIET Recycling Hub, CSJMU',
      status: 'Verified',
      pointsEarned,
      co2SavedKg,
      createdAt: new Date().toISOString(),
    };

    fallbackDeposits.unshift(newDeposit);

    // Increment points in fallback store
    if (req.user && req.user.email) {
      const stored = fallbackUsers.get(req.user.email.toLowerCase());
      if (stored) {
        stored.greenPoints = (stored.greenPoints || 0) + pointsEarned;
        req.user.greenPoints = stored.greenPoints;
      }
    }

    return res.status(201).json({
      status: 'success',
      note: 'Processed via in-memory recycling store',
      message: `Deposit logged! Saved ${co2SavedKg}kg CO2 emissions and earned +${pointsEarned} Green Points.`,
      deposit: newDeposit,
    });
  }
});

/**
 * Get all recycling deposits across campus
 * GET /api/recycling
 */
export const getDeposits = asyncHandler(async (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const deposits = await RecyclingDeposit.find()
      .populate('user', 'name email department')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      results: deposits.length,
      deposits,
    });
  } else {
    return res.status(200).json({
      status: 'success',
      results: fallbackDeposits.length,
      note: 'Loaded from campus recycling store',
      deposits: fallbackDeposits,
    });
  }
});

/**
 * Get Campus Recycling Analytics & Carbon Offset Summary
 * GET /api/recycling/analytics
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const deposits = await RecyclingDeposit.find();

    const totalKgRecycled = deposits.reduce((sum, item) => sum + item.weightKg, 0);
    const totalCo2Saved = deposits.reduce((sum, item) => sum + item.co2SavedKg, 0);
    const totalPointsDistributed = deposits.reduce((sum, item) => sum + item.pointsEarned, 0);

    const categoryBreakdown: Record<string, number> = {};
    deposits.forEach((d) => {
      categoryBreakdown[d.itemType] = (categoryBreakdown[d.itemType] || 0) + d.weightKg;
    });

    return res.status(200).json({
      status: 'success',
      analytics: {
        totalDeposits: deposits.length,
        totalKgRecycled: Number(totalKgRecycled.toFixed(1)),
        totalCo2SavedKg: Number(totalCo2Saved.toFixed(1)),
        totalPointsDistributed,
        categoryBreakdown,
      },
    });
  } else {
    const totalKgRecycled = fallbackDeposits.reduce((sum, item) => sum + item.weightKg, 0);
    const totalCo2Saved = fallbackDeposits.reduce((sum, item) => sum + item.co2SavedKg, 0);
    const totalPointsDistributed = fallbackDeposits.reduce((sum, item) => sum + item.pointsEarned, 0);

    const categoryBreakdown: Record<string, number> = {};
    fallbackDeposits.forEach((d) => {
      categoryBreakdown[d.itemType] = (categoryBreakdown[d.itemType] || 0) + d.weightKg;
    });

    return res.status(200).json({
      status: 'success',
      note: 'Analytics calculated from campus store',
      analytics: {
        totalDeposits: fallbackDeposits.length,
        totalKgRecycled: Number(totalKgRecycled.toFixed(1)),
        totalCo2SavedKg: Number(totalCo2Saved.toFixed(1)),
        totalPointsDistributed,
        categoryBreakdown,
      },
    });
  }
});
