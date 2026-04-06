<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'enter'): void }>()

/** Whether the switch is in the ON position */
const isOn = ref(false)
/** Animating the iris in (expand) or out (shrink) */
const phase = ref<'idle' | 'expanding' | 'done' | 'collapsing'>('idle')

/** CSS custom-property values updated just before the animation runs */
const irisX = ref('50%')
const irisY = ref('50%')

const switchEl = ref<HTMLElement | null>(null)

/** Compute the switch centre as viewport percentages */
function getSwitchOrigin(): { x: string; y: string } {
  if (!switchEl.value) return { x: '50%', y: '50%' }
  const r = switchEl.value.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  return {
    x: `${(cx / window.innerWidth) * 100}%`,
    y: `${(cy / window.innerHeight) * 100}%`,
  }
}

function flip() {
  if (phase.value !== 'idle') return
  isOn.value = !isOn.value

  if (isOn.value) {
    // Iris wipe in → black covers the screen
    const origin = getSwitchOrigin()
    irisX.value = origin.x
    irisY.value = origin.y
    phase.value = 'expanding'
  }
}

/** Called when the overlay CSS transition ends */
function onOverlayTransitionEnd() {
  if (phase.value === 'expanding') {
    phase.value = 'done'
    emit('enter')
  } else if (phase.value === 'collapsing') {
    phase.value = 'idle'
  }
}

/** Called by the parent (via template ref / expose) when the scene exits */
function collapse() {
  if (phase.value !== 'done') return
  isOn.value = false
  const origin = getSwitchOrigin()
  irisX.value = origin.x
  irisY.value = origin.y
  phase.value = 'collapsing'
}

defineExpose({ collapse })
</script>

<template>
  <!-- The switch itself -->
  <div class="iris-switch-wrap" ref="switchEl">
    <span class="iris-hint">Home</span>
    <button
      class="iris-switch"
      :class="{ 'iris-switch--on': isOn, 'iris-switch--disabled': phase !== 'idle' && phase !== 'done' }"
      :aria-pressed="isOn"
      @click="flip"
      title="Home"
    >
      <span class="iris-track">
        <span class="iris-thumb" />
      </span>
    </button>
  </div>

  <!-- Full-screen iris overlay (Teleported to avoid stacking context issues) -->
  <Teleport to="body">
    <div
      class="iris-overlay"
      :class="{
        'iris-overlay--expanding': phase === 'expanding',
        'iris-overlay--expanded':  phase === 'done',
        'iris-overlay--collapsing': phase === 'collapsing',
      }"
      :style="`--ix: ${irisX}; --iy: ${irisY};`"
      @transitionend.self="onOverlayTransitionEnd"
    />
  </Teleport>
</template>

<style scoped>
/* ── Switch wrapper ──────────────────────────────────────────────────── */
.iris-switch-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  user-select: none;
}

.iris-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: #888;
  width: 1.375rem;
  text-align: right;
}

.iris-hint {
  font-size: 0.75rem;
  color: #aaa;
  white-space: nowrap;
}

/* ── The toggle switch ───────────────────────────────────────────────── */
.iris-switch {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.iris-switch--disabled {
  pointer-events: none;
  opacity: 0.6;
}

.iris-track {
  position: relative;
  display: inline-block;
  width: 2.75rem;
  height: 1.5rem;
  background: var(--bg-track);
  border-radius: 0.75rem;
  transition: background 0.3s;
  box-shadow: inset 0 1px 0.1875rem rgba(0,0,0,0.15);
}

.iris-switch--on .iris-track {
  background: #1a1a2e;
}

.iris-thumb {
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 0.25rem rgba(0,0,0,0.25);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.iris-switch--on .iris-thumb {
  transform: translateX(1.25rem);
  background: #4fc3f7;
}
</style>

<!-- Global overlay styles (not scoped – Teleport renders outside component root) -->
<style>
.iris-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #050508;
  pointer-events: none;
  /* Start as a zero-radius circle at the switch origin */
  clip-path: circle(0% at var(--ix, 50%) var(--iy, 50%));
}

.iris-overlay--expanding {
  pointer-events: all;
  clip-path: circle(200vmax at var(--ix, 50%) var(--iy, 50%));
  transition: clip-path 0.9s cubic-bezier(0.7, 0, 0.3, 1);
}

.iris-overlay--expanded {
  pointer-events: all;
  clip-path: circle(200vmax at var(--ix, 50%) var(--iy, 50%));
}

.iris-overlay--collapsing {
  clip-path: circle(0% at var(--ix, 50%) var(--iy, 50%));
  transition: clip-path 0.8s cubic-bezier(0.7, 0, 0.3, 1);
  pointer-events: all;
}
</style>
