import Link from 'next/link'
import { RefObject, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  Bug,
  ChevronDown,
  Database,
  Filter,
  GitBranch,
  Info,
  Link2,
  MoreHorizontal,
  Play,
  Plus,
  Radio,
  Shuffle,
  Sigma,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import ReactFlow, {
  Background,
  Connection,
  ConnectionLineType,
  Controls,
  Edge,
  MiniMap,
  Node,
} from 'reactflow'

import {
  Button,
  Badge,
  cn,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input_Shadcn_,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  InfoIcon,
  type ImperativePanelHandle,
} from 'ui'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { validateIotJq } from 'data/iot/jq'
import { useDebouncedValue } from 'hooks/misc/useDebouncedValue'
import CheckMessageNodeSettings from './node-settings/CheckMessageNodeSettings'
import DefaultNodeSettings from './node-settings/DefaultNodeSettings'
import MsgTypeFilterNodeSettings from './node-settings/MsgTypeFilterNodeSettings'
import MsgTypeSwitchNodeSettings from './node-settings/MsgTypeSwitchNodeSettings'
import ScriptFilterNodeSettings from './node-settings/ScriptFilterNodeSettings'
import TelemetryMsgAttributesNodeSettings from './node-settings/TelemetryMsgAttributesNodeSettings'
import TimeseriesNodeSettings from './node-settings/TimeseriesNodeSettings'
import TransformMsgNodeSettings from './node-settings/TransformMsgNodeSettings'
import { DEFAULT_NODE_SETTINGS_COMPONENTS } from './node-settings/NodeSettingsRegistry'

type NodeTemplate = {
  label: string
  value: string
  section: string
  meta: Record<string, any>
}

type RuleChainNodeData = {
  label: string
  type?: string
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

type SelectionTab = 'details' | 'debug'

type SelectOption = { label: string; value: string }
type PathSuggestion = { label: string; value: string }
type NodeDoc = { title: string; description: string; usage: string[] }
type JqValidationState = { status: 'idle' | 'validating' | 'valid' | 'error'; error: string | null }

const TIMESERIES_VALUE_TYPES: SelectOption[] = [
  { label: 'Number', value: 'number' },
  { label: 'String', value: 'string' },
  { label: 'Boolean', value: 'bool' },
  { label: 'JSON', value: 'json' },
]

const ATTRIBUTE_KEYS: SelectOption[] = [
  { label: 'uptime', value: 'uptime' },
  { label: 'rssi', value: 'rssi' },
  { label: 'snr', value: 'snr' },
  { label: 'battery_level', value: 'battery_level' },
  { label: 'battery_voltage', value: 'battery_voltage' },
  { label: 'signal_quality', value: 'signal_quality' },
  { label: 'fw_version', value: 'fw_version' },
  { label: 'hw_version', value: 'hw_version' },
  { label: 'model', value: 'model' },
  { label: 'serial', value: 'serial' },
  { label: 'imei', value: 'imei' },
  { label: 'imsi', value: 'imsi' },
  { label: 'iccid', value: 'iccid' },
  { label: 'ip_address', value: 'ip_address' },
  { label: 'mac_address', value: 'mac_address' },
  { label: 'location', value: 'location' },
  { label: 'timezone', value: 'timezone' },
  { label: 'last_reboot_reason', value: 'last_reboot_reason' },
  { label: 'free_memory', value: 'free_memory' },
  { label: 'free_storage', value: 'free_storage' },
  { label: 'error_code', value: 'error_code' },
  { label: 'status', value: 'status' },
  { label: 'config_version', value: 'config_version' },
]

const RELATION_DESCRIPTIONS: Record<string, string> = {
  Success: 'Routes the message when the node completes successfully.',
  Failure: 'Routes the message when the node fails or throws an error.',
  True: 'Routes when a filter expression returns true.',
  False: 'Routes when a filter expression returns false.',
  Missing: 'Routes when message_type is missing.',
  'Post telemetry': 'Routes after timeseries are written to storage.',
  'Post attributes': 'Routes after attributes are written to storage.',
  'RPC Request from Device': 'Routes incoming device RPC requests.',
  'RPC Request to Device': 'Routes outgoing RPC requests to a device.',
  Other: 'Fallback route for unmatched relations.',
  Forward: 'Forwards the message to the next rule chain.',
}

const NODE_TYPE_DOCS: Record<string, NodeDoc> = {
  'Telemetry.MsgTimeseriesNode': {
    title: 'Save Timeseries',
    description: 'Builds telemetry points from the current message and forwards them to storage.',
    usage: [
      'Set device id path and timestamp behavior.',
      'Add value paths + types for each telemetry field.',
      'Use after SplitArrayToMsg to emit one point per element.',
    ],
  },
  'Telemetry.MsgAttributesNode': {
    title: 'Save Client Attributes',
    description: 'Writes device attributes (client scope) to Postgres.',
    usage: [
      'Map well-known attributes to message paths, or leave empty to auto-detect.',
      'Use to store static metadata about devices.',
    ],
  },
  'Filter.MsgTypeSwitchNode': {
    title: 'Message Type Switch',
    description:
      'Маршрутизирует сообщение по значению message_type. Сначала ищет совпадение в таблице type → relation и отправляет по соответствующему ребру.',
    usage: [
      'Добавь строки type → relation: type — это значение message_type.',
      'Other — все типы, которых нет в списке. Missing — message_type пустой или отсутствует.',
      'Названия relation должны совпадать с подписями ребер.',
    ],
  },
  'Action.LogNode': {
    title: 'Log',
    description: 'Emits formatted log output from msg/metadata.',
    usage: ['Optional label is added to log output.'],
  },
  'Rpc.SendRPCRequestNode': {
    title: 'RPC Call Request',
    description: 'Prepares a server-side RPC request for a device.',
    usage: ['Set timeout and RPC payload fields in config.'],
  },
  'Rpc.SendRPCReplyNode': {
    title: 'RPC Reply',
    description: 'Builds a synchronous response payload for the device.',
    usage: [
      'Set status, headers, and body template in config.',
      'Use in ingest rule chains to reply before Kafka.',
    ],
  },
  'Transform.TransformMsgNode': {
    title: 'Transform Message',
    description: 'Transforms msg/metadata with jq and returns a new payload.',
    usage: ['Return a JSON object from jq; it becomes the new payload.'],
  },
  'Filter.JsFilterNode': {
    title: 'Script Filter',
    description: 'Evaluates a jq expression to route Success/Failure.',
    usage: ['Return true/false from jq filter output.'],
  },
  'Filter.MsgTypeFilterNode': {
    title: 'Message Type Filter',
    description: 'Пропускает дальше только выбранные типы сообщений.',
    usage: [
      'Добавьте типы сообщений, которые будут пропущены далее.',
      'Если message_type отсутствует — пойдет в ветку Missing.',
    ],
  },
  'Delay.MsgDelayNode': {
    title: 'Delay',
    description: 'Pauses the message for a period of time.',
    usage: ['Set periodInSeconds and maxPendingMsgs.'],
  },
  'Flow.CheckpointNode': {
    title: 'Checkpoint',
    description: 'Pass-through marker for readability and metrics.',
    usage: ['Use as a logical stage boundary in large chains.'],
  },
  'Flow.RuleChainInputNode': {
    title: 'Rule Chain',
    description: 'Forwards the current message to another rule chain.',
    usage: ['Set ruleChainId to the target chain.'],
  },
  'Flow.RuleChainOutputNode': {
    title: 'Rule Chain Output',
    description: 'Explicit output node for a chain (pass-through).',
    usage: ['Use as a clear end-of-branch marker.'],
  },
  'Ingest.IngestOutputNode': {
    title: 'Ingest Output',
    description: 'Publishes the message into the ingest queue.',
    usage: ['Use in ingest chains to forward messages into core processing.'],
  },
  'Flow.AckNode': {
    title: 'Ack',
    description: 'Marks successful completion of a branch (pass-through).',
    usage: ['Use for visual confirmation or metrics.'],
  },
  'Rest.RestApiCallNode': {
    title: 'REST API Call',
    description: 'Calls an HTTP endpoint with the current message.',
    usage: ['Set endpoint URL pattern and method in config.'],
  },
  'Mail.MsgToEmailNode': {
    title: 'To Email',
    description: 'Builds email payload from templates.',
    usage: ['Use ${meta} and $[payload] placeholders.'],
  },
  'Mail.SendEmailNode': {
    title: 'Send Email',
    description: 'Sends the email payload to a webhook.',
    usage: ['Configure endpointUrl or EMAIL_WEBHOOK_URL.'],
  },
  'Sms.SendSmsNode': {
    title: 'Send SMS',
    description: 'Sends SMS payload to a webhook.',
    usage: ['Configure endpointUrl or SMS_WEBHOOK_URL.'],
  },
  'Telegram.SendTelegramNode': {
    title: 'Send Telegram',
    description: 'Sends a Telegram message via Bot API.',
    usage: ['Set bot token and chatId template.'],
  },
  'Filter.AssetTypeSwitchNode': {
    title: 'Asset Type Switch',
    description: 'Routes by asset type from payload/metadata.',
    usage: ['Create connections with asset type labels.'],
  },
  'Filter.CheckMessageNode': {
    title: 'Check Message',
    description:
      'Проверяет наличие ключей в payload и заголовках и направляет сообщение по веткам True/False.',
    usage: [
      'Payload keys — ключи из payload (можно dot‑path, например data.ts, data.items[0].ts, data.items[].ts).',
      'Header keys — ключи заголовков; проверяются как metadata.headers.<key>.',
      'Require all keys: включено — нужны все ключи, выключено — достаточно одного.',
      'Связи: True (прошло), False (не прошло), Failure (ошибка).',
    ],
  },
  'Filter.CheckAlarmStatusNode': {
    title: 'Check Alarm Status',
    description: 'Checks alert/alarm status by id in payload/metadata.',
    usage: ['Requires alert_id/alarm_id in message.'],
  },
  'Filter.DeviceTypeSwitchNode': {
    title: 'Device Type Switch',
    description: 'Routes by device model name.',
    usage: ['Create connections with model name labels.'],
  },
  'Action.CreateAlarmNode': {
    title: 'Create Alarm',
    description: 'Creates an alert record in device_alerts.',
    usage: ['Provide alarm type and severity in config.'],
  },
  'Action.ClearAlarmNode': {
    title: 'Clear Alarm',
    description: 'Clears an active alert for device + type.',
    usage: ['Use with the same alarm type as creation.'],
  },
  'Action.MsgCountNode': {
    title: 'Message Count',
    description: 'Counts messages in a time window and emits a metric.',
    usage: ['Set interval and output key in config.'],
  },
  'Action.DeviceStateNode': {
    title: 'Device State',
    description: 'Updates device state attributes and last_online_at.',
    usage: ['Use for online/offline tracking.'],
  },
  'Kafka.KafkaNode': {
    title: 'Kafka',
    description: 'Publishes the message to a Kafka topic.',
    usage: ['Configure topicPattern or bootstrapServers.'],
  },
  'Action.CreateRelationNode': {
    title: 'Create Relation',
    description: 'Creates a relation between entities.',
    usage: ['Set relation type, direction, and target.'],
  },
  'Action.DeleteRelationNode': {
    title: 'Delete Relation',
    description: 'Deletes an existing relation.',
    usage: ['Provide relation type and target entity.'],
  },
  'Filter.CheckRelationNode': {
    title: 'Check Relation',
    description: 'Checks if a relation exists and routes accordingly.',
    usage: ['Configure relation type and direction.'],
  },
  'Math.MathNode': {
    title: 'Math',
    description: 'Evaluates math expressions or aggregations.',
    usage: ['Select operation and input keys.'],
  },
  'Metadata.CalculateDeltaNode': {
    title: 'Calculate Delta',
    description: 'Computes delta between current and previous value.',
    usage: ['Configure input key and delta strategy.'],
  },
  'Metadata.GetAttributesNode': {
    title: 'Get Attributes',
    description: 'Loads device attributes and latest telemetry.',
    usage: ['Use to enrich msg metadata before filters.'],
  },
  'Metadata.GetDeviceAttrNode': {
    title: 'Get Device Attributes',
    description: 'Loads attributes from a related device.',
    usage: ['Requires relation or device id in config.'],
  },
  'Metadata.GetRelatedAttributeNode': {
    title: 'Get Related Attributes',
    description: 'Loads attributes/telemetry from a related entity.',
    usage: ['Configure relation and key list.'],
  },
  'Metadata.GetTelemetryNode': {
    title: 'Get Telemetry',
    description: 'Loads telemetry from ClickHouse.',
    usage: ['Configure key list and fetch mode.'],
  },
  'Metadata.FetchDeviceCredentialsNode': {
    title: 'Fetch Device Credentials',
    description: 'Loads device credentials into metadata.',
    usage: ['Use for protocol validation or routing.'],
  },
  'Profile.DeviceProfileNode': {
    title: 'Device Profile',
    description: 'Loads device record and device model into metadata.',
    usage: [
      'Use for firmware/config lookup or model-specific routing.',
      'Configure deviceKey/profileKey and fetchTo if needed.',
    ],
  },
  'Telemetry.CalculatedFieldsNode': {
    title: 'Calculated Fields',
    description: 'Calculates derived telemetry/attributes using jq expressions stored in node config.',
    usage: [
      'Add fields with jq expressions and choose output destination.',
      'Fields are evaluated in the core pipeline before writing telemetry.',
    ],
  },
  'Telemetry.MsgDeleteAttributesNode': {
    title: 'Delete Attributes',
    description: 'Deletes attributes by key list.',
    usage: ['Provide keys and scope in config.'],
  },
  'Transform.CopyKeysNode': {
    title: 'Copy Keys',
    description: 'Copies keys between msg/metadata.',
    usage: ['Define source and target paths.'],
  },
  'Transform.DeleteKeysNode': {
    title: 'Delete Keys',
    description: 'Removes keys from msg/metadata.',
    usage: ['Provide key list to remove.'],
  },
  'Transform.RenameKeysNode': {
    title: 'Rename Keys',
    description: 'Renames keys in msg/metadata.',
    usage: ['Provide source->target mappings.'],
  },
  'Transform.SplitArrayToMsgNode': {
    title: 'SplitArrayToMsg',
    description: 'Splits an array into multiple messages.',
    usage: ['Use after TransformMsg to target the array.'],
  },
  'Deduplication.MsgDeduplicationNode': {
    title: 'Message Deduplication',
    description: 'Drops or merges duplicates within a time window.',
    usage: ['Configure key and time window in config.'],
  },
}

const MAX_PATH_DEPTH = 5
const MAX_PATH_SUGGESTIONS = 80
const MAX_ARRAY_SAMPLE = 4

const buildPathSuggestions = (value: string): PathSuggestion[] => {
  if (!value.trim()) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch (_err) {
    return []
  }

  const results = new Set<string>()

  const addPath = (path: string) => {
    if (!path || results.size >= MAX_PATH_SUGGESTIONS) return
    results.add(path)
  }

  const walk = (node: unknown, path: string, depth: number) => {
    if (depth > MAX_PATH_DEPTH || results.size >= MAX_PATH_SUGGESTIONS) return

    if (Array.isArray(node)) {
      if (path) addPath(path)
      node.slice(0, MAX_ARRAY_SAMPLE).forEach((item, index) => {
        const nextPath = path ? `${path}.${index}` : `${index}`
        addPath(nextPath)
        walk(item, nextPath, depth + 1)
      })
      return
    }

    if (node && typeof node === 'object') {
      if (path) addPath(path)
      Object.entries(node).forEach(([key, child]) => {
        const nextPath = path ? `${path}.${key}` : key
        addPath(nextPath)
        walk(child, nextPath, depth + 1)
      })
    }
  }

  walk(parsed, '', 0)

  return Array.from(results).map((entry) => ({ label: entry, value: entry }))
}

type RuleChainEditorProps = {
  isError: boolean
  errorMessage?: string
  filteredNodeTemplates: NodeTemplate[]
  nodes: Node<RuleChainNodeData>[]
  edges: Edge[]
  nodeTypes: Record<string, any>
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (connection: Connection) => void
  onNodeClick: (event: unknown, node: Node<RuleChainNodeData>) => void
  onEdgeClick: (event: unknown, edge: Edge) => void
  onPaneClick: () => void
  showInspector: boolean
  onShowInspector: (value: boolean) => void
  inspectorPanelRef: RefObject<ImperativePanelHandle>
  selectionTitle: string
  selectionHint: string
  activeTab: SelectionTab
  onActiveTabChange: (value: SelectionTab) => void
  selectedNodeId: string | null
  nodeName: string
  onNodeNameChange: (value: string) => void
  nodeType: string
  nodeTypeOptions: SelectOption[]
  onNodeTypeChange: (value: string) => void
  applyNodeUpdates: () => void
  setNodeAsFirst: () => void
  setNodeAsFirstById: (nodeId: string) => void
  deleteSelectedNode: () => void
  nodeConfigText: string
  onNodeConfigTextChange: (value: string) => void
  nodeConfigError: string | null
  nodeConfigValidationErrors: string[]
  outgoingEdges: Edge[]
  selectEdge: (edge: Edge) => void
  selectedRuleChainConnections: RuleChainConnectionView[]
  ruleChainNameById: Map<number, string>
  ruleChainOptions: SelectOption[]
  chainTargetId: string
  onChainTargetIdChange: (value: string) => void
  selectedChainRelation: string
  chainRelation: string
  onChainRelationChange: (value: string) => void
  onChainRelationSelect: (value: string) => void
  onEditRuleChainConnection: (connection: RuleChainConnectionView) => void
  applyRuleChainConnection: () => void
  cancelRuleChainConnectionEdit: () => void
  deleteRuleChainConnection: (index: number) => void
  editingChainConnectionIndex: number | null
  selectedEdgeId: string | null
  selectedRelation: string
  edgeLabel: string
  onEdgeLabelChange: (value: string) => void
  onEdgeRelationSelect: (value: string) => void
  applyEdgeLabel: () => void
  deleteSelectedEdge: () => void
  relationOptions: string[]
  isRuleChainsLoading: boolean
  debugPayload: string
  testProtocol: string
  testProtocolOptions: SelectOption[]
  onTestProtocolChange: (value: string) => void
  testMessages: Array<{
    id: string
    name: string
    headersText?: string
    bodyText?: string
    messageType?: string
  }>
  selectedTestMessageId: string
  onTestMessageSelect: (value: string) => void
  onCreateTestMessage: () => void
  onGenerateTestMessages: () => void
  onDeleteTestMessage: (id: string) => void
  testMessageName: string
  onTestMessageNameChange: (value: string) => void
  testRequiredHeaders: string[]
  testRequiredBody: string[]
  testHeadersText: string
  testHeadersError: string | null
  onTestHeadersChange: (value: string) => void
  testBodyText: string
  testBodyError: string | null
  onTestBodyChange: (value: string) => void
  testMessageType: string
  onTestMessageTypeChange: (value: string) => void
  onRunTest: (
    messages?: Array<{
      id: string
      name: string
      headersText?: string
      bodyText?: string
      messageType?: string
    }>
  ) => void
  isRunningTest: boolean
  dataTypeKeyOptions: SelectOption[]
  testMessagesEditable?: boolean
  testMessagesManageHref?: string
}

const SECTION_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  storage: Database,
  telemetry: Activity,
  filter: Filter,
  transform: Shuffle,
  math: Sigma,
  metadata: Info,
  relations: Link2,
  flow: GitBranch,
  action: Zap,
  rpc: Radio,
}

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

const RuleChainEditor = ({
  isError,
  errorMessage,
  filteredNodeTemplates,
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  showInspector,
  onShowInspector,
  inspectorPanelRef,
  selectionTitle,
  selectionHint,
  activeTab,
  onActiveTabChange,
  selectedNodeId,
  nodeName,
  onNodeNameChange,
  nodeType,
  nodeTypeOptions,
  onNodeTypeChange,
  applyNodeUpdates,
  setNodeAsFirst,
  setNodeAsFirstById,
  deleteSelectedNode,
  nodeConfigText,
  onNodeConfigTextChange,
  nodeConfigError,
  nodeConfigValidationErrors,
  outgoingEdges,
  selectEdge,
  selectedRuleChainConnections,
  ruleChainNameById,
  ruleChainOptions,
  chainTargetId,
  onChainTargetIdChange,
  selectedChainRelation,
  chainRelation,
  onChainRelationChange,
  onChainRelationSelect,
  onEditRuleChainConnection,
  applyRuleChainConnection,
  cancelRuleChainConnectionEdit,
  deleteRuleChainConnection,
  editingChainConnectionIndex,
  selectedEdgeId,
  selectedRelation,
  edgeLabel,
  onEdgeLabelChange,
  onEdgeRelationSelect,
  applyEdgeLabel,
  deleteSelectedEdge,
  relationOptions,
  isRuleChainsLoading,
  debugPayload,
  testProtocol,
  testProtocolOptions,
  onTestProtocolChange,
  testMessages,
  selectedTestMessageId,
  onTestMessageSelect,
  onCreateTestMessage,
  onGenerateTestMessages,
  onDeleteTestMessage,
  testMessageName,
  onTestMessageNameChange,
  testRequiredHeaders,
  testRequiredBody,
  testHeadersText,
  testHeadersError,
  onTestHeadersChange,
  testBodyText,
  testBodyError,
  onTestBodyChange,
  testMessageType,
  onTestMessageTypeChange,
  onRunTest,
  isRunningTest,
  dataTypeKeyOptions,
  testMessagesEditable = true,
  testMessagesManageHref,
}: RuleChainEditorProps) => {
  const [isTestMessageEditorOpen, setIsTestMessageEditorOpen] = useState(false)
  const [isEditingNodeName, setIsEditingNodeName] = useState(false)
  const [showRuleChainForwards, setShowRuleChainForwards] = useState(false)
  // Test messages are managed in the device model -> Messages tab.
  const showTestPanel = false
  const showTestMessageEditor = testMessagesEditable && isTestMessageEditorOpen
  const [scriptFilterValidation, setScriptFilterValidation] = useState<JqValidationState>({
    status: 'idle',
    error: null,
  })
  const [transformMsgValidation, setTransformMsgValidation] = useState<JqValidationState>({
    status: 'idle',
    error: null,
  })

  useEffect(() => {
    setIsTestMessageEditorOpen(false)
  }, [testProtocol])

  useEffect(() => {
    setIsEditingNodeName(false)
  }, [selectedNodeId])

  const safeSelectOptions = <T extends { value: string }>(options: T[]) =>
    options.filter((option) => option.value.trim() !== '')

  const testBodySuggestions = useMemo(
    () => buildPathSuggestions(testBodyText),
    [testBodyText]
  )
  const safeJsonValue = (value: string) => {
    if (!value.trim()) return {}
    try {
      return JSON.parse(value)
    } catch (_err) {
      return {}
    }
  }
  const testBodyValue = useMemo(() => safeJsonValue(testBodyText), [testBodyText])
  const testHeadersValue = useMemo(() => safeJsonValue(testHeadersText), [testHeadersText])
  const scriptSuggestionContext = useMemo(() => {
    const metadata = {
      headers: testHeadersValue,
      message_type: testMessageType || '',
      msgType: testMessageType || '',
      device: {
        id: '',
        serial_number: '',
        name: '',
        model_id: '',
        firmware_version: '',
        transport: {
          type: '',
          model_config: {},
          device_config: {},
        },
        profile_config: {},
        credentials: {},
        attributes: {},
        data_type_keys: [],
      },
    }

    return {
      msg: testBodyValue,
      payload: testBodyValue,
      metadata,
      meta: metadata,
      headers: testHeadersValue,
      msgType: testMessageType || '',
      message_type: testMessageType || '',
    }
  }, [testBodyValue, testHeadersValue, testMessageType])
  const nodeDoc = useMemo(() => (nodeType ? NODE_TYPE_DOCS[nodeType] : undefined), [nodeType])
  const selectableNodes = useMemo(
    () => nodes.filter((node) => !node.data?.isExternal),
    [nodes]
  )
  const selectableEdges = useMemo(
    () => edges.filter((edge) => !edge.target.startsWith('chain-')),
    [edges]
  )
  const nodeLabelById = useMemo(() => {
    return new Map(
      nodes.map((node) => [node.id, node.data?.label || `Node ${node.id}`])
    )
  }, [nodes])
  const selectedEdge = useMemo(
    () => (selectedEdgeId ? edges.find((edge) => edge.id === selectedEdgeId) ?? null : null),
    [edges, selectedEdgeId]
  )
  const selectedEdgeRelationValue =
    selectedRelation === 'custom' ? edgeLabel.trim() : selectedRelation
  const edgeRelationDescription =
    selectedRelation === 'custom'
      ? selectedEdgeRelationValue
        ? `Custom relation: ${selectedEdgeRelationValue}`
        : 'Custom relation label.'
      : RELATION_DESCRIPTIONS[selectedRelation] ?? 'Routes using the selected relation.'
  const selectedChainRelationValue =
    selectedChainRelation === 'custom' ? chainRelation.trim() : selectedChainRelation
  const chainRelationDescription =
    selectedChainRelation === 'custom'
      ? selectedChainRelationValue
        ? `Custom relation: ${selectedChainRelationValue}`
        : 'Custom relation label.'
      : RELATION_DESCRIPTIONS[selectedChainRelation] ?? 'Routes using the selected relation.'

  const isTimeseriesNode =
    nodeType === 'Telemetry.MsgTimeseriesNode' && !!selectedNodeId
  const isAttributesNode =
    nodeType === 'Telemetry.MsgAttributesNode' && !!selectedNodeId
  const isTransformMsgNode =
    nodeType === 'Transform.TransformMsgNode' && !!selectedNodeId
  const isMsgTypeSwitchNode =
    nodeType === 'Filter.MsgTypeSwitchNode' && !!selectedNodeId
  const isMsgTypeFilterNode =
    nodeType === 'Filter.MsgTypeFilterNode' && !!selectedNodeId
  const isCheckMessageNode =
    nodeType === 'Filter.CheckMessageNode' && !!selectedNodeId
  const isScriptFilterNode =
    nodeType === 'Filter.JsFilterNode' && !!selectedNodeId
  const DefaultSettingsComponent = nodeType
    ? DEFAULT_NODE_SETTINGS_COMPONENTS[nodeType] ?? null
    : null
  const selectedNodeSection = useMemo(() => {
    if (!nodeType) return null
    return filteredNodeTemplates.find((template) => template.value === nodeType)?.section ?? null
  }, [filteredNodeTemplates, nodeType])
  const SelectedSectionIcon = selectedNodeSection
    ? SECTION_ICON_MAP[selectedNodeSection]
    : null

  const timeseriesConfig = (() => {
    if (!isTimeseriesNode) return null
    let parsed: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsed = JSON.parse(nodeConfigText)
      } catch (_err) {
        parsed = {}
      }
    }

    const deviceIdPath =
      typeof parsed.deviceIdPath === 'string'
        ? parsed.deviceIdPath
        : typeof parsed.device_id_path === 'string'
          ? parsed.device_id_path
          : 'device_id'
    const useServerTs =
      typeof parsed.useServerTs === 'boolean'
        ? parsed.useServerTs
        : typeof parsed.use_server_ts === 'boolean'
          ? parsed.use_server_ts
          : true
    const tsPath =
      typeof parsed.tsPath === 'string'
        ? parsed.tsPath
        : typeof parsed.ts_path === 'string'
          ? parsed.ts_path
          : ''
    const rawValues = Array.isArray(parsed.values)
      ? parsed.values
      : Array.isArray(parsed.valueMappings)
        ? parsed.valueMappings
        : Array.isArray(parsed.value_mappings)
          ? parsed.value_mappings
          : []
    const values = rawValues.map((entry: Record<string, any>) => ({
      key: typeof entry.key === 'string' ? entry.key : '',
      valuePath:
        typeof entry.valuePath === 'string'
          ? entry.valuePath
          : typeof entry.value_path === 'string'
            ? entry.value_path
            : typeof entry.value === 'string'
              ? entry.value
              : '',
      valueType:
        typeof entry.valueType === 'string'
          ? entry.valueType
          : typeof entry.value_type === 'string'
            ? entry.value_type
            : typeof entry.type === 'string'
              ? entry.type
              : 'number',
    }))

    return {
      deviceIdPath,
      useServerTs,
      tsPath,
      values,
    }
  })()

  const attributesConfig = (() => {
    if (!isAttributesNode) return null
    let parsed: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsed = JSON.parse(nodeConfigText)
      } catch (_err) {
        parsed = {}
      }
    }

    const processingSettingsRaw =
      typeof parsed.processingSettings === 'object' && parsed.processingSettings
        ? parsed.processingSettings
        : typeof parsed.processing_settings === 'object' && parsed.processing_settings
          ? parsed.processing_settings
          : {}

    const processingSettings = {
      ...processingSettingsRaw,
      type:
        typeof processingSettingsRaw.type === 'string'
          ? processingSettingsRaw.type
          : 'ON_EVERY_MESSAGE',
    }

    const scope =
      typeof parsed.scope === 'string' ? parsed.scope : 'CLIENT_SCOPE'

    const notifyDevice =
      typeof parsed.notifyDevice === 'boolean'
        ? parsed.notifyDevice
        : typeof parsed.notify_device === 'boolean'
          ? parsed.notify_device
          : false

    const sendAttributesUpdatedNotification =
      typeof parsed.sendAttributesUpdatedNotification === 'boolean'
        ? parsed.sendAttributesUpdatedNotification
        : typeof parsed.send_attributes_updated_notification === 'boolean'
          ? parsed.send_attributes_updated_notification
          : false

    const updateAttributesOnlyOnValueChange =
      typeof parsed.updateAttributesOnlyOnValueChange === 'boolean'
        ? parsed.updateAttributesOnlyOnValueChange
        : typeof parsed.update_attributes_only_on_value_change === 'boolean'
          ? parsed.update_attributes_only_on_value_change
          : true

    const rawAttributes = Array.isArray(parsed.attributes)
      ? parsed.attributes
      : Array.isArray(parsed.attributeMappings)
        ? parsed.attributeMappings
        : Array.isArray(parsed.attribute_mappings)
          ? parsed.attribute_mappings
          : Array.isArray(parsed.fields)
            ? parsed.fields
            : []

    const attributes = rawAttributes.map((entry: Record<string, any>) => ({
      key:
        typeof entry.key === 'string'
          ? entry.key
          : typeof entry.name === 'string'
            ? entry.name
            : typeof entry.type === 'string'
              ? entry.type
              : '',
      path:
        typeof entry.path === 'string'
          ? entry.path
          : typeof entry.valuePath === 'string'
            ? entry.valuePath
            : typeof entry.value_path === 'string'
              ? entry.value_path
              : typeof entry.value === 'string'
                ? entry.value
                : '',
    }))

    return {
      processingSettings,
      scope,
      notifyDevice,
      sendAttributesUpdatedNotification,
      updateAttributesOnlyOnValueChange,
      attributes,
    }
  })()

  const updateTimeseriesConfig = (next: {
    deviceIdPath?: string
    useServerTs?: boolean
    tsPath?: string
    values?: { key: string; valuePath: string; valueType: string }[]
  }) => {
    if (!timeseriesConfig) return
    const merged = {
      deviceIdPath: next.deviceIdPath ?? timeseriesConfig.deviceIdPath,
      useServerTs: next.useServerTs ?? timeseriesConfig.useServerTs,
      tsPath: next.tsPath ?? timeseriesConfig.tsPath,
      values: next.values ?? timeseriesConfig.values,
    }

    const payload = {
      deviceIdPath: merged.deviceIdPath,
      useServerTs: merged.useServerTs,
      tsPath: merged.useServerTs ? '' : merged.tsPath,
      values: merged.values,
    }

    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  const updateAttributesConfig = (next: { attributes?: { key: string; path: string }[] }) => {
    if (!attributesConfig) return
    const merged = {
      ...attributesConfig,
      attributes: next.attributes ?? attributesConfig.attributes,
    }

    const payload = {
      processingSettings: merged.processingSettings,
      scope: merged.scope,
      notifyDevice: merged.notifyDevice,
      sendAttributesUpdatedNotification: merged.sendAttributesUpdatedNotification,
      updateAttributesOnlyOnValueChange: merged.updateAttributesOnlyOnValueChange,
      attributes: merged.attributes,
    }

    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  const messageTypeFilterConfig = (() => {
    if (!isMsgTypeFilterNode) return null
    let parsed: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsed = JSON.parse(nodeConfigText)
      } catch (_err) {
        parsed = {}
      }
    }

    const rawTypes = Array.isArray(parsed.messageTypes)
      ? parsed.messageTypes
      : Array.isArray(parsed.message_types)
        ? parsed.message_types
        : Array.isArray(parsed.types)
          ? parsed.types
          : []
    const messageTypes = rawTypes.map((entry: any) =>
      typeof entry === 'string' ? entry : ''
    )

    return { messageTypes }
  })()

  const updateMessageTypeFilterConfig = (next: { messageTypes?: string[] }) => {
    if (!messageTypeFilterConfig) return
    const payload = {
      messageTypes: next.messageTypes ?? messageTypeFilterConfig.messageTypes,
    }
    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  const normalizeKeyList = (value: any) => {
    if (!value) return []
    if (Array.isArray(value)) {
      return value
        .map((entry) => String(entry).trim())
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
    }
    return []
  }

  const extractCheckMessageConfig = (parsed: Record<string, any>) => {
    const messageKeys = normalizeKeyList(
      parsed.messageNames ??
        parsed.message_names ??
        parsed.dataKeys ??
        parsed.data_keys ??
        []
    )

    const metadataKeys = normalizeKeyList(
      parsed.metadataNames ??
        parsed.metadata_names ??
        parsed.metadataKeys ??
        parsed.metadata_keys ??
        []
    )

    const headerKeys = metadataKeys.map((entry) =>
      entry.startsWith('headers.') ? entry.slice('headers.'.length) : entry
    )

    const rawCheckAll = parsed.checkAllKeys ?? parsed.check_all_keys
    const checkAllKeys = rawCheckAll === undefined ? true : !!rawCheckAll

    return { messageKeys, headerKeys, checkAllKeys }
  }

  const checkMessageConfig = (() => {
    if (!isCheckMessageNode) return null
    let parsed: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsed = JSON.parse(nodeConfigText)
      } catch (_err) {
        parsed = {}
      }
    }

    return extractCheckMessageConfig(parsed)
  })()

  const updateCheckMessageConfig = (next: {
    messageKeys?: string[]
    headerKeys?: string[]
    checkAllKeys?: boolean
  }) => {
    if (!checkMessageConfig) return
    const headerKeys = next.headerKeys ?? checkMessageConfig.headerKeys

    const metadataNames = headerKeys
      .map((entry) => entry.trim())
      .map((entry) =>
        entry.length === 0
          ? ''
          : entry.startsWith('headers.') || entry.includes('.')
            ? entry
            : `headers.${entry}`
      )

    const payload = {
      messageNames: next.messageKeys ?? checkMessageConfig.messageKeys,
      metadataNames,
      checkAllKeys:
        next.checkAllKeys === undefined
          ? checkMessageConfig.checkAllKeys
          : next.checkAllKeys,
    }

    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  const scriptFilterConfig = (() => {
    if (!isScriptFilterNode) return null
    let parsed: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsed = JSON.parse(nodeConfigText)
      } catch (_err) {
        parsed = {}
      }
    }

    const script =
      typeof parsed.script === 'string'
        ? parsed.script
        : typeof parsed.expression === 'string'
          ? parsed.expression
          : typeof parsed.js === 'string'
            ? parsed.js
            : ''

    return { script }
  })()

  const updateScriptFilterConfig = (script: string) => {
    if (!scriptFilterConfig) return
    onNodeConfigTextChange(
      JSON.stringify(
        {
          script,
        },
        null,
        2
      )
    )
  }

  const transformMsgConfig = (() => {
    if (!isTransformMsgNode) return null
    let parsed: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsed = JSON.parse(nodeConfigText)
      } catch (_err) {
        parsed = {}
      }
    }

    const script =
      typeof parsed.script === 'string'
        ? parsed.script
        : typeof parsed.expression === 'string'
          ? parsed.expression
          : typeof parsed.jq === 'string'
            ? parsed.jq
            : ''

    return { script }
  })()

  const updateTransformMsgConfig = (script: string) => {
    if (!transformMsgConfig) return
    onNodeConfigTextChange(
      JSON.stringify(
        {
          script,
        },
        null,
        2
      )
    )
  }

  const debouncedScriptFilter = useDebouncedValue(scriptFilterConfig?.script ?? '', 500)
  const debouncedTransformScript = useDebouncedValue(transformMsgConfig?.script ?? '', 500)

  useEffect(() => {
    if (!isScriptFilterNode) {
      setScriptFilterValidation({ status: 'idle', error: null })
      return
    }

    const expression = debouncedScriptFilter.trim()
    if (!expression) {
      setScriptFilterValidation({ status: 'error', error: 'jq expression is required.' })
      return
    }

    let cancelled = false
    setScriptFilterValidation({ status: 'validating', error: null })

    validateIotJq({ expression, sample: scriptSuggestionContext, expected: 'boolean' })
      .then((result) => {
        if (cancelled) return
        if (result.valid) {
          setScriptFilterValidation({ status: 'valid', error: null })
        } else {
          setScriptFilterValidation({
            status: 'error',
            error: result.error || 'Invalid jq expression.',
          })
        }
      })
      .catch((err) => {
        if (cancelled) return
        setScriptFilterValidation({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to validate jq expression.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [debouncedScriptFilter, isScriptFilterNode, scriptSuggestionContext])

  useEffect(() => {
    if (!isTransformMsgNode) {
      setTransformMsgValidation({ status: 'idle', error: null })
      return
    }

    const expression = debouncedTransformScript.trim()
    if (!expression) {
      setTransformMsgValidation({ status: 'error', error: 'jq expression is required.' })
      return
    }

    let cancelled = false
    setTransformMsgValidation({ status: 'validating', error: null })

    validateIotJq({ expression, sample: scriptSuggestionContext, expected: 'object' })
      .then((result) => {
        if (cancelled) return
        if (result.valid) {
          setTransformMsgValidation({ status: 'valid', error: null })
        } else {
          setTransformMsgValidation({
            status: 'error',
            error: result.error || 'Invalid jq expression.',
          })
        }
      })
      .catch((err) => {
        if (cancelled) return
        setTransformMsgValidation({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to validate jq expression.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [debouncedTransformScript, isTransformMsgNode, scriptSuggestionContext])

  const extractMessageTypeSwitchMappings = (parsed: Record<string, any>) => {
    const rawMappings = Array.isArray(parsed.mappings)
      ? parsed.mappings
      : Array.isArray(parsed.messageTypeMappings)
        ? parsed.messageTypeMappings
        : Array.isArray(parsed.message_types)
          ? parsed.message_types.map((entry: any) => ({ type: entry, relation: '' }))
          : Array.isArray(parsed.messageTypes)
            ? parsed.messageTypes.map((entry: any) => ({ type: entry, relation: '' }))
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

  const messageTypeSwitchConfig = (() => {
    if (!isMsgTypeSwitchNode) return null
    let parsed: Record<string, any> = {}
    if (nodeConfigText.trim()) {
      try {
        parsed = JSON.parse(nodeConfigText)
      } catch (_err) {
        parsed = {}
      }
    }

    const mappings = extractMessageTypeSwitchMappings(parsed)
    return { mappings }
  })()

  const messageTypeSwitchRelationOptions = useMemo(() => {
    if (!messageTypeSwitchConfig) return ['Other', 'Missing']
    const relations = messageTypeSwitchConfig.mappings
      .map((entry) => (entry.relation || entry.type).trim())
      .filter((entry) => entry.length > 0)
    const uniqueRelations = Array.from(new Set(relations))
    const baseOptions = ['Other', 'Missing']
    return [...baseOptions, ...uniqueRelations.filter((entry) => !baseOptions.includes(entry))]
  }, [messageTypeSwitchConfig])


  const updateMessageTypeSwitchConfig = (next: {
    mappings?: { type: string; relation: string }[]
  }) => {
    if (!messageTypeSwitchConfig) return
    const payload = {
      mappings: next.mappings ?? messageTypeSwitchConfig.mappings,
    }
    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  const relationOptionsForSelectedNode = useMemo(() => {
    if (isMsgTypeSwitchNode) {
      return messageTypeSwitchRelationOptions
    }
    const override = nodeType ? NODE_RELATION_OVERRIDES[nodeType] : null
    if (override) {
      return override.filter((option) => relationOptions.includes(option))
    }
    return relationOptions
  }, [isMsgTypeSwitchNode, messageTypeSwitchRelationOptions, nodeType, relationOptions])
  const relationOptionsForSelectedEdge = useMemo(() => {
    if (!selectedEdge) return relationOptions
    const sourceNode = nodes.find((node) => node.id === selectedEdge.source)
    const sourceNodeType = sourceNode?.data?.type
    if (sourceNodeType === 'Filter.MsgTypeSwitchNode') {
      const config =
        (sourceNode?.data?.meta as any)?.configuration ??
        (sourceNode?.data?.meta as any)?.config ??
        {}
      const mappings = extractMessageTypeSwitchMappings(config)
      const relations = mappings
        .map((entry) => (entry.relation || entry.type).trim())
        .filter((entry) => entry.length > 0)
      const uniqueRelations = Array.from(new Set(relations))
      const baseOptions = ['Other', 'Missing']
      return [...baseOptions, ...uniqueRelations.filter((entry) => !baseOptions.includes(entry))]
    }
    const override = sourceNodeType ? NODE_RELATION_OVERRIDES[sourceNodeType] : null
    if (override) {
      return override.filter((option) => relationOptions.includes(option))
    }
    return relationOptions
  }, [nodes, relationOptions, selectedEdge])
  const usedEdgeRelations = useMemo(() => {
    if (!selectedEdge) return new Set<string>()
    const sourceId = selectedEdge.source
    return new Set(
      edges
        .filter((edge) => edge.source === sourceId && edge.id !== selectedEdge.id)
        .map((edge) => String(edge.label || ''))
    )
  }, [edges, selectedEdge])
  const usedChainRelations = useMemo(() => {
    const used = new Set<string>()
    selectedRuleChainConnections.forEach((connection) => {
      if (editingChainConnectionIndex !== null && connection.index === editingChainConnectionIndex) {
        return
      }
      used.add(connection.type || 'Forward')
    })
    return used
  }, [editingChainConnectionIndex, selectedRuleChainConnections])

  return (
    <div className="flex min-h-0 h-full flex-1 flex-col gap-3">
      {isError && <p className="text-sm text-destructive-600">{errorMessage}</p>}
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={72} minSize={45}>
          <div className="relative flex h-full flex-col">
            <div className="flex-1 overflow-hidden rounded-lg border border-muted bg-surface-100">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                defaultEdgeOptions={{ type: 'smoothstep' }}
                fitView
                nodesDraggable
                nodesConnectable
                edgesFocusable
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                deleteKeyCode={['Backspace']}
                proOptions={{ hideAttribution: true }}
                className="h-full w-full"
              >
                <Background gap={24} size={1} />
                <MiniMap pannable zoomable />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
            {!showInspector && (
              <div className="absolute right-4 top-4 z-10">
                <Button size="tiny" type="default" onClick={() => onShowInspector(true)}>
                  Inspector
                </Button>
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className={showInspector ? undefined : 'opacity-0 pointer-events-none'}
        />
        <ResizablePanel
          ref={inspectorPanelRef}
          defaultSize={36}
          minSize={36}
          maxSize={36}
          collapsible
          collapsedSize={0}
        >
          <div className="flex h-full flex-col border-l border-foreground-muted/30 bg-surface-100">
            <div className="flex h-9 items-center justify-between border-b border-foreground-muted/30 bg-surface-200 px-3 text-[11px] font-semibold">
              <div className="min-w-0 flex-1 pr-2">
                {selectedNodeId ? (
                  <div className="flex items-center gap-2">
                    {SelectedSectionIcon && (
                      <span className="flex h-6 w-6 items-center justify-center text-foreground-muted">
                        <SelectedSectionIcon size={14} />
                      </span>
                    )}
                    {isEditingNodeName ? (
                      <Input_Shadcn_
                        value={nodeName}
                        onChange={(event) => onNodeNameChange(event.target.value)}
                        onBlur={() => setIsEditingNodeName(false)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === 'Escape') {
                            event.currentTarget.blur()
                          }
                        }}
                        placeholder="Node name"
                        size="tiny"
                        className="h-7 w-full flex-1"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold text-foreground"
                        onClick={() => setIsEditingNodeName(true)}
                      >
                        {nodeName.trim() || 'Untitled node'}
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="min-w-0 truncate">{selectionTitle}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {selectedNodeId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="text"
                        size="tiny"
                        className="px-1"
                        icon={<MoreHorizontal size={14} />}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={setNodeAsFirst}>
                        Set as first
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive-600 focus:text-destructive-600"
                        onClick={deleteSelectedNode}
                      >
                        Delete node
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {selectedNodeId && (
                  <Button
                    type="text"
                    size="tiny"
                    className="px-1"
                    icon={
                      <Bug
                        size={14}
                        className={cn(
                          activeTab === 'debug' ? 'text-brand-500' : 'text-foreground-muted'
                        )}
                      />
                    }
                    onClick={() =>
                      onActiveTabChange(activeTab === 'debug' ? 'details' : 'debug')
                    }
                  />
                )}
                <Button
                  type="text"
                  size="tiny"
                  className="px-1"
                  icon={<X size={14} />}
                  onClick={() => onShowInspector(false)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              {!selectedNodeId && !selectedEdgeId ? (showTestPanel ? (
                <div className="space-y-4">
                  {!showTestMessageEditor ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Test rule chain</p>
                        <Button
                          size="tiny"
                          type="primary"
                          onClick={onRunTest}
                          disabled={isRunningTest}
                        >
                          {isRunningTest ? 'Running...' : 'Run test'}
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-foreground-light">Protocol</p>
                        <Select_Shadcn_ value={testProtocol} onValueChange={onTestProtocolChange}>
                          <SelectTrigger_Shadcn_ size="small">
                            <SelectValue_Shadcn_ placeholder="Select protocol" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {safeSelectOptions(testProtocolOptions).map((entry) => (
                              <SelectItem_Shadcn_
                                key={entry.value}
                                value={entry.value}
                                className="text-xs"
                              >
                                {entry.label}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-foreground-light">Messages</p>
                        <div className="flex items-center gap-2">
                          {!testMessagesEditable && testMessagesManageHref ? (
                            <Link
                              href={testMessagesManageHref}
                              className="text-xs text-foreground-light hover:text-foreground"
                            >
                              Manage in model
                            </Link>
                          ) : null}
                          {testMessagesEditable && (
                            <>
                              <Button
                                size="tiny"
                                type="default"
                                onClick={onGenerateTestMessages}
                              >
                                Generate
                              </Button>
                              <Button
                                size="tiny"
                                type="text"
                                className="px-1 text-foreground-light hover:text-foreground"
                                icon={<Plus size={14} />}
                                onClick={() => {
                                  onCreateTestMessage()
                                  setIsTestMessageEditorOpen(true)
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {testMessages.map((message, index) => {
                          const isActive = message.id === selectedTestMessageId
                          const label = message.name || `Message ${index + 1}`
                          return (
                            <button
                              type="button"
                              key={message.id}
                              onClick={() => {
                                onTestMessageSelect(message.id)
                                if (testMessagesEditable) {
                                  setIsTestMessageEditorOpen(true)
                                }
                              }}
                              className={cn(
                                'flex w-full items-center justify-between rounded border px-2 py-1 text-left text-xs transition',
                                isActive
                                  ? 'border-foreground-muted bg-surface-200 text-foreground'
                                  : 'border-muted bg-surface-100 text-foreground-light hover:border-foreground-muted hover:text-foreground'
                              )}
                            >
                              <span className="truncate">{label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-foreground-light">
                                  #{index + 1}
                                </span>
                                <Button
                                  type="text"
                                  size="tiny"
                                  className="px-1 text-foreground-light hover:text-foreground"
                                  icon={<Play size={12} />}
                                  disabled={isRunningTest}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    onRunTest([message])
                                  }}
                                />
                                {testMessagesEditable && (
                                  <Button
                                    type="text"
                                    size="tiny"
                                    className="px-1 text-foreground-light hover:text-foreground"
                                    icon={<Trash2 size={12} />}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      onDeleteTestMessage(message.id)
                                    }}
                                  />
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 w-full">
                      <div className="flex w-full items-center gap-2">
                        <Button
                          className="px-1"
                          type="text"
                          size="tiny"
                          icon={<ArrowLeft size={12} />}
                          onClick={() => setIsTestMessageEditorOpen(false)}
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Input_Shadcn_
                            id="rule-chain-test-message-name"
                            size={"tiny"}
                            value={testMessageName}
                            onChange={(event) => onTestMessageNameChange(event.target.value)}
                            placeholder="Message name"
                            className="flex-1"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-foreground-light transition hover:text-foreground"
                              >
                                <InfoIcon className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="w-[260px] space-y-2 text-xs" side="bottom" align="end">
                              <p className="font-medium text-foreground">Required keys</p>
                              <div className="space-y-1">
                                <p className="text-[11px] text-foreground-light">Headers</p>
                                {testRequiredHeaders.length === 0 ? (
                                  <p className="text-xs text-foreground-light">
                                    No required headers.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {testRequiredHeaders.map((key) => (
                                      <span
                                        key={key}
                                        className="rounded border border-muted bg-surface-200 px-2 py-0.5 text-[11px]"
                                      >
                                        {key}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className="text-[11px] text-foreground-light">Body</p>
                                {testRequiredBody.length === 0 ? (
                                  <p className="text-xs text-foreground-light">
                                    No required body fields.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {testRequiredBody.map((key) => (
                                      <span
                                        key={key}
                                        className="rounded border border-muted bg-surface-200 px-2 py-0.5 text-[11px]"
                                      >
                                        {key}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <Input_Shadcn_
                        id="rule-chain-test-message-type"
                        value={testMessageType}
                        onChange={(event) => onTestMessageTypeChange(event.target.value)}
                        placeholder="gateway_telemetry"
                      />
                      <div className="space-y-1">
                        <p className="text-xs text-foreground-light">Headers (JSON)</p>
                        <div className="h-28 overflow-hidden rounded border border-muted bg-surface-200">
                          <CodeEditor
                            id="rule-chain-test-headers"
                            language="json"
                            value={testHeadersText}
                            onInputChange={(value) => onTestHeadersChange(value ?? '')}
                            options={{ wordWrap: 'on' }}
                            hideLineNumbers
                          />
                        </div>
                        {testHeadersError && (
                          <p className="text-xs text-destructive-600">{testHeadersError}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-foreground-light">Body (JSON)</p>
                        <div className="h-40 overflow-hidden rounded border border-muted bg-surface-200">
                          <CodeEditor
                            id="rule-chain-test-body"
                            language="json"
                            value={testBodyText}
                            onInputChange={(value) => onTestBodyChange(value ?? '')}
                            options={{ wordWrap: 'on' }}
                            hideLineNumbers
                          />
                        </div>
                        {testBodyError && (
                          <p className="text-xs text-destructive-600">{testBodyError}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">Nodes</p>
                    {selectableNodes.length === 0 ? (
                      <p className="text-xs text-foreground-light">No nodes yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {selectableNodes.map((node) => (
                          <div
                            key={node.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onNodeClick(undefined, node)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                onNodeClick(undefined, node)
                              }
                            }}
                            className={cn(
                              'flex w-full items-center justify-between rounded border px-2 py-1 text-left text-xs transition',
                              'border-muted bg-surface-100 text-foreground-light hover:border-foreground-muted hover:text-foreground'
                            )}
                          >
                            <span className="truncate">{node.data?.label || `Node ${node.id}`}</span>
                            <div className="flex items-center gap-2">
                              {node.data?.isRoot ? (
                                <Badge variant="success" className="text-[10px]">
                                  First
                                </Badge>
                              ) : (
                                <Button
                                  size="tiny"
                                  type="text"
                                  className="px-1"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setNodeAsFirstById(node.id)
                                  }}
                                >
                                  Set first
                                </Button>
                              )}
                              <span className="text-[11px] text-foreground-light">
                                {node.data?.type || 'node'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">Edges</p>
                    {selectableEdges.length === 0 ? (
                      <p className="text-xs text-foreground-light">No edges yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {selectableEdges.map((edge) => {
                          const sourceLabel = nodeLabelById.get(edge.source) || edge.source
                          const targetLabel = nodeLabelById.get(edge.target) || edge.target
                          const relation =
                            typeof edge.label === 'string' && edge.label.trim()
                              ? edge.label
                              : 'Success'
                          return (
                            <button
                              key={edge.id}
                              type="button"
                              onClick={() => onEdgeClick(undefined, edge)}
                              className={cn(
                                'flex w-full items-center justify-between rounded border px-2 py-1 text-left text-xs transition',
                                'border-muted bg-surface-100 text-foreground-light hover:border-foreground-muted hover:text-foreground'
                              )}
                            >
                              <span className="truncate">
                                {sourceLabel} → {targetLabel}
                              </span>
                              <span className="text-[11px] text-foreground-light">
                                {relation}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="space-y-4">
                    {activeTab === 'debug' ? (
                      <div className="space-y-2">
                        <p className="text-sm text-foreground-light">Debug output</p>
                        <Textarea
                          id="rule-chain-debug"
                          className="input-mono"
                          readOnly
                          value={debugPayload}
                          rows={12}
                        />
                      </div>
                    ) : selectedNodeId ? (
                      <>
                        {nodeDoc ? (
                          <div className="space-y-2 rounded border border-muted bg-surface-100 p-3">
                            <p className="text-xs font-medium text-foreground">{nodeDoc.title}</p>
                            <p className="text-xs text-foreground-light">
                              {nodeDoc.description}
                            </p>
                            {nodeDoc.usage.length > 0 && (
                              <ul className="list-disc space-y-1 pl-4 text-xs text-foreground-light">
                                {nodeDoc.usage.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-foreground-light">
                            No documentation for this node yet.
                          </p>
                        )}
                        <div className="space-y-4 border-t border-muted pt-4">
                          {isTimeseriesNode && timeseriesConfig ? (
                            <TimeseriesNodeSettings
                              config={timeseriesConfig}
                              valueTypeOptions={safeSelectOptions(TIMESERIES_VALUE_TYPES)}
                              testBodySuggestions={testBodySuggestions}
                              onChange={updateTimeseriesConfig}
                              validationErrors={nodeConfigValidationErrors}
                            />
                          ) : isAttributesNode && attributesConfig ? (
                            <TelemetryMsgAttributesNodeSettings
                              attributes={attributesConfig.attributes}
                              keyOptions={safeSelectOptions(ATTRIBUTE_KEYS)}
                              testBodySuggestions={testBodySuggestions}
                              onChange={updateAttributesConfig}
                              validationErrors={nodeConfigValidationErrors}
                              fallbackKeys={ATTRIBUTE_KEYS.map((entry) => entry.value)}
                            />
                          ) : isMsgTypeSwitchNode && messageTypeSwitchConfig ? (
                            <MsgTypeSwitchNodeSettings
                              config={messageTypeSwitchConfig}
                              onChange={updateMessageTypeSwitchConfig}
                              validationErrors={nodeConfigValidationErrors}
                            />
                          ) : isMsgTypeFilterNode && messageTypeFilterConfig ? (
                            <MsgTypeFilterNodeSettings
                              config={messageTypeFilterConfig}
                              onChange={updateMessageTypeFilterConfig}
                              validationErrors={nodeConfigValidationErrors}
                            />
                          ) : isCheckMessageNode && checkMessageConfig ? (
                            <CheckMessageNodeSettings
                              config={checkMessageConfig}
                              onChange={updateCheckMessageConfig}
                              validationErrors={nodeConfigValidationErrors}
                            />
                          ) : isScriptFilterNode && scriptFilterConfig ? (
                            <ScriptFilterNodeSettings
                              config={scriptFilterConfig}
                              onChange={updateScriptFilterConfig}
                              validation={scriptFilterValidation}
                              scriptSuggestionContext={scriptSuggestionContext}
                              validationErrors={nodeConfigValidationErrors}
                            />
                          ) : isTransformMsgNode && transformMsgConfig ? (
                            <TransformMsgNodeSettings
                              config={transformMsgConfig}
                              onChange={updateTransformMsgConfig}
                              validation={transformMsgValidation}
                              scriptSuggestionContext={scriptSuggestionContext}
                              validationErrors={nodeConfigValidationErrors}
                            />
                          ) : DefaultSettingsComponent ? (
                            <DefaultSettingsComponent
                              nodeConfigText={nodeConfigText}
                              nodeConfigError={nodeConfigError}
                              onNodeConfigTextChange={onNodeConfigTextChange}
                              validationErrors={nodeConfigValidationErrors}
                              scriptSuggestionContext={scriptSuggestionContext}
                              dataTypeKeyOptions={dataTypeKeyOptions}
                            />
                          ) : (
                            <DefaultNodeSettings
                              nodeConfigText={nodeConfigText}
                              nodeConfigError={nodeConfigError}
                              onNodeConfigTextChange={onNodeConfigTextChange}
                              validationErrors={nodeConfigValidationErrors}
                              scriptSuggestionContext={scriptSuggestionContext}
                              dataTypeKeyOptions={dataTypeKeyOptions}
                            />
                          )}
                        </div>
                        <div className="space-y-3 border-t border-muted pt-4">
                          {outgoingEdges.length === 0 ? (
                            <div className="rounded border border-dashed border-muted px-3 py-3 text-center text-xs text-foreground-light">
                              No outgoing relations
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {outgoingEdges.map((edge) => (
                                <div
                                  key={edge.id}
                                  className="flex items-center justify-between rounded border border-muted px-2 py-1 text-xs"
                                >
                                  <span>
                                    {edge.label || 'Success'} {'->'} Node {edge.target}
                                  </span>
                                  <Button size="tiny" type="text" onClick={() => selectEdge(edge)}>
                                    Edit
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="border-t border-muted pt-4">
                            <Collapsible_Shadcn_
                              open={showRuleChainForwards}
                              onOpenChange={setShowRuleChainForwards}
                            >
                              <CollapsibleTrigger_Shadcn_ className="group flex w-full items-center justify-between text-xs text-foreground-light">
                                <span>Rule chain forwards</span>
                                <ChevronDown className="h-6 w-6 transition-transform group-data-[state=open]:rotate-180 px-1.5" />
                              </CollapsibleTrigger_Shadcn_>
                              <CollapsibleContent_Shadcn_ className="pt-3 space-y-3">
                                {selectedRuleChainConnections.length === 0 ? (
                                  <p className="text-xs text-foreground-light">No forwards yet.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {selectedRuleChainConnections.map((connection) => {
                                      const targetId = connection.targetRuleChainId
                                      const resolvedTargetId = Number(targetId)
                                      const targetName = !Number.isNaN(resolvedTargetId)
                                        ? ruleChainNameById.get(resolvedTargetId)
                                        : undefined
                                      const label = targetName
                                        ? `${targetName} (${targetId})`
                                        : `Rule chain ${targetId}`

                                      return (
                                        <div
                                          key={`chain-connection-${connection.index}`}
                                          className="flex items-center justify-between rounded border border-muted px-2 py-1 text-xs"
                                        >
                                          <span>
                                            {connection.type || 'Forward'} {'->'} {label}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="tiny"
                                              type="text"
                                              onClick={() => onEditRuleChainConnection(connection)}
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              size="tiny"
                                              type="text"
                                              onClick={() =>
                                                deleteRuleChainConnection(connection.index)
                                              }
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                {isRuleChainsLoading ? (
                                  <p className="text-xs text-foreground-light">
                                    Loading rule chains...
                                  </p>
                                ) : ruleChainOptions.length === 0 ? (
                                  <p className="text-xs text-foreground-light">
                                    No rule chains available.
                                  </p>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <p className="text-xs text-foreground-light">
                                        Target rule chain
                                      </p>
                                      <Select_Shadcn_
                                        value={chainTargetId}
                                        onValueChange={onChainTargetIdChange}
                                      >
                                        <SelectTrigger_Shadcn_ size="tiny">
                                          <SelectValue_Shadcn_ placeholder="Select rule chain" />
                                        </SelectTrigger_Shadcn_>
                                        <SelectContent_Shadcn_>
                                          {safeSelectOptions(ruleChainOptions).map((option) => (
                                            <SelectItem_Shadcn_
                                              key={option.value}
                                              value={option.value}
                                              className="text-xs"
                                            >
                                              {option.label}
                                            </SelectItem_Shadcn_>
                                          ))}
                                        </SelectContent_Shadcn_>
                                      </Select_Shadcn_>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-foreground-light">Relation</p>
                                      <Select_Shadcn_
                                        value={selectedChainRelation}
                                        onValueChange={onChainRelationSelect}
                                      >
                                        <SelectTrigger_Shadcn_ size="tiny">
                                          <SelectValue_Shadcn_ placeholder="Select relation" />
                                        </SelectTrigger_Shadcn_>
                                        <SelectContent_Shadcn_>
                                          {relationOptionsForSelectedNode
                                            .filter((option) => option.trim() !== '')
                                            .map((option) => {
                                              const isUsed =
                                                usedChainRelations.has(option) &&
                                                option !== selectedChainRelation
                                              return (
                                                <SelectItem_Shadcn_
                                                  key={option}
                                                  value={option}
                                                  className={cn(
                                                    'text-xs',
                                                    isUsed && 'text-foreground-muted'
                                                  )}
                                                  disabled={isUsed}
                                                >
                                                  {option}
                                                  {isUsed ? ' · used' : ''}
                                                </SelectItem_Shadcn_>
                                              )
                                            })}
                                          {selectedChainRelation === 'custom' && (
                                            <SelectItem_Shadcn_ value="custom" className="text-xs">
                                              Custom
                                            </SelectItem_Shadcn_>
                                          )}
                                        </SelectContent_Shadcn_>
                                      </Select_Shadcn_>
                                      <p className="text-xs text-foreground-light">
                                        {chainRelationDescription}
                                      </p>
                                    </div>
                                    <Input_Shadcn_
                                      id="rule-chain-forward-relation"
                                      size="tiny"
                                      placeholder="Custom relation"
                                      value={chainRelation}
                                      onChange={(event) =>
                                        onChainRelationChange(event.target.value)
                                      }
                                    />
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button
                                        size="tiny"
                                        type="primary"
                                        onClick={applyRuleChainConnection}
                                        disabled={!chainTargetId}
                                      >
                                        {editingChainConnectionIndex !== null
                                          ? 'Update forward'
                                          : 'Add forward'}
                                      </Button>
                                      {editingChainConnectionIndex !== null && (
                                        <Button
                                          size="tiny"
                                          type="default"
                                          onClick={cancelRuleChainConnectionEdit}
                                        >
                                          Cancel
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </CollapsibleContent_Shadcn_>
                            </Collapsible_Shadcn_>
                          </div>
                        </div>
                      </>
                    ) : selectedEdgeId ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-xs text-foreground-light">Connection</p>
                          <p className="text-sm text-foreground">
                            {selectedEdge
                              ? `Node ${selectedEdge.source} -> Node ${selectedEdge.target}`
                              : 'Selected connection'}
                          </p>
                          <p className="text-xs text-foreground-light">
                            Label: {selectedEdge?.label || 'Success'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-foreground-light">Relation</p>
                          <Select_Shadcn_
                            value={selectedRelation}
                            onValueChange={onEdgeRelationSelect}
                          >
                            <SelectTrigger_Shadcn_ size="small">
                              <SelectValue_Shadcn_ placeholder="Select relation" />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                                  {relationOptionsForSelectedEdge
                                    .filter((option) => option.trim() !== '')
                                    .map((option) => {
                                      const isUsed =
                                        usedEdgeRelations.has(option) && option !== selectedRelation
                                      return (
                                        <SelectItem_Shadcn_
                                          key={option}
                                          value={option}
                                          className={cn('text-xs', isUsed && 'text-foreground-muted')}
                                          disabled={isUsed}
                                        >
                                          {option}
                                          {isUsed ? ' · used' : ''}
                                        </SelectItem_Shadcn_>
                                      )
                                    })}
                              {selectedRelation === 'custom' && (
                                <SelectItem_Shadcn_ value="custom" className="text-xs">
                                  Custom
                                </SelectItem_Shadcn_>
                              )}
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                          <p className="text-xs text-foreground-light">{edgeRelationDescription}</p>
                        </div>
                        <Input_Shadcn_
                          id="rule-chain-edge-label"
                          placeholder="Custom label"
                          value={edgeLabel}
                          onChange={(event) => onEdgeLabelChange(event.target.value)}
                        />
                        <div className="space-y-2 rounded border border-muted bg-surface-100 p-3">
                          <p className="text-xs font-medium text-foreground">
                            What this connection does
                          </p>
                          <p className="text-xs text-foreground-light">
                            Connections route messages from one node to another. The label
                            determines which branch a node takes (Success/Failure/Custom) and is
                            stored as the edge relation.
                          </p>
                          <ul className="list-disc space-y-1 pl-4 text-xs text-foreground-light">
                            <li>Edit the label in the fields above.</li>
                            <li>Delete the edge to remove this routing path.</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button size="tiny" type="danger" onClick={deleteSelectedEdge}>
                            Delete edge
                          </Button>
                        </div>
                    </>
                    ) : (
                      <p className="text-sm text-foreground-light">{selectionHint}</p>
                    )}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default RuleChainEditor
