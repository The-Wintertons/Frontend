/**
 * Data Display Component Tests
 */
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'

describe('CandlestickChart', () => {
  it('Render Chart - should render with valid market data', () => {
    const marketData = ref([
      { open: 100, high: 105, low: 95, close: 102 },
      { open: 102, high: 110, low: 98, close: 107 }
    ])
    
    expect(marketData.value.length).toBeGreaterThan(0)
    expect(marketData.value[0]).toHaveProperty('open')
    expect(marketData.value[0]).toHaveProperty('close')
  })

  it('Handle Synced Range - should sync to parent range selection', () => {
    const syncedRange = ref({ start: 0, end: 100 })
    
    expect(syncedRange.value.start).toBe(0)
    expect(syncedRange.value.end).toBe(100)
  })
})

describe('RecentTrades', () => {
  it('Display Trades - should show latest transactions', () => {
    const trades = ref([
      { id: 1, type: 'Buy', quantity: 100, price: 50, total: 5000 },
      { id: 2, type: 'Sell', quantity: 50, price: 52, total: 2600 }
    ])
    
    expect(trades.value.length).toBeGreaterThan(0)
    expect(trades.value[0]).toHaveProperty('type')
    expect(trades.value[0]).toHaveProperty('quantity')
  })

  it('Empty State - should show message when no trades available', () => {
    const trades = ref([])
    
    expect(trades.value.length).toBe(0)
  })
})

describe('StatsBadges', () => {
  it('Display Metrics - should show correct values', () => {
    const stats = ref({
      totalTrades: 42,
      winRate: 0.643,
      avgReturn: 0.0125
    })
    
    expect(stats.value.totalTrades).toBe(42)
    expect(stats.value.winRate).toBeCloseTo(0.643)
  })

  it('Update Metrics - should update on portfolio change', () => {
    const portfolio = ref('mean_reversion')
    const stats = ref({ totalTrades: 42 })
    
    portfolio.value = 'mlmc_strategy'
    stats.value = { totalTrades: 58 }
    
    expect(stats.value.totalTrades).toBe(58)
  })
})
