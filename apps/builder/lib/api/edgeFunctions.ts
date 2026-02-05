export const isValidEdgeFunctionURL = (url: string) => {
  const nimbusProdProjectsUrl = process.env.NIMBUS_PROD_PROJECTS_URL
  const allowLocalUrls =
    process.env.EDGE_FUNCTIONS_ALLOW_LOCAL_URLS === 'true' || process.env.NODE_ENV !== 'production'

  if (nimbusProdProjectsUrl !== undefined) {
    const apexDomain = nimbusProdProjectsUrl.replace('https://*.', '').replace(/\./g, '\\.')
    const nimbusRegex = new RegExp('^https://[a-z]*\\.' + apexDomain + '/functions/v[0-9]{1}/.*$')
    return nimbusRegex.test(url)
  }

  if (allowLocalUrls) {
    const localRegex = new RegExp(
      '^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]{1,5})?/functions/v[0-9]{1}/.*$'
    )
    if (localRegex.test(url)) {
      return true
    }
  }

  const regexValidEdgeFunctionURL = new RegExp(
    '^https://[a-z]*.supabase.(red|co)/functions/v[0-9]{1}/.*$'
  )

  return regexValidEdgeFunctionURL.test(url)
}
