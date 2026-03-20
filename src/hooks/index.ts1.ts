'use client'

import { useMemo } from 'react'
import { useKakeiboStore, selectFixedTotal } from '@/store'
import { calcKpis, getMonthTx, sumBy, sumCat, buildMonthSummary } from '@/lib/utils'
import type { MonthSummary } from '@/types'
import { shiftMonth } from '@/lib/utils'

// ===== Month KPI hook =====

export function useMonthKpis(month: string) {
  const transactions  = useKakeiboStore(s => s.transactions)
  const budgets       = useKakeiboStore(s => s.budgets)
  const goals         = useKakeiboStore(s => s.goals)
  const fixedCostTotal = useKakeiboStore(selectFixedTotal)

  return useMemo(
    () => calcKpis({ transactions, fixedCostTotal, budgets, goals, month }),
    [transactions, fixedCostTotal, budgets, goals, month]
  )
}

// ===== Month transactions hook =====

export function useMonthTransactions(month: string) {
  const transactions = useKakeiboStore(s => s.transactions)
  return useMemo(
    () => getMonthTx(transactions, month).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, month]
  )
}

// ===== 12-month trend hook =====

export function useYearTrend(baseMonth: string): MonthSummary[] {
  const transactions = useKakeiboStore(s => s.transactions)
  return useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = shiftMonth(baseMonth, i - 11)
      return buildMonthSummary(transactions, m)
    })
  }, [transactions, baseMonth])
}

// ===== Category breakdown for a month =====

export function useCategoryBreakdown(month: string) {
  const transactions = useKakeiboStore(s => s.transactions)
  const { CATS }     = require('@/lib/constants')

  return useMemo(() => {
    const txs = getMonthTx(transactions, month)
    return CATS.expense
      .map((cat: string) => ({ cat, amount: sumCat(txs, cat) }))
      .filter((x: { cat: string; amount: number }) => x.amount > 0)
  }, [transactions, month])
}
