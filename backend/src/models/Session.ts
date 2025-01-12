import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ISession extends mongoose.Document {
  _id: string;
  user_id: string;
  token: string;
  verification_code?: string;
  expires_at: Date;
  created_at: Date;
  user_agent?: string;
  ip_address?: string;
}

const SessionSchema = new mongoose.Schema<ISession>({
  _id: { type: String, default: () => uuidv4() },
  user_id: { type: String, required: true, ref: 'User' },
  token: { 
    type: String, 
    required: true, 
    unique: true,
  },
  verification_code: String,
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  user_agent: String,
  ip_address: String
});

// Index for cleanup of expired sessions
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
