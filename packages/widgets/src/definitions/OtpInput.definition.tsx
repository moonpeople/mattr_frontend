import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type OtpInputProps = {
  label: string
  value: string
  length: number
  groupSize: number
  helperText: string
  disabled: boolean
  events: string
}

export const OtpInputDefinition = createWidgetDefinition<OtpInputProps>({
  type: 'OtpInput',
  label: 'OTP Input',
  category: 'inputs',
  description: 'One-time passcode input',
  defaultProps: {
    label: 'Label',
    value: '',
    length: 6,
    groupSize: 0,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  render: (props, context) => {
    const length = Math.max(1, props.length ?? 6)
    const groupSize = Math.max(0, props.groupSize ?? 0)
    const value = normalizeString(context?.state?.value ?? props.value)

    return (
      <div className="space-y-1">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <InputOTP
          maxLength={length}
          value={value}
          disabled={props.disabled}
          onChange={(next) => {
            context?.setState?.({ value: next })
            context?.runActions?.('change', { value: next })
          }}
        >
          <InputOTPGroup>
            {Array.from({ length }).map((_, index) => {
              const shouldInsertSeparator =
                groupSize > 0 && index > 0 && index % groupSize === 0
              return (
                // eslint-disable-next-line react/no-array-index-key
                <span key={`${index}-slot`} className="flex items-center">
                  {shouldInsertSeparator && <InputOTPSeparator />}
                  <InputOTPSlot index={index} />
                </span>
              )
            })}
          </InputOTPGroup>
        </InputOTP>
        {props.helperText && (
          <div className="text-xs text-muted-foreground">{props.helperText}</div>
        )}
      </div>
    )
  },
})
