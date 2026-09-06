import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Contact } from '../models/contact.model';

export class AuthService {
  public static async register(name: string, email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const err: any = new Error('User with this email already exists');
      err.statusCode = 400;
      throw err;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    // Generate JWT
    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  public static async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // Generate JWT
    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  public static generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('FATAL: JWT_SECRET environment variable is missing.');
    }
    return jwt.sign({ userId }, secret, { expiresIn: '30d' });
  }

  public static async deleteAccount(userId: string): Promise<void> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err: any = new Error('Invalid user ID format.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Delete all contacts belonging to the user
    await Contact.deleteMany({ userId });

    // 2. Delete the user
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      const err: any = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
  }
}
