import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ITheme extends Document {
  _id: string;
  name: string;
  is_premium: boolean;
  styles: Record<string, any>;
}

const ThemeSchema = new Schema<ITheme>({
  _id: { type: String, default: () => uuidv4() },
  name: { 
    type: String, 
    required: true,
    unique: true
  },
  is_premium: { type: Boolean, default: false },
  styles: { 
    type: Schema.Types.Mixed,
    required: true
  }
});

export const Theme = mongoose.model<ITheme>('Theme', ThemeSchema);
