import type { NextApiRequest, NextApiResponse } from 'next'

type DeploymentCommitResponse = {
  commitSha: string
  commitTime: string
}

function resolveCommitTime(): string {
  const raw =
    process.env.VERCEL_GIT_COMMIT_TIMESTAMP ||
    process.env.GIT_COMMIT_TIME ||
    process.env.COMMIT_TIME ||
    ''

  if (!raw) return 'unknown'

  const asNumber = Number(raw)
  if (Number.isFinite(asNumber) && asNumber > 0) {
    const ms = asNumber < 10_000_000_000 ? asNumber * 1000 : asNumber
    return new Date(ms).toISOString()
  }

  const parsed = Date.parse(raw)
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString()

  return 'unknown'
}

export default function handler(req: NextApiRequest, res: NextApiResponse<DeploymentCommitResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    process.env.COMMIT_SHA ||
    'unknown'

  const commitTime = resolveCommitTime()

  return res.status(200).json({ commitSha, commitTime })
}
