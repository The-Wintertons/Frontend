<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { TradeRecord } from '../types/apiTypeDefinitions'
import { fetchTradeHistory } from '../api'

type SyncedRange = {
  start: number
  end: number
}

const props = defineProps<{
  syncedRange?: SyncedRange | null
  portfolio?: string
}>()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const events = ref<TradeRecord[]>([])
const isLoading = ref(true)
const hoveredKey = ref<string | null>(null)
const interactionRef = ref<HTMLElement | null>(null)
const viewStart = ref(0)
const viewEnd = ref(1)
const isPanning = ref(false)
const panStartX = ref(0)
const panRangeStart = ref(0)
const panRangeEnd = ref(1)

async function loadData() {
  isLoading.value = true
  try {
    const data = await fetchTradeHistory(150, 30 * 24 * 60 * 60 * 1000, props.portfolio)
    events.value = data.trades
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(() => props.portfolio, () => {
  loadData()
})

// Derive full time window
const fullRange = computed(() => {
  let min = Infinity
  let max = -Infinity
  if (events.value.length > 0) {
    const times = events.value.map(e => new Date(`${e.date} ${e.time}`).getTime())
    min = Math.min(...times)
    max = Math.max(...times)
  }
  
  if (props.syncedRange) {
    min = Math.min(min, props.syncedRange.start)
    max = Math.max(max, props.syncedRange.end)
  }
  
  if (min === Infinity) return { min: 0, max: 1 }

  const pad = (max - min) * 0.02 || 60000
  return { min: min - pad, max: max + pad }
})

const maxWindowMs = computed(() => fullRange.value.max - fullRange.value.min)
const minWindowMs = computed(() => Math.max(60_000, maxWindowMs.value / 500))

function setView(start: number, end: number): void {
  const full = fullRange.value
  const fullSpan = full.max - full.min
  if (fullSpan <= 0) {
    viewStart.value = full.min
    viewEnd.value = full.max
    return
  }

  let desiredSpan = end - start
  desiredSpan = Math.min(Math.max(desiredSpan, minWindowMs.value), fullSpan)

  let nextStart = start
  let nextEnd = nextStart + desiredSpan

  if (nextStart < full.min) {
    nextStart = full.min
    nextEnd = nextStart + desiredSpan
  }
  if (nextEnd > full.max) {
    nextEnd = full.max
    nextStart = nextEnd - desiredSpan
  }

  viewStart.value = nextStart
  viewEnd.value = nextEnd
}

function resetView(): void {
  setView(fullRange.value.min, fullRange.value.max)
}

function applySyncedRange(): boolean {
  if (!props.syncedRange) return false
  const { start, end } = props.syncedRange
  if (end <= start) return false
  setView(start, end)
  return true
}

watch(
  () => events.value,
  () => {
    if (applySyncedRange()) return

    const hasView = viewEnd.value > viewStart.value
    if (!hasView) {
      resetView()
      return
    }

    const span = viewEnd.value - viewStart.value
    if (span >= maxWindowMs.value) {
      resetView()
      return
    }

    setView(viewStart.value, viewStart.value + span)
  },
  { immediate: true },
)

watch(
  () => props.syncedRange,
  () => {
    if (events.value.length === 0) return
    applySyncedRange()
  },
)

type TimelinePoint = {
  trade: TradeRecord
  ts: number
  key: string
}

const visibleEvents = computed<TimelinePoint[]>(() => {
  const start = viewStart.value
  const end = viewEnd.value
  return events.value
    .map((trade, idx) => ({
      trade,
      ts: new Date(`${trade.date} ${trade.time}`).getTime(),
      key: `${trade.id}-${trade.time}-${idx}`,
    }))
    .filter(point => point.ts >= start && point.ts <= end)
})

// Max total for scaling bar heights
const maxTotal = computed(() => {
  if (events.value.length === 0) return 1
  return Math.max(...events.value.map(e => e.total))
})

/** 0–100% x position */
function xPct(timestamp: number): number {
  const span = viewEnd.value - viewStart.value
  if (span <= 0) return 50
  const raw = ((timestamp - viewStart.value) / span) * 100
  const edgePadding = 1
  return Math.min(100 - edgePadding, Math.max(edgePadding, raw))
}

/** Bar height as % of the half-track (buy goes up, sell goes down) */
function barHeight(trade: TradeRecord): number {
  const pct = (trade.total / maxTotal.value) * 100
  return Math.max(pct, 8) // minimum 8% so tiny trades are still visible
}

// Pair colours
const pairColours: Record<string, string> = {
  'BTC/USDT': '#f7931a',
  'ETH/USDT': '#627eea',
  'SOL/USDT': '#00ffa3',
  'AVAX/USDT': '#e84142',
  'DOGE/USDT': '#c2a633',
  'ADA/USDT': '#0033ad',
}

function barColor(pair: string): string {
  return pairColours[pair] ?? '#888'
}

function formatPrice(val: number): string {
  return val >= 1
    ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${val.toFixed(4)}`
}

// Time axis ticks
const axisTicks = computed(() => {
  const min = viewStart.value
  const max = viewEnd.value
  const span = max - min
  const count = 6
  const ticks: { pct: number; label: string }[] = []
  
  const spanDays = span / (24 * 60 * 60 * 1000)
  
  for (let i = 0; i <= count; i++) {
    const t = min + span * (i / count)
    const d = new Date(t)
    
    let label = ''
    if (spanDays >= 2) {
      // Span is > 2 days, just show the date (e.g. 'Mar 12')
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (spanDays >= 0.5) {
      // Span is between 12h and 48h, show date and time (e.g. 'Mar 12 14:00')
      label = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`
    } else {
      // Span is < 12 hours, just show time (e.g. '14:00')
      label = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    }

    ticks.push({
      pct: (i / count) * 100,
      label,
    })
  }
  return ticks
})

