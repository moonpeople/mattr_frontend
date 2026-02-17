import { config } from './config';
import type { Org, Project } from './types';

export async function fetchOrgsWithProjects(): Promise<Org[]> {
  if (!config.platformApi) return [];
  const orgs = await fetchOrganizations();
  const withProjects: Org[] = await Promise.all(
    orgs.map(async (org) => {
      let projects: Project[] = [];
      try {
        projects = await fetchProjects(org.slug);
      } catch (e) {
        projects = [];
      }
      return { ...org, projects };
    })
  );
  return withProjects;
}

export async function fetchOrganizations(): Promise<Org[]> {
  if (!config.platformApi) return [];
  const resp = await fetch(`${config.platformApi}/organizations`, { credentials: 'include' });
  if (!resp.ok) throw new Error(`organizations: ${resp.status}`);
  const data = await resp.json();
  return data.map((o: any) => ({ id: o.id ?? o.slug, name: o.name, slug: o.slug, projects: [] }));
}

export async function fetchProjects(orgSlug: string): Promise<Project[]> {
  if (!config.platformApi) return [];
  const resp = await fetch(`${config.platformApi}/organizations/${orgSlug}/projects`, { credentials: 'include' });
  if (!resp.ok) throw new Error(`projects(${orgSlug}): ${resp.status}`);
  const data = await resp.json();
  return data.map((p: any) => ({
    id: p.id ?? p.ref,
    ref: p.ref,
    name: p.name,
    orgSlug: p.organization_slug ?? orgSlug,
    projectType: p.project_type ?? 'base'
  }));
}
