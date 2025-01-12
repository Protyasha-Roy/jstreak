import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface ConsistentMonth {
  month: string;
  year: number;
}

export interface IAnalytics extends Document {
  _id: string;
  user_id: string;
  total_words: number;
  highest_streak: number;
  current_streak: number;
  consistent_months: ConsistentMonth[];
}

const AnalyticsSchema = new Schema<IAnalytics>({
  _id: { type: String, default: () => uuidv4() },
  user_id: { type: String, required: true, ref: 'User', unique: true },
  total_words: { type: Number, default: 0 },
  highest_streak: { type: Number, default: 0 },
  current_streak: { type: Number, default: 0 },
  consistent_months: [{
    month: String,
    year: Number
  }]
});

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
