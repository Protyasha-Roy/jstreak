import { useRef, useState, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface VerificationCodeProps {
  value: string
  onChange: (value: string) => void
  length?: number
}

export function VerificationCode({
  value = '',
  onChange,
  length = 6,
}: VerificationCodeProps) {
  const [focused, setFocused] = useState(false)
  const inputs = useRef<HTMLInputElement[]>([])

  const focusInput = (targetIndex: number) => {
    const input = inputs.current[targetIndex]
    input?.focus()
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      e.preventDefault()
      const newValue = value.slice(0, -1)
      onChange(newValue)
      focusInput(index - 1)
    }
  }

  const handleInput = (index: number, newValue: string) => {
    // Only allow numbers
    const sanitizedValue = newValue.replace(/[^0-9]/g, '')
    const lastChar = sanitizedValue.slice(-1)
    
    if (!lastChar) return

    const newOtp = value.slice(0, index) + lastChar + value.slice(index + 1)
    onChange(newOtp)

    if (index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length)
    const sanitizedValue = pastedData.replace(/[^0-9]/g, '')
    onChange(sanitizedValue)
  }

  return (
    <div
      className={cn(
        'flex gap-2 items-center',
        focused && 'ring-2 ring-ring ring-offset-2 ring-offset-background rounded-lg px-2 py-1'
      )}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => el && (inputs.current[i] = el)}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'h-10 w-10 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all',
            'text-lg font-semibold',
            !value[i] && 'text-muted-foreground'
          )}
        />
      ))}
    </div>
  )
}
