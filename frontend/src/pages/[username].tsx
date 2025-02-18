import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heatmap } from '@/components/heatmap'
import { Calendar, LogOut, Loader2, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'

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

export default function UserProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [heatmapData, setHeatmapData] = useState<Array<{ date: Date; count: number; wordCount: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const FETCH_COOLDOWN = 5000 // 5 seconds cooldown

  const getImageUrl = (path: string) => {
    if (!path) return '';
    return `http://localhost:5000${path}`;
  };

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/'
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check if we're within cooldown period
        const now = Date.now()
        if (now - lastFetch < FETCH_COOLDOWN) {
          setLoading(false)
          return
        }
        setLastFetch(now)

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }

        // Fetch user data
        const userResponse = await fetch(`http://localhost:5000/api/users/profile/${username}`, {
          headers
        })

        if (!userResponse.ok) {
          if (userResponse.status === 429) {
            // Handle rate limit
            console.log('Rate limited, waiting before retry...')
            setTimeout(() => {
              setLastFetch(0) // Reset lastFetch to allow retry
            }, FETCH_COOLDOWN)
            return
          }
          throw new Error('Failed to fetch user data')
        }

        const userData = await userResponse.json()
        setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          email_verified: userData.email_verified,
          profile: {
            bio: userData.bio || '',
            profile_image: userData.profileImage,
            page_visits: userData.pageVisits || 0
          },
          stats: {
            current_streak: userData.stats?.currentStreak || 0,
            highest_streak: userData.stats?.highestStreak || 0,
            total_words: Math.max(0, userData.stats?.totalWords || 0),
            most_consistent_month: userData.stats?.mostConsistentMonth || '',
            total_entries: userData.stats?.totalEntries || 0
          }
        })

        // Get current year for heatmap
        const currentYear = new Date().getFullYear()

        // Fetch heatmap data
        const heatmapResponse = await fetch(`http://localhost:5000/api/journals/${username}/heatmap?year=${currentYear}`, {
          headers
        })

        if (!heatmapResponse.ok) {
          if (heatmapResponse.status === 429) {
            // Handle rate limit
            console.log('Rate limited, waiting before retry...')
            setTimeout(() => {
              setLastFetch(0) // Reset lastFetch to allow retry
            }, FETCH_COOLDOWN)
            return
          }
          if (heatmapResponse.status === 401) {
            // Token expired or invalid, redirect to login
            localStorage.removeItem('token')
            window.location.href = '/'
            return
          }
          throw new Error('Failed to fetch heatmap data')
        }

        const heatmapData = await heatmapResponse.json()
        setHeatmapData(heatmapData.map((entry: HeatmapEntry) => ({
          date: new Date(entry.date),
          wordCount: entry.wordCount,
          count: 1
        })))
      } catch (error) {
        console.error('Profile fetch error:', error)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username, lastFetch])

  // Show loading first or when user is null (initial state)
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Then show error if any
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
      </div>
    )
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
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        {/* Left side content */}
        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="border-none shadow-none">
            <CardHeader className="p-0">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  {user.profile?.profile_image ? (
                    <AvatarImage 
                      src={getImageUrl(user.profile.profile_image)}
                      alt={user.username}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold">{user.username}</h1>
                  <p className="text-sm text-muted-foreground">{user.profile?.bio || "No bio yet"}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 mt-6">
              <Separator className="mb-6" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Words</span>
                  <span className="font-medium">{user.stats?.total_words?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Entries</span>
                  <span className="font-medium">{user.stats?.total_entries || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Page Views</span>
                  <span className="font-medium">{user.profile?.page_visits || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Theme and Logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
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
              <Heatmap data={heatmapData} onDateClick={handleDateClick} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
