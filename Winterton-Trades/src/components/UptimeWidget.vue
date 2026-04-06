<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { UptimePeriod } from '../types/apiTypeDefinitions'
import { fetchUptime } from '../selectedApi'

const props = defineProps<{ portfolio?: string }>()

const isLoading = ref(true)
const uptime = ref('')
const responseTime = ref('')
const statusBars = ref<UptimePeriod[]>([])
const responsePoints = ref<number[]>([])

function getResponsePath(): string {
  if (responsePoints.value.length === 0) return ''

  const safePoints = responsePoints.value
    .map((val) => Number(val))
    .filter((val) => Number.isFinite(val))

  if (safePoints.length === 0) return ''

  const width = 280
  const height = 50
  const maxVal = Math.max(...safePoints)
  const minVal = Math.min(...safePoints)
  const range = maxVal - minVal || 1

  if (safePoints.length === 1) {
    const firstPoint = safePoints[0]
    if (firstPoint === undefined) return ''
    const y = height - ((firstPoint - minVal) / range) * (height - 10) - 5
    return `M 0,${y} L ${width},${y}`
  }

  const points = safePoints.map((val, idx) => {
    const x = (idx / (safePoints.length - 1)) * width
    const y = height - ((val - minVal) / range) * (height - 10) - 5
    return `${x},${y}`
  })

  return `M ${points.join(' L ')}`
}

async function loadData() {
  isLoading.value = true
  try {
    const data = await fetchUptime(props.portfolio)
    uptime.value = data.uptimePercent
    responseTime.value = data.avgResponseTime
    statusBars.value = data.statusBars
    responsePoints.value = data.responseTimeline
  } finally {
    isLoading.value = false
  }
}

let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadData()

  refreshInterval = setInterval(async () => {
    // TODO: replace with a lightweight polling endpoint, e.g. /api/uptime/latest
    const newTime = 180 + Math.random() * 80
    responseTime.value = `${newTime.toFixed(2)}ms`
    responsePoints.value.push(newTime)
    if (responsePoints.value.length > 40) responsePoints.value.shift()
  }, 5000)
})

watch(() => props.portfolio, () => {
  loadData()
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="uptime-widget">
    <div class="uptime-header">
      <span class="uptime-indicator">📶</span>
      <span class="uptime-label">Uptime ({{ isLoading ? '--.--%' : uptime }})</span>
      <span class="uptime-period">Last 30 Days ▾</span>
    </div>

    <div v-if="isLoading" class="status-bars status-bars-skeleton">
      <div v-for="idx in 30" :key="`skeleton-bar-${idx}`" class="status-bar skeleton-block"></div>
    </div>

    <div v-else class="status-bars">
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
        <span class="response-value">({{ isLoading ? '--ms' : responseTime }} avg.)</span>
      </div>

      <p v-if="!isLoading" class="response-desc">
        Shows the 'feature' that the monitor started returning a response in ms (and average for the displayed period is {{ responseTime }}).
      </p>

      <div v-else class="response-desc-skeleton">
        <span class="skeleton-line"></span>
        <span class="skeleton-line short"></span>
      </div>

      <svg
        class="response-chart"
        viewBox="0 0 280 55"
        preserveAspectRatio="none"
      >
        <path
          :d="isLoading ? 'M 0,35 L 40,30 L 80,34 L 120,25 L 160,28 L 200,18 L 240,23 L 280,16' : getResponsePath()"
          fill="none"
          :stroke="isLoading ? '#7d7d7d' : '#ffc107'"
          stroke-width="1.5"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.uptime-widget {
  background:var(--bg-card);
  border-radius: 0.75rem;
  padding: 0.875rem;
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.uptime-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.625rem;
  font-size: 0.8125rem;
}

.uptime-indicator {
  font-size: 0.875rem;
}

.uptime-label {
  font-weight: 600;
  color:var(--text-primary);
}

.uptime-period {
  margin-left: auto;
  font-size: 0.6875rem;
  color: #888;
  cursor: pointer;
}

.status-bars {
  display: flex;
  gap: 0.125rem;
  margin-bottom: 0.875rem;
}

.status-bar {
  flex: 1;
  height: 1.5rem;
  border-radius: 0.125rem;
  min-width: 0.25rem;
}

.status-bars-skeleton .status-bar {
  opacity: 0.9;
}

.response-section {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.625rem;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  margin-bottom: 0.25rem;
}

.response-icon {
  font-size: 0.875rem;
}

.response-label {
  font-weight: 600;
  color: var(--text-primary);
}

.response-value {
  color: #ffc107;
  font-size: 0.75rem;
}

.response-desc {
  font-size: 0.625rem;
  color: #666;
  margin: 0.125rem 0 0.5rem;
  line-height: 1.4;
}

.response-desc-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin: 0.25rem 0 0.625rem;
}

.skeleton-line {
  display: block;
  height: 0.5rem;
  width: 100%;
  border-radius: 0.375rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.08) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s linear infinite;
}

.skeleton-line.short {
  width: 78%;
}

.skeleton-block {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.08) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s linear infinite;
}

.response-chart {
  width: 100%;
  height: 3.125rem;
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
