<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { TradeRecord } from '../types/apiTypeDefinitions'
import { fetchTradeHistory } from '../selectedApi'

const props = defineProps<{ visible: boolean; portfolio?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const isLoading = ref(true)
const hasLoadedThisOpen = ref(false)
const trades = ref<TradeRecord[]>([])
let refreshInterval: ReturnType<typeof setInterval> | null = null
let requestInFlight = false

async function loadData() {
  if (requestInFlight) return

  requestInFlight = true
  if (!hasLoadedThisOpen.value) {
    isLoading.value = true
  }
  try {
    const data = await fetchTradeHistory(50, 30 * 24 * 60 * 60 * 1000, props.portfolio)
    trades.value = data.trades
    hasLoadedThisOpen.value = true
  } finally {
    requestInFlight = false
    isLoading.value = false
  }
}

function startAutoRefresh() {
  if (refreshInterval) return
  refreshInterval = setInterval(() => {
    loadData()
  }, 5000)
}

function stopAutoRefresh() {
  if (!refreshInterval) return
  clearInterval(refreshInterval)
  refreshInterval = null
}

onMounted(() => {
  if (props.visible) {
    loadData()
    startAutoRefresh()
  }
})

watch(() => props.portfolio, () => {
  if (props.visible) {
    loadData()
  }
})

watch(() => props.visible, (visible) => {
  if (visible) {
    hasLoadedThisOpen.value = false
    loadData()
    startAutoRefresh()
    return
  }

  stopAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

function formatPrice(val: number): string {
  return val >= 1
    ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${val.toFixed(4)}`
}

function isNegativeTrade(trade: TradeRecord): boolean {
  return trade.quantity < 0 || trade.total < 0
}

function displayTradeType(trade: TradeRecord): 'Buy' | 'Sell' | 'Long' | 'Short' {
  if (!isNegativeTrade(trade)) {
    return trade.type
  }
  return trade.type === 'Buy' ? 'Short' : 'Long'
}

function tradeTypeClass(trade: TradeRecord): 'buy' | 'sell' {
  const displayType = displayTradeType(trade)
  return displayType === 'Buy' || displayType === 'Long' ? 'buy' : 'sell'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-container">
          <div class="modal-header">
            <h2>Trade History</h2>
            <button class="close-btn" @click="emit('close')">
              <X :size="20" />
            </button>
          </div>

          <div class="modal-body">
            <table class="trades-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Pair</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading && !hasLoadedThisOpen" v-for="idx in 8" :key="`skeleton-row-${idx}`" class="skeleton-row">
                  <td v-for="col in 9" :key="`skeleton-cell-${idx}-${col}`">
                    <span class="skeleton-cell"></span>
                  </td>
                </tr>

                <tr v-for="trade in trades" :key="trade.id">
                  <td class="mono">{{ trade.id }}</td>
                  <td>{{ trade.date }}</td>
                  <td class="mono">{{ trade.time }}</td>
                  <td class="pair">{{ trade.pair }}</td>
                  <td :class="tradeTypeClass(trade)">{{ displayTradeType(trade) }}</td>
                  <td class="mono">{{ formatPrice(trade.price) }}</td>
                  <td class="mono">{{ trade.quantity }}</td>
                  <td class="mono">{{ formatPrice(trade.total) }}</td>
                  <td>
                    <span class="status-badge" :class="trade.status.toLowerCase()">
                      {{ trade.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(0.25rem);
}

.modal-container {
  background: var(--bg-modal);
  border-radius: 1rem;
  width: 90vw;
  max-width: 68.75rem;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1.5rem 5rem rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-modal);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--border-modal);
  background: var(--bg-modal-header);
  border-radius: 1rem 1rem 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-modal-heading);
}

.close-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: none;
  background: var(--bg-close-btn);
  color: var(--text-close-btn);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-close-btn-hover);
  color: var(--text-primary);
}

.modal-body {
  overflow-y: auto;
  padding: 0;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.trades-table th {
  position: sticky;
  top: 0;
  background: var(--bg-table-header);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-table-header);
  border-bottom: 1px solid var(--border-modal);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trades-table td {
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--border-table-row);
  color: var(--text-table-cell);
}

.trades-table tbody tr:hover {
  background: var(--bg-table-row-hover);
}

.mono {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.75rem;
}

.pair {
  font-weight: 600;
}

.buy {
  color: #26a69a;
  font-weight: 600;
}

.sell {
  color: #ef5350;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-badge.filled {
  background: rgba(38, 166, 154, 0.1);
  color: #26a69a;
}

.status-badge.partial {
  background: rgba(255, 193, 7, 0.12);
  color: #f59e0b;
}

.status-badge.cancelled {
  background: rgba(239, 83, 80, 0.1);
  color: #ef5350;
}

.skeleton-row td {
  padding: 0.625rem 1rem;
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

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
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
