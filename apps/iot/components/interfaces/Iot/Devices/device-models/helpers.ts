import { uuidv4 } from 'lib/helpers'
import {
  DEFAULT_COAP_CONFIG,
  DEFAULT_DEVICE_LWM2M_CONFIG,
  DEFAULT_DEVICE_SNMP_CONFIG,
  DEFAULT_LWM2M_CONFIG,
  DEFAULT_MQTT_CONFIG,
  DEFAULT_PROVISION_CONFIG,
  DEFAULT_SNMP_CONFIG,
} from './constants'

export type DeviceModelAttributeRow = {
  id: string
  name: string
  key: string
  valueType: string
  defaultValue: string
}

export const buildDeviceModelAttributeRow = (
  patch: Partial<DeviceModelAttributeRow> = {}
): DeviceModelAttributeRow => ({
  id: uuidv4(),
  name: '',
  key: '',
  valueType: 'string',
  defaultValue: '',
  ...patch,
})

export const formatAttributeValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

export const inferAttributeValueType = (value: unknown) => {
  if (value === null || value === undefined) return 'string'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number'
  if (typeof value === 'object') return 'json'
  return 'string'
}

export const normalizeProfileAttributes = (profileConfig: Record<string, any> | null) => {
  if (!profileConfig) return []
  const raw = profileConfig.attributes
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.map((entry) => {
      const key = typeof entry?.key === 'string' ? entry.key : String(entry?.key ?? '')
      const name =
        typeof entry?.name === 'string' && entry.name.trim().length > 0 ? entry.name : key
      const rawValue = entry?.default_value ?? entry?.default ?? entry?.value
      const valueType =
        typeof entry?.value_type === 'string'
          ? entry.value_type
          : typeof entry?.type === 'string'
            ? entry.type
            : typeof entry?.valueType === 'string'
              ? entry.valueType
              : inferAttributeValueType(rawValue)
      return buildDeviceModelAttributeRow({
        name,
        key,
        valueType,
        defaultValue: formatAttributeValue(rawValue),
      })
    })
  }

  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([key, value]) =>
      buildDeviceModelAttributeRow({
        name: key,
        key,
        valueType: inferAttributeValueType(value),
        defaultValue: formatAttributeValue(value),
      })
    )
  }

  return []
}

export const parseAttributeValue = (rawValue: string, valueType: string) => {
  const trimmed = rawValue.trim()
  const normalizedType = valueType.toLowerCase()

  if (!trimmed) {
    return { error: 'Value is required.' }
  }

  if (normalizedType === 'number') {
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) return { error: 'Value must be a number.' }
    return { value: parsed }
  }

  if (normalizedType === 'integer') {
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      return { error: 'Value must be an integer.' }
    }
    return { value: parsed }
  }

  if (normalizedType === 'bool' || normalizedType === 'boolean') {
    const lower = trimmed.toLowerCase()
    if (['true', '1', 'yes'].includes(lower)) return { value: true }
    if (['false', '0', 'no'].includes(lower)) return { value: false }
    return { error: 'Value must be true or false.' }
  }

  if (normalizedType === 'json') {
    try {
      return { value: JSON.parse(trimmed) }
    } catch {
      return { error: 'Value must be valid JSON.' }
    }
  }

  return { value: trimmed }
}

export const buildProfileAttributesPayload = (rows: DeviceModelAttributeRow[]) => {
  const payload: { key: string; name: string; value_type: string; default_value: unknown }[] = []
  const usedKeys = new Set<string>()

  for (const row of rows) {
    const key = row.key.trim()
    const name = row.name.trim()
    const valueType = row.valueType.trim().toLowerCase()
    const rawValue = row.defaultValue ?? ''

    if (!key && !name && !rawValue.trim()) continue
    if (!name) return { error: 'Attribute name is required.' }
    if (!key) return { error: 'Attribute key is required.' }
    if (!valueType) return { error: 'Attribute type is required.' }

    if (usedKeys.has(key)) {
      return { error: `Attribute key "${key}" is duplicated.` }
    }

    const parsed = parseAttributeValue(rawValue, valueType)
    if (parsed.error) {
      return { error: `${key}: ${parsed.error}` }
    }

    usedKeys.add(key)
    payload.push({
      key,
      name,
      value_type: valueType,
      default_value: parsed.value,
    })
  }

  return { payload }
}

