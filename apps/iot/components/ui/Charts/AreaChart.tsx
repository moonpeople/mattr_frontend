import dayjs from 'dayjs'
import { useState } from 'react'
import { Area, AreaChart as RechartAreaChart, ReferenceArea, Tooltip, XAxis } from 'recharts'
import { useChartHoverState } from './useChartHoverState'

import { CHART_COLORS, DateTimeFormats } from 'components/ui/Charts/Charts.constants'
import { ChartHeader } from './ChartHeader'
import { ChartHighlightActions, type ChartHighlightAction } from './ChartHighlightActions'
import type { CommonChartProps, Datum } from './Charts.types'
import { numberFormatter, useChartSize } from './Charts.utils'
import NoDataPlaceholder from './NoDataPlaceholder'
import type { ChartHighlight } from './useChartHighlight'

export interface AreaChartProps<D = Datum> extends CommonChartProps<D> {
  yAxisKey: string
  xAxisKey: string
  format?: string
  customDateFormat?: string
  displayDateInUtc?: boolean
  syncId?: string
  chartHighlight?: ChartHighlight
  updateDateRange?: (from: string, to: string) => void
  highlightActions?: ChartHighlightAction[]
  hideHighlightArea?: boolean
}

const AreaChart = ({
  data,
  yAxisKey,
  xAxisKey,
  format,
  customDateFormat = DateTimeFormats.FULL,
  title,
  titlePopover,
  highlightedValue,
  highlightedLabel,
  displayDateInUtc,
  minimalHeader,
  className = '',
  valuePrecision,
  size = 'normal',
  syncId,
  chartHighlight,
  updateDateRange,
  highlightActions,
  hideHighlightArea = false,
}: AreaChartProps) => {
  const { Container } = useChartSize(size)
  const { hoveredIndex, syncTooltip, setHover, clearHover } = useChartHoverState(
    syncId || 'default'
  )
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))
  const resolvedHighlightedLabel =
    (focusDataIndex !== null &&
      data &&
      data[focusDataIndex] !== undefined &&
      day(data[focusDataIndex][xAxisKey]).format(customDateFormat)) ||
    highlightedLabel

  const resolvedHighlightedValue =
    focusDataIndex !== null ? data[focusDataIndex]?.[yAxisKey] : highlightedValue
  const showHighlightArea =
    !!chartHighlight && !!chartHighlight.left && !!chartHighlight.right && !hideHighlightArea

  if (data.length === 0) {
    return (
      <NoDataPlaceholder
        description="It may take up to 24 hours for data to refresh"
        size={size}
        className={className}
        attribute={title}
        format={format}
      />
    )
  }

  return (
    <div className={['flex flex-col gap-3', className].join(' ')}>
      <ChartHeader
        title={title}
        format={format}
        customDateFormat={customDateFormat}
        highlightedValue={
          typeof resolvedHighlightedValue === 'number'
            ? numberFormatter(resolvedHighlightedValue, valuePrecision)
            : resolvedHighlightedValue
        }
        highlightedLabel={resolvedHighlightedLabel}
        minimalHeader={minimalHeader}
        titlePopover={titlePopover}
        syncId={syncId}
        data={data}
        xAxisKey={xAxisKey}
        yAxisKey={yAxisKey}
        xAxisIsDate={true}
        displayDateInUtc={displayDateInUtc}
        valuePrecision={valuePrecision}
        attributes={[]}
      />
      <Container className="relative z-10">
        <RechartAreaChart
          data={data}
          margin={{
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
          }}
          className="overflow-visible"
          style={{ cursor: chartHighlight ? 'crosshair' : 'default' }}
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }

            setHover(e.activeTooltipIndex)

            if (
              chartHighlight &&
              e.activeTooltipIndex !== null &&
              e.activeTooltipIndex !== undefined
            ) {
              const activeTimestamp = data[e.activeTooltipIndex]?.[xAxisKey]
              chartHighlight.handleMouseMove({
                activeLabel: activeTimestamp?.toString(),
                coordinates: e.activeLabel,
              })
            }
          }}
          onMouseDown={(e: any) => {
            if (
              chartHighlight &&
              e.activeTooltipIndex !== null &&
              e.activeTooltipIndex !== undefined
            ) {
              const activeTimestamp = data[e.activeTooltipIndex]?.[xAxisKey]
              chartHighlight.handleMouseDown({
                activeLabel: activeTimestamp?.toString(),
                coordinates: e.activeLabel,
              })
            }
          }}
          onMouseUp={chartHighlight?.handleMouseUp}
          onMouseLeave={() => {
            setFocusDataIndex(null)

            clearHover()
          }}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.GREEN_1} stopOpacity={0.8} />
              <stop offset="95%" stopColor={CHART_COLORS.GREEN_1} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey={xAxisKey}
            interval={data.length - 2}
            angle={0}
            // hide the tick
            tick={false}
            // color the axis
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          {showHighlightArea && (
            <ReferenceArea
              x1={chartHighlight?.coordinates.left}
              x2={chartHighlight?.coordinates.right}
              strokeOpacity={0.5}
              stroke={CHART_COLORS.GREEN_1}
              fill={CHART_COLORS.GREEN_1}
              fillOpacity={0.2}
            />
          )}
          <Tooltip
            content={(props) =>
              syncId && syncTooltip && hoveredIndex !== null ? (
                <div className="bg-black/90 text-white p-2 rounded text-xs">
                  <div className="font-medium">
                    {dayjs(data[hoveredIndex]?.[xAxisKey]).format(customDateFormat)}
                  </div>
                  <div>
                    {numberFormatter(Number(data[hoveredIndex]?.[yAxisKey]) || 0, valuePrecision)}
                    {format}
                  </div>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey={yAxisKey}
            stroke={CHART_COLORS.GREEN_1}
            fillOpacity={1}
            fill="url(#colorUv)"
          />
        </RechartAreaChart>
        {chartHighlight ? (
          <ChartHighlightActions
            chartHighlight={chartHighlight}
            updateDateRange={updateDateRange}
            actions={highlightActions}
          />
        ) : null}
      </Container>
      {data && (
        <div className="text-foreground-lighter -mt-8 flex items-center justify-between text-xs">
          <span>{dayjs(data[0][xAxisKey]).format(customDateFormat)}</span>
          <span>{dayjs(data[data?.length - 1]?.[xAxisKey]).format(customDateFormat)}</span>
        </div>
      )}
    </div>
  )
}
export default AreaChart
