import Link from 'next/link'
import { useParams } from 'common'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import {
  useIotGatewayCreateMutation,
  useIotGatewayDeleteMutation,
  useIotGatewayUpdateMutation,
  useIotGatewaysQuery,
} from 'data/iot/gateways'
import type { IotGateway } from 'data/iot/types'
import type { IotGatewayPayload } from 'data/iot/gateways'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
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

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '--')
const formatCount = (value?: number | null) => (Number.isFinite(value) ? value : 0)

const GatewaysPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { data: gateways = [], isPending, isError, error } = useIotGatewaysQuery()
  const { mutateAsync: createGateway, isPending: isCreating } = useIotGatewayCreateMutation()
  const { mutateAsync: updateGateway, isPending: isUpdating } = useIotGatewayUpdateMutation()
  const { mutateAsync: deleteGateway, isPending: isDeleting } = useIotGatewayDeleteMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGateway, setEditingGateway] = useState<IotGateway | null>(null)

  const onOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setEditingGateway(null)
  }

  const onDeleteGateway = async (gateway: IotGateway) => {
    if (!confirm(`Delete gateway "${gateway.name}"?`)) return
    try {
      await deleteGateway({ gatewayId: gateway.id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete gateway.')
    }
  }

  const gatewayRows = useMemo(() => gateways, [gateways])

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>Gateways</PageHeaderTitle>
        <PageHeaderDescription>Manage gateway devices, connectors, and configuration.</PageHeaderDescription>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Gateways</CardTitle>
              <Button
                size="tiny"
                type="primary"
                onClick={() => {
                  setEditingGateway(null)
                  setDialogOpen(true)
                }}
              >
                New gateway
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isError && <p className="text-sm text-destructive-600">{error?.message}</p>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Connectors</TableHead>
                    <TableHead>Errors (30d)</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Last online</TableHead>
                    <TableHead className="w-56">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-sm text-foreground-light">
                        Loading gateways...
                      </TableCell>
                    </TableRow>
                  ) : gatewayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-sm text-foreground-light">
                        No gateways yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gatewayRows.map((gateway) => (
                      <TableRow key={gateway.id}>
                        <TableCell>{gateway.id}</TableCell>
                        <TableCell>{gateway.name || '--'}</TableCell>
                        <TableCell>{gateway.serial_number || '--'}</TableCell>
                        <TableCell>{gateway.gateway_status || (gateway.receive_data ? 'Enabled' : 'Disabled')}</TableCell>
                        <TableCell>
                          {formatCount(gateway.child_online_count)} / {formatCount(gateway.child_total_count)}
                        </TableCell>
                        <TableCell>
                          {formatCount(gateway.connector_enabled_count)} /{' '}
                          {formatCount(gateway.connector_total_count)}
                        </TableCell>
                        <TableCell>{formatCount(gateway.errors_30d)}</TableCell>
                        <TableCell>{gateway.gateway_version || '--'}</TableCell>
                        <TableCell>{formatDate(gateway.last_online_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="tiny" type="default" asChild>
                              <Link href={`/project/${projectRef}/gateways/${gateway.id}`}>
                                Open
                              </Link>
                            </Button>
                            <Button
                              size="tiny"
                              type="default"
                              onClick={() => {
                                setEditingGateway(gateway)
                                setDialogOpen(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="tiny"
                              type="danger"
                              onClick={() => onDeleteGateway(gateway)}
                              disabled={isDeleting}
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
            </CardContent>
          </Card>
          <GatewayDialog
            open={dialogOpen}
            onOpenChange={onOpenChange}
            gateway={editingGateway}
            onCreate={createGateway}
            onUpdate={updateGateway}
            isSaving={isCreating || isUpdating}
          />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

GatewaysPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default GatewaysPage

const GatewayDialog = ({
  open,
  onOpenChange,
  gateway,
  onCreate,
  onUpdate,
  isSaving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  gateway: IotGateway | null
  onCreate: (args: { payload: IotGatewayPayload }) => Promise<unknown>
  onUpdate: (args: { gatewayId: string | number; payload: IotGatewayPayload }) => Promise<unknown>
  isSaving: boolean
}) => {
  const [name, setName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [description, setDescription] = useState('')
  const [firmwareVersion, setFirmwareVersion] = useState('')
  const [receiveData, setReceiveData] = useState(true)

  useEffect(() => {
    if (!open) return
    if (gateway) {
      setName(gateway.name ?? '')
      setSerialNumber(gateway.serial_number ?? '')
      setDescription(gateway.description ?? '')
      setFirmwareVersion(gateway.firmware_version ?? '')
      setReceiveData(gateway.receive_data ?? true)
    } else {
      setName('')
      setSerialNumber('')
      setDescription('')
      setFirmwareVersion('')
      setReceiveData(true)
    }
  }, [open, gateway])

  const handleClose = () => onOpenChange(false)

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedSerial = serialNumber.trim()
    if (!trimmedName || !trimmedSerial) {
      toast.error('Gateway name and serial number are required.')
      return
    }

    const payload: IotGatewayPayload = {
      name: trimmedName,
      serial_number: trimmedSerial,
      description: description.trim() || null,
      firmware_version: firmwareVersion.trim() || null,
      receive_data: receiveData,
    }

    try {
      if (gateway) {
        await onUpdate({ gatewayId: gateway.id, payload })
      } else {
        await onCreate({ payload })
      }
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save gateway.')
    }
  }

  const canSubmit = !!name.trim() && !!serialNumber.trim() && !isSaving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader padding="small">
          <DialogTitle>{gateway ? 'Edit gateway' : 'New gateway'}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection padding="small" className="space-y-4">
          <Input
            id="gateway-name"
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            id="gateway-serial"
            label="Serial number"
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
          />
          <Input
            id="gateway-description"
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Input
            id="gateway-firmware"
            label="Firmware version"
            value={firmwareVersion}
            onChange={(event) => setFirmwareVersion(event.target.value)}
          />
          <Checkbox
            label="Receive data"
            checked={receiveData}
            onChange={(event) => setReceiveData(event.target.checked)}
          />
        </DialogSection>
        <DialogFooter padding="small">
          <Button type="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {gateway ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
