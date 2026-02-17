import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['steps', 'currentStep']

export const WizardInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  steps: {
    placeholder: '["Step 1","Step 2"]',
  },
  currentStep: {
    placeholder: 'Step 1',
  },
})
