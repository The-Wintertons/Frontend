<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { RecentTrade } from '../types/apiTypeDefinitions'
import { fetchRecentTrades } from '../selectedApi'

const props = defineProps<{ portfolio?: string }>()

const loading = ref(true)
const trades = ref<RecentTrade[]>([])
const hasLoadedOnce = ref(false)

let interval: ReturnType<typeof setInterval> | null = null
let requestInFlight = false

async function loadData() {
  if (requestInFlight) return

  requestInFlight = true
  if (!hasLoadedOnce.value) {
    loading.value = true
  }
  try {
    const data = await fetchRecentTrades(props.portfolio)
    trades.value = data.trades
    hasLoadedOnce.value = true
  } finally {
    requestInFlight = false
    loading.value = false
  }
}

onMounted(() => {
  loadData()

  // Poll live trades from API to keep widget in sync.
  interval = setInterval(() => {
    loadData()
  }, 5000)
})

watch(() => props.portfolio, () => {
  loadData()
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="trades-panel">
    <table class="trades-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Pair</th>
          <th>Type</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading" v-for="idx in 8" :key="`trade-skeleton-${idx}`" class="skeleton-row" aria-hidden="true">
          <td v-for="col in 4" :key="`trade-skeleton-cell-${idx}-${col}`">
            <span class="skeleton-cell"></span>
          </td>
        </tr>

        <tr v-else v-for="(trade, idx) in trades.slice(0, 10)" :key="idx">
          <td>{{ trade.time }}</td>
          <td>{{ trade.pair }}</td>
          <td :class="trade.type === 'Buy' ? 'buy' : 'sell'">{{ trade.type }}</td>
          <td>{{ trade.price }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.trades-panel {
  background: var(--bg-card);
  border-radius: 0.75rem;
  overflow-y: auto;
  border: 1px solid var(--border-card);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.trades-table th {
  background: var(--bg-table-header);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-table-header);
  border-bottom: 1px solid var(--border-card);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trades-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-table-row);
  color: var(--text-table-cell);
}

.trades-table tbody tr:hover {
  background: var(--bg-table-row-hover);
}

.buy {
  color: #26a69a;
  font-weight: 600;
}

.sell {
  color: #ef5350;
  font-weight: 600;
}

.skeleton-row td {
  padding: 0.875rem 1rem;
}

.skeleton-cell {
  display: block;
  width: 100%;
  height: 0.625rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.08) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s linear infinite;
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

