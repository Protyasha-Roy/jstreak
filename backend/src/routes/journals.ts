import express from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import mongoose from 'mongoose'
import { User } from '../models/User'

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
router.get('/:username/:year/:month/:date', authenticate, async (req, res) => {
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
      return res.status(404).json({ message: 'Journal entry not found' })
    }

    // Check if the journal is private and if the user is authorized to view it
    if (journal.is_private && journal.username !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to view this journal entry' })
    }

    res.json(journal)
  } catch (error) {
    console.error('Error fetching journal entry:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Create a new journal entry
router.post('/:username/:year/:month/:date', authenticate, async (req, res) => {
  try {
    const { username, year, month, date } = req.params
    const validation = journalSchema.safeParse(req.body)
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid journal data', 
        errors: validation.error.format() 
      })
    }

    // Check if user is authorized to create entry for this username
    if (username !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to create journal entry for this user' })
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
      return res.status(400).json({ message: 'Journal entry already exists for this date' })
    }

    const journalEntry = new JournalEntry({
      username,
      content,
      is_private,
      word_count,
      date: targetDate
    })

    const savedEntry = await journalEntry.save()

    // Update user statistics
    await User.updateOne(
      { username },
      {
        $inc: {
          total_words: word_count,
          total_entries: 1
        }
      }
    )

    res.status(201).json(savedEntry)
  } catch (error) {
    console.error('Error creating journal entry:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update an existing journal entry
router.put('/:username/:year/:month/:date', authenticate, async (req, res) => {
  try {
    const { username, year, month, date } = req.params
    const validation = journalSchema.safeParse(req.body)
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid journal data', 
        errors: validation.error.format() 
      })
    }

    // Check if user is authorized to update entry for this username
    if (username !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to update journal entry for this user' })
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
      return res.status(404).json({ message: 'Journal entry not found' })
    }

    const wordDiff = word_count - existingEntry.word_count

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
      return res.status(404).json({ message: 'Journal entry not found' })
    }

    // Update user's total word count
    if (wordDiff !== 0) {
      await User.updateOne(
        { username },
        { $inc: { total_words: wordDiff } }
      )
    }

    res.json(updatedEntry)
  } catch (error) {
    console.error('Error updating journal entry:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
