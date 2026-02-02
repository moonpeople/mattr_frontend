import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import { useIotDeviceModelsQuery } from 'data/iot/device-models'
import { useIotDevicesQuery } from 'data/iot/devices'
import { useIotTelemetryRawQuery, useIotTelemetryRollupQuery } from 'data/iot/telemetry'
import type {
  IotTelemetryQueryParams,
  IotTelemetryRollupParams,
  IotTelemetryRow,
  IotTelemetryRollupRow,
} from 'data/iot/telemetry'
import { useMemo, useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
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
import AreaChart from 'components/ui/Charts/AreaChart'
import { useRouter } from 'next/router'
import { IS_PLATFORM, IOT_DEFAULT_API_KEY } from 'lib/constants'

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '--')

const formatValue = (row: IotTelemetryRow) => {
  if (row.value_float !== null && row.value_float !== undefined) return row.value_float
  if (row.value_int !== null && row.value_int !== undefined) return row.value_int
  if (row.value_string !== null && row.value_string !== undefined) return row.value_string
  if (row.value_bool !== null && row.value_bool !== undefined) return row.value_bool ? 'true' : 'false'
  if (row.value_json) return row.value_json
  if (row.raw_value) return row.raw_value
  return '--'
}

const TelemetryPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { data: devices = [] } = useIotDevicesQuery()
  const { data: models = [] } = useIotDeviceModelsQuery()

  const [apiKey, setApiKey] = useLocalStorage<string>(`iot-telemetry-key-${ref}`, '')
  const [deviceId, setDeviceId] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [sensorId, setSensorId] = useState('')
  const [sensorTypeId, setDataTypeKeyId] = useState('')
  const [dataKey, setDataKey] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit, setLimit] = useState('500')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [interval, setInterval] = useState<IotTelemetryRollupParams['interval']>('1m')
  const [submittedParams, setSubmittedParams] = useState<IotTelemetryQueryParams | null>(null)
  const [submittedRollupParams, setSubmittedRollupParams] =
    useState<IotTelemetryRollupParams | null>(null)
  const [hasAppliedQuery, setHasAppliedQuery] = useState(false)

  useEffect(() => {
    if (!router.isReady || hasAppliedQuery) return
    const rawDeviceId = router.query.device_id
    const rawSerial = router.query.serial_number
    const queryDeviceId = Array.isArray(rawDeviceId) ? rawDeviceId[0] : rawDeviceId
    const querySerial = Array.isArray(rawSerial) ? rawSerial[0] : rawSerial
    if (queryDeviceId) setDeviceId(queryDeviceId)
    if (querySerial) setSerialNumber(querySerial)
    setHasAppliedQuery(true)
  }, [router.isReady, router.query.device_id, router.query.serial_number, hasAppliedQuery])

  useEffect(() => {
    if (IS_PLATFORM) return
    if (!apiKey && IOT_DEFAULT_API_KEY) {
      setApiKey(IOT_DEFAULT_API_KEY)
    }
  }, [apiKey, setApiKey])

  const queryParams = useMemo<IotTelemetryQueryParams>(() => {
    const trimmedSerial = serialNumber.trim()
    const trimmedDeviceId = deviceId.trim()

    return {
      serial_number: trimmedSerial || undefined,
      device_id: trimmedSerial ? undefined : trimmedDeviceId || undefined,
      sensor_id: sensorId.trim() || undefined,
      data_type_key_id: sensorTypeId.trim() || undefined,
      data_key: dataKey.trim() || undefined,
      from: from.trim() || undefined,
      to: to.trim() || undefined,
      limit: limit.trim() || undefined,
      order,
    }
  }, [serialNumber, deviceId, sensorId, sensorTypeId, dataKey, from, to, limit, order])

  const rollupParams = useMemo<IotTelemetryRollupParams>(() => {
    return { ...queryParams, interval }
  }, [queryParams, interval])

  const {
    data: rows = [],
    isPending,
    isError,
    error,
  } = useIotTelemetryRawQuery({
    apiKey,
    params: submittedParams,
    enabled: !!submittedParams && !!apiKey,
  })

  const {
    data: rollupRows = [],
    isPending: isRollupPending,
    isError: isRollupError,
    error: rollupError,
  } = useIotTelemetryRollupQuery({
    apiKey,
    params: submittedRollupParams,
    enabled: !!submittedRollupParams && !!apiKey,
  })

  const onRunQuery = () => {
    if (IS_PLATFORM && (!apiKey || apiKey.trim() === '')) {
      toast.error('API key is required to read telemetry.')
      return
    }
    setSubmittedParams(queryParams)
    setSubmittedRollupParams(rollupParams)
  }

  const chartData = useMemo(() => {
    return rollupRows.map((row: IotTelemetryRollupRow) => ({
      ts: row.window_start,
      avg: row.avg ?? 0,
    }))
  }, [rollupRows])

  const modelMap = useMemo(() => new Map(models.map((model) => [model.id, model])), [models])

  const selectedDevice = useMemo(() => {
    const submittedDeviceId = submittedParams?.device_id?.trim() ?? ''
    const submittedSerial = submittedParams?.serial_number?.trim() ?? ''

    if (submittedDeviceId) {
      return devices.find((device) => String(device.id) === submittedDeviceId) ?? null
    }

    if (submittedSerial) {
      return devices.find((device) => device.serial_number === submittedSerial) ?? null
    }

    return null
  }, [devices, submittedParams])

  const selectedModel = useMemo(() => {
    if (!selectedDevice?.model_id) return null
    return modelMap.get(selectedDevice.model_id) ?? null
  }, [modelMap, selectedDevice])

  const allowedDataTypeKeyIds = useMemo(() => {
    const ids = selectedModel?.data_type_key_ids ?? []
    if (ids.length === 0) return null
    return new Set(ids.map((id) => Number(id)))
  }, [selectedModel])

  const filteredRows = useMemo(() => {
    if (!allowedDataTypeKeyIds) return rows

    return rows.filter((row) => {
      const keyId = row.data_type_key_id
      if (keyId === null || keyId === undefined) return false
      return allowedDataTypeKeyIds.has(Number(keyId))
    })
  }, [rows, allowedDataTypeKeyIds])

  const ANY_DEVICE_VALUE = '__any__'

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>Telemetry</PageHeaderTitle>
        <PageHeaderDescription>
          Query raw device data stored in ClickHouse. Provide an API key with telemetry:read.
        </PageHeaderDescription>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Query builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  id="telemetry-api-key"
                  label="API key"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-foreground-light">Device (by ID)</p>
                    <Select_Shadcn_
                      value={deviceId || ANY_DEVICE_VALUE}
                      onValueChange={(nextValue) =>
                        setDeviceId(nextValue === ANY_DEVICE_VALUE ? '' : nextValue)
                      }
                    >
                      <SelectTrigger_Shadcn_ size="small">
                        <SelectValue_Shadcn_ placeholder="Any device" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value={ANY_DEVICE_VALUE} className="text-xs">
                          Any device
                        </SelectItem_Shadcn_>
                        {devices.map((device) => (
                          <SelectItem_Shadcn_
                            key={device.id}
                            value={device.id.toString()}
                            className="text-xs"
                          >
                            {device.name || device.serial_number || `#${device.id}`}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </div>
                  <Input
                    id="telemetry-serial-number"
                    label="Serial number"
                    value={serialNumber}
                    onChange={(event) => setSerialNumber(event.target.value)}
                    descriptionText="If set, overrides device ID."
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    id="telemetry-sensor-id"
                    label="Sensor ID"
                    value={sensorId}
                    onChange={(event) => setSensorId(event.target.value)}
                  />
                  <Input
                    id="telemetry-sensor-type"
                    label="Data type key ID"
                    value={sensorTypeId}
                    onChange={(event) => setDataTypeKeyId(event.target.value)}
                  />
                  <Input
                    id="telemetry-data-key"
                    label="Data key"
                    value={dataKey}
                    onChange={(event) => setDataKey(event.target.value)}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    id="telemetry-from"
                    label="From"
                    placeholder="2024-01-01T00:00:00Z"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                  <Input
                    id="telemetry-to"
                    label="To"
                    placeholder="2024-01-01T01:00:00Z"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-foreground-light">Order</p>
                    <Select_Shadcn_
                      value={order}
                      onValueChange={(nextValue) => setOrder(nextValue as 'asc' | 'desc')}
                    >
                      <SelectTrigger_Shadcn_ size="small">
                        <SelectValue_Shadcn_ placeholder="Newest first" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="desc" className="text-xs">
                          Newest first
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="asc" className="text-xs">
                          Oldest first
                        </SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-foreground-light">Rollup interval</p>
                    <Select_Shadcn_
                      value={interval}
                      onValueChange={(nextValue) =>
                        setInterval(nextValue as IotTelemetryRollupParams['interval'])
                      }
                    >
                      <SelectTrigger_Shadcn_ size="small">
                        <SelectValue_Shadcn_ placeholder="1 minute" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="10s" className="text-xs">
                          10 seconds
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="1m" className="text-xs">
                          1 minute
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="6m" className="text-xs">
                          6 minutes
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="10m" className="text-xs">
                          10 minutes
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="1h" className="text-xs">
                          1 hour
                        </SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <Input
                    id="telemetry-limit"
                    label="Limit"
                    type="number"
                    value={limit}
                    onChange={(event) => setLimit(event.target.value)}
                  />
                  <Button type="primary" onClick={onRunQuery}>
                    Run query
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rollup (avg)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isRollupError && (
                  <p className="text-sm text-destructive-600">{rollupError?.message}</p>
                )}
                <AreaChart
                  data={chartData}
                  xAxisKey="ts"
                  yAxisKey="avg"
                  title="Average value"
                  minimalHeader
                  size="large"
                />
                {isRollupPending && (
                  <p className="text-sm text-foreground-light">Loading rollup...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
                {allowedDataTypeKeyIds && (
                  <p className="text-xs text-foreground-light">
                    Showing only data keys from the device model.
                  </p>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Sensor</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Protocol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-sm text-foreground-light">
                          Loading telemetry...
                        </TableCell>
                      </TableRow>
                    ) : submittedParams && filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-sm text-foreground-light">
                          {allowedDataTypeKeyIds
                            ? 'No telemetry for the selected device data keys.'
                            : 'No telemetry for this query.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((row, index) => (
                        <TableRow key={`${row.device_id}-${row.ts}-${index}`}>
                          <TableCell>{formatDate(row.ts)}</TableCell>
                          <TableCell>{row.device_id}</TableCell>
                          <TableCell>{row.sensor_id ?? '--'}</TableCell>
                          <TableCell>{row.data_key ?? '--'}</TableCell>
                          <TableCell>{formatValue(row)}</TableCell>
                          <TableCell>{row.protocol ?? '--'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

TelemetryPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default TelemetryPage
