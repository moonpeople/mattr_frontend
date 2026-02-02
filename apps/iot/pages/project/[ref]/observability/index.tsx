import { useEffect } from 'react'

import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import {
  useIotObservabilityBatchEventsQuery,
  useIotObservabilityFailedMessagesQuery,
  useIotObservabilityIngestErrorsQuery,
  useIotObservabilityRuleAlarmsQuery,
  useIotObservabilityRuleLogsQuery,
  useIotObservabilityRuleStepsQuery,
  useIotObservabilitySummaryQuery,
} from 'data/iot/observability'
import type {
  IotBatchEvent,
  IotFailedMessage,
  IotIngestError,
  IotRuleAlarm,
  IotRuleLog,
  IotRuleStep,
} from 'data/iot/observability'
import { getIotApiBaseUrl } from 'lib/iot'
import type { NextPageWithLayout } from 'types'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader, PageHeaderDescription, PageHeaderTitle } from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '--')

const StatusBadge = ({ status }: { status?: string | null }) => {
  if (!status) return <span className="text-sm text-foreground-light">--</span>
  const normalized = status.toLowerCase()
  const variant = normalized === 'ok' ? 'success' : 'warning'
  return <Badge variant={variant}>{status}</Badge>
}

const StatCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <Card className="p-4">
    <p className="text-xs uppercase tracking-wide text-foreground-lighter">{label}</p>
    <p className="text-2xl font-semibold">{value}</p>
    {hint ? <p className="text-xs text-foreground-light">{hint}</p> : null}
  </Card>
)

