import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { useParams } from 'common'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'

import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import MqttConnectorForm from 'components/interfaces/Iot/Gateways/MqttConnectorForm'
import OpcuaConnectorForm from 'components/interfaces/Iot/Gateways/OpcuaConnectorForm'
import ModbusConnectorForm from 'components/interfaces/Iot/Gateways/ModbusConnectorForm'
import { useIotObservabilityRuleAlarmsQuery } from 'data/iot/observability'
import {
  useIotGatewayConfigPublishMutation,
  useIotGatewayConfigMutation,
  useIotGatewayConfigQuery,
  useIotGatewayConnectorCreateMutation,
  useIotGatewayConnectorDeleteMutation,
  useIotGatewayConnectorUpdateMutation,
  useIotGatewayConnectorsQuery,
  getIotGatewayDockerCompose,
  getIotGatewayTemplateConfig,
  getIotGatewayConnectorTemplate,
  useIotGatewayDevicesQuery,
  useIotGatewayLogCreateMutation,
  useIotGatewayLogsQuery,
  useIotGatewayQuery,
  useIotGatewayUpdateMutation,
} from 'data/iot/gateways'
import type { IotGatewayConnector, IotGatewayConfig } from 'data/iot/types'
import type {
  IotGatewayConnectorPayload,
  IotGatewayLogPayload,
  IotGatewayPayload,
} from 'data/iot/gateways'
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
  FieldContent_Shadcn_,
  FieldDescription_Shadcn_,
  FieldLabel_Shadcn_,
  FieldTitle_Shadcn_,
  Field_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  ButtonGroup,
  ButtonGroupItem,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Switch,
  Textarea,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const CONNECTOR_TYPES = [
  { label: 'MQTT', value: 'MQTT' },
  { label: 'MODBUS', value: 'MODBUS' },
  { label: 'GRPC', value: 'GRPC' },
  { label: 'OPC-UA', value: 'OPCUA' },
  { label: 'BLE', value: 'BLE' },
  { label: 'REQUEST', value: 'REQUEST' },
  { label: 'CAN', value: 'CAN' },
  { label: 'BACNET', value: 'BACNET' },
  { label: 'ODBC', value: 'ODBC' },
  { label: 'REST', value: 'REST' },
  { label: 'SNMP', value: 'SNMP' },
  { label: 'FTP', value: 'FTP' },
  { label: 'SOCKET', value: 'SOCKET' },
  { label: 'XMPP', value: 'XMPP' },
  { label: 'OCPP', value: 'OCPP' },
  { label: 'CUSTOM', value: 'CUSTOM' },
  { label: 'KNX', value: 'KNX' },
]

const CONNECTOR_LOG_LEVELS = [
  { label: 'NONE', value: 'NONE' },
  { label: 'CRITICAL', value: 'CRITICAL' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'INFO', value: 'INFO' },
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'TRACE', value: 'TRACE' },
]

const HelpIconTooltip = ({ content }: { content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="ml-1 inline-flex align-middle">
        <HelpCircle size={12} strokeWidth={1.5} />
      </span>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      {content}
    </TooltipContent>
  </Tooltip>
)

const LOG_LEVELS = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
]
const LOG_CATEGORIES = [
  { label: 'General', value: 'general' },
  { label: 'Service', value: 'service' },
  { label: 'Connection', value: 'connection' },
  { label: 'Storage', value: 'storage' },
  { label: 'Extension', value: 'extension' },
]
const LOCAL_LOGGING_TYPES = [
  { label: 'Service', value: 'service' },
  { label: 'Connector', value: 'connector' },
  { label: 'Converter', value: 'converter' },
  { label: 'Connection', value: 'connection' },
  { label: 'Storage', value: 'storage' },
  { label: 'Extension', value: 'extension' },
]
const LOCAL_LOG_PERIOD_UNITS = [
  { label: 'Month', value: 'month' },
  { label: 'Day', value: 'day' },
  { label: 'Minute', value: 'minute' },
  { label: 'Second', value: 'second' },
]
const LOCAL_LOG_DEFAULT_PATHS: Record<string, string> = {
  service: './logs/service.log',
  connector: './logs/connector.log',
  converter: './logs/converter.log',
  connection: './logs/connection.log',
  storage: './logs/storage.log',
  extension: './logs/extension.log',
}
const ALL_OPTION_VALUE = '__all__'
const NO_CONNECTOR_VALUE = '__none__'

const formatDate = (value?: string | number | null) =>
  value ? new Date(value).toLocaleString() : '--'

