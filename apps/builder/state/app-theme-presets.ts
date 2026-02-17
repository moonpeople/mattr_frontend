import {
  DEFAULT_THEME_RADII,
  type ShadcnThemeVariables,
  type BuilderAppTheme,
  type ThemeRadii,
  type ShadcnColorMapping,
  SHADCN_COLOR_MAPPING_V2,
} from './app-theme-state'

type ShadcnThemePreset = {
  light: Record<string, string>
  dark: Record<string, string>
}

export type ComponentSetPreset = {
  shadcnVariables: ShadcnThemeVariables
  radii: ThemeRadii
  shadcnConfig?: Partial<BuilderAppTheme['shadcn']>
  cssVariables?: Record<string, string>
  colorMapping?: ShadcnColorMapping
}

const SHADCN_THEME_PRESETS: Record<string, ShadcnThemePreset> = {
  neutral: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '0 0% 3.9%',
      '--muted': '0 0% 96.1%',
      '--muted-foreground': '0 0% 45.1%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '0 0% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '0 0% 3.9%',
      '--border': '0 0% 89.8%',
      '--input': '0 0% 89.8%',
      '--primary': '0 0% 9%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '0 0% 96.1%',
      '--secondary-foreground': '0 0% 9%',
      '--accent': '0 0% 96.1%',
      '--accent-foreground': '0 0% 9%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--ring': '0 0% 3.9%',
    },
    dark: {
      '--background': '0 0% 3.9%',
      '--foreground': '0 0% 98%',
      '--muted': '0 0% 14.9%',
      '--muted-foreground': '0 0% 63.9%',
      '--popover': '0 0% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--card': '0 0% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--border': '0 0% 14.9%',
      '--input': '0 0% 14.9%',
      '--primary': '0 0% 98%',
      '--primary-foreground': '0 0% 9%',
      '--secondary': '0 0% 14.9%',
      '--secondary-foreground': '0 0% 98%',
      '--accent': '0 0% 14.9%',
      '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '0 0% 98%',
      '--ring': '0 0% 83.1%',
    },
  },
  zinc: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--primary': '240 5.9% 10%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--accent': '240 4.8% 95.9%',
      '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--ring': '240 5.9% 10%',
      '--radius': '0.5rem',
    },
    dark: {
      '--background': '240 10% 3.9%',
      '--foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%',
      '--muted-foreground': '240 5% 64.9%',
      '--popover': '240 10% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--card': '240 10% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%',
      '--input': '240 3.7% 15.9%',
      '--primary': '0 0% 98%',
      '--primary-foreground': '240 5.9% 10%',
      '--secondary': '240 3.7% 15.9%',
      '--secondary-foreground': '0 0% 98%',
      '--accent': '240 3.7% 15.9%',
      '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '0 0% 98%',
      '--ring': '240 4.9% 83.9%',
    },
  },
  slate: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '222.2 84% 4.9%',
      '--muted': '210 40% 96.1%',
      '--muted-foreground': '215.4 16.3% 46.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '222.2 84% 4.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '222.2 84% 4.9%',
      '--border': '214.3 31.8% 91.4%',
      '--input': '214.3 31.8% 91.4%',
      '--primary': '222.2 47.4% 11.2%',
      '--primary-foreground': '210 40% 98%',
      '--secondary': '210 40% 96.1%',
      '--secondary-foreground': '222.2 47.4% 11.2%',
      '--accent': '210 40% 96.1%',
      '--accent-foreground': '222.2 47.4% 11.2%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '210 40% 98%',
      '--ring': '222.2 84% 4.9%',
      '--radius': '0.5rem',
    },
    dark: {
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--muted': '217.2 32.6% 17.5%',
      '--muted-foreground': '215 20.2% 65.1%',
      '--popover': '222.2 84% 4.9%',
      '--popover-foreground': '210 40% 98%',
      '--card': '222.2 84% 4.9%',
      '--card-foreground': '210 40% 98%',
      '--border': '217.2 32.6% 17.5%',
      '--input': '217.2 32.6% 17.5%',
      '--primary': '210 40% 98%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--secondary': '217.2 32.6% 17.5%',
      '--secondary-foreground': '210 40% 98%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '210 40% 98%',
      '--ring': '212.7 26.8% 83.9',
    },
  },
  stone: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '20 14.3% 4.1%',
      '--muted': '60 4.8% 95.9%',
      '--muted-foreground': '25 5.3% 44.7%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '20 14.3% 4.1%',
      '--card': '0 0% 100%',
      '--card-foreground': '20 14.3% 4.1%',
      '--border': '20 5.9% 90%',
      '--input': '20 5.9% 90%',
      '--primary': '24 9.8% 10%',
      '--primary-foreground': '60 9.1% 97.8%',
      '--secondary': '60 4.8% 95.9%',
      '--secondary-foreground': '24 9.8% 10%',
      '--accent': '60 4.8% 95.9%',
      '--accent-foreground': '24 9.8% 10%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '60 9.1% 97.8%',
      '--ring': '20 14.3% 4.1%',
      '--radius': '0.95rem',
    },
    dark: {
      '--background': '20 14.3% 4.1%',
      '--foreground': '60 9.1% 97.8%',
      '--muted': '12 6.5% 15.1%',
      '--muted-foreground': '24 5.4% 63.9%',
      '--popover': '20 14.3% 4.1%',
      '--popover-foreground': '60 9.1% 97.8%',
      '--card': '20 14.3% 4.1%',
      '--card-foreground': '60 9.1% 97.8%',
      '--border': '12 6.5% 15.1%',
      '--input': '12 6.5% 15.1%',
      '--primary': '60 9.1% 97.8%',
      '--primary-foreground': '24 9.8% 10%',
      '--secondary': '12 6.5% 15.1%',
      '--secondary-foreground': '60 9.1% 97.8%',
      '--accent': '12 6.5% 15.1%',
      '--accent-foreground': '60 9.1% 97.8%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '60 9.1% 97.8%',
      '--ring': '24 5.7% 82.9%',
    },
  },
  gray: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '224 71.4% 4.1%',
      '--muted': '220 14.3% 95.9%',
      '--muted-foreground': '220 8.9% 46.1%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '224 71.4% 4.1%',
      '--card': '0 0% 100%',
      '--card-foreground': '224 71.4% 4.1%',
      '--border': '220 13% 91%',
      '--input': '220 13% 91%',
      '--primary': '220.9 39.3% 11%',
      '--primary-foreground': '210 20% 98%',
      '--secondary': '220 14.3% 95.9%',
      '--secondary-foreground': '220.9 39.3% 11%',
      '--accent': '220 14.3% 95.9%',
      '--accent-foreground': '220.9 39.3% 11%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '210 20% 98%',
      '--ring': '224 71.4% 4.1%',
      '--radius': '0.35rem',
    },
    dark: {
      '--background': '224 71.4% 4.1%',
      '--foreground': '210 20% 98%',
      '--muted': '215 27.9% 16.9%',
      '--muted-foreground': '217.9 10.6% 64.9%',
      '--popover': '224 71.4% 4.1%',
      '--popover-foreground': '210 20% 98%',
      '--card': '224 71.4% 4.1%',
      '--card-foreground': '210 20% 98%',
      '--border': '215 27.9% 16.9%',
      '--input': '215 27.9% 16.9%',
      '--primary': '210 20% 98%',
      '--primary-foreground': '220.9 39.3% 11%',
      '--secondary': '215 27.9% 16.9%',
      '--secondary-foreground': '210 20% 98%',
      '--accent': '215 27.9% 16.9%',
      '--accent-foreground': '210 20% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '210 20% 98%',
      '--ring': '216 12.2% 83.9%',
    },
  },
}

