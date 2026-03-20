import type { Transaction, TransactionType, MonthSummary, AlertItem, KpiItem, SafetyInfo, Goals, BudgetMap } from '@/types'
import { CATS, CAT_COLORS } from './constants'

// ===== FORMATTING =====

export function fmt(n: number): string {
  return '¥' + Math.round(n).toLocaleString('ja-JP')
}

export function fmtPct(n: number): string {
  return isFinite(n) ? Math.round(n) + '%' : '—'
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

// ===== AGGREGATION =====

export function getMonthTx(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter(t => t.date?.startsWith(month))
}

export function sumBy(txs: Transaction[], type: TransactionType): number {
  return txs.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0)
}

export function sumCat(txs: Transaction[], cat: string): number {
  return txs.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0)
}

export function buildMonthSummary(transactions: Transaction[], month: string): MonthSummary {
  const txs = getMonthTx(transactions, month)
  const income  = sumBy(txs, 'income')
  const expense = sumBy(txs, 'expense')
  const saving  = sumBy(txs, 'saving')
  return { month, income, expense, saving, balance: income - expense - saving }
}

// ===== KPI CALCULATION =====

export interface KpiInput {
  transactions: Transaction[]
  fixedCostTotal: number
  budgets: BudgetMap
  goals: Goals
  month: string
}

export interface KpiResult {
  income: number
  expense: number
  saving: number
  fixed: number
  totalExpense: number
  balance: number
  savingRate: number
  fixedRate: number
  wasteRate: number
  saveRate: number | null
  defenseAchieve: number
  preSavingAchieve: number | null
  passiveRate: number
  stability: number | null
  hasData: boolean
  safety: SafetyInfo | null
  kpis: KpiItem[]
  alerts: AlertItem[]
}