function onWheelZoom(event: WheelEvent): void {
  if (!interactionRef.value) return

  const rect = interactionRef.value.getBoundingClientRect()
  if (rect.width <= 0) return

  const pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const start = viewStart.value
  const end = viewEnd.value
  const currentSpan = end - start
  const fullSpan = maxWindowMs.value
  if (currentSpan <= 0 || fullSpan <= 0) return

  const zoomFactor = Math.exp(event.deltaY * 0.0015)
  const nextSpan = Math.min(fullSpan, Math.max(minWindowMs.value, currentSpan * zoomFactor))
  const anchor = start + currentSpan * pointerX
  const nextStart = anchor - nextSpan * pointerX
  const nextEnd = nextStart + nextSpan
  setView(nextStart, nextEnd)
}

function onPanStart(event: PointerEvent): void {
  if (event.button !== 0) return
  isPanning.value = true
  panStartX.value = event.clientX
  panRangeStart.value = viewStart.value
  panRangeEnd.value = viewEnd.value
  interactionRef.value?.setPointerCapture(event.pointerId)
}

function onPanMove(event: PointerEvent): void {
  if (!isPanning.value || !interactionRef.value) return

  const width = interactionRef.value.clientWidth
  if (width <= 0) return

  const dx = event.clientX - panStartX.value
  const span = panRangeEnd.value - panRangeStart.value
  const deltaMs = (dx / width) * span
  setView(panRangeStart.value - deltaMs, panRangeEnd.value - deltaMs)
}

function onPanEnd(event: PointerEvent): void {
  if (!isPanning.value) return
  isPanning.value = false
  if (interactionRef.value?.hasPointerCapture(event.pointerId)) {
    interactionRef.value.releasePointerCapture(event.pointerId)
  }
}

// Legend
const legendPairs = computed(() => {
  const seen = new Set<string>()
  const out: { pair: string; color: string }[] = []
  for (const e of events.value) {
    if (!seen.has(e.pair)) {
      seen.add(e.pair)
      out.push({ pair: e.pair, color: barColor(e.pair) })
    }
  }
  return out.sort((a, b) => a.pair.localeCompare(b.pair))
})

// Auto-refresh
let refreshTimer: ReturnType<typeof setInterval>
onMounted(() => {
  refreshTimer = setInterval(async () => {
    const data = await fetchTradeHistory()
    events.value = data.trades
  }, 30_000)
})
onUnmounted(() => clearInterval(refreshTimer))
</script>

