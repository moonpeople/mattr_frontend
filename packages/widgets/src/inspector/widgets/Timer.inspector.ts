import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['elapsedMs', 'isRunning', 'interval', 'helperText']

export const TimerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  elapsedMs: {
    min: 0,
    step: 100,
  },
  interval: {
    min: 100,
    step: 100,
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
})
