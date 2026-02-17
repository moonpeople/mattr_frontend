/**
 * Модель shell-слоя: общие контракты для hooks и view-композиции BuilderShell.
 */
import type { BuilderPageRecord } from 'data/builder/builder-pages'

export type BuilderShellCreatePageSuccess = (page: BuilderPageRecord) => void

export interface UseBuilderShellDataParams {
  projectRef?: string | null
  appIdParam?: string | null
  isPreviewing: boolean
  onCreatePageSuccess?: BuilderShellCreatePageSuccess
}
