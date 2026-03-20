import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
export const metadata: Metadata = {
  title: '家計簿 — スマート家計管理',
  description: '収入・支出・貯金を記録して家計を見える化するアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
