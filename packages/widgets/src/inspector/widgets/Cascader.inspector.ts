import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'placeholder',
  'value',
  'items',
  'searchable',
  'searchPlaceholder',
  'showPath',
  'pathSeparator',
  'showClear',
  'emptyMessage',
  'helperText',
  'disabled',
  'events',
]

export const CascaderInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  labelVariant: {
    section: 'Content',
  },
  value: {
    section: 'Content',
    placeholder: 'Selected value',
    valueType: ['string', 'void'],
  },
  items: {
    label: 'Items',
    control: 'collectionItems',
    placeholder: '[{"label":"Parent","children":[{"label":"Child","value":"child"}]}]',
  },
  searchable: {
    section: 'Content',
  },
  searchPlaceholder: {
    section: 'Content',
    placeholder: 'Search items...',
  },
  showPath: {
    section: 'Appearance',
  },
  pathSeparator: {
    section: 'Appearance',
    placeholder: ' / ',
  },
  showClear: {
    section: 'Appearance',
  },
  emptyMessage: {
    section: 'Appearance',
    placeholder: 'No items found',
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onSelect"}]',
  },
})
