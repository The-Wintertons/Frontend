<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import TopBar from './components/TopBar.vue'
import CandlestickChart from './components/CandlestickChart.vue'
import RecentTrades from './components/RecentTrades.vue'
import StatsBadges from './components/StatsBadges.vue'
import UptimeWidget from './components/UptimeWidget.vue'
import TradesModal from './components/TradesModal.vue'

const showTradesModal = ref(false)

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
</style>
