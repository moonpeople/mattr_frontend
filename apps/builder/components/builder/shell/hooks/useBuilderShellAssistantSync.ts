/**
 * Assistant-sync hook BuilderShell: обновляет контекст AI assistant для режима builder.
 */
import { useEffect } from 'react'

interface BuilderAssistantContext {
  appId?: string
  appName?: string
  appUrl?: string
  orgSlug?: string
  activePage?: { id: string; name: string; url?: string }
  pages?: { id: string; name: string; url?: string }[]
  widgetSummary?: { total?: number; byType?: Record<string, number> }
}

interface AssistantContextPayload {
  assistantMode?: 'builder'
  storageKey?: string
  orgSlug?: string
  builder?: BuilderAssistantContext
}

export interface UseBuilderShellAssistantSyncParams {
  activeAppId?: string | null
  activeAppOrgSlug?: string | null
  organizationSlug?: string | null
  builderAssistantContext: BuilderAssistantContext | null
  setAssistantContext: (payload: AssistantContextPayload) => void
}

export const useBuilderShellAssistantSync = ({
  activeAppId,
  activeAppOrgSlug,
  organizationSlug,
  builderAssistantContext,
  setAssistantContext,
}: UseBuilderShellAssistantSyncParams) => {
  useEffect(() => {
    if (!activeAppId || !builderAssistantContext) {
      setAssistantContext({
        assistantMode: undefined,
        storageKey: undefined,
        builder: undefined,
      })
      return
    }
    setAssistantContext({
      assistantMode: 'builder',
      storageKey: `builder:${activeAppId}`,
      orgSlug: activeAppOrgSlug ?? organizationSlug ?? undefined,
      builder: builderAssistantContext,
    })
  }, [
    activeAppId,
    activeAppOrgSlug,
    organizationSlug,
    builderAssistantContext,
    setAssistantContext,
  ])
}
