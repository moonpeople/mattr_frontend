import type { IotDataTypeKey } from 'data/iot/types'
import { Search, Trash2 } from 'lucide-react'
import { Button, Input, SelectField, SidePanel, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { SENSOR_CHART_TYPES, SENSOR_VALUE_TYPES } from './constants'

type DeviceModelStepDataTypeKeysProps = {
  selectedDataTypeKeys: IotDataTypeKey[]
  sensorTypeIds: number[]
  dataTypeKeySearch: string
  dataTypeKeyCreateOpen: boolean
  dataTypeKeyName: string
  dataTypeKeyDataKey: string
  dataTypeKeyValueType: string
  dataTypeKeyDecimals: string
  dataTypeKeyChartType: string
  dataTypeKeyUnit: string
  sensorTypePanelOpen: boolean
  isDataTypeKeysError: boolean
  sensorTypesError?: Error | null
  isDataTypeKeysPending: boolean
  filteredDataTypeKeys: IotDataTypeKey[]
  emptyDataTypeKeysMessage: string
  canCreateDataTypeKey: boolean
  isSavingDataTypeKey: boolean
  onOpenPanel: () => void
  onClosePanel: () => void
  onSearchChange: (value: string) => void
  onToggleCreate: () => void
  onDataTypeKeyNameChange: (value: string) => void
  onDataTypeKeyDataKeyChange: (value: string) => void
  onDataTypeKeyValueTypeChange: (value: string) => void
  onDataTypeKeyDecimalsChange: (value: string) => void
  onDataTypeKeyChartTypeChange: (value: string) => void
  onDataTypeKeyUnitChange: (value: string) => void
  onResetCreateForm: () => void
  onCreateDataTypeKey: () => void
  onToggleDataTypeKey: (id: number) => void
}

export const DeviceModelStepDataTypeKeys = ({
  selectedDataTypeKeys,
  sensorTypeIds,
  dataTypeKeySearch,
  dataTypeKeyCreateOpen,
  dataTypeKeyName,
  dataTypeKeyDataKey,
  dataTypeKeyValueType,
  dataTypeKeyDecimals,
  dataTypeKeyChartType,
  dataTypeKeyUnit,
  sensorTypePanelOpen,
  isDataTypeKeysError,
  sensorTypesError,
  isDataTypeKeysPending,
  filteredDataTypeKeys,
  emptyDataTypeKeysMessage,
  canCreateDataTypeKey,
  isSavingDataTypeKey,
  onOpenPanel,
  onClosePanel,
  onSearchChange,
  onToggleCreate,
  onDataTypeKeyNameChange,
  onDataTypeKeyDataKeyChange,
  onDataTypeKeyValueTypeChange,
  onDataTypeKeyDecimalsChange,
  onDataTypeKeyChartTypeChange,
  onDataTypeKeyUnitChange,
  onResetCreateForm,
  onCreateDataTypeKey,
  onToggleDataTypeKey,
}: DeviceModelStepDataTypeKeysProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">Selected data type keys</p>
        <Button size="tiny" type="primary" onClick={onOpenPanel}>
          Add
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border border-muted">
        <Table className="text-xs [&_th]:h-8 [&_th]:px-2 [&_td]:px-2 [&_td]:py-1">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Data key</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-12 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedDataTypeKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-foreground-light">
                  No data type keys selected.
                </TableCell>
              </TableRow>
            ) : (
              selectedDataTypeKeys.map((sensorType) => (
                <TableRow key={`selected-${sensorType.id}`}>
                  <TableCell>{sensorType.name}</TableCell>
                  <TableCell>{sensorType.data_key_name}</TableCell>
                  <TableCell>{sensorType.value_type}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="tiny"
                      type="text"
                      onClick={() => onToggleDataTypeKey(sensorType.id)}
                      aria-label="Remove data type key"
                      className="px-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>

    <SidePanel size="large" visible={sensorTypePanelOpen} header="Add data type keys" onCancel={onClosePanel}>
      <SidePanel.Content className="space-y-4 py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search data type keys"
            size="tiny"
            icon={<Search />}
            value={dataTypeKeySearch}
            className="w-full sm:w-64"
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Button size="tiny" type="default" onClick={onToggleCreate}>
            {dataTypeKeyCreateOpen ? 'Hide' : 'Create'}
          </Button>
        </div>
        {dataTypeKeyCreateOpen && (
          <div className="space-y-3 rounded-md border border-muted p-3">
            <Input
              size="tiny"
              label="Name"
              value={dataTypeKeyName}
              onChange={(event) => onDataTypeKeyNameChange(event.target.value)}
            />
            <Input
              size="tiny"
              label="Data key name"
              value={dataTypeKeyDataKey}
              onChange={(event) => onDataTypeKeyDataKeyChange(event.target.value)}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <SelectField
                label="Value type"
                type="select"
                value={dataTypeKeyValueType}
                onChange={onDataTypeKeyValueTypeChange}
              >
                {SENSOR_VALUE_TYPES.map((option) => (
                  <SelectField.Option
                    key={`data-type-value-${option.value}`}
                    id={`data-type-value-${option.value}`}
                    label={option.label}
                    value={option.value}
                  >
                    {option.label}
                  </SelectField.Option>
                ))}
              </SelectField>
              <SelectField
                label="Chart type"
                type="select"
                value={dataTypeKeyChartType}
                onChange={onDataTypeKeyChartTypeChange}
              >
                {SENSOR_CHART_TYPES.map((option) => (
                  <SelectField.Option
                    key={`data-type-chart-${option.value}`}
                    id={`data-type-chart-${option.value}`}
                    label={option.label}
                    value={option.value}
                  >
                    {option.label}
                  </SelectField.Option>
                ))}
              </SelectField>
            </div>
            {dataTypeKeyValueType === 'number' && (
              <Input
                size="tiny"
                label="Decimals"
                value={dataTypeKeyDecimals}
                onChange={(event) => onDataTypeKeyDecimalsChange(event.target.value)}
              />
            )}
            <Input
              size="tiny"
              label="Unit"
              value={dataTypeKeyUnit}
              onChange={(event) => onDataTypeKeyUnitChange(event.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                size="tiny"
                type="default"
                onClick={() => {
                  onResetCreateForm()
                  onToggleCreate()
                }}
                disabled={isSavingDataTypeKey}
              >
                Cancel
              </Button>
              <Button
                size="tiny"
                type="primary"
                onClick={onCreateDataTypeKey}
                disabled={!canCreateDataTypeKey}
                loading={isSavingDataTypeKey}
              >
                Create
              </Button>
            </div>
          </div>
        )}
        {isDataTypeKeysError && (
          <p className="text-sm text-destructive-600">
            {sensorTypesError?.message ?? 'Failed to load data type keys.'}
          </p>
        )}
        <div className="overflow-hidden rounded-md border border-muted">
          <Table className="text-xs [&_th]:h-8 [&_th]:px-2 [&_td]:px-2 [&_td]:py-1">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Data key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataTypeKeysPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-foreground-light">
                    Loading data type keys...
                  </TableCell>
                </TableRow>
              ) : filteredDataTypeKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-foreground-light">
                    {emptyDataTypeKeysMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDataTypeKeys.map((sensorType) => {
                  const isSelected = sensorTypeIds.includes(sensorType.id)
                  return (
                    <TableRow key={sensorType.id}>
                      <TableCell>{sensorType.name}</TableCell>
                      <TableCell>{sensorType.data_key_name}</TableCell>
                      <TableCell>{sensorType.value_type}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="tiny"
                          type={isSelected ? 'primary' : 'default'}
                          onClick={() => onToggleDataTypeKey(sensorType.id)}
                          disabled={isSelected}
                        >
                          {isSelected ? 'Added' : 'Add'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </SidePanel.Content>
    </SidePanel>
  </div>
)
