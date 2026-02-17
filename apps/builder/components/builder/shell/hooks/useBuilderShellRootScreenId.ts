/**
 * Вычисляет rootScreenId для runtime/view-слоя из текущего набора страниц.
 */
import { useMemo } from 'react'

import type { BuilderPage } from '../../types'

export const useBuilderShellRootScreenId = (pages: BuilderPage[]) => {
  return useMemo(() => {
    const rootPage = pages.find((page) => {
      const layout = page.layout as { rootScreen?: unknown } | undefined
      return typeof layout?.rootScreen === 'string'
    })
    const layout = rootPage?.layout as { rootScreen?: string } | undefined
    const candidate = layout?.rootScreen
    if (candidate && pages.some((page) => page.id === candidate)) {
      return candidate
    }
    return pages[0]?.id ?? null
  }, [pages])
}
