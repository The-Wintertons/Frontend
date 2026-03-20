<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { GLTFModel, Html, Stars } from '@tresjs/cientos'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { BufferGeometry, Float32BufferAttribute, MeshBasicMaterial, PointsMaterial, Uint32BufferAttribute } from 'three'
import { Delaunay } from 'd3-delaunay'
import logoPath from '../assets/Logo.glb?url'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'exit'): void }>()

const LOGO_BASE_POS: [number, number, number] = [0, 3.42, -6.25]
const BUTTON_BASE_POS: [number, number, number] = [0, 0.22, -5.5]

const logoSpinZ = ref(0)
const logoPosition = ref<[number, number, number]>([...LOGO_BASE_POS])
const buttonPosition = ref<[number, number, number]>([...BUTTON_BASE_POS])
const buttonRotation = ref<[number, number, number]>([-0.15, 0, 0])
let rafId: number | null = null

const waveMeshGeometry = ref<BufferGeometry | null>(null)
const wavePointsGeometry = ref<BufferGeometry | null>(null)
const waveMeshMaterial = ref<MeshBasicMaterial | null>(null)
const wavePointsMaterial = ref<PointsMaterial | null>(null)
const waveSolidMaterial = ref<MeshBasicMaterial | null>(null)

const GRID_COLUMNS = 56
const GRID_ROWS = 46
const GRID_WIDTH = 22
const GRID_DEPTH = -20
const GRID_BASE_Y = 0
const WAVE_AMPLITUDE = 0.42
const WAVE_SPEED = 1.05
const WAVE_FREQ_X = 0.34
const WAVE_FREQ_Z = 0.24

let waveStartTime = 0
let waveBasePositions: Float32Array | null = null
let wavePositionAttribute: Float32BufferAttribute | null = null

