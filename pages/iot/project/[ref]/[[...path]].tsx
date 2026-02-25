import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { fetchPost } from 'data/fetchers'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'

type IotLaunchResponse = {
  launch_url?: string
}

const normalizePath = (path: string | string[] | undefined): string[] => {
  if (Array.isArray(path))
    return path.filter(
      (segment) => typeof segment === 'string' && segment !== ''
    )
  if (typeof path === 'string' && path !== '') return [path]
  return []
}

const buildTargetUrl = (
  launchUrl: string,
  path: string[],
  search: string
): string => {
  const target = new URL(launchUrl)

  if (path.length > 0) {
    const basePath = target.pathname.replace(/\/+$/, '')
    const nestedPath = path
      .map((segment) => encodeURIComponent(segment))
      .join('/')
    target.pathname = `${basePath}/${nestedPath}`
  }

  target.search = search
  return target.toString()
}

export default function IotProjectRedirectPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const projectRef = useMemo(() => {
    const value = router.query.ref
    return typeof value === 'string' ? value : null
  }, [router.query.ref])

  const path = useMemo(() => normalizePath(router.query.path), [router.query.path])

  useEffect(() => {
    if (!router.isReady || !projectRef) return

    let cancelled = false

    const launch = async () => {
      const endpoint = `${API_URL}/platform/projects/${encodeURIComponent(projectRef)}/iot/launch`
      const response = await fetchPost<IotLaunchResponse | ResponseError>(endpoint, {})

      if (cancelled) return

      if (response instanceof ResponseError) {
        setError(response.message || 'Unable to open IoT project')
        return
      }

      const launchUrl = response?.launch_url

      if (typeof launchUrl !== 'string' || launchUrl.trim() === '') {
        setError('IoT launch URL is not configured for this project')
        return
      }

      const search = typeof window === 'undefined' ? '' : window.location.search
      const targetUrl = buildTargetUrl(launchUrl.trim(), path, search)
      window.location.assign(targetUrl)
    }

    launch().catch((reason) => {
      if (!cancelled) {
        const message =
          reason instanceof Error && reason.message
            ? reason.message
            : 'Unable to open IoT project'
        setError(message)
      }
    })

    return () => {
      cancelled = true
    }
  }, [path, projectRef, router.isReady])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-xl space-y-2">
          <h1 className="text-lg font-medium">Unable to open IoT project</h1>
          <p className="text-sm text-foreground-light">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-xl space-y-2">
        <h1 className="text-lg font-medium">Opening IoT project</h1>
        <p className="text-sm text-foreground-light">
          Redirecting to the project instance...
        </p>
      </div>
    </div>
  )
}
