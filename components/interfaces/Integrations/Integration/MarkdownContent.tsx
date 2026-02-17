import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { Markdown } from 'components/interfaces/Markdown'
import { cn } from 'ui'

const CHAR_LIMIT = 500 // Adjust this number as needed

export const MarkdownContent = ({
  integrationId,
  initiallyExpanded,
}: {
  integrationId: string
  initiallyExpanded?: boolean
}) => {
  const [content, setContent] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded ?? false)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch(`/static-data/integrations/${integrationId}/overview.md`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        setContent(text)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error loading markdown:', error)
        }
      }
    }
    load()
    return () => controller.abort()
  }, [integrationId])

  const displayContent = isExpanded ? content : content.slice(0, CHAR_LIMIT)
  const supportExpanding = content.length > CHAR_LIMIT || (content.match(/\n/g) || []).length > 1

  if (displayContent.length === 0) return null

  return (
    <div className="px-10">
      <div className="relative">
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 80 }}
          className="overflow-hidden"
          transition={{ duration: 0.4 }}
        >
          <Markdown content={displayContent} className="!max-w-3xl" />
        </motion.div>
        {!isExpanded && (
          <div
            className={cn(
              'bottom-0 left-0 right-0 h-24',
              supportExpanding && 'bg-gradient-to-t from-background-200 to-transparent',
              !isExpanded ? 'absolute' : 'relative'
            )}
          />
        )}
        {supportExpanding && (
          <div className={cn('bottom-0', !isExpanded ? 'absolute' : 'relative mt-3')}>
            <button
              className="text-foreground-light hover:text-foreground underline text-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
