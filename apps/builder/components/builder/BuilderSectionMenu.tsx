import {
  Activity,
  Code2,
  History,
  LayoutGrid,
  Layers,
  ListTree,
  Search,
  Settings,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { LOCAL_STORAGE_KEYS } from 'common'
import { DEFAULT_SIDEBAR_BEHAVIOR, ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  cn,
  useSidebar,
} from 'ui'

import type { BuilderSection } from './types'

const SECTION_ITEMS: Array<{
  key: BuilderSection
  label: string
  icon: ReactNode
}> = [
  {
    key: 'components',
    label: 'Components',
    icon: <LayoutGrid size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    key: 'pages',
    label: 'Pages',
    icon: <Layers size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    key: 'tree',
    label: 'Tree',
    icon: <ListTree size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  { key: 'code', label: 'Code', icon: <Code2 size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} /> },
  {
    key: 'search',
    label: 'Search',
    icon: <Search size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    key: 'state',
    label: 'State',
    icon: <Activity size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    key: 'history',
    label: 'History',
    icon: <History size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
]

interface BuilderSectionMenuProps {
  activeSection: BuilderSection | null
  onSelectSection: (section: BuilderSection) => void
  className?: string
}

export const BuilderSectionMenu = ({
  activeSection,
  onSelectSection,
  className,
}: BuilderSectionMenuProps) => {
  const { setOpen } = useSidebar()
  const [sidebarBehaviour] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )

  useEffect(() => {
    if (sidebarBehaviour === 'open') setOpen(true)
    if (sidebarBehaviour === 'closed') setOpen(false)
  }, [sidebarBehaviour, setOpen])

  return (
    <SidebarPrimitive
      role="navigation"
      aria-label="Builder sections"
      overflowing={sidebarBehaviour === 'expandable'}
      collapsible="icon"
      variant="sidebar"
      onMouseEnter={() => {
        if (sidebarBehaviour === 'expandable') setOpen(true)
      }}
      onMouseLeave={() => {
        if (sidebarBehaviour === 'expandable') setOpen(false)
      }}
      className={cn(className)}
    >
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup className="gap-0.5">
            {SECTION_ITEMS.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  isActive={activeSection === item.key}
                  onClick={() => onSelectSection(item.key)}
                  aria-label={item.label}
                  aria-current={activeSection === item.key ? 'page' : undefined}
                  tooltip={sidebarBehaviour === 'closed' ? item.label : ''}
                  className="text-sm"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
    </SidebarPrimitive>
  )
}
