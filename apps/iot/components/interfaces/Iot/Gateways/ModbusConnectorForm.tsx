import { useMemo, useState, type ReactNode } from 'react'
import { Edit2, Trash } from 'lucide-react'

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

type ModbusConnectorFormProps = {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  generalContent?: ReactNode
}

type ModbusRegisterEntry = {
  tag?: string
  type?: string
  functionCode?: number
  objectsCount?: number
  address?: number
  divider?: number
}

const MODBUS_TYPES = [
  { label: 'String', value: 'string' },
  { label: 'Bits', value: 'bits' },
  { label: '8int', value: '8int' },
  { label: '16int', value: '16int' },
  { label: '32int', value: '32int' },
  { label: '64int', value: '64int' },
  { label: '16uint', value: '16uint' },
  { label: '32uint', value: '32uint' },
  { label: '64uint', value: '64uint' },
  { label: '16float', value: '16float' },
  { label: '32float', value: '32float' },
  { label: '64float', value: '64float' },
]

const MODBUS_FUNCTION_CODES = [
  { label: 'Read Coils (1)', value: 1 },
  { label: 'Read Discrete Inputs (2)', value: 2 },
  { label: 'Read Holding Registers (3)', value: 3 },
  { label: 'Read Input Registers (4)', value: 4 },
  { label: 'Write Single Coil (5)', value: 5 },
  { label: 'Write Single Register (6)', value: 6 },
  { label: 'Write Multiple Coils (15)', value: 15 },
  { label: 'Write Multiple Registers (16)', value: 16 },
]

const MODBUS_FUNCTION_CODES_READ = MODBUS_FUNCTION_CODES.filter((option) =>
  [1, 2, 3, 4].includes(option.value)
)

const MODBUS_FUNCTION_CODES_WRITE = MODBUS_FUNCTION_CODES.filter((option) =>
  [5, 6, 15, 16].includes(option.value)
)

const MODBUS_PARITY = [
  { label: 'N', value: 'N' },
  { label: 'E', value: 'E' },
  { label: 'O', value: 'O' },
]

const MODBUS_BYTE_ORDER = [
  { label: 'Little', value: 'LITTLE' },
  { label: 'Big', value: 'BIG' },
]

const MODBUS_WORD_ORDER = [
  { label: 'Little', value: 'LITTLE' },
  { label: 'Big', value: 'BIG' },
]

const MODBUS_CONNECTION_TYPE = [
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
  { label: 'Serial', value: 'serial' },
]

const MODBUS_SLAVE_CONNECTION_TYPE = [
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
  { label: 'Serial', value: 'serial' },
]

const MODBUS_METHOD = [
  { label: 'Socket', value: 'socket' },
  { label: 'RTU', value: 'rtu' },
  { label: 'ASCII', value: 'ascii' },
]

const SERIAL_BAUDRATES = [
  4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
]

const SERIAL_BYTESIZES = [5, 6, 7, 8]

const SERIAL_STOPBITS = [1, 2]

