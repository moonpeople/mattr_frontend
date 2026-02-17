import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['items', 'activeIndex', 'disabled', 'events']

export const BreadcrumbsInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  items: {
    placeholder: '[{"label":"Home","href":"/"}]',
  },
  activeIndex: {
    min: -1,
    step: 1,
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onCrumb"}]',
  },
})
