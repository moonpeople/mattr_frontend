import { Button, Input } from 'ui'

import type { WidgetDefinition } from '../types'

type AuthLoginProps = {
  label: string
  authType: string
}

export const AuthLoginWidget: WidgetDefinition<AuthLoginProps> = {
  type: 'AuthLogin',
  label: 'Auth Login',
  category: 'inputs',
  description: 'Login form placeholder',
  defaultProps: {
    label: 'Sign in',
    authType: '',
  },
  fields: [
    { key: 'label', label: 'Title', type: 'text', placeholder: 'Sign in' },
    { key: 'authType', label: 'Auth type', type: 'text', placeholder: 'password' },
  ],
  render: (props, context) => {
    const email = (context?.state?.email as string) ?? ''
    const password = (context?.state?.password as string) ?? ''

    return (
      <div className="space-y-3 rounded border border-foreground-muted/40 bg-surface-100 p-3">
        <div className="text-sm font-medium text-foreground">{props.label || 'Sign in'}</div>
        <Input
          placeholder="Email"
          value={email}
          onChange={(event) => context?.setState?.({ email: event.target.value })}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => context?.setState?.({ password: event.target.value })}
        />
        <Button
          type="primary"
          size="small"
          htmlType="button"
          onClick={() => context?.runActions?.('submit', { email, password })}
        >
          Login
        </Button>
        {props.authType && <div className="text-xs text-foreground-muted">Auth: {props.authType}</div>}
      </div>
    )
  },
}
