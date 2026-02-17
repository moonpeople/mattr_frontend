/**
 * Публичный вход autosave-модуля: реэкспорт hooks, моделей и вспомогательных типов.
 */
export { stableStringify, findFirstSchemaDiff } from './autosave-model'
export { useBuilderDraftAutosave } from './useBuilderDraftAutosave'
export {
  useBuilderPreviewPublishActions,
  type BuilderPreviewRoutePayload,
} from './useBuilderPreviewPublishActions'
