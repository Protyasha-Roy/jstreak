import { motion } from 'framer-motion'

type ContentSectionProps = {
  type: 'about' | 'pricing' | 'terms' | 'privacy' | 'contact'
}

export function ContentSection({ type }: ContentSectionProps) {
  const content = {
    about: {
      title: 'About JStreak',
      content: 'JStreak is your personal space for daily reflection and growth through journaling. Built with a focus on consistency and simplicity, it helps you build and maintain a meaningful journaling habit.'
    },
    pricing: {
      title: 'Pricing',
      content: 'Simple and transparent pricing for everyone. Start for free and upgrade when you need more features.'
    },
    terms: {
      title: 'Terms of Service',
      content: 'By using JStreak, you agree to these terms of service. We take our responsibility seriously.'
    },
    privacy: {
      title: 'Privacy Policy',
      content: 'Your privacy is important to us. We never share your journal entries with anyone.'
    },
    contact: {
      title: 'Contact Us',
      content: "Have questions? We're here to help. Reach out to us anytime."
    }
  }

  return (
    <motion.div
      key={type}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0"
    >
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">{content[type].title}</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {content[type].content}
        </p>
      </div>
    </motion.div>
  )
}
