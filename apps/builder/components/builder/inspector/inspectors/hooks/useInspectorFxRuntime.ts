/**
 * Hook FX-runtime для inspector: вычисляет/подготавливает значения FX-полей и контекст.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { WidgetDefinition, WidgetField } from 'widgets/runtime'
import type {
  ColorTokenOption,
  TypographyTokenOption,
} from 'state/app-theme-state'

import type {
  BuilderWidgetInstance,
  BuilderWidgetSpacing,
} from '../../../types'
import {
  FX_BASE_CONTEXT,
  buildCompletionMetadata,
  buildFxEditorLibs,
} from '../../../components'
import { buildSelfContext } from '../../../self-context'
import {
  buildFxInlineHint,
  coerceFxToStatic,
  fieldAllowsFx,
  isFxValue,
  isTemplateValueField,
  isValidIdentifier,
  toFxExpression,
  type InlineEditorLayout,
} from '../../model'
import type { InspectorControlRuntime, FxCompletionMetadata } from '../controls'
import type { CodeEditorContentSize } from 'components/ui/CodeEditor/CodeEditor'

type FxEventTarget = { id: string; label: string; type?: string }
type FxNamedEntity = { id: string; label: string }

export type InspectorFxContextInfo = {
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

type UseInspectorFxRuntimeArgs = {
  widget: BuilderWidgetInstance
  definition: WidgetDefinition
  spacing: Required<BuilderWidgetSpacing>
  eventTargets: FxEventTarget[]
  eventQueries: FxNamedEntity[]
  eventScripts: FxNamedEntity[]
  eventPages: FxNamedEntity[]
  eventVariables: FxNamedEntity[]
  fxContextInfo?: InspectorFxContextInfo
  colorTokenOptions: ColorTokenOption[]
  typographyTokenOptions: TypographyTokenOption[]
  handleFieldChange: (field: WidgetField, patch: Record<string, unknown>) => void
}

type FxEditorState = {
  field: WidgetField
  editorId: string
  value: string
  onChange?: (value: string) => void
} | null

type UseInspectorFxRuntimeResult = {
  fxStickyFields: Record<string, boolean>
  setFxStickyFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  inlineEditorLayout: Record<string, InlineEditorLayout>
  fxEditor: FxEditorState
  closeFxEditor: () => void
  handleFxValueChange: (nextValue?: string) => void
  fxEditorHint: ReturnType<typeof buildFxInlineHint>
  inspectorControlRuntime: InspectorControlRuntime
  fxEditorLibs: string[]
  fxEvalContext: Record<string, unknown>
  fxCompletionWords: string[]
  fxCompletionMetadata: FxCompletionMetadata
}

export const useInspectorFxRuntime = ({
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
}: UseInspectorFxRuntimeArgs): UseInspectorFxRuntimeResult => {
  const [fxStickyFields, setFxStickyFields] = useState<Record<string, boolean>>({})
  const [inlineEditorLayout, setInlineEditorLayout] = useState<
    Record<string, InlineEditorLayout>
  >({})
  const [fxEditor, setFxEditor] = useState<FxEditorState>(null)

  useEffect(() => {
    setFxStickyFields({})
  }, [widget.id])

  useEffect(() => {
    setInlineEditorLayout({})
  }, [widget.id])

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
    fxContextInfo?.currentUser,
    fxContextInfo?.localStorage,
    fxContextInfo?.location,
    fxContextInfo?.pages,
    fxContextInfo?.queryResults,
    fxContextInfo?.runningQueries,
    fxContextInfo?.theme,
    fxContextInfo?.viewport,
    fxContextInfo?.widgetValues,
    queryNames,
    scriptNames,
    spacing,
    stateKeys,
    widget,
    widgetIds,
  ])
  const fxCompletionMetadata = useMemo(
    () => buildCompletionMetadata(fxEvalContext),
    [fxEvalContext]
  )
  const fxCompletionWords = useMemo(
    () => Object.keys(fxCompletionMetadata).sort(),
    [fxCompletionMetadata]
  )

  const openFxEditor = useCallback(
    (
      field: WidgetField,
      rawValue: unknown,
      editorId: string,
      onChange?: (value: string) => void
    ) => {
      const isEnabled = isFxValue(rawValue)
      const allowTemplate = isTemplateValueField(field)
      const expression = allowTemplate
        ? String(rawValue ?? '')
        : isEnabled
          ? String(rawValue ?? '')
          : toFxExpression(field, rawValue)
      const updateValue =
        onChange ?? ((nextValue: string) => handleFieldChange(field, { [field.key]: nextValue }))
      if (!allowTemplate && !isEnabled) {
        updateValue(expression)
      }
      setFxStickyFields((prev) => ({ ...prev, [field.key]: true }))
      setFxEditor({ field, editorId, value: expression, onChange })
    },
    [handleFieldChange]
  )

  const handleFxValueChange = useCallback(
    (nextValue?: string) => {
      setFxEditor((prev) => {
        if (!prev) {
          return prev
        }
        const value = nextValue ?? ''
        const applyValue =
          prev.onChange ??
          ((next: string) => handleFieldChange(prev.field, { [prev.field.key]: next }))
        applyValue(value)
        if (value.includes('{{') || value.includes('}}')) {
          setFxStickyFields((fields) => ({ ...fields, [prev.field.key]: true }))
        }
        return { ...prev, value }
      })
    },
    [handleFieldChange]
  )

  const toggleFxMode = useCallback(
    (field: WidgetField, value: unknown) => {
      if (!fieldAllowsFx(field)) {
        return
      }
      const isActive = Boolean(fxStickyFields[field.key]) || isFxValue(value)
      if (isActive) {
        handleFieldChange(field, { [field.key]: coerceFxToStatic(field, value) })
        setFxStickyFields((fields) => ({ ...fields, [field.key]: false }))
        return
      }
      const expression = isTemplateValueField(field)
        ? String(value ?? '')
        : toFxExpression(field, value)
      handleFieldChange(field, { [field.key]: expression })
      setFxStickyFields((fields) => ({ ...fields, [field.key]: true }))
    },
    [fxStickyFields, handleFieldChange]
  )

  const handleInlineEditorSize = useCallback(
    (fieldKey: string, metrics: CodeEditorContentSize) => {
      if (!metrics.contentWidth) {
        return
      }

      setInlineEditorLayout((prev) => {
        const prevEntry = prev[fieldKey]
        const baselineWidth = prevEntry?.overflow
          ? prevEntry.baselineWidth
          : metrics.contentWidth
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
    },
    []
  )

  const closeFxEditor = useCallback(() => setFxEditor(null), [])

  const fxEditorHint = useMemo(
    () =>
      fxEditor?.field
        ? buildFxInlineHint(
            fxEditor.field,
            fxEditor.value,
            isTemplateValueField(fxEditor.field) ? 'template' : 'expression',
            fxEvalContext ?? FX_BASE_CONTEXT
          )
        : null,
    [fxEditor, fxEvalContext]
  )

  const inspectorControlRuntime: InspectorControlRuntime = useMemo(
    () => ({
      onFxClick: openFxEditor,
      onToggleFxMode: toggleFxMode,
      onInlineEditorSize: handleInlineEditorSize,
      fxEditorLibs,
      fxEvalContext,
      fxCompletionWords,
      fxCompletionMetadata,
      colorTokenOptions,
      typographyTokenOptions,
    }),
    [
      colorTokenOptions,
      fxCompletionMetadata,
      fxCompletionWords,
      fxEditorLibs,
      fxEvalContext,
      handleInlineEditorSize,
      openFxEditor,
      toggleFxMode,
      typographyTokenOptions,
    ]
  )

  return {
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
  }
}
