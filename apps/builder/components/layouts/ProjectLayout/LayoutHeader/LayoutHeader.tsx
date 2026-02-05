import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useIsBranching2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Connect } from 'components/interfaces/Connect/Connect'
import { LocalDropdown } from 'components/interfaces/LocalDropdown'
import { UserDropdown } from 'components/interfaces/UserDropdown'
import { AdvisorButton } from 'components/layouts/AppLayout/AdvisorButton'
import { AssistantButton } from 'components/layouts/AppLayout/AssistantButton'
import { BuilderAppDropdown } from 'components/layouts/AppLayout/BuilderAppDropdown'
import { InlineEditorButton } from 'components/layouts/AppLayout/InlineEditorButton'
import { OrganizationDropdown } from 'components/layouts/AppLayout/OrganizationDropdown'
import { ProjectDropdown } from 'components/layouts/AppLayout/ProjectDropdown'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useI18n } from 'lib/i18n'
import { IS_PLATFORM } from 'lib/constants'
import { useRouter } from 'next/router'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { CommandMenuTriggerInput } from 'ui-patterns'
import { BreadcrumbsView } from './BreadcrumbsView'
import { FeedbackDropdown } from './FeedbackDropdown/FeedbackDropdown'
import { HelpPopover } from './HelpPopover'
import { HomeIcon } from './HomeIcon'
import { LocalVersionPopover } from './LocalVersionPopover'
import MergeRequestButton from './MergeRequestButton'

const LayoutHeaderDivider = ({ className, ...props }: React.HTMLProps<HTMLSpanElement>) => (
  <span className={cn('text-border-stronger pr-2', className)} {...props}>
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <path d="M16 3.549L7.12 20.600" />
    </svg>
  </span>
)

interface LayoutHeaderProps {
  customHeaderComponents?: ReactNode
  breadcrumbs?: any[]
  headerTitle?: string
  showProductMenu?: boolean
  backToDashboardURL?: string
}

export const LayoutHeader = ({
  customHeaderComponents,
  breadcrumbs = [],
  headerTitle,
  showProductMenu,
  backToDashboardURL,
}: LayoutHeaderProps) => {
  const { ref: projectRef, slug, appId } = useParams()
  const router = useRouter()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { setMobileMenuOpen } = useAppStateSnapshot()
  const gitlessBranching = useIsBranching2Enabled()
  const { t } = useI18n()

  const [commandMenuEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_COMMAND_MENU, true)

  const isAccountPage = router.pathname.startsWith('/account')
  const isAppsRoute =
    router.pathname === '/' ||
    router.pathname === '/builder' ||
    router.pathname.startsWith('/builder/')
  const showOrgSelection =
    !isAccountPage && (slug || projectRef || isAppsRoute || !!selectedOrganization)

  return (
    <>
      <header className={cn('flex h-12 items-center flex-shrink-0 border-b')}>
        {backToDashboardURL && isAccountPage && (
          <div className="flex items-center justify-center border-r flex-0 md:hidden h-full aspect-square">
            <Link
              href={backToDashboardURL}
              className="flex items-center justify-center border-none !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px] text-foreground-lighter hover:text-foreground transition-colors"
            >
              <ChevronLeft strokeWidth={1.5} size={16} />
            </Link>
          </div>
        )}
        {(showProductMenu || isAccountPage) && (
          <div className="flex items-center justify-center border-r flex-0 md:hidden h-full aspect-square">
            <button
              title={t('common.openMenu')}
              className={cn(
                'group/view-toggle ml-4 flex justify-center flex-col border-none space-x-0 items-start gap-1 !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px]'
              )}
              onClick={() => setMobileMenuOpen(true)}
            >
              <div className="h-px inline-block left-0 w-4 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
              <div className="h-px inline-block left-0 w-3 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
            </button>
          </div>
        )}
        <div
          className={cn(
            'flex items-center justify-between h-full pr-3 flex-1 overflow-x-auto gap-x-8 pl-4'
          )}
        >
          <div className="flex items-center text-sm">
            <HomeIcon />
            <div className="flex items-center md:pl-2">
              {showOrgSelection ? (
                IS_PLATFORM ? (
                  <>
                    <LayoutHeaderDivider className="hidden md:block" />
                    <OrganizationDropdown />
                  </>
                ) : (
                  <>
                    <LayoutHeaderDivider className="hidden md:block" />
                    <span className="text-foreground">
                      {selectedOrganization?.name || 'Default Organization'}
                    </span>
                  </>
                )
              ) : null}
              <AnimatePresence>
                {appId ? (
                  <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeOut',
                    }}
                  >
                    <LayoutHeaderDivider />
                    <BuilderAppDropdown />
                  </motion.div>
                ) : projectRef ? (
                  <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeOut',
                    }}
                  >
                    <LayoutHeaderDivider />
                    <ProjectDropdown />

                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {headerTitle && !appId && (
                  <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeOut',
                    }}
                  >
                    <LayoutHeaderDivider />
                    <span className="text-foreground">{headerTitle}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {projectRef && (
                <motion.div
                  className="ml-3 items-center gap-x-2 flex"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    duration: 0.15,
                    ease: 'easeOut',
                  }}
                >
                  {IS_PLATFORM && gitlessBranching && <MergeRequestButton />}
                  <Connect />
                </motion.div>
              )}
            </AnimatePresence>
            <BreadcrumbsView defaultValue={breadcrumbs} />
          </div>
          <div className="flex items-center gap-x-2">
            {customHeaderComponents && customHeaderComponents}
            {IS_PLATFORM ? (
              <>
                <FeedbackDropdown />

                <div className="flex items-center gap-2">
                  <CommandMenuTriggerInput
                    showShortcut={commandMenuEnabled}
                    placeholder={t('common.search')}
                    className={cn(
                      'hidden md:flex md:min-w-32 xl:min-w-32 rounded-full bg-transparent',
                      '[&_.command-shortcut>div]:border-none',
                      '[&_.command-shortcut>div]:pr-2',
                      '[&_.command-shortcut>div]:bg-transparent',
                      '[&_.command-shortcut>div]:text-foreground-lighter'
                    )}
                  />
                  <HelpPopover />
                  <AdvisorButton projectRef={projectRef} />
                  <AnimatePresence initial={false}>
                    {!!projectRef && (
                      <>
                        <InlineEditorButton />
                        <AssistantButton />
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <UserDropdown />
              </>
            ) : (
              <>
                <LocalVersionPopover />
                <div className="flex items-center gap-2">
                  <CommandMenuTriggerInput
                    placeholder={t('common.search')}
                    className="hidden md:flex md:min-w-32 xl:min-w-32 rounded-full bg-transparent
                        [&_.command-shortcut>div]:border-none
                        [&_.command-shortcut>div]:pr-2
                        [&_.command-shortcut>div]:bg-transparent
                        [&_.command-shortcut>div]:text-foreground-lighter
                      "
                  />
                  <AdvisorButton projectRef={projectRef} />
                  <AnimatePresence initial={false}>
                    {!!projectRef && (
                      <>
                        <InlineEditorButton />
                        <AssistantButton />
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <LocalDropdown />
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
