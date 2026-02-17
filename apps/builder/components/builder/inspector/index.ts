/**
 * Публичный вход подсистемы inspector: реэкспорт инспекторов, фич и общих компонентов.
 */
export {
  BuilderInspector,
  BuilderFrameInspector,
  BuilderOverlayInspector,
  BuilderPageComponentInspector,
  BuilderAppInspector,
  BuilderPageInspector,
} from './inspectors'
export { BuilderEventHandlers } from './features/events'
export {
  buildTableColumnPanelKey,
  isTableColumnPanelKey,
  parseTableColumnPanelIndex,
} from './model'
export type { InspectorFieldGroup, InspectorListSection } from './model'
