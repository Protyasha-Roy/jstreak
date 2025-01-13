import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Eye, EyeOff, Save } from 'lucide-react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { Toggle } from '@/components/ui/toggle'
import { ReactNode, HTMLAttributes } from 'react'

interface JournalEntry {
  content: string
  is_private: boolean
  word_count: number
  created_at: string
  updated_at: string
}

interface MarkdownProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode
}

const markdownComponents: Components = {
  img: () => null,
  audio: () => null,
  video: () => null,
  table: () => null,
  iframe: () => null,
  h1: ({ children, ...props }: MarkdownProps) => (
    <h1 className="text-3xl font-bold mt-6 mb-4" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: MarkdownProps) => (
    <h2 className="text-2xl font-bold mt-5 mb-3" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: MarkdownProps) => (
    <h3 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h3>
  ),
  h4: ({ children, ...props }: MarkdownProps) => (
    <h4 className="text-lg font-bold mt-3 mb-2" {...props}>{children}</h4>
  ),
  h5: ({ children, ...props }: MarkdownProps) => (
    <h5 className="text-base font-bold mt-2 mb-1" {...props}>{children}</h5>
  ),
  h6: ({ children, ...props }: MarkdownProps) => (
    <h6 className="text-sm font-bold mt-2 mb-1" {...props}>{children}</h6>
  ),
  p: ({ children, ...props }: MarkdownProps) => (
    <p className="mb-4" {...props}>{children}</p>
  ),
  blockquote: ({ children, ...props }: MarkdownProps) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props}>{children}</blockquote>
  ),
  ul: ({ children, ...props }: MarkdownProps) => (
    <ul className="list-disc list-inside mb-4" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: MarkdownProps) => (
    <ol className="list-decimal list-inside mb-4" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: MarkdownProps) => (
    <li className="mb-1" {...props}>{children}</li>
  ),
  code: ({ inline, children, ...props }: MarkdownProps & { inline?: boolean }) => 
    inline ? (
      <code className="font-mono" {...props}>{children}</code>
    ) : (
      <pre className="my-4 font-mono">
        <code className="block whitespace-pre-wrap" {...props}>{children}</code>
      </pre>
    )
}

export default function JournalEntryPage() {
  const { username, year, month, date } = useParams()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          window.location.href = '/'
          return
        }

        const response = await fetch(`http://localhost:5000/api/journals/${username}/${year}/${month}/${date}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
            setEntry(null)
          } else {
            throw new Error('Failed to fetch journal entry')
          }
        } else {
          const data = await response.json()
          setEntry(data)
          setContent(data.content)
          setIsPrivate(data.is_private)
        }
      } catch (err) {
        setError('Failed to fetch journal entry')
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()
  }, [username, year, month, date])

  const saveEntry = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/'
        return
      }

      const wordCount = content.trim().split(/\s+/).filter(Boolean).length

      const method = entry ? 'PUT' : 'POST'
      const response = await fetch(`http://localhost:5000/api/journals/${username}/${year}/${month}/${date}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          is_private: isPrivate,
          word_count: wordCount
        })
      })

      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      if (!response.ok) {
        const errorData = isJson ? await response.json() : { message: 'Server error' }
        throw new Error(errorData.message || 'Failed to save journal entry')
      }

      const data = await response.json()
      
      if (method === 'POST') {
        setEntry(data)
      } else {
        setEntry(prev => prev ? {
          ...prev,
          content,
          is_private: isPrivate,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        } : null)
      }
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save journal entry')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Toggle
              pressed={isPrivate}
              onPressedChange={setIsPrivate}
              aria-label="Toggle privacy"
            >
              {isPrivate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Toggle>
            <span className="text-sm text-muted-foreground">
              {isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={saveEntry}
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        <div className="min-h-[500px]">
          {isPreview ? (
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkBreaks, remarkGfm]}
                components={markdownComponents}
              >
                {content || '*No content yet. Start writing...*'}
              </ReactMarkdown>
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your journal entry here... Use markdown for formatting.

Supported markdown:
- **bold** or __bold__
- *italic* or _italic_
- ~~strikethrough~~
- # Heading 1 to ###### Heading 6
- > Blockquotes
- Lists (- or 1.)
- `code` or ```code blocks```
- [Links](url)

Images, audio, video, and tables are not supported."
              className="min-h-[500px] font-mono"
            />
          )}
        </div>

        {content && (
          <div className="mt-4 text-sm text-muted-foreground">
            Word count: {content.trim().split(/\s+/).filter(Boolean).length}
          </div>
        )}
      </Card>
    </div>
  )
}
