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
  'showSelectAll',
  'maxSelections',
  'emptyMessage',
  'helperText',
  'disabled',
  'events',
]

export const MultiSelectListboxInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: {
    section: 'Content',
  },
  value: {
    label: 'Value (JSON)',
    placeholder: '["option_1","option_2"]',
    valueType: ['array', 'string', 'void'],
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
  showSelectAll: {
    section: 'Content',
  },
  maxSelections: {
    section: 'Content',
    min: 1,
    max: 500,
    step: 1,
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
