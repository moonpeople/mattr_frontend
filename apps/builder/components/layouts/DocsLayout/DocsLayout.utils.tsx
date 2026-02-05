import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import { ArrowUpRight, Book, BookOpen } from 'lucide-react'
import SVG from 'react-inlinesvg'

type Translator = (key: string, fallback?: string) => string

const translate = (t: Translator | undefined, key: string, fallback: string) => {
  return t ? t(key, fallback) : fallback
}

export const generateDocsMenu = (
  ref: string,
  tables: string[],
  functions: string[],
  flags?: { authEnabled: boolean },
  t?: Translator
): ProductMenuGroup[] => {
  return [
    {
      title: translate(t, 'docsMenu.gettingStarted', 'Getting Started'),
      items: [
        {
          name: translate(t, 'docsMenu.introduction', 'Introduction'),
          key: 'introduction',
          url: `/project/${ref}/api`,
          items: [],
        },
        {
          name: translate(t, 'docsMenu.authentication', 'Authentication'),
          key: 'auth',
          url: `/project/${ref}/api?page=auth`,
          items: [],
        },
        ...(flags?.authEnabled
          ? [
              {
                name: translate(t, 'docsMenu.userManagement', 'User Management'),
                key: 'users-management',
                url: `/project/${ref}/api?page=users-management`,
                items: [],
              },
            ]
          : []),
      ],
    },
    {
      title: translate(t, 'docsMenu.tablesAndViews', 'Tables and Views'),
      items: [
        {
          name: translate(t, 'docsMenu.introduction', 'Introduction'),
          key: 'tables-intro',
          url: `/project/${ref}/api?page=tables-intro`,
          items: [],
        },
        ...tables.sort().map((table) => {
          return {
            name: table,
            key: table,
            url: `/project/${ref}/api?resource=${table}`,
            items: [],
          }
        }),
      ],
    },
    {
      title: translate(t, 'docsMenu.storedProcedures', 'Stored Procedures'),
      items: [
        {
          name: translate(t, 'docsMenu.introduction', 'Introduction'),
          key: 'rpc-intro',
          url: `/project/${ref}/api?page=rpc-intro`,
          items: [],
        },
        ...functions.map((fn) => {
          return { name: fn, key: fn, url: `/project/${ref}/api?rpc=${fn}`, items: [] }
        }),
      ],
    },
    {
      title: translate(t, 'docsMenu.graphql', 'GraphQL'),
      items: [
        {
          name: translate(t, 'docsMenu.graphiql', 'GraphiQL'),
          key: 'graphiql',
          url: `/project/${ref}/integrations/graphiql`,
          icon: (
            <SVG
              src={`${BASE_PATH}/img/graphql.svg`}
              style={{ width: `${16}px`, height: `${16}px` }}
              className="text-foreground"
              preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
            />
          ),
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
      ],
    },
    {
      title: translate(t, 'docsMenu.moreResources', 'More Resources'),
      items: [
        {
          name: translate(t, 'docsMenu.guides', 'Guides'),
          key: 'guides',
          url: DOCS_URL,
          icon: <Book size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
        {
          name: translate(t, 'docsMenu.apiReference', 'API Reference'),
          key: 'api-reference',
          url: `${DOCS_URL}/guides/api`,
          icon: <BookOpen size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
      ],
    },
  ]
}
