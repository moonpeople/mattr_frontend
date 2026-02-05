import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

import {
  Badge,
  Button,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  Textarea,
  Input_Shadcn_,
} from 'ui'

import type { BuilderMenuItem, BuilderPage } from './types'

// Inspektor stranitsy: meta, menu, parametry URL i dostup.

interface BuilderPageInspectorProps {
  page: BuilderPage | null
  pages: BuilderPage[]
  onUpdatePage: (patch: Partial<BuilderPage>) => void
  onUpdateMeta: (patch: Partial<BuilderPage['pageMeta']>) => void
  onUpdateMenu: (items: BuilderMenuItem[]) => void
}

export const BuilderPageInspector = ({
  page,
  pages,
  onUpdatePage,
  onUpdateMeta,
  onUpdateMenu,
}: BuilderPageInspectorProps) => {
  // Pustoi state bez vybrannoi stranitsy.
  if (!page) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-foreground-muted">
        <div className="text-sm font-medium text-foreground">Create a page</div>
        <div>Add a page from the left panel to configure it here.</div>
      </div>
    )
  }

  // Sobrannye dannye dlya formy: meta, params i url preview.
  const menuItems = page.menu?.items ?? []
  const meta = page.pageMeta ?? {}
  const searchParams = meta.searchParams ?? []
  const hashParams = meta.hashParams ?? []
  const shortcuts = meta.shortcuts ?? []
  const previewBase = typeof window !== 'undefined' ? window.location.origin : ''
  const urlSlug = meta.url ?? ''
  const urlPreview = previewBase ? `${previewBase}/${urlSlug}` : `/${urlSlug}`
  const nextItem = () => ({ label: 'New item', to: '/', policy: [] })
  const updateItems = (items: BuilderMenuItem[]) => onUpdateMenu(items)
  const prevNameRef = useRef(page.name)
  const nameBeforeEditRef = useRef(page.name)

  const nameTaken = useMemo(() => {
    const normalized = page.name.trim().toLowerCase()
    if (!normalized) {
      return false
    }
    return pages.some(
      (entry) => entry.id !== page.id && entry.name.trim().toLowerCase() === normalized
    )
  }, [page.id, page.name, pages])
  const nameEmpty = page.name.trim().length === 0
  const nameError = nameEmpty ? 'Page title is required' : nameTaken ? 'Page title already exists' : ''

  const existingUrls = useMemo(() => {
    const urls = new Set<string>()
    pages.forEach((entry) => {
      if (entry.id === page.id) {
        return
      }
      const entryMeta = entry.pageMeta ?? {}
      const url = entryMeta.url ?? slugifyPageUrl(entry.name)
      if (!url) {
        return
      }
      urls.add(url)
    })
    return urls
  }, [page.id, pages])

  const ensureUniqueUrl = useCallback(
    (value: string, { allowEmpty = false }: { allowEmpty?: boolean } = {}) => {
      const base = allowEmpty ? slugifyPageUrlInput(value) : slugifyPageUrl(value)
      if (!base && allowEmpty) {
        return ''
      }
      if (!existingUrls.has(base)) {
        return base
      }
      let index = 2
      while (existingUrls.has(`${base}-${index}`)) {
        index += 1
      }
      return `${base}-${index}`
    },
    [existingUrls]
  )

  useEffect(() => {
    if (!page.name || page.name === prevNameRef.current) {
      return
    }
    const prevName = prevNameRef.current
    prevNameRef.current = page.name
    const currentUrl = meta.url
    if (currentUrl === '') {
      return
    }
    const prevSlug = slugifyPageUrl(prevName)
    if (currentUrl == null || currentUrl === prevSlug) {
      const nextUrl = ensureUniqueUrl(page.name)
      if (nextUrl !== currentUrl) {
        onUpdateMeta({ url: nextUrl })
      }
    }
  }, [ensureUniqueUrl, meta.url, onUpdateMeta, page.name])

  useEffect(() => {
    nameBeforeEditRef.current = page.name
  }, [page.id])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-xs font-semibold">Page settings</div>
          <div className="text-[11px] text-foreground-muted">{page.id}</div>
        </div>
        <Badge>{page.access ?? 'auth'}</Badge>
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
        <div className="space-y-2">
          <div className="text-[11px] uppercase text-foreground-muted">Content</div>
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted">Page title</div>
            <Input_Shadcn_
              value={page.name}
              onChange={(event) => {
                const value = event.target.value
                onUpdatePage({ name: value })
                onUpdateMeta({ title: value })
              }}
              onFocus={() => {
                nameBeforeEditRef.current = page.name
              }}
              onBlur={() => {
                if (!nameError) {
                  return
                }
                const fallback = nameBeforeEditRef.current || 'Page'
                onUpdatePage({ name: fallback })
                onUpdateMeta({ title: fallback })
              }}
              aria-invalid={Boolean(nameError)}
              className="h-7"
            />
            {nameError && (
              <div className="text-[11px] text-destructive">{nameError}</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted">Browser title</div>
            <Input_Shadcn_
              value={meta.browserTitle ?? ''}
              onChange={(event) => onUpdateMeta({ browserTitle: event.target.value })}
              className="h-7"
            />
          </div>
        <div className="space-y-2">
          <div className="text-xs text-foreground-muted">Page URL</div>
          <Input_Shadcn_
            value={meta.url ?? ''}
            onChange={(event) =>
              onUpdateMeta({ url: slugifyPageUrlInput(event.target.value) })
            }
            onBlur={() => {
              const nextUrl = ensureUniqueUrl(meta.url ?? '', { allowEmpty: true })
              if (nextUrl !== (meta.url ?? '')) {
                onUpdateMeta({ url: nextUrl })
              }
            }}
            aria-invalid={meta.url === ''}
            className="h-7"
          />
          {meta.url === '' && (
            <div className="text-[11px] text-destructive">
              Page URL is required
            </div>
          )}
        </div>
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted">URL preview</div>
            <Textarea value={urlPreview} readOnly />
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase text-foreground-muted">
              Set URL search parameters
            </div>
            <Button
              type="text"
              size="tiny"
              icon={<Plus size={14} />}
              onClick={() =>
                onUpdateMeta({
                  searchParams: [...searchParams, { key: '', value: '' }],
                })
              }
            >
              Add
            </Button>
          </div>
          {searchParams.length === 0 ? (
            <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-2.5 text-xs text-foreground-muted">
              No params
            </div>
          ) : (
            <div className="space-y-2">
              {searchParams.map((param, index) => (
                <ParamRow
                  key={`search-${index}`}
                  param={param}
                  onChange={(patch) => {
                    const next = [...searchParams]
                    next[index] = { ...next[index], ...patch }
                    onUpdateMeta({ searchParams: next })
                  }}
                  onRemove={() => {
                    const next = searchParams.filter((_, itemIndex) => itemIndex !== index)
                    onUpdateMeta({ searchParams: next })
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase text-foreground-muted">
              Set URL hash parameters
            </div>
            <Button
              type="text"
              size="tiny"
              icon={<Plus size={14} />}
              onClick={() =>
                onUpdateMeta({
                  hashParams: [...hashParams, { key: '', value: '' }],
                })
              }
            >
              Add
            </Button>
          </div>
          {hashParams.length === 0 ? (
            <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-2.5 text-xs text-foreground-muted">
              No params
            </div>
          ) : (
            <div className="space-y-2">
              {hashParams.map((param, index) => (
                <ParamRow
                  key={`hash-${index}`}
                  param={param}
                  onChange={(patch) => {
                    const next = [...hashParams]
                    next[index] = { ...next[index], ...patch }
                    onUpdateMeta({ hashParams: next })
                  }}
                  onRemove={() => {
                    const next = hashParams.filter((_, itemIndex) => itemIndex !== index)
                    onUpdateMeta({ hashParams: next })
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase text-foreground-muted">Custom shortcuts</div>
            <Button
              type="text"
              size="tiny"
              icon={<Plus size={14} />}
              onClick={() =>
                onUpdateMeta({
                  shortcuts: [
                    ...shortcuts,
                    { name: 'Shortcut', shortcut: 'Cmd+K', action: '' },
                  ],
                })
              }
            >
              Add
            </Button>
          </div>
          {shortcuts.length === 0 ? (
            <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-2.5 text-xs text-foreground-muted">
              No custom shortcuts
            </div>
          ) : (
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <ShortcutRow
                  key={`shortcut-${index}`}
                  shortcut={shortcut}
                  onChange={(patch) => {
                    const next = [...shortcuts]
                    next[index] = { ...next[index], ...patch }
                    onUpdateMeta({ shortcuts: next })
                  }}
                  onRemove={() => {
                    const next = shortcuts.filter((_, itemIndex) => itemIndex !== index)
                    onUpdateMeta({ shortcuts: next })
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="text-[11px] uppercase text-foreground-muted">Access</div>
          <Select_Shadcn_
            value={page.access ?? 'auth'}
            onValueChange={(value) => onUpdatePage({ access: value })}
          >
            <SelectTrigger_Shadcn_ className="h-7">
              <SelectValue_Shadcn_ placeholder="Select access" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="auth">Auth only</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="public">Public</SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase text-foreground-muted">Menu</div>
            <Button
              type="outline"
              size="tiny"
              icon={<Plus size={14} />}
              onClick={() => updateItems([...menuItems, nextItem()])}
            >
              Add item
            </Button>
          </div>
          <div className="space-y-2">
            {menuItems.length === 0 && (
              <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-3 text-xs text-foreground-muted">
                No menu items yet.
              </div>
            )}
            {menuItems.map((item, index) => (
              <MenuItemEditor
                key={`menu-${index}`}
                item={item}
                depth={0}
                path={[index]}
                siblingsCount={menuItems.length}
                onChangeItem={(path, patch) => {
                  updateItems(updateMenuItem(menuItems, path, (entry) => ({ ...entry, ...patch })))
                }}
                onRemoveItem={(path) => updateItems(removeMenuItem(menuItems, path))}
                onAddChild={(path) =>
                  updateItems(
                    updateMenuItem(menuItems, path, (entry) => ({
                      ...entry,
                      items: [...(entry.items ?? []), nextItem()],
                    }))
                  )
                }
                onMoveItem={(path, direction) =>
                  updateItems(moveMenuItem(menuItems, path, direction))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const MenuItemEditor = ({
  item,
  depth,
  path,
  siblingsCount,
  onChangeItem,
  onRemoveItem,
  onAddChild,
  onMoveItem,
}: {
  item: BuilderMenuItem
  depth: number
  path: number[]
  siblingsCount: number
  onChangeItem: (path: number[], patch: Partial<BuilderMenuItem>) => void
  onRemoveItem: (path: number[]) => void
  onAddChild: (path: number[]) => void
  onMoveItem: (path: number[], direction: 'up' | 'down') => void
}) => {
  const policyValue = item.policy?.join(', ') ?? ''
  const canMoveUp = path[path.length - 1] > 0
  const canMoveDown = path[path.length - 1] < siblingsCount - 1

  return (
    <div
      className="space-y-2 rounded-lg border border-foreground-muted/30 bg-surface-100 p-2"
      style={{ marginLeft: depth * 12 }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase text-foreground-muted">Menu item</div>
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="tiny"
            icon={<ArrowUp size={14} />}
            onClick={() => onMoveItem(path, 'up')}
            disabled={!canMoveUp}
          />
          <Button
            type="text"
            size="tiny"
            icon={<ArrowDown size={14} />}
            onClick={() => onMoveItem(path, 'down')}
            disabled={!canMoveDown}
          />
          <Button type="text" size="tiny" icon={<Plus size={14} />} onClick={() => onAddChild(path)}>
            Child
          </Button>
          <Button
            type="text"
            size="tiny"
            icon={<Trash2 size={14} />}
            onClick={() => onRemoveItem(path)}
          >
            Remove
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Label</div>
        <Input_Shadcn_
          value={item.label ?? ''}
          onChange={(event) => onChangeItem(path, { label: event.target.value })}
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Path</div>
        <Input_Shadcn_
          value={item.to ?? ''}
          onChange={(event) => onChangeItem(path, { to: event.target.value })}
          placeholder="/projects"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Icon (lucide name)</div>
        <Input_Shadcn_
          value={item.icon ?? ''}
          onChange={(event) => onChangeItem(path, { icon: event.target.value })}
          placeholder="LayoutDashboard"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Badge</div>
        <Input_Shadcn_
          value={item.badge ?? ''}
          onChange={(event) => onChangeItem(path, { badge: event.target.value })}
          placeholder="{{ queries.count.data }}"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Policy keys</div>
        <Input_Shadcn_
          value={policyValue}
          onChange={(event) => {
            const policies = event.target.value
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
            onChangeItem(path, { policy: policies })
          }}
          placeholder="project.read, project.update"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Visible when</div>
        <Textarea
          value={item.visibleWhen ?? ''}
          onChange={(event) => onChangeItem(path, { visibleWhen: event.target.value })}
          placeholder={'{{ policy.allow("project.read") }}'}
        />
      </div>
      {item.items && item.items.length > 0 && (
        <div className="space-y-2">
          {item.items.map((child, index) => (
            <MenuItemEditor
              key={`menu-${path.join('.')}-${index}`}
              item={child}
              depth={depth + 1}
              path={[...path, index]}
              siblingsCount={item.items?.length ?? 0}
              onChangeItem={onChangeItem}
              onRemoveItem={onRemoveItem}
              onAddChild={onAddChild}
              onMoveItem={onMoveItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const ParamRow = ({
  param,
  onChange,
  onRemove,
}: {
  param: { key: string; value: string }
  onChange: (patch: Partial<{ key: string; value: string }>) => void
  onRemove: () => void
}) => {
  return (
    <div className="flex items-center gap-2">
      <Input_Shadcn_
        value={param.key}
        onChange={(event) => onChange({ key: event.target.value })}
        placeholder="key"
        className="h-7"
      />
      <Input_Shadcn_
        value={param.value}
        onChange={(event) => onChange({ value: event.target.value })}
        placeholder="value"
        className="h-7"
      />
      <Button type="text" size="tiny" icon={<Trash2 size={14} />} onClick={onRemove} />
    </div>
  )
}

const ShortcutRow = ({
  shortcut,
  onChange,
  onRemove,
}: {
  shortcut: { name: string; shortcut: string; action: string }
  onChange: (patch: Partial<{ name: string; shortcut: string; action: string }>) => void
  onRemove: () => void
}) => {
  return (
    <div className="space-y-2 rounded-md border border-foreground-muted/30 bg-surface-100 p-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase text-foreground-muted">Shortcut</div>
        <Button type="text" size="tiny" icon={<Trash2 size={14} />} onClick={onRemove} />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Name</div>
        <Input_Shadcn_
          value={shortcut.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Open palette"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Shortcut</div>
        <Input_Shadcn_
          value={shortcut.shortcut}
          onChange={(event) => onChange({ shortcut: event.target.value })}
          placeholder="Cmd+K"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Action</div>
        <Input_Shadcn_
          value={shortcut.action}
          onChange={(event) => onChange({ action: event.target.value })}
          placeholder="runQuery('getUsers')"
          className="h-7"
        />
      </div>
    </div>
  )
}

const CYRILLIC_TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  і: 'i',
  ї: 'yi',
  є: 'ye',
  ґ: 'g',
}

const transliterateCyrillic = (value: string) =>
  value
    .split('')
    .map((char) => {
      const lower = char.toLowerCase()
      return CYRILLIC_TRANSLIT[lower] ?? char
    })
    .join('')

const slugifyPageUrlInput = (value: string) => {
  const normalized = transliterateCyrillic(value)
  const trimmed = normalized.trim()
  if (!trimmed) {
    return ''
  }
  return (
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || ''
  )
}

const slugifyPageUrl = (value: string) => {
  const normalized = transliterateCyrillic(value)
  return (
    normalized
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'page'
  )
}

const updateMenuItem = (
  items: BuilderMenuItem[],
  path: number[],
  update: (item: BuilderMenuItem) => BuilderMenuItem
): BuilderMenuItem[] => {
  if (path.length === 0) {
    return items
  }

  const [index, ...rest] = path
  return items.map((item, idx) => {
    if (idx !== index) {
      return item
    }
    if (rest.length === 0) {
      return update(item)
    }
    return {
      ...item,
      items: updateMenuItem(item.items ?? [], rest, update),
    }
  })
}

const removeMenuItem = (items: BuilderMenuItem[], path: number[]): BuilderMenuItem[] => {
  if (path.length === 0) {
    return items
  }

  const [index, ...rest] = path
  if (rest.length === 0) {
    return items.filter((_, idx) => idx !== index)
  }

  return items.map((item, idx) => {
    if (idx !== index) {
      return item
    }
    return {
      ...item,
      items: removeMenuItem(item.items ?? [], rest),
    }
  })
}

const moveMenuItem = (
  items: BuilderMenuItem[],
  path: number[],
  direction: 'up' | 'down'
): BuilderMenuItem[] => {
  if (path.length === 0) {
    return items
  }

  const [index, ...rest] = path
  if (rest.length === 0) {
    const next = [...items]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) {
      return items
    }
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  }

  return items.map((item, idx) => {
    if (idx !== index) {
      return item
    }
    return {
      ...item,
      items: moveMenuItem(item.items ?? [], rest, direction),
    }
  })
}
