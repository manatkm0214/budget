'use client'

import { useState } from 'react'
import { useMonthKpis, useMonthTransactions } from '@/hooks'
import { currentMonth, fmt, sumCat, getMonthTx } from '@/lib/utils'
import { CAT_COLORS, CATS } from '@/lib/constants'
import { Card, KpiCard, Alert, MonthNav, SectionTitle } from '@/components/UI'
import { DashCharts } from '@/components/charts/dashcharts'

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth())
  const kpi    = useMonthKpis(month)
  const recent = useMonthTransactions(month).slice(0, 5)

  return (
    <div>
      <MonthNav month={month} onChange={setMonth}>
        {kpi.safety && (
          <span className={`safety-badge ${kpi.safety.cls}`} style={{ marginLeft: 8 }}>
            {kpi.safety.label}
          </span>
        )}
      </MonthNav>

      {/* Alerts */}
      <div style={{ marginBottom: 16 }}>
        {kpi.alerts.map((a, i) => <Alert key={i} type={a.type}>{a.msg}</Alert>)}
      </div>

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12, marginBottom: 20,
      }}>
        {kpi.kpis.map(k => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Charts */}
      <DashCharts month={month} kpi={kpi} />

      {/* Recent transactions */}
      <Card>
        <SectionTitle>今月の取引（直近5件）</SectionTitle>
        {recent.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>取引がありません</p>
        ) : (
          recent.map(t => <TxRow key={t.id} tx={t} />)
        )}
      </Card>
    </div>
  )
}

function TxRow({ tx }: { tx: import('@/types').Transaction }) {
  const colors: Record<string, string> = {
    income: 'var(--green)', expense: 'var(--red)',
    saving: 'var(--blue)', fixed: 'var(--amber)',
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: CAT_COLORS[tx.category] || '#888',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13 }}>{tx.note || tx.category}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
          {tx.category} / {tx.method}
        </div>
        {tx.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {tx.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 10,
                background: 'var(--bg3)', color: 'var(--text3)',
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{tx.date}</div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: colors[tx.type] }}>
        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
      </div>
    </div>
  )
}
