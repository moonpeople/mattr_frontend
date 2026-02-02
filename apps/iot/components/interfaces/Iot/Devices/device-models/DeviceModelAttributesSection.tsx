import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Button,
  SelectField,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { SENSOR_VALUE_TYPES } from './constants'
import type { DeviceModelAttributeRow } from './helpers'
import { parseAttributeValue } from './helpers'

const ATTRIBUTE_FORM_ID = 'device-model-attribute-form'
const attributeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  key: z.string().trim().min(1, 'Key is required.'),
  valueType: z.string().trim().min(1, 'Type is required.'),
  defaultValue: z.string().trim().min(1, 'Default value is required.'),
})

type AttributeFormValues = z.infer<typeof attributeSchema>

type DeviceModelAttributesSectionProps = {
  rows: DeviceModelAttributeRow[]
  onAddRow: (patch?: Partial<DeviceModelAttributeRow>) => void
  onUpdateRow: (index: number, patch: Partial<DeviceModelAttributeRow>) => void
  onRemoveRow: (index: number) => void
}

export const DeviceModelAttributesSection = ({
  rows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
}: DeviceModelAttributesSectionProps) => {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      key: '',
      valueType: 'string',
      defaultValue: '',
    },
  })

  const isEditing = editingIndex !== null
  const typeLabelMap = useMemo(
    () =>
      SENSOR_VALUE_TYPES.reduce<Record<string, string>>((acc, option) => {
        acc[option.value] = option.label
        return acc
      }, {}),
    []
  )

  const resetForm = () => {
    form.reset({
      name: '',
      key: '',
      valueType: 'string',
      defaultValue: '',
    })
    setEditingIndex(null)
  }

  const openCreatePanel = () => {
    resetForm()
    setPanelOpen(true)
  }

  const openEditPanel = (index: number) => {
    const row = rows[index]
    form.reset({
      name: row.name,
      key: row.key,
      valueType: row.valueType,
      defaultValue: row.defaultValue,
    })
    setEditingIndex(index)
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setDeleteConfirmOpen(false)
    resetForm()
  }

  const onSubmit = (values: AttributeFormValues) => {
    const name = values.name.trim()
    const key = values.key.trim()
    const valueType = values.valueType.trim()
    const rawValue = values.defaultValue ?? ''

    if (
      rows.some((row, index) => index !== editingIndex && row.key.trim() === key)
    ) {
      form.setError('key', { type: 'validate', message: 'Attribute key already exists.' })
      return
    }

    const parsed = parseAttributeValue(rawValue, valueType)
    if (parsed.error) {
      form.setError('defaultValue', { type: 'validate', message: parsed.error })
      return
    }

    const payload = {
      name,
      key,
      valueType,
      defaultValue: values.defaultValue,
    }

    if (editingIndex === null) {
      onAddRow(payload)
    } else {
      onUpdateRow(editingIndex, payload)
    }

    closePanel()
  }

  const canSave = form.formState.isValid

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Attributes</p>
          <p className="text-xs text-foreground-light">
            Default device attributes stored on the model.
          </p>
        </div>
        <Button size="tiny" type="default" onClick={openCreatePanel}>
          Add attribute
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border border-muted">
        <Table className="[&_td]:py-1.5">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead className="w-40">Type</TableHead>
              <TableHead>Default value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-foreground-light">
                  No attributes yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => openEditPanel(index)}
                >
                  <TableCell>
                    <div className="text-sm">{row.name || '--'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground-light">{row.key || '--'}</div>
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="text-sm text-foreground-light">
                      {typeLabelMap[row.valueType] ?? row.valueType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="truncate text-sm">{row.defaultValue || '--'}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <SidePanel
        size="large"
        visible={panelOpen}
        header={isEditing ? 'Edit attribute' : 'Add attribute'}
        onCancel={closePanel}
        customFooter={
          <div className="flex w-full items-center justify-between border-t border-default px-4 py-4">
            {isEditing ? (
              <Button type="danger" onClick={() => setDeleteConfirmOpen(true)}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="default" onClick={closePanel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" form={ATTRIBUTE_FORM_ID} disabled={!canSave}>
                {isEditing ? 'Save' : 'Add attribute'}
              </Button>
            </div>
          </div>
        }
      >
        <SidePanel.Content className="space-y-4 py-6">
          <Form_Shadcn_ {...form}>
            <form id={ATTRIBUTE_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="space-y-2">
                    <FormLabel_Shadcn_ htmlFor="device-model-attribute-name">Name</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="device-model-attribute-name"
                        placeholder="Name"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="space-y-2">
                    <FormLabel_Shadcn_ htmlFor="device-model-attribute-key">Key</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="device-model-attribute-key"
                        placeholder="key"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="valueType"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="space-y-2">
                    <FormLabel_Shadcn_>Type</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <SelectField
                        type="select"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        {SENSOR_VALUE_TYPES.map((option) => (
                          <SelectField.Option
                            key={option.value}
                            id={`device-model-attribute-${option.value}`}
                            label={option.label}
                            value={option.value}
                          >
                            {option.label}
                          </SelectField.Option>
                        ))}
                      </SelectField>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="space-y-2">
                    <FormLabel_Shadcn_ htmlFor="device-model-attribute-default">
                      Default value
                    </FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="device-model-attribute-default"
                        placeholder="Default value"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
            </form>
          </Form_Shadcn_>
        </SidePanel.Content>
      </SidePanel>
      <ConfirmationModal
        visible={deleteConfirmOpen}
        title="Delete attribute"
        confirmLabel="Delete"
        variant="destructive"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (editingIndex !== null) {
            onRemoveRow(editingIndex)
          }
          setDeleteConfirmOpen(false)
          closePanel()
        }}
      >
        <p className="text-sm text-foreground-light">
          This will remove the attribute from the device model defaults.
        </p>
      </ConfirmationModal>
    </div>
  )
}
