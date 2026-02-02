import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { generateDevicesMenu } from './DevicesMenu.utils'

const DevicesProductMenu = () => {
  const router = useRouter()
  const { ref: projectRef = 'default' } = useParams()
  const cleanedPath = router.asPath.split('?')[0]
  const [pathPart, hashPart] = cleanedPath.split('#')
  const basePage = pathPart.split('/')[3] ?? 'devices'
  const page = hashPart ? `${basePage}#${hashPart}` : basePage

  return <ProductMenu page={page} menu={generateDevicesMenu(projectRef)} />
}

const DevicesLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ProjectLayout product="Devices" productMenu={<DevicesProductMenu />} isBlocking={false}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(DevicesLayout)
