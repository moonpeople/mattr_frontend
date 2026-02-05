import { Menu, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { SidebarContent } from 'components/interfaces/Sidebar'
import { useI18n } from 'lib/i18n'
import { IS_PLATFORM } from 'lib/constants'
import { Button, cn } from 'ui'
import { CommandMenuTrigger } from 'ui-patterns'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'

export const ICON_SIZE = 20
export const ICON_STROKE_WIDTH = 1.5

const MobileNavigationBar = ({ hideMobileMenu }: { hideMobileMenu?: boolean }) => {
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { ref: projectRef } = useParams()
  const { t } = useI18n()

  return (
    <div className="h-14 w-full flex flex-row md:hidden">
      <nav
        className={cn(
          'group px-4 z-10 w-full h-14',
          'border-b bg-dash-sidebar border-default shadow-xl',
          'transition-width duration-200',
          'hide-scrollbar flex flex-row items-center justify-between overflow-x-auto'
        )}
      >
        <a
          href={IS_PLATFORM ? '/organizations' : `/project/${projectRef}`}
          className="flex items-center h-[26px] w-[26px] min-w-[26px]"
        >
          <img
            alt="Mattr"
            src={`${router.basePath}/img/mattr-logo.svg`}
            className="absolute h-[26px] w-[26px] cursor-pointer rounded"
          />
        </a>
        <div className="flex gap-2">
          <CommandMenuTrigger>
            <button
              className={cn(
                'group',
                'flex-grow h-[30px] rounded-md',
                'p-2',
                'flex items-center justify-between',
                'bg-transparent border-none text-foreground-lighter',
                'hover:bg-opacity-100 hover:border-strong hover:text-foreground-light',
                'focus-visible:!outline-4 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
                'transition'
              )}
            >
              <div className="flex items-center space-x-2">
                <Search size={18} strokeWidth={2} />
              </div>
            </button>
          </CommandMenuTrigger>
          {!hideMobileMenu && (
            <Button
              title={t('common.openMenu')}
              type="default"
              className="flex lg:hidden border-default bg-surface-100/75 text-foreground-light rounded-md min-w-[30px] w-[30px] h-[30px] data-[state=open]:bg-overlay-hover/30"
              icon={<Menu />}
              onClick={() => setIsSheetOpen(true)}
            />
          )}
        </div>
      </nav>
      <MobileSheetNav open={isSheetOpen} onOpenChange={setIsSheetOpen} data-state="expanded">
        <SidebarContent />
      </MobileSheetNav>
    </div>
  )
}

export default MobileNavigationBar