export const createDefaultLwm2mBootstrapServer = () => ({
  host: '',
  port: 5685,
  securityMode: 'NO_SEC',
  securityHost: '',
  securityPort: 0,
  serverPublicKey: '',
  serverCertificate: '',
  clientHoldOffTime: 1,
  shortServerId: 123,
  bootstrapServerAccountTimeout: 0,
  lifetime: 300,
  defaultMinPeriod: 1,
  notifIfDisabled: true,
  binding: 'U',
  bootstrapServerIs: false,
})

export const parseListInput = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

export const isSnmpQueryingSpec = (spec?: string) =>
  spec === 'TELEMETRY_QUERYING' || spec === 'CLIENT_ATTRIBUTES_QUERYING'

export const normalizeMqttConfig = (input: Record<string, any> | null | undefined) => {
  const config = input ?? {}
  const payloadConfig = config.transportPayloadTypeConfiguration ?? {}

  return {
    ...DEFAULT_MQTT_CONFIG,
    ...config,
    transportPayloadTypeConfiguration: {
      ...DEFAULT_MQTT_CONFIG.transportPayloadTypeConfiguration,
      ...payloadConfig,
    },
  }
}

export const normalizeCoapConfig = (input: Record<string, any> | null | undefined) => {
  const config = input ?? {}
  const typeConfig = config.coapDeviceTypeConfiguration ?? {}
  const payloadConfig = typeConfig.transportPayloadTypeConfiguration ?? {}

  return {
    ...DEFAULT_COAP_CONFIG,
    ...config,
    coapDeviceTypeConfiguration: {
      ...DEFAULT_COAP_CONFIG.coapDeviceTypeConfiguration,
      ...typeConfig,
      transportPayloadTypeConfiguration: {
        ...DEFAULT_COAP_CONFIG.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration,
        ...payloadConfig,
      },
    },
    clientSettings: {
      ...DEFAULT_COAP_CONFIG.clientSettings,
      ...(config.clientSettings ?? {}),
    },
  }
}

export const normalizeLwm2mConfig = (input: Record<string, any> | null | undefined) => {
  const config = input ?? {}
  const observeAttr = config.observeAttr ?? {}
  const clientSettings = config.clientLwM2mSettings ?? {}

  return {
    ...DEFAULT_LWM2M_CONFIG,
    ...config,
    observeAttr: {
      ...DEFAULT_LWM2M_CONFIG.observeAttr,
      ...observeAttr,
    },
    clientLwM2mSettings: {
      ...DEFAULT_LWM2M_CONFIG.clientLwM2mSettings,
      ...clientSettings,
    },
    bootstrap: Array.isArray(config.bootstrap)
      ? config.bootstrap
      : DEFAULT_LWM2M_CONFIG.bootstrap,
  }
}

export const normalizeSnmpConfig = (input: Record<string, any> | null | undefined) => {
  const config = input ?? {}

  return {
    ...DEFAULT_SNMP_CONFIG,
    ...config,
    communicationConfigs: Array.isArray(config.communicationConfigs)
      ? config.communicationConfigs
      : DEFAULT_SNMP_CONFIG.communicationConfigs,
  }
}

export const normalizeDeviceLwm2mConfig = (input: Record<string, any> | null | undefined) => ({
  ...DEFAULT_DEVICE_LWM2M_CONFIG,
  ...(input ?? {}),
})

export const normalizeDeviceSnmpConfig = (input: Record<string, any> | null | undefined) => ({
  ...DEFAULT_DEVICE_SNMP_CONFIG,
  ...(input ?? {}),
})

export const normalizeProvisionConfig = (input: Record<string, any> | null | undefined) => ({
  ...DEFAULT_PROVISION_CONFIG,
  ...(input ?? {}),
})

export const buildProvisionConfig = (config: typeof DEFAULT_PROVISION_CONFIG) => {
  if (config.type === 'DISABLED') {
    return { type: 'DISABLED' }
  }
  if (config.type === 'X509_CERTIFICATE_CHAIN') {
    return {
      type: 'X509_CERTIFICATE_CHAIN',
      certificateValue: config.certificateValue,
      certificateRegExPattern: config.certificateRegExPattern,
      allowCreateNewDevicesByX509Certificate: config.allowCreateNewDevicesByX509Certificate,
    }
  }
  if (config.type === 'ENCRYPTION') {
    return {
      type: 'ENCRYPTION',
      encryptionType: config.encryptionType,
      encryptionKey: config.encryptionKey,
    }
  }
  return {
    type: config.type,
    provisionDeviceKey: config.provisionDeviceKey,
    provisionDeviceSecret: config.provisionDeviceSecret,
  }
}
