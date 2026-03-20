'use client'

import { useEffect } from 'react'
import { useKakeiboStore } from '@/store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useKakeiboStore((s: { settings: { theme: any } }) => s.settings.theme) as string
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return <>{children}</>
}
