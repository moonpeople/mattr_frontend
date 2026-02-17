/**
 * Layout операции виджетов в BuilderShell.
 */
import { useCallback } from 'react'
import type { Layout } from 'react-grid-layout'

import { updateWidgetById } from '../../layout-ops'

import type {
  UseBuilderShellWidgetLayoutOpsParams,
  WidgetLayoutHandlers,
} from './types'

export const useBuilderShellWidgetLayoutOps = ({
  pages,
  activePageId,
  updatePageWidgetSlotById,
  updateAppFrameWidget,
  updatePageFrameWidget,
  updateWidget,
}: UseBuilderShellWidgetLayoutOpsParams): WidgetLayoutHandlers => {
  const handleUpdateLayout = useCallback(
    (layout: Layout[]) => {
      const targetPageId = activePageId ?? pages[0]?.id
      if (!targetPageId || layout.length === 0) {
        return
      }

      const layoutMap = new Map(layout.map((item) => [item.i, item]))
      updatePageWidgetSlotById(targetPageId, (widgets) =>
        widgets.map((widget) => {
          const item = layoutMap.get(widget.id)
          if (!item) {
            return widget
          }
          return {
            ...widget,
            layout: {
              ...(widget.layout ?? {}),
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            },
          }
        })
      )
    },
    [activePageId, pages, updatePageWidgetSlotById]
  )

  const handleUpdateWidgetLayout = useCallback(
    (widgetId: string, patch: Partial<Layout>) => {
      updateWidget(widgetId, (widget) => {
        if (!widget.layout) {
          return widget
        }
        return {
          ...widget,
          layout: {
            ...widget.layout,
            ...patch,
          },
        }
      })
    },
    [updateWidget]
  )

  const handleUpdateChildLayout = useCallback(
    (parentId: string, layout: Layout[]) => {
      const targetPageId = activePageId ?? pages[0]?.id
      if (!targetPageId || layout.length === 0) {
        return
      }

      const layoutMap = new Map(layout.map((item) => [item.i, item]))
      updatePageWidgetSlotById(targetPageId, (widgets) =>
        updateWidgetById(widgets, parentId, (parent) => {
          if (!parent.children || parent.children.length === 0) {
            return parent
          }
          return {
            ...parent,
            children: parent.children.map((child) => {
              const item = layoutMap.get(child.id)
              if (!item) {
                return child
              }
              return {
                ...child,
                layout: {
                  ...(child.layout ?? {}),
                  x: item.x,
                  y: item.y,
                  w: item.w,
                  h: item.h,
                },
              }
            }),
          }
        })
      )
    },
    [activePageId, pages, updatePageWidgetSlotById]
  )

  const handleUpdateAppFrameChildLayout = useCallback(
    (parentId: string, layout: Layout[]) => {
      if (layout.length === 0) {
        return
      }

      updateAppFrameWidget(parentId, (parent) => {
        if (!parent.children || parent.children.length === 0) {
          return parent
        }
        const layoutMap = new Map(layout.map((item) => [item.i, item]))
        return {
          ...parent,
          children: parent.children.map((child) => {
            const item = layoutMap.get(child.id)
            if (!item) {
              return child
            }
            return {
              ...child,
              layout: {
                ...(child.layout ?? {}),
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
              },
            }
          }),
        }
      })
    },
    [updateAppFrameWidget]
  )

  const handleUpdatePageFrameChildLayout = useCallback(
    (parentId: string, layout: Layout[]) => {
      if (layout.length === 0) {
        return
      }
      updatePageFrameWidget(parentId, (parent) => {
        if (!parent.children || parent.children.length === 0) {
          return parent
        }
        const layoutMap = new Map(layout.map((item) => [item.i, item]))
        return {
          ...parent,
          children: parent.children.map((child) => {
            const item = layoutMap.get(child.id)
            if (!item) {
              return child
            }
            return {
              ...child,
              layout: {
                ...(child.layout ?? {}),
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
              },
            }
          }),
        }
      })
    },
    [updatePageFrameWidget]
  )

  const handleUpdateAppFrameWidgetLayout = useCallback(
    (widgetId: string, patch: Partial<Layout>) => {
      updateAppFrameWidget(widgetId, (widget) => {
        if (!widget.layout) {
          return widget
        }
        return {
          ...widget,
          layout: {
            ...widget.layout,
            ...patch,
          },
        }
      })
    },
    [updateAppFrameWidget]
  )

  const handleUpdatePageFrameWidgetLayout = useCallback(
    (widgetId: string, patch: Partial<Layout>) => {
      updatePageFrameWidget(widgetId, (widget) => {
        if (!widget.layout) {
          return widget
        }
        return {
          ...widget,
          layout: {
            ...widget.layout,
            ...patch,
          },
        }
      })
    },
    [updatePageFrameWidget]
  )

  return {
    handleUpdateLayout,
    handleUpdateWidgetLayout,
    handleUpdateChildLayout,
    handleUpdateAppFrameChildLayout,
    handleUpdatePageFrameChildLayout,
    handleUpdateAppFrameWidgetLayout,
    handleUpdatePageFrameWidgetLayout,
  }
}
