import { forwardRef, useImperativeHandle } from 'react'

type HCaptchaHandle = {
  execute: (opts?: any) => Promise<{ response: string | null } | null>
  resetCaptcha: () => void
}

const HCaptchaStub = forwardRef<HCaptchaHandle, any>(function HCaptchaStub(_props, ref) {
  useImperativeHandle(ref, () => ({
    execute: async () => ({ response: null }),
    resetCaptcha: () => {},
  }))
  return null
})

export default HCaptchaStub
export type { HCaptchaHandle as HCaptcha }
