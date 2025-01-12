import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IJournal extends Document {
  _id: string;
  user_id: string;
  date: Date;
  content: string;
  is_private: boolean;
  word_count: number;
  created_at: Date;
  updated_at: Date;
}

const JournalSchema = new Schema<IJournal>({
  _id: { type: String, default: () => uuidv4() },
  user_id: { type: String, required: true, ref: 'User' },
  date: { type: Date, required: true },
  content: { type: String, required: true },
  is_private: { type: Boolean, default: false },
  word_count: { 
    type: Number,
    default: function() {
      return this.content.trim().split(/\s+/).length;
    }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Middleware to update word count before saving
JournalSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.word_count = this.content.trim().split(/\s+/).length;
  }
  next();
});

export const Journal = mongoose.model<IJournal>('Journal', JournalSchema);
