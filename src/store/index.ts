
import type { Transaction, FixedCost, BudgetMap, Goals, AppSettings } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ===== STORE SHAPE =====

interface KakeiboState {
  transactions: Transaction[]
  fixedCosts:   FixedCost[]
  budgets:      BudgetMap
  goals:        Goals
  settings:     AppSettings

  // Transaction actions
  addTransaction:    (tx: Omit<Transaction, 'id'>) => void
  deleteTransaction: (id: number) => void
  deleteMonthTx:     (month: string) => void

  // Fixed cost actions
  addFixedCost:    (fc: Omit<FixedCost, 'id'>) => void
  deleteFixedCost: (id: number) => void

  // Budget / goal actions
  setBudgets: (b: BudgetMap) => void
  setGoals:   (g: Goals) => void

  // Settings
  setTheme:      (theme: 'dark' | 'light') => void
  completeSetup: (preset: string, netIncome: number) => void

  // Danger
  resetAll: () => void
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  setupDone: false,
}

// ===== STORE =====

export const useKakeiboStore = create<KakeiboState>()(
  persist(
    (set, _get) => ({
      transactions: [],
      fixedCosts:   [],
      budgets:      {},
      goals:        { defense: 6 },
      settings:     DEFAULT_SETTINGS,

      // ----- Transactions -----
      addTransaction: (tx: Omit<Transaction, 'id'>) =>
        set((s: KakeiboState) => ({ transactions: [...s.transactions, { ...tx, id: Date.now() }] })),

      deleteTransaction: (id: number) =>
        set((s: KakeiboState) => ({ transactions: s.transactions.filter((t: Transaction) => t.id !== id) })),

      deleteMonthTx: (month: string) =>
        set((s: KakeiboState) => ({ transactions: s.transactions.filter((t: Transaction) => !t.date.startsWith(month)) })),

      // ----- Fixed Costs -----
      addFixedCost: (fc: Omit<FixedCost, 'id'>) =>
        set((s: KakeiboState) => ({ fixedCosts: [...s.fixedCosts, { ...fc, id: Date.now() }] })),

      deleteFixedCost: (id: number) =>
        set((s: KakeiboState) => ({ fixedCosts: s.fixedCosts.filter((f: FixedCost) => f.id !== id) })),

      // ----- Budgets / Goals -----
      setBudgets: (b: BudgetMap) => set({ budgets: b }),

      setGoals: (g: Goals) =>
        set((s: KakeiboState) => ({ goals: { ...s.goals, ...g } })),

      // ----- Settings -----
      setTheme: (theme: 'dark' | 'light') =>
        set((s: KakeiboState) => ({ settings: { ...s.settings, theme } })),

      completeSetup: (preset: string, netIncome: number) =>
        set((s: KakeiboState) => ({
          settings: { ...s.settings, setupDone: true, preset, netIncome },
        })),

      // ----- Reset -----
      resetAll: () =>
        set({
          transactions: [],
          fixedCosts:   [],
          budgets:      {},
          goals:        { defense: 6 },
          settings:     DEFAULT_SETTINGS,
        }),
    }),
    {
      name: 'kakeibo-store',   // localStorage key
      version: 1,
    }
  )
)

// ===== SELECTORS =====

export const selectFixedTotal = (s: KakeiboState): number =>
  s.fixedCosts.reduce((sum, f) => sum + f.amount, 0)

export const selectTransactionTotal = (s: KakeiboState): number =>
  s.transactions.reduce((sum, t) => sum + t.amount, 0)

export const selectBudgetRemaining = (category: string) => (s: KakeiboState): number => {
  const budgeted = s.budgets[category] ?? 0
  const spent = s.transactions
    .filter((t: Transaction) => t.category === category)
    .reduce((sum, t) => sum + t.amount, 0)
  return budgeted - spent
}

