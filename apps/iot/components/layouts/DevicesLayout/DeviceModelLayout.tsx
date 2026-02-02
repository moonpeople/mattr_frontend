import { PropsWithChildren } from 'react'

import DevicesLayout from './DevicesLayout'

type DeviceModelLayoutProps = PropsWithChildren

const DeviceModelLayout = ({ children }: DeviceModelLayoutProps) => {
  return <DevicesLayout>{children}</DevicesLayout>
}

export default DeviceModelLayout