const ObservabilityPage: NextPageWithLayout = () => {
  const summaryQuery = useIotObservabilitySummaryQuery()
  const ingestErrorsQuery = useIotObservabilityIngestErrorsQuery({ limit: 50 })
  const ruleStepsQuery = useIotObservabilityRuleStepsQuery({ limit: 100 })
  const ruleLogsQuery = useIotObservabilityRuleLogsQuery({ limit: 50 })
  const ruleAlarmsQuery = useIotObservabilityRuleAlarmsQuery({ limit: 50 })
  const batchEventsQuery = useIotObservabilityBatchEventsQuery({ limit: 10 })
  const failedMessagesQuery = useIotObservabilityFailedMessagesQuery({ limit: 50 })

  const {
    data: summary,
    isPending: isSummaryPending,
    isError: isSummaryError,
    error: summaryError,
  } = summaryQuery
  const { data: ingestErrors = [], isError: isErrorsError, error: errorsError } =
    ingestErrorsQuery
  const { data: ruleSteps = [], isError: isStepsError, error: stepsError } = ruleStepsQuery
  const { data: ruleLogs = [], isError: isLogsError, error: logsError } = ruleLogsQuery
  const { data: ruleAlarms = [], isError: isAlarmsError, error: alarmsError } = ruleAlarmsQuery
  const { data: batchEvents = [], isError: isBatchError, error: batchError } =
    batchEventsQuery
  const { data: failedMessages = [], isError: isFailedError, error: failedError } =
    failedMessagesQuery

  const { refetch: refetchSummary } = summaryQuery
  const { refetch: refetchIngestErrors } = ingestErrorsQuery
  const { refetch: refetchRuleSteps } = ruleStepsQuery
  const { refetch: refetchRuleLogs } = ruleLogsQuery
  const { refetch: refetchRuleAlarms } = ruleAlarmsQuery
  const { refetch: refetchBatchEvents } = batchEventsQuery
  const { refetch: refetchFailedMessages } = failedMessagesQuery

  useEffect(() => {
    if (typeof window === 'undefined') return
    const baseUrl = getIotApiBaseUrl()
    if (!baseUrl) return
    const source = new EventSource(`${baseUrl}/observability/stream`)
    const handleTick = () => {
      void refetchSummary()
      void refetchIngestErrors()
      void refetchRuleSteps()
      void refetchRuleLogs()
      void refetchRuleAlarms()
      void refetchBatchEvents()
      void refetchFailedMessages()
    }
    source.addEventListener('tick', handleTick)
    source.onmessage = handleTick

    return () => {
      source.close()
    }
  }, [
    refetchBatchEvents,
    refetchFailedMessages,
    refetchIngestErrors,
    refetchRuleAlarms,
    refetchRuleLogs,
    refetchRuleSteps,
    refetchSummary,
  ])

  const lastBatch = summary?.last_batch || null
  const storage = summary?.storage || null

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>Observability</PageHeaderTitle>
        <PageHeaderDescription>
          Track ingest volume, rule chain activity, and ClickHouse batch writes.
        </PageHeaderDescription>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          <div className="space-y-6">
            {isSummaryError && (
              <p className="text-sm text-destructive-600">{summaryError?.message}</p>
            )}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Kafka messages (1h)"
                value={isSummaryPending ? '--' : `${summary?.kafka_messages_last_hour ?? 0}`}
              />
              <StatCard
                label="Ingest errors (1h)"
                value={isSummaryPending ? '--' : `${summary?.kafka_errors_last_hour ?? 0}`}
              />
              <StatCard
                label="Rule steps (1h)"
                value={isSummaryPending ? '--' : `${summary?.rule_steps_last_hour ?? 0}`}
              />
              <StatCard
                label="Last batch"
                value={lastBatch?.status ? lastBatch.status : '--'}
                hint={lastBatch?.ts ? formatDate(lastBatch.ts) : 'No batches yet'}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-foreground-lighter">
                  Storage status
                </p>
                <p className="text-sm text-foreground">
                  Last ingest: {formatDate(storage?.last_ingest_ts)}
                </p>
                <p className="text-sm text-foreground">
                  Telemetry rows (1h): {storage?.telemetry_last_hour ?? 0}
                </p>
              </Card>
              <Card className="p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-foreground-lighter">
                  Last batch details
                </p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={lastBatch?.status ?? null} />
                  <span className="text-sm text-foreground-light">
                    {lastBatch?.duration_ms ? `${lastBatch.duration_ms} ms` : '--'}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  Messages: {lastBatch?.message_count ?? 0} · Rows: {lastBatch?.row_count ?? 0}
                </p>
                {lastBatch?.error_message ? (
                  <p className="text-xs text-destructive-600">{lastBatch.error_message}</p>
                ) : null}
              </Card>
            </div>

            <Card>
              <div className="px-4 pt-4 text-sm font-medium">Failed messages</div>
              <div className="px-4 pb-4 text-xs text-foreground-light">
                Messages that could not be processed at any stage.
              </div>
              {isFailedError && (
                <p className="px-4 pb-4 text-sm text-destructive-600">
                  {failedError?.message}
                </p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Message type</TableHead>
                    <TableHead>Error type</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Payload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedMessages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-sm text-foreground-light">
                        No failed messages recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    failedMessages.map((item: IotFailedMessage, index: number) => (
                      <TableRow key={`${item.ts}-${index}`}>
                        <TableCell>{formatDate(item.ts)}</TableCell>
                        <TableCell>{item.stage ?? '--'}</TableCell>
                        <TableCell>{item.device_id ?? '--'}</TableCell>
                        <TableCell>{item.protocol ?? '--'}</TableCell>
                        <TableCell>{item.message_type || '--'}</TableCell>
                        <TableCell>{item.error_type ?? '--'}</TableCell>
                        <TableCell className="max-w-[280px] truncate">
                          {item.error_message ?? '--'}
                        </TableCell>
                        <TableCell
                          className="max-w-[360px] truncate text-foreground-light"
                          title={item.payload ?? ''}
                        >
                          {item.payload ?? '--'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card>
              <div className="px-4 pt-4 text-sm font-medium">Ingest errors</div>
              <div className="px-4 pb-4 text-xs text-foreground-light">
                Most recent errors published to the DLQ.
              </div>
              {isErrorsError && (
                <p className="px-4 pb-4 text-sm text-destructive-600">{errorsError?.message}</p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingestErrors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-foreground-light">
                        No errors recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ingestErrors.map((item: IotIngestError, index: number) => (
                      <TableRow key={`${item.ts}-${index}`}>
                        <TableCell>{formatDate(item.ts)}</TableCell>
                        <TableCell>{item.device_id ?? '--'}</TableCell>
                        <TableCell>{item.protocol ?? '--'}</TableCell>
                        <TableCell>{item.error_type ?? '--'}</TableCell>
                        <TableCell className="max-w-[360px] truncate">
                          {item.error_message ?? '--'}
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
                Messages emitted by Log nodes and other log effects.
              </div>
              {isLogsError && (
                <p className="px-4 pb-4 text-sm text-destructive-600">{logsError?.message}</p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Device</TableHead>
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
                      <TableCell colSpan={7} className="text-sm text-foreground-light">
                        No rule engine logs recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ruleLogs.map((item: IotRuleLog, index: number) => (
                      <TableRow key={`${item.ts}-${index}`}>
                        <TableCell>{formatDate(item.ts)}</TableCell>
                        <TableCell>{item.device_id ?? '--'}</TableCell>
                        <TableCell>{item.rule_chain_id ?? '--'}</TableCell>
                        <TableCell>{item.node_index ?? '--'}</TableCell>
                        <TableCell>{item.node_type ?? '--'}</TableCell>
                        <TableCell>{item.label ?? '--'}</TableCell>
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
              <div className="px-4 pt-4 text-sm font-medium">Rule engine alarms</div>
              <div className="px-4 pb-4 text-xs text-foreground-light">
                Alarm lifecycle events emitted by Create/Clear Alarm nodes.
              </div>
              {isAlarmsError && (
                <p className="px-4 pb-4 text-sm text-destructive-600">{alarmsError?.message}</p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Node</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Alarm</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ruleAlarms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-sm text-foreground-light">
                        No rule engine alarms recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ruleAlarms.map((item: IotRuleAlarm, index: number) => (
                      <TableRow key={`${item.ts}-${index}`}>
                        <TableCell>{formatDate(item.ts)}</TableCell>
                        <TableCell>{item.device_id ?? '--'}</TableCell>
                        <TableCell>{item.rule_chain_id ?? '--'}</TableCell>
                        <TableCell>{item.node_index ?? '--'}</TableCell>
                        <TableCell>{item.action ?? '--'}</TableCell>
                        <TableCell>{item.alarm_type ?? '--'}</TableCell>
                        <TableCell>{item.severity ?? '--'}</TableCell>
                        <TableCell>{item.status ?? '--'}</TableCell>
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
              <div className="px-4 pt-4 text-sm font-medium">Rule chain steps</div>
              <div className="px-4 pb-4 text-xs text-foreground-light">
                Logged when RULE_ENGINE_DEBUG=true.
              </div>
              {isStepsError && (
                <p className="px-4 pb-4 text-sm text-destructive-600">{stepsError?.message}</p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Node</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outputs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ruleSteps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-foreground-light">
                        No rule chain steps recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ruleSteps.map((item: IotRuleStep, index: number) => (
                      <TableRow key={`${item.ts}-${index}`}>
                        <TableCell>{formatDate(item.ts)}</TableCell>
                        <TableCell>{item.rule_chain_id ?? '--'}</TableCell>
                        <TableCell>{item.node_index ?? '--'}</TableCell>
                        <TableCell>{item.node_type ?? '--'}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status ?? null} />
                        </TableCell>
                        <TableCell>{item.outputs ?? 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card>
              <div className="px-4 pt-4 text-sm font-medium">Batch writes</div>
              <div className="px-4 pb-4 text-xs text-foreground-light">
                Last ClickHouse insert batches.
              </div>
              {isBatchError && (
                <p className="px-4 pb-4 text-sm text-destructive-600">{batchError?.message}</p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-foreground-light">
                        No batch events recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    batchEvents.map((item: IotBatchEvent, index: number) => (
                      <TableRow key={`${item.ts}-${index}`}>
                        <TableCell>{formatDate(item.ts)}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status ?? null} />
                        </TableCell>
                        <TableCell>{item.message_count ?? 0}</TableCell>
                        <TableCell>{item.row_count ?? 0}</TableCell>
                        <TableCell>
                          {item.duration_ms ? `${item.duration_ms} ms` : '--'}
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate">
                          {item.error_message ?? '--'}
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
    </PageContainer>
  )
}

ObservabilityPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default ObservabilityPage
