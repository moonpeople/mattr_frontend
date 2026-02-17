/**
 * Hook-обёртка над ранними состояниями shell (loading/no-org/catalog/not-found).
 */
import { useMemo } from 'react'

import {
  renderBuilderShellEarlyView,
  type RenderBuilderShellEarlyViewParams,
} from '../components/BuilderShellEarlyView'

export const useBuilderShellEarlyView = (params: RenderBuilderShellEarlyViewParams) =>
  useMemo(() => renderBuilderShellEarlyView(params), [params])
