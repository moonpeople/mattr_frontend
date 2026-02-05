import Link from 'next/link'
import { useMemo } from 'react'

import type { OrgUsageResponse } from 'data/usage/org-usage-query'
import { cn } from 'ui'
import type { UsageSummaryMetric } from './UsageSummary.constants'

export interface UsageSummaryMetricProps {
  metric: UsageSummaryMetric
  usage: OrgUsageResponse
  relativeToSubscription: boolean
  orgSlug?: string
  className?: string
}

const getUnitLabel = (metric: UsageSummaryMetric) => {
  if (metric.unitName) return metric.unitName
  if (metric.units === 'bytes' || metric.units === 'gigabytes') return 'GB'
  return ''
}

export const UsageSummaryMetricItem = ({
  metric,
  usage,
  relativeToSubscription,
  orgSlug,
  className,
}: UsageSummaryMetricProps) => {
  const usageMeta = usage.usages.find((x) => x.metric === metric.key)
  const unitLabel = getUnitLabel(metric)

  const usageLabel = useMemo(() => {
    if (!usageMeta) return ''

    if (relativeToSubscription && usageMeta.available_in_plan === false) {
      return 'Not included in plan'
    }

    const usageValue = usageMeta.usage?.toLocaleString() ?? '0'
    const unitSuffix = unitLabel ? ` ${unitLabel}` : ''

    if (
      relativeToSubscription &&
      !usageMeta.unlimited &&
      usageMeta.pricing_free_units !== undefined &&
      usageMeta.pricing_free_units !== 0
    ) {
      const limitValue = usageMeta.pricing_free_units?.toLocaleString() ?? '0'
      return `${usageValue} / ${limitValue}${unitSuffix}`
    }

    return `${usageValue}${unitSuffix}`
  }, [relativeToSubscription, unitLabel, usageMeta])

  const percentageLabel = useMemo(() => {
    if (!usageMeta || !relativeToSubscription) return ''

    if (
      usageMeta.available_in_plan === false ||
      usageMeta.unlimited ||
      usageMeta.pricing_free_units === undefined ||
      usageMeta.pricing_free_units === 0
    ) {
      return ''
    }

    const usageRatio = usageMeta.usage === 0 ? 0 : usageMeta.usage / usageMeta.pricing_free_units

    if (usageRatio === 0) return ''
    if (usageRatio < 0.01) return '(<1%)'
    return `(${(+(usageRatio * 100).toFixed(0)).toLocaleString()}%)`
  }, [relativeToSubscription, usageMeta])

  if (!usageMeta) return null

  const labelContent = (
    <div>
      <p className="text-sm text-foreground-light">{metric.name}</p>
      <span className="text-sm">{usageLabel}</span>
      {percentageLabel && <span className="text-sm"> {percentageLabel}</span>}
    </div>
  )

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {metric.anchor && orgSlug ? (
        <Link href={`/org/${orgSlug}/usage#${metric.anchor}`} className="block w-full">
          {labelContent}
        </Link>
      ) : (
        labelContent
      )}
    </div>
  )
}
