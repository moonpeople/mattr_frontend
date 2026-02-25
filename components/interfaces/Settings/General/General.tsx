import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useProjectIotDashboardSettingsUpdateMutation } from 'data/config/project-iot-dashboard-settings-mutation'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useProjectUpdateMutation } from 'data/projects/project-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getProjectType } from 'lib/project-links'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  WarningIcon,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'

const IOT_DASHBOARD_ACCESS_MODES = ['basic', 'portal', 'hybrid'] as const
type IotDashboardAccessMode = (typeof IOT_DASHBOARD_ACCESS_MODES)[number]

const iotDashboardFormSchema = z.object({
  accessMode: z.enum(IOT_DASHBOARD_ACCESS_MODES),
  dashboardHost: z.string().default(''),
  dashboardPortalHost: z.string().default(''),
})

type IotDashboardFormValues = z.infer<typeof iotDashboardFormSchema>

const normalizeIotDashboardAccessMode = (value: unknown): IotDashboardAccessMode => {
  if (value === 'basic' || value === 'portal' || value === 'hybrid') return value
  return 'basic'
}

const readString = (value: unknown) => (typeof value === 'string' ? value : '')

export const General = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const isIotProject = project ? getProjectType(project) === 'iot' : false

  const isBranch = Boolean(project?.parent_project_ref)

  const { projectSettingsRestartProject } = useIsFeatureEnabled([
    'project_settings:restart_project',
  ])

  const { can: canUpdateProject } = useAsyncCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const { mutate: updateProject, isPending: isUpdating } = useProjectUpdateMutation()
  const { mutate: updateIotDashboard, isPending: isUpdatingIotDashboard } =
    useProjectIotDashboardSettingsUpdateMutation()

  const { data: projectSettings } = useProjectSettingsV2Query(
    { projectRef: project?.ref },
    { enabled: !!project?.ref && isIotProject }
  )

  const formSchema = z.object({
    name: z.string().trim().min(3, 'Project name must be at least 3 characters long'),
  })

  const defaultValues = { name: project?.name ?? '' }
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
    values: defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!project?.ref) return console.error('Ref is required')

    updateProject(
      { ref: project.ref, name: values.name.trim() },
      {
        onSuccess: ({ name }) => {
          form.reset({ name })
          toast.success('Successfully saved settings')
        },
      }
    )
  }

  const iotDashboardDefaultValues = useMemo<IotDashboardFormValues>(() => {
    const iotConfig = projectSettings?.iot_config ?? {}

    return {
      accessMode: normalizeIotDashboardAccessMode(iotConfig.dashboard_access_mode),
      dashboardHost: readString(iotConfig.dashboard_host),
      dashboardPortalHost: readString(iotConfig.dashboard_portal_host),
    }
  }, [projectSettings])

  const iotDashboardForm = useForm<IotDashboardFormValues>({
    resolver: zodResolver(iotDashboardFormSchema),
    defaultValues: iotDashboardDefaultValues,
    values: iotDashboardDefaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const onSubmitIotDashboard = async (values: IotDashboardFormValues) => {
    if (!project?.ref) return console.error('Ref is required')

    updateIotDashboard(
      {
        projectRef: project.ref,
        accessMode: values.accessMode,
        dashboardHost: values.dashboardHost,
        dashboardPortalHost: values.dashboardPortalHost,
      },
      {
        onSuccess: () => {
          iotDashboardForm.reset(values)
          toast.success('Successfully saved IoT dashboard settings')
        },
      }
    )
  }

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>General settings</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          {isBranch && (
            <Alert_Shadcn_ variant="default">
              <WarningIcon />
              <AlertTitle_Shadcn_>
                You are currently on a preview branch of your project
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Certain settings are not available while you're on a preview branch. To adjust your
                project settings, you may return to your{' '}
                <Link
                  href={`/project/${project?.parent_project_ref}/settings/general`}
                  className="text-brand"
                >
                  main branch
                </Link>
                .
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}

          {project === undefined ? (
            <GenericSkeletonLoader />
          ) : (
            <div className="space-y-4">
              <Form_Shadcn_ {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <Card>
                    <CardContent>
                      <FormField_Shadcn_
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Project name"
                            description="Displayed throughout the dashboard."
                            className="[&>div]:md:w-1/2"
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                {...field}
                                disabled={isBranch || !canUpdateProject}
                                autoComplete="off"
                              />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ />
                          </FormItemLayout>
                        )}
                      />
                    </CardContent>
                    <CardContent>
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Project ID"
                        description="Reference used in APIs and URLs."
                        className="[&>div]:md:w-1/2 [&>div>div]:md:w-full"
                      >
                        <FormControl_Shadcn_>
                          <Input copy readOnly size="small" value={project?.ref ?? ''} />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    </CardContent>
                    <CardFooter className="justify-end space-x-2">
                      {form.formState.isDirty && (
                        <Button
                          type="default"
                          htmlType="button"
                          disabled={isUpdating}
                          onClick={() => form.reset({ name: project?.name ?? '' })}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="primary"
                        htmlType="submit"
                        disabled={
                          !form.formState.isDirty || isUpdating || !canUpdateProject || isBranch
                        }
                        loading={isUpdating}
                      >
                        Save changes
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form_Shadcn_>

              {isIotProject && (
                <Form_Shadcn_ {...iotDashboardForm}>
                  <form onSubmit={iotDashboardForm.handleSubmit(onSubmitIotDashboard)}>
                    <Card>
                      <CardContent>
                        <FormField_Shadcn_
                          control={iotDashboardForm.control}
                          name="accessMode"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="IoT dashboard access mode"
                              description="How users can access the IoT dashboard (basic auth, portal SSO, or hybrid)."
                              className="[&>div]:md:w-1/2"
                            >
                              <Select_Shadcn_
                                value={field.value}
                                onValueChange={(value) => {
                                  if (
                                    value === 'basic' ||
                                    value === 'portal' ||
                                    value === 'hybrid'
                                  ) {
                                    field.onChange(value)
                                  }
                                }}
                                disabled={isBranch || !canUpdateProject}
                              >
                                <FormControl_Shadcn_>
                                  <SelectTrigger_Shadcn_>
                                    <SelectValue_Shadcn_ placeholder="Select access mode" />
                                  </SelectTrigger_Shadcn_>
                                </FormControl_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectItem_Shadcn_ value="basic">Basic auth only</SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="portal">Portal SSO only</SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="hybrid">
                                    Portal SSO + Basic auth
                                  </SelectItem_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                              <FormMessage_Shadcn_ />
                            </FormItemLayout>
                          )}
                        />
                      </CardContent>

                      <CardContent>
                        <FormField_Shadcn_
                          control={iotDashboardForm.control}
                          name="dashboardHost"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="Dashboard host (ops/basic)"
                              description="Host for basic-auth entrypoint, for example ops-project.iot.mattr.ru."
                              className="[&>div]:md:w-1/2"
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  value={field.value ?? ''}
                                  disabled={isBranch || !canUpdateProject}
                                  placeholder="ops-project.iot.mattr.ru"
                                  autoComplete="off"
                                />
                              </FormControl_Shadcn_>
                              <FormMessage_Shadcn_ />
                            </FormItemLayout>
                          )}
                        />
                      </CardContent>

                      <CardContent>
                        <FormField_Shadcn_
                          control={iotDashboardForm.control}
                          name="dashboardPortalHost"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="Dashboard host (portal/SSO)"
                              description="Host for portal launch/SSO entrypoint, for example project.iot.mattr.ru."
                              className="[&>div]:md:w-1/2"
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  value={field.value ?? ''}
                                  disabled={isBranch || !canUpdateProject}
                                  placeholder="project.iot.mattr.ru"
                                  autoComplete="off"
                                />
                              </FormControl_Shadcn_>
                              <FormMessage_Shadcn_ />
                            </FormItemLayout>
                          )}
                        />
                      </CardContent>

                      <CardFooter className="justify-end space-x-2">
                        {iotDashboardForm.formState.isDirty && (
                          <Button
                            type="default"
                            htmlType="button"
                            disabled={isUpdatingIotDashboard}
                            onClick={() => iotDashboardForm.reset(iotDashboardDefaultValues)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="primary"
                          htmlType="submit"
                          disabled={
                            !iotDashboardForm.formState.isDirty ||
                            isUpdatingIotDashboard ||
                            !canUpdateProject ||
                            isBranch
                          }
                          loading={isUpdatingIotDashboard}
                        >
                          Save changes
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </Form_Shadcn_>
              )}
            </div>
          )}
        </PageSectionContent>
      </PageSection>

      <PageSection id="restart-project">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Project availability</PageSectionTitle>
            <PageSectionDescription>
              Restart or pause your project when performing maintenance.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent>
              <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4">
                <div>
                  <p className="text-sm">
                    {projectSettingsRestartProject ? 'Restart project' : 'Restart database'}
                  </p>
                  <div className="max-w-[420px]">
                    <p className="text-sm text-foreground-light">
                      Your project will not be available for a few minutes.
                    </p>
                  </div>
                </div>
                <RestartServerButton />
              </div>
            </CardContent>
            <CardContent>
              <div
                className="flex w-full flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4"
                id="pause-project"
              >
                <div>
                  <p className="text-sm">Pause project</p>
                  <div className="max-w-[420px]">
                    <p className="text-sm text-foreground-light">
                      Your project will not be accessible while it is paused.
                    </p>
                  </div>
                </div>
                <PauseProjectButton />
              </div>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>

      {!isBranch && (
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Project usage</PageSectionTitle>
              <PageSectionDescription>
                Usage statistics now live under your organization settings.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Card>
              <CardContent>
                <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4">
                  <div className="flex space-x-4">
                    <BarChart2 strokeWidth={2} />
                    <div>
                      <p className="text-sm">Project usage statistics have been moved</p>
                      <p className="text-foreground-light text-sm">
                        You may view your project's usage under your organization's settings
                      </p>
                    </div>
                  </div>

                  {!!organization && !!project && (
                    <Button asChild type="default">
                      <Link href={`/org/${organization.slug}/usage?projectRef=${project.ref}`}>
                        View project usage
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </PageSectionContent>
        </PageSection>
      )}
    </>
  )
}
