import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { DocsButton } from 'components/ui/DocsButton'
import { useEnablePhysicalBackupsMutation } from 'data/database/enable-physical-backups-mutation'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { Region, useReadReplicaSetUpMutation } from 'data/read-replicas/replica-setup-mutation'
import {
  MAX_REPLICAS_ABOVE_XL,
  MAX_REPLICAS_BELOW_XL,
  useReadReplicasQuery,
} from 'data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsAwsK8sCloudProvider, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { AWS_REGIONS_DEFAULT, BASE_PATH, DOCS_URL } from 'lib/constants'
import type { AWS_REGIONS_KEYS } from 'shared-data'
import { AWS_REGIONS } from 'shared-data'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Listbox,
  SidePanel,
  WarningIcon,
  cn,
} from 'ui'
import { AVAILABLE_REPLICA_REGIONS } from './InstanceConfiguration.constants'

// [Joshen] FYI this is purely for AWS only, need to update to support Fly eventually

interface DeployNewReplicaPanelProps {
  visible: boolean
  selectedDefaultRegion?: AWS_REGIONS_KEYS
  onSuccess: () => void
  onClose: () => void
}

const DeployNewReplicaPanel = ({
  visible,
  selectedDefaultRegion,
  onSuccess,
  onClose,
}: DeployNewReplicaPanelProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const upgradeSubject = 'Enquiry to upgrade plan for organization'
  const upgradeMessage = `Organization Slug: ${org?.slug ?? '_'}\nRequested plan: Pro | Team | Enterprise`

  const { data } = useReadReplicasQuery({ projectRef })
  const { data: addons, isSuccess } = useProjectAddonsQuery({ projectRef })

  const isAwsK8s = useIsAwsK8sCloudProvider()

  // Opting for useState temporarily as Listbox doesn't seem to work with react-hook-form yet
  const [defaultRegion] = Object.entries(AWS_REGIONS).find(
    ([_, name]) => name === AWS_REGIONS_DEFAULT
  ) ?? ['ap-southeast-1']
  // Will be following the primary's compute size for the time being
  const defaultCompute =
    addons?.selected_addons.find((addon) => addon.type === 'compute_instance')?.variant
      .identifier ?? 'ci_micro'

  const showNewDiskManagementUI = project?.cloud_provider === 'AWS'

  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion)
  const [selectedCompute, setSelectedCompute] = useState(defaultCompute)

  const { data: projectDetail, isSuccess: isProjectDetailSuccess } = useProjectDetailQuery(
    { ref: projectRef },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
    }
  )

  useEffect(() => {
    if (!isProjectDetailSuccess) return
    if (projectDetail.is_physical_backups_enabled) {
      setRefetchInterval(false)
    }
  }, [projectDetail?.is_physical_backups_enabled, isProjectDetailSuccess])

  const { mutate: enablePhysicalBackups, isPending: isEnabling } = useEnablePhysicalBackupsMutation(
    {
      onSuccess: () => {
        toast.success(
          'Physical backups are currently being enabled, please check back in a few minutes!'
        )
        setRefetchInterval(5000)
      },
    }
  )

  const { mutate: setUpReplica, isPending: isSettingUp } = useReadReplicaSetUpMutation({
    onSuccess: () => {
      const region = AVAILABLE_REPLICA_REGIONS.find((r) => r.key === selectedRegion)?.name
      toast.success(`Spinning up new replica in ${region ?? ' Unknown'}...`)
      onSuccess()
      onClose()
    },
  })

  const currentPgVersion = Number(
    (project?.dbVersion ?? '').split('supabase-postgres-')[1]?.split('.')[0]
  )

  const maxNumberOfReplicas = ['ci_micro', 'ci_small', 'ci_medium', 'ci_large'].includes(
    selectedCompute
  )
    ? MAX_REPLICAS_BELOW_XL
    : MAX_REPLICAS_ABOVE_XL
  const reachedMaxReplicas =
    (data ?? []).filter((db) => db.identifier !== projectRef).length >= maxNumberOfReplicas
  const isFreePlan = org?.plan.id === 'free'
  const isAWSProvider = project?.cloud_provider === 'AWS'
  const isWalgEnabled = project?.is_physical_backups_enabled
  const currentComputeAddon = addons?.selected_addons.find(
    (addon) => addon.type === 'compute_instance'
  )
  const isMinimallyOnSmallCompute =
    currentComputeAddon?.variant.identifier !== undefined &&
    currentComputeAddon?.variant.identifier !== 'ci_micro'
  const canDeployReplica =
    !reachedMaxReplicas &&
    currentPgVersion >= 15 &&
    isAWSProvider &&
    !isFreePlan &&
    isWalgEnabled &&
    currentComputeAddon !== undefined &&
    !isAwsK8s


  const availableRegions =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? AVAILABLE_REPLICA_REGIONS.filter((x) =>
          ['SOUTHEAST_ASIA', 'CENTRAL_EU', 'EAST_US'].includes(x.key)
        )
      : AVAILABLE_REPLICA_REGIONS

  const onSubmit = async () => {
    const regionKey = AWS_REGIONS[selectedRegion as AWS_REGIONS_KEYS].code
    if (!projectRef) return console.error('Project is required')
    if (!regionKey) return toast.error('Unable to deploy replica: Unsupported region selected')

    const primary = data?.find((db) => db.identifier === projectRef)
    setUpReplica({ projectRef, region: regionKey as Region, size: primary?.size ?? 't4g.small' })
  }

  useEffect(() => {
    if (visible && isSuccess) {
      if (selectedDefaultRegion !== undefined) {
        setSelectedRegion(selectedDefaultRegion)
      } else if (defaultRegion) {
        setSelectedRegion(defaultRegion)
      }
      if (defaultCompute !== undefined) setSelectedCompute(defaultCompute)
    }
  }, [visible, isSuccess])

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      loading={isSettingUp}
      disabled={!canDeployReplica}
      className={cn(showNewDiskManagementUI ? 'max-w-[500px]' : '')}
      header="Deploy a new read replica"
      onConfirm={() => onSubmit()}
      confirmText="Deploy replica"
    >
      <SidePanel.Content className="flex flex-col py-4 gap-y-4">
        {!isAWSProvider ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Read replicas are only supported for projects provisioned via AWS
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                Projects provisioned by other cloud providers currently will not be able to use read
                replicas
              </span>
              <DocsButton
                abbrev={false}
                className="mt-3"
                href={`${DOCS_URL}/guides/platform/read-replicas#prerequisites`}
              />
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : isAwsK8s ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Read replicas are not supported for AWS (Revamped) projects
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                Projects provisioned by other cloud providers currently will not be able to use read
                replicas
              </span>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : currentPgVersion < 15 ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Read replicas can only be deployed with projects on Postgres version 15 and above
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              If you'd like to use read replicas, please contact us via support
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-2">
              <Button type="default">
                <SupportLink
                  queryParams={{
                    projectRef,
                    category: SupportCategories.SALES_ENQUIRY,
                    subject: 'Enquiry on read replicas',
                    message: `Project DB version: ${project?.dbVersion}`,
                  }}
                >
                  Contact support
                </SupportLink>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : !isMinimallyOnSmallCompute ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Project required to at least be on a Small compute
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                This is to ensure that read replicas can keep up with the primary databases'
                activities.
              </span>
              <div className="flex items-center gap-x-2 mt-3">
                <Button asChild type="default">
                  {isFreePlan ? (
                    <SupportLink
                      queryParams={{
                        orgSlug: org?.slug ?? '_',
                        category: 'Plan_upgrade',
                        subject: upgradeSubject,
                        message: upgradeMessage,
                      }}
                    >
                      Contact support
                    </SupportLink>
                  ) : (
                    <Link href={`/project/${projectRef}/settings/compute-and-disk`}>
                      Change compute size
                    </Link>
                  )}
                </Button>
                <DocsButton
                  abbrev={false}
                  href={`${DOCS_URL}/guides/platform/read-replicas#prerequisites`}
                />
              </div>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : !isWalgEnabled ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              {refetchInterval !== false
                ? 'Physical backups are currently being enabled'
                : 'Physical backups are required to deploy replicas'}
            </AlertTitle_Shadcn_>
            {refetchInterval === false && (
              <AlertDescription_Shadcn_ className="mb-2">
                Physical backups are used under the hood to spin up read replicas for your project.
              </AlertDescription_Shadcn_>
            )}
            <AlertDescription_Shadcn_>
              {refetchInterval !== false
                ? 'This warning will go away once physical backups have been enabled - check back in a few minutes!'
                : 'Enabling physical backups will take a few minutes, after which you will be able to deploy read replicas.'}
            </AlertDescription_Shadcn_>
            {refetchInterval !== false ? (
              <AlertDescription_Shadcn_ className="mt-2">
                You may start deploying read replicas thereafter once this is completed.
              </AlertDescription_Shadcn_>
            ) : (
              <AlertDescription_Shadcn_ className="flex items-center gap-x-2 mt-3">
                <Button
                  type="default"
                  loading={isEnabling}
                  disabled={isEnabling}
                  onClick={() => {
                    if (projectRef) enablePhysicalBackups({ ref: projectRef })
                  }}
                >
                  Enable physical backups
                </Button>
                <DocsButton
                  abbrev={false}
                  href={`${DOCS_URL}/guides/platform/read-replicas#how-are-read-replicas-made`}
                />
              </AlertDescription_Shadcn_>
            )}
          </Alert_Shadcn_>
        ) : reachedMaxReplicas ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              You can only deploy up to {maxNumberOfReplicas} read replicas at once
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              If you'd like to spin up another read replica, please drop an existing replica first.
            </AlertDescription_Shadcn_>
            {maxNumberOfReplicas === MAX_REPLICAS_BELOW_XL && (
              <>
                <AlertDescription_Shadcn_>
                  <span>
                    Alternatively, you may deploy up to{' '}
                    <span className="text-foreground">{MAX_REPLICAS_ABOVE_XL}</span> replicas if
                    your project is on an XL compute or higher.
                  </span>
                  <div className="flex items-center gap-x-2 mt-3">
                    <Button asChild type="default">
                      {isFreePlan ? (
                        <SupportLink
                          queryParams={{
                            orgSlug: org?.slug ?? '_',
                            category: 'Plan_upgrade',
                            subject: upgradeSubject,
                            message: upgradeMessage,
                          }}
                        >
                          Contact support
                        </SupportLink>
                      ) : (
                        <Link href={`/project/${projectRef}/settings/compute-and-disk`}>
                          Upgrade compute size
                        </Link>
                      )}
                    </Button>
                  </div>
                </AlertDescription_Shadcn_>
              </>
            )}
          </Alert_Shadcn_>
        ) : null}

        <div className="flex flex-col gap-y-6 mt-2">
          <Listbox
            size="small"
            id="region"
            name="region"
            disabled={!canDeployReplica}
            value={selectedRegion}
            onChange={setSelectedRegion}
            label="Select a region to deploy your read replica in"
          >
            {availableRegions.map((region) => (
              <Listbox.Option
                key={region.key}
                label={region.name}
                value={region.key}
                addOnBefore={() => (
                  <img
                    alt="region icon"
                    className="w-5 rounded-sm"
                    src={`${BASE_PATH}/img/regions/${region.region}.svg`}
                  />
                )}
              >
                <p className="flex items-center gap-x-2">
                  <span>{region.name}</span>
                  <span className="text-xs text-foreground-lighter font-mono">{region.region}</span>
                </p>
              </Listbox.Option>
            ))}
          </Listbox>

          <div className="flex flex-col gap-y-2">
            <p className="text-foreground-light text-sm">
              Read replicas will match the compute size of your primary database and will include
              25% more disk size to accommodate WAL files.
            </p>
            <p className="text-foreground-light text-sm">
              Read more about{' '}
              <Link
                href={`${DOCS_URL}/guides/platform/read-replicas`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground transition"
              >
                read replicas
              </Link>{' '}
              in the documentation.
            </p>
          </div>
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default DeployNewReplicaPanel
