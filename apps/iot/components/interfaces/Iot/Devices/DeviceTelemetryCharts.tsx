import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useIotDataTypeKeysQuery } from 'data/iot/data-type-keys'
import { useIotSensorsQuery } from 'data/iot/sensors'
import { useIotTelemetryRollupQuery } from 'data/iot/telemetry'
import type { IotDevice, IotDeviceModel, IotDataTypeKey } from 'data/iot/types'
import type { DatePickerToFrom } from 'components/interfaces/Settings/Logs/Logs.types'
import { ArrowRight, CalendarDays, InfoIcon } from 'lucide-react'
import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import type { Time } from 'components/ui/DatePicker/DatePicker.types'
import { TimeSplitInput } from 'components/ui/DatePicker/TimeSplitInput'
import AreaChart from 'components/ui/Charts/AreaChart'
import BarChart from 'components/ui/Charts/BarChart'
import { useChartHighlight } from 'components/ui/Charts/useChartHighlight'
import { DateTimeFormats } from 'components/ui/Charts/Charts.constants'

type DeviceTelemetryChartsProps = {
  device: IotDevice
  model?: IotDeviceModel | null
}

type SensorChartProps = {
  deviceId: number
  sensorType: IotDataTypeKey
  range: TelemetryRange
  onZoom: (from: string, to: string) => void
}

type TelemetryRange = {
  value: '1h' | '4h' | '24h' | 'custom'
  label: string
  durationMs: number
  interval: '1s' | '10s' | '1m' | '6m' | '10m' | '1h'
  limit: string
  from: string
  to: string
}

const INTERVAL_MS: Record<TelemetryRange['interval'], number> = {
  '1s': 1_000,
  '10s': 10_000,
  '1m': 60_000,
  '6m': 360_000,
  '10m': 600_000,
  '1h': 3_600_000,
}

const buildLimit = (durationMs: number, interval: TelemetryRange['interval']) => {
  const estimate = Math.ceil(durationMs / INTERVAL_MS[interval]) + 2
  return String(Math.min(1000, Math.max(2, estimate)))
}

const resolveInterval = (durationMs: number): TelemetryRange['interval'] => {
  if (durationMs <= 10 * 60 * 1000) return '1s'
  if (durationMs <= 60 * 60 * 1000) return '10s'
  if (durationMs <= 4 * 60 * 60 * 1000) return '1m'
  if (durationMs <= 24 * 60 * 60 * 1000) return '6m'
  if (durationMs <= 7 * 24 * 60 * 60 * 1000) return '10m'
  return '1h'
}

const RANGE_OPTIONS: Array<Pick<TelemetryRange, 'value' | 'label' | 'durationMs' | 'interval'>> = [
  {
    value: '1h',
    label: '1h',
    durationMs: 60 * 60 * 1000,
    interval: '10s',
  },
  {
    value: '4h',
    label: '4h',
    durationMs: 4 * 60 * 60 * 1000,
    interval: '1m',
  },
  {
    value: '24h',
    label: '24h',
    durationMs: 24 * 60 * 60 * 1000,
    interval: '6m',
  },
]

const buildPresetRange = (
  value: Exclude<TelemetryRange['value'], 'custom'>
): TelemetryRange => {
  const option = RANGE_OPTIONS.find((entry) => entry.value === value) ?? RANGE_OPTIONS[2]
  const now = dayjs.utc()
  const from = now.subtract(option.durationMs, 'millisecond').toISOString()
  const to = now.toISOString()
  return {
    value: option.value,
    label: option.label,
    durationMs: option.durationMs,
    interval: option.interval,
    limit: buildLimit(option.durationMs, option.interval),
    from,
    to,
  }
}

const buildCustomRange = (from: string, to: string): TelemetryRange => {
  const fromValue = dayjs.utc(from)
  const toValue = dayjs.utc(to)
  const start = fromValue.isAfter(toValue) ? toValue : fromValue
  const end = fromValue.isAfter(toValue) ? fromValue : toValue
  const durationMs = Math.max(1, end.diff(start, 'millisecond'))
  const interval = resolveInterval(durationMs)
  return {
    value: 'custom',
    label: 'Custom',
    durationMs,
    interval,
    limit: buildLimit(durationMs, interval),
    from: start.toISOString(),
    to: end.toISOString(),
  }
}

