<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { GLTFModel, Html, Stars } from '@tresjs/cientos'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { BufferGeometry, Float32BufferAttribute, MeshBasicMaterial, PointsMaterial, Uint32BufferAttribute, ShaderMaterial, AdditiveBlending } from 'three'
import { Delaunay } from 'd3-delaunay'
import logoPath from '../assets/Logo.glb?url'
import type { ApiSource } from '../apiSource'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'exit'): void
  (e: 'select-source', source: ApiSource): void
}>()

const LOGO_BASE_POS: [number, number, number] = [0, 3.42, -6.25]
const BUTTON_BASE_POS: [number, number, number] = [0, 0.22, -5.5]

const logoSpinZ = ref(0)
const logoPosition = ref<[number, number, number]>([...LOGO_BASE_POS])
const buttonPosition = ref<[number, number, number]>([...BUTTON_BASE_POS])
const buttonRotation = ref<[number, number, number]>([-0.15, 0, 0])
let rafId: number | null = null

const waveMeshGeometry = ref<BufferGeometry | null>(null)
const waveProxyGeometry = ref<BufferGeometry | null>(null)
const wavePointsGeometry = ref<BufferGeometry | null>(null)
const waveMeshMaterial = ref<ShaderMaterial | null>(null)
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
let wavePhases: Float32Array | null = null
let wavePositionAttribute: Float32BufferAttribute | null = null
let waveColorAttribute: Float32BufferAttribute | null = null
let hasActiveRipplesLastFrame = false

const ripples: { x: number; z: number; startTime: number }[] = []

function selectSource(source: ApiSource) {
  emit('select-source', source)
}

function onWaveClick(e: any) {
  if (e && e.object && e.point) {
     const localPoint = e.object.worldToLocal(e.point.clone())
     ripples.push({
       x: localPoint.x,
       z: localPoint.z,
       startTime: performance.now() * 0.001
     })
  }
}

