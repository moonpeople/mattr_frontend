/**
 * Ранние состояния оболочки билдера: loading/no-org/catalog/not-found.
 */
import type { ComponentProps, ReactNode } from 'react'
import Link from 'next/link'

import { Button, Card, CardContent, CardHeader, CardTitle, LogoLoader } from 'ui'

import { NoOrganizationsState } from 'components/interfaces/Home/ProjectList/EmptyStates'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

import { BuilderAppsCatalogView } from './BuilderAppsCatalogView'

export interface RenderBuilderShellEarlyViewParams {
  isAppsLoading: boolean
  isOrganizationsLoading: boolean
  organizationsCount: number
  appIdParam?: string | null
  activeAppId?: string
  projectRef?: string | null
  catalogProps: ComponentProps<typeof BuilderAppsCatalogView>
}

export const renderBuilderShellEarlyView = ({
  isAppsLoading,
  isOrganizationsLoading,
  organizationsCount,
  appIdParam,
  activeAppId,
  projectRef,
  catalogProps,
}: RenderBuilderShellEarlyViewParams): ReactNode | null => {
  if (isAppsLoading || isOrganizationsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LogoLoader />
      </div>
    )
  }

  if (organizationsCount === 0) {
    return (
      <ScaffoldContainer className="flex-grow flex">
        <ScaffoldSection isFullWidth className="flex-grow pb-0">
          <NoOrganizationsState />
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  if (!appIdParam) {
    return (
      <ScaffoldContainer className="flex-grow flex">
        <ScaffoldSection isFullWidth className="flex-grow pb-0">
          <BuilderAppsCatalogView {...catalogProps} />
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  if (!activeAppId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>App not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground-muted">
            <p>The selected app does not exist or is not available for this project.</p>
            <Button asChild type="primary">
              <Link href={projectRef ? `/builder?ref=${projectRef}` : '/builder'}>
                Choose another app
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
