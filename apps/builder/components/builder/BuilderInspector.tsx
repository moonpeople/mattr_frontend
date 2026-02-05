import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, Plus, X, MoreHorizontal } from 'lucide-react'

import type { WidgetDefinition, WidgetField } from 'widgets'
import { getWidgetInspector } from 'widgets'
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
  Input_Shadcn_,
  Checkbox_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import type { BuilderWidgetInstance, BuilderWidgetSpacing } from './types'
import { resolveWidgetSpacing } from './types'
import { BuilderEventHandlers } from './BuilderEventHandlers'
import { resolveValue } from 'lib/builder/value-resolver'
import CodeEditor, { CodeEditorContentSize } from 'components/ui/CodeEditor/CodeEditor'
import {
  FX_BASE_CONTEXT,
  FxInput,
  buildCompletionMetadata,
  buildFxEditorLibs,
  formatValueKindLabel,
  formatValuePreview,
  getValueTypeLabel,
  inferValueKind,
  parseValueTypeTokens,
} from './components'

// Inspektor widgeta: poisk polei i paneli Properties/Spacing/Access.

type InlineEditorLayout = {
  baselineWidth: number
  overflow: boolean
}

const DEFAULT_MARGIN = '4px 8px'
const BOOLEAN_CHECKBOX_FIELDS = new Set(['showClearButton', 'labelHide', 'labelWrap'])
const MARGIN_FX_FIELD: WidgetField = {
  key: 'marginFx',
  label: 'Margin',
  type: 'text',
  supportsFx: true,
  valueType: 'String | Void',
}
const FORCE_FX_FIELDS = new Set(['disabled', 'loading'])
const FORCE_FX_DEFAULTS: Record<string, unknown> = {
  disabled: false,
  loading: false,
}
const HIDDEN_FX_FIELD: WidgetField = {
  key: 'hidden',
  label: 'Hidden',
  type: 'boolean',
  supportsFx: true,
  valueType: 'Boolean | Void',
  description: 'Hide this widget in preview and runtime.',
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const isValidIdentifier = (value: string) => IDENTIFIER_RE.test(value)

const fieldAllowsFx = (field: WidgetField) => {
  if (typeof field.valueType === 'string') {
    return field.valueType.toLowerCase().includes('void')
  }
  return Boolean(field.supportsFx)
}

const resolveForceFxValue = (fieldKey: string, value: unknown) => {
  if (!FORCE_FX_FIELDS.has(fieldKey)) {
    return value
  }
  if (value === null || typeof value === 'undefined') {
    return FORCE_FX_DEFAULTS[fieldKey]
  }
  return value
}

const isTemplateStringField = (field: WidgetField) =>
  fieldAllowsFx(field) && field.type === 'text'

const INLINE_FX_LABEL_LIMIT = 20

const shouldStackField = (
  field: WidgetField,
  value: unknown,
  _fxMode?: boolean,
  _inlineOverflow?: boolean
) => {
  if (!isTemplateStringField(field)) {
    return false
  }
  if (typeof value !== 'string') {
    return false
  }
  if (value.length > INLINE_FX_LABEL_LIMIT) {
    return true
  }
  return value.includes('\n')
}

const evaluateExpression = (expression: string, context: Record<string, unknown>) => {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('context', `with (context) { return (${expression}); }`)
    return { value: fn(context) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid expression' }
  }
}

const evaluateFxInput = (
  raw: string,
  mode: 'expression' | 'template',
  context: Record<string, unknown>
) => {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { value: undefined }
  }

  if (mode === 'expression') {
    const expression = isFxValue(trimmed)
      ? trimmed.slice(2, -2).trim()
      : trimmed
    return evaluateExpression(expression, context)
  }

  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    const expression = trimmed.slice(2, -2).trim()
    return evaluateExpression(expression, context)
  }

  if (trimmed.includes('{{')) {
    return { value: resolveValue(raw, context) }
  }

  return { value: raw }
}

const buildSelfContext = ({
  widget,
  definition,
  spacing,
  widgetValues,
}: {
  widget: BuilderWidgetInstance
  definition?: WidgetDefinition
  spacing: ReturnType<typeof resolveWidgetSpacing>
  widgetValues?: Record<string, Record<string, unknown>>
}) => {
  const base =
    widgetValues?.[widget.id] ??
    ({
      ...(definition?.defaultProps ?? {}),
      ...(widget.props ?? {}),
    } as Record<string, unknown>)

  const margin = spacing.marginMode === 'none' ? '0px' : DEFAULT_MARGIN
  const labelHide = base.labelHide ?? base.hideLabel
  const labelWidthValue = base.labelWidthValue ?? base.labelWidth
  const labelWidthUnit = base.labelWidthUnit ?? 'col'

  return {
    pluginType:
      base.pluginType ??
      (definition?.type === 'EditableText' ? 'EditableTextWidget2' : definition?.type ?? ''),
    id: widget.id,
    ...base,
    labelHide,
    hideLabel: labelHide,
    labelWidth: labelWidthValue,
    labelWidthValue,
    labelWidthUnit,
    showClear: base.showClear ?? base.showClearButton,
    textBefore: base.textBefore ?? base.prefix ?? '',
    textAfter: base.textAfter ?? base.suffix ?? '',
    iconBefore: base.iconBefore ?? base.prefixIcon ?? '',
    iconAfter: base.iconAfter ?? base.suffixIcon ?? '',
    tooltipText: base.tooltipText ?? base.tooltip ?? '',
    formDataKey: base.formDataKey ?? widget.id,
    margin,
    _desktopMargin: margin,
    _mobileMargin: margin,
  }
}

