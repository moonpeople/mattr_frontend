import { AlertCircleIcon } from 'lucide-react'

import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useAppStateSnapshot } from 'state/app-state'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

export const BranchingPlanNotice = () => {
  const snap = useAppStateSnapshot()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const upgradeSubject = 'Enquiry to upgrade plan for organization'
  const upgradeMessage = `Organization Slug: ${selectedOrg?.slug ?? '_'}\nRequested plan: Pro`

  return (
    <Alert_Shadcn_ className="rounded-none px-7 py-6 [&>svg]:top-6 [&>svg]:left-6 border-0 border-t">
      <AlertCircleIcon />
      <AlertTitle_Shadcn_>
        Database branching is only available on the Pro Plan and above
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Contact support to upgrade your plan to enable branching for this project.
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_>
        <Button size="tiny" type="default" className="mt-4">
          <SupportLink
            onClick={() => snap.setShowCreateBranchModal(false)}
            queryParams={{
              orgSlug: selectedOrg?.slug ?? '_',
              category: 'Plan_upgrade',
              subject: upgradeSubject,
              message: upgradeMessage,
            }}
          >
            Contact support
          </SupportLink>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
