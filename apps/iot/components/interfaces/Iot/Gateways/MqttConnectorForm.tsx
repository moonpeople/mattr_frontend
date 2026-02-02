import { useMemo, useState, type ReactNode } from 'react'
import { Edit2, Trash, X } from 'lucide-react'

import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import {
  Button,
  Button_Shadcn_,
  ButtonGroup,
  ButtonGroupItem,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input_Shadcn_,
  Label_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

const SECURITY_TYPES = [
  { label: 'Anonymous', value: 'anonymous' },
  { label: 'Basic', value: 'basic' },
  { label: 'Certificates', value: 'certificates' },
]

const MQTT_VERSIONS = [
  { label: '3.1', value: 3 },
  { label: '3.1.1', value: 4 },
  { label: '5.0', value: 5 },
]

const EXPRESSION_SOURCES = [
  { label: 'Message', value: 'message' },
  { label: 'Topic', value: 'topic' },
  { label: 'Constant', value: 'constant' },
]

const ATTRIBUTE_TYPES = [
  { label: 'String', value: 'string' },
  { label: 'Double', value: 'double' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Integer', value: 'integer' },
  { label: 'Long', value: 'long' },
  { label: 'JSON', value: 'json' },
  { label: 'Raw', value: 'raw' },
]

const CONVERTER_TYPES = [
  { label: 'JSON', value: 'json' },
  { label: 'Bytes', value: 'bytes' },
  { label: 'Custom', value: 'custom' },
]

const LOG_LEVELS = [
  { label: 'NONE', value: 'NONE' },
  { label: 'CRITICAL', value: 'CRITICAL' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'INFO', value: 'INFO' },
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'TRACE', value: 'TRACE' },
]

const RPC_TYPES = [
  { label: 'One way', value: 'oneWay' },
  { label: 'Two way', value: 'twoWay' },
]

type MqttConnectorFormProps = {
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
  generalContent?: ReactNode
}

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const cloneValue = (value: Record<string, any>) => JSON.parse(JSON.stringify(value ?? {}))

const ensureArray = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : [])

const setPath = (root: Record<string, any>, path: Array<string | number>, value: unknown) => {
  let current: any = root
  path.slice(0, -1).forEach((segment, index) => {
    const next = path[index + 1]
    if (current[segment] == null) {
      current[segment] = typeof next === 'number' ? [] : {}
    }
    current = current[segment]
  })
  current[path[path.length - 1]] = value
}

const createDeviceInfo = () => ({
  deviceNameExpressionSource: 'message',
  deviceNameExpression: '',
  deviceProfileExpressionSource: 'message',
  deviceProfileExpression: '',
})

const createConverter = (type: string) => {
  if (type === 'custom') {
    return {
      type: 'custom',
      extension: '',
      sharedGlobal: false,
      sharedId: '',
      extensionConfig: {},
    }
  }

  return {
    type,
    deviceInfo: createDeviceInfo(),
    sendDataOnlyOnChange: false,
    timeout: 60000,
    useReceivedTs: false,
    useEval: false,
    attributes: [],
    timeseries: [],
  }
}

const createMapping = () => ({
  topicFilter: '',
  subscriptionQos: 1,
  converter: createConverter('json'),
})

const createAttributeEntry = () => ({
  type: 'string',
  key: '',
  value: '',
  keySource: 'message',
})

const createTimeseriesEntry = () => ({
  type: 'string',
  key: '',
  value: '',
  keySource: 'message',
  tsField: '',
  dayfirst: false,
  yearfirst: false,
})

const createConnectRequest = () => ({
  topicFilter: '',
  deviceInfo: createDeviceInfo(),
})

const createAttributeRequest = () => ({
  retain: false,
  topicFilter: '',
  deviceInfo: createDeviceInfo(),
  attributeNameExpressionSource: 'message',
  attributeNameExpression: '',
  topicExpression: '',
  valueExpression: '',
})

const createAttributeUpdate = () => ({
  retain: true,
  deviceNameFilter: '.*',
  attributeFilter: '',
  topicExpression: '',
  valueExpression: '',
})

const createRpcRequest = () => ({
  type: 'twoWay',
  deviceNameFilter: '.*',
  methodFilter: '',
  requestTopicExpression: '',
  responseTopicExpression: '',
  responseTopicQoS: 1,
  responseTimeout: 10000,
  valueExpression: '',
})

type RequestKind = 'connect' | 'disconnect' | 'attributeRequest' | 'attributeUpdate' | 'rpc'

const REQUEST_KIND_OPTIONS: Array<{ label: string; value: RequestKind }> = [
  { label: 'Connect request', value: 'connect' },
  { label: 'Disconnect request', value: 'disconnect' },
  { label: 'Attribute request', value: 'attributeRequest' },
  { label: 'Attribute update', value: 'attributeUpdate' },
  { label: 'Server side RPC', value: 'rpc' },
]

const SectionHeader = ({ title, onAdd }: { title: string; onAdd?: () => void }) => (
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium text-foreground-light">{title}</p>
    {onAdd && (
      <Button size="tiny" type="default" onClick={onAdd}>
        Add
      </Button>
    )}
  </div>
)

