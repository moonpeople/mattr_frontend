/**
 * Контент секций inspector: общий рендер-пайплайн для набора секций.
 */
import { Fragment, type ReactNode } from 'react'

import { Separator } from 'ui'

import type {
  InspectorListSection,
  InspectorSectionRowSchema,
  InspectorSectionSchema,
} from '../../model'
import { InspectorListSectionBlock } from './InspectorListSectionBlock'
import { InspectorSectionBody } from './InspectorSectionBody'
import { InspectorSectionHeader } from './InspectorSectionHeader'

type InspectorSectionsContentProps = {
  sectionSchemas: InspectorSectionSchema[]
  isFilteringActive: boolean
  onToggleSection: (section?: string) => void
  renderSectionRow: (row: InspectorSectionRowSchema) => ReactNode
  renderListSection: (
    sectionSchema: InspectorSectionSchema,
    listSection: InspectorListSection
  ) => ReactNode
  renderStandaloneEventHandlers: (
    sectionSchema: InspectorSectionSchema
  ) => ReactNode
}

export const InspectorSectionsContent = ({
  sectionSchemas,
  isFilteringActive,
  onToggleSection,
  renderSectionRow,
  renderListSection,
  renderStandaloneEventHandlers,
}: InspectorSectionsContentProps) => {
  return (
    <div className="space-y-3">
      {sectionSchemas.map((sectionSchema, sectionIndex) => (
        <Fragment key={sectionSchema.key}>
          <div className="space-y-2 px-4">
            <InspectorSectionHeader
              section={sectionSchema.section}
              isCollapsible={sectionSchema.isCollapsible}
              isFilteringActive={isFilteringActive}
              onToggleSection={onToggleSection}
              advancedContent={
                sectionSchema.advancedRows.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-[11px] text-foreground-muted">
                      Advanced options
                    </div>
                    {sectionSchema.advancedRows.map((row) => renderSectionRow(row))}
                  </div>
                ) : undefined
              }
            />
            <InspectorSectionBody isCollapsed={sectionSchema.isCollapsed}>
              <>
                {sectionSchema.rows.map((row) => renderSectionRow(row))}
                {sectionSchema.listSections.map((listSection) => (
                  <InspectorListSectionBlock
                    key={`${sectionSchema.key}:list:${listSection.storageKey}`}
                  >
                    {renderListSection(sectionSchema, listSection)}
                  </InspectorListSectionBlock>
                ))}
                {renderStandaloneEventHandlers(sectionSchema)}
              </>
            </InspectorSectionBody>
          </div>
          {sectionIndex < sectionSchemas.length - 1 && <Separator />}
        </Fragment>
      ))}
    </div>
  )
}
