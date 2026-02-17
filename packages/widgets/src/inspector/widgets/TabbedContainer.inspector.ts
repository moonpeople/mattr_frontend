import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'title',
  'optionsMode',
  'tabs',
  'optionsData',
  'optionLabelKey',
  'optionValueKey',
  'optionDescriptionKey',
  'defaultTab',
  'padding',
  'bordered',
  'background',
  'events',
]

export const TabbedContainerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Tabbed container',
  },
  tabs: {
    placeholder: '[{"label":"Tab 1","content":"Tab 1 content"}]',
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
  defaultTab: {
    placeholder: 'Tab 1',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onTabChange"}]',
  },
})
