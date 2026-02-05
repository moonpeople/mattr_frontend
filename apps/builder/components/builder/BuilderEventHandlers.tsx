import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
  Textarea,
} from 'ui'

import {
  BuilderResourceKeyValueList,
  normalizeKeyValueItems,
} from './resources/BuilderResourceKeyValueList'

type EventOption = { id: string; label: string; type?: string }

type BuilderEventHandlersProps = {
  events: unknown
  onChange: (events: Record<string, unknown>[]) => void
  eventTargets?: EventOption[]
  eventQueries?: EventOption[]
  eventScripts?: EventOption[]
  eventPages?: EventOption[]
  eventApps?: EventOption[]
  eventVariables?: EventOption[]
  eventOptions?: { value: string; label: string }[]
  defaultTargetId?: string
  resetKey?: string
}

const defaultEventOptions = [
  { value: 'click', label: 'Click' },
  { value: 'change', label: 'Change' },
  { value: 'focus', label: 'Focus' },
  { value: 'blur', label: 'Blur' },
]

const actionOptions = [
  { value: 'controlComponent', label: 'Control component' },
  { value: 'query', label: 'Control query' },
  { value: 'js', label: 'Run script' },
  { value: 'goToApp', label: 'Go to app' },
  { value: 'goToPage', label: 'Go to page' },
  { value: 'openUrl', label: 'Go to URL' },
  { value: 'notification', label: 'Show notification' },
  { value: 'setState', label: 'Set variable' },
  { value: 'setUrlParams', label: 'Set URL params' },
  { value: 'setLocalStorage', label: 'Set local storage' },
  { value: 'copyToClipboard', label: 'Copy to clipboard' },
  { value: 'exportData', label: 'Export data' },
  { value: 'confetti', label: 'Confetti' },
]

const controlComponentMethods = [
  { value: 'setValue', label: 'Set value' },
  { value: 'blur', label: 'Blur' },
  { value: 'clearValidation', label: 'Clear validation' },
  { value: 'clearValue', label: 'Clear value' },
  { value: 'focus', label: 'Focus' },
  { value: 'resetValue', label: 'Reset value' },
  { value: 'scrollIntoView', label: 'Scroll into view' },
  { value: 'select', label: 'Select' },
  { value: 'setDisabled', label: 'Set disabled' },
  { value: 'setHidden', label: 'Set hidden' },
  { value: 'validate', label: 'Validate' },
]

const queryMethods = [
  { value: 'trigger', label: 'Trigger' },
  { value: 'reset', label: 'Reset' },
  { value: 'clearCache', label: 'Clear cache' },
]

const passDataWithOptions = [
  { value: 'params', label: 'Params' },
  { value: 'variable', label: 'Variable' },
]

const stateMethods = [
  { value: 'setValue', label: 'Set value' },
  { value: 'setIn', label: 'Set in' },
]

const localStorageMethods = [
  { value: 'setValue', label: 'Set value' },
  { value: 'getValue', label: 'Get value' },
  { value: 'clear', label: 'Clear' },
]

const notificationTypes = [
  { value: '', label: 'Default' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
]

const fileTypeOptions = [
  { value: 'csv', label: 'CSV' },
  { value: 'tsv', label: 'TSV' },
  { value: 'json', label: 'JSON' },
  { value: 'excel', label: 'Excel' },
]

const scrollAlignOptions = [
  { value: 'nearest', label: 'Nearest' },
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
]

const scriptModeOptions = [
  { value: 'inline', label: 'Inline' },
  { value: 'saved', label: 'Saved' },
]

const normalizeActionType = (value: unknown) => {
  if (value === 'widget' || value === 'setHidden') {
    return 'controlComponent'
  }
  if (typeof value === 'string' && value.length > 0) {
    return value
  }
  return 'controlComponent'
}

const normalizeEvents = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value as Record<string, unknown>[]
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed as Record<string, unknown>[]
      }
    } catch {
      return []
    }
  }
  return []
}