const COMPONENT_SET_THEME: Record<string, keyof typeof SHADCN_THEME_PRESETS> = {
  'shadcn/vega': 'neutral',
  'shadcn/nova': 'zinc',
  'shadcn/maia': 'stone',
  'shadcn/lyra': 'gray',
  'shadcn/mira': 'slate',
}

const BASE_SANS_STACK = 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif'
const BASE_MONO_STACK = '"Source Code Pro", "Office Code Pro", Menlo, monospace'

const FONT_STACKS: Record<string, { sans: string; mono: string; isMono?: boolean }> = {
  inter: {
    sans: `var(--font-inter), ${BASE_SANS_STACK}`,
    mono: BASE_MONO_STACK,
  },
  'open-sans': {
    sans: `var(--font-open-sans), ${BASE_SANS_STACK}`,
    mono: BASE_MONO_STACK,
  },
  roboto: {
    sans: `var(--font-roboto), ${BASE_SANS_STACK}`,
    mono: BASE_MONO_STACK,
  },
  'noto-sans': {
    sans: `var(--font-noto-sans), ${BASE_SANS_STACK}`,
    mono: BASE_MONO_STACK,
  },
  raleway: {
    sans: `var(--font-raleway), ${BASE_SANS_STACK}`,
    mono: BASE_MONO_STACK,
  },
  geist: {
    sans: `Geist, ${BASE_SANS_STACK}`,
    mono: BASE_MONO_STACK,
  },
  figtree: {
    sans: `Figtree, ${BASE_SANS_STACK}`,
    mono: BASE_MONO_STACK,
  },
  'jetbrains-mono': {
    sans: `"JetBrains Mono", ${BASE_MONO_STACK}`,
    mono: `"JetBrains Mono", ${BASE_MONO_STACK}`,
    isMono: true,
  },
}

