import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'

import {
  Button,
  Checkbox_Shadcn_,
  Input_Shadcn_,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import type { BuilderApp } from 'data/builder/builder-apps'
import { useDeleteBuilderAppMutation, useUpdateBuilderAppMutation } from 'data/builder/builder-apps'

type BuilderSidebarPanelSettingsProps = {
  appId?: string
  appName?: string
  apps?: BuilderApp[]
  projectRef?: string
  onAppNameChange?: (name: string) => void
  onClose?: () => void
}

type SettingsSectionId =
  | 'general'
  | 'custom-components'
  | 'custom-css'
  | 'preloaded-js'
  | 'libraries'
  | 'app-theme'
  | 'notifications'

type ThemeTabId = 'color' | 'typography' | 'metrics' | 'shadows'

type ThemeColorKey =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'canvas'
  | 'surfacePrimary'
  | 'surfaceSecondary'
  | 'borderPrimary'
  | 'borderSecondary'
  | 'textDark'
  | 'textLight'
  | 'statusDanger'
  | 'statusInfo'
  | 'statusWarning'
  | 'statusSuccess'
  | 'statusHighlight'

type ThemeColorItem = {
  key: ThemeColorKey
  label: string
  description: string
  placeholder?: string
  disabled?: boolean
}

const SETTINGS_SECTIONS: { id: SettingsSectionId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'custom-components', label: 'Custom Components' },
  { id: 'custom-css', label: 'Custom CSS' },
  { id: 'preloaded-js', label: 'Preloaded JS' },
  { id: 'libraries', label: 'Libraries' },
  { id: 'app-theme', label: 'App theme' },
  { id: 'notifications', label: 'Notifications' },
]

const DEFAULT_THEME_COLORS: Record<ThemeColorKey, string> = {
  primary: '3170F9',
  secondary: '',
  tertiary: '',
  canvas: 'F6F6F6',
  surfacePrimary: 'FFFFFF',
  surfaceSecondary: 'FFFFFF',
  borderPrimary: 'Generated',
  borderSecondary: 'Generated',
  textDark: '0D0D0D',
  textLight: 'FFFFFF',
  statusDanger: 'DC2626',
  statusInfo: '3170F9',
  statusWarning: 'CD6F00',
  statusSuccess: '059669',
  statusHighlight: 'FDE68A',
}

const THEME_COLOR_GROUPS: { title: string; items: ThemeColorItem[] }[] = [
  {
    title: 'Core',
    items: [
      {
        key: 'primary',
        label: 'Primary',
        description: 'Default accent color used by the majority of components.',
      },
      {
        key: 'secondary',
        label: 'Secondary',
        description:
          "Optional secondary color, available as a swatch in the component Style editor. Components won't use this color by default.",
        placeholder: 'No color',
      },
      {
        key: 'tertiary',
        label: 'Tertiary',
        description:
          "Optional tertiary color, available as a swatch in the component Style editor. Components won't use this color by default.",
        placeholder: 'No color',
      },
      {
        key: 'canvas',
        label: 'Canvas',
        description: 'Default background color for the entire app.',
      },
      {
        key: 'surfacePrimary',
        label: 'Primary surface',
        description: 'Default background color for Containers and Tables.',
      },
      {
        key: 'surfaceSecondary',
        label: 'Secondary surface',
        description: 'Default background color for Inputs.',
      },
      {
        key: 'borderPrimary',
        label: 'Primary border',
        description: 'Default border color for Containers and Tables.',
        disabled: true,
      },
      {
        key: 'borderSecondary',
        label: 'Secondary border',
        description: 'Default border color for Inputs.',
        disabled: true,
      },
    ],
  },
  {
    title: 'Text',
    items: [
      {
        key: 'textDark',
        label: 'Dark text',
        description: 'Text color to provide contrast against light backgrounds.',
      },
      {
        key: 'textLight',
        label: 'Light text',
        description: 'Text color to provide contrast against dark backgrounds.',
      },
    ],
  },
  {
    title: 'Status',
    items: [
      {
        key: 'statusDanger',
        label: 'Danger',
        description: 'Default color for validation, errors, and negative trends.',
      },
      {
        key: 'statusInfo',
        label: 'Info',
        description: 'Default color for neutral information like an edited cell in a Table.',
      },
      {
        key: 'statusWarning',
        label: 'Warning',
        description: 'Default color used to indicate a warning.',
      },
      {
        key: 'statusSuccess',
        label: 'Success',
        description: 'Default color used to indicate success and positive trends.',
      },
      {
        key: 'statusHighlight',
        label: 'Highlight',
        description: 'Default color for highlighting matches in a searchable list.',
      },
    ],
  },
]

