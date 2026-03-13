<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { TopHeadline } from '../types/apiTypeDefinitions'
import { fetchTopHeadlines } from '../api'

const props = defineProps<{ portfolio?: string }>()

const headlines = ref<TopHeadline[]>([])
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const data = await fetchTopHeadlines()
    // Take top 4 for display
    headlines.value = data.headlines.slice(0, 4)
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

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 60) {
    return `${diffMins}m ago`
  }
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="top-headlines">
    <div class="headlines-header">
      <span class="headlines-title">Top Financial Headlines</span>
    </div>

    <div v-if="loading" class="headlines-list" aria-hidden="true">
      <div v-for="idx in 4" :key="`headline-skeleton-${idx}`" class="headline-item headline-item-skeleton">
        <span class="skeleton-line title"></span>
        <span class="skeleton-line title short"></span>
        <span class="skeleton-line meta"></span>
      </div>
    </div>
    
    <div v-else class="headlines-list">
      <a v-for="item in headlines" :key="item.uuid" :href="item.link" target="_blank" rel="noopener noreferrer" class="headline-item">
        <div class="headline-title">{{ item.title }}</div>
        <div class="headline-meta">
          <span class="publisher">{{ item.publisher }}</span>
          <span class="dot">•</span>
          <span class="time">{{ formatTime(item.providerPublishTime) }}</span>
        </div>
      </a>
      <div v-if="headlines.length === 0" class="empty-state">
        No headlines available right now.
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-headlines {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 14px 16px;
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.headlines-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.headlines-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.headlines-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
}

.headline-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease;
}

.headline-item:hover {
  background: var(--bg-card-hover);
}

.headline-item-skeleton {
  pointer-events: none;
}

.headline-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.headline-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.publisher {
  font-weight: 500;
}

.dot {
  font-size: 10px;
  opacity: 0.5;
}

.loading-state, .empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 13px;
  color: var(--text-muted);
}

.skeleton-line {
  display: block;
  height: 8px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.08) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s linear infinite;
}

.skeleton-line.title {
  width: 92%;
}

.skeleton-line.title.short {
  width: 68%;
}

.skeleton-line.meta {
  margin-top: 2px;
  width: 45%;
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
