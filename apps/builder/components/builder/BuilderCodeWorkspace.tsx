import { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Braces, FileCode, Hash, Play, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input_Shadcn_,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  Switch,
  Textarea,
  cn,
} from 'ui'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import {
  type BuilderQuery,
  useDeleteBuilderQueryMutation,
  useUpdateBuilderQueryMutation,
} from 'data/builder/builder-queries'
import {
  type BuilderJsFunction,
  useDeleteBuilderJsMutation,
  useUpdateBuilderJsMutation,
} from 'data/builder/builder-js'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from 'lib/constants'
import { runBuilderQuery } from 'lib/builder/query-runner'

import type { BuilderPage, BuilderQueryRunResult } from './types'
import { BuilderEventHandlers } from './BuilderEventHandlers'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import {
  type BuilderCodeSelection,
  type BuilderCodeScope,
  buildTransformerCode,
  getBuilderMeta,
  isPlainObject,
  parseTransformerMeta,
  setBuilderMeta,
  stripBuilderMeta,
} from './BuilderCodeUtils'
import { BuilderResourceGraphql } from './resources/BuilderResourceGraphql'
import { BuilderResourceJs } from './resources/BuilderResourceJs'
import { BuilderResourceMattrDatabase } from './resources/BuilderResourceMattrDatabase'
import { BuilderResourceMattrStorage } from './resources/BuilderResourceMattrStorage'
import { BuilderResourceRestApi } from './resources/BuilderResourceRestApi'
import { BuilderResourceSql } from './resources/BuilderResourceSql'

type BuilderCodeWorkspaceProps = {
  appId?: string
  projectRef?: string
  projectRestUrl?: string | null
  connectionString?: string | null
  pages: BuilderPage[]
  activePageId?: string | null
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  selection: BuilderCodeSelection
  onSelectItem: (selection: BuilderCodeSelection) => void
  onQueryRun?: (result: BuilderQueryRunResult) => void
}

type QueryTab = 'general' | 'response' | 'advanced'

type ResponseSettings = {
  notifyOnFailure: boolean
  failureCondition: string
  failureMessage: string
  notifyOnSuccess: boolean
  notificationDuration: string
}

type AdvancedSettings = {
  confirmBeforeRun: boolean
  timeoutMs: string
  runAfterMs: string
  runPeriodically: boolean
  runOnPageLoad: boolean
  pageLoadDelayMs: string
  cacheResults: boolean
  removeParamsFromLogs: string
  disableCondition: string
  keepVariableReferences: boolean
}

const DEFAULT_RESPONSE_SETTINGS: ResponseSettings = {
  notifyOnFailure: true,
  failureCondition: '{{ error }}',
  failureMessage: '{{ data.error.message }}',
  notifyOnSuccess: false,
  notificationDuration: '4.5',
}

const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  confirmBeforeRun: false,
  timeoutMs: '',
  runAfterMs: '',
  runPeriodically: false,
  runOnPageLoad: false,
  pageLoadDelayMs: '',
  cacheResults: false,
  removeParamsFromLogs: '',
  disableCondition: '',
  keepVariableReferences: false,
}

const RESOURCE_OPTIONS = [
  { value: 'mattr_database', label: 'Mattr Database' },
  { value: 'mattr_storage', label: 'Mattr Storage' },
  { value: 'rest', label: 'REST API' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'sql', label: 'SQL' },
  { value: 'js', label: 'Run JS Code' },
]

