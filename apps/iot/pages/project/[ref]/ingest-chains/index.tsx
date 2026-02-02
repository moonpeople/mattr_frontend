import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import {
  useIotIngestChainCreateMutation,
  useIotIngestChainMetadataMutation,
  useIotIngestChainsQuery,
  useIotIngestChainTemplatesQuery,
} from 'data/iot/ingest-chains'
import {
  useIotDeviceModelUpdateMutation,
  useIotDeviceModelsQuery,
} from 'data/iot/device-models'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import { useRouter } from 'next/router'
import { Search } from 'lucide-react'
import {
  Button,
  Input,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextArea_Shadcn_,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import type { IotDeviceModel, IotRuleChainTemplate } from 'data/iot/types'

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '--')

const PAGE_SIZE = 50

const IngestChainsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [modelId, setModelId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const {
    data: ingestChains = [],
    isPending,
    isError,
    error,
  } = useIotIngestChainsQuery()
  const { data: deviceModels = [] } = useIotDeviceModelsQuery()
  const { data: ingestTemplates = [] } = useIotIngestChainTemplatesQuery()

  const { mutateAsync: createIngestChain, isPending: isCreating } =
    useIotIngestChainCreateMutation()
  const { mutateAsync: updateModel } = useIotDeviceModelUpdateMutation()
  const { mutateAsync: saveMetadata, isPending: isSavingMetadata } =
    useIotIngestChainMetadataMutation()

  const filteredTemplates = ingestTemplates
  const selectedTemplate =
    templateId && filteredTemplates.length > 0
      ? filteredTemplates.find((template) => template.id === templateId) ?? null
      : null

  const onDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setTemplateId('')
      setName('')
      setDescription('')
      setModelId('')
    }
  }

  const onTemplateChange = (value: string) => {
    setTemplateId(value)
    if (value === 'blank') {
      setName('')
      setDescription('')
      return
    }
    const template = ingestTemplates.find((entry) => entry.id === value)
    if (!template) return
    setName(template.name ?? '')
    setDescription(template.description ?? '')
  }

  const persistTemplateTestState = async (
    model: IotDeviceModel,
    template: IotRuleChainTemplate,
    protocol: string
  ) => {
    if (!template.test?.protocol) return
    const testProtocol = protocol
    const messages = template.test.messages ?? []
    if (messages.length === 0) return

    const formattedMessages = messages.map((message, index) => ({
      id: `msg_${Math.random().toString(36).slice(2, 10)}`,
      name: message.name ?? `Message ${index + 1}`,
      headersText: JSON.stringify(message.headers ?? {}, null, 2),
      bodyText: JSON.stringify(message.body ?? {}, null, 2),
      messageType: message.message_type ?? '',
    }))
    const payload = {
      messages: formattedMessages,
      selectedId: formattedMessages[0]?.id ?? '',
    }

    const profileConfig = (model.profile_config as Record<string, any>) ?? {}
    const existingTestMessages =
      typeof profileConfig.test_messages === 'object' && profileConfig.test_messages
        ? profileConfig.test_messages
        : {}

    const nextProfileConfig = {
      ...profileConfig,
      test_messages: {
        ...(existingTestMessages as Record<string, unknown>),
        [testProtocol]: payload,
      },
    }

    await updateModel({
      modelId: model.id,
      payload: {
        profile_config: nextProfileConfig,
      },
    })
  }

  const onSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }
    if (!modelId) {
      toast.error('Model is required.')
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      model_id: Number(modelId),
    }

    try {
      const created = await createIngestChain({ payload })
      if (selectedTemplate?.metadata?.metadata) {
        await saveMetadata({
          ingestChainId: created.id,
          payload: {
            version: selectedTemplate.metadata.version ?? 1,
            metadata: selectedTemplate.metadata.metadata ?? {},
          },
        })
      }
      if (selectedTemplate) {
        const selectedModel = deviceModels.find((model) => model.id === Number(modelId))
        const protocol = selectedModel?.transport_type ?? 'http'
        if (selectedModel) {
          try {
            await persistTemplateTestState(selectedModel, selectedTemplate, protocol)
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : 'Failed to save test messages to model.'
            )
          }
        }
      }
      onDialogChange(false)
      if (ref) {
        await router.push(`/project/${ref}/device-models/${modelId}/ingest-chains/${created.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save ingest chain.')
    }
  }

  const isSaving = isCreating || isSavingMetadata
  const canSubmit = name.trim().length > 0 && !!modelId && !isSaving

  const filteredChains = useMemo(() => {
    const query = search.trim().toLowerCase()

    return ingestChains.filter((chain) => {
      if (query) {
        const nameMatch = (chain.name ?? '').toLowerCase().includes(query)
        const descriptionMatch = (chain.description ?? '').toLowerCase().includes(query)
        if (!nameMatch && !descriptionMatch) return false
      }

      return true
    })
  }, [ingestChains, search])

  const modelNameById = useMemo(() => {
    return new Map(deviceModels.map((model) => [model.id, model.name]))
  }, [deviceModels])

  const pageCount = Math.max(1, Math.ceil(filteredChains.length / PAGE_SIZE))
  const pagedChains = useMemo(() => {
    const offset = (page - 1) * PAGE_SIZE
    return filteredChains.slice(offset, offset + PAGE_SIZE)
  }, [filteredChains, page])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [pageCount, page])

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Ingest Rules</PageHeaderTitle>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Button size="tiny" type="primary" onClick={() => setDialogOpen(true)}>
              New ingest rule
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                  <Input
                    placeholder="Search ingest rules"
                    size="tiny"
                    icon={<Search />}
                    value={search}
                    className="w-full lg:w-56"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="flex items-center gap-x-2">
                  <Button
                    size="tiny"
                    type="default"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-foreground-light">
                    Page {page} of {pageCount}
                  </span>
                  <Button
                    size="tiny"
                    type="default"
                    disabled={page >= pageCount}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
              {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-foreground-light">
                        Loading ingest rules...
                      </TableCell>
                    </TableRow>
                  ) : filteredChains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-foreground-light">
                        No ingest rules found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedChains.map((chain) => {
                      const modelName =
                        chain.model_id != null ? modelNameById.get(chain.model_id) : null
                      const modelLabel = modelName ?? '--'
                      const modelId = chain.model_id
                      const targetUrl =
                        ref && modelId
                          ? `/project/${ref}/device-models/${modelId}/ingest-chains/${chain.id}`
                          : `/project/${ref}/ingest-chains/${chain.id}`

                      return (
                        <TableRow
                          key={chain.id}
                          className="cursor-pointer"
                          onClick={() => router.push(targetUrl)}
                        >
                          <TableCell>{chain.name}</TableCell>
                          <TableCell>{modelLabel}</TableCell>
                          <TableCell>{formatDate(chain.inserted_at)}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <SidePanel
        size="large"
        visible={dialogOpen}
        header="New ingest rule"
        onCancel={() => onDialogChange(false)}
        customFooter={
          <div className="flex w-full items-center justify-end gap-2 border-t border-default px-4 py-4">
            <Button type="default" onClick={() => onDialogChange(false)}>
              Cancel
            </Button>
            <Button type="primary" onClick={onSave} disabled={!canSubmit}>
              Save
            </Button>
          </div>
        }
      >
        <SidePanel.Content className="space-y-6 py-6">
          <div className="space-y-4 px-4">
            <div className="space-y-1">
              <p className="text-xs text-foreground-light">Model</p>
              <Select_Shadcn_ value={modelId} onValueChange={setModelId}>
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ placeholder="Select model" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {deviceModels.length === 0 ? (
                    <SelectItem_Shadcn_ value="no-models" className="text-xs" disabled>
                      No models available
                    </SelectItem_Shadcn_>
                  ) : (
                    deviceModels.map((model) => (
                      <SelectItem_Shadcn_
                        key={model.id}
                        value={String(model.id)}
                        className="text-xs"
                      >
                        {model.name}
                      </SelectItem_Shadcn_>
                    ))
                  )}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <Input_Shadcn_
              id="ingest-chain-name"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="space-y-1">
              <p className="text-xs text-foreground-light">Template</p>
              <Select_Shadcn_ value={templateId} onValueChange={onTemplateChange}>
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ placeholder="Select template" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="blank" className="text-xs">
                    Blank (default)
                  </SelectItem_Shadcn_>
                  {filteredTemplates.length === 0 ? (
                    <SelectItem_Shadcn_ value="no-templates" className="text-xs" disabled>
                      No templates
                    </SelectItem_Shadcn_>
                  ) : (
                    filteredTemplates.map((template) => (
                      <SelectItem_Shadcn_
                        key={template.id}
                        value={template.id}
                        className="text-xs"
                      >
                        {template.name}
                      </SelectItem_Shadcn_>
                    ))
                  )}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <TextArea_Shadcn_
              id="ingest-chain-description"
              placeholder="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </SidePanel.Content>
      </SidePanel>
    </>
  )
}

IngestChainsPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default IngestChainsPage
