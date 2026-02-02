import { Button } from 'ui'

type ConsoleTab = 'console' | 'errors' | 'output' | 'metadata'

type RuleChainConsoleCollapsedHeaderProps = {
  consoleTab: ConsoleTab
  isCollapsed: boolean
  onSelectTab: (value: ConsoleTab) => void
}

const RuleChainConsoleCollapsedHeader = ({
  consoleTab,
  isCollapsed,
  onSelectTab,
}: RuleChainConsoleCollapsedHeaderProps) => {
  const tabButtonClass = (tab: ConsoleTab) =>
    `h-5 text-[10px] rounded-none hover:text-foreground ${
      isCollapsed
        ? 'text-foreground-muted'
        : consoleTab === tab
          ? 'text-foreground font-semibold'
          : 'text-foreground-muted'
    }`

  return (
    <div className="flex h-6 items-center border-t border-foreground-muted/30 bg-surface-200 px-3">
      <div className="flex items-center gap-0">
        <Button
          type="text"
          size="tiny"
          className={tabButtonClass('console')}
          onClick={() => onSelectTab('console')}
        >
          Console
        </Button>
        <Button
          type="text"
          size="tiny"
          className={tabButtonClass('errors')}
          onClick={() => onSelectTab('errors')}
        >
          Errors
        </Button>
        <Button
          type="text"
          size="tiny"
          className={tabButtonClass('output')}
          onClick={() => onSelectTab('output')}
        >
          Output
        </Button>
        <Button
          type="text"
          size="tiny"
          className={tabButtonClass('metadata')}
          onClick={() => onSelectTab('metadata')}
        >
          Metadata
        </Button>
      </div>
    </div>
  )
}

export default RuleChainConsoleCollapsedHeader
