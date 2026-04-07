import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  _id: number;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  isDeleted: boolean;
  createdAt: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
}

// User type without password for safe return to client
export interface SafeUser {
  _id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isDeleted: boolean;
  createdAt: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
}

export function generateToken(payload: JWTPayload): string {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return token;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('token=')) {
        return cookie.substring(6);
      }
    }
  }

  return null;
}