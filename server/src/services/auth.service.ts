import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

const createError = (message: string, statusCode: number): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
};

const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createError('JWT_SECRET is not configured on the server', 500);
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const registerUser = async (name: string, email: string, password: string) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw createError('A user with this email address already exists.', 409);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  const token = signToken(newUser._id.toString());

  return {
    user: {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    },
    token,
  };
};

export const loginUser = async (email: string, password: string) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw createError('Invalid email or password', 401);
  }

  const token = signToken(user._id.toString());

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

export const getMe = async (userId: string) => {
  const user = await User.findById(userId).select('_id name email createdAt updatedAt');
  if (!user) {
    throw createError('User not found', 404);
  }
  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
};

export const updateMe = async (
  userId: string,
  data: { name?: string; currentPassword?: string; newPassword?: string }
) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw createError('User not found', 404);
  }

  if (data.name) {
    user.name = data.name.trim();
  }

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw createError('Current password is required to change password.', 400);
    }
    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw createError('Incorrect current password.', 400);
    }
    user.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  await user.save();

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
};
