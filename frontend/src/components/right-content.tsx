import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { PenLine, Calendar, Palette, FileText, Lock, BarChart, Check } from 'lucide-react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useState } from 'react'

interface RightContentProps {
  type: 'about' | 'pricing' | 'terms' | 'privacy' | 'contact'
}

const features = [
  {
    title: 'Daily Writing',
    description: 'Build a consistent journaling habit with our clean, distraction-free interface',
    icon: <PenLine className="h-5 w-5 text-primary" />,
  },
  {
    title: 'Track Progress',
    description: 'Visualize your journaling streak with GitHub-style heatmaps',
    icon: <Calendar className="h-5 w-5 text-primary" />,
  },
  {
    title: 'Beautiful Themes',
    description: 'Customize your journal page with our carefully crafted themes',
    icon: <Palette className="h-5 w-5 text-primary" />,
  },
  {
    title: 'Markdown Support',
    description: 'Write with style using markdown for lists, tables, and links',
    icon: <FileText className="h-5 w-5 text-primary" />,
  },
  {
    title: 'Privacy Control',
    description: 'Choose which entries to share and keep others private',
    icon: <Lock className="h-5 w-5 text-primary" />,
  },
  {
    title: 'Analytics',
    description: 'Track your writing stats, streaks, and page views',
    icon: <BarChart className="h-5 w-5 text-primary" />,
  }
]

const pageContent = {
  about: {
    title: 'About JStreak',
    content: (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="prose prose-sm dark:prose-invert">
          <p className="text-lg">
            JStreak is your personal space for daily reflection and growth through journaling.
            Built with a focus on consistency and simplicity, it helps you build and maintain
            a meaningful journaling habit.
          </p>
        </div>

        {/* Preview Image */}
        <motion.div
          className="relative rounded-lg overflow-hidden shadow-2xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="aspect-[16/9] lg:aspect-[16/8] bg-card rounded-lg border p-4">
            <div className="h-full space-y-4">
              <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="p-4 rounded-lg border bg-card hover:bg-card/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="flex items-center gap-3 mb-2">
                {feature.icon}
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Info */}
        <div className="prose prose-sm dark:prose-invert space-y-4">
          <h3>Why Choose JStreak?</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Personal URL:</strong> Get your own jstreak.me/username page to showcase your journaling journey
            </li>
            <li>
              <strong>Customizable Views:</strong> Switch between list and table views, adjust items per row, and customize fonts
            </li>
            <li>
              <strong>Detailed Analytics:</strong> Track your highest streak, current streak, total words written, and most consistent month
            </li>
            <li>
              <strong>Privacy Options:</strong> Control which entries are public and which remain private
            </li>
            <li>
              <strong>Theme Customization:</strong> Choose from a variety of themes to match your style
            </li>
          </ul>
          <p>
            Start your journaling journey today and build a meaningful writing habit that lasts.
            With JStreak, every day is an opportunity to reflect, grow, and track your progress.
          </p>
        </div>
      </motion.div>
    )
  },
  pricing: {
    title: 'Simple, Transparent Pricing',
    content: (
      <div className="space-y-8">
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Free Plan */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl">Free Plan</CardTitle>
              <p className="text-muted-foreground">Perfect for getting started</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/month</span></div>
              <ul className="space-y-2">
                {[
                  '7 journal entries per month',
                  'Basic light/dark themes',
                  'Activity heatmap',
                  'One-month free trial',
                  'Basic word count stats'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative overflow-hidden border-primary">
            <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-sm">
              Popular
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Premium Plan</CardTitle>
              <p className="text-muted-foreground">For dedicated writers</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$5<span className="text-base font-normal text-muted-foreground">/month</span></div>
              <ul className="space-y-2">
                {[
                  'Unlimited journal entries',
                  'Advanced themes collection',
                  'No watermarks on shared pages',
                  'Advanced analytics',
                  'Priority support'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="default">Upgrade Now</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  },
  terms: {
    title: 'Terms of Service',
    content: (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="prose prose-sm dark:prose-invert space-y-6"
      >
        <div>
          <h3 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h3>
          <p>By accessing and using JStreak, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">2. User Accounts</h3>
          <p>You are responsible for maintaining the security of your account and password. JStreak cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">3. Content Ownership</h3>
          <p>You retain all rights to the content you post on JStreak. By posting content, you grant JStreak a license to use, modify, and display that content solely for the purpose of providing the service.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">4. Acceptable Use</h3>
          <p>You agree not to use JStreak for any unlawful purposes or to conduct any unlawful activity, including, but not limited to, fraud, embezzlement, money laundering, or insider trading.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">5. Service Modifications</h3>
          <p>JStreak reserves the right to modify or discontinue the service at any time, with or without notice to you.</p>
        </div>
      </motion.div>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    content: (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="prose prose-sm dark:prose-invert space-y-6"
      >
        <div>
          <h3 className="text-lg font-semibold mb-2">Information We Collect</h3>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Account information (username, email)</li>
            <li>Journal entries and content</li>
            <li>Usage data and analytics</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">How We Use Your Information</h3>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide and maintain the JStreak service</li>
            <li>Track and display your journaling activity</li>
            <li>Improve and personalize your experience</li>
            <li>Communicate with you about updates and features</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Data Security</h3>
          <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Your Rights</h3>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your journal entries</li>
          </ul>
        </div>
      </motion.div>
    ),
  },
  contact: {
    title: 'Contact Us',
    content: (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 max-w-xl mx-auto"
      >
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Have questions or feedback? We'd love to hear from you.
            You can also email us directly at{' '}
            <a href="mailto:support@jstreak.com" className="text-primary hover:underline">
              support@jstreak.com
            </a>
          </p>
        </div>

        <ContactForm />
      </motion.div>
    ),
  },
}

function ContactForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ username: '', email: '', message: '' });
    
    // Reset success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="Your username"
          required
          minLength={3}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Your message or feedback"
          required
          className="min-h-[120px]"
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-green-500 dark:text-green-400"
        >
          Thank you! Your message has been sent successfully.
        </motion.div>
      )}
    </form>
  );
}

export function RightContent({ type }: RightContentProps) {
  return (
    <motion.div
      key={type}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="h-full overflow-auto"
    >
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">{pageContent[type].title}</h2>
        {pageContent[type].content}
      </div>
    </motion.div>
  )
}
