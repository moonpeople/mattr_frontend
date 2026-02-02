import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import { useIotApiKeysQuery } from 'data/iot/api-keys'
import {
  useIotSavedQueriesQuery,
  useIotSavedQueryUpdateMutation,
} from 'data/iot/saved-queries'
import type { IotSavedQuery } from 'data/iot/types'
import { getIotApiBaseUrl } from 'lib/iot'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  Tabs_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const normalizeAttributes = (attributes?: string[] | null) =>
  (attributes ?? []).filter((value) => value && value.trim().length > 0)

const SavedQueryPage: NextPageWithLayout = () => {
  const { ref, id } = useParams()
  const queryId = Number(id)

  const { data: queries = [], isPending } = useIotSavedQueriesQuery()
  const { data: apiKeys = [] } = useIotApiKeysQuery()
  const { mutateAsync: updateQuery, isPending: isSaving } = useIotSavedQueryUpdateMutation()

  const query = useMemo(
    () => queries.find((item) => item.id === queryId),
    [queries, queryId]
  )

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sqlText, setSqlText] = useState('')
  const [exposed, setExposed] = useState(false)
  const [apiKeyIds, setApiKeyIds] = useState<number[]>([])
  const [params, setParams] = useState<
    { name: string; type: 'string' | 'number' | 'datetime' | 'date' | 'time'; mode: 'single' | 'array' }[]
  >([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!query) return
    setName(query.name ?? '')
    setDescription(query.description ?? '')
    setSqlText(query.sql_text ?? '')
    setExposed(!!query.exposed_as_api)
    setApiKeyIds(query.api_key_ids ?? [])
    setParams(
      (query.params as any) ??
        (query.attributes as any) ??
        [
          { name: 'device_id', type: 'string', mode: 'single' },
          { name: 'data_type_key', type: 'string', mode: 'single' },
        ]
    )
  }, [query])

  const executionUrl = useMemo(() => {
    const base = getIotApiBaseUrl()
    const path = `/telemetry/saved-queries/${queryId}/run`
    return base ? `${base}${path}` : path
  }, [queryId])

  const toggleApiKey = (apiKeyId: number) => {
    setApiKeyIds((prev) =>
      prev.includes(apiKeyId) ? prev.filter((id) => id !== apiKeyId) : [...prev, apiKeyId]
    )
  }

  const addParam = () =>
    setParams((prev) => [...prev, { name: '', type: 'string', mode: 'single' }])
  const updateParam = (
    index: number,
    patch: Partial<{ name: string; type: 'string' | 'number' | 'datetime' | 'date' | 'time'; mode: 'single' | 'array' }>
  ) => {
    setParams((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    )
  }
  const removeParam = (index: number) => {
    setParams((prev) => prev.filter((_, idx) => idx !== index))
    if (editingIndex === index) setEditingIndex(null)
  }

  const onSave = async () => {
    if (!query) return
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }
    if (!sqlText.trim()) {
      toast.error('SQL is required.')
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      sql_text: sqlText.trim(),
      datasource: query.datasource ?? 'clickhouse',
      exposed_as_api: exposed,
      api_key_ids: apiKeyIds,
      params: normalizeAttributes(params.map((p) => p.name)).map((name) => {
        const found = params.find((p) => p.name === name) || { type: 'string', mode: 'single' }
        return {
          name,
          type: found.type,
          mode: found.mode,
        }
      }),
    }

    try {
      await updateQuery({ queryId: query.id, payload })
      toast.success('Saved query updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update query.')
    }
  }

  if (isPending) {
    return (
      <PageContainer size="large">
        <PageHeader size="large">
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>Saved Query</PageHeaderTitle>
            </PageHeaderSummary>
          </PageHeaderMeta>
        </PageHeader>
        <PageSection>
          <PageSectionContent>Loading saved query...</PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  if (!query) {
    return (
      <PageContainer size="large">
        <PageHeader size="large">
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>Saved Query</PageHeaderTitle>
            </PageHeaderSummary>
          </PageHeaderMeta>
        </PageHeader>
        <PageSection>
          <PageSectionContent>Saved query not found.</PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{query.name}</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
        <div className="ml-auto flex items-center gap-2">
          <Button type="primary" onClick={onSave} disabled={isSaving}>
            Save
          </Button>
        </div>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <Tabs_Shadcn_ defaultValue="general">
              <TabsList_Shadcn_ className="gap-2">
                <TabsTrigger_Shadcn_ value="general">General</TabsTrigger_Shadcn_>
                <TabsTrigger_Shadcn_ value="params">Parameters</TabsTrigger_Shadcn_>
                <TabsTrigger_Shadcn_ value="sql">SQL</TabsTrigger_Shadcn_>
              </TabsList_Shadcn_>
              <TabsContent_Shadcn_ value="general" className="space-y-6">
                <Input
                  id="saved-query-name"
                  label="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <Input.TextArea
                  id="saved-query-description"
                  label="Description"
                  value={description}
                  onChange={(event: any) => setDescription(event.target.value)}
                  className="min-h-[120px]"
                />
                <Input
                  id="saved-query-url"
                  label="Execution URL"
                  value={executionUrl}
                  readOnly
                />
                <Checkbox
                  name="saved-query-exposed"
                  label="Expose via API key"
                  description="Allow running this query using an API key."
                  checked={exposed}
                  onChange={(event) => setExposed(event.target.checked)}
                />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Allowed API keys</div>
                  {apiKeys.length === 0 ? (
                    <div className="text-sm text-foreground-light">No API keys found.</div>
                  ) : (
                    <div className="space-y-2">
                      {apiKeys.map((apiKey) => (
                        <Checkbox
                          key={apiKey.id}
                          label={apiKey.name}
                          checked={apiKeyIds.includes(apiKey.id)}
                          onChange={() => toggleApiKey(apiKey.id)}
                        />
                      ))}
                      {apiKeyIds.length === 0 && (
                        <div className="text-xs text-foreground-light">
                          No keys selected — query is доступен для всех ключей.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_ value="params" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground-light">
                    Parameters define which keys are allowed in the API request body.
                  </div>
                  <Button
                    type="default"
                    size="tiny"
                    onClick={() => {
                      addParam()
                      setEditingIndex(params.length)
                    }}
                  >
                    Add parameter
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Name</TableHead>
                      <TableHead className="w-1/4">Type</TableHead>
                      <TableHead className="w-1/5">Mode</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {params.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-foreground-light">
                          No parameters defined yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      params.map((param, index) => {
                        const isDefault = ['device_id', 'data_type_key'].includes(param.name)
                        const isEditing = editingIndex === index
                        return (
                          <TableRow key={`param-${index}`}>
                            {isEditing ? (
                              <>
                                <TableCell>
                                  <Input
                                    value={param.name}
                                    disabled={isDefault}
                                    onChange={(event) =>
                                      updateParam(index, { name: event.target.value })
                                    }
                                    placeholder="Parameter name"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={param.type}
                                    onValueChange={(value) =>
                                      updateParam(index, {
                                        type: value as
                                          | 'string'
                                          | 'number'
                                          | 'datetime'
                                          | 'date'
                                          | 'time',
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="string">String</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="datetime">Datetime</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                      <SelectItem value="time">Time</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Checkbox
                                    label="Array"
                                    checked={param.mode === 'array'}
                                    onChange={(e) =>
                                      updateParam(index, {
                                        mode: e.target.checked ? 'array' : 'single',
                                      })
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button
                                    type="default"
                                    size="tiny"
                                    onClick={() => setEditingIndex(null)}
                                  >
                                    Done
                                  </Button>
                                  <Button
                                    type="danger"
                                    size="tiny"
                                    disabled={isDefault}
                                    onClick={() => removeParam(index)}
                                  >
                                    Remove
                                  </Button>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell className="font-medium">{param.name}</TableCell>
                                <TableCell className="text-sm text-foreground-light">
                                  {param.type}
                                </TableCell>
                                <TableCell className="text-sm text-foreground-light">
                                  {param.mode === 'array' ? 'Array' : 'Single'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="default"
                                        size="tiny"
                                        className="px-1"
                                        icon={<MoreVertical className="h-4 w-4" />}
                                      />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="bottom" align="end" className="w-32">
                                      <DropdownMenuItem
                                        icon={<Pencil className="h-4 w-4" />}
                                        onClick={() => setEditingIndex(index)}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        icon={<Trash2 className="h-4 w-4" />}
                                        disabled={isDefault}
                                        onClick={() => removeParam(index)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_ value="sql" className="space-y-4">
                <Input.TextArea
                  id="saved-query-sql"
                  label="SQL"
                  value={sqlText}
                  onChange={(event: any) => setSqlText(event.target.value)}
                  textAreaClassName="font-mono text-sm"
                  className="min-h-[320px]"
                />
              </TabsContent_Shadcn_>
            </Tabs_Shadcn_>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

SavedQueryPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default SavedQueryPage
