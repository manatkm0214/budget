'use client'

import { useMemo } from 'react'
import { useKakeiboStore, selectFixedTotal } from '@/store'
import { calcKpis, getMonthTx, sumCat, buildMonthSummary } from '@/lib/utils'
import { CATS } from '@/lib/constants'
import type { MonthSummary } from '@/types'
import { shiftMonth } from '@/lib/utils'

// ===== Month KPI hook =====

export function useMonthKpis(month: string) {
  const transactions  = useKakeiboStore((s: { transactions: any }) => s.transactions)
  const budgets       = useKakeiboStore((s: { budgets: any }) => s.budgets)
  const goals         = useKakeiboStore((s: { goals: any }) => s.goals)
  const fixedCostTotal = useKakeiboStore(selectFixedTotal)

  return useMemo(
    () => calcKpis({ transactions, fixedCostTotal, budgets, goals, month }),
    [transactions, fixedCostTotal, budgets, goals, month]
  )
}

// ===== Month transactions hook =====

export function useMonthTransactions(month: string) {
  const transactions = useKakeiboStore((s: { transactions: any }) => s.transactions)
  return useMemo(
    () => getMonthTx(transactions, month).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, month]
  )
}

// ===== 12-month trend hook =====

export function useYearTrend(baseMonth: string): MonthSummary[] {
  const transactions = useKakeiboStore((s: { transactions: any }) => s.transactions)
  return useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = shiftMonth(baseMonth, i - 11)
      return buildMonthSummary(transactions, m)
    })
  }, [transactions, baseMonth])
}

// ===== Category breakdown for a month =====

export function useCategoryBreakdown(month: string) {
  const transactions = useKakeiboStore((s: { transactions: any }) => s.transactions)

  return useMemo(() => {
    const txs = getMonthTx(transactions, month)
    return CATS.expense
      .map((cat: string) => ({ cat, amount: sumCat(txs, cat) }))
      .filter((x: { cat: string; amount: number }) => x.amount > 0)
  }, [transactions, month])
}