function initializeWaveField() {
  const totalPoints = GRID_COLUMNS * GRID_ROWS
  const positions = new Float32Array(totalPoints * 3)
  const pointsForTriangulation: Array<[number, number]> = new Array(totalPoints)
  let i = 0
  for (let row = 0; row < GRID_ROWS; row += 1) {
    const rowT = row / (GRID_ROWS - 1)
    const z = -1 - rowT * GRID_DEPTH
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const colT = column / (GRID_COLUMNS - 1)
      const x = (colT - 0.5) * GRID_WIDTH

      positions[i * 3] = x
      positions[i * 3 + 1] = GRID_BASE_Y + 2 * rowT
      positions[i * 3 + 2] = z
      pointsForTriangulation[i] = [x, z]
      i += 1
    }
  }

  const triangulation = Delaunay.from(pointsForTriangulation, (p) => p[0], (p) => p[1])

  const meshGeometry = new BufferGeometry()
  wavePositionAttribute = new Float32BufferAttribute(positions, 3)
  meshGeometry.setAttribute('position', wavePositionAttribute)
  meshGeometry.setIndex(new Uint32BufferAttribute(triangulation.triangles, 1))

  // Points reuse the same position attribute so the wave update is single-pass.
  const pointsGeometry = new BufferGeometry()
  pointsGeometry.setAttribute('position', wavePositionAttribute)

  waveBasePositions = positions.slice()
  waveMeshGeometry.value = meshGeometry
  wavePointsGeometry.value = pointsGeometry
  waveMeshMaterial.value = new MeshBasicMaterial({
    color: '#ffffff',
    wireframe: true,
    transparent: true,
    opacity: 1,
  })
  wavePointsMaterial.value = new PointsMaterial({
    color: '#ffffff',
    size: 0.025,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  })
  waveSolidMaterial.value = new MeshBasicMaterial({
    color: '#020204',
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

function updateWaveField(elapsedSeconds: number) {
  if (!wavePositionAttribute || !waveBasePositions) return

  const positionArray = wavePositionAttribute.array as Float32Array
  const totalPoints = GRID_COLUMNS * GRID_ROWS
  
  // CPU Math Optimization: Pre-calculate time components outside the massive vertex loop
  const t1 = elapsedSeconds * WAVE_SPEED
  const t2 = t1 * 1.25
  const t3 = t1 * 1.5
  const t4 = t1 * 2.0
  const amp1 = WAVE_AMPLITUDE
  const amp2 = WAVE_AMPLITUDE * 0.5
  const amp3 = WAVE_AMPLITUDE * 0.25
  const amp4 = WAVE_AMPLITUDE * 0.125

  for (let i = 0; i < totalPoints; i += 1) {
    const idx = i * 3
    const baseX = waveBasePositions[idx] ?? 0
    const baseY = waveBasePositions[idx + 1] ?? GRID_BASE_Y
    const baseZ = waveBasePositions[idx + 2] ?? 0

    // Approximate Fractal Brownian Motion (fBm) using 4 sine octaves
    let noise = 0
    
    // Octave 1: Base wave
    noise += Math.sin(baseX * WAVE_FREQ_X + baseZ * WAVE_FREQ_Z + t1) * amp1
    
    // Octave 2: Higher frequency, lower amplitude, shifted phase direction
    noise += Math.sin(baseX * WAVE_FREQ_X * 2.1 - baseZ * WAVE_FREQ_Z * 1.8 + t2) * amp2
    
    // Octave 3: Even higher frequency, twisted angle
    noise += Math.sin(baseX * WAVE_FREQ_X * -3.8 + baseZ * WAVE_FREQ_Z * 4.2 + t3) * amp3
    
    // Octave 4: Fine details
    noise += Math.sin(baseX * WAVE_FREQ_X * 7.5 + baseZ * WAVE_FREQ_Z * -7.1 + t4) * amp4

    positionArray[idx + 1] = baseY + noise
  }

  wavePositionAttribute.needsUpdate = true
}

function animate() {
  logoSpinZ.value -= 0.0014
  if (waveStartTime === 0) waveStartTime = performance.now()
  const elapsedSeconds = (performance.now() - waveStartTime) * 0.001
  updateWaveField(elapsedSeconds)

  const logoFloat = Math.sin(elapsedSeconds * 0.9) * 0.08
  logoPosition.value = [LOGO_BASE_POS[0], LOGO_BASE_POS[1] + logoFloat, LOGO_BASE_POS[2]]
  const buttonFloat = Math.sin(elapsedSeconds * 1.2 + 0.5) * 0.025
  buttonPosition.value = [BUTTON_BASE_POS[0], BUTTON_BASE_POS[1] + buttonFloat, BUTTON_BASE_POS[2]]

  buttonRotation.value = [-0.09 + Math.sin(elapsedSeconds * 0.8) * 0.015, 0, 0]
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

onMounted(() => {
  initializeWaveField()
})

onUnmounted(() => {
  waveMeshGeometry.value?.dispose()
  wavePointsGeometry.value?.dispose()
  waveMeshMaterial.value?.dispose()
  wavePointsMaterial.value?.dispose()
  waveSolidMaterial.value?.dispose()
})
</script>

<template>
  <div class="tres-wrapper" :class="{ 'tres-wrapper--hidden': !visible }">
    <!-- Exit button — visible once the scene is shown -->
    <button class="exit-btn" @click="emit('exit')">✕ Exit</button>

    <TresCanvas clear-color="#020204" window-size>
      <TresFog :args="['#020204', 16, 120]" />

      <!-- Deep Space Starfield -->
      <Stars
        :radius="40"
        :depth="60"
        :count="8000"
        :size="0.5"
        :size-attenuation="true"
      />

      <!-- Camera -->
      <TresPerspectiveCamera :position="[0, 1.15, 9.1]" :look-at="[0, -0.2, -6.8]" />

      <!-- Optimized Lighting (Only needed for the central logo!) -->
      <TresAmbientLight :intensity="12" color="#a5c4df" />
      <TresDirectionalLight :position="[2.8, 5.4, 4.2]" :intensity="2.5" color="#f3fbff" />
      <TresPointLight :position="[0, 1.05, -4.8]" :intensity="2" color="#a5deff" />

      <!-- Delaunay-triangulated animated wave background -->
      <TresGroup :position="[0, -2.25, -9.9]" >
        <!-- Solid background to occlude the stars -->
        <TresMesh
          v-if="waveMeshGeometry && waveSolidMaterial"
          :geometry="waveMeshGeometry"
          :material="waveSolidMaterial"
        />
        <TresMesh
          v-if="waveMeshGeometry && waveMeshMaterial"
          :geometry="waveMeshGeometry"
          :material="waveMeshMaterial"
        />
        <TresPoints
          v-if="wavePointsGeometry && wavePointsMaterial"
          :geometry="wavePointsGeometry"
          :material="wavePointsMaterial"
        />
      </TresGroup>

      <!-- Spinning logo model in the center -->
      <TresGroup :position="logoPosition" :rotation="[Math.PI / 2, 0, logoSpinZ]" :render-order="10">
        <GLTFModel :path="logoPath" :scale="1.12" :depth-test="false" />
      </TresGroup>

      <!-- Futuristic 3D start button below the logo -->
      <TresGroup :position="buttonPosition" :rotation="buttonRotation" @click="emit('exit')">
        <!-- Dark background plate to occlude stars behind the button -->
        <TresMesh>
          <TresBoxGeometry :args="[2.45, 0.6, 0.08]" />
          <TresMeshBasicMaterial color="#020204" :transparent="true" :opacity="0.8" :depth-test="false" />
        </TresMesh>
        <Html transform center :position="[0, 0, 0.1]">
          <button class="start-label" @click.stop="emit('exit')">START</button>
        </Html>
      </TresGroup>

    </TresCanvas>
  </div>
</template>

<style scoped>
.tres-wrapper {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #050508;
  opacity: 1;
  visibility: visible;
  transition: opacity 1.5s ease-in-out, visibility 1.5s;
}

/* Scene is mounted but completely invisible while the iris is still closed.
   The WebGL context and GPU buffers are kept alive; only draw submissions
   are paused (RAF cancelled above). */
.tres-wrapper--hidden {
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
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
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 0.15rem;
  padding: 0.4rem 1.4rem;
  background: rgba(2, 2, 4, 0.6);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.05) inset;
}

.start-label:hover {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3) inset, 0 0 20px rgba(255, 255, 255, 0.1);
  text-shadow: 0 0 12px rgba(255, 255, 255, 1);
  border-color: rgba(255, 255, 255, 0.8);
}
</style>
