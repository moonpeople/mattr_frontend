import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

type Translator = (key: string, fallback?: string) => string

const translate = (t: Translator | undefined, key: string, fallback: string) => {
  return t ? t(key, fallback) : fallback
}

export const generateRealtimeMenu = (project: Project, t?: Translator): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const showRealtimeSettings = IS_PLATFORM

  return [
    {
      title: translate(t, 'realtimeMenu.tools', 'Tools'),
      items: [
        {
          name: translate(t, 'realtimeMenu.inspector', 'Inspector'),
          key: 'inspector',
          url: `/project/${ref}/realtime/inspector`,
          items: [],
        },
      ],
    },
    {
      title: translate(t, 'realtimeMenu.configuration', 'Configuration'),
      items: [
        {
          name: translate(t, 'realtimeMenu.policies', 'Policies'),
          key: 'policies',
          url: `/project/${ref}/realtime/policies`,
          items: [],
        },
        ...(showRealtimeSettings
          ? [
              {
                name: translate(t, 'realtimeMenu.settings', 'Settings'),
                key: 'settings',
                url: `/project/${ref}/realtime/settings`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
