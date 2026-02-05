import { useMemo } from 'react'

import { useBreakpoint } from 'common'
import AlertError from 'components/ui/AlertError'
import {
  ComputeUsageMetric,
  computeUsageMetricLabel,
  PricingMetric,
} from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { SectionContent } from './SectionContent'
import { USAGE_SUMMARY_METRICS } from './UsageSummary.constants'
import { UsageSummaryMetricItem } from './UsageSummaryMetric'

export interface ComputeProps {
  orgSlug: string
  projectRef?: string | null
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
}

const METRICS_TO_HIDE_WITH_NO_USAGE: PricingMetric[] = [
  PricingMetric.DISK_IOPS_IO2,
  PricingMetric.DISK_IOPS_GP3,
  PricingMetric.DISK_SIZE_GB_HOURS_GP3,
  PricingMetric.DISK_SIZE_GB_HOURS_IO2,
  PricingMetric.DISK_THROUGHPUT_GP3,
  PricingMetric.LOG_INGESTION,
  PricingMetric.LOG_STORAGE,
  PricingMetric.LOG_QUERYING,
  PricingMetric.ACTIVE_COMPUTE_HOURS,
]

export const TotalUsage = ({
  orgSlug,
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: ComputeProps) => {
  const isMobile = useBreakpoint('md')

  const {
    data: usage,
    error: usageError,
    isPending: isLoadingUsage,
    isError: isErrorUsage,
    isSuccess: isSuccessUsage,
  } = useOrgUsageQuery({
    orgSlug,
    projectRef,
    start: !currentBillingCycleSelected && startDate ? new Date(startDate) : undefined,
    end: !currentBillingCycleSelected && endDate ? new Date(endDate) : undefined,
  })

  // When the user filters by project ref or selects a custom timeframe, we only display usage+project breakdown, but no costs/limits
  const showRelationToSubscription = currentBillingCycleSelected && !projectRef

  const isOnHigherPlan = ['team', 'enterprise', 'platform'].includes(subscription?.plan.id ?? '')

  const hasExceededAnyLimits =
    showRelationToSubscription &&
    Boolean(
      usage?.usages.find(
        (usageItem) =>
          // Filter out compute as compute has no quota and is always being charged for
          !usageItem.metric.startsWith('COMPUTE_') &&
          !usageItem.unlimited &&
          usageItem.usage > (usageItem?.pricing_free_units ?? 0)
      )
    )

  const sortedUsageMetrics = useMemo(() => {
    if (!usage) return []

    const breakdownMetrics = USAGE_SUMMARY_METRICS.filter((metric) =>
      usage.usages.some((usage) => usage.metric === metric.key)
    ).filter((metric) => {
      if (!METRICS_TO_HIDE_WITH_NO_USAGE.includes(metric.key as PricingMetric)) return true

      const metricUsage = usage.usages.find((it) => it.metric === metric.key)

      return metricUsage && metricUsage.usage > 0
    })

    return breakdownMetrics.slice().sort((a, b) => {
      const usageMetaA = usage.usages.find((x) => x.metric === a.key)
      const usageRatioA =
        typeof usageMetaA !== 'number'
          ? (usageMetaA?.usage ?? 0) / (usageMetaA?.pricing_free_units ?? 0)
          : 0

      const usageMetaB = usage.usages.find((x) => x.metric === b.key)
      const usageRatioB =
        typeof usageMetaB !== 'number'
          ? (usageMetaB?.usage ?? 0) / (usageMetaB?.pricing_free_units ?? 0)
          : 0

      return (
        // Sort unavailable features to bottom
        Number(usageMetaB?.available_in_plan) - Number(usageMetaA?.available_in_plan) ||
        // Sort high-usage features to top
        usageRatioB - usageRatioA
      )
    })
  }, [usage])

  const computeMetrics = (usage?.usages || [])
    .filter((it) => it.metric.startsWith('COMPUTE'))
    .map((it) => it.metric) as ComputeUsageMetric[]

  return (
    <div id="summary">
      <SectionContent
        section={{
          name: 'Usage Summary',
          description:
            'Your plan includes a limited amount of usage. If exceeded, access may be limited based on your plan. It may take up to 1 hour to refresh.',
        }}
      >
        {isLoadingUsage && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {isErrorUsage && <AlertError subject="Failed to retrieve usage data" error={usageError} />}

        {isSuccessUsage && subscription && (
          <div>
            {showRelationToSubscription && !isOnHigherPlan && (
              <p className="text-sm">
                {!hasExceededAnyLimits ? (
                  <span>
                    You have not exceeded your{' '}
                    <span className="font-medium">{subscription?.plan.name}</span> Plan quota in
                    this period.
                  </span>
                ) : hasExceededAnyLimits ? (
                  <span>
                    You have exceeded your{' '}
                    <span className="font-medium">{subscription?.plan.name}</span> Plan quota in
                    this period.
                  </span>
                ) : (
                  <span>
                    You have not exceeded your{' '}
                    <span className="font-medium">{subscription?.plan.name}</span> Plan quota in
                    this period.
                  </span>
                )}
              </p>
            )}
            <div className="grid grid-cols-2 mt-3 gap-[1px] bg-border">
              {sortedUsageMetrics.map((metric, i) => {
                return (
                  <div
                    key={metric.key}
                    className={cn('col-span-2 md:col-span-1 bg-sidebar space-y-4 py-4')}
                  >
                    <UsageSummaryMetricItem
                      orgSlug={orgSlug}
                      metric={metric}
                      usage={usage}
                      relativeToSubscription={showRelationToSubscription}
                      className={cn(i % 2 === 0 ? 'md:pr-4' : 'md:pl-4')}
                    />
                  </div>
                )
              })}

              {computeMetrics.map((metric, i) => {
                return (
                  <div
                    key={metric}
                    className={cn('col-span-2 md:col-span-1 bg-sidebar space-y-4 py-4')}
                  >
                    <UsageSummaryMetricItem
                      orgSlug={orgSlug}
                      metric={{
                        key: metric,
                        name: computeUsageMetricLabel(metric) + ' Compute Hours' || metric,
                        units: 'hours',
                        anchor: 'compute',
                        category: 'Compute',
                        unitName: 'hours',
                      }}
                      relativeToSubscription={showRelationToSubscription}
                      usage={usage}
                      className={cn(
                        (i + sortedUsageMetrics.length) % 2 === 0 ? 'md:pr-4' : 'md:pl-4'
                      )}
                    />
                  </div>
                )
              })}

              {!isMobile && (sortedUsageMetrics.length + computeMetrics.length) % 2 === 1 && (
                <div className="col-span-2 md:col-span-1 bg-sidebar" />
              )}
            </div>
          </div>
        )}
      </SectionContent>
    </div>
  )
}
