import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const disableHcaptcha = process.env.NEXT_PUBLIC_ENABLE_HCAPTCHA !== 'true'
const iotStudioUrl = process.env.IOT_STUDIO_URL || process.env.NEXT_PUBLIC_IOT_STUDIO_URL

/** Minimal Next.js config for the portal shell. */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  async redirects() {
    if (!iotStudioUrl) {
      return []
    }

    return [
      {
        source: '/iot/:ref([a-z0-9-]{16,36})',
        destination: '/iot/project/:ref',
        permanent: false,
      },
      {
        source: '/iot/:ref([a-z0-9-]{16,36})/:path*',
        destination: '/iot/project/:ref/:path*',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    const rules = [
      { source: '/base/:ref', destination: '/project/:ref' },
      { source: '/base/:ref/:path*', destination: '/project/:ref/:path*' },
    ]

    if (iotStudioUrl) {
      rules.unshift(
        { source: '/iot/_next/:path*', destination: `${iotStudioUrl}/iot/_next/:path*` },
        { source: '/iot/static/:path*', destination: `${iotStudioUrl}/iot/static/:path*` },
        { source: '/iot/favicon.ico', destination: `${iotStudioUrl}/iot/favicon.ico` },
        {
          source: '/iot/:ref([a-z0-9-]{16,36})',
          destination: `${iotStudioUrl}/iot/project/:ref`,
        },
        {
          source: '/iot/:ref([a-z0-9-]{16,36})/:path*',
          destination: `${iotStudioUrl}/iot/project/:ref/:path*`,
        },
        { source: '/iot/:path*', destination: `${iotStudioUrl}/iot/:path*` }
      )
    }

    return rules
  },
  // Turbopack enabled by default in Next 16; empty config silences warning
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  transpilePackages: ['ui', 'ui-patterns', 'icons', 'common', 'shared-data', 'config', 'api-types', 'ai-commands'],
  webpack: (config) => {
    if (disableHcaptcha) {
      config.resolve = config.resolve || {}
      config.resolve.alias = config.resolve.alias || {}
      config.resolve.alias['@hcaptcha/react-hcaptcha'] = path.join(__dirname, 'lib', 'hcaptcha-stub.tsx')
    }
    return config
  }
};

export default nextConfig;
