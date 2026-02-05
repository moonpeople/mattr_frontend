import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Separator,
} from 'ui'

import {
  type BuilderVersion,
  useBuilderVersionsQuery,
  useRollbackBuilderVersionMutation,
} from 'data/builder/builder-versions'
import { useBuilderDraftQuery } from 'data/builder/builder-draft'

type BuilderSidebarPanelHistoryProps = {
  title: string
  icon: ReactNode
  onClose?: () => void
  appId?: string
  projectRef?: string
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString()
}

export const BuilderSidebarPanelHistory = ({
  title,
  icon,
  onClose,
  appId,
  projectRef,
}: BuilderSidebarPanelHistoryProps) => {
  const [rollbackTarget, setRollbackTarget] = useState<BuilderVersion | null>(null)
  const [snapshotTarget, setSnapshotTarget] = useState<{
    title: string
    schema: BuilderVersion['schema']
  } | null>(null)
  const { data: versions = [], isLoading, isError } = useBuilderVersionsQuery(
    { appId, projectRef },
    { enabled: Boolean(appId) }
  )
  const { data: draftData } = useBuilderDraftQuery(
    { appId, projectRef },
    { enabled: Boolean(appId) }
  )
  const rollbackMutation = useRollbackBuilderVersionMutation({
    onSuccess: () => {
      toast('Rolled back to selected version.')
    },
    onError: (err) => {
      const message = (err as ResponseError)?.message ?? 'Rollback failed.'
      toast(message)
    },
  })

  const summaryLabel = useMemo(() => {
    if (!appId) {
      return 'Select an app to view history.'
    }
    if (isLoading) {
      return 'Loading versions...'
    }
    if (isError) {
      return 'Unable to load version history.'
    }
    if (versions.length === 0) {
      return 'No published versions yet.'
    }
    return `Versions ${versions.length}`
  }, [appId, isLoading, isError, versions.length])

  const latestVersion = useMemo(() => {
    return versions.reduce<BuilderVersion | null>((latest, current) => {
      if (!latest || current.version > latest.version) {
        return current
      }
      return latest
    }, null)
  }, [versions])

  const snapshotJson = useMemo(() => {
    if (!snapshotTarget?.schema) {
      return ''
    }
    try {
      return JSON.stringify(snapshotTarget.schema, null, 2)
    } catch {
      return ''
    }
  }, [snapshotTarget])

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="builder-panel-header flex items-center justify-between bg-surface-200 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground-muted/30 bg-surface-200">
              {icon}
            </div>
            <div className="text-xs font-medium">{title}</div>
          </div>
          <Button type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
        </div>
        <Separator />
        <div className="flex h-8 items-center justify-between px-3 text-xs font-medium text-foreground-muted">
          {summaryLabel}
        </div>
        <Separator />
        <ScrollArea className="min-h-0 flex-1 px-3 py-3">
          <div className="flex min-h-full flex-col gap-2 text-xs">
            {!appId || isLoading || isError ? (
              <div className="flex min-h-[120px] items-center justify-center text-center text-foreground-muted">
                {summaryLabel}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 rounded-md border border-foreground-muted/30 bg-surface-100 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-medium text-foreground">Draft</div>
                      <div className="text-[11px] text-foreground-muted">
                        Updated {formatDate(draftData?.updatedAt)}
                      </div>
                    </div>
                    {draftData?.schema ? (
                      <Button
                        type="outline"
                        size="tiny"
                        className="h-6 px-2"
                        onClick={() =>
                          setSnapshotTarget({
                            title: 'Draft snapshot',
                            schema: draftData.schema,
                          })
                        }
                      >
                        View
                      </Button>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-foreground-muted">
                    {draftData?.updatedBy ? `Updated by ${draftData.updatedBy}` : 'Draft in progress.'}
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-md border border-foreground-muted/30 bg-surface-100 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-medium text-foreground">Published</div>
                      <div className="text-[11px] text-foreground-muted">
                        {latestVersion
                          ? `Version ${latestVersion.version} · ${formatDate(latestVersion.publishedAt)}`
                          : 'No published versions yet.'}
                      </div>
                    </div>
                    {latestVersion ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="outline"
                          size="tiny"
                          className="h-6 px-2"
                          onClick={() =>
                            setSnapshotTarget({
                              title: `Published v${latestVersion.version}`,
                              schema: latestVersion.schema,
                            })
                          }
                        >
                          View
                        </Button>
                        <Button
                          type="outline"
                          size="tiny"
                          className="h-6 px-2"
                          icon={<RotateCcw size={12} />}
                          onClick={() => setRollbackTarget(latestVersion)}
                          disabled={rollbackMutation.isPending}
                        >
                          Rollback
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-foreground-muted">
                    {latestVersion?.comment
                      ? latestVersion.comment
                      : latestVersion
                        ? 'No publish message.'
                        : 'Publish a version to see it here.'}
                  </div>
                </div>

                {versions.length > 0 ? (
                  <div className="pt-2 text-[11px] font-medium text-foreground-muted">
                    All versions
                  </div>
                ) : null}
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex flex-col gap-2 rounded-md border border-foreground-muted/30 bg-surface-100 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs font-medium text-foreground">
                          Version {version.version}
                        </div>
                        <div className="text-[11px] text-foreground-muted">
                          Published {formatDate(version.publishedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="outline"
                          size="tiny"
                          className="h-6 px-2"
                          onClick={() =>
                            setSnapshotTarget({
                              title: `Version ${version.version}`,
                              schema: version.schema,
                            })
                          }
                        >
                          View
                        </Button>
                        <Button
                          type="outline"
                          size="tiny"
                          className="h-6 px-2"
                          icon={<RotateCcw size={12} />}
                          onClick={() => setRollbackTarget(version)}
                          disabled={rollbackMutation.isPending}
                        >
                          Rollback
                        </Button>
                      </div>
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      {version.comment ? version.comment : 'No publish message.'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={Boolean(rollbackTarget)} onOpenChange={(open) => !open && setRollbackTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback version</AlertDialogTitle>
            <AlertDialogDescription>
              {rollbackTarget
                ? `Rollback to version ${rollbackTarget.version}? This will update the published app.`
                : 'Rollback to this version?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rollbackMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => {
                if (!rollbackTarget || !appId) {
                  return
                }
                rollbackMutation.mutate({
                  appId,
                  versionId: rollbackTarget.id,
                  projectRef,
                })
                setRollbackTarget(null)
              }}
              disabled={!appId || rollbackMutation.isPending}
            >
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(snapshotTarget)} onOpenChange={(open) => !open && setSnapshotTarget(null)}>
        <DialogContent size="large" className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{snapshotTarget?.title ?? 'Snapshot'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-md border border-foreground-muted/30 bg-surface-100 p-3 text-xs">
            <pre className="whitespace-pre-wrap">{snapshotJson || 'No data.'}</pre>
          </div>
          <DialogFooter>
            <Button type="default" onClick={() => setSnapshotTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
