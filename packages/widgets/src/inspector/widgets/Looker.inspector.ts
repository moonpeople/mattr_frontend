import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['embedUrl']

export const LookerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys)
