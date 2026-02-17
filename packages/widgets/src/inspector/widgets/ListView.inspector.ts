import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['items', 'titleKey', 'descriptionKey', 'showDividers']

export const ListViewInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  items: {
    placeholder: '[{"title":"Acme","description":"Active"}]',
  },
  titleKey: {
    placeholder: 'title',
  },
  descriptionKey: {
    placeholder: 'description',
  },
})
