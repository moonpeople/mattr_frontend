import { safeValidateUIMessages } from 'ai'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { IS_PLATFORM } from 'common'
import { getOrganizations } from 'data/organizations/organizations-query'
import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { getAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { BUILDER_ASSISTANT_PROMPT } from 'lib/ai/builder-prompts'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'

export const maxDuration = 120

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper

const builderContextSchema = z
  .object({
    appId: z.string().optional(),
    appName: z.string().optional(),
    appUrl: z.string().optional(),
    orgSlug: z.string().optional(),
    activePage: z
      .object({
        id: z.string(),
        name: z.string(),
        url: z.string().optional(),
      })
      .optional(),
    pages: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          url: z.string().optional(),
        })
      )
      .optional(),
    widgetSummary: z
      .object({
        total: z.number().optional(),
        byType: z.record(z.number()).optional(),
      })
      .optional(),
  })
  .optional()

const requestBodySchema = z.object({
  messages: z.array(z.any()),
  orgSlug: z.string().optional(),
  chatName: z.string().optional(),
  model: z.enum(['gpt-5', 'gpt-5-mini']).optional(),
  builderContext: builderContextSchema,
})

const formatBuilderContext = (context: z.infer<typeof builderContextSchema>) => {
  if (!context) {
    return undefined
  }

  const parts: string[] = []

  if (context.appName) {
    parts.push(`App: ${context.appName}`)
  }

  if (context.appUrl) {
    parts.push(`App URL: ${context.appUrl}`)
  }

  if (context.activePage) {
    const pageUrl = context.activePage.url ? ` (${context.activePage.url})` : ''
    parts.push(`Active page: ${context.activePage.name}${pageUrl}`)
  }

  if (context.pages && context.pages.length > 0) {
    const pagePreview = context.pages
      .slice(0, 10)
      .map((page) => (page.url ? `${page.name} (${page.url})` : page.name))
      .join(', ')
    parts.push(`Pages: ${pagePreview}`)
  }

  if (context.widgetSummary?.total) {
    const byType = context.widgetSummary.byType
      ? Object.entries(context.widgetSummary.byType)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([type, count]) => `${type}:${count}`)
          .join(', ')
      : ''
    parts.push(
      `Widgets: ${context.widgetSummary.total}${byType ? `. By type: ${byType}` : ''}`
    )
  }

  return parts.length > 0 ? `Builder context: ${parts.join(' | ')}` : undefined
}

async function getOrgAiDetails({
  orgSlug,
  authorization,
}: {
  orgSlug: string
  authorization?: string
}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authorization && { Authorization: authorization }),
  }

  const organizations = await getOrganizations({ headers })
  const org = organizations.find((item) => item.slug === orgSlug)

  if (!org) {
    throw new Error('Organization not found')
  }

  return {
    aiOptInLevel: getAiOptInLevel(org.opt_in_tags),
    isLimited: org.plan?.id === 'free',
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const authorization = req.headers.authorization
  const accessToken = authorization?.replace('Bearer ', '')

  if (IS_PLATFORM && !accessToken) {
    return res.status(401).json({ error: 'Authorization token is required' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { data, error: parseError } = requestBodySchema.safeParse(body)

  if (parseError) {
    return res.status(400).json({ error: 'Invalid request body', issues: parseError.issues })
  }

  const { messages: rawMessages, orgSlug, chatName, model: requestedModel, builderContext } = data

  const messagesValidation = await safeValidateUIMessages({ messages: rawMessages })
  if (!messagesValidation.success) {
    return res
      .status(400)
      .json({ error: 'Invalid request body', message: messagesValidation.error.message })
  }

  const messages = messagesValidation.data
  const builderContextMessage = formatBuilderContext(builderContext)

  let aiOptInLevel: AiOptInLevel = 'disabled'
  let isLimited = false

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
  }

  if (IS_PLATFORM && orgSlug) {
    try {
      const orgDetails = await getOrgAiDetails({ orgSlug, authorization })
      aiOptInLevel = orgDetails.aiOptInLevel
      isLimited = orgDetails.isLimited
    } catch (error) {
      return res.status(400).json({
        error: 'There was an error fetching your organization details',
      })
    }
  }

  const {
    model,
    error: modelError,
    promptProviderOptions,
    providerOptions,
  } = await getModel({
    provider: 'openai',
    model: requestedModel ?? 'gpt-5',
    routingKey: builderContext?.appId ?? orgSlug ?? 'builder',
    isLimited,
  })

  if (modelError) {
    return res.status(500).json({ error: modelError.message })
  }

  try {
    const abortController = new AbortController()
    req.on('close', () => abortController.abort())
    req.on('aborted', () => abortController.abort())

    const result = await generateAssistantResponse({
      messages,
      model,
      tools: {},
      aiOptInLevel,
      chatName,
      systemPrompt: BUILDER_ASSISTANT_PROMPT,
      assistantContext: builderContextMessage,
      promptProviderOptions,
      providerOptions,
      abortSignal: abortController.signal,
    })

    result.pipeUIMessageStreamToResponse(res, {
      sendReasoning: true,
      onError: (error) => {
        if (error == null) {
          return 'unknown error'
        }

        if (typeof error === 'string') {
          return error
        }

        if (error instanceof Error) {
          return error.message
        }

        return JSON.stringify(error)
      },
    })
  } catch (error) {
    console.error('Error in handlePost:', error)
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    }
    return res.status(500).json({ message: 'An unexpected error occurred.' })
  }
}
