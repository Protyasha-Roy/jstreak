import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2, Eye, EyeOff, Save, ChevronLeft } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { EditorState, Plugin } from 'prosemirror-state'
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view'
import { Schema, NodeSpec, Node as ProsemirrorNode, DOMOutputSpec } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { addListNodes } from 'prosemirror-schema-list'
import { exampleSetup } from 'prosemirror-example-setup'
import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown'

interface JournalEntry {
  content: string
  is_private: boolean
  word_count: number
  created_at: string
  updated_at: string
}

// Create a schema with list nodes and task lists
const baseNodes = schema.spec.nodes
const listNodes = addListNodes(baseNodes, 'paragraph block*', 'block')

// Define custom nodes
const customNodes: {[key: string]: NodeSpec} = {
  taskList: {
    group: 'block',
    content: 'taskItem+',
    toDOM(): DOMOutputSpec { 
      return ['ul', { 'data-type': 'taskList' }, 0] 
    },
    parseDOM: [{ tag: 'ul[data-type="taskList"]' }]
  },
  taskItem: {
    content: 'paragraph block*',
    defining: true,
    attrs: { done: { default: false } },
    toDOM(node: ProsemirrorNode): DOMOutputSpec {
      return ['li', { 'data-type': 'taskItem', 'data-done': node.attrs.done.toString() },
        ['span', { contenteditable: 'false' },
          ['input', { type: 'checkbox', checked: node.attrs.done }]],
        ['div', { class: 'task-content' }, 0]]
    },
    parseDOM: [{
      tag: 'li[data-type="taskItem"]',
      getAttrs(dom: string | HTMLElement) {
        return { done: (dom as HTMLElement).getAttribute('data-done') === 'true' }
      }
    }]
  }
}

// Create the schema by combining base nodes with custom nodes
const mySchema = new Schema({
  nodes: listNodes.append(customNodes),
  marks: schema.spec.marks
})

export default function JournalEntryPage() {
  const { username, year, month, date } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const initializeEditor = (initialContent = '') => {
    if (!editorRef.current || viewRef.current) return

    const doc = initialContent ? defaultMarkdownParser.parse(initialContent) : undefined
    const state = EditorState.create({
      schema: mySchema,
      doc,
      plugins: [
        ...exampleSetup({ schema: mySchema }),
        new Plugin({
          props: {
            decorations(state) {
              const doc = state.doc
              if (doc.childCount === 1 && doc.firstChild?.isTextblock && doc.firstChild.content.size === 0) {
                return DecorationSet.create(doc, [
                  Decoration.node(0, doc.nodeSize - 2, {
                    class: 'is-empty',
                    'data-placeholder': 'Write your journal entry here...'
                  })
                ])
              }
              return DecorationSet.empty
            }
          }
        })
      ]
    })

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction)
        view.updateState(newState)
        const markdown = defaultMarkdownSerializer.serialize(newState.doc)
        setContent(markdown)
      },
      handleClick: (view, pos, event) => {
        const node = view.state.doc.nodeAt(pos)
        if (node?.type.name === 'taskItem') {
          const target = event.target as HTMLElement
          if (target.nodeName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
            const tr = view.state.tr.setNodeAttribute(pos, 'done', !node.attrs.done)
            view.dispatch(tr)
            return true
          }
        }
        return false
      }
    })

    viewRef.current = view
  }

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
            initializeEditor()
          } else {
            throw new Error('Failed to fetch journal entry')
          }
        } else {
          const data = await response.json()
          setEntry(data)
          setContent(data.content)
          setIsPrivate(data.is_private)
          initializeEditor(data.content)
        }
      } catch (err) {
        setError('Failed to fetch journal entry')
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
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
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
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
        <div 
          ref={editorRef}
          className="prose dark:prose-invert max-w-none min-h-[calc(100vh-6rem)] ProseMirror-focused"
          data-placeholder="Write your journal entry here..."
        />
      </div>
    </div>
  )
}
