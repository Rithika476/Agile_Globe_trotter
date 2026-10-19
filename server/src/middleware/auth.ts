import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserPayload } from '../types';
import { User } from '../models/User';

interface JwtDecoded {
  id: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Authentication required. Missing or malformed token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'JWT secret not configured on server.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtDecoded;
    const user = await User.findById(decoded.id).select('_id name email');

    if (!user) {
      res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid session. User no longer exists.',
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Invalid, malformed, or expired authentication token.',
    });
  }
};
