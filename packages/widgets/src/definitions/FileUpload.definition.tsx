import { Input } from 'ui'

import { createWidgetDefinition } from '../types'

export type FileUploadProps = {
  label: string
  accept: string
  multiple: boolean
  helperText: string
  disabled: boolean
  events: string
}

export const FileUploadDefinition = createWidgetDefinition<FileUploadProps>({
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
  render: (props, context) => (
    <div className="space-y-1">
      {props.label && <label className="text-xs font-medium text-foreground">{props.label}</label>}
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
      {props.helperText && <div className="text-xs text-muted-foreground">{props.helperText}</div>}
    </div>
  ),
})
