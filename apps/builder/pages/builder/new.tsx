import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useCreateBuilderAppMutation } from 'data/builder/builder-apps'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import type { NextPageWithLayout } from 'types'
import { NoOrganizationsState } from 'components/interfaces/Home/ProjectList/EmptyStates'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  LogoLoader,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'

type BuilderAppFormValues = {
  name: string
  orgSlug: string
}

const BuilderNewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: organizations = [], isPending: isOrganizationsLoading } = useOrganizationsQuery()
  const [lastVisitedOrgSlug] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )
  const [selectedOrgSlug, setSelectedOrgSlug] = useState('')
  const createOrgSlug = organization?.slug ?? selectedOrgSlug

  const form = useForm<BuilderAppFormValues>({
    defaultValues: { name: '', orgSlug: '' },
  })
  const formOrgSlug = form.watch('orgSlug')

  useEffect(() => {
    if (!project?.name) {
      return
    }
    if (form.formState.isDirty) {
      return
    }
    form.setValue('name', `${project.name} App`, {
      shouldDirty: false,
      shouldValidate: false,
    })
  }, [project?.name, form])

  useEffect(() => {
    if (organization?.slug && organization.slug !== selectedOrgSlug) {
      setSelectedOrgSlug(organization.slug)
      return
    }
    if (selectedOrgSlug) {
      return
    }
    if (lastVisitedOrgSlug && organizations.some((org) => org.slug === lastVisitedOrgSlug)) {
      setSelectedOrgSlug(lastVisitedOrgSlug)
      return
    }
    if (organizations.length === 1) {
      setSelectedOrgSlug(organizations[0].slug)
    }
  }, [organization?.slug, selectedOrgSlug, lastVisitedOrgSlug, organizations])

  useEffect(() => {
    if (selectedOrgSlug && !form.getValues('orgSlug')) {
      form.setValue('orgSlug', selectedOrgSlug, {
        shouldDirty: false,
        shouldValidate: false,
      })
    }
  }, [selectedOrgSlug, form])

  const createAppMutation = useCreateBuilderAppMutation({
    onSuccess: (app) => {
      router.push(projectRef ? `/builder?ref=${projectRef}&appId=${app.id}` : `/builder?appId=${app.id}`)
    },
  })

  const onSubmit = (values: BuilderAppFormValues) => {
    const orgSlug = organization?.slug ?? values.orgSlug
    if (!orgSlug) {
      return
    }
    createAppMutation.mutate({
      name: values.name.trim(),
      projectRef,
      orgSlug,
    })
  }

  if (!createOrgSlug && isOrganizationsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LogoLoader />
      </div>
    )
  }

  if (!isOrganizationsLoading && organizations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <NoOrganizationsState />
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Create builder app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField_Shadcn_
                name="name"
                control={form.control}
                rules={{ required: 'App name is required' }}
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_>App name</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ placeholder="Interface name" {...field} />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              {!projectRef && (
                <FormField_Shadcn_
                  name="orgSlug"
                  control={form.control}
                  rules={{ required: 'Organization is required' }}
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_>Organization</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Select_Shadcn_
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedOrgSlug(value)
                          }}
                        >
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_
                              placeholder={
                                isOrganizationsLoading
                                  ? 'Loading organizations...'
                                  : 'Select an organization'
                              }
                            />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {organizations.map((org) => (
                              <SelectItem_Shadcn_ key={org.slug} value={org.slug}>
                                {org.name}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              )}
              {createAppMutation.error && (
                <p className="text-sm text-destructive">
                  {createAppMutation.error.message}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="default"
                  onClick={() => router.push(projectRef ? `/builder?ref=${projectRef}` : '/builder')}
                  disabled={createAppMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createAppMutation.isPending}
                  disabled={!organization?.slug && !formOrgSlug}
                >
                  Create app
                </Button>
              </div>
            </form>
          </Form_Shadcn_>
        </CardContent>
      </Card>
    </div>
  )
}

BuilderNewPage.getLayout = (page) => (
  <DefaultLayout headerTitle="Builder">
    <ProjectLayoutWithAuth title="Builder" isBlocking={false}>
      {page}
    </ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default BuilderNewPage
