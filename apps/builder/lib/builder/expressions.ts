import jsonLogic from 'json-logic-js'

export type PolicyMap = Record<string, boolean>

export const evaluateCondition = (
  expression: string | null | undefined,
  policies: PolicyMap
): boolean | undefined => {
  if (!expression) {
    return undefined
  }

  const trimmed = expression.trim()
  if (!trimmed) {
    return undefined
  }

  let content = unwrapExpression(trimmed)
  if (!content) {
    return undefined
  }

  let negate = false
  if (content.startsWith('!')) {
    negate = true
    content = content.slice(1).trim()
  }

  const literal = parseBooleanLiteral(content)
  if (typeof literal === 'boolean') {
    return negate ? !literal : literal
  }

  const policyResult = evaluatePolicyCall(content, policies)
  if (typeof policyResult === 'boolean') {
    return negate ? !policyResult : policyResult
  }

  const jsonResult = evaluateJsonLogic(content, policies)
  if (typeof jsonResult === 'boolean') {
    return negate ? !jsonResult : jsonResult
  }

  return undefined
}

const unwrapExpression = (value: string) => {
  if (value.startsWith('{{') && value.endsWith('}}')) {
    return value.slice(2, -2).trim()
  }
  return value
}

const parseBooleanLiteral = (value: string) => {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  return undefined
}

const evaluatePolicyCall = (value: string, policies: PolicyMap) => {
  const match = value.match(/^policy\.(allow|any|all)\((.*)\)$/)
  if (!match) {
    return undefined
  }

  const method = match[1]
  const argument = match[2]?.trim() ?? ''
  const policyApi = createPolicyApi(policies)

  if (method === 'allow') {
    const key = parseStringArgument(argument)
    return key ? policyApi.allow(key) : false
  }

  const keys = parseStringListArgument(argument)
  if (method === 'any') {
    return policyApi.any(keys)
  }
  if (method === 'all') {
    return policyApi.all(keys)
  }

  return undefined
}

const evaluateJsonLogic = (value: string, policies: PolicyMap) => {
  if (!looksLikeJson(value)) {
    return undefined
  }

  try {
    const rule = JSON.parse(normalizeJsonString(value))
    const result = jsonLogic.apply(rule, { policy: policies, policies })
    return Boolean(result)
  } catch {
    return undefined
  }
}

const looksLikeJson = (value: string) => {
  const trimmed = value.trim()
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}

const normalizeJsonString = (value: string) => {
  return value.replace(/'/g, '"')
}

const parseStringArgument = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const quote = trimmed[0]
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

const parseStringListArgument = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(normalizeJsonString(trimmed))
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry))
      }
    } catch {
      return []
    }
  }

  return [parseStringArgument(trimmed)]
}

const createPolicyApi = (policies: PolicyMap) => {
  return {
    allow: (key: string) => Boolean(policies[key]),
    any: (keys: string[]) => keys.some((key) => Boolean(policies[key])),
    all: (keys: string[]) => keys.every((key) => Boolean(policies[key])),
  }
}
