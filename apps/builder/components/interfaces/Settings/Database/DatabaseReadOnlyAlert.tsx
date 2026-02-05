import { useParams } from 'common'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useState } from 'react'

import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import ConfirmDisableReadOnlyModeModal from './DatabaseSettings/ConfirmDisableReadOnlyModal'

export const DatabaseReadOnlyAlert = () => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const upgradeSubject = 'Enquiry to upgrade plan for organization'
  const upgradeMessage = `Organization Slug: ${organization?.slug ?? '_'}\nRequested plan: Pro | Team | Enterprise`

  const { data: resourceWarnings } = useResourceWarningsQuery({ ref: projectRef })
  // [Joshen Cleanup] JFYI this can be cleaned up once BE changes are live which will only return the warnings based on the provided ref
  // No longer need to filter by ref on the client side
  const isReadOnlyMode =
    (resourceWarnings ?? [])?.find((warning) => warning.project === projectRef)
      ?.is_readonly_mode_enabled ?? false

  return (
    <>
      {isReadOnlyMode && (
        <Alert_Shadcn_ variant="destructive">
          <AlertTriangle />
          <AlertTitle_Shadcn_>
            Project is in read-only mode and database is no longer accepting write requests
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            You have reached 95% of your project's disk space, and read-only mode has been enabled
            to preserve your database's stability and prevent your project from exceeding its
            current plan. To resolve this, you may:
            <ul className="list-disc pl-6 mt-1">
              <li>
                Temporarily disable read-only mode to free up space and reduce your database size
              </li>
              <li>
                <SupportLink
                  queryParams={{
                    orgSlug: organization?.slug ?? '_',
                    category: 'Plan_upgrade',
                    subject: upgradeSubject,
                    message: upgradeMessage,
                  }}
                >
                  Contact support
                </SupportLink>{' '}
                to review plan limits or request a higher disk size.
              </li>
            </ul>
          </AlertDescription_Shadcn_>
          <div className="mt-4 flex items-center space-x-2">
            <Button type="default" onClick={() => setShowConfirmationModal(true)}>
              Disable read-only mode
            </Button>
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                href={`${DOCS_URL}/guides/platform/database-size#disabling-read-only-mode`}
                target="_blank"
                rel="noreferrer"
              >
                Learn more
              </a>
            </Button>
          </div>
        </Alert_Shadcn_>
      )}
      <ConfirmDisableReadOnlyModeModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
      />
    </>
  )
}
