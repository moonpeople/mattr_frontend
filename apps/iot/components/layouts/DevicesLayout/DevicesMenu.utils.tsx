import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateDevicesMenu = (projectRef: string): ProductMenuGroup[] => {
  return [
    {
      title: 'Devices',
      items: [
        { name: 'Devices', key: 'devices', url: `/project/${projectRef}/devices`, items: [] },
        {
          name: 'Device models',
          key: 'device-models',
          url: `/project/${projectRef}/device-models`,
          items: [],
        },
        {
          name: 'Data type keys',
          key: 'data-type-keys',
          url: `/project/${projectRef}/data-type-keys`,
          items: [],
        },
        {
          name: 'Unknown devices',
          key: 'unknown-devices',
          url: `/project/${projectRef}/unknown-devices`,
          items: [],
        },
      ],
    },
    {
      title: 'Gateways',
      items: [
        { name: 'Gateways', key: 'gateways', url: `/project/${projectRef}/gateways`, items: [] },
      ],
    },
    {
      title: 'Rules',
      items: [
        {
          name: 'Core rules',
          key: 'rule-chains',
          url: `/project/${projectRef}/rule-chains`,
          items: [],
        },
        {
          name: 'Ingest rules',
          key: 'ingest-chains',
          url: `/project/${projectRef}/ingest-chains`,
          items: [],
        },
      ],
    },
    {
      title: 'Alerts',
      items: [
        { name: 'Alerts', key: 'alerts', url: `/project/${projectRef}/alerts`, items: [] },
      ],
    },
  ]
}
