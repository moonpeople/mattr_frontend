// Add at the top of the file, with other imports
export const RESTRICTION_MESSAGES = {
  GRACE_PERIOD: {
    title: 'Organization plan has exceeded its quota',
    message: (date: string) => `You are given a grace period until ${date}`,
  },
  GRACE_PERIOD_OVER: {
    title: 'Grace period is over',
    message: 'Your Projects will not be able to serve requests when you used up your quota.',
  },
  RESTRICTED: {
    title: 'Services Restricted',
    message:
      'Your Projects are unable to serve any requests as your Organization plan has used up its quota.',
  },
} as const
