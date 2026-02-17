/**
 * Экран выбора/создания builder-приложений, когда appId еще не выбран.
 */
import { Grid, List, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'
import type { UseFormReturn } from 'react-hook-form'

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogSection, DialogSectionSeparator, DialogTitle as DialogTitleText, FormControl_Shadcn_, FormField_Shadcn_, FormItem_Shadcn_, FormLabel_Shadcn_, FormMessage_Shadcn_, Form_Shadcn_, Input_Shadcn_, SelectContent_Shadcn_, SelectItem_Shadcn_, SelectTrigger_Shadcn_, SelectValue_Shadcn_, Select_Shadcn_, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ToggleGroup, ToggleGroupItem, Badge, Card } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyStatePresentational } from 'ui-patterns'

import { NoSearchResults } from 'components/ui/NoSearchResults'
import CardButton from 'components/ui/CardButton'
import type { BuilderApp } from 'data/builder/builder-apps'

export interface BuilderAppsCatalogViewProps {
  apps: BuilderApp[]
  sortedApps: BuilderApp[]
  normalizedSearch: string
  noSearchResults: boolean
  search: string
  setSearch: (value: string) => void
  viewMode: 'grid' | 'table'
  setViewMode?: (value: 'grid' | 'table') => void
  canOpenCreateApp: boolean
  canSubmitCreateApp: boolean
  fullFormHref: string
  projectRef?: string | null
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
  createForm: UseFormReturn<{ name: string; orgSlug: string }>
  onCreateApp: (values: { name: string; orgSlug?: string }) => void
  createAppPending: boolean
  createAppErrorMessage?: string
  organizations: Array<{ slug: string; name: string }>
  isOrganizationsLoading: boolean
  setSelectedOrgSlug: (slug: string) => void
}

