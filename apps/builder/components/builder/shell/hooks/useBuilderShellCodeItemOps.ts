/**
 * Hook операций добавления/перемещения code-элементов (query/variable/transformer) в BuilderShell.
 */
import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import {
  type BuilderJsFunction,
  useCreateBuilderJsMutation,
  useUpdateBuilderJsMutation,
} from 'data/builder/builder-js'
import {
  type BuilderQuery,
  useCreateBuilderQueryMutation,
  useUpdateBuilderQueryMutation,
} from 'data/builder/builder-queries'

import {
  buildIndexedName,
  buildTransformerCode,
  setBuilderMeta,
  type BuilderCodeItemType,
  type BuilderCodeSelection,
} from '../../BuilderCodeUtils'

const DEFAULT_JS_CODE = 'export function main() {\n  \n}\n'

type Scope = 'global' | 'page'

export interface UseBuilderShellCodeItemOpsParams {
  activeAppId?: string | null
  activePageId: string | null
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  setCodeSelection: Dispatch<SetStateAction<BuilderCodeSelection>>
  createQueryMutation: Pick<ReturnType<typeof useCreateBuilderQueryMutation>, 'mutate'>
  updateQueryMutation: Pick<ReturnType<typeof useUpdateBuilderQueryMutation>, 'mutate'>
  createJsMutation: Pick<ReturnType<typeof useCreateBuilderJsMutation>, 'mutate'>
  updateJsMutation: Pick<ReturnType<typeof useUpdateBuilderJsMutation>, 'mutate'>
}

export const useBuilderShellCodeItemOps = ({
  activeAppId,
  activePageId,
  queries,
  jsFunctions,
  setCodeSelection,
  createQueryMutation,
  updateQueryMutation,
  createJsMutation,
  updateJsMutation,
}: UseBuilderShellCodeItemOpsParams) => {
  const handleAddCodeItem = useCallback(
    (type: BuilderCodeItemType, scope: Scope, pageId?: string) => {
      if (!activeAppId) {
        return
      }

      if (type === 'transformer') {
        const existing = new Set(jsFunctions.map((func) => func.name))
        const name = buildIndexedName('transformer', existing)
        const code = buildTransformerCode(DEFAULT_JS_CODE, {
          scope,
          pageId: scope === 'page' ? pageId ?? activePageId ?? undefined : undefined,
        })
        createJsMutation.mutate(
          { appId: activeAppId, name, code },
          {
            onSuccess: (js) => setCodeSelection({ type: 'transformer', id: js.id }),
          }
        )
        return
      }

      const existing = new Set(queries.map((query) => query.name))
      const name = buildIndexedName(type === 'variable' ? 'variable' : 'query', existing)
      const baseConfig = type === 'variable' ? { initialValue: null } : {}
      const config = setBuilderMeta(baseConfig, {
        scope,
        pageId: scope === 'page' ? pageId ?? activePageId ?? undefined : undefined,
      })
      createQueryMutation.mutate(
        {
          appId: activeAppId,
          name,
          type: type === 'variable' ? 'variable' : 'rest',
          config,
          trigger: null,
        },
        {
          onSuccess: (query) =>
            setCodeSelection({
              type: type === 'variable' ? 'variable' : 'query',
              id: query.id,
            }),
        }
      )
    },
    [
      activeAppId,
      activePageId,
      createJsMutation,
      createQueryMutation,
      jsFunctions,
      queries,
      setCodeSelection,
    ]
  )

  const handleMoveCodeItem = useCallback(
    (type: BuilderCodeItemType, id: string, scope: Scope, pageId?: string) => {
      if (!activeAppId) {
        return
      }
      if (type === 'transformer') {
        const func = jsFunctions.find((item) => item.id === id)
        if (!func) {
          return
        }
        const code = buildTransformerCode(func.code ?? DEFAULT_JS_CODE, {
          scope,
          pageId: scope === 'page' ? pageId ?? activePageId ?? undefined : undefined,
        })
        updateJsMutation.mutate({ appId: activeAppId, jsId: func.id, code })
        return
      }

      const query = queries.find((item) => item.id === id)
      if (!query) {
        return
      }
      const config = setBuilderMeta(query.config ?? {}, {
        scope,
        pageId: scope === 'page' ? pageId ?? activePageId ?? undefined : undefined,
      })
      updateQueryMutation.mutate({ appId: activeAppId, queryId: query.id, config })
    },
    [activeAppId, activePageId, jsFunctions, queries, updateJsMutation, updateQueryMutation]
  )

  return {
    handleAddCodeItem,
    handleMoveCodeItem,
  }
}
