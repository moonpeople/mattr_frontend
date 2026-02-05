import { useEffect, useMemo, useState } from 'react'
import { Braces, Copy, FileCode, Play, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle as DialogTitleText,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
  Textarea,
} from 'ui'
import {
  type BuilderQuery,
  useBuilderQueriesQuery,
  useCreateBuilderQueryMutation,
  useDeleteBuilderQueryMutation,
  useUpdateBuilderQueryMutation,
} from 'data/builder/builder-queries'
import {
  type BuilderJsFunction,
  useBuilderJsQuery,
  useCreateBuilderJsMutation,
  useDeleteBuilderJsMutation,
  useUpdateBuilderJsMutation,
} from 'data/builder/builder-js'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from 'lib/constants'
import { runBuilderQuery } from 'lib/builder/query-runner'
import type { BuilderQueryRunResult } from './types'

// Data panel: upravlenie queries/JS i zapuskami.

type BuilderDataPanelProps = {
  appId?: string
  onQueryRun?: (result: BuilderQueryRunResult) => void
  projectRef?: string
  projectRestUrl?: string | null
}

type QueryFormValues = {
  name: string
  type: string
  config: string
  trigger: string
}

type JsFormValues = {
  name: string
  code: string
}

const DEFAULT_QUERY_CONFIG = '{\n  \n}'
const DEFAULT_JS_CODE = 'export function main() {\n  \n}\n'

// Podbiraet unikalnoe imya dlya kopii.
const buildCopyName = (name: string, existing: Set<string>) => {
  const base = `${name} Copy`
  if (!existing.has(base)) {
    return base
  }

  let index = 2
  let candidate = `${base} ${index}`
  while (existing.has(candidate)) {
    index += 1
    candidate = `${base} ${index}`
  }
  return candidate
}

const parseJson = (value: string) => {
  if (!value.trim()) {
    return {}
  }
  return JSON.parse(value)
}

// Normalizatsiya Supabase REST/GraphQL URL.
const normalizeRestUrl = (restUrl: string) => {
  if (restUrl.endsWith('/rest/v1')) {
    return `${restUrl}/`
  }
  if (restUrl.endsWith('/rest/v1/')) {
    return restUrl
  }
  if (restUrl.endsWith('/')) {
    return `${restUrl}rest/v1/`
  }
  return `${restUrl}/rest/v1/`
}

const deriveSupabaseUrls = (projectRestUrl?: string | null, projectRef?: string) => {
  if (projectRestUrl) {
    const restUrl = normalizeRestUrl(projectRestUrl)
    const baseUrl = restUrl.replace(/\/rest\/v1\/?$/, '')
    return {
      restUrl,
      graphqlUrl: `${baseUrl}/graphql/v1`,
    }
  }

  if (projectRef) {
    return {
      restUrl: `https://${projectRef}.supabase.co/rest/v1/`,
      graphqlUrl: `https://${projectRef}.supabase.co/graphql/v1`,
    }
  }

  return {
    restUrl: 'https://PROJECT_REF.supabase.co/rest/v1/',
    graphqlUrl: 'https://PROJECT_REF.supabase.co/graphql/v1',
  }
}

