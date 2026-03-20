// ===== DOMAIN TYPES =====

export type TransactionType = 'income' | 'expense' | 'saving'

export interface Transaction {
  id: number
  type: TransactionType
  date: string        // 'YYYY-MM-DD'
  amount: number
  category: string
  method: string
  note: string
  tags: string[]
}

export interface FixedCost {
  id: number
  name: string
  amount: number
  category: string
  method: string
  note: string
}

export type BudgetMap = Record<string, number>  // category -> monthly limit

export interface Goals {
  saving?: number       // 月間貯金目標
  presaving?: number    // 先取り貯金目標
  defense?: number      // 生活防衛月数
  passive?: number      // 受動収入（円/月）
}

export interface AppSettings {
  theme: 'dark' | 'light'
  setupDone: boolean
  preset?: string
  netIncome?: number
}

// ===== PRESET TYPES =====

export interface SetupPreset {
  id: string
  name: string
  emoji: string
  desc: string
  saving: number    // %
  expense: number   // %
  invest: number    // %
  meaning: string[]
}

export type PresetId = 'standard' | 'saving_heavy' | 'survival' | 'fire' | 'enjoy' | 'custom'

// ===== KPI TYPES =====

export interface KpiItem {
  label: string
  value: string
  sub?: string
  color: string
  bar?: number
  barColor?: string
}

export type SafetyLevel = 'S' | 'A' | 'B' | 'C' | 'D'

export interface SafetyInfo {
  level: SafetyLevel
  cls: string
  label: string
}

// ===== ALERT TYPES =====

export type AlertType = 'ok' | 'warn' | 'danger'

export interface AlertItem {
  type: AlertType
  msg: string
}

// ===== CHART TYPES =====

export interface MonthSummary {
  month: string
  income: number
  expense: number
  saving: number
  balance: number
}
