import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ISubscription extends Document {
  _id: string;
  user_id: string;
  plan: 'free' | 'premium';
  start_date: Date;
  end_date: Date;
  on_trial: boolean;
}

const SubscriptionSchema = new Schema<ISubscription>({
  _id: { type: String, default: () => uuidv4() },
  user_id: { type: String, required: true, ref: 'User' },
  plan: { 
    type: String, 
    enum: ['free', 'premium'],
    default: 'free'
  },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  on_trial: { type: Boolean, default: true }
});

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
