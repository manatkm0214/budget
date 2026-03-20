'use client'

import { useState } from 'react'
import { useKakeiboStore } from '@/store'
import { useMonthTransactions } from '@/hooks'
import { currentMonth, fmt, sumBy, getMonthTx } from '@/lib/utils'
import { CAT_COLORS } from '@/lib/constants'
import { MonthNav, Btn, SectionTitle, Modal } from '@/components/UI'
import { showToast } from '@/components/UI/toast'
import type { Transaction } from '@/types'

export default function HistoryPage() {
  const [month, setMonth]         = useState(currentMonth())
  const [deleteModal, setDeleteModal] = useState(false)
  const transactions = useKakeiboStore((s: any) => s.transactions)
  const deleteTx     = useKakeiboStore((s: any) => s.deleteTransaction)
  const deleteMonth  = useKakeiboStore((s: any) => s.deleteMonthTx)

  const monthTxs = useMonthTransactions(month)
  const income  = sumBy(monthTxs, 'income')
  const expense = sumBy(monthTxs, 'expense')
  const saving  = sumBy(monthTxs, 'saving')
  const balance = income - expense - saving

  function handleDeleteMonth() {
    deleteMonth(month)
    setDeleteModal(false)
    showToast(`🗑️ ${month} のデータを削除しました`)
  }

  const TYPE_COLOR: Record<string, string> = {
    income: 'var(--green)', expense: 'var(--red)',
    saving: 'var(--blue)', fixed: 'var(--amber)',
  }

  return (
    <div>
      <MonthNav month={month} onChange={setMonth}>
        <Btn variant="danger" style={{ marginLeft: 'auto' }} onClick={() => setDeleteModal(true)}>
          🗑️ この月を削除
        </Btn>
      </MonthNav>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: '収入', val: income, color: 'var(--green)' },
          { label: '支出', val: expense, color: 'var(--red)' },
          { label: '貯金', val: saving,  color: 'var(--blue)' },
          { label: '収支', val: balance, color: balance >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '12px 16px', minWidth: 100,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{s.label}</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{fmt(s.val)}</div>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {monthTxs.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>この月の取引はありません</p>
        ) : monthTxs.map(t => (
          <div key={t.id} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius2)', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: CAT_COLORS[t.category] || '#888' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}>{t.note || t.category}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.category} / {t.method}</div>
              {t.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                  {t.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--text3)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.date}</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: TYPE_COLOR[t.type] }}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </div>
            <button onClick={() => deleteTx(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14 }}>
              🗑
            </button>
          </div>
        ))}
</div>

{/* PRINT PREVIEW PAGE */}
<div id="page-print-preview" className="page">
  {/* toolbar (non-print) */}
  <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
    <div style={{ fontSize: '13px', color: 'var(--text2)' }}>印刷する月を選択してください</div>
    <input type="month" id="print-month" onChange={() => {}} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: 'var(--radius2)', fontSize: '14px' }} />
    <button className="btn" onClick={() => {}}>◀</button>
    <button className="btn" onClick={() => {}}>▶</button>
    <button className="btn" onClick={() => {}}>今月</button>
    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
      <select id="print-range" onChange={() => {}} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 'var(--radius2)', fontSize: '13px' }}>
        <option value="dashboard">ダッシュボード（KPI＋サマリー）</option>
        <option value="history">取引履歴</option>
        <option value="budget">予算達成状況</option>
        <option value="all">全ページ一括</option>
      </select>
      <button className="btn btn-primary" onClick={() => {}}>🖨️ 印刷ダイアログを開く</button>
      <button className="btn" onClick={() => {}}>↗ 別窓で印刷</button>
    </div>
  </div>

  {/* preview content (rendered by JS, also used for actual print) */}
  <div id="print-body"></div>
</div>

<Modal
        open={deleteModal}
        title="この月を削除"
        body={`${month} のすべての取引データを削除します。この操作は元に戻せません。`}
        onConfirm={handleDeleteMonth}
        onClose={() => setDeleteModal(false)}
      />
    </div>
  )
}