const alignTimestamp = (valueMs: number, intervalMs: number) =>
  Math.floor(valueMs / intervalMs) * intervalMs

const buildChartData = (
  rows: { window_start: string; avg?: number | null }[],
  range: TelemetryRange
) => {
  const intervalMs = INTERVAL_MS[range.interval]
  const startMs = dayjs.utc(range.from).valueOf()
  const endMs = dayjs.utc(range.to).valueOf()
  const alignedStartMs = alignTimestamp(startMs, intervalMs)
  const alignedEndMs = Math.ceil(endMs / intervalMs) * intervalMs

  const rowMap = new Map<number, number | null>()
  rows.forEach((row) => {
    const rowMs = alignTimestamp(dayjs.utc(row.window_start).valueOf(), intervalMs)
    rowMap.set(rowMs, row.avg ?? null)
  })

  const points = []
  for (let tsMs = alignedStartMs; tsMs <= alignedEndMs; tsMs += intervalMs) {
    points.push({
      ts: dayjs.utc(tsMs).toISOString(),
      avg: rowMap.has(tsMs) ? rowMap.get(tsMs) : null,
    })
  }

  return points
}

const START_TIME_DEFAULT: Time = { HH: '00', mm: '00', ss: '00' }
const END_TIME_DEFAULT: Time = { HH: '23', mm: '59', ss: '59' }

