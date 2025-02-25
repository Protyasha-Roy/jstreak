import express, { Request, Response } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import mongoose from 'mongoose'
import { User } from '../models/User'
import { calculateStreaks, updateStreaks } from '../utils/streakCalculator'

const router = express.Router()

const journalSchema = z.object({
  content: z.string(),
  is_private: z.boolean(),
  word_count: z.number().int().min(0)
})

// Define Mongoose Schema
const JournalEntrySchema = new mongoose.Schema({
  username: { type: String, required: true },
  content: { type: String, required: true },
  is_private: { type: Boolean, default: false },
  word_count: { type: Number, required: true },
  date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// Create compound index for username and date
JournalEntrySchema.index({ username: 1, date: 1 }, { unique: true })

const JournalEntry = mongoose.model('JournalEntry', JournalEntrySchema)

// Get journal entry for a specific date
router.get('/:username/:year/:month/:date', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, year, month, date } = req.params
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(date))
    
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)
    
    const journal = await JournalEntry.findOne({
      username,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })

    if (!journal) {
      res.status(404).json({ message: 'Journal entry not found' })
      return
    }

    // Check if the journal is private and if the user is authorized to view it
    if (journal.is_private && journal.username !== req.user.username) {
      res.status(403).json({ message: 'Not authorized to view this journal entry' })
      return
    }

    res.json(journal)
  } catch (error) {
    console.error('Error fetching journal entry:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Create a new journal entry
router.post('/:username/:year/:month/:date', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, year, month, date } = req.params
    const validation = journalSchema.safeParse(req.body)
    
    if (!validation.success) {
      res.status(400).json({ 
        message: 'Invalid journal data', 
        errors: validation.error.format() 
      })
      return
    }

    // Check if user is authorized to create entry for this username
    if (username !== req.user.username) {
      res.status(403).json({ message: 'Not authorized to create journal entry for this user' })
      return
    }

    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(date))
    const { content, is_private, word_count } = validation.data

    // Check if entry already exists for this date
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingEntry = await JournalEntry.findOne({
      username,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })

    if (existingEntry) {
      res.status(400).json({ message: 'Journal entry already exists for this date' })
      return
    }

    // Don't create entry if content is empty
    if (!content.trim()) {
      res.status(400).json({ message: 'Cannot create empty journal entry' })
      return
    }

    const journalEntry = new JournalEntry({
      username,
      content,
      is_private,
      word_count,
      date: targetDate
    })

    const savedEntry = await journalEntry.save()

    // Get total number of non-empty entries
    const totalEntries = await JournalEntry.countDocuments({
      username,
      content: { $regex: /\S+/ } // Matches entries with at least one non-whitespace character
    })

    // Update user statistics
    const updatedUser = await User.findOneAndUpdate(
      { username },
      {
        $inc: { total_words: word_count },
        $set: { total_entries: totalEntries }
      },
      { new: true }
    )

    // Update streaks
    const streaks = await updateStreaks(username)

    res.status(201).json({
      ...savedEntry.toObject(),
      total_entries: totalEntries,
      total_words: updatedUser?.total_words || 0,
      current_streak: streaks.currentStreak,
      highest_streak: streaks.highestStreak
    })
  } catch (error) {
    console.error('Error creating journal entry:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update an existing journal entry
router.put('/:username/:year/:month/:date', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, year, month, date } = req.params
    const validation = journalSchema.safeParse(req.body)
    
    if (!validation.success) {
      res.status(400).json({ 
        message: 'Invalid journal data', 
        errors: validation.error.format() 
      })
      return
    }

    // Check if user is authorized to update entry for this username
    if (username !== req.user.username) {
      res.status(403).json({ message: 'Not authorized to update journal entry for this user' })
      return
    }

    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(date))
    const { content, is_private, word_count } = validation.data

    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingEntry = await JournalEntry.findOne({
      username,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })

    if (!existingEntry) {
      res.status(404).json({ message: 'Journal entry not found' })
      return
    }

    const wordDiff = word_count - existingEntry.word_count

    // If content is empty, delete the entry
    if (!content.trim()) {
      await JournalEntry.deleteOne({
        username,
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      })

      // Get total number of non-empty entries
      const totalEntries = await JournalEntry.countDocuments({
        username,
        content: { $regex: /\S+/ } // Matches entries with at least one non-whitespace character
      })

      // Update user's statistics
      await User.findOneAndUpdate(
        { username },
        { 
          $inc: { total_words: -existingEntry.word_count },
          $set: { total_entries: totalEntries }
        },
        { new: true }
      )

      // Update streaks
      const streaks = await updateStreaks(username)

      res.json({ 
        message: 'Entry deleted due to empty content',
        total_entries: totalEntries,
        total_words: (await User.findOne({ username }))?.total_words || 0,
        current_streak: streaks.currentStreak,
        highest_streak: streaks.highestStreak
      })
      return
    }

    // Update the entry if content is not empty
    const updatedEntry = await JournalEntry.findOneAndUpdate(
      {
        username,
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      },
      {
        $set: {
          content,
          is_private,
          word_count,
          updated_at: new Date()
        }
      },
      { new: true }
    )

    if (!updatedEntry) {
      res.status(404).json({ message: 'Journal entry not found' })
      return
    }

    // Get total number of non-empty entries after update
    const totalEntries = await JournalEntry.countDocuments({
      username,
      content: { $regex: /\S+/ }
    })

    // Update user's statistics
    const updatedUser = await User.findOneAndUpdate(
      { username },
      { 
        $inc: { total_words: wordDiff },
        $set: { total_entries: totalEntries }
      },
      { new: true }
    )

    // Update streaks
    const streaks = await updateStreaks(username)

    res.json({
      ...updatedEntry.toObject(),
      total_entries: totalEntries,
      total_words: updatedUser?.total_words || 0,
      current_streak: streaks.currentStreak,
      highest_streak: streaks.highestStreak
    })
  } catch (error) {
    console.error('Error updating journal entry:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all journal entries for heatmap
router.get('/:username/heatmap', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params
    const { year } = req.query

    // If year is provided, get entries for that year, otherwise get all entries
    const query: any = { username }
    if (year) {
      const startOfYear = new Date(parseInt(year as string), 0, 1)
      const endOfYear = new Date(parseInt(year as string), 11, 31, 23, 59, 59, 999)
      query.date = {
        $gte: startOfYear,
        $lte: endOfYear
      }
    }

    const entries = await JournalEntry.find(query)
      .select('date word_count -_id')
      .sort({ date: 1 })

    const heatmapData = entries.map(entry => ({
      date: entry.date,
      wordCount: entry.word_count
    }))

    res.json(heatmapData)
  } catch (error) {
    console.error('Error fetching heatmap data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get user stats including streaks
router.get('/:username/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params
    
    // Get user stats
    const user = await User.findOne({ username }).select('total_words total_entries current_streak highest_streak')
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    // Calculate latest streaks
    const streaks = await calculateStreaks(username)
    
    // Update user if streaks have changed
    if (user.current_streak !== streaks.currentStreak || user.highest_streak !== streaks.highestStreak) {
      await User.updateOne(
        { username },
        { 
          $set: { 
            current_streak: streaks.currentStreak,
            highest_streak: streaks.highestStreak
          }
        }
      )
    }

    res.json({
      total_words: user.total_words,
      total_entries: user.total_entries,
      current_streak: streaks.currentStreak,
      highest_streak: streaks.highestStreak
    })
  } catch (error) {
    console.error('Error getting user stats:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
