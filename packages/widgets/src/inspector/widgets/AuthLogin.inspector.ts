import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'authType']

export const AuthLoginInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    label: 'Title',
    placeholder: 'Sign in',
  },
  authType: {
    placeholder: 'password',
  },
})
