import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Heatmap } from '../components/heatmap'
import {  Calendar, LogOut, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { ThemeToggle } from '../components/theme-toggle'
import { Separator } from '../components/ui/separator'

interface User {
  id: string
  username: string
  email: string
  email_verified: boolean
  profile?: {
    bio: string
    page_visits: number
    profile_image?: string
  }
  stats?: {
    current_streak: number
    highest_streak: number
    total_words: number
    most_consistent_month: string
    total_entries: number
  }
}

interface HeatmapEntry {
  date: string
  wordCount: number
}

interface UserData {
  username: string
  avatarUrl?: string
  bio?: string
  stats: {
    currentStreak: number
    highestStreak: number
    totalWords: number
    totalEntries: number
    viewCount: number
  }
  heatmapData: Array<{
    date: Date
    count: number
    wordCount: number
  }>
}

export default function UserProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [heatmapData, setHeatmapData] = useState<Array<{ date: Date; count: number; wordCount: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/'
      return
    }

    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data')
        }

        const userData = await userResponse.json()
        setUser(userData.user)

        if (userData.user.username !== username) {
          window.location.href = `/${userData.user.username}`
          return
        }

        // Fetch heatmap data
        const heatmapResponse = await fetch(`http://localhost:5000/api/journals/${username}/heatmap`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!heatmapResponse.ok) {
          throw new Error('Failed to fetch heatmap data')
        }

        const heatmapData = await heatmapResponse.json() as HeatmapEntry[]
        setHeatmapData(heatmapData.map((entry) => ({
          date: new Date(entry.date),
          wordCount: entry.wordCount,
          count: 1
        })))
      } catch (error) {
        console.error('Profile fetch error:', error)
        setError('Failed to load user data')
        localStorage.removeItem('token')
        window.location.href = '/'
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div>{error || 'User not found'}</div>
    )
  }

  const userData: UserData = {
    username: user.username,
    avatarUrl: user.profile?.profile_image,
    bio: user.profile?.bio,
    stats: {
      currentStreak: user.stats?.current_streak || 0,
      highestStreak: user.stats?.highest_streak || 0,
      totalWords: user.stats?.total_words || 0,
      totalEntries: user.stats?.total_entries || 0,
      viewCount: user.profile?.page_visits || 0,
    },
    heatmapData: heatmapData
  }

  const handleDateClick = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    navigate(`/${username}/${year}/${month}/${day}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 justify-center">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profile?.profile_image} />
                <AvatarFallback>{username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{username}</h2>
                <p className="text-sm text-muted-foreground">{user?.profile?.bio || "No bio yet"}</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Stats Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <span className="font-medium">{user?.stats?.current_streak || 0} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Highest Streak</span>
                <span className="font-medium">{user?.stats?.highest_streak || 0} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Words</span>
                <span className="font-medium">{user?.stats?.total_words?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Entries</span>
                <span className="font-medium">{user?.stats?.total_entries || 0}</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Page Views */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Page Views</span>
              <span className="font-medium">{user?.profile?.page_visits || 0}</span>
            </div>

            <Separator className="my-4" />

            {/* Theme and Logout */}
            <div className="flex items-center justify-between pt-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Right side content */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-2">
              <CardTitle className="text-base">Writing Activity</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Calendar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="pt-0">
              <Heatmap data={userData.heatmapData} onDateClick={handleDateClick} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
