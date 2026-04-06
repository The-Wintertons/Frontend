<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { createChart, type IChartApi, type ISeriesApi, AreaSeries, ColorType } from 'lightweight-charts'
import { fetchPortfolioChart } from '../selectedApi'

// Adjustable parameter to bring the start/end dates inward (in milliseconds)
// e.g. 1 day = 24 * 60 * 60 * 1000
const RANGE_PADDING_MS = 24 * 60 * 60 * 1000

type SyncedRange = {
  start: number
  end: number
}

const props = defineProps<{
  syncedRange?: SyncedRange | null
  portfolio?: string
}>()

const emit = defineEmits<{
  (event: 'range-ready', range: SyncedRange): void
}>()

const chartContainer = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
let chart: IChartApi | null = null
let areaSeries: ISeriesApi<'Area'> | null = null
let themeObserver: MutationObserver | null = null
let latestDataRange: SyncedRange | null = null

/** Returns true when light mode is active */
function isLightTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'light'
}

function getThemeColors() {
  const light = isLightTheme()
  return {
    bg: light ? '#ffffff' : '#1a1a2e',
    text: light ? '#666' : '#888',
    gridColor: light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
    borderColor: light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
  }
}

function toDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0]!
}

function applySyncedRange(range: SyncedRange): void {
  if (!chart || !latestDataRange) return
  
  // Apply our local padding to move the start and end dates inwards
  const clampedStart = Math.max(range.start, latestDataRange.start) + RANGE_PADDING_MS
  const clampedEnd = Math.min(range.end, latestDataRange.end)
  
  if (clampedEnd <= clampedStart) return

  chart.timeScale().setVisibleRange({
    from: toDateKey(clampedStart) as any,
    to: toDateKey(clampedEnd) as any,
  })
}

async function loadChartData() {
  if (!chart || !areaSeries) return

  isLoading.value = true
  try {
    const { data } = await fetchPortfolioChart(props.portfolio)
    if (!data || data.length === 0) return

    const startValue = data[0]!.value
    const endValue = data[data.length - 1]!.value
    const isPositive = endValue >= startValue

    areaSeries.applyOptions({
      lineColor: isPositive ? '#26a69a' : '#ef5350',
      topColor: isPositive ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)',
      bottomColor: isPositive ? 'rgba(38, 166, 154, 0.02)' : 'rgba(239, 83, 80, 0.02)',
    })

    areaSeries.setData(data as any)
    chart.timeScale().fitContent()

    const dataStart = new Date(data[0]!.time).getTime()
    const dataEnd = new Date(data[data.length - 1]!.time).getTime()
    latestDataRange = { start: dataStart, end: dataEnd }

    // Default to the full data span from the chart so the timeline can mirror it
    const defaultRange: SyncedRange = {
      start: dataStart,
      end: dataEnd,
    }

    applySyncedRange(props.syncedRange ?? defaultRange)
    emit('range-ready', props.syncedRange ?? defaultRange)
  } finally {
    isLoading.value = false
  }
}

function getChartHeight(): number {
  if (chartContainer.value && chartContainer.value.clientHeight > 0) {
    return chartContainer.value.clientHeight
  }
  return 480
}

async function initChart() {
  if (!chartContainer.value) return

  const width = chartContainer.value.clientWidth || 800
  const height = getChartHeight()
  const colors = getThemeColors()

  chart = createChart(chartContainer.value, {
    layout: {
      background: { type: ColorType.Solid, color: colors.bg },
      textColor: colors.text,
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: colors.gridColor },
      horzLines: { color: colors.gridColor },
    },
    width,
    height,
    timeScale: {
      borderColor: colors.borderColor,
      fixLeftEdge: true,
      fixRightEdge: true,
      rightOffset: 0,
    },
    rightPriceScale: {
      borderColor: colors.borderColor,
    },
  })

  areaSeries = chart.addSeries(AreaSeries, {
    lineWidth: 2,
  })

  await loadChartData()
  
  areaSeries.priceScale().applyOptions({
    autoScale: true,
    scaleMargins: {
      top: 0,
      bottom: 0,
    }
  })
}

const handleResize = () => {
  if (chart && chartContainer.value) {
    chart.applyOptions({
      width: chartContainer.value.clientWidth,
      height: chartContainer.value.clientHeight,
    })
  }
}

onMounted(async () => {
  await nextTick()
  // Wait a frame for the container to have layout dimensions
  requestAnimationFrame(async () => {
    await initChart()
  })
  window.addEventListener('resize', handleResize)

  // Watch for theme changes
  themeObserver = new MutationObserver(() => {
    if (!chart) return
    const colors = getThemeColors()
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: colors.bg },
        textColor: colors.text,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      timeScale: { borderColor: colors.borderColor },
      rightPriceScale: { borderColor: colors.borderColor },
    })
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  themeObserver?.disconnect()
  if (chart) {
    chart.remove()
    chart = null
  }
})

watch(
  () => props.portfolio,
  () => {
    loadChartData()
  }
)

watch(
  () => props.syncedRange,
  (range) => {
    if (!range) return
    applySyncedRange(range)
  },
)
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <h3 class="chart-title">Portfolio Performance</h3>
    </div>
    <div class="chart-shell">
      <div v-if="isLoading" class="chart-skeleton" aria-hidden="true">
        <div class="skeleton-grid"></div>
        <div class="skeleton-line"></div>
      </div>
      <div ref="chartContainer" class="chart-container" :class="{ 'chart-container-hidden': isLoading }"></div>
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  background: var(--chart-bg);
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--chart-border);
  display: flex;
  flex-direction: column; flex: 1.75; min-height: 0;
}

.chart-header {
  padding: 1.125rem 1.5rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.chart-container {
  width: 100%;
  flex: 1; min-height: 0; display: flex;
  flex: 1;
}

.chart-shell {
  position: relative;
  width: 100%;
  flex: 1; min-height: 0; display: flex;
}

.chart-container-hidden {
  opacity: 0;
}

.chart-skeleton {
  position: absolute;
  inset: 0;
  border-top: 1px solid var(--chart-border);
  background: var(--chart-bg);
  z-index: 1;
  overflow: hidden;
}

.skeleton-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 3.5rem 3.5rem;
}

.skeleton-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 48%;
  height: 0.125rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.18) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.2s linear infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
