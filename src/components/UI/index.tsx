'use client'

import { clsx } from 'clsx'
import type { AlertType } from '@/types'
import { shiftMonth } from '@/lib/utils'

// ===== CARD =====

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={clsx(className)}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 20,
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ===== SECTION TITLE =====

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, color: 'var(--text3)',
      textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

// ===== KPI CARD =====

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  color: string
  bar?: number
  barColor?: string
}

export function KpiCard({ label, value, sub, color, bar, barColor }: KpiCardProps) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 16,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
      {bar !== undefined && (
        <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${Math.min(bar, 100)}%`,
            background: barColor,
            transition: 'width 0.5s',
          }} />
        </div>
      )}
    </div>
  )
}

// ===== ALERT =====

interface AlertProps {
  type: AlertType
  children: React.ReactNode
}

const ALERT_STYLES: Record<AlertType, React.CSSProperties> = {
  ok:     { background: 'rgba(45,190,138,0.1)',  borderColor: 'var(--green)', color: 'var(--green)' },
  warn:   { background: 'rgba(224,168,48,0.1)',  borderColor: 'var(--amber)', color: 'var(--amber)' },
  danger: { background: 'rgba(224,85,85,0.1)',   borderColor: 'var(--red)',   color: 'var(--red)'   },
}

export function Alert({ type, children }: AlertProps) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius2)',
      fontSize: 13, marginBottom: 8,
      borderLeft: '3px solid',
      ...ALERT_STYLES[type],
    }}>
      {children}
    </div>
  )
}

// ===== MONTH NAV =====

interface MonthNavProps {
  month: string
  onChange: (m: string) => void
  children?: React.ReactNode
}

export function MonthNav({ month, onChange, children }: MonthNavProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      <input
        type="month"
        value={month}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text)', padding: '6px 12px',
          borderRadius: 'var(--radius2)', fontSize: 14, cursor: 'pointer',
        }}
      />
      <Btn onClick={() => onChange(shiftMonth(month, -1))}>◀</Btn>
      <Btn onClick={() => onChange(shiftMonth(month, 1))}>▶</Btn>
      <Btn onClick={() => onChange(new Date().toISOString().slice(0, 7))}>今月</Btn>
      {children}
    </div>
  )
}

// ===== BUTTON =====

interface BtnProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'danger' | 'green'
  style?: React.CSSProperties
  type?: 'button' | 'submit'
  disabled?: boolean
}

const BTN_VARIANTS: Record<string, React.CSSProperties> = {
  default: { background: 'var(--bg3)', borderColor: 'var(--border2)', color: 'var(--text)' },
  primary: { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'white' },
  danger:  { background: 'rgba(224,85,85,0.15)', borderColor: 'var(--red2)', color: 'var(--red)' },
  green:   { background: 'rgba(45,190,138,0.15)', borderColor: 'var(--green2)', color: 'var(--green)' },
}

export function Btn({ onClick, children, variant = 'default', style, type = 'button', disabled }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 16px', borderRadius: 'var(--radius2)',
        border: '1px solid', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13, transition: 'all 0.15s', fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
        ...BTN_VARIANTS[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ===== FORM GROUP =====

interface FormGroupProps {
  label: string
  children: React.ReactNode
  span?: boolean
}

export function FormGroup({ label, children, span }: FormGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: span ? '1/-1' : undefined }}>
      <label style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputBase: React.CSSProperties = {
  background: 'var(--bg3)', border: '1px solid var(--border)',
  color: 'var(--text)', padding: '8px 10px',
  borderRadius: 'var(--radius2)', fontSize: 13, fontFamily: 'inherit',
  width: '100%',
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...props.style }} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputBase, ...props.style }} />
}

// ===== MODAL =====

interface ModalProps {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export function Modal({ open, title, body, confirmLabel = '削除する', onConfirm, onClose }: ModalProps) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)', padding: 24,
        maxWidth: 480, width: '90%',
      }}>
        <h3 style={{ marginBottom: 12, fontSize: 16 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>{body}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn onClick={onClose}>キャンセル</Btn>
          <Btn variant="danger" onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  )
}
