import { Input } from 'ui'

import type { WidgetDefinition } from '../types'

type FileUploadProps = {
  label: string
  accept: string
  multiple: boolean
  helperText: string
  disabled: boolean
  events: string
}

export const FileUploadWidget: WidgetDefinition<FileUploadProps> = {
  type: 'FileUpload',
  label: 'File Upload',
  category: 'inputs',
  description: 'Upload one or more files',
  defaultProps: {
    label: 'Upload files',
    accept: '',
    multiple: false,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'accept', label: 'Accept', type: 'text', placeholder: '.png,.jpg' },
    { key: 'multiple', label: 'Allow multiple', type: 'boolean' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onUpload\"}]',
    },
  ],
  render: (props, context) => (
    <div className="space-y-1">
      {props.label && (
        <label className="text-xs font-medium text-foreground">{props.label}</label>
      )}
      <Input
        type="file"
        accept={props.accept}
        multiple={props.multiple}
        disabled={props.disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          context?.setState?.({ files })
          context?.runActions?.('change', { files })
        }}
      />
      {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
    </div>
  ),
}
