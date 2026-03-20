'use client'

import { useKakeiboStore } from '@/store'
import { currentMonth, getMonthTx, sumCat, fmt } from '@/lib/utils'
import { CATS, CAT_COLORS } from '@/lib/constants'
import { Card, SectionTitle, FormGroup, Input, Btn, Alert } from '@/components/UI'
export default function BudgetPage() {
  const budgets    = useKakeiboStore((s: any) => s.budgets)
  const goals      = useKakeiboStore((s: any) => s.goals)
  const setBudgets = useKakeiboStore((s: any) => s.setBudgets)
  const setGoals   = useKakeiboStore((s: any) => s.setGoals)
  const transactions = useKakeiboStore((s: any) => s.transactions)

  const month = currentMonth()
  const txs   = getMonthTx(transactions, month)
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const saving = txs.filter(t => t.type === 'saving').reduce((s, t) => s + t.amount, 0)
  const savingRate = income > 0 ? saving / income * 100 : 0

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Goals */}
        <Card>
          <SectionTitle>貯金・防衛目標</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {([
              { key: 'saving',    label: '月間貯金目標（円）',     placeholder: '50000' },
              { key: 'presaving', label: '先取り貯金目標（円）',   placeholder: '30000' },
              { key: 'defense',   label: '生活防衛月数（ヶ月）',   placeholder: '6' },
              { key: 'passive',   label: '受動収入（円/月）',       placeholder: '0' },
            ] as const).map(({ key, label, placeholder }) => (
              <FormGroup key={key} label={label}>
                <Input
                  type="number"
                  defaultValue={goals[key] ?? ''}
                  placeholder={placeholder}
                  onBlur={e => setGoals({ [key]: parseFloat(e.target.value) || 0 })}
                />
              </FormGroup>
            ))}
          </div>
          {savingRate >= 20 && (
            <div style={{ marginTop: 12 }}>
              <Alert type="ok">
                🎉 貯蓄率{Math.round(savingRate)}%達成！投資カテゴリの追加を検討してみましょう。
              </Alert>
            </div>
          )}
        </Card>

        {/* Category budgets */}
        <Card>
          <SectionTitle>カテゴリ別月間予算</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATS.expense.map(cat => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[cat] || '#888', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12 }}>{cat}</span>
                <input
                  type="number"
                  defaultValue={budgets[cat] || ''}
                  placeholder="0"
                  style={{
                    width: 100, background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--text)', padding: '4px 8px', borderRadius: 6, fontSize: 12,
                  }}
                  onBlur={e => setBudgets({ ...budgets, [cat]: parseInt(e.target.value) || 0 })}
                />
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>円</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Budget progress */}
      <Card>
        <SectionTitle>今月の予算達成状況</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {CATS.expense.filter(c => budgets[c]).map(cat => {
            const bgt   = budgets[cat]
            const spent = sumCat(txs, cat)
            const pct   = Math.min(spent / bgt * 100, 100)
            const color = pct > 100 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--green)'
            return (
              <div key={cat} style={{
                background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{cat}</span>
                  <span className="mono" style={{ fontSize: 12, color }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  <span>{fmt(spent)}</span><span>{fmt(bgt)}</span>
                </div>
              </div>
            )
          })}
          {!CATS.expense.some(c => budgets[c]) && (
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>予算が設定されていません</p>
          )}
        </div>
      </Card>
    </div>
  )
}
