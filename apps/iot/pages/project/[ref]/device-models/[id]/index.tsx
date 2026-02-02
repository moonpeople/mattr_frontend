import { useParams } from 'common'
import DeviceModelLayout from 'components/layouts/DevicesLayout/DeviceModelLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'

const DeviceModelIndexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = useParams()

  useEffect(() => {
    if (!ref || !id) return
    router.replace(`/project/${ref}/device-models/${id}/details`)
  }, [ref, id, router])

  return null
}

DeviceModelIndexPage.getLayout = (page) => (
  <DefaultLayout>
    <DeviceModelLayout>{page}</DeviceModelLayout>
  </DefaultLayout>
)

export default DeviceModelIndexPage
