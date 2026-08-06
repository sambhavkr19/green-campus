import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for authentication
 * @param id User MongoDB ObjectId
 * @param role User role (student, faculty, admin)
 */
export const generateToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'green_csjmu_fallback_secret_key_2026';
  return jwt.sign({ id, role }, secret, {
    expiresIn: '30d',
  });
};
