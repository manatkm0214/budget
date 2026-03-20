'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useKakeiboStore } from '@/store/index'
import { Nav } from '@/components/UI/nav'
import { Toast } from '@/components/UI/toast'
import { ThemeProvider } from '@/components/UI/themeprovider'

export function Providers({ children }: { children: React.ReactNode }) {
  const setupDone = useKakeiboStore((s: { settings: { setupDone: boolean } }) => s.settings.setupDone)
  const router    = useRouter()
  const pathname  = usePathname()

  // First-time: redirect to setup
  useEffect(() => {
    if (!setupDone && pathname !== '/setup') {
      router.replace('/setup')
    }
  }, [setupDone, pathname, router])

  return (
    <ThemeProvider>
      <Nav />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
        {children}
      </main>
      <Toast />
    </ThemeProvider>
  )
}
