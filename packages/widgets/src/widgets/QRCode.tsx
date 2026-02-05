import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type QRCodeProps = {
  value: string
  size: number
  helperText: string
}

export const QRCodeWidget: WidgetDefinition<QRCodeProps> = {
  type: 'QRCode',
  label: 'QR Code',
  category: 'presentation',
  description: 'Display a QR code',
  defaultProps: {
    value: 'https://retool.com',
    size: 180,
    helperText: '',
  },
  fields: [
    { key: 'value', label: 'Value', type: 'text', placeholder: 'https://example.com' },
    { key: 'size', label: 'Size', type: 'number', min: 80, max: 512, step: 8 },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
  ],
  render: (props) => {
    const value = normalizeString(props.value, '')
    const size = Math.max(80, props.size)
    const src = value
      ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
      : ''

    return (
      <div className="space-y-2">
        <div className="flex justify-center">
          {src ? (
            <img
              src={src}
              alt={value}
              width={size}
              height={size}
              className="rounded border border-foreground-muted/40"
            />
          ) : (
            <div
              className="flex items-center justify-center rounded border border-dashed border-foreground-muted/50 bg-surface-100 text-xs text-foreground-muted"
              style={{ width: size, height: size }}
            >
              {value ? 'QR preview unavailable' : 'No QR value'}
            </div>
          )}
        </div>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
