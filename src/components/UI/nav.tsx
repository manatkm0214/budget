'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useKakeiboStore } from '@/store'
import { exportTransactionsCSV, downloadFile, today } from '@/lib/utils'
import { showToast } from './toast'
import styles from './nav.module.css'

const TABS = [
  { href: '/dashboard', label: '📊 ダッシュボード' },
  { href: '/setup',     label: '⚙️ 初期設定' },
  { href: '/input',     label: '➕ 入力' },
  { href: '/history',   label: '📋 履歴' },
  { href: '/charts',    label: '📈 グラフ' },
  { href: '/budget',    label: '🎯 予算' },
  { href: '/guide',     label: '📖 判断基準' },
  { href: '/ai',        label: '🤖 AI分析' },
  { href: '/print',     label: '🖨️ 印刷' },
]

export function Nav() {
  const pathname     = usePathname()
  const router       = useRouter()
  const theme        = useKakeiboStore(s => s.settings.theme)
  const setTheme     = useKakeiboStore(s => s.setTheme)
  const transactions = useKakeiboStore(s => s.transactions)
  const fixedCosts   = useKakeiboStore(s => s.fixedCosts)
  const budgets      = useKakeiboStore(s => s.budgets)
  const goals        = useKakeiboStore(s => s.goals)
  const resetAll     = useKakeiboStore(s => s.resetAll)

  function handleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  function handleCSV() {
    if (!transactions.length) { showToast('⚠️ 取引データがありません'); return }
    exportTransactionsCSV(transactions)
    showToast('✓ CSVをダウンロードしました')
  }

  function handleJSON() {
    const data = { transactions, fixedCosts, budgets, goals, exportDate: new Date().toISOString() }
    downloadFile(JSON.stringify(data, null, 2), `kakeibo_backup_${today()}.json`, 'application/json')
    showToast('✓ JSONバックアップを保存しました')
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: '家計簿', url }); return } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return
      }
    }
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(url); showToast('🔗 URLをコピーしました'); return } catch {}
    }
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.cssText = 'position:fixed;top:-9999px'
    document.body.appendChild(ta); ta.focus(); ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    showToast('🔗 URLをコピーしました')
  }

  function handleDeleteAll() {
    if (window.confirm('全データを削除します。この操作は元に戻せません。')) {
      resetAll()
      showToast('🗑️ 全データを削除しました')
      router.push('/setup')
    }
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.row1}>
        <span className={styles.brand}>家計簿</span>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <Link
              key={t.href}
              href={t.href}
              className={`${styles.tab} ${pathname === t.href ? styles.active : ''}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      <div className={styles.row2}>
        <button className={styles.btn} onClick={handleShare}>🔗 共有</button>
        <div className={styles.sep} />
        <button className={styles.btn} onClick={handleJSON}>💾 JSONバックアップ</button>
        <button className={styles.btn} onClick={handleCSV}>📄 CSVエクスポート</button>
        <div className={styles.sep} />
        <button className={styles.btn} onClick={handleTheme}>
          {theme === 'dark' ? '☀️ ライト' : '🌙 ダーク'}
        </button>
        <button className={`${styles.btn} ${styles.danger}`} onClick={handleDeleteAll}>
          🗑️ 全データ削除
        </button>
      </div>
    </nav>
  )
}
