'use client'

import { useState, useMemo } from 'react'
import { useKakeiboStore, selectFixedTotal } from '@/store'
import { currentMonth, shiftMonth, getMonthTx, sumBy, sumCat, fmt, fmtPct } from '@/lib/utils'
import { CATS, CAT_COLORS } from '@/lib/constants'
import { Btn, MonthNav } from '@/components/UI'

type PrintRange = 'dashboard' | 'history' | 'budget' | 'all'

export default function PrintPage() {
  const [month, setMonth]       = useState(currentMonth())
  const [range, setRange]       = useState<PrintRange>('dashboard')

  const transactions  = useKakeiboStore(s => s.transactions)
  const fixedCosts    = useKakeiboStore(s => s.fixedCosts)
  const budgets       = useKakeiboStore(s => s.budgets)
  const goals         = useKakeiboStore(s => s.goals)
  const fixedTotal    = useKakeiboStore(selectFixedTotal)

  // プリンターに直接印刷させるための手順：
  // 1. window.print() を呼ぶとブラウザの印刷ダイアログが開く
  // 2. ダイアログ内で「送信先」を「プリンター名」に変更する
  // 3. JavaScript からプリンターを直接指定することはブラウザのセキュリティ上不可能
  function execPrint() {
    // beforeprint / afterprint イベントでUIを隠してから印刷
    const handleBefore = () => {
      document.documentElement.setAttribute('data-printing', 'true')
    }
    const handleAfter = () => {
      document.documentElement.removeAttribute('data-printing')
    }
    window.addEventListener('beforeprint', handleBefore, { once: true })
    window.addEventListener('afterprint',  handleAfter,  { once: true })
    setTimeout(() => window.print(), 100)
  }

  // 別ウィンドウで開いて印刷（iframe環境での制限回避用）
  function openNewWindow() {
    const url = `${window.location.origin}/print?month=${month}&range=${range}`
    const w = window.open(url, '_blank',
      'width=900,height=700,menubar=yes,toolbar=yes,location=yes,status=yes,scrollbars=yes'
    )
    if (!w) {
      alert('ポップアップをブロックされました。\nブラウザのアドレスバーにある「ポップアップを許可」をクリックしてください。')
      return
    }
    // 新しいウィンドウが読み込まれたら自動で印刷ダイアログを開く
    w.onload = () => setTimeout(() => w.print(), 800)
  }

  const preview = useMemo(() => {
    const showDash    = range === 'dashboard' || range === 'all'
    const showHistory = range === 'history'   || range === 'all'
    const showBudget  = range === 'budget'    || range === 'all'
    return { showDash, showHistory, showBudget }
  }, [range])

  return (
    <div>
      {/* ── コントロール（印刷時は非表示） ── */}
      <div className="no-print" style={{ marginBottom: 20 }}>
        <MonthNav month={month} onChange={setMonth} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--text2)' }}>印刷範囲：</label>
          {(
            [
              { v: 'dashboard', l: 'ダッシュボード（KPI＋サマリー）' },
              { v: 'history',   l: '取引履歴' },
              { v: 'budget',    l: '予算達成状況' },
              { v: 'all',       l: '全ページ一括' },
            ] as { v: PrintRange; l: string }[]
          ).map(opt => (
            <label key={opt.v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="radio"
                value={opt.v}
                checked={range === opt.v}
                onChange={() => setRange(opt.v)}
              />
              {opt.l}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Btn variant="primary" onClick={execPrint}>🖨️ 印刷ダイアログを開く</Btn>
          <Btn onClick={openNewWindow}>↗ 別ウィンドウで開いて印刷</Btn>
        </div>

        {/* プリンター接続の手順案内 */}
        <div style={{
          marginTop: 16,
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)',
          padding: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
            🖨️ プリンターで印刷する手順
          </div>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
            <li>「印刷ダイアログを開く」ボタンを押す</li>
            <li>
              ダイアログが開いたら <strong style={{ color: 'var(--text)' }}>「送信先」または「プリンター」</strong> をクリック
            </li>
            <li>
              一覧から <strong style={{ color: 'var(--accent)' }}>接続済みのプリンター名</strong> を選ぶ
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>
                （「PDFに保存」や「Microsoft Print to PDF」ではなく実機を選ぶ）
              </span>
            </li>
            <li>部数・両面印刷などを設定して「印刷」を押す</li>
          </ol>
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'rgba(224,168,48,0.1)',
            border: '1px solid rgba(224,168,48,0.3)',
            borderRadius: 8, fontSize: 12, color: 'var(--amber)',
          }}>
            💡 プリンターが表示されない場合は、PCとプリンターが同じWi-Fiに接続されているか、
            USBケーブルが接続されているか確認してください。
            Windowsは「設定 → Bluetooth とデバイス → プリンターとスキャナー」、
            macOSは「システム設定 → プリンタとスキャナ」でプリンターを追加できます。
          </div>
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: 'rgba(74,159,224,0.1)',
            border: '1px solid rgba(74,159,224,0.3)',
            borderRadius: 8, fontSize: 12, color: 'var(--blue)',
          }}>
            📱 スマホ・タブレットから印刷する場合は「↗ 別ウィンドウで開いて印刷」を使い、
            AirPrint（iPhone/iPad）または Mopria（Android）対応プリンターを選んでください。
          </div>
        </div>
      </div>

      {/* ── 印刷コンテンツ ── */}
      {preview.showDash && (
        <DashboardPrint
          month={month}
          transactions={transactions}
          fixedTotal={fixedTotal}
          budgets={budgets}
          goals={goals}
        />
      )}
      {preview.showHistory && (
        <HistoryPrint
          month={month}
          transactions={transactions}
          isFirst={!preview.showDash}
        />
      )}
      {preview.showBudget && (
        <BudgetPrint
          month={month}
          transactions={transactions}
          budgets={budgets}
          isFirst={!preview.showDash && !preview.showHistory}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Dashboard block
// ─────────────────────────────────────────────
function DashboardPrint({
  month, transactions, fixedTotal, budgets, goals,
}: {
  month: string
  transactions: any[]
  fixedTotal: number
  budgets: Record<string, number>
  goals: any
}) {
  const txs       = getMonthTx(transactions, month)
  const income    = sumBy(txs, 'income')
  const expense   = sumBy(txs, 'expense')
  const saving    = sumBy(txs, 'saving')
  const totalExp  = expense + fixedTotal
  const balance   = income - totalExp - saving

  const savingRate = income > 0 ? saving / income * 100 : 0
  const fixedRate  = income > 0 ? fixedTotal / income * 100 : 0
  const wasteCats  = ['娯楽', '外食']
  const waste      = txs.filter(t => wasteCats.includes(t.category)).reduce((s, t) => s + t.amount, 0)
  const wasteRate  = totalExp > 0 ? waste / totalExp * 100 : 0
  const totalBgt   = Object.values(budgets).reduce((a, b) => a + b, 0)
  const saveRate   = totalBgt > 0 ? (totalBgt - expense) / totalBgt * 100 : null
  const cumSaving  = transactions.filter(t => t.type === 'saving').reduce((s, t) => s + t.amount, 0)
  const defMos     = goals.defense ?? 6
  const defGoal    = (income > 0 ? totalExp : 200000) * defMos
  const defAchieve = defGoal > 0 ? cumSaving / defGoal * 100 : 0
  const preGoal    = goals.presaving ?? 0
  const preSA      = preGoal > 0 ? saving / preGoal * 100 : null
  const passive    = goals.passive ?? 0
  const passiveRate = totalExp > 0 ? passive / totalExp * 100 : 0
  const hasData    = income > 0 || expense > 0 || saving > 0

  // Safety level
  let safetyLabel = '', safetyColor = ''
  if (hasData) {
    if (savingRate >= 30 && fixedRate <= 40 && defAchieve >= 100) { safetyLabel = '🏆 安全レベル S'; safetyColor = '#1a7050' }
    else if (savingRate >= 20 && fixedRate <= 50)                  { safetyLabel = '✅ 安全レベル A'; safetyColor = '#1a7050' }
    else if (savingRate >= 10 && fixedRate <= 60)                  { safetyLabel = '📘 安全レベル B'; safetyColor = '#1a5fa0' }
    else if (savingRate >= 0  && fixedRate <= 70)                  { safetyLabel = '⚠️ 安全レベル C'; safetyColor = '#806010' }
    else                                                            { safetyLabel = '🚨 安全レベル D'; safetyColor = '#b03030' }
  }

  const kpis = [
    { label: '収入',         value: income > 0 ? fmt(income) : '—',               bar: null },
    { label: '支出（固定費込）', value: expense > 0 ? fmt(totalExp) : '—',         bar: null },
    { label: '貯金',         value: saving > 0 ? fmt(saving) : '—',               bar: null },
    { label: '収支',         value: hasData ? fmt(balance) : '—',                 bar: null },
    { label: '貯蓄率',       value: hasData ? fmtPct(savingRate) : '—',           bar: savingRate,              barColor: '#2dbe8a' },
    { label: '固定費率',     value: hasData ? fmtPct(fixedRate) : '—',            bar: fixedRate,               barColor: fixedRate > 60 ? '#e05555' : '#e0a830' },
    { label: '浪費率',       value: hasData ? fmtPct(wasteRate) : '—',            bar: wasteRate,               barColor: '#e05a8a' },
    { label: '節約率',       value: saveRate !== null ? fmtPct(saveRate) : '—',   bar: saveRate ?? 0,           barColor: '#2dbe8a' },
    { label: '防衛資金達成', value: fmtPct(defAchieve),                            bar: Math.min(defAchieve, 100), barColor: '#e0a830' },
    { label: '先取り貯金',  value: preSA !== null ? fmtPct(preSA) : '—',         bar: preSA ?? 0,              barColor: '#4a9fe0' },
    { label: '受動収入率',  value: fmtPct(passiveRate),                            bar: passiveRate,             barColor: '#2db8c8' },
  ]

  // Budget alerts
  const alerts: { type: string; msg: string }[] = []
  if (hasData) {
    CATS.expense.forEach(cat => {
      const bgt = budgets[cat], spent = sumCat(txs, cat)
      if (bgt && spent > bgt)      alerts.push({ type: 'danger', msg: `⚠️ ${cat}が予算オーバー（${fmt(spent)} / ${fmt(bgt)}）` })
      else if (bgt && spent > bgt * 0.8) alerts.push({ type: 'warn', msg: `📊 ${cat}が予算の80%超（${fmt(spent)} / ${fmt(bgt)}）` })
    })
    if (savingRate < 10 && income > 0) alerts.push({ type: 'warn',   msg: '貯蓄率が10%を下回っています' })
    if (fixedRate > 60 && income > 0)  alerts.push({ type: 'danger', msg: '固定費率が60%を超えています' })
    if (balance < 0)                   alerts.push({ type: 'danger', msg: `今月の収支がマイナスです（${fmt(balance)}）` })
  }

  const expCats = CATS.expense.filter(c => sumCat(txs, c) > 0 || budgets[c])
  const recent  = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  const S: Record<string, React.CSSProperties> = {
    wrap:       { fontSize: '10pt' },
    hdr:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1.5pt solid #7c6fe0', paddingBottom: '6pt', marginBottom: '10pt' },
    hdrTitle:   { fontSize: '18pt', fontWeight: 900, color: '#7c6fe0' },
    hdrSub:     { fontSize: '11pt', fontWeight: 700, color: '#333', marginTop: '2pt' },
    safety:     { display: 'inline-block', border: `1pt solid ${safetyColor}`, borderRadius: '20pt', padding: '3pt 10pt', fontSize: '10pt', fontWeight: 700, color: safetyColor },
    printDate:  { fontSize: '7.5pt', color: '#aaa', marginTop: '4pt' },
    sumGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6pt', marginBottom: '10pt' },
    sumCell:    { background: 'white', border: '0.5pt solid #ccc', borderRadius: '4pt', padding: '8pt', textAlign: 'center', breakInside: 'avoid' },
    sumLabel:   { fontSize: '7.5pt', color: '#888', marginBottom: '3pt' },
    kpiGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6pt', marginBottom: '10pt' },
    kpiCell:    { background: '#f8f8ff', border: '0.5pt solid #ddd', borderRadius: '3pt', padding: '6pt 8pt', breakInside: 'avoid' },
    kpiLabel:   { fontSize: '7pt', color: '#888', marginBottom: '2pt' },
    kpiVal:     { fontSize: '13pt', fontWeight: 700, color: '#111' },
    barWrap:    { background: '#eee', height: '4pt', borderRadius: '2pt', overflow: 'hidden', marginTop: '3pt' },
    secLabel:   { fontSize: '8pt', fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '5pt' },
    footer:     { borderTop: '0.5pt solid #ddd', paddingTop: '5pt', marginTop: '10pt', fontSize: '7pt', color: '#aaa', display: 'flex', justifyContent: 'space-between' },
  }

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.hdr}>
        <div>
          <div style={S.hdrTitle}>家計簿</div>
          <div style={S.hdrSub}>{month} 月次レポート</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {safetyLabel && <span style={S.safety}>{safetyLabel}</span>}
          <div style={S.printDate}>印刷日: {new Date().toLocaleDateString('ja-JP')}</div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '10pt' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              padding: '4pt 8pt', borderLeft: '2pt solid', fontSize: '8pt', marginBottom: '4pt',
              ...(a.type === 'danger'
                ? { borderColor: '#e05555', background: '#fff0f0', color: '#c03333' }
                : { borderColor: '#e0a830', background: '#fff8e0', color: '#806010' })
            }}>{a.msg}</div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div style={S.sumGrid}>
        {[
          { label: '収入',         val: income,   color: '#1a7050' },
          { label: '支出（固定費込）', val: totalExp, color: '#b03030' },
          { label: '貯金',         val: saving,   color: '#1a5fa0' },
          { label: '収支',         val: balance,  color: balance >= 0 ? '#1a7050' : '#b03030' },
        ].map(s => (
          <div key={s.label} style={S.sumCell}>
            <div style={S.sumLabel}>{s.label}</div>
            <div style={{ fontSize: '14pt', fontWeight: 900, fontFamily: 'monospace', color: s.color }}>{fmt(s.val)}</div>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ marginBottom: '10pt', breakInside: 'avoid' as any }}>
        <div style={S.secLabel}>KPI 指標</div>
        <div style={S.kpiGrid}>
          {kpis.map(k => (
            <div key={k.label} style={S.kpiCell}>
              <div style={S.kpiLabel}>{k.label}</div>
              <div style={S.kpiVal}>{k.value}</div>
              {k.bar !== null && (
                <div style={S.barWrap}>
                  <div style={{ height: '4pt', borderRadius: '2pt', width: `${Math.min(k.bar, 100)}%`, background: k.barColor }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category table */}
      {expCats.length > 0 && (
        <div style={{ marginBottom: '10pt', breakInside: 'avoid' as any }}>
          <div style={S.secLabel}>支出カテゴリ</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr>
                {['カテゴリ', '実績', '予算', '達成率'].map(h => (
                  <th key={h} style={{ background: '#ededf8', border: '0.5pt solid #ccc', padding: '4pt 6pt', textAlign: h === 'カテゴリ' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expCats.map((cat, i) => {
                const spent = sumCat(txs, cat), bgt = budgets[cat] ?? 0
                const pct   = bgt > 0 ? Math.min(Math.round(spent / bgt * 100), 999) : null
                const color = pct !== null ? (pct > 100 ? '#b03030' : pct > 80 ? '#806010' : '#1a7050') : '#333'
                return (
                  <tr key={cat}>
                    <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>
                      <span style={{ display: 'inline-block', width: '7pt', height: '7pt', borderRadius: '50%', background: CAT_COLORS[cat] ?? '#888', marginRight: '4pt' }} />
                      {cat}
                    </td>
                    <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{fmt(spent)}</td>
                    <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{bgt ? fmt(bgt) : '未設定'}</td>
                    <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontWeight: 700, color, background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{pct !== null ? `${pct}%` : '—'}</td>
                  </tr>
                )
              })}
              <tr style={{ fontWeight: 700, background: '#f0f0ff' }}>
                <td style={{ border: '0.5pt solid #ccc', padding: '4pt 6pt' }}>合計</td>
                <td style={{ border: '0.5pt solid #ccc', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(expense)}</td>
                <td style={{ border: '0.5pt solid #ccc', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(totalBgt)}</td>
                <td style={{ border: '0.5pt solid #ccc', padding: '4pt 6pt', textAlign: 'right' }}>{totalBgt > 0 ? fmtPct((totalBgt - expense) / totalBgt * 100) : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Recent transactions */}
      {recent.length > 0 && (
        <div style={{ breakInside: 'avoid' as any }}>
          <div style={S.secLabel}>取引履歴（直近10件）</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr>
                {['日付', '種別', 'カテゴリ', 'メモ', '支払方法', '金額'].map(h => (
                  <th key={h} style={{ background: '#ededf8', border: '0.5pt solid #ccc', padding: '4pt 6pt', textAlign: h === '金額' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((t, i) => {
                const sign  = t.type === 'income' ? '+' : '-'
                const color = t.type === 'income' ? '#1a7050' : t.type === 'saving' ? '#1a5fa0' : '#b03030'
                const typeLabel = ({ income: '収入', expense: '支出', saving: '貯金' } as any)[t.type] ?? t.type
                return (
                  <tr key={t.id}>
                    {[t.date, typeLabel].map((v, vi) => (
                      <td key={vi} style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{v}</td>
                    ))}
                    <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>
                      <span style={{ display: 'inline-block', width: '7pt', height: '7pt', borderRadius: '50%', background: CAT_COLORS[t.category] ?? '#888', marginRight: '4pt' }} />
                      {t.category}
                    </td>
                    <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{t.note ?? ''}</td>
                    <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{t.method ?? ''}</td>
                    <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color, background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{sign}{fmt(t.amount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div style={S.footer}>
        <span>家計簿 — スマート家計管理</span>
        <span>{month} 月次レポート</span>
        <span>印刷日: {new Date().toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// History block
// ─────────────────────────────────────────────
function HistoryPrint({ month, transactions, isFirst }: { month: string; transactions: any[]; isFirst: boolean }) {
  const txs    = getMonthTx(transactions, month).sort((a, b) => a.date.localeCompare(b.date))
  const income  = sumBy(txs, 'income')
  const expense = sumBy(txs, 'expense')
  const saving  = sumBy(txs, 'saving')

  return (
    <div style={{ fontSize: '10pt', ...(isFirst ? {} : { pageBreakBefore: 'always' as any }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1.5pt solid #7c6fe0', paddingBottom: '6pt', marginBottom: '10pt' }}>
        <div>
          <div style={{ fontSize: '14pt', fontWeight: 900, color: '#7c6fe0' }}>家計簿 — 取引履歴</div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: '#333', marginTop: '2pt' }}>{month}</div>
        </div>
        <div style={{ fontSize: '8pt', color: '#888' }}>印刷日: {new Date().toLocaleDateString('ja-JP')}</div>
      </div>

      <div style={{ display: 'flex', gap: '16pt', marginBottom: '8pt', fontSize: '9pt' }}>
        {[
          { l: '収入', v: income,              c: '#1a7050' },
          { l: '支出', v: expense,             c: '#b03030' },
          { l: '貯金', v: saving,              c: '#1a5fa0' },
          { l: '収支', v: income-expense-saving, c: income-expense-saving >= 0 ? '#1a7050' : '#b03030' },
        ].map(s => (
          <span key={s.l}>{s.l} <strong style={{ color: s.c, fontFamily: 'monospace' }}>{fmt(s.v)}</strong></span>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
        <thead>
          <tr>
            {['日付', 'カテゴリ', 'メモ', '支払方法', '金額'].map(h => (
              <th key={h} style={{ background: '#ededf8', border: '0.5pt solid #ccc', padding: '4pt 6pt', textAlign: h === '金額' ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {txs.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: '12pt', border: '0.5pt solid #ddd' }}>取引がありません</td></tr>
          ) : txs.map((t, i) => {
            const sign  = t.type === 'income' ? '+' : '-'
            const color = t.type === 'income' ? '#1a7050' : t.type === 'saving' ? '#1a5fa0' : '#b03030'
            return (
              <tr key={t.id}>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{t.date}</td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>
                  <span style={{ display: 'inline-block', width: '7pt', height: '7pt', borderRadius: '50%', background: CAT_COLORS[t.category] ?? '#888', marginRight: '4pt' }} />
                  {t.category}
                </td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>
                  {t.note ?? ''}
                  {(t.tags ?? []).map((tag: string) => (
                    <span key={tag} style={{ fontSize: '7pt', padding: '1pt 4pt', borderRadius: '2pt', background: '#eee', marginLeft: '4pt' }}>{tag}</span>
                  ))}
                </td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{t.method ?? ''}</td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color, background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{sign}{fmt(t.amount)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ borderTop: '0.5pt solid #ddd', paddingTop: '5pt', marginTop: '10pt', fontSize: '7pt', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
        <span>家計簿</span>
        <span>{month} 取引履歴 — {txs.length}件</span>
        <span>印刷日: {new Date().toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Budget block
// ─────────────────────────────────────────────
function BudgetPrint({ month, transactions, budgets, isFirst }: { month: string; transactions: any[]; budgets: Record<string, number>; isFirst: boolean }) {
  const txs  = getMonthTx(transactions, month)
  const cats = CATS.expense.filter(c => budgets[c])

  return (
    <div style={{ fontSize: '10pt', ...(isFirst ? {} : { pageBreakBefore: 'always' as any }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1.5pt solid #7c6fe0', paddingBottom: '6pt', marginBottom: '10pt' }}>
        <div>
          <div style={{ fontSize: '14pt', fontWeight: 900, color: '#7c6fe0' }}>家計簿 — 予算達成状況</div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: '#333', marginTop: '2pt' }}>{month}</div>
        </div>
        <div style={{ fontSize: '8pt', color: '#888' }}>印刷日: {new Date().toLocaleDateString('ja-JP')}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
        <thead>
          <tr>
            {['カテゴリ', '実績', '予算', '残り', '達成率', '状態'].map(h => (
              <th key={h} style={{ background: '#ededf8', border: '0.5pt solid #ccc', padding: '4pt 6pt', textAlign: ['実績','予算','残り','達成率'].includes(h) ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cats.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: '12pt', border: '0.5pt solid #ddd' }}>予算が設定されていません</td></tr>
          ) : cats.map((cat, i) => {
            const spent  = sumCat(txs, cat)
            const bgt    = budgets[cat]
            const pct    = Math.round(spent / bgt * 100)
            const color  = pct > 100 ? '#b03030' : pct > 80 ? '#806010' : '#1a7050'
            const status = pct > 100 ? '⚠️ 超過' : pct > 80 ? '📊 注意' : '✅ 良好'
            return (
              <tr key={cat}>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>
                  <span style={{ display: 'inline-block', width: '7pt', height: '7pt', borderRadius: '50%', background: CAT_COLORS[cat] ?? '#888', marginRight: '4pt' }} />
                  {cat}
                </td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{fmt(spent)}</td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{fmt(bgt)}</td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontFamily: 'monospace', color: '#888', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{fmt(bgt - spent)}</td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'right', fontWeight: 700, color, background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{pct}%</td>
                <td style={{ border: '0.5pt solid #ddd', padding: '4pt 6pt', textAlign: 'center', background: i % 2 === 1 ? '#f8f8ff' : 'white' }}>{status}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ borderTop: '0.5pt solid #ddd', paddingTop: '5pt', marginTop: '10pt', fontSize: '7pt', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
        <span>家計簿</span>
        <span>{month} 予算達成状況</span>
        <span>印刷日: {new Date().toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
  )
}
