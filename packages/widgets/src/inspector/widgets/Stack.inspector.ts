import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'subtitle', 'orientation', 'align', 'gap', 'padding', 'bordered', 'background']

export const StackInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Optional title',
  },
  subtitle: {
    placeholder: 'Optional subtitle',
  },
  gap: {
    section: 'Appearance',
  },
})

