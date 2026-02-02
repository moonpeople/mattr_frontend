import { useParams } from 'common'
import DeviceModelLayout from 'components/layouts/DevicesLayout/DeviceModelLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'
import { DeviceModelEditorTabs } from '../../devices'

const DeviceModelDataTypeKeysPage: NextPageWithLayout = () => {
  const { id } = useParams()
  const modelId = Number(id)

  if (!Number.isFinite(modelId)) {
    return <p className="text-sm text-foreground-light">Invalid device model.</p>
  }

  return (
    <DeviceModelEditorTabs modelId={modelId} activeStep={2} />
  )
}

DeviceModelDataTypeKeysPage.getLayout = (page) => (
  <DefaultLayout>
    <DeviceModelLayout>{page}</DeviceModelLayout>
  </DefaultLayout>
)

export default DeviceModelDataTypeKeysPage
