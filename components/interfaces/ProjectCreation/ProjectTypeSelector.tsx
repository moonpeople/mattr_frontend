import { UseFormReturn } from 'react-hook-form'

import Panel from 'components/ui/Panel'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateProjectForm } from './ProjectCreation.schema'

interface ProjectTypeSelectorProps {
  form: UseFormReturn<CreateProjectForm>
}

const PROJECT_TYPES = [
  { value: 'base', label: 'Base (Supabase)' },
  { value: 'iot', label: 'IoT' },
]

export const ProjectTypeSelector = ({ form }: ProjectTypeSelectorProps) => {
  return (
    <Panel.Content>
      <FormField_Shadcn_
        control={form.control}
        name="projectType"
        render={({ field }) => (
          <FormItemLayout
            label="Project type"
            layout="horizontal"
            description="Choose a standard Supabase project or an IoT project."
          >
            <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl_Shadcn_>
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Select project type" />
                </SelectTrigger_Shadcn_>
              </FormControl_Shadcn_>
              <SelectContent_Shadcn_>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem_Shadcn_ key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
