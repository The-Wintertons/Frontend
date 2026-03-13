<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const portfolios = ['Main Portfolio', 'Crypto', 'Stocks']

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="portfolio-dropdown" :class="{ 'is-loading': loading }">
    <div v-if="loading" class="dropdown-skeleton" aria-hidden="true"></div>

    <select v-else :value="modelValue" @change="handleChange" class="dropdown-select">
      <option v-for="port in portfolios" :key="port" :value="port">
        {{ port }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.portfolio-dropdown {
  display: flex;
  align-items: center;
  position: relative;
}

.portfolio-dropdown::after {
  content: '';
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 0.3125rem solid transparent;
  border-right: 0.3125rem solid transparent;
  border-top: 0.3125rem solid var(--text-muted);
  pointer-events: none;
}

.portfolio-dropdown.is-loading::after {
  display: none;
}

.dropdown-select {
  padding: 0.5rem 2.25rem 0.5rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 0.5rem;
  background-color: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-card);
  appearance: none;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.15);
}

.dropdown-select:hover {
  background-color: var(--bg-card-hover);
  border-color: var(--text-secondary);
}

.dropdown-select:focus {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 0.125rem rgba(100, 100, 100, 0.2);
}

.dropdown-skeleton {
  width: 13.125rem;
  height: 2.5625rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-card);
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