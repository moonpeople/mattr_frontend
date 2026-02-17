import type {
  BuilderPage,
  BuilderPageFrames,
  BuilderPageLayout,
  BuilderWidgetInstance,
} from '../types'
import {
  createDefaultMainFrame,
  createEmptyPageFrames,
} from '../types'

import { writePageLayoutToRecord } from './layout-model'

export const resolvePageMainState = (
  page: Pick<BuilderPage, 'pageLayout'> | null | undefined
): BuilderPageLayout['main'] =>
  page?.pageLayout.main ?? createDefaultMainFrame()

export const resolvePageWidgetsState = (
  page: Pick<BuilderPage, 'pageLayout'> | null | undefined
): BuilderWidgetInstance[] => page?.pageLayout.widgets ?? []

export const resolvePageFramesState = (
  page: Pick<BuilderPage, 'pageLayout'> | null | undefined
): BuilderPageFrames =>
  page?.pageLayout.frames ?? createEmptyPageFrames()

export const applyPageFrames = (
  page: BuilderPage,
  frames: BuilderPageFrames
): BuilderPage => {
  const nextLayout: BuilderPageLayout = {
    main: resolvePageMainState(page),
    widgets: resolvePageWidgetsState(page),
    frames,
  }
  return {
    ...page,
    pageLayout: nextLayout,
    layout: writePageLayoutToRecord(page.layout, nextLayout),
  }
}

export const applyPageWidgets = (
  page: BuilderPage,
  widgets: BuilderWidgetInstance[]
): BuilderPage => {
  const nextLayout: BuilderPageLayout = {
    main: resolvePageMainState(page),
    widgets,
    frames: resolvePageFramesState(page),
  }
  return {
    ...page,
    pageLayout: nextLayout,
    layout: writePageLayoutToRecord(page.layout, nextLayout),
  }
}

export const applyPageMain = (
  page: BuilderPage,
  main: BuilderPageLayout['main']
): BuilderPage => {
  const nextLayout: BuilderPageLayout = {
    main,
    widgets: resolvePageWidgetsState(page),
    frames: resolvePageFramesState(page),
  }
  return {
    ...page,
    pageLayout: nextLayout,
    layout: writePageLayoutToRecord(page.layout, nextLayout),
  }
}

export const updatePageById = (
  pages: BuilderPage[],
  pageId: string,
  updater: (page: BuilderPage) => BuilderPage
): BuilderPage[] =>
  pages.map((page) => (page.id === pageId ? updater(page) : page))
