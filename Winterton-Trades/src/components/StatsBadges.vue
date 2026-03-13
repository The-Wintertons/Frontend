<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { fetchStats } from '../api'

const props = defineProps<{ portfolio?: string }>()

// Internal display shape used by the template
interface Stat {
  label: string
  value: string
}

const loading = ref(true)
const stats = ref<Stat[]>([])

async function loadData() {
  loading.value = true
  try {
    const data = await fetchStats(props.portfolio)
    stats.value = [
      { label: 'Lifetime Returns', value: data.lifetimeReturns },
      { label: 'Solvency', value: data.solvency },
      { label: 'Time Since Last Trade', value: data.timeSinceLastTrade },
    ]
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(() => props.portfolio, () => {
  loadData()
})
</script>

<template>
  <div class="stats-row">
    <div v-if="loading" v-for="idx in 3" :key="`stat-skeleton-${idx}`" class="stat-badge stat-badge-skeleton" aria-hidden="true">
      <span class="skeleton-line"></span>
    </div>
    <div v-else v-for="stat in stats" :key="stat.label" class="stat-badge">
      {{ stat.label }}: {{ stat.value }}
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-badge {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 24px;
  padding: 8px 20px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.stat-badge-skeleton {
  min-width: 180px;
  display: inline-flex;
  align-items: center;
}

.skeleton-line {
  display: block;
  width: 100%;
  height: 10px;
  border-radius: 8px;
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
