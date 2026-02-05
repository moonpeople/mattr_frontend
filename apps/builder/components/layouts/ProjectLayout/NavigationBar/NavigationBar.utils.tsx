import { LayoutGrid } from 'lucide-react'

import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import type { Route } from 'components/ui/ui.types'

type Translator = (key: string, fallback?: string) => string

const translate = (t: Translator | undefined, key: string, fallback: string) => {
  return t ? t(key, fallback) : fallback
}

export const generateToolRoutes = (
  ref?: string,
  _project?: unknown,
  _features?: {},
  t?: Translator
): Route[] => {
  return [
    {
      key: 'builder',
      label: translate(t, 'nav.appBuilder', 'App Builder'),
      icon: <LayoutGrid size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref ? `/builder?ref=${ref}` : undefined,
    },
  ]
}