const SERIAL_PARITY = [
  { label: 'None', value: 'N' },
  { label: 'Even', value: 'E' },
  { label: 'Odd', value: 'O' },
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

const createModbusRegister = (defaultFunctionCode: number = 4): ModbusRegisterEntry => ({
  tag: '',
  type: '16int',
  functionCode: defaultFunctionCode,
  objectsCount: 1,
  address: 0,
})

const createSlave = () => ({
  host: '127.0.0.1',
  port: 502,
  type: 'tcp',
  method: 'socket',
  timeout: 35,
  baudrate: 19200,
  stopbits: 1,
  bytesize: 8,
  parity: 'N',
  repack: false,
  delayBetweenRequestsMs: 0,
  byteOrder: 'LITTLE',
  wordOrder: 'LITTLE',
  retries: true,
  retryOnEmpty: true,
  retryOnInvalid: true,
  pollPeriod: 1000,
  unitId: 1,
  deviceName: 'Device',
  deviceType: '',
  handleLocalEcho: false,
  sendDataOnlyOnChange: false,
  connectAttemptTimeMs: 5000,
  connectAttemptCount: 5,
  waitAfterFailedAttemptsMs: 300000,
  attributes: [],
  timeseries: [],
  attributeUpdates: [],
  rpc: [],
})

const ensureArray = <T,>(value: unknown, fallback: T[] = []) =>
  Array.isArray(value) ? (value as T[]) : fallback

const cloneValue = (value: Record<string, unknown>) => JSON.parse(JSON.stringify(value ?? {}))

const setPath = (obj: Record<string, any>, path: Array<string | number>, value: any) => {
  let current = obj
  path.slice(0, -1).forEach((segment, index) => {
    const next = path[index + 1]
    if (current[segment] == null) {
      current[segment] = typeof next === 'number' ? [] : {}
    }
    current = current[segment]
  })
  current[path[path.length - 1]] = value
}

const ModbusRegisterTable = ({
  title,
  entries,
  onChange,
  functionCodeOptions,
  defaultFunctionCode,
  showDivider = true,
}: {
  title: string
  entries: ModbusRegisterEntry[]
  onChange: (next: ModbusRegisterEntry[]) => void
  functionCodeOptions?: Array<{ label: string; value: number }>
  defaultFunctionCode?: number
  showDivider?: boolean
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const resolvedFunctionCodeOptions = functionCodeOptions ?? MODBUS_FUNCTION_CODES
  const resolvedDefaultFunctionCode =
    defaultFunctionCode ?? resolvedFunctionCodeOptions[0]?.value ?? 4

  const handleUpdate = (index: number, patch: Partial<ModbusRegisterEntry>) => {
    const next = [...entries]
    next[index] = { ...createModbusRegister(resolvedDefaultFunctionCode), ...next[index], ...patch }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground-light">{title}</p>
        {editingIndex === null ? (
          <Button
            size="tiny"
            type="default"
            onClick={() => {
              const next = [...entries, createModbusRegister(resolvedDefaultFunctionCode)]
              onChange(next)
              setEditingIndex(next.length - 1)
            }}
          >
            Add
          </Button>
        ) : (
          <Button size="tiny" type="default" onClick={() => setEditingIndex(null)}>
            Back
          </Button>
        )}
      </div>
      {editingIndex === null ? (
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Count</TableHead>
              <TableHead className="w-[84px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-foreground-light">
                  No entries configured.
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry, index) => (
              <TableRow key={`${title}-${index}`} className="h-8">
                <TableCell className="py-1">{entry.tag || '-'}</TableCell>
                <TableCell className="py-1">{entry.type || '-'}</TableCell>
                <TableCell className="py-1">{entry.functionCode ?? '-'}</TableCell>
                <TableCell className="py-1">{entry.address ?? '-'}</TableCell>
                <TableCell className="py-1">{entry.objectsCount ?? '-'}</TableCell>
                <TableCell className="flex items-center justify-end gap-2 py-1">
                  <Button_Shadcn_
                    size="sm"
                    variant="ghost"
                    className="px-1"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Edit2 size={12} />
                  </Button_Shadcn_>
                  <Button_Shadcn_
                    size="sm"
                    variant="ghost"
                    className="px-1"
                    onClick={() => onChange(entries.filter((_, i) => i !== index))}
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
          const entry = entries[editingIndex] ?? createModbusRegister(resolvedDefaultFunctionCode)
          const currentFunctionCode = entry.functionCode ?? resolvedDefaultFunctionCode
          const allowedFunctionCodes = resolvedFunctionCodeOptions.some(
            (option) => option.value === currentFunctionCode
          )
            ? currentFunctionCode
            : resolvedDefaultFunctionCode
          return (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label_Shadcn_ className="text-xs text-foreground-light">Tag</Label_Shadcn_>
                <Input_Shadcn_
                  value={entry.tag ?? ''}
                  onChange={(event) => handleUpdate(editingIndex, { tag: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
                <Select_Shadcn_
                  value={entry.type ?? '16int'}
                  onValueChange={(next) => handleUpdate(editingIndex, { type: next })}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {MODBUS_TYPES.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Function code</Label_Shadcn_>
                <Select_Shadcn_
                  value={String(allowedFunctionCodes)}
                  onValueChange={(next) =>
                    handleUpdate(editingIndex, { functionCode: Number(next) })
                  }
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {resolvedFunctionCodeOptions.map((option) => (
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
                <Label_Shadcn_ className="text-xs text-foreground-light">Address</Label_Shadcn_>
                <Input_Shadcn_
                  type="number"
                  value={entry.address ?? 0}
                  onChange={(event) =>
                    handleUpdate(editingIndex, { address: Number(event.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Objects count</Label_Shadcn_>
                <Input_Shadcn_
                  type="number"
                  value={entry.objectsCount ?? 1}
                  onChange={(event) =>
                    handleUpdate(editingIndex, { objectsCount: Number(event.target.value) })
                  }
                />
              </div>
              {showDivider && (
                <div className="space-y-1 md:col-span-2">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Divider</Label_Shadcn_>
                  <Input_Shadcn_
                    type="number"
                    value={entry.divider ?? ''}
                    onChange={(event) =>
                      handleUpdate(editingIndex, {
                        divider: event.target.value ? Number(event.target.value) : undefined,
                      })
                    }
                  />
                </div>
              )}
            </div>
          )
        })()
      )}
    </div>
  )
}

const SlaveValuesTable = ({
  title,
  entries,
  onChange,
}: {
  title: string
  entries: ModbusRegisterEntry[]
  onChange: (next: ModbusRegisterEntry[]) => void
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleUpdate = (index: number, patch: Partial<ModbusRegisterEntry>) => {
    const next = [...entries]
    next[index] = { ...createModbusRegister(), ...next[index], ...patch }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground-light">{title}</p>
        {editingIndex === null ? (
          <Button
            size="tiny"
            type="default"
            onClick={() => {
              const next = [...entries, createModbusRegister()]
              onChange(next)
              setEditingIndex(next.length - 1)
            }}
          >
            Add
          </Button>
        ) : (
          <Button size="tiny" type="default" onClick={() => setEditingIndex(null)}>
            Back
          </Button>
        )}
      </div>
      {editingIndex === null ? (
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[84px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-foreground-light">
                  No values configured.
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry, index) => (
              <TableRow key={`${title}-${index}`} className="h-8">
                <TableCell className="py-1">{entry.tag || '-'}</TableCell>
                <TableCell className="py-1">{entry.type || '-'}</TableCell>
                <TableCell className="py-1">{entry.address ?? '-'}</TableCell>
                <TableCell className="py-1">{entry.objectsCount ?? '-'}</TableCell>
                <TableCell className="py-1">
                  {entry.value !== undefined ? String(entry.value) : '-'}
                </TableCell>
                <TableCell className="flex items-center justify-end gap-2 py-1">
                  <Button_Shadcn_
                    size="sm"
                    variant="ghost"
                    className="px-1"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Edit2 size={12} />
                  </Button_Shadcn_>
                  <Button_Shadcn_
                    size="sm"
                    variant="ghost"
                    className="px-1"
                    onClick={() => onChange(entries.filter((_, i) => i !== index))}
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
          const entry = entries[editingIndex] ?? createModbusRegister()
          return (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label_Shadcn_ className="text-xs text-foreground-light">Tag</Label_Shadcn_>
                <Input_Shadcn_
                  value={entry.tag ?? ''}
                  onChange={(event) => handleUpdate(editingIndex, { tag: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
                <Select_Shadcn_
                  value={entry.type ?? '16int'}
                  onValueChange={(next) => handleUpdate(editingIndex, { type: next })}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {MODBUS_TYPES.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Address</Label_Shadcn_>
                <Input_Shadcn_
                  type="number"
                  value={entry.address ?? 0}
                  onChange={(event) =>
                    handleUpdate(editingIndex, { address: Number(event.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Objects count</Label_Shadcn_>
                <Input_Shadcn_
                  type="number"
                  value={entry.objectsCount ?? 1}
                  onChange={(event) =>
                    handleUpdate(editingIndex, { objectsCount: Number(event.target.value) })
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label_Shadcn_ className="text-xs text-foreground-light">Value</Label_Shadcn_>
                <Input_Shadcn_
                  value={entry.value ?? ''}
                  onChange={(event) => handleUpdate(editingIndex, { value: event.target.value })}
                />
              </div>
            </div>
          )
        })()
      )}
    </div>
  )
}

const SlaveForm = ({
  slave,
  onChange,
}: {
  slave: Record<string, any>
  onChange: (next: Record<string, any>) => void
}) => {
  const attributes = ensureArray<ModbusRegisterEntry>(slave.attributes)
  const timeseries = ensureArray<ModbusRegisterEntry>(slave.timeseries)
  const attributeUpdates = ensureArray<ModbusRegisterEntry>(slave.attributeUpdates)
  const rpc = ensureArray<ModbusRegisterEntry>(slave.rpc)
  const connectionType = slave.type ?? 'tcp'
  const isSerial = connectionType === 'serial'
  const methodOptions = isSerial
    ? MODBUS_METHOD.filter((option) => option.value !== 'socket')
    : MODBUS_METHOD.filter((option) => option.value === 'socket')
  const isTcpOrUdp = connectionType === 'tcp' || connectionType === 'udp'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Connection</CardTitle>
          <div className="inline-flex items-center rounded border border-default text-xs">
            {MODBUS_CONNECTION_TYPE.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`px-3 py-1 ${
                  (slave.type ?? 'tcp') === option.value
                    ? 'bg-surface-200 text-foreground'
                    : 'text-foreground-light'
                }`}
                onClick={() => onChange({ ...slave, type: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {!isSerial ? (
            <>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Host</Label_Shadcn_>
                <Input_Shadcn_
                  value={slave.host ?? ''}
                  onChange={(event) => onChange({ ...slave, host: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Port</Label_Shadcn_>
                <Input_Shadcn_
                  type="number"
                  value={slave.port ?? 502}
                  onChange={(event) => onChange({ ...slave, port: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Method</Label_Shadcn_>
                <Select_Shadcn_
                  value={slave.method ?? 'socket'}
                  onValueChange={(next) => onChange({ ...slave, method: next })}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {methodOptions.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Unit ID</Label_Shadcn_>
                <Input_Shadcn_
                  type="number"
                  value={slave.unitId ?? 1}
                  onChange={(event) => onChange({ ...slave, unitId: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Device name</Label_Shadcn_>
                <Input_Shadcn_
                  value={slave.deviceName ?? ''}
                  onChange={(event) => onChange({ ...slave, deviceName: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Device type</Label_Shadcn_>
                <Input_Shadcn_
                  value={slave.deviceType ?? ''}
                  onChange={(event) => onChange({ ...slave, deviceType: event.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Port</Label_Shadcn_>
                <Input_Shadcn_
                  value={slave.port ?? ''}
                  onChange={(event) => onChange({ ...slave, port: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Method</Label_Shadcn_>
                <Select_Shadcn_
                  value={slave.method ?? 'rtu'}
                  onValueChange={(next) => onChange({ ...slave, method: next })}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {methodOptions.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Baudrate</Label_Shadcn_>
                <Select_Shadcn_
                  value={String(slave.baudrate ?? 19200)}
                  onValueChange={(next) => onChange({ ...slave, baudrate: Number(next) })}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {SERIAL_BAUDRATES.map((rate) => (
                      <SelectItem_Shadcn_ key={rate} value={String(rate)} className="text-xs">
                        {rate}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Bytesize</Label_Shadcn_>
                <Select_Shadcn_
                  value={String(slave.bytesize ?? 8)}
                  onValueChange={(next) => onChange({ ...slave, bytesize: Number(next) })}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {SERIAL_BYTESIZES.map((size) => (
                      <SelectItem_Shadcn_ key={size} value={String(size)} className="text-xs">
                        {size}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Stopbits</Label_Shadcn_>
                <Select_Shadcn_
                  value={String(slave.stopbits ?? 1)}
                  onValueChange={(next) => onChange({ ...slave, stopbits: Number(next) })}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {SERIAL_STOPBITS.map((stop) => (
                      <SelectItem_Shadcn_ key={stop} value={String(stop)} className="text-xs">
                        {stop}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Parity</Label_Shadcn_>
                <Select_Shadcn_
                  value={slave.parity ?? 'N'}
                  onValueChange={(next) => onChange({ ...slave, parity: next })}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {SERIAL_PARITY.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={Boolean(slave.handleLocalEcho)}
                  onCheckedChange={(checked) =>
                    onChange({ ...slave, handleLocalEcho: checked })
                  }
                />
                <Label_Shadcn_ className="text-xs text-foreground-light">Handle local echo</Label_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Unit ID</Label_Shadcn_>
                <Input_Shadcn_
                  type="number"
                  value={slave.unitId ?? 1}
                  onChange={(event) => onChange({ ...slave, unitId: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Device name</Label_Shadcn_>
                <Input_Shadcn_
                  value={slave.deviceName ?? ''}
                  onChange={(event) => onChange({ ...slave, deviceName: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Device type</Label_Shadcn_>
                <Input_Shadcn_
                  value={slave.deviceType ?? ''}
                  onChange={(event) => onChange({ ...slave, deviceType: event.target.value })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isTcpOrUdp && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">TLS Connection</CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(slave.tls)}
                onCheckedChange={(checked) =>
                  onChange({ ...slave, tls: checked ? { certfile: '', keyfile: '', password: '' } : undefined })
                }
              />
              <Label_Shadcn_ className="text-xs text-foreground-light">Enable</Label_Shadcn_>
            </div>
          </CardHeader>
          {slave.tls ? (
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label_Shadcn_ className="text-xs text-foreground-light">
                  Path to client certificate file
                </Label_Shadcn_>
                <Input_Shadcn_
                  value={slave.tls?.certfile ?? ''}
                  onChange={(event) =>
                    onChange({
                      ...slave,
                      tls: { ...(slave.tls ?? {}), certfile: event.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label_Shadcn_ className="text-xs text-foreground-light">
                  Path to private key file
                </Label_Shadcn_>
                <Input_Shadcn_
                  value={slave.tls?.keyfile ?? ''}
                  onChange={(event) =>
                    onChange({
                      ...slave,
                      tls: { ...(slave.tls ?? {}), keyfile: event.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ className="text-xs text-foreground-light">Password</Label_Shadcn_>
                <Input_Shadcn_
                  type="password"
                  value={slave.tls?.password ?? ''}
                  onChange={(event) =>
                    onChange({
                      ...slave,
                      tls: { ...(slave.tls ?? {}), password: event.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          ) : null}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Advanced connection settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Connection timeouts</Label_Shadcn_>
            <Input_Shadcn_
              type="number"
              value={slave.timeout ?? 35}
              onChange={(event) => onChange({ ...slave, timeout: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Byte order</Label_Shadcn_>
            <Select_Shadcn_
              value={slave.byteOrder ?? 'LITTLE'}
              onValueChange={(next) => onChange({ ...slave, byteOrder: next })}
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {MODBUS_BYTE_ORDER.map((option) => (
                  <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Word order</Label_Shadcn_>
            <Select_Shadcn_
              value={slave.wordOrder ?? 'LITTLE'}
              onValueChange={(next) => onChange({ ...slave, wordOrder: next })}
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {MODBUS_WORD_ORDER.map((option) => (
                  <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(slave.repack)}
              onCheckedChange={(checked) => onChange({ ...slave, repack: checked })}
            />
            <Label_Shadcn_ className="text-xs text-foreground-light">Repack</Label_Shadcn_>
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">
              Delay between requests (ms)
            </Label_Shadcn_>
            <Input_Shadcn_
              type="number"
              value={slave.delayBetweenRequestsMs ?? 0}
              onChange={(event) =>
                onChange({ ...slave, delayBetweenRequestsMs: Number(event.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Retries</Label_Shadcn_>
            <Input_Shadcn_
              type="number"
              value={typeof slave.retries === 'number' ? slave.retries : 0}
              onChange={(event) =>
                onChange({ ...slave, retries: Number(event.target.value) })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(slave.retryOnEmpty)}
              onCheckedChange={(checked) => onChange({ ...slave, retryOnEmpty: checked })}
            />
            <Label_Shadcn_ className="text-xs text-foreground-light">Retries on empty</Label_Shadcn_>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(slave.retryOnInvalid)}
              onCheckedChange={(checked) => onChange({ ...slave, retryOnInvalid: checked })}
            />
            <Label_Shadcn_ className="text-xs text-foreground-light">Retries on invalid</Label_Shadcn_>
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Poll period (ms)</Label_Shadcn_>
            <Input_Shadcn_
              type="number"
              value={slave.pollPeriod ?? 1000}
              onChange={(event) => onChange({ ...slave, pollPeriod: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Connect attempt time (ms)</Label_Shadcn_>
            <Input_Shadcn_
              type="number"
              value={slave.connectAttemptTimeMs ?? 5000}
              onChange={(event) =>
                onChange({ ...slave, connectAttemptTimeMs: Number(event.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Connect attempt count</Label_Shadcn_>
            <Input_Shadcn_
              type="number"
              value={slave.connectAttemptCount ?? 5}
              onChange={(event) =>
                onChange({ ...slave, connectAttemptCount: Number(event.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label_Shadcn_ className="text-xs text-foreground-light">Wait after failed attempts (ms)</Label_Shadcn_>
            <Input_Shadcn_
              type="number"
              value={slave.waitAfterFailedAttemptsMs ?? 300000}
              onChange={(event) =>
                onChange({ ...slave, waitAfterFailedAttemptsMs: Number(event.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Mappings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ModbusRegisterTable
            title="Attributes"
            entries={attributes}
            onChange={(next) => onChange({ ...slave, attributes: next })}
            functionCodeOptions={MODBUS_FUNCTION_CODES_READ}
            defaultFunctionCode={4}
          />
          <ModbusRegisterTable
            title="Time series"
            entries={timeseries}
            onChange={(next) => onChange({ ...slave, timeseries: next })}
            functionCodeOptions={MODBUS_FUNCTION_CODES_READ}
            defaultFunctionCode={4}
          />
          <ModbusRegisterTable
            title="Attribute updates"
            entries={attributeUpdates}
            onChange={(next) => onChange({ ...slave, attributeUpdates: next })}
            functionCodeOptions={MODBUS_FUNCTION_CODES_WRITE}
            defaultFunctionCode={16}
            showDivider={false}
          />
          <ModbusRegisterTable
            title="RPC"
            entries={rpc}
            onChange={(next) => onChange({ ...slave, rpc: next })}
            functionCodeOptions={MODBUS_FUNCTION_CODES_WRITE}
            defaultFunctionCode={16}
            showDivider={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export const ModbusConnectorForm = ({
  value,
  onChange,
  generalContent,
}: ModbusConnectorFormProps) => {
  const master = (value.master ?? {}) as Record<string, any>
  const slaves = ensureArray<Record<string, any>>(master.slaves)
  const slaveConfig = (value.slave ?? {}) as Record<string, any>

  const [editingSlaveIndex, setEditingSlaveIndex] = useState<number | null>(null)

  const updateValue = (path: Array<string | number>, next: unknown) => {
    const clone = cloneValue(value)
    setPath(clone, path, next)
    onChange(clone)
  }

  const updateSlave = (index: number, patch: Record<string, any>) => {
    const next = [...slaves]
    next[index] = { ...createSlave(), ...next[index], ...patch }
    updateValue(['master', 'slaves'], next)
  }

  const masterSummary = useMemo(
    () => slaves.map((slave) => slave.deviceName).filter(Boolean).join(', '),
    [slaves]
  )

  return (
    <Tabs_Shadcn_ defaultValue="general" className="flex h-full flex-col gap-4">
      <TabsList_Shadcn_ className="w-full flex-wrap gap-2">
        <TabsTrigger_Shadcn_ value="general">General</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="master">Master Connections</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="slave">Slave</TabsTrigger_Shadcn_>
      </TabsList_Shadcn_>

      <TabsContent_Shadcn_ value="general" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {generalContent ? <div className="md:col-span-2">{generalContent}</div> : null}
          <Card className="md:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Logs configuration</CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  id="modbus-remote-logs"
                  checked={Boolean(value.enableRemoteLogging ?? false)}
                  onCheckedChange={(checked) => updateValue(['enableRemoteLogging'], checked)}
                />
                <Label_Shadcn_ htmlFor="modbus-remote-logs" className="text-xs text-foreground-light">
                  Enable remote logs
                </Label_Shadcn_>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label_Shadcn_ className="text-xs text-foreground-light">Logging level</Label_Shadcn_>
                <Select_Shadcn_
                  value={(value.logLevel as string) ?? 'INFO'}
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
        </div>
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ value="master" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground-light">Servers (Slaves)</p>
          {editingSlaveIndex === null ? (
            <Button
              size="tiny"
              type="default"
              onClick={() => {
                const next = [...slaves, createSlave()]
                updateValue(['master', 'slaves'], next)
                setEditingSlaveIndex(next.length - 1)
              }}
            >
              Add
            </Button>
          ) : (
            <Button size="tiny" type="default" onClick={() => setEditingSlaveIndex(null)}>
              Back
            </Button>
          )}
        </div>
        {editingSlaveIndex === null ? (
          <div className="space-y-4">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Device name</TableHead>
                  <TableHead>Info</TableHead>
                  <TableHead>Unit ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[84px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-foreground-light">
                      No slaves configured.
                    </TableCell>
                  </TableRow>
                )}
                {slaves.map((slave, index) => (
                  <TableRow key={`slave-${index}`} className="h-8">
                    <TableCell className="py-1">{slave.deviceName || '-'}</TableCell>
                    <TableCell className="py-1">
                      {slave.host ? `${slave.host}:${slave.port ?? ''}` : '-'}
                    </TableCell>
                    <TableCell className="py-1">{slave.unitId ?? '-'}</TableCell>
                    <TableCell className="py-1">{slave.type ?? '-'}</TableCell>
                    <TableCell className="flex items-center justify-end gap-2 py-1">
                      <Button_Shadcn_
                        size="sm"
                        variant="ghost"
                        className="px-1"
                        onClick={() => setEditingSlaveIndex(index)}
                      >
                        <Edit2 size={12} />
                      </Button_Shadcn_>
                      <Button_Shadcn_
                        size="sm"
                        variant="ghost"
                        className="px-1"
                        onClick={() =>
                          updateValue(['master', 'slaves'], slaves.filter((_, i) => i !== index))
                        }
                      >
                        <Trash size={12} />
                      </Button_Shadcn_>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {masterSummary && null}
          </div>
        ) : (
          <SlaveForm
            slave={slaves[editingSlaveIndex] ?? createSlave()}
            onChange={(next) => updateSlave(editingSlaveIndex, next)}
          />
        )}
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ value="slave" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">General</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Device name</Label_Shadcn_>
              <Input_Shadcn_
                value={slaveConfig.deviceName ?? ''}
                onChange={(event) => updateValue(['slave', 'deviceName'], event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Device type</Label_Shadcn_>
              <Input_Shadcn_
                value={slaveConfig.deviceType ?? ''}
                onChange={(event) => updateValue(['slave', 'deviceType'], event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Poll period (ms)</Label_Shadcn_>
              <Input_Shadcn_
                type="number"
                value={slaveConfig.pollPeriod ?? 5000}
                onChange={(event) => updateValue(['slave', 'pollPeriod'], Number(event.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(slaveConfig.sendDataToThingsBoard)}
                onCheckedChange={(checked) =>
                  updateValue(['slave', 'sendDataToThingsBoard'], checked)
                }
              />
              <Label_Shadcn_ className="text-xs text-foreground-light">Send data to ThingsBoard</Label_Shadcn_>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Connection</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Type</Label_Shadcn_>
              <Select_Shadcn_
                value={slaveConfig.type ?? 'tcp'}
                onValueChange={(next) => updateValue(['slave', 'type'], next)}
              >
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {MODBUS_SLAVE_CONNECTION_TYPE.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Method</Label_Shadcn_>
              <Select_Shadcn_
                value={slaveConfig.method ?? 'socket'}
                onValueChange={(next) => updateValue(['slave', 'method'], next)}
              >
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {MODBUS_METHOD.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>

            {['tcp', 'udp'].includes(slaveConfig.type ?? 'tcp') ? (
              <>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Host</Label_Shadcn_>
                  <Input_Shadcn_
                    value={slaveConfig.host ?? ''}
                    onChange={(event) => updateValue(['slave', 'host'], event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Port</Label_Shadcn_>
                  <Input_Shadcn_
                    type="number"
                    value={slaveConfig.port ?? 5026}
                    onChange={(event) => updateValue(['slave', 'port'], Number(event.target.value))}
                  />
                </div>
              </>
            ) : null}

            {slaveConfig.type === 'serial' ? (
              <>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Port</Label_Shadcn_>
                  <Input_Shadcn_
                    value={slaveConfig.port ?? ''}
                    onChange={(event) => updateValue(['slave', 'port'], event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Baudrate</Label_Shadcn_>
                  <Select_Shadcn_
                    value={String(slaveConfig.baudrate ?? 19200)}
                    onValueChange={(next) =>
                      updateValue(['slave', 'baudrate'], Number(next))
                    }
                  >
                    <SelectTrigger_Shadcn_ size="small">
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {SERIAL_BAUDRATES.map((rate) => (
                        <SelectItem_Shadcn_ key={rate} value={String(rate)} className="text-xs">
                          {rate}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Bytesize</Label_Shadcn_>
                  <Select_Shadcn_
                    value={String(slaveConfig.bytesize ?? 8)}
                    onValueChange={(next) =>
                      updateValue(['slave', 'bytesize'], Number(next))
                    }
                  >
                    <SelectTrigger_Shadcn_ size="small">
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {SERIAL_BYTESIZES.map((size) => (
                        <SelectItem_Shadcn_ key={size} value={String(size)} className="text-xs">
                          {size}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Stopbits</Label_Shadcn_>
                  <Select_Shadcn_
                    value={String(slaveConfig.stopbits ?? 1)}
                    onValueChange={(next) =>
                      updateValue(['slave', 'stopbits'], Number(next))
                    }
                  >
                    <SelectTrigger_Shadcn_ size="small">
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {SERIAL_STOPBITS.map((stop) => (
                        <SelectItem_Shadcn_ key={stop} value={String(stop)} className="text-xs">
                          {stop}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                <div className="space-y-1">
                  <Label_Shadcn_ className="text-xs text-foreground-light">Parity</Label_Shadcn_>
                  <Select_Shadcn_
                    value={slaveConfig.parity ?? 'N'}
                    onValueChange={(next) => updateValue(['slave', 'parity'], next)}
                  >
                    <SelectTrigger_Shadcn_ size="small">
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {SERIAL_PARITY.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(slaveConfig.handleLocalEcho)}
                    onCheckedChange={(checked) =>
                      updateValue(['slave', 'handleLocalEcho'], checked)
                    }
                  />
                  <Label_Shadcn_ className="text-xs text-foreground-light">Handle local echo</Label_Shadcn_>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Vendor name</Label_Shadcn_>
              <Input_Shadcn_
                value={slaveConfig.identity?.vendorName ?? ''}
                onChange={(event) =>
                  updateValue(['slave', 'identity'], {
                    ...(slaveConfig.identity ?? {}),
                    vendorName: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Product code</Label_Shadcn_>
              <Input_Shadcn_
                value={slaveConfig.identity?.productCode ?? ''}
                onChange={(event) =>
                  updateValue(['slave', 'identity'], {
                    ...(slaveConfig.identity ?? {}),
                    productCode: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Vendor URL</Label_Shadcn_>
              <Input_Shadcn_
                value={slaveConfig.identity?.vendorUrl ?? ''}
                onChange={(event) =>
                  updateValue(['slave', 'identity'], {
                    ...(slaveConfig.identity ?? {}),
                    vendorUrl: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Product name</Label_Shadcn_>
              <Input_Shadcn_
                value={slaveConfig.identity?.productName ?? ''}
                onChange={(event) =>
                  updateValue(['slave', 'identity'], {
                    ...(slaveConfig.identity ?? {}),
                    productName: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label_Shadcn_ className="text-xs text-foreground-light">Model name</Label_Shadcn_>
              <Input_Shadcn_
                value={slaveConfig.identity?.ModelName ?? ''}
                onChange={(event) =>
                  updateValue(['slave', 'identity'], {
                    ...(slaveConfig.identity ?? {}),
                    ModelName: event.target.value,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Advanced</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Byte order</Label_Shadcn_>
              <Select_Shadcn_
                value={slaveConfig.byteOrder ?? 'LITTLE'}
                onValueChange={(next) => updateValue(['slave', 'byteOrder'], next)}
              >
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {MODBUS_BYTE_ORDER.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ className="text-xs text-foreground-light">Word order</Label_Shadcn_>
              <Select_Shadcn_
                value={slaveConfig.wordOrder ?? 'LITTLE'}
                onValueChange={(next) => updateValue(['slave', 'wordOrder'], next)}
              >
                <SelectTrigger_Shadcn_ size="small">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {MODBUS_WORD_ORDER.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(slaveConfig.repack)}
                onCheckedChange={(checked) => updateValue(['slave', 'repack'], checked)}
              />
              <Label_Shadcn_ className="text-xs text-foreground-light">Repack</Label_Shadcn_>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {(['holding_registers', 'coils_initializer', 'input_registers', 'discrete_inputs'] as const).map(
            (registerKey) => {
              const labelMap: Record<string, string> = {
                holding_registers: 'Holding registers',
                coils_initializer: 'Coils',
                input_registers: 'Input registers',
                discrete_inputs: 'Discrete inputs',
              }
              const section = slaveConfig.values?.[registerKey] ?? {}
              return (
                <Card key={registerKey}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">{labelMap[registerKey]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SlaveValuesTable
                      title="Attributes"
                      entries={ensureArray(section.attributes)}
                      onChange={(next) =>
                        updateValue(['slave', 'values', registerKey, 'attributes'], next)
                      }
                    />
                    <SlaveValuesTable
                      title="Time series"
                      entries={ensureArray(section.timeseries)}
                      onChange={(next) =>
                        updateValue(['slave', 'values', registerKey, 'timeseries'], next)
                      }
                    />
                    <SlaveValuesTable
                      title="Attribute updates"
                      entries={ensureArray(section.attributeUpdates)}
                      onChange={(next) =>
                        updateValue(['slave', 'values', registerKey, 'attributeUpdates'], next)
                      }
                    />
                    <SlaveValuesTable
                      title="RPC"
                      entries={ensureArray(section.rpc)}
                      onChange={(next) =>
                        updateValue(['slave', 'values', registerKey, 'rpc'], next)
                      }
                    />
                  </CardContent>
                </Card>
              )
            }
          )}
        </div>
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}

export default ModbusConnectorForm
