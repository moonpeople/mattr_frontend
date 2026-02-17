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
  'showSelectAll',
  'maxSelections',
  'maxVisibleTags',
  'showClear',
  'emptyMessage',
  'helperText',
  'disabled',
  'events',
]

export const MultiSelectInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: {
    section: 'Content',
  },
  placeholder: {
    section: 'Content',
    placeholder: 'Select options',
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
  maxVisibleTags: {
    section: 'Appearance',
    min: 1,
    max: 20,
    step: 1,
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
