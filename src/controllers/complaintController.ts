import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import VoiceComplaint from '../models/complaintModel.js';
import User from '../models/userModel.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { fallbackUsers } from './authController.js';

// Lazy load Gemini AI SDK
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Fallback in-memory Voice Complaints store
const fallbackComplaints: any[] = [
  {
    _id: 'complaint_101',
    title: 'Students throwing plastic waste & food wrappers in UIET Garden',
    location: 'Central Lawn near UIET Building',
    description: '5 students were seen throwing plastic bottles and snack packets near the bench instead of using green bins. What is wrong with this place!',
    photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    audioData: '', // Standard demo record
    audioDurationSec: 12,
    aiAnalysis: 'High priority campus littering event. Recommend immediate Eco-Volunteer alert to deploy recycling bins near UIET garden benches.',
    upvotes: 14,
    upvotedBy: [],
    status: 'Reported',
    studentName: 'Priya Verma',
    department: 'Computer Science & Engineering',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'complaint_102',
    title: 'Discarded e-waste & broken monitors behind Central Library',
    location: 'Behind Central Library Annex',
    description: 'Found discarded keyboard wires and old PC monitors dumped in open soil behind library.',
    photoUrl: 'https://images.unsplash.com/photo-1612965607446-25e132077b09?w=600&auto=format&fit=crop&q=80',
    audioData: '',
    audioDurationSec: 18,
    aiAnalysis: 'E-Waste hazardous materials risk. Scheduled for collection drive by CSJMU Green Army.',
    upvotes: 28,
    upvotedBy: [],
    status: 'In Progress',
    studentName: 'Aniket Singh',
    department: 'Electrical Engineering',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

/**
 * Submit new Voice + Photo Campus Complaint
 * POST /api/complaints
 */
export const createComplaint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, location, description, photoUrl, audioData, audioDurationSec } = req.body;

  if (!title || !description) {
    throw new AppError('Please provide a complaint title and description or voice note', 400);
  }

  const userId = req.user.id || req.user._id;
  const isDbConnected = mongoose.connection.readyState === 1;

  // AI Analysis of Complaint via Gemini
  let aiAnalysis = 'Report received. Logged for student peer review and green army action.';
  try {
    const ai = getAiClient();
    if (ai) {
      const prompt = `You are the AI Campus Safety & Cleanliness Officer at Chhatrapati Shahu Ji Maharaj University (CSJMU Kanpur).
Analyze this student voice/photo complaint:
Title: "${title}"
Location: "${location || 'CSJMU Campus'}"
Description: "${description}"

Provide a concise 2-sentence AI assessment highlighting priority, environmental impact, and suggested immediate corrective action for student volunteers. Plain text only.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      if (response.text) {
        aiAnalysis = response.text.trim();
      }
    }
  } catch (err) {
    console.warn('Gemini AI complaint assessment fallback', err);
  }

  if (isDbConnected) {
    const complaint = await VoiceComplaint.create({
      title,
      location: location || 'CSJMU Campus',
      description,
      photoUrl: photoUrl || '',
      audioData: audioData || '',
      audioDurationSec: Number(audioDurationSec) || 0,
      aiAnalysis,
      upvotes: 1,
      upvotedBy: [userId.toString()],
      status: 'Reported',
      submittedBy: userId,
      studentName: req.user.name,
      department: req.user.department || 'Student Body',
    });

    // Reward student with +75 Green Points for active campus vigilance
    await User.findByIdAndUpdate(userId, { $inc: { greenPoints: 75 } });

    return res.status(201).json({
      status: 'success',
      message: 'Campus Voice Complaint published! Earned +75 Green Points for campus vigilance.',
      complaint,
    });
  } else {
    const newComplaint = {
      _id: 'complaint_' + Math.random().toString(36).substring(2, 11),
      title,
      location: location || 'CSJMU Campus Garden',
      description,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
      audioData: audioData || '',
      audioDurationSec: Number(audioDurationSec) || 10,
      aiAnalysis,
      upvotes: 1,
      upvotedBy: [userId.toString()],
      status: 'Reported',
      studentName: req.user.name || 'Campus Advocate',
      department: req.user.department || 'Student Body',
      createdAt: new Date().toISOString(),
    };

    fallbackComplaints.unshift(newComplaint);

    // Credit fallback points
    if (req.user && req.user.email) {
      const stored = fallbackUsers.get(req.user.email.toLowerCase());
      if (stored) {
        stored.greenPoints = (stored.greenPoints || 0) + 75;
        req.user.greenPoints = stored.greenPoints;
      }
    }

    return res.status(201).json({
      status: 'success',
      note: 'Stored in campus memory store',
      message: 'Campus Voice Complaint published! Earned +75 Green Points for campus vigilance.',
      complaint: newComplaint,
    });
  }
});

/**
 * Get all Voice Complaints
 * GET /api/complaints
 */
export const getComplaints = asyncHandler(async (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const complaints = await VoiceComplaint.find().sort({ createdAt: -1 });
    return res.status(200).json({
      status: 'success',
      results: complaints.length,
      complaints,
    });
  } else {
    return res.status(200).json({
      status: 'success',
      results: fallbackComplaints.length,
      note: 'Loaded from campus memory store',
      complaints: fallbackComplaints,
    });
  }
});

/**
 * Peer Upvote Complaint
 * POST /api/complaints/:id/upvote
 */
export const upvoteComplaint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = (req.user.id || req.user._id).toString();
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const complaint = await VoiceComplaint.findById(id);
    if (!complaint) throw new AppError('Complaint report not found', 404);

    if (complaint.upvotedBy.includes(userId)) {
      return res.status(400).json({ status: 'fail', message: 'You have already upvoted this complaint' });
    }

    complaint.upvotes += 1;
    complaint.upvotedBy.push(userId);
    await complaint.save();

    return res.status(200).json({
      status: 'success',
      message: 'Upvoted complaint! Student voice amplified.',
      upvotes: complaint.upvotes,
    });
  } else {
    const complaint = fallbackComplaints.find((c) => c._id === id);
    if (!complaint) throw new AppError('Complaint report not found', 404);

    if (!complaint.upvotedBy) complaint.upvotedBy = [];
    if (complaint.upvotedBy.includes(userId)) {
      return res.status(400).json({ status: 'fail', message: 'You have already upvoted this complaint' });
    }

    complaint.upvotes += 1;
    complaint.upvotedBy.push(userId);

    return res.status(200).json({
      status: 'success',
      message: 'Upvoted complaint! Student voice amplified.',
      upvotes: complaint.upvotes,
    });
  }
});

/**
 * Update Complaint Status
 * PATCH /api/complaints/:id/status
 */
export const updateComplaintStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Reported', 'In Progress', 'Resolved'].includes(status)) {
    throw new AppError('Invalid status value', 400);
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const complaint = await VoiceComplaint.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!complaint) throw new AppError('Complaint not found', 404);

    return res.status(200).json({
      status: 'success',
      message: `Complaint marked as ${status}`,
      complaint,
    });
  } else {
    const complaint = fallbackComplaints.find((c) => c._id === id);
    if (!complaint) throw new AppError('Complaint not found', 404);

    complaint.status = status;
    return res.status(200).json({
      status: 'success',
      message: `Complaint marked as ${status}`,
      complaint,
    });
  }
});
