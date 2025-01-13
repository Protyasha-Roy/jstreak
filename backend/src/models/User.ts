import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IUser extends mongoose.Document {
  _id: string;
  username: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  total_words: number;
  total_entries: number;
  created_at: Date;
  updated_at: Date;
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
