<script setup lang="ts">
import { Bell, Settings, User } from 'lucide-vue-next'
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="icon-btn" title="Profile">
        <User :size="20" />
      </button>
    </div>
    <div class="topbar-right">
      <button class="icon-btn" title="Notifications">
        <Bell :size="20" />
      </button>
      <button class="icon-btn" title="Settings">
        <Settings :size="20" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f0f0f0;
  color: #333;
}
</style>
