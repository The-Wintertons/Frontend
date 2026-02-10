<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

interface Trade {
  id: number
  date: string
  time: string
  pair: string
  type: 'Buy' | 'Sell'
  price: number
  quantity: number
  total: number
  status: 'Filled' | 'Partial' | 'Cancelled'
}

const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT', 'DOGE/USDT', 'ADA/USDT']
const statuses: Trade['status'][] = ['Filled', 'Filled', 'Filled', 'Filled', 'Partial', 'Cancelled']
const basePrices: Record<string, number> = {
  'BTC/USDT': 42100,
  'ETH/USDT': 2320,
  'SOL/USDT': 112,
  'AVAX/USDT': 38,
  'DOGE/USDT': 0.089,
  'ADA/USDT': 0.62,
}

function generateTrades(): Trade[] {
  const trades: Trade[] = []
  const now = new Date()

  for (let i = 0; i < 50; i++) {
    const tradeTime = new Date(now.getTime() - i * (60000 * (3 + Math.random() * 30)))
    const pair = pairs[Math.floor(Math.random() * pairs.length)]
    const base = basePrices[pair]
    const price = base * (1 + (Math.random() - 0.5) * 0.01)
    const type: 'Buy' | 'Sell' = Math.random() > 0.45 ? 'Buy' : 'Sell'
    const quantity = pair.startsWith('BTC')
      ? +(Math.random() * 0.5 + 0.01).toFixed(4)
      : pair.startsWith('DOGE') || pair.startsWith('ADA')
        ? +(Math.random() * 5000 + 100).toFixed(2)
        : +(Math.random() * 10 + 0.1).toFixed(4)

    trades.push({
      id: 1000 + i,
      date: tradeTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: tradeTime.toLocaleTimeString('en-US', { hour12: false }),
      pair,
      type,
      price: Math.round(price * 100) / 100,
      quantity,
      total: Math.round(price * quantity * 100) / 100,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    })
  }
  return trades
}

const trades = generateTrades()

function formatPrice(val: number): string {
  return val >= 1
    ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${val.toFixed(4)}`
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
                <tr v-for="trade in trades" :key="trade.id">
                  <td class="mono">{{ trade.id }}</td>
                  <td>{{ trade.date }}</td>
                  <td class="mono">{{ trade.time }}</td>
                  <td class="pair">{{ trade.pair }}</td>
                  <td :class="trade.type === 'Buy' ? 'buy' : 'sell'">{{ trade.type }}</td>
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
  backdrop-filter: blur(4px);
}

.modal-container {
  background: #fff;
  border-radius: 16px;
  width: 90vw;
  max-width: 1100px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #1a1a1a;
}

.modal-body {
  overflow-y: auto;
  padding: 0;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.trades-table th {
  position: sticky;
  top: 0;
  background: #fafafa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 1px solid #eee;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trades-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  color: #333;
}

.trades-table tbody tr:hover {
  background: #fafafa;
}

.mono {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
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
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
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
</style>
