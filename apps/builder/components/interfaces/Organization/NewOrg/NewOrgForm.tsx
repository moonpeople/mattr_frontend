import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { LOCAL_STORAGE_KEYS } from 'common'
import Panel from 'components/ui/Panel'
import { useOrganizationCreateMutation } from 'data/organizations/organization-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useProfile } from 'lib/profile'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const ORG_KIND_TYPES = {
  PERSONAL: 'Personal',
  EDUCATIONAL: 'Educational',
  STARTUP: 'Startup',
  AGENCY: 'Agency',
  COMPANY: 'Company',
  UNDISCLOSED: 'N/A',
}
const ORG_KIND_DEFAULT = 'PERSONAL'

const ORG_SIZE_TYPES = {
  '1': '1 - 10',
  '10': '10 - 49',
  '50': '50 - 99',
  '100': '100 - 299',
  '300': 'More than 300',
}
const ORG_SIZE_DEFAULT = '1'

const formSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  kind: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(
      z.enum(['PERSONAL', 'EDUCATIONAL', 'STARTUP', 'AGENCY', 'COMPANY', 'UNDISCLOSED'] as const)
    ),
  size: z.enum(['1', '10', '50', '100', '300'] as const),
})

type FormState = z.infer<typeof formSchema>

const FORM_ID = 'new-org-form'

/**
 * No org selected yet, create a new one
 * [Joshen] Need to refactor to use Form_Shadcn here
 */
export const NewOrgForm = () => {
  const router = useRouter()
  const user = useProfile()

  const { data: organizations, isSuccess } = useOrganizationsQuery()

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const [searchParams] = useQueryStates({
    returnTo: parseAsString.withDefault(''),
    auth_id: parseAsString.withDefault(''),
    token: parseAsString.withDefault(''),
  })

  const [defaultValues] = useQueryStates({
    name: parseAsString.withDefault(''),
    kind: parseAsString.withDefault(ORG_KIND_DEFAULT),
    size: parseAsString.withDefault(ORG_SIZE_DEFAULT),
  })

  const form = useForm<FormState>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues.name,
      kind: defaultValues.kind as typeof ORG_KIND_DEFAULT,
      size: defaultValues.size as keyof typeof ORG_SIZE_TYPES,
    },
  })

  useEffect(() => {
    form.reset({
      name: defaultValues.name,
      kind: defaultValues.kind as typeof ORG_KIND_DEFAULT,
      size: defaultValues.size as keyof typeof ORG_SIZE_TYPES,
    })
  }, [defaultValues, form])

  useEffect(() => {
    const currentName = form.getValues('name')
    if (!currentName && isSuccess && organizations?.length === 0 && user.isSuccess) {
      const prefilledOrgName = user.profile?.username ? user.profile.username + `'s Org` : 'My Org'
      form.setValue('name', prefilledOrgName)
    }
  }, [isSuccess, form, organizations?.length, user.profile?.username, user.isSuccess])

  const [newOrgLoading, setNewOrgLoading] = useState(false)
  const { mutate: createOrganization } = useOrganizationCreateMutation({
    onSuccess: async (org) => {
      onOrganizationCreated(org as { slug: string })
    },
    onError: (data) => {
      toast.error(data.message, { duration: 10_000 })
      setNewOrgLoading(false)
    },
  })

  const onOrganizationCreated = (org: { slug: string }) => {
    const prefilledProjectName = user.profile?.username
      ? user.profile.username + `'s Project`
      : 'My Project'

    if (searchParams.returnTo) {
      const url = new URL(searchParams.returnTo, window.location.origin)
      if (searchParams.auth_id) {
        url.searchParams.set('auth_id', searchParams.auth_id)
      }
      if (searchParams.token) {
        url.searchParams.set('token', searchParams.token)
      }

      router.push(url.toString(), undefined, { shallow: false })
    } else {
      router.push(`/new/${org.slug}?projectName=${prefilledProjectName}`)
    }
  }

  async function createOrg(formValues: z.infer<typeof formSchema>) {
    createOrganization({
      name: formValues.name,
      kind: formValues.kind,
      tier: 'tier_free',
      ...(formValues.kind == 'COMPANY' ? { size: formValues.size } : {}),
    })
  }

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (formValues) => {
    setNewOrgLoading(true)
    await createOrg(formValues)
  }

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id={FORM_ID}>
        <Panel
          title={
            <div key="panel-title">
              <h3>Create a new organization</h3>
              <p className="text-sm text-foreground-lighter text-balance">
                Organizations are a way to group your projects. Each organization can be configured
                with different team members and settings.
              </p>
            </div>
          }
          footer={
            <div key="panel-footer" className="flex w-full items-center justify-between">
              <Button
                type="default"
                disabled={newOrgLoading}
                onClick={() => {
                  if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
                  else router.push('/organizations')
                }}
              >
                Cancel
              </Button>

              <Button
                form={FORM_ID}
                htmlType="submit"
                type="primary"
                loading={newOrgLoading}
                disabled={newOrgLoading}
              >
                Create organization
              </Button>
            </div>
          }
          // Prevent resulting rounded corners in footer being clipped by squared corners of bg
          titleClasses="rounded-t-md"
          footerClasses="rounded-b-md"
        >
          <div className="divide-y divide-border-muted">
            <Panel.Content>
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout
                    label="Name"
                    layout="horizontal"
                    description="What's the name of your company or team? You can change this later."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        autoFocus
                        type="text"
                        placeholder="Organization name"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                        data-bwignore
                        {...field}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </Panel.Content>
            <Panel.Content>
              <FormField_Shadcn_
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItemLayout
                    label="Type"
                    layout="horizontal"
                    description="What best describes your organization?"
                  >
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_ className="w-full">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>

                        <SelectContent_Shadcn_>
                          {Object.entries(ORG_KIND_TYPES).map(([k, v]) => (
                            <SelectItem_Shadcn_ key={k} value={k}>
                              {v}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </Panel.Content>

            {form.watch('kind') == 'COMPANY' && (
              <Panel.Content>
                <FormField_Shadcn_
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Company size"
                      layout="horizontal"
                      description="How many people are in your company?"
                    >
                      <FormControl_Shadcn_>
                        <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger_Shadcn_ className="w-full">
                            <SelectValue_Shadcn_ />
                          </SelectTrigger_Shadcn_>

                          <SelectContent_Shadcn_>
                            {Object.entries(ORG_SIZE_TYPES).map(([k, v]) => (
                              <SelectItem_Shadcn_ key={k} value={k}>
                                {v}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </Panel.Content>
            )}

          </div>
        </Panel>
      </form>
    </Form_Shadcn_>
  )
}
