/**
 * Корневой inspector-компонент: выбирает нужный инспектор по текущей выбранной сущности.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { WidgetDefinition, WidgetField } from 'widgets/runtime'
import { getWidgetInspector, resolveInspectorFields } from 'widgets/inspector'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from 'ui'

import type { BuilderWidgetInstance, BuilderWidgetSpacing } from '../../types'
import { resolveWidgetSpacing } from '../../types'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import {
  COLLAPSIBLE_SECTIONS,
  isTemplateValueField,
  isTableColumnPanelKey,
  parseTableColumnPanelIndex,
  resolveStyleFallback,
} from '../model'
import type {
  InspectorPanel,
} from '../model'
import {
  useInspectorFxRuntime,
  useInspectorSectionGroups,
  type InspectorFxContextInfo,
} from './hooks'
import { BuilderInspectorSections } from './BuilderInspectorSections'
import {
  getAppThemeColorTokens,
  getAppThemeTypographyTokens,
  getActiveThemeTokens,
  normalizeAppTheme,
  useAppThemeSnapshot,
} from 'state/app-theme-state'
import type { BuilderAppTheme } from 'state/app-theme-state'
import { isLabelAddonWidget } from 'widgets/inspector'
import { InspectorEmptyState } from '../shared'
import { InspectorAccessVisibilitySection } from './sections'

// Inspektor widgeta: poisk polei i paneli Properties/Spacing/Access.

export interface BuilderInspectorProps {
  widget: BuilderWidgetInstance | null
  definition?: WidgetDefinition
  parentWidget?: BuilderWidgetInstance | null
  search?: string
  eventTargets?: { id: string; label: string; type?: string }[]
  eventQueries?: { id: string; label: string }[]
  eventScripts?: { id: string; label: string }[]
  eventPages?: { id: string; label: string }[]
  eventApps?: { id: string; label: string }[]
  eventVariables?: { id: string; label: string }[]
  activeAddonPanel?: InspectorPanel | null
  onActiveAddonPanelChange?: (panel: InspectorPanel | null) => void
  fxContextInfo?: InspectorFxContextInfo
  onUpdateProps: (patch: Record<string, unknown>) => void
  onUpdateAccess: (patch: {
    policy?: string[]
    visibleWhen?: string
    disabledWhen?: string
  }) => void
  onUpdateSpacing: (patch: BuilderWidgetSpacing) => void
  onUpdateHidden: (hidden: boolean | string) => void
  onDelete?: () => void
}

type BuilderInspectorContentProps = Omit<BuilderInspectorProps, 'widget' | 'definition'> & {
  widget: BuilderWidgetInstance
  definition: WidgetDefinition
}

const SLOT_AUTO_VALUE = '__auto__'

const parseMaybeJson = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return value
  }
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

const normalizeArray = <T,>(value: unknown, fallback: T[]): T[] => {
  if (Array.isArray(value)) {
    return value as T[]
  }
  return fallback
}

const normalizeString = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return fallback
}

const readPath = (item: unknown, pathRaw: string) => {
  if (!item || typeof item !== 'object') {
    return undefined
  }
  const path = pathRaw
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
  if (path.length === 0) {
    return undefined
  }
  return path.reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    return (current as Record<string, unknown>)[segment]
  }, item)
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const resolveContainerSlotOptions = (parentWidget: BuilderWidgetInstance | null | undefined) => {
  if (!parentWidget) {
    return []
  }
  const parentProps = (parentWidget.props ?? {}) as Record<string, unknown>
  if (parentWidget.type === 'TabbedContainer') {
    const dynamicMode = parentProps.optionsMode === 'dynamic'
    const options = dynamicMode
      ? normalizeArray<unknown>(parseMaybeJson(parentProps.optionsData), []).map((row, index) => {
          const labelKey = normalizeString(parentProps.optionLabelKey, 'label').trim() || 'label'
          const valueKey = normalizeString(parentProps.optionValueKey, 'value').trim() || 'value'
          const labelRaw = readPath(row, labelKey)
          const valueRaw = readPath(row, valueKey)
          const label = normalizeString(labelRaw, '').trim() || normalizeString(valueRaw, '').trim() || `Tab ${index + 1}`
          const rawValue = normalizeString(valueRaw, '').trim() || label
          const tabId = slugify(rawValue) || slugify(label) || `tab-${index + 1}`
          return { label, value: `tab:${tabId}` }
        })
      : normalizeArray<unknown>(parseMaybeJson(parentProps.tabs), []).map((item, index) => {
          if (typeof item === 'string') {
            const label = item.trim() || `Tab ${index + 1}`
            const tabId = slugify(label) || `tab-${index + 1}`
            return { label, value: `tab:${tabId}` }
          }
          const row = item as Record<string, unknown>
          const label = normalizeString(row.label, '').trim() || `Tab ${index + 1}`
          const rawValue = normalizeString(row.value, '').trim() || label
          const tabId = slugify(rawValue) || slugify(label) || `tab-${index + 1}`
          return { label, value: `tab:${tabId}` }
        })

    const fallbackLabel = normalizeString(parentProps.defaultTab, 'Tab 1').trim() || 'Tab 1'
    const fallbackId = slugify(fallbackLabel) || 'tab-1'
    const normalizedOptions = options.length > 0 ? options : [{ label: fallbackLabel, value: `tab:${fallbackId}` }]
    const deduped = normalizedOptions.filter(
      (option, index, list) => option.value && list.findIndex((item) => item.value === option.value) === index
    )
    return [{ label: 'Auto (first tab)', value: SLOT_AUTO_VALUE }, ...deduped]
  }

  if (parentWidget.type === 'SteppedContainer') {
    const dynamicMode = parentProps.optionsMode === 'dynamic'
    const options = dynamicMode
      ? normalizeArray<unknown>(parseMaybeJson(parentProps.optionsData), []).map((row, index) => {
          const labelKey = normalizeString(parentProps.optionLabelKey, 'label').trim() || 'label'
          const valueKey = normalizeString(parentProps.optionValueKey, 'value').trim() || 'value'
          const labelRaw = readPath(row, labelKey)
          const valueRaw = readPath(row, valueKey)
          const label = normalizeString(labelRaw, '').trim() || normalizeString(valueRaw, '').trim() || `Step ${index + 1}`
          const stepValue = normalizeString(valueRaw, '').trim() || label
          return { label, value: `step:${stepValue.trim().toLowerCase()}` }
        })
      : normalizeArray<unknown>(parseMaybeJson(parentProps.steps), []).map((item, index) => {
          if (typeof item === 'string') {
            const label = item.trim() || `Step ${index + 1}`
            return { label, value: `step:${label.trim().toLowerCase()}` }
          }
          const row = item as Record<string, unknown>
          const label = normalizeString(row.label, '').trim() || `Step ${index + 1}`
          // Static steps are normalized to `value = label` in SteppedContainer definition.
          const stepValue = label
          return { label, value: `step:${stepValue.trim().toLowerCase()}` }
        })

    const fallbackLabel = normalizeString(parentProps.currentStep, 'Step 1').trim() || 'Step 1'
    const normalizedOptions = options.length > 0 ? options : [{ label: fallbackLabel, value: `step:${fallbackLabel.trim().toLowerCase()}` }]
    const deduped = normalizedOptions.filter(
      (option, index, list) => option.value && list.findIndex((item) => item.value === option.value) === index
    )
    return [{ label: 'Auto (first step)', value: SLOT_AUTO_VALUE }, ...deduped]
  }

  if (
    parentWidget.type === 'Modal' ||
    parentWidget.type === 'Drawer' ||
    parentWidget.type === 'Sidebar' ||
    parentWidget.type === 'GlobalSidebar'
  ) {
    return [
      { label: 'Auto (body)', value: SLOT_AUTO_VALUE },
      { label: 'Header', value: 'header' },
      { label: 'Body', value: 'body' },
      { label: 'Footer', value: 'footer' },
    ]
  }

  if (parentWidget.type === 'SplitPane') {
    return [
      { label: 'Auto (pane 1)', value: SLOT_AUTO_VALUE },
      { label: 'Pane 1', value: 'pane-1' },
      { label: 'Pane 2', value: 'pane-2' },
    ]
  }

  return []
}

const BuilderInspectorContent = ({
  widget,
  definition,
  parentWidget = null,
  search,
  eventTargets = [],
  eventQueries = [],
  eventScripts = [],
  eventPages = [],
  eventApps = [],
  eventVariables = [],
  activeAddonPanel,
  onActiveAddonPanelChange,
  fxContextInfo,
  onUpdateProps,
  onUpdateAccess,
  onUpdateSpacing,
  onUpdateHidden,
  onDelete,
}: BuilderInspectorContentProps) => {
  // Filtr po poisku upravlyaet vidimostyu sektsii.
  const normalizedSearch = (search ?? '').trim().toLowerCase()
  const isFiltering = normalizedSearch.length > 0
  const addonKeys = Array.isArray(widget.props?.addons) ? widget.props.addons : []
  const labelValue = widget.props?.label
  const captionValue = widget.props?.labelCaption
  const hasFxExpression = (value: unknown) =>
    typeof value === 'string' && /\{\{[\s\S]*\}\}/.test(value)
  const labelAddonActive =
    addonKeys.includes('label') ||
    (typeof labelValue === 'string' && labelValue.trim().length > 0) ||
    (typeof captionValue === 'string' && captionValue.trim().length > 0) ||
    hasFxExpression(labelValue) ||
    hasFxExpression(captionValue)
  const [internalAddonPanel, setInternalAddonPanel] = useState<{
    key: string
    label: string
  } | null>(null)
  const isAddonPanelControlled = typeof activeAddonPanel !== 'undefined'
  const resolvedAddonPanel = isAddonPanelControlled ? activeAddonPanel : internalAddonPanel
  const setAddonPanel = useCallback(
    (panel: { key: string; label: string } | null) => {
      if (onActiveAddonPanelChange) {
        onActiveAddonPanelChange(panel)
        return
      }
      setInternalAddonPanel(panel)
    },
    [onActiveAddonPanelChange]
  )
  const isLabelPanel = resolvedAddonPanel?.key === 'label'
  const tableColumnPanelIndex = parseTableColumnPanelIndex(resolvedAddonPanel?.key)
  const isTableColumnPanel = tableColumnPanelIndex !== null
  const spacing = resolveWidgetSpacing(widget.type, widget.spacing)
  const inspectorConfig = useMemo(
    () => getWidgetInspector(definition.type),
    [definition.type]
  )
  const inspectorBaseFields = useMemo(
    () => inspectorConfig?.fields ?? definition.fields ?? [],
    [definition.fields, inspectorConfig?.fields]
  )
  const containerSlotOptions = useMemo(
    () => resolveContainerSlotOptions(parentWidget),
    [parentWidget]
  )
  const containerSlotField = useMemo<WidgetField | null>(() => {
    if (containerSlotOptions.length === 0) {
      return null
    }
    return {
      key: 'containerSlot',
      label: 'Container slot',
      type: 'select',
      section: 'Content',
      options: containerSlotOptions,
      valueType: ['string', 'void'],
      description: 'Assign this widget to a specific tab/step of the parent container.',
    }
  }, [containerSlotOptions])
  const baseFields = useMemo(() => {
    const fields = inspectorBaseFields.filter((field) => field.key !== 'containerSlot')
    return containerSlotField ? [...fields, containerSlotField] : fields
  }, [inspectorBaseFields, containerSlotField])
  const spacingFieldKeys = useMemo(() => {
    const noHeightWidgets = new Set(['EditableText', 'TextInput', 'Email', 'Url'])
    const sidebarWidgets = new Set(['Sidebar', 'GlobalSidebar'])
    if (sidebarWidgets.has(widget.type)) {
      return noHeightWidgets.has(widget.type)
        ? ['spacingPadding', 'spacingHeaderPadding', 'spacingFooterPadding']
        : ['height', 'spacingPadding', 'spacingHeaderPadding', 'spacingFooterPadding']
    }
    return noHeightWidgets.has(widget.type) ? ['margin'] : ['height', 'margin']
  }, [widget.type])
  const spacingFields = useMemo(() => {
    if (isLabelPanel || isTableColumnPanel) {
      return []
    }
    const baseKeys = new Set(baseFields.map((field) => field.key))
    return resolveInspectorFields(spacingFieldKeys).filter((field) => !baseKeys.has(field.key))
  }, [baseFields, isLabelPanel, isTableColumnPanel, spacingFieldKeys])
  const rawFields = useMemo(
    () => (isLabelPanel || isTableColumnPanel ? baseFields : [...baseFields, ...spacingFields]),
    [baseFields, isLabelPanel, isTableColumnPanel, spacingFields]
  )
  const fieldLookup = useMemo(() => new Map(rawFields.map((field) => [field.key, field])), [
    rawFields,
  ])
  const resolveSegmentedFxValue = useCallback(
    (field: WidgetField) => {
      const config = field.segmentedFx
      if (!config || field.source !== 'spacing') {
        return null
      }
      const modeRaw = spacing[config.modeKey as keyof BuilderWidgetSpacing]
      const fxRaw = spacing[config.fxKey as keyof BuilderWidgetSpacing]
      const fxEnabledRaw = spacing[config.fxEnabledKey as keyof BuilderWidgetSpacing]
      return {
        mode: typeof modeRaw === 'string' && modeRaw ? modeRaw : config.defaultMode,
        fxEnabled: Boolean(fxEnabledRaw),
        fx: typeof fxRaw === 'string' ? fxRaw : '',
      }
    },
    [spacing]
  )
  const getFieldValue = useCallback(
    (field: WidgetField) => {
      if (field.type === 'radioGroup' && field.segmentedFx) {
        const segmentedValue = resolveSegmentedFxValue(field)
        if (segmentedValue) {
          return segmentedValue
        }
      }
      if (field.key === 'containerSlot' && field.type === 'select') {
        const raw = widget.props?.[field.key]
        if (typeof raw === 'string' && raw.trim().length > 0) {
          return raw.trim()
        }
        return SLOT_AUTO_VALUE
      }
      if (field.source === 'spacing') {
        return spacing[field.key as keyof BuilderWidgetSpacing]
      }
      const hasOwnValue = Boolean(
        widget.props && Object.prototype.hasOwnProperty.call(widget.props, field.key)
      )
      if (hasOwnValue) {
        return widget.props?.[field.key]
      }
      return definition.defaultProps?.[field.key as keyof typeof definition.defaultProps]
    },
    [definition, resolveSegmentedFxValue, spacing, widget.props]
  )
  const getFieldValueByKey = useCallback(
    (key: string) => {
      const field = fieldLookup.get(key)
      if (field?.key === 'containerSlot' && field.type === 'select') {
        const raw = widget.props?.[key]
        if (typeof raw === 'string' && raw.trim().length > 0) {
          return raw.trim()
        }
        return SLOT_AUTO_VALUE
      }
      if (field?.type === 'radioGroup' && field.segmentedFx) {
        const segmentedValue = resolveSegmentedFxValue(field)
        if (segmentedValue) {
          return segmentedValue.fxEnabled ? segmentedValue.fx : segmentedValue.mode
        }
      }
      if (field?.source === 'spacing') {
        return spacing[key as keyof BuilderWidgetSpacing]
      }
      const hasOwnValue = Boolean(
        widget.props && Object.prototype.hasOwnProperty.call(widget.props, key)
      )
      if (hasOwnValue) {
        return widget.props?.[key]
      }
      return definition.defaultProps?.[key as keyof typeof definition.defaultProps]
    },
    [definition, fieldLookup, resolveSegmentedFxValue, spacing, widget.props]
  )
  const handleFieldChange = (field: WidgetField, patch: Record<string, unknown>) => {
    if (field.key === 'containerSlot') {
      const rawValue = patch[field.key]
      onUpdateProps({
        [field.key]:
          rawValue === SLOT_AUTO_VALUE ? '' : rawValue,
      })
      return
    }
    if (field.source === 'spacing') {
      onUpdateSpacing(patch as BuilderWidgetSpacing)
      return
    }
    onUpdateProps(patch)
  }
  const handleInlineFieldChange = (patch: Record<string, unknown>) => {
    const key = Object.keys(patch)[0]
    const field = key ? fieldLookup.get(key) : null
    if (field) {
      handleFieldChange(field, patch)
      return
    }
    onUpdateProps(patch)
  }
  const matchesDependency = (field: WidgetField) => {
    if (!field.dependsOn) {
      return true
    }
    const current = getFieldValueByKey(field.dependsOn.key)
    const expected = field.dependsOn.value
    if (Array.isArray(expected)) {
      return expected.includes(current as never)
    }
    return current === expected
  }
  const hasEventsField = rawFields.some((field) => field.key === 'events')
  const hasEventsProp = Boolean(widget.props && 'events' in widget.props)
  const supportsEventHandlers =
    hasEventsField ||
    hasEventsProp ||
    widget.type === 'DrawerCloseButton' ||
    widget.type === 'ModalCloseButton'
  const isFilteringActive = isFiltering && !isLabelPanel && !isTableColumnPanel
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const appTheme = useAppThemeSnapshot()
  const normalizedTheme = useMemo(
    () => normalizeAppTheme(appTheme.theme as Partial<BuilderAppTheme>),
    [appTheme.theme]
  )
  const activeThemeTokens = useMemo(() => getActiveThemeTokens(normalizedTheme), [normalizedTheme])
  const colorTokenOptions = useMemo(
    () => getAppThemeColorTokens(normalizedTheme, normalizedTheme.mode),
    [normalizedTheme]
  )
  const getStyleFallback = useMemo(
    () => (field: WidgetField) =>
      resolveStyleFallback(
        activeThemeTokens,
        normalizedTheme.mode,
        widget.type,
        field,
        colorTokenOptions
      ),
    [activeThemeTokens, normalizedTheme.mode, colorTokenOptions, widget.type]
  )
  const typographyTokenOptions = useMemo(
    () => getAppThemeTypographyTokens(activeThemeTokens.typography),
    [activeThemeTokens.typography]
  )
  const {
    fxStickyFields,
    setFxStickyFields,
    inlineEditorLayout,
    fxEditor,
    closeFxEditor,
    handleFxValueChange,
    fxEditorHint,
    inspectorControlRuntime,
    fxEditorLibs,
    fxEvalContext,
    fxCompletionWords,
    fxCompletionMetadata,
  } = useInspectorFxRuntime({
    widget,
    definition,
    spacing,
    eventTargets,
    eventQueries,
    eventScripts,
    eventPages,
    eventVariables,
    fxContextInfo,
    colorTokenOptions,
    typographyTokenOptions,
    handleFieldChange,
  })

  useEffect(() => {
    setCollapsedSections({})
  }, [widget.id])

  const isSectionCollapsible = (section?: string) =>
    Boolean(section && COLLAPSIBLE_SECTIONS.has(section))
  const isSectionCollapsed = (section?: string) =>
    !isFilteringActive && Boolean(section && collapsedSections[section])
  const toggleSection = (section?: string) => {
    if (!section || !isSectionCollapsible(section)) {
      return
    }
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    setAddonPanel(null)
  }, [setAddonPanel, widget.id])

  useEffect(() => {
    setFxStickyFields((prev) => {
      const next = { ...prev }
      rawFields.forEach((field) => {
        const value = getFieldValue(field)
        if (typeof value === 'string' && (value.includes('{{') || value.includes('}}'))) {
          next[field.key] = true
        }
      })
      return next
    })
  }, [getFieldValue, rawFields, setFxStickyFields])

  useEffect(() => {
    if (resolvedAddonPanel?.key === 'label' && !labelAddonActive) {
      setAddonPanel(null)
    }
  }, [labelAddonActive, resolvedAddonPanel, setAddonPanel])

  useEffect(() => {
    if (!isTableColumnPanelKey(resolvedAddonPanel?.key)) {
      return
    }
    const hasColumnsField = baseFields.some((field) => field.key === 'columns')
    if (!hasColumnsField) {
      setAddonPanel(null)
    }
  }, [baseFields, resolvedAddonPanel, setAddonPanel])

  const supportsLabelAddon = isLabelAddonWidget(widget.type)
  const {
    orderedGroups,
    showInteraction,
    showHiddenInAppearance,
    showProperties,
    showAccess,
    hasResults,
  } = useInspectorSectionGroups({
    baseFields,
    rawFields,
    widgetType: widget.type,
    normalizedSearch,
    isFilteringActive,
    isLabelPanel,
    isTableColumnPanel,
    supportsLabelAddon,
    supportsEventHandlers,
    matchesDependency,
  })
  const policyValue = widget.policy?.join(', ') ?? ''
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [listPopoverOpen, setListPopoverOpen] = useState<string | null>(null)
  const events = supportsEventHandlers ? widget.props?.events : []

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto  py-3">
        {isFilteringActive && !hasResults ? (
          <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-3 text-xs text-foreground-muted">
            No matching inspector fields.
          </div>
        ) : (
          <>
            {showProperties && (
              <BuilderInspectorSections
                orderedGroups={orderedGroups}
                showProperties={showProperties}
                showInteraction={showInteraction}
                showHiddenInAppearance={showHiddenInAppearance}
                isFilteringActive={isFilteringActive}
                supportsLabelAddon={supportsLabelAddon}
                supportsEventHandlers={supportsEventHandlers}
                widget={widget}
                definition={definition}
                events={events}
                eventTargets={eventTargets}
                eventQueries={eventQueries}
                eventScripts={eventScripts}
                eventPages={eventPages}
                eventApps={eventApps}
                eventVariables={eventVariables}
                listPopoverOpen={listPopoverOpen}
                setListPopoverOpen={setListPopoverOpen}
                setAddonPanel={setAddonPanel}
                activeAddonPanel={resolvedAddonPanel}
                onUpdateProps={onUpdateProps}
                onUpdateHidden={onUpdateHidden}
                controlRuntime={inspectorControlRuntime}
                getStyleFallback={getStyleFallback}
                fxStickyFields={fxStickyFields}
                handleFieldChange={handleFieldChange}
                handleInlineFieldChange={handleInlineFieldChange}
                getFieldValue={getFieldValue}
                inlineEditorLayout={inlineEditorLayout}
                isSectionCollapsible={isSectionCollapsible}
                isSectionCollapsed={isSectionCollapsed}
                toggleSection={toggleSection}
              />
            )}
            {(showProperties || showInteraction) && showAccess && (
              <Separator />
            )}
            {showAccess && (
              <InspectorAccessVisibilitySection
                policyValue={policyValue}
                visibleWhen={widget.visibleWhen}
                disabledWhen={widget.disabledWhen}
                onUpdateAccess={onUpdateAccess}
              />
            )}
          </>
        )}
      </div>
      <Dialog open={Boolean(fxEditor)} onOpenChange={(open) => !open && closeFxEditor()}>
        <DialogContent size="large" className="overflow-hidden p-0">
          <DialogHeader className="border-b" padding="small">
            <DialogTitle>
              FX{fxEditor?.field?.label ? ` · ${fxEditor.field.label}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-4 py-3">
            <div className="h-[260px] overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100">
              <CodeEditor
                id={fxEditor?.editorId ?? 'fx-editor'}
                language="javascript"
                value={fxEditor?.value ?? ''}
                onInputChange={handleFxValueChange}
                autofocus={false}
                className="h-full"
                hideLineNumbers
                highlightOnlyFx={
                  fxEditor?.field ? isTemplateValueField(fxEditor.field) : false
                }
                  options={{
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    quickSuggestions: false,
                    suggestOnTriggerCharacters: false,
                    wordBasedSuggestions: 'off',
                    tabCompletion: 'on',
                    lineHeight: 18,
                  }}
                extraLibs={fxEditorLibs}
                autoTriggerSuggestions
                completionWords={fxCompletionWords}
                completionMetadata={fxCompletionMetadata}
                customSuggestions={{ enabled: true, context: fxEvalContext }}
              />
            </div>
            {fxEditorHint}
            <div className="text-[11px] text-foreground-muted">
              Use {'{{ }}'} to reference data and run expressions.
            </div>
          </div>
          <DialogFooter padding="small">
            <Button type="default" onClick={closeFxEditor}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete component</AlertDialogTitle>
            <AlertDialogDescription>
              {`Delete "${widget.id}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => {
                onDelete?.()
                setIsDeleteOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export const BuilderInspector = (props: BuilderInspectorProps) => {
  if (!props.widget || !props.definition) {
    return (
      <InspectorEmptyState
        title="Select a widget"
        description="Pick a widget on the canvas to edit its properties."
      />
    )
  }

  return (
    <BuilderInspectorContent
      {...props}
      widget={props.widget}
      definition={props.definition}
    />
  )
}
