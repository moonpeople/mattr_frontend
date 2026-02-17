import type { CSSProperties } from 'react'
import { cn } from 'ui'

import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import { getWidgetIconComponent } from '../icon-library'

export type LegacyNavigationItem = {
  label: string
  to?: string
}

export type NavigationProps = {
  items: string
  variant: 'horizontal' | 'vertical'
  showPath: boolean
  itemMode?: 'static' | 'dynamic'
  data?: unknown
  labels?: string
  menuItems?: unknown
  _labels?: unknown
  iconByIndex?: unknown
  _iconByIndex?: unknown
  captionByIndex?: unknown
  _captionByIndex?: unknown
  tooltipByIndex?: unknown
  _tooltipByIndex?: unknown
  parentKeyByIndex?: unknown
  _parentKeyByIndex?: unknown
  highlightByIndex?: unknown
  _highlightByIndex?: unknown
  hiddenByIndex?: unknown
  _hiddenByIndex?: unknown
  disabledByIndex?: unknown
  _disabledByIndex?: unknown
  orientation?: 'horizontal' | 'vertical'
  horizontalAlignment?: 'left' | 'center' | 'right'
  margin?: string
  overflowMode?: 'scroll' | 'wrap'
  events?: string
  logo?: string
  src?: string
  disabled?: boolean
  addons?: string[]
  styles?: string[]
  textColor?: string
  activeTextColor?: string
  activeBackground?: string
  hoverBackground?: string
  iconColor?: string
  activeIconColor?: string
  itemBorderRadius?: string
}

export type ResolvedNavigationItem = {
  id: string
  label: string
  path?: string
  iconName?: string
  caption?: string
  tooltip?: string
  parentKey?: string
  depth?: number
  hidden?: boolean
  disabled?: boolean
  highlighted?: boolean
  raw: unknown
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const resolveTemplateValue = (rawValue: string, context: Record<string, unknown>): unknown => {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return rawValue
  }

  const evaluateExpression = (expression: string) => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('context', `with (context) { return (${expression}); }`)
      return fn(context)
    } catch {
      return undefined
    }
  }

  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    const expression = trimmed.slice(2, -2).trim()
    const evaluated = evaluateExpression(expression)
    return typeof evaluated === 'undefined' ? rawValue : evaluated
  }

  return rawValue.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (match, expression) => {
    const evaluated = evaluateExpression(String(expression).trim())
    if (typeof evaluated === 'undefined') {
      return match
    }
    return String(evaluated)
  })
}

const normalizeIndexArray = <T,>(value: unknown): T[] =>
  normalizeArray<T>(parseMaybeJson(value), [])

const parseBooleanValue = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }
    if (['false', '0', 'no', 'n', ''].includes(normalized)) {
      return false
    }
  }
  return false
}

const resolveIconComponent = (iconName?: string, iconLibrary?: string) =>
  getWidgetIconComponent(iconName, iconLibrary)

const resolveDataArray = (value: unknown, context: Record<string, unknown>): unknown[] => {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string') {
    const resolved = resolveTemplateValue(value, context)
    if (Array.isArray(resolved)) {
      return resolved
    }
    if (typeof resolved === 'string') {
      return normalizeArray(parseMaybeJson(resolved), [])
    }
  }
  return normalizeArray(parseMaybeJson(value), [])
}

