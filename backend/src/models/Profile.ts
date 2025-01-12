import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IProfile extends Document {
  _id: string;
  user_id: string;
  profile_image: string;
  bio: string;
  created_at: Date;
  updated_at: Date;
  username: string;
  page_visits: number;
}

const ProfileSchema = new Schema<IProfile>({
  _id: { type: String, default: () => uuidv4() },
  user_id: { type: String, required: true, ref: 'User' },
  profile_image: { type: String, default: '' },
  bio: { 
    type: String, 
    maxlength: 500,
    default: ''
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  username: { 
    type: String, 
    required: true,
    unique: true
  },
  page_visits: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const Profile = mongoose.model<IProfile>('Profile', ProfileSchema);
