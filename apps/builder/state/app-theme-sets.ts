export type ThemeComponentSet = {
  id: string
  label: string
  description?: string
  shadcnStyle?: string
}

export const THEME_COMPONENT_SETS: ThemeComponentSet[] = [
  {
    id: 'shadcn/vega',
    label: 'Vega',
    description: 'Balanced, default shadcn style.',
    shadcnStyle: 'vega',
  },
  {
    id: 'shadcn/nova',
    label: 'Nova',
    description: 'Sharper contrasts and tighter UI.',
    shadcnStyle: 'nova',
  },
  {
    id: 'shadcn/maia',
    label: 'Maia',
    description: 'Softer surfaces with gentle contrast.',
    shadcnStyle: 'maia',
  },
  {
    id: 'shadcn/lyra',
    label: 'Lyra',
    description: 'Bold, high-contrast UI preset.',
    shadcnStyle: 'lyra',
  },
  {
    id: 'shadcn/mira',
    label: 'Mira',
    description: 'Minimal and clean surfaces.',
    shadcnStyle: 'mira',
  },
]

export const getThemeComponentSet = (id?: string) => {
  if (!id) {
    return THEME_COMPONENT_SETS[0]
  }
  return THEME_COMPONENT_SETS.find((set) => set.id === id) ?? THEME_COMPONENT_SETS[0]
}
