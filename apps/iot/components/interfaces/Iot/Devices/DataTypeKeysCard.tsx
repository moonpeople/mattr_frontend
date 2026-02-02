import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  useIotDataTypeKeyCreateMutation,
  useIotDataTypeKeyDeleteMutation,
  useIotDataTypeKeyUpdateMutation,
  useIotDataTypeKeysQuery,
} from 'data/iot/data-type-keys'
import type { IotDataTypeKey } from 'data/iot/types'
import { ReportsSelectFilter, type SelectFilters } from 'components/interfaces/Reports/v2/ReportsSelectFilter'
import { Alert, Button, Card, Input, Input_Shadcn_, Label_Shadcn_, SelectField, SidePanel, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const SENSOR_VALUE_TYPES = [
  { label: 'Number', value: 'number' },
  { label: 'Integer', value: 'integer' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'String', value: 'string' },
  { label: 'JSON', value: 'json' },
]

const SENSOR_CHART_TYPES = [
  { label: 'Line', value: 'line' },
  { label: 'Area', value: 'area' },
  { label: 'Bar', value: 'bar' },
]

export const DataTypeKeysCard = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<IotDataTypeKey | null>(null)
  const [typeName, setTypeName] = useState('')
  const [dataKeyName, setDataKeyName] = useState('')
  const [valueType, setValueType] = useState('number')
  const [decimals, setDecimals] = useState('2')
  const [unit, setUnit] = useState('')
  const [chartType, setChartType] = useState(SENSOR_CHART_TYPES[0]?.value ?? 'line')
  const [sensorTypeSearch, setDataTypeKeySearch] = useState('')
  const [sensorValueTypeFilters, setSensorValueTypeFilters] = useState<SelectFilters>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingType, setDeletingType] = useState<IotDataTypeKey | null>(null)

  const {
    data: sensorTypes = [],
    isPending,
    isError,
    error,
  } = useIotDataTypeKeysQuery()
  const { mutateAsync: createDataTypeKey, isPending: isCreating } = useIotDataTypeKeyCreateMutation()
  const { mutateAsync: updateDataTypeKey, isPending: isUpdating } = useIotDataTypeKeyUpdateMutation()
  const { mutateAsync: deleteDataTypeKey, isPending: isDeleting } = useIotDataTypeKeyDeleteMutation()

  const filteredDataTypeKeys = useMemo(() => {
    const searchValue = sensorTypeSearch.trim().toLowerCase()
    return sensorTypes.filter((sensorType) => {
      if (searchValue) {
        const name = sensorType.name?.toLowerCase() ?? ''
        const keyName = sensorType.data_key_name?.toLowerCase() ?? ''
        if (!name.includes(searchValue) && !keyName.includes(searchValue)) return false
      }

      if (
        sensorValueTypeFilters.length > 0 &&
        !sensorValueTypeFilters.includes(sensorType.value_type)
      ) {
        return false
      }

      return true
    })
  }, [sensorTypes, sensorTypeSearch, sensorValueTypeFilters])

  useEffect(() => {
    if (!dialogOpen) return
    setTypeName(editingType?.name ?? '')
    setDataKeyName(editingType?.data_key_name ?? '')
    setValueType(editingType?.value_type ?? 'number')
    setDecimals(
      editingType?.decimals === null || editingType?.decimals === undefined
        ? '2'
        : String(editingType.decimals)
    )
    setUnit(editingType?.unit ?? '')
    setChartType(editingType?.chart_type ?? SENSOR_CHART_TYPES[0]?.value ?? 'line')
  }, [dialogOpen, editingType])

  const onOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingType(null)
      setTypeName('')
      setDataKeyName('')
      setValueType('number')
      setDecimals('2')
      setUnit('')
      setChartType(SENSOR_CHART_TYPES[0]?.value ?? 'line')
    }
  }

  const onSubmit = async () => {
    const parsedDecimals = decimals.trim()
    const resolvedDecimals =
      valueType === 'number'
        ? parsedDecimals.length === 0
          ? 2
          : Number(parsedDecimals)
        : null

    if (valueType === 'number') {
      if (!Number.isFinite(resolvedDecimals) || !Number.isInteger(resolvedDecimals)) {
        toast.error('Decimals must be an integer.')
        return
      }
      if (resolvedDecimals < 0) {
        toast.error('Decimals must be 0 or greater.')
        return
      }
    }

    const payload = {
      name: typeName.trim(),
      data_key_name: dataKeyName.trim(),
      value_type: valueType,
      unit: unit.trim() || null,
      decimals: resolvedDecimals,
      chart_type: chartType || null,
    }

    if (!payload.name || !payload.data_key_name) {
      toast.error('Name and data key are required.')
      return
    }

    try {
      if (editingType) {
        await updateDataTypeKey({ dataTypeKeyId: editingType.id, payload })
      } else {
        await createDataTypeKey({ payload })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save data type key.')
    }
  }

  const onDelete = async (sensorType: IotDataTypeKey) => {
    try {
      await deleteDataTypeKey({ dataTypeKeyId: sensorType.id })
      onOpenChange(false)
      return true
    } catch (err) {
      if (err instanceof Error && err.message.includes('data_type_key_in_use')) {
        toast.error('Нельзя удалить data type key: он используется в модели устройства.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to delete data type key.')
      }
      return false
    }
  }

  const isSaving = isCreating || isUpdating
  const canSubmit = typeName.trim().length > 0 && dataKeyName.trim().length > 0 && !isSaving
  const emptySensorMessage =
    sensorTypes.length === 0 ? 'No data type keys yet.' : 'No data type keys match your filters.'
  const canDelete = !!editingType && !isDeleting && !isSaving

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <Input
            placeholder="Search data type keys"
            size="tiny"
            icon={<Search />}
            value={sensorTypeSearch}
            className="w-full lg:w-56"
            onChange={(event) => setDataTypeKeySearch(event.target.value)}
          />
          <ReportsSelectFilter
            label="Value type"
            options={SENSOR_VALUE_TYPES.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            value={sensorValueTypeFilters}
            onChange={setSensorValueTypeFilters}
          />
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            size="tiny"
            type="primary"
            onClick={() => {
              setEditingType(null)
              setDialogOpen(true)
            }}
          >
            New data type key
          </Button>
        </div>
      </div>
      <Alert variant="info" withIcon title="Data type keys define telemetry keys and units">
        Data type keys map incoming payload keys to value types and units used across devices.
      </Alert>
      {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
      <Card>
        <Table className="[&_th]:h-10 [&_th]:px-3 [&_td]:px-3 [&_td]:py-2">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Data key</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Chart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-foreground-light">
                  Loading data type keys...
                </TableCell>
              </TableRow>
            ) : filteredDataTypeKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-foreground-light">
                  {emptySensorMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredDataTypeKeys.map((sensorType) => (
                <TableRow
                  key={sensorType.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setEditingType(sensorType)
                    setDialogOpen(true)
                  }}
                >
                  <TableCell>{sensorType.id}</TableCell>
                  <TableCell>{sensorType.name}</TableCell>
                  <TableCell>{sensorType.data_key_name}</TableCell>
                  <TableCell>{sensorType.value_type}</TableCell>
                  <TableCell>{sensorType.unit || '--'}</TableCell>
                  <TableCell>{sensorType.chart_type || '--'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <SidePanel
        size="large"
        visible={dialogOpen}
        header={editingType ? 'Edit data type key' : 'Create data type key'}
        onCancel={() => onOpenChange(false)}
        customFooter={
          <div className="flex w-full items-center justify-between border-t border-default px-3 py-4">
            <div>
              {editingType ? (
                <Button
                  type="danger"
                  onClick={() => {
                    if (!editingType) return
                    setDeletingType(editingType)
                    setDeleteModalOpen(true)
                  }}
                  disabled={!canDelete}
                >
                  Delete
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="default" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="primary" onClick={onSubmit} disabled={!canSubmit} loading={isSaving}>
                {editingType ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-6 px-8 py-8">
          <div>
            <Label_Shadcn_>Name</Label_Shadcn_>
            <Input_Shadcn_
              id="sensor-type-name"
              value={typeName}
              onChange={(event) => setTypeName(event.target.value)}
            />
          </div>
          <div>
            <Label_Shadcn_>Data key name</Label_Shadcn_>
            <Input_Shadcn_
              id="sensor-type-data-key"
              value={dataKeyName}
              onChange={(event) => setDataKeyName(event.target.value)}
            />
          </div>
          <SelectField
            label="Value type"
            type="select"
            value={valueType}
            onChange={(nextValue) => {
              setValueType(nextValue)
              if (nextValue === 'number' && !decimals.trim()) {
                setDecimals('2')
              }
              if (nextValue !== 'number') {
                setDecimals('')
              }
            }}
          >
            {SENSOR_VALUE_TYPES.map((option) => (
              <SelectField.Option
                key={option.value}
                id={option.value}
                label={option.label}
                value={option.value}
              >
                {option.label}
              </SelectField.Option>
            ))}
          </SelectField>
          {valueType === 'number' && (
            <Input
              id="sensor-type-decimals"
              label="Decimals"
              value={decimals}
              onChange={(event) => setDecimals(event.target.value)}
            />
          )}
          <SelectField
            label="Chart type"
            type="select"
            value={chartType}
            onChange={(nextValue) => setChartType(nextValue)}
          >
            {SENSOR_CHART_TYPES.map((option) => (
              <SelectField.Option
                key={option.value}
                id={`sensor-type-chart-${option.value}`}
                label={option.label}
                value={option.value}
              >
                {option.label}
              </SelectField.Option>
            ))}
          </SelectField>
          <Input
            id="sensor-type-unit"
            label="Unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </div>
        <ConfirmationModal
          visible={deleteModalOpen}
          loading={isDeleting}
          variant="destructive"
          confirmLabel="Delete data type key"
          confirmLabelLoading="Deleting"
          title={`Delete data type key “${deletingType?.name ?? ''}”`}
          onCancel={() => {
            setDeleteModalOpen(false)
            setDeletingType(null)
          }}
          onConfirm={async () => {
            if (!deletingType) return
            const deleted = await onDelete(deletingType)
            if (deleted) {
              setDeleteModalOpen(false)
              setDeletingType(null)
            }
          }}
        >
          <p className="text-sm text-foreground-light">
            This action cannot be undone. Devices and sensors using this key may be affected.
          </p>
        </ConfirmationModal>
      </SidePanel>
    </div>
  )
}
