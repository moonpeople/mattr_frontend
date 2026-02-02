import {
  Button,
  Checkbox,
  Input,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Textarea,
} from 'ui'
import {
  COAP_DEVICE_TYPES,
  LWM2M_OBJECT_ID_VERSIONS,
  POWER_MODES,
  SNMP_AUTH_PROTOCOLS,
  SNMP_DATA_TYPES,
  SNMP_PRIVACY_PROTOCOLS,
  SNMP_PROTOCOL_VERSIONS,
  SNMP_SECURITY_LEVELS,
  SNMP_SPEC_TYPES,
  TRANSPORT_PAYLOAD_TYPES,
} from './constants'

type DeviceModelStepProtocolProps = {
  transportType: string
  isEditing?: boolean
  mqttConfig: any
  setMqttConfig: (updater: any) => void
  sparkplugMetricsText: string
  setSparkplugMetricsText: (value: string) => void
  coapConfig: any
  setCoapConfig: (updater: any) => void
  lwm2mConfig: any
  setLwm2mConfig: (updater: any) => void
  lwm2mObjectIdsText: string
  setLwm2mObjectIdsText: (value: string) => void
  lwm2mObserveListText: string
  setLwm2mObserveListText: (value: string) => void
  lwm2mAttributeListText: string
  setLwm2mAttributeListText: (value: string) => void
  lwm2mTelemetryListText: string
  setLwm2mTelemetryListText: (value: string) => void
  lwm2mKeyNameRows: { path: string; key: string }[]
  updateLwm2mKeyNameRow: (index: number, patch: { path?: string; key?: string }) => void
  removeLwm2mKeyNameRow: (index: number) => void
  addLwm2mKeyNameRow: () => void
  lwm2mAttributeDefaults: { pmin: string; pmax: string; gt: string; lt: string; st: string }
  setLwm2mAttributeDefaults: (updater: any) => void
  snmpConfig: any
  setSnmpConfig: (updater: any) => void
  updateSnmpCommunicationConfig: (index: number, patch: any) => void
  removeSnmpCommunicationConfig: (index: number) => void
  addSnmpCommunicationConfig: () => void
  updateSnmpMapping: (configIndex: number, mappingIndex: number, patch: any) => void
  removeSnmpMapping: (configIndex: number, mappingIndex: number) => void
  addSnmpMapping: (configIndex: number) => void
  isSnmpQueryingSpec: (spec?: string) => boolean
  profileConfigText: string
  setProfileConfigText: (value: string) => void
}

