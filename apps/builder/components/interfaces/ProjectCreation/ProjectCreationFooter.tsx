import { useRouter } from 'next/router'
import { UseFormReturn } from 'react-hook-form'

import { LOCAL_STORAGE_KEYS } from 'common'
import { OrgProject } from 'data/projects/org-projects-infinite-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { Button } from 'ui'
import { CreateProjectForm } from './ProjectCreation.schema'

interface ProjectCreationFooterProps {
  form: UseFormReturn<CreateProjectForm>
  canCreateProject: boolean
  instanceSize?: string
  organizationProjects: OrgProject[]
  isCreatingNewProject: boolean
  isSuccessNewProject: boolean
}

export const ProjectCreationFooter = ({
  form,
  canCreateProject,
  isCreatingNewProject,
  isSuccessNewProject,
}: ProjectCreationFooterProps) => {
  const router = useRouter()

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  return (
    <div key="panel-footer" className="grid grid-cols-12 w-full gap-4 items-center">
      <div className="flex items-end col-span-12 space-x-2 ml-auto">
        <Button
          type="default"
          disabled={isCreatingNewProject || isSuccessNewProject}
          onClick={() => {
            if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
            else router.push('/organizations')
          }}
        >
          Cancel
        </Button>
        <Button
          htmlType="submit"
          loading={isCreatingNewProject || isSuccessNewProject}
          disabled={!canCreateProject}
        >
          Create new project
        </Button>
      </div>
    </div>
  )
}
