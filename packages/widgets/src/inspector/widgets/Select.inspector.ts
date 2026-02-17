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
  'showClear',
  'emptyMessage',
  'helperText',
  'disabled',
  'events',
]

export const SelectInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: {
    section: 'Content',
  },
  placeholder: {
    section: 'Content',
    placeholder: 'Select option',
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
  searchable: {
    section: 'Content',
  },
  searchPlaceholder: {
    section: 'Content',
    placeholder: 'Search items...',
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
