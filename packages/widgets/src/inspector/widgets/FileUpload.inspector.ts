import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'accept', 'multiple', 'helperText', 'disabled', 'events']

export const FileUploadInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Upload files',
  },
  accept: {
    placeholder: '.png,.jpg',
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    placeholder: '[{"event":"change","type":"query","queryName":"onUpload"}]',
  },
})
