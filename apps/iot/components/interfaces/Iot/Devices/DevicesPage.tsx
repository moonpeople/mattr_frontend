import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  useIotDeviceCreateMutation,
  useIotDeviceDeleteMutation,
  useIotDeviceUpdateMutation,
  useIotDevicesQuery,
} from 'data/iot/devices'
import { useIotDeviceModelsQuery } from 'data/iot/device-models'
import { useIotGatewaysQuery } from 'data/iot/gateways'
import type { IotDevice } from 'data/iot/types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import {
  ReportsSelectFilter,
  type SelectFilters,
} from 'components/interfaces/Reports/v2/ReportsSelectFilter'
import { Search, Server } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import {
  Alert,
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader, PageHeaderDescription, PageHeaderTitle } from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { formatDate } from './device-utils'
import { ManageDeviceDialog } from './ManageDeviceDialog'
import { ManageSensorsDialog } from './ManageSensorsDialog'

const DevicesPage: NextPageWithLayout = () => {
  const { ref: projectRef = 'default' } = useParams()
  const { data: models = [] } = useIotDeviceModelsQuery()
  const { data: gateways = [] } = useIotGatewaysQuery()

  const {
    data: devices = [],
    isPending,
    isError,
    error,
  } = useIotDevicesQuery()
  const [sensorDialogOpen, setSensorDialogOpen] = useState(false)
  const [activeDevice, setActiveDevice] = useState<IotDevice | null>(null)
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<IotDevice | null>(null)
  const [deviceSearch, setDeviceSearch] = useState('')
  const [deviceModelFilters, setDeviceModelFilters] = useState<SelectFilters>([])
  const [deviceGatewayFilters, setDeviceGatewayFilters] = useState<SelectFilters>([])
  const [deviceStatusFilters, setDeviceStatusFilters] = useState<SelectFilters>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingDevice, setDeletingDevice] = useState<IotDevice | null>(null)

  const { mutateAsync: createDevice, isPending: isCreatingDevice } = useIotDeviceCreateMutation()
  const { mutateAsync: updateDevice, isPending: isUpdatingDevice } = useIotDeviceUpdateMutation()
  const { mutateAsync: deleteDevice, isPending: isDeletingDevice } = useIotDeviceDeleteMutation()

  const onSensorDialogChange = (open: boolean) => {
    setSensorDialogOpen(open)
    if (!open) setActiveDevice(null)
  }

  const onDeviceDialogChange = (open: boolean) => {
    setDeviceDialogOpen(open)
    if (!open) setEditingDevice(null)
  }

  const onDeleteDevice = (device: IotDevice) => {
    setDeletingDevice(device)
    setDeleteModalOpen(true)
  }

  const modelMap = new Map(models.map((model) => [model.id, model]))
  const gatewayMap = new Map(gateways.map((gateway) => [gateway.id, gateway]))

  const filteredDevices = useMemo(() => {
    const searchValue = deviceSearch.trim().toLowerCase()
    return devices.filter((device) => {
      if (searchValue) {
        const name = device.name?.toLowerCase() ?? ''
        const serial = device.serial_number?.toLowerCase() ?? ''
        if (!name.includes(searchValue) && !serial.includes(searchValue)) return false
      }

      if (deviceModelFilters.length > 0) {
        const modelId = device.model_id
        const matchesModel = modelId != null && deviceModelFilters.includes(String(modelId))
        const matchesNone = modelId == null && deviceModelFilters.includes('none')
        if (!matchesModel && !matchesNone) return false
      }

      if (deviceGatewayFilters.length > 0) {
        const gatewayId = device.gateway_id
        const matchesGateway = gatewayId != null && deviceGatewayFilters.includes(String(gatewayId))
        const matchesNone = gatewayId == null && deviceGatewayFilters.includes('none')
        if (!matchesGateway && !matchesNone) return false
      }

      if (deviceStatusFilters.length > 0) {
        const statusValue = device.receive_data ? 'enabled' : 'disabled'
        if (!deviceStatusFilters.includes(statusValue)) return false
      }

      return true
    })
  }, [devices, deviceSearch, deviceModelFilters, deviceGatewayFilters, deviceStatusFilters])
  const emptyDeviceMessage =
    devices.length === 0 ? 'No devices yet.' : 'No devices match your filters.'
  const canCreateDevice = models.length > 0
  const orderedDevices = useMemo(() => {
    if (filteredDevices.length === 0) return []

    const result: IotDevice[] = []
    const emittedGateways = new Set<number>()
    const pendingChildren = new Map<number, IotDevice[]>()

    const pushChildren = (gatewayId: number) => {
      const children = pendingChildren.get(gatewayId)
      if (children && children.length > 0) {
        result.push(...children)
      }
      pendingChildren.delete(gatewayId)
    }

    const sortedDevices = [...filteredDevices].sort((a, b) => a.id - b.id)

    sortedDevices.forEach((device) => {
      if (device.is_gateway) {
        result.push(device)
        emittedGateways.add(device.id)
        pushChildren(device.id)
        return
      }

      if (device.gateway_id != null) {
        if (emittedGateways.has(device.gateway_id)) {
          result.push(device)
        } else {
          const bucket = pendingChildren.get(device.gateway_id) ?? []
          bucket.push(device)
          pendingChildren.set(device.gateway_id, bucket)
        }
        return
      }

      result.push(device)
    })

    pendingChildren.forEach((children) => {
      result.push(...children)
    })

    return result
  }, [filteredDevices, devices])

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>Devices</PageHeaderTitle>
        <PageHeaderDescription>
          Manage device inventory, models, data type keys, and sensors.
        </PageHeaderDescription>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                <Input
                  placeholder="Search devices"
                  size="tiny"
                  icon={<Search />}
                  value={deviceSearch}
                  className="w-full lg:w-56"
                  onChange={(event) => setDeviceSearch(event.target.value)}
                />
                <ReportsSelectFilter
                  label="Model"
                  options={[
                    { label: 'No model', value: 'none' },
                    ...models.map((model) => ({
                      label: model.name,
                      value: String(model.id),
                    })),
                  ]}
                  value={deviceModelFilters}
                  onChange={setDeviceModelFilters}
                  showSearch
                />
                <ReportsSelectFilter
                  label="Gateway"
                  options={[
                    { label: 'No gateway', value: 'none' },
                    ...gateways.map((gateway) => ({
                      label: gateway.name,
                      value: String(gateway.id),
                    })),
                  ]}
                  value={deviceGatewayFilters}
                  onChange={setDeviceGatewayFilters}
                  showSearch
                />
                <ReportsSelectFilter
                  label="Status"
                  options={[
                    { label: 'Enabled', value: 'enabled' },
                    { label: 'Disabled', value: 'disabled' },
                  ]}
                  value={deviceStatusFilters}
                  onChange={setDeviceStatusFilters}
                />
              </div>
              <div className="flex items-center gap-x-2">
                <Button
                  size="tiny"
                  type="primary"
                  onClick={() => {
                    setEditingDevice(null)
                    setDeviceDialogOpen(true)
                  }}
                  disabled={!canCreateDevice}
                >
                  New device
                </Button>
              </div>
            </div>
            <Alert variant="info" withIcon title="Devices represent physical assets in your fleet">
              Use devices to track telemetry, attach gateways, and view status across models.
            </Alert>
            {!canCreateDevice && (
              <Alert variant="info" withIcon title="Create a device model first">
                Devices require a model. Create a device model to enable device creation.
              </Alert>
            )}
            {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Last online</TableHead>
                    <TableHead className="w-56">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-sm text-foreground-light">
                        Loading devices...
                      </TableCell>
                    </TableRow>
                  ) : filteredDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-sm text-foreground-light">
                        {emptyDeviceMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderedDevices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          {device.is_gateway ? (
                            <Server className="h-4 w-4 text-foreground-light" />
                          ) : null}
                        </TableCell>
                        <TableCell>{device.id}</TableCell>
                        <TableCell>
                          <Link
                            href={`/project/${projectRef}/devices/${device.id}`}
                            className="text-foreground hover:underline"
                          >
                            {device.name || device.serial_number || `#${device.id}`}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {device.model_id ? modelMap.get(device.model_id)?.name || '--' : '--'}
                        </TableCell>
                        <TableCell>{device.receive_data ? 'Enabled' : 'Disabled'}</TableCell>
                        <TableCell>
                          {device.gateway_id
                            ? gatewayMap.get(device.gateway_id)?.name || '--'
                            : '--'}
                        </TableCell>
                        <TableCell>{formatDate(device.last_online_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="tiny"
                              type="default"
                              onClick={() => {
                                setEditingDevice(device)
                                setDeviceDialogOpen(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="tiny"
                              type="default"
                              onClick={() => {
                                setActiveDevice(device)
                                setSensorDialogOpen(true)
                              }}
                            >
                              Sensors
                            </Button>
                            <Button
                              size="tiny"
                              type="danger"
                              onClick={() => onDeleteDevice(device)}
                              disabled={isDeletingDevice}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            <ManageSensorsDialog
              device={activeDevice}
              open={sensorDialogOpen}
              onOpenChange={onSensorDialogChange}
            />
            <ManageDeviceDialog
              models={models}
              open={deviceDialogOpen}
              device={editingDevice}
              onOpenChange={onDeviceDialogChange}
              onCreate={createDevice}
              onUpdate={updateDevice}
              isSaving={isCreatingDevice || isUpdatingDevice}
            />
            <ConfirmationModal
              visible={deleteModalOpen}
              loading={isDeletingDevice}
              variant="destructive"
              confirmLabel="Delete device"
              confirmLabelLoading="Deleting"
              title={`Delete device “${deletingDevice?.name || deletingDevice?.serial_number || ''}”`}
              onCancel={() => {
                setDeleteModalOpen(false)
                setDeletingDevice(null)
              }}
              onConfirm={async () => {
                if (!deletingDevice) return
                try {
                  await deleteDevice({ deviceId: deletingDevice.id })
                  setDeleteModalOpen(false)
                  setDeletingDevice(null)
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to delete device.')
                }
              }}
            >
              <p className="text-sm text-foreground-light">
                This action cannot be undone. The device and its data will be removed.
              </p>
            </ConfirmationModal>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

DevicesPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default DevicesPage
