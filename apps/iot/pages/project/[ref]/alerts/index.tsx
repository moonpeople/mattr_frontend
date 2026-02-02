import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import {
  ReportsSelectFilter,
  type SelectFilters,
} from 'components/interfaces/Reports/v2/ReportsSelectFilter'
import { useIotDevicesQuery } from 'data/iot/devices'
import {
  useIotAlertsQuery,
  useIotAlertStatusMutation,
  type IotAlertQueryParams,
} from 'data/iot/alerts'
import type { IotDevice, IotDeviceAlert } from 'data/iot/types'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader, PageHeaderDescription, PageHeaderTitle } from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '--')

const buildDeviceLabel = (device?: IotDevice | null) => {
  if (!device) return '--'
  return device.name || device.serial_number || `#${device.id}`
}

const formatAlertStatus = (status?: string | null) => {
  if (!status) return '--'
  return status.replace(/_/g, ' ')
}

const normalizeAlertStatus = (status?: string | null) =>
  (status || '').toString().trim().toUpperCase()

const statusVariant = (status?: string | null): 'default' | 'warning' | 'success' => {
  const normalized = normalizeAlertStatus(status)
  if (normalized.startsWith('CLEARED')) return 'success'
  if (normalized.startsWith('ACTIVE')) return 'warning'
  return 'default'
}

const severityVariant = (severity?: string | null): 'default' | 'warning' | 'destructive' => {
  const normalized = (severity || '').toLowerCase()
  if (normalized === 'critical' || normalized === 'major') return 'destructive'
  if (normalized === 'warning' || normalized === 'minor') return 'warning'
  return 'default'
}

