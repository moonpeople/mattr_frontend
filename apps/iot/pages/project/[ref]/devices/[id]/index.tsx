import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import { DeviceDetailsPage } from 'components/interfaces/Iot/Devices/DeviceDetailsPage'
import type { NextPageWithLayout } from 'types'

const DevicePage: NextPageWithLayout = () => {
  return <DeviceDetailsPage />
}

DevicePage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default DevicePage
