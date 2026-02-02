export const TRANSPORT_TYPES = [
  { label: 'HTTP', value: 'http' },
  { label: 'MQTT', value: 'mqtt' },
  { label: 'CoAP', value: 'coap' },
  { label: 'LwM2M', value: 'lwm2m' },
  { label: 'SNMP', value: 'snmp' },
]

export const TRANSPORT_PAYLOAD_TYPES = [
  { label: 'JSON', value: 'JSON' },
  { label: 'Protobuf', value: 'PROTOBUF' },
]

export const SENSOR_VALUE_TYPES = [
  { label: 'Number', value: 'number' },
  { label: 'Integer', value: 'integer' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'String', value: 'string' },
  { label: 'JSON', value: 'json' },
]

export const SENSOR_CHART_TYPES = [
  { label: 'Line', value: 'line' },
  { label: 'Area', value: 'area' },
  { label: 'Bar', value: 'bar' },
]

export const COAP_DEVICE_TYPES = [
  { label: 'Default', value: 'DEFAULT' },
  { label: 'Efento', value: 'EFENTO' },
]

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

export const SNMP_SECURITY_LEVELS = [
  { label: 'No auth / no priv', value: 'NO_AUTH_NO_PRIV' },
  { label: 'Auth / no priv', value: 'AUTH_NO_PRIV' },
  { label: 'Auth / priv', value: 'AUTH_PRIV' },
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

export const SNMP_SPEC_TYPES = [
  { label: 'Телеметрия (SNMP GET)', value: 'TELEMETRY_QUERYING' },
  { label: 'Атрибуты клиента (SNMP GET)', value: 'CLIENT_ATTRIBUTES_QUERYING' },
  { label: 'Общие атрибуты (SNMP SET)', value: 'SHARED_ATTRIBUTES_SETTING' },
  { label: 'RPC к устройству (SNMP GET/SET)', value: 'TO_DEVICE_RPC_REQUEST' },
  { label: 'RPC от устройства (SNMP TRAP)', value: 'TO_SERVER_RPC_REQUEST' },
]

export const SNMP_DATA_TYPES = [
  { label: 'Строка', value: 'STRING' },
  { label: 'Целое', value: 'LONG' },
  { label: 'Булево', value: 'BOOLEAN' },
  { label: 'Дробное', value: 'DOUBLE' },
  { label: 'JSON', value: 'JSON' },
]

export const LWM2M_OBSERVE_STRATEGIES = [
  { label: 'Одиночная', value: 'SINGLE' },
  { label: 'Композит (все)', value: 'COMPOSITE_ALL' },
  { label: 'Композит (по объекту)', value: 'COMPOSITE_BY_OBJECT' },
]

export const LWM2M_BINDINGS = [
  { label: 'U', value: 'U' },
  { label: 'UQ', value: 'UQ' },
  { label: 'UQS', value: 'UQS' },
  { label: 'M', value: 'M' },
  { label: 'H', value: 'H' },
  { label: 'T', value: 'T' },
  { label: 'S', value: 'S' },
  { label: 'N', value: 'N' },
  { label: 'TQ', value: 'TQ' },
  { label: 'TQS', value: 'TQS' },
  { label: 'SQ', value: 'SQ' },
]

export const LWM2M_SECURITY_MODES = [
  { label: 'Без безопасности', value: 'NO_SEC' },
  { label: 'PSK', value: 'PSK' },
  { label: 'RPK', value: 'RPK' },
  { label: 'X.509', value: 'X509' },
]

export const LWM2M_OBJECT_ID_VERSIONS = [
  { label: '1.0', value: '1.0' },
  { label: '1.1', value: '1.1' },
  { label: '1.2', value: '1.2' },
]

export const LWM2M_FW_UPDATE_STRATEGIES = [
  { label: 'Пакет', value: 1 },
  { label: 'URI пакета', value: 2 },
  { label: 'Данные', value: 3 },
]

export const LWM2M_SW_UPDATE_STRATEGIES = [
  { label: 'Пакет', value: 1 },
  { label: 'URI пакета', value: 2 },
]

export const PROVISION_TYPES = [
  { label: 'Disabled', value: 'DISABLED' },
  { label: 'Allow create new devices', value: 'ALLOW_CREATE_NEW_DEVICES' },
  { label: 'Check pre-provisioned devices', value: 'CHECK_PRE_PROVISIONED_DEVICES' },
  { label: 'X509 certificate chain', value: 'X509_CERTIFICATE_CHAIN' },
  { label: 'Encryption', value: 'ENCRYPTION' },
]

export const MODEL_WIZARD_STEPS = [
  { label: 'Details', value: 'details' },
  { label: 'Data type keys', value: 'data-type-keys' },
  { label: 'Attributes', value: 'attributes' },
  { label: 'Messages', value: 'messages' },
  { label: 'Alerts', value: 'alerts' },
  { label: 'Initialization', value: 'initialization' },
]

export const DEFAULT_MQTT_CONFIG = {
  deviceTelemetryTopic: '',
  deviceAttributesTopic: '',
  deviceAttributesSubscribeTopic: '',
  sparkplug: false,
  sparkplugAttributesMetricNames: [] as string[],
  sendAckOnValidationException: false,
  transportPayloadTypeConfiguration: {
    transportPayloadType: 'JSON',
    enableCompatibilityWithJsonPayloadFormat: false,
    useJsonPayloadFormatForDefaultDownlinkTopics: false,
    deviceTelemetryProtoSchema: '',
    deviceAttributesProtoSchema: '',
    deviceRpcRequestProtoSchema: '',
    deviceRpcResponseProtoSchema: '',
  },
}

export const DEFAULT_PROVISION_CONFIG = {
  type: 'DISABLED',
  provisionDeviceKey: '',
  provisionDeviceSecret: '',
  certificateValue: '',
  certificateRegExPattern: '(.*)',
  allowCreateNewDevicesByX509Certificate: false,
  encryptionType: 'AES128',
  encryptionKey: '',
}

export const DEFAULT_COAP_CONFIG = {
  coapDeviceTypeConfiguration: {
    coapDeviceType: 'DEFAULT',
    transportPayloadTypeConfiguration: {
      transportPayloadType: 'JSON',
      deviceTelemetryProtoSchema: '',
      deviceAttributesProtoSchema: '',
      deviceRpcRequestProtoSchema: '',
      deviceRpcResponseProtoSchema: '',
    },
  },
  clientSettings: {
    powerMode: 'DRX',
    edrxCycle: 0,
    pagingTransmissionWindow: 0,
    psmActivityTimer: 0,
  },
}

export const DEFAULT_LWM2M_CONFIG = {
  bootstrapServerUpdateEnable: false,
  objectIds: [] as number[],
  bootstrap: [] as Record<string, unknown>[],
  observeAttr: {
    keyName: {},
    observe: [] as string[],
    attribute: [] as string[],
    telemetry: [] as string[],
    attributeLwm2m: {},
    initAttrTelAsObsStrategy: false,
    observeStrategy: 'SINGLE',
  },
  clientLwM2mSettings: {
    useObject19ForOtaInfo: false,
    fwUpdateStrategy: 1,
    swUpdateStrategy: 1,
    clientOnlyObserveAfterConnect: 1,
    powerMode: 'DRX',
    psmActivityTimer: 0,
    edrxCycle: 0,
    pagingTransmissionWindow: 0,
    fwUpdateResource: '',
    swUpdateResource: '',
    defaultObjectIDVer: '1.0',
  },
}

export const DEFAULT_SNMP_CONFIG = {
  snmpVersion: 'V2C',
  securityLevel: 'NO_AUTH_NO_PRIV',
  community: 'public',
  securityName: 'public',
  authProtocol: 'SHA_512',
  authPassphrase: '',
  privacyProtocol: 'DES',
  privacyPassphrase: '',
  timeoutMs: 5000,
  retries: 1,
  communicationConfigs: [] as Record<string, unknown>[],
}

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
