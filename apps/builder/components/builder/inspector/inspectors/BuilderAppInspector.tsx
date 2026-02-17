/**
 * Инспектор приложения (app-level): настройки метаданных и app layout параметров.
 */
import { Plus } from 'lucide-react'

import { Button, Input_Shadcn_, Separator, Switch, Textarea } from 'ui'

import type { BuilderAppMeta, BuilderPage } from '../../types'
import { slugifyInput } from '../../utils/slugify'
import { InspectorEmptyState, ShortcutRow } from '../shared'

interface BuilderAppInspectorProps {
  appId: string | null
  appName: string
  activePage: BuilderPage | null
  appMeta: BuilderAppMeta
  onUpdateMeta: (patch: Partial<BuilderAppMeta>) => void
}

export const BuilderAppInspector = ({
  appId,
  appName,
  activePage,
  appMeta,
  onUpdateMeta,
}: BuilderAppInspectorProps) => {
  if (!appId) {
    return (
      <InspectorEmptyState
        title="Select an app"
        description="Choose an app to configure its settings."
      />
    )
  }

  const meta = appMeta ?? {}
  const shortcuts = meta.shortcuts ?? []
  const previewBase = typeof window !== 'undefined' ? window.location.origin : ''
  const appUrl = meta.url ?? ''
  const pageUrl = activePage?.pageMeta?.url ?? ''
  const previewPath = [appUrl, pageUrl].filter(Boolean).join('/')
  const urlPreview = previewBase ? `${previewBase}/${previewPath}` : `/${previewPath}`

  const handleUrlBlur = (value: string) => {
    const normalized = slugifyInput(value)
    if (normalized !== value) {
      onUpdateMeta({ url: normalized })
    }
  }

  const defaultBrowserTitle = appName || 'App'
  const browserTitleValue = meta.browserTitle ?? defaultBrowserTitle
  const maxWidthValue = meta.maxWidth ?? '100%'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-xs font-semibold">App</div>
          <div className="text-[11px] text-foreground-muted">{appId}</div>
        </div>
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
        <div className="space-y-2">
          <div className="text-[11px] uppercase text-foreground-muted">Content</div>
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted">Browser title</div>
            <Input_Shadcn_
              value={browserTitleValue}
              onChange={(event) => onUpdateMeta({ browserTitle: event.target.value })}
              className="h-7"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted">Custom URL</div>
            <Input_Shadcn_
              value={meta.url ?? ''}
              onChange={(event) =>
                onUpdateMeta({ url: slugifyInput(event.target.value) })
              }
              onBlur={(event) => handleUrlBlur(event.target.value)}
              className="h-7"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted">URL preview</div>
            <Textarea value={urlPreview} readOnly />
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="text-[11px] uppercase text-foreground-muted">Interaction</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-foreground-muted">Custom shortcuts</div>
              <Button
                type="text"
                size="tiny"
                icon={<Plus size={14} />}
                onClick={() =>
                  onUpdateMeta({
                    shortcuts: [
                      ...shortcuts,
                      { name: 'Shortcut', shortcut: 'Cmd+K', action: '' },
                    ],
                  })
                }
              >
                Add
              </Button>
            </div>
            {shortcuts.length === 0 ? (
              <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-2.5 text-xs text-foreground-muted">
                No custom shortcuts
              </div>
            ) : (
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <ShortcutRow
                    key={`shortcut-${index}`}
                    shortcut={shortcut}
                    onChange={(patch) => {
                      const next = [...shortcuts]
                      next[index] = { ...next[index], ...patch }
                      onUpdateMeta({ shortcuts: next })
                    }}
                    onRemove={() => {
                      const next = shortcuts.filter((_, itemIndex) => itemIndex !== index)
                      onUpdateMeta({ shortcuts: next })
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-foreground-muted">Persist URL parameters</div>
            <Switch
              checked={Boolean(meta.persistUrlParams)}
              onCheckedChange={(checked) => onUpdateMeta({ persistUrlParams: checked })}
              size="small"
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="text-[11px] uppercase text-foreground-muted">Spacing</div>
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted">Max width</div>
            <Input_Shadcn_
              value={maxWidthValue}
              onChange={(event) => onUpdateMeta({ maxWidth: event.target.value })}
              onBlur={(event) => {
                const value = event.target.value.trim()
                if (!value) {
                  onUpdateMeta({ maxWidth: '100%' })
                }
              }}
              className="h-7"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
