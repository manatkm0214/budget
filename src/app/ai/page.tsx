'use client'

import { useState } from 'react'
import { useKakeiboStore } from '@/store'
import { currentMonth, getMonthTx, sumBy, sumCat, fmt, shiftMonth } from '@/lib/utils'
import { CATS } from '@/lib/constants'
import { Card, SectionTitle, MonthNav, Btn } from '@/components/UI'

export default function AiPage() {
  const [month, setMonth]         = useState(currentMonth())
  const [monthResult, setMonthRes] = useState('')
  const [annualResult, setAnnualRes] = useState('')
  const [loadingM, setLoadingM]   = useState(false)
  const [loadingA, setLoadingA]   = useState(false)

  const transactions = useKakeiboStore((s: any) => s.transactions)
  const budgets      = useKakeiboStore((s: any) => s.budgets)

  async function callClaude(prompt: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data.content?.map((c: any) => c.text || '').join('') || 'エラーが発生しました'
  }

  async function analyzeMonthly() {
    setLoadingM(true)
    const txs     = getMonthTx(transactions, month)
    const income  = sumBy(txs, 'income')
    const expense = sumBy(txs, 'expense')
    const saving  = sumBy(txs, 'saving')
    const catBreakdown = CATS.expense
      .map(c => `${c}:${fmt(sumCat(txs, c))}`)
      .filter(s => !s.includes('¥0')).join('、')

    const prompt = `家計データを分析してください。
月: ${month}
収入: ${fmt(income)}
支出（変動費）: ${fmt(expense)}
貯金: ${fmt(saving)}
貯蓄率: ${income > 0 ? Math.round(saving / income * 100) : 0}%
支出カテゴリ: ${catBreakdown || 'なし'}
予算設定: ${JSON.stringify(budgets)}

日本語で、以下の点について簡潔にアドバイスしてください：
1. 今月の家計の総評（1文）
2. 改善すべき点（1〜2点）
3. 来月へのアクション（1点）`

    try {
      setMonthRes(await callClaude(prompt))
    } catch (e: any) {
      setMonthRes('エラー: ' + e.message)
    }
    setLoadingM(false)
  }

  async function analyzeAnnual() {
    setLoadingA(true)
    const months12 = Array.from({ length: 12 }, (_, i) => shiftMonth(month, i - 11))
    const summary = months12.map(m => {
      const t = getMonthTx(transactions, m)
      return `${m}: 収入${fmt(sumBy(t,'income'))} 支出${fmt(sumBy(t,'expense'))} 貯金${fmt(sumBy(t,'saving'))}`
    }).join('\n')

    const prompt = `過去1年間の家計データを分析してください：\n${summary}\n\n日本語で、トレンドと今後の改善策を教えてください。`

    try {
      setAnnualRes(await callClaude(prompt))
    } catch (e: any) {
      setAnnualRes('エラー: ' + e.message)
    }
    setLoadingA(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      <Card>
        <SectionTitle>今月の家計分析</SectionTitle>
        <div style={{ marginBottom: 12 }}>
          <MonthNav month={month} onChange={setMonth} />
        </div>
        <Btn variant="primary" style={{ width: '100%' }} onClick={analyzeMonthly} disabled={loadingM}>
          {loadingM ? '分析中...' : '今月を分析する'}
        </Btn>
        {loadingM && <LoadingDots />}
        {monthResult && !loadingM && (
          <div style={{
            marginTop: 12, background: 'var(--bg3)', borderRadius: 'var(--radius2)',
            padding: 16, fontSize: 13, lineHeight: 1.8, color: 'var(--text2)',
            whiteSpace: 'pre-wrap',
          }}>
            {monthResult}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>年間トレンド分析</SectionTitle>
        <Btn variant="primary" style={{ width: '100%' }} onClick={analyzeAnnual} disabled={loadingA}>
          {loadingA ? '分析中...' : '年間トレンドを分析する'}
        </Btn>
        {loadingA && <LoadingDots />}
        {annualResult && !loadingA && (
          <div style={{
            marginTop: 12, background: 'var(--bg3)', borderRadius: 'var(--radius2)',
            padding: 16, fontSize: 13, lineHeight: 1.8, color: 'var(--text2)',
            whiteSpace: 'pre-wrap',
          }}>
            {annualResult}
          </div>
        )}
      </Card>
    </div>
  )
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: 'var(--text3)' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
            animation: 'pulse 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 13 }}>Claude が分析中...</span>
      <style>{`@keyframes pulse { 0%,80%,100%{opacity:.2} 40%{opacity:1} }`}</style>
    </div>
  )
}
