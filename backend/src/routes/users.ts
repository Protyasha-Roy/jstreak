import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authenticate } from '../middleware/auth'
import { User, IUser } from '../models/User'
import { Subscription } from '../models/Subscription'
import { calculateStreaks } from '../utils/streakCalculator'

const router = express.Router()

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile'
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req: any, file, cb) => {
    // Use username and timestamp for unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    cb(null, `${req.user.username}-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'))
    }
  }
})

// Get user profile
router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      username: user.username,
      email: user.email,
      bio: user.bio,
      profileImage: user.avatar_url,
      stats: {
        totalWords: user.total_words,
        totalEntries: user.total_entries
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get user profile by username
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params
    const user = await User.findOne({ username })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Calculate streaks before returning profile
    const streaks = await calculateStreaks(username)
    
    // Update user with latest streak information
    await User.updateOne(
      { username },
      { 
        $set: { 
          current_streak: streaks.currentStreak,
          highest_streak: streaks.highestStreak
        }
      }
    )

    res.json({
      id: user._id,
      username: user.username,
      bio: user.bio,
      profileImage: user.avatar_url,
      stats: {
        totalWords: user.total_words,
        totalEntries: user.total_entries,
        currentStreak: streaks.currentStreak,
        highestStreak: streaks.highestStreak
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update user profile
router.patch('/profile', authenticate, async (req: any, res) => {
  const { username, bio } = req.body

  try {
    // Check if username is taken (if username is being updated)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username })
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' })
      }
    }

    // Update user
    const updateData: Partial<IUser> = {}
    if (username) updateData.username = username
    if (bio !== undefined) updateData.bio = bio

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      username: user.username,
      email: user.email,
      bio: user.bio,
      profileImage: user.avatar_url,
      stats: {
        totalWords: user.total_words,
        totalEntries: user.total_entries
      }
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Upload profile image
router.post('/profile/image', authenticate, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' })
    }

    // Get the file path relative to the uploads directory
    const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`

    // Delete old profile image if it exists
    const currentUser = await User.findById(req.user._id)
    if (currentUser?.avatar_url) {
      const oldImagePath = path.join(__dirname, '../../', currentUser.avatar_url)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }

    // Update user with new image
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar_url: imageUrl } },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      username: user.username,
      email: user.email,
      bio: user.bio,
      profileImage: user.avatar_url,
      stats: {
        totalWords: user.total_words,
        totalEntries: user.total_entries
      }
    })
  } catch (error) {
    console.error('Error uploading profile image:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get user subscription status
router.get('/subscription', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const subscription = await Subscription.findOne({ user_id: user._id })
    if (!subscription) {
      // Create a free subscription for new users
      const newSubscription = await Subscription.create({
        user_id: user._id,
        plan: 'free',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        on_trial: true
      })
      return res.json({
        plan: newSubscription.plan,
        entriesLeft: 7 - (user.total_entries % 7),
        totalEntries: user.total_entries,
        isTrialEnded: false
      })
    }

    // Calculate entries left for free plan (7 entries per month)
    const entriesLeft = subscription.plan === 'free' ? 7 - (user.total_entries % 7) : null

    res.json({
      plan: subscription.plan,
      entriesLeft: entriesLeft,
      totalEntries: user.total_entries,
      isTrialEnded: !subscription.on_trial
    })
  } catch (error) {
    console.error('Error fetching subscription data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
