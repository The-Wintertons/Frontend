<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { createChart, type IChartApi, type ISeriesApi, AreaSeries, ColorType } from 'lightweight-charts'

const chartContainer = ref<HTMLDivElement | null>(null)
let chart: IChartApi | null = null
let areaSeries: ISeriesApi<'Area'> | null = null

// Generate mock daily portfolio value data
function generateMockData() {
  const data = []
  const startTime = Date.UTC(2024, 0, 1) // Jan 1 2024
  const dayMs = 86400000
  const totalDays = 400
  let portfolioValue = 10000 // Starting portfolio value $10,000

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startTime + i * dayMs)
    const dateStr = date.toISOString().split('T')[0]

    // Simulate gradual portfolio growth with realistic daily fluctuations
    // ~0.03% daily drift upward with ~1.2% daily volatility
    const dailyReturn = 0.0003 + (Math.random() - 0.48) * 0.024

    // Add occasional small drawdowns
    const drawdownChance = Math.random()
    const drawdownMultiplier = drawdownChance < 0.03 ? -0.02 : drawdownChance < 0.07 ? -0.008 : 0

    portfolioValue *= (1 + dailyReturn + drawdownMultiplier)
    portfolioValue = Math.max(portfolioValue * 0.95, portfolioValue) // floor

    data.push({
      time: dateStr,
      value: Math.round(portfolioValue * 100) / 100,
    })
  }
  return data
}

function getChartHeight(): number {
  if (chartContainer.value && chartContainer.value.clientHeight > 0) {
    return chartContainer.value.clientHeight
  }
  return 480
}

function initChart() {
  if (!chartContainer.value) return

  const width = chartContainer.value.clientWidth || 800
  const height = getChartHeight()

  chart = createChart(chartContainer.value, {
    layout: {
      background: { type: ColorType.Solid, color: '#1a1a2e' },
      textColor: '#888',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.05)' },
      horzLines: { color: 'rgba(255,255,255,0.05)' },
    },
    width,
    height,
    timeScale: {
      borderColor: 'rgba(255,255,255,0.1)',
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    rightPriceScale: {
      borderColor: 'rgba(255,255,255,0.1)',
    },
  })

  const mockData = generateMockData()
  const startValue = mockData[0].value
  const endValue = mockData[mockData.length - 1].value
  const isPositive = endValue >= startValue

  areaSeries = chart.addSeries(AreaSeries, {
    lineColor: isPositive ? '#26a69a' : '#ef5350',
    topColor: isPositive ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)',
    bottomColor: isPositive ? 'rgba(38, 166, 154, 0.02)' : 'rgba(239, 83, 80, 0.02)',
    lineWidth: 2,
  })

  areaSeries.setData(mockData as any)
  chart.timeScale().fitContent()
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
  requestAnimationFrame(() => {
    initChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.remove()
    chart = null
  }
})
</script>

<template>
  <div class="chart-wrapper">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  background: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.chart-container {
  width: 100%;
  height: 480px;
}
</style>
