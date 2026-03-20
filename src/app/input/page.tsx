'use client'

import { useState } from 'react'
import { useKakeiboStore } from '@/store'
import { CATS, METHODS, CAT_COLORS, SETUP_PRESETS, buildCatBudgets } from '@/lib/constants'
import { today, fmt } from '@/lib/utils'
import { Card, Btn, FormGroup, Input, Select, SectionTitle } from '@/components/UI'
import { showToast } from '@/components/UI/toast'
import type { TransactionType } from '@/types'

type InputType = TransactionType | 'fixed'

const TYPE_TABS: { type: InputType; label: string }[] = [
  { type: 'income',  label: '💰 収入' },
  { type: 'expense', label: '💸 支出' },
  { type: 'saving',  label: '🏦 貯金' },
  { type: 'fixed',   label: '📌 固定費登録' },
]

const TYPE_COLORS: Record<InputType, string> = {
  income:  'rgba(45,190,138,0.15)',
  expense: 'rgba(224,85,85,0.15)',
  saving:  'rgba(74,159,224,0.15)',
  fixed:   'rgba(224,168,48,0.15)',
}

export default function InputPage() {
  const [activeType, setActiveType] = useState<InputType>('income')

  return (
    <div>
      {/* Type tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TYPE_TABS.map(t => (
          <button key={t.type} onClick={() => setActiveType(t.type)}
            style={{
              flex: 1, padding: 8, textAlign: 'center', borderRadius: 'var(--radius2)',
              cursor: 'pointer', fontSize: 13, border: '1px solid var(--border)',
              background: activeType === t.type ? TYPE_COLORS[t.type] : 'var(--bg3)',
              color: activeType === t.type ? 'var(--text)' : 'var(--text2)',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeType === 'fixed'   ? <FixedForm /> : <TxForm type={activeType as TransactionType} />}
      {activeType === 'expense' && <AutoAllocCard />}
    </div>
  )
}

// ===== TRANSACTION FORM =====

function TxForm({ type }: { type: TransactionType }) {
  const addTx = useKakeiboStore((s: any) => s.addTransaction)
  const [date, setDate]       = useState(today())
  const [amount, setAmount]   = useState('')
  const [category, setCat]    = useState(CATS[type][0])
  const [method, setMethod]   = useState(METHODS[0])
  const [note, setNote]       = useState('')
  const [tags, setTags]       = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // reset category when type changes
  const cats = CATS[type]

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const v = tagInput.trim()
      if (v && !tags.includes(v)) setTags([...tags, v])
      setTagInput('')
    }
  }

  function submit() {
    const n = parseFloat(amount)
    if (!n || n <= 0) { showToast('⚠️ 金額を入力してください'); return }
    addTx({ type, date, amount: n, category, method, note, tags })
    setAmount(''); setNote(''); setTags([])
    showToast('✓ 記録しました')
  }

  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <FormGroup label="日付">
          <Input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="金額（円）">
          <Input type="number" value={amount} onChange={(e: any) => setAmount(e.target.value)} placeholder="0" />
        </FormGroup>
        <FormGroup label="カテゴリ">
          <Select value={category} onChange={(e: any) => setCat(e.target.value)}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="支払方法">
          <Select value={method} onChange={(e: any) => setMethod(e.target.value)}>
            {METHODS.map(m => <option key={m}>{m}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="メモ" span>
          <Input value={note} onChange={(e: any) => setNote(e.target.value)} placeholder="メモを入力..." />
        </FormGroup>
        <FormGroup label="タグ（Enterで追加）" span>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, padding: 6,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius2)', minHeight: 38,
          }}>
            {tags.map(t => (
              <span key={t} style={{
                padding: '2px 8px', borderRadius: 20, fontSize: 12,
                background: 'rgba(124,111,224,0.2)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {t}
                <span style={{ cursor: 'pointer' }} onClick={() => setTags(tags.filter(x => x !== t))}>✕</span>
              </span>
            ))}
            <input
              value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 12, outline: 'none', flex: 1, minWidth: 60 }}
              placeholder={tags.length ? '' : 'タグを入力'}
            />
          </div>
        </FormGroup>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Btn variant="primary" onClick={submit}>記録する</Btn>
      </div>
    </Card>
  )
}

// ===== FIXED COST FORM =====

function FixedForm() {
  const addFixed    = useKakeiboStore((s: any) => s.addFixedCost)
  const deleteFixed = useKakeiboStore((s: any) => s.deleteFixedCost)
  const fixedCosts  = useKakeiboStore((s: any) => s.fixedCosts)

  const [name, setName]     = useState('')
  const [amount, setAmount] = useState('')
  const [cat, setCat]       = useState(CATS.fixed[0])
  const [method, setMethod] = useState(METHODS[0])
  const [note, setNote]     = useState('')

  function submit() {
    const n = parseFloat(amount)
    if (!n) { showToast('⚠️ 金額を入力してください'); return }
    addFixed({ name: name || '固定費', amount: n, category: cat, method, note })
    setName(''); setAmount(''); setNote('')
    showToast('✓ 固定費を登録しました')
  }

  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <FormGroup label="固定費名">
          <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="家賃" />
        </FormGroup>
        <FormGroup label="金額（円）">
          <Input type="number" value={amount} onChange={(e: any) => setAmount(e.target.value)} placeholder="80000" />
        </FormGroup>
        <FormGroup label="カテゴリ">
          <Select value={cat} onChange={(e: any) => setCat(e.target.value)}>
            {CATS.fixed.map(c => <option key={c}>{c}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="支払方法">
          <Select value={method} onChange={(e: any) => setMethod(e.target.value)}>
            {METHODS.map(m => <option key={m}>{m}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="メモ">
          <Input value={note} onChange={(e: any) => setNote(e.target.value)} placeholder="〇〇アパート" />
        </FormGroup>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Btn variant="primary" onClick={submit}>固定費を登録する</Btn>
      </div>

      {fixedCosts.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <SectionTitle>登録済み固定費</SectionTitle>
          {fixedCosts.map((f: any) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[f.category] || '#888' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{f.category} / {f.method}</div>
              </div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>
                {fmt(f.amount)}
              </div>
              <button onClick={() => deleteFixed(f.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14 }}>
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ===== AUTO ALLOC CARD =====

const QUICK_PRESETS = [
  { key: 'standard',    label: '標準（貯金20%・支出70%・投資10%）' },
  { key: 'saving_heavy', label: '貯金重視（貯金40%・支出50%・投資10%）' },
  { key: 'survival',    label: '節約（貯金30%・支出65%・投資5%）' },
  { key: 'fire',        label: 'FIRE（貯金10%・支出60%・投資30%）' },
]

function AutoAllocCard() {
  const setBudgets  = useKakeiboStore((s: any) => s.setBudgets)
  const budgets     = useKakeiboStore((s: any) => s.budgets)
  const [net, setNet]       = useState('')
  const [presetKey, setPK]  = useState('standard')

  const netNum = parseFloat(net) || 0
  const p = SETUP_PRESETS[presetKey]
  const saving  = netNum * (p?.saving  || 20) / 100
  const expense = netNum * (p?.expense || 70) / 100
  const invest  = netNum * (p?.invest  || 10) / 100
  const catBudgets = netNum > 0 ? buildCatBudgets(expense) : null

  function apply() {
    if (!catBudgets) return
    setBudgets({ ...budgets, ...catBudgets })
    showToast('✓ 予算に反映しました')
  }

  return (
    <Card style={{ marginTop: 0 }}>
      <SectionTitle>手取り自動配分</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
        <FormGroup label="手取り月収（円）">
          <Input type="number" value={net} onChange={(e: any) => setNet(e.target.value)} placeholder="300000" />
        </FormGroup>
        <FormGroup label="プリセット">
          <Select value={presetKey} onChange={(e: any) => setPK(e.target.value)}>
            {QUICK_PRESETS.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}
          </Select>
        </FormGroup>
      </div>

      {netNum > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { label: '貯金', val: saving, color: 'var(--blue)', pct: p?.saving },
              { label: '生活費', val: expense, color: 'var(--text)', pct: p?.expense },
              { label: '投資', val: invest, color: 'var(--amber)', pct: p?.invest },
            ].map(item => (
              <div key={item.label} style={{
                flex: 1, minWidth: 100, background: 'var(--bg3)',
                borderRadius: 'var(--radius2)', padding: 12,
              }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{item.label}</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{fmt(item.val)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.pct}%</div>
              </div>
            ))}
          </div>
          <Btn variant="green" style={{ width: '100%' }} onClick={apply}>
            この配分を予算に反映する
          </Btn>
        </>
      )}
    </Card>
  )
}
