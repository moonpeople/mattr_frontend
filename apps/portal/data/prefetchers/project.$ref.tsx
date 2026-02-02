import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback } from 'react'

import { prefetchProjectDetail } from 'data/projects/project-detail-query'
import PrefetchableLink, { PrefetchableLinkProps } from './PrefetchableLink'

export function usePrefetchProjectIndexPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCallback(
    ({ projectRef, href }: { projectRef?: string; href?: string }) => {
      // Prefetch code
      if (href) {
        router.prefetch(href)
      } else {
        router.prefetch(`/project/${projectRef}`)
      }

      // Prefetch data
      if (projectRef) {
        prefetchProjectDetail(queryClient, {
          ref: projectRef,
        }).catch(() => {
          // eat prefetching errors as they are not critical
        })
      }
    },
    [queryClient, router]
  )
}

interface ProjectIndexPageLinkProps extends Omit<PrefetchableLinkProps, 'href' | 'prefetcher'> {
  projectRef?: string
  href?: PrefetchableLinkProps['href']
}

export function ProjectIndexPageLink({
  href,
  projectRef,
  children,
  ...props
}: PropsWithChildren<ProjectIndexPageLinkProps>) {
  const prefetch = usePrefetchProjectIndexPage()
  const resolvedHref = href || (projectRef ? `/project/${projectRef}` : '/')

  return (
    <PrefetchableLink
      href={resolvedHref}
      prefetcher={() => prefetch({ projectRef, href: resolvedHref })}
      {...props}
    >
      {children}
    </PrefetchableLink>
  )
}
