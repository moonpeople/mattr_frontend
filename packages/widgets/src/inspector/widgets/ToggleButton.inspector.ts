import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['labelOn', 'labelOff', 'value', 'disabled', 'events']

export const ToggleButtonInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  labelOn: {
    placeholder: 'Hide',
  },
  labelOff: {
    placeholder: 'Show',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onToggle"}]',
  },
})
