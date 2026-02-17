/**
 * Публичный вход model-слоя inspector: реэкспорт схем, типов и panel-конфигураций.
 */
export {
  buildTableColumnPanelKey,
  isTableColumnPanelKey,
  parseTableColumnPanelIndex,
} from './panel-keys'
export { COLLAPSIBLE_SECTIONS, resolveListSectionConfig } from './section-config'
export { buildInspectorSectionsSchema } from './sections-schema'
export type { InspectorPanel } from './panel-types'
export {
  buildFxInlineHint,
  coerceFxToStatic,
  fieldAllowsFx,
  isFxValue,
  isTemplateValueField,
  isValidIdentifier,
  toFxExpression,
} from './fx'
export { resolveStyleFallback } from './style-fallback'
export type { StyleFieldFallback } from './style-fallback'
export type {
  InlineEditorLayout,
  InspectorFieldGroup,
  InspectorListSection,
} from './section-types'
export type {
  InspectorEventHandlersRowSchema,
  InspectorEventHandlersWithFieldRowSchema,
  InspectorFieldRowSchema,
  InspectorHiddenRowSchema,
  InspectorInlineRowSchema,
  InspectorSectionRowSchema,
  InspectorSectionSchema,
} from './sections-schema'