<template>
  <div class="timeline-panel">
    <!-- Header -->
    <div class="timeline-header">
      <h3 class="timeline-title">Trade Timeline</h3>
      <div class="timeline-legend">
        <span v-for="lp in legendPairs" :key="lp.pair" class="legend-item">
          <span class="legend-swatch" :style="{ background: lp.color }" />
          {{ lp.pair }}
        </span>
        <span class="legend-divider" />
        <span class="legend-item">
          <span class="legend-swatch legend-buy" /> Buy
        </span>
        <span class="legend-item">
          <span class="legend-swatch legend-sell" /> Sell
        </span>
      </div>
    </div>

    <div
      ref="interactionRef"
      class="timeline-body"
      :class="{ 'is-panning': isPanning, 'is-loading': isLoading }"
      @wheel.prevent="onWheelZoom"
      @pointerdown="onPanStart"
      @pointermove="onPanMove"
      @pointerup="onPanEnd"
      @pointercancel="onPanEnd"
      @dblclick="resetView"
    >
      <div v-if="isLoading" class="timeline-skeleton" aria-hidden="true">
        <div class="skeleton-header-line"></div>
        <div class="skeleton-chart-block"></div>
        <div class="skeleton-axis-row">
          <span v-for="idx in 6" :key="`axis-${idx}`" class="skeleton-axis-tick"></span>
        </div>
      </div>

      <template v-else>
      <!-- Bar chart area -->
      <div class="timeline-chart">
        <!-- Buy half (bars grow upward) -->
        <div class="chart-half chart-buy">
          <div class="half-label">BUY</div>
          <div
            v-for="point in visibleEvents"
            :key="'b-' + point.key"
            class="bar-slot"
            :style="{ left: xPct(point.ts) + '%' }"
            @mouseenter="hoveredKey = point.key"
            @mouseleave="hoveredKey = null"
          >
            <div
              v-if="point.trade.type === 'Buy'"
              class="bar bar-buy"
              :style="{
                height: barHeight(point.trade) + '%',
                background: barColor(point.trade.pair),
              }"
            />

            <!-- Tooltip (buy side) -->
            <Transition name="tip">
              <div v-if="hoveredKey === point.key && point.trade.type === 'Buy'" class="bar-tooltip bar-tooltip--above">
                <div class="tip-pair">{{ point.trade.pair }}</div>
                <div class="tip-type buy-text">Buy</div>
                <div class="tip-price">{{ formatPrice(point.trade.price) }}</div>
                <div class="tip-detail">Qty: {{ point.trade.quantity }}</div>
                <div class="tip-detail">Total: {{ formatPrice(point.trade.total) }}</div>
                <div class="tip-time">{{ point.trade.date }} {{ point.trade.time }}</div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Centre line -->
        <div class="chart-centre" />

        <!-- Sell half (bars grow downward) -->
        <div class="chart-half chart-sell">
          <div class="half-label">SELL</div>
          <div
            v-for="point in visibleEvents"
            :key="'s-' + point.key"
            class="bar-slot"
            :style="{ left: xPct(point.ts) + '%' }"
            @mouseenter="hoveredKey = point.key"
            @mouseleave="hoveredKey = null"
          >
            <div
              v-if="point.trade.type === 'Sell'"
              class="bar bar-sell"
              :style="{
                height: barHeight(point.trade) + '%',
                background: barColor(point.trade.pair),
              }"
            />

            <!-- Tooltip (sell side) -->
            <Transition name="tip">
              <div v-if="hoveredKey === point.key && point.trade.type === 'Sell'" class="bar-tooltip bar-tooltip--below">
                <div class="tip-pair">{{ point.trade.pair }}</div>
                <div class="tip-type sell-text">Sell</div>
                <div class="tip-price">{{ formatPrice(point.trade.price) }}</div>
                <div class="tip-detail">Qty: {{ point.trade.quantity }}</div>
                <div class="tip-detail">Total: {{ formatPrice(point.trade.total) }}</div>
                <div class="tip-time">{{ point.trade.date }} {{ point.trade.time }}</div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- X-axis ticks -->
      <div class="time-axis">
        <span
          v-for="(tick, idx) in axisTicks"
          :key="tick.pct"
          class="axis-tick"
          :class="{
            'axis-tick--start': idx === 0,
            'axis-tick--end': idx === axisTicks.length - 1,
          }"
          :style="{ left: tick.pct + '%' }"
        >
          {{ tick.label }}
        </span>
      </div>
      </template>

      <div class="timeline-hint">{{ isLoading ? 'Loading trade history...' : 'Scroll to zoom • Drag to pan • Double-click to reset' }}</div>
    </div>
  </div>
