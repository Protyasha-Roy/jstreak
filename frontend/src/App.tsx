import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import { Logo } from './components/logo'
import { ThemeToggle } from './components/theme-toggle'
import { RightContent } from './components/right-content'
import { cn } from './lib/utils'
import { checkUsername, checkEmail, register, verifyOTP, login } from './services/api'

interface ApiError {
  message: string;
}

type StepType = 'username' | 'email' | 'password' | 'otp'
type FooterLinkType = 'about' | 'pricing' | 'terms' | 'privacy' | 'contact'
type AuthMode = 'login' | 'signup'

function App() {
  const [step, setStep] = useState<StepType>('username')
  const [rightContent, setRightContent] = useState<FooterLinkType>('about')
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [isNavSticky, setIsNavSticky] = useState(false)
  const [navOriginalTop, setNavOriginalTop] = useState<number | null>(null)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionToken, setSessionToken] = useState<string>('')

  useEffect(() => {
    const navElement = document.getElementById('right-nav');
    if (navElement) {
      const rect = navElement.getBoundingClientRect();
      setNavOriginalTop(rect.top + window.scrollY);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const navElement = document.getElementById('right-nav');
      if (!navElement || navOriginalTop === null) return;

      const currentScrollY = window.scrollY;
      
      if (currentScrollY >= navOriginalTop) {
        setIsNavSticky(true);
      } else {
        setIsNavSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navOriginalTop]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (authMode === 'signup') {
        if (step === 'username') {
          const { exists } = await checkUsername(formData.username)
          if (exists) {
            setError('Username is already taken')
            return
          }
          setStep('email')
        } else if (step === 'email') {
          const { exists } = await checkEmail(formData.email)
          if (exists) {
            setError('Email is already registered')
            return
          }
          setStep('password')
        } else if (step === 'password') {
          const response = await register({
            username: formData.username,
            email: formData.email,
            password: formData.password
          })
          setSessionToken(response.token)
          setStep('otp')
        } else if (step === 'otp') {
          const { success } = await verifyOTP(formData.otp, sessionToken)
          if (success) {
            // Store token and redirect
            localStorage.setItem('token', sessionToken)
            window.location.href = `/${formData.username}`
          } else {
            setError('Invalid verification code')
          }
        }
      } else {
        // Handle login
        const response = await login({
          username: formData.username,
          password: formData.password
        })
        localStorage.setItem('token', response.token)
        window.location.href = `/${response.user.username}`
      }
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'password') {
      setStep('email')
    } else if (step === 'email') {
      setStep('username')
    } else if (step === 'otp') {
      setStep('password')
    }
  }

  const getStepTitle = (currentStep: StepType) => {
    if (authMode === 'login') {
      return 'Welcome back!'
    }
    switch (currentStep) {
      case 'username':
        return 'Choose your unique username'
      case 'email':
        return 'Add your email'
      case 'password':
        return 'Create password'
      case 'otp':
        return 'Verify your email'
    }
  }

  const getStepDescription = (currentStep: StepType) => {
    if (authMode === 'login') {
      return 'Sign in to continue your journaling journey'
    }
    switch (currentStep) {
      case 'username':
        return 'This will be your page address'
      case 'email':
        return 'OTP will be sent to this email'
      case 'password':
        return 'Make it strong and memorable'
      case 'otp':
        return 'Enter the 6-digit code sent to your email'
    }
  }

  return (
    <div className="min-h-screen lg:h-screen flex flex-col overflow-hidden">
      <div className="fixed top-4 right-4 z-50 overflow-visible">
        <ThemeToggle />
      </div>

      <main className="flex-1 w-full px-2 sm:px-4 lg:container mx-auto flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)] mt-4">
        {/* Left side - Sign up form */}
        <div className="w-full lg:w-[40%] px-2 sm:px-6 lg:p-8 flex flex-col">
          <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-full sm:max-w-2xl lg:max-w-md mx-auto space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <Logo size={40} />
                <h1 className="mt-4 text-4xl font-bold">jstreak</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  Track your writing journey
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <motion.h2
                  className="text-l text-left font-semibold"
                  key={`${authMode}-${step}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {getStepTitle(step)}
                </motion.h2>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm bg-red-50 dark:bg-red-950/50 p-2 rounded-md border border-red-200 dark:border-red-800"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-2">
                  <AnimatePresence mode="wait">
                    {authMode === 'login' ? (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2 text-left">
                          <Label>Username or Email</Label>
                          <Input
                            value={formData.username}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setFormData({ ...formData, username: e.target.value })}
                            placeholder="username or email"
                          />
                        </div>
                        <div className="space-y-2 text-left">
                          <Label>Password</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                setFormData({ ...formData, password: e.target.value })}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <>
                        {step === 'username' && (
                          <motion.div
                            key="username"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                          >
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                jstreak.me/
                              </span>
                              <Input
                                value={formData.username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData({ ...formData, username: e.target.value })
                                }
                                className="pl-[6.5rem]"
                                placeholder="username"
                              />
                            </div>
                          </motion.div>
                        )}

                        {step === 'email' && (
                          <motion.div
                            key="email"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                          >
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                setFormData({ ...formData, email: e.target.value })}
                              placeholder="you@example.com"
                            />
                          </motion.div>
                        )}

                        {step === 'password' && (
                          <motion.div
                            key="password"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                          >
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {step === 'otp' && (
                          <motion.div
                            key="otp"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label>Verify your email</Label>
                              <Input
                                id="otp"
                                value={formData.otp}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                  setFormData({ ...formData, otp: value })
                                }}
                                className="text-center tracking-[1em] font-mono text-lg"
                                maxLength={6}
                                placeholder="000000"
                                inputMode="numeric"
                                pattern="[0-9]*"
                              />
                              <p className="text-xs text-muted-foreground text-center">
                                Enter the 6-digit code sent to your email
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </AnimatePresence>

                  <p className="text-sm text-muted-foreground text-left">
                    {getStepDescription(step)}
                  </p>

                  <div className="pt-4 flex gap-2">
                    {step !== 'username' && authMode !== 'login' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-1/2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-0 transition-colors"
                        onClick={handleBack}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      className={cn(
                        "hover:bg-primary/90 focus-visible:ring-0 transition-colors",
                        step !== 'username' && authMode !== 'login' ? "w-1/2" : "w-full",
                        isLoading && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={
                        isLoading ||
                        (step === 'username' && (!formData.username || formData.username.length < 3)) ||
                        (step === 'email' && (!formData.email || !formData.email.includes('@'))) ||
                        (step === 'password' && (!formData.password || formData.password.length < 6)) ||
                        (step === 'otp' && (!formData.otp || formData.otp.length !== 6)) ||
                        (authMode === 'login' && (!formData.username || !formData.password))
                      }
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Loading...
                        </div>
                      ) : (
                        <>
                          {authMode === 'login'
                            ? 'Sign in'
                            : step === 'otp'
                            ? 'Complete Sign up'
                            : (
                              <>
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault()
                      setAuthMode(authMode === 'login' ? 'signup' : 'login')
                      setStep('username')
                      setFormData({
                        username: '',
                        email: '',
                        password: '',
                        otp: ''
                      })
                    }}
                  >
                    {authMode === 'login'
                      ? "Don't have an account? Sign up"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right side content */}
        <div className="w-full lg:w-[70%] border-t lg:border-t-0 lg:border-l flex flex-col mt-5">
          <div id="right-nav" className={`px-4 sm:px-8 py-4 border-b bg-background transition-all duration-300 ${isNavSticky ? 'fixed top-0 left-0 right-0 z-10' : ''}`}>
            <nav className="flex gap-3 sm:gap-8 max-w-[900px] mx-auto lg:max-w-none lg:mx-0">
              {[
                ['about', 'About'],
                ['pricing', 'Pricing'],
                ['terms', 'Terms'],
                ['privacy', 'Privacy'],
                ['contact', 'Contact']
              ].map(([key, label]) => (
                <a
                  key={key}
                  href="#"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    setRightContent(key as FooterLinkType)
                  }}
                  className={`text-sm ${
                    rightContent === key
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  } transition-colors`}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div className={`lg:flex-1 lg:overflow-auto hide-scrollbar relative ${isNavSticky ? 'mt-[4.5rem]' : ''}`}>
            <div className="min-h-full w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="max-w-[900px] mx-auto">
                <AnimatePresence mode="wait">
                  {rightContent && <RightContent key={rightContent} type={rightContent} />}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 border-t mt-auto">
        <div className="w-full px-2 sm:px-4 lg:container mx-auto text-center">
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-col lg:flex-row justify-center items-center gap-1 lg:gap-2">
            <span>
              Developed by{' '}
              <a
                href="https://protyasharoy.onrender.com"
                className="hover:text-foreground transition-colors text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Protyasha Roy
              </a>
            </span>
            <span className="hidden lg:inline-block">&middot;</span>
            <span>&copy; 2025 JStreak. All rights reserved.</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
