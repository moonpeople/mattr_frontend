export type ProjectTypePlatform = 'base' | 'iot' | 'builder';

export type Project = {
  id: string | number;
  ref: string;
  name: string;
  orgSlug: string;
  projectType: ProjectTypePlatform;
};

export type Org = {
  id: string | number;
  name: string;
  slug: string;
  projects: Project[];
};
