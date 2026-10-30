import mongoose, { Document, Schema } from 'mongoose';

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IUser {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export type IUserDocument = IUser & Document;

// ── Schema ────────────────────────────────────────────────────────────────────
const userSchema = new Schema<IUserDocument>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model<IUserDocument>('User', userSchema);
