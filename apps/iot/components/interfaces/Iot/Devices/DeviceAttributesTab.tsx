import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useIotDeviceAttributesQuery, useIotDeviceAttributesUpsertMutation } from 'data/iot/device-attributes'
import type { IotDevice, IotDeviceModel } from 'data/iot/types'
import {
  Alert,
  Button,
  Card,
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
import { SENSOR_VALUE_TYPES } from './device-models/constants'
import type { DeviceModelAttributeRow } from './device-models/helpers'
import {
  formatAttributeValue,
  normalizeProfileAttributes,
  parseAttributeValue,
} from './device-models/helpers'

const ATTRIBUTE_FORM_ID = 'device-attribute-edit-form'
const attributeSchema = z.object({
  value: z.string().trim().min(1, 'Value is required.'),
})

type AttributeFormValues = z.infer<typeof attributeSchema>

type DeviceAttributesTabProps = {
  device: IotDevice
  model: IotDeviceModel | null
}

export const DeviceAttributesTab = ({ device, model }: DeviceAttributesTabProps) => {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<DeviceModelAttributeRow | null>(null)
  const { data: deviceAttributes = [], isPending: isAttributesPending } =
    useIotDeviceAttributesQuery({
      deviceId: device.id,
      scope: 'server',
      enabled: !!device.id,
    })
  const { mutateAsync: upsertAttributes, isPending: isSaving } =
    useIotDeviceAttributesUpsertMutation()

  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema),
    mode: 'onChange',
    defaultValues: {
      value: '',
    },
  })

  const modelAttributes = useMemo(
    () => normalizeProfileAttributes(model?.profile_config ?? null),
    [model?.profile_config]
  )
  const attributeMap = useMemo(
    () => new Map(deviceAttributes.map((attribute) => [attribute.key, attribute])),
    [deviceAttributes]
  )
  const typeLabelMap = useMemo(
    () =>
      SENSOR_VALUE_TYPES.reduce<Record<string, string>>((acc, option) => {
        acc[option.value] = option.label
        return acc
      }, {}),
    []
  )

  const resetForm = () => {
    form.reset({ value: '' })
    setEditingRow(null)
  }

  const closePanel = () => {
    setPanelOpen(false)
    resetForm()
  }

  const openEditPanel = (row: DeviceModelAttributeRow) => {
    const currentValue = attributeMap.get(row.key)?.value ?? row.defaultValue
    form.reset({ value: formatAttributeValue(currentValue) })
    setEditingRow(row)
    setPanelOpen(true)
  }

  const onSubmit = async (values: AttributeFormValues) => {
    if (!editingRow) return

    const parsed = parseAttributeValue(values.value, editingRow.valueType)
    if (parsed.error) {
      form.setError('value', { type: 'validate', message: parsed.error })
      return
    }

    try {
      await upsertAttributes({
        deviceId: device.id,
        payload: {
          scope: 'server',
          attributes: {
            [editingRow.key]: parsed.value,
          },
        },
      })
      toast.success('Attribute updated.')
      closePanel()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update attribute.')
    }
  }

  const canSave = form.formState.isValid && !isSaving

  const isEmptyState = !model || modelAttributes.length === 0

  return (
    <>
      <div className="overflow-hidden rounded-md border border-muted">
        <Table className="[&_td]:py-1.5">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead className="w-40">Type</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAttributesPending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-foreground-light">
                  Loading attributes...
                </TableCell>
              </TableRow>
            ) : isEmptyState ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-foreground-light">
                  {model ? 'No attributes yet.' : 'Attach a device model to manage attributes.'}
                </TableCell>
              </TableRow>
            ) : (
              modelAttributes.map((row) => {
                const attribute = attributeMap.get(row.key)
                const displayValue = formatAttributeValue(
                  attribute?.value ?? row.defaultValue
                )
                const isDefault = !attribute

                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => openEditPanel(row)}
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
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="truncate text-sm">{displayValue || '--'}</div>
                        {isDefault && (
                          <span className="text-[11px] text-foreground-light">Default</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <SidePanel
        size="large"
        visible={panelOpen}
        header="Edit attribute"
        onCancel={closePanel}
        customFooter={
          <div className="flex w-full items-center justify-end gap-2 border-t border-default px-4 py-4">
            <Button type="default" onClick={closePanel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" form={ATTRIBUTE_FORM_ID} disabled={!canSave}>
              Save
            </Button>
          </div>
        }
      >
        <SidePanel.Content className="space-y-4 py-6">
          {editingRow ? (
            <Form_Shadcn_ {...form}>
              <form id={ATTRIBUTE_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-foreground-light">Name</p>
                  <p className="text-sm">{editingRow.name || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-foreground-light">Key</p>
                  <p className="text-sm">{editingRow.key || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-foreground-light">Type</p>
                  <p className="text-sm">
                    {typeLabelMap[editingRow.valueType] ?? editingRow.valueType}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-foreground-light">Default value</p>
                  <p className="text-sm">{editingRow.defaultValue || '--'}</p>
                </div>
                <FormField_Shadcn_
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="space-y-2">
                      <FormLabel_Shadcn_ htmlFor="device-attribute-value">Value</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          id="device-attribute-value"
                          placeholder="Value"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </form>
            </Form_Shadcn_>
          ) : (
            <p className="text-sm text-foreground-light">Select an attribute to edit.</p>
          )}
        </SidePanel.Content>
      </SidePanel>
    </>
  )
}