const resolveOptionValue = (
  value: unknown,
  options: { value: string }[],
  fallback: string
) => {
  const raw = typeof value === 'string' ? value : ''
  return options.some((option) => option.value === raw) ? raw : fallback
}

const getParamRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

const formatKeyPathValue = (value: unknown) => {
  if (Array.isArray(value)) {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  if (typeof value === 'string') {
    return value
  }
  return ''
}

const formatEventSummary = (event: Record<string, unknown>) => {
  const actionType = normalizeActionType(event.type)
  const method = event.method ? String(event.method) : ''
  const target = event.pluginId ?? event.componentId ?? event.widgetId ?? event.targetId
  const params = getParamRecord(event.params)

  if (actionType === 'controlComponent' && target) {
    if (method === 'setHidden') {
      const hidden = params.hidden ?? event.hidden
      return `${String(target)}.setHidden(${hidden ? 'true' : 'false'})`
    }
    if (method === 'setDisabled') {
      const disabled = params.disabled ?? event.disabled
      return `${String(target)}.setDisabled(${disabled ? 'true' : 'false'})`
    }
    if (method === 'setValue') {
      const value = event.value ?? params.value
      return `${String(target)}.setValue(${value ? '...' : ''})`
    }
    if (method === 'scrollIntoView') {
      return `${String(target)}.scrollIntoView()`
    }
    if (method) {
      return `${String(target)}.${method}()`
    }
  }
  if (actionType === 'query') {
    const label = String(event.queryName ?? event.queryId ?? 'select')
    return method ? `Query: ${label} (${method})` : `Query: ${label}`
  }
  if (actionType === 'js') {
    if (event.jsName ?? event.jsId) {
      return `Run script: ${String(event.jsName ?? event.jsId ?? 'select')}`
    }
    if (event.script) {
      return 'Run script: inline'
    }
    return 'Run script'
  }
  if (actionType === 'goToApp') {
    return `Go to app: ${String(event.appId ?? event.appUrl ?? 'select')}`
  }
  if (actionType === 'goToPage') {
    return `Go to page: ${String(event.pageId ?? event.pageName ?? 'select')}`
  }
  if (actionType === 'openUrl') {
    return `Go to URL: ${String(event.url ?? 'set')}`
  }
  if (actionType === 'notification') {
    return `Notify: ${String(event.title ?? event.message ?? 'Notification')}`
  }
  if (actionType === 'setState') {
    return `Set variable: ${String(event.key ?? 'name')}`
  }
  if (actionType === 'setUrlParams') {
    return 'Set URL params'
  }
  if (actionType === 'setLocalStorage') {
    return `Local storage: ${String(event.key ?? 'key')}`
  }
  if (actionType === 'copyToClipboard') {
    return 'Copy to clipboard'
  }
  if (actionType === 'exportData') {
    return `Export: ${String(event.filename ?? 'data.json')}`
  }
  if (actionType === 'confetti') {
    return 'Confetti'
  }
  return 'Custom action'
}

export const BuilderEventHandlers = ({
  events,
  onChange,
  eventTargets = [],
  eventQueries = [],
  eventScripts = [],
  eventPages = [],
  eventApps = [],
  eventVariables = [],
  eventOptions,
  defaultTargetId,
  resetKey,
}: BuilderEventHandlersProps) => {
  const resolvedEventOptions =
    eventOptions && eventOptions.length > 0 ? eventOptions : defaultEventOptions
  const normalizedEvents = useMemo(() => normalizeEvents(events), [events])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draftEvent, setDraftEvent] = useState<Record<string, unknown> | null>(null)
  const activeActionType = draftEvent
    ? normalizeActionType(draftEvent.type)
    : 'controlComponent'
  const tableTargets = useMemo(
    () => eventTargets.filter((target) => target.type === 'Table'),
    [eventTargets]
  )
  const hasSavedScripts = eventScripts.length > 0
  const scriptMode =
    hasSavedScripts && draftEvent && (draftEvent.jsId || draftEvent.jsName)
      ? 'saved'
      : 'inline'

  useEffect(() => {
    setEditorOpen(false)
    setEditingIndex(null)
    setDraftEvent(null)
  }, [resetKey])

  const updateDraft = (patch: Record<string, unknown>) =>
    setDraftEvent((prev) => (prev ? { ...prev, ...patch } : prev))
  const updateParams = (patch: Record<string, unknown>) =>
    setDraftEvent((prev) => {
      if (!prev) {
        return prev
      }
      const params = getParamRecord(prev.params)
      return { ...prev, params: { ...params, ...patch } }
    })

  const openEditor = (index: number | null) => {
    const existing = index === null ? null : normalizedEvents[index]
    const fallbackTarget =
      (existing?.pluginId as string | undefined) ??
      (normalizedEvents[0]?.pluginId as string | undefined) ??
      defaultTargetId ??
      eventTargets[0]?.id ??
      ''
    const nextEvent =
      existing ??
      ({
        event: resolvedEventOptions[0]?.value ?? 'click',
        type: 'controlComponent',
        method: 'setHidden',
        pluginId: fallbackTarget || undefined,
        params: { hidden: true },
        waitType: 'debounce',
        waitMs: '0',
      } as Record<string, unknown>)
    setDraftEvent({
      ...nextEvent,
      type: normalizeActionType(nextEvent.type),
    })
    setEditingIndex(index)
    setEditorOpen(true)
  }

  const saveEditor = () => {
    if (!draftEvent) {
      return
    }
    const nextEvents = [...normalizedEvents]
    if (editingIndex === null) {
      nextEvents.push(draftEvent)
    } else {
      nextEvents[editingIndex] = draftEvent
    }
    onChange(nextEvents)
    setEditorOpen(false)
    setEditingIndex(null)
    setDraftEvent(null)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingIndex(null)
    setDraftEvent(null)
  }

  const handleActionChange = (value: string) => {
    setDraftEvent((prev) => {
      if (!prev) {
        return prev
      }
      const next: Record<string, unknown> = { ...prev, type: value }
      if (
        value === 'controlComponent' &&
        !controlComponentMethods.some((option) => option.value === String(prev.method))
      ) {
        next.method = 'setHidden'
      }
      if (value === 'query' && !queryMethods.some((option) => option.value === String(prev.method))) {
        next.method = 'trigger'
      }
      if (value === 'setState' && !stateMethods.some((option) => option.value === String(prev.method))) {
        next.method = 'setValue'
      }
      if (
        value === 'setLocalStorage' &&
        !localStorageMethods.some((option) => option.value === String(prev.method))
      ) {
        next.method = 'setValue'
      }
      if (value === 'goToPage' && typeof prev.passDataWith !== 'string') {
        next.passDataWith = 'params'
      }
      if (value === 'js' && typeof prev.script !== 'string' && !prev.jsId && !prev.jsName) {
        next.script = ''
      }
      return next
    })
  }

  const handleScriptModeChange = (value: string) => {
    setDraftEvent((prev) => {
      if (!prev) {
        return prev
      }
      if (value === 'saved') {
        const { script, ...rest } = prev
        return {
          ...rest,
          jsId: typeof prev.jsId === 'string' ? prev.jsId : eventScripts[0]?.id ?? '',
        }
      }
      const { jsId, jsName, ...rest } = prev
      return { ...rest, script: typeof prev.script === 'string' ? prev.script : '' }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[12px] font-medium text-foreground">
        <span>Event handlers</span>
        <button
          type="button"
          className="rounded-md p-1 text-foreground-muted hover:bg-foreground/10 hover:text-foreground"
          onClick={() => openEditor(null)}
        >
          <Plus size={12} />
        </button>
      </div>
      {normalizedEvents.length === 0 ? (
        <div className="rounded-md border border-foreground-muted/20 bg-surface-100 px-2 py-1.5 text-[12px] text-foreground-muted">
          None
        </div>
      ) : (
        <div className="space-y-2">
          {normalizedEvents.map((event, index) => (
            <button
              key={`${event.event ?? 'event'}-${index}`}
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-md border border-foreground-muted/20 bg-surface-100 px-2 py-1.5 text-[12px] leading-4 hover:bg-surface-200"
              onClick={() => openEditor(index)}
            >
              <span className="text-foreground">{String(event.event ?? 'Event')}</span>
              <span className="truncate text-foreground-muted">
                {formatEventSummary(event)}
              </span>
            </button>
          ))}
        </div>
      )}
      {draftEvent && (
        <Dialog open={editorOpen} onOpenChange={(open) => !open && closeEditor()}>
          <DialogContent size="large" aria-describedby={undefined}>
            <DialogHeader padding="small">
              <DialogTitle>
                {editingIndex === null ? 'New event handler' : 'Edit event handler'}
              </DialogTitle>
            </DialogHeader>
            <DialogSectionSeparator />
            <DialogSection className="space-y-4 pb-0" padding="small">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">Event</div>
                  <Select_Shadcn_
                    value={resolveOptionValue(
                      draftEvent.event,
                      resolvedEventOptions,
                      resolvedEventOptions[0]?.value ?? 'click'
                    )}
                    onValueChange={(value) => updateDraft({ event: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Event" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {resolvedEventOptions.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">Action</div>
                  <Select_Shadcn_
                    value={activeActionType}
                    onValueChange={handleActionChange}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Control component" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {actionOptions.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
              </div>

              {activeActionType === 'controlComponent' && (
                <div className="space-y-3">
                  <div className="text-[11px] uppercase text-foreground-muted">
                    Control component options
                  </div>
                  <Select_Shadcn_
                    value={String(
                      draftEvent.pluginId ??
                        draftEvent.componentId ??
                        defaultTargetId ??
                        ''
                    )}
                    onValueChange={(value) => updateDraft({ pluginId: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Component" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {eventTargets.map((target) => (
                        <SelectItem_Shadcn_ key={target.id} value={target.id}>
                          {target.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Select_Shadcn_
                    value={resolveOptionValue(
                      draftEvent.method,
                      controlComponentMethods,
                      'setHidden'
                    )}
                    onValueChange={(value) => updateDraft({ method: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Set hidden" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {controlComponentMethods.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  {resolveOptionValue(
                    draftEvent.method,
                    controlComponentMethods,
                    'setHidden'
                  ) === 'setValue' && (
                    <Input_Shadcn_
                      value={String(
                        draftEvent.value ?? getParamRecord(draftEvent.params).value ?? ''
                      )}
                      onChange={(event) => updateDraft({ value: event.target.value })}
                      placeholder="{{ value }}"
                      className="h-7 font-mono text-xs"
                    />
                  )}
                  {resolveOptionValue(
                    draftEvent.method,
                    controlComponentMethods,
                    'setHidden'
                  ) === 'setHidden' && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground-muted">Hidden</span>
                      <Switch
                        checked={Boolean(
                          getParamRecord(draftEvent.params).hidden ?? draftEvent.hidden ?? true
                        )}
                        onCheckedChange={(checked) => updateParams({ hidden: checked })}
                        size="small"
                      />
                    </div>
                  )}
                  {resolveOptionValue(
                    draftEvent.method,
                    controlComponentMethods,
                    'setHidden'
                  ) === 'setDisabled' && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground-muted">Disabled</span>
                      <Switch
                        checked={Boolean(
                          getParamRecord(draftEvent.params).disabled ?? draftEvent.disabled ?? true
                        )}
                        onCheckedChange={(checked) => updateParams({ disabled: checked })}
                        size="small"
                      />
                    </div>
                  )}
                  {resolveOptionValue(
                    draftEvent.method,
                    controlComponentMethods,
                    'setHidden'
                  ) === 'scrollIntoView' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select_Shadcn_
                        value={resolveOptionValue(
                          getParamRecord(draftEvent.params).alignment,
                          scrollAlignOptions,
                          'center'
                        )}
                        onValueChange={(value) => updateParams({ alignment: value })}
                      >
                        <SelectTrigger_Shadcn_ className="h-7">
                          <SelectValue_Shadcn_ placeholder="Alignment" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {scrollAlignOptions.map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                      <label className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-foreground-muted">Smooth scroll</span>
                        <Switch
                          checked={Boolean(
                            getParamRecord(draftEvent.params).smooth ??
                              getParamRecord(draftEvent.params).smoothScroll ??
                              false
                          )}
                          onCheckedChange={(checked) =>
                            updateParams({ smooth: checked, smoothScroll: checked })
                          }
                          size="small"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {activeActionType === 'query' && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">
                    Control query options
                  </div>
                  <Select_Shadcn_
                    value={String(draftEvent.queryId ?? draftEvent.queryName ?? '')}
                    onValueChange={(value) => updateDraft({ queryId: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Query" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {eventQueries.map((query) => (
                        <SelectItem_Shadcn_ key={query.id} value={query.id}>
                          {query.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Select_Shadcn_
                    value={resolveOptionValue(draftEvent.method, queryMethods, 'trigger')}
                    onValueChange={(value) => updateDraft({ method: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Trigger" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {queryMethods.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
              )}

              {activeActionType === 'js' && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">
                    Run script options
                  </div>
                  {hasSavedScripts && (
                    <Select_Shadcn_
                      value={scriptMode}
                      onValueChange={handleScriptModeChange}
                    >
                      <SelectTrigger_Shadcn_ className="h-7">
                        <SelectValue_Shadcn_ placeholder="Inline" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {scriptModeOptions.map((option) => (
                          <SelectItem_Shadcn_ key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  )}
                  {scriptMode === 'saved' ? (
                    <Select_Shadcn_
                      value={String(draftEvent.jsId ?? draftEvent.jsName ?? '')}
                      onValueChange={(value) => updateDraft({ jsId: value })}
                    >
                      <SelectTrigger_Shadcn_ className="h-7">
                        <SelectValue_Shadcn_ placeholder="Script" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {eventScripts.map((script) => (
                          <SelectItem_Shadcn_ key={script.id} value={script.id}>
                            {script.label}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  ) : (
                    <Textarea
                      value={String(draftEvent.script ?? '')}
                      onChange={(event) => updateDraft({ script: event.target.value })}
                      placeholder="// Write your script"
                      className="min-h-[120px] font-mono text-xs"
                    />
                  )}
                </div>
              )}

              {activeActionType === 'goToApp' && (
                <div className="space-y-3">
                  <div className="text-[11px] uppercase text-foreground-muted">Go to app</div>
                  <Select_Shadcn_
                    value={String(draftEvent.appId ?? '')}
                    onValueChange={(value) => updateDraft({ appId: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="App" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {eventApps.map((app) => (
                        <SelectItem_Shadcn_ key={app.id} value={app.id}>
                          {app.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  {(!eventApps.length || draftEvent.appUrl) && (
                    <Input_Shadcn_
                      value={String(draftEvent.appUrl ?? '')}
                      onChange={(event) => updateDraft({ appUrl: event.target.value })}
                      placeholder="https://app-url"
                      className="h-7 text-xs"
                    />
                  )}
                  <Select_Shadcn_
                    value={String(draftEvent.pageId ?? '')}
                    onValueChange={(value) => updateDraft({ pageId: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Page" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {eventPages.map((page) => (
                        <SelectItem_Shadcn_ key={page.id} value={page.id}>
                          {page.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <BuilderResourceKeyValueList
                    label="Query params"
                    items={normalizeKeyValueItems(draftEvent.queryParams)}
                    onChange={(items) => updateDraft({ queryParams: items })}
                  />
                  <BuilderResourceKeyValueList
                    label="Hash params"
                    items={normalizeKeyValueItems(draftEvent.hashParams)}
                    onChange={(items) => updateDraft({ hashParams: items })}
                  />
                  <label className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground-muted">Open in a new tab</span>
                    <Switch
                      checked={Boolean(draftEvent.openInNewTab)}
                      onCheckedChange={(checked) => updateDraft({ openInNewTab: checked })}
                      size="small"
                    />
                  </label>
                </div>
              )}

              {activeActionType === 'goToPage' && (
                <div className="space-y-3">
                  <div className="text-[11px] uppercase text-foreground-muted">Go to page</div>
                  <Select_Shadcn_
                    value={String(draftEvent.pageId ?? '')}
                    onValueChange={(value) => updateDraft({ pageId: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Page" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {eventPages.map((page) => (
                        <SelectItem_Shadcn_ key={page.id} value={page.id}>
                          {page.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Select_Shadcn_
                    value={resolveOptionValue(
                      draftEvent.passDataWith,
                      passDataWithOptions,
                      'params'
                    )}
                    onValueChange={(value) => updateDraft({ passDataWith: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Pass data with" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {passDataWithOptions.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  {resolveOptionValue(
                    draftEvent.passDataWith,
                    passDataWithOptions,
                    'params'
                  ) === 'params' ? (
                    <>
                      <BuilderResourceKeyValueList
                        label="Query params"
                        items={normalizeKeyValueItems(draftEvent.queryParams)}
                        onChange={(items) => updateDraft({ queryParams: items })}
                      />
                      <BuilderResourceKeyValueList
                        label="Hash params"
                        items={normalizeKeyValueItems(draftEvent.hashParams)}
                        onChange={(items) => updateDraft({ hashParams: items })}
                      />
                      <label className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-foreground-muted">
                          Persist params to next page
                        </span>
                        <Switch
                          checked={Boolean(draftEvent.persistParams)}
                          onCheckedChange={(checked) => updateDraft({ persistParams: checked })}
                          size="small"
                        />
                      </label>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {eventVariables.length > 0 ? (
                        <Select_Shadcn_
                          value={String(draftEvent.stateKey ?? '')}
                          onValueChange={(value) => updateDraft({ stateKey: value })}
                        >
                          <SelectTrigger_Shadcn_ className="h-7">
                            <SelectValue_Shadcn_ placeholder="Variable" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {eventVariables.map((variable) => (
                              <SelectItem_Shadcn_ key={variable.id} value={variable.id}>
                                {variable.label}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      ) : (
                        <Input_Shadcn_
                          value={String(draftEvent.stateKey ?? '')}
                          onChange={(event) => updateDraft({ stateKey: event.target.value })}
                          placeholder="Variable"
                          className="h-7 text-xs"
                        />
                      )}
                      <Select_Shadcn_
                        value={resolveOptionValue(draftEvent.method, stateMethods, 'setValue')}
                        onValueChange={(value) => updateDraft({ method: value })}
                      >
                        <SelectTrigger_Shadcn_ className="h-7">
                          <SelectValue_Shadcn_ placeholder="Set value" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {stateMethods.map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                      {resolveOptionValue(draftEvent.method, stateMethods, 'setValue') ===
                        'setIn' && (
                        <Input_Shadcn_
                          value={formatKeyPathValue(draftEvent.keyPath)}
                          onChange={(event) => updateDraft({ keyPath: event.target.value })}
                          placeholder='["path", 0]'
                          className="h-7 font-mono text-xs"
                        />
                      )}
                      <Input_Shadcn_
                        value={String(draftEvent.value ?? '')}
                        onChange={(event) => updateDraft({ value: event.target.value })}
                        placeholder="{{ value }}"
                        className="h-7 font-mono text-xs"
                      />
                    </div>
                  )}
                  <label className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground-muted">Open in a new tab</span>
                    <Switch
                      checked={Boolean(draftEvent.openInNewTab)}
                      onCheckedChange={(checked) => updateDraft({ openInNewTab: checked })}
                      size="small"
                    />
                  </label>
                </div>
              )}

              {activeActionType === 'openUrl' && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">Go to URL</div>
                  <Input_Shadcn_
                    value={String(draftEvent.url ?? '')}
                    onChange={(event) => updateDraft({ url: event.target.value })}
                    placeholder="https://example.com"
                    className="h-7 text-xs"
                  />
                  <label className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground-muted">Open in a new tab</span>
                    <Switch
                      checked={Boolean(draftEvent.openInNewTab)}
                      onCheckedChange={(checked) => updateDraft({ openInNewTab: checked })}
                      size="small"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground-muted">
                      Disable client-side routing
                    </span>
                    <Switch
                      checked={Boolean(draftEvent.disableClientSideRouting)}
                      onCheckedChange={(checked) =>
                        updateDraft({ disableClientSideRouting: checked })
                      }
                      size="small"
                    />
                  </label>
                </div>
              )}

              {activeActionType === 'notification' && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">
                    Show notification
                  </div>
                  <Input_Shadcn_
                    value={String(draftEvent.title ?? draftEvent.message ?? '')}
                    onChange={(event) => updateDraft({ title: event.target.value })}
                    placeholder="Title"
                    className="h-7 text-xs"
                  />
                  <Textarea
                    value={String(draftEvent.description ?? '')}
                    onChange={(event) => updateDraft({ description: event.target.value })}
                    placeholder="Description"
                    className="min-h-[72px] text-xs"
                  />
                  <Select_Shadcn_
                    value={resolveOptionValue(draftEvent.notificationType, notificationTypes, '')}
                    onValueChange={(value) => updateDraft({ notificationType: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Type" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {notificationTypes.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Input_Shadcn_
                    value={String(draftEvent.duration ?? '')}
                    onChange={(event) => updateDraft({ duration: event.target.value })}
                    placeholder="Duration in seconds"
                    className="h-7 text-xs"
                  />
                </div>
              )}

              {activeActionType === 'setState' && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">Set variable</div>
                  {eventVariables.length > 0 ? (
                    <Select_Shadcn_
                      value={String(draftEvent.key ?? '')}
                      onValueChange={(value) => updateDraft({ key: value })}
                    >
                      <SelectTrigger_Shadcn_ className="h-7">
                        <SelectValue_Shadcn_ placeholder="Variable" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {eventVariables.map((variable) => (
                          <SelectItem_Shadcn_ key={variable.id} value={variable.id}>
                            {variable.label}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  ) : (
                    <Input_Shadcn_
                      value={String(draftEvent.key ?? '')}
                      onChange={(event) => updateDraft({ key: event.target.value })}
                      placeholder="Variable name"
                      className="h-7 text-xs"
                    />
                  )}
                  <Select_Shadcn_
                    value={resolveOptionValue(draftEvent.method, stateMethods, 'setValue')}
                    onValueChange={(value) => updateDraft({ method: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Set value" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {stateMethods.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  {resolveOptionValue(draftEvent.method, stateMethods, 'setValue') === 'setIn' && (
                    <Input_Shadcn_
                      value={formatKeyPathValue(draftEvent.keyPath)}
                      onChange={(event) => updateDraft({ keyPath: event.target.value })}
                      placeholder='["path", 0]'
                      className="h-7 font-mono text-xs"
                    />
                  )}
                  <Input_Shadcn_
                    value={String(draftEvent.value ?? '')}
                    onChange={(event) => updateDraft({ value: event.target.value })}
                    placeholder="{{ value }}"
                    className="h-7 font-mono text-xs"
                  />
                </div>
              )}

              {activeActionType === 'setUrlParams' && (
                <div className="space-y-3">
                  <div className="text-[11px] uppercase text-foreground-muted">
                    Set URL params
                  </div>
                  <BuilderResourceKeyValueList
                    label="Query params"
                    items={normalizeKeyValueItems(draftEvent.queryParams)}
                    onChange={(items) => updateDraft({ queryParams: items })}
                  />
                  <BuilderResourceKeyValueList
                    label="Hash params"
                    items={normalizeKeyValueItems(draftEvent.hashParams)}
                    onChange={(items) => updateDraft({ hashParams: items })}
                  />
                </div>
              )}

              {activeActionType === 'setLocalStorage' && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">
                    Local storage
                  </div>
                  <Select_Shadcn_
                    value={resolveOptionValue(draftEvent.method, localStorageMethods, 'setValue')}
                    onValueChange={(value) => updateDraft({ method: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="Set value" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {localStorageMethods.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Input_Shadcn_
                    value={String(draftEvent.key ?? '')}
                    onChange={(event) => updateDraft({ key: event.target.value })}
                    placeholder="Key"
                    className="h-7 text-xs"
                  />
                  {resolveOptionValue(draftEvent.method, localStorageMethods, 'setValue') ===
                    'setValue' && (
                    <Input_Shadcn_
                      value={String(draftEvent.value ?? '')}
                      onChange={(event) => updateDraft({ value: event.target.value })}
                      placeholder="{{ value }}"
                      className="h-7 font-mono text-xs"
                    />
                  )}
                </div>
              )}

              {activeActionType === 'copyToClipboard' && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">
                    Copy to clipboard
                  </div>
                  <Input_Shadcn_
                    value={String(draftEvent.value ?? draftEvent.text ?? '')}
                    onChange={(event) => updateDraft({ value: event.target.value })}
                    placeholder="Value"
                    className="h-7 font-mono text-xs"
                  />
                </div>
              )}

              {activeActionType === 'exportData' && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase text-foreground-muted">Export data</div>
                  {tableTargets.length > 0 && (
                    <Select_Shadcn_
                      value={String(draftEvent.dataSourceId ?? '')}
                      onValueChange={(value) => updateDraft({ dataSourceId: value })}
                    >
                      <SelectTrigger_Shadcn_ className="h-7">
                        <SelectValue_Shadcn_ placeholder="Data" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {tableTargets.map((target) => (
                          <SelectItem_Shadcn_ key={target.id} value={target.id}>
                            {target.label}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  )}
                  {(tableTargets.length === 0 || typeof draftEvent.data === 'string') && (
                    <Textarea
                      value={String(draftEvent.data ?? '')}
                      onChange={(event) => updateDraft({ data: event.target.value })}
                      placeholder="{{ data }}"
                      className="min-h-[80px] font-mono text-xs"
                    />
                  )}
                  <Input_Shadcn_
                    value={String(draftEvent.filename ?? 'data.json')}
                    onChange={(event) => updateDraft({ filename: event.target.value })}
                    placeholder="File name"
                    className="h-7 text-xs"
                  />
                  <Select_Shadcn_
                    value={resolveOptionValue(draftEvent.fileType, fileTypeOptions, 'json')}
                    onValueChange={(value) => updateDraft({ fileType: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7">
                      <SelectValue_Shadcn_ placeholder="File type" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {fileTypeOptions.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
              )}

              {activeActionType === 'confetti' && (
                <div className="text-xs text-foreground-muted">
                  Confetti is useful to confirm the action fired.
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[11px] uppercase text-foreground-muted">Advanced</div>
                <Input_Shadcn_
                  value={String(draftEvent.onlyRunWhen ?? '')}
                  onChange={(event) => updateDraft({ onlyRunWhen: event.target.value })}
                  placeholder="{{ !!example.value }}"
                  className="h-7 font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <Select_Shadcn_
                    value={resolveOptionValue(
                      draftEvent.waitType,
                      [
                        { value: 'debounce', label: 'Debounce' },
                        { value: 'throttle', label: 'Throttle' },
                      ],
                      'debounce'
                    )}
                    onValueChange={(value) => updateDraft({ waitType: value })}
                  >
                    <SelectTrigger_Shadcn_ className="h-7 w-[130px]">
                      <SelectValue_Shadcn_ placeholder="Debounce" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectItem_Shadcn_ value="debounce">Debounce</SelectItem_Shadcn_>
                      <SelectItem_Shadcn_ value="throttle">Throttle</SelectItem_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Input_Shadcn_
                    value={String(draftEvent.waitMs ?? '0')}
                    onChange={(event) => updateDraft({ waitMs: event.target.value })}
                    className="h-7 w-[72px] text-xs"
                  />
                </div>
              </div>
            </DialogSection>
            <DialogFooter padding="small">
              <div className="flex items-center gap-2">
                <Button type="text" size="tiny" onClick={closeEditor}>
                  Cancel
                </Button>
                <Button type="default" size="tiny" onClick={saveEditor}>
                  Save
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
