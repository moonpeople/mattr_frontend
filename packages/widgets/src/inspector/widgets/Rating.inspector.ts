import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'value',
  'max',
  'allowHalf',
  'label',
  'labelPosition',
  'tooltipText',
  'ratingSize',
  'ratingIcon',
  'iconSize',
  'required',
  'readOnly',
  'disabled',
  'events',
  'maintainSpaceWhenHidden',
  'alwaysShowInEditMode',
  'showOnDesktop',
  'showOnMobile',
]

export const RatingInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    type: 'number',
    section: 'Content',
    min: 0,
    step: 0.5,
    valueType: ['number', 'void'],
  },
  max: {
    type: 'number',
    section: 'Content',
    min: 1,
    step: 1,
    valueType: ['number', 'void'],
  },
  label: {
    section: 'Add-ons',
    placeholder: 'Label',
  },
  tooltipText: {
    section: 'Add-ons',
    placeholder: 'Tooltip',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onRate"}]',
  },
})
