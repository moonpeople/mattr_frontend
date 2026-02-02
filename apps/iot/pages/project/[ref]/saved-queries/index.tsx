import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import {
  useIotSavedQueriesQuery,
  useIotSavedQueryCreateMutation,
  useIotSavedQueryDeleteMutation,
  useIotSavedQueryRunMutation,
} from 'data/iot/saved-queries'
import type { IotSavedQuery } from 'data/iot/types'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader, PageHeaderDescription, PageHeaderTitle } from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '--')

const SavedQueriesPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [runOpen, setRunOpen] = useState(false)
  const [activeQuery, setActiveQuery] = useState<IotSavedQuery | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sqlText, setSqlText] = useState('')
  const [exposed, setExposed] = useState(false)
  const defaultParams = [
    { name: 'device_id', type: 'string', mode: 'single' },
    { name: 'data_type_key', type: 'string', mode: 'single' },
  ]
  const [paramsText, setParamsText] = useState('{}')
  const [runResult, setRunResult] = useState<any[] | null>(null)
  const [apiKey, setApiKey] = useLocalStorage<string>(`iot-saved-queries-key-${ref}`, '')

  const {
    data: queries = [],
    isPending,
    isError,
    error,
  } = useIotSavedQueriesQuery()
  const { mutateAsync: createQuery, isPending: isCreating } = useIotSavedQueryCreateMutation()
  const { mutateAsync: deleteQuery, isPending: isDeleting } = useIotSavedQueryDeleteMutation()
  const { mutateAsync: runQuery, isPending: isRunning } = useIotSavedQueryRunMutation()

  const resetForm = () => {
    setName('')
    setDescription('')
    setSqlText('')
    setExposed(false)
  }

  const onDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) resetForm()
  }

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      sql_text: sqlText.trim() || 'SELECT 1',
      datasource: 'clickhouse',
      exposed_as_api: exposed,
      params: defaultParams,
    }

    try {
      const created = await createQuery({ payload })
      onDialogChange(false)
      if (created?.id) {
        router.push(`/project/${ref}/saved-queries/${created.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create query.')
    }
  }

  const onDelete = async (query: IotSavedQuery) => {
    if (!confirm(`Delete saved query "${query.name}"?`)) return
    try {
      await deleteQuery({ queryId: query.id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete query.')
    }
  }

  const onRunDialog = (query: IotSavedQuery) => {
    setActiveQuery(query)
    setParamsText('{}')
    setRunResult(null)
    setRunOpen(true)
  }

  const onRun = async () => {
    if (!activeQuery) return
    if (!apiKey.trim()) {
      toast.error('API key is required to run this query.')
      return
    }

    let params: Record<string, unknown> | string | null = null
    if (paramsText.trim() !== '') {
      try {
        params = JSON.parse(paramsText)
      } catch (err) {
        toast.error('Params must be valid JSON.')
        return
      }
    }

    try {
      const data = await runQuery({ queryId: activeQuery.id, apiKey, params })
      setRunResult(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to run query.')
    }
  }

  const canSubmit = name.trim().length > 0 && !isCreating
  const canRun = !!activeQuery?.exposed_as_api

  const preview = useMemo(() => {
    if (!runResult) return ''
    try {
      return JSON.stringify(runResult, null, 2)
    } catch (_err) {
      return String(runResult)
    }
  }, [runResult])

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>Saved Queries</PageHeaderTitle>
        <PageHeaderDescription>
          Store ClickHouse queries and expose them via API keys.
        </PageHeaderDescription>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Saved queries</CardTitle>
              <Button size="tiny" type="primary" onClick={() => setDialogOpen(true)}>
                New query
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Exposed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-foreground-light">
                        Loading saved queries...
                      </TableCell>
                    </TableRow>
                  ) : queries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-foreground-light">
                        No saved queries yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    queries.map((query) => (
                      <TableRow
                        key={query.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/project/${ref}/saved-queries/${query.id}`)}
                      >
                        <TableCell className="font-medium">{query.name}</TableCell>
                        <TableCell>{query.exposed_as_api ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{formatDate(query.inserted_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="tiny"
                              type="default"
                              onClick={(event) => {
                                event.stopPropagation()
                                onRunDialog(query)
                              }}
                              disabled={!query.exposed_as_api}
                            >
                              Run
                            </Button>
                            <Button
                              size="tiny"
                              type="danger"
                              onClick={(event) => {
                                event.stopPropagation()
                                onDelete(query)
                              }}
                              disabled={isDeleting}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>

      <SidePanel
        size="large"
        visible={dialogOpen}
        header="New saved query"
        onCancel={() => onDialogChange(false)}
        customFooter={
          <div className="flex w-full items-center justify-end gap-2 border-t border-default px-4 py-4">
            <Button type="default" onClick={() => onDialogChange(false)}>
              Cancel
            </Button>
            <Button type="primary" onClick={onCreate} disabled={!canSubmit}>
              Create
            </Button>
          </div>
        }
      >
        <SidePanel.Content className="space-y-4 py-6">
          <div className="space-y-4 px-4">
            <Input
              id="saved-query-name"
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input.TextArea
              label="Description"
              id="saved-query-description"
              value={description}
              onChange={(event: any) => setDescription(event.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-foreground-light">
              You can configure SQL, attributes, and API access after creation.
            </p>
          </div>
        </SidePanel.Content>
      </SidePanel>

      <Dialog open={runOpen} onOpenChange={setRunOpen}>
        <DialogContent size="large">
          <DialogHeader padding="small">
            <DialogTitle>Run saved query</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection padding="small" className="space-y-4">
            {!canRun && (
              <p className="text-sm text-foreground-light">
                This query is not exposed. Enable “Expose via API key” to run it.
              </p>
            )}
            <Input
              id="saved-query-api-key"
              label="API key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <Input.TextArea
              label="Params (JSON)"
              id="saved-query-params"
              value={paramsText}
              onChange={(event: any) => setParamsText(event.target.value)}
              textAreaClassName="font-mono text-sm"
              className="min-h-[120px]"
            />
            <div className="flex items-center justify-end">
              <Button type="primary" onClick={onRun} disabled={!canRun || isRunning}>
                Run
              </Button>
            </div>
            {runResult && (
              <pre className="rounded-md bg-surface-200 px-4 py-3 text-xs text-foreground">
                {preview}
              </pre>
            )}
          </DialogSection>
          <DialogFooter padding="small">
            <Button type="default" onClick={() => setRunOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

SavedQueriesPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default SavedQueriesPage
