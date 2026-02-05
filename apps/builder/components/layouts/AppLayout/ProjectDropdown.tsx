import { Box, Check, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { OrganizationProjectSelector } from 'components/ui/OrganizationProjectSelector'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { Badge, Button, cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const ProjectDropdown = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const isBranch = project?.parentRef !== project?.ref
  const { data: parentProject, isPending: isLoadingParentProject } = useProjectDetailQuery(
    { ref: project?.parent_project_ref },
    { enabled: isBranch }
  )
  const selectedProject = parentProject ?? project

  const [open, setOpen] = useState(false)

  if (isLoadingProject || (isBranch && isLoadingParentProject) || !selectedProject) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return IS_PLATFORM ? (
    <>
      <Link
        href={`/builder?ref=${project?.ref}`}
        className="flex items-center gap-2 flex-shrink-0 text-sm"
      >
        <Box size={14} strokeWidth={1.5} className="text-foreground-lighter" />
        <span className="text-foreground max-w-32 lg:max-w-none truncate">
          {selectedProject?.name}
        </span>
      </Link>

      <OrganizationProjectSelector
        open={open}
        setOpen={setOpen}
        selectedRef={ref}
        onSelect={(project) => {
          router.push(`/builder?ref=${project.ref}`)
        }}
        renderTrigger={() => (
          <Button
            type="text"
            size="tiny"
            className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
            iconRight={<ChevronsUpDown strokeWidth={1.5} />}
          />
        )}
        renderRow={(project) => {
          const isSelected = project.ref === ref
          const isPaused = project.status === 'INACTIVE'

          return (
            <Link
              href={`/builder?ref=${project.ref}`}
              className="w-full flex items-center justify-between"
            >
              <span className={cn('truncate', isSelected ? 'max-w-60' : 'max-w-64')}>
                {project.name}
                {isPaused && <Badge className="ml-2">Paused</Badge>}
              </span>
              {isSelected && <Check size={16} />}
            </Link>
          )
        }}
      />
    </>
  ) : (
    <Button type="text">
      <span className="text-sm">{selectedProject?.name}</span>
    </Button>
  )
}
