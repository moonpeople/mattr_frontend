import { PropsWithChildren } from 'react'

import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'

export const PLAN_REQUEST_EMPTY_PLACEHOLDER =
  '<Specify which plan to upgrade to: Pro | Team | Enterprise>'

interface UpgradePlanButtonProps {
  /** Stick to camel case for consistency */
  source: string
  type?: 'default' | 'primary'
  plan?: 'Pro' | 'Team' | 'Enterprise'
  addon?: 'pitr' | 'customDomain' | 'spendCap' | 'computeSize'
  /** Used in the default message template for request upgrade dialog, e.g: "Upgrade to ..." */
  featureProposition?: string
  disabled?: boolean
}

/**
 * Links to the support form for plan upgrades or add-on enablement.
 */
export const UpgradePlanButton = ({
  source,
  type = 'primary',
  plan = 'Pro',
  addon,
  featureProposition,
  disabled,
  children,
}: PropsWithChildren<UpgradePlanButtonProps>) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const isFreePlan = organization?.plan?.id === 'free'
  const slug = organization?.slug ?? '_'

  const subject = `Enquiry to upgrade ${!!plan ? `to ${plan} ` : ''}plan for organization`
  const message = `Name: ${organization?.name}\nSlug: ${slug}\nRequested plan: ${plan ?? PLAN_REQUEST_EMPTY_PLACEHOLDER}`

  const isOnPaidPlanAndRequestingToPurchaseAddon = !isFreePlan && !!addon

  const linkChildren = children || (!!addon ? 'Enable add-on' : `Upgrade to ${plan}`)
  const link = (
    <SupportLink
      queryParams={{
        orgSlug: slug,
        category: 'Plan_upgrade',
        subject,
        message:
          isOnPaidPlanAndRequestingToPurchaseAddon && featureProposition
            ? `${message}\nFeature: ${featureProposition}`
            : message,
      }}
    >
      {linkChildren}
    </SupportLink>
  )

  return (
    <Button asChild type={type} disabled={disabled}>
      {link}
    </Button>
  )
}
