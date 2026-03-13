<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import CandlestickChart from './components/CandlestickChart.vue'
import RecentTrades from './components/RecentTrades.vue'
import StatsBadges from './components/StatsBadges.vue'
import UptimeWidget from './components/UptimeWidget.vue'
import TradesModal from './components/TradesModal.vue'
import IrisSwitch from './components/IrisSwitch.vue'
import TradeTimeline from './components/TradeTimeline.vue'
import MarketIndices from './components/MarketIndices.vue'
import TopHeadlines from './components/TopHeadlines.vue'
import BlankScene from './TresJS/BlankScene.vue'
import PortfolioDropdown from './components/PortfolioDropdown.vue'
import { Clock } from 'lucide-vue-next'

type SyncedRange = {
  start: number
  end: number
}

const showTradesModal = ref(false)
const syncedRange = ref<SyncedRange | null>(null)
const selectedPortfolio = ref('Main Portfolio')

/** Whether the TresJS scene is mounted on top of the dashboard */
const showScene = ref(false)
const irisSwitchRef = ref<InstanceType<typeof IrisSwitch> | null>(null)

/** Iris wipe has finished expanding — now mount the scene */
function handleEnterScene() {
  showScene.value = true
}

/** Exit button pressed inside the scene — collapse iris then unmount */
function handleSceneExit() {
  showScene.value = false
  irisSwitchRef.value?.collapse()
}

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
    <TradesModal :visible="showTradesModal" :portfolio="selectedPortfolio" @close="showTradesModal = false" />

    <!-- TresJS scene mounts over everything once the iris is fully expanded -->
    <Teleport to="body">
      <BlankScene :visible="showScene" @exit="handleSceneExit" />
    </Teleport>

    <main class="main-content">
      <div class="page-content">
        <div class="page-title-row">
          <div class="title-with-dropdown">
            <h1 class="page-title">Dashboard</h1>
            <PortfolioDropdown v-model="selectedPortfolio" />
          </div>
          <IrisSwitch ref="irisSwitchRef" @enter="handleEnterScene" />
        </div>

        <div class="dashboard-grid">
          <div class="chart-area">
            <CandlestickChart :synced-range="syncedRange" :portfolio="selectedPortfolio" @range-ready="syncedRange = $event" />
            <TradeTimeline :synced-range="syncedRange" :portfolio="selectedPortfolio" />
          </div>
          <div class="right-panel">
            <RecentTrades :portfolio="selectedPortfolio" />
          </div>
        </div>

        <div class="bottom-widgets">
          <MarketIndices :portfolio="selectedPortfolio" />
          <TopHeadlines :portfolio="selectedPortfolio" />
          <div class="bottom-right-col">
            <UptimeWidget :portfolio="selectedPortfolio" />
            <StatsBadges :portfolio="selectedPortfolio" />
          </div>
        </div>

        <div class="launch-badge">
          <Clock class="clock-icon" :size="24" :stroke-width="2.5" />
          <div class="launch-badge-content">
            <span class="countdown-label">Launch in</span>
            <div class="countdown-segments">
              <div class="countdown-segment">
                <span class="countdown-value">{{ countdown.days }}</span>
                <span class="countdown-unit">d</span>
              </div>
              <div class="countdown-segment">
                <span class="countdown-value">{{ countdown.hrs }}</span>
                <span class="countdown-unit">h</span>
              </div>
              <div class="countdown-segment">
                <span class="countdown-value">{{ countdown.mins }}</span>
                <span class="countdown-unit">m</span>
              </div>
              <div class="countdown-segment">
                <span class="countdown-value">{{ countdown.secs }}</span>
                <span class="countdown-unit">s</span>
              </div>
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
  min-height: var(--ui-compensated-vh, 100vh);
  background: var(--bg-page);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.page-content {
  padding: 20px 28px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.title-with-dropdown {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 20px;
  margin-bottom: 20px;
  flex: 1;
  align-items: stretch;
  min-height: 0;
}

.chart-area {
  min-width: 0;
  min-height: 480px;
  display: flex;
  flex-direction: column;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.bottom-widgets {
  display: grid;
  grid-template-columns: 320px 1fr 420px;
  gap: 20px;
  margin-bottom: 20px;
  align-items: stretch;
}

.bottom-right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .bottom-widgets {
    grid-template-columns: 1fr;
  }
}

.launch-badge {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 30px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: default;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 1000;
  white-space: nowrap;
}

.launch-badge:hover {
  gap: 12px;
}

.launch-badge .clock-icon {
  font-size: 24px;
  line-height: 1;
}

.launch-badge-content {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.launch-badge:hover .launch-badge-content {
  max-width: 400px;
  opacity: 1;
  padding-right: 8px;
}

.countdown-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.countdown-segments {
  display: flex;
  gap: 8px;
}

.countdown-segment {
  display: flex;
  align-items: baseline;
  gap: 2px;
  min-width: unset;
}

.countdown-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.countdown-unit {
  font-size: 11px;
  color: #666;
  text-transform: lowercase;
}
</style>
