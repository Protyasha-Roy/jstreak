import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { User, CreditCard, Upload, ArrowLeft } from 'lucide-react'

const getImageUrl = (path: string) => {
  if (!path) return '';
  return `https://jstreak.onrender.com${path}`;
};

export default function Settings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // User profile state
  const [userData, setUserData] = useState({
    username: '',
    bio: '',
    isPublic: true,
    profileImage: '',
    email: '',
    stats: {
      totalWords: 0,
      totalEntries: 0
    }
  })

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState({
    plan: '',
    entriesLeft: 0,
    totalEntries: 0,
    isTrialEnded: false
  })

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('https://jstreak.onrender.com/api/users/subscription', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) throw new Error('Failed to fetch subscription data')

        const data = await response.json()
        setSubscriptionData({
          plan: data.plan,
          entriesLeft: data.entriesLeft,
          totalEntries: data.totalEntries,
          isTrialEnded: data.isTrialEnded
        })
      } catch (error) {
        console.error('Error fetching subscription data:', error)
      }
    }

    fetchSubscriptionData()
  }, [])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/')
          return
        }

        const response = await fetch('https://jstreak.onrender.com/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const data = await response.json()
        console.log('Profile data:', data)
        setUserData({
          username: data.username,
          bio: data.bio || '',
          isPublic: true,
          profileImage: data.profileImage || '',
          email: data.email,
          stats: data.stats
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Failed to load user data')
      }
    }

    fetchUserData()
  }, [navigate])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)
      const token = localStorage.getItem('token')

      // Update profile data
      const profileResponse = await fetch('https://jstreak.onrender.com/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username,
          bio: userData.bio
        })
      })

      if (!profileResponse.ok) {
        const error = await profileResponse.json()
        throw new Error(error.message || 'Failed to update profile')
      }

      // Upload image if selected
      if (image) {
        const formData = new FormData()
        formData.append('image', image)

        const imageResponse = await fetch('https://jstreak.onrender.com/api/users/profile/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!imageResponse.ok) {
          throw new Error('Failed to upload image')
        }

        const imageData = await imageResponse.json()
        setUserData(prev => ({
          ...prev,
          profileImage: imageData.profileImage
        }))
      }

      setSuccessMessage('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </motion.div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 text-green-500 p-4 rounded-lg">
          {successMessage}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Update your profile information and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      {(preview || userData.profileImage) ? (
                        <AvatarImage src={preview || getImageUrl(userData.profileImage)} />
                      ) : (
                        <AvatarFallback>
                          {userData.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" className="relative">
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      {(preview || userData.profileImage) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setImage(null)
                            setPreview(null)
                            setUserData(prev => ({ ...prev, profileImage: '' }))
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        placeholder="Enter your username"
                        value={userData.username}
                        onChange={(e) => setUserData(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea
                        placeholder="Tell us about yourself"
                        value={userData.bio}
                        onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={userData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Contact support to change your email address
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Page Visibility</Label>
                        <p className="text-sm text-muted-foreground">
                          Make your profile visible to others
                        </p>
                      </div>
                      <Switch
                        checked={userData.isPublic}
                        onCheckedChange={(checked) => setUserData(prev => ({ ...prev, isPublic: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleProfileUpdate} disabled={loading}>
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          ⭮
                        </motion.div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>
                    Manage your subscription and usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    {/* Current Plan Status */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">Current Plan</h3>
                          <p className="text-sm text-muted-foreground">
                            {subscriptionData.plan === 'free' ? 'Free Plan' : 'Premium Plan'}
                          </p>
                        </div>
                        {subscriptionData.plan === 'free' && (
                          <Button variant="default">
                            Upgrade to Premium
                          </Button>
                        )}
                      </div>

                      {subscriptionData.plan === 'free' && (
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Entries Left This Month</span>
                            <span className="font-medium">{subscriptionData.entriesLeft} / 7</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2 transition-all" 
                              style={{ width: `${(subscriptionData.entriesLeft / 7) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Plan Comparison */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Free Plan Features */}
                      <div className="p-4 border rounded-lg space-y-3">
                        <h4 className="font-medium">Free Plan</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• 7 journal entries per month</li>
                          <li>• Basic light/dark themes</li>
                          <li>• Activity heatmap</li>
                          <li>• Basic word count stats</li>
                        </ul>
                      </div>

                      {/* Premium Plan Features */}
                      <div className="p-4 border-2 border-primary rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Premium Plan</h4>
                          <div className="text-right">
                            <span className="font-bold">$7</span>
                            <span className="text-sm text-muted-foreground">/month</span>
                          </div>
                        </div>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Everything on the free plan</li>
                          <li>• Unlimited journal entries</li>
                          <li>• No watermarks on shared pages</li>
                          <li>• Advanced analytics</li>
                          <li>• Priority support</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
