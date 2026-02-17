import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'title',
  'optionsMode',
  'steps',
  'optionsData',
  'optionLabelKey',
  'optionValueKey',
  'optionDescriptionKey',
  'currentStep',
  'showNumbers',
  'padding',
  'bordered',
  'background',
  'events',
]

export const SteppedContainerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Stepped container',
  },
  steps: {
    placeholder: '[{"label":"Step 1","content":"Step 1 content"}]',
    dependsOn: { key: 'optionsMode', value: 'static' },
  },
  optionsData: {
    dependsOn: { key: 'optionsMode', value: 'dynamic' },
    placeholder: '{{ query.data }}',
  },
  optionLabelKey: {
    dependsOn: { key: 'optionsMode', value: 'dynamic' },
    placeholder: 'label',
  },
  optionValueKey: {
    dependsOn: { key: 'optionsMode', value: 'dynamic' },
    placeholder: 'value',
  },
  optionDescriptionKey: {
    dependsOn: { key: 'optionsMode', value: 'dynamic' },
    placeholder: 'description',
  },
  currentStep: {
    placeholder: 'Step 1',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onStepChange"}]',
  },
})
