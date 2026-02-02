import {
  useIotDeviceModelCreateMutation,
  useIotDeviceModelDeleteMutation,
  useIotDeviceModelUpdateMutation,
  useIotDeviceModelsQuery,
} from 'data/iot/device-models'
import { useIotDataTypeKeyCreateMutation, useIotDataTypeKeysQuery } from 'data/iot/data-type-keys'
import { useIotIngestChainsQuery } from 'data/iot/ingest-chains'
import { useIotRuleChainsQuery } from 'data/iot/rule-chains'
import type { IotDeviceModel } from 'data/iot/types'
import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ReportsSelectFilter,
  type SelectFilters,
} from 'components/interfaces/Reports/v2/ReportsSelectFilter'
import { Search } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
import * as z from 'zod'
import {
  Badge,
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input,
  Input_Shadcn_,
  SelectField,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { PageContainer } from 'ui-patterns/PageContainer'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  DEFAULT_COAP_CONFIG,
  DEFAULT_LWM2M_CONFIG,
  DEFAULT_MQTT_CONFIG,
  DEFAULT_PROVISION_CONFIG,
  DEFAULT_SNMP_CONFIG,
  MODEL_WIZARD_STEPS,
  SENSOR_CHART_TYPES,
  SENSOR_VALUE_TYPES,
  TRANSPORT_TYPES,
} from './device-models/constants'
import {
  buildDeviceModelAttributeRow,
  buildProfileAttributesPayload,
  buildProvisionConfig,
  createDefaultLwm2mBootstrapServer,
  isSnmpQueryingSpec,
  normalizeCoapConfig,
  normalizeLwm2mConfig,
  normalizeMqttConfig,
  normalizeProfileAttributes,
  normalizeProvisionConfig,
  normalizeSnmpConfig,
  parseListInput,
} from './device-models/helpers'
import type { DeviceModelAttributeRow } from './device-models/helpers'
import { DeviceModelStepDetails } from './device-models/DeviceModelStepDetails'
import { DeviceModelStepProtocol } from './device-models/DeviceModelStepProtocol'
import { DeviceModelStepDataTypeKeys } from './device-models/DeviceModelStepDataTypeKeys'
import { DeviceModelAttributesSection } from './device-models/DeviceModelAttributesSection'
import { DeviceModelStepAlerts } from './device-models/DeviceModelStepAlerts'
import {
  DeviceModelStepMessages,
  type TestMessageState,
  type TestMessagesByProtocol,
  type TestProtocol,
} from './device-models/DeviceModelStepMessages'
import { DeviceModelStepProvisioning } from './device-models/DeviceModelStepProvisioning'

const CREATE_DEVICE_MODEL_FORM_ID = 'create-device-model-form'
const TRANSPORT_TYPE_VALUES = TRANSPORT_TYPES.map((option) => option.value) as [
  string,
  ...string[],
]
const PROTOCOL_BADGE_STYLES: Record<string, string> = {
  http: 'bg-sky-500/10 text-sky-600 border border-sky-500',
  mqtt: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500',
  coap: 'bg-amber-500/10 text-amber-600 border border-amber-500',
  lwm2m: 'bg-violet-500/10 text-violet-600 border border-violet-500',
  snmp: 'bg-rose-500/10 text-rose-600 border border-rose-500',
}
const createDeviceModelSchema = z.object({
  name: z.string().trim().min(1, 'Enter a model name'),
  transportType: z.enum(TRANSPORT_TYPE_VALUES, { required_error: 'Select a protocol' }),
})
type CreateDeviceModelFormValues = z.infer<typeof createDeviceModelSchema>

type DeviceModelsCardProps = {
  modelId?: number
  activeStep?: number
}

