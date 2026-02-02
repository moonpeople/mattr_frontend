export type IotDevice = {
  id: number
  device_uid?: string | null
  model_id?: number | null
  gateway_id?: number | null
  is_gateway?: boolean | null
  serial_number?: string | null
  name?: string | null
  description?: string | null
  receive_data?: boolean | null
  firmware_version?: string | null
  software_version?: string | null
  last_online_at?: string | null
  uptime_seconds?: number | null
  transport_config?: Record<string, unknown> | null
  inserted_at?: string
  updated_at?: string
}

export type IotDeviceCredential = {
  id: number
  device_id: number
  auth_type: string
  key_id?: string | null
  config?: Record<string, unknown> | null
  status?: string | null
  last_used_at?: string | null
  inserted_at?: string
}

export type IotGateway = IotDevice & IotGatewayStats

export type IotGatewayConfig = {
  id?: number
  gateway_id: number
  config: Record<string, unknown>
  inserted_at?: string
  updated_at?: string
}

export type IotGatewayConnector = {
  id: number
  gateway_id: number
  name: string
  type: string
  enabled: boolean
  status?: string | null
  last_seen_at?: string | null
  config?: Record<string, unknown> | null
  inserted_at?: string
  updated_at?: string
}

export type IotGatewayLog = {
  id: number
  gateway_id: number
  connector_id?: number | null
  level?: string | null
  category?: string | null
  message: string
  payload?: Record<string, unknown> | null
  inserted_at?: string
}

export type IotGatewayStats = {
  gateway_status?: string | null
  gateway_version?: string | null
  gateway_connection?: Record<string, unknown> | null
  gateway_session?: Record<string, unknown> | null
  gateway_ingest?: Record<string, unknown> | null
  connector_total_count?: number | null
  connector_enabled_count?: number | null
  connector_active_count?: number | null
  connector_last_seen_at?: string | null
  child_total_count?: number | null
  child_online_count?: number | null
  child_offline_count?: number | null
  last_log_at?: string | null
  last_log_message?: string | null
  errors_30d?: number | null
}

export type IotGatewayDevice = IotDevice & {
  gateway_status?: string | null
}

export type IotSensor = {
  id: number
  device_id: number
  data_type_key_id: number
  name?: string | null
  threshold_idle?: number | null
  threshold_shutdown?: number | null
  config?: Record<string, unknown> | null
  inserted_at?: string
}

export type IotDeviceModel = {
  id: number
  name: string
  description?: string | null
  transport_type?: string | null
  transport_config?: Record<string, unknown> | null
  profile_config?: Record<string, unknown> | null
  provision_config?: Record<string, unknown> | null
  base_firmware_version?: string | null
  base_firmware_url?: string | null
  data_type_key_ids?: number[]
  inserted_at?: string
}

export type IotDeviceCommand = {
  id: number
  device_id: number
  protocol?: string | null
  channel?: string | null
  payload?: Record<string, unknown> | null
  status?: string | null
  attempts?: number | null
  next_retry_at?: string | null
  last_error?: string | null
  inserted_at?: string
  updated_at?: string
}

export type IotDeviceAttribute = {
  key: string
  scope: string
  value?: unknown
  value_type?: string | null
  updated_at?: string | null
}

export type IotDataTypeKey = {
  id: number
  name: string
  data_key_name: string
  value_type: string
  unit?: string | null
  decimals?: number | null
  scalable?: boolean | null
  scalable_by?: string | null
  general_data_method?: string | null
  chart_type?: string | null
  inserted_at?: string
}

export type IotApiKey = {
  id: number
  name: string
  scopes: string[]
  expires_at?: string | null
  last_used_at?: string | null
  inserted_at?: string
  token?: string | null
}

export type IotInstanceSettings = {
  id?: number
  require_device_key: boolean
  require_project_key: boolean
  require_api_key: boolean
  provision_on_ingest: boolean
  allow_missing_device_id: boolean
  gateway_lowercase_keys: boolean
  global_api_key?: string | null
  encryption_key?: string | null
  inserted_at?: string
  updated_at?: string
}

export type IotSavedQuery = {
  id: number
  name: string
  description?: string | null
  datasource: string
  sql_text: string
  exposed_as_api?: boolean | null
  api_key_id?: number | null
  api_key_ids?: number[] | null
  params?: string[] | null
  inserted_at?: string
}

export type IotRuleChain = {
  id: number
  name: string
  description?: string | null
  type?: string | null
  model_id?: number | null
  inserted_at?: string
}

export type IotRuleChainMetadata = {
  id: number
  rule_chain_id: number
  version?: number | null
  metadata?: Record<string, unknown> | null
  inserted_at?: string
  updated_at?: string
}

export type IotRuleChainTemplate = {
  id: string
  name: string
  description?: string | null
  type?: string | null
  default?: boolean | null
  root?: boolean | null
  metadata?: {
    version?: number | null
    metadata?: Record<string, unknown> | null
  }
  test?: {
    protocol?: string | null
    messages?: Array<{
      name?: string | null
      headers?: Record<string, unknown> | null
      body?: Record<string, unknown> | unknown[] | null
      message_type?: string | null
    }>
  }
}

export type IotIngestChain = IotRuleChain

export type IotIngestChainMetadata = IotRuleChainMetadata

export type IotDeviceAlert = {
  id: number
  device_id: number
  rule_chain_id?: number | null
  alert_type?: string | null
  severity?: string | null
  status?: string | null
  acknowledged?: boolean | null
  cleared?: boolean | null
  assignee_id?: string | null
  start_ts?: number | null
  end_ts?: number | null
  ack_ts?: number | null
  clear_ts?: number | null
  assign_ts?: number | null
  message?: string | null
  details?: Record<string, unknown> | null
  propagate?: boolean | null
  propagate_to_owner?: boolean | null
  propagate_to_tenant?: boolean | null
  propagate_relation_types?: string[] | null
  inserted_at?: string
  updated_at?: string
}

export type IotCalculatedField = {
  id: number
  device_model_id: number
  name: string
  type: string
  configuration_version?: number | null
  configuration?: Record<string, unknown> | null
  debug_settings?: Record<string, unknown> | null
  version?: number | null
  inserted_at?: string
  updated_at?: string
}
