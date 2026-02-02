import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIotDeviceAlertsQuery } from 'data/iot/alerts'
import { useIotDeviceModelsQuery } from 'data/iot/device-models'
import { useIotDeviceCommandsQuery } from 'data/iot/device-commands'
import { useIotDataTypeKeysQuery } from 'data/iot/data-type-keys'
import { useIotDeviceAttributesQuery } from 'data/iot/device-attributes'
import {
  useIotDeviceCredentialCreateMutation,
  useIotDeviceCredentialsQuery,
  useIotDeviceUpdateMutation,
  useIotDevicesQuery,
} from 'data/iot/devices'
import {
  useIotObservabilityRuleAlarmsQuery,
  useIotObservabilityRuleLogsQuery,
} from 'data/iot/observability'
import {
  useIotGatewayConnectorsQuery,
  useIotGatewayDevicesQuery,
  useIotGatewayLogsQuery,
  useIotGatewayQuery,
} from 'data/iot/gateways'
import {
  useIotTelemetryDeleteMutation,
  useIotTelemetryDeleteStatusQuery,
} from 'data/iot/telemetry'
import type { IotRuleAlarm, IotRuleLog } from 'data/iot/observability'
import type {
  IotDevice,
  IotDeviceAlert,
  IotDeviceCommand,
  IotDeviceCredential,
  IotDataTypeKey,
  IotGatewayConnector,
} from 'data/iot/types'
import { getIotApiBaseUrl } from 'lib/iot'
import {
  Alert,
  Button,
  Card,
  Input,
  SidePanel,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { formatDate } from './device-utils'
import { formatAttributeValue } from './device-models/helpers'
import { DeviceAttributesTab } from './DeviceAttributesTab'
import { DeviceTelemetryCharts } from './DeviceTelemetryCharts'
import { ManageDeviceDialog } from './ManageDeviceDialog'

export const DeviceDetailsPage = () => {
  const { ref: projectRef = 'default', id } = useParams()
  const deviceId = Number(id)

  const { data: devices = [], isPending, isError, error } = useIotDevicesQuery()
  const { data: models = [] } = useIotDeviceModelsQuery()
  const { data: dataTypeKeys = [] } = useIotDataTypeKeysQuery()
  const { mutateAsync: updateDevice, isPending: isUpdatingDevice } = useIotDeviceUpdateMutation()
  const { mutateAsync: createCredential, isPending: isCreatingCredential } =
    useIotDeviceCredentialCreateMutation()

  const [editingDevice, setEditingDevice] = useState<IotDevice | null>(null)
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [credentialKey, setCredentialKey] = useState('')
  const [activeTab, setActiveTab] = useState('telemetry')
  const [commandPanelOpen, setCommandPanelOpen] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState<IotDeviceCommand | null>(null)
  const [deleteDataTypeKeyId, setDeleteDataTypeKeyId] = useState('')
  const [deleteFrom, setDeleteFrom] = useState('')
  const [deleteTo, setDeleteTo] = useState('')
  const [deleteRequestId, setDeleteRequestId] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmPayload, setDeleteConfirmPayload] = useState<{
    dataTypeKeyId: string
    fromIso: string
    toIso: string
  } | null>(null)

  const device = useMemo(
    () => devices.find((item) => item.id === deviceId) ?? null,
    [devices, deviceId]
  )

  const modelMap = useMemo(() => new Map(models.map((model) => [model.id, model])), [models])
  const model = device?.model_id ? modelMap.get(device.model_id) ?? null : null
  const isGateway = device?.is_gateway === true

  const {
    data: credentials = [],
    isPending: isCredentialsPending,
    refetch: refetchCredentials,
  } = useIotDeviceCredentialsQuery(
    { deviceId: device?.id ?? 0, enabled: !!device?.id },
    {}
  )
  const { data: commands = [], isPending: isCommandsPending } = useIotDeviceCommandsQuery(
    device?.id ?? null,
    { limit: 50 }
  )

  const { mutateAsync: deleteTelemetry, isPending: isDeletingTelemetry } =
    useIotTelemetryDeleteMutation()

  const resolvedDeviceId = device?.id ?? 0

  const deleteStatusQuery = useIotTelemetryDeleteStatusQuery(
    {
      deviceId: resolvedDeviceId,
      requestId: deleteRequestId || undefined,
      enabled: resolvedDeviceId > 0 && !!deleteRequestId,
    },
    {
      refetchInterval: (data) => {
        const pending = data?.mutations?.some((item) => Number(item?.is_done ?? 0) === 0)
        return pending ? 5000 : false
      },
    }
  )

  const deviceAlertsQuery = useIotDeviceAlertsQuery(
    {
      deviceId: resolvedDeviceId,
      params: { limit: '20', order: 'desc' },
      enabled: resolvedDeviceId > 0,
    },
    {}
  )
  const ruleLogsQuery = useIotObservabilityRuleLogsQuery({
    limit: 50,
    deviceId: resolvedDeviceId,
    enabled: resolvedDeviceId > 0,
  })
  const ruleAlarmsQuery = useIotObservabilityRuleAlarmsQuery({
    limit: 50,
    deviceId: resolvedDeviceId,
    enabled: resolvedDeviceId > 0,
  })

  const deviceClientAttributesQuery = useIotDeviceAttributesQuery(
    {
      deviceId: resolvedDeviceId,
      scope: 'client',
      enabled: resolvedDeviceId > 0,
    },
    {}
  )

  const {
    data: deviceAlerts = [],
    isPending: isDeviceAlertsPending,
    isError: isDeviceAlertsError,
    error: deviceAlertsError,
    refetch: refetchDeviceAlerts,
  } = deviceAlertsQuery
  const {
    data: ruleLogs = [],
    isError: isRuleLogsError,
    error: ruleLogsError,
    refetch: refetchRuleLogs,
  } = ruleLogsQuery
  const {
    data: ruleAlarms = [],
    isError: isRuleAlarmsError,
    error: ruleAlarmsError,
    refetch: refetchRuleAlarms,
  } = ruleAlarmsQuery
  const {
    data: clientAttributes = [],
    isPending: isClientAttributesPending,
    isError: isClientAttributesError,
    error: clientAttributesError,
    refetch: refetchClientAttributes,
  } = deviceClientAttributesQuery

  const gatewayId = device?.id ?? 0
  const { data: gatewayDetails } = useIotGatewayQuery(gatewayId, {
    enabled: isGateway && gatewayId > 0,
  })
  const { data: gatewayConnectors = [] } = useIotGatewayConnectorsQuery(gatewayId, {
    enabled: isGateway && gatewayId > 0,
  })
  const { data: gatewayDevices = [] } = useIotGatewayDevicesQuery(gatewayId, {
    enabled: isGateway && gatewayId > 0,
  })
  const { data: gatewayLogs = [] } = useIotGatewayLogsQuery(
    gatewayId,
    { limit: 20 },
    { enabled: isGateway && gatewayId > 0 }
  )

  const gatewayConnectorMap = useMemo(
    () => new Map(gatewayConnectors.map((connector) => [connector.id, connector])),
    [gatewayConnectors]
  )

  const {
    data: deleteStatus,
    isPending: isDeleteStatusPending,
    isError: isDeleteStatusError,
    error: deleteStatusError,
    refetch: refetchDeleteStatus,
  } = deleteStatusQuery

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (resolvedDeviceId === 0) return

    const baseUrl = getIotApiBaseUrl()
    if (!baseUrl) return
    const source = new EventSource(`${baseUrl}/observability/stream`)
    const handleTick = () => {
      void refetchDeviceAlerts()
      void refetchRuleLogs()
      void refetchRuleAlarms()
      void refetchClientAttributes()
    }

    source.addEventListener('tick', handleTick)
    source.onmessage = handleTick

    return () => {
      source.close()
    }
  }, [
    refetchClientAttributes,
    refetchDeviceAlerts,
    refetchRuleAlarms,
    refetchRuleLogs,
    resolvedDeviceId,
  ])

  const handleEdit = () => {
    if (!device) return
    setEditingDevice(device)
    setDeviceDialogOpen(true)
  }

  const handleEditDialogChange = (open: boolean) => {
    setDeviceDialogOpen(open)
    if (!open) setEditingDevice(null)
  }

  const copyText = async (value: string, label: string) => {
    try {
      if (!navigator?.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied.`)
    } catch {
      toast.error('Copy failed.')
    }
  }

  const primaryCredential =
    credentials.find((item) => item.auth_type === 'key' && item.key_id) ||
    credentials.find((item) => item.key_id) ||
    null

  const handleCreateCredential = async () => {
    if (!device) return
    try {
      await createCredential({
        deviceId: device.id,
        payload: {
          auth_type: 'key',
          ...(credentialKey.trim() ? { key_id: credentialKey.trim() } : {}),
        },
      })
      setCredentialKey('')
      await refetchCredentials()
      toast.success('Credential created.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create credential.')
    }
  }

  const handleConnectivityCheck = () => {
    toast.message('Connectivity check queued.')
  }

  const handleCommandSelect = (command: IotDeviceCommand) => {
    setSelectedCommand(command)
    setCommandPanelOpen(true)
  }

  const formatCommandPayload = (payload?: Record<string, unknown> | null) =>
    payload ? JSON.stringify(payload, null, 2) : '--'

  const formatMs = (value?: number | null) => (value ? new Date(value).toLocaleString() : '--')

  const availableKeys = useMemo(() => {
    if (!model?.data_type_key_ids?.length) return dataTypeKeys
    const allowed = new Set(model.data_type_key_ids)
    return dataTypeKeys.filter((key) => allowed.has(key.id))
  }, [dataTypeKeys, model])

  const selectedKey = useMemo(
    () => availableKeys.find((key) => String(key.id) === deleteDataTypeKeyId) ?? null,
    [availableKeys, deleteDataTypeKeyId]
  )

  const openDeleteTelemetryConfirm = () => {
    if (!device) return
    if (!deleteDataTypeKeyId) {
      toast.error('Select a data key type first.')
      return
    }
    if (!deleteFrom || !deleteTo) {
      toast.error('Select start and end date/time.')
      return
    }

    const fromIso = new Date(deleteFrom).toISOString()
    const toIso = new Date(deleteTo).toISOString()
    if (Number.isNaN(Date.parse(fromIso)) || Number.isNaN(Date.parse(toIso))) {
      toast.error('Invalid date range.')
      return
    }
    if (Date.parse(fromIso) > Date.parse(toIso)) {
      toast.error('Start date must be before end date.')
      return
    }

    setDeleteConfirmPayload({
      dataTypeKeyId: deleteDataTypeKeyId,
      fromIso,
      toIso,
    })
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDeleteTelemetry = async () => {
    if (!device || !deleteConfirmPayload) return

    try {
      const result = await deleteTelemetry({
        deviceId: device.id,
        payload: {
          data_type_key_id: deleteConfirmPayload.dataTypeKeyId,
          from: deleteConfirmPayload.fromIso,
          to: deleteConfirmPayload.toIso,
        },
      })
      if (result?.request_id) setDeleteRequestId(result.request_id)
      toast.success('Telemetry deletion queued.')
      setDeleteConfirmOpen(false)
      setDeleteConfirmPayload(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete telemetry.')
    }
  }

  if (!Number.isFinite(deviceId)) {
    return <p className="text-sm text-foreground-light">Invalid device.</p>
  }

  if (isPending) {
    return <p className="text-sm text-foreground-light">Loading device...</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive-600">{error?.message}</p>
  }

  if (!device) {
    return <p className="text-sm text-foreground-light">Device not found.</p>
  }

  const nameLabel = device.name || device.serial_number || `#${device.id}`

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{nameLabel}</PageHeaderTitle>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Button type="primary" onClick={handleEdit}>
              Edit device
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">

        <PageSection>
          <PageSectionContent>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="tiny" type="default" onClick={() => copyText(String(device.id), 'Device ID')}>
                  Copy device id
                </Button>
                <Button
                  size="tiny"
                  type="default"
                  onClick={() => {
                    if (!primaryCredential?.key_id) return
                    copyText(primaryCredential.key_id, 'Access token')
                  }}
                  disabled={!primaryCredential?.key_id}
                >
                  Copy access token
                </Button>
                <Button size="tiny" type="default" onClick={() => setCredentialsOpen(true)}>
                  Manage credentials
                </Button>
                <Button size="tiny" type="default" onClick={handleConnectivityCheck}>
                  Check connectivity
                </Button>
                {isGateway && device?.id && (
                  <Link href={`/project/${projectRef}/gateways/${device.id}`}>
                    <Button size="tiny" type="default">Open gateway page</Button>
                  </Link>
                )}
              </div>
              <Tabs_Shadcn_ value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList_Shadcn_ className="flex flex-wrap gap-2 border-b">
                <TabsTrigger_Shadcn_ value="telemetry">Telemetry</TabsTrigger_Shadcn_>
                <TabsTrigger_Shadcn_ value="attributes">Attributes</TabsTrigger_Shadcn_>
                <TabsTrigger_Shadcn_ value="alerts">Observability</TabsTrigger_Shadcn_>
                {isGateway && <TabsTrigger_Shadcn_ value="gateway">Gateway</TabsTrigger_Shadcn_>}
                <TabsTrigger_Shadcn_ value="commands">Commands</TabsTrigger_Shadcn_>
                <TabsTrigger_Shadcn_ value="events">Events</TabsTrigger_Shadcn_>
                <TabsTrigger_Shadcn_ value="maintenance">Maintenance</TabsTrigger_Shadcn_>
              </TabsList_Shadcn_>
              <TabsContent_Shadcn_ value="telemetry" className="pt-4">
                  <div className="space-y-4">
                    <DeviceTelemetryCharts device={device} model={model} />
                  </div>
              </TabsContent_Shadcn_>
              {isGateway && (
                <TabsContent_Shadcn_ value="gateway" className="pt-4">
                  <div className="space-y-4">
                    <Card className="p-6 space-y-3">
                      <div className="text-sm font-medium">Gateway status</div>
                      <div className="grid gap-3 md:grid-cols-3 text-xs">
                        <div className="rounded-md border border-default px-3 py-2">
                          <div className="text-foreground-light">Status</div>
                          <div className="text-foreground">
                            {gatewayDetails?.gateway_status || 'unknown'}
                          </div>
                        </div>
                        <div className="rounded-md border border-default px-3 py-2">
                          <div className="text-foreground-light">Connected devices</div>
                          <div className="text-foreground">
                            {gatewayDetails?.child_online_count ?? 0}/{gatewayDetails?.child_total_count ?? 0}
                          </div>
                        </div>
                        <div className="rounded-md border border-default px-3 py-2">
                          <div className="text-foreground-light">Connectors</div>
                          <div className="text-foreground">
                            {gatewayDetails?.connector_active_count ?? 0}/{gatewayDetails?.connector_total_count ?? 0}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 space-y-3">
                      <div className="text-sm font-medium">Connectors</div>
                      {gatewayConnectors.length === 0 ? (
                        <div className="text-xs text-foreground-light">No connectors yet.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Enabled</TableHead>
                              <TableHead>Last seen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gatewayConnectors.map((connector: IotGatewayConnector) => (
                              <TableRow key={connector.id}>
                                <TableCell>{connector.name}</TableCell>
                                <TableCell>{connector.type}</TableCell>
                                <TableCell>{connector.status || 'unknown'}</TableCell>
                                <TableCell>{connector.enabled ? 'yes' : 'no'}</TableCell>
                                <TableCell>
                                  {connector.last_seen_at ? formatDate(connector.last_seen_at) : '--'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </Card>

                    <Card className="p-6 space-y-3">
                      <div className="text-sm font-medium">Connected devices</div>
                      {gatewayDevices.length === 0 ? (
                        <div className="text-xs text-foreground-light">No devices connected.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last online</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gatewayDevices.map((gatewayDevice) => (
                              <TableRow key={gatewayDevice.id}>
                                <TableCell>
                                  <Link
                                    href={`/project/${projectRef}/iot/devices/${gatewayDevice.id}`}
                                    className="text-brand-600 hover:underline"
                                  >
                                    {gatewayDevice.name || `Device ${gatewayDevice.id}`}
                                  </Link>
                                </TableCell>
                                <TableCell>{gatewayDevice.gateway_status || 'unknown'}</TableCell>
                                <TableCell>
                                  {gatewayDevice.last_online_at
                                    ? formatDate(gatewayDevice.last_online_at)
                                    : '--'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </Card>

                    <Card className="p-6 space-y-3">
                      <div className="text-sm font-medium">Gateway logs</div>
                      {gatewayLogs.length === 0 ? (
                        <div className="text-xs text-foreground-light">No logs yet.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Connector</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gatewayLogs.map((log) => {
                              const connector = log.connector_id
                                ? gatewayConnectorMap.get(log.connector_id)
                                : null
                              return (
                                <TableRow key={log.id}>
                                  <TableCell>
                                    {log.inserted_at ? formatDate(log.inserted_at) : '--'}
                                  </TableCell>
                                  <TableCell>{log.level || '--'}</TableCell>
                                  <TableCell>{log.category || '--'}</TableCell>
                                  <TableCell>{connector?.name || '--'}</TableCell>
                                  <TableCell className="max-w-[320px] truncate">
                                    {log.message}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </Card>
                  </div>
                </TabsContent_Shadcn_>
              )}
              <TabsContent_Shadcn_ value="maintenance" className="pt-4">
                <div className="space-y-4">
                  <Card className="p-6 space-y-4">
                    <div>
                      <div className="text-sm font-medium">Delete telemetry data</div>
                      <p className="text-xs text-foreground-light">
                        Remove data for the selected key and period from ClickHouse.
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <p className="text-xs text-foreground-light">Data key type</p>
                        <Select_Shadcn_
                          value={deleteDataTypeKeyId}
                          onValueChange={setDeleteDataTypeKeyId}
                        >
                          <SelectTrigger_Shadcn_ className="text-left">
                            {selectedKey?.name || selectedKey?.data_key_name || 'Select data key type'}
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectGroup_Shadcn_>
                              {availableKeys.map((key: IotDataTypeKey) => (
                                <SelectItem_Shadcn_ key={key.id} value={String(key.id)}>
                                  {key.name || key.data_key_name}
                                </SelectItem_Shadcn_>
                              ))}
                            </SelectGroup_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </div>
                      <Input
                        id="telemetry-delete-from"
                        label="From (local time)"
                        type="datetime-local"
                        value={deleteFrom}
                        onChange={(event) => setDeleteFrom(event.target.value)}
                      />
                      <Input
                        id="telemetry-delete-to"
                        label="To (local time)"
                        type="datetime-local"
                        value={deleteTo}
                        onChange={(event) => setDeleteTo(event.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-light">
                      <span>Deletion is applied in UTC based on the selected local time.</span>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="danger"
                        onClick={openDeleteTelemetryConfirm}
                        disabled={isDeletingTelemetry}
                        loading={isDeletingTelemetry}
                      >
                        Delete data
                      </Button>
                    </div>
                    {deleteRequestId && (
                      <div className="space-y-3 border-t border-border px-2 pt-4 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-foreground-light">Last delete request</span>
                          <span className="font-mono text-foreground">{deleteRequestId}</span>
                          <Button
                            size="tiny"
                            type="default"
                            onClick={() => void refetchDeleteStatus()}
                          >
                            Refresh status
                          </Button>
                        </div>
                        {isDeleteStatusPending && (
                          <p className="text-foreground-light">Loading delete status...</p>
                        )}
                        {isDeleteStatusError && (
                          <p className="text-destructive-600">{deleteStatusError?.message}</p>
                        )}
                        {!isDeleteStatusPending &&
                          !isDeleteStatusError &&
                          (deleteStatus?.mutations?.length ?? 0) === 0 && (
                            <p className="text-foreground-light">
                              No mutation rows yet. ClickHouse can take a few seconds to register
                              the delete.
                            </p>
                          )}
                        {(deleteStatus?.mutations?.length ?? 0) > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Table</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Parts to do</TableHead>
                                <TableHead>Created</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {deleteStatus?.mutations?.map((item) => (
                                <TableRow key={`${item.table}-${item.mutation_id}`}>
                                  <TableCell>{item.table ?? '--'}</TableCell>
                                  <TableCell>
                                    {Number(item.is_done ?? 0) === 1 ? 'done' : 'running'}
                                  </TableCell>
                                  <TableCell>{item.parts_to_do ?? '--'}</TableCell>
                                  <TableCell>{formatDate(item.create_time)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              </TabsContent_Shadcn_>
              <ConfirmationModal
                visible={deleteConfirmOpen}
                loading={isDeletingTelemetry}
                variant="destructive"
                confirmLabel="Delete telemetry data"
                confirmLabelLoading="Deleting"
                title="Delete telemetry data"
                onCancel={() => {
                  setDeleteConfirmOpen(false)
                  setDeleteConfirmPayload(null)
                }}
                onConfirm={handleConfirmDeleteTelemetry}
              >
                <div className="space-y-2 text-sm text-foreground-light">
                  <p>This action cannot be undone.</p>
                  <p>
                    Data key:{' '}
                    <span className="text-foreground">
                      {selectedKey?.name || selectedKey?.data_key_name || deleteConfirmPayload?.dataTypeKeyId}
                    </span>
                  </p>
                  <p>
                    Period:{' '}
                    <span className="text-foreground">
                      {deleteConfirmPayload
                        ? `${formatDate(deleteConfirmPayload.fromIso)} → ${formatDate(deleteConfirmPayload.toIso)}`
                        : '--'}
                    </span>
                  </p>
                </div>
              </ConfirmationModal>
                <TabsContent_Shadcn_ value="attributes" className="pt-4">
                  <DeviceAttributesTab device={device} model={model} />
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="alerts" className="pt-4">
                  <div className="space-y-4">
                    <Card>
                      <div className="flex items-center justify-between px-4 pt-4">
                        <div>
                          <div className="text-sm font-medium">Client attributes</div>
                          <div className="text-xs text-foreground-light">
                            Latest values saved by the Save Client Attributes node.
                          </div>
                        </div>
                        <Button size="tiny" type="default" onClick={() => void refetchClientAttributes()}>
                          Refresh
                        </Button>
                      </div>
                      {isClientAttributesError && (
                        <p className="px-4 pb-4 text-sm text-destructive-600">
                          {clientAttributesError?.message}
                        </p>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="w-40">Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isClientAttributesPending ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-sm text-foreground-light">
                                Loading client attributes...
                              </TableCell>
                            </TableRow>
                          ) : clientAttributes.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-sm text-foreground-light">
                                No client attributes yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            clientAttributes.map((item) => (
                              <TableRow key={`${item.scope}-${item.key}`}>
                                <TableCell>{item.key ?? '--'}</TableCell>
                                <TableCell className="max-w-[420px] truncate text-foreground-light">
                                  {formatAttributeValue(item.value) || '--'}
                                </TableCell>
                                <TableCell>{formatDate(item.updated_at)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Card>

                    <Card>
                      <div className="px-4 pt-4 text-sm font-medium">Device alarms</div>
                      <div className="px-4 pb-4 text-xs text-foreground-light">
                        Current and historical alarms for this device.
                      </div>
                      {isDeviceAlertsError && (
                        <p className="px-4 pb-4 text-sm text-destructive-600">
                          {deviceAlertsError?.message}
                        </p>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Start</TableHead>
                            <TableHead>End</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Message</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isDeviceAlertsPending ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-sm text-foreground-light">
                                Loading alarms...
                              </TableCell>
                            </TableRow>
                          ) : deviceAlerts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-sm text-foreground-light">
                                No alarms yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            deviceAlerts.map((item: IotDeviceAlert) => (
                              <TableRow key={item.id}>
                                <TableCell>{formatMs(item.start_ts)}</TableCell>
                                <TableCell>{formatMs(item.end_ts)}</TableCell>
                                <TableCell>{item.severity ?? '--'}</TableCell>
                                <TableCell>{item.status ?? '--'}</TableCell>
                                <TableCell>{item.alert_type ?? '--'}</TableCell>
                                <TableCell
                                  className="max-w-[480px] truncate text-foreground-light"
                                  title={item.message ?? ''}
                                >
                                  {item.message ?? '--'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Card>

                    <Card>
                      <div className="px-4 pt-4 text-sm font-medium">Rule engine alarm events</div>
                      <div className="px-4 pb-4 text-xs text-foreground-light">
                        Create/Clear alarm events emitted by rule nodes.
                      </div>
                      {isRuleAlarmsError && (
                        <p className="px-4 pb-4 text-sm text-destructive-600">
                          {ruleAlarmsError?.message}
                        </p>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Alarm</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Node</TableHead>
                            <TableHead>Message</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ruleAlarms.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-sm text-foreground-light">
                                No rule alarm events yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            ruleAlarms.map((item: IotRuleAlarm, index: number) => (
                              <TableRow key={`${item.ts}-${index}`}>
                                <TableCell>{formatDate(item.ts)}</TableCell>
                                <TableCell>{item.action ?? '--'}</TableCell>
                                <TableCell>{item.alarm_type ?? '--'}</TableCell>
                                <TableCell>{item.severity ?? '--'}</TableCell>
                                <TableCell>{item.status ?? '--'}</TableCell>
                                <TableCell>{item.node_index ?? '--'}</TableCell>
                                <TableCell
                                  className="max-w-[480px] truncate text-foreground-light"
                                  title={item.message ?? ''}
                                >
                                  {item.message ?? '--'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Card>

                    <Card>
                      <div className="px-4 pt-4 text-sm font-medium">Rule engine logs</div>
                      <div className="px-4 pb-4 text-xs text-foreground-light">
                        Log entries emitted while processing this device.
                      </div>
                      {isRuleLogsError && (
                        <p className="px-4 pb-4 text-sm text-destructive-600">
                          {ruleLogsError?.message}
                        </p>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Chain</TableHead>
                            <TableHead>Node</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Message</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ruleLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-sm text-foreground-light">
                                No rule logs yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            ruleLogs.map((item: IotRuleLog, index: number) => (
                              <TableRow key={`${item.ts}-${index}`}>
                                <TableCell>{formatDate(item.ts)}</TableCell>
                                <TableCell>{item.rule_chain_id ?? '--'}</TableCell>
                                <TableCell>{item.node_index ?? '--'}</TableCell>
                                <TableCell>{item.node_type ?? '--'}</TableCell>
                                <TableCell>{item.label ?? '--'}</TableCell>
                                <TableCell
                                  className="max-w-[520px] truncate text-foreground-light"
                                  title={item.message ?? ''}
                                >
                                  {item.message ?? '--'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="commands" className="pt-4">
                  <Card className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Protocol</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isCommandsPending ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-sm text-foreground-light">
                              Loading commands...
                            </TableCell>
                          </TableRow>
                        ) : commands.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-sm text-foreground-light">
                              No commands yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          commands.map((command) => (
                            <TableRow
                              key={command.id}
                              className="cursor-pointer"
                              onClick={() => handleCommandSelect(command)}
                            >
                              <TableCell>{formatDate(command.inserted_at)}</TableCell>
                              <TableCell>{command.status || '--'}</TableCell>
                              <TableCell>{command.protocol || '--'}</TableCell>
                              <TableCell className="max-w-[220px] truncate">
                                {command.channel || '--'}
                              </TableCell>
                              <TableCell>{command.attempts ?? 0}</TableCell>
                              <TableCell className="max-w-[240px] truncate">
                                {command.last_error || '--'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="events" className="pt-4">
                  <Card className="p-6">
                    <p className="text-sm text-foreground-light">
                      Device events will appear here once event tracking is enabled.
                    </p>
                  </Card>
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </div>
          </PageSectionContent>
        </PageSection>

        <ManageDeviceDialog
          models={models}
          open={deviceDialogOpen}
          device={editingDevice}
          onOpenChange={handleEditDialogChange}
          onCreate={async () => {
            toast.error('Device creation is not available from this page.')
            throw new Error('Device creation is not supported here.')
          }}
          onUpdate={updateDevice}
          isSaving={isUpdatingDevice}
        />
        <SidePanel
          size="large"
          visible={credentialsOpen}
          header="Device credentials"
          onCancel={() => setCredentialsOpen(false)}
          customFooter={
            <div className="flex w-full items-center justify-end gap-2 border-t border-default px-4 py-4">
              <Button type="default" onClick={() => setCredentialsOpen(false)}>
                Close
              </Button>
            </div>
          }
        >
          <SidePanel.Content className="space-y-6 py-6">
            <div className="space-y-3 px-4">
              <Alert
                variant="info"
                withIcon
                title="Access tokens authenticate devices"
              >
                Generate or copy access tokens used by devices to authenticate.
              </Alert>
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <Input
                  id="device-credential-new"
                  label="Access token (optional)"
                  value={credentialKey}
                  onChange={(event) => setCredentialKey(event.target.value)}
                />
                <Button
                  type="primary"
                  onClick={handleCreateCredential}
                  disabled={isCreatingCredential}
                  loading={isCreatingCredential}
                >
                  Create token
                </Button>
              </div>
            </div>
            <div className="px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Auth type</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last used</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isCredentialsPending ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-foreground-light">
                        Loading credentials...
                      </TableCell>
                    </TableRow>
                  ) : credentials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-foreground-light">
                        No credentials yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    credentials.map((item: IotDeviceCredential) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.auth_type}</TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {item.key_id || '--'}
                        </TableCell>
                        <TableCell>{item.status || '--'}</TableCell>
                        <TableCell>{formatDate(item.last_used_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="tiny"
                            type="default"
                            onClick={() => {
                              if (!item.key_id) return
                              copyText(item.key_id, 'Access token')
                            }}
                            disabled={!item.key_id}
                          >
                            Copy
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </SidePanel.Content>
        </SidePanel>
        <SidePanel
          size="large"
          visible={commandPanelOpen}
          header="Device command"
          onCancel={() => setCommandPanelOpen(false)}
          customFooter={
            <div className="flex w-full items-center justify-end gap-2 border-t border-default px-4 py-4">
              <Button type="default" onClick={() => setCommandPanelOpen(false)}>
                Close
              </Button>
            </div>
          }
        >
          <SidePanel.Content className="space-y-4 py-6">
            <div className="grid gap-4 px-4">
              <div className="grid gap-2">
                <p className="text-xs text-foreground-light">Status</p>
                <p className="text-sm">{selectedCommand?.status || '--'}</p>
              </div>
              <div className="grid gap-2">
                <p className="text-xs text-foreground-light">Protocol</p>
                <p className="text-sm">{selectedCommand?.protocol || '--'}</p>
              </div>
              <div className="grid gap-2">
                <p className="text-xs text-foreground-light">Channel</p>
                <p className="text-sm break-words">{selectedCommand?.channel || '--'}</p>
              </div>
              <div className="grid gap-2">
                <p className="text-xs text-foreground-light">Attempts</p>
                <p className="text-sm">{selectedCommand?.attempts ?? 0}</p>
              </div>
              <div className="grid gap-2">
                <p className="text-xs text-foreground-light">Last error</p>
                <p className="text-sm break-words">{selectedCommand?.last_error || '--'}</p>
              </div>
              <div className="grid gap-2">
                <p className="text-xs text-foreground-light">Payload</p>
                <pre className="whitespace-pre-wrap break-words rounded-md bg-surface-100 p-3 text-xs text-foreground">
                  {formatCommandPayload(selectedCommand?.payload ?? null)}
                </pre>
              </div>
            </div>
          </SidePanel.Content>
        </SidePanel>
      </PageContainer>
    </>
  )
}
