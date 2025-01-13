import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Heatmap } from '../components/heatmap'
import { Loader2, Calendar, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { ThemeToggle } from '../components/theme-toggle'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/'
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const data = await response.json()
        setUser(data.user)

        if (data.user.username !== username) {
          window.location.href = `/${data.user.username}`
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
        setError('Failed to load user data')
        localStorage.removeItem('token')
        window.location.href = '/'
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error || 'User not found'}</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
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
    heatmapData: [
      { date: new Date(), count: 1, wordCount: 250 },
      { date: new Date(Date.now() - 86400000), count: 1, wordCount: 300 },
      { date: new Date(Date.now() - 86400000 * 2), count: 2, wordCount: 500 },
    ]
  }

  const handleDateClick = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    navigate(`/${username}/${year}/${month}/${day}`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - User Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData.avatarUrl} />
                  <AvatarFallback>{userData.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl font-bold">{userData.username}</h2>
                  <p className="text-muted-foreground">{userData.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">{userData.stats.currentStreak}</Badge>
                    <span className="text-sm">days</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Highest Streak</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">{userData.stats.highestStreak}</Badge>
                    <span className="text-sm">days</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Words</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{userData.stats.totalWords}</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{userData.stats.totalEntries}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{userData.stats.viewCount} views</span>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity */}
        <div className="space-y-6">
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
