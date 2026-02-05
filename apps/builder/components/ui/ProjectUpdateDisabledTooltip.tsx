import { PropsWithChildren } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export interface ProjectUpdateDisabledTooltipProps {
  projectUpdateDisabled: boolean
  projectNotActive?: boolean
  tooltip?: string
}

const ProjectUpdateDisabledTooltip = ({
  projectUpdateDisabled,
  projectNotActive = false,
  children,
  tooltip,
}: PropsWithChildren<ProjectUpdateDisabledTooltipProps>) => {
  const showTooltip = projectUpdateDisabled || projectNotActive

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {showTooltip && (
        <TooltipContent side="bottom" className="w-72 text-center">
          {projectUpdateDisabled
            ? tooltip || 'Project updates are currently disabled.'
            : projectNotActive
              ? 'Unable to update project while it is not active.'
              : ''}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

export default ProjectUpdateDisabledTooltip
