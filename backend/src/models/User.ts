import mongoose, { Document, Schema } from 'mongoose';

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IUser {
  name: string;
  email: string;
  password: string;
  /**
   * SHA-256 hash of the active refresh token.
   * Stored so the server can revoke sessions and detect token reuse.
   * `select: false` — never returned in ordinary queries; must be explicitly
   * selected with `.select('+refreshTokenHash')`.
   */
  refreshTokenHash?: string | null;
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
  refreshTokenHash: {
    type: String,
    default: null,
    select: false, // never leaks in user queries unless explicitly requested
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model<IUserDocument>('User', userSchema);