const TYPE_STYLES = [
  { label: 'Heading 1', value: 'Inter 700 36px' },
  { label: 'Heading 2', value: 'Inter 700 28px' },
  { label: 'Heading 3', value: 'Inter 700 24px' },
  { label: 'Heading 4', value: 'Inter 700 18px' },
  { label: 'Heading 5', value: 'Inter 700 16px' },
  { label: 'Heading 6', value: 'Inter 700 14px' },
  { label: 'Label', value: 'Inter 500 12px' },
  { label: 'Label emphasized', value: 'Inter 600 12px' },
  { label: 'Body', value: 'Inter 400 12px' },
]

const DEFAULT_AUTO_COLORS = ['FDE68A', 'EECFF3', 'A7F3D0', 'BFDBFE', 'C7D2FE', 'FECACA', 'FCD6BB']

const swatchFromValue = (value: string) => {
  if (!value) {
    return 'transparent'
  }
  if (value === 'Generated' || value === 'No color') {
    return 'transparent'
  }
  return value.startsWith('#') ? value : `#${value}`
}

const SettingsRow = ({
  title,
  description,
  control,
}: {
  title: string
  description?: ReactNode
  control: ReactNode
}) => {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-foreground-muted/20 py-3 last:border-b-0">
      <div className="space-y-1">
        <div className="text-[13px] font-medium text-foreground">{title}</div>
        {description && (
          <div className="text-[12px] text-foreground-muted">{description}</div>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  )
}

const EmptyPanel = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) => {
  return (
    <div className="rounded-md border border-dashed border-foreground-muted/30 bg-surface-50 px-6 py-10 text-center">
      <div className="text-[13px] font-medium text-foreground">{title}</div>
      <div className="mt-1 text-[12px] text-foreground-muted">{description}</div>
      {actionLabel && (
        <Button
          type="default"
          size="tiny"
          className="mt-4"
          onClick={() => onAction?.()}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

const ColorInput = ({
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  disabled?: boolean
}) => {
  const swatch = swatchFromValue(value || placeholder || '')
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-5 w-5 rounded border border-foreground-muted/30"
        style={{ backgroundColor: swatch }}
      />
      <Input_Shadcn_
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-7 w-24 text-[11px]"
        disabled={disabled}
      />
      <Input_Shadcn_ value="100%" disabled className="h-7 w-14 text-[11px]" />
    </div>
  )
}

export const BuilderSidebarPanelSettings = ({
  appId,
  appName,
  apps = [],
  projectRef,
  onAppNameChange,
  onClose,
}: BuilderSidebarPanelSettingsProps) => {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('general')
  const [themeTab, setThemeTab] = useState<ThemeTabId>('color')
  const [showThemeBanner, setShowThemeBanner] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [markdownLinkBehavior, setMarkdownLinkBehavior] = useState<
    'automatic' | 'new-tab' | 'current-tab'
  >('automatic')
  const [showQueryStatus, setShowQueryStatus] = useState(false)
  const [enableMobileLayout, setEnableMobileLayout] = useState(true)
  const [showLoadingState, setShowLoadingState] = useState(true)

  const [themeColors, setThemeColors] = useState<Record<ThemeColorKey, string>>(
    DEFAULT_THEME_COLORS
  )
  const [autoColors, setAutoColors] = useState(DEFAULT_AUTO_COLORS)
  const [borderRadius, setBorderRadius] = useState('4px')
  const [lowShadow, setLowShadow] = useState('0 0 2px 1px')
  const [mediumShadow, setMediumShadow] = useState('0 0 5px 1px')
  const [highShadow, setHighShadow] = useState('0 4px 16px 0')
  const [draftName, setDraftName] = useState(appName ?? '')
  const nameBeforeEditRef = useRef(appName ?? '')

  const deleteAppMutation = useDeleteBuilderAppMutation({
    onSuccess: async () => {
      toast.success(`Deleted ${appName ?? 'app'}`)
      if (projectRef) {
        await router.push(`/builder?ref=${projectRef}`)
      } else {
        await router.push('/builder')
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const updateAppMutation = useUpdateBuilderAppMutation({
    onError: (error) => {
      toast.error(error.message)
    },
  })

  useEffect(() => {
    setDraftName(appName ?? '')
    nameBeforeEditRef.current = appName ?? ''
  }, [appName])

  const nameEmpty = draftName.trim().length === 0
  const nameTaken = useMemo(() => {
    const normalized = draftName.trim().toLowerCase()
    if (!normalized) {
      return false
    }
    return apps.some((app) => {
      if (appId && app.id === appId) {
        return false
      }
      return app.name.trim().toLowerCase() === normalized
    })
  }, [appId, apps, draftName])
  const nameError = nameEmpty ? 'Name is required' : nameTaken ? 'Name already exists' : ''
  const canEditName = Boolean(appId)

  const updateThemeColor = (key: ThemeColorKey, value: string) => {
    setThemeColors((prev) => ({ ...prev, [key]: value }))
  }

  const addAutoColor = () => {
    setAutoColors((prev) => [...prev, 'FFFFFF'])
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="builder-panel-header flex h-9 items-center justify-between border-b border-foreground-muted/30 bg-surface-200 px-3 text-[11px] font-semibold">
        <span>App settings</span>
        <Button type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1">
        <div className="w-44 border-r border-foreground-muted/20 bg-background">
          <ScrollArea className="h-full px-2 py-3">
            <div className="space-y-1">
              {SETTINGS_SECTIONS.map((section) => {
                const isActive = section.id === activeSection
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center rounded-md px-2 py-1.5 text-xs font-medium transition',
                      isActive
                        ? 'bg-surface-200 text-foreground'
                        : 'text-foreground-muted hover:bg-surface-200 hover:text-foreground'
                    )}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-5 py-4">
            {activeSection === 'general' && (
              <div className="space-y-3">
                <SettingsRow
                  title="App name"
                  description="Used in lists and as the default app title."
                  control={
                    <div className="flex flex-col items-end">
                      <Input_Shadcn_
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onFocus={() => {
                          nameBeforeEditRef.current = draftName
                        }}
                        onBlur={() => {
                          if (!canEditName) {
                            return
                          }
                          if (nameError) {
                            const fallback = nameBeforeEditRef.current || appName || 'App'
                            setDraftName(fallback)
                            return
                          }
                          const nextName = draftName.trim()
                          if (!appId || nextName === (appName ?? '')) {
                            return
                          }
                          updateAppMutation.mutate(
                            { appId, name: nextName },
                            {
                              onSuccess: () => {
                                nameBeforeEditRef.current = nextName
                                onAppNameChange?.(nextName)
                              },
                              onError: () => {
                                const fallback = nameBeforeEditRef.current || appName || 'App'
                                setDraftName(fallback)
                              },
                            }
                          )
                        }}
                        aria-invalid={Boolean(nameError)}
                        className="h-7 w-40 text-[11px]"
                        disabled={!canEditName}
                      />
                      {nameError && (
                        <div className="mt-1 text-[10px] text-destructive">
                          {nameError}
                        </div>
                      )}
                    </div>
                  }
                />
                <SettingsRow
                  title="Configure Markdown link behavior"
                  description="Links outside your organization open in a new tab by default."
                  control={
                    <Select_Shadcn_
                      value={markdownLinkBehavior}
                      onValueChange={(next) =>
                        setMarkdownLinkBehavior(next as typeof markdownLinkBehavior)
                      }
                    >
                      <SelectTrigger_Shadcn_ className="h-7 w-40">
                        <SelectValue_Shadcn_ placeholder="Automatic" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="automatic">Automatic</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="new-tab">New tab</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="current-tab">Current tab</SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  }
                />
                <SettingsRow
                  title="Show query status to viewers"
                  description="Query run status is always available to editors in the status bar."
                  control={
                    <Checkbox_Shadcn_
                      checked={showQueryStatus}
                      onCheckedChange={(checked) => setShowQueryStatus(Boolean(checked))}
                    />
                  }
                />
                <SettingsRow
                  title="Enable mobile layout"
                  description={
                    <>
                      Hide or show components when viewport is less than 600px.{' '}
                      <a className="text-brand-link hover:underline" href="#">
                        Learn more.
                      </a>
                    </>
                  }
                  control={
                    <Checkbox_Shadcn_
                      checked={enableMobileLayout}
                      onCheckedChange={(checked) => setEnableMobileLayout(Boolean(checked))}
                    />
                  }
                />
                <SettingsRow
                  title="Show loading state"
                  description="Display a loading indicator while the data is being loaded."
                  control={
                    <Checkbox_Shadcn_
                      checked={showLoadingState}
                      onCheckedChange={(checked) => setShowLoadingState(Boolean(checked))}
                    />
                  }
                />
                <div className="rounded-md border border-foreground-muted/30 bg-surface-100 px-4 py-3">
                  <div className="text-[13px] font-semibold text-foreground">Danger zone</div>
                  <div className="mt-1 text-[12px] text-foreground-muted">
                    Deleting an app removes all builder data for it. This action cannot be undone.
                  </div>
                  <div className="mt-3">
                    <Button
                      type="danger"
                      size="tiny"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={!appId}
                    >
                      Delete app
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'app-theme' && (
              <div className="space-y-6">
                {showThemeBanner && (
                  <div className="flex items-start justify-between gap-4 rounded-md border border-foreground-muted/20 bg-surface-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-500/10 text-brand">
                        <div className="h-6 w-6 rounded-sm border border-brand-500/30 bg-brand-500/20" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[13px] font-medium text-foreground">
                          Create themes once, use them everywhere.
                        </div>
                        <div className="text-[12px] text-foreground-muted">
                          Easily save and reuse theme settings across your organization with
                          advanced typography controls, component styling, and dynamic theme
                          modes-starting in our Business plan.{' '}
                          <a className="text-brand-link hover:underline" href="#">
                            Learn more
                          </a>
                          .
                        </div>
                      </div>
                    </div>
                    <Button
                      type="text"
                      size="tiny"
                      className="text-foreground-muted"
                      icon={<X size={14} />}
                      onClick={() => setShowThemeBanner(false)}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-[15px] font-semibold text-foreground">App theme</div>
                  <div className="text-[12px] text-foreground-muted">
                    Create a unique theme within this app. This theme cannot be reused in other
                    apps.
                  </div>
                </div>

                <Tabs_Shadcn_ value={themeTab} onValueChange={(value) => setThemeTab(value as ThemeTabId)}>
                  <TabsList_Shadcn_ className="w-full justify-start gap-4 border-b border-foreground-muted/20 bg-transparent px-0">
                    <TabsTrigger_Shadcn_ value="color" className="px-0 text-xs">
                      Color
                    </TabsTrigger_Shadcn_>
                    <TabsTrigger_Shadcn_ value="typography" className="px-0 text-xs">
                      Typography
                    </TabsTrigger_Shadcn_>
                    <TabsTrigger_Shadcn_ value="metrics" className="px-0 text-xs">
                      Metrics
                    </TabsTrigger_Shadcn_>
                    <TabsTrigger_Shadcn_ value="shadows" className="px-0 text-xs">
                      Shadows
                    </TabsTrigger_Shadcn_>
                  </TabsList_Shadcn_>

                  <TabsContent_Shadcn_ value="color" className="mt-5 space-y-6">
                    {THEME_COLOR_GROUPS.map((group) => (
                      <div key={group.title} className="space-y-2">
                        <div className="text-[13px] font-medium text-foreground">{group.title}</div>
                        <div className="rounded-md border border-foreground-muted/20 bg-background">
                          {group.items.map((item) => (
                            <SettingsRow
                              key={item.key}
                              title={item.label}
                              description={item.description}
                              control={
                                <ColorInput
                                  value={themeColors[item.key]}
                                  onChange={(value) => updateThemeColor(item.key, value)}
                                  placeholder={item.placeholder}
                                  disabled={item.disabled}
                                />
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[13px] font-medium text-foreground">
                        <span>Automatic colors</span>
                        <Button
                          type="text"
                          size="tiny"
                          className="text-brand-link"
                          icon={<Plus size={14} />}
                          onClick={addAutoColor}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="rounded-md border border-foreground-muted/20 bg-background">
                        <div className="space-y-2 px-3 py-3 text-[12px] text-foreground-muted">
                          <div className="text-[12px] font-medium text-foreground">Colors</div>
                          <div className="space-y-2">
                            {autoColors.map((color, index) => (
                              <div key={`${color}-${index}`} className="flex items-center gap-3">
                                <span
                                  className="h-5 w-5 rounded border border-foreground-muted/30"
                                  style={{ backgroundColor: swatchFromValue(color) }}
                                />
                                <span className="text-[12px] text-foreground-muted">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent_Shadcn_>

                  <TabsContent_Shadcn_ value="typography" className="mt-5 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] font-medium text-foreground">Fonts</div>
                      <Button type="text" size="tiny" className="text-brand-link" icon={<Plus size={14} />}>
                        Add
                      </Button>
                    </div>
                    <div className="rounded-md border border-foreground-muted/20 bg-background p-3 text-[12px] text-foreground">
                      <div className="flex items-center gap-2">
                        <span>Inter</span>
                        <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[10px] text-foreground-muted">
                          Default
                        </span>
                      </div>
                      <div className="mt-2 text-foreground-muted">Jetbrains Mono NL</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[13px] font-medium text-foreground">Type styles</div>
                      <div className="rounded-md border border-foreground-muted/20 bg-background">
                        {TYPE_STYLES.map((style, index) => (
                          <div
                            key={style.label}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 text-[12px]',
                              index !== TYPE_STYLES.length - 1 && 'border-b border-foreground-muted/20'
                            )}
                          >
                            <span className="text-foreground-muted">{style.label}</span>
                            <span className="text-foreground-muted">{style.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent_Shadcn_>

                  <TabsContent_Shadcn_ value="metrics" className="mt-5 space-y-4">
                    <div className="text-[13px] font-medium text-foreground">Metrics</div>
                    <SettingsRow
                      title="Border radius"
                      description="Default border radius used by the majority of components."
                      control={
                        <Input_Shadcn_
                          value={borderRadius}
                          onChange={(event) => setBorderRadius(event.target.value)}
                          className="h-7 w-24 text-[11px]"
                        />
                      }
                    />
                  </TabsContent_Shadcn_>

                  <TabsContent_Shadcn_ value="shadows" className="mt-5 space-y-4">
                    <div className="text-[13px] font-medium text-foreground">Shadows</div>
                    <SettingsRow
                      title="Low elevation"
                      description="For subtle separation from the base layer."
                      control={
                        <Input_Shadcn_
                          value={lowShadow}
                          onChange={(event) => setLowShadow(event.target.value)}
                          className="h-7 w-28 text-[11px]"
                        />
                      }
                    />
                    <SettingsRow
                      title="Medium elevation"
                      description="For mid-level hierarchy and interactivity."
                      control={
                        <Input_Shadcn_
                          value={mediumShadow}
                          onChange={(event) => setMediumShadow(event.target.value)}
                          className="h-7 w-28 text-[11px]"
                        />
                      }
                    />
                    <SettingsRow
                      title="High elevation"
                      description="For prominent, focus-driven elements."
                      control={
                        <Input_Shadcn_
                          value={highShadow}
                          onChange={(event) => setHighShadow(event.target.value)}
                          className="h-7 w-28 text-[11px]"
                        />
                      }
                    />
                  </TabsContent_Shadcn_>
                </Tabs_Shadcn_>
              </div>
            )}

            {activeSection === 'custom-components' && (
              <div className="space-y-3">
                <div>
                  <div className="text-[15px] font-semibold text-foreground">
                    Custom component libraries
                  </div>
                  <div className="text-[12px] text-foreground-muted">
                    Import your own React components.{' '}
                    <a className="text-brand-link hover:underline" href="#">
                      Learn more.
                    </a>
                  </div>
                </div>
                <EmptyPanel
                  title="No custom components added"
                  description="Add custom components to reuse them across your app."
                  actionLabel="Read the docs"
                />
              </div>
            )}

            {activeSection === 'custom-css' && (
              <EmptyPanel
                title="Custom CSS"
                description="Add custom style overrides for this app. This section will be available soon."
              />
            )}

            {activeSection === 'preloaded-js' && (
              <EmptyPanel
                title="Preloaded JS"
                description="Add global functions or variables by assigning them to the window scope."
              />
            )}

            {activeSection === 'libraries' && (
              <div className="space-y-3">
                <div>
                  <div className="text-[15px] font-semibold text-foreground">Libraries</div>
                  <div className="text-[12px] text-foreground-muted">
                    Add access to custom libraries in this application.{' '}
                    <a className="text-brand-link hover:underline" href="#">
                      Learn more.
                    </a>
                  </div>
                </div>
                <EmptyPanel
                  title="No libraries added"
                  description="Click Add new to add a new library."
                />
                <div className="flex justify-end">
                  <Button type="default" size="tiny">
                    Add new
                  </Button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <EmptyPanel
                title="Notifications"
                description="Control notifications that show to end users while using your app."
              />
            )}
          </div>
        </ScrollArea>
      </div>

      <TextConfirmModal
        visible={showDeleteModal}
        loading={deleteAppMutation.isPending}
        title={`Confirm deletion of ${appName ?? 'this app'}`}
        variant="destructive"
        alert={{
          title: 'This action cannot be undone.',
          description: 'All app pages, queries, and versions will be deleted.',
        }}
        text={`This will permanently delete ${appName ?? 'this app'} and all of its data.`}
        confirmPlaceholder="Type the app name in here"
        confirmString={appName ?? ''}
        confirmLabel="I understand, delete this app"
        onConfirm={() => {
          if (!appId) {
            return
          }
          deleteAppMutation.mutate({ appId, projectRef })
          setShowDeleteModal(false)
        }}
        onCancel={() => {
          if (!deleteAppMutation.isPending) {
            setShowDeleteModal(false)
          }
        }}
      />
    </div>
  )
}
