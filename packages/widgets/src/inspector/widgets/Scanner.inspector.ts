import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['paused', 'singleScan', 'timeBetweenScans']

export const ScannerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  timeBetweenScans: {
    min: 100,
    step: 100,
  },
})
