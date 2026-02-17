/**
 * Ключи панелей inspector: централизованный набор идентификаторов panel routing.
 */
const TABLE_COLUMN_PANEL_PREFIX = 'table-column:'

export const buildTableColumnPanelKey = (index: number) =>
  `${TABLE_COLUMN_PANEL_PREFIX}${index}`

export const isTableColumnPanelKey = (
  panelKey?: string | null
): panelKey is string =>
  typeof panelKey === 'string' && panelKey.startsWith(TABLE_COLUMN_PANEL_PREFIX)

export const parseTableColumnPanelIndex = (panelKey?: string | null) => {
  if (!isTableColumnPanelKey(panelKey)) {
    return null
  }
  const indexRaw = panelKey.slice(TABLE_COLUMN_PANEL_PREFIX.length)
  const parsed = Number.parseInt(indexRaw, 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }
  return parsed
}
