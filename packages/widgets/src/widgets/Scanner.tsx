import { Button } from 'ui'

import type { WidgetDefinition } from '../types'

type ScannerProps = {
  paused: boolean
  singleScan: boolean
  timeBetweenScans: number
}

export const ScannerWidget: WidgetDefinition<ScannerProps> = {
  type: 'Scanner',
  label: 'Scanner',
  category: 'inputs',
  description: 'Barcode/QR scanner placeholder',
  defaultProps: {
    paused: false,
    singleScan: false,
    timeBetweenScans: 800,
  },
  fields: [
    { key: 'paused', label: 'Paused', type: 'boolean' },
    { key: 'singleScan', label: 'Single scan', type: 'boolean' },
    { key: 'timeBetweenScans', label: 'Time between scans (ms)', type: 'number', min: 100, step: 100 },
  ],
  render: (props, context) => {
    const paused = Boolean(context?.state?.paused ?? props.paused)
    const scans = Array.isArray(context?.state?.scans) ? (context?.state?.scans as string[]) : []
    const toggle = () => {
      const next = !paused
      context?.setState?.({ paused: next })
      context?.runActions?.('change', { paused: next })
    }
    const simulateScan = () => {
      const code = `SCAN-${Date.now()}`
      const nextScans = props.singleScan ? [code] : [code, ...scans].slice(0, 5)
      context?.setState?.({ scans: nextScans })
      context?.runActions?.('scan', { code })
    }

    return (
      <div className="space-y-2">
        <div className="rounded border border-dashed border-foreground-muted/50 bg-surface-100 px-3 py-6 text-center text-xs text-foreground-muted">
          {paused ? 'Scanner paused' : 'Scanner preview'}
        </div>
        <div className="text-xs text-foreground-muted">
          {props.singleScan ? 'Single scan' : 'Continuous scan'} · {props.timeBetweenScans}ms
        </div>
        <div className="flex items-center gap-2">
          <Button type="secondary" size="small" htmlType="button" onClick={toggle}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button type="primary" size="small" htmlType="button" onClick={simulateScan} disabled={paused}>
            Simulate scan
          </Button>
        </div>
        {scans.length > 0 && (
          <div className="space-y-1 text-xs text-foreground-muted">
            {scans.map((scan) => (
              <div key={scan}>{scan}</div>
            ))}
          </div>
        )}
      </div>
    )
  },
}