</template>

<style scoped>
.timeline-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 0.75rem;
  padding: 1.125rem 1.5rem 0.75rem;
  margin-top: 1rem;
  flex: 0.85;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ── Header ──────────────────────────────────────────────────────────── */
.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.timeline-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.timeline-legend {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.legend-swatch {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 0.125rem;
}

.legend-buy { background: #26a69a; }
.legend-sell { background: #ef5350; }

.legend-divider {
  width: 1px;
  height: 0.75rem;
  background: var(--legend-divider);
}

.timeline-body {
  width: 100%;
  max-width: calc(100% - 0.75rem);
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.timeline-body.is-loading {
  cursor: default;
}

.timeline-body.is-panning {
  cursor: grabbing;
}

.timeline-skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.skeleton-header-line {
  width: 40%;
  height: 0.625rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.08) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s linear infinite;
}

.skeleton-chart-block {
  width: 100%;
  height: 8.125rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.08) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s linear infinite;
}

.skeleton-axis-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.skeleton-axis-tick {
  flex: 1;
  height: 0.5rem;
  border-radius: 0.375rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.08) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s linear infinite;
}

/* ── Chart area ──────────────────────────────────────────────────────── */
.timeline-chart {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.chart-half {
  position: relative;
  height: 4rem;
}

.half-label {
  position: absolute;
  left: -0.125rem;
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text-label-muted);
  pointer-events: none;
  z-index: 2;
}

.chart-buy .half-label { bottom: 0.125rem; }
.chart-sell .half-label { top: 0.125rem; }

.chart-centre {
  height: 1px;
  background: var(--chart-centre);
  flex-shrink: 0;
}

/* ── Bars ────────────────────────────────────────────────────────────── */
.bar-slot {
  position: absolute;
  width: 0.375rem;
  transform: translateX(-50%);
  cursor: pointer;
}

.chart-buy .bar-slot {
  bottom: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.chart-sell .bar-slot {
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.bar {
  width: 100%;
  border-radius: 0.125rem;
  transition: opacity 0.15s, filter 0.15s;
  min-height: 0.1875rem;
}

.bar-buy {
  opacity: 0.85;
}

.bar-sell {
  opacity: 0.85;
}

.bar-slot:hover .bar {
  opacity: 1;
  filter: brightness(1.3);
}

/* ── Tooltips ────────────────────────────────────────────────────────── */
.bar-tooltip {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-tooltip);
  border: 1px solid var(--border-tooltip);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;
  box-shadow: 0 0.25rem 1.25rem var(--tooltip-shadow);
}

.bar-tooltip--above {
  bottom: calc(100% + 0.5rem);
}

.bar-tooltip--below {
  top: calc(100% + 0.5rem);
}

.tip-pair {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tooltip-primary);
  line-height: 1.5;
}

.tip-type { font-size: 0.6875rem; font-weight: 600; line-height: 1.5; }
.buy-text { color: #26a69a; }
.sell-text { color: #ef5350; }

.tip-price {
  font-size: 0.75rem;
  color: var(--text-table-cell);
  line-height: 1.5;
}

.tip-detail {
  font-size: 0.6875rem;
  color: var(--text-tooltip-detail);
  line-height: 1.5;
}

.tip-time {
  font-size: 0.625rem;
  color: var(--text-tooltip-time);
  line-height: 1.5;
}

.tip-enter-active, .tip-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.tip-enter-from, .tip-leave-to {
  opacity: 0;
}

/* ── X-axis ──────────────────────────────────────────────────────────── */
.time-axis {
  position: relative;
  height: 1.25rem;
  margin-top: 0.375rem;
  width: 100%;
}

.axis-tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.625rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.axis-tick--start {
  transform: none;
}

.axis-tick--end {
  transform: translateX(-100%);
}

.timeline-hint {
  margin-top: 0.375rem;
  font-size: 0.625rem;
  color: var(--text-muted);
  text-align: right;
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
