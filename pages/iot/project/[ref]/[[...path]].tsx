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

const DASHBOARD_BASE_PATH = '/dashboard'
const DEFAULT_NEXT_PATH = `${DASHBOARD_BASE_PATH}/project/default`

const appendNestedPath = (basePath: string, path: string[]): string => {
  if (path.length === 0) return basePath

  const nestedPath = path
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  const normalizedBase = basePath.replace(/\/+$/, '')
  return `${normalizedBase}/${nestedPath}`
}

const isPortalLoginPath = (pathname: string): boolean => {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized === `${DASHBOARD_BASE_PATH}/portal-login`
}

const normalizeLegacyPortalTokenFlow = (target: URL): void => {
  const token =
    target.searchParams.get('token') ?? target.searchParams.get('portal_token')

  // Backward compatibility:
  // older launch URLs can send token directly to /dashboard/project/... .
  // In that case static/API requests lose auth context because portal cookie
  // is not set. Route through /dashboard/portal-login to issue the cookie.
  if (!token || isPortalLoginPath(target.pathname)) return

  const nextPath = target.pathname || DEFAULT_NEXT_PATH
  target.pathname = `${DASHBOARD_BASE_PATH}/portal-login`
  target.searchParams.delete('portal_token')
  target.searchParams.set('token', token)
  target.searchParams.set('next', nextPath)
}

const buildTargetUrl = (
  launchUrl: string,
  path: string[],
  search: string
): string => {
  const target = new URL(launchUrl)
  normalizeLegacyPortalTokenFlow(target)

  if (path.length > 0) {
    if (isPortalLoginPath(target.pathname)) {
      const currentNext = target.searchParams.get('next') || DEFAULT_NEXT_PATH
      target.searchParams.set('next', appendNestedPath(currentNext, path))
    } else {
      target.pathname = appendNestedPath(target.pathname, path)
    }
  }

  // Keep query params from launch URL (portal token/next) and only append
  // extra params from current location when they are not already present.
  if (search) {
    const incoming = new URLSearchParams(search)
    incoming.forEach((value, key) => {
      if (!target.searchParams.has(key)) {
        target.searchParams.set(key, value)
      }
    })
  }

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
