'use client'

import { useEffect, useState } from 'react'
import { IS_PROD } from '../constants'

const defaultDark: { [name: string]: string } = {
  '--brand-accent': '49deg 100% 60%',
  '--brand-default': '49deg 100% 60%',
  '--brand-600': '49deg 100% 75%',
  '--brand-500': '49deg 100% 25%',
  '--brand-400': '49deg 100% 15%',
  '--brand-300': '49deg 100% 10%',
  '--brand-200': '49deg 100% 5%',
  '--border-stronger': '200deg 16.1% 22%',
  '--border-strong': '200deg 16.5% 17.8%',
  '--border-alternative': '200deg 16.4% 13.1%',
  '--border-control': '200deg 10% 14%',
  '--border-overlay': '200deg 20% 9%',
  '--border-secondary': '200deg 21.6% 10%',
  '--border-muted': '200deg 14.9% 9.2%',
  '--border-default': '200deg 10% 11%',
  '--background-muted': '200deg 9.1% 10.8%',
  '--background-overlay-hover': '200deg 20% 11%',
  '--background-overlay-default': '200deg 14.3% 6.9%',
  '--background-surface-300': '200deg 20% 10%',
  '--background-surface-200': '200deg 20% 7%',
  '--background-surface-100': '200deg 20% 6%',
  '--background-control': '200deg 9% 11%',
  '--background-selection': '49deg 100% 20%',
  '--background-alternative': '200deg 20% 2.9%',
  '--background-default': '200deg 20% 4%',
  '--foreground-muted': '200deg 10% 35%',
  '--foreground-lighter': '200deg 8% 55%',
  '--foreground-light': '200deg 5% 69%',
  '--foreground-default': '200deg 0% 93%',
}
const defaultLight: { [name: string]: string } = {
  '--brand-accent': '49deg 100% 50%',
  '--brand-default': '49deg 100% 50%',
  '--brand-600': '49deg 100% 35%',
  '--brand-500': '49deg 100% 45%',
  '--brand-400': '49deg 100% 65%',
  '--brand-300': '49deg 100% 80%',
  '--brand-200': '49deg 100% 90%',
  '--border-stronger': '205deg 10.7% 78%',
  '--border-strong': '210deg 11.1% 85.9%',
  '--border-secondary': '210deg 11.8% 93.3%',
  '--border-alternative': '216deg 11.1% 91.2%',
  '--border-control': '205.7deg 12.3% 88.8%',
  '--border-overlay': '216deg 11.1% 91.2%',
  '--border-muted': '210deg 11.8% 93.3%',
  '--border-default': '216deg 11.1% 91.2%',
  '--background-overlay-hover': '210deg 16.7% 95.3%',
  '--background-overlay-default': '210deg 33.3% 98.8%',
  '--background-surface-300': '210deg 11.8% 93.3%',
  '--background-surface-200': '210deg 16.7% 95.3%',
  '--background-surface-100': '210deg 33.3% 98.8%',
  '--background-control': '210deg 16.7% 95.3%',
  '--background-selection': '49deg 100% 90%',
  '--background-muted': '210deg 10% 93%',
  '--background-alternative': '210deg 10% 100%',
  '--background-default': '210deg 16.7% 97.6%',
  '--foreground-muted': '205.7deg 6.3% 56.1%',
  '--foreground-lighter': '205.7deg 5.7% 52.2%',
  '--foreground-light': '205.7deg 6.3% 43.5%',
  '--foreground-default': '201.8deg 24.4% 8.8%',
}

/**
 * Shows a GUI to test color themes in dev and preview env.
 *
 * To access sandbox mode:
 * - switch theme to dark mode
 * - append "#theme-sandbox" to the url
 * - select "Apply Theme" to apply preset (localStorage will keep track of changes so you don't lose new values)
 * - select "Reset localStorage" and refresh page to restart
 */
export const useThemeSandbox = (): any => {
  const isWindowUndefined = typeof window === 'undefined'
  if (isWindowUndefined || IS_PROD) return null
  const hash = window.location.hash
  const defaultConfig = defaultDark // use dark default tokens
  // const defaultConfig = defaultLight // use light default tokens
  const localPreset = localStorage.getItem('theme-sandbox')
  const isSandbox = hash.includes('#theme-sandbox') || localPreset !== null
  const [themeConfig, setThemeConfig] = useState(
    localPreset ? JSON.parse(localPreset) : defaultConfig
  )
  const styles = document.querySelector(':root') as any

  const handleSetThemeConfig = (name: string, value: any) => {
    updateCSSVariables()
    setThemeConfig((prevConfig: any) => ({ ...prevConfig, [name]: value }))
  }

  const updateCSSVariables = () => {
    Object.entries(themeConfig).map(([key, value]) => styles.style.setProperty(key, value))
    localStorage.setItem('theme-sandbox', JSON.stringify(themeConfig))
  }

  const init = async () => {
    if (!isSandbox) return
    const dat = await import('dat.gui')
    const gui = new dat.GUI()

    gui.width = 500

    Object.entries(defaultConfig).map(([key, _value]) => {
      if (!themeConfig[key]) return localStorage.removeItem('theme-sandbox')
      const folderName = key.split('-')[2]
      const folder = gui.__folders[folderName] ?? gui.addFolder(folderName)

      return folder
        .add(themeConfig, key)
        .name(key)
        .onChange((newValue) => {
          handleSetThemeConfig(key, newValue)
        })
    })

    var obj = {
      'Apply Theme': function () {
        updateCSSVariables()
      },
      'Exit Sandbox': function () {
        gui.destroy()
      },
      'Reset localStorage': function () {
        localStorage.removeItem('theme-sandbox')
        setThemeConfig(defaultConfig)
      },
    }

    gui.add(obj, 'Apply Theme')
    gui.add(obj, 'Reset localStorage')
    gui.add(obj, 'Exit Sandbox')
    gui.load
  }

  useEffect(() => {
    init()
  }, [])

  return { themeConfig, handleSetThemeConfig, isSandbox }
}

export default useThemeSandbox
