import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  total_words: number;
  total_entries: number;
  current_streak: number;
  highest_streak: number;
  created_at: Date;
  updated_at: Date;
  bio: string;
  avatar_url: string;
}

const UserSchema = new mongoose.Schema<IUser>({
  _id: { type: String, default: () => uuidv4() },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_-]+$/
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password_hash: { type: String, required: true },
  email_verified: { type: Boolean, default: false },
  total_words: { type: Number, default: 0 },
  total_entries: { type: Number, default: 0 },
  current_streak: { type: Number, default: 0 },
  highest_streak: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

UserSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);
