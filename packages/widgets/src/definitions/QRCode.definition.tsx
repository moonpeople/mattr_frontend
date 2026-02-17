import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type QRCodeProps = {
  value: string
  size: number
  helperText: string
}

export const QRCodeDefinition = createWidgetDefinition<QRCodeProps>({
  type: 'QRCode',
  label: 'QR Code',
  category: 'presentation',
  description: 'Display a QR code',
  defaultProps: {
    value: 'https://retool.com',
    size: 180,
    helperText: '',
  },
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
              className="rounded border border-border/40"
            />
          ) : (
            <div
              className="flex items-center justify-center rounded border border-dashed border-border/50 bg-card text-xs text-muted-foreground"
              style={{ width: size, height: size }}
            >
              {value ? 'QR preview unavailable' : 'No QR value'}
            </div>
          )}
        </div>
        {props.helperText && <div className="text-xs text-muted-foreground">{props.helperText}</div>}
      </div>
    )
  },
})
