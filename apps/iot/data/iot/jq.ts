import { iotFetch } from './client'

export type IotJqValidationResult = {
  valid: boolean
  error?: string | null
  result_type?: string | null
}

export type IotJqValidationPayload = {
  expression: string
  sample?: Record<string, unknown>
  expected?: string
}

export async function validateIotJq(payload: IotJqValidationPayload) {
  return iotFetch<IotJqValidationResult>('/jq/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
