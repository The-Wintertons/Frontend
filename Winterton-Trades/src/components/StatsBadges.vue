<script setup lang="ts">
interface Stat {
  label: string
  value: string
}

const stats: Stat[] = [
  { label: 'Lifetime Returns', value: '10%' },
  { label: 'Solvency', value: '2%' },
  { label: 'Time Since Last Trade', value: '2d 12h 02m' },
]
</script>

<template>
  <div class="stats-row">
    <div v-for="stat in stats" :key="stat.label" class="stat-badge">
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
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  padding: 8px 20px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}
</style>