const GatewayDetailsPage: NextPageWithLayout = () => {
  const { ref: projectRef, id } = useParams()
  const gatewayId = Number(id)

  const { data: gateway } = useIotGatewayQuery(gatewayId, { enabled: Number.isFinite(gatewayId) })
  const { data: config } = useIotGatewayConfigQuery(gatewayId)
  const { data: connectors = [] } = useIotGatewayConnectorsQuery(gatewayId)
  const { data: gatewayDevices = [] } = useIotGatewayDevicesQuery(gatewayId)
  const { data: alarms = [] } = useIotObservabilityRuleAlarmsQuery({
    limit: 50,
    enabled: gatewayDevices.length > 0,
  })

  const [details, setDetails] = useState<IotGatewayPayload>({
    name: '',
    serial_number: '',
    description: '',
    firmware_version: '',
    receive_data: true,
  })
  const [configText, setConfigText] = useState('{}')
  const [configDirty, setConfigDirty] = useState(false)
  const [configView, setConfigView] = useState<'full' | 'normalized'>('full')
  const configFileInputRef = useRef<HTMLInputElement | null>(null)
  const parsedConfig = useMemo(() => {
    try {
      const value = JSON.parse(configText || '{}')
      return { value, error: null as string | null }
    } catch (err) {
      return { value: null as any, error: 'Gateway config must be valid JSON.' }
    }
  }, [configText])
  const normalizedConfigText = useMemo(() => {
    const normalized = parsedConfig.value?.normalized_config ?? config?.config?.normalized_config
    return JSON.stringify(normalized ?? {}, null, 2)
  }, [config?.config, parsedConfig.value])

  const [logLevelFilter, setLogLevelFilter] = useState('')
  const [logConnectorFilter, setLogConnectorFilter] = useState('')
  const [logCategoryFilter, setLogCategoryFilter] = useState('')
  const logParams = useMemo(
    () => ({
      level: logLevelFilter || undefined,
      category: logCategoryFilter || undefined,
      connector_id: logConnectorFilter || undefined,
      limit: 200,
    }),
    [logLevelFilter, logConnectorFilter, logCategoryFilter]
  )

  const { data: logs = [] } = useIotGatewayLogsQuery(gatewayId, logParams)

  const { mutateAsync: updateGateway, isPending: isSavingGateway } =
    useIotGatewayUpdateMutation()
  const { mutateAsync: updateConfig, isPending: isSavingConfig } = useIotGatewayConfigMutation()
  const { mutateAsync: publishConfig, isPending: isPublishingConfig } =
    useIotGatewayConfigPublishMutation()
  const { mutateAsync: createConnector } = useIotGatewayConnectorCreateMutation()
  const { mutateAsync: updateConnector } = useIotGatewayConnectorUpdateMutation()
  const { mutateAsync: deleteConnector } = useIotGatewayConnectorDeleteMutation()
  const { mutateAsync: createLog } = useIotGatewayLogCreateMutation()

  const [connectorDialogOpen, setConnectorDialogOpen] = useState(false)
  const [editingConnector, setEditingConnector] = useState<IotGatewayConnector | null>(null)

  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [remoteConfigConfirmOpen, setRemoteConfigConfirmOpen] = useState(false)
  const connectorUploadRef = useRef<HTMLInputElement | null>(null)
  const [connectorUploadTarget, setConnectorUploadTarget] = useState<IotGatewayConnector | null>(
    null
  )
  const [deploymentPanelOpen, setDeploymentPanelOpen] = useState(false)
  const [configurationPanelOpen, setConfigurationPanelOpen] = useState(false)

  useEffect(() => {
    if (!gateway) return
    setDetails({
      name: gateway.name ?? '',
      serial_number: gateway.serial_number ?? '',
      description: gateway.description ?? '',
      firmware_version: gateway.firmware_version ?? '',
      receive_data: gateway.receive_data ?? true,
    })
  }, [gateway])

  useEffect(() => {
    if (!config) return
    setConfigText(JSON.stringify(config.config ?? {}, null, 2))
    setConfigDirty(false)
  }, [config])

  const handleSaveDetails = async () => {
    if (!details.name.trim() || !details.serial_number.trim()) {
      toast.error('Gateway name and serial number are required.')
      return
    }
    try {
      await updateGateway({ gatewayId, payload: details })
      toast.success('Gateway details saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update gateway.')
    }
  }

  const handleSaveConfig = async () => {
    let payloadConfig: IotGatewayConfig['config']
    try {
      payloadConfig = JSON.parse(configText || '{}')
    } catch (err) {
      toast.error('Gateway config must be valid JSON.')
      return
    }
    const payloadLogs = (payloadConfig as any)?.logs ?? {}
    const payloadDateFormat = String(payloadLogs?.dateFormat ?? '').trim()
    const payloadLogFormat = String(payloadLogs?.format ?? '').trim()
    if (!payloadDateFormat || !payloadLogFormat) {
      toast.error('Date format and Log format are required.')
      return
    }
    const payloadLocalType = String(payloadLogs?.local?.type ?? 'service')
    const payloadLocalConfig = payloadLogs?.local?.configs?.[payloadLocalType] ?? {}
    const payloadLocalLevel = String(payloadLocalConfig?.level ?? '').trim()
    const payloadLocalFilePath = String(payloadLocalConfig?.filePath ?? '').trim()
    const payloadLocalPeriodValue = Number(payloadLocalConfig?.savingPeriod?.value ?? 0)
    const payloadLocalPeriodUnit = String(payloadLocalConfig?.savingPeriod?.unit ?? '').trim()
    const payloadLocalBackupCount = Number(payloadLocalConfig?.backupCount ?? 0)
    if (
      !payloadLocalLevel ||
      !payloadLocalFilePath ||
      payloadLocalPeriodValue <= 0 ||
      !payloadLocalPeriodUnit ||
      payloadLocalBackupCount <= 0
    ) {
      toast.error('All local logging fields are required.')
      return
    }
    const payloadStats = (payloadConfig as any)?.thingsboard?.statistics ?? {}
    const customStatsEnabled = payloadStats?.enableCustom === true
    const commands = Array.isArray(payloadStats?.commands) ? payloadStats.commands : []
    if (customStatsEnabled && commands.length > 0) {
      const invalidCommand = commands.find((cmd: any) => {
        const name = String(cmd?.attributeOnGateway ?? '').trim()
        const timeout = Number(cmd?.timeout ?? 0)
        const command = String(cmd?.command ?? '').trim()
        return !name || timeout <= 0 || !command
      })
      if (invalidCommand) {
        toast.error('All command fields (name, timeout, command) are required.')
        return
      }
    }
    try {
      await updateConfig({ gatewayId, payload: { config: payloadConfig } })
      toast.success('Gateway configuration saved.')
      setConfigDirty(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update configuration.')
    }
  }

  const updateConfigValue = (path: string[], value: any) => {
    if (parsedConfig.error) return
    const base = parsedConfig.value ?? {}
    const next =
      typeof structuredClone === 'function' ? structuredClone(base) : JSON.parse(JSON.stringify(base))
    let cursor = next as any
    for (let i = 0; i < path.length - 1; i += 1) {
      const key = path[i]
      if (typeof cursor[key] !== 'object' || cursor[key] === null || Array.isArray(cursor[key])) {
        cursor[key] = {}
      }
      cursor = cursor[key]
    }
    cursor[path[path.length - 1]] = value
    setConfigText(JSON.stringify(next, null, 2))
    setConfigDirty(true)
  }

  const getConfigValue = (path: string[], fallback: any) => {
    if (parsedConfig.error) return fallback
    let cursor: any = parsedConfig.value ?? {}
    for (const key of path) {
      if (cursor == null || typeof cursor !== 'object') return fallback
      cursor = cursor[key]
    }
    return cursor ?? fallback
  }

  const handlePublishConfig = async () => {
    try {
      await publishConfig({ gatewayId })
      toast.success('Gateway configuration published.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish configuration.')
    }
  }

  const handleDownloadGatewayConfig = () => {
    try {
      const parsed = JSON.parse(configText || '{}')
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'tb_gateway.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Gateway configuration must be valid JSON before download.')
    }
  }

  const handleUploadGatewayConfig = () => {
    configFileInputRef.current?.click()
  }

  const handleConfigFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      setConfigText(JSON.stringify(parsed, null, 2))
      setConfigDirty(true)
      toast.success('Gateway configuration loaded.')
    } catch (err) {
      toast.error('Failed to read configuration file. Ensure it is valid JSON.')
    } finally {
      event.target.value = ''
    }
  }

  const handleResetGatewayConfig = async () => {
    try {
      const template = await getIotGatewayTemplateConfig()
      setConfigText(JSON.stringify(template ?? {}, null, 2))
      setConfigDirty(true)
      toast.success('Loaded ThingsBoard default configuration.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load default configuration.')
    }
  }

  const handleDownloadCompose = async () => {
    try {
      const compose = await getIotGatewayDockerCompose(gatewayId)
      const blob = new Blob([compose], { type: 'text/yaml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'docker-compose.yml'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Docker compose downloaded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to download docker compose.')
    }
  }

  const handleDeleteConnector = async (connector: IotGatewayConnector) => {
    if (!confirm(`Delete connector "${connector.name}"?`)) return
    try {
      await deleteConnector({ gatewayId, connectorId: connector.id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete connector.')
    }
  }

  const handleDownloadConnectorConfig = (connector: IotGatewayConnector) => {
    try {
      const blob = new Blob([JSON.stringify(connector.config ?? {}, null, 2)], {
        type: 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `connector-${connector.id}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Failed to download connector config.')
    }
  }

  const handleUploadConnectorConfig = (connector: IotGatewayConnector) => {
    setConnectorUploadTarget(connector)
    connectorUploadRef.current?.click()
  }

  const handleConnectorFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !connectorUploadTarget) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      await updateConnector({
        gatewayId,
        connectorId: connectorUploadTarget.id,
        payload: { config: parsed },
      })
      toast.success('Connector configuration updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update connector config.')
    } finally {
      event.target.value = ''
      setConnectorUploadTarget(null)
    }
  }

  const handleOpenConnectorDialog = (connector?: IotGatewayConnector) => {
    setEditingConnector(connector ?? null)
    setConnectorDialogOpen(true)
  }


  const statusStats = useMemo(() => {
    const lastLog = logs[0]
    const activeConnectors = connectors.filter((c) => c.enabled)
    return {
      lastLogMessage: lastLog?.message ?? '--',
      lastLogTime: lastLog?.inserted_at ?? null,
      connectorCount: connectors.length,
      activeConnectorCount: activeConnectors.length,
    }
  }, [connectors, logs])

  const gatewayDeviceMap = useMemo(
    () => new Map(gatewayDevices.map((device) => [device.id, device])),
    [gatewayDevices]
  )
  const gatewayDeviceIdSet = useMemo(
    () => new Set(gatewayDevices.map((device) => device.id)),
    [gatewayDevices]
  )
  const gatewayAlarms = useMemo(
    () => alarms.filter((alarm) => alarm.device_id && gatewayDeviceIdSet.has(alarm.device_id)),
    [alarms, gatewayDeviceIdSet]
  )

  const overviewStats = useMemo(() => {
    return {
      status: gateway?.gateway_status ?? '--',
      version: gateway?.gateway_version ?? '--',
      connectorsEnabled: gateway?.connector_enabled_count ?? 0,
      connectorsTotal: gateway?.connector_total_count ?? 0,
      devicesOnline: gateway?.child_online_count ?? 0,
      devicesTotal: gateway?.child_total_count ?? 0,
      errors30d: gateway?.errors_30d ?? 0,
      lastLogMessage: gateway?.last_log_message ?? '--',
      lastLogTime: gateway?.last_log_at ?? null,
    }
  }, [gateway])
  const devicesOffline = Math.max(overviewStats.devicesTotal - overviewStats.devicesOnline, 0)
  const connectorsDisabled = Math.max(
    overviewStats.connectorsTotal - overviewStats.connectorsEnabled,
    0
  )
  const securityType = getConfigValue(['thingsboard', 'security', 'type'], 'accessToken')
  const storageType = getConfigValue(['storage', 'type'], 'memory')
  const showMemoryStorage = storageType === 'memory'
  const showFileStorage = storageType === 'file'
  const showSqliteStorage = storageType === 'sqlite'
  const customStatisticsEnabled = !!getConfigValue(
    ['thingsboard', 'statistics', 'enableCustom'],
    true
  )
  const logsDateFormatValue = getConfigValue(['logs', 'dateFormat'], '')
  const logsFormatValue = getConfigValue(['logs', 'format'], '')
  const remoteLogsEnabled = !!getConfigValue(['logs', 'remote', 'enabled'], false)
  const localLoggingType =
    getConfigValue(['logs', 'local', 'type'], 'service') ?? 'service'
  const localLogLevelValue = getConfigValue(
    ['logs', 'local', 'configs', localLoggingType, 'level'],
    'INFO'
  )
  const localLogFilePathValue = getConfigValue(
    ['logs', 'local', 'configs', localLoggingType, 'filePath'],
    LOCAL_LOG_DEFAULT_PATHS[localLoggingType] ?? './logs/service.log'
  )
  const localLogPeriodValue = getConfigValue(
    ['logs', 'local', 'configs', localLoggingType, 'savingPeriod', 'value'],
    7
  )
  const localLogPeriodUnit = getConfigValue(
    ['logs', 'local', 'configs', localLoggingType, 'savingPeriod', 'unit'],
    'day'
  )
  const localLogBackupCount = getConfigValue(
    ['logs', 'local', 'configs', localLoggingType, 'backupCount'],
    7
  )
  const grpcEnabled = !!getConfigValue(['grpc', 'enabled'], false)
  const areLogsRequiredFieldsValid =
    String(logsDateFormatValue ?? '').trim().length > 0 &&
    String(logsFormatValue ?? '').trim().length > 0 &&
    String(localLogLevelValue ?? '').trim().length > 0 &&
    String(localLogFilePathValue ?? '').trim().length > 0 &&
    Number(localLogPeriodValue) > 0 &&
    String(localLogPeriodUnit ?? '').trim().length > 0 &&
    Number(localLogBackupCount) > 0
  const showAccessToken = securityType === 'accessToken' || securityType === 'tlsAccessToken'
  const showUsernamePassword = securityType === 'usernamePassword'
  const showTlsFields =
    securityType === 'tls' || securityType === 'tlsAccessToken' || securityType === 'tlsPrivateKey'

  if (!Number.isFinite(gatewayId)) {
    return (
      <PageContainer size="large">
        <PageHeader size="large">
          <PageHeaderTitle>Gateway</PageHeaderTitle>
          <PageHeaderDescription>Invalid gateway id.</PageHeaderDescription>
        </PageHeader>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="large">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{gateway?.name || `Gateway ${gatewayId}`}</PageHeaderTitle>
          </PageHeaderSummary>
          <PageHeaderAside>
            <div className="flex items-center gap-2">
              <Button type="default" onClick={() => setDeploymentPanelOpen(true)}>
                Deployment
              </Button>
              <Button type="default" onClick={() => setConfigurationPanelOpen(true)}>
                Configuration
              </Button>
              <Button asChild type="primary">
                <Link href={`/project/${projectRef}/devices/${gatewayId}`}>Edit device</Link>
              </Button>
            </div>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageSection className="px-6 xl:px-10">
        <PageSectionContent>
          <Tabs_Shadcn_ defaultValue="overview">
            <TabsList_Shadcn_ className="gap-2">
              <TabsTrigger_Shadcn_ value="overview">Overview</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="configuration">Configuration</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="connectors">Connectors</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="logs">Logs</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="statistics">Statistics</TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
            <TabsContent_Shadcn_ value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gateway overview</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-muted p-3">
                    <p className="text-xs text-foreground-light">Status</p>
                    <p className="text-sm font-medium">{overviewStats.status}</p>
                  </div>
                  <div className="rounded-md border border-muted p-3">
                    <p className="text-xs text-foreground-light">Version</p>
                    <p className="text-sm font-medium">{overviewStats.version}</p>
                  </div>
                  <div className="rounded-md border border-muted p-3">
                    <p className="text-xs text-foreground-light">Errors (30d)</p>
                    <p className="text-sm font-medium">{overviewStats.errors30d}</p>
                  </div>
                  <div className="rounded-md border border-muted p-3">
                    <p className="text-xs text-foreground-light">Devices</p>
                    <p className="text-sm font-medium">
                      {overviewStats.devicesOnline} active / {devicesOffline} inactive
                    </p>
                  </div>
                  <div className="rounded-md border border-muted p-3">
                    <p className="text-xs text-foreground-light">Connectors</p>
                    <p className="text-sm font-medium">
                      {overviewStats.connectorsEnabled} enabled / {connectorsDisabled} disabled
                    </p>
                  </div>
                  <div className="rounded-md border border-muted p-3">
                    <p className="text-xs text-foreground-light">Last log</p>
                    <p className="text-sm font-medium">{overviewStats.lastLogMessage}</p>
                    <p className="text-xs text-foreground-light">
                      {formatDate(overviewStats.lastLogTime)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Devices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last online</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gatewayDevices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-sm text-foreground-light">
                            No devices connected yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        gatewayDevices.map((device) => (
                          <TableRow key={device.id}>
                            <TableCell>{device.id}</TableCell>
                            <TableCell>{device.name ?? '--'}</TableCell>
                            <TableCell>{device.serial_number ?? '--'}</TableCell>
                            <TableCell>{device.gateway_status ?? '--'}</TableCell>
                            <TableCell>{formatDate(device.last_online_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Alarms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gatewayAlarms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-sm text-foreground-light">
                            No alarms yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        gatewayAlarms.map((alarm, index) => {
                          const deviceName =
                            alarm.device_id != null
                              ? gatewayDeviceMap.get(alarm.device_id)?.name
                              : null
                          return (
                            <TableRow key={`${alarm.alert_id ?? alarm.ts ?? 'alarm'}-${index}`}>
                              <TableCell>{formatDate(alarm.ts ?? alarm.start_ts_ms)}</TableCell>
                              <TableCell>{deviceName ?? alarm.device_id ?? '--'}</TableCell>
                              <TableCell>{alarm.alarm_type ?? alarm.action ?? '--'}</TableCell>
                              <TableCell>{alarm.severity ?? '--'}</TableCell>
                              <TableCell>{alarm.status ?? '--'}</TableCell>
                              <TableCell className="max-w-[320px] truncate">
                                {alarm.message ?? '--'}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="configuration" className="space-y-4">
                <div className="space-y-6">
                  {parsedConfig.error && (
                    <div className="text-sm text-destructive">{parsedConfig.error}</div>
                  )}
                  <Tabs_Shadcn_ defaultValue="general">
                    <TabsList_Shadcn_ className="flex flex-wrap gap-2">
                      <TabsTrigger_Shadcn_ value="general">General</TabsTrigger_Shadcn_>
                      <TabsTrigger_Shadcn_ value="logs">Logs</TabsTrigger_Shadcn_>
                      <TabsTrigger_Shadcn_ value="storage">Storage</TabsTrigger_Shadcn_>
                      <TabsTrigger_Shadcn_ value="grpc">gRPC</TabsTrigger_Shadcn_>
                      <TabsTrigger_Shadcn_ value="statistics">Statistics</TabsTrigger_Shadcn_>
                      <TabsTrigger_Shadcn_ value="other">Other</TabsTrigger_Shadcn_>
                    </TabsList_Shadcn_>
                    <TabsContent_Shadcn_ value="general" className="space-y-6">
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <FieldLabel_Shadcn_>
                            <Field_Shadcn_ orientation="horizontal">
                              <Checkbox
                                id="tb-remote-configuration"
                                name="tb-remote-configuration"
                                checked={!!getConfigValue(['thingsboard', 'remoteConfiguration'], true)}
                                onChange={(event) => {
                                  if (!event.target.checked) {
                                    setRemoteConfigConfirmOpen(true)
                                    return
                                  }
                                  updateConfigValue(
                                    ['thingsboard', 'remoteConfiguration'],
                                    event.target.checked
                                  )
                                }}
                              />
                              <FieldContent_Shadcn_>
                                <FieldTitle_Shadcn_>
                                  <span>Remote configuration</span>
                                  <HelpIconTooltip content="Allow configuration updates from the platform." />
                                </FieldTitle_Shadcn_>
                                <FieldDescription_Shadcn_>
                                  Allow configuration updates from the platform.
                                </FieldDescription_Shadcn_>
                              </FieldContent_Shadcn_>
                            </Field_Shadcn_>
                          </FieldLabel_Shadcn_>
                          <FieldLabel_Shadcn_>
                            <Field_Shadcn_ orientation="horizontal">
                              <Checkbox
                                id="tb-remote-shell"
                                name="tb-remote-shell"
                                checked={!!getConfigValue(['thingsboard', 'remoteShell'], false)}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['thingsboard', 'remoteShell'],
                                    event.target.checked
                                  )
                                }
                              />
                              <FieldContent_Shadcn_>
                                <FieldTitle_Shadcn_>
                                  <span>Remote shell</span>
                                  <HelpIconTooltip content="Enable remote shell commands for this gateway." />
                                </FieldTitle_Shadcn_>
                                <FieldDescription_Shadcn_>
                                  Enable remote shell commands for this gateway.
                                </FieldDescription_Shadcn_>
                              </FieldContent_Shadcn_>
                            </Field_Shadcn_>
                          </FieldLabel_Shadcn_>
                          <div className="hidden md:block" />
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Platform</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label_Shadcn_
                                  htmlFor="tb-host"
                                  className="text-xs text-foreground-light"
                                >
                                  <span>Host</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 inline-flex align-middle">
                                        <HelpCircle size={12} strokeWidth={1.5} />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      ThingsBoard server host or IP address (for example: demo.thingsboard.io).
                                    </TooltipContent>
                                  </Tooltip>
                                </Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-host"
                                  value={getConfigValue(['thingsboard', 'host'], '')}
                                  onChange={(event) =>
                                    updateConfigValue(['thingsboard', 'host'], event.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-port" className="text-xs text-foreground-light">
                                  <span>Port</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 inline-flex align-middle">
                                        <HelpCircle size={12} strokeWidth={1.5} />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      ThingsBoard server port (usually 1883 for MQTT or 8883 for MQTTS).
                                    </TooltipContent>
                                  </Tooltip>
                                </Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-port"
                                  type="number"
                                  value={String(getConfigValue(['thingsboard', 'port'], 1883))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'port'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                          <CardTitle>Security</CardTitle>
                          <ButtonGroup
                            id="tb-security-type"
                            className="inline-flex w-auto flex-row flex-wrap border border-control rounded-md overflow-hidden"
                          >
                            <ButtonGroupItem
                              size="tiny"
                              onClick={() =>
                                updateConfigValue(['thingsboard', 'security', 'type'], 'accessToken')
                              }
                              className={`border-b-0 border-r last:border-r-0 ${
                                securityType === 'accessToken'
                                  ? 'bg-surface-200 text-foreground'
                                  : 'text-foreground-light'
                              }`}
                            >
                              accessToken
                            </ButtonGroupItem>
                            <ButtonGroupItem
                              size="tiny"
                              onClick={() =>
                                updateConfigValue(
                                  ['thingsboard', 'security', 'type'],
                                  'usernamePassword'
                                )
                              }
                              className={`border-b-0 border-r last:border-r-0 ${
                                securityType === 'usernamePassword'
                                  ? 'bg-surface-200 text-foreground'
                                  : 'text-foreground-light'
                              }`}
                            >
                              usernamePassword
                            </ButtonGroupItem>
                            <ButtonGroupItem
                              size="tiny"
                              onClick={() =>
                                updateConfigValue(['thingsboard', 'security', 'type'], 'tls')
                              }
                              className={`border-b-0 border-r last:border-r-0 ${
                                securityType === 'tls'
                                  ? 'bg-surface-200 text-foreground'
                                  : 'text-foreground-light'
                              }`}
                            >
                              tls
                            </ButtonGroupItem>
                            <ButtonGroupItem
                              size="tiny"
                              onClick={() =>
                                updateConfigValue(
                                  ['thingsboard', 'security', 'type'],
                                  'tlsAccessToken'
                                )
                              }
                              className={`border-b-0 border-r last:border-r-0 ${
                                securityType === 'tlsAccessToken'
                                  ? 'bg-surface-200 text-foreground'
                                  : 'text-foreground-light'
                              }`}
                            >
                              tlsAccessToken
                            </ButtonGroupItem>
                            <ButtonGroupItem
                              size="tiny"
                              onClick={() =>
                                updateConfigValue(
                                  ['thingsboard', 'security', 'type'],
                                  'tlsPrivateKey'
                                )
                              }
                              className={`border-b-0 border-r last:border-r-0 ${
                                securityType === 'tlsPrivateKey'
                                  ? 'bg-surface-200 text-foreground'
                                  : 'text-foreground-light'
                              }`}
                            >
                              tlsPrivateKey
                            </ButtonGroupItem>
                          </ButtonGroup>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                          {showAccessToken && (
                            <div className="space-y-1 md:col-span-2">
                              <Label_Shadcn_ htmlFor="tb-security-access-token" className="text-xs text-foreground-light"><span>Access token</span><HelpIconTooltip content="Enter Access token." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="tb-security-access-token"
                                value={getConfigValue(
                                  ['thingsboard', 'security', 'accessToken'],
                                  ''
                                )}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['thingsboard', 'security', 'accessToken'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                          {showUsernamePassword && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="tb-security-username" className="text-xs text-foreground-light"><span>Username</span><HelpIconTooltip content="Enter Username." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="tb-security-username"
                                value={getConfigValue(['thingsboard', 'security', 'username'], '')}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['thingsboard', 'security', 'username'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                          {showUsernamePassword && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="tb-security-password" className="text-xs text-foreground-light"><span>Password</span><HelpIconTooltip content="Enter Password." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="tb-security-password"
                                type="password"
                                value={getConfigValue(['thingsboard', 'security', 'password'], '')}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['thingsboard', 'security', 'password'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                          {showUsernamePassword && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="tb-security-client-id" className="text-xs text-foreground-light"><span>Client ID</span><HelpIconTooltip content="Enter Client ID." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="tb-security-client-id"
                                value={getConfigValue(['thingsboard', 'security', 'clientId'], '')}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['thingsboard', 'security', 'clientId'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                          {showTlsFields && (
                            <div className="space-y-1 md:col-span-2">
                              <Label_Shadcn_ htmlFor="tb-security-ca-cert" className="text-xs text-foreground-light"><span>CA certificate path</span><HelpIconTooltip content="Enter CA certificate path." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="tb-security-ca-cert"
                                value={getConfigValue(['thingsboard', 'security', 'caCert'], '')}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['thingsboard', 'security', 'caCert'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                          {showTlsFields && (
                            <div className="space-y-1 md:col-span-2">
                              <Label_Shadcn_ htmlFor="tb-security-client-cert" className="text-xs text-foreground-light"><span>Client certificate path</span><HelpIconTooltip content="Enter Client certificate path." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="tb-security-client-cert"
                                value={getConfigValue(['thingsboard', 'security', 'cert'], '')}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['thingsboard', 'security', 'cert'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                          {showTlsFields && (
                            <div className="space-y-1 md:col-span-2">
                              <Label_Shadcn_ htmlFor="tb-security-private-key" className="text-xs text-foreground-light"><span>Private key path</span><HelpIconTooltip content="Enter Private key path." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="tb-security-private-key"
                                value={getConfigValue(
                                  ['thingsboard', 'security', 'privateKey'],
                                  ''
                                )}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['thingsboard', 'security', 'privateKey'],
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent_Shadcn_>
                    <TabsContent_Shadcn_ value="logs" className="space-y-6">
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          
                          <div className="space-y-1 md:col-span-2">
                            <Label_Shadcn_ htmlFor="logs-date-format" className="text-xs text-foreground-light"><span>Date format *</span><HelpIconTooltip content="Enter Date format." /></Label_Shadcn_>
                            <Input_Shadcn_
                              id="logs-date-format"
                              required
                              value={getConfigValue(['logs', 'dateFormat'], '%Y-%m-%d %H:%M:%S')}
                              onChange={(event) =>
                                updateConfigValue(['logs', 'dateFormat'], event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label_Shadcn_ htmlFor="logs-format" className="text-xs text-foreground-light"><span>Log format *</span><HelpIconTooltip content="Enter Log format." /></Label_Shadcn_>
                            <Textarea
                              id="logs-format"
                              value={getConfigValue(
                                ['logs', 'format'],
                                '%(asctime)s.%(msecs)03d - |%(levelname)s| - [%(filename)s] - %(module)s - %(funcName)s - %(lineno)d - %(message)s'
                              )}
                              onChange={(event) =>
                                updateConfigValue(['logs', 'format'], event.target.value)
                              }
                              rows={3}
                            />
                          </div>
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Remote log</CardTitle>
                              <Switch
                                checked={remoteLogsEnabled}
                                onCheckedChange={(value) =>
                                  updateConfigValue(['logs', 'remote', 'enabled'], value)
                                }
                              />
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm text-foreground-light">
                                Send gateway logs to ThingsBoard.
                              </p>
                              {remoteLogsEnabled && (
                                <div className="space-y-1">
                                  <Label_Shadcn_ className="text-xs text-foreground-light">
                                    <span>Remote log level</span>
                                    <HelpIconTooltip content="Minimum level for logs sent to the server." />
                                  </Label_Shadcn_>
                                  <Select_Shadcn_
                                    value={getConfigValue(['logs', 'remote', 'level'], 'INFO')}
                                    onValueChange={(value) =>
                                      updateConfigValue(['logs', 'remote', 'level'], value)
                                    }
                                  >
                                    <SelectTrigger_Shadcn_ size="small">
                                      <SelectValue_Shadcn_ placeholder="Select log level" />
                                    </SelectTrigger_Shadcn_>
                                    <SelectContent_Shadcn_>
                                      <SelectItem_Shadcn_ value="DEBUG">DEBUG</SelectItem_Shadcn_>
                                      <SelectItem_Shadcn_ value="INFO">INFO</SelectItem_Shadcn_>
                                      <SelectItem_Shadcn_ value="WARNING">WARNING</SelectItem_Shadcn_>
                                      <SelectItem_Shadcn_ value="ERROR">ERROR</SelectItem_Shadcn_>
                                    </SelectContent_Shadcn_>
                                  </Select_Shadcn_>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          {remoteLogsEnabled && (
                            <div className="space-y-1">
                              <Label_Shadcn_ className="text-xs text-foreground-light">
                                <span>Remote log level</span>
                                <HelpIconTooltip content="Minimum level for logs sent to the server." />
                              </Label_Shadcn_>
                              <Select_Shadcn_
                                value={getConfigValue(['logs', 'remote', 'level'], 'INFO')}
                                onValueChange={(value) =>
                                  updateConfigValue(['logs', 'remote', 'level'], value)
                                }
                              >
                                <SelectTrigger_Shadcn_ size="small">
                                  <SelectValue_Shadcn_ placeholder="Select log level" />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectItem_Shadcn_ value="DEBUG">DEBUG</SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="INFO">INFO</SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="WARNING">WARNING</SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="ERROR">ERROR</SelectItem_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </div>
                          )}
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Local logging</CardTitle>
                              <ButtonGroup className="inline-flex w-auto flex-row flex-wrap border border-control rounded-md overflow-hidden">
                                {LOCAL_LOGGING_TYPES.map((type) => (
                                  <ButtonGroupItem
                                    key={type.value}
                                    size="tiny"
                                    onClick={() =>
                                      updateConfigValue(['logs', 'local', 'type'], type.value)
                                    }
                                    className={`border-b-0 border-r last:border-r-0 ${
                                      localLoggingType === type.value
                                        ? 'bg-surface-200 text-foreground'
                                        : 'text-foreground-light'
                                    }`}
                                  >
                                    {type.label}
                                  </ButtonGroupItem>
                                ))}
                              </ButtonGroup>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-3">
                              <div className="space-y-1">
                                <Label_Shadcn_ className="text-xs text-foreground-light">
                                  <span>Log level *</span>
                                  <HelpIconTooltip content="Minimum level for logs written locally." />
                                </Label_Shadcn_>
                                <Select_Shadcn_
                                  value={localLogLevelValue}
                                  onValueChange={(value) =>
                                    updateConfigValue(
                                      ['logs', 'local', 'configs', localLoggingType, 'level'],
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger_Shadcn_ size="small">
                                    <SelectValue_Shadcn_ placeholder="Select log level" />
                                  </SelectTrigger_Shadcn_>
                                  <SelectContent_Shadcn_>
                                    <SelectItem_Shadcn_ value="DEBUG">DEBUG</SelectItem_Shadcn_>
                                    <SelectItem_Shadcn_ value="INFO">INFO</SelectItem_Shadcn_>
                                    <SelectItem_Shadcn_ value="WARNING">WARNING</SelectItem_Shadcn_>
                                    <SelectItem_Shadcn_ value="ERROR">ERROR</SelectItem_Shadcn_>
                                  </SelectContent_Shadcn_>
                                </Select_Shadcn_>
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <Label_Shadcn_ htmlFor="logs-file-path" className="text-xs text-foreground-light"><span>File path *</span><HelpIconTooltip content="Absolute or relative path to the log file." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="logs-file-path"
                                  value={localLogFilePathValue}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['logs', 'local', 'configs', localLoggingType, 'filePath'],
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="logs-saving-period-value" className="text-xs text-foreground-light"><span>Log saving period *</span><HelpIconTooltip content="How long to keep log files for this category." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="logs-saving-period-value"
                                  type="number"
                                  value={String(localLogPeriodValue)}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      [
                                        'logs',
                                        'local',
                                        'configs',
                                        localLoggingType,
                                        'savingPeriod',
                                        'value',
                                      ],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ className="text-xs text-foreground-light">
                                  <span>Unit *</span>
                                  <HelpIconTooltip content="Time unit for the log saving period." />
                                </Label_Shadcn_>
                                <Select_Shadcn_
                                  value={localLogPeriodUnit}
                                  onValueChange={(value) =>
                                    updateConfigValue(
                                      [
                                        'logs',
                                        'local',
                                        'configs',
                                        localLoggingType,
                                        'savingPeriod',
                                        'unit',
                                      ],
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger_Shadcn_ size="small">
                                    <SelectValue_Shadcn_ placeholder="Select unit" />
                                  </SelectTrigger_Shadcn_>
                                  <SelectContent_Shadcn_>
                                    {LOCAL_LOG_PERIOD_UNITS.map((unit) => (
                                      <SelectItem_Shadcn_
                                        key={unit.value}
                                        value={unit.value}
                                        className="text-xs"
                                      >
                                        {unit.label}
                                      </SelectItem_Shadcn_>
                                    ))}
                                  </SelectContent_Shadcn_>
                                </Select_Shadcn_>
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="logs-backup-count" className="text-xs text-foreground-light"><span>Backup count *</span><HelpIconTooltip content="Maximum number of rotated log files to keep." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="logs-backup-count"
                                  type="number"
                                  value={String(localLogBackupCount)}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      [
                                        'logs',
                                        'local',
                                        'configs',
                                        localLoggingType,
                                        'backupCount',
                                      ],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent_Shadcn_>
                    <TabsContent_Shadcn_ value="storage" className="space-y-6">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                          <CardTitle>Storage</CardTitle>
                          <ButtonGroup className="inline-flex w-auto flex-row flex-wrap border border-control rounded-md overflow-hidden">
                            <ButtonGroupItem
                              size="tiny"
                              onClick={() => updateConfigValue(['storage', 'type'], 'memory')}
                              className={`border-b-0 border-r last:border-r-0 ${
                                storageType === 'memory'
                                  ? 'bg-surface-200 text-foreground'
                                  : 'text-foreground-light'
                              }`}
                            >
                              Memory
                            </ButtonGroupItem>
                            <ButtonGroupItem
                              size="tiny"
                              onClick={() => updateConfigValue(['storage', 'type'], 'file')}
                              className={`border-b-0 border-r last:border-r-0 ${
                                storageType === 'file'
                                  ? 'bg-surface-200 text-foreground'
                                  : 'text-foreground-light'
                              }`}
                            >
                              File
                            </ButtonGroupItem>
                            <ButtonGroupItem
                              size="tiny"
                              onClick={() => updateConfigValue(['storage', 'type'], 'sqlite')}
                              className={`border-b-0 border-r last:border-r-0 ${
                                storageType === 'sqlite'
                                  ? 'bg-surface-200 text-foreground'
                                  : 'text-foreground-light'
                              }`}
                            >
                              Sqlite
                            </ButtonGroupItem>
                          </ButtonGroup>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                          {showMemoryStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-read-records" className="text-xs text-foreground-light"><span>Read records count</span><HelpIconTooltip content="Count of messages to get from storage and send to ThingsBoard." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-read-records"
                                type="number"
                                value={String(getConfigValue(['storage', 'read_records_count'], 10))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'read_records_count'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showMemoryStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-max-records" className="text-xs text-foreground-light"><span>Max records count</span><HelpIconTooltip content="Maximum count of data in storage before send to ThingsBoard." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-max-records"
                                type="number"
                                value={String(getConfigValue(['storage', 'max_records_count'], 100))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'max_records_count'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showFileStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-data-folder" className="text-xs text-foreground-light"><span>Data folder path</span><HelpIconTooltip content="Path to folder, that will contains data (Relative or Absolute)." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-data-folder"
                                value={getConfigValue(['storage', 'data_folder_path'], './data/')}
                                onChange={(event) =>
                                  updateConfigValue(['storage', 'data_folder_path'], event.target.value)
                                }
                              />
                            </div>
                          )}
                          {showFileStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-max-file-count" className="text-xs text-foreground-light"><span>Max file count</span><HelpIconTooltip content="Maximum count of file that will be saved." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-max-file-count"
                                type="number"
                                value={String(getConfigValue(['storage', 'max_file_count'], 5))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'max_file_count'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showFileStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-max-records-file" className="text-xs text-foreground-light"><span>Max records per file</span><HelpIconTooltip content="Maximum count of records that will be stored in one file." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-max-records-file"
                                type="number"
                                value={String(getConfigValue(['storage', 'max_records_per_file'], 14))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'max_records_per_file'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showFileStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-max-read-records" className="text-xs text-foreground-light"><span>Max read records count</span><HelpIconTooltip content="Count of messages to get from storage and send to ThingsBoard." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-max-read-records"
                                type="number"
                                value={String(getConfigValue(['storage', 'max_read_records_count'], 6))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'max_read_records_count'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showSqliteStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-data-file-path" className="text-xs text-foreground-light"><span>Data file path</span><HelpIconTooltip content="Path to the directory that will contain database files (no filename). A trailing path separator is required." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-data-file-path"
                                value={getConfigValue(['storage', 'data_file_path'], './data/')}
                                onChange={(event) =>
                                  updateConfigValue(['storage', 'data_file_path'], event.target.value)
                                }
                              />
                            </div>
                          )}
                          {showSqliteStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-writing-batch" className="text-xs text-foreground-light"><span>Writing batch size</span><HelpIconTooltip content="Maximum number of messages collected before writing to the DB during single write request." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-writing-batch"
                                type="number"
                                value={String(getConfigValue(['storage', 'writing_batch_size'], 1000))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'writing_batch_size'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showSqliteStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-max-read-records" className="text-xs text-foreground-light"><span>Max read records count</span><HelpIconTooltip content="Maximum number of messages to get from storage and send to ThingsBoard." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-max-read-records"
                                type="number"
                                value={String(getConfigValue(['storage', 'max_read_records_count'], 1000))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'max_read_records_count'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showSqliteStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-messages-ttl-check" className="text-xs text-foreground-light"><span>Messages TTL check (hours)</span><HelpIconTooltip content="How often will Gateway check data for obsolescence." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-messages-ttl-check"
                                type="number"
                                value={String(
                                  getConfigValue(['storage', 'messages_ttl_check_in_hours'], 1)
                                )}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'messages_ttl_check_in_hours'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showSqliteStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-messages-ttl-days" className="text-xs text-foreground-light"><span>Messages TTL (days)</span><HelpIconTooltip content="How many days to retain messages in each DB before automatic deletion." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-messages-ttl-days"
                                type="number"
                                value={String(getConfigValue(['storage', 'messages_ttl_in_days'], 7))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'messages_ttl_in_days'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showSqliteStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-size-limit" className="text-xs text-foreground-light"><span>Size limit (MB)</span><HelpIconTooltip content="Maximum size of each SQLite file in megabytes. When exceeded, triggers rotation to a new DB file." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-size-limit"
                                type="number"
                                value={String(getConfigValue(['storage', 'size_limit'], 1024))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'size_limit'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showSqliteStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-max-db-amount" className="text-xs text-foreground-light"><span>Max DB amount</span><HelpIconTooltip content="Maximum number of rotated DB files to keep on disk. When reached, further writes are dropped until cleanup." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-max-db-amount"
                                type="number"
                                value={String(getConfigValue(['storage', 'max_db_amount'], 10))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'max_db_amount'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                          {showSqliteStorage && (
                            <div className="space-y-1">
                              <Label_Shadcn_ htmlFor="storage-oversize-check" className="text-xs text-foreground-light"><span>Oversize check period (min)</span><HelpIconTooltip content="How frequently (in minutes) to check the current DB’s file size against size_limit." /></Label_Shadcn_>
                              <Input_Shadcn_
                                id="storage-oversize-check"
                                type="number"
                                value={String(getConfigValue(['storage', 'oversize_check_period'], 1))}
                                onChange={(event) =>
                                  updateConfigValue(
                                    ['storage', 'oversize_check_period'],
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                   </TabsContent_Shadcn_>
                    <TabsContent_Shadcn_ value="grpc" className="space-y-6">
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>gRPC</CardTitle>
                              <Switch
                                checked={grpcEnabled}
                                onCheckedChange={(value) =>
                                  updateConfigValue(['grpc', 'enabled'], value)
                                }
                              />
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                              <div className="md:col-span-2">
                                <Checkbox
                                  label={
                                    <span>
                                      Permit without calls
                                      <HelpIconTooltip content="Allow keepalive pings without active calls." />
                                    </span>
                                  }
                                  id="grpc-permit-without-calls"
                                  name="grpc-permit-without-calls"
                                  disabled={!grpcEnabled}
                                  checked={!!getConfigValue(
                                    ['grpc', 'keepAlivePermitWithoutCalls'],
                                    true
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['grpc', 'keepAlivePermitWithoutCalls'],
                                      event.target.checked
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="grpc-server-port" className="text-xs text-foreground-light"><span>Server port</span><HelpIconTooltip content="Enter Server port." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="grpc-server-port"
                                  type="number"
                                  disabled={!grpcEnabled}
                                  value={String(getConfigValue(['grpc', 'serverPort'], 9595))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['grpc', 'serverPort'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="grpc-keepalive-time" className="text-xs text-foreground-light"><span>Keep alive time (ms)</span><HelpIconTooltip content="Enter Keep alive time (ms)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="grpc-keepalive-time"
                                  type="number"
                                  disabled={!grpcEnabled}
                                  value={String(getConfigValue(['grpc', 'keepAliveTimeMs'], 10001))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['grpc', 'keepAliveTimeMs'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="grpc-keepalive-timeout" className="text-xs text-foreground-light"><span>Keep alive timeout (ms)</span><HelpIconTooltip content="Enter Keep alive timeout (ms)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="grpc-keepalive-timeout"
                                  type="number"
                                  disabled={!grpcEnabled}
                                  value={String(getConfigValue(['grpc', 'keepAliveTimeoutMs'], 5000))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['grpc', 'keepAliveTimeoutMs'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="grpc-max-pings" className="text-xs text-foreground-light"><span>Max pings without data</span><HelpIconTooltip content="Enter Max pings without data." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="grpc-max-pings"
                                  type="number"
                                  disabled={!grpcEnabled}
                                  value={String(getConfigValue(['grpc', 'maxPingsWithoutData'], 0))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['grpc', 'maxPingsWithoutData'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="grpc-min-time-between" className="text-xs text-foreground-light"><span>Min time between pings (ms)</span><HelpIconTooltip content="Enter Min time between pings (ms)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="grpc-min-time-between"
                                  type="number"
                                  disabled={!grpcEnabled}
                                  value={String(getConfigValue(['grpc', 'minTimeBetweenPingsMs'], 10000))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['grpc', 'minTimeBetweenPingsMs'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="grpc-min-ping-interval" className="text-xs text-foreground-light"><span>Min ping interval without data (ms)</span><HelpIconTooltip content="Enter Min ping interval without data (ms)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="grpc-min-ping-interval"
                                  type="number"
                                  disabled={!grpcEnabled}
                                  value={String(
                                    getConfigValue(['grpc', 'minPingIntervalWithoutDataMs'], 5000)
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['grpc', 'minPingIntervalWithoutDataMs'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent_Shadcn_>
                    <TabsContent_Shadcn_ value="statistics" className="space-y-6">
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Statistics</CardTitle>
                              <Switch
                                checked={!!getConfigValue(
                                  ['thingsboard', 'statistics', 'enable'],
                                  true
                                )}
                                onCheckedChange={(value) =>
                                  updateConfigValue(['thingsboard', 'statistics', 'enable'], value)
                                }
                              />
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-stats-send" className="text-xs text-foreground-light"><span>Stats send period (sec) *</span><HelpIconTooltip content="Enter Stats send period (sec)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-stats-send"
                                  type="number"
                                  required
                                  value={String(
                                    getConfigValue(
                                      ['thingsboard', 'statistics', 'statsSendPeriodInSeconds'],
                                      60
                                    )
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'statistics', 'statsSendPeriodInSeconds'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Custom statistics</CardTitle>
                              <Switch
                                checked={customStatisticsEnabled}
                                onCheckedChange={(value) =>
                                  updateConfigValue(
                                    ['thingsboard', 'statistics', 'enableCustom'],
                                    value
                                  )
                                }
                              />
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                              <p className="text-sm text-foreground-light md:col-span-2">
                                Run custom commands and push their output as telemetry.
                              </p>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-custom-stats-send" className="text-xs text-foreground-light"><span>Custom stats period (sec) *</span><HelpIconTooltip content="Enter Custom stats period (sec)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-custom-stats-send"
                                  type="number"
                                  required
                                  value={String(
                                    getConfigValue(
                                      ['thingsboard', 'statistics', 'customStatsSendPeriodInSeconds'],
                                      3600
                                    )
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'statistics', 'customStatsSendPeriodInSeconds'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-statistics-config" className="text-xs text-foreground-light"><span>Configuration file</span><HelpIconTooltip content="Statistics configuration file stored on the gateway." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-statistics-config"
                                  value={getConfigValue(
                                    ['thingsboard', 'statistics', 'configuration'],
                                    'statistics.json'
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'statistics', 'configuration'],
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              {customStatisticsEnabled && (
                                <div className="space-y-3 md:col-span-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-foreground">Commands</p>
                                    <Button
                                      size="tiny"
                                      type="default"
                                      onClick={() => {
                                        const current = getConfigValue(
                                          ['thingsboard', 'statistics', 'commands'],
                                          []
                                        )
                                        const next = Array.isArray(current) ? [...current] : []
                                        next.push({
                                          attributeOnGateway: '',
                                          timeout: 5,
                                          command: '',
                                          installCmd: '',
                                        })
                                        updateConfigValue(
                                          ['thingsboard', 'statistics', 'commands'],
                                          next
                                        )
                                      }}
                                    >
                                      Add command
                                    </Button>
                                  </div>
                                  <p className="text-xs text-foreground-light">
                                    Each command runs on the gateway host at the custom statistics interval.
                                    The command output (stdout) is sent as telemetry under the provided time
                                    series name. If the output is numeric, it is stored as a number.
                                    Install command runs once to install dependencies.
                                  </p>
                                  {(Array.isArray(
                                    getConfigValue(['thingsboard', 'statistics', 'commands'], [])
                                  )
                                    ? getConfigValue(['thingsboard', 'statistics', 'commands'], [])
                                    : []
                                  ).map((commandItem: any, index: number) => (
                                    <div
                                      key={`stats-command-${index}`}
                                      className="rounded-md border border-control/60 p-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-foreground-light">
                                          Command {index + 1}
                                        </p>
                                        <Button
                                          size="tiny"
                                          type="default"
                                          onClick={() => {
                                            const current = getConfigValue(
                                              ['thingsboard', 'statistics', 'commands'],
                                              []
                                            )
                                            if (!Array.isArray(current)) return
                                            const next = [...current]
                                            next.splice(index, 1)
                                            updateConfigValue(
                                              ['thingsboard', 'statistics', 'commands'],
                                              next
                                            )
                                          }}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                          <Label_Shadcn_
                                            htmlFor={`stats-command-name-${index}`}
                                            className="text-xs text-foreground-light"
                                          >
                                            <span>Time series name *</span>
                                            <HelpIconTooltip content="Telemetry key that will store the command output." />
                                          </Label_Shadcn_>
                                        <Input_Shadcn_
                                          id={`stats-command-name-${index}`}
                                          required
                                          value={commandItem?.attributeOnGateway ?? ''}
                                          onChange={(event) => {
                                            const current = getConfigValue(
                                              ['thingsboard', 'statistics', 'commands'],
                                              []
                                              )
                                              if (!Array.isArray(current)) return
                                              const next = [...current]
                                              next[index] = {
                                                ...next[index],
                                                attributeOnGateway: event.target.value,
                                              }
                                              updateConfigValue(
                                                ['thingsboard', 'statistics', 'commands'],
                                                next
                                              )
                                            }}
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label_Shadcn_
                                            htmlFor={`stats-command-timeout-${index}`}
                                            className="text-xs text-foreground-light"
                                          >
                                            <span>Timeout (in sec) *</span>
                                            <HelpIconTooltip content="Maximum time allowed for the command to execute." />
                                          </Label_Shadcn_>
                                        <Input_Shadcn_
                                          id={`stats-command-timeout-${index}`}
                                          type="number"
                                          required
                                          value={String(commandItem?.timeout ?? 5)}
                                          onChange={(event) => {
                                            const current = getConfigValue(
                                              ['thingsboard', 'statistics', 'commands'],
                                              []
                                              )
                                              if (!Array.isArray(current)) return
                                              const next = [...current]
                                              next[index] = {
                                                ...next[index],
                                                timeout: Number(event.target.value),
                                              }
                                              updateConfigValue(
                                                ['thingsboard', 'statistics', 'commands'],
                                                next
                                              )
                                            }}
                                          />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                          <Label_Shadcn_
                                            htmlFor={`stats-command-cmd-${index}`}
                                            className="text-xs text-foreground-light"
                                          >
                                            <span>Command *</span>
                                            <HelpIconTooltip content="Shell command to execute. The command output becomes the time series value." />
                                          </Label_Shadcn_>
                                        <Input_Shadcn_
                                          id={`stats-command-cmd-${index}`}
                                          required
                                          value={commandItem?.command ?? ''}
                                          onChange={(event) => {
                                            const current = getConfigValue(
                                              ['thingsboard', 'statistics', 'commands'],
                                              []
                                              )
                                              if (!Array.isArray(current)) return
                                              const next = [...current]
                                              next[index] = {
                                                ...next[index],
                                                command: event.target.value,
                                              }
                                              updateConfigValue(
                                                ['thingsboard', 'statistics', 'commands'],
                                                next
                                              )
                                            }}
                                          />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                          <Label_Shadcn_
                                            htmlFor={`stats-command-install-${index}`}
                                            className="text-xs text-foreground-light"
                                          >
                                            <span>Install command</span>
                                            <HelpIconTooltip content="Optional command to install dependencies before collecting statistics." />
                                          </Label_Shadcn_>
                                          <Input_Shadcn_
                                            id={`stats-command-install-${index}`}
                                            value={commandItem?.installCmd ?? ''}
                                            onChange={(event) => {
                                              const current = getConfigValue(
                                                ['thingsboard', 'statistics', 'commands'],
                                                []
                                              )
                                              if (!Array.isArray(current)) return
                                              const next = [...current]
                                              next[index] = {
                                                ...next[index],
                                                installCmd: event.target.value,
                                              }
                                              updateConfigValue(
                                                ['thingsboard', 'statistics', 'commands'],
                                                next
                                              )
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent_Shadcn_>
                    <TabsContent_Shadcn_ value="other" className="space-y-6">
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div />
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Advanced</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-min-pack-delay" className="text-xs text-foreground-light"><span>Min pack send delay (ms)</span><HelpIconTooltip content="Enter Min pack send delay (ms)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-min-pack-delay"
                                  type="number"
                                  value={String(getConfigValue(['thingsboard', 'minPackSendDelayMS'], 50))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'minPackSendDelayMS'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-qos" className="text-xs text-foreground-light">
                                  <span>QoS</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 inline-flex align-middle">
                                        <HelpCircle size={12} strokeWidth={1.5} />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      MQTT QoS level for gateway messages (0, 1, or 2).
                                    </TooltipContent>
                                  </Tooltip>
                                </Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-qos"
                                  type="number"
                                  value={String(getConfigValue(['thingsboard', 'qos'], 1))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'qos'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-check-connectors" className="text-xs text-foreground-light"><span>Check connectors (sec)</span><HelpIconTooltip content="Enter Check connectors (sec)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-check-connectors"
                                  type="number"
                                  value={String(
                                    getConfigValue(
                                      ['thingsboard', 'checkConnectorsConfigurationInSeconds'],
                                      60
                                    )
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'checkConnectorsConfigurationInSeconds'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-max-payload" className="text-xs text-foreground-light"><span>Max payload (bytes)</span><HelpIconTooltip content="Enter Max payload (bytes)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-max-payload"
                                  type="number"
                                  value={String(
                                    getConfigValue(['thingsboard', 'maxPayloadSizeBytes'], 8196)
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'maxPayloadSizeBytes'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-min-pack-size" className="text-xs text-foreground-light"><span>Min pack size</span><HelpIconTooltip content="Enter Min pack size." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-min-pack-size"
                                  type="number"
                                  value={String(getConfigValue(['thingsboard', 'minPackSizeToSend'], 500))}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'minPackSizeToSend'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Additional</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                              <div>
                                <Checkbox
                                  label={
                                    <span>
                                      Latency debug
                                      <HelpIconTooltip content="Include latency diagnostics in logs." />
                                    </span>
                                  }
                                  id="tb-latency-debug"
                                  name="tb-latency-debug"
                                  checked={!!getConfigValue(
                                    ['thingsboard', 'latencyDebugMode'],
                                    false
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'latencyDebugMode'],
                                      event.target.checked
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Checkbox
                                  label={
                                    <span>
                                      Handle device renaming
                                      <HelpIconTooltip content="Allow the gateway to rename devices." />
                                    </span>
                                  }
                                  id="tb-handle-device-renaming"
                                  name="tb-handle-device-renaming"
                                  checked={!!getConfigValue(
                                    ['thingsboard', 'handleDeviceRenaming'],
                                    true
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'handleDeviceRenaming'],
                                      event.target.checked
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Checkbox
                                  label={
                                    <span>
                                      Device filtering
                                      <HelpIconTooltip content="Enable allow/deny list filtering for devices." />
                                    </span>
                                  }
                                  id="tb-device-filtering"
                                  name="tb-device-filtering"
                                  checked={!!getConfigValue(
                                    ['thingsboard', 'deviceFiltering', 'enable'],
                                    false
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'deviceFiltering', 'enable'],
                                      event.target.checked
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-device-filter-file" className="text-xs text-foreground-light"><span>Device filter file</span><HelpIconTooltip content="Enter Device filter file." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-device-filter-file"
                                  value={getConfigValue(
                                    ['thingsboard', 'deviceFiltering', 'filterFile'],
                                    'list.json'
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'deviceFiltering', 'filterFile'],
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Check device activity</CardTitle>
                              <Switch
                                checked={
                                  !!getConfigValue(
                                    [
                                      'thingsboard',
                                      'checkingDeviceActivity',
                                      'checkDeviceInactivity',
                                    ],
                                    false
                                  )
                                }
                                onCheckedChange={(value) =>
                                  updateConfigValue(
                                    [
                                      'thingsboard',
                                      'checkingDeviceActivity',
                                      'checkDeviceInactivity',
                                    ],
                                    value
                                  )
                                }
                              />
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-inactivity-timeout" className="text-xs text-foreground-light"><span>Inactivity timeout (sec)</span><HelpIconTooltip content="Enter Inactivity timeout (sec)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-inactivity-timeout"
                                  type="number"
                                  disabled={
                                    !getConfigValue(
                                      [
                                        'thingsboard',
                                        'checkingDeviceActivity',
                                        'checkDeviceInactivity',
                                      ],
                                      false
                                    )
                                  }
                                  value={String(
                                    getConfigValue(
                                      ['thingsboard', 'checkingDeviceActivity', 'inactivityTimeoutSeconds'],
                                      300
                                    )
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'checkingDeviceActivity', 'inactivityTimeoutSeconds'],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-inactivity-period" className="text-xs text-foreground-light"><span>Inactivity check period (sec)</span><HelpIconTooltip content="Enter Inactivity check period (sec)." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-inactivity-period"
                                  type="number"
                                  disabled={
                                    !getConfigValue(
                                      [
                                        'thingsboard',
                                        'checkingDeviceActivity',
                                        'checkDeviceInactivity',
                                      ],
                                      false
                                    )
                                  }
                                  value={String(
                                    getConfigValue(
                                      [
                                        'thingsboard',
                                        'checkingDeviceActivity',
                                        'inactivityCheckPeriodSeconds',
                                      ],
                                      10
                                    )
                                  )}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      [
                                        'thingsboard',
                                        'checkingDeviceActivity',
                                        'inactivityCheckPeriodSeconds',
                                      ],
                                      Number(event.target.value)
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                              <CardTitle>Limits</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-rate-limits" className="text-xs text-foreground-light"><span>Rate limits</span><HelpIconTooltip content="Enter Rate limits." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-rate-limits"
                                  value={getConfigValue(['thingsboard', 'rateLimits'], '')}
                                  onChange={(event) =>
                                    updateConfigValue(['thingsboard', 'rateLimits'], event.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-dp-rate-limits" className="text-xs text-foreground-light"><span>DP rate limits</span><HelpIconTooltip content="Enter DP rate limits." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-dp-rate-limits"
                                  value={getConfigValue(['thingsboard', 'dpRateLimits'], '')}
                                  onChange={(event) =>
                                    updateConfigValue(['thingsboard', 'dpRateLimits'], event.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-messages-rate-limits" className="text-xs text-foreground-light"><span>Messages rate limits</span><HelpIconTooltip content="Enter Messages rate limits." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-messages-rate-limits"
                                  value={getConfigValue(['thingsboard', 'messagesRateLimits'], '')}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'messagesRateLimits'],
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-device-messages-rate-limits" className="text-xs text-foreground-light"><span>Device messages limits</span><HelpIconTooltip content="Enter Device messages limits." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-device-messages-rate-limits"
                                  value={getConfigValue(['thingsboard', 'deviceMessagesRateLimits'], '')}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'deviceMessagesRateLimits'],
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-device-rate-limits" className="text-xs text-foreground-light"><span>Device rate limits</span><HelpIconTooltip content="Enter Device rate limits." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-device-rate-limits"
                                  value={getConfigValue(['thingsboard', 'deviceRateLimits'], '')}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'deviceRateLimits'],
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label_Shadcn_ htmlFor="tb-device-dp-rate-limits" className="text-xs text-foreground-light"><span>Device DP rate limits</span><HelpIconTooltip content="Enter Device DP rate limits." /></Label_Shadcn_>
                                <Input_Shadcn_
                                  id="tb-device-dp-rate-limits"
                                  value={getConfigValue(['thingsboard', 'deviceDpRateLimits'], '')}
                                  onChange={(event) =>
                                    updateConfigValue(
                                      ['thingsboard', 'deviceDpRateLimits'],
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent_Shadcn_>
                  </Tabs_Shadcn_>
                </div>
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="connectors" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Connectors</CardTitle>
                  <Button size="tiny" type="primary" onClick={() => handleOpenConnectorDialog()}>
                    New connector
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    ref={connectorUploadRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleConnectorFileChange}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead>Last seen</TableHead>
                        <TableHead className="w-48">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {connectors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-sm text-foreground-light">
                            No connectors configured yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        connectors.map((connector) => (
                          <TableRow key={connector.id}>
                            <TableCell>{connector.name}</TableCell>
                            <TableCell>{connector.type}</TableCell>
                            <TableCell>{connector.status ?? '--'}</TableCell>
                            <TableCell>{connector.enabled ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{formatDate(connector.last_seen_at)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="tiny"
                                  type="default"
                                  onClick={() => handleOpenConnectorDialog(connector)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="tiny"
                                  type="default"
                                  onClick={() => handleDownloadConnectorConfig(connector)}
                                >
                                  Download
                                </Button>
                                <Button
                                  size="tiny"
                                  type="default"
                                  onClick={() => handleUploadConnectorConfig(connector)}
                                >
                                  Upload
                                </Button>
                                <Button
                                  size="tiny"
                                  type="danger"
                                  onClick={() => handleDeleteConnector(connector)}
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
              <ConnectorDialog
                open={connectorDialogOpen}
                onOpenChange={setConnectorDialogOpen}
                connector={editingConnector}
                onCreate={createConnector}
                onUpdate={updateConnector}
                gatewayId={gatewayId}
              />
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="logs" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Logs</CardTitle>
                  <Button size="tiny" type="primary" onClick={() => setLogDialogOpen(true)}>
                    Add log entry
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs text-foreground-light">Level</p>
                      <Select_Shadcn_
                        value={logLevelFilter || ALL_OPTION_VALUE}
                        onValueChange={(value) =>
                          setLogLevelFilter(value === ALL_OPTION_VALUE ? '' : value)
                        }
                      >
                        <SelectTrigger_Shadcn_ size="small">
                          <SelectValue_Shadcn_ placeholder="All levels" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value={ALL_OPTION_VALUE} className="text-xs">
                            All
                          </SelectItem_Shadcn_>
                          {LOG_LEVELS.map((level) => (
                            <SelectItem_Shadcn_
                              key={level.value}
                              value={level.value}
                              className="text-xs"
                            >
                              {level.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                  <div className="space-y-1">
                    <p className="text-xs text-foreground-light">Category</p>
                    <Select_Shadcn_
                      value={logCategoryFilter || ALL_OPTION_VALUE}
                      onValueChange={(value) =>
                        setLogCategoryFilter(value === ALL_OPTION_VALUE ? '' : value)
                        }
                      >
                        <SelectTrigger_Shadcn_ size="small">
                          <SelectValue_Shadcn_ placeholder="All categories" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value={ALL_OPTION_VALUE} className="text-xs">
                            All
                          </SelectItem_Shadcn_>
                          {LOG_CATEGORIES.map((category) => (
                            <SelectItem_Shadcn_
                              key={category.value}
                              value={category.value}
                              className="text-xs"
                            >
                              {category.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                  <div className="space-y-1">
                    <p className="text-xs text-foreground-light">Connector</p>
                    <Select_Shadcn_
                      value={logConnectorFilter || ALL_OPTION_VALUE}
                      onValueChange={(value) =>
                        setLogConnectorFilter(value === ALL_OPTION_VALUE ? '' : value)
                        }
                      >
                        <SelectTrigger_Shadcn_ size="small">
                          <SelectValue_Shadcn_ placeholder="All connectors" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value={ALL_OPTION_VALUE} className="text-xs">
                            All
                          </SelectItem_Shadcn_>
                          {connectors.map((connector) => (
                            <SelectItem_Shadcn_
                              key={connector.id}
                              value={connector.id.toString()}
                              className="text-xs"
                            >
                              {connector.name}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                  </div>
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
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-sm text-foreground-light">
                            No logs yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{formatDate(log.inserted_at)}</TableCell>
                            <TableCell>{log.level ?? 'info'}</TableCell>
                            <TableCell>{log.category ?? 'general'}</TableCell>
                            <TableCell>
                              {connectors.find((connector) => connector.id === log.connector_id)
                                ?.name ?? '--'}
                            </TableCell>
                            <TableCell>{log.message}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <LogDialog
                open={logDialogOpen}
                onOpenChange={setLogDialogOpen}
                gatewayId={gatewayId}
                connectors={connectors}
                onCreate={createLog}
              />
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="statistics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gateway statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-muted p-3">
                      <p className="text-xs text-foreground-light">Last online</p>
                      <p className="text-sm font-medium">{formatDate(gateway?.last_online_at)}</p>
                    </div>
                    <div className="rounded-md border border-muted p-3">
                      <p className="text-xs text-foreground-light">Receive data</p>
                      <p className="text-sm font-medium">
                        {gateway?.receive_data ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div className="rounded-md border border-muted p-3">
                      <p className="text-xs text-foreground-light">Connectors</p>
                      <p className="text-sm font-medium">
                        {statusStats.activeConnectorCount} active / {statusStats.connectorCount} total
                      </p>
                    </div>
                    <div className="rounded-md border border-muted p-3">
                      <p className="text-xs text-foreground-light">Last log</p>
                      <p className="text-sm font-medium">{statusStats.lastLogMessage}</p>
                      <p className="text-xs text-foreground-light">
                        {formatDate(statusStats.lastLogTime)}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-muted p-3">
                      <p className="text-xs text-foreground-light">Gateway session</p>
                      <pre className="mt-2 max-h-40 overflow-auto text-xs">
                        {JSON.stringify(gateway?.gateway_session ?? {}, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-md border border-muted p-3">
                      <p className="text-xs text-foreground-light">Gateway ingest</p>
                      <pre className="mt-2 max-h-40 overflow-auto text-xs">
                        {JSON.stringify(gateway?.gateway_ingest ?? {}, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-md border border-muted p-3">
                      <p className="text-xs text-foreground-light">Gateway connection</p>
                      <pre className="mt-2 max-h-40 overflow-auto text-xs">
                        {JSON.stringify(gateway?.gateway_connection ?? {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        </PageSectionContent>
      </PageSection>
      <SidePanel
        size="large"
        visible={deploymentPanelOpen}
        header="Deployment"
        onCancel={() => setDeploymentPanelOpen(false)}
        cancelText="Close"
      >
        <div className="space-y-4 px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground-light">
              Download a pre-configured docker-compose file for this gateway.
            </p>
            <Button size="tiny" type="default" onClick={handleDownloadCompose}>
              Download docker-compose
            </Button>
          </div>
          <div className="rounded-md border border-muted bg-background p-3 text-xs text-foreground">
            docker compose up -d
          </div>
        </div>
      </SidePanel>
      <SidePanel
        size="large"
        visible={configurationPanelOpen}
        header="Gateway configuration"
        onCancel={() => setConfigurationPanelOpen(false)}
        cancelText="Close"
        customFooter={
          <div className="flex w-full items-center justify-end gap-2 border-t border-default px-3 py-4">
            <Button type="default" onClick={() => setConfigurationPanelOpen(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSaveConfig}
              disabled={
                isSavingConfig || !configDirty || !areLogsRequiredFieldsValid || configView !== 'full'
              }
            >
              Save configuration
            </Button>
          </div>
        }
      >
        <div className="flex h-full flex-col gap-4 px-6 py-6">
          <div className="flex flex-wrap items-center justify-start gap-2">
            <Button size="tiny" type="default" onClick={handleDownloadGatewayConfig}>
              Download config
            </Button>
            <Button size="tiny" type="default" onClick={handleUploadGatewayConfig}>
              Upload config
            </Button>
            <Button size="tiny" type="default" onClick={handleResetGatewayConfig}>
              Load TB defaults
            </Button>
            <Button
              size="tiny"
              type="default"
              onClick={handlePublishConfig}
              disabled={isPublishingConfig}
            >
              Publish configuration
            </Button>
            <div className="ml-auto">
              <ButtonGroup size="tiny" className="bg-transparent">
                <ButtonGroupItem
                  active={configView === 'full'}
                  onClick={() => setConfigView('full')}
                >
                  Configuration
                </ButtonGroupItem>
                <ButtonGroupItem
                  active={configView === 'normalized'}
                  onClick={() => setConfigView('normalized')}
                >
                  Normalized config
                </ButtonGroupItem>
              </ButtonGroup>
            </div>
          </div>
          <input
            ref={configFileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleConfigFileChange}
          />
          <div className="gateway-config-editor flex-1 min-h-0 overflow-hidden rounded border border-muted bg-surface-200">
            <CodeEditor
              id="gateway-config-json"
              language="json"
              value={configView === 'normalized' ? normalizedConfigText : configText}
              onInputChange={(value) => {
                if (configView !== 'full') return
                setConfigText(value ?? '')
                setConfigDirty(true)
              }}
              options={{
                readOnly: configView !== 'full',
                wordWrap: 'on',
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                lineNumbers: 'on',
                glyphMargin: true,
                foldingHighlight: true,
                lineDecorationsWidth: 6,
                lineNumbersMinChars: 1,
              }}
            />
          </div>
        </div>
      </SidePanel>
      <TextConfirmModal
        size="medium"
        visible={remoteConfigConfirmOpen}
        onCancel={() => setRemoteConfigConfirmOpen(false)}
        onConfirm={() => {
          updateConfigValue(['thingsboard', 'remoteConfiguration'], false)
          setRemoteConfigConfirmOpen(false)
        }}
        title="Disable remote configuration"
        confirmString="disable"
        confirmLabel="Type disable to confirm"
        confirmPlaceholder="disable"
        variant="destructive"
        alert={{
          title: 'Remote configuration will be disabled',
          description: (
            <span className="prose text-sm">
              Disabling remote configuration prevents the platform from pushing updates to this
              gateway. Make sure this is intended before proceeding.
            </span>
          ),
        }}
      />
    </PageContainer>
  )
}

GatewayDetailsPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default GatewayDetailsPage

const ConnectorDialog = ({
  open,
  onOpenChange,
  connector,
  onCreate,
  onUpdate,
  gatewayId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  connector: IotGatewayConnector | null
  onCreate: (args: { gatewayId: string | number; payload: IotGatewayConnectorPayload }) => Promise<unknown>
  onUpdate: (args: {
    gatewayId: string | number
    connectorId: string | number
    payload: Partial<IotGatewayConnectorPayload>
  }) => Promise<unknown>
  gatewayId: number
}) => {
  const [name, setName] = useState('')
  const [type, setType] = useState(CONNECTOR_TYPES[0]?.value ?? 'MQTT')
  const [enabled, setEnabled] = useState(true)
  const [status, setStatus] = useState('')
  const [configText, setConfigText] = useState('{}')
  const [mqttConfig, setMqttConfig] = useState<Record<string, unknown> | null>(null)
  const [modbusConfig, setModbusConfig] = useState<Record<string, unknown> | null>(null)
  const [opcuaConfig, setOpcuaConfig] = useState<Record<string, unknown> | null>(null)
  const [loggingLevel, setLoggingLevel] = useState('INFO')
  const [fillDefaults, setFillDefaults] = useState(true)
  const [sendDataOnChange, setSendDataOnChange] = useState(false)
  const defaultsLoadedRef = useRef(false)
  const [showConnectorConfig, setShowConnectorConfig] = useState(false)
  const [connectorConfigEditorText, setConnectorConfigEditorText] = useState('')

  useEffect(() => {
    if (!open) return
    if (connector) {
      setName(connector.name)
      setType(connector.type)
      setEnabled(connector.enabled)
      setStatus(connector.status ?? '')
      setConfigText(JSON.stringify(connector.config ?? {}, null, 2))
      setMqttConfig(connector.type === 'MQTT' ? (connector.config ?? {}) : null)
      setModbusConfig(connector.type === 'MODBUS' ? (connector.config ?? {}) : null)
      setOpcuaConfig(connector.type === 'OPCUA' ? (connector.config ?? {}) : null)
      if (connector.type === 'MQTT') {
        setMqttConfig((prev) => ({ ...(prev ?? {}), enableRemoteLogging: true }))
      }
      const config = (connector.config ?? {}) as Record<string, unknown>
      setLoggingLevel(typeof config.logLevel === 'string' ? config.logLevel : 'INFO')
      setFillDefaults(false)
      setSendDataOnChange(Boolean(config.sendDataOnlyOnChange))
    } else {
      setName('')
      setType(CONNECTOR_TYPES[0]?.value ?? 'MQTT')
      setEnabled(true)
      setStatus('')
      setConfigText('{}')
      setMqttConfig(null)
      setModbusConfig(null)
      setOpcuaConfig(null)
      setLoggingLevel('INFO')
      setFillDefaults(true)
      setSendDataOnChange(false)
    }
    setShowConnectorConfig(false)
    setConnectorConfigEditorText('')
    defaultsLoadedRef.current = false
  }, [open, connector])

  useEffect(() => {
    if (!open) return
    if (connector) return
    if (!fillDefaults) return
    if (defaultsLoadedRef.current) return
    defaultsLoadedRef.current = true
    void handleLoadConnectorDefaults()
  }, [open, connector, type])

  useEffect(() => {
    if (!open) return
    if (type !== 'MQTT') return
    if (mqttConfig) return
    void (async () => {
      try {
        const template = await getIotGatewayConnectorTemplate('mqtt')
        setMqttConfig(template ?? {})
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load MQTT defaults.')
      }
    })()
  }, [open, type, mqttConfig])

  useEffect(() => {
    if (!open) return
    if (type !== 'MODBUS') return
    if (modbusConfig) return
    void (async () => {
      try {
        const template = await getIotGatewayConnectorTemplate('modbus')
        setModbusConfig(template ?? {})
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load Modbus defaults.')
      }
    })()
  }, [open, type, modbusConfig])

  useEffect(() => {
    if (!open) return
    if (type !== 'OPCUA') return
    if (opcuaConfig) return
    void (async () => {
      try {
        const template = await getIotGatewayConnectorTemplate('opcua')
        setOpcuaConfig(template ?? {})
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load OPCUA defaults.')
      }
    })()
  }, [open, type, opcuaConfig])

  const getActiveConnectorConfig = () => {
    if (type === 'MQTT') return mqttConfig ?? {}
    if (type === 'MODBUS') return modbusConfig ?? {}
    if (type === 'OPCUA') return opcuaConfig ?? {}
    try {
      return JSON.parse(configText || '{}')
    } catch (_) {
      return {}
    }
  }

  const handleConnectorConfigChange = (next?: string) => {
    const text = next ?? ''
    setConnectorConfigEditorText(text)
    if (type === 'MQTT') {
      try {
        const parsed = JSON.parse(text || '{}')
        setMqttConfig(parsed)
      } catch (_) {
        // ignore invalid json
      }
      return
    }
    if (type === 'MODBUS') {
      try {
        const parsed = JSON.parse(text || '{}')
        setModbusConfig(parsed)
      } catch (_) {
        // ignore invalid json
      }
      return
    }
    if (type === 'OPCUA') {
      try {
        const parsed = JSON.parse(text || '{}')
        setOpcuaConfig(parsed)
      } catch (_) {
        // ignore invalid json
      }
      return
    }
    setConfigText(text)
  }

  const toggleConnectorConfig = () => {
    setShowConnectorConfig((prev) => {
      const next = !prev
      if (next) {
        setConnectorConfigEditorText(JSON.stringify(getActiveConnectorConfig(), null, 2))
      }
      return next
    })
  }

  useEffect(() => {
    if (open && showConnectorConfig) {
      setConnectorConfigEditorText(JSON.stringify(getActiveConnectorConfig(), null, 2))
    }
  }, [open, showConnectorConfig, type])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Connector name is required.')
      return
    }

    let configPayload: Record<string, unknown>
    if (type === 'MQTT') {
      configPayload = mqttConfig ?? {}
    } else if (type === 'MODBUS') {
      configPayload = modbusConfig ?? {}
    } else if (type === 'OPCUA') {
      configPayload = opcuaConfig ?? {}
    } else {
      try {
        configPayload = JSON.parse(configText || '{}')
      } catch (err) {
        toast.error('Connector config must be valid JSON.')
        return
      }
    }

    if (!connector) {
      configPayload = {
        ...configPayload,
        logLevel: loggingLevel,
        ...(type === 'OPCUA' ? {} : { sendDataOnlyOnChange: sendDataOnChange }),
      }
    }

    const payload: IotGatewayConnectorPayload = {
      name: name.trim(),
      type,
      enabled,
      status: status.trim() || 'inactive',
      config: configPayload,
    }

    try {
      if (connector) {
        await onUpdate({ gatewayId, connectorId: connector.id, payload })
      } else {
        await onCreate({ gatewayId, payload })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save connector.')
    }
  }

  const handleLoadConnectorDefaults = async () => {
    try {
      const template = await getIotGatewayConnectorTemplate(type.toLowerCase())
      const templateConfig = (template ?? {}) as Record<string, unknown>
      const templateSendDataOnlyOnChange =
        typeof templateConfig.sendDataOnlyOnChange === 'boolean'
          ? templateConfig.sendDataOnlyOnChange
          : typeof (templateConfig.broker as Record<string, unknown> | undefined)?.sendDataOnlyOnChange ===
            'boolean'
          ? (templateConfig.broker as Record<string, unknown>).sendDataOnlyOnChange
          : undefined
    if (type === 'MQTT') {
      setMqttConfig(templateConfig)
    } else if (type === 'MODBUS') {
      setModbusConfig(templateConfig)
    } else if (type === 'OPCUA') {
      setOpcuaConfig(templateConfig)
    } else {
      setConfigText(JSON.stringify(templateConfig, null, 2))
    }
      if (typeof templateSendDataOnlyOnChange === 'boolean') {
        setSendDataOnChange(templateSendDataOnlyOnChange)
      }
      toast.success('Loaded ThingsBoard connector defaults.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load connector defaults.')
    }
  }

  const updateConfigFlag = (key: string, value: unknown) => {
    try {
      const parsed = JSON.parse(configText || '{}')
      const next = { ...(parsed || {}), [key]: value }
      if (type === 'MQTT' && typeof next === 'object' && next !== null) {
        const broker = typeof next.broker === 'object' && next.broker !== null ? next.broker : {}
        next.broker = { ...broker, sendDataOnlyOnChange: sendDataOnChange }
      }
      setConfigText(JSON.stringify(next, null, 2))
    } catch (err) {
      setConfigText(JSON.stringify({ [key]: value }, null, 2))
    }
  }

  return (
    <SidePanel
      size="large"
      visible={open}
      header={
        <div className="flex w-full items-center justify-between gap-3">
          <span>{connector ? 'Edit connector' : 'New connector'}</span>
          <Button type="default" size="tiny" onClick={toggleConnectorConfig}>
            Configuration
          </Button>
        </div>
      }
      onCancel={() => onOpenChange(false)}
      cancelText="Close"
      customFooter={
        <div className="flex w-full items-center justify-end gap-2 border-t border-default px-3 py-4">
          <Button type="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            {connector ? 'Save' : 'Create'}
          </Button>
        </div>
      }
    >
      <div className="flex h-full flex-col gap-4 px-6 py-6">
        {showConnectorConfig ? (
          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-hidden rounded border border-muted bg-surface-200">
              <CodeEditor
                id="connector-config-editor"
                language="json"
                value={connectorConfigEditorText}
                onInputChange={handleConnectorConfigChange}
                options={{
                  wordWrap: 'on',
                  folding: true,
                  foldingStrategy: 'indentation',
                  showFoldingControls: 'always',
                  lineNumbers: 'on',
                  glyphMargin: true,
                  foldingHighlight: true,
                  lineDecorationsWidth: 6,
                  lineNumbersMinChars: 1,
                }}
              />
            </div>
          </div>
        ) : null}
        {!showConnectorConfig ? (
          <div className="flex h-full flex-col gap-4">
            {!connector && (
            <>
              <div className="space-y-1">
                <Label_Shadcn_ htmlFor="connector-name" className="text-xs text-foreground-light"><span>Name *</span><HelpIconTooltip content="Enter Name." /></Label_Shadcn_>
                <Input_Shadcn_
                  id="connector-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-foreground-light">Type</p>
                <Select_Shadcn_
                  value={type}
                  onValueChange={(value) => {
                    setType(value)
                    if (value !== 'MQTT') {
                      setConfigText(JSON.stringify(mqttConfig ?? {}, null, 2))
                    }
                  }}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ placeholder="Select type" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {CONNECTOR_TYPES.map((option) => (
                      <SelectItem_Shadcn_
                        key={option.value}
                        value={option.value}
                        className="text-xs"
                      >
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
            </>
            )}
            {!connector && (
              <>
                <div className="space-y-1">
                  <Label_Shadcn_ htmlFor="connector-log-level" className="text-xs text-foreground-light">
                    Logging level
                  </Label_Shadcn_>
                <Select_Shadcn_ value={loggingLevel} onValueChange={setLoggingLevel}>
                  <SelectTrigger_Shadcn_ id="connector-log-level" size="small">
                    <SelectValue_Shadcn_ placeholder="Select level" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {CONNECTOR_LOG_LEVELS.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="connector-fill-defaults"
                  checked={fillDefaults}
                  onCheckedChange={(checked) => {
                    setFillDefaults(checked)
                    if (checked) {
                      defaultsLoadedRef.current = true
                      void handleLoadConnectorDefaults()
                    } else {
                      setConfigText('{}')
                    }
                  }}
                />
                <Label_Shadcn_ htmlFor="connector-fill-defaults" className="text-xs text-foreground-light">
                  Fill configuration with default values
                </Label_Shadcn_>
                </div>
                {type !== 'OPCUA' && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="connector-send-data-change"
                      checked={sendDataOnChange}
                      onCheckedChange={(checked) => {
                        setSendDataOnChange(checked)
                        updateConfigFlag('sendDataOnlyOnChange', checked)
                      }}
                    />
                    <Label_Shadcn_ htmlFor="connector-send-data-change" className="text-xs text-foreground-light">
                      Send data only on change
                    </Label_Shadcn_>
                  </div>
                )}
              </>
            )}
            {connector && type !== 'MQTT' && null}
            {connector &&
              (type === 'MQTT' ? (
                <div className="flex-1 min-h-0 space-y-2">
                  <MqttConnectorForm
                    value={(mqttConfig ?? {}) as Record<string, unknown>}
                    onChange={(next) => setMqttConfig(next)}
                    generalContent={
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1 md:col-span-2">
                          <Label_Shadcn_ htmlFor="connector-name" className="text-xs text-foreground-light"><span>Name *</span><HelpIconTooltip content="Enter Name." /></Label_Shadcn_>
                          <Input_Shadcn_
                            id="connector-name"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                          />
                        </div>
                      </div>
                    }
                  />
                </div>
              ) : type === 'MODBUS' ? (
                <div className="flex-1 min-h-0 space-y-2">
                  <ModbusConnectorForm
                    value={(modbusConfig ?? {}) as Record<string, unknown>}
                    onChange={(next) => setModbusConfig(next)}
                    generalContent={
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1 md:col-span-2">
                          <Label_Shadcn_ htmlFor="connector-name" className="text-xs text-foreground-light"><span>Name *</span><HelpIconTooltip content="Enter Name." /></Label_Shadcn_>
                          <Input_Shadcn_
                            id="connector-name"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                          />
                        </div>
                      </div>
                    }
                  />
                </div>
              ) : type === 'OPCUA' ? (
                <div className="flex-1 min-h-0 space-y-2">
                  <OpcuaConnectorForm
                    value={(opcuaConfig ?? {}) as Record<string, unknown>}
                    onChange={(next) => setOpcuaConfig(next)}
                    generalContent={
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1 md:col-span-2">
                          <Label_Shadcn_ htmlFor="connector-name" className="text-xs text-foreground-light"><span>Name *</span><HelpIconTooltip content="Enter Name." /></Label_Shadcn_>
                          <Input_Shadcn_
                            id="connector-name"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                          />
                        </div>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-0 space-y-2">
                  <Textarea
                    id="connector-config"
                    value={configText}
                    onChange={(event) => setConfigText(event.target.value)}
                    className="min-h-[180px]"
                  />
                </div>
              ))}
          </div>
        ) : null}
      </div>
    </SidePanel>
  )
}

const LogDialog = ({
  open,
  onOpenChange,
  gatewayId,
  connectors,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  gatewayId: number
  connectors: IotGatewayConnector[]
  onCreate: (args: { gatewayId: string | number; payload: IotGatewayLogPayload }) => Promise<unknown>
}) => {
  const [level, setLevel] = useState('info')
  const [category, setCategory] = useState('general')
  const [connectorId, setConnectorId] = useState('')
  const [message, setMessage] = useState('')
  const [payloadText, setPayloadText] = useState('{}')

  useEffect(() => {
    if (!open) return
    setLevel('info')
    setCategory('general')
    setConnectorId('')
    setMessage('')
    setPayloadText('{}')
  }, [open])

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Log message is required.')
      return
    }
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(payloadText || '{}')
    } catch (err) {
      toast.error('Log payload must be valid JSON.')
      return
    }

    const payloadData: IotGatewayLogPayload = {
      level,
      category,
      message: message.trim(),
      payload,
      connector_id: connectorId ? Number(connectorId) : null,
    }

    try {
      await onCreate({ gatewayId, payload: payloadData })
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create log entry.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader padding="small">
          <DialogTitle>Add log entry</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection padding="small" className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Level</p>
            <Select_Shadcn_ value={level} onValueChange={(value) => setLevel(value)}>
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select level" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {LOG_LEVELS.map((option) => (
                  <SelectItem_Shadcn_
                    key={option.value}
                    value={option.value}
                    className="text-xs"
                  >
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Category</p>
            <Select_Shadcn_ value={category} onValueChange={(value) => setCategory(value)}>
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select category" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {LOG_CATEGORIES.map((option) => (
                  <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Connector</p>
            <Select_Shadcn_
              value={connectorId || NO_CONNECTOR_VALUE}
              onValueChange={(value) =>
                setConnectorId(value === NO_CONNECTOR_VALUE ? '' : value)
              }
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="No connector" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectItem_Shadcn_ value={NO_CONNECTOR_VALUE} className="text-xs">
                  No connector
                </SelectItem_Shadcn_>
                {connectors.map((connector) => (
                  <SelectItem_Shadcn_
                    key={connector.id}
                    value={connector.id.toString()}
                    className="text-xs"
                  >
                    {connector.name}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ htmlFor="log-message" className="text-xs text-foreground-light"><span>Message</span><HelpIconTooltip content="Enter Message." /></Label_Shadcn_>
            <Input_Shadcn_
              id="log-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-foreground-light">Payload (JSON)</p>
            <Textarea
              id="log-payload"
              value={payloadText}
              onChange={(event) => setPayloadText(event.target.value)}
              rows={6}
            />
          </div>
        </DialogSection>
        <DialogFooter padding="small">
          <Button type="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Add log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
