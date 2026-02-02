import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/router'

import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import { ReportsSelectFilter, type SelectFilters } from 'components/interfaces/Reports/v2/ReportsSelectFilter'
import { useParams } from 'common'
import {
  useIotDeviceCreateMutation,
  useIotDeviceUpdateMutation,
  type IotDevicePayload,
} from 'data/iot/devices'
import {
  useIotDeviceModelUpdateMutation,
  useIotDeviceModelsQuery,
} from 'data/iot/device-models'
import {
  useIotObservabilityUnknownDevicesQuery,
  useIotUnknownDeviceDeleteMutation,
} from 'data/iot/observability'
import type { IotUnknownDevice } from 'data/iot/observability'
import { useIotIngestChainCreateMutation } from 'data/iot/ingest-chains'
import { getIotApiBaseUrl } from 'lib/iot'
import { Search } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Card,
  Input,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader, PageHeaderTitle } from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { ManageDeviceDialog } from 'components/interfaces/Iot/Devices/ManageDeviceDialog'

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '--')
const formatJsonPretty = (value?: Record<string, unknown> | null) =>
  value ? JSON.stringify(value, null, 2) : '--'
const UNKNOWN_PAGE_SIZE = 50
type TestProtocol = 'http' | 'mqtt' | 'coap' | 'lwm2m' | 'snmp'

const UnknownDevicesPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef = 'default' } = useParams()
  const [unknownPage, setUnknownPage] = useState(1)
  const unknownOffset = (unknownPage - 1) * UNKNOWN_PAGE_SIZE
  const unknownDevicesQuery = useIotObservabilityUnknownDevicesQuery({
    limit: UNKNOWN_PAGE_SIZE,
    offset: unknownOffset,
  })

  const { data: unknownDevices = [], isError: isUnknownError, error: unknownError } =
    unknownDevicesQuery
  const { refetch: refetchUnknownDevices } = unknownDevicesQuery

  const [unknownSearch, setUnknownSearch] = useState('')
  const [unknownProtocolFilters, setUnknownProtocolFilters] = useState<SelectFilters>([])
  const [selectedUnknownDevice, setSelectedUnknownDevice] = useState<IotUnknownDevice | null>(null)
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [initialDevicePayload, setInitialDevicePayload] =
    useState<Partial<IotDevicePayload> | null>(null)
  const [pendingUnknownDeviceKey, setPendingUnknownDeviceKey] = useState<string | null>(null)
  const { mutateAsync: createIngestChain, isPending: isCreatingRuleChain } =
    useIotIngestChainCreateMutation()
  const { mutateAsync: createDevice, isPending: isCreatingDevice } =
    useIotDeviceCreateMutation()
  const { mutateAsync: updateDevice } = useIotDeviceUpdateMutation()
  const { mutateAsync: updateModel } = useIotDeviceModelUpdateMutation()
  const { mutateAsync: deleteUnknownDevice } = useIotUnknownDeviceDeleteMutation()
  const { data: models = [] } = useIotDeviceModelsQuery()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const baseUrl = getIotApiBaseUrl()
    if (!baseUrl) return
    const source = new EventSource(`${baseUrl}/observability/stream`)
    const handleTick = () => {
      void refetchUnknownDevices()
    }
    source.addEventListener('tick', handleTick)
    source.onmessage = handleTick

    return () => {
      source.close()
    }
  }, [refetchUnknownDevices])

  const protocolOptions = useMemo(() => {
    const values = new Set<string>()
    unknownDevices.forEach((item) => {
      if (item.protocol) values.add(item.protocol)
    })
    return Array.from(values)
      .sort()
      .map((protocol) => ({ label: protocol, value: protocol }))
  }, [unknownDevices])

  useEffect(() => {
    setUnknownPage(1)
  }, [unknownProtocolFilters, unknownSearch])

  const filteredUnknownDevices = useMemo(() => {
    const query = unknownSearch.trim().toLowerCase()

    return unknownDevices.filter((item) => {
      if (unknownProtocolFilters.length > 0 && !unknownProtocolFilters.includes(item.protocol || '')) {
        return false
      }

      if (!query) return true

      const haystack = [
        item.lookup_key,
        item.device_id,
        item.device_id_raw,
        item.serial_number,
        item.protocol,
        item.last_error,
        item.last_message_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [unknownDevices, unknownProtocolFilters, unknownSearch])

  const canGoPrev = unknownPage > 1
  const canGoNext = unknownDevices.length === UNKNOWN_PAGE_SIZE
  const canCreateDevice = models.length > 0
  const actionDeviceLabel =
    selectedUnknownDevice?.serial_number ||
    selectedUnknownDevice?.lookup_key ||
    selectedUnknownDevice?.device_id_raw ||
    'Unknown device'

  const normalizeProtocol = (value?: string | null): TestProtocol => {
    const normalized = value?.toLowerCase().trim()
    if (normalized === 'mqtt') return 'mqtt'
    if (normalized === 'coap') return 'coap'
    if (normalized === 'lwm2m') return 'lwm2m'
    if (normalized === 'snmp') return 'snmp'
    return 'http'
  }

  const buildTestBody = (device: IotUnknownDevice) => {
    if (device.last_payload && typeof device.last_payload === 'object') {
      return device.last_payload
    }
    if (device.last_raw_payload) {
      try {
        const parsed = JSON.parse(device.last_raw_payload)
        if (parsed && typeof parsed === 'object') return parsed
      } catch {
        return { raw: device.last_raw_payload }
      }
    }
    return {}
  }

  const handleCreateRuleChain = async () => {
    if (!selectedUnknownDevice) return
    if (!selectedUnknownDevice.model_id) {
      toast.error('Select a device model before creating an ingest rule.')
      return
    }
    const model = models.find((entry) => entry.id === selectedUnknownDevice.model_id)
    if (!model) {
      toast.error('Device model not found.')
      return
    }
    const protocol = normalizeProtocol(model.transport_type)
    const label = actionDeviceLabel
    const payload = {
      name: `Unknown device: ${label}`,
      description: `Generated from unknown device payload (${label}).`,
      model_id: model.id,
    }

    try {
      const created = await createIngestChain({ payload })
      const messageId = `msg_${Math.random().toString(36).slice(2, 10)}`
      const headers = selectedUnknownDevice.last_headers ?? {}
      const body = buildTestBody(selectedUnknownDevice)
      const messagesPayload = {
        messages: [
          {
            id: messageId,
            name: label,
            headersText: JSON.stringify(headers, null, 2),
            bodyText: JSON.stringify(body, null, 2),
            messageType: selectedUnknownDevice.last_message_type ?? '',
          },
        ],
        selectedId: messageId,
      }
      try {
        const profileConfig = (model.profile_config as Record<string, any>) ?? {}
        const existingTestMessages =
          typeof profileConfig.test_messages === 'object' && profileConfig.test_messages
            ? profileConfig.test_messages
            : {}
        const nextProfileConfig = {
          ...profileConfig,
          test_messages: {
            ...(existingTestMessages as Record<string, unknown>),
            [protocol]: messagesPayload,
          },
        }
        await updateModel({
          modelId: model.id,
          payload: {
            profile_config: nextProfileConfig,
          },
        })
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to save test messages to model.'
        )
      }
      await router.push(
        `/project/${projectRef}/device-models/${model.id}/ingest-chains/${created.id}`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ingest rule.')
    }
  }

  const handleCreateDevice = () => {
    if (!selectedUnknownDevice) return
    const serial =
      selectedUnknownDevice.serial_number ||
      selectedUnknownDevice.lookup_key ||
      selectedUnknownDevice.device_id_raw ||
      ''
    if (!serial) {
      toast.error('Device key or serial number is required to create a device.')
      return
    }
    const payload = {
      name: serial,
      serial_number: serial,
      ...(selectedUnknownDevice.model_id ? { model_id: selectedUnknownDevice.model_id } : {}),
    }
    setPendingUnknownDeviceKey(selectedUnknownDevice.lookup_key ?? null)
    setInitialDevicePayload(payload)
    setDeviceDialogOpen(true)
    setSelectedUnknownDevice(null)
  }

  const handleDeviceDialogChange = (open: boolean) => {
    setDeviceDialogOpen(open)
    if (!open) {
      setInitialDevicePayload(null)
      setPendingUnknownDeviceKey(null)
    }
  }

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>Unknown devices</PageHeaderTitle>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                <Input
                  placeholder="Search unknown devices"
                  size="tiny"
                  icon={<Search />}
                  value={unknownSearch}
                  className="w-full lg:w-56"
                  onChange={(event) => setUnknownSearch(event.target.value)}
                />
                <ReportsSelectFilter
                  label="Protocol"
                  options={protocolOptions}
                  value={unknownProtocolFilters}
                  onChange={setUnknownProtocolFilters}
                  showSearch
                />
              </div>
              <div className="flex items-center gap-x-2">
                <Button
                  size="tiny"
                  type="default"
                  disabled={!canGoPrev}
                  onClick={() => setUnknownPage((page) => Math.max(1, page - 1))}
                >
                  Prev
                </Button>
                <span className="text-xs text-foreground-light">Page {unknownPage}</span>
                <Button
                  size="tiny"
                  type="default"
                  disabled={!canGoNext}
                  onClick={() => setUnknownPage((page) => page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
            {isUnknownError && (
              <p className="text-sm text-destructive-600">{unknownError?.message}</p>
            )}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Last seen</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Seen</TableHead>
                    <TableHead>Key · Device · Serial</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnknownDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-foreground-light">
                        No unknown devices recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnknownDevices.map((item: IotUnknownDevice, index: number) => (
                      <TableRow
                        key={`${item.lookup_key}-${index}`}
                        className="cursor-pointer"
                        onClick={() => setSelectedUnknownDevice(item)}
                      >
                        <TableCell>{formatDate(item.last_seen_at)}</TableCell>
                        <TableCell>{item.protocol ?? '--'}</TableCell>
                        <TableCell>{item.seen_count ?? 0}</TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{item.lookup_key ?? '--'}</div>
                          <div className="text-foreground-light">
                            {item.device_id ?? item.device_id_raw ?? '--'}
                          </div>
                          <div className="text-foreground-light">{item.serial_number ?? '--'}</div>
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate">
                          {item.last_error ?? '--'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </PageSectionContent>
      </PageSection>
      <SidePanel
        size="large"
        visible={!!selectedUnknownDevice}
        header="Unknown device"
        onCancel={() => setSelectedUnknownDevice(null)}
        customFooter={
          <div className="flex w-full items-center justify-end gap-2 border-t border-default px-4 py-4">
            <Button type="default" onClick={() => setSelectedUnknownDevice(null)}>
              Close
            </Button>
          </div>
        }
      >
        <SidePanel.Content className="space-y-6 py-6">
          <div className="flex flex-wrap items-center gap-2 px-4">
            <Button
              type="default"
              onClick={handleCreateRuleChain}
              disabled={!selectedUnknownDevice || isCreatingRuleChain}
              loading={isCreatingRuleChain}
            >
              Create rule chain
            </Button>
            <Button
              type="primary"
              onClick={handleCreateDevice}
              disabled={!selectedUnknownDevice || !canCreateDevice}
            >
              Create device
            </Button>
            {!canCreateDevice ? (
              <p className="text-xs text-foreground-light">
                Create a device model before adding devices.
              </p>
            ) : null}
          </div>
          <div className="space-y-3 px-4">
            <p className="text-xs uppercase tracking-wide text-foreground-lighter">Identity</p>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-foreground-light">Lookup key</p>
                <p className="font-medium">{selectedUnknownDevice?.lookup_key ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Device ID</p>
                <p className="font-medium">
                  {selectedUnknownDevice?.device_id ?? selectedUnknownDevice?.device_id_raw ?? '--'}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Serial number</p>
                <p className="font-medium">{selectedUnknownDevice?.serial_number ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Device key ID</p>
                <p className="font-medium">{selectedUnknownDevice?.device_key_id ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Model ID</p>
                <p className="font-medium">{selectedUnknownDevice?.model_id ?? '--'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-4">
            <p className="text-xs uppercase tracking-wide text-foreground-lighter">Timing</p>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-foreground-light">First seen</p>
                <p className="font-medium">{formatDate(selectedUnknownDevice?.first_seen_at)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Last seen</p>
                <p className="font-medium">{formatDate(selectedUnknownDevice?.last_seen_at)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Seen count</p>
                <p className="font-medium">{selectedUnknownDevice?.seen_count ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-4">
            <p className="text-xs uppercase tracking-wide text-foreground-lighter">Source</p>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-foreground-light">Protocol</p>
                <p className="font-medium">{selectedUnknownDevice?.protocol ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Adapter</p>
                <p className="font-medium">{selectedUnknownDevice?.adapter ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Message type</p>
                <p className="font-medium">{selectedUnknownDevice?.last_message_type ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-light">Source IP</p>
                <p className="font-medium">{selectedUnknownDevice?.last_source_ip ?? '--'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-4">
            <p className="text-xs uppercase tracking-wide text-foreground-lighter">Headers</p>
            <pre className="max-h-48 overflow-auto rounded border border-muted bg-surface-100 px-3 py-2 text-xs text-foreground-light">
              {formatJsonPretty(selectedUnknownDevice?.last_headers ?? null)}
            </pre>
          </div>

          <div className="space-y-3 px-4">
            <p className="text-xs uppercase tracking-wide text-foreground-lighter">Payload</p>
            <pre className="max-h-64 overflow-auto rounded border border-muted bg-surface-100 px-3 py-2 text-xs text-foreground-light">
              {formatJsonPretty(selectedUnknownDevice?.last_payload ?? null)}
            </pre>
            {selectedUnknownDevice?.last_raw_payload ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-foreground-lighter">Raw</p>
                <pre className="max-h-48 overflow-auto rounded border border-muted bg-surface-100 px-3 py-2 text-xs text-foreground-light">
                  {selectedUnknownDevice.last_raw_payload}
                </pre>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 px-4">
            <p className="text-xs uppercase tracking-wide text-foreground-lighter">Last error</p>
            <p className="text-sm text-foreground-light">
              {selectedUnknownDevice?.last_error ?? '--'}
            </p>
          </div>
        </SidePanel.Content>
      </SidePanel>
      <ManageDeviceDialog
        models={models}
        open={deviceDialogOpen}
        device={null}
        initialPayload={initialDevicePayload ?? undefined}
        onOpenChange={handleDeviceDialogChange}
        onCreate={async ({ payload }) => {
          const device = await createDevice({ payload })
          if (pendingUnknownDeviceKey) {
            try {
              await deleteUnknownDevice({ lookupKey: pendingUnknownDeviceKey })
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Failed to remove unknown device record.'
              )
            }
            setPendingUnknownDeviceKey(null)
          }
          await router.push(`/project/${projectRef}/devices/${device.id}`)
          return device
        }}
        onUpdate={updateDevice}
        isSaving={isCreatingDevice}
      />
    </PageContainer>
  )
}

UnknownDevicesPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default UnknownDevicesPage
