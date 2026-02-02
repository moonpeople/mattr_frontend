import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import RuleChainConsoleCollapsedHeader from 'components/interfaces/Iot/RuleChains/RuleChainConsoleCollapsedHeader'
import RuleChainConsolePanel from 'components/interfaces/Iot/RuleChains/RuleChainConsolePanel'
import RuleChainEditor from 'components/interfaces/Iot/RuleChains/RuleChainEditor'
import RuleChainToolbar from 'components/interfaces/Iot/RuleChains/RuleChainToolbar'
import { useIotDataTypeKeysQuery } from 'data/iot/data-type-keys'
import { useIotDeviceModelsQuery } from 'data/iot/device-models'
import {
  useIotRuleChainDeleteMutation,
  useIotRuleChainMetadataMutation,
  useIotRuleChainMetadataQuery,
  useIotRuleChainQuery,
  useIotRuleChainsQuery,
  useIotRuleChainTestMutation,
} from 'data/iot/rule-chains'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  type ImperativePanelHandle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import { useRouter } from 'next/router'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Handle,
  Node,
  NodeChange,
  NodeProps,
  Position,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

const DEFAULT_LOG_CONFIG = {
  label: 'Incoming message',
}

const DEFAULT_SCRIPT_CONFIG = {
  script: '.payload',
}

const DEFAULT_JS_FILTER_CONFIG = {
  script: '.payload.temperature > 20',
}

const DEFAULT_MSG_TYPE_FILTER_CONFIG = {
  messageTypes: ['POST_ATTRIBUTES_REQUEST', 'POST_TELEMETRY_REQUEST', 'TO_SERVER_RPC_REQUEST'],
}

const parseQueryId = (value?: string | string[]) => {
  if (!value) return undefined
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}
const normalizeRuleChainType = (_value?: string | null) => 'core'

const DEFAULT_DELAY_CONFIG = {
  periodInSeconds: 60,
  maxPendingMsgs: 1000,
  periodInSecondsPattern: '',
  useMetadataPeriodInSecondsPatterns: false,
}

const DEFAULT_REST_API_CONFIG = {
  restEndpointUrlPattern: 'http://localhost/api',
  requestMethod: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  useSimpleClientHttpFactory: false,
  readTimeoutMs: 0,
  maxParallelRequestsCount: 0,
  parseToPlainText: false,
  enableProxy: false,
  credentials: {
    type: 'anonymous',
  },
  ignoreRequestBody: false,
  maxInMemoryBufferSizeInKb: 256,
}

const DEFAULT_EMAIL_TO_CONFIG = {
  fromTemplate: 'info@example.com',
  toTemplate: '${userEmail}',
  ccTemplate: '',
  bccTemplate: '',
  subjectTemplate: 'Device ${deviceName} alert',
  bodyTemplate: 'Device ${deviceName} has high temperature $[temperature]',
  isHtmlTemplate: 'false',
  mailBodyType: 'false',
}

const DEFAULT_EMAIL_SEND_CONFIG = {
  endpointUrl: 'http://localhost:8090/webhooks/email',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
}

const DEFAULT_SMS_SEND_CONFIG = {
  numbersToTemplate: '${userPhone}',
  smsMessageTemplate: 'Device ${deviceName} has high temperature $[temperature]',
  endpointUrl: 'http://localhost:8090/webhooks/sms',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
}

const DEFAULT_TELEGRAM_CONFIG = {
  botToken: '',
  chatIdTemplate: '',
  messageTemplate: 'Device ${deviceName} has high temperature $[temperature]',
  parseMode: 'MarkdownV2',
  timeout: 10000,
}

const DEFAULT_RULE_CHAIN_INPUT_CONFIG = {
  ruleChainId: '',
  forwardMsgToDefaultRuleChain: false,
}
const DEFAULT_DEVICE_PROFILE_CONFIG = {
  fetchTo: 'METADATA',
  deviceKey: 'device',
  profileKey: 'device_model',
  includeDevice: true,
  includeProfile: true,
}

const DEFAULT_SAVE_TIMESERIES_CONFIG = {
  deviceIdPath: 'device_id',
  useServerTs: true,
  tsPath: '',
  values: [],
}

const DEFAULT_METADATA_TEMPLATE = {
  firstNodeIndex: 2,
  nodes: [
    {
      additionalInfo: { layoutX: 824, layoutY: 156 },
      type: 'Telemetry.MsgTimeseriesNode',
      name: 'Save Timeseries',
      configurationVersion: 1,
      configuration: DEFAULT_SAVE_TIMESERIES_CONFIG,
    },
    {
      additionalInfo: { layoutX: 825, layoutY: 52 },
      type: 'Telemetry.MsgAttributesNode',
      name: 'Save Client Attributes',
      configurationVersion: 3,
      configuration: {
        processingSettings: { type: 'ON_EVERY_MESSAGE' },
        scope: 'CLIENT_SCOPE',
        notifyDevice: false,
        sendAttributesUpdatedNotification: false,
        updateAttributesOnlyOnValueChange: true,
      },
    },
    {
      additionalInfo: { layoutX: 347, layoutY: 149 },
      type: 'Filter.MsgTypeSwitchNode',
      name: 'Message Type Switch',
      configuration: { version: 0 },
    },
    {
      additionalInfo: { layoutX: 825, layoutY: 266 },
      type: 'Action.LogNode',
      name: 'Log RPC from Device',
      configuration: DEFAULT_LOG_CONFIG,
    },
    {
      additionalInfo: { layoutX: 825, layoutY: 379 },
      type: 'Action.LogNode',
      name: 'Log Other',
      configuration: DEFAULT_LOG_CONFIG,
    },
    {
      additionalInfo: { layoutX: 825, layoutY: 468 },
      type: 'Rpc.SendRPCRequestNode',
      name: 'RPC Call Request',
      configuration: { timeoutInSeconds: 60 },
    },
  ],
  connections: [
    { fromIndex: 2, toIndex: 4, type: 'Other' },
    { fromIndex: 2, toIndex: 1, type: 'Post attributes' },
    { fromIndex: 2, toIndex: 0, type: 'Post telemetry' },
    { fromIndex: 2, toIndex: 3, type: 'RPC Request from Device' },
    { fromIndex: 2, toIndex: 5, type: 'RPC Request to Device' },
  ],
  ruleChainConnections: [],
}

const DEFAULT_METADATA_TEXT = JSON.stringify(DEFAULT_METADATA_TEMPLATE, null, 2)
const TEST_PROTOCOL_OPTIONS = [
  { label: 'HTTP', value: 'http' },
  { label: 'MQTT', value: 'mqtt' },
  { label: 'CoAP', value: 'coap' },
  { label: 'LwM2M', value: 'lwm2m' },
  { label: 'SNMP', value: 'snmp' },
]

type TestProtocol = 'http' | 'mqtt' | 'coap' | 'lwm2m' | 'snmp'

const normalizeTestProtocol = (value?: string | null): TestProtocol => {
  const normalized = (value ?? '').toLowerCase()
  switch (normalized) {
    case 'mqtt':
    case 'coap':
    case 'lwm2m':
    case 'snmp':
      return normalized as TestProtocol
    default:
      return 'http'
  }
}
type TestMessageEntry = {
  id: string
  name: string
  headersText: string
  bodyText: string
  messageType: string
}
type TestMessageVariant = {
  name: string
  headers?: Record<string, string>
  body?: unknown
  messageType?: string
}

const TEST_TEMPLATES: Record<
  TestProtocol,
  {
    headers: Record<string, string>
    body: unknown
    messageType?: string
  }
