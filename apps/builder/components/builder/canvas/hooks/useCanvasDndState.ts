/**
 * Центральный hook состояния DnD canvas для external/internal drag lifecycle и refs.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Layout } from 'react-grid-layout'
import type { AdjacentDropTarget } from '../engines/dropTargetEngine'

type ContainerDropTarget = {
  parentId: string
  slot?: string
  layout?: Partial<Layout>
} | null

type InternalDragSource = {
  parentId?: string
  slot?: string
  layout: Partial<Layout>
} | null

export const useCanvasDndState = () => {
  const [isGridInteractionActive, setIsGridInteractionActive] = useState(false)
  const [isExternalDragActive, setIsExternalDragActive] = useState(false)
  const [externalDropTarget, setExternalDropTarget] = useState<AdjacentDropTarget>(null)
  const [internalDragActiveId, setInternalDragActiveId] = useState<string | null>(null)
  const [internalDropTarget, setInternalDropTarget] = useState<AdjacentDropTarget>(null)
  const [internalDropContainerTarget, setInternalDropContainerTarget] =
    useState<ContainerDropTarget>(null)
  const [internalPageRootDropLayout, setInternalPageRootDropLayout] =
    useState<Partial<Layout> | null>(null)
  const [internalDragSource, setInternalDragSource] = useState<InternalDragSource>(null)
  const [isPageRootDropActive, setIsPageRootDropActive] = useState(false)

  const gridInteractionRef = useRef(0)
  const externalDragTimeoutRef = useRef<number | null>(null)
  const internalDragPointerRef = useRef<{ x: number; y: number } | null>(null)
  const internalDropUpdateRafRef = useRef<number | null>(null)
  const internalDropUpdateArgsRef = useRef<{ x: number; y: number; activeId: string } | null>(
    null
  )

  const isInternalDragActive = Boolean(internalDragActiveId)
  const allowOverlapActive = isExternalDragActive
  const preventCollisionActive = isExternalDragActive

  const clearExternalDragTimeout = useCallback(() => {
    if (externalDragTimeoutRef.current) {
      window.clearTimeout(externalDragTimeoutRef.current)
      externalDragTimeoutRef.current = null
    }
  }, [])

  const clearInternalDropUpdateRaf = useCallback(() => {
    if (internalDropUpdateRafRef.current) {
      window.cancelAnimationFrame(internalDropUpdateRafRef.current)
      internalDropUpdateRafRef.current = null
    }
  }, [])

  const beginGridInteraction = useCallback(() => {
    gridInteractionRef.current += 1
    setIsGridInteractionActive(true)
  }, [])

  const endGridInteraction = useCallback(() => {
    gridInteractionRef.current = Math.max(0, gridInteractionRef.current - 1)
    if (gridInteractionRef.current === 0) {
      setIsGridInteractionActive(false)
    }
  }, [])

  const resetInternalDragState = useCallback(() => {
    setInternalDragActiveId(null)
    setInternalDropTarget(null)
    setInternalDropContainerTarget(null)
    setInternalPageRootDropLayout(null)
    setInternalDragSource(null)
    setIsPageRootDropActive(false)
    internalDragPointerRef.current = null
    internalDropUpdateArgsRef.current = null
    clearInternalDropUpdateRaf()
    endGridInteraction()
  }, [clearInternalDropUpdateRaf, endGridInteraction])

  useEffect(() => {
    return () => {
      clearExternalDragTimeout()
      clearInternalDropUpdateRaf()
    }
  }, [clearExternalDragTimeout, clearInternalDropUpdateRaf])

  return {
    isGridInteractionActive,
    isExternalDragActive,
    externalDropTarget,
    internalDragActiveId,
    internalDropTarget,
    internalDropContainerTarget,
    internalPageRootDropLayout,
    internalDragSource,
    isPageRootDropActive,
    isInternalDragActive,
    allowOverlapActive,
    preventCollisionActive,
    setIsExternalDragActive,
    setExternalDropTarget,
    setInternalDragActiveId,
    setInternalDropTarget,
    setInternalDropContainerTarget,
    setInternalPageRootDropLayout,
    setInternalDragSource,
    setIsPageRootDropActive,
    externalDragTimeoutRef,
    internalDragPointerRef,
    internalDropUpdateRafRef,
    internalDropUpdateArgsRef,
    beginGridInteraction,
    endGridInteraction,
    clearExternalDragTimeout,
    clearInternalDropUpdateRaf,
    resetInternalDragState,
  }
}
