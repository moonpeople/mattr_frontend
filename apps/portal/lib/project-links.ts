export type ProjectLinkType = 'base' | 'iot' | 'builder'

type ProjectLike = {
  ref: string
  project_type?: string | null
  projectType?: string | null
}

export const getProjectType = (project: ProjectLike): ProjectLinkType => {
  const rawType = project.project_type ?? project.projectType
  if (rawType === 'iot') return 'iot'
  if (rawType === 'builder') return 'builder'
  return 'base'
}

export const getProjectHref = (project: ProjectLike) => {
  const projectType = getProjectType(project)

  if (projectType === 'iot') return `/iot/project/${project.ref}`
  return `/studio/project/${project.ref}`
}