> = {
  http: {
    headers: { 'x-device-id': '1' },
    body: { temperature: 22 },
  },
  mqtt: {
    headers: {},
    body: {
      device_id: 1,
      topic: 'v1/devices/me/telemetry',
      payload: { temperature: 22 },
    },
  },
  coap: {
    headers: { 'x-device-id': '1' },
    body: { temperature: 22 },
  },
  lwm2m: {
    headers: { 'x-device-id': '1' },
    body: {
      object_id: 3303,
      instance_id: 0,
      resources: { '5700': 22 },
    },
  },
  snmp: {
    headers: { 'x-device-id': '1' },
    body: {
      oid: '1.3.6.1.2.1.1.3.0',
      value: 42,
    },
  },
}
const TEST_MESSAGE_VARIANTS: Record<TestProtocol, TestMessageVariant[]> = {
  http: [
    { name: 'Telemetry: temperature', body: { temperature: 22 }, messageType: 'POST_TELEMETRY' },
    {
      name: 'Telemetry: multi-sensor',
      body: { temperature: 23, humidity: 48, pressure: 1002 },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Telemetry: nested payload',
      body: { payload: { metrics: { temperature: 21, humidity: 41 } } },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Telemetry: array of points',
      body: { data: [{ ts: 1716000000000, temperature: 21 }, { ts: 1716000001000, temperature: 22 }] },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Attributes: firmware & location',
      body: { firmware: '1.2.0', location: 'Lab' },
      messageType: 'POST_ATTRIBUTES',
    },
    {
      name: 'RPC request',
      body: { method: 'getStatus', params: { verbose: true } },
      messageType: 'TO_SERVER_RPC_REQUEST',
    },
    {
      name: 'RPC response',
      body: { request_id: 'rpc-1', response: { ok: true, code: 200 } },
      messageType: 'TO_SERVER_RPC_RESPONSE',
    },
    {
      name: 'Gateway telemetry',
      body: { device: 'gw-1', ts: 1716000002000, values: { temperature: 19 } },
      messageType: 'GATEWAY_TELEMETRY',
    },
    {
      name: 'Gateway attributes',
      body: { device: 'gw-1', values: { firmware: '2.0.1' } },
      messageType: 'GATEWAY_ATTRIBUTES',
    },
    {
      name: 'Gateway connect',
      body: { device: 'gw-1', status: 'connected' },
      messageType: 'GATEWAY_CONNECT',
    },
    {
      name: 'Gateway disconnect',
      body: { device: 'gw-1', status: 'disconnected' },
      messageType: 'GATEWAY_DISCONNECT',
    },
    {
      name: 'Firmware check',
      body: { firmware: '0.9.0' },
      messageType: 'CHECK_FIRMWARE',
    },
    {
      name: 'Firmware download request',
      body: { firmware: '0.9.0', chunk: 1 },
      messageType: 'FIRMWARE_REQUEST',
    },
    {
      name: 'Claim device',
      body: { token: 'claim-token-123' },
      messageType: 'CLAIM_DEVICE',
    },
    {
      name: 'Healthcheck',
      body: { uptime: 3600, ok: true },
      messageType: 'HEALTHCHECK',
    },
    {
      name: 'Message type from header (Message-Type)',
      headers: { 'Message-Type': 'POST_TELEMETRY' },
      body: { temperature: 20 },
    },
    {
      name: 'Message type from header (X-Message-Type)',
      headers: { 'X-Message-Type': 'POST_ATTRIBUTES' },
      body: { firmware: '1.2.1' },
    },
    {
      name: 'Custom type (no message_type)',
      body: { custom: { level: 3 } },
      messageType: '',
    },
    {
      name: 'String body',
      body: 'raw=1;temp=21',
      messageType: 'RAW',
    },
    {
      name: 'Payload with arrays & nested',
      body: { payload: { items: [{ v: 1 }, { v: 2 }], meta: { source: 'edge' } } },
      messageType: 'POST_TELEMETRY',
    },
  ],
  mqtt: [
    {
      name: 'Telemetry topic',
      body: { device_id: 1, topic: 'v1/devices/me/telemetry', payload: { temperature: 22 } },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Attributes topic',
      body: { device_id: 1, topic: 'v1/devices/me/attributes', payload: { firmware: '1.2.0' } },
      messageType: 'POST_ATTRIBUTES',
    },
    {
      name: 'RPC request topic',
      body: {
        device_id: 1,
        topic: 'v1/devices/me/rpc/request/1',
        payload: { method: 'getStatus', params: {} },
      },
      messageType: 'TO_SERVER_RPC_REQUEST',
    },
    {
      name: 'RPC response topic',
      body: {
        device_id: 1,
        topic: 'v1/devices/me/rpc/response/1',
        payload: { request_id: '1', response: { ok: true } },
      },
      messageType: 'TO_SERVER_RPC_RESPONSE',
    },
    {
      name: 'Claim request',
      body: { device_id: 1, topic: 'v1/devices/me/claim', payload: { token: 'claim-1' } },
      messageType: 'CLAIM_DEVICE',
    },
    {
      name: 'Gateway telemetry',
      body: {
        device_id: 1,
        topic: 'v1/gateway/telemetry',
        payload: { device: 'gw-1', ts: 1716000002000, values: { temperature: 19 } },
      },
      messageType: 'GATEWAY_TELEMETRY',
    },
    {
      name: 'Gateway attributes',
      body: {
        device_id: 1,
        topic: 'v1/gateway/attributes',
        payload: { device: 'gw-1', values: { firmware: '2.0.1' } },
      },
      messageType: 'GATEWAY_ATTRIBUTES',
    },
    {
      name: 'Gateway connect',
      body: {
        device_id: 1,
        topic: 'v1/gateway/connect',
        payload: { device: 'gw-1' },
      },
      messageType: 'GATEWAY_CONNECT',
    },
    {
      name: 'Gateway disconnect',
      body: {
        device_id: 1,
        topic: 'v1/gateway/disconnect',
        payload: { device: 'gw-1' },
      },
      messageType: 'GATEWAY_DISCONNECT',
    },
    {
      name: 'Firmware check',
      body: { device_id: 1, topic: 'v1/devices/me/telemetry', payload: { firmware: '0.9.0' } },
      messageType: 'CHECK_FIRMWARE',
    },
    {
      name: 'Custom topic telemetry',
      body: { device_id: 1, topic: 'sensors/metrics', payload: { temperature: 20 } },
      messageType: 'CUSTOM_METRICS',
    },
    {
      name: 'Nested payload',
      body: {
        device_id: 1,
        topic: 'v1/devices/me/telemetry',
        payload: { metrics: { temperature: 21, humidity: 41 } },
      },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Array payload',
      body: {
        device_id: 1,
        topic: 'v1/devices/me/telemetry',
        payload: [{ ts: 1716000000000, temperature: 21 }, { ts: 1716000001000, temperature: 22 }],
      },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Healthcheck',
      body: { device_id: 1, topic: 'healthcheck', payload: { ok: true } },
      messageType: 'HEALTHCHECK',
    },
    {
      name: 'Message type from header',
      headers: { 'Message-Type': 'POST_TELEMETRY' },
      body: { device_id: 1, topic: 'v1/devices/me/telemetry', payload: { temperature: 20 } },
    },
    {
      name: 'Raw payload string',
      body: { device_id: 1, topic: 'raw', payload: 'temp=22' },
      messageType: 'RAW',
    },
    {
      name: 'Telemetry with ts',
      body: {
        device_id: 1,
        topic: 'v1/devices/me/telemetry',
        payload: { ts: 1716000002000, temperature: 19 },
      },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Telemetry with arrays in payload',
      body: {
        device_id: 1,
        topic: 'v1/devices/me/telemetry',
        payload: { values: [1, 2, 3] },
      },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'No message type',
      body: { device_id: 1, topic: 'v1/devices/me/telemetry', payload: { temperature: 18 } },
      messageType: '',
    },
    {
      name: 'Telemetry with boolean',
      body: { device_id: 1, topic: 'v1/devices/me/telemetry', payload: { online: true } },
      messageType: 'POST_TELEMETRY',
    },
  ],
  coap: [
    { name: 'Telemetry: temperature', body: { temperature: 22 }, messageType: 'POST_TELEMETRY' },
    {
      name: 'Telemetry: multi-sensor',
      body: { temperature: 23, humidity: 48, pressure: 1002 },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Telemetry: nested payload',
      body: { payload: { metrics: { temperature: 21, humidity: 41 } } },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Telemetry: array of points',
      body: { data: [{ ts: 1716000000000, temperature: 21 }, { ts: 1716000001000, temperature: 22 }] },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Attributes: firmware & location',
      body: { firmware: '1.2.0', location: 'Lab' },
      messageType: 'POST_ATTRIBUTES',
    },
    {
      name: 'RPC request',
      body: { method: 'getStatus', params: { verbose: true } },
      messageType: 'TO_SERVER_RPC_REQUEST',
    },
    {
      name: 'RPC response',
      body: { request_id: 'rpc-1', response: { ok: true, code: 200 } },
      messageType: 'TO_SERVER_RPC_RESPONSE',
    },
    {
      name: 'Gateway telemetry',
      body: { device: 'gw-1', ts: 1716000002000, values: { temperature: 19 } },
      messageType: 'GATEWAY_TELEMETRY',
    },
    {
      name: 'Gateway connect',
      body: { device: 'gw-1', status: 'connected' },
      messageType: 'GATEWAY_CONNECT',
    },
    {
      name: 'Firmware check',
      body: { firmware: '0.9.0' },
      messageType: 'CHECK_FIRMWARE',
    },
    {
      name: 'Claim device',
      body: { token: 'claim-token-123' },
      messageType: 'CLAIM_DEVICE',
    },
    {
      name: 'Healthcheck',
      body: { uptime: 3600, ok: true },
      messageType: 'HEALTHCHECK',
    },
    {
      name: 'Message type from header (Message-Type)',
      headers: { 'Message-Type': 'POST_TELEMETRY' },
      body: { temperature: 20 },
    },
    {
      name: 'Message type from header (X-Message-Type)',
      headers: { 'X-Message-Type': 'POST_ATTRIBUTES' },
      body: { firmware: '1.2.1' },
    },
    {
      name: 'Custom type (no message_type)',
      body: { custom: { level: 3 } },
      messageType: '',
    },
    {
      name: 'String body',
      body: 'raw=1;temp=21',
      messageType: 'RAW',
    },
    {
      name: 'Payload with arrays & nested',
      body: { payload: { items: [{ v: 1 }, { v: 2 }], meta: { source: 'edge' } } },
      messageType: 'POST_TELEMETRY',
    },
    {
      name: 'Gateway attributes',
      body: { device: 'gw-1', values: { firmware: '2.0.1' } },
      messageType: 'GATEWAY_ATTRIBUTES',
    },
    {
      name: 'Gateway disconnect',
      body: { device: 'gw-1', status: 'disconnected' },
      messageType: 'GATEWAY_DISCONNECT',
    },
    {
      name: 'Telemetry with ts',
      body: { ts: 1716000002000, temperature: 19 },
      messageType: 'POST_TELEMETRY',
    },
  ],
  lwm2m: [
    {
      name: 'Temp sensor (3303/0/5700)',
      body: { object_id: 3303, instance_id: 0, resources: { '5700': 22 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Humidity sensor (3304/0/5700)',
      body: { object_id: 3304, instance_id: 0, resources: { '5700': 45 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Battery level (3/0/9)',
      body: { object_id: 3, instance_id: 0, resources: { '9': 87 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Device info (3/0/0-3)',
      body: { object_id: 3, instance_id: 0, resources: { '0': 'ACME', '1': 'X100', '2': '1.2.0', '3': 'SN-1' } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Connectivity (4/0/4)',
      body: { object_id: 4, instance_id: 0, resources: { '4': 'LTE' } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Firmware update state',
      body: { object_id: 5, instance_id: 0, resources: { '3': 1, '5': 0 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Location (6/0)',
      body: { object_id: 6, instance_id: 0, resources: { '0': 40.7128, '1': -74.006 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Multiple resources',
      body: { object_id: 3303, instance_id: 0, resources: { '5700': 22, '5701': 'C', '5605': 1 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Multiple instances',
      body: { object_id: 3303, instance_id: 1, resources: { '5700': 23 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Resource array',
      body: { object_id: 3303, instance_id: 0, resources: [{ id: '5700', value: 22 }, { id: '5701', value: 'C' }] },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Battery status',
      body: { object_id: 3, instance_id: 0, resources: { '20': 92 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Power source voltage',
      body: { object_id: 3, instance_id: 0, resources: { '7': 5000 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Error code',
      body: { object_id: 3, instance_id: 0, resources: { '11': 0 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Event: reboot',
      body: { object_id: 3, instance_id: 0, resources: { '4': 1 } },
      messageType: 'LWM2M_EVENT',
    },
    {
      name: 'Object list',
      body: { object_id: 1, instance_id: 0, resources: { '0': 5, '1': 0 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Connectivity stats',
      body: { object_id: 4, instance_id: 0, resources: { '2': 10, '3': 20 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Custom object 5000',
      body: { object_id: 5000, instance_id: 0, resources: { '0': 123, '1': 'ok' } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'No message type',
      body: { object_id: 3303, instance_id: 0, resources: { '5700': 21 } },
      messageType: '',
    },
    {
      name: 'Nested payload',
      body: { payload: { object_id: 3303, instance_id: 0, resources: { '5700': 22 } } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'Resource boolean',
      body: { object_id: 3303, instance_id: 0, resources: { '5605': 0 } },
      messageType: 'LWM2M_UPDATE',
    },
  ],
  snmp: [
    {
      name: 'System uptime',
      body: { oid: '1.3.6.1.2.1.1.3.0', value: 42 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SysName',
      body: { oid: '1.3.6.1.2.1.1.5.0', value: 'router-1' },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'IfInOctets',
      body: { oid: '1.3.6.1.2.1.2.2.1.10.1', value: 123456 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'IfOutOctets',
      body: { oid: '1.3.6.1.2.1.2.2.1.16.1', value: 654321 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'CPU load',
      body: { oid: '1.3.6.1.4.1.2021.10.1.3.1', value: 0.15 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Memory free',
      body: { oid: '1.3.6.1.4.1.2021.4.6.0', value: 2048 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Disk usage',
      body: { oid: '1.3.6.1.4.1.2021.9.1.9.1', value: 73 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Temperature',
      body: { oid: '1.3.6.1.4.1.1234.1.1.1', value: 37 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Voltage',
      body: { oid: '1.3.6.1.4.1.1234.1.1.2', value: 3.3 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Link down',
      body: { oid: '1.3.6.1.6.3.1.1.5.3', value: 1 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Link up',
      body: { oid: '1.3.6.1.6.3.1.1.5.4', value: 1 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Authentication failure',
      body: { oid: '1.3.6.1.6.3.1.1.5.5', value: 1 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Custom enterprise trap',
      body: { oid: '1.3.6.1.4.1.5555.1.0.1', value: 'event' },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Multi-value payload',
      body: { oid: '1.3.6.1.2.1.1.3.0', value: 42, extra: { ifIndex: 1 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Nested payload',
      body: { payload: { oid: '1.3.6.1.2.1.1.3.0', value: 42 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'String value',
      body: { oid: '1.3.6.1.2.1.1.1.0', value: 'Linux' },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Integer value',
      body: { oid: '1.3.6.1.2.1.1.7.0', value: 72 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Float value',
      body: { oid: '1.3.6.1.4.1.1234.1.2.1', value: 0.98 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'Array payload',
      body: { oid: '1.3.6.1.2.1.1.3.0', value: [1, 2, 3] },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'No message type',
      body: { oid: '1.3.6.1.2.1.1.3.0', value: 42 },
      messageType: '',
    },
  ],
}

const TEST_REQUIRED_FIELDS: Record<TestProtocol, { headers: string[]; body: string[] }> = {
  http: {
    headers: ['x-device-id'],
    body: [],
  },
  mqtt: {
    headers: [],
    body: ['device_id', 'topic', 'payload'],
  },
  coap: {
    headers: ['x-device-id'],
    body: [],
  },
  lwm2m: {
    headers: ['x-device-id'],
    body: ['object_id', 'instance_id', 'resources'],
  },
  snmp: {
    headers: ['x-device-id'],
    body: ['oid', 'value'],
  },
}

const formatTestTemplate = (protocol: TestProtocol) => {
  const template = TEST_TEMPLATES[protocol]

  return {
    headersText: JSON.stringify(template.headers ?? {}, null, 2),
    bodyText: JSON.stringify(template.body ?? {}, null, 2),
    messageType: template.messageType ?? '',
  }
}

const createTestMessageId = () => `msg_${Math.random().toString(36).slice(2, 10)}`
const createTestMessage = (protocol: TestProtocol, index: number, name?: string) => {
  const template = formatTestTemplate(protocol)

  return {
    id: createTestMessageId(),
    name: name ?? `Message ${index}`,
    headersText: template.headersText,
    bodyText: template.bodyText,
    messageType: template.messageType,
  }
}
const buildDefaultTestState = (protocol: TestProtocol) => {
  const variants = TEST_MESSAGE_VARIANTS[protocol] ?? []
  const messages = variants.map((variant, index) => {
    const base = TEST_TEMPLATES[protocol]
    const headers = { ...(base.headers ?? {}), ...(variant.headers ?? {}) }
    const body = variant.body ?? base.body ?? {}
    const messageType = variant.messageType ?? base.messageType ?? ''

    return {
      id: createTestMessageId(),
      name: variant.name || `Message ${index + 1}`,
      headersText: JSON.stringify(headers, null, 2),
      bodyText: JSON.stringify(body, null, 2),
      messageType,
    }
  })
  if (messages.length === 0) {
    const message = createTestMessage(protocol, 1)
    return { messages: [message], selectedId: message.id }
  }
  return { messages, selectedId: messages[0].id }
}

type NodeTemplate = {
  label: string
  value: string
  section: string
  meta: Record<string, any>
}

const NODE_SECTIONS = [
  { label: 'Storage', value: 'storage' },
  { label: 'Telemetry', value: 'telemetry' },
  { label: 'Filters', value: 'filter' },
  { label: 'Transform', value: 'transform' },
  { label: 'Math', value: 'math' },
  { label: 'Metadata', value: 'metadata' },
  { label: 'Relations', value: 'relations' },
  { label: 'Flow', value: 'flow' },
  { label: 'Actions', value: 'action' },
  { label: 'RPC', value: 'rpc' },
]

type NodeSectionStyle = {
  border: string
  background: string
  accent: string
}

const DEFAULT_NODE_SECTION_STYLE: NodeSectionStyle = {
  border: 'border-muted',
  background: 'bg-surface-200',
  accent: 'bg-foreground-muted',
}

const NODE_SECTION_STYLE_MAP: Record<string, NodeSectionStyle> = {
  storage: {
    border: 'border-emerald-500',
    background: 'bg-emerald-100',
    accent: 'bg-emerald-500',
  },
  telemetry: {
    border: 'border-sky-500',
    background: 'bg-sky-100',
    accent: 'bg-sky-500',
  },
  filter: {
    border: 'border-purple-500',
    background: 'bg-purple-100',
    accent: 'bg-purple-500',
  },
  transform: {
    border: 'border-amber-500',
    background: 'bg-amber-100',
    accent: 'bg-amber-500',
  },
  math: {
    border: 'border-fuchsia-500',
    background: 'bg-fuchsia-100',
    accent: 'bg-fuchsia-500',
  },
  metadata: {
    border: 'border-cyan-500',
    background: 'bg-cyan-100',
    accent: 'bg-cyan-500',
  },
  relations: {
    border: 'border-indigo-500',
    background: 'bg-indigo-100',
    accent: 'bg-indigo-500',
  },
  flow: {
    border: 'border-slate-500',
    background: 'bg-slate-100',
    accent: 'bg-slate-500',
  },
  action: {
    border: 'border-orange-500',
    background: 'bg-orange-100',
    accent: 'bg-orange-500',
  },
  rpc: {
    border: 'border-rose-500',
    background: 'bg-rose-100',
    accent: 'bg-rose-500',
  },
}

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    label: 'Save Timeseries',
    value: 'Telemetry.MsgTimeseriesNode',
    section: 'storage',
    meta: {
      type: 'Telemetry.MsgTimeseriesNode',
      name: 'Save Timeseries',
      configurationVersion: 1,
      configuration: DEFAULT_SAVE_TIMESERIES_CONFIG,
    },
  },
  {
    label: 'Save Client Attributes',
    value: 'Telemetry.MsgAttributesNode',
    section: 'storage',
    meta: {
      type: 'Telemetry.MsgAttributesNode',
      name: 'Save Client Attributes',
      configurationVersion: 3,
      configuration: {
        processingSettings: { type: 'ON_EVERY_MESSAGE' },
        scope: 'CLIENT_SCOPE',
        notifyDevice: false,
        sendAttributesUpdatedNotification: false,
        updateAttributesOnlyOnValueChange: true,
      },
    },
  },
  {
    label: 'Message Type Switch',
    value: 'Filter.MsgTypeSwitchNode',
    section: 'filter',
    meta: {
      type: 'Filter.MsgTypeSwitchNode',
      name: 'Message Type Switch',
      configuration: { version: 0 },
    },
  },
  {
    label: 'Log',
    value: 'Action.LogNode',
    section: 'action',
    meta: {
      type: 'Action.LogNode',
      name: 'Log',
      configuration: DEFAULT_LOG_CONFIG,
    },
  },
  {
    label: 'RPC Call Request',
    value: 'Rpc.SendRPCRequestNode',
    section: 'rpc',
    meta: {
      type: 'Rpc.SendRPCRequestNode',
      name: 'RPC Call Request',
      configuration: { timeoutInSeconds: 60 },
    },
  },
  {
    label: 'RPC Reply',
    value: 'Rpc.SendRPCReplyNode',
    section: 'rpc',
    meta: {
      type: 'Rpc.SendRPCReplyNode',
      name: 'RPC Reply',
      configuration: {
        status: 200,
        headers: {},
        bodyTemplate: '',
      },
    },
  },
  {
    label: 'Transform Message',
    value: 'Transform.TransformMsgNode',
    section: 'transform',
    meta: {
      type: 'Transform.TransformMsgNode',
      name: 'Transform Message',
      configuration: DEFAULT_SCRIPT_CONFIG,
    },
  },
  {
    label: 'Script Filter',
    value: 'Filter.JsFilterNode',
    section: 'filter',
    meta: {
      type: 'Filter.JsFilterNode',
      name: 'Script Filter',
      configuration: DEFAULT_JS_FILTER_CONFIG,
    },
  },
  {
    label: 'Message Type Filter',
    value: 'Filter.MsgTypeFilterNode',
    section: 'filter',
    meta: {
      type: 'Filter.MsgTypeFilterNode',
      name: 'Message Type Filter',
      configuration: DEFAULT_MSG_TYPE_FILTER_CONFIG,
    },
  },
  {
    label: 'Delay',
    value: 'Delay.MsgDelayNode',
    section: 'flow',
    meta: {
      type: 'Delay.MsgDelayNode',
      name: 'Delay',
      configuration: DEFAULT_DELAY_CONFIG,
    },
  },
  {
    label: 'Checkpoint',
    value: 'Flow.CheckpointNode',
    section: 'flow',
    meta: {
      type: 'Flow.CheckpointNode',
      name: 'Checkpoint',
      configuration: {},
    },
  },
  {
    label: 'Rule Chain',
    value: 'Flow.RuleChainInputNode',
    section: 'flow',
    meta: {
      type: 'Flow.RuleChainInputNode',
      name: 'Rule Chain',
      configuration: DEFAULT_RULE_CHAIN_INPUT_CONFIG,
    },
  },
  {
    label: 'Rule Chain Output',
    value: 'Flow.RuleChainOutputNode',
    section: 'flow',
    meta: {
      type: 'Flow.RuleChainOutputNode',
      name: 'Rule Chain Output',
      configuration: {},
    },
  },
  {
    label: 'Ack',
    value: 'Flow.AckNode',
    section: 'flow',
    meta: {
      type: 'Flow.AckNode',
      name: 'Ack',
      configuration: {},
    },
  },
  {
    label: 'REST API Call',
    value: 'Rest.RestApiCallNode',
    section: 'action',
    meta: {
      type: 'Rest.RestApiCallNode',
      name: 'REST API Call',
      configuration: DEFAULT_REST_API_CONFIG,
    },
  },
  {
    label: 'To Email',
    value: 'Mail.MsgToEmailNode',
    section: 'action',
    meta: {
      type: 'Mail.MsgToEmailNode',
      name: 'To Email',
      configuration: DEFAULT_EMAIL_TO_CONFIG,
    },
  },
  {
    label: 'Send Email',
    value: 'Mail.SendEmailNode',
    section: 'action',
    meta: {
      type: 'Mail.SendEmailNode',
      name: 'Send Email',
      configuration: DEFAULT_EMAIL_SEND_CONFIG,
    },
  },
  {
    label: 'Send SMS',
    value: 'Sms.SendSmsNode',
    section: 'action',
    meta: {
      type: 'Sms.SendSmsNode',
      name: 'Send SMS',
      configuration: DEFAULT_SMS_SEND_CONFIG,
    },
  },
  {
    label: 'Send Telegram',
    value: 'Telegram.SendTelegramNode',
    section: 'action',
    meta: {
      type: 'Telegram.SendTelegramNode',
      name: 'Send Telegram',
      configuration: DEFAULT_TELEGRAM_CONFIG,
    },
  },
  {
    label: 'Asset Type Switch',
    value: 'Filter.AssetTypeSwitchNode',
    section: 'filter',
    meta: {
      type: 'Filter.AssetTypeSwitchNode',
      name: 'Asset Type Switch',
      configuration: {},
    },
  },
  {
    label: 'Check Message',
    value: 'Filter.CheckMessageNode',
    section: 'filter',
    meta: {
      type: 'Filter.CheckMessageNode',
      name: 'Check Message',
      configuration: {},
    },
  },
  {
    label: 'Check Alarm Status',
    value: 'Filter.CheckAlarmStatusNode',
    section: 'filter',
    meta: {
      type: 'Filter.CheckAlarmStatusNode',
      name: 'Check Alarm Status',
      configuration: {},
    },
  },
  {
    label: 'Device Type Switch',
    value: 'Filter.DeviceTypeSwitchNode',
    section: 'filter',
    meta: {
      type: 'Filter.DeviceTypeSwitchNode',
      name: 'Device Type Switch',
      configuration: {},
    },
  },
  {
    label: 'Create Alarm',
    value: 'Action.CreateAlarmNode',
    section: 'action',
    meta: {
      type: 'Action.CreateAlarmNode',
      name: 'Create Alarm',
      configuration: {},
    },
  },
  {
    label: 'Clear Alarm',
    value: 'Action.ClearAlarmNode',
    section: 'action',
    meta: {
      type: 'Action.ClearAlarmNode',
      name: 'Clear Alarm',
      configuration: {},
    },
  },
  {
    label: 'Message Count',
    value: 'Action.MsgCountNode',
    section: 'action',
    meta: {
      type: 'Action.MsgCountNode',
      name: 'Message Count',
      configuration: {},
    },
  },
  {
    label: 'Device State',
    value: 'Action.DeviceStateNode',
    section: 'action',
    meta: {
      type: 'Action.DeviceStateNode',
      name: 'Device State',
      configuration: {},
    },
  },
  {
    label: 'Kafka',
    value: 'Kafka.KafkaNode',
    section: 'action',
    meta: {
      type: 'Kafka.KafkaNode',
      name: 'Kafka',
      configuration: {},
    },
  },
  {
    label: 'Create Relation',
    value: 'Action.CreateRelationNode',
    section: 'relations',
    meta: {
      type: 'Action.CreateRelationNode',
      name: 'Create Relation',
      configuration: {},
    },
  },
  {
    label: 'Delete Relation',
    value: 'Action.DeleteRelationNode',
    section: 'relations',
    meta: {
      type: 'Action.DeleteRelationNode',
      name: 'Delete Relation',
      configuration: {},
    },
  },
  {
    label: 'Check Relation',
    value: 'Filter.CheckRelationNode',
    section: 'relations',
    meta: {
      type: 'Filter.CheckRelationNode',
      name: 'Check Relation',
      configuration: {},
    },
  },
  {
    label: 'Math',
    value: 'Math.MathNode',
    section: 'math',
    meta: {
      type: 'Math.MathNode',
      name: 'Math',
      configuration: {},
    },
  },
  {
    label: 'Calculate Delta',
    value: 'Metadata.CalculateDeltaNode',
    section: 'math',
    meta: {
      type: 'Metadata.CalculateDeltaNode',
      name: 'Calculate Delta',
      configuration: {},
    },
  },
  {
    label: 'Get Attributes',
    value: 'Metadata.GetAttributesNode',
    section: 'metadata',
    meta: {
      type: 'Metadata.GetAttributesNode',
      name: 'Get Attributes',
      configuration: {},
    },
  },
  {
    label: 'Get Device Attributes',
    value: 'Metadata.GetDeviceAttrNode',
    section: 'metadata',
    meta: {
      type: 'Metadata.GetDeviceAttrNode',
      name: 'Get Device Attributes',
      configuration: {},
    },
  },
  {
    label: 'Get Related Attributes',
    value: 'Metadata.GetRelatedAttributeNode',
    section: 'metadata',
    meta: {
      type: 'Metadata.GetRelatedAttributeNode',
      name: 'Get Related Attributes',
      configuration: {},
    },
  },
  {
    label: 'Get Telemetry',
    value: 'Metadata.GetTelemetryNode',
    section: 'metadata',
    meta: {
      type: 'Metadata.GetTelemetryNode',
      name: 'Get Telemetry',
      configuration: {},
    },
  },
  {
    label: 'Fetch Device Credentials',
    value: 'Metadata.FetchDeviceCredentialsNode',
    section: 'metadata',
    meta: {
      type: 'Metadata.FetchDeviceCredentialsNode',
      name: 'Fetch Device Credentials',
      configuration: { fetchTo: 'METADATA' },
    },
  },
  {
    label: 'Device Profile',
    value: 'Profile.DeviceProfileNode',
    section: 'metadata',
    meta: {
      type: 'Profile.DeviceProfileNode',
      name: 'Device Profile',
      configuration: DEFAULT_DEVICE_PROFILE_CONFIG,
    },
  },
  {
    label: 'Calculated Fields',
    value: 'Telemetry.CalculatedFieldsNode',
    section: 'telemetry',
    meta: {
      type: 'Telemetry.CalculatedFieldsNode',
      name: 'Calculated Fields',
      configuration: {},
    },
  },
  {
    label: 'Delete Attributes',
    value: 'Telemetry.MsgDeleteAttributesNode',
    section: 'telemetry',
    meta: {
      type: 'Telemetry.MsgDeleteAttributesNode',
      name: 'Delete Attributes',
      configuration: {},
    },
  },
  {
    label: 'Copy Keys',
    value: 'Transform.CopyKeysNode',
    section: 'transform',
    meta: {
      type: 'Transform.CopyKeysNode',
      name: 'Copy Keys',
      configuration: {},
    },
  },
  {
    label: 'Delete Keys',
    value: 'Transform.DeleteKeysNode',
    section: 'transform',
    meta: {
      type: 'Transform.DeleteKeysNode',
      name: 'Delete Keys',
      configuration: {},
    },
  },
  {
    label: 'Rename Keys',
    value: 'Transform.RenameKeysNode',
    section: 'transform',
    meta: {
      type: 'Transform.RenameKeysNode',
      name: 'Rename Keys',
      configuration: {},
    },
  },
  {
    label: 'SplitArrayToMsg',
    value: 'Transform.SplitArrayToMsgNode',
    section: 'transform',
    meta: {
      type: 'Transform.SplitArrayToMsgNode',
      name: 'SplitArrayToMsg',
      configuration: {},
    },
  },
  {
    label: 'Message Deduplication',
    value: 'Deduplication.MsgDeduplicationNode',
    section: 'transform',
    meta: {
      type: 'Deduplication.MsgDeduplicationNode',
      name: 'Message Deduplication',
      configuration: {},
    },
  },
]

const NODE_SECTION_BY_TYPE = NODE_TEMPLATES.reduce<Record<string, string>>((acc, template) => {
  acc[template.value] = template.section
  return acc
}, {})

const NODE_TYPE_DESCRIPTIONS_RU: Record<string, string> = {
  'Telemetry.MsgTimeseriesNode': 'Сохраняет телеметрию в хранилище.',
  'Telemetry.MsgAttributesNode':
    'Сохраняет атрибуты устройства (client scope). Можно задать ключи и пути, либо авто-поиск по списку.',
  'Filter.MsgTypeSwitchNode':
    'Разветвляет по message_type: ведет по соответствующей связи, иначе — Other. Если типа нет — Missing.',
  'Action.LogNode': 'Пишет лог из msg/metadata.',
  'Rpc.SendRPCRequestNode': 'Отправляет RPC запрос устройству.',
  'Rpc.SendRPCReplyNode': 'Отправляет ответ на RPC.',
  'Transform.TransformMsgNode': 'Трансформирует сообщение скриптом.',
  'Filter.JsFilterNode': 'Фильтрует сообщения по JS-условию.',
  'Filter.MsgTypeFilterNode':
    'Фильтр по message_type: если совпал — Success, иначе — Failure.',
  'Delay.MsgDelayNode': 'Задерживает сообщение на заданное время.',
  'Flow.CheckpointNode': 'Контрольная точка для отладки/метрик.',
  'Flow.RuleChainInputNode': 'Входная точка цепочки правил.',
  'Flow.RuleChainOutputNode': 'Выход из цепочки/передача дальше.',
  'Flow.AckNode': 'Подтверждает обработку сообщения.',
  'Rest.RestApiCallNode': 'HTTP вызов внешнего API.',
  'Mail.MsgToEmailNode': 'Формирует email-сообщение.',
  'Mail.SendEmailNode': 'Отправляет email.',
  'Sms.SendSmsNode': 'Отправляет SMS.',
  'Telegram.SendTelegramNode': 'Отправляет сообщение в Telegram.',
  'Filter.AssetTypeSwitchNode': 'Разветвляет по типу asset.',
  'Filter.CheckMessageNode': 'Проверяет поля сообщения по условиям.',
  'Filter.CheckAlarmStatusNode': 'Проверяет статус тревоги.',
  'Filter.DeviceTypeSwitchNode': 'Разветвляет по типу устройства.',
  'Action.CreateAlarmNode': 'Создает тревогу.',
  'Action.ClearAlarmNode': 'Сбрасывает тревогу.',
  'Action.MsgCountNode': 'Считает сообщения и публикует счетчик.',
  'Action.DeviceStateNode': 'Обновляет состояние устройства.',
  'Kafka.KafkaNode': 'Публикует сообщение в Kafka.',
  'Action.CreateRelationNode': 'Создает связь между сущностями.',
  'Action.DeleteRelationNode': 'Удаляет связь между сущностями.',
  'Filter.CheckRelationNode': 'Проверяет наличие связи.',
  'Math.MathNode': 'Выполняет математические вычисления.',
  'Metadata.CalculateDeltaNode': 'Считает дельту значений.',
  'Metadata.GetAttributesNode': 'Загружает атрибуты/телеметрию устройства.',
  'Metadata.GetDeviceAttrNode': 'Получает атрибуты связанного устройства.',
  'Metadata.GetRelatedAttributeNode': 'Получает атрибуты/телеметрию по связи.',
  'Metadata.GetTelemetryNode': 'Загружает телеметрию из ClickHouse.',
  'Metadata.FetchDeviceCredentialsNode': 'Получает credentials устройства.',
  'Profile.DeviceProfileNode': 'Загружает устройство и его модель.',
  'Telemetry.CalculatedFieldsNode':
    'Вычисляет производные поля по jq-формулам из конфигурации ноды.',
  'Telemetry.MsgDeleteAttributesNode': 'Удаляет атрибуты по ключам.',
  'Transform.CopyKeysNode': 'Копирует ключи между msg/metadata.',
  'Transform.DeleteKeysNode': 'Удаляет ключи из msg/metadata.',
  'Transform.RenameKeysNode': 'Переименовывает ключи.',
  'Transform.SplitArrayToMsgNode': 'Разбивает массив на несколько сообщений.',
  'Deduplication.MsgDeduplicationNode': 'Дедупликация сообщений по ключу/окну.',
}

const INGEST_NODE_VALUES = new Set([
  'Action.LogNode',
  'Filter.CheckMessageNode',
  'Filter.MsgTypeFilterNode',
  'Filter.MsgTypeSwitchNode',
  'Flow.CheckpointNode',
  'Flow.RuleChainOutputNode',
  'Flow.AckNode',
  'Rpc.SendRPCReplyNode',
  'Transform.CopyKeysNode',
  'Transform.DeleteKeysNode',
  'Transform.RenameKeysNode',
  'Transform.SplitArrayToMsgNode',
])

const RELATION_OPTIONS = [
  'Success',
  'Failure',
  'True',
  'False',
  'Post telemetry',
  'Post attributes',
  'RPC Request from Device',
  'RPC Request to Device',
  'Missing',
  'Other',
  'Forward',
]

const NODE_RELATION_OVERRIDES: Record<string, string[]> = {
  'Filter.MsgTypeFilterNode': ['True', 'False', 'Missing'],
  'Filter.MsgTypeSwitchNode': [
    'Post telemetry',
    'Post attributes',
    'RPC Request from Device',
    'RPC Request to Device',
    'Other',
    'Missing',
  ],
  'Filter.JsFilterNode': ['True', 'False'],
  'Filter.CheckMessageNode': ['True', 'False'],
  'Filter.CheckRelationNode': ['True', 'False'],
  'Filter.CheckAlarmStatusNode': ['True', 'False'],
  'Transform.SplitArrayToMsgNode': ['Success', 'Failure'],
}

const extractMessageTypeSwitchMappings = (config: Record<string, any>) => {
  const rawMappings = Array.isArray(config?.mappings)
    ? config.mappings
    : Array.isArray(config?.messageTypeMappings)
      ? config.messageTypeMappings
      : Array.isArray(config?.message_types)
        ? config.message_types.map((entry: any) => ({ type: entry, relation: '' }))
        : Array.isArray(config?.messageTypes)
          ? config.messageTypes.map((entry: any) => ({ type: entry, relation: '' }))
          : []

  return rawMappings.map((entry: any) => {
    if (typeof entry === 'string') {
      return { type: entry, relation: '' }
    }
    return {
      type:
        typeof entry.type === 'string'
          ? entry.type
          : typeof entry.messageType === 'string'
            ? entry.messageType
            : '',
      relation:
        typeof entry.relation === 'string'
          ? entry.relation
          : typeof entry.relationType === 'string'
            ? entry.relationType
            : '',
    }
  })
}

const getMessageTypeSwitchRelations = (node?: Node<RuleChainNodeData>) => {
  if (!node || node.data?.type !== 'Filter.MsgTypeSwitchNode') return null
  const config = (node.data?.meta as any)?.configuration ?? {}
  const mappings = extractMessageTypeSwitchMappings(config)
  const types = mappings
    .map((entry) => entry.type?.trim?.() ?? '')
    .filter((entry) => entry.length > 0)
  const uniqueTypes = Array.from(new Set(types))
  const baseOptions = ['Other', 'Missing']
  return [...baseOptions, ...uniqueTypes.filter((entry) => !baseOptions.includes(entry))]
}

const getAllowedRelationsForNodeType = (nodeType?: string | null) => {
  if (!nodeType) return RELATION_OPTIONS
  return NODE_RELATION_OVERRIDES[nodeType] ?? RELATION_OPTIONS
}

type SelectionTab = 'details' | 'debug'

type RuleChainNodeData = {
  label: string
  type?: string
  description?: string
  section?: string
  meta?: Record<string, any>
  isExternal?: boolean
  isRoot?: boolean
}

type RuleChainConnectionView = {
  index: number
  fromIndex: number
  targetRuleChainId: number | string
  type: string
  additionalInfo?: Record<string, any>
  raw: Record<string, any>
}

const RuleChainNode = ({ data, selected }: NodeProps<RuleChainNodeData>) => {
  const hiddenNodeConnector =
    '!h-3 !w-3 !min-w-3 !min-h-3 !border-0 !bg-foreground-muted !opacity-0 group-hover:!opacity-100'

  const sectionStyle = NODE_SECTION_STYLE_MAP[data.section ?? ''] ?? DEFAULT_NODE_SECTION_STYLE
  const borderClass = data.isExternal
    ? 'border-warning-400 bg-warning-50'
    : `${sectionStyle.border} ${sectionStyle.background}`
  const accentClass = data.isExternal ? 'bg-warning-500' : sectionStyle.accent
  const rootClass = data.isRoot ? 'ring-1 ring-brand-500' : ''
  const selectedClass = selected ? 'ring-2 ring-brand-500' : ''

  return (
    <div
      className={`group relative w-full max-w-[320px] rounded-md border px-3 py-2 text-xs shadow-sm ${borderClass} ${rootClass} ${selectedClass}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-md ${accentClass}`} />
      {!data.isExternal && !data.isRoot && (
        <Handle type="target" position={Position.Left} className={hiddenNodeConnector} />
      )}
      <p className="font-medium text-foreground">{data.label}</p>
      {data.description && (
        <p className="text-[11px] leading-snug text-foreground-light">{data.description}</p>
      )}
      {!data.isExternal && (
        <Handle type="source" position={Position.Right} className={hiddenNodeConnector} />
      )}
    </div>
  )
}

const getValue = (obj: Record<string, any> | undefined | null, keys: string[]) => {
  if (!obj) return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return undefined
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

const normalizeAdditionalInfo = (node: Record<string, any>) => {
  return node.additionalInfo || node.additional_info || {}
}

const updateFirstNodeIndex = (metadata: Record<string, any>, index: number) => {
  if ('firstNodeIndex' in metadata) {
    return { ...metadata, firstNodeIndex: index }
  }
  if ('first_node_index' in metadata) {
    return { ...metadata, first_node_index: index }
  }
  return { ...metadata, firstNodeIndex: index }
}

const buildGraph = (
  rawMetadata: Record<string, any> | null,
  ruleChainNameById?: Map<number, string>
) => {
  const nodesList = Array.isArray(rawMetadata?.nodes) ? rawMetadata.nodes : []
  const connectionsList = Array.isArray(rawMetadata?.connections) ? rawMetadata.connections : []
  const chainConnectionsList = Array.isArray(
    rawMetadata?.ruleChainConnections || rawMetadata?.rule_chain_connections
  )
    ? rawMetadata?.ruleChainConnections || rawMetadata?.rule_chain_connections
    : []

  const firstNodeIndex = getValue(rawMetadata || {}, ['firstNodeIndex', 'first_node_index'])

  const nodes: Node<RuleChainNodeData>[] = nodesList.map((node: any, index: number) => {
    const additional = normalizeAdditionalInfo(node)
    const x = toNumber(additional.layoutX ?? additional.layout_x) ?? index * 220
    const y = toNumber(additional.layoutY ?? additional.layout_y) ?? 0
    const section = node.type ? NODE_SECTION_BY_TYPE[node.type] : undefined

    return {
      id: String(index),
      type: 'ruleChainNode',
      position: { x, y },
      data: {
        label: node.name || `Node ${index + 1}`,
        type: node.type,
        description: node.type ? NODE_TYPE_DESCRIPTIONS_RU[node.type] : undefined,
        section,
        meta: node,
        isRoot: firstNodeIndex === index,
      },
    }
  })

  const edges: Edge[] = connectionsList
    .map((connection: any, index: number) => {
      const fromIndex = getValue(connection, ['fromIndex', 'from_index'])
      const toIndex = getValue(connection, ['toIndex', 'to_index'])
      if (fromIndex === undefined || toIndex === undefined) return null
      const label = getValue(connection, ['type']) || 'Success'
      return {
        id: `edge-${fromIndex}-${toIndex}-${index}`,
        source: String(fromIndex),
        target: String(toIndex),
        label,
      }
    })
    .filter(Boolean) as Edge[]

  const externalNodes = new Map<string, Node<RuleChainNodeData>>()
  const externalEdges: Edge[] = chainConnectionsList
    .map((connection: any, index: number) => {
      const fromIndex = getValue(connection, ['fromIndex', 'from_index'])
      const targetRuleChainId = getValue(connection, [
        'targetRuleChainId',
        'target_rule_chain_id',
      ])
      if (fromIndex === undefined || targetRuleChainId === undefined) return null

      const externalNodeId = `chain-${targetRuleChainId}`
      if (!externalNodes.has(externalNodeId)) {
        const anchorNode = nodes.find((node) => node.id === String(fromIndex))
        const baseX = anchorNode?.position.x ?? 0
        const baseY = anchorNode?.position.y ?? 0
        const resolvedTargetId = Number(targetRuleChainId)
        const name =
          ruleChainNameById && !Number.isNaN(resolvedTargetId)
            ? ruleChainNameById.get(resolvedTargetId)
            : undefined
        const label = name ? `${name} (${targetRuleChainId})` : `Rule chain ${targetRuleChainId}`

        externalNodes.set(externalNodeId, {
          id: externalNodeId,
          type: 'ruleChainNode',
          position: { x: baseX + 280, y: baseY + 80 },
          selectable: false,
          draggable: false,
          connectable: false,
          data: {
            label,
            type: 'external',
            isExternal: true,
          },
        })
      }

      const label = getValue(connection, ['type']) || 'Forward'
      return {
        id: `edge-chain-${fromIndex}-${targetRuleChainId}-${index}`,
        source: String(fromIndex),
        target: externalNodeId,
        label,
        style: { strokeDasharray: '4 4' },
        selectable: false,
        focusable: false,
      }
    })
    .filter(Boolean) as Edge[]

  return {
    nodes: [...nodes, ...Array.from(externalNodes.values())],
    edges: [...edges, ...externalEdges],
  }
}

const buildMetadataFromGraph = (
  baseMetadata: Record<string, any>,
  nodes: Node<RuleChainNodeData>[],
  edges: Edge[]
) => {
  const baseNodes = Array.isArray(baseMetadata.nodes) ? baseMetadata.nodes : []
  const orderedNodes = nodes
    .filter((node) => !node.data?.isExternal)
    .sort((a, b) => Number(a.id) - Number(b.id))

  const updatedNodes = orderedNodes.map((node) => {
    const nodeIndex = Number(node.id)
    const fallbackMeta = Number.isNaN(nodeIndex) ? {} : baseNodes[nodeIndex] || {}
    const existingMeta = node.data?.meta || fallbackMeta
    const existingAdditional = normalizeAdditionalInfo(existingMeta)

    return {
      ...existingMeta,
      name: node.data?.label || existingMeta.name || `Node ${node.id}`,
      type: node.data?.type || existingMeta.type,
      additionalInfo: {
        ...existingAdditional,
        layoutX: Math.round(node.position.x),
        layoutY: Math.round(node.position.y),
      },
    }
  })

  const graphEdges = edges.filter((edge) => !edge.target.startsWith('chain-'))
  const updatedConnections = graphEdges
    .map((edge) => {
      const fromIndex = Number(edge.source)
      const toIndex = Number(edge.target)
      if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return null
      return {
        fromIndex,
        toIndex,
        type: edge.label || 'Success',
      }
    })
    .filter(Boolean)

  const nodeIndices = orderedNodes
    .map((node) => Number(node.id))
    .filter((value) => !Number.isNaN(value))
  const existingFirstNodeIndex = getValue(baseMetadata, ['firstNodeIndex', 'first_node_index'])
  const resolvedFirstNodeIndex =
    existingFirstNodeIndex !== undefined && nodeIndices.includes(existingFirstNodeIndex)
      ? existingFirstNodeIndex
      : nodeIndices[0] ?? 0

  const ruleChainConnections = Array.isArray(
    baseMetadata.ruleChainConnections || baseMetadata.rule_chain_connections
  )
    ? (baseMetadata.ruleChainConnections || baseMetadata.rule_chain_connections).filter(
        (connection: any) => {
          const fromIndex = getValue(connection, ['fromIndex', 'from_index'])
          return nodeIndices.includes(Number(fromIndex))
        }
      )
    : []

  const usesSnake =
    'rule_chain_connections' in baseMetadata && !('ruleChainConnections' in baseMetadata)
  const updatedMetadata: Record<string, any> = {
    ...baseMetadata,
    nodes: updatedNodes,
    connections: updatedConnections,
  }

  if (usesSnake) {
    updatedMetadata.rule_chain_connections = ruleChainConnections
    delete updatedMetadata.ruleChainConnections
  } else {
    updatedMetadata.ruleChainConnections = ruleChainConnections
    delete updatedMetadata.rule_chain_connections
  }

  return updateFirstNodeIndex(updatedMetadata, resolvedFirstNodeIndex)
}

const nextNodePosition = (nodes: Record<string, any>[]) => {
  if (!nodes.length) return { x: 120, y: 120 }
  const last = nodes[nodes.length - 1]
  const additional = normalizeAdditionalInfo(last)
  const x = toNumber(additional.layoutX ?? additional.layout_x) ?? 0
  const y = toNumber(additional.layoutY ?? additional.layout_y) ?? 0
  return { x: x + 220, y }
}

const validateNodeConfig = (type: string, config: Record<string, any>) => {
  const errors: string[] = []

  const requireNumber = (value: unknown, label: string) => {
    if (value === undefined || value === null) {
      errors.push(`${label} is required`)
      return
    }
    if (typeof value !== 'number') errors.push(`${label} must be a number`)
  }

  const requireBoolean = (value: unknown, label: string) => {
    if (value === undefined || value === null) {
      errors.push(`${label} is required`)
      return
    }
    if (typeof value !== 'boolean') errors.push(`${label} must be a boolean`)
  }

  const requireString = (value: unknown, label: string) => {
    if (value === undefined || value === null) {
      errors.push(`${label} is required`)
      return
    }
    if (typeof value !== 'string') errors.push(`${label} must be a string`)
  }

  if (!type) return errors

  switch (type) {
    case 'Telemetry.MsgTimeseriesNode':
      if (
        (config.defaultTTL !== undefined || config.processingSettings !== undefined) &&
        config.deviceIdPath === undefined &&
        config.device_id_path === undefined &&
        config.values === undefined &&
        config.valueMappings === undefined &&
        config.value_mappings === undefined
      ) {
        break
      }

      requireString(config.deviceIdPath ?? config.device_id_path, 'deviceIdPath')
      requireBoolean(config.useServerTs ?? config.use_server_ts, 'useServerTs')
      if ((config.useServerTs ?? config.use_server_ts) === false) {
        requireString(config.tsPath ?? config.ts_path, 'tsPath')
      }

      const values = config.values ?? config.valueMappings ?? config.value_mappings
      if (values !== undefined) {
        if (!Array.isArray(values)) {
          errors.push('values must be an array')
        } else {
          values.forEach((entry, index) => {
            requireString(entry.key, `values[${index}].key`)
            requireString(entry.valuePath ?? entry.value_path ?? entry.value, `values[${index}].valuePath`)
            requireString(
              entry.valueType ?? entry.value_type ?? entry.type,
              `values[${index}].valueType`
            )
          })
        }
      }
      break
    case 'Telemetry.MsgAttributesNode':
      if (!config.processingSettings || typeof config.processingSettings !== 'object') {
        errors.push('processingSettings is required')
      } else {
        requireString(config.processingSettings.type, 'processingSettings.type')
      }
      requireString(config.scope, 'scope')
      requireBoolean(config.notifyDevice, 'notifyDevice')
      requireBoolean(config.sendAttributesUpdatedNotification, 'sendAttributesUpdatedNotification')
      requireBoolean(config.updateAttributesOnlyOnValueChange, 'updateAttributesOnlyOnValueChange')
      {
        const attributes =
          config.attributes ??
          config.attributeMappings ??
          config.attribute_mappings ??
          config.fields
        if (attributes !== undefined) {
          if (!Array.isArray(attributes)) {
            errors.push('attributes must be an array')
          } else {
            attributes.forEach((entry, index) => {
              requireString(entry.key ?? entry.name ?? entry.type, `attributes[${index}].key`)
              requireString(
                entry.path ?? entry.valuePath ?? entry.value_path ?? entry.value,
                `attributes[${index}].path`
              )
            })
          }
        }
      }
      break
    case 'Filter.MsgTypeSwitchNode':
      if (config.version !== undefined && typeof config.version !== 'number') {
        errors.push('version must be a number')
      }
      break
    case 'Action.LogNode':
      if (config.label !== undefined && typeof config.label !== 'string') {
        errors.push('label must be a string')
      }
      {
        const messageTemplate =
          config.messageTemplate ?? config.message_template ?? config.message ?? config.text
        if (messageTemplate !== undefined && typeof messageTemplate !== 'string') {
          errors.push('messageTemplate must be a string')
        }
      }
      break
    case 'Rpc.SendRPCRequestNode':
      requireNumber(config.timeoutInSeconds, 'timeoutInSeconds')
      break
    case 'Transform.TransformMsgNode':
      requireString(config.script, 'script')
      break
    case 'Filter.JsFilterNode':
      requireString(config.script, 'script')
      break
    case 'Filter.MsgTypeFilterNode':
      if (!Array.isArray(config.messageTypes)) {
        errors.push('messageTypes must be an array')
      }
      break
    case 'Delay.MsgDelayNode':
      requireNumber(config.periodInSeconds, 'periodInSeconds')
      requireNumber(config.maxPendingMsgs, 'maxPendingMsgs')
      if (config.periodInSecondsPattern !== undefined && typeof config.periodInSecondsPattern !== 'string') {
        errors.push('periodInSecondsPattern must be a string')
      }
      requireBoolean(
        config.useMetadataPeriodInSecondsPatterns,
        'useMetadataPeriodInSecondsPatterns'
      )
      break
    case 'Flow.RuleChainInputNode':
      if (config.ruleChainId === undefined || config.ruleChainId === null || config.ruleChainId === '') {
        errors.push('ruleChainId is required')
      }
      requireBoolean(config.forwardMsgToDefaultRuleChain, 'forwardMsgToDefaultRuleChain')
      break
    case 'Rest.RestApiCallNode':
      requireString(config.restEndpointUrlPattern, 'restEndpointUrlPattern')
      requireString(config.requestMethod, 'requestMethod')
      if (config.headers !== undefined && typeof config.headers !== 'object') {
        errors.push('headers must be an object')
      }
      break
    case 'Mail.MsgToEmailNode':
      requireString(config.toTemplate, 'toTemplate')
      requireString(config.subjectTemplate, 'subjectTemplate')
      requireString(config.bodyTemplate, 'bodyTemplate')
      if (config.mailBodyType !== undefined && typeof config.mailBodyType !== 'string') {
        errors.push('mailBodyType must be a string')
      }
      break
    case 'Mail.SendEmailNode':
      if (config.endpointUrl !== undefined && typeof config.endpointUrl !== 'string') {
        errors.push('endpointUrl must be a string')
      }
      if (config.headers !== undefined && typeof config.headers !== 'object') {
        errors.push('headers must be an object')
      }
      if (config.timeout !== undefined && typeof config.timeout !== 'number') {
        errors.push('timeout must be a number')
      }
      break
    case 'Sms.SendSmsNode':
      requireString(config.numbersToTemplate, 'numbersToTemplate')
      requireString(config.smsMessageTemplate, 'smsMessageTemplate')
      if (config.endpointUrl !== undefined && typeof config.endpointUrl !== 'string') {
        errors.push('endpointUrl must be a string')
      }
      if (config.headers !== undefined && typeof config.headers !== 'object') {
        errors.push('headers must be an object')
      }
      if (config.timeout !== undefined && typeof config.timeout !== 'number') {
        errors.push('timeout must be a number')
      }
      break
    case 'Telegram.SendTelegramNode':
      requireString(config.messageTemplate, 'messageTemplate')
      if (config.botToken !== undefined && typeof config.botToken !== 'string') {
        errors.push('botToken must be a string')
      }
      if (config.chatIdTemplate !== undefined && typeof config.chatIdTemplate !== 'string') {
        errors.push('chatIdTemplate must be a string')
      }
      if (config.timeout !== undefined && typeof config.timeout !== 'number') {
        errors.push('timeout must be a number')
      }
      break
    default:
      break
  }

  return errors
}

const RuleChainDetailPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const isRouterReady = router.isReady
  const ruleChainId = isRouterReady
    ? parseQueryId(
        (router.query?.ruleChainId as string | string[] | undefined) ??
          (router.query?.id as string | string[] | undefined)
      )
    : undefined
  const modelId = isRouterReady
    ? router.query?.ruleChainId
      ? parseQueryId(router.query?.id as string | string[] | undefined)
      : parseQueryId(
          (router.query?.modelId as string | string[] | undefined) ??
            (router.query?.model_id as string | string[] | undefined)
        )
    : undefined
  const { data: deviceModels = [], isPending: isModelsPending } = useIotDeviceModelsQuery({
    enabled: !!modelId,
  })
  const { data: dataTypeKeys = [] } = useIotDataTypeKeysQuery({ enabled: !!modelId })
  const model = useMemo(
    () => deviceModels.find((entry) => entry.id === modelId) ?? null,
    [deviceModels, modelId]
  )
  const dataTypeKeyOptions = useMemo(() => {
    const ids = new Set(model?.data_type_key_ids ?? [])
    return dataTypeKeys
      .filter((key) => ids.has(key.id))
      .map((key) => ({
        value: key.data_key_name,
        label: key.name ? `${key.data_key_name} · ${key.name}` : key.data_key_name,
      }))
  }, [dataTypeKeys, model?.data_type_key_ids])
  const {
    data: ruleChain,
    isPending: isRuleChainLoading,
    isError: isRuleChainError,
    error: ruleChainError,
  } = useIotRuleChainQuery(ruleChainId)
  const { data: ruleChains = [], isPending: isRuleChainsLoading } = useIotRuleChainsQuery()
  const modelGate = useMemo(() => {
    if (!isRouterReady) return { status: 'loading' as const }
    if (!modelId) return { status: 'missing' as const }
    if (!ruleChainId) return { status: 'invalid' as const }
    if (isModelsPending || isRuleChainLoading) return { status: 'loading' as const }
    if (!model) return { status: 'model-not-found' as const }
    if (!ruleChain) return { status: 'missing-chain' as const }
    if (ruleChain.model_id !== modelId) return { status: 'mismatch' as const }
    if (ruleChain.type && ruleChain.type !== 'core') return { status: 'mismatch' as const }
    return { status: 'ok' as const }
  }, [isRouterReady, modelId, ruleChainId, isModelsPending, isRuleChainLoading, model, ruleChain])
  const handleBackToModel = useCallback(() => {
    if (!ref || !modelId) return
    router.push(`/project/${ref}/device-models/${modelId}`)
  }, [modelId, ref, router])

  const [metadataText, setMetadataText] = useState(DEFAULT_METADATA_TEXT)
  const [metadataVersion, setMetadataVersion] = useState('')
  const [metadataTextError, setMetadataTextError] = useState<string | null>(null)
  const [metadataState, setMetadataState] = useState<Record<string, any> | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [nodeName, setNodeName] = useState('')
  const [nodeType, setNodeType] = useState('')
  const [nodeConfigText, setNodeConfigText] = useState('{}')
  const [nodeConfigError, setNodeConfigError] = useState<string | null>(null)
  const [nodeConfigValidationErrors, setNodeConfigValidationErrors] = useState<string[]>([])
  const [edgeLabel, setEdgeLabel] = useState('Success')
  const [activeTab, setActiveTab] = useState<SelectionTab>('details')
  const [chainTargetId, setChainTargetId] = useState('')
  const [chainRelation, setChainRelation] = useState('Forward')
  const [editingChainConnectionIndex, setEditingChainConnectionIndex] = useState<number | null>(null)
  const [nodeSearch, setNodeSearch] = useState('')
  const [showInspector, setShowInspector] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [consoleTab, setConsoleTab] = useState<'console' | 'errors' | 'output' | 'metadata'>(
    'console'
  )
  const [consoleCollapsed, setConsoleCollapsed] = useState(true)
  const initialTestStateRef = useRef(buildDefaultTestState('http'))
  const [testProtocol, setTestProtocol] = useState<TestProtocol>('http')
  const [testMessages, setTestMessages] = useState<TestMessageEntry[]>(
    initialTestStateRef.current.messages
  )
  const [selectedTestMessageId, setSelectedTestMessageId] = useState(
    initialTestStateRef.current.selectedId
  )
  const [testHeadersError, setTestHeadersError] = useState<string | null>(null)
  const [testBodyError, setTestBodyError] = useState<string | null>(null)
  const [consoleLines, setConsoleLines] = useState<string[]>([])
  const [errorLines, setErrorLines] = useState<string[]>([])
  const [outputLines, setOutputLines] = useState<string[]>([])
  const [ruleChainType, setRuleChainType] = useState('core')
  const syncSourceRef = useRef<'server' | 'text' | 'graph' | null>(null)
  const graphDirtyRef = useRef(false)
  const pendingAutoSaveRef = useRef(false)
  const nodeAutoSaveTimerRef = useRef<number | null>(null)
  const edgeAutoSaveTimerRef = useRef<number | null>(null)
  const applyNodeUpdatesRef = useRef<() => void>(() => {})
  const applyEdgeLabelRef = useRef<() => void>(() => {})
  const inspectorPanelRef = useRef<ImperativePanelHandle>(null)
  const consolePanelRef = useRef<ImperativePanelHandle>(null)
  const autoSaveTimerRef = useRef<number | null>(null)
  const initialProtocolRef = useRef<TestProtocol | null>(null)

  const [nodes, setNodes] = useNodesState<RuleChainNodeData>([])
  const [edges, setEdges] = useEdgesState([])

  const {
    data: metadata,
    isPending: isMetadataLoading,
    isError: isMetadataError,
    error: metadataError,
  } = useIotRuleChainMetadataQuery(ruleChainId)

  const { mutateAsync: saveMetadata, isPending: isSavingMetadata } =
    useIotRuleChainMetadataMutation()
  const { mutateAsync: deleteRuleChain, isPending: isDeletingRuleChain } =
    useIotRuleChainDeleteMutation()
  const { mutateAsync: testRuleChain, isPending: isTestingRuleChain } =
    useIotRuleChainTestMutation()

  useEffect(() => {
    if (!ruleChain) return
    const nextType = normalizeRuleChainType(ruleChain.type)
    setRuleChainType(nextType)
  }, [ruleChain])

  const ruleChainNameById = useMemo(() => {
    return new Map(ruleChains.map((entry) => [entry.id, entry.name]))
  }, [ruleChains])

  const lockedTestProtocolOptions = useMemo(() => {
    const protocol = normalizeTestProtocol(model?.transport_type)
    return TEST_PROTOCOL_OPTIONS.filter((option) => option.value === protocol)
  }, [model])

  const selectedTestMessage = useMemo(() => {
    return testMessages.find((message) => message.id === selectedTestMessageId) || null
  }, [testMessages, selectedTestMessageId])

  const testHeadersText = selectedTestMessage?.headersText ?? ''
  const testBodyText = selectedTestMessage?.bodyText ?? ''
  const testMessageType = selectedTestMessage?.messageType ?? ''
  const testMessageName = selectedTestMessage?.name ?? ''

  const loadTestMessageState = useCallback(
    (protocol: TestProtocol) => {
      const fallback = buildDefaultTestState(protocol)
      const profileConfig = (model?.profile_config as Record<string, any>) || null
      const testMessagesConfig = profileConfig?.test_messages
      if (!testMessagesConfig || typeof testMessagesConfig !== 'object') return fallback

      const parsed = (testMessagesConfig as Record<string, any>)[protocol]
      if (!parsed || typeof parsed !== 'object') return fallback

      const template = formatTestTemplate(protocol)

      if (Array.isArray(parsed.messages)) {
        const messages = parsed.messages
          .filter((entry: any) => entry && typeof entry === 'object')
          .map((entry: any, index: number) => ({
            id:
              typeof entry.id === 'string' && entry.id.trim()
                ? entry.id
                : createTestMessageId(),
            name:
              typeof entry.name === 'string' && entry.name.trim()
                ? entry.name
                : `Message ${index + 1}`,
            headersText:
              typeof entry.headersText === 'string'
                ? entry.headersText
                : template.headersText,
            bodyText:
              typeof entry.bodyText === 'string' ? entry.bodyText : template.bodyText,
            messageType:
              typeof entry.messageType === 'string'
                ? entry.messageType
                : template.messageType,
          }))

        if (messages.length === 0) return fallback

        const selectedId =
          typeof parsed.selectedId === 'string' &&
          messages.some((message: TestMessageEntry) => message.id === parsed.selectedId)
            ? parsed.selectedId
            : messages[0].id

        return { messages, selectedId }
      }

      if (parsed && typeof parsed === 'object') {
        const message = createTestMessage(protocol, 1)
        return {
          messages: [
            {
              ...message,
              headersText:
                typeof parsed.headersText === 'string'
                  ? parsed.headersText
                  : template.headersText,
              bodyText:
                typeof parsed.bodyText === 'string' ? parsed.bodyText : template.bodyText,
              messageType:
                typeof parsed.messageType === 'string'
                  ? parsed.messageType
                  : template.messageType,
            },
          ],
          selectedId: message.id,
        }
      }

      return fallback
    },
    [model]
  )

  const openMetadataTab = useCallback(() => {
    setConsoleTab('metadata')
    if (consoleCollapsed) {
      consolePanelRef.current?.expand()
    }
  }, [consoleCollapsed])

  const handleConsoleTabChange = useCallback(
    (value: 'console' | 'errors' | 'output' | 'metadata') => {
      setConsoleTab(value)
      if (consoleCollapsed) {
        setConsoleCollapsed(false)
        consolePanelRef.current?.expand()
      }
    },
    [consoleCollapsed]
  )

  const handleTestProtocolChange = useCallback(
    (value: string) => {
      const protocol = value as TestProtocol
      const lockedProtocol = normalizeTestProtocol(model?.transport_type)
      if (protocol !== lockedProtocol) return

      const nextState = loadTestMessageState(protocol)
      setTestProtocol(protocol)
      setTestMessages(nextState.messages)
      setSelectedTestMessageId(nextState.selectedId)
      setTestHeadersError(null)
      setTestBodyError(null)
    },
    [loadTestMessageState, model]
  )

  const handleTestMessageSelect = useCallback((messageId: string) => {
    setSelectedTestMessageId(messageId)
    setTestHeadersError(null)
    setTestBodyError(null)
  }, [])

  const handleCreateTestMessage = useCallback(() => {
    const nextIndex = testMessages.length + 1
    const nextMessage = createTestMessage(testProtocol, nextIndex)
    setTestMessages((prev) => [...prev, nextMessage])
    setSelectedTestMessageId(nextMessage.id)
  }, [testMessages, testProtocol])

  const handleGenerateTestMessages = useCallback(() => {
    const nextState = buildDefaultTestState(testProtocol)
    setTestMessages(nextState.messages)
    setSelectedTestMessageId(nextState.selectedId)
    setTestHeadersError(null)
    setTestBodyError(null)
  }, [testProtocol])

  const handleDeleteTestMessage = useCallback(
    (messageId: string) => {
      setTestMessages((prev) => {
        const next = prev.filter((message) => message.id !== messageId)
        if (next.length === 0) {
          const fallback = createTestMessage(testProtocol, 1)
          setSelectedTestMessageId(fallback.id)
          return [fallback]
        }
        if (messageId === selectedTestMessageId) {
          setSelectedTestMessageId(next[0].id)
        }
        return next
      })
    },
    [selectedTestMessageId, testProtocol]
  )

  const handleTestHeadersChange = useCallback(
    (value: string) => {
      setTestMessages((prev) =>
        prev.map((message) =>
          message.id === selectedTestMessageId
            ? { ...message, headersText: value }
            : message
        )
      )
      setTestHeadersError(null)
    },
    [selectedTestMessageId]
  )

  const handleTestBodyChange = useCallback(
    (value: string) => {
      setTestMessages((prev) =>
        prev.map((message) =>
          message.id === selectedTestMessageId ? { ...message, bodyText: value } : message
        )
      )
      setTestBodyError(null)
    },
    [selectedTestMessageId]
  )

  const handleTestMessageTypeChange = useCallback(
    (value: string) => {
      setTestMessages((prev) =>
        prev.map((message) =>
          message.id === selectedTestMessageId
            ? { ...message, messageType: value }
            : message
        )
      )
    },
    [selectedTestMessageId]
  )

  const handleTestMessageNameChange = useCallback(
    (value: string) => {
      setTestMessages((prev) =>
        prev.map((message) =>
          message.id === selectedTestMessageId ? { ...message, name: value } : message
        )
      )
    },
    [selectedTestMessageId]
  )

  useEffect(() => {
    if (!modelId) return
    const nextState = loadTestMessageState(testProtocol)
    setTestMessages(nextState.messages)
    setSelectedTestMessageId(nextState.selectedId)
  }, [modelId, testProtocol, loadTestMessageState])

  useEffect(() => {
    if (!model) return
    const protocol = normalizeTestProtocol(model.transport_type)
    if (initialProtocolRef.current === protocol) return
    initialProtocolRef.current = protocol
    const nextState = loadTestMessageState(protocol)
    setTestProtocol(protocol)
    setTestMessages(nextState.messages)
    setSelectedTestMessageId(nextState.selectedId)
    setTestHeadersError(null)
    setTestBodyError(null)
  }, [model, loadTestMessageState])

  useEffect(() => {
    if (testMessages.length === 0) {
      const fallback = buildDefaultTestState(testProtocol)
      setTestMessages(fallback.messages)
      setSelectedTestMessageId(fallback.selectedId)
      return
    }
    if (!testMessages.some((message) => message.id === selectedTestMessageId)) {
      setSelectedTestMessageId(testMessages[0].id)
    }
  }, [testMessages, selectedTestMessageId, testProtocol])

  const handleRunTest = useCallback(
    async (overrideMessages?: TestMessageEntry[]) => {
      if (!ruleChainId) return

      const messagesToRun = overrideMessages ?? testMessages

      setTestHeadersError(null)
      setTestBodyError(null)
    const nextConsoleLines: string[] = []
    const nextErrorLines: string[] = []
    const nextOutputLines: string[] = []

      for (const [index, message] of messagesToRun.entries()) {
      const headersText = message.headersText ?? ''
      const bodyText = message.bodyText ?? ''
      const messageTypeValue = message.messageType ?? ''

      let headers: Record<string, string> | undefined
      if (headersText.trim()) {
        try {
          const decoded = JSON.parse(headersText)
          if (!decoded || Array.isArray(decoded) || typeof decoded !== 'object') {
            setSelectedTestMessageId(message.id)
            setTestHeadersError('Headers must be a JSON object.')
            return
          }

          headers = Object.entries(decoded).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              acc[key] = typeof value === 'string' ? value : String(value)
              return acc
            },
            {}
          )
        } catch {
          setSelectedTestMessageId(message.id)
          setTestHeadersError('Invalid JSON headers.')
          return
        }
      }

      let body: unknown | undefined
      if (bodyText.trim()) {
        try {
          body = JSON.parse(bodyText)
        } catch {
          setSelectedTestMessageId(message.id)
          setTestBodyError('Invalid JSON body.')
          return
        }
      }

      const requestPayload: Record<string, unknown> = {}
      if (headers && Object.keys(headers).length > 0) {
        requestPayload.headers = headers
      }
      if (body !== undefined) {
        requestPayload.body = body
      }
      if (messageTypeValue.trim()) {
        requestPayload.message_type = messageTypeValue.trim()
      }

      try {
        const result = await testRuleChain({ ruleChainId, payload: requestPayload })
        const timestamp = new Date().toISOString()
        const formatted = JSON.stringify(result ?? {}, null, 2)
        const label = message.name || `Message ${index + 1}`
        const header = `[${timestamp}] ${label}`

        nextConsoleLines.push(`${header}\n${formatted}`)
        const preparedEntries = Array.isArray(result?.results)
          ? result.results.map((entry) => entry?.prepared).filter(Boolean)
          : []
        const outputSummary = preparedEntries.reduce(
          (acc, prepared) => {
            const preparedValue = (prepared ?? {}) as Record<string, any>
            const responses = Array.isArray(preparedValue.responses) ? preparedValue.responses : []
            const outbound = Array.isArray(preparedValue.outbound_requests)
              ? preparedValue.outbound_requests
              : []
            const telemetryRows = Array.isArray(preparedValue.telemetry_rows)
              ? preparedValue.telemetry_rows
              : []

            acc.responses.push(...responses)
            acc.outboundRequests.push(...outbound)
            acc.telemetryRows.push(...telemetryRows)
            return acc
          },
          {
            responses: [] as unknown[],
            outboundRequests: [] as Array<{ type?: string; payload?: unknown }>,
            telemetryRows: [] as unknown[],
          }
        )

        const outputPayload = {
          ingest_responses: outputSummary.responses,
          kafka: outputSummary.outboundRequests.filter((entry) => entry?.type === 'kafka'),
          clickhouse_rows: outputSummary.telemetryRows,
        }
        nextOutputLines.push(`${header}\n${JSON.stringify(outputPayload, null, 2)}`)
        const collectedErrors =
          result?.results?.flatMap((entry) =>
            Array.isArray(entry?.errors) ? entry.errors : []
          ) ?? []
        if (collectedErrors.length > 0) {
          const formattedErrors = JSON.stringify(collectedErrors, null, 2)
          nextErrorLines.push(`[${timestamp}] ${label}\n${formattedErrors}`)
        }
      } catch (err) {
        const messageText = err instanceof Error ? err.message : 'Failed to run test.'
        const timestamp = new Date().toISOString()
        nextErrorLines.push(`[${timestamp}] ${messageText}`)
        nextConsoleLines.push(`[${timestamp}] Test failed\n${messageText}`)
        setErrorLines((prev) => [...prev, ...nextErrorLines])
        setConsoleLines((prev) => [...prev, ...nextConsoleLines])
        setOutputLines((prev) => [...prev, ...nextOutputLines])
        handleConsoleTabChange('errors')
        return
      }
    }

      setConsoleLines((prev) => [...prev, ...nextConsoleLines])
      setErrorLines(nextErrorLines)
      setOutputLines((prev) => [...prev, ...nextOutputLines])
      handleConsoleTabChange('console')
    },
    [
      ruleChainId,
      testProtocol,
      testMessages,
      testRuleChain,
      handleConsoleTabChange,
    ]
  )

  const handleDeleteRuleChain = useCallback(async () => {
    if (!ruleChainId) return
    try {
      await deleteRuleChain({ ruleChainId })
      setDeleteModalOpen(false)
      setInfoPanelOpen(false)
      if (ref) {
        await router.push(`/project/${ref}/rule-chains`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete rule chain.')
    }
  }, [deleteRuleChain, ref, router, ruleChainId])

  const scheduleMetadataAutosave = useCallback(
    (nextMetadataText?: string) => {
      if (!ruleChainId) return

      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = window.setTimeout(async () => {
        autoSaveTimerRef.current = null
        if (!ruleChainId || isSavingMetadata) return
        if (metadataTextError) return

        const candidateText = nextMetadataText ?? metadataText
        if (!candidateText.trim()) return

        let parsedVersion: number | null = null
        if (metadataVersion.trim()) {
          const value = Number(metadataVersion)
          if (Number.isNaN(value)) return
          parsedVersion = value
        }

        let metadataPayload: Record<string, unknown> | null = null
        try {
          metadataPayload = JSON.parse(candidateText)
        } catch (_err) {
          return
        }

        try {
          await saveMetadata({
            ruleChainId,
            payload: {
              version: parsedVersion,
              metadata: metadataPayload,
            },
          })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to save metadata.')
        }
      }, 350)
    },
    [
      isSavingMetadata,
      metadataText,
      metadataTextError,
      metadataVersion,
      ruleChainId,
      saveMetadata,
    ]
  )

  useEffect(() => {
    if (selectedEdgeId || selectedNodeId) {
      setActiveTab((prev) => (prev === 'debug' ? 'debug' : 'details'))
      return
    }
    setActiveTab('details')
  }, [selectedNodeId, selectedEdgeId])

  useEffect(() => {
    if (!selectedNodeId) {
      setEditingChainConnectionIndex(null)
      return
    }
    setEditingChainConnectionIndex(null)
    if (!chainTargetId && ruleChains.length > 0) {
      setChainTargetId(String(ruleChains[0].id))
    }
    const currentNode = nodes.find((node) => node.id === selectedNodeId)
    const allowedRelations =
      getMessageTypeSwitchRelations(currentNode) || getAllowedRelationsForNodeType(nodeType)
    if (!chainRelation || !allowedRelations.includes(chainRelation)) {
      setChainRelation(allowedRelations[0] ?? 'Forward')
    }
  }, [selectedNodeId, ruleChains, chainTargetId, chainRelation, nodeType, nodes])

  useEffect(() => {
    const existingMetadata = metadata?.metadata
    if (existingMetadata) {
      syncSourceRef.current = 'server'
      setMetadataState(existingMetadata)
      setMetadataText(JSON.stringify(existingMetadata, null, 2))
      setMetadataVersion(metadata.version != null ? String(metadata.version) : '')
      setMetadataTextError(null)
      return
    }

    const missing =
      metadataError instanceof Error &&
      metadataError.message.includes('rule_chain_metadata_not_found')

    if (metadata || missing || isMetadataError) {
      syncSourceRef.current = 'server'
      setMetadataState(DEFAULT_METADATA_TEMPLATE)
      setMetadataText(DEFAULT_METADATA_TEXT)
      setMetadataVersion(metadata?.version != null ? String(metadata.version) : '')
      setMetadataTextError(null)
    }
  }, [metadata, metadataError, isMetadataError])

  useEffect(() => {
    if (!metadataState) return
    if (syncSourceRef.current === 'graph') {
      syncSourceRef.current = null
      return
    }

    const graph = buildGraph(metadataState, ruleChainNameById)
    setNodes(graph.nodes)
    setEdges(graph.edges)
    syncSourceRef.current = null
  }, [metadataState, ruleChainNameById, setNodes, setEdges])

  useEffect(() => {
    if (!graphDirtyRef.current) return
    if (!metadataState) return
    if (syncSourceRef.current === 'text' || syncSourceRef.current === 'server') return

    graphDirtyRef.current = false
    const updated = buildMetadataFromGraph(metadataState, nodes, edges)
    syncSourceRef.current = 'graph'
    setMetadataState(updated)
    const nextText = JSON.stringify(updated, null, 2)
    setMetadataText(nextText)
    setMetadataTextError(null)
    if (pendingAutoSaveRef.current) {
      pendingAutoSaveRef.current = false
      scheduleMetadataAutosave(nextText)
    }
  }, [nodes, edges, metadataState, scheduleMetadataAutosave])

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedNodeId) {
      setNodeConfigValidationErrors([])
      return
    }

    let parsedConfig: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsedConfig = JSON.parse(nodeConfigText)
      } catch (_err) {
        setNodeConfigValidationErrors([])
        return
      }
    }

    setNodeConfigValidationErrors(validateNodeConfig(nodeType, parsedConfig))
  }, [selectedNodeId, nodeConfigText, nodeType])

  useEffect(() => {
    if (!selectedNodeId || activeTab === 'debug') return
    if (nodeAutoSaveTimerRef.current) {
      window.clearTimeout(nodeAutoSaveTimerRef.current)
    }

    let parsedConfig: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsedConfig = JSON.parse(nodeConfigText)
      } catch (_err) {
        return
      }
    }

    if (validateNodeConfig(nodeType, parsedConfig).length > 0) return

    nodeAutoSaveTimerRef.current = window.setTimeout(() => {
      nodeAutoSaveTimerRef.current = null
      applyNodeUpdatesRef.current()
    }, 400)

    return () => {
      if (nodeAutoSaveTimerRef.current) {
        window.clearTimeout(nodeAutoSaveTimerRef.current)
      }
    }
  }, [selectedNodeId, nodeName, nodeType, nodeConfigText, activeTab])

  useEffect(() => {
    if (!selectedEdgeId || activeTab === 'debug') return
    if (edgeAutoSaveTimerRef.current) {
      window.clearTimeout(edgeAutoSaveTimerRef.current)
    }

    edgeAutoSaveTimerRef.current = window.setTimeout(() => {
      edgeAutoSaveTimerRef.current = null
      applyEdgeLabelRef.current()
    }, 350)

    return () => {
      if (edgeAutoSaveTimerRef.current) {
        window.clearTimeout(edgeAutoSaveTimerRef.current)
      }
    }
  }, [selectedEdgeId, edgeLabel, activeTab])

  const nodeTypes = useMemo(() => ({ ruleChainNode: RuleChainNode }), [])

  const scopedNodeTemplates = useMemo(() => {
    if (ruleChainType === 'ingest') {
      return NODE_TEMPLATES.filter((template) => INGEST_NODE_VALUES.has(template.value))
    }
    return NODE_TEMPLATES
  }, [ruleChainType])

  const nodeTypeOptions = useMemo(() => {
    if (!nodeType || scopedNodeTemplates.some((entry) => entry.value === nodeType)) {
      return scopedNodeTemplates
    }
    return [
      ...scopedNodeTemplates,
      { label: nodeType, value: nodeType, section: 'other', meta: { type: nodeType } },
    ]
  }, [nodeType, scopedNodeTemplates])

  const outgoingEdges = useMemo(() => {
    if (!selectedNodeId) return []
    return edges.filter((edge) => edge.source === selectedNodeId)
  }, [edges, selectedNodeId])

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) return undefined
    return edges.find((edge) => edge.id === selectedEdgeId)
  }, [edges, selectedEdgeId])

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return undefined
    return nodes.find((node) => node.id === selectedNodeId)
  }, [nodes, selectedNodeId])

  const ruleChainConnections = useMemo<Record<string, any>[]>(() => {
    const connections =
      metadataState?.ruleChainConnections || metadataState?.rule_chain_connections || []
    return Array.isArray(connections) ? connections : []
  }, [metadataState])

  const normalizedRuleChainConnections = useMemo<RuleChainConnectionView[]>(() => {
    const normalized = ruleChainConnections.map<RuleChainConnectionView | null>((entry, index) => {
        const fromIndex = Number(getValue(entry, ['fromIndex', 'from_index']))
        if (Number.isNaN(fromIndex)) return null
        const targetRuleChainId = getValue(entry, [
          'targetRuleChainId',
          'target_rule_chain_id',
        ])
        if (targetRuleChainId === undefined || targetRuleChainId === null) return null
        return {
          index,
          fromIndex,
          targetRuleChainId,
          type: getValue(entry, ['type']) || 'Forward',
          additionalInfo: getValue(entry, ['additionalInfo', 'additional_info']) || {},
          raw: entry,
        }
      })

    return normalized.filter(
      (entry): entry is RuleChainConnectionView => entry !== null
    )
  }, [ruleChainConnections])

  const selectedRuleChainConnections = useMemo<RuleChainConnectionView[]>(() => {
    if (!selectedNodeId) return []
    const fromIndex = Number(selectedNodeId)
    if (Number.isNaN(fromIndex)) return []
    return normalizedRuleChainConnections.filter((entry) => entry.fromIndex === fromIndex)
  }, [normalizedRuleChainConnections, selectedNodeId])

  const ruleChainOptions = useMemo(() => {
    return ruleChains.map((ruleChain) => ({
      label: ruleChain.name,
      value: String(ruleChain.id),
    }))
  }, [ruleChains])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removedNodeIds = changes
        .filter((change) => change.type === 'remove')
        .map((change) => change.id)
      if (removedNodeIds.length > 0 && selectedNodeId && removedNodeIds.includes(selectedNodeId)) {
        setSelectedNodeId(null)
        setSelectedEdgeId(null)
        setNodeName('')
        setNodeType('')
      }
      setNodes((currentNodes) => {
        const updatedNodes = applyNodeChanges(changes, currentNodes)
        if (changes.some((change) => change.type === 'position' && !change.dragging)) {
          graphDirtyRef.current = true
          pendingAutoSaveRef.current = true
        }
        return updatedNodes
      })
    },
    [selectedNodeId, setNodeName, setNodeType, setNodes, setSelectedEdgeId, setSelectedNodeId]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((currentEdges) => {
        const updatedEdges = applyEdgeChanges(changes, currentEdges)
        if (changes.some((change) => change.type === 'remove')) {
          graphDirtyRef.current = true
          pendingAutoSaveRef.current = true
        }
        return updatedEdges
      })
    },
    [setEdges]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source)
      const sourceNodeType = sourceNode?.data?.type
      const allowedRelations =
        getMessageTypeSwitchRelations(sourceNode) || getAllowedRelationsForNodeType(sourceNodeType)
      const usedRelations = new Set(
        edges
          .filter((edge) => edge.source === connection.source)
          .map((edge) => String(edge.label || 'Success'))
      )
      const defaultLabel =
        allowedRelations.find((relation) => !usedRelations.has(relation)) ||
        allowedRelations[0] ||
        'Success'

      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            label: defaultLabel,
          },
          currentEdges
        )
      )
      graphDirtyRef.current = true
      pendingAutoSaveRef.current = true
    },
    [edges, nodes, setEdges]
  )

  const onNodeClick = useCallback((_: unknown, node: Node<RuleChainNodeData>) => {
    if (node.data?.isExternal) return
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
    setNodeName(node.data?.label || '')
    setNodeType(node.data?.type || '')
    setShowInspector(true)

    const config = node.data?.meta?.configuration || {}
    setNodeConfigText(JSON.stringify(config, null, 2))
    setNodeConfigError(null)
  }, [])

  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    if (edge.target.startsWith('chain-')) return
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
    setEdgeLabel(typeof edge.label === 'string' ? edge.label : 'Success')
    setShowInspector(true)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [])

  const onMetadataTextChange = (value: string) => {
    setMetadataText(value)

    if (!value.trim()) {
      setMetadataTextError(null)
      return
    }

    try {
      const parsed = JSON.parse(value)
      setMetadataTextError(null)
      syncSourceRef.current = 'text'
      setMetadataState(parsed)
    } catch (_err) {
      setMetadataTextError('Invalid JSON')
    }
  }

  const addNodeFromTemplate = (template: NodeTemplate) => {
    if (!metadataState) return
    const baseMetadata = buildMetadataFromGraph(metadataState, nodes, edges)
    const currentNodes = Array.isArray(baseMetadata.nodes) ? [...baseMetadata.nodes] : []
    const position = nextNodePosition(currentNodes)

    const templateMeta = template.meta || {}
    const newNode = {
      ...templateMeta,
      additionalInfo: {
        ...(templateMeta.additionalInfo || {}),
        layoutX: position.x,
        layoutY: position.y,
      },
    }

    const updated = {
      ...baseMetadata,
      nodes: [...currentNodes, newNode],
    }

    syncSourceRef.current = 'text'
    graphDirtyRef.current = false
    setMetadataState(updated)
    const nextText = JSON.stringify(updated, null, 2)
    setMetadataText(nextText)
    setMetadataTextError(null)
    pendingAutoSaveRef.current = true
    scheduleMetadataAutosave(nextText)
  }

  const onAddNodeFromList = (template: NodeTemplate) => {
    addNodeFromTemplate(template)
  }

  const onNodeTypeChange = (value: string) => {
    setNodeType(value)
    const template = NODE_TEMPLATES.find((entry) => entry.value === value)
    if (template?.meta?.configuration) {
      setNodeConfigText(JSON.stringify(template.meta.configuration, null, 2))
      setNodeConfigError(null)
    }
    if (!nodeName.trim()) {
      setNodeName(template?.meta?.name || template?.label || '')
    }
  }

  const applyNodeUpdates = useCallback(() => {
    if (!selectedNodeId) return
    const target = nodes.find((node) => node.id === selectedNodeId)
    if (!target) return

    let configPayload: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        configPayload = JSON.parse(nodeConfigText)
      } catch (_err) {
        setNodeConfigError('Invalid JSON')
        return
      }
    }

    const validationErrors = validateNodeConfig(nodeType, configPayload)
    if (validationErrors.length) {
      setNodeConfigValidationErrors(validationErrors)
      return
    }

    const template = NODE_TEMPLATES.find((entry) => entry.value === nodeType)
    const baseMeta = (target.data?.meta || {}) as Record<string, any>
    const templateMeta = (template?.meta || {}) as Record<string, any>
    const existingAdditional = normalizeAdditionalInfo(baseMeta)

    const updatedMeta = {
      ...templateMeta,
      ...baseMeta,
      name: nodeName.trim() || baseMeta.name || templateMeta.name || target.data?.label || 'Node',
      type: nodeType || baseMeta.type,
      configuration: configPayload,
      additionalInfo: {
        ...normalizeAdditionalInfo(templateMeta),
        ...existingAdditional,
      },
    }
    const updatedSection = updatedMeta.type ? NODE_SECTION_BY_TYPE[updatedMeta.type] : undefined

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: updatedMeta.name,
                type: updatedMeta.type,
                section: updatedSection,
                meta: updatedMeta,
              },
            }
          : node
      )
    )

    graphDirtyRef.current = true
    pendingAutoSaveRef.current = true
    setNodeConfigError(null)
    setNodeConfigValidationErrors([])
  }, [nodeConfigText, nodeName, nodeType, nodes, selectedNodeId, setNodes])

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNodeId))
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    )
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    graphDirtyRef.current = true
    pendingAutoSaveRef.current = true
  }

  const setNodeAsFirst = () => {
    if (!selectedNodeId || !metadataState) return
    const nodeIndex = Number(selectedNodeId)
    if (Number.isNaN(nodeIndex)) return
    const updated = updateFirstNodeIndex(metadataState, nodeIndex)
    syncSourceRef.current = 'text'
    setMetadataState(updated)
    const nextText = JSON.stringify(updated, null, 2)
    setMetadataText(nextText)
    setMetadataTextError(null)
    scheduleMetadataAutosave(nextText)
  }

  const setNodeAsFirstById = (nodeId: string) => {
    if (!metadataState) return
    const nodeIndex = Number(nodeId)
    if (Number.isNaN(nodeIndex)) return
    const updated = updateFirstNodeIndex(metadataState, nodeIndex)
    syncSourceRef.current = 'text'
    setMetadataState(updated)
    const nextText = JSON.stringify(updated, null, 2)
    setMetadataText(nextText)
    setMetadataTextError(null)
    scheduleMetadataAutosave(nextText)
  }

  const applyEdgeLabel = useCallback(() => {
    if (!selectedEdgeId) return
    setEdges((currentEdges) =>
      currentEdges.map((edge) =>
        edge.id === selectedEdgeId
          ? {
              ...edge,
              label: edgeLabel || 'Success',
            }
          : edge
      )
    )
    graphDirtyRef.current = true
    pendingAutoSaveRef.current = true
  }, [edgeLabel, selectedEdgeId, setEdges])

  useEffect(() => {
    applyNodeUpdatesRef.current = applyNodeUpdates
  }, [applyNodeUpdates])

  useEffect(() => {
    applyEdgeLabelRef.current = applyEdgeLabel
  }, [applyEdgeLabel])

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdgeId))
    setSelectedEdgeId(null)
    graphDirtyRef.current = true
    pendingAutoSaveRef.current = true
  }

  const parseRuleChainId = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    const parsed = Number(trimmed)
    return Number.isNaN(parsed) ? trimmed : parsed
  }

  const buildRuleChainConnectionEntry = (
    existing: Record<string, any> | undefined,
    fromIndex: number,
    targetRuleChainId: number | string,
    type: string
  ) => {
    const useSnake =
      existing && ('from_index' in existing || 'target_rule_chain_id' in existing)

    if (useSnake) {
      const entry = { ...(existing || {}) }
      entry.from_index = fromIndex
      entry.target_rule_chain_id = targetRuleChainId
      entry.type = type
      entry.additional_info = entry.additional_info || entry.additionalInfo || {}
      delete entry.fromIndex
      delete entry.targetRuleChainId
      delete entry.additionalInfo
      return entry
    }

    const entry = { ...(existing || {}) }
    entry.fromIndex = fromIndex
    entry.targetRuleChainId = targetRuleChainId
    entry.type = type
    entry.additionalInfo = entry.additionalInfo || entry.additional_info || {}
    delete entry.from_index
    delete entry.target_rule_chain_id
    delete entry.additional_info
    return entry
  }

  const updateRuleChainConnections = (connections: Record<string, any>[]) => {
    if (!metadataState) return
    const updated = { ...metadataState }
    if ('rule_chain_connections' in updated) {
      updated.rule_chain_connections = connections
    } else {
      updated.ruleChainConnections = connections
    }
    syncSourceRef.current = 'text'
    setMetadataState(updated)
    setMetadataText(JSON.stringify(updated, null, 2))
    setMetadataTextError(null)
  }

  const applyRuleChainConnection = () => {
    if (!selectedNodeId) return
    const fromIndex = Number(selectedNodeId)
    if (Number.isNaN(fromIndex)) return
    const targetValue = parseRuleChainId(chainTargetId)
    if (!targetValue && targetValue !== 0) return

    const nextConnections = [...ruleChainConnections]
    const existing =
      editingChainConnectionIndex !== null ? nextConnections[editingChainConnectionIndex] : undefined
    const entry = buildRuleChainConnectionEntry(
      existing,
      fromIndex,
      targetValue,
      chainRelation || 'Forward'
    )

    if (editingChainConnectionIndex !== null) {
      nextConnections[editingChainConnectionIndex] = entry
    } else {
      nextConnections.push(entry)
    }

    updateRuleChainConnections(nextConnections)
    setEditingChainConnectionIndex(null)
  }

  const deleteRuleChainConnection = (index: number) => {
    const nextConnections = [...ruleChainConnections]
    nextConnections.splice(index, 1)
    updateRuleChainConnections(nextConnections)
    if (editingChainConnectionIndex === index) {
      setEditingChainConnectionIndex(null)
    }
  }

  const startRuleChainConnectionEdit = (connection: {
    index: number
    targetRuleChainId: number | string
    type?: string
  }) => {
    setEditingChainConnectionIndex(connection.index)
    setChainTargetId(String(connection.targetRuleChainId))
    setChainRelation(connection.type || 'Forward')
  }

  const cancelRuleChainConnectionEdit = () => {
    setEditingChainConnectionIndex(null)
  }

  const selectEdge = (edge: Edge) => {
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
    setEdgeLabel(typeof edge.label === 'string' ? edge.label : 'Success')
  }

  const onSaveMetadata = async () => {
    if (!ruleChainId) return

    let parsedVersion: number | null = null
    if (metadataVersion.trim()) {
      const value = Number(metadataVersion)
      if (Number.isNaN(value)) {
        toast.error('Version must be a number.')
        return
      }
      parsedVersion = value
    }

    let metadataPayload: Record<string, unknown> | null = null
    if (metadataText.trim()) {
      try {
        metadataPayload = JSON.parse(metadataText)
      } catch (err) {
        toast.error('Metadata must be valid JSON.')
        return
      }
    }

    try {
      await saveMetadata({
        ruleChainId,
        payload: {
          version: parsedVersion,
          metadata: metadataPayload,
        },
      })
      toast.success('Rule chain metadata saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save metadata.')
    }
  }

  const metadataMissing =
    metadataError instanceof Error &&
    metadataError.message.includes('rule_chain_metadata_not_found')
  const metadataErrorText = metadataMissing ? null : metadataError?.message

  const selectedNodeRelationOptions = useMemo(() => {
    return getMessageTypeSwitchRelations(selectedNode) || getAllowedRelationsForNodeType(nodeType)
  }, [selectedNode, nodeType])
  const selectedEdgeRelationOptions = useMemo(() => {
    if (!selectedEdge) return RELATION_OPTIONS
    const sourceNode = nodes.find((node) => node.id === selectedEdge.source)
    return (
      getMessageTypeSwitchRelations(sourceNode) ||
      getAllowedRelationsForNodeType(sourceNode?.data?.type)
    )
  }, [nodes, selectedEdge])

  const selectedRelation = selectedEdgeRelationOptions.includes(edgeLabel) ? edgeLabel : 'custom'
  const selectedChainRelation = selectedNodeRelationOptions.includes(chainRelation)
    ? chainRelation
    : 'custom'
  const requiredFields = TEST_REQUIRED_FIELDS[testProtocol]

  const handleChainRelationSelect = useCallback((value: string) => {
    if (value !== 'custom') {
      setChainRelation(value)
    }
  }, [])

  const handleEdgeRelationSelect = useCallback((value: string) => {
    if (value !== 'custom') {
      setEdgeLabel(value)
    }
  }, [])

  const selectionTitle = useMemo(() => {
    if (selectedNodeId) return `Node ${selectedNodeId}`
    if (selectedEdgeId) return 'Connection'
    return 'Selection'
  }, [selectedNodeId, selectedEdgeId])

  const selectionHint = useMemo(() => {
    if (selectedNodeId) return `Node ${selectedNodeId}`
    if (selectedEdgeId) return 'Edge'
    return 'Select a node or edge'
  }, [selectedNodeId, selectedEdgeId])

  const debugPayload = useMemo(() => {
    if (selectedNode) {
      return JSON.stringify(selectedNode.data?.meta || {}, null, 2)
    }
    if (selectedEdge) {
      return JSON.stringify(selectedEdge, null, 2)
    }
    return ''
  }, [selectedNode, selectedEdge])

  const filteredNodeTemplates = useMemo(() => {
    const query = nodeSearch.trim().toLowerCase()
    if (!query) return scopedNodeTemplates
    return scopedNodeTemplates.filter((template) => {
      return (
        template.label.toLowerCase().includes(query) ||
        template.value.toLowerCase().includes(query)
      )
    })
  }, [nodeSearch, scopedNodeTemplates])

  useEffect(() => {
    if (showInspector) {
      inspectorPanelRef.current?.expand()
    } else {
      inspectorPanelRef.current?.collapse()
    }
  }, [showInspector])

  if (modelGate.status !== 'ok') {
    const message =
      modelGate.status === 'loading'
        ? 'Loading rule chain...'
        : modelGate.status === 'missing'
          ? 'Open this rule chain from a device model to edit it.'
          : modelGate.status === 'invalid'
            ? 'Invalid rule chain id.'
            : modelGate.status === 'model-not-found'
              ? 'Device model not found. Open this rule chain from a valid device model.'
              : modelGate.status === 'missing-chain'
                ? 'Rule chain not found for the selected device model.'
                : 'This rule chain is not associated with the selected device model.'

    return (
      <PageContainer size="full" className="flex h-full min-h-0 flex-col px-6 py-6">
        <p className="text-sm text-foreground-light">{message}</p>
      </PageContainer>
    )
  }

  return (
    <>
      <PageContainer size="full" className="flex h-full min-h-0 flex-col px-0 xl:px-0">
        <RuleChainToolbar
          title={ruleChain?.name ?? ''}
          isLoading={isRuleChainLoading}
          canEdit={!!ruleChain}
          onBack={handleBackToModel}
          nodeSearch={nodeSearch}
          onNodeSearchChange={setNodeSearch}
          filteredNodeTemplates={filteredNodeTemplates}
          nodeSections={NODE_SECTIONS}
          onAddNodeFromList={onAddNodeFromList}
        />
        <div className="flex min-h-0 flex-1 flex-col">
          <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1 h-full">
            <ResizablePanel defaultSize={70} minSize={40} className="min-h-0 h-full">
              <RuleChainEditor
                isError={isRuleChainError}
                errorMessage={ruleChainError?.message}
                filteredNodeTemplates={filteredNodeTemplates}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                showInspector={showInspector}
                onShowInspector={setShowInspector}
                inspectorPanelRef={inspectorPanelRef}
                selectionTitle={selectionTitle}
                selectionHint={selectionHint}
                activeTab={activeTab}
                onActiveTabChange={setActiveTab}
                selectedNodeId={selectedNodeId}
                nodeName={nodeName}
                onNodeNameChange={setNodeName}
                nodeType={nodeType}
                nodeTypeOptions={nodeTypeOptions}
                onNodeTypeChange={onNodeTypeChange}
                applyNodeUpdates={applyNodeUpdates}
                setNodeAsFirst={setNodeAsFirst}
                setNodeAsFirstById={setNodeAsFirstById}
                deleteSelectedNode={deleteSelectedNode}
                nodeConfigText={nodeConfigText}
                onNodeConfigTextChange={setNodeConfigText}
                nodeConfigError={nodeConfigError}
                nodeConfigValidationErrors={nodeConfigValidationErrors}
                outgoingEdges={outgoingEdges}
                selectEdge={selectEdge}
                selectedRuleChainConnections={selectedRuleChainConnections}
                ruleChainNameById={ruleChainNameById}
                ruleChainOptions={ruleChainOptions}
                chainTargetId={chainTargetId}
                onChainTargetIdChange={setChainTargetId}
                selectedChainRelation={selectedChainRelation}
                chainRelation={chainRelation}
                onChainRelationChange={setChainRelation}
                onChainRelationSelect={handleChainRelationSelect}
                onEditRuleChainConnection={startRuleChainConnectionEdit}
                applyRuleChainConnection={applyRuleChainConnection}
                cancelRuleChainConnectionEdit={cancelRuleChainConnectionEdit}
                deleteRuleChainConnection={deleteRuleChainConnection}
                editingChainConnectionIndex={editingChainConnectionIndex}
                selectedEdgeId={selectedEdgeId}
                selectedRelation={selectedRelation}
                edgeLabel={edgeLabel}
                onEdgeLabelChange={setEdgeLabel}
                onEdgeRelationSelect={handleEdgeRelationSelect}
                applyEdgeLabel={applyEdgeLabel}
                deleteSelectedEdge={deleteSelectedEdge}
                relationOptions={RELATION_OPTIONS}
                isRuleChainsLoading={isRuleChainsLoading}
                debugPayload={debugPayload}
                testProtocol={testProtocol}
                testProtocolOptions={lockedTestProtocolOptions}
                onTestProtocolChange={handleTestProtocolChange}
                testMessages={testMessages}
                selectedTestMessageId={selectedTestMessageId}
                onTestMessageSelect={handleTestMessageSelect}
                onCreateTestMessage={handleCreateTestMessage}
                onGenerateTestMessages={handleGenerateTestMessages}
                onDeleteTestMessage={handleDeleteTestMessage}
                testMessageName={testMessageName}
                onTestMessageNameChange={handleTestMessageNameChange}
                testRequiredHeaders={requiredFields.headers}
                testRequiredBody={requiredFields.body}
                testHeadersText={testHeadersText}
                testHeadersError={testHeadersError}
                onTestHeadersChange={handleTestHeadersChange}
                testBodyText={testBodyText}
                testBodyError={testBodyError}
                onTestBodyChange={handleTestBodyChange}
                testMessageType={testMessageType}
                onTestMessageTypeChange={handleTestMessageTypeChange}
                onRunTest={handleRunTest}
                isRunningTest={isTestingRuleChain}
                dataTypeKeyOptions={dataTypeKeyOptions}
                testMessagesEditable={false}
                testMessagesManageHref={
                  modelId ? `/project/${ref}/device-models/${modelId}/messages` : undefined
                }
              />
            </ResizablePanel>
            {!consoleCollapsed && (
              <>
                <ResizableHandle withHandle />
                <RuleChainConsolePanel
                  consolePanelRef={consolePanelRef}
                  consoleTab={consoleTab}
                  consoleCollapsed={consoleCollapsed}
                  onConsoleTabChange={handleConsoleTabChange}
                  onCollapse={() => {
                    setConsoleCollapsed(true)
                    setConsoleTab('console')
                  }}
                  onExpand={() => setConsoleCollapsed(false)}
                  onRequestCollapse={() => {
                    setConsoleCollapsed(true)
                    setConsoleTab('console')
                    consolePanelRef.current?.collapse()
                  }}
                  metadataErrorText={metadataErrorText}
                  metadataVersion={metadataVersion}
                  onMetadataVersionChange={setMetadataVersion}
                  metadataText={metadataText}
                  onMetadataTextChange={onMetadataTextChange}
                  metadataTextError={metadataTextError}
                  isMetadataLoading={isMetadataLoading}
                  onSaveMetadata={onSaveMetadata}
                  isSavingMetadata={isSavingMetadata}
                  consoleLines={consoleLines}
                  errorLines={errorLines}
                  outputLines={outputLines}
                />
              </>
            )}
          </ResizablePanelGroup>
          {consoleCollapsed && (
            <RuleChainConsoleCollapsedHeader
              consoleTab={consoleTab}
              isCollapsed={consoleCollapsed}
              onSelectTab={handleConsoleTabChange}
            />
          )}
        </div>
      </PageContainer>

      <ConfirmationModal
        visible={deleteModalOpen}
        loading={isDeletingRuleChain}
        variant="destructive"
        confirmLabel="Delete rule chain"
        confirmLabelLoading="Deleting rule chain"
        title={`Confirm to delete ${ruleChain?.name ?? 'rule chain'}`}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteRuleChain}
        alert={{
          base: { variant: 'destructive' },
          title: 'This action cannot be undone',
          description: 'Make sure you have a backup if you might need it later.',
        }}
      />
    </>
  )
}

RuleChainDetailPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default RuleChainDetailPage