const SensorTelemetryChart = ({
  deviceId,
  sensorType,
  range,
  onZoom,
}: SensorChartProps) => {
  const chartHighlight = useChartHighlight()
  const displayTitle = useMemo(() => {
    const name = sensorType.name?.trim() ?? ''
    const key = sensorType.data_key_name?.trim() ?? ''

    if (!name) return ''
    if (!key) return name

    const cleaned = name.replace(`(${key})`, '').trim()
    return cleaned || name
  }, [sensorType.data_key_name, sensorType.name])

  const infoRows = useMemo(
    () => [
      { label: 'Name', value: sensorType.name },
      { label: 'Key', value: sensorType.data_key_name },
      { label: 'ID', value: sensorType.id },
      { label: 'Type', value: sensorType.value_type },
      { label: 'Unit', value: sensorType.unit ?? '--' },
      { label: 'Decimals', value: sensorType.decimals ?? '--' },
      { label: 'Chart', value: sensorType.chart_type ?? '--' },
    ],
    [sensorType]
  )

  const titlePopover = (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">Data key type</div>
      <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1">
        {infoRows.map((row) => (
          <div key={row.label} className="contents">
            <span className="text-foreground-light">{row.label}</span>
            <span className="text-foreground">{row.value ?? '--'}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const params = useMemo(
    () => ({
      device_id: String(deviceId),
      data_type_key_id: String(sensorType.id),
      interval: range.interval,
      limit: range.limit,
      from: range.from,
      to: range.to,
      order: 'asc' as const,
    }),
    [deviceId, sensorType.id, range]
  )

  const {
    data: rollupRows = [],
    isPending,
    isError,
    error,
  } = useIotTelemetryRollupQuery({
    params,
    enabled: !!deviceId,
  })

  const chartData = useMemo(
    () => buildChartData(rollupRows, range),
    [rollupRows, range]
  )
  const format = sensorType.unit ? ` ${sensorType.unit}` : undefined
  const chartType = (sensorType.chart_type || 'line').toLowerCase()
  const headerTitle = displayTitle || sensorType.name || ''
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          {headerTitle || 'Telemetry'}
        </CardTitle>
        <Popover_Shadcn_>
          <PopoverTrigger_Shadcn_ asChild>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-full text-foreground-lighter transition-colors hover:text-foreground"
            >
              <InfoIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ align="end" className="w-64 text-xs" portal>
            {titlePopover}
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </CardHeader>
      <CardContent className="space-y-3">
        {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
        {chartType === 'bar' ? (
          <BarChart
            data={chartData}
            xAxisKey="ts"
            yAxisKey="avg"
            title={undefined}
            format={format}
            minimalHeader
            size="normal"
            customDateFormat={DateTimeFormats.FULL_WITH_SECONDS}
            chartHighlight={chartHighlight}
            updateDateRange={onZoom}
          />
        ) : (
          <AreaChart
            data={chartData}
            xAxisKey="ts"
            yAxisKey="avg"
            title={undefined}
            format={format}
            minimalHeader
            size="normal"
            customDateFormat={DateTimeFormats.FULL_WITH_SECONDS}
            chartHighlight={chartHighlight}
            updateDateRange={onZoom}
          />
        )}
        {isPending && (
          <p className="text-xs text-foreground-light">Loading telemetry...</p>
        )}
      </CardContent>
    </Card>
  )
}

export const DeviceTelemetryCharts = ({ device, model }: DeviceTelemetryChartsProps) => {
  const [baseRange, setBaseRange] = useState<TelemetryRange>(() => buildPresetRange('24h'))
  const [viewRange, setViewRange] = useState<TelemetryRange>(() => buildPresetRange('24h'))
  const [rangeHistory, setRangeHistory] = useState<TelemetryRange[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarRange, setCalendarRange] = useState<{ from?: Date; to?: Date }>({})
  const [startTime, setStartTime] = useState<Time>(START_TIME_DEFAULT)
  const [endTime, setEndTime] = useState<Time>(END_TIME_DEFAULT)

  const { data: sensors = [] } = useIotSensorsQuery({
    deviceId: device.id,
    enabled: !!device?.id,
  })
  const { data: sensorTypes = [] } = useIotDataTypeKeysQuery()

  const activeDataTypeKeyIds = useMemo(() => {
    const modelKeys = model?.data_type_key_ids ?? []
    const modelKeySet = modelKeys.length > 0 ? new Set(modelKeys) : null

    if (sensors.length > 0) {
      const sensorKeyIds = Array.from(
        new Set(sensors.map((sensor) => sensor.data_type_key_id))
      )
      if (modelKeySet) {
        return sensorKeyIds.filter((keyId) => modelKeySet.has(keyId))
      }
      return sensorKeyIds
    }

    if (modelKeySet) {
      return modelKeys
    }

    return []
  }, [sensors, model])

  const activeDataTypeKeys = useMemo(
    () =>
      sensorTypes.filter((sensorType) => activeDataTypeKeyIds.includes(sensorType.id)),
    [sensorTypes, activeDataTypeKeyIds]
  )

  const handlePresetChange = (value: Exclude<TelemetryRange['value'], 'custom'>) => {
    const nextRange = buildPresetRange(value)
    setBaseRange(nextRange)
    setViewRange(nextRange)
    setRangeHistory([])
  }

  const handleDateRangeChange = (value: DatePickerToFrom) => {
    if (!value.from || !value.to) return
    const nextRange = buildCustomRange(value.from, value.to)
    setBaseRange(nextRange)
    setViewRange(nextRange)
    setRangeHistory([])
  }

  const handleCalendarApply = () => {
    if (!calendarRange.from) return
    const start = dayjs
      .utc(calendarRange.from)
      .hour(Number(startTime.HH || '0'))
      .minute(Number(startTime.mm || '0'))
      .second(Number(startTime.ss || '0'))
    const end = dayjs
      .utc(calendarRange.to ?? calendarRange.from)
      .hour(Number(endTime.HH || '0'))
      .minute(Number(endTime.mm || '0'))
      .second(Number(endTime.ss || '0'))
    const fromDate = start.toISOString()
    const toDate = end.toISOString()
    handleDateRangeChange({ from: fromDate, to: toDate })
    setCalendarOpen(false)
  }

  const handleZoomRange = (from: string, to: string) => {
    const start = dayjs.utc(from)
    const end = dayjs.utc(to)
    if (!start.isValid() || !end.isValid()) return
    setRangeHistory((prev) => [...prev, viewRange])
    setViewRange(buildCustomRange(start.toISOString(), end.toISOString()))
  }

  const handleZoomBack = () => {
    setRangeHistory((prev) => {
      if (prev.length === 0) return prev
      const nextRange = prev[prev.length - 1]
      setViewRange(nextRange)
      return prev.slice(0, -1)
    })
  }

  const handleZoomReset = () => {
    setViewRange(baseRange)
    setRangeHistory([])
  }

  const canReset =
    viewRange.from !== baseRange.from || viewRange.to !== baseRange.to
  const canGoBack = rangeHistory.length > 0

  const customLabel = useMemo(() => {
    if (!baseRange.from || !baseRange.to) return 'Custom'
    const fromLabel = dayjs.utc(baseRange.from).format('DD MMM')
    const toLabel = dayjs.utc(baseRange.to).format('DD MMM')
    return fromLabel === toLabel ? fromLabel : `${fromLabel} - ${toLabel}`
  }, [baseRange.from, baseRange.to])

  useEffect(() => {
    if (!calendarOpen) return
    setCalendarRange({
      from: baseRange.from ? dayjs.utc(baseRange.from).toDate() : undefined,
      to: baseRange.to ? dayjs.utc(baseRange.to).toDate() : undefined,
    })
    if (baseRange.from) {
      const start = dayjs.utc(baseRange.from)
      setStartTime({
        HH: start.format('HH'),
        mm: start.format('mm'),
        ss: start.format('ss'),
      })
    } else {
      setStartTime(START_TIME_DEFAULT)
    }
    if (baseRange.to) {
      const end = dayjs.utc(baseRange.to)
      setEndTime({
        HH: end.format('HH'),
        mm: end.format('mm'),
        ss: end.format('ss'),
      })
    } else {
      setEndTime(END_TIME_DEFAULT)
    }
  }, [calendarOpen, baseRange.from, baseRange.to])

  if (activeDataTypeKeys.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-foreground-light">No data type keys enabled for this device.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-foreground-lighter">Range</span>
          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="tiny"
                type={baseRange.value === option.value ? 'primary' : 'default'}
                onClick={() =>
                  handlePresetChange(option.value as Exclude<TelemetryRange['value'], 'custom'>)
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
          <span className="text-xs text-foreground-light">
            Resolution {viewRange.interval}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="tiny" type="default" disabled={!canGoBack} onClick={handleZoomBack}>
            Back
          </Button>
          <Button size="tiny" type="default" disabled={!canReset} onClick={handleZoomReset}>
            Reset
          </Button>
          <Popover_Shadcn_ open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                size="tiny"
                type="default"
                icon={<CalendarDays size={14} />}
                title="Custom date range"
              >
                {customLabel}
              </Button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_
              align="end"
              side="bottom"
              sideOffset={8}
              portal
              className="w-auto p-2"
            >
              <div className="flex items-center justify-between gap-2 px-1 pb-2">
                <TimeSplitInput
                  type="start"
                  time={startTime}
                  setTime={setStartTime}
                  setStartTime={setStartTime}
                  setEndTime={setEndTime}
                  startTime={startTime}
                  endTime={endTime}
                  startDate={calendarRange.from ?? new Date()}
                  endDate={calendarRange.to ?? calendarRange.from ?? new Date()}
                />
                <ArrowRight size={14} className="text-foreground-lighter" />
                <TimeSplitInput
                  type="end"
                  time={endTime}
                  setTime={setEndTime}
                  setStartTime={setStartTime}
                  setEndTime={setEndTime}
                  startTime={startTime}
                  endTime={endTime}
                  startDate={calendarRange.from ?? new Date()}
                  endDate={calendarRange.to ?? calendarRange.from ?? new Date()}
                />
              </div>
              <Calendar
                mode="range"
                selected={{
                  from: calendarRange.from,
                  to: calendarRange.to,
                }}
                onSelect={(range) =>
                  setCalendarRange({
                    from: range?.from,
                    to: range?.to,
                  })
                }
                className="rounded-md border"
              />
              <div className="mt-2 flex items-center justify-end gap-2 border-t border-muted pt-2">
                <Button size="tiny" type="default" onClick={() => setCalendarOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="tiny"
                  type="primary"
                  onClick={handleCalendarApply}
                  disabled={!calendarRange.from}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {activeDataTypeKeys.map((sensorType) => (
          <SensorTelemetryChart
            key={sensorType.id}
            deviceId={device.id}
            sensorType={sensorType}
            range={viewRange}
            onZoom={handleZoomRange}
          />
        ))}
      </div>
    </div>
  )
}
