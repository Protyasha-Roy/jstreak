import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/theme-toggle'
import { Logo } from '../components/logo'
import { Button } from '../components/ui/button'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  email_verified: boolean
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
      navigate('/')
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

        // If the logged-in user's username doesn't match the URL username, redirect to their profile
        if (data.user.username !== username) {
          navigate(`/${data.user.username}`)
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
        setError('Failed to load user data')
        localStorage.removeItem('token')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [username, navigate])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      navigate('/')
    }
  }

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
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-4">
          <Logo />
          <h1 className="text-2xl font-bold">@{user.username}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="space-y-2">
              <p>
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="font-medium">{user.email}</span>
                {user.email_verified ? (
                  <span className="ml-2 text-green-500 text-sm">(Verified)</span>
                ) : (
                  <span className="ml-2 text-yellow-500 text-sm">(Not verified)</span>
                )}
              </p>
              <p>
                <span className="text-muted-foreground">Member since:</span>{' '}
                <span className="font-medium">January 2025</span>
              </p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Writing Stats</h2>
            <div className="text-center py-8 text-muted-foreground">
              No writing stats yet. Start writing to see your progress!
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
