import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['html', 'css']

export const HtmlInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys)
