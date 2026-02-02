import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import {
  type IotDeviceModelTestResult,
  useIotDeviceModelTestMutation,
} from 'data/iot/device-models'
import type { IotDeviceModel } from 'data/iot/types'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Button,
  Input_Shadcn_,
  Modal,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  Label_Shadcn_,
} from 'ui'

export type TestProtocol = 'http' | 'mqtt' | 'coap' | 'lwm2m' | 'snmp'

export type TestMessageEntry = {
  id: string
  name: string
  headersText: string
  bodyText: string
  messageType: string
}

export type TestMessageState = {
  messages: TestMessageEntry[]
  selectedId: string
}

export type TestMessagesByProtocol = Partial<Record<TestProtocol, TestMessageState>>

type TestMessageVariant = {
  name: string
  headers?: Record<string, string>
  body?: unknown
  messageType?: string
}

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
      body: {
        data: [
          { ts: 1716000000000, temperature: 21 },
          { ts: 1716000001000, temperature: 22 },
        ],
      },
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
        payload: [
          { ts: 1716000000000, temperature: 21 },
          { ts: 1716000001000, temperature: 22 },
        ],
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
      body: {
        data: [
          { ts: 1716000000000, temperature: 21 },
          { ts: 1716000001000, temperature: 22 },
        ],
      },
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
      name: 'Custom type (no message_type)',
      body: { custom: { level: 3 } },
      messageType: '',
    },
    {
      name: 'String body',
      body: 'raw=1;temp=21',
      messageType: 'RAW',
    },
  ],
  lwm2m: [
    {
      name: 'LwM2M update',
      body: { object_id: 3303, instance_id: 0, resources: { '5700': 22 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: multi-resource',
      body: { object_id: 3303, instance_id: 0, resources: { '5700': 22, '5701': 40 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: location',
      body: { object_id: 6, instance_id: 0, resources: { '0': 52.5, '1': 13.4 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: multi-instance',
      body: {
        object_id: 3303,
        instance_id: 1,
        resources: { '5700': 24 },
      },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: binary resource',
      body: {
        object_id: 19,
        instance_id: 0,
        resources: { '0': 'AQIDBA==' },
      },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: object array',
      body: {
        object_id: 3303,
        instance_id: 0,
        resources: [
          { id: '5700', value: 20 },
          { id: '5701', value: 33 },
        ],
      },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: nested payload',
      body: {
        payload: { object_id: 3303, instance_id: 0, resources: { '5700': 25 } },
      },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: array in resources',
      body: {
        object_id: 3303,
        instance_id: 0,
        resources: { '5700': [21, 22, 23] },
      },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M event',
      body: { object_id: 6, instance_id: 0, event: 'boot' },
      messageType: 'LWM2M_EVENT',
    },
    {
      name: 'LwM2M update: firmware',
      body: { object_id: 5, instance_id: 0, resources: { '3': '1.0.2' } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: battery',
      body: { object_id: 3, instance_id: 0, resources: { '9': 75 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: signal strength',
      body: { object_id: 4, instance_id: 0, resources: { '2': -85 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: serial number',
      body: { object_id: 3, instance_id: 0, resources: { '7': 'SN-1' } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: network',
      body: { object_id: 6, instance_id: 0, resources: { '2': 4 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: arrays',
      body: {
        object_id: 3303,
        instance_id: 0,
        resources: {
          '5700': [22, 23, 24],
          '5701': [50, 51, 52],
        },
      },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: object 3304',
      body: { object_id: 3304, instance_id: 0, resources: { '5700': 600 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'LwM2M update: custom object',
      body: { object_id: 2000, instance_id: 0, resources: { '1': 12 } },
      messageType: 'LWM2M_UPDATE',
    },
    {
      name: 'No message type',
      body: { object_id: 3303, instance_id: 0, resources: { '5700': 22 } },
      messageType: '',
    },
  ],
  snmp: [
    {
      name: 'SNMP trap',
      body: { oid: '1.3.6.1.2.1.1.3.0', value: 42 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: temperature',
      body: { oid: '1.3.6.1.2.1.1.3.1', value: 25 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: humidity',
      body: { oid: '1.3.6.1.2.1.1.3.2', value: 48 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: pressure',
      body: { oid: '1.3.6.1.2.1.1.3.3', value: 1002 },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: string',
      body: { oid: '1.3.6.1.2.1.1.3.4', value: 'OK' },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: array',
      body: { oid: '1.3.6.1.2.1.1.3.5', value: [1, 2, 3] },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: nested',
      body: { oid: '1.3.6.1.2.1.1.3.6', value: { temp: 21, humidity: 41 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: timestamped',
      body: { oid: '1.3.6.1.2.1.1.3.7', value: { ts: 1716000000000, value: 42 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: custom',
      body: { oid: '1.3.6.1.2.1.1.3.8', value: { level: 2 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: gateway',
      body: { oid: '1.3.6.1.2.1.1.3.9', value: { device: 'gw-1', status: 'ok' } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: location',
      body: { oid: '1.3.6.1.2.1.1.3.10', value: { lat: 52.5, lon: 13.4 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: firmware',
      body: { oid: '1.3.6.1.2.1.1.3.11', value: { firmware: '1.2.0' } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: event',
      body: { oid: '1.3.6.1.2.1.1.3.12', value: { event: 'boot' } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: battery',
      body: { oid: '1.3.6.1.2.1.1.3.13', value: { battery: 80 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: signal',
      body: { oid: '1.3.6.1.2.1.1.3.14', value: { rssi: -70 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: uptime',
      body: { oid: '1.3.6.1.2.1.1.3.15', value: { uptime: 3600 } },
      messageType: 'SNMP_TRAP',
    },
    {
      name: 'SNMP trap: array payload',
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

const formatTestTemplate = (protocol: TestProtocol) => {
  const template = TEST_TEMPLATES[protocol]

  return {
    headersText: JSON.stringify(template.headers ?? {}, null, 2),
    bodyText: JSON.stringify(template.body ?? {}, null, 2),
    messageType: template.messageType ?? '',
  }
}

const createTestMessageId = () => `msg_${Math.random().toString(36).slice(2, 10)}`

const buildEmptyTestState = (): TestMessageState => ({ messages: [], selectedId: '' })

type DeviceModelStepMessagesProps = {
  model: IotDeviceModel | null
  testMessagesByProtocol: TestMessagesByProtocol | null
  onTestMessagesChange: (protocol: TestProtocol, nextState: TestMessageState) => void
  ingestChainId?: number | null
}

const normalizeTestMessageState = (
  protocol: TestProtocol,
  input?: TestMessageState | null
): TestMessageState => {
  const fallback = buildEmptyTestState()
  if (!input || typeof input !== 'object') return fallback
  if (!Array.isArray(input.messages) || input.messages.length === 0) return fallback

  const template = formatTestTemplate(protocol)
  const messages = input.messages.map((entry, index) => ({
    id:
      typeof entry.id === 'string' && entry.id.trim()
        ? entry.id
        : createTestMessageId(),
    name:
      typeof entry.name === 'string' && entry.name.trim()
        ? entry.name
        : `Message ${index + 1}`,
    headersText:
      typeof entry.headersText === 'string' ? entry.headersText : template.headersText,
    bodyText: typeof entry.bodyText === 'string' ? entry.bodyText : template.bodyText,
    messageType:
      typeof entry.messageType === 'string' ? entry.messageType : template.messageType,
  }))

  const selectedId =
    typeof input.selectedId === 'string' &&
    messages.some((message) => message.id === input.selectedId)
      ? input.selectedId
      : messages[0]?.id ?? ''

  return { messages, selectedId }
}

export const DeviceModelStepMessages = ({
  model,
  testMessagesByProtocol,
  onTestMessagesChange,
  ingestChainId,
}: DeviceModelStepMessagesProps) => {
  const modelId = model?.id
  const protocol = useMemo(
    () => normalizeTestProtocol(model?.transport_type),
    [model?.transport_type]
  )

  const currentState = useMemo(() => {
    const storedState = testMessagesByProtocol?.[protocol]
    return storedState
      ? normalizeTestMessageState(protocol, storedState)
      : buildEmptyTestState()
  }, [protocol, testMessagesByProtocol])

  const messages = currentState.messages
  const selectedId = currentState.selectedId

  const selectedMessage = useMemo(
    () => messages.find((entry) => entry.id === selectedId) ?? null,
    [messages, selectedId]
  )

  const { mutateAsync: testDeviceModel, isPending: isTesting } =
    useIotDeviceModelTestMutation()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false)
  const [createTemplateId, setCreateTemplateId] = useState('blank')
  const [createDraft, setCreateDraft] = useState<TestMessageEntry>(() => {
    const template = formatTestTemplate(protocol)
    return {
      id: createTestMessageId(),
      name: '',
      headersText: template.headersText,
      bodyText: template.bodyText,
      messageType: template.messageType ?? '',
    }
  })
  const [createErrors, setCreateErrors] = useState<{ headers?: string; body?: string }>({})
  const [testResults, setTestResults] = useState<IotDeviceModelTestResult | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const templateOptions = useMemo(() => {
    const variants = TEST_MESSAGE_VARIANTS[protocol] ?? []
    const items = variants.map((variant, index) => ({
      id: `variant-${index}`,
      label: variant.name || `Template ${index + 1}`,
      variant,
    }))
    return [
      {
        id: 'blank',
        label: 'Blank template',
        variant: null,
      },
      ...items,
    ]
  }, [protocol])

  const buildDraftFromTemplate = useCallback(
    (template?: TestMessageVariant | null) => {
      const base = formatTestTemplate(protocol)
      return {
        id: createTestMessageId(),
        name: template?.name ?? '',
        headersText:
          template?.headers !== undefined
            ? JSON.stringify(template.headers ?? {}, null, 2)
            : base.headersText,
        bodyText:
          template?.body !== undefined
            ? JSON.stringify(template.body ?? {}, null, 2)
            : base.bodyText,
        messageType:
          template?.messageType ?? (base.messageType ?? ''),
      }
    },
    [protocol]
  )

  useEffect(() => {
    if (!isCreateModalOpen) return
    setCreateTemplateId('blank')
    setCreateDraft(buildDraftFromTemplate(null))
    setCreateErrors({})
  }, [isCreateModalOpen, buildDraftFromTemplate])

  const handleTemplateSelect = (templateId: string) => {
    setCreateTemplateId(templateId)
    setCreateErrors({})
    if (templateId === 'blank') {
      setCreateDraft(buildDraftFromTemplate(null))
      return
    }
    const template =
      templateOptions.find((option) => option.id === templateId)?.variant ?? null
    setCreateDraft(buildDraftFromTemplate(template))
  }

  const openEditPanel = (messageId: string) => {
    onTestMessagesChange(protocol, { messages, selectedId: messageId })
    setIsEditPanelOpen(true)
  }

  const updateSelectedMessage = (patch: Partial<TestMessageEntry>) => {
    if (!selectedId) return
    onTestMessagesChange(protocol, {
      messages: messages.map((message) =>
        message.id === selectedId
          ? {
              ...message,
              ...patch,
            }
          : message
      ),
      selectedId,
    })
  }

  const handleDeleteMessage = (messageId: string) => {
    const nextMessages = messages.filter((message) => message.id !== messageId)
    onTestMessagesChange(protocol, {
      messages: nextMessages,
      selectedId:
        messageId === selectedId ? (nextMessages[0]?.id ?? '') : selectedId,
    })
  }

  const handleCreateMessage = () => {
    const nextErrors: { headers?: string; body?: string } = {}
    if (createDraft.headersText.trim()) {
      try {
        const parsed = JSON.parse(createDraft.headersText)
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
          nextErrors.headers = 'Headers must be a JSON object.'
        }
      } catch {
        nextErrors.headers = 'Invalid JSON headers.'
      }
    }

    if (createDraft.bodyText.trim()) {
      try {
        JSON.parse(createDraft.bodyText)
      } catch {
        nextErrors.body = 'Invalid JSON body.'
      }
    }

    if (nextErrors.headers || nextErrors.body) {
      setCreateErrors(nextErrors)
      return
    }

    const resolvedName =
      createDraft.name.trim() || `Message ${messages.length + 1}`
    const nextMessage: TestMessageEntry = {
      ...createDraft,
      id: createTestMessageId(),
      name: resolvedName,
    }
    onTestMessagesChange(protocol, {
      messages: [...messages, nextMessage],
      selectedId: nextMessage.id,
    })
    setIsCreateModalOpen(false)
  }

  const runTest = useCallback(
    async () => {
      if (!modelId) {
        setTestError('Device model not found.')
        return
      }

      if (!ingestChainId) {
        setTestError('Ingest rule is not configured for this model.')
        return
      }

      setTestError(null)
      setTestResults(null)

      const payload = {
        messages: messages.map((message) => ({
          name: message.name?.trim() || '',
          headers: message.headersText.trim() ? message.headersText : null,
          body: message.bodyText.trim() ? message.bodyText : null,
          message_type: message.messageType?.trim() || '',
        })),
      }

      try {
        const result = await testDeviceModel({ modelId, payload })
        setTestResults(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to run test.'
        setTestError(errorMessage)
        toast.error(errorMessage)
      }
    },
    [ingestChainId, messages, modelId, testDeviceModel]
  )

  useEffect(() => {
    if (!isTestPanelOpen) return
    setTestResults(null)
    setTestError(null)
  }, [isTestPanelOpen])

  useEffect(() => {
    if (!isTestPanelOpen) return
    if (messages.length === 0) return
    void runTest()
  }, [isTestPanelOpen, messages.length, runTest])

  if (!model) {
    return <p className="text-sm text-foreground-light">Device model not found.</p>
  }

  const summarizeJson = (value: string) => {
    if (!value.trim()) return '—'
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return `${parsed.length} items`
      if (parsed && typeof parsed === 'object') {
        return `${Object.keys(parsed).length} keys`
      }
      return typeof parsed
    } catch {
      return 'Invalid JSON'
    }
  }

  type TestStep = {
    title: string
    status: 'ok' | 'error'
    details?: unknown
    error?: string | null
  }

  const formatJson = (value: unknown) => {
    if (value === undefined) return ''
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
  const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const pushPreparedSteps = (
    prepared: unknown,
    prefix: string,
    steps: TestStep[]
  ) => {
    const preparedRecord = asRecord(prepared)
    const outbound = asArray(preparedRecord.outbound_requests)
    const logs = asArray(preparedRecord.logs)
    const alerts = asArray(preparedRecord.alerts)
    const clearAlerts = asArray(preparedRecord.clear_alerts)
    const attributes = asArray(preparedRecord.attributes)
    const responses = asArray(preparedRecord.responses)
    const telemetryRows = asArray(preparedRecord.telemetry_rows)

    outbound.forEach((entry, index) => {
      const entryRecord = asRecord(entry)
      const typeValue = entryRecord.type
      const typeLabel = typeof typeValue === 'string' ? typeValue : 'outbound'
      const payload = entryRecord.payload ?? entryRecord
      const payloadRecord = asRecord(payload)
      const hasError = Boolean(entryRecord.error) || Boolean(payloadRecord.error)
      const labelBase =
        typeLabel === 'kafka'
          ? 'Kafka publish'
          : typeLabel === 'ingest_output'
            ? 'Ingest output'
            : `Outbound (${typeLabel})`
      steps.push({
        title: `${prefix}: ${labelBase}${outbound.length > 1 ? ` #${index + 1}` : ''}`,
        status: hasError ? 'error' : 'ok',
        details: payload,
        error: hasError ? `${prefix} outbound error` : null,
      })
    })

    if (logs.length > 0) {
      steps.push({
        title: `${prefix}: Log entries (${logs.length})`,
        status: 'ok',
        details: logs,
      })
    }

    if (alerts.length > 0) {
      steps.push({
        title: `${prefix}: Alerts (${alerts.length})`,
        status: 'ok',
        details: alerts,
      })
    }

    if (clearAlerts.length > 0) {
      steps.push({
        title: `${prefix}: Alerts cleared (${clearAlerts.length})`,
        status: 'ok',
        details: clearAlerts,
      })
    }

    if (attributes.length > 0) {
      steps.push({
        title: `${prefix}: Attributes saved (${attributes.length})`,
        status: 'ok',
        details: attributes,
      })
    }

    if (responses.length > 0) {
      steps.push({
        title: `${prefix}: Device responses (${responses.length})`,
        status: 'ok',
        details: responses,
      })
    }

    if (telemetryRows.length > 0) {
      const telemetryLabel = prefix === 'Core' ? 'DB write' : 'Telemetry stored'
      steps.push({
        title: `${prefix}: ${telemetryLabel} (${telemetryRows.length})`,
        status: 'ok',
        details: telemetryRows,
      })
    }
  }

  const buildMessageSteps = (
    entry: IotDeviceModelTestResult['results'][number]
  ): TestStep[] => {
    const steps: TestStep[] = []
    const adapterError = entry.adapter?.error
    const incomingMessage = entry.incoming ?? entry.message

    if (incomingMessage) {
      steps.push({
        title: 'Incoming message',
        status: 'ok',
        details: incomingMessage,
      })
    }

    steps.push({
      title: 'Adapter received',
      status: adapterError ? 'error' : 'ok',
      details: adapterError
        ? { error: adapterError }
        : { envelopes: entry.adapter?.envelopes ?? [] },
      error: adapterError ? 'Adapter error' : null,
    })

    const ingestEntries = asArray(entry.ingest)
    ingestEntries.forEach((ingestEntry, ingestIndex) => {
      const ingestRecord = asRecord(ingestEntry)
      const ingestErrors = asArray(ingestRecord.errors)

      steps.push({
        title: `Ingest rule #${ingestIndex + 1}`,
        status: ingestErrors.length > 0 ? 'error' : 'ok',
        details: {
          steps: ingestRecord.steps,
          effects: ingestRecord.effects,
          errors: ingestRecord.errors,
          prepared: ingestRecord.prepared,
        },
        error: ingestErrors.length > 0 ? 'Ingest errors' : null,
      })

      steps.push({
        title: `Ingest outgoing #${ingestIndex + 1}`,
        status: ingestErrors.length > 0 ? 'error' : 'ok',
        details: asArray(ingestRecord.outgoing_messages),
        error: ingestErrors.length > 0 ? 'Ingest errors' : null,
      })

      pushPreparedSteps(ingestRecord.prepared, 'Ingest', steps)

      const coreEntries = asArray(ingestRecord.core)
      coreEntries.forEach((coreEntry, coreIndex) => {
        const coreRecord = asRecord(coreEntry)
        const kafkaRecord = asRecord(coreRecord.kafka)
        const kafkaPayload = asRecord(kafkaRecord.payload)
        const kafkaError = kafkaRecord.error ?? kafkaPayload.error
        const coreErrors = asArray(coreRecord.errors)

        steps.push({
          title: `Sent to Kafka #${coreIndex + 1}`,
          status: kafkaError ? 'error' : 'ok',
          details: coreRecord.kafka,
          error: kafkaError ? 'Kafka publish error' : null,
        })

        steps.push({
          title: `Kafka received #${coreIndex + 1}`,
          status: kafkaError ? 'error' : 'ok',
          details: coreRecord.env,
          error: kafkaError ? 'Kafka publish error' : null,
        })

        steps.push({
          title: `Core rule #${coreIndex + 1}`,
          status: coreErrors.length > 0 ? 'error' : 'ok',
          details: {
            steps: coreRecord.steps,
            effects: coreRecord.effects,
            errors: coreRecord.errors,
            prepared: coreRecord.prepared,
          },
          error: coreErrors.length > 0 ? 'Core rule errors' : null,
        })

        steps.push({
          title: `Core outgoing #${coreIndex + 1}`,
          status: coreErrors.length > 0 ? 'error' : 'ok',
          details: asArray(coreRecord.outgoing_messages),
          error: coreErrors.length > 0 ? 'Core rule errors' : null,
        })

        pushPreparedSteps(coreRecord.prepared, 'Core', steps)
      })
    })

    return steps
  }

  const renderMessageForm = (
    message: TestMessageEntry,
    onChange: (patch: Partial<TestMessageEntry>) => void,
    errors?: { headers?: string | null; body?: string | null }
  ) => (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label_Shadcn_>Message name</Label_Shadcn_>
        <Input_Shadcn_
          id="device-model-message-name"
          value={message.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Message name"
          className="flex-1"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label_Shadcn_>Message type</Label_Shadcn_>
        <Input_Shadcn_
          id="device-model-message-type"
          value={message.messageType}
          onChange={(event) => onChange({ messageType: event.target.value })}
          placeholder="message_type"
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs text-foreground-light">Headers (JSON)</p>
        <div className="h-28 overflow-hidden rounded border border-muted bg-surface-200">
          <CodeEditor
            id="device-model-message-headers"
            language="json"
            value={message.headersText}
            onInputChange={(value) => onChange({ headersText: value ?? '' })}
            options={{ wordWrap: 'on' }}
            hideLineNumbers
          />
        </div>
        {errors?.headers ? (
          <p className="text-xs text-destructive-600">{errors.headers}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <p className="text-xs text-foreground-light">Body (JSON)</p>
        <div className="h-40 overflow-hidden rounded border border-muted bg-surface-200">
          <CodeEditor
            id="device-model-message-body"
            language="json"
            value={message.bodyText}
            onInputChange={(value) => onChange({ bodyText: value ?? '' })}
            options={{ wordWrap: 'on' }}
            hideLineNumbers
          />
        </div>
        {errors?.body ? (
          <p className="text-xs text-destructive-600">{errors.body}</p>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Messages</p>
          <p className="text-xs text-foreground-light">
            Manage example payloads for rule chain testing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="tiny"
            type="default"
            disabled={messages.length === 0 || !ingestChainId}
            onClick={() => setIsTestPanelOpen(true)}
          >
            Run test
          </Button>
          <Button
            size="tiny"
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New message
          </Button>
        </div>
      </div>
      {messages.length === 0 ? (
        <div className="rounded border border-dashed border-muted p-4 text-sm text-foreground-light">
          No messages yet. Create a new message to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Message type</TableHead>
              <TableHead>Headers</TableHead>
              <TableHead>Body</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((message, index) => {
              const label = message.name?.trim() ? message.name : `Message ${index + 1}`
              return (
                <TableRow
                  key={message.id}
                  className="cursor-pointer"
                  onClick={() => openEditPanel(message.id)}
                >
                  <TableCell className="py-1.5 text-sm">{label}</TableCell>
                  <TableCell className="py-1.5 text-xs text-foreground-light">
                    {message.messageType?.trim() || '—'}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-foreground-light">
                    {summarizeJson(message.headersText)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-foreground-light">
                    {summarizeJson(message.bodyText)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <Modal
        visible={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        hideFooter
        size="xlarge"
        header="Create message"
      >
        <Modal.Content className="p-0">
          <div className="grid grid-cols-[220px_minmax(0,1fr)]">
            <div className="border-r border-muted py-4 pr-4 pl-0">
              <p className="text-xs font-medium text-foreground">Templates</p>
              <div className="mt-3 space-y-1">
                {templateOptions.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded border px-2 py-1 text-left text-xs transition',
                      template.id === createTemplateId
                        ? 'border-foreground-muted bg-surface-200 text-foreground'
                        : 'border-muted bg-surface-100 text-foreground-light hover:border-foreground-muted hover:text-foreground'
                    )}
                  >
                    <span className="truncate">{template.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              {renderMessageForm(createDraft, (patch) => {
                setCreateDraft((current) => ({ ...current, ...patch }))
                setCreateErrors({})
              }, createErrors)}
            </div>
          </div>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex items-center justify-end gap-2">
          <Button type="default" onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleCreateMessage}>
            Create message
          </Button>
        </Modal.Content>
      </Modal>

      <SidePanel
        visible={isEditPanelOpen}
        onCancel={() => setIsEditPanelOpen(false)}
        size="large"
        header="Edit message"
        customFooter={
          selectedMessage ? (
            <div className="flex items-center gap-2 border-t bg-overlay p-4">
              <Button
                type="danger"
                className="mr-auto"
                onClick={() => {
                  handleDeleteMessage(selectedMessage.id)
                  setIsEditPanelOpen(false)
                }}
              >
                Delete message
              </Button>
              <Button type="default" onClick={() => setIsEditPanelOpen(false)}>
                Cancel
              </Button>
            </div>
          ) : undefined
        }
      >
        <SidePanel.Content className="space-y-4 py-6">
          {selectedMessage ? (
            renderMessageForm(selectedMessage, updateSelectedMessage)
          ) : (
            <p className="text-sm text-foreground-light">Select a message to edit.</p>
          )}
        </SidePanel.Content>
      </SidePanel>

      <SidePanel
        visible={isTestPanelOpen}
        onCancel={() => setIsTestPanelOpen(false)}
        size="large"
        header="Run test"
      >
        <SidePanel.Content className="space-y-4 py-6">
          {messages.length === 0 ? (
            <p className="text-sm text-foreground-light">Create a message to run a test.</p>
          ) : (
            <>
              {testError ? (
                <p className="text-xs text-destructive-600">{testError}</p>
              ) : null}
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground-light">
                  Results for {messages.length} message{messages.length === 1 ? '' : 's'}
                </p>
                <Button
                  size="tiny"
                  type="default"
                  onClick={() => runTest()}
                  disabled={!ingestChainId || !modelId || isTesting}
                >
                  {isTesting ? 'Running…' : 'Run again'}
                </Button>
              </div>
              {testResults ? (
                <Accordion_Shadcn_ type="multiple" className="rounded border border-muted">
                  {testResults.results.map((result) => {
                    const messageName =
                      typeof result.message?.name === 'string' && result.message.name.trim()
                        ? result.message.name.trim()
                        : `Message ${result.index + 1}`
                    const messageHasError =
                      Boolean(result.adapter?.error) ||
                      (Array.isArray(result.errors) && result.errors.length > 0) ||
                      (Array.isArray(result.ingest) &&
                        result.ingest.some((ingestEntry) => {
                          const ingestErrors =
                            Array.isArray(ingestEntry.errors) && ingestEntry.errors.length > 0
                          const coreErrors = Array.isArray(ingestEntry.core)
                            ? ingestEntry.core.some(
                                (coreEntry) =>
                                  Array.isArray(coreEntry.errors) && coreEntry.errors.length > 0
                              )
                            : false
                          return ingestErrors || coreErrors
                        }))

                    const steps = buildMessageSteps(result)

                    return (
                      <AccordionItem_Shadcn_
                        key={`message-${result.index}`}
                        value={`message-${result.index}`}
                      >
                        <AccordionTrigger_Shadcn_ className="px-3 py-2 text-sm">
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="truncate">{messageName}</span>
                            <span
                              className={cn(
                                'rounded px-2 py-0.5 text-[10px] font-medium uppercase',
                                messageHasError
                                  ? 'bg-destructive-200 text-destructive-600'
                                  : 'bg-emerald-200 text-emerald-700'
                              )}
                            >
                              {messageHasError ? 'Error' : 'OK'}
                            </span>
                          </div>
                        </AccordionTrigger_Shadcn_>
                        <AccordionContent_Shadcn_ className="space-y-3 px-3 pb-4 pt-2">
                          {steps.map((step, stepIndex) => (
                            <div
                              key={`step-${result.index}-${stepIndex}`}
                              className="space-y-2 rounded border border-muted bg-surface-100 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium text-foreground">
                                  {step.title}
                                </p>
                                <span
                                  className={cn(
                                    'rounded px-2 py-0.5 text-[10px] font-medium uppercase',
                                    step.status === 'error'
                                      ? 'bg-destructive-200 text-destructive-600'
                                      : 'bg-surface-200 text-foreground-light'
                                  )}
                                >
                                  {step.status === 'error' ? 'Error' : 'OK'}
                                </span>
                              </div>
                              {step.error ? (
                                <p className="text-xs text-destructive-600">{step.error}</p>
                              ) : null}
                              {step.details !== undefined ? (
                                <div className="h-32 overflow-hidden rounded border border-muted bg-surface-200">
                                  <CodeEditor
                                    id={`device-model-message-test-step-${result.index}-${stepIndex}`}
                                    language="json"
                                    value={formatJson(step.details)}
                                    onInputChange={() => undefined}
                                    options={{ wordWrap: 'on', readOnly: true }}
                                    hideLineNumbers
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </AccordionContent_Shadcn_>
                      </AccordionItem_Shadcn_>
                    )
                  })}
                </Accordion_Shadcn_>
              ) : (
                <p className="text-xs text-foreground-light">
                  Run the test to see the full chain output.
                </p>
              )}
            </>
          )}
        </SidePanel.Content>
      </SidePanel>
    </div>
  )
}