const BASE_COLOR_PRESETS = {
  blue: {
    light: {
      '--primary': '221.2 83.2% 53.3%',
      '--primary-foreground': '210 40% 98%',
      '--ring': '221.2 83.2% 53.3%',
      '--accent': '221.2 83.2% 96%',
      '--accent-foreground': '222.2 84% 4.9%',
    },
    dark: {
      '--primary': '217.2 91.2% 59.8%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--ring': '217.2 91.2% 59.8%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
    },
  },
  violet: {
    light: {
      '--primary': '262.1 83.3% 57.8%',
      '--primary-foreground': '210 40% 98%',
      '--ring': '262.1 83.3% 57.8%',
      '--accent': '262.1 83.3% 95%',
      '--accent-foreground': '222.2 84% 4.9%',
    },
    dark: {
      '--primary': '263.4 70% 50.4%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--ring': '263.4 70% 50.4%',
      '--accent': '263.4 28% 17%',
      '--accent-foreground': '210 40% 98%',
    },
  },
  emerald: {
    light: {
      '--primary': '142.1 76.2% 36.3%',
      '--primary-foreground': '210 40% 98%',
      '--ring': '142.1 76.2% 36.3%',
      '--accent': '142.1 76.2% 92%',
      '--accent-foreground': '222.2 84% 4.9%',
    },
    dark: {
      '--primary': '142.1 70.6% 45.3%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--ring': '142.1 70.6% 45.3%',
      '--accent': '142.1 20% 16%',
      '--accent-foreground': '210 40% 98%',
    },
  },
  amber: {
    light: {
      '--primary': '45.9 96.7% 64.3%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--ring': '45.9 96.7% 64.3%',
      '--accent': '45.9 96.7% 92%',
      '--accent-foreground': '222.2 84% 4.9%',
    },
    dark: {
      '--primary': '47.9 95.8% 53.1%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--ring': '47.9 95.8% 53.1%',
      '--accent': '47.9 30% 16%',
      '--accent-foreground': '210 40% 98%',
    },
  },
  rose: {
    light: {
      '--primary': '346.8 77.2% 49.8%',
      '--primary-foreground': '210 40% 98%',
      '--ring': '346.8 77.2% 49.8%',
      '--accent': '346.8 77.2% 94%',
      '--accent-foreground': '222.2 84% 4.9%',
    },
    dark: {
      '--primary': '346.8 77.2% 49.8%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--ring': '346.8 77.2% 49.8%',
      '--accent': '346.8 28% 16%',
      '--accent-foreground': '210 40% 98%',
    },
  },
}

const SPACING_BASE_REM: Record<string, number> = {
  '0.5': 0.125,
  '1': 0.25,
  '1.5': 0.375,
  '2': 0.5,
  '2.5': 0.625,
  '3': 0.75,
  '3.5': 0.875,
  '4': 1,
  '5': 1.25,
  '6': 1.5,
  '7': 1.75,
  '8': 2,
  '9': 2.25,
  '10': 2.5,
  '11': 2.75,
  '12': 3,
  '14': 3.5,
  '16': 4,
  '20': 5,
  '24': 6,
  '28': 7,
  '32': 8,
  '36': 9,
  '40': 10,
  '44': 11,
  '48': 12,
  '52': 13,
  '56': 14,
  '60': 15,
  '64': 16,
  '72': 18,
  '80': 20,
  '96': 24,
}

const COMPONENT_SET_CONFIG: Record<
  string,
  {
    font: keyof typeof FONT_STACKS
    iconLibrary: string
    baseColor: keyof typeof BASE_COLOR_PRESETS
    radius: string
    spacingScale: number
  }
