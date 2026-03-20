<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { GLTFModel, Html } from '@tresjs/cientos'
import { ref, watch, onUnmounted } from 'vue'
import logoPath from '../assets/Logo.glb?url'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'exit'): void }>()

const logoSpinZ = ref(0)
const buttonRotation = ref<[number, number, number]>([-0.15, 0, 0])
let rafId: number | null = null

function animate() {
  logoSpinZ.value -= 0.0014
  buttonRotation.value = [buttonRotation.value[0], buttonRotation.value[1], buttonRotation.value[2]]
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

    <TresCanvas clear-color="#0d1724" window-size>
      <!-- Camera -->
      <TresPerspectiveCamera :position="[0, 0, 8]" :look-at="[0, 0, 0]" />

      <!-- Basic key/fill/rim style lighting so the logo reads clearly -->
      <TresAmbientLight :intensity="1.35" />
      <TresHemisphereLight :args="['#eef8ff', '#172131', 1.1]" />
      <TresDirectionalLight :position="[2.5, 4.5, 4]" :intensity="2.1" color="#ffffff" />
      <TresDirectionalLight :position="[-3, 2, 1.5]" :intensity="1.1" color="#b9dcff" />
      <TresPointLight :position="[0, 2.2, 3.5]" :intensity="1.3" color="#dff1ff" />

      <!-- Spinning logo model in the center -->
      <TresGroup :position="[0, 0.7, 0]" :rotation="[Math.PI / 2, 0, logoSpinZ]">
        <GLTFModel :path="logoPath" :scale="0.65" :cast-shadow="true" :receive-shadow="true" />
      </TresGroup>

      <!-- Simple 3D start button below the logo -->
      <TresGroup :position="[0, -1.65, 0]" :rotation="buttonRotation" @click="emit('exit')">
        <TresMesh>
          <TresBoxGeometry :args="[2.2, 0.48, 0.45]" />
          <TresMeshStandardMaterial color="#244766" :emissive="'#102031'" :emissive-intensity="0.2" :transparent="false" :opacity="1" />
        </TresMesh>
        <TresMesh :position="[0, 0.06, 0.13]">
          <TresBoxGeometry :args="[2.02, 0.26, 0.18]" />
          <TresMeshStandardMaterial color="#79d2ff" :emissive="'#58c0ff'" :emissive-intensity="0.12" :transparent="false" :opacity="1" />
        </TresMesh>
        <Html transform center :position="[0, 0.06, 0.35]">
          <button class="start-label" @click.stop="emit('exit')">START</button>
        </Html>
      </TresGroup>

      <!-- Floor to visually anchor the button -->
      <TresMesh :position="[0, -2.2, 0]" :rotation="[-Math.PI / 2, 0, 0]">
        <TresCircleGeometry :args="[3.8, 64]" />
        <TresMeshStandardMaterial color="#0e1116" :emissive="'#0b0e12'" :emissive-intensity="0.2" />
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

.start-label {
  border: 0;
  border-radius: 0.35rem;
  padding: 0.22rem 0.8rem;
  background: #f4fbff;
  color: #0b2536;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  opacity: 1;
}
</style>