export const NavigationDefinition = createWidgetDefinition<NavigationProps>({
  type: 'Navigation',
  label: 'Navigation',
  category: 'navigation',
  description: 'Menu links and routes',
  defaultProps: {
    itemMode: 'static',
    _labels: ['Home', 'Customers', 'Settings'],
    _iconByIndex: ['bold/interface-home-3', 'bold/interface-user-multiple', 'bold/interface-setting-cog'],
    _captionByIndex: ['', '', ''],
    _tooltipByIndex: ['', '', ''],
    _parentKeyByIndex: ['', '', ''],
    menuItems: JSON.stringify(['Home', 'Customers', 'Settings'], null, 2),
    orientation: 'horizontal',
    horizontalAlignment: 'left',
    margin: '4px 8px',
    overflowMode: 'scroll',
    addons: [],
    styles: [],
    items: JSON.stringify(
      [
        { label: 'Page 1', to: '/page1' },
        { label: 'Page 2', to: '/page2' },
        { label: 'Settings', to: '/settings' },
      ],
      null,
      2
    ),
    variant: 'vertical',
    showPath: false,
    events: '[]',
    textColor: '',
    activeTextColor: '',
    activeBackground: '',
    hoverBackground: '',
    iconColor: '',
    activeIconColor: '',
    itemBorderRadius: '',
  },
  builder: {
    eventOptions: [{ value: 'click', label: 'Click' }],
  },
  render: (props, context) => {
    const baseContext = context?.evaluationContext ?? {}
    const hasModernConfig =
      typeof props.itemMode === 'string' ||
      typeof props.data !== 'undefined' ||
      typeof props.labels === 'string' ||
      typeof props.menuItems !== 'undefined' ||
      typeof props._labels !== 'undefined' ||
      typeof props.iconByIndex !== 'undefined' ||
      typeof props._iconByIndex !== 'undefined' ||
      typeof props.orientation === 'string' ||
      typeof props.margin === 'string'

    const parsedLegacyItems = normalizeArray<LegacyNavigationItem>(parseMaybeJson(props.items), [])
    const legacyFallback: LegacyNavigationItem[] = [
      { label: 'Page 1', to: '/page1' },
      { label: 'Page 2', to: '/page2' },
    ]
    const legacyItems = parsedLegacyItems.length > 0 ? parsedLegacyItems : legacyFallback

    const staticLabels = normalizeIndexArray<string>(props._labels)
    const staticIcons = normalizeIndexArray<string>(props._iconByIndex)
    const staticCaptions = normalizeIndexArray<string>(props._captionByIndex)
    const staticTooltips = normalizeIndexArray<string>(props._tooltipByIndex)
    const staticParents = normalizeIndexArray<string>(props._parentKeyByIndex)
    const staticHidden = normalizeIndexArray<unknown>(props._hiddenByIndex)
    const staticDisabled = normalizeIndexArray<unknown>(props._disabledByIndex)
    const staticHighlight = normalizeIndexArray<unknown>(props._highlightByIndex)
    const dynamicIcons = normalizeIndexArray<string>(props.iconByIndex)
    const dynamicCaptions = normalizeIndexArray<unknown>(props.captionByIndex)
    const dynamicTooltips = normalizeIndexArray<unknown>(props.tooltipByIndex)
    const dynamicParents = normalizeIndexArray<unknown>(props.parentKeyByIndex)
    const dynamicHidden = normalizeIndexArray<unknown>(props.hiddenByIndex)
    const dynamicDisabled = normalizeIndexArray<unknown>(props.disabledByIndex)
    const dynamicHighlight = normalizeIndexArray<unknown>(props.highlightByIndex)

    const itemMode = props.itemMode === 'dynamic' ? 'dynamic' : 'static'
    const dataItems = resolveDataArray(props.data, baseContext)
    const manualItems = normalizeArray<unknown>(parseMaybeJson(props.menuItems), [])
    const hasManualItems = manualItems.length > 0
    const fallbackStaticLabels = staticLabels.length > 0 ? staticLabels : ['Home', 'Customers', 'Settings']
    const usesDynamicItems = itemMode === 'dynamic' && dataItems.length > 0
    const staticSourceItems = hasManualItems
      ? manualItems
      : staticLabels.length > 0
        ? staticLabels
        : parsedLegacyItems.length > 0
          ? parsedLegacyItems
          : fallbackStaticLabels
    const sourceItems = usesDynamicItems ? dataItems : staticSourceItems
    const labelTemplate = typeof props.labels === 'string' ? props.labels : ''
    const itemMargin = typeof props.margin === 'string' ? props.margin : ''
    const hasItemMargin = itemMargin.trim().length > 0
    const isWidgetDisabled = parseBooleanValue(props.disabled)
    const logoSrc = normalizeString(props.logo ?? props.src, '')
    const showLogo = logoSrc.trim().length > 0
    const textColor = normalizeString(props.textColor, '')
    const activeTextColor = normalizeString(props.activeTextColor, '')
    const activeBackground = normalizeString(props.activeBackground, '')
    const hoverBackground = normalizeString(props.hoverBackground, '')
    const iconColor = normalizeString(props.iconColor, '')
    const activeIconColor = normalizeString(props.activeIconColor, '')
    const itemBorderRadius = normalizeString(props.itemBorderRadius, '')

    const orientation = props.orientation ?? props.variant ?? 'vertical'
    const isHorizontal = orientation === 'horizontal'
    const alignment =
      props.horizontalAlignment === 'center'
        ? 'justify-center'
        : props.horizontalAlignment === 'right'
          ? 'justify-end'
          : 'justify-start'
    const overflowMode = props.overflowMode ?? 'scroll'

    const resolvedItems: ResolvedNavigationItem[] = hasModernConfig
      ? sourceItems.map((raw, index) => {
          const rawObject = isPlainObject(raw) ? raw : null
          const fallbackLabel = normalizeString(
            rawObject?.title ??
              rawObject?.label ??
              rawObject?.name ??
              rawObject?.id ??
              rawObject?.value ??
              raw,
            staticLabels[index] ?? `Item ${index + 1}`
          )
          const itemContextValue = rawObject
            ? {
                ...rawObject,
                id:
                  rawObject.id ??
                  rawObject.key ??
                  rawObject.value ??
                  rawObject.title ??
                  rawObject.label ??
                  rawObject.name ??
                  `${index + 1}`,
              }
            : {
                id: String(raw ?? index + 1),
                title: fallbackLabel,
                label: fallbackLabel,
                value: raw,
              }
          const itemContext = {
            ...baseContext,
            item: itemContextValue,
            index,
          }

          const resolvedLabel = labelTemplate ? resolveTemplateValue(labelTemplate, itemContext) : undefined
          const label = normalizeString(resolvedLabel, fallbackLabel)
          const resolvedIconValue =
            typeof props.iconByIndex === 'string' && dynamicIcons.length === 0
              ? resolveTemplateValue(props.iconByIndex, itemContext)
              : undefined
          const resolvedCaptionValue =
            typeof props.captionByIndex === 'string' && dynamicCaptions.length === 0
              ? resolveTemplateValue(props.captionByIndex, itemContext)
              : dynamicCaptions[index]
          const resolvedTooltipValue =
            typeof props.tooltipByIndex === 'string' && dynamicTooltips.length === 0
              ? resolveTemplateValue(props.tooltipByIndex, itemContext)
              : dynamicTooltips[index]
          const resolvedParentValue =
            typeof props.parentKeyByIndex === 'string' && dynamicParents.length === 0
              ? resolveTemplateValue(props.parentKeyByIndex, itemContext)
              : dynamicParents[index]
          const iconName = normalizeString(
            resolvedIconValue ??
              dynamicIcons[index] ??
              staticIcons[index] ??
              rawObject?.icon ??
              rawObject?.iconName,
            ''
          )
          const resolvedHighlightValue =
            typeof props.highlightByIndex === 'string' && dynamicHighlight.length === 0
              ? resolveTemplateValue(props.highlightByIndex, itemContext)
              : dynamicHighlight[index]
          const highlighted = parseBooleanValue(
            resolvedHighlightValue ??
              rawObject?.highlight ??
              rawObject?.highlighted ??
              rawObject?.active ??
              staticHighlight[index]
          )
          const resolvedHiddenValue =
            typeof props.hiddenByIndex === 'string' && dynamicHidden.length === 0
              ? resolveTemplateValue(props.hiddenByIndex, itemContext)
              : dynamicHidden[index]
          const hidden = parseBooleanValue(resolvedHiddenValue ?? rawObject?.hidden ?? staticHidden[index])
          const resolvedDisabledValue =
            typeof props.disabledByIndex === 'string' && dynamicDisabled.length === 0
              ? resolveTemplateValue(props.disabledByIndex, itemContext)
              : dynamicDisabled[index]
          const disabled = parseBooleanValue(
            resolvedDisabledValue ?? rawObject?.disabled ?? staticDisabled[index]
          )

          const caption = normalizeString(
            resolvedCaptionValue ?? rawObject?.caption ?? staticCaptions[index],
            ''
          )
          const tooltip = normalizeString(
            resolvedTooltipValue ?? rawObject?.tooltip ?? staticTooltips[index],
            ''
          )
          const parentKey = normalizeString(
            resolvedParentValue ??
              rawObject?.parentKey ??
              rawObject?.parent ??
              rawObject?.parentLabel ??
              staticParents[index],
            ''
          )

          const itemId = normalizeString(itemContextValue.id, `item-${index + 1}`)

          return {
            id: itemId,
            label: label || `Item ${index + 1}`,
            iconName: iconName || undefined,
            caption: caption || undefined,
            tooltip: tooltip || undefined,
            parentKey: parentKey || undefined,
            highlighted,
            hidden,
            disabled,
            raw,
          }
        })
      : legacyItems.map((item, index) => ({
          id: item.label || `item-${index + 1}`,
          label: item.label || `Item ${index + 1}`,
          path: item.to,
          highlighted: index === 0,
          raw: item,
        }))

    const visibleItems = resolvedItems.filter((item) => !item.hidden)
    const itemLookup = new Map<string, ResolvedNavigationItem>()
    resolvedItems.forEach((item) => {
      if (item.id) {
        itemLookup.set(item.id, item)
      }
      if (item.label) {
        itemLookup.set(item.label, item)
      }
    })
    const resolveDepth = (item: ResolvedNavigationItem) => {
      if (!item.parentKey) {
        return 0
      }
      let depth = 0
      let current: ResolvedNavigationItem | undefined = item
      const visited = new Set<string>()
      while (current?.parentKey && depth < 5) {
        if (visited.has(current.parentKey)) {
          break
        }
        visited.add(current.parentKey)
        const parent = itemLookup.get(current.parentKey)
        if (!parent) {
          break
        }
        depth += 1
        current = parent
      }
      return depth
    }
    const containerClass = cn(
      'w-full',
      isHorizontal ? `flex items-center ${alignment}` : 'flex flex-col items-start',
      isHorizontal && overflowMode === 'scroll' ? 'overflow-x-auto' : '',
      isHorizontal && overflowMode !== 'scroll' ? 'flex-wrap' : '',
      !isHorizontal ? 'overflow-y-auto' : '',
      !hasItemMargin ? 'gap-1' : 'gap-0'
    )

    return (
      <nav className={containerClass}>
        {showLogo && (
          <div className={cn('shrink-0', isHorizontal ? 'mr-3' : 'mb-2 w-full')}>
            <img src={logoSrc} alt="logo" className={cn('h-6 w-auto', isHorizontal ? '' : 'max-w-full')} />
          </div>
        )}
        {visibleItems.map((item, index) => {
          const IconComponent = resolveIconComponent(item.iconName, context?.iconLibrary)
          const isActive = Boolean(item.highlighted)
          const depth = !isHorizontal ? resolveDepth(item) : 0
          const isDisabled = isWidgetDisabled || item.disabled
          const hoverClass = hoverBackground ? 'hover:bg-[var(--nav-hover-bg)]' : 'hover:bg-muted'
          const itemClass = cn(
            'flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm transition',
            isHorizontal ? 'whitespace-nowrap' : 'w-full',
            isActive
              ? 'bg-brand-500/10 text-foreground'
              : `text-muted-foreground hover:border-border/40 ${hoverClass}`,
            isDisabled ? 'pointer-events-none opacity-50' : ''
          )
          const itemStyle: CSSProperties = {
            ...(hasItemMargin ? { margin: itemMargin } : {}),
            ...(depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : {}),
            ...(itemBorderRadius ? { borderRadius: itemBorderRadius } : {}),
            ...(isActive && activeBackground ? { backgroundColor: activeBackground } : {}),
            ...(hoverBackground ? ({ ['--nav-hover-bg' as any]: hoverBackground } as CSSProperties) : {}),
          }
          const labelStyle: CSSProperties | undefined =
            isActive && activeTextColor
              ? { color: activeTextColor }
              : textColor
                ? { color: textColor }
                : undefined
          const iconTint =
            isActive && activeIconColor
              ? activeIconColor
              : iconColor
                ? iconColor
                : activeTextColor && isActive
                  ? activeTextColor
                  : ''

          return (
            <button
              key={`${item.id}-${index}`}
              type="button"
              className={itemClass}
              style={itemStyle}
              aria-current={isActive ? 'page' : undefined}
              disabled={isDisabled}
              title={item.tooltip}
              onClick={() => context?.runActions?.('click', { item: item.raw, index, id: item.id })}
            >
              {IconComponent && (
                <IconComponent
                  className={cn(
                    'h-4 w-4',
                    iconTint ? '' : isActive ? 'text-brand-600' : 'text-muted-foreground/70'
                  )}
                  style={iconTint ? ({ color: iconTint } as CSSProperties) : undefined}
                />
              )}
              <div className="flex flex-col items-start text-left">
                <span className="font-medium text-foreground" style={labelStyle}>
                  {item.label}
                </span>
                {item.caption && <span className="text-xs text-muted-foreground">{item.caption}</span>}
                {props.showPath && item.path && (
                  <span className="text-xs text-muted-foreground">{item.path}</span>
                )}
              </div>
            </button>
          )})}
      </nav>
    )
  },
})
