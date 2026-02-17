export type LegacyButtonVariant =
  | 'primary'
  | 'default'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'destructive'
  | 'ghost'
  | 'link'

export type LegacyButtonSize = 'tiny' | 'small' | 'medium' | 'icon'

export const mapLegacyButtonVariant = (
  value: string | undefined
): 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link' => {
  const normalized = (value ?? 'default').trim().toLowerCase()
  if (normalized === 'primary') return 'default'
  if (normalized === 'secondary') return 'secondary'
  if (normalized === 'outline') return 'outline'
  if (normalized === 'danger' || normalized === 'destructive') return 'destructive'
  if (normalized === 'ghost') return 'ghost'
  if (normalized === 'link') return 'link'
  if (normalized === 'default') return 'secondary'
  return 'secondary'
}

export const mapLegacyButtonSize = (
  value: string | undefined
): 'sm' | 'default' | 'lg' | 'icon' => {
  const normalized = (value ?? 'small').trim().toLowerCase()
  if (normalized === 'tiny') return 'sm'
  if (normalized === 'small') return 'default'
  if (normalized === 'medium') return 'lg'
  if (normalized === 'icon') return 'icon'
  return 'default'
}
