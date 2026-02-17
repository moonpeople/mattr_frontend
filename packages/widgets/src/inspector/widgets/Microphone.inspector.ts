import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'stopLabel', 'recording', 'disabled']

export const MicrophoneInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    label: 'Start label',
    placeholder: 'Record',
  },
  stopLabel: {
    placeholder: 'Stop',
  },
})
