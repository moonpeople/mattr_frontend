import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import {
  useIotApiKeyCreateMutation,
  useIotApiKeyDeleteMutation,
  useIotApiKeysQuery,
} from 'data/iot/api-keys'
import type { IotApiKey } from 'data/iot/types'
import { useState } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader, PageHeaderDescription, PageHeaderTitle } from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '--')

const ApiKeysPage: NextPageWithLayout = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState('telemetry:read')
  const [newKey, setNewKey] = useState<IotApiKey | null>(null)

  const {
    data: keys = [],
    isPending,
    isError,
    error,
  } = useIotApiKeysQuery()
  const { mutateAsync: createKey, isPending: isCreating } = useIotApiKeyCreateMutation()
  const { mutateAsync: deleteKey, isPending: isDeleting } = useIotApiKeyDeleteMutation()

  const resetForm = () => {
    setName('')
    setScopes('telemetry:read')
  }

  const onOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) resetForm()
  }

  const parseScopes = (value: string) =>
    value
      .split(/[,\s]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error('Key name is required.')
      return
    }

    const payload = {
      name: name.trim(),
      scopes: parseScopes(scopes),
    }

    try {
      const created = await createKey({ payload })
      setNewKey(created)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create API key.')
    }
  }

  const onDelete = async (key: IotApiKey) => {
    if (!confirm(`Delete API key "${key.name}"?`)) return
    try {
      await deleteKey({ apiKeyId: key.id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete API key.')
    }
  }

  const canSubmit = name.trim().length > 0 && !isCreating

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>API Keys</PageHeaderTitle>
        <PageHeaderDescription>
          Create keys for telemetry export and secure integration access.
        </PageHeaderDescription>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          {newKey?.token && (
            <Admonition
              type="default"
              title="New API key generated"
              className="mb-4"
              description={
                <div className="space-y-2">
                  <p className="text-sm">
                    Copy this key now. You will not be able to see it again.
                  </p>
                  <Input
                    copy
                    readOnly
                    size="small"
                    className="input-mono"
                    value={newKey.token}
                    onChange={() => {}}
                    onCopy={() => toast.success('API key copied to clipboard')}
                  />
                </div>
              }
            />
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Instance API keys</CardTitle>
            <Button size="tiny" type="primary" onClick={() => setDialogOpen(true)}>
              New key
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last used</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-foreground-light">
                        Loading API keys...
                      </TableCell>
                    </TableRow>
                  ) : keys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-foreground-light">
                        No API keys yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>{key.name}</TableCell>
                        <TableCell>{key.scopes?.length ? key.scopes.join(', ') : '--'}</TableCell>
                        <TableCell>{formatDate(key.inserted_at)}</TableCell>
                        <TableCell>{formatDate(key.last_used_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="tiny"
                            type="danger"
                            onClick={() => onDelete(key)}
                            disabled={isDeleting}
                          >
                            Delete
                          </Button>
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

      <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
        <DialogContent size="small">
          <DialogHeader padding="small">
            <DialogTitle>New API key</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection padding="small" className="space-y-4">
            <Input
              id="api-key-name"
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              id="api-key-scopes"
              label="Scopes"
              value={scopes}
              onChange={(event) => setScopes(event.target.value)}
              descriptionText="Comma or space separated. Example: telemetry:read ingest"
            />
          </DialogSection>
          <DialogFooter padding="small">
            <Button type="default" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="primary" onClick={onCreate} disabled={!canSubmit}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

ApiKeysPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ApiKeysPage
