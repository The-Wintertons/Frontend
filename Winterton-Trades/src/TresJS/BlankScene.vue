<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'exit'): void }>()

/** Subtle rotation for the ambient grid mesh */
const rotation = ref<[number, number, number]>([0, 0, 0])
let rafId: number | null = null

function animate() {
  rotation.value = [rotation.value[0], rotation.value[1] + 0.001, rotation.value[2]]
  rafId = requestAnimationFrame(animate)
}

/**
 * Pause the loop when hidden (WebGL context + geometry stay warm on GPU;
 * we just skip submitting new draw calls each frame).
 */
watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      if (rafId === null) animate()
    } else {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
    }
  },
  { immediate: false },
)

onUnmounted(() => { if (rafId !== null) cancelAnimationFrame(rafId) })
</script>

<template>
  <div class="tres-wrapper" :class="{ 'tres-wrapper--hidden': !visible }">
    <!-- Exit button — visible once the scene is shown -->
    <button class="exit-btn" @click="emit('exit')">✕ Exit</button>

    <TresCanvas clear-color="#050508" window-size>
      <!-- Camera -->
      <TresPerspectiveCamera :position="[0, 0, 8]" :look-at="[0, 0, 0]" />

      <!-- Ambient + point lighting -->
      <TresAmbientLight :intensity="0.3" />
      <TresPointLight :position="[4, 4, 4]" :intensity="1.2" color="#4fc3f7" />
      <TresPointLight :position="[-4, -4, 4]" :intensity="0.6" color="#7e57c2" />

      <!-- Rotating wireframe ring to give the empty scene some life -->
      <TresMesh :rotation="rotation">
        <TresTorusGeometry :args="[2.5, 0.015, 8, 120]" />
        <TresMeshStandardMaterial color="#4fc3f7" :wireframe="false" :emissive="'#4fc3f7'" :emissive-intensity="0.4" />
      </TresMesh>

      <!-- Second ring, offset rotation -->
      <TresMesh :rotation="[rotation[1] * 0.7, rotation[1] * -1.3, rotation[1] * 0.5]">
        <TresTorusGeometry :args="[1.8, 0.015, 8, 120]" />
        <TresMeshStandardMaterial color="#7e57c2" :wireframe="false" :emissive="'#7e57c2'" :emissive-intensity="0.4" />
      </TresMesh>

      <!-- Centre sphere -->
      <TresMesh>
        <TresSphereGeometry :args="[0.25, 32, 32]" />
        <TresMeshStandardMaterial color="#ffffff" :emissive="'#ffffff'" :emissive-intensity="0.8" />
      </TresMesh>
    </TresCanvas>
  </div>
</template>

<style scoped>
.tres-wrapper {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #050508;
}

/* Scene is mounted but completely invisible while the iris is still closed.
   The WebGL context and GPU buffers are kept alive; only draw submissions
   are paused (RAF cancelled above). */
.tres-wrapper--hidden {
  visibility: hidden;
  pointer-events: none;
}

.exit-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.75rem;
  z-index: 201;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 0.5rem 1.125rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background 0.2s;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>