export function calcKpis({ transactions, fixedCostTotal, budgets, goals, month }: KpiInput): KpiResult {
  const txs         = getMonthTx(transactions, month)
  const income      = sumBy(txs, 'income')
  const expense     = sumBy(txs, 'expense')
  const saving      = sumBy(txs, 'saving')
  const fixed       = fixedCostTotal
  const totalExpense = expense + fixed
  const balance     = income - totalExpense - saving

  const savingRate = income > 0 ? (saving / income) * 100 : 0
  const fixedRate  = income > 0 ? (fixed / income) * 100 : 0

  const wasteCats = ['娯楽', '外食']
  const waste     = txs.filter(t => wasteCats.includes(t.category)).reduce((s, t) => s + t.amount, 0)
  const wasteRate = totalExpense > 0 ? (waste / totalExpense) * 100 : 0

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0)
  const saveRate    = totalBudget > 0 ? ((totalBudget - expense) / totalBudget) * 100 : null

  const cumSaving   = transactions.filter(t => t.type === 'saving').reduce((s, t) => s + t.amount, 0)
  const defenseMos  = goals.defense ?? 6
  const avgMonthExp = income > 0 ? totalExpense : 200000
  const defenseGoal = avgMonthExp * defenseMos
  const defenseAchieve = defenseGoal > 0 ? (cumSaving / defenseGoal) * 100 : 0

  const preGoal           = goals.presaving ?? 0
  const preSavingAchieve  = preGoal > 0 ? (saving / preGoal) * 100 : null

  const passive     = goals.passive ?? 0
  const passiveRate = totalExpense > 0 ? (passive / totalExpense) * 100 : 0

  // Stability: 3-month std-dev of balance
  const last3Balances = [-2, -1, 0].map(d => {
    const m2  = shiftMonth(month, d)
    const t2  = getMonthTx(transactions, m2)
    return sumBy(t2, 'income') - sumBy(t2, 'expense') - sumBy(t2, 'saving')
  })
  const mean3  = last3Balances.reduce((a, b) => a + b, 0) / 3
  const stddev = Math.sqrt(last3Balances.reduce((s, v) => s + Math.pow(v - mean3, 2), 0) / 3)
  const stability = income > 0 ? Math.max(0, 100 - (stddev / income) * 100) : null

  const hasData = income > 0 || expense > 0 || saving > 0

  // Safety level
  let safety: SafetyInfo | null = null
  if (hasData) {
    if (savingRate >= 30 && fixedRate <= 40 && defenseAchieve >= 100) {
      safety = { level: 'S', cls: 'safety-s', label: '🏆 安全レベル S' }
    } else if (savingRate >= 20 && fixedRate <= 50) {
      safety = { level: 'A', cls: 'safety-a', label: '✅ 安全レベル A' }
    } else if (savingRate >= 10 && fixedRate <= 60) {
      safety = { level: 'B', cls: 'safety-b', label: '📘 安全レベル B' }
    } else if (savingRate >= 0 && fixedRate <= 70) {
      safety = { level: 'C', cls: 'safety-c', label: '⚠️ 安全レベル C' }
    } else {
      safety = { level: 'D', cls: 'safety-d', label: '🚨 安全レベル D' }
    }
  }

  const kpis: KpiItem[] = [
    { label: '収入',      value: income > 0 ? fmt(income) : '—',          color: 'var(--green)' },
    { label: '支出',      value: expense > 0 ? fmt(totalExpense) : '—',   sub: '固定費込み', color: 'var(--red)' },
    { label: '貯金',      value: saving > 0 ? fmt(saving) : '—',          color: 'var(--blue)' },
    { label: '収支',      value: hasData ? fmt(balance) : '—',            color: balance >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: '貯蓄率',    value: hasData ? fmtPct(savingRate) : 'データなし', sub: '目標20%以上', color: 'var(--teal)', bar: savingRate, barColor: 'var(--teal)' },
    { label: '固定費率',  value: hasData ? fmtPct(fixedRate) : 'データなし', sub: '目標40%以下',
      color: fixedRate > 60 ? 'var(--red)' : fixedRate > 40 ? 'var(--amber)' : 'var(--green)',
      bar: fixedRate, barColor: fixedRate > 60 ? 'var(--red)' : 'var(--amber)' },
    { label: '浪費率',    value: hasData ? fmtPct(wasteRate) : 'データなし', sub: '目標15%以下',
      color: wasteRate > 20 ? 'var(--red)' : 'var(--text)', bar: wasteRate, barColor: 'var(--pink)' },
    { label: '節約率',    value: hasData && saveRate !== null ? fmtPct(saveRate) : 'データなし', sub: '予算比',
      color: (saveRate ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: '節約達成度', value: hasData && saveRate !== null ? fmtPct(Math.min(saveRate, 100)) : 'データなし',
      color: 'var(--green)', bar: saveRate ?? 0, barColor: 'var(--green)' },
    { label: '防衛資金達成', value: fmtPct(defenseAchieve), sub: `目標${fmt(defenseGoal)}`,
      color: defenseAchieve >= 100 ? 'var(--green)' : 'var(--amber)',
      bar: Math.min(defenseAchieve, 100), barColor: 'var(--amber)' },
    { label: '先取り貯金', value: preSavingAchieve !== null ? fmtPct(preSavingAchieve) : 'データなし', sub: `目標${fmt(preGoal)}`,
      color: (preSavingAchieve ?? 0) >= 100 ? 'var(--green)' : 'var(--blue)',
      bar: preSavingAchieve ?? 0, barColor: 'var(--blue)' },
    { label: '受動収入率', value: fmtPct(passiveRate), sub: `${fmt(passive)}/月`,
      color: passiveRate >= 10 ? 'var(--green)' : 'var(--text2)', bar: passiveRate, barColor: 'var(--teal)' },
    { label: '収支安定性', value: stability !== null ? fmtPct(stability) : 'データなし', sub: '3ヶ月平均',
      color: (stability ?? 0) >= 70 ? 'var(--green)' : (stability ?? 0) >= 40 ? 'var(--amber)' : 'var(--red)',
      bar: stability ?? 0, barColor: 'var(--green)' },
  ]

  const alerts: AlertItem[] = []
  if (hasData) {
    CATS.expense.forEach(cat => {
      const bgt   = budgets[cat]
      const spent = sumCat(txs, cat)
      if (bgt && spent > bgt)
        alerts.push({ type: 'danger', msg: `⚠️ ${cat}が予算オーバー（${fmt(spent)} / ${fmt(bgt)}）` })
      else if (bgt && spent > bgt * 0.8)
        alerts.push({ type: 'warn', msg: `📊 ${cat}が予算の80%を超えています（${fmt(spent)} / ${fmt(bgt)}）` })
    })
    if (savingRate < 10 && income > 0)
      alerts.push({ type: 'warn', msg: '貯蓄率が10%を下回っています。支出の見直しを検討してください。' })
    if (fixedRate > 60 && income > 0)
      alerts.push({ type: 'danger', msg: '固定費率が60%を超えています。固定費削減が急務です。' })
    if (balance < 0)
      alerts.push({ type: 'danger', msg: `今月の収支がマイナスです（${fmt(balance)}）` })
  }
  if (!income && !expense)
    alerts.push({ type: 'ok', msg: '今月はまだデータがありません。収入・支出を入力してください。' })

  return {
    income, expense, saving, fixed, totalExpense, balance,
    savingRate, fixedRate, wasteRate, saveRate,
    defenseAchieve, preSavingAchieve, passiveRate, stability,
    hasData, safety, kpis, alerts,
  }
}

// ===== EXPORT =====

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 1000)
}

export function exportTransactionsCSV(transactions: Transaction[]): void {
  const headers = ['日付', '種別', 'カテゴリ', '金額', '支払方法', 'メモ', 'タグ']
  const rows = transactions.map(t => [
    t.date, t.type, t.category, t.amount,
    t.method, t.note, t.tags.join('|'),
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  downloadFile('\uFEFF' + csv, `kakeibo_${today()}.csv`, 'text/csv;charset=utf-8')
}