export const DeviceModelsCard = ({ modelId: explicitModelId, activeStep }: DeviceModelsCardProps) => {
  const router = useRouter()
  const { ref: projectRef = 'default', id: routeModelId } = useParams()
  const resolvedModelId =
    explicitModelId ?? (routeModelId ? Number(routeModelId) : null)
  const isEditorMode = Number.isFinite(resolvedModelId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<IotDeviceModel | null>(null)
  const [modelName, setModelName] = useState('')
  const [modelDescription, setModelDescription] = useState('')
  const [transportType, setTransportType] = useState('http')
  const [baseFirmwareVersion, setBaseFirmwareVersion] = useState('')
  const [baseFirmwareUrl, setBaseFirmwareUrl] = useState('')
  const [isDeleteModelModalOpen, setIsDeleteModelModalOpen] = useState(false)
  const [sensorTypePanelOpen, setDataTypeKeyPanelOpen] = useState(false)
  const [dataTypeKeyCreateOpen, setDataTypeKeyCreateOpen] = useState(false)
  const [dataTypeKeyName, setDataTypeKeyName] = useState('')
  const [dataTypeKeyDataKey, setDataTypeKeyDataKey] = useState('')
  const [dataTypeKeyValueType, setDataTypeKeyValueType] = useState(
    SENSOR_VALUE_TYPES[0]?.value ?? 'number'
  )
  const [dataTypeKeyDecimals, setDataTypeKeyDecimals] = useState('2')
  const [dataTypeKeyChartType, setDataTypeKeyChartType] = useState(
    SENSOR_CHART_TYPES[0]?.value ?? 'line'
  )
  const [dataTypeKeyUnit, setDataTypeKeyUnit] = useState('')
  const [sensorTypeIds, setDataTypeKeyIds] = useState<number[]>([])
  const [modelAttributes, setModelAttributes] = useState<DeviceModelAttributeRow[]>([])
  const [mqttConfig, setMqttConfig] = useState(DEFAULT_MQTT_CONFIG)
  const [coapConfig, setCoapConfig] = useState(DEFAULT_COAP_CONFIG)
  const [lwm2mConfig, setLwm2mConfig] = useState(DEFAULT_LWM2M_CONFIG)
  const [lwm2mObjectIdsText, setLwm2mObjectIdsText] = useState('')
  const [lwm2mObserveListText, setLwm2mObserveListText] = useState('')
  const [lwm2mAttributeListText, setLwm2mAttributeListText] = useState('')
  const [lwm2mTelemetryListText, setLwm2mTelemetryListText] = useState('')
  const [lwm2mKeyNameRows, setLwm2mKeyNameRows] = useState([{ path: '', key: '' }])
  const [lwm2mAttributeDefaults, setLwm2mAttributeDefaults] = useState({
    pmin: '',
    pmax: '',
    gt: '',
    lt: '',
    st: '',
  })
  const [snmpConfig, setSnmpConfig] = useState(DEFAULT_SNMP_CONFIG)
  const [sparkplugMetricsText, setSparkplugMetricsText] = useState('')
  const [profileConfigText, setProfileConfigText] = useState('')
  const [modelTestMessages, setModelTestMessages] = useState<TestMessagesByProtocol | null>(null)
  const [provisionConfig, setProvisionConfig] = useState(DEFAULT_PROVISION_CONFIG)
  const [modelSearch, setModelSearch] = useState('')
  const [dataTypeKeySearch, setDataTypeKeySearch] = useState('')
  const [modelProtocolFilters, setModelProtocolFilters] = useState<SelectFilters>([])
  const [modelWizardStep, setModelWizardStep] = useState(0)
  const hasHydratedEditor = useRef(false)
  const testMessagesSaveTimerRef = useRef<number | null>(null)
  const createModelForm = useForm<CreateDeviceModelFormValues>({
    resolver: zodResolver(createDeviceModelSchema),
    defaultValues: {
      name: modelName,
      transportType,
    },
    mode: 'onChange',
  })

  const {
    data: models = [],
    isPending,
    isError,
    error,
  } = useIotDeviceModelsQuery()
  const {
    data: sensorTypes = [],
    isPending: isDataTypeKeysPending,
    isError: isDataTypeKeysError,
    error: sensorTypesError,
  } = useIotDataTypeKeysQuery()
  const { data: ruleChains = [] } = useIotRuleChainsQuery()
  const { data: ingestChains = [] } = useIotIngestChainsQuery()
  const { mutateAsync: createModel, isPending: isCreating } = useIotDeviceModelCreateMutation()
  const { mutateAsync: updateModel, isPending: isUpdating } = useIotDeviceModelUpdateMutation()
  const { mutateAsync: deleteModel, isPending: isDeletingModel } =
    useIotDeviceModelDeleteMutation()
  const { mutateAsync: createDataTypeKey, isPending: isCreatingDataTypeKey } =
    useIotDataTypeKeyCreateMutation()

  const addAttributeRow = (patch: Partial<DeviceModelAttributeRow> = {}) => {
    setModelAttributes((current) => {
      const next = [...current, buildDeviceModelAttributeRow(patch)]
      if (editingModel?.id) {
        void saveModelChanges(undefined, {}, next)
      }
      return next
    })
  }

  const updateAttributeRow = (index: number, patch: Partial<DeviceModelAttributeRow>) => {
    setModelAttributes((current) => {
      const next = [...current]
      next[index] = { ...next[index], ...patch }
      if (editingModel?.id) {
        void saveModelChanges(undefined, {}, next)
      }
      return next
    })
  }

  const removeAttributeRow = (index: number) => {
    setModelAttributes((current) => {
      const next = current.filter((_, rowIndex) => rowIndex !== index)
      if (editingModel?.id) {
        void saveModelChanges(undefined, {}, next)
      }
      return next
    })
  }

  const renderPreviewList = (items: string[]) => {
    if (items.length === 0) {
      return <span className="text-xs text-foreground-light">—</span>
    }
    const preview = items.slice(0, 5)
    const overflow = items.length - preview.length
    return (
      <span className="text-xs text-foreground-light">
        {preview.join(', ')}
        {overflow > 0 ? ` +${overflow}` : ''}
      </span>
    )
  }

  const buildDeviceModelPayload = (
    nextDataTypeKeyIds?: number[],
    overrides: Partial<Pick<IotDeviceModel, 'name' | 'transport_type'>> = {},
    attributeRows?: DeviceModelAttributeRow[],
    testMessagesOverride?: TestMessagesByProtocol | null
  ) => {
    const selectedIds = nextDataTypeKeyIds ?? sensorTypeIds
    const resolvedName = (overrides.name ?? modelName).trim()
    const resolvedTransportType = overrides.transport_type ?? transportType
    const sparkplugMetricNames = sparkplugMetricsText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    let lwm2mTransportConfig: Record<string, unknown> | null = null
    if (resolvedTransportType === 'lwm2m') {
      lwm2mTransportConfig = buildLwm2mTransportConfig()
      if (!lwm2mTransportConfig) return null
    }

    let snmpTransportConfig: Record<string, unknown> | null = null
    if (resolvedTransportType === 'snmp') {
      snmpTransportConfig = buildSnmpTransportConfig()
      if (!snmpTransportConfig) return null
    }

    const transportConfig =
      resolvedTransportType === 'mqtt'
        ? {
            mqtt: {
              ...mqttConfig,
              sparkplugAttributesMetricNames: sparkplugMetricNames,
            },
          }
        : resolvedTransportType === 'coap'
          ? {
              coap: coapConfig,
            }
          : resolvedTransportType === 'lwm2m'
            ? {
                lwm2m: lwm2mTransportConfig,
              }
            : resolvedTransportType === 'snmp'
              ? {
                  snmp: snmpTransportConfig,
                }
          : null

    let profileConfigPayload: Record<string, unknown> | null = null
    if (profileConfigText.trim()) {
      try {
        profileConfigPayload = JSON.parse(profileConfigText)
      } catch (err) {
        toast.error('Profile configuration must be valid JSON.')
        return null
      }
    }

    const attributesResult = buildProfileAttributesPayload(attributeRows ?? modelAttributes)
    if (attributesResult.error) {
      toast.error(attributesResult.error)
      return null
    }
    if (attributesResult.payload && attributesResult.payload.length > 0) {
      profileConfigPayload = {
        ...(profileConfigPayload ?? {}),
        attributes: attributesResult.payload,
      }
    }

    const resolvedTestMessages = testMessagesOverride ?? modelTestMessages
    // Do not persist test messages on initial model creation.
    const canPersistTestMessages = Boolean(editingModel?.id)
    if (
      canPersistTestMessages &&
      resolvedTestMessages !== null &&
      resolvedTestMessages !== undefined
    ) {
      profileConfigPayload = {
        ...(profileConfigPayload ?? {}),
        test_messages: resolvedTestMessages,
      }
    }

    const payload = {
      name: resolvedName,
      description: modelDescription.trim() || null,
      transport_type: resolvedTransportType,
      transport_config: transportConfig,
      profile_config: profileConfigPayload,
      provision_config: buildProvisionConfig(provisionConfig),
      base_firmware_version: baseFirmwareVersion.trim() || null,
      base_firmware_url: baseFirmwareUrl.trim() || null,
      data_type_key_ids: selectedIds,
    }

    if (!payload.name) {
      toast.error('Model name is required.')
      return null
    }

    return payload
  }

  const saveModelChanges = async (
    nextDataTypeKeyIds?: number[],
    overrides: Partial<Pick<IotDeviceModel, 'name' | 'transport_type'>> = {},
    attributeRows?: DeviceModelAttributeRow[],
    testMessagesOverride?: TestMessagesByProtocol | null
  ) => {
    if (!editingModel?.id) return
    const payload = buildDeviceModelPayload(
      nextDataTypeKeyIds,
      overrides,
      attributeRows,
      testMessagesOverride
    )
    if (!payload) return
    try {
      await updateModel({ modelId: editingModel.id, payload })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save device model.')
    }
  }

  const scheduleTestMessagesSave = useCallback(
    (next: TestMessagesByProtocol) => {
      if (!editingModel?.id) return
      if (testMessagesSaveTimerRef.current) {
        window.clearTimeout(testMessagesSaveTimerRef.current)
      }
      testMessagesSaveTimerRef.current = window.setTimeout(() => {
        void saveModelChanges(undefined, {}, undefined, next)
      }, 600)
    },
    [editingModel?.id, saveModelChanges]
  )

  const handleTestMessagesChange = useCallback(
    (protocol: TestProtocol, nextState: TestMessageState) => {
      setModelTestMessages((current) => {
        const next = { ...(current ?? {}), [protocol]: nextState }
        scheduleTestMessagesSave(next)
        return next
      })
    },
    [scheduleTestMessagesSave]
  )

  const resetDataTypeKeyForm = () => {
    setDataTypeKeyName('')
    setDataTypeKeyDataKey('')
    setDataTypeKeyValueType(SENSOR_VALUE_TYPES[0]?.value ?? 'number')
    setDataTypeKeyDecimals('2')
    setDataTypeKeyChartType(SENSOR_CHART_TYPES[0]?.value ?? 'line')
    setDataTypeKeyUnit('')
  }

  const handleCreateDataTypeKey = async () => {
    const parsedDecimals = dataTypeKeyDecimals.trim()
    const resolvedDecimals =
      dataTypeKeyValueType === 'number'
        ? parsedDecimals.length === 0
          ? 2
          : Number(parsedDecimals)
        : null

    if (dataTypeKeyValueType === 'number') {
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
      name: dataTypeKeyName.trim(),
      data_key_name: dataTypeKeyDataKey.trim(),
      value_type: dataTypeKeyValueType,
      unit: dataTypeKeyUnit.trim() || null,
      decimals: resolvedDecimals,
      chart_type: dataTypeKeyChartType || null,
    }

    if (!payload.name || !payload.data_key_name) {
      toast.error('Name and data key are required.')
      return
    }

    try {
      await createDataTypeKey({ payload })
      resetDataTypeKeyForm()
      setDataTypeKeyCreateOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create data type key.')
    }
  }


  const activeModelId = editingModel?.id ?? resolvedModelId ?? null
  const resolvedDefaultRuleChain = useMemo(() => {
    if (!activeModelId) return null
    return ruleChains.find((chain) => chain.model_id === activeModelId) ?? null
  }, [ruleChains, activeModelId])
  const resolvedIngestRuleChain = useMemo(() => {
    if (!activeModelId) return null
    return ingestChains.find((chain) => chain.model_id === activeModelId) ?? null
  }, [ingestChains, activeModelId])

  const filteredModels = useMemo(() => {
    const searchValue = modelSearch.trim().toLowerCase()
    return models.filter((model) => {
      if (searchValue) {
        const name = model.name?.toLowerCase() ?? ''
        const description = model.description?.toLowerCase() ?? ''
        if (!name.includes(searchValue) && !description.includes(searchValue)) return false
      }

      if (modelProtocolFilters.length > 0) {
        const protocol = model.transport_type || 'http'
        if (!modelProtocolFilters.includes(protocol)) return false
      }

      return true
    })
  }, [models, modelSearch, modelProtocolFilters])

  const filteredDataTypeKeys = useMemo(() => {
    const searchValue = dataTypeKeySearch.trim().toLowerCase()
    if (!searchValue) return sensorTypes
    return sensorTypes.filter((sensorType) => {
      const name = sensorType.name?.toLowerCase() ?? ''
      const key = sensorType.data_key_name?.toLowerCase() ?? ''
      return name.includes(searchValue) || key.includes(searchValue)
    })
  }, [sensorTypes, dataTypeKeySearch])

  const emptyDataTypeKeysMessage =
    sensorTypes.length === 0 ? 'No data type keys yet.' : 'No data type keys match your search.'

  const hydrateFromModel = (model: IotDeviceModel | null) => {
    setModelName(model?.name ?? '')
    setModelDescription(model?.description ?? '')
    setTransportType(model?.transport_type ?? 'http')
    setBaseFirmwareVersion(model?.base_firmware_version ?? '')
    setBaseFirmwareUrl(model?.base_firmware_url ?? '')
    setDataTypeKeyIds(model?.data_type_key_ids ?? [])

    const transportConfig = (model?.transport_config as Record<string, any>) || {}
    const mqtt = normalizeMqttConfig(transportConfig.mqtt)
    const coap = normalizeCoapConfig(transportConfig.coap)
    const lwm2m = normalizeLwm2mConfig(transportConfig.lwm2m)
    const snmp = normalizeSnmpConfig(transportConfig.snmp)

    setMqttConfig(mqtt)
    setCoapConfig(coap)
    setLwm2mConfig(lwm2m)
    const observeAttr = lwm2m.observeAttr ?? DEFAULT_LWM2M_CONFIG.observeAttr
    setLwm2mObjectIdsText((lwm2m.objectIds ?? []).map((item) => String(item)).join('\n'))
    setLwm2mObserveListText((observeAttr.observe ?? []).join('\n'))
    setLwm2mAttributeListText((observeAttr.attribute ?? []).join('\n'))
    setLwm2mTelemetryListText((observeAttr.telemetry ?? []).join('\n'))
    const keyNameEntries = Object.entries(observeAttr.keyName ?? {}).map(([path, key]) => ({
      path,
      key: String(key),
    }))
    setLwm2mKeyNameRows(keyNameEntries.length ? keyNameEntries : [{ path: '', key: '' }])
    setLwm2mAttributeDefaults({
      pmin: observeAttr.attributeLwm2m?.pmin?.toString() ?? '',
      pmax: observeAttr.attributeLwm2m?.pmax?.toString() ?? '',
      gt: observeAttr.attributeLwm2m?.gt?.toString() ?? '',
      lt: observeAttr.attributeLwm2m?.lt?.toString() ?? '',
      st: observeAttr.attributeLwm2m?.st?.toString() ?? '',
    })
    setSnmpConfig(snmp)
    setSparkplugMetricsText((mqtt.sparkplugAttributesMetricNames || []).join(', '))

    const profileConfig = (model?.profile_config as Record<string, any>) || null
    setModelAttributes(normalizeProfileAttributes(profileConfig))
    const testMessages =
      profileConfig && typeof profileConfig.test_messages === 'object'
        ? (profileConfig.test_messages as TestMessagesByProtocol)
        : null
    setModelTestMessages(testMessages)
    if (profileConfig) {
      const {
        attributes: _attributes,
        test_messages: _testMessages,
        ...profileRest
      } =
        profileConfig
      setProfileConfigText(
        Object.keys(profileRest).length > 0 ? JSON.stringify(profileRest, null, 2) : ''
      )
    } else {
      setProfileConfigText('')
    }
    setProvisionConfig(normalizeProvisionConfig(model?.provision_config as Record<string, any>))
  }

  useEffect(() => {
    if (!dialogOpen) return
    setModelWizardStep(0)
    hydrateFromModel(editingModel)
  }, [dialogOpen, editingModel])

  useEffect(() => {
    if (!isEditorMode) return
    const nextModel =
      models.find((model) => model.id === resolvedModelId) ?? null
    setEditingModel(nextModel)
  }, [isEditorMode, models, resolvedModelId])

  useEffect(() => {
    if (isEditorMode) {
      hasHydratedEditor.current = false
    }
  }, [isEditorMode, resolvedModelId])

  useEffect(() => {
    if (!isEditorMode || !editingModel || hasHydratedEditor.current) return
    hydrateFromModel(editingModel)
    hasHydratedEditor.current = true
  }, [editingModel, isEditorMode])

  useEffect(() => {
    if (!isEditorMode || activeStep == null) return
    setModelWizardStep(activeStep)
  }, [activeStep, isEditorMode])

  useEffect(() => {
    if (!dialogOpen || editingModel) return
    createModelForm.reset({
      name: modelName,
      transportType,
    })
  }, [createModelForm, dialogOpen, editingModel, modelName, transportType])

  const onOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setIsDeleteModelModalOpen(false)
      setEditingModel(null)
      setModelName('')
      setModelDescription('')
      setTransportType('http')
      setBaseFirmwareVersion('')
      setBaseFirmwareUrl('')
      setDataTypeKeyPanelOpen(false)
      setDataTypeKeyCreateOpen(false)
      setDataTypeKeyIds([])
      setMqttConfig(normalizeMqttConfig(null))
      setCoapConfig(normalizeCoapConfig(null))
      setLwm2mConfig(normalizeLwm2mConfig(null))
      setLwm2mObjectIdsText('')
      setLwm2mObserveListText('')
      setLwm2mAttributeListText('')
      setLwm2mTelemetryListText('')
      setLwm2mKeyNameRows([{ path: '', key: '' }])
      setLwm2mAttributeDefaults({
        pmin: '',
        pmax: '',
        gt: '',
        lt: '',
        st: '',
      })
      setSnmpConfig(normalizeSnmpConfig(null))
      setSparkplugMetricsText('')
      setProfileConfigText('')
      setModelAttributes([])
      setModelTestMessages(null)
      setModelWizardStep(0)
      setProvisionConfig(DEFAULT_PROVISION_CONFIG)
      if (testMessagesSaveTimerRef.current) {
        window.clearTimeout(testMessagesSaveTimerRef.current)
        testMessagesSaveTimerRef.current = null
      }
    }
  }

  const updateLwm2mKeyNameRow = (index: number, patch: { path?: string; key?: string }) => {
    setLwm2mKeyNameRows((current) => {
      const next = [...current]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const addLwm2mKeyNameRow = () => {
    setLwm2mKeyNameRows((current) => [...current, { path: '', key: '' }])
  }

  const removeLwm2mKeyNameRow = (index: number) => {
    setLwm2mKeyNameRows((current) => {
      if (current.length === 1) return [{ path: '', key: '' }]
      return current.filter((_, rowIndex) => rowIndex !== index)
    })
  }

  const updateLwm2mBootstrapServer = (index: number, patch: Record<string, unknown>) => {
    setLwm2mConfig((current) => {
      const nextBootstrap = [...(current.bootstrap ?? [])]
      nextBootstrap[index] = { ...nextBootstrap[index], ...patch }
      return { ...current, bootstrap: nextBootstrap }
    })
  }

  const addLwm2mBootstrapServer = () => {
    setLwm2mConfig((current) => ({
      ...current,
      bootstrap: [...(current.bootstrap ?? []), createDefaultLwm2mBootstrapServer()],
    }))
  }

  const removeLwm2mBootstrapServer = (index: number) => {
    setLwm2mConfig((current) => ({
      ...current,
      bootstrap: (current.bootstrap ?? []).filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  const getNextSnmpSpec = (configs: Record<string, any>[]) => {
    const used = new Set(configs.map((config) => config.spec))
    return (
      SNMP_SPEC_TYPES.map((option) => option.value).find((value) => !used.has(value)) ??
      SNMP_SPEC_TYPES[0]?.value ??
      'TELEMETRY_QUERYING'
    )
  }

  const createDefaultSnmpMapping = () => ({
    dataType: 'STRING',
    key: '',
    oid: '',
  })

  const addSnmpCommunicationConfig = () => {
    setSnmpConfig((current) => {
      const configs = current.communicationConfigs ?? []
      const nextSpec = getNextSnmpSpec(configs)
      const nextConfig: Record<string, any> = {
        spec: nextSpec,
        mappings: [createDefaultSnmpMapping()],
      }
      if (isSnmpQueryingSpec(nextSpec)) {
        nextConfig.queryingFrequencyMs = 5000
      }
      return {
        ...current,
        communicationConfigs: [...configs, nextConfig],
      }
    })
  }

  const updateSnmpCommunicationConfig = (index: number, patch: Record<string, any>) => {
    setSnmpConfig((current) => {
      const configs = [...(current.communicationConfigs ?? [])]
      const nextConfig = { ...configs[index], ...patch }
      if (patch.spec) {
        if (isSnmpQueryingSpec(patch.spec)) {
          if (nextConfig.queryingFrequencyMs == null) {
            nextConfig.queryingFrequencyMs = 5000
          }
        } else {
          delete nextConfig.queryingFrequencyMs
        }
      }
      configs[index] = nextConfig
      return { ...current, communicationConfigs: configs }
    })
  }

  const removeSnmpCommunicationConfig = (index: number) => {
    setSnmpConfig((current) => ({
      ...current,
      communicationConfigs: (current.communicationConfigs ?? []).filter(
        (_, rowIndex) => rowIndex !== index
      ),
    }))
  }

  const addSnmpMapping = (configIndex: number) => {
    setSnmpConfig((current) => {
      const configs = [...(current.communicationConfigs ?? [])]
      const config = { ...configs[configIndex] }
      config.mappings = [...(config.mappings ?? []), createDefaultSnmpMapping()]
      configs[configIndex] = config
      return { ...current, communicationConfigs: configs }
    })
  }

  const updateSnmpMapping = (
    configIndex: number,
    mappingIndex: number,
    patch: Record<string, any>
  ) => {
    setSnmpConfig((current) => {
      const configs = [...(current.communicationConfigs ?? [])]
      const config = { ...configs[configIndex] }
      const mappings = [...(config.mappings ?? [])]
      mappings[mappingIndex] = { ...mappings[mappingIndex], ...patch }
      config.mappings = mappings
      configs[configIndex] = config
      return { ...current, communicationConfigs: configs }
    })
  }

  const removeSnmpMapping = (configIndex: number, mappingIndex: number) => {
    setSnmpConfig((current) => {
      const configs = [...(current.communicationConfigs ?? [])]
      const config = { ...configs[configIndex] }
      config.mappings = (config.mappings ?? []).filter((_, index) => index !== mappingIndex)
      configs[configIndex] = config
      return { ...current, communicationConfigs: configs }
    })
  }

  function buildLwm2mTransportConfig(options?: { validate?: boolean }) {
    const validate = options?.validate ?? true
    const objectIdsRaw = parseListInput(lwm2mObjectIdsText)
    const objectIds = objectIdsRaw.map((item) => Number(item))
    if (validate && objectIdsRaw.length === 0) {
      toast.error('LwM2M: добавьте хотя бы один ID объекта.')
      return null
    }
    if (validate && objectIdsRaw.some((item, index) => !Number.isFinite(objectIds[index]))) {
      toast.error('LwM2M: ID объектов должны быть числами.')
      return null
    }

    const attributeDefaults: Record<string, number> = {}
    const attributeEntries = Object.entries(lwm2mAttributeDefaults)
    for (const [key, value] of attributeEntries) {
      if (!value.trim()) continue
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue)) {
        if (validate) {
          toast.error('LwM2M: значения атрибутов должны быть числами.')
          return null
        }
        continue
      }
      attributeDefaults[key] = numericValue
    }

    if (validate && lwm2mConfig.bootstrapServerUpdateEnable) {
      if (!lwm2mConfig.bootstrap || lwm2mConfig.bootstrap.length === 0) {
        toast.error('LwM2M: добавьте хотя бы один bootstrap сервер.')
        return null
      }
      for (let index = 0; index < lwm2mConfig.bootstrap.length; index += 1) {
        const server = lwm2mConfig.bootstrap[index] as Record<string, unknown>
        const host = String(server.host ?? '').trim()
        const port = Number(server.port ?? 0)
        if (!host) {
          toast.error('LwM2M: у bootstrap сервера должен быть хост.')
          return null
        }
        if (!Number.isFinite(port) || port <= 0) {
          toast.error('LwM2M: у bootstrap сервера должен быть корректный порт.')
          return null
        }
      }
    }

    if (
      validate &&
      lwm2mConfig.clientLwM2mSettings.fwUpdateStrategy === 2 &&
      !String(lwm2mConfig.clientLwM2mSettings.fwUpdateResource ?? '').trim()
    ) {
      toast.error('LwM2M: укажите ресурс обновления FW.')
      return null
    }

    if (
      validate &&
      lwm2mConfig.clientLwM2mSettings.swUpdateStrategy === 2 &&
      !String(lwm2mConfig.clientLwM2mSettings.swUpdateResource ?? '').trim()
    ) {
      toast.error('LwM2M: укажите ресурс обновления SW.')
      return null
    }

    if (validate) {
      const pathPattern = /^\/?\d+(\/\d+){0,2}$/
      const allPaths = [
        ...parseListInput(lwm2mObserveListText),
        ...parseListInput(lwm2mAttributeListText),
        ...parseListInput(lwm2mTelemetryListText),
      ]
      if (allPaths.some((path) => !pathPattern.test(path))) {
        toast.error('LwM2M: неверный формат пути. Пример: 3303/0/5700.')
        return null
      }
      const hasPartialKeyName = lwm2mKeyNameRows.some(
        (row) => (!!row.path && !row.key) || (!row.path && !!row.key)
      )
      if (hasPartialKeyName) {
        toast.error('LwM2M: заполните путь и имя ключа в сопоставлении.')
        return null
      }
      const invalidKeyPaths = lwm2mKeyNameRows.some(
        (row) => !!row.path && !pathPattern.test(row.path.trim())
      )
      if (invalidKeyPaths) {
        toast.error('LwM2M: неверный формат пути в сопоставлении ключей.')
        return null
      }
    }

    const keyNameMap = lwm2mKeyNameRows.reduce<Record<string, string>>((acc, row) => {
      const path = row.path.trim()
      const key = row.key.trim()
      if (!path || !key) return acc
      acc[path] = key
      return acc
    }, {})

    const observeAttr = {
      ...DEFAULT_LWM2M_CONFIG.observeAttr,
      ...lwm2mConfig.observeAttr,
      observe: parseListInput(lwm2mObserveListText),
      attribute: parseListInput(lwm2mAttributeListText),
      telemetry: parseListInput(lwm2mTelemetryListText),
      keyName: keyNameMap,
      attributeLwm2m: attributeDefaults,
    }

    return {
      ...DEFAULT_LWM2M_CONFIG,
      ...lwm2mConfig,
      objectIds,
      observeAttr,
      bootstrap: lwm2mConfig.bootstrap ?? [],
      clientLwM2mSettings: {
        ...DEFAULT_LWM2M_CONFIG.clientLwM2mSettings,
        ...lwm2mConfig.clientLwM2mSettings,
      },
    }
  }

  function buildSnmpTransportConfig() {
    const timeoutValue = Number(snmpConfig.timeoutMs)
    const retriesValue = Number(snmpConfig.retries)
    if (!Number.isFinite(timeoutValue) || timeoutValue < 0) {
      toast.error('SNMP: таймаут должен быть неотрицательным числом.')
      return null
    }
    if (!Number.isFinite(retriesValue) || retriesValue < 0) {
      toast.error('SNMP: количество повторов должно быть неотрицательным числом.')
      return null
    }

    const oidPattern = /^\.?([0-2])((\.0)|(\.[1-9][0-9]*))*$/
    const communicationConfigs = (snmpConfig.communicationConfigs ?? []).filter(
      (config) => config.spec
    )

    if (!communicationConfigs.length) {
      toast.error('SNMP: добавьте хотя бы один коммуникационный конфиг.')
      return null
    }

    const normalizedConfigs: Record<string, any>[] = []

    for (let configIndex = 0; configIndex < communicationConfigs.length; configIndex += 1) {
      const config = communicationConfigs[configIndex]
      const mappings = config.mappings ?? []
      if (!mappings.length) {
        toast.error('SNMP: в каждом конфиге должен быть хотя бы один маппинг.')
        return null
      }

      const normalizedMappings = []
      for (let mappingIndex = 0; mappingIndex < mappings.length; mappingIndex += 1) {
        const mapping = mappings[mappingIndex]
        const key = String(mapping.key ?? '').trim()
        const oid = String(mapping.oid ?? '').trim()
        if (!key) {
          toast.error('SNMP: заполните ключи в маппингах.')
          return null
        }
        if (!oid) {
          toast.error('SNMP: заполните OID в маппингах.')
          return null
        }
        if (!oidPattern.test(oid)) {
          toast.error('SNMP: неверный формат OID (пример: 1.3.6.1.2.1).')
          return null
        }
        normalizedMappings.push({
          ...mapping,
          key,
          oid,
          dataType: mapping.dataType ?? 'STRING',
        })
      }

      const normalizedConfig: Record<string, any> = {
        ...config,
        mappings: normalizedMappings,
      }

      if (isSnmpQueryingSpec(config.spec)) {
        const frequency = Number(config.queryingFrequencyMs ?? 0)
        if (!Number.isFinite(frequency) || frequency < 0) {
          toast.error('SNMP: частота опроса должна быть неотрицательным числом.')
          return null
        }
        normalizedConfig.queryingFrequencyMs = frequency
      } else {
        delete normalizedConfig.queryingFrequencyMs
      }

      normalizedConfigs.push(normalizedConfig)
    }

    return {
      snmpVersion: snmpConfig.snmpVersion,
      securityLevel: snmpConfig.securityLevel,
      community: snmpConfig.community,
      securityName: snmpConfig.securityName,
      authProtocol: snmpConfig.authProtocol,
      authPassphrase: snmpConfig.authPassphrase,
      privacyProtocol: snmpConfig.privacyProtocol,
      privacyPassphrase: snmpConfig.privacyPassphrase,
      timeoutMs: timeoutValue,
      retries: retriesValue,
      communicationConfigs: normalizedConfigs,
    }
  }

  const handleCreateModelSubmit = async (values: CreateDeviceModelFormValues) => {
    const payload = buildDeviceModelPayload(undefined, {
      name: values.name,
      transport_type: values.transportType,
    })
    if (!payload) return
    try {
      await createModel({ payload })
      onOpenChange(false)
    } catch (err) {
      if (err && typeof err === 'object' && 'details' in err) {
        const details = (err as { details?: Record<string, unknown> }).details || {}
        const nameError = Array.isArray(details.name) ? details.name[0] : details.name
        const protocolError = Array.isArray(details.transport_type)
          ? details.transport_type[0]
          : details.transport_type
        if (nameError) {
          createModelForm.setError('name', { message: String(nameError) })
        }
        if (protocolError) {
          createModelForm.setError('transportType', { message: String(protocolError) })
        }
        if (nameError || protocolError) return
      }
      toast.error(err instanceof Error ? err.message : 'Failed to save device model.')
    }
  }

  const onSubmit = async () => {
    const payload = buildDeviceModelPayload()
    if (!payload) return

    try {
      if (editingModel) {
        await updateModel({ modelId: editingModel.id, payload })
      } else {
        await createModel({ payload })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save device model.')
    }
  }

  const onDeleteModel = async () => {
    if (!editingModel?.id) return
    try {
      await deleteModel({ modelId: editingModel.id })
      toast.success('Device model deleted.')
      setEditingModel(null)
      router.push(`/project/${projectRef}/device-models`)
      return true
    } catch (err) {
      if (err instanceof Error && err.message.includes('device_model_in_use')) {
        toast.error('Нельзя удалить модель: есть устройства, которые её используют.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to delete device model.')
      }
      return false
    }
  }

  const isSaving = isCreating || isUpdating
  const isSavingDataTypeKey = isCreatingDataTypeKey
  const canCreateDataTypeKey =
    dataTypeKeyName.trim().length > 0 &&
    dataTypeKeyDataKey.trim().length > 0 &&
    !isSavingDataTypeKey
  const isCreatingModel = !editingModel
  const canSubmit = isCreatingModel
    ? createModelForm.formState.isValid && !isSaving
    : modelName.trim().length > 0 && !isSaving

  const toggleDataTypeKey = (sensorTypeId: number) => {
    setDataTypeKeyIds((current) => {
      const next = current.includes(sensorTypeId)
        ? current.filter((id) => id !== sensorTypeId)
        : [...current, sensorTypeId]
      if (editingModel?.id) {
        void saveModelChanges(next)
      }
      return next
    })
  }

  const emptyModelMessage =
    models.length === 0 ? 'No device models yet.' : 'No models match your filters.'
  const modelSteps = useMemo(() => {
    if (!editingModel) return MODEL_WIZARD_STEPS.slice(0, 2)
    return [
      MODEL_WIZARD_STEPS[0],
      MODEL_WIZARD_STEPS[2],
      MODEL_WIZARD_STEPS[1],
      MODEL_WIZARD_STEPS[3],
      MODEL_WIZARD_STEPS[4],
      MODEL_WIZARD_STEPS[5],
    ]
  }, [editingModel])
  const lastModelStepIndex = modelSteps.length - 1
  const isLastModelStep = modelWizardStep >= lastModelStepIndex
  const canProceedModelStep = modelWizardStep === 0 ? modelName.trim().length > 0 : true

  const handleNextModelStep = () => {
    setModelWizardStep((step) => Math.min(step + 1, lastModelStepIndex))
  }

  const handlePrevModelStep = () => {
    setModelWizardStep((step) => Math.max(step - 1, 0))
  }

  const renderModelStep = () => {
    const activeStep = modelSteps[modelWizardStep]?.value
    if (activeStep === 'details') {
      return (
        <DeviceModelStepDetails
          modelName={modelName}
          modelDescription={modelDescription}
          baseFirmwareVersion={baseFirmwareVersion}
          baseFirmwareUrl={baseFirmwareUrl}
          protocolContent={
            <DeviceModelStepProtocol
              transportType={transportType}
              isEditing={!!editingModel}
              mqttConfig={mqttConfig}
              setMqttConfig={setMqttConfig}
              sparkplugMetricsText={sparkplugMetricsText}
              setSparkplugMetricsText={setSparkplugMetricsText}
              coapConfig={coapConfig}
              setCoapConfig={setCoapConfig}
              lwm2mConfig={lwm2mConfig}
              setLwm2mConfig={setLwm2mConfig}
              lwm2mObjectIdsText={lwm2mObjectIdsText}
              setLwm2mObjectIdsText={setLwm2mObjectIdsText}
              lwm2mObserveListText={lwm2mObserveListText}
              setLwm2mObserveListText={setLwm2mObserveListText}
              lwm2mAttributeListText={lwm2mAttributeListText}
              setLwm2mAttributeListText={setLwm2mAttributeListText}
              lwm2mTelemetryListText={lwm2mTelemetryListText}
              setLwm2mTelemetryListText={setLwm2mTelemetryListText}
              lwm2mKeyNameRows={lwm2mKeyNameRows}
              updateLwm2mKeyNameRow={updateLwm2mKeyNameRow}
              removeLwm2mKeyNameRow={removeLwm2mKeyNameRow}
              addLwm2mKeyNameRow={addLwm2mKeyNameRow}
              lwm2mAttributeDefaults={lwm2mAttributeDefaults}
              setLwm2mAttributeDefaults={setLwm2mAttributeDefaults}
              snmpConfig={snmpConfig}
              setSnmpConfig={setSnmpConfig}
              updateSnmpCommunicationConfig={updateSnmpCommunicationConfig}
              removeSnmpCommunicationConfig={removeSnmpCommunicationConfig}
              addSnmpCommunicationConfig={addSnmpCommunicationConfig}
              updateSnmpMapping={updateSnmpMapping}
              removeSnmpMapping={removeSnmpMapping}
              addSnmpMapping={addSnmpMapping}
              isSnmpQueryingSpec={isSnmpQueryingSpec}
              profileConfigText={profileConfigText}
              setProfileConfigText={setProfileConfigText}
            />
          }
          onModelNameChange={setModelName}
          onModelDescriptionChange={setModelDescription}
          onBaseFirmwareVersionChange={setBaseFirmwareVersion}
          onBaseFirmwareUrlChange={setBaseFirmwareUrl}
          showDelete={!!editingModel}
          isDeleting={isDeletingModel}
          onDelete={() => setIsDeleteModelModalOpen(true)}
        />
      )
    }

    if (activeStep === 'attributes') {
      return (
        <DeviceModelAttributesSection
          rows={modelAttributes}
          onAddRow={addAttributeRow}
          onUpdateRow={updateAttributeRow}
          onRemoveRow={removeAttributeRow}
        />
      )
    }

    if (activeStep === 'data-type-keys') {
      const selectedDataTypeKeys = sensorTypes.filter((sensorType) =>
        sensorTypeIds.includes(sensorType.id)
      )
      return (
        <DeviceModelStepDataTypeKeys
          selectedDataTypeKeys={selectedDataTypeKeys}
          sensorTypeIds={sensorTypeIds}
          dataTypeKeySearch={dataTypeKeySearch}
          dataTypeKeyCreateOpen={dataTypeKeyCreateOpen}
          dataTypeKeyName={dataTypeKeyName}
          dataTypeKeyDataKey={dataTypeKeyDataKey}
          dataTypeKeyValueType={dataTypeKeyValueType}
          dataTypeKeyDecimals={dataTypeKeyDecimals}
          dataTypeKeyChartType={dataTypeKeyChartType}
          dataTypeKeyUnit={dataTypeKeyUnit}
          sensorTypePanelOpen={sensorTypePanelOpen}
          isDataTypeKeysError={isDataTypeKeysError}
          sensorTypesError={sensorTypesError}
          isDataTypeKeysPending={isDataTypeKeysPending}
          filteredDataTypeKeys={filteredDataTypeKeys}
          emptyDataTypeKeysMessage={emptyDataTypeKeysMessage}
          canCreateDataTypeKey={canCreateDataTypeKey}
          isSavingDataTypeKey={isSavingDataTypeKey}
          onOpenPanel={() => setDataTypeKeyPanelOpen(true)}
          onClosePanel={() => setDataTypeKeyPanelOpen(false)}
          onSearchChange={setDataTypeKeySearch}
          onToggleCreate={() => setDataTypeKeyCreateOpen((current) => !current)}
          onDataTypeKeyNameChange={setDataTypeKeyName}
          onDataTypeKeyDataKeyChange={setDataTypeKeyDataKey}
          onDataTypeKeyValueTypeChange={(value) => {
            setDataTypeKeyValueType(value)
            if (value === 'number' && !dataTypeKeyDecimals.trim()) {
              setDataTypeKeyDecimals('2')
            }
            if (value !== 'number') {
              setDataTypeKeyDecimals('')
            }
          }}
          onDataTypeKeyDecimalsChange={setDataTypeKeyDecimals}
          onDataTypeKeyChartTypeChange={setDataTypeKeyChartType}
          onDataTypeKeyUnitChange={setDataTypeKeyUnit}
          onResetCreateForm={resetDataTypeKeyForm}
          onCreateDataTypeKey={handleCreateDataTypeKey}
          onToggleDataTypeKey={toggleDataTypeKey}
        />
      )
    }

    if (activeStep === 'messages') {
      return (
        <DeviceModelStepMessages
          model={editingModel}
          testMessagesByProtocol={modelTestMessages}
          onTestMessagesChange={handleTestMessagesChange}
          ingestChainId={resolvedIngestRuleChain?.id ?? null}
        />
      )
    }

    if (activeStep === 'alerts') {
      const defaultRuleChainId = resolvedDefaultRuleChain?.id
      return (
        <DeviceModelStepAlerts
          hasRuleChain={!!defaultRuleChainId}
          onOpenRuleChain={() => {
            if (!defaultRuleChainId || !activeModelId) return
            router.push(
              `/project/${projectRef}/device-models/${activeModelId}/rule-chains/${defaultRuleChainId}`
            )
          }}
        />
      )
    }

    return (
      <DeviceModelStepProvisioning
        provisionConfig={provisionConfig}
        setProvisionConfig={setProvisionConfig}
      />
    )
  }

  const renderCreateModelForm = () => (
    <Form_Shadcn_ {...createModelForm}>
      <form
        id={CREATE_DEVICE_MODEL_FORM_ID}
        onSubmit={createModelForm.handleSubmit(handleCreateModelSubmit)}
        className="grid gap-6"
      >
        <FormField_Shadcn_
          control={createModelForm.control}
          name="name"
          render={({ field }) => (
            <FormItem_Shadcn_ className="space-y-2">
              <FormLabel_Shadcn_ htmlFor="device-model-name">Model name</FormLabel_Shadcn_>
              <FormControl_Shadcn_>
                <Input_Shadcn_
                  id="device-model-name"
                  placeholder="Model name"
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    setModelName(event.target.value)
                  }}
                />
              </FormControl_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        />
        <FormField_Shadcn_
          control={createModelForm.control}
          name="transportType"
          render={({ field }) => (
            <FormItem_Shadcn_ className="space-y-2">
              <FormLabel_Shadcn_>Protocol</FormLabel_Shadcn_>
              <FormControl_Shadcn_>
                <SelectField
                  type="select"
                  value={field.value}
                  onChange={(nextValue) => {
                    field.onChange(nextValue)
                    setTransportType(nextValue)
                  }}
                >
                  {TRANSPORT_TYPES.map((option) => (
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
              </FormControl_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        />
        <p className="text-xs text-foreground-light">
          Протокол выбирается при создании и не может быть изменен позже.
        </p>
      </form>
    </Form_Shadcn_>
  )

  const modelId = editingModel?.id ?? null
  const basePath = modelId ? `/project/${projectRef}/device-models/${modelId}` : ''
  const navigationItems = modelId
    ? [
        { label: 'Details', href: `${basePath}/details` },
        { label: 'Attributes', href: `${basePath}/attributes` },
        { label: 'Data type keys', href: `${basePath}/data-type-keys` },
        { label: 'Messages', href: `${basePath}/messages` },
        { label: 'Alerts', href: `${basePath}/alerts` },
        { label: 'Initialization', href: `${basePath}/initialization` },
      ]
    : []

  const protocolLabel =
    editingModel?.transport_type &&
    (TRANSPORT_TYPES.find((option) => option.value === editingModel.transport_type)?.label ||
      editingModel.transport_type)
  const protocolBadgeClass =
    editingModel?.transport_type
      ? PROTOCOL_BADGE_STYLES[editingModel.transport_type] ?? ''
      : ''

  const pageTitle = editingModel ? (
    <div className="flex flex-wrap items-center gap-2">
      <span>{editingModel.name}</span>
      {protocolLabel && <Badge className={protocolBadgeClass}>{protocolLabel}</Badge>}
    </div>
  ) : (
    'Device model'
  )

  const editorContent = renderModelStep()

  let content = editorContent
  if (isPending) {
    content = <p className="text-sm text-foreground-light">Loading device model...</p>
  } else if (isError) {
    content = (
      <p className="text-sm text-destructive-600">
        {error?.message ?? 'Failed to load model.'}
      </p>
    )
  } else if (!editingModel) {
    content = <p className="text-sm text-foreground-light">Device model not found.</p>
  }

  if (!isEditorMode) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <Input
              placeholder="Search models"
              size="tiny"
              icon={<Search />}
              value={modelSearch}
              className="w-full lg:w-56"
              onChange={(event) => setModelSearch(event.target.value)}
            />
            <ReportsSelectFilter
              label="Protocol"
              options={TRANSPORT_TYPES.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              value={modelProtocolFilters}
              onChange={setModelProtocolFilters}
            />
          </div>
          <Button
            size="tiny"
            type="primary"
            onClick={() => {
              setEditingModel(null)
              onOpenChange(true)
            }}
          >
            New model
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-muted">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Protocol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Data type keys</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-foreground-light">
                    Loading models...
                  </TableCell>
                </TableRow>
              ) : filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-foreground-light">
                    {emptyModelMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model) => {
                  const protocolLabel =
                    TRANSPORT_TYPES.find((option) => option.value === model.transport_type)?.label ||
                    model.transport_type ||
                    '--'
                  const protocolBadgeClass = model.transport_type
                    ? PROTOCOL_BADGE_STYLES[model.transport_type] ?? ''
                    : ''
                  const attributes = normalizeProfileAttributes(
                    (model.profile_config as Record<string, any> | null) ?? null
                  )
                    .map((entry) => entry.name || entry.key)
                    .filter((entry) => entry.trim().length > 0)
                  const dataTypeKeys = (model.data_type_key_ids ?? [])
                    .map((id) => sensorTypes.find((type) => type.id === id))
                    .map((type) => type?.data_key_name)
                    .filter((name): name is string => !!name && name.trim().length > 0)

                  return (
                    <TableRow
                      key={model.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/project/${projectRef}/device-models/${model.id}/details`)
                      }
                    >
                      <TableCell className="w-[100px]">
                        <Badge className={protocolBadgeClass}>{protocolLabel}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>{renderPreviewList(attributes)}</TableCell>
                      <TableCell>{renderPreviewList(dataTypeKeys)}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <SidePanel
          size="large"
          visible={dialogOpen}
          header="Create device model"
          onCancel={() => onOpenChange(false)}
          customFooter={
            isCreatingModel ? (
              <div className="flex w-full items-center justify-end border-t border-default px-4 py-4">
                <div className="flex items-center gap-2">
                  <Button type="default" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    form={CREATE_DEVICE_MODEL_FORM_ID}
                    disabled={!canSubmit}
                    loading={isSaving}
                  >
                    Create model
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between border-t border-default px-4 py-4">
                <Button
                  type="default"
                  onClick={handlePrevModelStep}
                  disabled={modelWizardStep === 0}
                >
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  {!isLastModelStep ? (
                    <Button
                      type="primary"
                      onClick={handleNextModelStep}
                      disabled={!canProceedModelStep}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      onClick={onSubmit}
                      disabled={!canSubmit}
                      loading={isSaving}
                    >
                      Save changes
                    </Button>
                  )}
                </div>
              </div>
            )
          }
        >
          <SidePanel.Content className="space-y-6 py-6">
            {isCreatingModel ? renderCreateModelForm() : renderModelStep()}
          </SidePanel.Content>
        </SidePanel>
      </div>
    )
  }

  return (
    <PageLayout
      title={pageTitle}
      navigationItems={navigationItems}
      secondaryActions={
        editingModel ? (
          <div className="flex items-center gap-2">
            <Button
              type="default"
              onClick={() =>
                router.push(
                  `/project/${projectRef}/device-models/${activeModelId}/ingest-chains/${resolvedIngestRuleChain?.id}`
                )
              }
              disabled={!resolvedIngestRuleChain?.id}
            >
              Ingest rule
            </Button>
            <Button
              type="default"
              onClick={() =>
                router.push(
                  `/project/${projectRef}/device-models/${activeModelId}/rule-chains/${resolvedDefaultRuleChain?.id}`
                )
              }
              disabled={!resolvedDefaultRuleChain?.id}
            >
              Core rule
            </Button>
          </div>
        ) : undefined
      }
      primaryActions={
        <Button type="primary" onClick={onSubmit} disabled={!canSubmit} loading={isSaving}>
          Save changes
        </Button>
      }
      size="large"
    >
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            {content}
            <ConfirmationModal
              variant="destructive"
              loading={isDeletingModel}
              visible={isDeleteModelModalOpen}
              confirmLabel="Delete model"
              confirmLabelLoading="Deleting model"
              title={`Delete model “${editingModel?.name ?? ''}”`}
              onCancel={() => setIsDeleteModelModalOpen(false)}
              onConfirm={async () => {
                const deleted = await onDeleteModel()
                if (deleted) {
                  setIsDeleteModelModalOpen(false)
                }
              }}
            >
              <p className="text-sm text-foreground-light">
                Deleting a model removes its configuration and alert rules. This action cannot be
                undone.
              </p>
            </ConfirmationModal>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </PageLayout>
  )
}

type DeviceModelEditorTabsProps = {
  modelId: number
  activeStep: number
}

export const DeviceModelEditorTabs = ({ modelId, activeStep }: DeviceModelEditorTabsProps) => (
  <DeviceModelsCard modelId={modelId} activeStep={activeStep} />
)