interface BuilderInspectorProps {
  widget: BuilderWidgetInstance | null
  definition?: WidgetDefinition
  search?: string
  eventTargets?: { id: string; label: string; type?: string }[]
  eventQueries?: { id: string; label: string }[]
  eventScripts?: { id: string; label: string }[]
  eventPages?: { id: string; label: string }[]
  eventApps?: { id: string; label: string }[]
  eventVariables?: { id: string; label: string }[]
  activeAddonPanel?: { key: string; label: string } | null
  onActiveAddonPanelChange?: (panel: { key: string; label: string } | null) => void
  fxContextInfo?: {
    appName?: string
    currentPage?: string
    pages?: string[]
    currentUser?: Record<string, unknown> | null
    localStorage?: Record<string, unknown>
    theme?: Record<string, unknown>
    location?: Record<string, unknown>
    viewport?: { width: number; height: number }
    runningQueries?: string[]
    queryResults?: Record<string, { data?: unknown; isFetching?: boolean }>
    widgetValues?: Record<string, Record<string, unknown>>
  }
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

export const BuilderInspector = ({
  widget,
  definition,
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
}: BuilderInspectorProps) => {
  // Pustoi state, kogda nichego ne vybrano.
  if (!widget || !definition) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-foreground-muted">
        <div className="text-sm font-medium text-foreground">Select a widget</div>
        <div>Pick a widget on the canvas to edit its properties.</div>
      </div>
    )
  }

  // Filtr po poisku upravlyaet vidimostyu sektsii.
  const normalizedSearch = (search ?? '').trim().toLowerCase()
  const isFiltering = normalizedSearch.length > 0
  const matches = (value: string) => value.toLowerCase().includes(normalizedSearch)
  const matchesField = (field: WidgetField) =>
    matches(field.label) ||
    matches(field.key) ||
    (field.section ? matches(field.section) : false)
  const matchesDependency = (field: WidgetField) => {
    if (!field.dependsOn) {
      return true
    }
    const current = widget.props?.[field.dependsOn.key]
    const expected = field.dependsOn.value
    if (Array.isArray(expected)) {
      return expected.includes(current as never)
    }
    return current === expected
  }
  const inspectorConfig = getWidgetInspector(definition.type)
  const rawFields = inspectorConfig?.fields ?? definition.fields ?? []
  const hasEventsField = rawFields.some((field) => field.key === 'events')
  const hasEventsProp = Boolean(widget.props && 'events' in widget.props)
  const supportsEventHandlers =
    hasEventsField ||
    hasEventsProp ||
    widget.type === 'DrawerCloseButton' ||
    widget.type === 'ModalCloseButton'
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
  const [fxStickyFields, setFxStickyFields] = useState<Record<string, boolean>>({})
  const [inlineEditorLayout, setInlineEditorLayout] = useState<
    Record<string, InlineEditorLayout>
  >({})
  const isAddonPanelControlled = typeof activeAddonPanel !== 'undefined'
  const resolvedAddonPanel = isAddonPanelControlled ? activeAddonPanel : internalAddonPanel
  const setAddonPanel = (panel: { key: string; label: string } | null) => {
    if (onActiveAddonPanelChange) {
      onActiveAddonPanelChange(panel)
      return
    }
    setInternalAddonPanel(panel)
  }
  const isLabelPanel = resolvedAddonPanel?.key === 'label'
  const isFilteringActive = isFiltering && !isLabelPanel
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setCollapsedSections({})
  }, [widget.id])

  useEffect(() => {
    setFxStickyFields({})
  }, [widget.id])

  useEffect(() => {
    setInlineEditorLayout({})
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
  }, [widget.id])

  useEffect(() => {
    setFxStickyFields((prev) => {
      const next = { ...prev }
      rawFields.forEach((field) => {
        const value = widget.props?.[field.key]
        if (typeof value === 'string' && (value.includes('{{') || value.includes('}}'))) {
          next[field.key] = true
        }
      })
      return next
    })
  }, [rawFields, widget.props])

  useEffect(() => {
    if (resolvedAddonPanel?.key === 'label' && !labelAddonActive) {
      setAddonPanel(null)
    }
  }, [resolvedAddonPanel, labelAddonActive])

  const supportsLabelAddon =
    widget.type === 'EditableText' || widget.type === 'EditableTextArea'
  const labelPanelFields = isLabelPanel
    ? (() => {
        const byKey = new Map(rawFields.map((field) => [field.key, field]))
        const labelField = byKey.get('label')
        const captionField = byKey.get('labelCaption')
        const labelSectionFields = rawFields.filter((field) => field.section === 'Label')
        const contentFields = [labelField, captionField]
          .filter((field): field is WidgetField => Boolean(field))
          .map((field) => ({ ...field, section: 'Content' }))
        const appearanceFields = labelSectionFields
          .filter((field) => field.key !== 'labelCaption')
          .map((field) => ({ ...field, section: 'Appearance' }))
        return [...contentFields, ...appearanceFields]
      })()
    : []

  const scopedFields = isLabelPanel ? labelPanelFields : rawFields
  const fields = scopedFields
    .filter((field) => !(supportsEventHandlers && field.key === 'events'))
    .filter(matchesDependency)
    .filter(
      (field) =>
        !(supportsLabelAddon && field.section === 'Label' && !isLabelPanel)
    )
  const filteredFields = isFilteringActive ? fields.filter(matchesField) : fields
  const hasSections = filteredFields.some((field) => Boolean(field.section))
  const groupedFields: {
    section?: string
    fields: WidgetField[]
    advancedFields: WidgetField[]
    listSections: { title: string; storageKey: string; fields: WidgetField[] }[]
  }[] = []
  if (hasSections) {
    const lookup = new Map<
      string,
      {
        section?: string
        fields: WidgetField[]
        advancedFields: WidgetField[]
        listSections: { title: string; storageKey: string; fields: WidgetField[] }[]
      }
    >()
    filteredFields.forEach((field) => {
      const rawSection = field.section ?? ''
      const listSection = resolveListSectionConfig(rawSection, widget.type)
      const groupSection = listSection?.parent ?? rawSection
      if (!lookup.has(groupSection)) {
        const group = {
          section: groupSection || undefined,
          fields: [],
          advancedFields: [],
          listSections: [],
        }
        lookup.set(groupSection, group)
        groupedFields.push(group)
      }
      const group = lookup.get(groupSection)!
      if (listSection && !isFilteringActive) {
        let listGroup = group.listSections.find(
          (item) => item.storageKey === listSection.storageKey
        )
        if (!listGroup) {
          listGroup = {
            title: rawSection || listSection.parent,
            storageKey: listSection.storageKey,
            fields: [],
          }
          group.listSections.push(listGroup)
        }
        listGroup.fields.push(field)
        return
      }
      const isAdvanced = !isFilteringActive && Boolean(field.advanced) && Boolean(field.section)
      if (isAdvanced) {
        group.advancedFields.push(field)
      } else {
        group.fields.push(field)
      }
    })
  } else if (filteredFields.length > 0) {
    groupedFields.push({ fields: filteredFields, advancedFields: [], listSections: [] })
  }
  const showInteraction =
    !isLabelPanel &&
    supportsEventHandlers &&
    (!isFilteringActive ||
      ['interaction', 'event', 'handler'].some((keyword) =>
        normalizedSearch.includes(keyword)
      ))
  const showHiddenInAppearance =
    !isLabelPanel &&
    (!isFilteringActive || normalizedSearch.includes('hidden'))
  const showProperties =
    !isFilteringActive ||
    filteredFields.length > 0 ||
    (showInteraction && !isLabelPanel) ||
    showHiddenInAppearance
  const interactionGroupIndex = groupedFields.findIndex(
    (group) => group.section === 'Interaction'
  )
  const renderGroupsWithInteraction =
    showInteraction && interactionGroupIndex === -1
      ? [...groupedFields, { section: 'Interaction', fields: [], advancedFields: [] }]
      : groupedFields
  const appearanceGroupIndex = renderGroupsWithInteraction.findIndex(
    (group) => group.section === 'Appearance'
  )
  const renderGroups =
    showHiddenInAppearance && appearanceGroupIndex === -1
      ? (() => {
          const interactionIndex = renderGroupsWithInteraction.findIndex(
            (group) => group.section === 'Interaction'
          )
          const nextGroups = [...renderGroupsWithInteraction]
          const insertAt = interactionIndex === -1 ? nextGroups.length : interactionIndex
          nextGroups.splice(insertAt, 0, {
            section: 'Appearance',
            fields: [],
            advancedFields: [],
            listSections: [],
          })
          return nextGroups
        })()
      : renderGroupsWithInteraction
  const showSpacing =
    !isLabelPanel &&
    (!isFilteringActive ||
      ['spacing', 'height', 'margin', 'size'].some((keyword) =>
        normalizedSearch.includes(keyword)
      ))
  const showAccess =
    !isLabelPanel &&
    (!isFilteringActive ||
      ['access', 'visibility', 'policy', 'visible', 'disabled'].some((keyword) =>
        normalizedSearch.includes(keyword)
      ))
  const hasResults = showProperties || showInteraction || showSpacing || showAccess
  const policyValue = widget.policy?.join(', ') ?? ''
  const spacing = resolveWidgetSpacing(widget.type, widget.spacing)
  const isSpacingCollapsed = isSectionCollapsed('Spacing')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [listPopoverOpen, setListPopoverOpen] = useState<string | null>(null)
  const [fxEditor, setFxEditor] = useState<{
    field: WidgetField
    editorId: string
    value: string
    onChange?: (value: string) => void
  } | null>(null)
  const events = supportsEventHandlers ? widget.props?.events : []
  const widgetIds = useMemo(
    () => eventTargets.map((target) => target.id).filter(isValidIdentifier),
    [eventTargets]
  )
  const queryNames = useMemo(() => {
    const names = new Set<string>()
    eventQueries.forEach((query) => {
      if (isValidIdentifier(query.label)) {
        names.add(query.label)
      }
      if (isValidIdentifier(query.id)) {
        names.add(query.id)
      }
    })
    return Array.from(names)
  }, [eventQueries])
  const scriptNames = useMemo(() => {
    const names = new Set<string>()
    eventScripts.forEach((script) => {
      if (isValidIdentifier(script.label)) {
        names.add(script.label)
      }
      if (isValidIdentifier(script.id)) {
        names.add(script.id)
      }
    })
    return Array.from(names)
  }, [eventScripts])
  const stateKeys = useMemo(
    () => eventVariables.map((variable) => variable.id).filter(isValidIdentifier),
    [eventVariables]
  )
  const fxEditorLibs = useMemo(
    () =>
      buildFxEditorLibs({
        widgetIds,
        queryNames,
        scriptNames,
        stateKeys,
      }),
    [queryNames, scriptNames, stateKeys, widgetIds]
  )
  const fxEvalContext = useMemo(() => {
    const queryResults = fxContextInfo?.queryResults ?? {}
    const stateContext = Object.fromEntries(
      stateKeys.map((key) => [key, queryResults[key]?.data ?? undefined])
    )
    const widgetContext =
      fxContextInfo?.widgetValues ??
      Object.fromEntries(widgetIds.map((id) => [id, {}]))
    const queryContext = Object.fromEntries(
      queryNames.map((name) => {
        const result = queryResults[name]
        return [
          name,
          {
            data: result?.data ?? null,
            isFetching: result?.isFetching ?? false,
          },
        ]
      })
    )
    const scriptContext = Object.fromEntries(
      scriptNames.map((name) => [name, () => undefined])
    )
    const pages = fxContextInfo?.pages ?? eventPages.map((page) => page.label)
    const currentPage = fxContextInfo?.currentPage ?? pages[0] ?? ''
    const appName = fxContextInfo?.appName ?? ''
    const runningQueries = fxContextInfo?.runningQueries ?? queryNames
    const currentUser = fxContextInfo?.currentUser ?? FX_BASE_CONTEXT.current_user
    const localStorage = fxContextInfo?.localStorage ?? FX_BASE_CONTEXT.localStorage
    const theme = fxContextInfo?.theme ?? FX_BASE_CONTEXT.theme
    const location = fxContextInfo?.location ?? FX_BASE_CONTEXT.location
    const viewport = fxContextInfo?.viewport ?? FX_BASE_CONTEXT.viewport
    const selfContext = buildSelfContext({
      widget,
      definition,
      spacing,
      widgetValues: fxContextInfo?.widgetValues,
    })

    return {
      ...FX_BASE_CONTEXT,
      state: stateContext,
      auth: currentUser ? { user: currentUser } : FX_BASE_CONTEXT.auth,
      current_user: currentUser ?? FX_BASE_CONTEXT.current_user,
      localStorage,
      theme,
      location,
      viewport,
      widgets: widgetContext,
      queries: queryContext,
      self: selfContext,
      retoolContext: {
        ...FX_BASE_CONTEXT.retoolContext,
        appName,
        currentPage,
        pages,
        runningQueries,
      },
      ...widgetContext,
      ...queryContext,
      ...scriptContext,
    }
  }, [
    definition,
    eventPages,
    fxContextInfo?.appName,
    fxContextInfo?.currentPage,
    fxContextInfo?.pages,
    fxContextInfo?.currentUser,
    fxContextInfo?.localStorage,
    fxContextInfo?.theme,
    fxContextInfo?.location,
    fxContextInfo?.viewport,
    fxContextInfo?.runningQueries,
    fxContextInfo?.queryResults,
    fxContextInfo?.widgetValues,
    queryNames,
    scriptNames,
    stateKeys,
    spacing,
    widget,
    widgetIds,
  ])
  const fxCompletionMetadata = useMemo(
    () => buildCompletionMetadata(fxEvalContext),
    [fxEvalContext]
  )
  const fxCompletionWords = useMemo(() => {
    return Object.keys(fxCompletionMetadata).sort()
  }, [fxCompletionMetadata])
  const handleMarginFxToggle = (checked: boolean) => {
    if (checked) {
      const existingValue = spacing.marginFx ?? ''
      const defaultValue =
        spacing.marginMode === 'none' ? '' : DEFAULT_MARGIN
      onUpdateSpacing({
        marginFxEnabled: true,
        marginFx: existingValue.trim().length > 0 ? existingValue : defaultValue,
      })
      return
    }
    onUpdateSpacing({ marginFxEnabled: false })
  }

  const openFxEditor = (
    field: WidgetField,
    rawValue: unknown,
    editorId: string,
    onChange?: (value: string) => void
  ) => {
    const isEnabled = isFxValue(rawValue)
    const allowTemplate = isTemplateStringField(field)
    const expression = allowTemplate
      ? String(rawValue ?? '')
      : isEnabled
        ? String(rawValue ?? '')
        : toFxExpression(field, rawValue)
    const updateValue =
      onChange ?? ((nextValue: string) => onUpdateProps({ [field.key]: nextValue }))
    if (!allowTemplate && !isEnabled) {
      updateValue(expression)
    }
    setFxStickyFields((prev) => ({ ...prev, [field.key]: true }))
    setFxEditor({ field, editorId, value: expression, onChange })
  }

  const handleFxValueChange = (nextValue?: string) => {
    setFxEditor((prev) => {
      if (!prev) {
        return prev
      }
      const value = nextValue ?? ''
      const applyValue =
        prev.onChange ?? ((next: string) => onUpdateProps({ [prev.field.key]: next }))
      applyValue(value)
      if (value.includes('{{') || value.includes('}}')) {
        setFxStickyFields((fields) => ({ ...fields, [prev.field.key]: true }))
      }
      return { ...prev, value }
    })
  }

  const handleFxDisable = () => {
    setFxEditor((prev) => {
      if (!prev) {
        return prev
      }
      onUpdateProps({ [prev.field.key]: coerceFxToStatic(prev.field, prev.value) })
      setFxStickyFields((fields) => ({ ...fields, [prev.field.key]: false }))
      return null
    })
  }

  const toggleFxMode = (field: WidgetField, value: unknown) => {
    if (!fieldAllowsFx(field)) {
      return
    }
    const isActive = Boolean(fxStickyFields[field.key]) || isFxValue(value)
    if (isActive) {
      onUpdateProps({ [field.key]: coerceFxToStatic(field, value) })
      setFxStickyFields((fields) => ({ ...fields, [field.key]: false }))
      return
    }
    const expression = isTemplateStringField(field)
      ? String(value ?? '')
      : toFxExpression(field, value)
    onUpdateProps({ [field.key]: expression })
    setFxStickyFields((fields) => ({ ...fields, [field.key]: true }))
  }

  const handleInlineEditorSize = (fieldKey: string, metrics: CodeEditorContentSize) => {
    if (!metrics.contentWidth) {
      return
    }

    setInlineEditorLayout((prev) => {
      const prevEntry = prev[fieldKey]
      const baselineWidth = prevEntry?.overflow ? prevEntry.baselineWidth : metrics.contentWidth
      const isMultiline =
        metrics.lineCount > 1 || metrics.contentHeight > metrics.lineHeight + 1
      const overflow = isMultiline || metrics.scrollWidth > baselineWidth + 1
      if (
        prevEntry &&
        prevEntry.baselineWidth === baselineWidth &&
        prevEntry.overflow === overflow
      ) {
        return prev
      }
      return { ...prev, [fieldKey]: { baselineWidth, overflow } }
    })
  }

  const fxEditorHint =
    fxEditor?.field
      ? buildFxInlineHint(
          fxEditor.field,
          fxEditor.value,
          isTemplateStringField(fxEditor.field) ? 'template' : 'expression',
          fxEvalContext ?? FX_BASE_CONTEXT
        )
      : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
        {isFilteringActive && !hasResults ? (
          <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-3 text-xs text-foreground-muted">
            No matching inspector fields.
          </div>
        ) : (
          <>
            {showProperties && (
              <div className="space-y-3">
                {renderGroups.map((group, groupIndex) => {
                  const sectionName = group.section
                  const listSections = group.listSections ?? []
                  const isCollapsible = isSectionCollapsible(sectionName)
                  const isCollapsed = isSectionCollapsed(sectionName)

                  return (
                    <div key={sectionName ?? `group-${groupIndex}`} className="space-y-2">
                      {sectionName && (
                        <div
                          className="flex h-6 items-center justify-between"
                        >
                          {isCollapsible ? (
                            <button
                              type="button"
                              className="flex items-center gap-1 text-[12px] font-medium hover:text-foreground"
                              onClick={() => toggleSection(sectionName)}
                            >
                              <span>{sectionName}</span>
                            </button>
                          ) : (
                            <div className="text-[12px] font-medium text-foreground-muted">
                              {sectionName}
                            </div>
                          )}
                          {group.advancedFields.length > 0 && !isFilteringActive && (
                            <Popover_Shadcn_>
                              <PopoverTrigger_Shadcn_>
                                <MoreHorizontal size={12}/>
                              </PopoverTrigger_Shadcn_>
                              <PopoverContent_Shadcn_ className="w-80 p-3" align="end">
                                <div className="space-y-2">
                                  <div className="text-[11px] uppercase text-foreground-muted">
                                    Advanced options
                                  </div>
                                  {group.advancedFields.map((field) => {
                                    const forceFxMode = FORCE_FX_FIELDS.has(field.key)
                                    const value = widget.props[field.key]
                                    const fieldValue = resolveForceFxValue(field.key, value)
                                    return (
                              <FieldRow
                                key={`advanced-${field.key}`}
                                field={field}
                                value={fieldValue}
                                editorId={`builder-fx-${widget.id}-${field.key}`}
                                onFxClick={openFxEditor}
                                onChange={onUpdateProps}
                                fxMode={forceFxMode || Boolean(fxStickyFields[field.key])}
                                inlineOverflow={inlineEditorLayout[field.key]?.overflow}
                                onInlineEditorSize={handleInlineEditorSize}
                                fxEditorLibs={fxEditorLibs}
                                fxEvalContext={fxEvalContext}
                                fxCompletionWords={fxCompletionWords}
                                fxCompletionMetadata={fxCompletionMetadata}
                              />
                                    )
                                  })}
                                </div>
                              </PopoverContent_Shadcn_>
                            </Popover_Shadcn_>
                          )}
                        </div>
                      )}
                      {!isCollapsed && (
                        <>
                          {group.fields.map((field) => {
                            const forceFxMode = FORCE_FX_FIELDS.has(field.key)
                            const value = widget.props[field.key]
                            const fieldValue = resolveForceFxValue(field.key, value)
                            return (
                              <FieldRow
                                key={field.key}
                                field={field}
                                value={fieldValue}
                                editorId={`builder-fx-${widget.id}-${field.key}`}
                                onFxClick={openFxEditor}
                                onChange={onUpdateProps}
                                fxMode={forceFxMode || Boolean(fxStickyFields[field.key])}
                                onToggleFxMode={forceFxMode ? undefined : toggleFxMode}
                                inlineOverflow={inlineEditorLayout[field.key]?.overflow}
                                onInlineEditorSize={handleInlineEditorSize}
                                fxEditorLibs={fxEditorLibs}
                                fxEvalContext={fxEvalContext}
                                fxCompletionWords={fxCompletionWords}
                                fxCompletionMetadata={fxCompletionMetadata}
                              />
                            )
                          })}
                          {sectionName === 'Appearance' && showHiddenInAppearance && (
                            <FieldRow
                              field={HIDDEN_FX_FIELD}
                              value={widget.hidden ?? false}
                              editorId={`builder-fx-${widget.id}-hidden`}
                              onFxClick={(field, value, editorId) =>
                                openFxEditor(field, value, editorId, (nextValue) =>
                                  onUpdateHidden(nextValue)
                                )
                              }
                              onChange={(patch) =>
                                onUpdateHidden(patch.hidden as boolean | string)
                              }
                              fxMode
                              inlineOverflow={inlineEditorLayout.hidden?.overflow}
                              onInlineEditorSize={handleInlineEditorSize}
                              fxEditorLibs={fxEditorLibs}
                              fxEvalContext={fxEvalContext}
                              fxCompletionWords={fxCompletionWords}
                              fxCompletionMetadata={fxCompletionMetadata}
                            />
                          )}
                          {listSections.map((listSection) => (
                            <div key={listSection.storageKey} className="space-y-2">
                              <SectionListHeader
                                title={listSection.title}
                                storageKey={listSection.storageKey}
                                openKey={listPopoverOpen}
                                onOpenChange={setListPopoverOpen}
                                fields={listSection.fields}
                                widgetProps={widget.props}
                                onAdd={(storageKey, key) => {
                                  const nextKeys = resolveSectionKeys(
                                    listSection.fields,
                                    widget.props,
                                    storageKey
                                  )
                                  if (!nextKeys.includes(key)) {
                                    onUpdateProps({ [storageKey]: [...nextKeys, key] })
                                  }
                                  setListPopoverOpen(null)
                                }}
                              />
                              <SectionList
                                fields={listSection.fields}
                                widgetProps={widget.props}
                                storageKey={listSection.storageKey}
                                widgetId={widget.id}
                                onFxClick={openFxEditor}
                                inlineOverflowLookup={inlineEditorLayout}
                                onInlineEditorSize={handleInlineEditorSize}
                                fxEditorLibs={fxEditorLibs}
                                fxEvalContext={fxEvalContext}
                                fxCompletionWords={fxCompletionWords}
                                fxCompletionMetadata={fxCompletionMetadata}
                                panelKeys={
                                  supportsLabelAddon &&
                                  listSection.storageKey === 'addons'
                                    ? ['label']
                                    : undefined
                                }
                                onOpenPanel={(key, label) => {
                                  setAddonPanel({ key, label })
                                  setListPopoverOpen(null)
                                }}
                                onChange={onUpdateProps}
                                fxModeLookup={fxStickyFields}
                                onToggleFxMode={toggleFxMode}
                              />
                            </div>
                          ))}
                          {sectionName === 'Interaction' && showInteraction && (
                            <BuilderEventHandlers
                              events={events}
                              onChange={(nextEvents) => onUpdateProps({ events: nextEvents })}
                              eventTargets={eventTargets}
                              eventQueries={eventQueries}
                              eventScripts={eventScripts}
                              eventPages={eventPages}
                              eventApps={eventApps}
                              eventVariables={eventVariables}
                              eventOptions={definition.builder?.eventOptions}
                              defaultTargetId={widget.id}
                              resetKey={widget.id}
                            />
                          )}
                        </>
                      )}
                      {groupIndex < renderGroups.length - 1 && <Separator />}
                    </div>
                  )
                })}
              </div>
            )}
            {(showProperties || showInteraction) && showSpacing && <Separator />}
            {showSpacing && (
              <div className="space-y-3">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[12px] font-semibold text-foreground hover:text-foreground"
                  onClick={() => toggleSection('Spacing')}
                >
                  <ChevronRight
                    className={`h-3 w-3 transition-transform ${
                      isSpacingCollapsed ? '' : 'rotate-90'
                    }`}
                  />
                  <span>Spacing</span>
                </button>
                {!isSpacingCollapsed && (
                  <>
                    {widget.type !== 'EditableText' && (
                      <InspectorRow label="Height" topAligned>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <SegmentedControl
                                value={spacing.heightMode}
                                options={[
                                  { label: 'Auto', value: 'auto' },
                                  { label: 'Fixed', value: 'fixed' },
                                ]}
                                disabled={Boolean(spacing.heightFxEnabled)}
                                onChange={(next) =>
                                  onUpdateSpacing({
                                    heightMode: next as BuilderWidgetSpacing['heightMode'],
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] uppercase text-foreground-muted">
                                fx
                              </span>
                              <Switch
                                checked={Boolean(spacing.heightFxEnabled)}
                                onCheckedChange={(checked) =>
                                  onUpdateSpacing({ heightFxEnabled: checked })
                                }
                                size="small"
                              />
                            </div>
                          </div>
                          {spacing.heightFxEnabled && (
                            <Input_Shadcn_
                              value={spacing.heightFx ?? ''}
                              onChange={(event) =>
                                onUpdateSpacing({ heightFx: event.target.value })
                              }
                              placeholder="{{ condition ? 'auto' : 'fixed' }}"
                              className="h-7 font-mono text-xs"
                            />
                          )}
                        </div>
                      </InspectorRow>
                    )}
                    <InspectorRow label="Margin" topAligned>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                            spacing.marginFxEnabled
                              ? 'bg-foreground/10 text-foreground'
                              : 'text-foreground-muted hover:bg-foreground/10 hover:text-foreground'
                          }`}
                          onClick={() => handleMarginFxToggle(!spacing.marginFxEnabled)}
                        >
                          fx
                        </button>
                        {spacing.marginFxEnabled ? (
                          <div className="min-w-[220px]">
                            <FxInput
                              field={MARGIN_FX_FIELD}
                              value={spacing.marginFx ?? ''}
                              editorId={`builder-fx-${widget.id}-margin`}
                              control={null}
                              isFxEnabled
                              isFxActive
                              isInlineCodeEditorField
                              useInlineFx={false}
                              isMultiline={false}
                              onChange={(patch) =>
                                onUpdateSpacing(patch as BuilderWidgetSpacing)
                              }
                              onFxClick={() =>
                                openFxEditor(
                                  MARGIN_FX_FIELD,
                                  spacing.marginFx ?? '',
                                  `builder-fx-${widget.id}-margin`,
                                  (nextValue) =>
                                    onUpdateSpacing({ marginFx: nextValue })
                                )
                              }
                              fxEditorLibs={fxEditorLibs}
                              fxEvalContext={fxEvalContext}
                              fxCompletionWords={fxCompletionWords}
                              fxCompletionMetadata={fxCompletionMetadata}
                            />
                          </div>
                        ) : (
                          <div className="min-w-[220px]">
                            <SegmentedControl
                              value={spacing.marginMode}
                              options={[
                                { label: 'Normal', value: 'normal' },
                                { label: 'None', value: 'none' },
                              ]}
                              onChange={(next) =>
                                onUpdateSpacing({
                                  marginMode: next as BuilderWidgetSpacing['marginMode'],
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </InspectorRow>
                  </>
                )}
              </div>
            )}
            {(showProperties || showInteraction || showSpacing) && showAccess && (
              <Separator />
            )}
            {showAccess && (
              <div className="space-y-3">
                <div className="text-[12px] font-semibold text-foreground">
                  Access & visibility
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-foreground-muted">Policy keys</div>
                  <Input_Shadcn_
                    value={policyValue}
                    onChange={(event) => {
                      const next = event.target.value
                      const policies = next
                        .split(',')
                        .map((value) => value.trim())
                        .filter(Boolean)
                      onUpdateAccess({ policy: policies })
                    }}
                    placeholder="project.read, project.update"
                    className="h-7"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-foreground-muted">Visible when</div>
                  <Textarea
                    value={widget.visibleWhen ?? ''}
                    onChange={(event) => onUpdateAccess({ visibleWhen: event.target.value })}
                    placeholder={'{{ policy.allow("project.read") }}'}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-foreground-muted">Disabled when</div>
                  <Textarea
                    value={widget.disabledWhen ?? ''}
                    onChange={(event) => onUpdateAccess({ disabledWhen: event.target.value })}
                    placeholder={'{{ row.status !== "pending" }}'}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Dialog open={Boolean(fxEditor)} onOpenChange={(open) => !open && setFxEditor(null)}>
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
                  fxEditor?.field ? isTemplateStringField(fxEditor.field) : false
                }
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  quickSuggestions: false,
                  suggestOnTriggerCharacters: false,
                  wordBasedSuggestions: false,
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
            <Button type="default" onClick={() => setFxEditor(null)}>
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

const LABEL_BASIS = 96
const COLLAPSIBLE_SECTIONS = new Set(['Content', 'Interaction', 'Appearance', 'Spacing'])
const LIST_SECTION_CONFIG: Record<string, { parent: string; storageKey: string }> = {
  'Add-ons': { parent: 'Content', storageKey: 'addons' },
  'Validation rules': { parent: 'Interaction', storageKey: 'validationRules' },
  'Styles': { parent: 'Appearance', storageKey: 'styles' },
}

const SegmentedControl = ({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (next: string) => void
  disabled?: boolean
}) => {
  return (
    <div
      className={`flex items-center rounded-md border border-foreground-muted/30 bg-surface-100 p-0.5 ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
      role="radiogroup"
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className={`flex-1 rounded-[4px] px-2 py-1 text-[11px] font-medium transition-colors box-border ${
              isActive
                ? 'border border-foreground-muted/30 bg-background text-foreground shadow-sm'
                : 'border border-transparent text-foreground-muted hover:text-foreground'
            }`}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

const LIST_SECTION_WIDGETS = new Set(['EditableText', 'EditableTextArea'])

const resolveListSectionConfig = (section: string | undefined, widgetType: string) => {
  if (!section || !LIST_SECTION_WIDGETS.has(widgetType)) {
    return null
  }
  return LIST_SECTION_CONFIG[section] ?? null
}

const resolveSectionKeys = (
  fields: WidgetField[],
  props: Record<string, unknown>,
  storageKey: string
) => {
  const stored = Array.isArray(props[storageKey])
    ? (props[storageKey] as string[]).filter(Boolean)
    : null
  if (stored && stored.length > 0) {
    return stored.filter((key) => fields.some((field) => field.key === key))
  }
  return fields
    .filter((field) => isSectionItemActive(field, props[field.key]))
    .map((field) => field.key)
}

const isSectionItemActive = (field: WidgetField, value: unknown) => {
  if (field.type === 'select') {
    const raw = typeof value === 'string' ? value : ''
    if (!raw) {
      return false
    }
    return raw !== 'none'
  }
  if (field.type === 'boolean') {
    return Boolean(value)
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return Boolean(value)
}

const getSectionEmptyValue = (field: WidgetField) => {
  if (field.type === 'boolean') {
    return false
  }
  if (field.type === 'select') {
    if (field.options.some((option) => option.value === 'none')) {
      return 'none'
    }
    return field.options[0]?.value ?? ''
  }
  return ''
}

const isFxValue = (value: unknown) =>
  typeof value === 'string' && /\{\{[\s\S]*\}\}/.test(value)

const toFxExpression = (field: WidgetField, value: unknown) => {
  if (typeof value === 'string' && isFxValue(value)) {
    return value
  }

  if (field.type === 'number') {
    const numeric =
      typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim()
          ? Number(value)
          : NaN
    return `{{ ${Number.isFinite(numeric) ? String(numeric) : 'null'} }}`
  }

  if (field.type === 'boolean') {
    const normalized =
      typeof value === 'boolean'
        ? value
        : typeof value === 'string'
          ? value.trim().toLowerCase() === 'true'
          : Boolean(value)
    return `{{ ${normalized ? 'true' : 'false'} }}`
  }

  if (field.type === 'select') {
    const textValue = typeof value === 'string' ? value : ''
    return `{{ ${JSON.stringify(textValue)} }}`
  }

  const textValue =
    typeof value === 'string'
      ? value
      : value === null || typeof value === 'undefined'
        ? ''
        : String(value)
  return `{{ ${JSON.stringify(textValue)} }}`
}

const coerceFxToStatic = (field: WidgetField, value: unknown) => {
  const resolved = typeof value === 'string' ? resolveValue(value, {}) : value

  if (field.type === 'number') {
    const numeric =
      typeof resolved === 'number'
        ? resolved
        : typeof resolved === 'string' && resolved.trim()
          ? Number(resolved)
          : NaN
    return Number.isFinite(numeric) ? numeric : ''
  }

  if (field.type === 'boolean') {
    if (typeof resolved === 'boolean') {
      return resolved
    }
    if (typeof resolved === 'string') {
      const normalized = resolved.trim().toLowerCase()
      if (normalized === 'true') {
        return true
      }
      if (normalized === 'false') {
        return false
      }
    }
    return false
  }

  if (field.type === 'select') {
    const selected = typeof resolved === 'string' ? resolved : ''
    return field.options.some((option) => option.value === selected)
      ? selected
      : field.options[0]?.value ?? ''
  }

  const textValue =
    typeof resolved === 'string'
      ? resolved
      : resolved === null || typeof resolved === 'undefined'
        ? ''
        : String(resolved)
  return isFxValue(textValue) ? '' : textValue
}

const FxInlineHint = ({
  valueType,
  description,
  status,
  message,
  valueTypeLabel,
  valuePreview,
}: {
  valueType?: string
  description?: string
  status?: 'ok' | 'error'
  message?: string
  valueTypeLabel?: string
  valuePreview?: string
}) => {
  if (!valueType && !description && !status) {
    return null
  }

  return (
    <div className="rounded-md border border-foreground-muted/30 bg-background p-2 text-[11px] shadow-sm">
      {(valueType || description) && (
        <div className="space-y-1">
          {valueType && <div className="text-[11px] font-semibold">{valueType}</div>}
          {description && <div className="text-[11px] text-foreground-muted">{description}</div>}
        </div>
      )}
      {status && (
        <div
          className={`mt-2 rounded-md border p-2 ${
            status === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          } max-h-40 overflow-y-auto`}
        >
          {status === 'error' && <div className="font-semibold">Error</div>}
          {message && <div className="text-[11px]">{message}</div>}
          {valueTypeLabel && (
            <div className="mt-1 text-[11px] font-semibold">{valueTypeLabel}</div>
          )}
          {valuePreview && (
            <div className="mt-1 whitespace-pre-wrap font-mono text-[11px]">{valuePreview}</div>
          )}
        </div>
      )}
    </div>
  )
}

const FieldLabel = ({
  label,
  valueType,
  description,
}: {
  label: string
  valueType?: string
  description?: string
}) => {
  if (!valueType && !description) {
    return <span className="truncate">{label}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="truncate cursor-help">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[240px]">
        <div className="space-y-1">
          {valueType && <div className="text-[11px] font-semibold">{valueType}</div>}
          {description && <div className="text-[11px] text-foreground-muted">{description}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

const renderStaticControl = (
  field: WidgetField,
  value: unknown,
  onChange: (patch: Record<string, unknown>) => void,
  disabled = false,
  inputClassName?: string
) => {
  const fieldValue = value ?? ''

  if (field.type === 'select') {
    return (
      <Select_Shadcn_
        value={String(fieldValue)}
        onValueChange={(next) => onChange({ [field.key]: next })}
        disabled={disabled}
      >
      <SelectTrigger_Shadcn_
        className={inputClassName ? `h-6 w-full ${inputClassName}` : 'h-6 w-full'}
      >
        <SelectValue_Shadcn_ placeholder={field.label} />
      </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          {field.options.map((option) => (
            <SelectItem_Shadcn_ key={option.value} value={option.value}>
              {option.label}
            </SelectItem_Shadcn_>
          ))}
        </SelectContent_Shadcn_>
      </Select_Shadcn_>
    )
  }

  if (field.type === 'textarea') {
    return (
      <Textarea
        value={String(fieldValue)}
        onChange={(event) => onChange({ [field.key]: event.target.value })}
        placeholder={field.placeholder}
        className={inputClassName}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'json') {
    const displayValue =
      typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue ?? {}, null, 2)

    return (
      <Textarea
        value={displayValue}
        onChange={(event) => onChange({ [field.key]: event.target.value })}
        placeholder={field.placeholder}
        className={
          inputClassName
            ? `min-h-[120px] font-mono text-xs ${inputClassName}`
            : 'min-h-[120px] font-mono text-xs'
        }
        disabled={disabled}
      />
    )
  }

  if (field.type === 'color') {
    const rawValue = typeof fieldValue === 'string' ? fieldValue.trim() : ''
    const normalizedValue = rawValue
      ? rawValue.startsWith('#')
        ? rawValue
        : /^[0-9a-fA-F]{3}$/.test(rawValue) || /^[0-9a-fA-F]{6}$/.test(rawValue)
          ? `#${rawValue}`
          : rawValue
      : '#000000'
    return (
      <div className="flex items-center gap-2">
        <Input_Shadcn_
          type="color"
          value={normalizedValue}
          onChange={(event) => onChange({ [field.key]: event.target.value })}
          className="h-7 w-10 p-1"
          disabled={disabled}
        />
        <Input_Shadcn_
          value={String(fieldValue)}
          onChange={(event) => onChange({ [field.key]: event.target.value })}
          placeholder={field.placeholder}
          className={inputClassName ? `h-6 flex-1 ${inputClassName}` : 'h-6 flex-1'}
          disabled={disabled}
        />
      </div>
    )
  }

  if (field.type === 'number') {
    return (
      <Input_Shadcn_
        type="number"
        value={
          fieldValue === '' || fieldValue === null || typeof fieldValue === 'undefined'
            ? ''
            : Number(fieldValue)
        }
        onChange={(event) => {
          const next = event.target.value
          onChange({ [field.key]: next === '' ? '' : Number(next) })
        }}
        placeholder={field.placeholder}
        className={inputClassName ? `h-6 ${inputClassName}` : 'h-6'}
        min={field.min}
        max={field.max}
        step={field.step}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'boolean') {
    if (BOOLEAN_CHECKBOX_FIELDS.has(field.key)) {
      return (
        <Checkbox_Shadcn_
          checked={Boolean(fieldValue)}
          onCheckedChange={(checked) => onChange({ [field.key]: Boolean(checked) })}
        />
      )
    }
    return (
      <Switch
        checked={Boolean(fieldValue)}
        onCheckedChange={(checked) => onChange({ [field.key]: checked })}
        size={"small"}
        disabled={disabled}
      />
    )
  }

  return (
    <Input_Shadcn_
      size={"tiny"}
      value={String(fieldValue)}
      onChange={(event) => onChange({ [field.key]: event.target.value })}
      placeholder={field.placeholder}
      className={inputClassName ? `h-6 ${inputClassName}` : 'h-6'}
      disabled={disabled}
    />
  )
}

const buildFxInlineHint = (
  field: WidgetField,
  value: unknown,
  mode: 'expression' | 'template',
  context: Record<string, unknown>
) => {
  const valueType = getValueTypeLabel(field)
  const description = field.description
  if (!valueType && !description) {
    return null
  }

  const rawValue =
    typeof value === 'string'
      ? value
      : value === null || typeof value === 'undefined'
        ? ''
        : String(value)
  const trimmed = rawValue.trim()
  const allowedTypes = parseValueTypeTokens(valueType)
  const evaluation = evaluateFxInput(rawValue, mode, context)
  const useBooleanVoidDefault =
    !trimmed &&
    !evaluation.error &&
    allowedTypes.includes('boolean') &&
    allowedTypes.includes('undefined')
  const evaluationValue = useBooleanVoidDefault ? false : evaluation.value
  const hasValue = trimmed.length > 0 || useBooleanVoidDefault
  const kind = inferValueKind(evaluationValue)
  const actualTypeLabel = formatValueKindLabel(kind)
  const valuePreview = hasValue ? formatValuePreview(evaluationValue, kind) : undefined

  let status: 'ok' | 'error' | undefined
  let message: string | undefined

  if (evaluation.error) {
    status = 'error'
    message = evaluation.error
  } else if (hasValue && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.includes(kind)
    if (!isAllowed) {
      status = 'error'
      const expected = valueType?.toLowerCase() ?? ''
      const actual = kind === 'undefined' ? 'void' : kind
      message = `The value has to be of type '${expected}', you provided '${actual}'`
    } else {
      status = 'ok'
    }
  } else if (hasValue) {
    status = 'ok'
  }

  return (
    <FxInlineHint
      valueType={valueType}
      description={description}
      status={status}
      message={message}
      valueTypeLabel={status ? actualTypeLabel : undefined}
      valuePreview={status ? valuePreview : undefined}
    />
  )
}

const renderFieldControl = (
  field: WidgetField,
  value: unknown,
  onChange: (patch: Record<string, unknown>) => void,
  editorId: string,
  onFxClick?: (field: WidgetField, value: unknown, editorId: string) => void,
  forceFxMode?: boolean,
  onToggleFxMode?: (field: WidgetField, value: unknown) => void,
  onInlineEditorSize?: (fieldKey: string, metrics: CodeEditorContentSize) => void,
  fxEditorLibs?: string[],
  fxEvalContext?: Record<string, unknown>,
  fxCompletionWords?: string[],
  fxCompletionMetadata?: Record<
    string,
    { kind?: string; detail?: string; documentation?: string; appendDot?: boolean }
  >
) => {
  const supportsFx = fieldAllowsFx(field)
  const isFxEnabled = supportsFx && isFxValue(value)
  const isFxDraftValue =
    supportsFx &&
    typeof value === 'string' &&
    (value.includes('{{') || value.includes('}}'))
  const isFxActive = isFxEnabled || isFxDraftValue || Boolean(forceFxMode)
  const isMultiline = field.type === 'textarea' || field.type === 'json'
  const isInlineCodeEditorField = isTemplateStringField(field)
  const useInlineFx =
    supportsFx && ['text', 'number', 'textarea', 'json', 'select', 'boolean'].includes(field.type)

  const handleFxClick = () => {
    if (!supportsFx) {
      return
    }
    const expression = isFxEnabled ? value : toFxExpression(field, value)
    if (!isFxEnabled) {
      onChange({ [field.key]: expression })
    }
    onFxClick?.(field, expression, editorId)
  }

  const control = renderStaticControl(
    field,
    value,
    onChange,
    isFxActive,
    useInlineFx ? 'pr-8' : undefined
  )
  const inlineControl =
    useInlineFx && field.type === 'boolean' ? (
      <div className="flex justify-end pr-8">{control}</div>
    ) : (
      control
    )

  if (!supportsFx) {
    if (field.type === 'boolean') {
      return <div className="flex justify-end">{control}</div>
    }
    return control
  }

  const hintExpression =
    field.type === 'boolean'
      ? buildFxInlineHint(field, value, 'expression', fxEvalContext ?? FX_BASE_CONTEXT)
      : undefined
  const hintTemplate = isInlineCodeEditorField
    ? buildFxInlineHint(field, value, 'template', fxEvalContext ?? FX_BASE_CONTEXT)
    : undefined

  return (
    <FxInput
      field={field}
      value={value}
      editorId={editorId}
      control={control}
      inlineControl={inlineControl}
      isFxEnabled={isFxEnabled}
      isFxActive={isFxActive}
      isInlineCodeEditorField={isInlineCodeEditorField}
      useInlineFx={useInlineFx}
      isMultiline={isMultiline}
      onChange={onChange}
      onFxClick={handleFxClick}
      onToggleFxMode={onToggleFxMode}
      onInlineEditorSize={onInlineEditorSize}
      fxEditorLibs={fxEditorLibs}
      fxEvalContext={fxEvalContext}
      fxCompletionWords={fxCompletionWords}
      fxCompletionMetadata={fxCompletionMetadata}
      hintExpression={hintExpression}
      hintTemplate={hintTemplate}
    />
  )
}

const SectionListHeader = ({
  title,
  storageKey,
  openKey,
  onOpenChange,
  fields,
  widgetProps,
  onAdd,
}: {
  title: string
  storageKey: string
  openKey: string | null
  onOpenChange: (next: string | null) => void
  fields: WidgetField[]
  widgetProps: Record<string, unknown>
  onAdd: (storageKey: string, key: string) => void
}) => {
  const activeKeys = resolveSectionKeys(fields, widgetProps, storageKey)
  const availableFields = fields.filter((field) => !activeKeys.includes(field.key))

  return (
    <div className="mt-2 flex h-6 items-center justify-between">
      <div className="text-[12px] font-medium text-foreground-muted">{title}</div>
      <Popover_Shadcn_
        open={openKey === storageKey}
        onOpenChange={(nextOpen) => onOpenChange(nextOpen ? storageKey : null)}
      >
        <PopoverTrigger_Shadcn_ asChild>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-[11px] font-medium text-foreground-muted hover:bg-foreground/10 hover:text-foreground"
          >
            <Plus size={12} />
          </button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="w-44 p-1" align="end">
          {availableFields.length === 0 ? (
            <div className="px-2 py-1 text-xs text-foreground-muted">All added</div>
          ) : (
            <div className="space-y-1">
              {availableFields.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-xs text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                  onClick={() => onAdd(storageKey, field.key)}
                >
                  {field.label}
                </button>
              ))}
            </div>
          )}
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

const SectionList = ({
  fields,
  widgetProps,
  storageKey,
  widgetId,
  onFxClick,
  panelKeys,
  onOpenPanel,
  onChange,
  fxModeLookup,
  onToggleFxMode,
  inlineOverflowLookup,
  onInlineEditorSize,
  fxEditorLibs,
  fxEvalContext,
  fxCompletionWords,
  fxCompletionMetadata,
}: {
  fields: WidgetField[]
  widgetProps: Record<string, unknown>
  storageKey: string
  widgetId: string
  onFxClick?: (field: WidgetField, value: unknown, editorId: string) => void
  panelKeys?: string[]
  onOpenPanel?: (key: string, label: string) => void
  onChange: (patch: Record<string, unknown>) => void
  fxModeLookup?: Record<string, boolean>
  onToggleFxMode?: (field: WidgetField, value: unknown) => void
  inlineOverflowLookup?: Record<string, InlineEditorLayout>
  onInlineEditorSize?: (fieldKey: string, metrics: CodeEditorContentSize) => void
  fxEditorLibs?: string[]
  fxEvalContext?: Record<string, unknown>
  fxCompletionWords?: string[]
  fxCompletionMetadata?: Record<
    string,
    { kind?: string; detail?: string; documentation?: string; appendDot?: boolean }
  >
}) => {
  const addonKeys = resolveSectionKeys(fields, widgetProps, storageKey)
  const fieldMap = new Map(fields.map((field) => [field.key, field]))
  const items = addonKeys
    .map((key) => fieldMap.get(key))
    .filter((field): field is WidgetField => Boolean(field))

  const ensureAddonKey = (key: string) => {
    const base = resolveSectionKeys(fields, widgetProps, storageKey)
    return base.includes(key) ? base : [...base, key]
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-foreground-muted/20 bg-surface-100 px-2 py-1.5 text-[12px] text-foreground-muted">
        None
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((field) => (
        panelKeys?.includes(field.key) && onOpenPanel ? (
          <SectionLinkRow
            key={field.key}
            label={field.label}
            onOpen={() => onOpenPanel(field.key, field.label)}
            onRemove={() => {
              const nextAddons = resolveSectionKeys(fields, widgetProps, storageKey).filter(
                (key) => key !== field.key
              )
              onChange({
                [storageKey]: nextAddons,
                [field.key]: getSectionEmptyValue(field),
              })
            }}
          />
        ) : (
            <SectionRow
              key={field.key}
              field={field}
              value={widgetProps[field.key]}
              editorId={`builder-fx-${widgetId}-${field.key}`}
              onFxClick={onFxClick}
              onChange={(patch) => {
                const nextAddons = ensureAddonKey(field.key)
                onChange({ [storageKey]: nextAddons, ...patch })
              }}
              onRemove={() => {
                const nextAddons = resolveSectionKeys(fields, widgetProps, storageKey).filter(
                  (key) => key !== field.key
                )
                onChange({
                  [storageKey]: nextAddons,
                  [field.key]: getSectionEmptyValue(field),
                })
              }}
              fxMode={Boolean(fxModeLookup?.[field.key])}
              onToggleFxMode={onToggleFxMode}
              inlineOverflow={inlineOverflowLookup?.[field.key]?.overflow}
              onInlineEditorSize={onInlineEditorSize}
              fxEditorLibs={fxEditorLibs}
              fxEvalContext={fxEvalContext}
              fxCompletionWords={fxCompletionWords}
              fxCompletionMetadata={fxCompletionMetadata}
            />
        )
      ))}
    </div>
  )
}

const SectionLinkRow = ({
  label,
  onOpen,
  onRemove,
}: {
  label: string
  onOpen: () => void
  onRemove: () => void
}) => {
  return (
    <div className="group rounded-md border border-foreground-muted/20 bg-surface-100 px-2 py-1 text-[12px] leading-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onOpen}
          aria-label={`Open ${label} settings`}
        >
          <div className="flex shrink-0 justify-between text-foreground-muted" style={{ flexBasis: LABEL_BASIS }}>
            <span className="truncate">{label}</span>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end text-foreground-muted">
            <ChevronRight size={12} />
          </div>
        </button>
        <button
          type="button"
          className="invisible text-foreground-muted hover:text-foreground group-hover:visible"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

const SectionRow = ({
  field,
  value,
  onChange,
  onRemove,
  editorId,
  onFxClick,
  fxMode,
  onToggleFxMode,
  inlineOverflow,
  onInlineEditorSize,
  fxEditorLibs,
  fxEvalContext,
  fxCompletionWords,
  fxCompletionMetadata,
}: {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  onRemove: () => void
  editorId: string
  onFxClick?: (field: WidgetField, value: unknown, editorId: string) => void
  fxMode?: boolean
  onToggleFxMode?: (field: WidgetField, value: unknown) => void
  inlineOverflow?: boolean
  onInlineEditorSize?: (fieldKey: string, metrics: CodeEditorContentSize) => void
  fxEditorLibs?: string[]
  fxEvalContext?: Record<string, unknown>
  fxCompletionWords?: string[]
  fxCompletionMetadata?: Record<
    string,
    { kind?: string; detail?: string; documentation?: string; appendDot?: boolean }
  >
}) => {
  const topAligned =
    field.type === 'textarea' ||
    field.type === 'json' ||
    (field.supportsFx && isFxValue(value))
  const stacked = shouldStackField(field, value, fxMode, inlineOverflow)

  if (stacked) {
    return (
      <div className="group space-y-2 rounded-md border border-foreground-muted/20 bg-surface-100 px-2 py-1 text-[12px] leading-4">
        <div className="text-foreground-muted">
          <FieldLabel
            label={field.label}
            valueType={field.valueType}
            description={field.description}
          />
        </div>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {renderFieldControl(
              field,
              value,
              onChange,
              editorId,
              onFxClick,
              fxMode,
              onToggleFxMode,
              onInlineEditorSize,
              fxEditorLibs,
              fxEvalContext,
              fxCompletionWords,
              fxCompletionMetadata
            )}
          </div>
          <button
            type="button"
            className="invisible text-foreground-muted hover:text-foreground group-hover:visible"
            onClick={onRemove}
            aria-label={`Remove ${field.label}`}
          >
            <X size={12} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-md border border-foreground-muted/20 bg-surface-100 px-2 py-1 text-[12px] leading-4">
      <div className={`flex gap-2 ${topAligned ? 'items-start' : 'items-center'}`}>
        <div
          className={`flex shrink-0 justify-between text-foreground-muted ${
            topAligned ? 'mt-1' : ''
          }`}
          style={{ flexBasis: LABEL_BASIS }}
        >
          <FieldLabel
            label={field.label}
            valueType={field.valueType}
            description={field.description}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            {renderFieldControl(
              field,
              value,
              onChange,
              editorId,
              onFxClick,
              fxMode,
              onToggleFxMode,
              onInlineEditorSize,
              fxEditorLibs,
              fxEvalContext,
              fxCompletionWords,
              fxCompletionMetadata
            )}
          </div>
          <button
            type="button"
            className="invisible text-foreground-muted hover:text-foreground group-hover:visible"
            onClick={onRemove}
            aria-label={`Remove ${field.label}`}
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

const InspectorRow = ({
  label,
  topAligned = false,
  stacked = false,
  children,
}: {
  label: ReactNode
  topAligned?: boolean
  stacked?: boolean
  children: ReactNode
}) => {
  return (
    <div className={`text-[12px] leading-4 ${stacked ? 'space-y-1' : ''}`}>
      <div
        className={`flex gap-2 ${
          stacked ? 'flex-col' : topAligned ? 'items-start' : 'items-center'
        }`}
      >
        <div
          className={`flex shrink-0 justify-between text-foreground-muted ${
            !stacked && topAligned ? 'mt-1' : ''
          }`}
          style={stacked ? undefined : { flexBasis: LABEL_BASIS }}
        >
          {label}
        </div>
        <div className={`min-w-0 ${stacked ? 'w-full' : 'flex-1'}`}>{children}</div>
      </div>
    </div>
  )
}

const FieldRow = ({
  field,
  value,
  onChange,
  editorId,
  onFxClick,
  fxMode,
  onToggleFxMode,
  inlineOverflow,
  onInlineEditorSize,
  fxEditorLibs,
  fxEvalContext,
  fxCompletionWords,
  fxCompletionMetadata,
}: {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  editorId: string
  onFxClick?: (field: WidgetField, value: unknown, editorId: string) => void
  fxMode?: boolean
  onToggleFxMode?: (field: WidgetField, value: unknown) => void
  inlineOverflow?: boolean
  onInlineEditorSize?: (fieldKey: string, metrics: CodeEditorContentSize) => void
  fxEditorLibs?: string[]
  fxEvalContext?: Record<string, unknown>
  fxCompletionWords?: string[]
  fxCompletionMetadata?: Record<
    string,
    { kind?: string; detail?: string; documentation?: string; appendDot?: boolean }
  >
}) => {
  const topAligned =
    field.type === 'textarea' ||
    field.type === 'json' ||
    (field.supportsFx && isFxValue(value))
  const stacked = shouldStackField(field, value, fxMode, inlineOverflow)

  return (
    <InspectorRow
      label={
        <FieldLabel
          label={field.label}
          valueType={field.valueType}
          description={field.description}
        />
      }
      topAligned={topAligned}
      stacked={stacked}
    >
      {renderFieldControl(
        field,
        value,
        onChange,
        editorId,
        onFxClick,
        fxMode,
        onToggleFxMode,
        onInlineEditorSize,
        fxEditorLibs,
        fxEvalContext,
        fxCompletionWords,
        fxCompletionMetadata
      )}
    </InspectorRow>
  )
}
