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

  let currentStreak = 0
  let highestStreak = 0
  let currentYearHighestStreak = 0
  let streakBroken = false
  let lastDate = startOfToday

  // Calculate streaks
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)

    // Calculate days difference
    const diffDays = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1 || diffDays === 0) {
      // Streak continues
      if (!streakBroken) {
        currentStreak++
        if (entryDate.getFullYear() === now.getFullYear()) {
          currentYearHighestStreak = Math.max(currentYearHighestStreak, currentStreak)
        }
      }
    } else {
      // Streak breaks
      if (!streakBroken) {
        streakBroken = true
        if (entryDate.getFullYear() === now.getFullYear()) {
          currentYearHighestStreak = Math.max(currentYearHighestStreak, currentStreak)
        }
      }
      // Start new streak count for historical data
      currentStreak = 1
    }

    // Update highest streak if current is higher
    highestStreak = Math.max(highestStreak, currentStreak)
    lastDate = entryDate
  }

  // If no entries today, check if streak is broken
  const lastEntryDate = entries[0]?.date
  if (lastEntryDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastDate = new Date(lastEntryDate)
    lastDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 1) {
      currentStreak = 0
    }
  }

  return {
    currentStreak,
    highestStreak: currentYearHighestStreak // Use current year's highest streak
  }
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
