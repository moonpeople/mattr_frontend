import { Button } from 'ui'

import type { WidgetDefinition } from '../types'

type MicrophoneProps = {
  label: string
  stopLabel: string
  recording: boolean
  disabled: boolean
}

export const MicrophoneWidget: WidgetDefinition<MicrophoneProps> = {
  type: 'Microphone',
  label: 'Microphone',
  category: 'inputs',
  description: 'Record audio input',
  defaultProps: {
    label: 'Record',
    stopLabel: 'Stop',
    recording: false,
    disabled: false,
  },
  fields: [
    { key: 'label', label: 'Start label', type: 'text', placeholder: 'Record' },
    { key: 'stopLabel', label: 'Stop label', type: 'text', placeholder: 'Stop' },
    { key: 'recording', label: 'Recording', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  render: (props, context) => {
    const isRecording = Boolean(context?.state?.recording ?? props.recording)
    const audioUrl = context?.state?.audioUrl as string | undefined
    const toggle = () => {
      const next = !isRecording
      context?.setState?.({ recording: next })
      context?.runActions?.('change', { recording: next })
    }

    return (
      <div className="space-y-2">
        <Button
          type={isRecording ? 'secondary' : 'primary'}
          size="small"
          htmlType="button"
          disabled={props.disabled}
          onClick={toggle}
        >
          {isRecording ? props.stopLabel : props.label}
        </Button>
        <div className="text-xs text-foreground-muted">
          {isRecording ? 'Recording in progress…' : 'Ready to record'}
        </div>
        {audioUrl && !isRecording && (
          <audio controls src={audioUrl} className="w-full" />
        )}
      </div>
    )
  },
}
