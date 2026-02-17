const WIDGET_ALIASES: Record<string, string> = {
  NavigationWidget2: 'Navigation',
}

export const normalizeWidgetType = (type: string) => {
  const trimmed = type.trim()
  const base = trimmed.split(/[.:/]/).pop() || trimmed
  const alias = WIDGET_ALIASES[base]
  if (alias) {
    return alias
  }
  if (base.endsWith('Widget2')) {
    return base.slice(0, -'Widget2'.length)
  }
  if (base.endsWith('Widget')) {
    return base.slice(0, -'Widget'.length)
  }
  return base
}
