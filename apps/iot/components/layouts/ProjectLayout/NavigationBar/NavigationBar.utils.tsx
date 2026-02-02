import { BarChart2, Bookmark, Cpu, Key, Settings } from 'lucide-react'

import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { generateSettingsMenu } from 'components/layouts/ProjectSettingsLayout/SettingsMenu.utils'
import type { Route } from 'components/ui/ui.types'
import type { Project } from 'data/projects/project-detail-query'
import { SqlEditor, TableEditor } from 'icons'
import { PROJECT_STATUS } from 'lib/constants'

export const generateToolRoutes = (
  ref?: string,
  project?: Project,
  _features?: {}
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  return [
    {
      key: 'editor',
      label: 'ClickHouse Tables',
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/clickhouse/tables`),
    },
    {
      key: 'sql',
      label: 'ClickHouse SQL',
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/sql`),
    },
  ]
}

export const generateProductRoutes = (ref?: string, project?: Project): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  return [
    {
      key: 'devices',
      label: 'Devices',
      icon: <Cpu size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/devices`),
    },
    {
      key: 'saved-queries',
      label: 'Saved Queries',
      icon: <Bookmark size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/saved-queries`),
    },
    {
      key: 'api-keys',
      label: 'API Keys',
      icon: <Key size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/api-keys`),
    },
    {
      key: 'observability',
      label: 'Observability',
      icon: <BarChart2 size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/observability`),
    },
  ]
}

export const generateOtherRoutes = (
  _ref?: string,
  _project?: Project,
  _features?: { unifiedLogs?: boolean; showReports?: boolean }
): Route[] => {
  return []
}

export const generateSettingsRoutes = (_ref?: string, _project?: Project): Route[] => {
  if (!_ref) return []
  const settingsMenu = generateSettingsMenu(_ref as string, _project)

  return [
    {
      key: 'settings',
      label: 'Project Settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: `/project/${_ref}/settings/iot`,
      items: settingsMenu,
    },
  ]
}
