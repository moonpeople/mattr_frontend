import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'

const ClickhouseIndexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref) return
    router.replace(`/project/${ref}/clickhouse/tables`)
  }, [ref, router])

  return null
}

ClickhouseIndexPage.getLayout = (page) => page

export default ClickhouseIndexPage
