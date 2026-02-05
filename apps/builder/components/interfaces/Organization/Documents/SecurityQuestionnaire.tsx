import { Download } from 'lucide-react'
import { toast } from 'sonner'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { getDocument } from 'data/documents/document-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const SecurityQuestionnaire = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug

  const { mutate: sendEvent } = useSendEventMutation()

  const currentPlan = organization?.plan
  const canDownload = currentPlan && !['free', 'pro'].includes(currentPlan.id)
  const upgradeSubject = 'Enquiry to upgrade plan for organization'
  const upgradeMessage = `Organization Slug: ${slug ?? '_'}\nRequested plan: Team`

  const fetchQuestionnaire = async (orgSlug: string) => {
    try {
      const questionnaireLink = await getDocument({
        orgSlug,
        docType: 'standard-security-questionnaire',
      })
      if (questionnaireLink?.fileUrl) window.open(questionnaireLink.fileUrl, '_blank')
    } catch (error: any) {
      toast.error(`Failed to download Security Questionnaire: ${error.message}`)
    }
  }

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail className="sticky space-y-6 top-12">
          <p className="text-base m-0">Standard Security Questionnaire</p>
          <div className="space-y-2 text-sm text-foreground-light m-0">
            <p>
              Organizations on Team Plan or above have access to our standard security
              questionnaire.
            </p>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {!organization ? (
            <div className="flex items-center justify-center h-full">
              <ShimmeringLoader className="w-24" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center h-full">
                {!canDownload ? (
                  <Button asChild type="default">
                    <SupportLink
                      queryParams={{
                        orgSlug: slug ?? '_',
                        category: 'Plan_upgrade',
                        subject: upgradeSubject,
                        message: upgradeMessage,
                      }}
                    >
                      Contact support to upgrade
                    </SupportLink>
                  </Button>
                ) : (
                  <Button
                    type="default"
                    icon={<Download />}
                    onClick={() => {
                      sendEvent({
                        action: 'document_view_button_clicked',
                        properties: { documentName: 'Standard Security Questionnaire' },
                        groups: { organization: organization?.slug ?? 'Unknown' },
                      })
                      if (slug) fetchQuestionnaire(slug)
                    }}
                  >
                    Download Questionnaire
                  </Button>
                )}
              </div>
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </>
  )
}
