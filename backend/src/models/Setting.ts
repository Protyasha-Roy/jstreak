import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ISetting extends Document {
  _id: string;
  user_id: string;
  setting_name: string;
  setting_value: string;
  created_at: Date;
  updated_at: Date;
}

const SettingSchema = new Schema<ISetting>({
  _id: { type: String, default: () => uuidv4() },
  user_id: { type: String, required: true, ref: 'User' },
  setting_name: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  setting_value: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index to ensure unique settings per user
SettingSchema.index({ user_id: 1, setting_name: 1 }, { unique: true });

export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
