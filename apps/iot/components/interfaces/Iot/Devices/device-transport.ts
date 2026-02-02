export const POWER_MODES = [
  { label: 'DRX', value: 'DRX' },
  { label: 'PSM', value: 'PSM' },
  { label: 'E-DRX', value: 'E_DRX' },
]

export const SNMP_PROTOCOL_VERSIONS = [
  { label: 'V1', value: 'V1' },
  { label: 'V2C', value: 'V2C' },
  { label: 'V3', value: 'V3' },
]

export const SNMP_AUTH_PROTOCOLS = [
  { label: 'SHA-1', value: 'SHA_1' },
  { label: 'SHA-224', value: 'SHA_224' },
  { label: 'SHA-256', value: 'SHA_256' },
  { label: 'SHA-384', value: 'SHA_384' },
  { label: 'SHA-512', value: 'SHA_512' },
  { label: 'MD5', value: 'MD5' },
]

export const SNMP_PRIVACY_PROTOCOLS = [
  { label: 'DES', value: 'DES' },
  { label: 'AES-128', value: 'AES_128' },
  { label: 'AES-192', value: 'AES_192' },
  { label: 'AES-256', value: 'AES_256' },
]

export const DEFAULT_DEVICE_LWM2M_CONFIG = {
  powerMode: 'DRX',
  edrxCycle: 0,
  pagingTransmissionWindow: 0,
  psmActivityTimer: 0,
}

export const DEFAULT_DEVICE_SNMP_CONFIG = {
  host: '',
  port: 161,
  protocolVersion: 'V2C',
  community: 'public',
  username: '',
  securityName: 'public',
  contextName: '',
  authenticationProtocol: 'SHA_512',
  authenticationPassphrase: '',
  privacyProtocol: 'DES',
  privacyPassphrase: '',
  engineId: '',
}

export const normalizeDeviceLwm2mConfig = (input: Record<string, any> | null | undefined) => ({
  ...DEFAULT_DEVICE_LWM2M_CONFIG,
  ...(input ?? {}),
})

export const normalizeDeviceSnmpConfig = (input: Record<string, any> | null | undefined) => ({
  ...DEFAULT_DEVICE_SNMP_CONFIG,
  ...(input ?? {}),
})
