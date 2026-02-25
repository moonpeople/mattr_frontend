import { UseFormReturn } from 'react-hook-form'

import Panel from 'components/ui/Panel'
import {
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
import { CreateProjectForm } from './ProjectCreation.schema'

interface IotDashboardAccessSettingsProps {
  form: UseFormReturn<CreateProjectForm>
}

const ACCESS_MODE_OPTIONS: Array<{ value: CreateProjectForm['iotDashboardAccessMode']; label: string }> =
  [
    { value: 'basic', label: 'Basic auth only' },
    { value: 'portal', label: 'Portal SSO only' },
    { value: 'hybrid', label: 'Portal SSO + Basic auth' },
  ]

export const IotDashboardAccessSettings = ({ form }: IotDashboardAccessSettingsProps) => {
  return (
    <>
      <Panel.Content>
        <FormField_Shadcn_
          control={form.control}
          name="iotDashboardAccessMode"
          render={({ field }) => (
            <FormItemLayout
              label="IoT dashboard access mode"
              layout="horizontal"
              description="Defines how users can open dashboard pages on the IoT instance."
            >
              <Select_Shadcn_ onValueChange={field.onChange} value={field.value}>
                <FormControl_Shadcn_>
                  <SelectTrigger_Shadcn_>
                    <SelectValue_Shadcn_ placeholder="Select access mode" />
                  </SelectTrigger_Shadcn_>
                </FormControl_Shadcn_>
                <SelectContent_Shadcn_>
                  {ACCESS_MODE_OPTIONS.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormItemLayout>
          )}
        />
      </Panel.Content>

      <Panel.Content>
        <FormField_Shadcn_
          control={form.control}
          name="iotDashboardHost"
          render={({ field }) => (
            <FormItemLayout
              label="Dashboard host (ops/basic)"
              layout="horizontal"
              description="Optional host for basic-auth dashboard access, e.g. ops-project.iot.mattr.ru."
            >
              <FormControl_Shadcn_>
                <Input_Shadcn_
                  {...field}
                  value={field.value ?? ''}
                  placeholder="ops-project.iot.mattr.ru"
                  autoComplete="off"
                />
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
      </Panel.Content>

      <Panel.Content>
        <FormField_Shadcn_
          control={form.control}
          name="iotDashboardPortalHost"
          render={({ field }) => (
            <FormItemLayout
              label="Dashboard host (portal/SSO)"
              layout="horizontal"
              description="Optional host for portal launch/SSO, e.g. project.iot.mattr.ru."
            >
              <FormControl_Shadcn_>
                <Input_Shadcn_
                  {...field}
                  value={field.value ?? ''}
                  placeholder="project.iot.mattr.ru"
                  autoComplete="off"
                />
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
      </Panel.Content>
    </>
  )
}
