import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'

type Translator = (key: string, fallback?: string) => string

const translate = (t: Translator | undefined, key: string, fallback: string) => {
  return t ? t(key, fallback) : fallback
}

export const generateAdvisorsMenu = (
  project?: Project,
  features?: { advisorRules: boolean },
  t?: Translator
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: translate(t, 'advisorsMenu.advisors', 'Advisors'),
      items: [
        {
          name: translate(t, 'advisorsMenu.securityAdvisor', 'Security Advisor'),
          key: 'security',
          url: `/project/${ref}/advisors/security`,
          items: [],
        },
        {
          name: translate(t, 'advisorsMenu.performanceAdvisor', 'Performance Advisor'),
          key: 'performance',
          url: `/project/${ref}/advisors/performance`,
          items: [],
        },
        {
          name: translate(t, 'advisorsMenu.queryPerformance', 'Query Performance'),
          key: 'query-performance',
          url: `/project/${ref}/observability/query-performance`,
          items: [],
          rightIcon: <ArrowUpRight size={14} strokeWidth={1.5} className="h-4 w-4" />,
        },
      ],
    },
    ...(IS_PLATFORM && features?.advisorRules
      ? [
          {
            title: translate(t, 'advisorsMenu.configuration', 'Configuration'),
            items: [
              {
                name: translate(t, 'advisorsMenu.settings', 'Settings'),
                key: 'rules',
                url: `/project/${ref}/advisors/rules/security`,
                items: [],
              },
            ],
          },
        ]
      : []),
  ]
}
