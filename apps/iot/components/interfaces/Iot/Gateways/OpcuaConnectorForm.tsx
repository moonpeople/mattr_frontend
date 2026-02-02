import { useMemo, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

import {
  Button,
  Button_Shadcn_,
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
} from 'ui'

type OpcuaConnectorFormProps = {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  generalContent?: ReactNode
}

const SECURITY_POLICIES = [
  { label: 'Basic128Rsa15', value: 'Basic128Rsa15' },
  { label: 'Basic256', value: 'Basic256' },
  { label: 'Basic256Sha256', value: 'Basic256Sha256' },
]

const IDENTITY_TYPES = [
  { label: 'Anonymous', value: 'anonymous' },
  { label: 'Basic', value: 'basic' },
  { label: 'Certificates', value: 'certificates' },
]

const OPCUA_MAPPING_TYPES = [
  { label: 'Path', value: 'path' },
  { label: 'Identifier', value: 'identifier' },
  { label: 'Constant', value: 'constant' },
]

const DEVICE_SOURCE_OPTIONS = [
  { label: 'Path', value: 'path' },
  { label: 'Identifier', value: 'identifier' },
  { label: 'Constant', value: 'constant' },
]

const ARGUMENT_TYPES = [
  { label: 'String', value: 'string' },
  { label: 'Integer', value: 'integer' },
  { label: 'Double', value: 'double' },
  { label: 'Boolean', value: 'boolean' },
]

const MESSAGE_SECURITY_MODES = [
  { label: 'None', value: 'None' },
  { label: 'Sign', value: 'Sign' },
  { label: 'SignAndEncrypt', value: 'SignAndEncrypt' },
]

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const cloneValue = (value: Record<string, unknown>): Record<string, unknown> =>
  JSON.parse(JSON.stringify(value ?? {})) as Record<string, unknown>

const getValue = (source: Record<string, unknown>, path: Array<string | number>) => {
  let cursor: any = source
  for (const key of path) {
    if (cursor == null) return undefined
    cursor = cursor[key as any]
  }
  return cursor
}

const setValue = (
  source: Record<string, unknown>,
  path: Array<string | number>,
  nextValue: unknown
) => {
  const next = cloneValue(source)
  let cursor: any = next
  for (let idx = 0; idx < path.length - 1; idx += 1) {
    const key = path[idx]
    if (cursor[key as any] == null || typeof cursor[key as any] !== 'object') {
      cursor[key as any] = {}
    }
    cursor = cursor[key as any]
  }
  cursor[path[path.length - 1] as any] = nextValue
  return next
}

const createMapping = () => ({
  deviceNodeSource: 'path',
  deviceNodePattern: '',
  deviceInfo: {
    deviceNameExpression: '',
    deviceNameExpressionSource: 'path',
    deviceProfileExpression: '',
    deviceProfileExpressionSource: 'constant',
  },
  attributes: [],
  timeseries: [],
  rpc_methods: [],
  attributes_updates: [],
})

const createKeyValue = () => ({
  key: '',
  type: 'path',
  value: '',
})

const createRpcMethod = () => ({
  method: '',
  arguments: [],
})

const createRpcArgument = () => ({
  type: 'integer',
  value: '',
})

const KeyValueEditor = ({
  title,
  entries,
  onChange,
}: {
  title: string
  entries: Array<{ key: string; type: string; value: string }>
  onChange: (next: Array<{ key: string; type: string; value: string }>) => void
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-foreground-light">{title}</p>
      <Button size="tiny" type="default" onClick={() => onChange([...entries, createKeyValue()])}>
        Add
      </Button>
    </div>
    {entries.length === 0 && <p className="text-xs text-foreground-light">No entries yet.</p>}
    {entries.map((entry, idx) => (
      <div key={`${title}-row-${idx}`} className="flex items-end gap-x-2">
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
        <div className="w-40 space-y-1">
          <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
          <Select_Shadcn_
            value={entry.type ?? 'path'}
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
              {OPCUA_MAPPING_TYPES.map((option) => (
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

const RpcMethodsEditor = ({
  entries,
  onChange,
}: {
  entries: Array<{ method: string; arguments: Array<{ type: string; value: string | number }> }>
  onChange: (
    next: Array<{ method: string; arguments: Array<{ type: string; value: string | number }> }>
  ) => void
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-foreground-light">RPC methods</p>
      <Button size="tiny" type="default" onClick={() => onChange([...entries, createRpcMethod()])}>
        Add
      </Button>
    </div>
    {entries.length === 0 && <p className="text-xs text-foreground-light">No RPC methods yet.</p>}
    {entries.map((entry, idx) => (
      <div key={`rpc-method-${idx}`} className="rounded border border-muted p-3 space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Method</Label_Shadcn_>
            <Input_Shadcn_
              value={entry.method ?? ''}
              onChange={(event) => {
                const next = [...entries]
                next[idx] = { ...entry, method: event.target.value }
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground-light">Arguments</p>
          <Button
            size="tiny"
            type="default"
            onClick={() => {
              const next = [...entries]
              const args = ensureArray(entry.arguments)
              next[idx] = { ...entry, arguments: [...args, createRpcArgument()] }
              onChange(next)
            }}
          >
            Add argument
          </Button>
        </div>
        {ensureArray(entry.arguments).length === 0 && (
          <p className="text-xs text-foreground-light">No arguments yet.</p>
        )}
        {ensureArray(entry.arguments).map((arg, argIdx) => (
          <div key={`rpc-arg-${idx}-${argIdx}`} className="flex items-end gap-2">
            <div className="w-40 space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
              <Select_Shadcn_
                value={arg.type ?? 'integer'}
                onValueChange={(nextType) => {
                  const next = [...entries]
                  const args = ensureArray(entry.arguments)
                  args[argIdx] = { ...args[argIdx], type: nextType }
                  next[idx] = { ...entry, arguments: args }
                  onChange(next)
                }}
              >
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {ARGUMENT_TYPES.map((option) => (
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
                value={arg.value ?? ''}
                onChange={(event) => {
                  const next = [...entries]
                  const args = ensureArray(entry.arguments)
                  args[argIdx] = { ...args[argIdx], value: event.target.value }
                  next[idx] = { ...entry, arguments: args }
                  onChange(next)
                }}
              />
            </div>
            <Button_Shadcn_
              size="sm"
              variant="ghost"
              className="px-1"
              onClick={() => {
                const next = [...entries]
                const args = ensureArray(entry.arguments).filter((_, index) => index !== argIdx)
                next[idx] = { ...entry, arguments: args }
                onChange(next)
              }}
            >
              <X size={14} />
            </Button_Shadcn_>
          </div>
        ))}
      </div>
    ))}
  </div>
)

const OpcuaConnectorForm = ({ value, onChange, generalContent }: OpcuaConnectorFormProps) => {
  const server = (value.server ?? {}) as Record<string, unknown>
  const identity = (server.identity ?? {}) as Record<string, unknown>
  const mapping = ensureArray<Record<string, unknown>>(value.mapping)
  const [editingMappingIndex, setEditingMappingIndex] = useState<number | null>(null)
  const [draftMapping, setDraftMapping] = useState<Record<string, unknown> | null>(null)

  const activeMapping = useMemo(() => {
    if (editingMappingIndex == null) return null
    if (editingMappingIndex === -1) return draftMapping ?? createMapping()
    return mapping[editingMappingIndex] ?? createMapping()
  }, [editingMappingIndex, draftMapping, mapping])

  const updateServer = (path: Array<string | number>, nextValue: unknown) => {
    const next = setValue(value, ['server', ...path], nextValue)
    onChange(next)
  }

  const updateMapping = (nextMapping: Record<string, unknown>) => {
    if (editingMappingIndex == null) return
    if (editingMappingIndex === -1) {
      setDraftMapping(nextMapping)
      return
    }
    const nextMappings = [...mapping]
    nextMappings[editingMappingIndex] = nextMapping
    onChange({ ...value, mapping: nextMappings })
  }

  const saveMapping = () => {
    if (editingMappingIndex == null) return
    if (editingMappingIndex === -1) {
      const nextMappings = [...mapping, draftMapping ?? createMapping()]
      onChange({ ...value, mapping: nextMappings })
    }
    setEditingMappingIndex(null)
    setDraftMapping(null)
  }

  const cancelMappingEdit = () => {
    setEditingMappingIndex(null)
    setDraftMapping(null)
  }

  return (
    <Tabs_Shadcn_ defaultValue="general" className="flex h-full min-h-0 flex-col gap-4">
      <TabsList_Shadcn_ className="w-full justify-start gap-2">
        <TabsTrigger_Shadcn_ value="general">General</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="server">Server</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="mapping">Data mapping</TabsTrigger_Shadcn_>
      </TabsList_Shadcn_>

      <TabsContent_Shadcn_ value="general" className="mt-0 space-y-4">
        {generalContent}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Logs configuration</CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(value.enableRemoteLogging ?? true)}
                onCheckedChange={(checked) => onChange({ ...value, enableRemoteLogging: checked })}
              />
              <span className="text-xs text-foreground-light">Enable remote logs</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Logging level</Label_Shadcn_>
              <Select_Shadcn_
                value={(value.logLevel as string) ?? 'INFO'}
                onValueChange={(nextLevel) => onChange({ ...value, logLevel: nextLevel })}
              >
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {['NONE', 'CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'].map((level) => (
                    <SelectItem_Shadcn_ key={level} value={level} className="text-xs">
                      {level}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
          </CardContent>
        </Card>
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ value="server" className="mt-0 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <Label_Shadcn_ className="text-xs text-foreground-light">Server URL</Label_Shadcn_>
            <Input_Shadcn_
              value={(server.url as string) ?? ''}
              onChange={(event) => updateServer(['url'], event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Application name</Label_Shadcn_>
            <Input_Shadcn_
              value={(server.applicationName as string) ?? ''}
              onChange={(event) => updateServer(['applicationName'], event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Application URI</Label_Shadcn_>
            <Input_Shadcn_
              value={(server.applicationUri as string) ?? ''}
              onChange={(event) => updateServer(['applicationUri'], event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Timeout (ms)</Label_Shadcn_>
            <Input_Shadcn_
              value={String(server.timeoutInMillis ?? '')}
              onChange={(event) =>
                updateServer(['timeoutInMillis'], Number(event.target.value || 0))
              }
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Scan period (sec)</Label_Shadcn_>
            <Input_Shadcn_
              value={String(
                server.scanPeriodInMillis != null
                  ? Number(server.scanPeriodInMillis) / 1000
                  : ''
              )}
              onChange={(event) =>
                updateServer(
                  ['scanPeriodInMillis'],
                  Number(event.target.value || 0) * 1000
                )
              }
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Poll period (ms)</Label_Shadcn_>
            <Input_Shadcn_
              value={String(server.pollPeriodInMillis ?? '')}
              onChange={(event) =>
                updateServer(['pollPeriodInMillis'], Number(event.target.value || 0))
              }
            />
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Select_Shadcn_
              value={(server.security as string) ?? 'Basic128Rsa15'}
              onValueChange={(nextValue) => updateServer(['security'], nextValue)}
            >
              <SelectTrigger_Shadcn_ size="small" className="w-[200px]">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {SECURITY_POLICIES.map((option) => (
                  <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Identity</Label_Shadcn_>
              <Select_Shadcn_
                value={(identity.type as string) ?? 'anonymous'}
                onValueChange={(nextValue) => updateServer(['identity', 'type'], nextValue)}
              >
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {IDENTITY_TYPES.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            {identity.type === 'basic' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Username</Label_Shadcn_>
                  <Input_Shadcn_
                    value={(identity.username as string) ?? ''}
                    onChange={(event) => updateServer(['identity', 'username'], event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Password</Label_Shadcn_>
                  <Input_Shadcn_
                    type="password"
                    value={(identity.password as string) ?? ''}
                    onChange={(event) => updateServer(['identity', 'password'], event.target.value)}
                  />
                </div>
              </div>
            )}
            {identity.type === 'certificates' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Message security mode</Label_Shadcn_>
                  <Select_Shadcn_
                    value={(identity.mode as string) ?? 'SignAndEncrypt'}
                    onValueChange={(nextValue) => updateServer(['identity', 'mode'], nextValue)}
                  >
                    <SelectTrigger_Shadcn_ size="small">
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {MESSAGE_SECURITY_MODES.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Path to CA certificate file</Label_Shadcn_>
                  <Input_Shadcn_
                    value={(identity.pathToCACert as string) ?? ''}
                    onChange={(event) =>
                      updateServer(['identity', 'pathToCACert'], event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label_Shadcn_ className="text-xs text-foreground-light">
                    Path to client certificate file
                  </Label_Shadcn_>
                  <Input_Shadcn_
                    value={(identity.pathToClientCert as string) ?? ''}
                    onChange={(event) =>
                      updateServer(['identity', 'pathToClientCert'], event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label_Shadcn_ className="text-xs text-foreground-light">
                    Path to private key file
                  </Label_Shadcn_>
                  <Input_Shadcn_
                    value={(identity.pathToPrivateKey as string) ?? ''}
                    onChange={(event) =>
                      updateServer(['identity', 'pathToPrivateKey'], event.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Advanced settings</CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(server.enableSubscriptions ?? true)}
                onCheckedChange={(checked) => updateServer(['enableSubscriptions'], checked)}
              />
              <span className="text-xs text-foreground-light">Enable subscriptions</span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Subscription check period (ms)</Label_Shadcn_>
              <Input_Shadcn_
                value={String(server.subCheckPeriodInMillis ?? '')}
                onChange={(event) =>
                  updateServer(['subCheckPeriodInMillis'], Number(event.target.value || 0))
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Session timeout (ms)</Label_Shadcn_>
              <Input_Shadcn_
                value={String(server.sessionTimeoutInMillis ?? '')}
                onChange={(event) =>
                  updateServer(['sessionTimeoutInMillis'], Number(event.target.value || 0))
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Sub data max batch size</Label_Shadcn_>
              <Input_Shadcn_
                value={String(server.subDataMaxBatchSize ?? '')}
                onChange={(event) =>
                  updateServer(['subDataMaxBatchSize'], Number(event.target.value || 0))
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">
                Sub data min batch creation time (ms)
              </Label_Shadcn_>
              <Input_Shadcn_
                value={String(server.subDataMinBatchCreationTimeMs ?? '')}
                onChange={(event) =>
                  updateServer(['subDataMinBatchCreationTimeMs'], Number(event.target.value || 0))
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Subscription process batch size</Label_Shadcn_>
              <Input_Shadcn_
                value={String(server.subscriptionProcessBatchSize ?? '')}
                onChange={(event) =>
                  updateServer(['subscriptionProcessBatchSize'], Number(event.target.value || 0))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(server.showMap ?? false)}
                onCheckedChange={(checked) => updateServer(['showMap'], checked)}
              />
              <span className="text-xs text-foreground-light">Show map</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ value="mapping" className="mt-0 space-y-4">
        {editingMappingIndex == null ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground-light">Mappings</p>
              <Button size="tiny" type="default" onClick={() => setEditingMappingIndex(-1)}>
                Add mapping
              </Button>
            </div>
            {mapping.length === 0 && (
              <p className="text-xs text-foreground-light">No mapping entries yet.</p>
            )}
            {mapping.map((entry, idx) => (
              <div key={`mapping-row-${idx}`} className="flex items-center justify-between rounded border border-muted px-3 py-2">
                <div className="space-y-1">
                  <p className="text-xs text-foreground-light">Device node pattern</p>
                  <p className="text-sm">{String(entry.deviceNodePattern ?? '-')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button_Shadcn_ size="sm" variant="ghost" onClick={() => setEditingMappingIndex(idx)}>
                    Edit
                  </Button_Shadcn_>
                  <Button_Shadcn_
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const next = mapping.filter((_, index) => index !== idx)
                      onChange({ ...value, mapping: next })
                    }}
                  >
                    <X size={14} />
                  </Button_Shadcn_>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button size="tiny" type="default" onClick={cancelMappingEdit}>
                Back
              </Button>
              <Button size="tiny" type="primary" onClick={saveMapping}>
                Save mapping
              </Button>
            </div>
            {activeMapping && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Device info</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Device node source</Label_Shadcn_>
                      <Select_Shadcn_
                        value={(activeMapping.deviceNodeSource as string) ?? 'path'}
                        onValueChange={(nextValue) =>
                          updateMapping({ ...activeMapping, deviceNodeSource: nextValue })
                        }
                      >
                        <SelectTrigger_Shadcn_ size="small">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {DEVICE_SOURCE_OPTIONS.map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Device node pattern</Label_Shadcn_>
                      <Input_Shadcn_
                        value={(activeMapping.deviceNodePattern as string) ?? ''}
                        onChange={(event) =>
                          updateMapping({ ...activeMapping, deviceNodePattern: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Device name expression</Label_Shadcn_>
                      <Input_Shadcn_
                        value={
                          String(
                            getValue(activeMapping, ['deviceInfo', 'deviceNameExpression']) ?? ''
                          )
                        }
                        onChange={(event) => {
                          const next = setValue(
                            activeMapping,
                            ['deviceInfo', 'deviceNameExpression'],
                            event.target.value
                          )
                          updateMapping(next)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Device name source</Label_Shadcn_>
                      <Select_Shadcn_
                        value={String(getValue(activeMapping, ['deviceInfo', 'deviceNameExpressionSource']) ?? 'path')}
                        onValueChange={(nextValue) => {
                          const next = setValue(
                            activeMapping,
                            ['deviceInfo', 'deviceNameExpressionSource'],
                            nextValue
                          )
                          updateMapping(next)
                        }}
                      >
                        <SelectTrigger_Shadcn_ size="small">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {DEVICE_SOURCE_OPTIONS.map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Device profile expression</Label_Shadcn_>
                      <Input_Shadcn_
                        value={String(getValue(activeMapping, ['deviceInfo', 'deviceProfileExpression']) ?? '')}
                        onChange={(event) => {
                          const next = setValue(
                            activeMapping,
                            ['deviceInfo', 'deviceProfileExpression'],
                            event.target.value
                          )
                          updateMapping(next)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label_Shadcn_ className="text-xs text-foreground-light">Device profile source</Label_Shadcn_>
                      <Select_Shadcn_
                        value={String(getValue(activeMapping, ['deviceInfo', 'deviceProfileExpressionSource']) ?? 'constant')}
                        onValueChange={(nextValue) => {
                          const next = setValue(
                            activeMapping,
                            ['deviceInfo', 'deviceProfileExpressionSource'],
                            nextValue
                          )
                          updateMapping(next)
                        }}
                      >
                        <SelectTrigger_Shadcn_ size="small">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {DEVICE_SOURCE_OPTIONS.map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-6 py-4">
                    <KeyValueEditor
                      title="Attributes"
                      entries={ensureArray(activeMapping.attributes)}
                      onChange={(next) =>
                        updateMapping({ ...activeMapping, attributes: next })
                      }
                    />
                    <KeyValueEditor
                      title="Time series"
                      entries={ensureArray(activeMapping.timeseries)}
                      onChange={(next) =>
                        updateMapping({ ...activeMapping, timeseries: next })
                      }
                    />
                    <RpcMethodsEditor
                      entries={ensureArray(activeMapping.rpc_methods)}
                      onChange={(next) =>
                        updateMapping({ ...activeMapping, rpc_methods: next })
                      }
                    />
                    <KeyValueEditor
                      title="Attributes updates"
                      entries={ensureArray(activeMapping.attributes_updates)}
                      onChange={(next) =>
                        updateMapping({ ...activeMapping, attributes_updates: next })
                      }
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}

export default OpcuaConnectorForm
