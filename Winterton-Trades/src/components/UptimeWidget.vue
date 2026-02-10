<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const uptime = ref('100.000%')
const responseTime = ref('221.22ms')
const statusBars = ref<{ value: number; color: string }[]>([])
const responsePoints = ref<number[]>([])

function generateStatusBars() {
  const bars = []
  for (let i = 0; i < 30; i++) {
    const value = Math.random() > 0.02 ? 100 : Math.random() * 50 + 50
    bars.push({
      value,
      color: value === 100 ? '#26a69a' : value > 80 ? '#ffc107' : '#ef5350',
    })
  }
  return bars
}

function generateResponseTimeline() {
  const points = []
  for (let i = 0; i < 40; i++) {
    points.push(150 + Math.random() * 200)
  }
  return points
}

function getResponsePath(): string {
  if (responsePoints.value.length === 0) return ''
  const width = 280
  const height = 50
  const maxVal = Math.max(...responsePoints.value)
  const minVal = Math.min(...responsePoints.value)
  const range = maxVal - minVal || 1

  const points = responsePoints.value.map((val, idx) => {
    const x = (idx / (responsePoints.value.length - 1)) * width
    const y = height - ((val - minVal) / range) * (height - 10) - 5
    return `${x},${y}`
  })

  return `M ${points.join(' L ')}`
}

let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  statusBars.value = generateStatusBars()
  responsePoints.value = generateResponseTimeline()

  refreshInterval = setInterval(() => {
    // Simulate minor response time fluctuation
    const newTime = 180 + Math.random() * 80
    responseTime.value = `${newTime.toFixed(2)}ms`
    responsePoints.value.push(newTime)
    if (responsePoints.value.length > 40) responsePoints.value.shift()
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="uptime-widget">
    <div class="uptime-header">
      <span class="uptime-indicator">📶</span>
      <span class="uptime-label">Uptime ({{ uptime }})</span>
      <span class="uptime-period">Last 30 Days ▾</span>
    </div>

    <div class="status-bars">
      <div
        v-for="(bar, idx) in statusBars"
        :key="idx"
        class="status-bar"
        :style="{ backgroundColor: bar.color }"
        :title="`Day ${idx + 1}: ${bar.value.toFixed(1)}%`"
      ></div>
    </div>

    <div class="response-section">
      <div class="response-header">
        <span class="response-icon">📈</span>
        <span class="response-label">Response Time</span>
        <span class="response-value">({{ responseTime }} avg.)</span>
      </div>
      <p class="response-desc">
        Shows the 'feature' that the monitor started returning a response in ms (and average for the displayed period is {{ responseTime }}).
      </p>
      <svg
        class="response-chart"
        viewBox="0 0 280 55"
        preserveAspectRatio="none"
      >
        <path
          :d="getResponsePath()"
          fill="none"
          stroke="#ffc107"
          stroke-width="1.5"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.uptime-widget {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 14px;
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.uptime-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 13px;
}

.uptime-indicator {
  font-size: 14px;
}

.uptime-label {
  font-weight: 600;
  color: #fff;
}

.uptime-period {
  margin-left: auto;
  font-size: 11px;
  color: #888;
  cursor: pointer;
}

.status-bars {
  display: flex;
  gap: 2px;
  margin-bottom: 14px;
}

.status-bar {
  flex: 1;
  height: 24px;
  border-radius: 2px;
  min-width: 4px;
}

.response-section {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 10px;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 4px;
}

.response-icon {
  font-size: 14px;
}

.response-label {
  font-weight: 600;
  color: #fff;
}

.response-value {
  color: #ffc107;
  font-size: 12px;
}

.response-desc {
  font-size: 10px;
  color: #666;
  margin: 2px 0 8px;
  line-height: 1.4;
}

.response-chart {
  width: 100%;
  height: 50px;
}
</style>
