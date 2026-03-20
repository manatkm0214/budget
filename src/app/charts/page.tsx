'use client'

import { useState } from 'react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  RadialLinearScale, Filler,
} from 'chart.js'
import { Pie, Line, Bar, Radar } from 'react-chartjs-2'

import { useKakeiboStore, selectFixedTotal } from '@/store'
import { currentMonth, getMonthTx, sumCat, sumBy, shiftMonth } from '@/lib/utils'
import { CAT_COLORS, CATS } from '@/lib/constants'
import { MonthNav, Card, SectionTitle } from '@/components/UI'

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  RadialLinearScale, Filler,
)

const TICK = { color: '#9898aa', font: { size: 10 } }
const GRID = { color: 'rgba(255,255,255,0.05)' }

export default function ChartsPage() {
  const [month, setMonth]  = useState(currentMonth())
  const transactions       = useKakeiboStore((s: any) => s.transactions)
  const budgets            = useKakeiboStore((s: any) => s.budgets)
  const fixedTotal         = useKakeiboStore(selectFixedTotal)
  const [y]                = month.split('-').map(Number)

  const txs = getMonthTx(transactions, month)

  // ---- Pie chart ----
  const expCats = CATS.expense.filter(c => sumCat(txs, c) > 0)
  const pieData = {
    labels: expCats,
    datasets: [{ data: expCats.map(c => sumCat(txs, c)), backgroundColor: expCats.map(c => CAT_COLORS[c] || '#888'), borderWidth: 0 }],
  }

  // ---- Line: 12 months ----
  const months12 = Array.from({ length: 12 }, (_, i) => shiftMonth(`${y}-01`, i))
  const lineData = {
    labels: months12.map(m => m.slice(5) + '月'),
    datasets: [
      { label: '収入', data: months12.map(m => sumBy(getMonthTx(transactions, m), 'income')),  borderColor: '#2dbe8a', backgroundColor: 'rgba(45,190,138,0.1)', tension: 0.4, fill: true },
      { label: '支出', data: months12.map(m => sumBy(getMonthTx(transactions, m), 'expense')), borderColor: '#e05555', backgroundColor: 'rgba(224,85,85,0.1)',   tension: 0.4, fill: true },
      { label: '貯金', data: months12.map(m => sumBy(getMonthTx(transactions, m), 'saving')),  borderColor: '#4a9fe0', backgroundColor: 'rgba(74,159,224,0.1)',   tension: 0.4, fill: true },
    ],
  }
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9898aa', font: { size: 10 } } } },
    scales: {
      x: { ticks: TICK, grid: GRID },
      y: { ticks: { ...TICK, callback: (v: any) => '¥' + Number(v).toLocaleString() }, grid: GRID },
    },
  }

  // ---- Stacked bar: 6 months ----
  const months6   = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5))
  const topCats   = CATS.expense.filter(c => months6.some(m => sumCat(getMonthTx(transactions, m), c) > 0)).slice(0, 6)
  const barData   = {
    labels: months6.map(m => m.slice(5) + '月'),
    datasets: topCats.map(c => ({
      label: c,
      data: months6.map(m => sumCat(getMonthTx(transactions, m), c)),
      backgroundColor: CAT_COLORS[c] || '#888',
      borderWidth: 0,
      stack: 'a',
    })),
  }
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9898aa', font: { size: 10 } } } },
    scales: {
      x: { stacked: true, ticks: TICK, grid: GRID },
      y: { stacked: true, ticks: { ...TICK, callback: (v: any) => '¥' + Number(v).toLocaleString() }, grid: GRID },
    },
  }

  // ---- Radar ----
  const inc     = sumBy(txs, 'income')
  const exp     = sumBy(txs, 'expense')
  const sav     = sumBy(txs, 'saving')
  const waste   = txs.filter(t => ['娯楽', '外食'].includes(t.category)).reduce((s, t) => s + t.amount, 0)
  const totalBgt = Object.values(budgets).reduce((a: number, b: unknown) => a + (b as number), 0)
  const radarData = {
    labels: ['貯蓄率', '収支安定', '節約率', '浪費抑制', '固定費適正'],
    datasets: [{
      label: '今月',
      data: [
        Math.min(inc > 0 ? (sav / inc) * 100 : 0, 100),
        75,
        Math.min(totalBgt > 0 ? ((totalBgt - exp) / totalBgt) * 50 + 50 : 50, 100),
        Math.max(100 - (exp > 0 ? (waste / exp) * 200 : 0), 0),
        Math.max(100 - (inc > 0 ? (fixedTotal / inc) * 100 : 0), 0),
      ],
      borderColor: '#7c6fe0',
      backgroundColor: 'rgba(124,111,224,0.2)',
      pointBackgroundColor: '#7c6fe0',
    }],
  }
  const radarOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#9898aa', font: { size: 10 } } } },
  }

  return (
    <div>
      <MonthNav month={month} onChange={setMonth} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        <Card><SectionTitle>支出カテゴリ（円グラフ）</SectionTitle>
          <div style={{ position: 'relative', height: 260 }}>
            {expCats.length > 0 ? <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9898aa', font: { size: 10 } } } } }} />
              : <Empty />}
          </div>
        </Card>
        <Card><SectionTitle>月別収支推移（折れ線）</SectionTitle>
          <div style={{ position: 'relative', height: 260 }}><Line data={lineData} options={lineOpts} /></div>
        </Card>
        <Card><SectionTitle>月別支出カテゴリ（棒グラフ）</SectionTitle>
          <div style={{ position: 'relative', height: 260 }}>
            {topCats.length > 0 ? <Bar data={barData} options={barOpts} /> : <Empty />}
          </div>
        </Card>
        <Card><SectionTitle>財務バランス（レーダー）</SectionTitle>
          <div style={{ position: 'relative', height: 260 }}><Radar data={radarData} options={radarOpts} /></div>
        </Card>
      </div>
    </div>
  )
}

function Empty() {
  return <p style={{ fontSize: 12, color: 'var(--text3)', padding: '80px 0', textAlign: 'center' }}>データなし</p>
}
