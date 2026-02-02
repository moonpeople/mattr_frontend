export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '--'

const normalizeAlertStatus = (status?: string | null) =>
  (status || '').toString().trim().toUpperCase()

export const formatAlertStatus = (status?: string | null) => {
  if (!status) return '--'
  return status.replace(/_/g, ' ')
}

export const alertStatusVariant = (
  status?: string | null
): 'default' | 'warning' | 'success' => {
  const normalized = normalizeAlertStatus(status)
  if (normalized.startsWith('CLEARED')) return 'success'
  if (normalized.startsWith('ACTIVE')) return 'warning'
  return 'default'
}

export const alertSeverityVariant = (
  severity?: string | null
): 'default' | 'warning' | 'destructive' => {
  const normalized = (severity || '').toString().toLowerCase()
  if (normalized === 'critical' || normalized === 'major') return 'destructive'
  if (normalized === 'warning' || normalized === 'minor') return 'warning'
  return 'default'
}
