<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import TopBar from './components/TopBar.vue'
import CandlestickChart from './components/CandlestickChart.vue'
import RecentTrades from './components/RecentTrades.vue'
import StatsBadges from './components/StatsBadges.vue'
import UptimeWidget from './components/UptimeWidget.vue'
import TradesModal from './components/TradesModal.vue'

const showTradesModal = ref(false)

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => clearInterval(timer))

const target = new Date('2026-03-31T00:00:00').getTime()

const countdown = computed(() => {
  const diff = Math.max(0, target - now.value)
  const days = Math.floor(diff / 86400000)
  const hrs = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return { days, hrs, mins, secs }
})

function handleNavigate(page: string) {
  if (page === 'trades') {
    showTradesModal.value = true
  }
}
</script>

<template>
  <div class="app-layout">
    <Sidebar @navigate="handleNavigate" />
    <TradesModal :visible="showTradesModal" @close="showTradesModal = false" />
    <main class="main-content">
      <TopBar />
      <div class="page-content">
        <h1 class="page-title">Dashboard</h1>

        <div class="dashboard-grid">
          <div class="chart-area">
            <CandlestickChart />
          </div>
          <div class="right-panel">
            <RecentTrades />
            <UptimeWidget />
          </div>
        </div>

        <StatsBadges />

        <div class="countdown-bar">
          <span class="countdown-label">Launch in</span>
          <div class="countdown-segments">
            <div class="countdown-segment">
              <span class="countdown-value">{{ countdown.days }}</span>
              <span class="countdown-unit">days</span>
            </div>
            <div class="countdown-segment">
              <span class="countdown-value">{{ countdown.hrs }}</span>
              <span class="countdown-unit">hrs</span>
            </div>
            <div class="countdown-segment">
              <span class="countdown-value">{{ countdown.mins }}</span>
              <span class="countdown-unit">min</span>
            </div>
            <div class="countdown-segment">
              <span class="countdown-value">{{ countdown.secs }}</span>
              <span class="countdown-unit">sec</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f5f7;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.page-content {
  padding: 0 28px 28px;
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 20px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  margin-bottom: 20px;
  align-items: stretch;
}

.chart-area {
  min-width: 0;
  min-height: 480px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.countdown-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding: 12px 20px;
  background: #1a1a2e;
  border-radius: 12px;
}

.countdown-label {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.countdown-segments {
  display: flex;
  gap: 12px;
}

.countdown-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
}

.countdown-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.countdown-unit {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
</style>
