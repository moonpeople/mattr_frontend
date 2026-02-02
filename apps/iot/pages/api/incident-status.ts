import { NextApiRequest, NextApiResponse } from 'next'
import { IS_PLATFORM } from 'common'
import type { IncidentInfo } from 'lib/api/incident-status'
import { API_URL } from 'lib/constants'

/**
 * Cache on browser for 5 minutes
 * Cache on CDN for 5 minutes
 * Allow serving stale content for 1 minute while revalidating
 */
const CACHE_CONTROL_SETTINGS = 'public, max-age=300, s-maxage=300, stale-while-revalidate=60'

const PLATFORM_INCIDENTS_ENDPOINT = API_URL ? `${API_URL.replace(/\/$/, '')}/incident-status` : ''

// Default export needed by Next.js convention
// eslint-disable-next-line no-restricted-exports
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IncidentInfo[] | { error: string }>
) {
  if (!IS_PLATFORM) {
    res.setHeader('Cache-Control', CACHE_CONTROL_SETTINGS)
    return res.status(200).json([])
  }

  const { method } = req

  if (method === 'HEAD') {
    res.setHeader('Cache-Control', CACHE_CONTROL_SETTINGS)
    return res.status(200).end()
  }

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET', 'HEAD'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }

  if (!PLATFORM_INCIDENTS_ENDPOINT) {
    return res.status(500).json({ error: 'Platform incident-status endpoint is not configured' })
  }

  try {
    const response = await fetch(PLATFORM_INCIDENTS_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    })

    const cacheControl = response.headers.get('cache-control') || CACHE_CONTROL_SETTINGS
    res.setHeader('Cache-Control', cacheControl)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[incident-status] Platform API failed:', response.status, errorText)
      return res.status(response.status).json({ error: 'Unable to fetch incidents at this time' })
    }

    const data = (await response.json()) as IncidentInfo[]
    return res.status(200).json(data)
  } catch (error) {
    console.error('[incident-status] Unexpected error:', error)
    return res.status(500).json({ error: 'Unable to fetch incidents at this time' })
  }
}
