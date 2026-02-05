import { usePathname } from 'next/navigation'

export function useHideSidebar() {
  const pathname = usePathname() ?? ''

  const shouldHide =
    pathname.startsWith('/account') ||
    pathname.startsWith('/new') ||
    pathname.startsWith('/support') ||
    pathname === '/organizations' ||
    pathname === '/sign-in' ||
    pathname === '/' ||
    pathname === '/apps' ||
    pathname === '/apps/' ||
    pathname === '/apps/builder' ||
    pathname === '/apps/builder/' ||
    pathname === '/apps/builder/new' ||
    pathname === '/builder' ||
    pathname === '/builder/' ||
    pathname === '/builder/new'

  return shouldHide
}
