import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IHeatmap extends Document {
  _id: string;
  user_id: string;
  year: number;
  heatmap_data: Record<string, any>;
  updated_at: Date;
}

const HeatmapSchema = new Schema<IHeatmap>({
  _id: { type: String, default: () => uuidv4() },
  user_id: { type: String, required: true, ref: 'User' },
  year: { type: Number, required: true },
  heatmap_data: { type: Schema.Types.Mixed, required: true },
  updated_at: { type: Date, default: Date.now }
});

// Compound index to ensure one heatmap per user per year
HeatmapSchema.index({ user_id: 1, year: 1 }, { unique: true });

export const Heatmap = mongoose.model<IHeatmap>('Heatmap', HeatmapSchema);
