import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2, Eye, EyeOff, Save, ChevronLeft } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
const lowlight = createLowlight(common)

interface JournalEntry {
  content: string
  is_private: boolean
  word_count: number
  created_at: string
  updated_at: string
}

export default function JournalEntryPage() {
  const { username, year, month, date } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside leading-3 -mt-2'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside leading-3 -mt-2'
          }
        },
        code: {
          HTMLAttributes: {
            class: 'rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'
          }
        },
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4'
          }
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary pl-4 italic'
          }
        }
      }),
      TaskList.configure({
        // Removed `not-prose` so Tailwind's prose styles are applied.
        HTMLAttributes: {
          class: 'pl-2'
        }
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-4'
        },
        nested: true
      }),
      Placeholder.configure({
        placeholder: 'Write your journal entry here...'
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full border border-border my-4'
        }
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-border'
        }
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border-b border-border bg-muted font-medium p-4 text-left'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'p-4 border-r border-border last:border-r-0'
        }
      }),
      Link.configure({
        HTMLAttributes: {
          class: 'text-primary', // Blue color for link text.
          rel: 'noopener noreferrer'
        },
        autolink: true,
        linkOnPaste: true,
        // Setting openOnClick to true makes the link clickable.
        openOnClick: true,
        protocols: ['http', 'https', 'mailto', 'tel']
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg border max-w-full'
        }
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-lg overflow-hidden aspect-video w-full'
        }
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-lg bg-muted p-4'
        }
      })
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Store both HTML and text content
      setContent(editor.getHTML())
    }
  })

  useEffect(() => {
    if (editor && entry) {
      // Set the content as HTML in the editor.
      editor.commands.setContent(entry.content, false)
    }
  }, [editor, entry])

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

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center w-full md:w-4/5 lg:w-3/4 xl:w-2/3">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/${username}`)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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

            <div className="text-sm text-muted-foreground">
              {wordCount} words
            </div>

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
      </div>

      {error && (
        <div className="container mx-auto px-4 py-2">
          <div className="p-4 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-md">
            {error}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-4">
        <div className="mx-auto w-full md:w-4/5 lg:w-3/4 xl:w-2/3">
          <EditorContent
            editor={editor}
            className="prose prose-zinc dark:prose-invert max-w-none min-h-[calc(100vh-6rem)] [&_img]:mx-auto [&_img]:max-w-full [&_img]:md:max-w-[80%] [&_img]:lg:max-w-[70%] [&_.youtube-video]:mx-auto [&_.youtube-video]:w-full [&_.youtube-video]:md:w-[80%] [&_.youtube-video]:lg:w-[70%] [&_.youtube-video]:relative [&_.youtube-video]:overflow-hidden"
          />
        </div>
      </div>
    </div>
  )
}
