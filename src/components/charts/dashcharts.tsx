'use client'

import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { useKakeiboStore } from '@/store'
import { getMonthTx, sumCat } from '@/lib/utils'
import { CAT_COLORS, CATS } from '@/lib/constants'
import { Card, SectionTitle } from '@/components/UI'
import type { KpiResult } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement)

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#9898aa', font: { size: 11 } } } },
} as const

interface Props { month: string; kpi: KpiResult }

export function DashCharts({ month, kpi }: Props) {
  const transactions = useKakeiboStore((s: any) => s.transactions)
  const txs = getMonthTx(transactions, month)

  // Donut data
  const donutData = {
    labels: ['収入', '支出', '貯金'],
    datasets: [{
      data: [kpi.income, kpi.totalExpense, kpi.saving],
      backgroundColor: ['#2dbe8a', '#e05555', '#4a9fe0'],
      borderWidth: 0,
    }],
  }

  // Category bar data
  const expCats = CATS.expense.filter((c: any) => sumCat(txs, c) > 0)
  const barData = {
    labels: expCats,
    datasets: [{
      data: expCats.map((c: any) => sumCat(txs, c)),
      backgroundColor: expCats.map((c: any) => CAT_COLORS[c] || '#888'),
      borderWidth: 0,
    }],
  }
  const barOpts = {
    ...CHART_OPTS,
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9898aa', font: { size: 10 }, callback: (v: any) => '¥' + Number(v).toLocaleString() }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#9898aa', font: { size: 10 } }, grid: { display: false } },
    },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
      <Card>
        <SectionTitle>収支内訳</SectionTitle>
        {kpi.hasData ? (
          <div style={{ position: 'relative', height: 200 }}>
            <Doughnut data={donutData} options={{ ...CHART_OPTS, plugins: { legend: { position: 'bottom', labels: { color: '#9898aa', font: { size: 11 } } } } }} />
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text3)', padding: '40px 0', textAlign: 'center' }}>データなし</p>
        )}
      </Card>
      <Card>
        <SectionTitle>支出カテゴリ</SectionTitle>
        {expCats.length > 0 ? (
          <div style={{ position: 'relative', height: 200 }}>
            <Bar data={barData} options={barOpts} />
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text3)', padding: '40px 0', textAlign: 'center' }}>データなし</p>
        )}
      </Card>
    </div>
  )
}
