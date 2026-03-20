'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useKakeiboStore } from '@/store'
import { SETUP_PRESETS, buildCatBudgets, CAT_COLORS } from '@/lib/constants'
import { fmt } from '@/lib/utils'
import { Card, Btn } from '@/components/UI'
import { showToast } from '@/components/UI/toast'
import type { SetupPreset } from '@/types'

export default function SetupPage() {
  const [step, setStep]           = useState(1)
  const [selectedId, setSelectedId] = useState<string>('standard')
  const [customSaving, setCS]     = useState(20)
  const [customExpense, setCE]    = useState(70)
  const [customInvest, setCI]     = useState(10)
  const [showCustom, setShowCustom] = useState(false)
  const [net, setNet]             = useState('')
  const [catOverrides, setCatOvr] = useState<Record<string, number>>({})

  const router      = useRouter()
  const setBudgets  = useKakeiboStore((s: any) => s.setBudgets)
  const setGoals    = useKakeiboStore((s: any) => s.setGoals)
  const completeSetup = useKakeiboStore((s: any) => s.completeSetup)

  const netNum = parseFloat(net) || 0

  const activePreset: SetupPreset = showCustom && customSaving + customExpense + customInvest === 100
    ? { id: 'custom', name: 'カスタム', emoji: '✏️', desc: '', saving: customSaving, expense: customExpense, invest: customInvest, meaning: [] }
    : (SETUP_PRESETS[selectedId] || SETUP_PRESETS.standard)

  const savingAmt  = netNum * activePreset.saving  / 100
  const expenseAmt = netNum * activePreset.expense / 100
  const investAmt  = netNum * activePreset.invest  / 100
  const catBase    = netNum > 0 ? buildCatBudgets(expenseAmt) : {}
  const catBudgets = { ...catBase, ...catOverrides }

  function save() {
    if (netNum > 0) setBudgets(catBudgets)
    setGoals({ saving: Math.round(savingAmt), presaving: Math.round(savingAmt), defense: 6 })
    completeSetup(activePreset.id, netNum)
    showToast('✓ 設定を保存しました')
    router.push('/dashboard')
  }

  const STEPS = ['プリセット選択', '手取り入力', 'カテゴリ配分', '確認・保存']

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        {STEPS.map((_label, i) => {
          const n = i + 1
          const done = step > n, active = step === n
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : undefined }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--bg3)',
                border: `2px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border2)'}`,
                color: done || active ? 'white' : 'var(--text3)',
              }}>
                {done ? '✓' : n}
              </div>
              {i < 3 && (
                <div style={{ flex: 1, height: 2, background: done ? 'var(--green)' : 'var(--border)', margin: '0 4px' }} />
              )}
            </div>
          )
        })}
      </div>

      <Card>
        {/* ===== STEP 1 ===== */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>配分プリセットを選ぶ</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>手取り収入をどう振り分けるか基本方針を決めます。</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              {Object.values(SETUP_PRESETS).map(p => (
                <div key={p.id}
                  onClick={() => { setSelectedId(p.id); setShowCustom(false) }}
                  style={{
                    background: !showCustom && selectedId === p.id ? 'rgba(124,111,224,0.08)' : 'var(--card)',
                    borderRadius: 'var(--radius)', padding: 16,
                    cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
                    border: `2px solid ${!showCustom && selectedId === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  {!showCustom && selectedId === p.id && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10, width: 18, height: 18,
                      borderRadius: '50%', background: 'var(--accent)', color: 'white',
                      fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✓</div>
                  )}
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{p.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 10 }}>{p.desc}</div>
                  <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2 }}>
                    <div style={{ flex: p.saving, background: '#4a9fe0', borderRadius: 2 }} />
                    <div style={{ flex: p.expense, background: '#7c6fe0', borderRadius: 2 }} />
                    <div style={{ flex: p.invest, background: '#e0a830', borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    {[['#4a9fe0', `貯金${p.saving}%`], ['#7c6fe0', `生活${p.expense}%`], ['#e0a830', `投資${p.invest}%`]].map(([c, l]) => (
                      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text3)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom sliders */}
            <div style={{ marginBottom: 16 }}>
              <Btn onClick={() => setShowCustom(!showCustom)}>
                {showCustom ? '▾ カスタム設定中' : '＋ カスタムで設定する'}
              </Btn>
              {showCustom && (
                <div style={{ marginTop: 12, background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: 16 }}>
                  {([['sl-saving', '貯金', customSaving, setCS], ['sl-expense', '生活費', customExpense, setCE], ['sl-invest', '投資', customInvest, setCI]] as const).map(([id, label, val, setter]) => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)', width: 50, flexShrink: 0 }}>{label}</span>
                      <input type="range" min="0" max="90" step="5" value={val}
                        onChange={e => (setter as any)(parseInt(e.target.value))}
                        style={{ flex: 1 }} />
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, width: 36, textAlign: 'right' }}>{val}%</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontFamily: 'Space Mono, monospace',
                      background: customSaving + customExpense + customInvest === 100 ? 'rgba(45,190,138,0.15)' : 'rgba(224,85,85,0.15)',
                      color: customSaving + customExpense + customInvest === 100 ? 'var(--green)' : 'var(--red)',
                    }}>
                      合計 {customSaving + customExpense + customInvest}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Meaning */}
            {!showCustom && selectedId && (
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text2)' }}>各割合が意味すること</div>
                {(SETUP_PRESETS[selectedId]?.meaning || []).map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>{m}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="primary" onClick={() => setStep(2)}>次へ → 手取り入力</Btn>
            </div>
          </div>
        )}

        {/* ===== STEP 2 ===== */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>手取り月収を入力する</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>税引後・社会保険料控除後の実際に受け取る金額を入力してください。</p>

            <div style={{ maxWidth: 320, marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>手取り月収（円）</label>
              <input type="number" value={net} onChange={e => setNet(e.target.value)} placeholder="300000"
                style={{
                  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
                  color: 'var(--text)', padding: '12px', borderRadius: 'var(--radius2)',
                  fontSize: 20, fontFamily: 'Space Mono, monospace',
                }} />
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>💡 ボーナスを除いた月収ベースで入力するのがおすすめです</p>
            </div>

            {netNum > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
                {[
                  { label: '貯金', val: savingAmt, color: '#4a9fe0', pct: activePreset.saving },
                  { label: '生活費', val: expenseAmt, color: '#7c6fe0', pct: activePreset.expense },
                  { label: '投資', val: investAmt, color: '#e0a830', pct: activePreset.invest },
                  { label: '手取り', val: netNum, color: 'var(--text)', pct: 100 },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: 12, borderLeft: `3px solid ${item.color}` }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{item.label}</div>
                    <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{fmt(item.val)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.pct}% / 月</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn onClick={() => setStep(1)}>← 戻る</Btn>
              <Btn variant="primary" onClick={() => setStep(3)}>次へ → カテゴリ配分</Btn>
            </div>
          </div>
        )}

        {/* ===== STEP 3 ===== */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>カテゴリ別の上限を確認・調整する</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
              生活費 <strong style={{ color: 'var(--accent)' }}>{fmt(expenseAmt)}</strong> をカテゴリに自動配分しました。金額を直接編集できます。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8, marginBottom: 16 }}>
              {Object.entries(catBase).map(([cat, base]) => {
                const val = catOverrides[cat] ?? base
                return (
                  <div key={cat} style={{
                    background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[cat] || '#888', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12 }}>{cat}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                        {netNum > 0 ? Math.round(val / netNum * 100) : 0}%
                      </div>
                    </div>
                    <input type="number" value={val}
                      onChange={e => setCatOvr({ ...catOverrides, [cat]: parseInt(e.target.value) || 0 })}
                      style={{
                        width: 86, background: 'var(--bg2)', border: '1px solid var(--border)',
                        color: 'var(--text)', padding: '4px 6px', borderRadius: 6,
                        fontFamily: 'Space Mono, monospace', fontSize: 12, textAlign: 'right',
                      }} />
                  </div>
                )
              })}
            </div>

            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: '10px 14px', fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
              <strong style={{ color: 'var(--text2)' }}>配分ロジック：</strong> 住居費28% / 食費20% / 交通費6% / 通信費4% / 娯楽10% / 医療4% / 衣服5% / 教育4% / 外食4% / 日用品4% / 電気代4% / ガス代3% / 水道費2% / 保険2%
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn onClick={() => setStep(2)}>← 戻る</Btn>
              <Btn variant="primary" onClick={() => setStep(4)}>次へ → 確認・保存</Btn>
            </div>
          </div>
        )}

        {/* ===== STEP 4 ===== */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>設定を保存する</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>以下の内容で予算・目標を設定します。</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 700 }}>
                  配分プラン：{activePreset.emoji} {activePreset.name}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13 }}>貯金目標 <strong style={{ color: '#4a9fe0' }}>{fmt(savingAmt)}/月</strong></span>
                  <span style={{ fontSize: 13 }}>投資予定 <strong style={{ color: '#e0a830' }}>{fmt(investAmt)}/月</strong></span>
                </div>
              </div>
              {netNum > 0 && (
                <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 700 }}>
                    カテゴリ予算（計 {fmt(Object.values(catBudgets).reduce((a, b) => a + b, 0))}）
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(catBudgets).map(([cat, val]) => (
                      <span key={cat} style={{
                        background: 'var(--bg4)', borderRadius: 20, padding: '3px 10px',
                        fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: CAT_COLORS[cat] || '#888', display: 'inline-block' }} />
                        {cat} <strong>{fmt(val)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius2)', fontSize: 13,
                background: 'rgba(45,190,138,0.1)', borderLeft: '3px solid var(--green)', color: 'var(--green)',
              }}>
                ✓ 「始める」を押すと予算・目標ページに自動反映されます
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn onClick={() => setStep(3)}>← 戻る</Btn>
              <Btn variant="primary" style={{ padding: '10px 28px', fontSize: 14 }} onClick={save}>
                ✓ この設定で始める
              </Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
