import localFont from 'next/font/local'

export const customFont = localFont({
  variable: '--font-custom',
  display: 'swap',
  fallback: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  src: [
    {
      path: './Inter/Inter-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: './Inter/Inter-ThinItalic.woff2',
      weight: '100',
      style: 'italic',
    },
    {
      path: './Inter/Inter-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './Inter/Inter-ExtraLightItalic.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: './Inter/Inter-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './Inter/Inter-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './Inter/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './Inter/Inter-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './Inter/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './Inter/Inter-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './Inter/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './Inter/Inter-SemiBoldItalic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './Inter/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './Inter/Inter-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './Inter/Inter-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './Inter/Inter-ExtraBoldItalic.woff2',
      weight: '800',
      style: 'italic',
    },
    {
      path: './Inter/Inter-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: './Inter/Inter-BlackItalic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
})

export const sourceCodePro = localFont({
  variable: '--font-source-code-pro',
  display: 'swap',
  fallback: ['Source Code Pro', 'Office Code Pro', 'Menlo', 'monospace'],
  src: [
    {
      path: './SourceCodePro/SourceCodePro-ExtraLight.ttf',
      weight: '200',
      style: 'normal',
    },
    {
      path: './SourceCodePro/SourceCodePro-ExtraLightItalic.ttf',
      weight: '200',
      style: 'italic',
    },
    {
      path: './SourceCodePro/SourceCodePro-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: './SourceCodePro/SourceCodePro-LightItalic.ttf',
      weight: '300',
      style: 'italic',
    },
    {
      path: './SourceCodePro/SourceCodePro-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './SourceCodePro/SourceCodePro-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './SourceCodePro/SourceCodePro-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './SourceCodePro/SourceCodePro-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },
    {
      path: './SourceCodePro/SourceCodePro-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: './SourceCodePro/SourceCodePro-SemiBoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: './SourceCodePro/SourceCodePro-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './SourceCodePro/SourceCodePro-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
    {
      path: './SourceCodePro/SourceCodePro-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: './SourceCodePro/SourceCodePro-ExtraBoldItalic.ttf',
      weight: '800',
      style: 'italic',
    },
    {
      path: './SourceCodePro/SourceCodePro-Black.ttf',
      weight: '900',
      style: 'normal',
    },
    {
      path: './SourceCodePro/SourceCodePro-BlackItalic.ttf',
      weight: '900',
      style: 'italic',
    },
  ],
})