export const BuilderAppsCatalogView = ({
  apps,
  sortedApps,
  normalizedSearch,
  noSearchResults,
  search,
  setSearch,
  viewMode,
  setViewMode,
  canOpenCreateApp,
  canSubmitCreateApp,
  fullFormHref,
  projectRef,
  isCreateOpen,
  setIsCreateOpen,
  createForm,
  onCreateApp,
  createAppPending,
  createAppErrorMessage,
  organizations,
  isOrganizationsLoading,
  setSelectedOrgSlug,
}: BuilderAppsCatalogViewProps) => {
  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search for an app"
              icon={<Search />}
              size="tiny"
              className="w-32 md:w-64"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              actions={[
                search && (
                  <Button
                    key="clear"
                    size="tiny"
                    type="text"
                    icon={<X />}
                    onClick={() => setSearch('')}
                    className="h-5 w-5 p-0"
                  />
                ),
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            {setViewMode && (
              <ToggleGroup
                type="single"
                size="small"
                value={viewMode}
                onValueChange={(value) => {
                  if (value === 'grid' || value === 'table') {
                    setViewMode(value)
                  }
                }}
              >
                <ToggleGroupItem value="grid" size="small" className="h-[26px] w-[26px] p-0">
                  <Grid size={14} strokeWidth={1.5} />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" size="small" className="h-[26px] w-[26px] p-0">
                  <List size={14} strokeWidth={1.5} />
                </ToggleGroupItem>
              </ToggleGroup>
            )}
            <Button
              type="primary"
              size="tiny"
              icon={<Plus />}
              onClick={() => setIsCreateOpen(true)}
              disabled={!canOpenCreateApp}
            >
              Create app
            </Button>
            <Button asChild type="default" size="tiny">
              <Link href={fullFormHref}>Open full form</Link>
            </Button>
          </div>
        </div>

        {apps.length === 0 && !normalizedSearch ? (
          <EmptyStatePresentational
            title="Create a builder app"
            description="Start designing interfaces with widgets, pages, and menus."
          >
            <Button
              type="default"
              size="tiny"
              icon={<Plus />}
              onClick={() => setIsCreateOpen(true)}
              disabled={!canOpenCreateApp}
            >
              Create app
            </Button>
          </EmptyStatePresentational>
        ) : noSearchResults ? (
          <NoSearchResults searchString={search} />
        ) : viewMode === 'table' ? (
          <Card className="flex-1 min-h-0 overflow-y-auto mb-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedApps.map((app) => {
                  const appProjectRef = app.projectRef ?? projectRef
                  const appHref = appProjectRef
                    ? `/builder?ref=${appProjectRef}&appId=${app.id}`
                    : `/builder?appId=${app.id}`

                  return (
                    <TableRow key={app.id}>
                      <TableCell className="max-w-[240px]">
                        <Link href={appHref} className="block text-sm text-foreground truncate">
                          {app.name}
                        </Link>
                        <div className="text-xs text-foreground-muted truncate">{app.id}</div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground-muted">
                        {app.projectRef ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-muted">{app.orgSlug}</TableCell>
                      <TableCell className="text-xs text-foreground-muted">
                        {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="flex flex-col gap-y-2 md:gap-y-4 pb-6">
            <ul className="min-h-0 w-full mx-auto grid grid-cols-1 gap-2 md:gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {sortedApps.map((app) => {
                const appProjectRef = app.projectRef ?? projectRef
                const appHref = appProjectRef
                  ? `/builder?ref=${appProjectRef}&appId=${app.id}`
                  : `/builder?appId=${app.id}`

                return (
                  <li key={app.id} className="list-none h-min">
                    <CardButton
                      linkHref={appHref}
                      className="h-44 !px-0 group pt-5 pb-0"
                      title={
                        <div className="w-full flex flex-col gap-y-4 justify-between px-5">
                          <div className="flex flex-col gap-y-0.5">
                            <h5 className="text-sm flex-shrink truncate pr-5">{app.name}</h5>
                            <p className="text-sm text-foreground-lighter">{app.id}</p>
                          </div>
                          <div className="flex items-center gap-x-1.5">
                            <Badge>{app.projectRef ?? 'No project'}</Badge>
                            <Badge>{app.orgSlug}</Badge>
                          </div>
                        </div>
                      }
                      footer={
                        <div className="px-5 pb-4 text-xs text-foreground-muted">
                          Updated {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : '—'}
                        </div>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent size="medium">
          <Form_Shadcn_ {...createForm}>
            <form
              id="builder-create-app"
              onSubmit={createForm.handleSubmit(onCreateApp)}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitleText>Create builder app</DialogTitleText>
                <DialogDescription>Give your app a name to start building.</DialogDescription>
              </DialogHeader>
              <DialogSectionSeparator />
              <DialogSection>
                <FormField_Shadcn_
                  name="name"
                  control={createForm.control}
                  rules={{ required: 'App name is required' }}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_>App name</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="Interface name" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
                {!projectRef && (
                  <FormField_Shadcn_
                    name="orgSlug"
                    control={createForm.control}
                    rules={{ required: 'Organization is required' }}
                    render={({ field }) => (
                      <FormItem_Shadcn_>
                        <FormLabel_Shadcn_>Organization</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Select_Shadcn_
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              setSelectedOrgSlug(value)
                            }}
                          >
                            <SelectTrigger_Shadcn_>
                              <SelectValue_Shadcn_
                                placeholder={
                                  isOrganizationsLoading
                                    ? 'Loading organizations...'
                                    : 'Select an organization'
                                }
                              />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              {organizations.map((org) => (
                                <SelectItem_Shadcn_ key={org.slug} value={org.slug}>
                                  {org.name}
                                </SelectItem_Shadcn_>
                              ))}
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                )}
                {createAppErrorMessage && (
                  <p className="text-sm text-destructive">{createAppErrorMessage}</p>
                )}
              </DialogSection>
              <DialogFooter>
                <Button
                  type="default"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createAppPending}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createAppPending}
                  disabled={!canSubmitCreateApp || createAppPending}
                >
                  Create app
                </Button>
              </DialogFooter>
            </form>
          </Form_Shadcn_>
        </DialogContent>
      </Dialog>
    </>
  )
}
