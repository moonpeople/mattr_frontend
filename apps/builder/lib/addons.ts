import type { ProjectSelectedAddon } from 'data/subscriptions/types'

export const getAddons = (selectedAddons: ProjectSelectedAddon[]) => {
  const computeInstance = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const pitr = selectedAddons.find((addon) => addon.type === 'pitr')
  const customDomain = selectedAddons.find((addon) => addon.type === 'custom_domain')
  const ipv4 = selectedAddons.find((addon) => addon.type === 'ipv4')

  return { computeInstance, pitr, customDomain, ipv4 }
}
