import { AppWindow, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import { useBuilderAppsQuery } from 'data/builder/builder-apps'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  cn,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const BuilderAppDropdown = () => {
  const router = useRouter()
  const { appId } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: apps = [], isPending: isLoadingApps } = useBuilderAppsQuery(
    { projectRef: undefined },
    { enabled: Boolean(organization?.slug || appId) }
  )

  const selectedApp = useMemo(() => apps.find((app) => app.id === appId), [apps, appId])
  const activeOrgSlug = selectedApp?.orgSlug ?? organization?.slug

  const orgApps = useMemo(() => {
    if (!activeOrgSlug) return []
    return apps.filter((app) => app.orgSlug === activeOrgSlug)
  }, [apps, activeOrgSlug])

  const filteredApps = useMemo(() => {
    if (!search) return orgApps
    const normalized = search.toLowerCase()
    return orgApps.filter((app) => app.name.toLowerCase().includes(normalized))
  }, [orgApps, search])

  const buildAppHref = (app: { id: string; projectRef?: string | null }) => {
    const params = new URLSearchParams()
    if (app.projectRef) params.set('ref', app.projectRef)
    params.set('appId', app.id)
    return `/builder?${params.toString()}`
  }

  if (isLoadingApps) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0 text-sm">
        <AppWindow size={14} strokeWidth={1.5} className="text-foreground-lighter" />
        <span
          className={cn(
            'max-w-32 lg:max-w-none truncate',
            selectedApp ? 'text-foreground' : 'text-foreground-lighter'
          )}
        >
          {selectedApp?.name ?? 'Select an app'}
        </span>
      </div>

      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="text"
            size="tiny"
            className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
            iconRight={<ChevronsUpDown strokeWidth={1.5} />}
          />
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_ shouldFilter={false}>
            <CommandInput_Shadcn_
              showResetIcon
              value={search}
              onValueChange={setSearch}
              placeholder="Find app..."
              handleReset={() => setSearch('')}
            />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No apps found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                <ScrollArea className={filteredApps.length > 7 ? 'h-[210px]' : ''}>
                  {filteredApps.map((app) => {
                    const href = buildAppHref(app)
                    return (
                      <CommandItem_Shadcn_
                        key={app.id}
                        value={`${app.name.replaceAll('"', '')}-${app.id}`}
                        className="cursor-pointer w-full"
                        onSelect={() => {
                          setOpen(false)
                          router.push(href)
                        }}
                        onClick={() => setOpen(false)}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="truncate max-w-64">{app.name}</span>
                          {app.id === appId && <Check size={16} />}
                        </div>
                      </CommandItem_Shadcn_>
                    )
                  })}
                </ScrollArea>
              </CommandGroup_Shadcn_>
              <CommandSeparator_Shadcn_ />
              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  className="cursor-pointer w-full"
                  onSelect={() => {
                    setOpen(false)
                    router.push('/builder')
                  }}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span>All apps</span>
                  </div>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
              <CommandSeparator_Shadcn_ />
              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  className="cursor-pointer w-full"
                  onSelect={() => {
                    setOpen(false)
                    router.push('/builder/new')
                  }}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Plus size={14} strokeWidth={1.5} />
                    <span>New app</span>
                  </div>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}
