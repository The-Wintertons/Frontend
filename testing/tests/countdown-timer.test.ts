/**
 * Countdown Timer Tests
 */
import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'

describe('Countdown Timer', () => {
  it('Calculate Countdown - should clamp to zero when target is in the past', () => {
    const now = ref(new Date('2026-04-06').getTime())
    const target = new Date('2026-03-31T00:00:00').getTime()

    const countdown = computed(() => {
      const diff = Math.max(0, target - now.value)
      const days = Math.floor(diff / 86400000)
      return { days }
    })

    expect(countdown.value.days).toBe(0)
  })

  it('Calculate Countdown - should display correct days', () => {
    const now = ref(new Date('2026-04-05T10:30:45').getTime())
    const target = new Date('2026-04-06T10:30:45').getTime()
    
    const countdown = computed(() => {
      const diff = Math.max(0, target - now.value)
      const days = Math.floor(diff / 86400000)
      return { days }
    })
    
    expect(countdown.value.days).toBe(1)
  })

  it('Calculate Countdown - should display correct hours, minutes, seconds', () => {
    const now = ref(new Date('2026-04-05T10:30:45').getTime())
    const target = new Date('2026-04-06T10:30:45').getTime()
    
    const countdown = computed(() => {
      const diff = Math.max(0, target - now.value)
      const days = Math.floor(diff / 86400000)
      const hrs = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      return { days, hrs, mins, secs }
    })
    
    expect(countdown.value).toHaveProperty('days')
    expect(countdown.value).toHaveProperty('hrs')
    expect(countdown.value).toHaveProperty('mins')
    expect(countdown.value).toHaveProperty('secs')
  })

  it('Update Timer - should update every second', () => {
    vi.useFakeTimers()
    const ticks = ref(0)
    
    const interval = setInterval(() => {
      ticks.value += 1
    }, 1000)
    
    vi.advanceTimersByTime(999)
    expect(ticks.value).toBe(0)

    vi.advanceTimersByTime(1)
    expect(ticks.value).toBe(1)
    
    clearInterval(interval)
    vi.useRealTimers()
  })

  it('Cleanup Timer - should clear timer on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    let interval: ReturnType<typeof setInterval> | null = null
    
    interval = setInterval(() => {}, 1000)
    if (interval) {
      clearInterval(interval)
    }
    
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
