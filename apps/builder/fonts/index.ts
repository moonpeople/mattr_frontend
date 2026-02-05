import { Source_Code_Pro } from 'next/font/google'
import localFont from 'next/font/local'

export const customFont = localFont({
  variable: '--font-custom',
  display: 'swap',
  fallback: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
  src: [
    {
      path: './inter/InterVariable.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: './inter/InterVariable-Italic.woff2',
      weight: '100 900',
      style: 'italic',
    },
  ],
})

export const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  fallback: ['Source Code Pro', 'Office Code Pro', 'Menlo', 'monospace'],
  variable: '--font-source-code-pro',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})