const KeyValueTableEditor = ({
  entries,
  onChange,
  emptyText,
  showKeySource = false,
}: {
  entries: Array<{ type: string; key: string; value: string; keySource?: string }>
  onChange: (next: Array<{ type: string; key: string; value: string; keySource?: string }>) => void
  emptyText: string
  showKeySource?: boolean
}) => (
  <div className="flex flex-col gap-3">
    {entries.length === 0 && <p className="text-xs text-foreground-light">{emptyText}</p>}
    {entries.map((entry, idx) => (
      <div key={`kv-row-${idx}`} className="flex items-end gap-x-2">
        <div className="flex-1 space-y-1">
          <Label_Shadcn_ className="text-xs text-foreground-light">Key</Label_Shadcn_>
          <Input_Shadcn_
            value={entry.key ?? ''}
            onChange={(event) => {
              const next = [...entries]
              next[idx] = { ...entry, key: event.target.value }
              onChange(next)
            }}
          />
        </div>
        {showKeySource && (
          <div className="w-36 space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Key source</Label_Shadcn_>
            <Select_Shadcn_
              value={entry.keySource ?? 'message'}
              onValueChange={(nextSource) => {
                const next = [...entries]
                next[idx] = { ...entry, keySource: nextSource }
                onChange(next)
              }}
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {EXPRESSION_SOURCES.filter((option) => option.value !== 'constant').map(
                  (option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem_Shadcn_>
                  )
                )}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
        )}
        <div className="w-36 space-y-1">
          <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
          <Select_Shadcn_
            value={entry.type ?? 'string'}
            onValueChange={(nextType) => {
              const next = [...entries]
              next[idx] = { ...entry, type: nextType }
              onChange(next)
            }}
          >
            <SelectTrigger_Shadcn_ size="small">
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {ATTRIBUTE_TYPES.map((option) => (
                <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <div className="flex-1 space-y-1">
          <Label_Shadcn_ className="text-xs text-foreground-light">Value</Label_Shadcn_>
          <Input_Shadcn_
            value={entry.value ?? ''}
            onChange={(event) => {
              const next = [...entries]
              next[idx] = { ...entry, value: event.target.value }
              onChange(next)
            }}
          />
        </div>
        <Button_Shadcn_
          size="sm"
          variant="ghost"
          className="px-1"
          onClick={() => onChange(entries.filter((_, index) => index !== idx))}
        >
          <X size={14} />
        </Button_Shadcn_>
      </div>
    ))}
  </div>
)

const TimeSeriesTableEditor = ({
  entries,
  onChange,
  emptyText,
}: {
  entries: Array<{
    type: string
    key: string
    value: string
    keySource?: string
    tsField?: string
    dayfirst?: boolean
    yearfirst?: boolean
  }>
  onChange: (
    next: Array<{
      type: string
      key: string
      value: string
      keySource?: string
      tsField?: string
      dayfirst?: boolean
      yearfirst?: boolean
    }>
  ) => void
  emptyText: string
}) => (
  <div className="flex flex-col gap-3">
    {entries.length === 0 && <p className="text-xs text-foreground-light">{emptyText}</p>}
    {entries.map((entry, idx) => (
      <div key={`ts-row-${idx}`} className="space-y-3">
        <div className="flex items-end gap-x-2">
          <div className="flex-1 space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Key</Label_Shadcn_>
            <Input_Shadcn_
              value={entry.key ?? ''}
              onChange={(event) => {
                const next = [...entries]
                next[idx] = { ...entry, key: event.target.value }
                onChange(next)
              }}
            />
          </div>
          <div className="w-36 space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Key source</Label_Shadcn_>
            <Select_Shadcn_
              value={entry.keySource ?? 'message'}
              onValueChange={(nextSource) => {
                const next = [...entries]
                next[idx] = { ...entry, keySource: nextSource }
                onChange(next)
              }}
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {EXPRESSION_SOURCES.filter((option) => option.value !== 'constant').map((option) => (
                  <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="w-36 space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
            <Select_Shadcn_
              value={entry.type ?? 'string'}
              onValueChange={(nextType) => {
                const next = [...entries]
                next[idx] = { ...entry, type: nextType }
                onChange(next)
              }}
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {ATTRIBUTE_TYPES.map((option) => (
                  <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="flex-1 space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Value</Label_Shadcn_>
            <Input_Shadcn_
              value={entry.value ?? ''}
              onChange={(event) => {
                const next = [...entries]
                next[idx] = { ...entry, value: event.target.value }
                onChange(next)
              }}
            />
          </div>
          <Button_Shadcn_
            size="sm"
            variant="ghost"
            className="px-1"
            onClick={() => onChange(entries.filter((_, index) => index !== idx))}
          >
            <X size={14} />
          </Button_Shadcn_>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">TS field</Label_Shadcn_>
            <Input_Shadcn_
              value={entry.tsField ?? ''}
              onChange={(event) => {
                const next = [...entries]
                next[idx] = { ...entry, tsField: event.target.value }
                onChange(next)
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={entry.dayfirst ?? false}
                onCheckedChange={(checked) => {
                  const next = [...entries]
                  next[idx] = { ...entry, dayfirst: checked }
                  onChange(next)
                }}
              />
              <Label_Shadcn_ className="text-xs text-foreground-light">Day first</Label_Shadcn_>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={entry.yearfirst ?? false}
                onCheckedChange={(checked) => {
                  const next = [...entries]
                  next[idx] = { ...entry, yearfirst: checked }
                  onChange(next)
                }}
              />
              <Label_Shadcn_ className="text-xs text-foreground-light">Year first</Label_Shadcn_>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const MqttConnectorForm = ({
  value,
  onChange,
  generalContent,
}: MqttConnectorFormProps) => {
  const [editingMappingIndex, setEditingMappingIndex] = useState<number | null>(null)
  const [mappingSearch, setMappingSearch] = useState('')
  const [editingRequest, setEditingRequest] = useState<{
    kind: RequestKind
    index: number
    isNew: boolean
  } | null>(null)
  const [requestsSearch, setRequestsSearch] = useState('')
  const broker = value.broker ?? {}
  const security = broker.security ?? { type: 'basic' }

  const mapping = ensureArray(value.mapping)
  const requestsMapping = value.requestsMapping ?? {}
  const connectRequests = ensureArray(requestsMapping.connectRequests)
  const disconnectRequests = ensureArray(requestsMapping.disconnectRequests)
  const attributeRequests = ensureArray(requestsMapping.attributeRequests)
  const attributeUpdates = ensureArray(requestsMapping.attributeUpdates)
  const serverSideRpc = ensureArray(requestsMapping.serverSideRpc)

  const versionValue = useMemo(() => {
    const found = MQTT_VERSIONS.find((option) => option.value === broker.version)
    return found?.value ?? 5
  }, [broker.version])

  const updateValue = (path: Array<string | number>, next: unknown) => {
    const clone = cloneValue(value)
    setPath(clone, path, next)
    onChange(clone)
  }

  const updateBroker = (patch: Record<string, unknown>) => {
    updateValue(['broker'], {
      ...broker,
      security,
      ...patch,
    })
  }

  const updateSecurity = (patch: Record<string, unknown>) => {
    updateBroker({
      security: {
        ...security,
        ...patch,
      },
    })
  }

  const updateMappingItem = (index: number, patch: Record<string, unknown>) => {
    const next = [...mapping]
    next[index] = { ...(next[index] ?? createMapping()), ...patch }
    updateValue(['mapping'], next)
  }

  const updateConverter = (index: number, patch: Record<string, unknown>) => {
    const current = mapping[index] ?? createMapping()
    updateMappingItem(index, {
      converter: {
        ...(current.converter ?? createConverter('json')),
        ...patch,
      },
    })
  }

  const updateConverterList = (
    index: number,
    listKey: 'attributes' | 'timeseries',
    list: Array<Record<string, unknown>>
  ) => {
    updateConverter(index, {
      [listKey]: list,
    })
  }

  const formatDeviceInfoSummary = (deviceInfo?: Record<string, any>) => {
    const expr = deviceInfo?.deviceNameExpression
    if (!expr) return '-'
    const source = deviceInfo?.deviceNameExpressionSource ?? 'message'
    return `${source}: ${expr}`
  }

  const requestRows: Array<{
    kind: RequestKind
    index: number
    typeLabel: string
    details: string
  }> = [
    ...connectRequests.map((request, index) => ({
      kind: 'connect',
      index,
      typeLabel: 'Connect request',
      details: request.topicFilter || '-',
    })),
    ...disconnectRequests.map((request, index) => ({
      kind: 'disconnect',
      index,
      typeLabel: 'Disconnect request',
      details: request.topicFilter || '-',
    })),
    ...attributeRequests.map((request, index) => ({
      kind: 'attributeRequest',
      index,
      typeLabel: 'Attribute request',
      details: request.topicFilter || '-',
    })),
    ...attributeUpdates.map((update, index) => ({
      kind: 'attributeUpdate',
      index,
      typeLabel: 'Attribute update',
      details: update.topicExpression || '-',
    })),
    ...serverSideRpc.map((rpc, index) => ({
      kind: 'rpc',
      index,
      typeLabel: 'Server side RPC',
      details: rpc.methodFilter || '-',
    })),
  ]

  const addRequestByKind = (kind: RequestKind, isNew = true) => {
    switch (kind) {
      case 'connect': {
        const next = [...connectRequests, createConnectRequest()]
        updateValue(['requestsMapping', 'connectRequests'], next)
        setEditingRequest({ kind, index: next.length - 1, isNew })
        break
      }
      case 'disconnect': {
        const next = [...disconnectRequests, createConnectRequest()]
        updateValue(['requestsMapping', 'disconnectRequests'], next)
        setEditingRequest({ kind, index: next.length - 1, isNew })
        break
      }
      case 'attributeRequest': {
        const next = [...attributeRequests, createAttributeRequest()]
        updateValue(['requestsMapping', 'attributeRequests'], next)
        setEditingRequest({ kind, index: next.length - 1, isNew })
        break
      }
      case 'attributeUpdate': {
        const next = [...attributeUpdates, createAttributeUpdate()]
        updateValue(['requestsMapping', 'attributeUpdates'], next)
        setEditingRequest({ kind, index: next.length - 1, isNew })
        break
      }
      case 'rpc': {
        const next = [...serverSideRpc, createRpcRequest()]
        updateValue(['requestsMapping', 'serverSideRpc'], next)
        setEditingRequest({ kind, index: next.length - 1, isNew })
        break
      }
    }
  }

  const switchEditingRequestKind = (nextKind: RequestKind) => {
    if (!editingRequest) return
    const clone = cloneValue(value)
    const mappingClone = clone.requestsMapping ?? {}
    const connectClone = ensureArray(mappingClone.connectRequests)
    const disconnectClone = ensureArray(mappingClone.disconnectRequests)
    const attributeRequestClone = ensureArray(mappingClone.attributeRequests)
    const attributeUpdateClone = ensureArray(mappingClone.attributeUpdates)
    const rpcClone = ensureArray(mappingClone.serverSideRpc)

    const removeAtIndex = (list: any[], index: number) => list.filter((_, i) => i !== index)
    const appendEntry = (list: any[], entry: any) => [...list, entry]

    switch (editingRequest.kind) {
      case 'connect':
        mappingClone.connectRequests = removeAtIndex(connectClone, editingRequest.index)
        break
      case 'disconnect':
        mappingClone.disconnectRequests = removeAtIndex(disconnectClone, editingRequest.index)
        break
      case 'attributeRequest':
        mappingClone.attributeRequests = removeAtIndex(attributeRequestClone, editingRequest.index)
        break
      case 'attributeUpdate':
        mappingClone.attributeUpdates = removeAtIndex(attributeUpdateClone, editingRequest.index)
        break
      case 'rpc':
        mappingClone.serverSideRpc = removeAtIndex(rpcClone, editingRequest.index)
        break
    }

    let nextIndex = 0
    switch (nextKind) {
      case 'connect': {
        const nextList = appendEntry(ensureArray(mappingClone.connectRequests), createConnectRequest())
        nextIndex = nextList.length - 1
        mappingClone.connectRequests = nextList
        break
      }
      case 'disconnect': {
        const nextList = appendEntry(
          ensureArray(mappingClone.disconnectRequests),
          createConnectRequest()
        )
        nextIndex = nextList.length - 1
        mappingClone.disconnectRequests = nextList
        break
      }
      case 'attributeRequest': {
        const nextList = appendEntry(
          ensureArray(mappingClone.attributeRequests),
          createAttributeRequest()
        )
        nextIndex = nextList.length - 1
        mappingClone.attributeRequests = nextList
        break
      }
      case 'attributeUpdate': {
        const nextList = appendEntry(
          ensureArray(mappingClone.attributeUpdates),
          createAttributeUpdate()
        )
        nextIndex = nextList.length - 1
        mappingClone.attributeUpdates = nextList
        break
      }
      case 'rpc': {
        const nextList = appendEntry(ensureArray(mappingClone.serverSideRpc), createRpcRequest())
        nextIndex = nextList.length - 1
        mappingClone.serverSideRpc = nextList
        break
      }
    }

    clone.requestsMapping = mappingClone
    onChange(clone)
    setEditingRequest({ kind: nextKind, index: nextIndex, isNew: true })
  }

  const removeRequestByKind = (kind: RequestKind, index: number) => {
    switch (kind) {
      case 'connect':
        updateValue(
          ['requestsMapping', 'connectRequests'],
          connectRequests.filter((_, i) => i !== index)
        )
        break
      case 'disconnect':
        updateValue(
          ['requestsMapping', 'disconnectRequests'],
          disconnectRequests.filter((_, i) => i !== index)
        )
        break
      case 'attributeRequest':
        updateValue(
          ['requestsMapping', 'attributeRequests'],
          attributeRequests.filter((_, i) => i !== index)
        )
        break
      case 'attributeUpdate':
        updateValue(
          ['requestsMapping', 'attributeUpdates'],
          attributeUpdates.filter((_, i) => i !== index)
        )
        break
      case 'rpc':
        updateValue(
          ['requestsMapping', 'serverSideRpc'],
          serverSideRpc.filter((_, i) => i !== index)
        )
        break
    }
  }

  const renderDeviceInfo = (
    deviceInfo: Record<string, any>,
    onChangeDeviceInfo: (next: Record<string, any>) => void
  ) => (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label_Shadcn_ className="text-xs text-foreground-light">Device name source</Label_Shadcn_>
        <Select_Shadcn_
          value={deviceInfo.deviceNameExpressionSource ?? 'message'}
          onValueChange={(next) =>
            onChangeDeviceInfo({ ...deviceInfo, deviceNameExpressionSource: next })
          }
        >
          <SelectTrigger_Shadcn_ size="small">
            <SelectValue_Shadcn_ />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {EXPRESSION_SOURCES.map((option) => (
              <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </div>
      <div className="space-y-1">
        <Label_Shadcn_ className="text-xs text-foreground-light">Device name expression</Label_Shadcn_>
        <Input_Shadcn_
          value={deviceInfo.deviceNameExpression ?? ''}
          onChange={(event) =>
            onChangeDeviceInfo({ ...deviceInfo, deviceNameExpression: event.target.value })
          }
        />
      </div>
      <div className="space-y-1">
        <Label_Shadcn_ className="text-xs text-foreground-light">
          Device profile source
        </Label_Shadcn_>
        <Select_Shadcn_
          value={deviceInfo.deviceProfileExpressionSource ?? 'message'}
          onValueChange={(next) =>
            onChangeDeviceInfo({ ...deviceInfo, deviceProfileExpressionSource: next })
          }
        >
          <SelectTrigger_Shadcn_ size="small">
            <SelectValue_Shadcn_ />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {EXPRESSION_SOURCES.map((option) => (
              <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </div>
      <div className="space-y-1">
        <Label_Shadcn_ className="text-xs text-foreground-light">
          Device profile expression
        </Label_Shadcn_>
        <Input_Shadcn_
          value={deviceInfo.deviceProfileExpression ?? ''}
          onChange={(event) =>
            onChangeDeviceInfo({ ...deviceInfo, deviceProfileExpression: event.target.value })
          }
        />
      </div>
    </div>
  )

  return (
    <Tabs_Shadcn_ defaultValue="general" className="flex flex-col gap-4">
      <TabsList_Shadcn_ className="w-full gap-2">
        <TabsTrigger_Shadcn_ value="general">General</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="broker">Connect to broker</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="mapping">Data mapping</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="requests">Requests mapping</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="workers">Workers settings</TabsTrigger_Shadcn_>
      </TabsList_Shadcn_>

      <TabsContent_Shadcn_ value="general" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {generalContent ? <div className="md:col-span-2">{generalContent}</div> : null}
          <Card className="md:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Logs configuration</CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  id="mqtt-remote-logs"
                  checked={value.enableRemoteLogging ?? false}
                  onCheckedChange={(checked) => updateValue(['enableRemoteLogging'], checked)}
                />
                <Label_Shadcn_ htmlFor="mqtt-remote-logs" className="text-xs text-foreground-light">
                  Enable remote logs
                </Label_Shadcn_>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label_Shadcn_ className="text-xs text-foreground-light">Logging level</Label_Shadcn_>
                <Select_Shadcn_
                  value={value.logLevel ?? 'INFO'}
                  onValueChange={(next) => updateValue(['logLevel'], next)}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ placeholder="Select level" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {LOG_LEVELS.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch
              id="mqtt-send-only-changes"
              checked={broker.sendDataOnlyOnChange ?? false}
              onCheckedChange={(checked) => updateBroker({ sendDataOnlyOnChange: checked })}
            />
            <Label_Shadcn_ htmlFor="mqtt-send-only-changes" className="text-xs text-foreground-light">
              Send data only on change
            </Label_Shadcn_>
          </div>
        </div>
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ value="broker" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label_Shadcn_ htmlFor="mqtt-host" className="text-xs text-foreground-light">
              Host
            </Label_Shadcn_>
            <Input_Shadcn_
              id="mqtt-host"
              value={broker.host ?? ''}
              onChange={(event) => updateBroker({ host: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ htmlFor="mqtt-port" className="text-xs text-foreground-light">
              Port
            </Label_Shadcn_>
            <Input_Shadcn_
              id="mqtt-port"
              type="number"
              value={broker.port ?? 1883}
              onChange={(event) => updateBroker({ port: toNumber(event.target.value, 1883) })}
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ htmlFor="mqtt-version" className="text-xs text-foreground-light">
              MQTT version
            </Label_Shadcn_>
            <Select_Shadcn_
              value={String(versionValue)}
              onValueChange={(next) => updateBroker({ version: Number(next) })}
            >
              <SelectTrigger_Shadcn_ id="mqtt-version" size="small">
                <SelectValue_Shadcn_ placeholder="Select version" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {MQTT_VERSIONS.map((option) => (
                  <SelectItem_Shadcn_
                    key={option.value}
                    value={String(option.value)}
                    className="text-xs"
                  >
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ htmlFor="mqtt-client-id" className="text-xs text-foreground-light">
              Client ID
            </Label_Shadcn_>
            <Input_Shadcn_
              id="mqtt-client-id"
              value={broker.clientId ?? ''}
              onChange={(event) => updateBroker({ clientId: event.target.value })}
            />
          </div>
        </div>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <ButtonGroup className="inline-flex w-auto flex-row flex-wrap overflow-hidden rounded-md border border-control">
              {SECURITY_TYPES.map((option) => (
                <ButtonGroupItem
                  key={option.value}
                  type="button"
                  size="tiny"
                  onClick={() => updateSecurity({ type: option.value })}
                  className={`border-b-0 border-r last:border-r-0 ${
                    security.type === option.value
                      ? 'bg-surface-200 text-foreground'
                      : 'text-foreground-light'
                  }`}
                >
                  {option.label}
                </ButtonGroupItem>
              ))}
            </ButtonGroup>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {security.type === 'basic' && (
              <>
                <div className="space-y-1">
                  <Label_Shadcn_ htmlFor="mqtt-username" className="text-xs text-foreground-light">
                    Username
                  </Label_Shadcn_>
                  <Input_Shadcn_
                    id="mqtt-username"
                    value={security.username ?? ''}
                    onChange={(event) => updateSecurity({ username: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ htmlFor="mqtt-password" className="text-xs text-foreground-light">
                    Password
                  </Label_Shadcn_>
                  <Input_Shadcn_
                    id="mqtt-password"
                    type="password"
                    value={security.password ?? ''}
                    onChange={(event) => updateSecurity({ password: event.target.value })}
                  />
                </div>
              </>
            )}
            {security.type === 'certificates' && (
              <>
                <div className="space-y-1">
                  <Label_Shadcn_ htmlFor="mqtt-ca" className="text-xs text-foreground-light">
                    Path to CA certificate file
                  </Label_Shadcn_>
                  <Input_Shadcn_
                    id="mqtt-ca"
                    value={security.pathToCACert ?? ''}
                    onChange={(event) => updateSecurity({ pathToCACert: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ htmlFor="mqtt-client-cert" className="text-xs text-foreground-light">
                    Path to client certificate file
                  </Label_Shadcn_>
                  <Input_Shadcn_
                    id="mqtt-client-cert"
                    value={security.pathToClientCert ?? ''}
                    onChange={(event) => updateSecurity({ pathToClientCert: event.target.value })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label_Shadcn_ htmlFor="mqtt-private-key" className="text-xs text-foreground-light">
                    Path to private key file
                  </Label_Shadcn_>
                  <Input_Shadcn_
                    id="mqtt-private-key"
                    value={security.pathToPrivateKey ?? ''}
                    onChange={(event) => updateSecurity({ pathToPrivateKey: event.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Switch
                    id="mqtt-insecure"
                    checked={security.insecure ?? false}
                    onCheckedChange={(checked) => updateSecurity({ insecure: checked })}
                  />
                  <Label_Shadcn_ htmlFor="mqtt-insecure" className="text-xs text-foreground-light">
                    Insecure
                  </Label_Shadcn_>
                </div>
              </>
            )}
            {security.type === 'anonymous' && (
              <p className="text-xs text-foreground-light">No security credentials required.</p>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label_Shadcn_ htmlFor="mqtt-keep-alive" className="text-xs text-foreground-light">
              Keep alive (sec)
            </Label_Shadcn_>
            <Input_Shadcn_
              id="mqtt-keep-alive"
              type="number"
              value={broker.keepAlive ?? 60}
              onChange={(event) => updateBroker({ keepAlive: toNumber(event.target.value, 60) })}
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ htmlFor="mqtt-session-expiry" className="text-xs text-foreground-light">
              Session expiry interval
            </Label_Shadcn_>
            <Input_Shadcn_
              id="mqtt-session-expiry"
              type="number"
              value={broker.sessionExpiryInterval ?? 0}
              onChange={(event) =>
                updateBroker({ sessionExpiryInterval: toNumber(event.target.value, 0) })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="mqtt-clean-session"
              checked={broker.cleanSession ?? true}
              onCheckedChange={(checked) => updateBroker({ cleanSession: checked })}
            />
            <Label_Shadcn_ htmlFor="mqtt-clean-session" className="text-xs text-foreground-light">
              Clean session
            </Label_Shadcn_>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="mqtt-clean-start"
              checked={broker.cleanStart ?? true}
              onCheckedChange={(checked) => updateBroker({ cleanStart: checked })}
            />
            <Label_Shadcn_ htmlFor="mqtt-clean-start" className="text-xs text-foreground-light">
              Clean start
            </Label_Shadcn_>
          </div>
        </div>
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ value="mapping" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {editingMappingIndex === null ? (
            <>
              <div className="min-w-[220px] flex-1">
                <Input_Shadcn_
                  size="tiny"
                  placeholder="Search by topic filter"
                  value={mappingSearch}
                  onChange={(event) => setMappingSearch(event.target.value)}
                />
              </div>
              <Button
                size="tiny"
                type="default"
                onClick={() => {
                  const next = [...mapping, createMapping()]
                  updateValue(['mapping'], next)
                  setEditingMappingIndex(next.length - 1)
                }}
              >
                Add
              </Button>
            </>
          ) : (
            <Button size="tiny" type="default" onClick={() => setEditingMappingIndex(null)}>
              Back
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {editingMappingIndex === null ? (
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Topic filter</TableHead>
                  <TableHead>QoS</TableHead>
                  <TableHead>Payload type</TableHead>
                  <TableHead className="w-[84px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mapping.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-foreground-light">
                      No mappings configured.
                    </TableCell>
                  </TableRow>
                )}
                {mapping
                  .map((item, index) => ({ item, index }))
                  .filter(({ item }) => {
                    if (!mappingSearch.trim()) return true
                    const topic = String(item.topicFilter ?? '').toLowerCase()
                    return topic.includes(mappingSearch.trim().toLowerCase())
                  })
                  .map(({ item, index }) => (
                  <TableRow key={`mapping-row-${index}`} className="h-8">
                    <TableCell className="py-1">{item.topicFilter || '-'}</TableCell>
                    <TableCell className="py-1">{item.subscriptionQos ?? '-'}</TableCell>
                    <TableCell className="py-1">{item.converter?.type ?? 'json'}</TableCell>
                    <TableCell className="flex items-center justify-end gap-2 py-1">
                      <Button_Shadcn_
                        size="sm"
                        variant="ghost"
                        className="px-1"
                        onClick={() => setEditingMappingIndex(index)}
                      >
                        <Edit2 size={12} />
                      </Button_Shadcn_>
                      <Button_Shadcn_
                        size="sm"
                        variant="ghost"
                        className="px-1"
                        onClick={() => {
                          const next = mapping.filter((_, i) => i !== index)
                          updateValue(['mapping'], next)
                        }}
                      >
                        <Trash size={12} />
                      </Button_Shadcn_>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            (() => {
              const index = editingMappingIndex
              const item = mapping[index] ?? createMapping()
              const converter = item.converter ?? createConverter('json')
              const deviceInfo = converter.deviceInfo ?? createDeviceInfo()
              const attributes = ensureArray(converter.attributes)
              const timeseries = ensureArray(converter.timeseries)

              return (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Topic filter</Label_Shadcn_>
                      <Input_Shadcn_
                        value={item.topicFilter ?? ''}
                        onChange={(event) =>
                          updateMappingItem(index, { topicFilter: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Subscription QoS</Label_Shadcn_>
                      <Input_Shadcn_
                        type="number"
                        value={item.subscriptionQos ?? 1}
                        onChange={(event) =>
                          updateMappingItem(index, {
                            subscriptionQos: toNumber(event.target.value, 1),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Converter type</Label_Shadcn_>
                      <Select_Shadcn_
                        value={converter.type ?? 'json'}
                        onValueChange={(next) => updateConverter(index, createConverter(next))}
                      >
                        <SelectTrigger_Shadcn_ size="small">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {CONVERTER_TYPES.map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                  </div>
                  {converter.type === 'custom' ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 md:col-span-2">
                      <div className="space-y-1">
                        <Label_Shadcn_ className="text-xs text-foreground-light">Extension</Label_Shadcn_>
                        <Input_Shadcn_
                          value={converter.extension ?? ''}
                          onChange={(event) =>
                            updateConverter(index, { extension: event.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={converter.sharedGlobal ?? false}
                          onCheckedChange={(checked) =>
                            updateConverter(index, { sharedGlobal: checked })
                          }
                        />
                        <Label_Shadcn_ className="text-xs text-foreground-light">
                          Shared globally
                        </Label_Shadcn_>
                      </div>
                      <div className="space-y-1">
                        <Label_Shadcn_ className="text-xs text-foreground-light">Shared ID</Label_Shadcn_>
                        <Input_Shadcn_
                          value={converter.sharedId ?? ''}
                          onChange={(event) =>
                            updateConverter(index, { sharedId: event.target.value })
                          }
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label_Shadcn_ className="text-xs text-foreground-light">Extension config</Label_Shadcn_>
                        <div className="h-[200px] overflow-hidden rounded border border-muted bg-surface-200">
                          <CodeEditor
                            id={`mqtt-custom-config-${index}`}
                            language="json"
                            value={JSON.stringify(converter.extensionConfig ?? {}, null, 2)}
                            onInputChange={(next) => {
                              try {
                                const parsed = JSON.parse(next ?? '{}')
                                updateConverter(index, { extensionConfig: parsed })
                              } catch (_) {
                                // ignore invalid
                              }
                            }}
                            options={{
                              wordWrap: 'on',
                              folding: true,
                              foldingStrategy: 'indentation',
                              showFoldingControls: 'always',
                              lineNumbers: 'on',
                              glyphMargin: true,
                              foldingHighlight: true,
                              lineDecorationsWidth: 6,
                              lineNumbersMinChars: 1,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-4 md:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Device info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {renderDeviceInfo(deviceInfo, (next) =>
                            updateConverter(index, { deviceInfo: next })
                          )}
                        </CardContent>
                      </Card>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={converter.sendDataOnlyOnChange ?? false}
                              onCheckedChange={(checked) =>
                                updateConverter(index, { sendDataOnlyOnChange: checked })
                              }
                            />
                            <Label_Shadcn_ className="text-xs text-foreground-light">
                              Send data only on change
                            </Label_Shadcn_>
                          </div>
                          <div className="space-y-1">
                            <Label_Shadcn_ className="text-xs text-foreground-light">Timeout (ms)</Label_Shadcn_>
                            <Input_Shadcn_
                              type="number"
                              value={converter.timeout ?? 60000}
                              onChange={(event) =>
                                updateConverter(index, { timeout: toNumber(event.target.value, 60000) })
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={converter.useReceivedTs ?? false}
                              onCheckedChange={(checked) =>
                                updateConverter(index, { useReceivedTs: checked })
                              }
                            />
                            <Label_Shadcn_ className="text-xs text-foreground-light">
                              Use received timestamp
                            </Label_Shadcn_>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={converter.useEval ?? false}
                              onCheckedChange={(checked) => updateConverter(index, { useEval: checked })}
                            />
                            <Label_Shadcn_ className="text-xs text-foreground-light">Use eval</Label_Shadcn_>
                          </div>
                        </div>
                      <div className="space-y-2">
                        <SectionHeader
                          title="Attributes"
                          onAdd={() =>
                            updateConverterList(index, 'attributes', [
                              ...attributes,
                              createAttributeEntry(),
                            ])
                          }
                        />
                        <KeyValueTableEditor
                          entries={attributes}
                          emptyText="No attributes configured."
                          onChange={(next) => updateConverterList(index, 'attributes', next)}
                          showKeySource
                        />
                      </div>
                      <div className="space-y-2">
                        <SectionHeader
                          title="Time series"
                          onAdd={() =>
                            updateConverterList(index, 'timeseries', [
                              ...timeseries,
                              createTimeseriesEntry(),
                            ])
                          }
                        />
                        <TimeSeriesTableEditor
                          entries={timeseries}
                          emptyText="No time series configured."
                          onChange={(next) => updateConverterList(index, 'timeseries', next)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })()
          )}
        </div>
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ value="requests" className="space-y-4">
        <div className="flex items-center justify-between">
          {editingRequest === null ? (
            <div className="flex flex-1 items-center gap-2">
              <Input_Shadcn_
                size="tiny"
                placeholder="Search by details"
                value={requestsSearch}
                onChange={(event) => setRequestsSearch(event.target.value)}
                className="flex-1"
              />
              <Button size="tiny" type="default" onClick={() => addRequestByKind('connect', true)}>
                Add
              </Button>
            </div>
          ) : (
            <Button size="tiny" type="default" onClick={() => setEditingRequest(null)}>
              Back
            </Button>
          )}
        </div>

        {editingRequest === null ? (
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[84px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-sm text-foreground-light">
                    No request mappings configured.
                  </TableCell>
                </TableRow>
              )}
              {requestRows
                .filter((row) => {
                  if (!requestsSearch.trim()) return true
                  return row.details.toLowerCase().includes(requestsSearch.trim().toLowerCase())
                })
                .map((row) => (
                  <TableRow key={`request-${row.kind}-${row.index}`} className="h-8">
                    <TableCell className="py-1">{row.typeLabel}</TableCell>
                    <TableCell className="py-1">{row.details}</TableCell>
                    <TableCell className="flex items-center justify-end gap-2 py-1">
                      <Button_Shadcn_
                        size="sm"
                        variant="ghost"
                        className="px-1"
                        onClick={() => setEditingRequest({ kind: row.kind, index: row.index, isNew: false })}
                      >
                        <Edit2 size={12} />
                      </Button_Shadcn_>
                      <Button_Shadcn_
                        size="sm"
                        variant="ghost"
                        className="px-1"
                        onClick={() => removeRequestByKind(row.kind, row.index)}
                      >
                        <Trash size={12} />
                      </Button_Shadcn_>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          (() => {
            const { kind, index, isNew } = editingRequest
            const typeSelector = isNew ? (
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
                <Select_Shadcn_ value={kind} onValueChange={switchEditingRequestKind}>
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {REQUEST_KIND_OPTIONS.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
            ) : null
            if (kind === 'connect') {
              const request = connectRequests[index] ?? createConnectRequest()
              return (
                <div className="space-y-3">
                  {typeSelector}
                  <div className="space-y-1">
                    <Label_Shadcn_ className="text-xs text-foreground-light">Topic filter</Label_Shadcn_>
                    <Input_Shadcn_
                      value={request.topicFilter ?? ''}
                      onChange={(event) => {
                        const next = [...connectRequests]
                        next[index] = { ...request, topicFilter: event.target.value }
                        updateValue(['requestsMapping', 'connectRequests'], next)
                      }}
                    />
                  </div>
                  {renderDeviceInfo(request.deviceInfo ?? createDeviceInfo(), (next) => {
                    const updated = [...connectRequests]
                    updated[index] = { ...request, deviceInfo: next }
                    updateValue(['requestsMapping', 'connectRequests'], updated)
                  })}
                </div>
              )
            }

            if (kind === 'disconnect') {
              const request = disconnectRequests[index] ?? createConnectRequest()
              return (
                <div className="space-y-3">
                  {typeSelector}
                  <div className="space-y-1">
                    <Label_Shadcn_ className="text-xs text-foreground-light">Topic filter</Label_Shadcn_>
                    <Input_Shadcn_
                      value={request.topicFilter ?? ''}
                      onChange={(event) => {
                        const next = [...disconnectRequests]
                        next[index] = { ...request, topicFilter: event.target.value }
                        updateValue(['requestsMapping', 'disconnectRequests'], next)
                      }}
                    />
                  </div>
                  {renderDeviceInfo(request.deviceInfo ?? createDeviceInfo(), (next) => {
                    const updated = [...disconnectRequests]
                    updated[index] = { ...request, deviceInfo: next }
                    updateValue(['requestsMapping', 'disconnectRequests'], updated)
                  })}
                </div>
              )
            }

            if (kind === 'attributeRequest') {
              const request = attributeRequests[index] ?? createAttributeRequest()
              return (
                <div className="space-y-3">
                  {typeSelector}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-2">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Topic filter</Label_Shadcn_>
                      <Input_Shadcn_
                        value={request.topicFilter ?? ''}
                        onChange={(event) => {
                          const next = [...attributeRequests]
                          next[index] = { ...request, topicFilter: event.target.value }
                          updateValue(['requestsMapping', 'attributeRequests'], next)
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Input request parsing</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label_Shadcn_ className="text-xs text-foreground-light">
                            Device name source
                          </Label_Shadcn_>
                          <Select_Shadcn_
                            value={request.deviceInfo?.deviceNameExpressionSource ?? 'message'}
                            onValueChange={(next) => {
                              const updated = [...attributeRequests]
                              updated[index] = {
                                ...request,
                                deviceInfo: {
                                  ...(request.deviceInfo ?? createDeviceInfo()),
                                  deviceNameExpressionSource: next,
                                },
                              }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          >
                            <SelectTrigger_Shadcn_ size="small">
                              <SelectValue_Shadcn_ />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              {EXPRESSION_SOURCES.map((option) => (
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
                          <Label_Shadcn_ className="text-xs text-foreground-light">
                            Device name expression
                          </Label_Shadcn_>
                          <Input_Shadcn_
                            value={request.deviceInfo?.deviceNameExpression ?? ''}
                            onChange={(event) => {
                              const updated = [...attributeRequests]
                              updated[index] = {
                                ...request,
                                deviceInfo: {
                                  ...(request.deviceInfo ?? createDeviceInfo()),
                                  deviceNameExpression: event.target.value,
                                },
                              }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label_Shadcn_ className="text-xs text-foreground-light">
                            Device profile source
                          </Label_Shadcn_>
                          <Select_Shadcn_
                            value={request.deviceInfo?.deviceProfileExpressionSource ?? 'message'}
                            onValueChange={(next) => {
                              const updated = [...attributeRequests]
                              updated[index] = {
                                ...request,
                                deviceInfo: {
                                  ...(request.deviceInfo ?? createDeviceInfo()),
                                  deviceProfileExpressionSource: next,
                                },
                              }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          >
                            <SelectTrigger_Shadcn_ size="small">
                              <SelectValue_Shadcn_ />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              {EXPRESSION_SOURCES.map((option) => (
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
                          <Label_Shadcn_ className="text-xs text-foreground-light">
                            Device profile expression
                          </Label_Shadcn_>
                          <Input_Shadcn_
                            value={request.deviceInfo?.deviceProfileExpression ?? ''}
                            onChange={(event) => {
                              const updated = [...attributeRequests]
                              updated[index] = {
                                ...request,
                                deviceInfo: {
                                  ...(request.deviceInfo ?? createDeviceInfo()),
                                  deviceProfileExpression: event.target.value,
                                },
                              }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label_Shadcn_ className="text-xs text-foreground-light">
                            Attribute name source
                          </Label_Shadcn_>
                          <Select_Shadcn_
                            value={request.attributeNameExpressionSource ?? 'message'}
                            onValueChange={(next) => {
                              const updated = [...attributeRequests]
                              updated[index] = { ...request, attributeNameExpressionSource: next }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          >
                            <SelectTrigger_Shadcn_ size="small">
                              <SelectValue_Shadcn_ />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              {EXPRESSION_SOURCES.map((option) => (
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
                          <Label_Shadcn_ className="text-xs text-foreground-light">
                            Attribute name expression
                          </Label_Shadcn_>
                          <Input_Shadcn_
                            value={request.attributeNameExpression ?? ''}
                            onChange={(event) => {
                              const updated = [...attributeRequests]
                              updated[index] = { ...request, attributeNameExpression: event.target.value }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Output request processing</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label_Shadcn_ className="text-xs text-foreground-light">
                            Response value expression
                          </Label_Shadcn_>
                          <Input_Shadcn_
                            value={request.valueExpression ?? ''}
                            onChange={(event) => {
                              const updated = [...attributeRequests]
                              updated[index] = { ...request, valueExpression: event.target.value }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label_Shadcn_ className="text-xs text-foreground-light">
                            Response topic expression
                          </Label_Shadcn_>
                          <Input_Shadcn_
                            value={request.topicExpression ?? ''}
                            onChange={(event) => {
                              const updated = [...attributeRequests]
                              updated[index] = { ...request, topicExpression: event.target.value }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={request.retain ?? false}
                            onCheckedChange={(checked) => {
                              const updated = [...attributeRequests]
                              updated[index] = { ...request, retain: checked }
                              updateValue(['requestsMapping', 'attributeRequests'], updated)
                            }}
                          />
                          <Label_Shadcn_ className="text-xs text-foreground-light">Retain</Label_Shadcn_>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            }

            if (kind === 'attributeUpdate') {
              const update = attributeUpdates[index] ?? createAttributeUpdate()
              return (
                <div className="grid gap-3 md:grid-cols-2">
                  {typeSelector && <div className="md:col-span-2">{typeSelector}</div>}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={update.retain ?? true}
                      onCheckedChange={(checked) => {
                        const next = [...attributeUpdates]
                        next[index] = { ...update, retain: checked }
                        updateValue(['requestsMapping', 'attributeUpdates'], next)
                      }}
                    />
                    <Label_Shadcn_ className="text-xs text-foreground-light">Retain</Label_Shadcn_>
                  </div>
                  <div className="space-y-1">
                    <Label_Shadcn_ className="text-xs text-foreground-light">Device name filter</Label_Shadcn_>
                    <Input_Shadcn_
                      value={update.deviceNameFilter ?? ''}
                      onChange={(event) => {
                        const next = [...attributeUpdates]
                        next[index] = { ...update, deviceNameFilter: event.target.value }
                        updateValue(['requestsMapping', 'attributeUpdates'], next)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label_Shadcn_ className="text-xs text-foreground-light">Attribute filter</Label_Shadcn_>
                    <Input_Shadcn_
                      value={update.attributeFilter ?? ''}
                      onChange={(event) => {
                        const next = [...attributeUpdates]
                        next[index] = { ...update, attributeFilter: event.target.value }
                        updateValue(['requestsMapping', 'attributeUpdates'], next)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label_Shadcn_ className="text-xs text-foreground-light">Topic expression</Label_Shadcn_>
                    <Input_Shadcn_
                      value={update.topicExpression ?? ''}
                      onChange={(event) => {
                        const next = [...attributeUpdates]
                        next[index] = { ...update, topicExpression: event.target.value }
                        updateValue(['requestsMapping', 'attributeUpdates'], next)
                      }}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label_Shadcn_ className="text-xs text-foreground-light">Value expression</Label_Shadcn_>
                    <Input_Shadcn_
                      value={update.valueExpression ?? ''}
                      onChange={(event) => {
                        const next = [...attributeUpdates]
                        next[index] = { ...update, valueExpression: event.target.value }
                        updateValue(['requestsMapping', 'attributeUpdates'], next)
                      }}
                    />
                  </div>
                </div>
              )
            }

            const rpc = serverSideRpc[index] ?? createRpcRequest()
            return (
              <div className="grid gap-3 md:grid-cols-2">
                {typeSelector && <div className="md:col-span-2">{typeSelector}</div>}
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
                  <Select_Shadcn_
                    value={rpc.type ?? 'twoWay'}
                    onValueChange={(next) => {
                      const nextEntries = [...serverSideRpc]
                      nextEntries[index] = { ...rpc, type: next }
                      updateValue(['requestsMapping', 'serverSideRpc'], nextEntries)
                    }}
                  >
                    <SelectTrigger_Shadcn_ size="small">
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {RPC_TYPES.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Device name filter</Label_Shadcn_>
                  <Input_Shadcn_
                    value={rpc.deviceNameFilter ?? ''}
                    onChange={(event) => {
                      const nextEntries = [...serverSideRpc]
                      nextEntries[index] = { ...rpc, deviceNameFilter: event.target.value }
                      updateValue(['requestsMapping', 'serverSideRpc'], nextEntries)
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Method filter</Label_Shadcn_>
                  <Input_Shadcn_
                    value={rpc.methodFilter ?? ''}
                    onChange={(event) => {
                      const nextEntries = [...serverSideRpc]
                      nextEntries[index] = { ...rpc, methodFilter: event.target.value }
                      updateValue(['requestsMapping', 'serverSideRpc'], nextEntries)
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Request topic expression</Label_Shadcn_>
                  <Input_Shadcn_
                    value={rpc.requestTopicExpression ?? ''}
                    onChange={(event) => {
                      const nextEntries = [...serverSideRpc]
                      nextEntries[index] = { ...rpc, requestTopicExpression: event.target.value }
                      updateValue(['requestsMapping', 'serverSideRpc'], nextEntries)
                    }}
                  />
                </div>
                {rpc.type === 'twoWay' && (
                  <>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">
                        Response topic expression
                      </Label_Shadcn_>
                      <Input_Shadcn_
                        value={rpc.responseTopicExpression ?? ''}
                        onChange={(event) => {
                          const nextEntries = [...serverSideRpc]
                          nextEntries[index] = { ...rpc, responseTopicExpression: event.target.value }
                          updateValue(['requestsMapping', 'serverSideRpc'], nextEntries)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Response topic QoS</Label_Shadcn_>
                      <Input_Shadcn_
                        type="number"
                        value={rpc.responseTopicQoS ?? 1}
                        onChange={(event) => {
                          const nextEntries = [...serverSideRpc]
                          nextEntries[index] = {
                            ...rpc,
                            responseTopicQoS: toNumber(event.target.value, 1),
                          }
                          updateValue(['requestsMapping', 'serverSideRpc'], nextEntries)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">
                        Response timeout (ms)
                      </Label_Shadcn_>
                      <Input_Shadcn_
                        type="number"
                        value={rpc.responseTimeout ?? 10000}
                        onChange={(event) => {
                          const nextEntries = [...serverSideRpc]
                          nextEntries[index] = {
                            ...rpc,
                            responseTimeout: toNumber(event.target.value, 10000),
                          }
                          updateValue(['requestsMapping', 'serverSideRpc'], nextEntries)
                        }}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1 md:col-span-2">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Value expression</Label_Shadcn_>
                  <Input_Shadcn_
                    value={rpc.valueExpression ?? ''}
                    onChange={(event) => {
                      const nextEntries = [...serverSideRpc]
                      nextEntries[index] = { ...rpc, valueExpression: event.target.value }
                      updateValue(['requestsMapping', 'serverSideRpc'], nextEntries)
                    }}
                  />
                </div>
              </div>
            )
          })()
        )}
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ value="workers" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Workers settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="mqtt-max-message-queue" className="text-xs text-foreground-light">
                Max message queue
              </Label_Shadcn_>
              <Input_Shadcn_
                id="mqtt-max-message-queue"
                type="number"
                value={broker.maxMessageQueue ?? 1000000000}
                onChange={(event) =>
                  updateBroker({ maxMessageQueue: toNumber(event.target.value, 1000000000) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="mqtt-max-processing-queue" className="text-xs text-foreground-light">
                Max processing message queue
              </Label_Shadcn_>
              <Input_Shadcn_
                id="mqtt-max-processing-queue"
                type="number"
                value={broker.maxProcessingMessageQueue ?? 1000000000}
                onChange={(event) =>
                  updateBroker({ maxProcessingMessageQueue: toNumber(event.target.value, 1000000000) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="mqtt-max-messages" className="text-xs text-foreground-light">
                Max message number per worker
              </Label_Shadcn_>
              <Input_Shadcn_
                id="mqtt-max-messages"
                type="number"
                value={broker.maxMessageNumberPerWorker ?? 10}
                onChange={(event) =>
                  updateBroker({ maxMessageNumberPerWorker: toNumber(event.target.value, 10) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="mqtt-max-workers" className="text-xs text-foreground-light">
                Max number of workers
              </Label_Shadcn_>
              <Input_Shadcn_
                id="mqtt-max-workers"
                type="number"
                value={broker.maxNumberOfWorkers ?? 100}
                onChange={(event) =>
                  updateBroker({ maxNumberOfWorkers: toNumber(event.target.value, 100) })
                }
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}

export default MqttConnectorForm
