<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  LayoutDashboard,
  List,
  User,
  Moon,
  Sun,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'navigate', page: string): void
}>()

const navItems = [
  { icon: LayoutDashboard, name: 'dashboard' },
  { icon: List, name: 'trades' },
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
      <button class="sidebar-btn avatar-btn" title="Profile">
        <User :size="22" />
      </button>
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
  width: 60px;
  min-height: 100vh;
  min-height: var(--ui-compensated-vh, 100vh);
  background: #2d1b69;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.sidebar-top,
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sidebar-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
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
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.08);
}
</style>
