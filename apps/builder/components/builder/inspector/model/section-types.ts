/**
 * Типы секций inspector: общие интерфейсы для блоков, групп и элементов секций.
 */
import type { WidgetField } from 'widgets/runtime'

export type InlineEditorLayout = {
  baselineWidth: number
  overflow: boolean
}

export type InspectorListSection = {
  title: string
  storageKey: string
  buttonPosition?: 'left' | 'right'
  fields: WidgetField[]
  panelKeys?: string[]
}

export type InspectorFieldGroup = {
  section?: string
  fields: WidgetField[]
  advancedFields: WidgetField[]
  listSections: InspectorListSection[]
}
