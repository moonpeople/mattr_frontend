import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useIotDeviceCredentialCreateMutation } from 'data/iot/devices'
import type { IotDevicePayload } from 'data/iot/devices'
import type { IotDevice, IotDeviceModel } from 'data/iot/types'
import { useIotGatewayConfigMutation, useIotGatewayConfigQuery } from 'data/iot/gateways'
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SidePanel,
} from 'ui'
import {
  DEFAULT_DEVICE_LWM2M_CONFIG,
  DEFAULT_DEVICE_SNMP_CONFIG,
  POWER_MODES,
  SNMP_AUTH_PROTOCOLS,
  SNMP_PRIVACY_PROTOCOLS,
  SNMP_PROTOCOL_VERSIONS,
  normalizeDeviceLwm2mConfig,
  normalizeDeviceSnmpConfig,
} from './device-transport'

const DEVICE_WIZARD_STEPS = [
  { id: 'details', label: 'Device details' },
  { id: 'credentials', label: 'Credentials' },
]

export const ManageDeviceDialog = ({
  models,
  open,
  device,
  initialPayload,
  onOpenChange,
  onCreate,
  onUpdate,
  isSaving,
}: {
  models: IotDeviceModel[]
  open: boolean
  device: IotDevice | null
  initialPayload?: Partial<IotDevicePayload>
  onOpenChange: (open: boolean) => void
  onCreate: (args: { payload: IotDevicePayload }) => Promise<IotDevice>
  onUpdate: (args: { deviceId: string | number; payload: IotDevicePayload }) => Promise<IotDevice>
  isSaving: boolean
}) => {
  const [name, setName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [modelId, setModelId] = useState('')
  const [isGateway, setIsGateway] = useState(false)
  const [overwriteActivityTime, setOverwriteActivityTime] = useState(false)
  const [description, setDescription] = useState('')
  const [firmwareVersion, setFirmwareVersion] = useState('')
  const [softwareVersion, setSoftwareVersion] = useState('')
  const [receiveData, setReceiveData] = useState(true)
  const [lwm2mDeviceConfig, setLwm2mDeviceConfig] = useState(DEFAULT_DEVICE_LWM2M_CONFIG)
  const [snmpDeviceConfig, setSnmpDeviceConfig] = useState(DEFAULT_DEVICE_SNMP_CONFIG)
  const [deviceWizardStep, setDeviceWizardStep] = useState(0)
  const [credentialKey, setCredentialKey] = useState('')

  const parsedModelId = modelId ? Number(modelId) : null
  const selectedModel = Number.isNaN(parsedModelId)
    ? null
    : models.find((model) => model.id === parsedModelId)
  const selectedTransportType = selectedModel?.transport_type ?? 'http'
  const isSnmpV3 = snmpDeviceConfig.protocolVersion === 'V3'
  const isCreateMode = !device
  const credentialsRequired = selectedTransportType === 'lwm2m'
  const credentialKeyValue = credentialKey.trim()
  const canProceedDetails = isCreateMode
    ? !!name.trim() && !!serialNumber.trim() && !!modelId
    : !!name.trim() && !!serialNumber.trim()
  const canSubmitWizard = canProceedDetails && (!credentialsRequired || !!credentialKeyValue)
  const canSubmitEdit = canProceedDetails && !isSaving
  const maxWizardStep = DEVICE_WIZARD_STEPS.length - 1

  const { mutateAsync: createDeviceCredential, isPending: isCreatingCredential } =
    useIotDeviceCredentialCreateMutation()
  const { mutateAsync: updateGatewayConfig, isPending: isUpdatingGatewayConfig } =
    useIotGatewayConfigMutation()
  const { data: gatewayConfig } = useIotGatewayConfigQuery(device?.id ?? 0, {
    enabled: open && !!device?.id && !!device?.is_gateway,
  })
  const isWizardSaving = isSaving || isCreatingCredential || isUpdatingGatewayConfig

  useEffect(() => {
    if (!open) return
    setDeviceWizardStep(0)
    setCredentialKey('')
    if (device) {
      setName(device.name ?? '')
      setSerialNumber(device.serial_number ?? '')
      setModelId(device.model_id ? device.model_id.toString() : '')
      setIsGateway(device.is_gateway ?? false)
      const config = (gatewayConfig?.config ?? {}) as Record<string, any>
      const overwriteValue =
        config.overwrite_activity_time ??
        config.overwriteActivityTime ??
        config.overwrite_activity ??
        config.overwriteActivity ??
        false
      setOverwriteActivityTime(Boolean(overwriteValue))
      setDescription(device.description ?? '')
      setFirmwareVersion(device.firmware_version ?? '')
      setSoftwareVersion(device.software_version ?? '')
      setReceiveData(device.receive_data ?? true)
      const transportConfig = (device.transport_config as Record<string, any>) || {}
      setLwm2mDeviceConfig(normalizeDeviceLwm2mConfig(transportConfig.lwm2m))
      setSnmpDeviceConfig(normalizeDeviceSnmpConfig(transportConfig.snmp))
    } else {
      const initialModelId = initialPayload?.model_id ?? models[0]?.id
      setName(initialPayload?.name ?? '')
      setSerialNumber(initialPayload?.serial_number ?? '')
      setModelId(initialModelId ? String(initialModelId) : '')
      setIsGateway(Boolean(initialPayload?.is_gateway ?? false))
      setOverwriteActivityTime(false)
      setDescription(initialPayload?.description ?? '')
      setFirmwareVersion(initialPayload?.firmware_version ?? '')
      setSoftwareVersion(initialPayload?.software_version ?? '')
      setReceiveData(initialPayload?.receive_data ?? true)
      setLwm2mDeviceConfig(DEFAULT_DEVICE_LWM2M_CONFIG)
      setSnmpDeviceConfig(DEFAULT_DEVICE_SNMP_CONFIG)
    }
  }, [open, device, models, gatewayConfig, initialPayload])

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedSerial = serialNumber.trim()
    if (!trimmedName || !trimmedSerial) {
      toast.error('Device name and serial number are required.')
      return
    }
    if (!device && !modelId) {
      toast.error('Device model is required.')
      return
    }

    const modelIdValue =
      parsedModelId === null || Number.isNaN(parsedModelId) ? null : parsedModelId
    const transportConfigPayload =
      selectedTransportType === 'lwm2m'
        ? { lwm2m: lwm2mDeviceConfig }
        : selectedTransportType === 'snmp'
          ? { snmp: snmpDeviceConfig }
          : null
    const payload = {
      name: trimmedName,
      serial_number: trimmedSerial,
      model_id: modelIdValue,
      is_gateway: isGateway,
      description: description.trim() || null,
      firmware_version: firmwareVersion.trim() || null,
      software_version: softwareVersion.trim() || null,
      receive_data: receiveData,
      ...(transportConfigPayload ? { transport_config: transportConfigPayload } : {}),
    }

    try {
      if (device) {
        await onUpdate({ deviceId: device.id, payload })
        if (isGateway) {
          await updateGatewayConfig({
            gatewayId: device.id,
            payload: { config: { overwrite_activity_time: overwriteActivityTime } },
          })
        }
      } else {
        const created = await onCreate({ payload })
        const shouldCreateCredential = !!credentialKeyValue || credentialsRequired
        if (shouldCreateCredential) {
          await createDeviceCredential({
            deviceId: created.id,
            payload: {
              auth_type: 'key',
              ...(credentialKeyValue ? { key_id: credentialKeyValue } : {}),
            },
          })
        }
        if (isGateway) {
          await updateGatewayConfig({
            gatewayId: created.id,
            payload: { config: { overwrite_activity_time: overwriteActivityTime } },
          })
        }
      }
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save device.')
    }
  }

  const handlePrevWizardStep = () => {
    setDeviceWizardStep((current) => (current > 0 ? current - 1 : current))
  }

  const handleNextWizardStep = () => {
    if (!canProceedDetails) return
    setDeviceWizardStep((current) => (current < maxWizardStep ? current + 1 : current))
  }

  const detailsForm = (
    <>
      <Input
        id="device-name"
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Input
        id="device-serial"
        label="Serial number"
        value={serialNumber}
        onChange={(event) => setSerialNumber(event.target.value)}
      />
      {!isCreateMode && (
        <Input
          id="device-uid"
          label="Device UID"
          value={device?.device_uid ?? ''}
          disabled
        />
      )}
      <div className="space-y-1">
        <p className="text-xs text-foreground-light">Device model</p>
        <Select_Shadcn_ value={modelId} onValueChange={(nextValue) => setModelId(nextValue)}>
          <SelectTrigger_Shadcn_ size="small">
            <SelectValue_Shadcn_ placeholder="No model" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {models.map((model) => (
              <SelectItem_Shadcn_
                key={model.id}
                value={model.id.toString()}
                className="text-xs"
              >
                {model.name}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </div>
      <Checkbox
        name="device-is-gateway"
        label="Gateway device"
        description="Mark this device as a gateway."
        checked={isGateway}
        onChange={(event) => {
          const nextValue = event.target.checked
          setIsGateway(nextValue)
        }}
      />
      {isGateway && (
        <Checkbox
          name="device-overwrite-activity-time"
          label="Overwrite activity time for connected device"
          description="Gateway updates last activity timestamps for connected devices."
          checked={overwriteActivityTime}
          onChange={(event) => setOverwriteActivityTime(event.target.checked)}
        />
      )}
      <Input
        id="device-description"
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      {!isCreateMode && (
        <>
          <Input
            id="device-firmware"
            label="Assigned firmware"
            value={firmwareVersion}
            onChange={(event) => setFirmwareVersion(event.target.value)}
          />
          <Input
            id="device-software"
            label="Assigned software"
            value={softwareVersion}
            onChange={(event) => setSoftwareVersion(event.target.value)}
          />
        </>
      )}
      {selectedTransportType === 'lwm2m' && (
        <div className="space-y-4 rounded-md border border-muted p-3">
          <p className="text-sm font-medium">LwM2M device configuration</p>
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Power mode</p>
            <Select_Shadcn_
              value={lwm2mDeviceConfig.powerMode ?? 'DRX'}
              onValueChange={(nextValue) =>
                setLwm2mDeviceConfig((current) => ({
                  ...current,
                  powerMode: nextValue,
                }))
              }
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select power mode" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {POWER_MODES.map((option) => (
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
          <Input
            id="device-lwm2m-edrx-cycle"
            label="eDRX cycle"
            type="number"
            value={String(lwm2mDeviceConfig.edrxCycle ?? 0)}
            onChange={(event) =>
              setLwm2mDeviceConfig((current) => ({
                ...current,
                edrxCycle: Number(event.target.value || 0),
              }))
            }
          />
          <Input
            id="device-lwm2m-paging-window"
            label="Paging transmission window"
            type="number"
            value={String(lwm2mDeviceConfig.pagingTransmissionWindow ?? 0)}
            onChange={(event) =>
              setLwm2mDeviceConfig((current) => ({
                ...current,
                pagingTransmissionWindow: Number(event.target.value || 0),
              }))
            }
          />
          <Input
            id="device-lwm2m-psm-activity"
            label="PSM activity timer"
            type="number"
            value={String(lwm2mDeviceConfig.psmActivityTimer ?? 0)}
            onChange={(event) =>
              setLwm2mDeviceConfig((current) => ({
                ...current,
                psmActivityTimer: Number(event.target.value || 0),
              }))
            }
          />
        </div>
      )}
      {selectedTransportType === 'snmp' && (
        <div className="space-y-4 rounded-md border border-muted p-3">
          <p className="text-sm font-medium">SNMP device configuration</p>
          <Input
            id="device-snmp-host"
            label="Host"
            value={snmpDeviceConfig.host ?? ''}
            onChange={(event) =>
              setSnmpDeviceConfig((current) => ({
                ...current,
                host: event.target.value,
              }))
            }
          />
          <Input
            id="device-snmp-port"
            label="Port"
            type="number"
            value={String(snmpDeviceConfig.port ?? 161)}
            onChange={(event) =>
              setSnmpDeviceConfig((current) => ({
                ...current,
                port: Number(event.target.value || 0),
              }))
            }
          />
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Protocol version</p>
            <Select_Shadcn_
              value={snmpDeviceConfig.protocolVersion ?? 'V2C'}
              onValueChange={(nextValue) =>
                setSnmpDeviceConfig((current) => ({
                  ...current,
                  protocolVersion: nextValue,
                }))
              }
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select version" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {SNMP_PROTOCOL_VERSIONS.map((option) => (
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
          {!isSnmpV3 && (
            <Input
              id="device-snmp-community"
              label="Community"
              value={snmpDeviceConfig.community ?? ''}
              onChange={(event) =>
                setSnmpDeviceConfig((current) => ({
                  ...current,
                  community: event.target.value,
                }))
              }
            />
          )}
          {isSnmpV3 && (
            <>
              <Input
                id="device-snmp-username"
                label="Username"
                value={snmpDeviceConfig.username ?? ''}
                onChange={(event) =>
                  setSnmpDeviceConfig((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
              />
              <Input
                id="device-snmp-security-name"
                label="Security name"
                value={snmpDeviceConfig.securityName ?? ''}
                onChange={(event) =>
                  setSnmpDeviceConfig((current) => ({
                    ...current,
                    securityName: event.target.value,
                  }))
                }
              />
              <Input
                id="device-snmp-context-name"
                label="Context name"
                value={snmpDeviceConfig.contextName ?? ''}
                onChange={(event) =>
                  setSnmpDeviceConfig((current) => ({
                    ...current,
                    contextName: event.target.value,
                  }))
                }
              />
              <div className="space-y-1">
                <p className="text-xs text-foreground-light">Authentication protocol</p>
                <Select_Shadcn_
                  value={snmpDeviceConfig.authenticationProtocol ?? 'SHA_512'}
                  onValueChange={(nextValue) =>
                    setSnmpDeviceConfig((current) => ({
                      ...current,
                      authenticationProtocol: nextValue,
                    }))
                  }
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ placeholder="Select protocol" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {SNMP_AUTH_PROTOCOLS.map((option) => (
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
              <Input
                id="device-snmp-auth-passphrase"
                label="Authentication passphrase"
                value={snmpDeviceConfig.authenticationPassphrase ?? ''}
                onChange={(event) =>
                  setSnmpDeviceConfig((current) => ({
                    ...current,
                    authenticationPassphrase: event.target.value,
                  }))
                }
              />
              <div className="space-y-1">
                <p className="text-xs text-foreground-light">Privacy protocol</p>
                <Select_Shadcn_
                  value={snmpDeviceConfig.privacyProtocol ?? 'DES'}
                  onValueChange={(nextValue) =>
                    setSnmpDeviceConfig((current) => ({
                      ...current,
                      privacyProtocol: nextValue,
                    }))
                  }
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ placeholder="Select protocol" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {SNMP_PRIVACY_PROTOCOLS.map((option) => (
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
              <Input
                id="device-snmp-privacy-passphrase"
                label="Privacy passphrase"
                value={snmpDeviceConfig.privacyPassphrase ?? ''}
                onChange={(event) =>
                  setSnmpDeviceConfig((current) => ({
                    ...current,
                    privacyPassphrase: event.target.value,
                  }))
                }
              />
              <Input
                id="device-snmp-engine-id"
                label="Engine ID"
                value={snmpDeviceConfig.engineId ?? ''}
                onChange={(event) =>
                  setSnmpDeviceConfig((current) => ({
                    ...current,
                    engineId: event.target.value,
                  }))
                }
              />
            </>
          )}
        </div>
      )}
      <Checkbox
        name="device-receive-data"
        label="Receive data"
        description="Allow this device to send telemetry."
        checked={receiveData}
        onChange={(event) => setReceiveData(event.target.checked)}
      />
    </>
  )

  const credentialsForm = (
    <div className="space-y-4">
      <Alert
        variant="info"
        withIcon
        title={
          credentialsRequired
            ? 'LwM2M devices require credentials'
            : 'Credentials are optional'
        }
      >
        {credentialsRequired
          ? 'Provide an access token for this device to authenticate.'
          : 'Leave the access token empty to generate one automatically.'}
      </Alert>
      <Input
        id="device-credential-key"
        label="Access token"
        value={credentialKey}
        onChange={(event) => setCredentialKey(event.target.value)}
      />
    </div>
  )

  const wizardFooter = (
    <div className="w-full border-t border-default">
      <div className="flex w-full items-center gap-2 px-4 py-3">
        {deviceWizardStep > 0 && (
          <Button type="default" onClick={handlePrevWizardStep} disabled={isWizardSaving}>
            Back
          </Button>
        )}
        <span className="flex-1" />
        {deviceWizardStep < maxWizardStep && (
          <Button
            type="default"
            onClick={handleNextWizardStep}
            disabled={!canProceedDetails || isWizardSaving}
          >
            Next
          </Button>
        )}
      </div>
      <div className="border-t border-default" />
      <div className="flex w-full items-center gap-2 px-4 py-3">
        <Button type="default" onClick={handleClose} disabled={isWizardSaving}>
          Cancel
        </Button>
        <span className="flex-1" />
        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={!canSubmitWizard || isWizardSaving}
          loading={isWizardSaving}
        >
          Add
        </Button>
      </div>
    </div>
  )

  const editFooter = (
    <div className="flex w-full items-center justify-end gap-2 border-t border-default px-4 py-4">
      <Button type="default" onClick={handleClose}>
        Cancel
      </Button>
      <Button type="primary" onClick={handleSubmit} disabled={!canSubmitEdit} loading={isSaving}>
        Save
      </Button>
    </div>
  )

  return (
    <SidePanel
      size="large"
      visible={open}
      header={device ? 'Edit device' : 'New device'}
      onCancel={handleClose}
      customFooter={isCreateMode ? wizardFooter : editFooter}
    >
      <SidePanel.Content className="space-y-6 py-6">
        {isCreateMode ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 px-4">
              {DEVICE_WIZARD_STEPS.map((step, index) => {
                const isDisabled = index > 0 && !canProceedDetails
                return (
                  <Button
                    key={step.id}
                    size="tiny"
                    type={index === deviceWizardStep ? 'primary' : 'default'}
                    onClick={() => {
                      if (!isDisabled) setDeviceWizardStep(index)
                    }}
                    disabled={isDisabled}
                  >
                    {index + 1}. {step.label}
                  </Button>
                )
              })}
            </div>
            <div className="px-4 text-xs text-foreground-light">
              Step {deviceWizardStep + 1} of {DEVICE_WIZARD_STEPS.length}:{' '}
              {DEVICE_WIZARD_STEPS[deviceWizardStep]?.label}
            </div>
            <div className="space-y-4 px-4">
              {deviceWizardStep === 0 ? detailsForm : credentialsForm}
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            <Alert
              variant="info"
              withIcon
              title="Model-based configuration"
            >
              Alerts and calculated fields are configured on the device model. Edit the model to
              change alert logic or calculated fields.
            </Alert>
            {detailsForm}
          </div>
        )}
      </SidePanel.Content>
    </SidePanel>
  )
}
