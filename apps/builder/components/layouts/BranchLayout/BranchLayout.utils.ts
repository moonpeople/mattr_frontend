import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

type Translator = (key: string, fallback?: string) => string

const translate = (t: Translator | undefined, key: string, fallback: string) => {
  return t ? t(key, fallback) : fallback
}

export const generateBranchMenu = (ref: string, t?: Translator): ProductMenuGroup[] => {
  return [
    {
      title: translate(t, 'branchMenu.manage', 'Manage'),
      items: [
        {
          name: translate(t, 'branchMenu.branches', 'Branches'),
          key: 'branches',
          url: `/project/${ref}/branches`,
          items: [],
        },
        {
          name: translate(t, 'branchMenu.mergeRequests', 'Merge requests'),
          key: 'merge-requests',
          url: `/project/${ref}/branches/merge-requests`,
          items: [],
        },
      ],
    },
  ]
}
