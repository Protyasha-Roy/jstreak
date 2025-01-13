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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Slider } from '../components/ui/slider'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { User, Palette, CreditCard, Upload, Check, AlertTriangle, ArrowLeft } from 'lucide-react'

const fontOptions = [
  { value: 'inter', label: 'Inter' },
  { value: 'manrope', label: 'Manrope' },
  { value: 'system', label: 'System Default' },
]

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const colorOptions = [
  { value: 'blue', label: 'Ocean Blue' },
  { value: 'green', label: 'Forest Green' },
  { value: 'purple', label: 'Royal Purple' },
  { value: 'red', label: 'Ruby Red' },
]

const getImageUrl = (path: string) => {
  if (!path) return '';
  return `http://localhost:5000${path}`;
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

  // Appearance settings state
  const [appearanceData, setAppearanceData] = useState({
    font: 'inter',
    theme: 'system',
    primaryColor: 'blue',
    fontSize: 16
  })

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState({
    plan: 'free',
    entriesLeft: 5,
    trialEndsIn: 7,
    isTrialEnded: false
  })

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/')
          return
        }

        const response = await fetch('http://localhost:5000/api/users/profile', {
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
      const profileResponse = await fetch('http://localhost:5000/api/users/profile', {
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

        const imageResponse = await fetch('http://localhost:5000/api/users/profile/image', {
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

  const handleAppearanceUpdate = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)
      
      // Save appearance settings to localStorage for now
      // We can implement backend storage later if needed
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceData))
      
      setSuccessMessage('Appearance settings updated successfully')
    } catch (error) {
      console.error('Error updating appearance:', error)
      setError(error instanceof Error ? error.message : 'Failed to update appearance settings')
    } finally {
      setLoading(false)
    }
  }

  // Load saved appearance settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('appearanceSettings')
    if (savedSettings) {
      setAppearanceData(JSON.parse(savedSettings))
    }
  }, [])

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
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
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

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize how JStreak looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={appearanceData.font}
                        onValueChange={(value) => setAppearanceData(prev => ({ ...prev, font: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select
                        value={appearanceData.theme}
                        onValueChange={(value) => setAppearanceData(prev => ({ ...prev, theme: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {themeOptions.map((theme) => (
                            <SelectItem key={theme.value} value={theme.value}>
                              {theme.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <Select
                        value={appearanceData.primaryColor}
                        onValueChange={(value) => setAppearanceData(prev => ({ ...prev, primaryColor: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              {color.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[appearanceData.fontSize]}
                          onValueChange={([value]) => setAppearanceData(prev => ({ ...prev, fontSize: value }))}
                          min={12}
                          max={20}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">{appearanceData.fontSize}px</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAppearanceUpdate} disabled={loading}>
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
                      'Save Appearance'
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
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Entries Left</span>
                            <span className="font-medium">{subscriptionData.entriesLeft}</span>
                          </div>
                          <Progress value={(subscriptionData.entriesLeft / 10) * 100} />
                        </div>

                        {!subscriptionData.isTrialEnded && (
                          <div className="rounded-lg border p-4">
                            <div className="flex items-start gap-4">
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              <div>
                                <h4 className="font-semibold">Trial Period</h4>
                                <p className="text-sm text-muted-foreground">
                                  Your trial ends in {subscriptionData.trialEndsIn} days. Upgrade to continue using premium features.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
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
