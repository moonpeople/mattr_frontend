import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { IotInstanceSettings } from 'components/interfaces/Iot/Settings/IotInstanceSettings'
import type { NextPageWithLayout } from 'types'

const IotSettings: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer bottomPadding>
      <IotInstanceSettings />
    </ScaffoldContainer>
  )
}

IotSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="IoT Settings">
      <PageLayout title="Настройки IoT" subtitle="Глобальные параметры приёма сообщений и ключи.">
        {page}
      </PageLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default IotSettings
