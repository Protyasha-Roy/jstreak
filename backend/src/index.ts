import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jstreak')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error: Error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
