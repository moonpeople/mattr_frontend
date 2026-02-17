import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'value',
  'items',
  'size',
  'searchable',
  'searchPlaceholder',
  'emptyMessage',
  'helperText',
  'disabled',
  'events',
]

export const ListboxInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
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
    placeholder: '[{"label":"Option 1","value":"option_1"}]',
  },
  size: {
    section: 'Appearance',
    min: 2,
    max: 30,
    step: 1,
  },
  searchable: {
    section: 'Content',
  },
  searchPlaceholder: {
    section: 'Content',
    placeholder: 'Search items...',
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
