import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['tabs', 'defaultTab']

export const TabsInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys)
