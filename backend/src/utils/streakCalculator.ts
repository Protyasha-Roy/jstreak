import { Journal } from '../models/Journal'
import { User } from '../models/User'

export async function calculateStreaks(username: string) {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const entries = await Journal.find({
    username,
    content: { $regex: /\S+/ } // Only count non-empty entries
  }).sort({ date: -1 }) // Sort by date descending

  if (entries.length === 0) {
    return { currentStreak: 0, highestStreak: 0 }
  }

  let currentStreak = 0
  let highestStreak = 0
  let lastDate: Date | null = null

  // Check if there's an entry for today
  const latestEntry = entries[0]
  const latestDate = new Date(latestEntry.date)
  latestDate.setHours(0, 0, 0, 0)
  
  const daysSinceLatest = Math.floor((startOfToday.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // If no entry today and last entry wasn't yesterday, streak is 0
  if (daysSinceLatest > 1) {
    return { currentStreak: 0, highestStreak: await getHighestStreak(username) }
  }

  // Count current streak
  for (const entry of entries) {
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)

    if (!lastDate) {
      currentStreak = 1
      lastDate = entryDate
      continue
    }

    const daysBetween = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysBetween === 1) {
      currentStreak++
      lastDate = entryDate
    } else {
      break // Streak is broken
    }
  }

  // Get highest streak from database
  highestStreak = await getHighestStreak(username)
  
  // Update highest streak if current is higher
  if (currentStreak > highestStreak) {
    highestStreak = currentStreak
  }

  return { currentStreak, highestStreak }
}

// Helper to get highest streak from all entries
async function getHighestStreak(username: string) {
  const entries = await Journal.find({
    username,
    content: { $regex: /\S+/ }
  }).sort({ date: 1 })

  if (entries.length === 0) return 0

  let maxStreak = 0
  let currentStreak = 1
  let lastDate: Date | null = null

  for (const entry of entries) {
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)

    if (!lastDate) {
      lastDate = entryDate
      continue
    }

    const daysBetween = Math.floor((entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysBetween === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }

    lastDate = entryDate
  }

  return Math.max(maxStreak, currentStreak)
}

// Update the streaks in user document
export async function updateStreaks(username: string) {
  const streaks = await calculateStreaks(username)
  await User.updateOne(
    { username },
    { 
      $set: { 
        current_streak: streaks.currentStreak,
        highest_streak: streaks.highestStreak
      }
    }
  )
  return streaks
}