const AlertsPage: NextPageWithLayout = () => {
  const { data: devices = [] } = useIotDevicesQuery()

  const [alertSearch, setAlertSearch] = useState('')
  const [deviceFilters, setDeviceFilters] = useState<SelectFilters>([])
  const [statusFilters, setStatusFilters] = useState<SelectFilters>([])
  const [severityFilters, setSeverityFilters] = useState<SelectFilters>([])
  const [typeFilters, setTypeFilters] = useState<SelectFilters>([])
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const order: 'asc' | 'desc' = 'desc'
  const limit = '200'
  const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false)
  const [assigneeAlert, setAssigneeAlert] = useState<IotDeviceAlert | null>(null)
  const [assigneeValue, setAssigneeValue] = useState('')

  const queryParams = useMemo<IotAlertQueryParams>(() => {
    return {
      device_id: deviceFilters.length === 1 ? deviceFilters[0] : undefined,
      search_status: statusFilters.length === 1 ? statusFilters[0] : undefined,
      severity: severityFilters.length === 1 ? severityFilters[0] : undefined,
      type: typeFilters.length === 1 ? typeFilters[0] : undefined,
      assignee_id: assigneeSearch.trim() || undefined,
      limit: limit.trim() || undefined,
      order,
    }
  }, [
    deviceFilters,
    statusFilters,
    severityFilters,
    typeFilters,
    assigneeSearch,
    limit,
    order,
  ])

  const deviceMap = useMemo(() => {
    return new Map<number, IotDevice>(devices.map((device) => [device.id, device]))
  }, [devices])

  const {
    data: alerts = [],
    isPending,
    isError,
    error,
  } = useIotAlertsQuery({
    params: queryParams,
  })

  const { mutateAsync: updateStatus, isPending: isUpdating } = useIotAlertStatusMutation()

  const onUpdateAlert = async (
    alert: IotDeviceAlert,
    payload: { cleared?: boolean; acknowledged?: boolean },
    successMessage: string
  ) => {
    try {
      await updateStatus({ alertId: alert.id, payload })
      toast.success(successMessage)
    } catch (err) {
      toast.error('Failed to update alert status')
    }
  }

  const openAssigneeDialog = (alert: IotDeviceAlert) => {
    setAssigneeAlert(alert)
    setAssigneeValue(alert.assignee_id ?? '')
    setAssigneeDialogOpen(true)
  }

  const closeAssigneeDialog = () => {
    setAssigneeDialogOpen(false)
    setAssigneeAlert(null)
    setAssigneeValue('')
  }

  const onSaveAssignee = async () => {
    if (!assigneeAlert) return
    try {
      await updateStatus({
        alertId: assigneeAlert.id,
        payload: { assignee_id: assigneeValue.trim() || null },
      })
      toast.success('Assignee updated')
      closeAssigneeDialog()
    } catch (err) {
      toast.error('Failed to update assignee')
    }
  }

  const alertTypeOptions = useMemo(() => {
    const types = new Set<string>()
    alerts.forEach((alert) => {
      if (alert.alert_type) types.add(alert.alert_type)
    })
    return Array.from(types)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }))
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    const search = alertSearch.trim().toLowerCase()
    return alerts.filter((alert) => {
      const device = deviceMap.get(alert.device_id)
      const normalizedStatus = normalizeAlertStatus(alert.status)
      const severityValue = (alert.severity || '').toUpperCase()
      const alertType = alert.alert_type || ''
      const assignee = alert.assignee_id || ''

      if (deviceFilters.length > 0 && !deviceFilters.includes(String(alert.device_id))) {
        return false
      }

      if (
        statusFilters.length > 0 &&
        !statusFilters.some((filter) => {
          if (filter === 'ACTIVE') return normalizedStatus.startsWith('ACTIVE')
          if (filter === 'CLEARED') return normalizedStatus.startsWith('CLEARED')
          if (filter === 'ACK') return normalizedStatus.endsWith('_ACK')
          if (filter === 'UNACK') return normalizedStatus.endsWith('_UNACK')
          return false
        })
      ) {
        return false
      }

      if (severityFilters.length > 0 && !severityFilters.includes(severityValue)) {
        return false
      }

      if (typeFilters.length > 0 && !typeFilters.includes(alertType)) {
        return false
      }

      if (
        assigneeSearch.trim() &&
        !assignee.toLowerCase().includes(assigneeSearch.trim().toLowerCase())
      ) {
        return false
      }

      if (search) {
        const deviceLabel = buildDeviceLabel(device).toLowerCase()
        const haystack = [
          deviceLabel,
          alertType,
          alert.message || '',
          alert.severity || '',
          alert.status || '',
          assignee,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(search)) return false
      }

      return true
    })
  }, [
    alerts,
    alertSearch,
    deviceMap,
    deviceFilters,
    statusFilters,
    severityFilters,
    typeFilters,
    assigneeSearch,
  ])

  const emptyAlertMessage =
    alerts.length === 0 ? 'No alerts yet.' : 'No alerts match your filters.'

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>Alerts</PageHeaderTitle>
        <PageHeaderDescription>
          Review alerts created by rule chains and update their status.
        </PageHeaderDescription>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                <Input
                  placeholder="Search alerts"
                  size="tiny"
                  icon={<Search />}
                  value={alertSearch}
                  className="w-full lg:w-56"
                  onChange={(event) => setAlertSearch(event.target.value)}
                />
                <ReportsSelectFilter
                  label="Device"
                  options={devices.map((device) => ({
                    label: buildDeviceLabel(device),
                    value: String(device.id),
                  }))}
                  value={deviceFilters}
                  onChange={setDeviceFilters}
                  showSearch
                />
                <ReportsSelectFilter
                  label="Status"
                  options={[
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Cleared', value: 'CLEARED' },
                    { label: 'Ack', value: 'ACK' },
                    { label: 'Unack', value: 'UNACK' },
                  ]}
                  value={statusFilters}
                  onChange={setStatusFilters}
                />
                <ReportsSelectFilter
                  label="Severity"
                  options={[
                    { label: 'Critical', value: 'CRITICAL' },
                    { label: 'Major', value: 'MAJOR' },
                    { label: 'Minor', value: 'MINOR' },
                    { label: 'Warning', value: 'WARNING' },
                    { label: 'Indeterminate', value: 'INDETERMINATE' },
                  ]}
                  value={severityFilters}
                  onChange={setSeverityFilters}
                />
                <ReportsSelectFilter
                  label="Type"
                  options={alertTypeOptions}
                  value={typeFilters}
                  onChange={setTypeFilters}
                  showSearch
                />
                <Input
                  placeholder="Assignee id"
                  size="tiny"
                  value={assigneeSearch}
                  className="w-full lg:w-40"
                  onChange={(event) => setAssigneeSearch(event.target.value)}
                />
              </div>
            </div>
            <Alert variant="info" withIcon title="Alerts highlight important device events">
              Filter by severity, status, or type to focus on critical signals.
            </Alert>
            {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
            <Card>
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-sm text-foreground-light">
                          Loading alerts...
                        </TableCell>
                      </TableRow>
                    ) : filteredAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-sm text-foreground-light">
                          {emptyAlertMessage}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAlerts.map((alert) => {
                        const device = deviceMap.get(alert.device_id)
                        const normalized = normalizeAlertStatus(alert.status)
                        const isCleared = alert.cleared ?? normalized.startsWith('CLEARED')
                        const isAck = alert.acknowledged ?? normalized.endsWith('_ACK')
                        return (
                          <TableRow key={alert.id}>
                            <TableCell>{formatDate(alert.inserted_at)}</TableCell>
                            <TableCell>{buildDeviceLabel(device)}</TableCell>
                            <TableCell>{alert.alert_type ?? '--'}</TableCell>
                            <TableCell>
                              <Badge variant={severityVariant(alert.severity)}>
                                {alert.severity ?? 'unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(alert.status)}>
                                {formatAlertStatus(alert.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate">
                              {alert.assignee_id ?? '--'}
                            </TableCell>
                            <TableCell className="max-w-[280px] truncate">
                              {alert.message ?? '--'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="tiny"
                                  type="default"
                                  onClick={() => openAssigneeDialog(alert)}
                                  disabled={isUpdating}
                                >
                                  {alert.assignee_id ? 'Edit' : 'Assign'}
                                </Button>
                                <Button
                                  size="tiny"
                                  type="default"
                                  onClick={() =>
                                    onUpdateAlert(
                                      alert,
                                      { acknowledged: !isAck },
                                      isAck ? 'Alert unacknowledged' : 'Alert acknowledged'
                                    )
                                  }
                                  disabled={isUpdating}
                                >
                                  {isAck ? 'Unack' : 'Ack'}
                                </Button>
                                <Button
                                  size="tiny"
                                  type="default"
                                  onClick={() =>
                                    onUpdateAlert(
                                      alert,
                                      { cleared: !isCleared },
                                      isCleared ? 'Alert reopened' : 'Alert cleared'
                                    )
                                  }
                                  disabled={isUpdating}
                                >
                                  {isCleared ? 'Reopen' : 'Clear'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
            </Card>
          </div>
        </PageSectionContent>
      </PageSection>
      <Dialog
        open={assigneeDialogOpen}
        onOpenChange={(open) => (open ? setAssigneeDialogOpen(true) : closeAssigneeDialog())}
      >
        <DialogContent size="small">
          <DialogHeader padding="small">
            <DialogTitle>Assign alert</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection padding="small" className="space-y-4">
            <Input
              id="alert-assignee-input"
              label="Assignee ID"
              placeholder="user_id"
              value={assigneeValue}
              onChange={(event) => setAssigneeValue(event.target.value)}
            />
            <p className="text-sm text-foreground-light">
              Leave empty to clear assignment.
            </p>
          </DialogSection>
          <DialogFooter padding="small">
            <Button type="default" onClick={closeAssigneeDialog}>
              Cancel
            </Button>
            <Button type="primary" onClick={onSaveAssignee} disabled={!assigneeAlert}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

AlertsPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default AlertsPage
