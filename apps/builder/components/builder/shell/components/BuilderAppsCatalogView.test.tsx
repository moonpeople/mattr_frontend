/**
 * Smoke-тесты экрана выбора/создания builder-приложений.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { BuilderAppsCatalogView, type BuilderAppsCatalogViewProps } from './BuilderAppsCatalogView'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

const appRecord = {
  id: 'app_1',
  name: 'Internal app',
  orgSlug: 'acme',
  projectRef: 'project_1',
  theme: null,
  insertedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const Harness = (props: Partial<BuilderAppsCatalogViewProps>) => {
  const form = useForm<{ name: string; orgSlug: string }>({
    defaultValues: {
      name: 'Draft app',
      orgSlug: '',
    },
  })

  const baseProps: BuilderAppsCatalogViewProps = {
    apps: [appRecord],
    sortedApps: [appRecord],
    normalizedSearch: '',
    noSearchResults: false,
    search: '',
    setSearch: vi.fn(),
    viewMode: 'grid',
    setViewMode: vi.fn(),
    canOpenCreateApp: true,
    canSubmitCreateApp: true,
    fullFormHref: '/builder/new',
    projectRef: 'project_1',
    isCreateOpen: false,
    setIsCreateOpen: vi.fn(),
    createForm: form,
    onCreateApp: vi.fn(),
    createAppPending: false,
    createAppErrorMessage: '',
    organizations: [{ slug: 'acme', name: 'Acme' }],
    isOrganizationsLoading: false,
    setSelectedOrgSlug: vi.fn(),
  }

  return <BuilderAppsCatalogView {...baseProps} {...props} createForm={form} />
}

describe('BuilderAppsCatalogView', () => {
  it('updates search and opens create dialog from toolbar action', () => {
    const setSearch = vi.fn()
    const setIsCreateOpen = vi.fn()

    render(<Harness setSearch={setSearch} setIsCreateOpen={setIsCreateOpen} />)

    fireEvent.change(screen.getByPlaceholderText('Search for an app'), {
      target: { value: 'internal' },
    })

    expect(setSearch).toHaveBeenCalledWith('internal')

    fireEvent.click(screen.getAllByRole('button', { name: 'Create app' })[0])

    expect(setIsCreateOpen).toHaveBeenCalledWith(true)
  })

  it('submits create app form when dialog is open', async () => {
    const onCreateApp = vi.fn()

    render(
      <Harness
        apps={[]}
        sortedApps={[]}
        isCreateOpen
        onCreateApp={onCreateApp}
        canOpenCreateApp={false}
      />
    )

    const dialog = screen.getByRole('dialog')
    const createButtons = within(dialog).getAllByRole('button', { name: 'Create app' })
    fireEvent.click(createButtons[createButtons.length - 1])

    await waitFor(() => {
      expect(onCreateApp).toHaveBeenCalled()
      expect(onCreateApp.mock.calls[0]?.[0]).toEqual({
        name: 'Draft app',
        orgSlug: '',
      })
    })
  })
})
