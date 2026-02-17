import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['latitude', 'longitude', 'zoom', 'points']

export const MapInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  latitude: {
    placeholder: '37.7577',
  },
  longitude: {
    placeholder: '-122.4376',
  },
  zoom: {
    placeholder: '8',
  },
  points: {
    placeholder: '[{"latitude":1,"longitude":2}]',
  },
})
