import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'subtitle', 'padding', 'bordered', 'background']

export const ContainerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys)