> = {
  'shadcn/vega': {
    font: 'inter',
    iconLibrary: 'lucide',
    baseColor: 'blue',
    radius: '0.5rem',
    spacingScale: 1,
  },
  'shadcn/nova': {
    font: 'inter',
    iconLibrary: 'lucide',
    baseColor: 'blue',
    radius: '0.4rem',
    spacingScale: 0.9,
  },
  'shadcn/maia': {
    font: 'inter',
    iconLibrary: 'lucide',
    baseColor: 'blue',
    radius: '0.6rem',
    spacingScale: 1.05,
  },
  'shadcn/lyra': {
    font: 'inter',
    iconLibrary: 'lucide',
    baseColor: 'blue',
    radius: '0px',
    spacingScale: 0.95,
  },
  'shadcn/mira': {
    font: 'inter',
    iconLibrary: 'lucide',
    baseColor: 'blue',
    radius: '0.3rem',
    spacingScale: 0.85,
  },
}

const COMPONENT_SET_COLOR_MAPPING: Record<string, ShadcnColorMapping> = {
  'shadcn/vega': SHADCN_COLOR_MAPPING_V2,
  'shadcn/nova': SHADCN_COLOR_MAPPING_V2,
  'shadcn/maia': SHADCN_COLOR_MAPPING_V2,
  'shadcn/lyra': SHADCN_COLOR_MAPPING_V2,
  'shadcn/mira': SHADCN_COLOR_MAPPING_V2,
}

const buildFontVariables = (fontKey: keyof typeof FONT_STACKS) => {
  const font = FONT_STACKS[fontKey]
  if (!font) {
    return {}
  }
  return {
    '--font-sans': font.sans,
    '--font-mono': font.mono,
  }
}

const buildSpacingVariables = (scale?: number) => {
  const resolvedScale = typeof scale === 'number' && Number.isFinite(scale) && scale > 0 ? scale : 1
  const vars: Record<string, string> = {}
  Object.entries(SPACING_BASE_REM).forEach(([key, value]) => {
    const scaled = Math.round(value * resolvedScale * 1000) / 1000
    const token = String(key).replace('.', '-')
    vars[`--app-space-${token}`] = `${scaled}rem`
  })
  return vars
}

const normalizeVars = (vars: Record<string, string>) => {
  const cleaned: Record<string, string> = {}
  Object.entries(vars).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      return
    }
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }
    const normalizedKey = key.startsWith('--') ? key : `--${key}`
    cleaned[normalizedKey] = trimmed
  })
  return cleaned
}

const buildRadiiFromRadius = (radius?: string): ThemeRadii => {
  const trimmed = typeof radius === 'string' ? radius.trim() : ''
  if (!trimmed) {
    return { ...DEFAULT_THEME_RADII }
  }
  if (trimmed === '0' || trimmed === '0px' || trimmed === '0rem') {
    return { sm: '0px', md: '0px', lg: '0px', xl: '0px' }
  }
  return {
    sm: `calc(${trimmed} - 4px)`,
    md: trimmed,
    lg: `calc(${trimmed} + 2px)`,
    xl: `calc(${trimmed} + 6px)`,
  }
}

export const getComponentSetPreset = (componentSetId?: string): ComponentSetPreset | null => {
  if (!componentSetId) {
    return null
  }
  const themeKey = COMPONENT_SET_THEME[componentSetId]
  if (!themeKey) {
    return null
  }
  const theme = SHADCN_THEME_PRESETS[themeKey]
  if (!theme) {
    return null
  }

  const config = COMPONENT_SET_CONFIG[componentSetId]
  const light = normalizeVars(theme.light)
  const dark = normalizeVars(theme.dark)
  const baseColorPreset = config?.baseColor ? BASE_COLOR_PRESETS[config.baseColor] : undefined
  if (baseColorPreset?.light) {
    Object.assign(light, baseColorPreset.light)
  }
  if (baseColorPreset?.dark) {
    Object.assign(dark, baseColorPreset.dark)
  }
  if (config?.radius) {
    light['--radius'] = config.radius
    dark['--radius'] = config.radius
  }
  const radius = light['--radius'] ?? dark['--radius']

  const spacingVariables = buildSpacingVariables(config?.spacingScale)
  const fontVariables = config ? buildFontVariables(config.font) : {}

  return {
    shadcnVariables: {
      light: Object.keys(light).length ? light : undefined,
      dark: Object.keys(dark).length ? dark : undefined,
    },
    radii: buildRadiiFromRadius(radius),
    shadcnConfig: config
      ? {
          style: componentSetId.split('/')[1],
          baseColor: config.baseColor,
          font: config.font,
          iconLibrary: config.iconLibrary,
          radius: config.radius,
        }
      : undefined,
    cssVariables:
      Object.keys(fontVariables).length > 0 || Object.keys(spacingVariables).length > 0
        ? { ...fontVariables, ...spacingVariables }
        : undefined,
    colorMapping: COMPONENT_SET_COLOR_MAPPING[componentSetId],
  }
}
