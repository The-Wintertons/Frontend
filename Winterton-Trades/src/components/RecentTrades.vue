<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Trade {
  time: string
  pair: string
  type: 'Buy' | 'Sell'
  price: string
}

const trades = ref<Trade[]>([
  { time: '10:32:14', pair: 'BTC/USDT', type: 'Buy', price: '$42,183.22' },
  { time: '10:31:58', pair: 'ETH/USDT', type: 'Sell', price: '$2,318.77' },
  { time: '10:30:45', pair: 'SOL/USDT', type: 'Buy', price: '$112.04' },
  { time: '10:29:03', pair: 'BTC/USDT', type: 'Sell', price: '$42,101.10' },
  { time: '10:28:41', pair: 'AVAX/USDT', type: 'Buy', price: '$38.15' },
  { time: '10:28:02', pair: 'ETH/USDT', type: 'Buy', price: '$2,322.10' },
])

const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT', 'DOGE/USDT', 'ADA/USDT']
const basePrices: Record<string, number> = {
  'BTC/USDT': 42100,
  'ETH/USDT': 2320,
  'SOL/USDT': 112,
  'AVAX/USDT': 38,
  'DOGE/USDT': 0.089,
  'ADA/USDT': 0.62,
}

let interval: ReturnType<typeof setInterval> | null = null

function generateTrade(): Trade {
  const pair = pairs[Math.floor(Math.random() * pairs.length)]
  const type: 'Buy' | 'Sell' = Math.random() > 0.5 ? 'Buy' : 'Sell'
  const base = basePrices[pair]
  const variation = base * (Math.random() * 0.004 - 0.002)
  const price = base + variation
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour12: false })

  return {
    time,
    pair,
    type,
    price: price >= 1
      ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${price.toFixed(4)}`,
  }
}

onMounted(() => {
  // Simulate real-time trades every 3-8 seconds
  interval = setInterval(() => {
    trades.value.unshift(generateTrade())
    if (trades.value.length > 20) trades.value.pop()
  }, 3000 + Math.random() * 5000)
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
        <tr v-for="(trade, idx) in trades.slice(0, 6)" :key="idx">
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
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.trades-table th {
  background: #fafafa;
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 1px solid #eee;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trades-table td {
  padding: 9px 14px;
  border-bottom: 1px solid #f5f5f5;
  color: #333;
}

.trades-table tbody tr:hover {
  background: #fafafa;
}

.buy {
  color: #26a69a;
  font-weight: 600;
}

.sell {
  color: #ef5350;
  font-weight: 600;
}
</style>
