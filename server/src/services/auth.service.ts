import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { Contact } from '../models/contact.model';

const JWT_SECRET = process.env.JWT_SECRET as string;

export class AuthService {
  public static async register(name: string, email: string, password: string) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
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
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
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
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
  }

  public static async deleteAccount(userId: string): Promise<void> {
    // 1. Delete all contacts belonging to the user
    await Contact.deleteMany({ userId });

    // 2. Delete the user
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      throw new Error('User not found');
    }
  }
}