export const BuilderDataPanel = ({
  appId,
  onQueryRun,
  projectRef,
  projectRestUrl,
}: BuilderDataPanelProps) => {
  const [activeQuery, setActiveQuery] = useState<BuilderQuery | null>(null)
  const [activeJs, setActiveJs] = useState<BuilderJsFunction | null>(null)
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false)
  const [isJsDialogOpen, setIsJsDialogOpen] = useState(false)
  const [deleteQueryTarget, setDeleteQueryTarget] = useState<BuilderQuery | null>(null)
  const [deleteJsTarget, setDeleteJsTarget] = useState<BuilderJsFunction | null>(null)
  const [localRunPending, setLocalRunPending] = useState(false)

  const queryForm = useForm<QueryFormValues>({
    defaultValues: { name: '', type: 'rest', config: DEFAULT_QUERY_CONFIG, trigger: '' },
  })
  const jsForm = useForm<JsFormValues>({
    defaultValues: { name: '', code: DEFAULT_JS_CODE },
  })

  const { data: queries = [], isLoading: isQueriesLoading } = useBuilderQueriesQuery(
    { appId },
    { enabled: Boolean(appId) }
  )
  const { data: jsFunctions = [], isLoading: isJsLoading } = useBuilderJsQuery(
    { appId },
    { enabled: Boolean(appId) }
  )

  const createQueryMutation = useCreateBuilderQueryMutation()
  const updateQueryMutation = useUpdateBuilderQueryMutation()
  const deleteQueryMutation = useDeleteBuilderQueryMutation()
  const createJsMutation = useCreateBuilderJsMutation()
  const updateJsMutation = useUpdateBuilderJsMutation()
  const deleteJsMutation = useDeleteBuilderJsMutation()
  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const { can: canReadApiKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef, reveal: true },
    { enabled: canReadApiKeys && Boolean(projectRef) }
  )

  const sortedQueries = useMemo(
    () => [...queries].sort((a, b) => a.name.localeCompare(b.name)),
    [queries]
  )
  const sortedJs = useMemo(
    () => [...jsFunctions].sort((a, b) => a.name.localeCompare(b.name)),
    [jsFunctions]
  )
  const supabaseUrls = useMemo(
    () => deriveSupabaseUrls(projectRestUrl, projectRef),
    [projectRestUrl, projectRef]
  )
  const runPending = localRunPending

  useEffect(() => {
    if (!isQueryDialogOpen) {
      return
    }

    if (activeQuery) {
      queryForm.reset({
        name: activeQuery.name,
        type: activeQuery.type,
        config: JSON.stringify(activeQuery.config ?? {}, null, 2),
        trigger: activeQuery.trigger ?? '',
      })
    } else {
      queryForm.reset({ name: '', type: 'rest', config: DEFAULT_QUERY_CONFIG, trigger: '' })
    }
  }, [activeQuery, isQueryDialogOpen, queryForm])

  useEffect(() => {
    if (!isJsDialogOpen) {
      return
    }

    if (activeJs) {
      jsForm.reset({
        name: activeJs.name,
        code: activeJs.code,
      })
    } else {
      jsForm.reset({ name: '', code: DEFAULT_JS_CODE })
    }
  }, [activeJs, isJsDialogOpen, jsForm])

  const openQueryDialog = (query?: BuilderQuery) => {
    setActiveQuery(query ?? null)
    setIsQueryDialogOpen(true)
  }

  const openJsDialog = (func?: BuilderJsFunction) => {
    setActiveJs(func ?? null)
    setIsJsDialogOpen(true)
  }

  const handleSubmitQuery = (values: QueryFormValues) => {
    if (!appId) {
      return
    }

    let parsedConfig: Record<string, unknown>
    try {
      parsedConfig = parseJson(values.config)
    } catch (error) {
      queryForm.setError('config', {
        message: 'Config must be valid JSON',
      })
      return
    }

    const payload = {
      name: values.name.trim(),
      type: values.type.trim(),
      config: parsedConfig,
      trigger: values.trigger.trim() || null,
    }

    if (!payload.name || !payload.type) {
      return
    }

    if (activeQuery) {
      updateQueryMutation.mutate(
        {
          appId,
          queryId: activeQuery.id,
          ...payload,
        },
        {
          onSuccess: () => {
            setIsQueryDialogOpen(false)
            setActiveQuery(null)
          },
        }
      )
      return
    }

    createQueryMutation.mutate(
      {
        appId,
        ...payload,
      },
      {
        onSuccess: () => {
          setIsQueryDialogOpen(false)
          setActiveQuery(null)
        },
      }
    )
  }

  const handleSubmitJs = (values: JsFormValues) => {
    if (!appId) {
      return
    }

    const payload = {
      name: values.name.trim(),
      code: values.code.trim(),
    }

    if (!payload.name || !payload.code) {
      return
    }

    if (activeJs) {
      updateJsMutation.mutate(
        {
          appId,
          jsId: activeJs.id,
          ...payload,
        },
        {
          onSuccess: () => {
            setIsJsDialogOpen(false)
            setActiveJs(null)
          },
        }
      )
      return
    }

    createJsMutation.mutate(
      {
        appId,
        ...payload,
      },
      {
        onSuccess: () => {
          setIsJsDialogOpen(false)
          setActiveJs(null)
        },
      }
    )
  }

  const handleDeleteQueryConfirm = () => {
    if (!appId || !deleteQueryTarget) {
      return
    }

    deleteQueryMutation.mutate(
      { queryId: deleteQueryTarget.id, appId },
      {
        onSuccess: () => {
          setDeleteQueryTarget(null)
          if (activeQuery?.id === deleteQueryTarget.id) {
            setIsQueryDialogOpen(false)
            setActiveQuery(null)
          }
        },
      }
    )
  }

  const handleDeleteJsConfirm = () => {
    if (!appId || !deleteJsTarget) {
      return
    }

    deleteJsMutation.mutate(
      { jsId: deleteJsTarget.id, appId },
      {
        onSuccess: () => {
          setDeleteJsTarget(null)
          if (activeJs?.id === deleteJsTarget.id) {
            setIsJsDialogOpen(false)
            setActiveJs(null)
          }
        },
      }
    )
  }

  const handleRunQuery = async (query: BuilderQuery) => {
    if (localRunPending) {
      return
    }

    onQueryRun?.({
      queryId: query.id,
      name: query.name,
      status: 'running',
      receivedAt: new Date().toISOString(),
    })

    setLocalRunPending(true)

    try {
      const data = await runBuilderQuery({
        config: query.config,
        queryType: query.type,
        projectRef,
        projectRestUrl,
        accessToken,
        apiKeys: apiKeys ?? [],
      })

      onQueryRun?.({
        queryId: query.id,
        name: query.name,
        status: 'success',
        data,
        receivedAt: new Date().toISOString(),
      })
      toast(`Query "${query.name}" completed`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Query execution failed'
      onQueryRun?.({
        queryId: query.id,
        name: query.name,
        status: 'error',
        error: message,
        receivedAt: new Date().toISOString(),
      })
      toast(message)
    } finally {
      setLocalRunPending(false)
    }
  }

  const handleDuplicateQuery = (query: BuilderQuery) => {
    if (!appId) {
      return
    }

    const existing = new Set(queries.map((item) => item.name))
    const name = buildCopyName(query.name, existing)

    createQueryMutation.mutate(
      {
        appId,
        name,
        type: query.type,
        config: query.config,
        trigger: query.trigger ?? null,
      },
      {
        onSuccess: () => {
          toast(`Query "${name}" created`)
        },
        onError: (error) => {
          toast(error.message)
        },
      }
    )
  }

  const handleDuplicateJs = (func: BuilderJsFunction) => {
    if (!appId) {
      return
    }

    const existing = new Set(jsFunctions.map((item) => item.name))
    const name = buildCopyName(func.name, existing)

    createJsMutation.mutate(
      {
        appId,
        name,
        code: func.code,
      },
      {
        onSuccess: () => {
          toast(`Function "${name}" created`)
        },
        onError: (error) => {
          toast(error.message)
        },
      }
    )
  }

  const applyRestTemplate = () => {
    queryForm.setValue('type', 'rest', { shouldDirty: true })
    queryForm.setValue(
      'config',
      JSON.stringify(
        {
          url: `${supabaseUrls.restUrl}your_table?select=*`,
          method: 'GET',
          headers: {
            apikey: '{{ auth.anonKey }}',
            Authorization: 'Bearer {{ auth.accessToken }}',
          },
        },
        null,
        2
      ),
      { shouldDirty: true }
    )
  }

  const applyGraphqlTemplate = () => {
    queryForm.setValue('type', 'graphql', { shouldDirty: true })
    queryForm.setValue(
      'config',
      JSON.stringify(
        {
          url: supabaseUrls.graphqlUrl,
          method: 'POST',
          headers: {
            apikey: '{{ auth.anonKey }}',
            Authorization: 'Bearer {{ auth.accessToken }}',
          },
          body: {
            query: 'query Example { }',
            variables: {},
          },
        },
        null,
        2
      ),
      { shouldDirty: true }
    )
  }

  if (!appId) {
    return (
      <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-4 text-center text-xs text-foreground-muted">
        Select an app to manage queries and JS functions.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] uppercase text-foreground-muted">
            <Braces size={14} />
            Queries
          </div>
          <Button type="default" size="tiny" icon={<Plus size={14} />} onClick={() => openQueryDialog()}>
            New
          </Button>
        </div>
        {isQueriesLoading ? (
          <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-3 text-xs text-foreground-muted">
            Loading queries...
          </div>
        ) : sortedQueries.length === 0 ? (
          <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-3 text-xs text-foreground-muted">
            No queries yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedQueries.map((query) => (
              <div
                key={query.id}
                className="flex items-center justify-between gap-3 rounded-md border border-transparent px-2.5 py-1.5 text-left text-xs transition hover:border-foreground-muted/40 hover:bg-surface-200"
              >
                <button
                  type="button"
                  onClick={() => openQueryDialog(query)}
                  className="flex-1 text-left"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{query.name}</div>
                    <div className="text-xs text-foreground-muted">
                      {query.trigger ? `Trigger: ${query.trigger}` : 'Manual trigger'}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <Badge>{query.type}</Badge>
                  <Button
                    type="text"
                    size="tiny"
                    icon={<Play size={14} />}
                    aria-label={`Run ${query.name}`}
                    onClick={() => handleRunQuery(query)}
                    disabled={runPending}
                    loading={runPending}
                  />
                  <Button
                    type="text"
                    size="tiny"
                    icon={<Copy size={14} />}
                    aria-label={`Duplicate ${query.name}`}
                    onClick={() => handleDuplicateQuery(query)}
                    disabled={createQueryMutation.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] uppercase text-foreground-muted">
            <FileCode size={14} />
            JS Functions
          </div>
          <Button type="default" size="tiny" icon={<Plus size={14} />} onClick={() => openJsDialog()}>
            New
          </Button>
        </div>
        {isJsLoading ? (
          <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-3 text-xs text-foreground-muted">
            Loading JS functions...
          </div>
        ) : sortedJs.length === 0 ? (
          <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-3 text-xs text-foreground-muted">
            No JS functions yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedJs.map((func) => (
              <div
                key={func.id}
                className="flex items-center justify-between gap-3 rounded-md border border-transparent px-2.5 py-1.5 text-left text-xs transition hover:border-foreground-muted/40 hover:bg-surface-200"
              >
                <button
                  type="button"
                  onClick={() => openJsDialog(func)}
                  className="flex-1 text-left"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{func.name}</div>
                    <div className="text-xs text-foreground-muted">
                      {func.code.trim().split('\n')[0]?.slice(0, 40) || 'Function'}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <Badge>JS</Badge>
                  <Button
                    type="text"
                    size="tiny"
                    icon={<Copy size={14} />}
                    aria-label={`Duplicate ${func.name}`}
                    onClick={() => handleDuplicateJs(func)}
                    disabled={createJsMutation.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
        <DialogContent size="medium">
          <Form_Shadcn_ {...queryForm}>
            <form
              id="builder-query-form"
              onSubmit={queryForm.handleSubmit(handleSubmitQuery)}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitleText>{activeQuery ? 'Edit query' : 'New query'}</DialogTitleText>
                <DialogDescription>Configure data fetching for your app.</DialogDescription>
              </DialogHeader>
              <DialogSectionSeparator />
              <DialogSection className="space-y-4">
                <div className="rounded-md border border-foreground-muted/30 bg-surface-100 p-3">
                  <div className="text-xs uppercase text-foreground-muted">Templates</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="default" size="tiny" onClick={applyRestTemplate}>
                      Supabase REST
                    </Button>
                    <Button type="default" size="tiny" onClick={applyGraphqlTemplate}>
                      Supabase GraphQL
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-foreground-muted">
                    REST: {supabaseUrls.restUrl}
                  </div>
                </div>
                <FormField_Shadcn_
                  name="name"
                  control={queryForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_>Name</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="orders" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  name="type"
                  control={queryForm.control}
                  rules={{ required: 'Type is required' }}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_>Type</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="rest | sql | graphql" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  name="trigger"
                  control={queryForm.control}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_>Trigger</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="onPageLoad" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  name="config"
                  control={queryForm.control}
                  rules={{ required: 'Config is required' }}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_>Config (JSON)</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Textarea
                          {...field}
                          className="min-h-[140px] font-mono text-xs"
                          placeholder='{"url": "/api/orders", "method": "GET"}'
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </DialogSection>
              <DialogFooter>
                {activeQuery && (
                  <Button
                    type="danger"
                    icon={<Trash2 size={14} />}
                    onClick={() => setDeleteQueryTarget(activeQuery)}
                    disabled={deleteQueryMutation.isPending}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  type="default"
                  onClick={() => setIsQueryDialogOpen(false)}
                  disabled={createQueryMutation.isPending || updateQueryMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createQueryMutation.isPending || updateQueryMutation.isPending}
                >
                  {activeQuery ? 'Save query' : 'Create query'}
                </Button>
              </DialogFooter>
            </form>
          </Form_Shadcn_>
        </DialogContent>
      </Dialog>

      <Dialog open={isJsDialogOpen} onOpenChange={setIsJsDialogOpen}>
        <DialogContent size="medium">
          <Form_Shadcn_ {...jsForm}>
            <form
              id="builder-js-form"
              onSubmit={jsForm.handleSubmit(handleSubmitJs)}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitleText>{activeJs ? 'Edit JS function' : 'New JS function'}</DialogTitleText>
                <DialogDescription>Author reusable client-side helpers.</DialogDescription>
              </DialogHeader>
              <DialogSectionSeparator />
              <DialogSection className="space-y-4">
                <FormField_Shadcn_
                  name="name"
                  control={jsForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_>Name</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="openOrder" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  name="code"
                  control={jsForm.control}
                  rules={{ required: 'Code is required' }}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_>Code</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Textarea
                          {...field}
                          className="min-h-[160px] font-mono text-xs"
                          placeholder="export function main() {}"
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </DialogSection>
              <DialogFooter>
                {activeJs && (
                  <Button
                    type="danger"
                    icon={<Trash2 size={14} />}
                    onClick={() => setDeleteJsTarget(activeJs)}
                    disabled={deleteJsMutation.isPending}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  type="default"
                  onClick={() => setIsJsDialogOpen(false)}
                  disabled={createJsMutation.isPending || updateJsMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createJsMutation.isPending || updateJsMutation.isPending}
                >
                  {activeJs ? 'Save function' : 'Create function'}
                </Button>
              </DialogFooter>
            </form>
          </Form_Shadcn_>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteQueryTarget)}
        onOpenChange={(open) => !open && setDeleteQueryTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete query</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteQueryTarget
                ? `Delete "${deleteQueryTarget.name}"? This cannot be undone.`
                : 'Delete this query? This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteQueryMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={handleDeleteQueryConfirm}
              disabled={deleteQueryMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteJsTarget)}
        onOpenChange={(open) => !open && setDeleteJsTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete JS function</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteJsTarget
                ? `Delete "${deleteJsTarget.name}"? This cannot be undone.`
                : 'Delete this function? This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteJsMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={handleDeleteJsConfirm}
              disabled={deleteJsMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