const parseVariableValue = (value: string) => {
  if (!value.trim()) {
    return null
  }
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export const BuilderCodeWorkspace = ({
  appId,
  projectRef,
  projectRestUrl,
  connectionString,
  pages,
  activePageId,
  queries,
  jsFunctions,
  selection,
  onSelectItem,
  onQueryRun,
}: BuilderCodeWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState<QueryTab>('general')
  const [draftName, setDraftName] = useState('')
  const [queryType, setQueryType] = useState('rest')
  const [configDraft, setConfigDraft] = useState<Record<string, unknown>>({})
  const [scope, setScope] = useState<BuilderCodeScope>('global')
  const [scopePageId, setScopePageId] = useState<string | undefined>(activePageId ?? undefined)
  const [responseSettings, setResponseSettings] = useState<ResponseSettings>(
    DEFAULT_RESPONSE_SETTINGS
  )
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(
    DEFAULT_ADVANCED_SETTINGS
  )
  const [additionalScope, setAdditionalScope] = useState('')
  const [eventHandlers, setEventHandlers] = useState<Record<string, unknown>[]>([])
  const [variableValue, setVariableValue] = useState('')
  const [transformerCode, setTransformerCode] = useState('')
  const [transformerScope, setTransformerScope] = useState<BuilderCodeScope>('global')
  const [transformerPageId, setTransformerPageId] = useState<string | undefined>(
    activePageId ?? undefined
  )
  const [deleteTarget, setDeleteTarget] = useState<BuilderCodeSelection>(null)
  const [runPending, setRunPending] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [queryDraftReadyId, setQueryDraftReadyId] = useState<string | null>(null)
  const [transformerDraftReadyId, setTransformerDraftReadyId] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  const updateQueryMutation = useUpdateBuilderQueryMutation()
  const deleteQueryMutation = useDeleteBuilderQueryMutation()
  const updateJsMutation = useUpdateBuilderJsMutation()
  const deleteJsMutation = useDeleteBuilderJsMutation()

  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const { can: canReadApiKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef, reveal: true },
    { enabled: canReadApiKeys && Boolean(projectRef) }
  )

  const selectedQuery = useMemo(() => {
    if (selection?.type === 'query' || selection?.type === 'variable') {
      return queries.find((query) => query.id === selection.id) ?? null
    }
    return null
  }, [queries, selection])

  const selectedTransformer = useMemo(() => {
    if (selection?.type !== 'transformer') {
      return null
    }
    return jsFunctions.find((func) => func.id === selection.id) ?? null
  }, [jsFunctions, selection])
  const fallbackName = selectedTransformer?.name ?? selectedQuery?.name ?? ''
  const nameEmpty = draftName.trim().length === 0
  const nameTaken = useMemo(() => {
    const normalized = draftName.trim().toLowerCase()
    if (!normalized) {
      return false
    }
    const names = new Set<string>()
    queries.forEach((query) => {
      if (selectedQuery && query.id === selectedQuery.id) {
        return
      }
      names.add(query.name.toLowerCase())
    })
    jsFunctions.forEach((func) => {
      if (selectedTransformer && func.id === selectedTransformer.id) {
        return
      }
      names.add(func.name.toLowerCase())
    })
    return names.has(normalized)
  }, [draftName, jsFunctions, queries, selectedQuery, selectedTransformer])
  const nameError = nameEmpty ? 'Name is required' : nameTaken ? 'Name already exists' : ''
  const safeDraftName = nameError ? fallbackName : draftName

  const eventQueries = useMemo(
    () =>
      queries
        .filter((query) => query.type !== 'variable')
        .map((query) => ({ id: query.id, label: query.name })),
    [queries]
  )
  const eventVariables = useMemo(
    () =>
      queries
        .filter((query) => query.type === 'variable')
        .map((query) => ({ id: query.name || query.id, label: query.name || query.id })),
    [queries]
  )
  const eventScripts = useMemo(
    () => jsFunctions.map((func) => ({ id: func.id, label: func.name })),
    [jsFunctions]
  )
  const eventPages = useMemo(
    () => pages.map((page) => ({ id: page.id, label: page.name })),
    [pages]
  )

  const queryDraftPayload = useMemo(() => {
    if (!selectedQuery) {
      return null
    }

    const config =
      selectedQuery.type === 'variable'
        ? { initialValue: parseVariableValue(variableValue) }
        : isPlainObject(configDraft)
          ? configDraft
          : {}

    const meta = {
      scope,
      pageId: scope === 'page' ? scopePageId ?? activePageId ?? undefined : undefined,
      response: responseSettings,
      advanced: advancedSettings,
      additionalScope,
      eventHandlers,
    }

    return {
      name: safeDraftName,
      type: selectedQuery.type === 'variable' ? 'variable' : queryType,
      config: setBuilderMeta(config, meta),
    }
  }, [
    activePageId,
    additionalScope,
    advancedSettings,
    configDraft,
    draftName,
    eventHandlers,
    queryType,
    responseSettings,
    safeDraftName,
    scope,
    scopePageId,
    selectedQuery,
    variableValue,
  ])

  const queryDraftSignature = useMemo(
    () => (queryDraftPayload ? JSON.stringify(queryDraftPayload) : null),
    [queryDraftPayload]
  )
  const savedQuerySignature = useMemo(() => {
    if (!selectedQuery) {
      return null
    }
    return JSON.stringify({
      name: selectedQuery.name,
      type: selectedQuery.type,
      config: selectedQuery.config,
    })
  }, [selectedQuery])
  const debouncedQuerySignature = useDebounce(queryDraftSignature, 800)

  const transformerDraftPayload = useMemo(() => {
    if (!selectedTransformer) {
      return null
    }
    const code = buildTransformerCode(transformerCode, {
      scope: transformerScope,
      pageId:
        transformerScope === 'page'
          ? transformerPageId ?? activePageId ?? undefined
          : undefined,
    })
    return {
      name: safeDraftName,
      code,
    }
  }, [
    activePageId,
    draftName,
    safeDraftName,
    selectedTransformer,
    transformerCode,
    transformerPageId,
    transformerScope,
  ])
  const transformerDraftSignature = useMemo(
    () => (transformerDraftPayload ? JSON.stringify(transformerDraftPayload) : null),
    [transformerDraftPayload]
  )
  const savedTransformerSignature = useMemo(() => {
    if (!selectedTransformer) {
      return null
    }
    return JSON.stringify({
      name: selectedTransformer.name,
      code: selectedTransformer.code ?? '',
    })
  }, [selectedTransformer])
  const debouncedTransformerSignature = useDebounce(transformerDraftSignature, 800)

  useEffect(() => {
    if (!selectedQuery || !appId) {
      setQueryDraftReadyId(null)
      return
    }
    const meta = getBuilderMeta(selectedQuery.config)
    setDraftName(selectedQuery.name)
    setQueryType(selectedQuery.type)
    setConfigDraft(
      isPlainObject(selectedQuery.config) ? stripBuilderMeta(selectedQuery.config) : {}
    )
    setScope(meta.scope ?? 'global')
    setScopePageId(meta.pageId ?? activePageId ?? undefined)
    setResponseSettings(
      meta.response
        ? { ...DEFAULT_RESPONSE_SETTINGS, ...(meta.response as Partial<ResponseSettings>) }
        : DEFAULT_RESPONSE_SETTINGS
    )
    setAdvancedSettings(
      meta.advanced
        ? { ...DEFAULT_ADVANCED_SETTINGS, ...(meta.advanced as Partial<AdvancedSettings>) }
        : DEFAULT_ADVANCED_SETTINGS
    )
    setAdditionalScope(typeof meta.additionalScope === 'string' ? meta.additionalScope : '')
    setEventHandlers(meta.eventHandlers ?? [])
    if (selectedQuery.type === 'variable') {
      const value = isPlainObject(selectedQuery.config)
        ? selectedQuery.config.initialValue
        : null
      setVariableValue(value === undefined || value === null ? '' : String(value))
    }
    setQueryDraftReadyId(selectedQuery.id)
    setTransformerDraftReadyId(null)
  }, [activePageId, selectedQuery])

  useEffect(() => {
    if (
      !selectedQuery ||
      !appId ||
      !queryDraftPayload ||
      !debouncedQuerySignature ||
      debouncedQuerySignature === savedQuerySignature ||
      queryDraftReadyId !== selectedQuery.id ||
      updateQueryMutation.isPending
    ) {
      return
    }

    updateQueryMutation.mutate({
      appId,
      queryId: selectedQuery.id,
      name: queryDraftPayload.name,
      type: queryDraftPayload.type,
      config: queryDraftPayload.config,
    })
  }, [
    appId,
    debouncedQuerySignature,
    queryDraftPayload,
    savedQuerySignature,
    selectedQuery,
    updateQueryMutation,
  ])

  useEffect(() => {
    if (!selectedTransformer) {
      setTransformerDraftReadyId(null)
      return
    }
    const parsed = parseTransformerMeta(selectedTransformer.code ?? '')
    setDraftName(selectedTransformer.name)
    setTransformerCode(parsed.body)
    setTransformerScope(parsed.meta.scope ?? 'global')
    setTransformerPageId(
      parsed.meta.scope === 'page' ? parsed.meta.pageId ?? activePageId ?? undefined : undefined
    )
    setEventHandlers([])
    setTransformerDraftReadyId(selectedTransformer.id)
    setQueryDraftReadyId(null)
  }, [activePageId, selectedTransformer])

  useEffect(() => {
    if (
      !selectedTransformer ||
      !appId ||
      !transformerDraftPayload ||
      !debouncedTransformerSignature ||
      debouncedTransformerSignature === savedTransformerSignature ||
      transformerDraftReadyId !== selectedTransformer.id ||
      updateJsMutation.isPending
    ) {
      return
    }

    updateJsMutation.mutate({
      appId,
      jsId: selectedTransformer.id,
      name: transformerDraftPayload.name,
      code: transformerDraftPayload.code,
    })
  }, [
    appId,
    debouncedTransformerSignature,
    savedTransformerSignature,
    selectedTransformer,
    transformerDraftPayload,
    updateJsMutation,
  ])

  useEffect(() => {
    if (!selection) {
      return
    }
    setActiveTab('general')
    setIsEditingName(false)
  }, [selection])

  useEffect(() => {
    if (!isEditingName) {
      return
    }
    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }, [isEditingName])

  useEffect(() => {
    if (scope !== 'page' || scopePageId) {
      return
    }
    setScopePageId(activePageId ?? pages[0]?.id)
  }, [activePageId, pages, scope, scopePageId])

  useEffect(() => {
    if (transformerScope !== 'page' || transformerPageId) {
      return
    }
    setTransformerPageId(activePageId ?? pages[0]?.id)
  }, [activePageId, pages, transformerPageId, transformerScope])

  const saveQuery = async () => {
    if (!selectedQuery) {
      return
    }
    if (nameError) {
      toast(nameError)
      return
    }
    const resolvedName = safeDraftName.trim()

    let config: Record<string, unknown>
    try {
      config =
        selectedQuery.type === 'variable'
          ? { initialValue: parseVariableValue(variableValue) }
          : isPlainObject(configDraft)
            ? configDraft
            : {}
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid config'
      toast(message)
      return
    }

    const meta = {
      scope,
      pageId: scope === 'page' ? scopePageId ?? activePageId ?? undefined : undefined,
      response: responseSettings,
      advanced: advancedSettings,
      additionalScope,
      eventHandlers,
    }

    try {
      await updateQueryMutation.mutateAsync({
        appId,
        queryId: selectedQuery.id,
        name: resolvedName,
        type: selectedQuery.type === 'variable' ? 'variable' : queryType,
        config: setBuilderMeta(config, meta),
      })
      toast('Saved')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save'
      toast(message)
    }
  }

  const saveTransformer = async () => {
    if (!selectedTransformer || !appId) {
      return
    }
    if (nameError) {
      toast(nameError)
      return
    }
    const resolvedName = safeDraftName.trim()
    const codeWithMeta = buildTransformerCode(transformerCode, {
      scope: transformerScope,
      pageId: transformerScope === 'page' ? transformerPageId ?? activePageId ?? undefined : undefined,
    })
    try {
      await updateJsMutation.mutateAsync({
        appId,
        jsId: selectedTransformer.id,
        name: resolvedName,
        code: codeWithMeta,
      })
      toast('Saved')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save'
      toast(message)
    }
  }

  const runQuery = async () => {
    if (!selectedQuery || selectedQuery.type === 'variable' || runPending) {
      return
    }

    const config = isPlainObject(configDraft) ? configDraft : {}

    onQueryRun?.({
      queryId: selectedQuery.id,
      name: selectedQuery.name,
      status: 'running',
      receivedAt: new Date().toISOString(),
    })

    setRunPending(true)

    try {
      const data = await runBuilderQuery({
        config,
        queryType: queryType,
        projectRef,
        projectRestUrl,
        accessToken,
        apiKeys: apiKeys ?? [],
      })

      onQueryRun?.({
        queryId: selectedQuery.id,
        name: selectedQuery.name,
        status: 'success',
        data,
        receivedAt: new Date().toISOString(),
      })
      toast(`Query "${selectedQuery.name}" completed`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Query execution failed'
      onQueryRun?.({
        queryId: selectedQuery.id,
        name: selectedQuery.name,
        status: 'error',
        error: message,
        receivedAt: new Date().toISOString(),
      })
      toast(message)
    } finally {
      setRunPending(false)
    }
  }

  const saveAndRun = async () => {
    await saveQuery()
    await runQuery()
  }

  const handleDelete = async () => {
    if (!selection || !appId) {
      return
    }
    if (selection.type === 'query' || selection.type === 'variable') {
      await deleteQueryMutation.mutateAsync({ queryId: selection.id, appId })
    } else {
      await deleteJsMutation.mutateAsync({ jsId: selection.id, appId })
    }
    onSelectItem(null)
    setDeleteTarget(null)
  }

  const renderTabs = () => (
    <div className="flex items-center gap-1 rounded-md bg-surface-200 p-0.5 text-[11px]">
      {(['general', 'response', 'advanced'] as QueryTab[]).map((tab) => (
        <Button
          key={tab}
          type={activeTab === tab ? 'default' : 'text'}
          size="tiny"
          className="h-6 px-2 capitalize"
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </Button>
      ))}
    </div>
  )

  const renderResourceForm = () => {
    if (!selectedQuery || selectedQuery.type === 'variable') {
      return null
    }
    if (queryType === 'rest') {
      return <BuilderResourceRestApi config={configDraft} onChange={setConfigDraft} />
    }
    if (queryType === 'graphql') {
      return <BuilderResourceGraphql config={configDraft} onChange={setConfigDraft} />
    }
    if (queryType === 'mattr_database') {
      return (
        <BuilderResourceMattrDatabase
          config={configDraft}
          onChange={setConfigDraft}
          projectRef={projectRef}
          connectionString={connectionString}
        />
      )
    }
    if (queryType === 'mattr_storage') {
      return <BuilderResourceMattrStorage config={configDraft} onChange={setConfigDraft} />
    }
    if (queryType === 'sql') {
      return <BuilderResourceSql config={configDraft} onChange={setConfigDraft} />
    }
    if (queryType === 'js') {
      return <BuilderResourceJs config={configDraft} onChange={setConfigDraft} />
    }
    return null
  }

  const renderQueryGeneral = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[11px] uppercase text-foreground-muted">Resource</div>
        <Select_Shadcn_ value={queryType} onValueChange={setQueryType}>
          <SelectTrigger_Shadcn_ className="h-8 text-xs">
            <SelectValue_Shadcn_ placeholder="Select resource" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {RESOURCE_OPTIONS.map((option) => (
              <SelectItem_Shadcn_ key={option.value} value={option.value}>
                {option.label}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </div>
      {renderResourceForm()}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] uppercase text-foreground-muted">
          <span>Additional scope</span>
          <Button type="text" size="tiny" icon={<Plus size={12} />} />
        </div>
        <Textarea
          className="min-h-[72px] text-xs"
          value={additionalScope}
          onChange={(event) => setAdditionalScope(event.target.value)}
          placeholder="Add variables to scope"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] uppercase text-foreground-muted">
          <span>Run behavior</span>
          <Button type="text" size="tiny" icon={<Plus size={12} />} />
        </div>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Run this query on page load</span>
          <Switch
            checked={advancedSettings.runOnPageLoad}
            onCheckedChange={(value) =>
              setAdvancedSettings((prev) => ({ ...prev, runOnPageLoad: value }))
            }
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Run this query periodically</span>
          <Switch
            checked={advancedSettings.runPeriodically}
            onCheckedChange={(value) =>
              setAdvancedSettings((prev) => ({ ...prev, runPeriodically: value }))
            }
          />
        </label>
        <Input_Shadcn_
          placeholder="Run event handlers after (ms)"
          value={advancedSettings.runAfterMs}
          onChange={(event) =>
            setAdvancedSettings((prev) => ({ ...prev, runAfterMs: event.target.value }))
          }
        />
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Event handlers</div>
        <BuilderEventHandlers
          events={eventHandlers}
          onChange={setEventHandlers}
          eventQueries={eventQueries}
          eventScripts={eventScripts}
          eventPages={eventPages}
          eventVariables={eventVariables}
          resetKey={selectedQuery?.id}
        />
      </div>
    </div>
  )

  const renderQueryResponse = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Query failure</div>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Show notification on failure</span>
          <Switch
            checked={responseSettings.notifyOnFailure}
            onCheckedChange={(value) =>
              setResponseSettings((prev) => ({ ...prev, notifyOnFailure: value }))
            }
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input_Shadcn_
            placeholder="{{ error }}"
            value={responseSettings.failureCondition}
            onChange={(event) =>
              setResponseSettings((prev) => ({ ...prev, failureCondition: event.target.value }))
            }
          />
          <Input_Shadcn_
            placeholder="{{ data.error.message }}"
            value={responseSettings.failureMessage}
            onChange={(event) =>
              setResponseSettings((prev) => ({ ...prev, failureMessage: event.target.value }))
            }
          />
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Query success</div>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Show notification on success</span>
          <Switch
            checked={responseSettings.notifyOnSuccess}
            onCheckedChange={(value) =>
              setResponseSettings((prev) => ({ ...prev, notifyOnSuccess: value }))
            }
          />
        </label>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">General</div>
        <div className="space-y-1">
          <div className="text-xs">Notification duration (s)</div>
          <Input_Shadcn_
            value={responseSettings.notificationDuration}
            onChange={(event) =>
              setResponseSettings((prev) => ({
                ...prev,
                notificationDuration: event.target.value,
              }))
            }
          />
        </div>
      </div>
    </div>
  )

  const renderQueryAdvanced = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Query running feedback</div>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Show a confirmation modal before running</span>
          <Switch
            checked={advancedSettings.confirmBeforeRun}
            onCheckedChange={(value) =>
              setAdvancedSettings((prev) => ({ ...prev, confirmBeforeRun: value }))
            }
          />
        </label>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Timing</div>
        <Input_Shadcn_
          placeholder="Timeout after (ms)"
          value={advancedSettings.timeoutMs}
          onChange={(event) =>
            setAdvancedSettings((prev) => ({ ...prev, timeoutMs: event.target.value }))
          }
        />
        <Input_Shadcn_
          placeholder="Run event handlers after (ms)"
          value={advancedSettings.runAfterMs}
          onChange={(event) =>
            setAdvancedSettings((prev) => ({ ...prev, runAfterMs: event.target.value }))
          }
        />
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Run this query periodically</span>
          <Switch
            checked={advancedSettings.runPeriodically}
            onCheckedChange={(value) =>
              setAdvancedSettings((prev) => ({ ...prev, runPeriodically: value }))
            }
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Run this query on page load</span>
          <Switch
            checked={advancedSettings.runOnPageLoad}
            onCheckedChange={(value) =>
              setAdvancedSettings((prev) => ({ ...prev, runOnPageLoad: value }))
            }
          />
        </label>
        <Input_Shadcn_
          placeholder="Page load delay (ms)"
          value={advancedSettings.pageLoadDelayMs}
          onChange={(event) =>
            setAdvancedSettings((prev) => ({ ...prev, pageLoadDelayMs: event.target.value }))
          }
        />
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Cache</div>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Cache the results of this query</span>
          <Switch
            checked={advancedSettings.cacheResults}
            onCheckedChange={(value) =>
              setAdvancedSettings((prev) => ({ ...prev, cacheResults: value }))
            }
          />
        </label>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Advanced options</div>
        <Input_Shadcn_
          placeholder="Remove parameters from logs"
          value={advancedSettings.removeParamsFromLogs}
          onChange={(event) =>
            setAdvancedSettings((prev) => ({
              ...prev,
              removeParamsFromLogs: event.target.value,
            }))
          }
        />
        <Input_Shadcn_
          placeholder="Disable query"
          value={advancedSettings.disableCondition}
          onChange={(event) =>
            setAdvancedSettings((prev) => ({ ...prev, disableCondition: event.target.value }))
          }
        />
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Keep variable references inside the query</span>
          <Switch
            checked={advancedSettings.keepVariableReferences}
            onCheckedChange={(value) =>
              setAdvancedSettings((prev) => ({ ...prev, keepVariableReferences: value }))
            }
          />
        </label>
      </div>
    </div>
  )

  const renderVariableEditor = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[11px] uppercase text-foreground-muted">Initial value</div>
        <Input_Shadcn_
          value={variableValue}
          onChange={(event) => setVariableValue(event.target.value)}
          placeholder="null"
        />
      </div>
    </div>
  )

  const renderTransformerEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Code</div>
        <div className="h-[220px] overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100">
          <CodeEditor
            id={`builder-transformer-${selectedTransformer?.id ?? 'new'}`}
            language="javascript"
            value={transformerCode}
            onInputChange={(value) => setTransformerCode(value ?? '')}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )

  const renderEditorContent = () => {
    if (selectedTransformer) {
      return renderTransformerEditor()
    }
    if (selectedQuery?.type === 'variable') {
      return renderVariableEditor()
    }
    if (selectedQuery) {
      if (activeTab === 'response') {
        return renderQueryResponse()
      }
      if (activeTab === 'advanced') {
        return renderQueryAdvanced()
      }
      return renderQueryGeneral()
    }
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        Select or create a query, transformer, or variable.
      </div>
    )
  }

  const HeaderIcon = selectedTransformer
    ? FileCode
    : selectedQuery?.type === 'variable'
      ? Hash
      : Braces

  const headerTitle = selection
    ? draftName || selectedTransformer?.name || selectedQuery?.name || 'Code'
    : 'Code'
  const canEditName = Boolean(selection)

  const commitName = async () => {
    if (!selection || !appId) {
      setIsEditingName(false)
      return
    }
    const nextName = draftName.trim()
    if (!nextName || nameTaken) {
      return
    }
    if (nextName === fallbackName) {
      setIsEditingName(false)
      return
    }
    try {
      if (selectedTransformer) {
        await updateJsMutation.mutateAsync({
          appId,
          jsId: selectedTransformer.id,
          name: nextName,
        })
      } else if (selectedQuery) {
        await updateQueryMutation.mutateAsync({
          appId,
          queryId: selectedQuery.id,
          name: nextName,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename'
      toast(message)
      setDraftName(fallbackName)
    } finally {
      setIsEditingName(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-100">
      <div className="flex items-center justify-between border-b border-foreground-muted/30 bg-surface-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-foreground-muted/30 bg-surface-200">
            <HeaderIcon size={12} />
          </div>
          {isEditingName && canEditName ? (
            <div className="flex flex-col">
              <Input_Shadcn_
                ref={nameInputRef}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    commitName()
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    setDraftName(fallbackName)
                    setIsEditingName(false)
                  }
                }}
                aria-invalid={Boolean(nameError)}
                className="h-6 w-48 text-xs"
              />
              {nameError && (
                <div className="text-[10px] text-destructive">{nameError}</div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="text-xs font-medium text-foreground"
              onClick={() => {
                if (!canEditName) {
                  return
                }
                setIsEditingName(true)
              }}
            >
              {headerTitle}
            </button>
          )}
          {selectedQuery && selectedQuery.type !== 'variable' && (
            <div className="ml-2">{renderTabs()}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selection && (
            <Button
              type="text"
              size="tiny"
              icon={<Trash2 size={14} />}
              onClick={() => setDeleteTarget(selection)}
            />
          )}
          {selectedQuery && selectedQuery.type !== 'variable' && (
            <Button
              type="default"
              size="tiny"
              icon={<Play size={14} />}
              onClick={runQuery}
              loading={runPending}
              disabled={runPending}
            >
              Test
            </Button>
          )}
          {selectedQuery && selectedQuery.type !== 'variable' ? (
            <Button type="primary" size="tiny" icon={<Save size={14} />} onClick={saveAndRun}>
              Save & Run
            </Button>
          ) : selectedTransformer ? (
            <Button type="primary" size="tiny" icon={<Save size={14} />} onClick={saveTransformer}>
              Save
            </Button>
          ) : selectedQuery ? (
            <Button type="primary" size="tiny" icon={<Save size={14} />} onClick={saveQuery}>
              Save
            </Button>
          ) : null}
        </div>
      </div>
      <ScrollArea className={cn('min-h-0 flex-1 px-3 py-3', selection ? '' : 'text-center')}>
        {renderEditorContent()}
      </ScrollArea>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? 'Delete this item? This cannot be undone.' : 'Delete this item?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
