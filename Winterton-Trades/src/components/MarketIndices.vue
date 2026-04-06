<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { MarketIndex } from '../types/apiTypeDefinitions'
import { fetchMarketIndices } from '../selectedApi'

const props = defineProps<{ portfolio?: string }>()

const loading = ref(true)
const indices = ref<MarketIndex[]>([])

/** Add small random drift to simulate live ticking. */
function jitterIndices() {
  indices.value = indices.value.map((idx) => {
    const drift = (Math.random() - 0.5) * idx.value * 0.001
    const newValue = +(idx.value + drift).toFixed(2)
    const newChange = +(idx.change + drift).toFixed(2)
    const newPercent = +((newChange / (newValue - newChange)) * 100).toFixed(2)
    return { ...idx, value: newValue, change: newChange, changePercent: newPercent }
  })
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchMarketIndices(props.portfolio)
    indices.value = data.indices
  } finally {
    loading.value = false
  }
}

let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadData()
  refreshInterval = setInterval(jitterIndices, 8000)
})

watch(() => props.portfolio, () => {
  loadData()
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

function formatValue(val: number): string {
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatChange(val: number): string {
  const sign = val >= 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}`
}

function formatPercent(val: number): string {
  const sign = val >= 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}%`
}
</script>

<template>
  <div class="market-indices">
    <div class="indices-header">
      <span class="indices-title">Market Overview</span>
    </div>

    <div v-if="loading" class="indices-list" aria-hidden="true">
      <div v-for="idx in 5" :key="`index-skeleton-${idx}`" class="index-row index-row-skeleton">
        <div class="index-info">
          <span class="skeleton-line symbol"></span>
          <span class="skeleton-line name"></span>
        </div>
        <div class="index-data">
          <span class="skeleton-line value"></span>
          <span class="skeleton-line change"></span>
        </div>
      </div>
    </div>

    <div v-else class="indices-list">
      <div v-for="idx in indices" :key="idx.symbol" class="index-row">
        <div class="index-info">
          <span class="index-symbol">{{ idx.symbol }}</span>
          <span class="index-name">{{ idx.name }}</span>
        </div>
        <div class="index-data">
          <span class="index-value">{{ formatValue(idx.value) }}</span>
          <span
            class="index-change"
            :class="idx.change >= 0 ? 'positive' : 'negative'"
          >
            <span class="change-arrow">{{ idx.change >= 0 ? '▲' : '▼' }}</span>
            {{ formatChange(idx.change) }} ({{ formatPercent(idx.changePercent) }})
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.market-indices {
  background: var(--bg-card);
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.indices-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.indices-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.indices-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.index-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  transition: background 0.15s ease;
}

.index-row:hover {
  background: var(--bg-card-hover);
}

.index-row-skeleton {
  pointer-events: none;
}

.index-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.index-symbol {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.index-name {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.index-data {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.index-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.index-change {
  font-size: 0.6875rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.change-arrow {
  font-size: 0.5625rem;
  margin-right: 0.125rem;
}

.positive {
  color: #26a69a;
}

.negative {
  color: #ef5350;
}

.skeleton-line {
  display: block;
  height: 0.5rem;
  border-radius: 0.375rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.08) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s linear infinite;
}

.skeleton-line.symbol {
  width: 4rem;
  margin-bottom: 0.25rem;
}

.skeleton-line.name {
  width: 6.875rem;
}

.skeleton-line.value {
  width: 4.875rem;
  margin-bottom: 0.25rem;
}

.skeleton-line.change {
  width: 6.125rem;
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
