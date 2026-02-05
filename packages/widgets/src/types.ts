import type { ReactNode } from 'react'

export type WidgetCategory =
  | 'buttons'
  | 'charts'
  | 'containers'
  | 'data'
  | 'inputs'
  | 'presentation'
  | 'navigation'
  | 'globals'
  | 'custom'

export type WidgetFieldOption = {
  label: string
  value: string
}

type WidgetFieldDependencyValue = string | number | boolean | Array<string | number | boolean>

export type WidgetFieldDependency = {
  key: string
  value: WidgetFieldDependencyValue
}

type WidgetFieldBase = {
  key: string
  label: string
  section?: string
  dependsOn?: WidgetFieldDependency
  advanced?: boolean
  supportsFx?: boolean
  valueType?: string
  description?: string
}

export type WidgetField =
  | (WidgetFieldBase & {
      type: 'text'
      placeholder?: string
    })
  | (WidgetFieldBase & {
      type: 'textarea'
      placeholder?: string
    })
  | (WidgetFieldBase & {
      type: 'json'
      placeholder?: string
    })
  | (WidgetFieldBase & {
      type: 'color'
      placeholder?: string
    })
  | (WidgetFieldBase & {
      type: 'select'
      options: WidgetFieldOption[]
    })
  | (WidgetFieldBase & {
      type: 'number'
      min?: number
      max?: number
      step?: number
      placeholder?: string
    })
  | (WidgetFieldBase & {
      type: 'boolean'
    })

export type WidgetRenderContext = {
  mode: 'canvas' | 'preview'
  widgetId: string
  state?: Record<string, unknown>
  evaluationContext?: Record<string, unknown>
  setState?: (patch: Record<string, unknown>) => void
  runActions?: (event: string, payload?: Record<string, unknown>) => void
  openInspectorPanel?: (panel: { key: string; label: string }) => void
  children?: ReactNode
}

export type WidgetDefinition<Props extends Record<string, unknown> = Record<string, unknown>> = {
  type: string
  label: string
  category: WidgetCategory
  description?: string
  defaultProps: Props
  fields?: WidgetField[]
  supportsChildren?: boolean
  builder?: {
    resizeHandles?: string[]
    eventOptions?: WidgetFieldOption[]
  }
  render: (props: Props, context?: WidgetRenderContext) => ReactNode
}

export type WidgetInspectorConfig = {
  fields?: WidgetField[]
  fieldKeys?: string[]
  fieldOverrides?: Record<string, Partial<WidgetField>>
}

export type WidgetInstance = {
  id: string
  type: string
  props: Record<string, unknown>
  children?: WidgetInstance[]
}
