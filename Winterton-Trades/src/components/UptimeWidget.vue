<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { UptimePeriod } from '../types/apiTypeDefinitions'
import { fetchUptime } from '../api'

const props = defineProps<{ portfolio?: string }>()

const isLoading = ref(true)
const uptime = ref('')
const responseTime = ref('')
const statusBars = ref<UptimePeriod[]>([])
const responsePoints = ref<number[]>([])

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
  color:var(--text-primary);
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

.status-bars-skeleton .status-bar {
  opacity: 0.9;
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
  color: var(--text-primary);
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

.response-desc-skeleton {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 4px 0 10px;
}

.skeleton-line {
  display: block;
  height: 8px;
  width: 100%;
  border-radius: 6px;
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
  height: 50px;
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
