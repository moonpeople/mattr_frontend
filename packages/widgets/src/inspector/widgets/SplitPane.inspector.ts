import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'title',
  'orientation',
  'firstPaneSize',
  'minPaneSize',
  'maxPaneSize',
  'resizable',
  'showHandle',
  'padding',
  'bordered',
  'background',
  'events',
]

export const SplitPaneInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Split pane',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onSplitChange"}]',
  },
})
