import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  useIotSensorCreateMutation,
  useIotSensorDeleteMutation,
  useIotSensorUpdateMutation,
  useIotSensorsQuery,
} from 'data/iot/sensors'
import { useIotDataTypeKeysQuery } from 'data/iot/data-type-keys'
import type { IotDevice, IotSensor } from 'data/iot/types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

export const ManageSensorsDialog = ({
  device,
  open,
  onOpenChange,
}: {
  device: IotDevice | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const deviceId = device?.id
  const [formVisible, setFormVisible] = useState(false)
  const [editingSensor, setEditingSensor] = useState<IotSensor | null>(null)
  const [sensorName, setSensorName] = useState('')
  const [sensorTypeId, setDataTypeKeyId] = useState('')
  const [thresholdIdle, setThresholdIdle] = useState('')
  const [thresholdShutdown, setThresholdShutdown] = useState('')

  const {
    data: sensors = [],
    isPending,
    isError,
    error,
  } = useIotSensorsQuery({ deviceId, enabled: open && !!deviceId })
  const { data: sensorTypes = [] } = useIotDataTypeKeysQuery({ enabled: open })
  const { mutateAsync: createSensor, isPending: isCreating } = useIotSensorCreateMutation()
  const { mutateAsync: updateSensor, isPending: isUpdating } = useIotSensorUpdateMutation()
  const { mutateAsync: deleteSensor, isPending: isDeleting } = useIotSensorDeleteMutation()

  useEffect(() => {
    if (!open) return
    if (editingSensor) {
      setSensorName(editingSensor.name ?? '')
      setDataTypeKeyId(editingSensor.data_type_key_id.toString())
      setThresholdIdle(
        editingSensor.threshold_idle === null || editingSensor.threshold_idle === undefined
          ? ''
          : editingSensor.threshold_idle.toString()
      )
      setThresholdShutdown(
        editingSensor.threshold_shutdown === null || editingSensor.threshold_shutdown === undefined
          ? ''
          : editingSensor.threshold_shutdown.toString()
      )
      setFormVisible(true)
      return
    }

    setSensorName('')
    setThresholdIdle('')
    setThresholdShutdown('')
    setFormVisible(false)
  }, [open, editingSensor])

  useEffect(() => {
    if (!open) return
    if (editingSensor) return
    if (sensorTypes.length > 0 && sensorTypeId === '') {
      setDataTypeKeyId(sensorTypes[0].id.toString())
    }
  }, [open, editingSensor, sensorTypes, sensorTypeId])

  const resetForm = () => {
    setEditingSensor(null)
    setSensorName('')
    setDataTypeKeyId(sensorTypes[0]?.id?.toString() ?? '')
    setThresholdIdle('')
    setThresholdShutdown('')
    setFormVisible(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  const parseThreshold = (value: string, label: string) => {
    const trimmed = value.trim()
    if (trimmed === '') return null
    const parsed = Number(trimmed)
    if (Number.isNaN(parsed)) {
      toast.error(`${label} must be a number.`)
      return undefined
    }
    return parsed
  }

  const onSubmit = async () => {
    if (!deviceId) {
      toast.error('Device context is missing.')
      return
    }
    if (!sensorTypeId) {
      toast.error('Data type key is required.')
      return
    }

    const idle = parseThreshold(thresholdIdle, 'Idle threshold')
    if (idle === undefined) return
    const shutdown = parseThreshold(thresholdShutdown, 'Shutdown threshold')
    if (shutdown === undefined) return

    const payload = {
      data_type_key_id: sensorTypeId,
      name: sensorName.trim() || null,
      threshold_idle: idle,
      threshold_shutdown: shutdown,
    }

    try {
      if (editingSensor) {
        await updateSensor({ deviceId, sensorId: editingSensor.id, payload })
      } else {
        await createSensor({ deviceId, payload })
      }
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save sensor.')
    }
  }

  const onDelete = async (sensor: IotSensor) => {
    if (!deviceId) {
      toast.error('Device context is missing.')
      return
    }
    if (!confirm(`Delete sensor "${sensor.name || sensor.id}"?`)) return
    try {
      await deleteSensor({ deviceId, sensorId: sensor.id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete sensor.')
    }
  }

  const sensorTypeMap = new Map(sensorTypes.map((type) => [type.id, type]))
  const isSaving = isCreating || isUpdating
  const canSubmit = !!deviceId && !!sensorTypeId && !isSaving && sensorTypes.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="large">
        <DialogHeader padding="small">
          <DialogTitle>Manage sensors</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection padding="small" className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-foreground-light">Device</p>
            <p className="text-sm text-foreground">
              {device ? device.name || device.serial_number || `#${device.id}` : '--'}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-foreground-light">Sensors</p>
            <Button
              size="tiny"
              type="primary"
              onClick={() => {
                setEditingSensor(null)
                setFormVisible(true)
              }}
              disabled={!deviceId || sensorTypes.length === 0}
            >
              New sensor
            </Button>
          </div>

          {sensorTypes.length === 0 && (
            <p className="text-sm text-foreground-light">
              Create data type keys before adding sensors.
            </p>
          )}

          {formVisible && (
            <div className="space-y-3 rounded-md border border-strong px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {editingSensor ? 'Edit sensor' : 'New sensor'}
                </p>
                <Button size="tiny" type="default" onClick={resetForm}>
                  Close
                </Button>
              </div>
              <Input
                id="sensor-name"
                label="Name"
                value={sensorName}
                onChange={(event) => setSensorName(event.target.value)}
              />
              <div className="space-y-1">
                <p className="text-xs text-foreground-light">Data type key</p>
                <Select_Shadcn_
                  value={sensorTypeId}
                  onValueChange={(nextValue) => setDataTypeKeyId(nextValue)}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ placeholder="Select data type key" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {sensorTypes.map((type) => (
                      <SelectItem_Shadcn_
                        key={type.id}
                        value={type.id.toString()}
                        className="text-xs"
                      >
                        {type.name}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  id="sensor-threshold-idle"
                  label="Idle threshold"
                  type="number"
                  value={thresholdIdle}
                  onChange={(event) => setThresholdIdle(event.target.value)}
                />
                <Input
                  id="sensor-threshold-shutdown"
                  label="Shutdown threshold"
                  type="number"
                  value={thresholdShutdown}
                  onChange={(event) => setThresholdShutdown(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="default" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="primary" onClick={onSubmit} disabled={!canSubmit}>
                  {editingSensor ? 'Save' : 'Create'}
                </Button>
              </div>
            </div>
          )}

          {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Idle</TableHead>
                <TableHead>Shutdown</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-foreground-light">
                    Loading sensors...
                  </TableCell>
                </TableRow>
              ) : sensors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-foreground-light">
                    No sensors yet.
                  </TableCell>
                </TableRow>
              ) : (
                sensors.map((sensor) => {
                  const sensorType = sensorTypeMap.get(sensor.data_type_key_id)
                  return (
                    <TableRow key={sensor.id}>
                      <TableCell>{sensor.id}</TableCell>
                      <TableCell>{sensor.name || '--'}</TableCell>
                      <TableCell>{sensorType?.name || sensor.data_type_key_id}</TableCell>
                      <TableCell>{sensor.threshold_idle ?? '--'}</TableCell>
                      <TableCell>{sensor.threshold_shutdown ?? '--'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="tiny"
                            type="default"
                            onClick={() => {
                              setEditingSensor(sensor)
                              setFormVisible(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="tiny"
                            type="danger"
                            onClick={() => onDelete(sensor)}
                            disabled={isDeleting}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </DialogSection>
        <DialogFooter padding="small">
          <Button type="default" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