export const DeviceModelStepProtocol = ({
  transportType,
  isEditing = false,
  mqttConfig,
  setMqttConfig,
  sparkplugMetricsText,
  setSparkplugMetricsText,
  coapConfig,
  setCoapConfig,
  lwm2mConfig,
  setLwm2mConfig,
  lwm2mObjectIdsText,
  setLwm2mObjectIdsText,
  lwm2mObserveListText,
  setLwm2mObserveListText,
  lwm2mAttributeListText,
  setLwm2mAttributeListText,
  lwm2mTelemetryListText,
  setLwm2mTelemetryListText,
  lwm2mKeyNameRows,
  updateLwm2mKeyNameRow,
  removeLwm2mKeyNameRow,
  addLwm2mKeyNameRow,
  lwm2mAttributeDefaults,
  setLwm2mAttributeDefaults,
  snmpConfig,
  setSnmpConfig,
  updateSnmpCommunicationConfig,
  removeSnmpCommunicationConfig,
  addSnmpCommunicationConfig,
  updateSnmpMapping,
  removeSnmpMapping,
  addSnmpMapping,
  isSnmpQueryingSpec,
  profileConfigText,
  setProfileConfigText,
}: DeviceModelStepProtocolProps) => (
  <div className="grid gap-6">
    {transportType === 'mqtt' && (
      <div className="space-y-4 rounded-md border border-muted p-3">
        <p className="text-sm font-medium">MQTT transport</p>
        <Input
          id="mqtt-telemetry-topic"
          label="Telemetry topic filter"
          value={mqttConfig.deviceTelemetryTopic}
          onChange={(event) =>
            setMqttConfig((current: any) => ({
              ...current,
              deviceTelemetryTopic: event.target.value,
            }))
          }
        />
        <Input
          id="mqtt-attributes-topic"
          label="Attributes topic filter"
          value={mqttConfig.deviceAttributesTopic}
          onChange={(event) =>
            setMqttConfig((current: any) => ({
              ...current,
              deviceAttributesTopic: event.target.value,
            }))
          }
        />
        <Input
          id="mqtt-attributes-subscribe-topic"
          label="Attributes subscribe topic filter"
          value={mqttConfig.deviceAttributesSubscribeTopic}
          onChange={(event) =>
            setMqttConfig((current: any) => ({
              ...current,
              deviceAttributesSubscribeTopic: event.target.value,
            }))
          }
        />
        <Checkbox
          label="Sparkplug"
          checked={mqttConfig.sparkplug}
          onChange={(event) =>
            setMqttConfig((current: any) => ({
              ...current,
              sparkplug: event.target.checked,
            }))
          }
        />
        <Input
          id="mqtt-sparkplug-metrics"
          label="Sparkplug attribute metric names (comma separated)"
          value={sparkplugMetricsText}
          onChange={(event) => setSparkplugMetricsText(event.target.value)}
        />
        <Checkbox
          label="Send ACK on validation exception"
          checked={mqttConfig.sendAckOnValidationException}
          onChange={(event) =>
            setMqttConfig((current: any) => ({
              ...current,
              sendAckOnValidationException: event.target.checked,
            }))
          }
        />
        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Payload type</p>
          <Select_Shadcn_
            value={mqttConfig.transportPayloadTypeConfiguration.transportPayloadType}
            onValueChange={(nextValue) =>
              setMqttConfig((current: any) => ({
                ...current,
                transportPayloadTypeConfiguration: {
                  ...current.transportPayloadTypeConfiguration,
                  transportPayloadType: nextValue,
                },
              }))
            }
          >
            <SelectTrigger_Shadcn_ size="small">
              <SelectValue_Shadcn_ placeholder="Select payload type" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {TRANSPORT_PAYLOAD_TYPES.map((option) => (
                <SelectItem_Shadcn_
                  key={`mqtt-payload-${option.value}`}
                  value={option.value}
                  className="text-xs"
                >
                  {option.label}
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        {mqttConfig.transportPayloadTypeConfiguration.transportPayloadType === 'PROTOBUF' && (
          <>
            <Checkbox
              label="Enable compatibility with JSON payload format"
              checked={
                mqttConfig.transportPayloadTypeConfiguration
                  .enableCompatibilityWithJsonPayloadFormat
              }
              onChange={(event) =>
                setMqttConfig((current: any) => ({
                  ...current,
                  transportPayloadTypeConfiguration: {
                    ...current.transportPayloadTypeConfiguration,
                    enableCompatibilityWithJsonPayloadFormat: event.target.checked,
                  },
                }))
              }
            />
            <Checkbox
              label="Use JSON payload format for default downlink topics"
              checked={
                mqttConfig.transportPayloadTypeConfiguration
                  .useJsonPayloadFormatForDefaultDownlinkTopics
              }
              onChange={(event) =>
                setMqttConfig((current: any) => ({
                  ...current,
                  transportPayloadTypeConfiguration: {
                    ...current.transportPayloadTypeConfiguration,
                    useJsonPayloadFormatForDefaultDownlinkTopics: event.target.checked,
                  },
                }))
              }
            />
          </>
        )}
        {mqttConfig.transportPayloadTypeConfiguration.transportPayloadType === 'PROTOBUF' && (
          <>
            <div className="space-y-1">
              <p className="text-sm text-foreground-light">Telemetry proto schema</p>
              <Textarea
                value={
                  mqttConfig.transportPayloadTypeConfiguration.deviceTelemetryProtoSchema ?? ''
                }
                onChange={(event) =>
                  setMqttConfig((current: any) => ({
                    ...current,
                    transportPayloadTypeConfiguration: {
                      ...current.transportPayloadTypeConfiguration,
                      deviceTelemetryProtoSchema: event.target.value,
                    },
                  }))
                }
                rows={4}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground-light">Attributes proto schema</p>
              <Textarea
                value={
                  mqttConfig.transportPayloadTypeConfiguration.deviceAttributesProtoSchema ?? ''
                }
                onChange={(event) =>
                  setMqttConfig((current: any) => ({
                    ...current,
                    transportPayloadTypeConfiguration: {
                      ...current.transportPayloadTypeConfiguration,
                      deviceAttributesProtoSchema: event.target.value,
                    },
                  }))
                }
                rows={4}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground-light">RPC request proto schema</p>
              <Textarea
                value={
                  mqttConfig.transportPayloadTypeConfiguration.deviceRpcRequestProtoSchema ?? ''
                }
                onChange={(event) =>
                  setMqttConfig((current: any) => ({
                    ...current,
                    transportPayloadTypeConfiguration: {
                      ...current.transportPayloadTypeConfiguration,
                      deviceRpcRequestProtoSchema: event.target.value,
                    },
                  }))
                }
                rows={4}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground-light">RPC response proto schema</p>
              <Textarea
                value={
                  mqttConfig.transportPayloadTypeConfiguration.deviceRpcResponseProtoSchema ?? ''
                }
                onChange={(event) =>
                  setMqttConfig((current: any) => ({
                    ...current,
                    transportPayloadTypeConfiguration: {
                      ...current.transportPayloadTypeConfiguration,
                      deviceRpcResponseProtoSchema: event.target.value,
                    },
                  }))
                }
                rows={4}
              />
            </div>
          </>
        )}
      </div>
    )}
    {transportType === 'coap' && (
      <div className="space-y-4 rounded-md border border-muted p-3">
        <p className="text-sm font-medium">CoAP transport</p>
        <div className="space-y-1">
          <p className="text-xs text-foreground-light">CoAP device type</p>
          <Select_Shadcn_
            value={coapConfig.coapDeviceTypeConfiguration.coapDeviceType}
            onValueChange={(nextValue) =>
              setCoapConfig((current: any) => ({
                ...current,
                coapDeviceTypeConfiguration: {
                  ...current.coapDeviceTypeConfiguration,
                  coapDeviceType: nextValue,
                },
              }))
            }
          >
            <SelectTrigger_Shadcn_ size="small">
              <SelectValue_Shadcn_ placeholder="Select device type" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {COAP_DEVICE_TYPES.map((option) => (
                <SelectItem_Shadcn_
                  key={`coap-device-${option.value}`}
                  value={option.value}
                  className="text-xs"
                >
                  {option.label}
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="coap-edrx-cycle"
            label="EDRX cycle"
            value={coapConfig.clientSettings.edrxCycle}
            onChange={(event) =>
              setCoapConfig((current: any) => ({
                ...current,
                clientSettings: {
                  ...current.clientSettings,
                  edrxCycle: event.target.value,
                },
              }))
            }
          />
          <Input
            id="coap-ptw"
            label="Paging transmission window"
            value={coapConfig.clientSettings.pagingTransmissionWindow}
            onChange={(event) =>
              setCoapConfig((current: any) => ({
                ...current,
                clientSettings: {
                  ...current.clientSettings,
                  pagingTransmissionWindow: event.target.value,
                },
              }))
            }
          />
          <Input
            id="coap-psm-activity"
            label="PSM activity timer"
            value={coapConfig.clientSettings.psmActivityTimer}
            onChange={(event) =>
              setCoapConfig((current: any) => ({
                ...current,
                clientSettings: {
                  ...current.clientSettings,
                  psmActivityTimer: event.target.value,
                },
              }))
            }
          />
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Power mode</p>
            <Select_Shadcn_
              value={coapConfig.clientSettings.powerMode}
              onValueChange={(nextValue) =>
                setCoapConfig((current: any) => ({
                  ...current,
                  clientSettings: {
                    ...current.clientSettings,
                    powerMode: nextValue,
                  },
                }))
              }
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select power mode" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {POWER_MODES.map((option) => (
                  <SelectItem_Shadcn_
                    key={`coap-power-${option.value}`}
                    value={option.value}
                    className="text-xs"
                  >
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Payload type</p>
          <Select_Shadcn_
            value={
              coapConfig.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration
                .transportPayloadType
            }
            onValueChange={(nextValue) =>
              setCoapConfig((current: any) => ({
                ...current,
                coapDeviceTypeConfiguration: {
                  ...current.coapDeviceTypeConfiguration,
                  transportPayloadTypeConfiguration: {
                    ...current.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration,
                    transportPayloadType: nextValue,
                  },
                },
              }))
            }
          >
            <SelectTrigger_Shadcn_ size="small">
              <SelectValue_Shadcn_ placeholder="Select payload type" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {TRANSPORT_PAYLOAD_TYPES.map((option) => (
                <SelectItem_Shadcn_
                  key={`coap-payload-${option.value}`}
                  value={option.value}
                  className="text-xs"
                >
                  {option.label}
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
      </div>
    )}
    {transportType === 'lwm2m' && (
      <div className="space-y-4 rounded-md border border-muted p-3">
        <p className="text-sm font-medium">LwM2M transport</p>
        <Checkbox
          label="Enable bootstrap server update"
          checked={lwm2mConfig.bootstrapServerUpdateEnable}
          onChange={(event) =>
            setLwm2mConfig((current: any) => ({
              ...current,
              bootstrapServerUpdateEnable: event.target.checked,
            }))
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-foreground-light">Object IDs (one per line)</p>
            <Textarea
              value={lwm2mObjectIdsText}
              onChange={(event) => setLwm2mObjectIdsText(event.target.value)}
              rows={5}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-foreground-light">Observe list (one per line)</p>
            <Textarea
              value={lwm2mObserveListText}
              onChange={(event) => setLwm2mObserveListText(event.target.value)}
              rows={5}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-foreground-light">Attribute list (one per line)</p>
            <Textarea
              value={lwm2mAttributeListText}
              onChange={(event) => setLwm2mAttributeListText(event.target.value)}
              rows={5}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-foreground-light">Telemetry list (one per line)</p>
            <Textarea
              value={lwm2mTelemetryListText}
              onChange={(event) => setLwm2mTelemetryListText(event.target.value)}
              rows={5}
            />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground-light">Observe key mapping</p>
          <div className="grid gap-2">
            {lwm2mKeyNameRows.map((row, index) => (
              <div key={`lwm2m-key-${index}`} className="grid gap-2 md:grid-cols-[2fr_2fr_auto]">
                <Input
                  id={`lwm2m-key-path-${index}`}
                  label="Path"
                  value={row.path}
                  onChange={(event) => updateLwm2mKeyNameRow(index, { path: event.target.value })}
                />
                <Input
                  id={`lwm2m-key-key-${index}`}
                  label="Key"
                  value={row.key}
                  onChange={(event) => updateLwm2mKeyNameRow(index, { key: event.target.value })}
                />
                <div className="flex items-end">
                  <Button size="tiny" type="default" onClick={() => removeLwm2mKeyNameRow(index)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <div>
              <Button size="tiny" type="default" onClick={addLwm2mKeyNameRow}>
                Add mapping
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground-light">Default attributes</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              id="lwm2m-attr-pmin"
              label="pmin"
              value={lwm2mAttributeDefaults.pmin}
              onChange={(event) =>
                setLwm2mAttributeDefaults((current: any) => ({
                  ...current,
                  pmin: event.target.value,
                }))
              }
            />
            <Input
              id="lwm2m-attr-pmax"
              label="pmax"
              value={lwm2mAttributeDefaults.pmax}
              onChange={(event) =>
                setLwm2mAttributeDefaults((current: any) => ({
                  ...current,
                  pmax: event.target.value,
                }))
              }
            />
            <Input
              id="lwm2m-attr-gt"
              label="gt"
              value={lwm2mAttributeDefaults.gt}
              onChange={(event) =>
                setLwm2mAttributeDefaults((current: any) => ({
                  ...current,
                  gt: event.target.value,
                }))
              }
            />
            <Input
              id="lwm2m-attr-lt"
              label="lt"
              value={lwm2mAttributeDefaults.lt}
              onChange={(event) =>
                setLwm2mAttributeDefaults((current: any) => ({
                  ...current,
                  lt: event.target.value,
                }))
              }
            />
            <Input
              id="lwm2m-attr-st"
              label="st"
              value={lwm2mAttributeDefaults.st}
              onChange={(event) =>
                setLwm2mAttributeDefaults((current: any) => ({
                  ...current,
                  st: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>
    )}
    {transportType === 'snmp' && (
      <div className="space-y-4 rounded-md border border-muted p-3">
        <p className="text-sm font-medium">SNMP transport</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">SNMP version</p>
            <Select_Shadcn_
              value={snmpConfig.snmpVersion}
              onValueChange={(nextValue) =>
                setSnmpConfig((current: any) => ({ ...current, snmpVersion: nextValue }))
              }
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select version" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {SNMP_PROTOCOL_VERSIONS.map((option) => (
                  <SelectItem_Shadcn_
                    key={`snmp-version-${option.value}`}
                    value={option.value}
                    className="text-xs"
                  >
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Security level</p>
            <Select_Shadcn_
              value={snmpConfig.securityLevel}
              onValueChange={(nextValue) =>
                setSnmpConfig((current: any) => ({ ...current, securityLevel: nextValue }))
              }
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select security level" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {SNMP_SECURITY_LEVELS.map((option) => (
                  <SelectItem_Shadcn_
                    key={`snmp-security-${option.value}`}
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
            id="snmp-community"
            label="Community"
            value={snmpConfig.community}
            onChange={(event) =>
              setSnmpConfig((current: any) => ({ ...current, community: event.target.value }))
            }
          />
          <Input
            id="snmp-username"
            label="Username"
            value={snmpConfig.securityName}
            onChange={(event) =>
              setSnmpConfig((current: any) => ({ ...current, securityName: event.target.value }))
            }
          />
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Auth protocol</p>
            <Select_Shadcn_
              value={snmpConfig.authProtocol}
              onValueChange={(nextValue) =>
                setSnmpConfig((current: any) => ({ ...current, authProtocol: nextValue }))
              }
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select auth protocol" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {SNMP_AUTH_PROTOCOLS.map((option) => (
                  <SelectItem_Shadcn_
                    key={`snmp-auth-${option.value}`}
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
            id="snmp-auth-pass"
            label="Auth passphrase"
            value={snmpConfig.authPassphrase}
            onChange={(event) =>
              setSnmpConfig((current: any) => ({
                ...current,
                authPassphrase: event.target.value,
              }))
            }
          />
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Privacy protocol</p>
            <Select_Shadcn_
              value={snmpConfig.privacyProtocol}
              onValueChange={(nextValue) =>
                setSnmpConfig((current: any) => ({ ...current, privacyProtocol: nextValue }))
              }
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select privacy protocol" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {SNMP_PRIVACY_PROTOCOLS.map((option) => (
                  <SelectItem_Shadcn_
                    key={`snmp-privacy-${option.value}`}
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
            id="snmp-privacy-pass"
            label="Privacy passphrase"
            value={snmpConfig.privacyPassphrase}
            onChange={(event) =>
              setSnmpConfig((current: any) => ({
                ...current,
                privacyPassphrase: event.target.value,
              }))
            }
          />
          <Input
            id="snmp-timeout"
            label="Timeout (ms)"
            value={snmpConfig.timeoutMs}
            onChange={(event) =>
              setSnmpConfig((current: any) => ({ ...current, timeoutMs: event.target.value }))
            }
          />
          <Input
            id="snmp-retries"
            label="Retries"
            value={snmpConfig.retries}
            onChange={(event) =>
              setSnmpConfig((current: any) => ({ ...current, retries: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground-light">Query configurations</p>
          <div className="grid gap-3">
            {snmpConfig.communicationConfigs.map((config: any, index: number) => (
              <div
                key={`snmp-config-${index}`}
                className="space-y-3 rounded-md border border-muted p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Spec {index + 1}</p>
                  <Button
                    size="tiny"
                    type="default"
                    onClick={() => removeSnmpCommunicationConfig(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-foreground-light">Spec type</p>
                  <Select_Shadcn_
                    value={config.spec}
                    onValueChange={(nextValue) =>
                      updateSnmpCommunicationConfig(index, { spec: nextValue })
                    }
                  >
                    <SelectTrigger_Shadcn_ size="small">
                      <SelectValue_Shadcn_ placeholder="Select spec type" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {SNMP_SPEC_TYPES.map((option) => (
                        <SelectItem_Shadcn_
                          key={`snmp-spec-${option.value}`}
                          value={option.value}
                          className="text-xs"
                        >
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                {isSnmpQueryingSpec(config.spec) && (
                  <Input
                    id={`snmp-frequency-${index}`}
                    label="Querying frequency (ms)"
                    value={config.queryingFrequencyMs}
                    onChange={(event) =>
                      updateSnmpCommunicationConfig(index, {
                        queryingFrequencyMs: event.target.value,
                      })
                    }
                  />
                )}
                <div className="space-y-2">
                  <p className="text-sm text-foreground-light">Mappings</p>
                  <div className="grid gap-2">
                    {config.mappings.map((mapping: any, mappingIndex: number) => (
                      <div
                        key={`snmp-mapping-${index}-${mappingIndex}`}
                        className="grid gap-2 md:grid-cols-[2fr_2fr_1fr_auto]"
                      >
                        <Input
                          id={`snmp-mapping-key-${index}-${mappingIndex}`}
                          label="Key"
                          value={mapping.key}
                          onChange={(event) =>
                            updateSnmpMapping(index, mappingIndex, {
                              key: event.target.value,
                            })
                          }
                        />
                        <Input
                          id={`snmp-mapping-oid-${index}-${mappingIndex}`}
                          label="OID"
                          value={mapping.oid}
                          onChange={(event) =>
                            updateSnmpMapping(index, mappingIndex, {
                              oid: event.target.value,
                            })
                          }
                        />
                        <div className="space-y-1">
                          <p className="text-xs text-foreground-light">Data type</p>
                          <Select_Shadcn_
                            value={mapping.dataType}
                            onValueChange={(nextValue) =>
                              updateSnmpMapping(index, mappingIndex, {
                                dataType: nextValue,
                              })
                            }
                          >
                            <SelectTrigger_Shadcn_ size="small">
                              <SelectValue_Shadcn_ placeholder="Select data type" />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              {SNMP_DATA_TYPES.map((option) => (
                                <SelectItem_Shadcn_
                                  key={`snmp-data-${option.value}`}
                                  value={option.value}
                                  className="text-xs"
                                >
                                  {option.label}
                                </SelectItem_Shadcn_>
                              ))}
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="tiny"
                            type="default"
                            onClick={() => removeSnmpMapping(index, mappingIndex)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div>
                      <Button size="tiny" type="default" onClick={() => addSnmpMapping(index)}>
                        Add mapping
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div>
              <Button size="tiny" type="default" onClick={addSnmpCommunicationConfig}>
                Add spec
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    <div className="space-y-1">
      <p className="text-sm text-foreground-light">Profile configuration (JSON)</p>
      <Textarea
        id="device-model-profile-config"
        value={profileConfigText}
        onChange={(event) => setProfileConfigText(event.target.value)}
        rows={4}
        placeholder='{"type":"DEFAULT"}'
      />
    </div>
  </div>
)
