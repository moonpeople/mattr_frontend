import { useEffect, useState } from 'react'

import type { WidgetDefinition } from '../types'

const formatDuration = (totalMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0'))
  return parts.join(':')
}

type TimerProps = {
  elapsedMs: number
  isRunning: boolean
  interval: number
  helperText: string
}

const TimerView = ({
  elapsedMs,
  isRunning,
  intervalMs,
}: {
  elapsedMs: number
  isRunning: boolean
  intervalMs: number
}) => {
  const [elapsed, setElapsed] = useState(elapsedMs)

  useEffect(() => {
    setElapsed(elapsedMs)
  }, [elapsedMs])

  useEffect(() => {
    if (!isRunning) {
      return undefined
    }
    const tick = Math.max(100, intervalMs)
    const id = window.setInterval(() => {
      setElapsed((prev) => prev + tick)
    }, tick)
    return () => window.clearInterval(id)
  }, [isRunning, intervalMs])

  return (
    <div className="rounded border border-foreground-muted/40 bg-surface-100 px-3 py-2 text-center font-mono text-lg">
      {formatDuration(elapsed)}
    </div>
  )
}

export const TimerWidget: WidgetDefinition<TimerProps> = {
  type: 'Timer',
  label: 'Timer',
  category: 'presentation',
  description: 'Elapsed time indicator',
  defaultProps: {
    elapsedMs: 0,
    isRunning: false,
    interval: 1000,
    helperText: '',
  },
  fields: [
    { key: 'elapsedMs', label: 'Elapsed (ms)', type: 'number', min: 0, step: 100 },
    { key: 'isRunning', label: 'Running', type: 'boolean' },
    { key: 'interval', label: 'Tick interval (ms)', type: 'number', min: 100, step: 100 },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
  ],
  render: (props, context) => {
    const elapsedRaw = context?.state?.elapsedMs ?? props.elapsedMs
    const elapsed = typeof elapsedRaw === 'number' ? elapsedRaw : Number(elapsedRaw) || 0

    return (
      <div className="space-y-2">
        <TimerView elapsedMs={elapsed} isRunning={props.isRunning} intervalMs={props.interval} />
        <div className="text-xs text-foreground-muted">{props.isRunning ? 'Running' : 'Paused'}</div>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
