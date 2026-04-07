<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  LayoutDashboard,
  List,
  Settings,
  Home,
  Moon,
  Sun,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'navigate', page: string): void
}>()

const navItems = [
  { icon: LayoutDashboard, name: 'dashboard' },
  { icon: List, name: 'trades' },
  { icon: Settings, name: 'settings' },
]

const isDark = ref(true)

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light') {
    isDark.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  }
  // dark is the default — no attribute needed
})

function toggleTheme() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-top">
      
        <Home :size="22" class="avatar-btn"/>
      
      <button
        v-for="item in navItems"
        :key="item.name"
        class="sidebar-btn"
        :class="{ active: item.name === 'dashboard' }"
        :title="item.name"
        @click="emit('navigate', item.name)"
      >
        <component :is="item.icon" :size="22" />
      </button>
    </div>
    <div class="sidebar-bottom">
      <button class="sidebar-btn" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
        <Sun v-if="isDark" :size="22" />
        <Moon v-else :size="22" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 3.75rem;
  height: 100vh;
  height: 100vh;
  background: #2d1b69;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.sidebar-top,
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-btn {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.sidebar-btn.active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.avatar-btn {
  margin-bottom: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
}
</style>
