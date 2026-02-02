const platformEnv = process.env.NEXT_PUBLIC_PLATFORM_API_URL;
const authEnv = process.env.NEXT_PUBLIC_AUTH_URL;

function normalizePlatformApi(url?: string | null) {
  if (!url) return '';
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/platform')) return trimmed;
  return `${trimmed}/api/platform`;
}

export const config = {
  platformApi: normalizePlatformApi(platformEnv),
  authUrl: authEnv?.replace(/\/+$/, '') || ''
};
