import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'start',
  'end',
  'min',
  'max',
  'step',
  'orientation',
  'showTooltip',
  'tooltipFormat',
  'tooltipDecimals',
  'trackSize',
  'thumbVariant',
  'minLabel',
  'maxLabel',
  'showTicks',
  'tickCount',
  'tickLabelEvery',
  'helperText',
  'disabled',
  'events',
]

export const RangeSliderInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  start: {
    type: 'number',
    section: 'Content',
    min: 0,
    step: 1,
  },
  end: {
    type: 'number',
    section: 'Content',
    min: 0,
    step: 1,
  },
  min: {
    type: 'number',
    section: 'Content',
    min: 0,
    step: 1,
  },
  max: {
    type: 'number',
    section: 'Content',
    min: 1,
    step: 1,
  },
  step: {
    type: 'number',
    section: 'Content',
    min: 1,
    step: 1,
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onRangeChange"}]',
  },
})