function initializeWaveField() {
  const totalPoints = GRID_COLUMNS * GRID_ROWS
  const positions = new Float32Array(totalPoints * 3)
  const colors = new Float32Array(totalPoints * 3)
  wavePhases = new Float32Array(totalPoints * 4)
  
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
      
      wavePhases[i * 4] = x * WAVE_FREQ_X + z * WAVE_FREQ_Z
      wavePhases[i * 4 + 1] = x * WAVE_FREQ_X * 2.1 - z * WAVE_FREQ_Z * 1.8
      wavePhases[i * 4 + 2] = x * WAVE_FREQ_X * -3.8 + z * WAVE_FREQ_Z * 4.2
      wavePhases[i * 4 + 3] = x * WAVE_FREQ_X * 7.5 + z * WAVE_FREQ_Z * -7.1
      
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 1.0
      colors[i * 3 + 2] = 1.0
      
      pointsForTriangulation[i] = [x, z]
      i += 1
    }
  }

  const triangulation = Delaunay.from(pointsForTriangulation, (p) => p[0], (p) => p[1])

  const meshGeometry = new BufferGeometry()
  wavePositionAttribute = new Float32BufferAttribute(positions, 3)
  waveColorAttribute = new Float32BufferAttribute(colors, 3)
  
  meshGeometry.setAttribute('position', wavePositionAttribute)
  meshGeometry.setAttribute('color', waveColorAttribute)
  meshGeometry.setIndex(new Uint32BufferAttribute(triangulation.triangles, 1))

  // Points reuse the same position attribute so the wave update is single-pass.
  const pointsGeometry = new BufferGeometry()
  pointsGeometry.setAttribute('position', wavePositionAttribute)
  pointsGeometry.setAttribute('color', waveColorAttribute)

  waveBasePositions = positions.slice()
  waveMeshGeometry.value = meshGeometry
  
  // Fast low-poly proxy for raycasting hits
  const proxyGeom = new BufferGeometry()
  const proxyPositions = new Float32Array([
    // Far edge (Row 0, Z=-1)
    -GRID_WIDTH / 2, GRID_BASE_Y, -1,
     GRID_WIDTH / 2, GRID_BASE_Y, -1,
    // Near edge (Row MAX, Z=19)
    -GRID_WIDTH / 2, GRID_BASE_Y + 2, 19,
     GRID_WIDTH / 2, GRID_BASE_Y + 2, 19
  ])
  const proxyIndices = new Uint32BufferAttribute([
    0, 2, 1,  // CCW winding to face UP
    2, 3, 1
  ], 1)
  proxyGeom.setAttribute('position', new Float32BufferAttribute(proxyPositions, 3))
  proxyGeom.setIndex(proxyIndices)
  proxyGeom.computeBoundingSphere()
  waveProxyGeometry.value = proxyGeom

  wavePointsGeometry.value = pointsGeometry
  waveMeshMaterial.value = new ShaderMaterial({
    vertexShader: `
      varying vec3 vColor;
      void main() {
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        // Measure how far the vertex color is from base white
        float diff = distance(vColor, vec3(1.0));
        
        // Map distance to a 0.0 - 1.0 intensity mask so we know where ripples are
        float intensity = smoothstep(0.0, 0.35, diff);
        
        // Base grid is faint (0.15), but bumps to full solid (1.0) on ripples
        float alpha = 0.15 + (intensity * 0.85);
        
        // Boost color saturation slightly to make it pop, without blowing out channels to white
        float bloomFactor = 1.0 + (intensity * 0.4);
        vec3 finalColor = vColor * bloomFactor;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    wireframe: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false, // Prevents Z-fighting in additive mode
    vertexColors: true,
  })
  wavePointsMaterial.value = new PointsMaterial({
    color: '#ffffff',
    size: 0.025,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    vertexColors: true,
  })
  waveSolidMaterial.value = new MeshBasicMaterial({
    color: '#020204',
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

function updateWaveField(elapsedSeconds: number) {
  if (!wavePositionAttribute || !waveBasePositions || !wavePhases || !waveColorAttribute) return

  const positionArray = wavePositionAttribute.array as Float32Array
  const colorArray = waveColorAttribute.array as Float32Array
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
  
  const currentSeconds = performance.now() * 0.001

  // Clean old ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
      // @ts-ignore
      if (currentSeconds - ripples[i]!.startTime > 9.0) {
          ripples.splice(i, 1)
      }
  }

  // Pre-calculate ripple properties for this frame
  const activeRipples = ripples.map(r => {
      // @ts-ignore
      const t = currentSeconds - r!.startTime
      return {
          // @ts-ignore
          x: r!.x,
          // @ts-ignore
          z: r!.z,
          t: t,
          waveRadius: t * 6.0,
          fade: Math.max(0, 1.0 - (t / 9.0))
      }
  })

  const hasRipples = activeRipples.length > 0;
  const updateColor = hasRipples || hasActiveRipplesLastFrame;
  hasActiveRipplesLastFrame = hasRipples;

  for (let i = 0; i < totalPoints; i += 1) {
    const idx = i * 3
    const phaseIdx = i * 4
    const baseX = waveBasePositions[idx] ?? 0
    const baseY = waveBasePositions[idx + 1] ?? GRID_BASE_Y
    const baseZ = waveBasePositions[idx + 2] ?? 0

    // Approximate Fractal Brownian Motion (fBm) using precomputed phases and 4 sine octaves
    let noise = Math.sin(wavePhases[phaseIdx]! + t1) * amp1
              + Math.sin(wavePhases[phaseIdx + 1]! + t2) * amp2
              + Math.sin(wavePhases[phaseIdx + 2]! + t3) * amp3
              + Math.sin(wavePhases[phaseIdx + 3]! + t4) * amp4

    if (updateColor) {
      // Default white color
      let r = 1, g = 1, b = 1

      for (let rIdx = 0; rIdx < activeRipples.length; rIdx++) {
        const ripple = activeRipples[rIdx]!
        
        const dx = baseX - ripple.x
        const dz = baseZ - ripple.z
        // Use squared distance for quick bounding check
        const sqDist = dx * dx + dz * dz
        
        const RIPPLE_WIDTH = 1.8
        const maxD = ripple.waveRadius + RIPPLE_WIDTH
        
        // Only compute sqrt and colors if within the expanding circle
        if (sqDist <= maxD * maxD) {
          const dist = Math.sqrt(sqDist)
          
          let colorIntensity = 0
          if (dist < ripple.waveRadius) {
             // Inside the wave ring: full color intensity
             colorIntensity = 1.0
          } else {
             // Leading edge fade
             colorIntensity = 1.0 - ((dist - ripple.waveRadius) / RIPPLE_WIDTH)
          }
          
          // Overall fade for the ripple over time
          const finalColorIntensity = colorIntensity * ripple.fade
          
          if (finalColorIntensity > 0) {
              const angle = Math.atan2(dz, dx)
              // Rainbow based on angle and radial distance
              const hue = angle + dist * 0.5 - ripple.t * 2.0
              
              const rawR = Math.sin(hue) * 0.5 + 0.5
              const rawG = Math.sin(hue + 2.094) * 0.5 + 0.5
              const rawB = Math.sin(hue + 4.188) * 0.5 + 0.5
 
              // Add physical ripple to Y position ONLY around the wave edge
              const distFromWave = Math.abs(dist - ripple.waveRadius)
              if (distFromWave < RIPPLE_WIDTH) {
                 const bumpIntensity = 1.0 - (distFromWave / RIPPLE_WIDTH)
                 const bump = Math.cos(distFromWave / RIPPLE_WIDTH * Math.PI * 0.5) * 0.6 * bumpIntensity * ripple.fade
                 noise += bump
              }
 
              // Blend color towards rainbow
              r = r * (1 - finalColorIntensity) + rawR * finalColorIntensity
              g = g * (1 - finalColorIntensity) + rawG * finalColorIntensity
              b = b * (1 - finalColorIntensity) + rawB * finalColorIntensity
          }
        }
      }
      
      colorArray[idx] = r
      colorArray[idx + 1] = g
      colorArray[idx + 2] = b
    }

    positionArray[idx + 1] = baseY + noise
  }

  wavePositionAttribute.needsUpdate = true
  if (updateColor) {
    waveColorAttribute.needsUpdate = true
  }
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
  if (props.visible && rafId === null) animate()
})

onUnmounted(() => {
  waveMeshGeometry.value?.dispose()
  waveProxyGeometry.value?.dispose()
  wavePointsGeometry.value?.dispose()
  waveMeshMaterial.value?.dispose()
  wavePointsMaterial.value?.dispose()
  waveSolidMaterial.value?.dispose()
})
</script>

<template>
  <div class="tres-wrapper" :class="{ 'tres-wrapper--hidden': !visible }">
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
        <!-- Invisible hit plane for fast raycasting -->
        <TresMesh
          v-if="waveProxyGeometry"
          :geometry="waveProxyGeometry"
          @click="onWaveClick"
        >
          <TresMeshBasicMaterial :transparent="true" :opacity="0" :depth-write="false" />
        </TresMesh>

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

      <!-- Futuristic 3D startup controls below the logo -->
      <TresGroup :position="buttonPosition" :rotation="buttonRotation">
        <!-- Dark background plate to occlude stars behind the button -->
        <TresMesh>
          <TresBoxGeometry :args="[4.7, 0.9, 0.08]" />
          <TresMeshBasicMaterial color="#020204" :transparent="true" :opacity="0.8" :depth-test="false" />
        </TresMesh>
        <Html transform center :position="[0, 0, 0.1]">
          <div class="startup-actions" @click.stop>
            <button class="start-label" @click="selectSource('true-api')">START</button>
            <button class="view-label" @click="selectSource('frontend-api')">VIEW FRONTEND</button>
          </div>
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

.startup-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.view-label {
  border: 1px solid rgba(136, 177, 255, 0.45);
  border-radius: 0.15rem;
  padding: 0.4rem 1rem;
  background: rgba(30, 38, 58, 0.55);
  color: #eaf1ff;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.16em;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  text-shadow: 0 0 6px rgba(170, 207, 255, 0.35);
}

.view-label:hover {
  background: rgba(65, 90, 140, 0.28);
  box-shadow: 0 0 14px rgba(152, 189, 255, 0.2) inset, 0 0 18px rgba(124, 171, 255, 0.16);
  border-color: rgba(166, 203, 255, 0.85);
}
</style>
