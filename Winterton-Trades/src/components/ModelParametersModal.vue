<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Save, AlertCircle } from 'lucide-vue-next'
import { updateModelParameters } from '../api'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const isSaving = ref(false)

// Form state corresponding to the required parameters
const formData = ref({
  portfolio1: {
    moneyPercent: 50.0,
    positionSize: 0.02,
    switchingStrategy: true,
    stationarityThreshold: 0.1,
    minHalfLifeDays: 2,
    maxHalfLifeDays: 90,
    entryZScore: 4.0,
  },
  
  portfolio2: {
    moneyPercent: 50.0,
    // TBD for now
  }
})




const totalAllocation = computed(() => {
  return (formData.value.portfolio1.moneyPercent || 0) + (formData.value.portfolio2.moneyPercent || 0)
})

const isTotalAllocationValid = computed(() => {
  return Math.abs(totalAllocation.value - 100) < 0.001
})

async function handleSave() {
  isSaving.value = true
  try {
    const result = await updateModelParameters(formData.value)
    console.log(result.message)
    emit('close')
  } catch (error) {
    console.error('Error saving model parameters:', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-container">
          <div class="modal-header">
            <h2>Model Parameter Options</h2>
            <button class="close-btn" @click="emit('close')">
              <X :size="20" />
            </button>
          </div>

          <div class="modal-body">
           

            <form class="settings-form" @submit.prevent="handleSave">
              <div class="form-section">
                <h3>Portfolio 1 Options</h3>
                <div class="form-group">
                  <label for="p1-money-percent">Money Allocation (%)</label>
                  <input id="p1-money-percent" type="number" step="0.1" v-model="formData.portfolio1.moneyPercent" class="form-input" />
                </div>
                <div class="form-group">
                  <label for="p1-position-size">Position Size</label>
                  <input id="p1-position-size" type="number" step="0.01" v-model="formData.portfolio1.positionSize" class="form-input" />
                </div>
                
                <div class="form-group checkbox-group">
                  <label for="p1-switching-strategy">Switching Strategy</label>
                  <input id="p1-switching-strategy" type="checkbox" v-model="formData.portfolio1.switchingStrategy" class="form-checkbox" />
                </div>

                <div class="form-group">
                  <label for="p1-stationarity-threshold">Stationarity Threshold</label>
                  <input id="p1-stationarity-threshold" type="number" step="0.01" v-model="formData.portfolio1.stationarityThreshold" class="form-input" />
                </div>

                <div class="form-group row-group">
                  <div class="sub-group">
                    <label for="p1-min-half-life">Min Half Life (days)</label>
                    <input id="p1-min-half-life" type="number" v-model="formData.portfolio1.minHalfLifeDays" class="form-input" />
                  </div>
                  <div class="sub-group">
                    <label for="p1-max-half-life">Max Half Life (days)</label>
                    <input id="p1-max-half-life" type="number" v-model="formData.portfolio1.maxHalfLifeDays" class="form-input" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="p1-entry-z-score">Entry Z-Score</label>
                  <input id="p1-entry-z-score" type="number" step="0.1" v-model="formData.portfolio1.entryZScore" class="form-input" />
                </div>
              </div>

              <div class="form-section disabled-section">
                <h3>Portfolio 2 Options</h3>
                <div class="form-group">
                  <label for="p2-money-percent">Money Allocation (%)</label>
                  <input id="p2-money-percent" type="number" step="0.1" v-model="formData.portfolio2.moneyPercent" class="form-input" />
                </div>
                <p class="tbd-text">Other configuration coming soon.</p>
              </div>

              <div v-if="!isTotalAllocationValid" class="allocation-error">
                <AlertCircle :size="16" />
                <span>Total allocation must equal 100%. Current: {{ totalAllocation.toFixed(1) }}%</span>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-cancel" @click="emit('close')">Cancel</button>
                <button type="submit" class="btn-save" :disabled="isSaving || !isTotalAllocationValid">
                  <Save :size="16" v-if="!isSaving" />
                  {{ isSaving ? 'Saving...' : 'Save Parameters' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(0.25rem);
}

.modal-container {
  background: var(--bg-modal);
  border-radius: 1rem;
  width: 90vw;
  max-width: 40rem;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1.5rem 5rem rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-modal);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--border-modal);
  background: var(--bg-modal-header);
  border-radius: 1rem 1rem 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-modal-heading);
}

.close-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: none;
  background: var(--bg-close-btn);
  color: var(--text-close-btn);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-close-btn-hover);
  color: var(--text-primary);
}

.modal-body {
  overflow-y: auto;
  padding: 1.75rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-modal);
  padding-bottom: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.row-group {
  flex-direction: row;
  gap: 1rem;
}

.sub-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-group label {
  cursor: pointer;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  background: var(--bg-card);
  border: 1px solid var(--border-table-row);
  color: var(--text-primary);
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #6366f1;
}

.form-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #6366f1;
}

.disabled-section {
  opacity: 0.6;
}

.tbd-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-modal);
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-table-row);
  color: var(--text-secondary);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--bg-table-row-hover);
  color: var(--text-primary);
}

.btn-save {
  background: #6366f1;
  border: none;
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.allocation-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 1rem;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from .modal-container {
  transform: translateY(20px) scale(0.95);
}

.modal-leave-to .modal-container {
  transform: translateY(20px) scale(0.95);
}

/* Pie Chart Styles */
.pie-chart-section {
  background: var(--bg-card);
  border: 1px solid var(--border-table-row);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.pie-chart-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.pie-chart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
}

.pie-chart {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: visible;
  touch-action: none; /* Prevent scrolling when dragging on touch devices */
}

.chart-slice {
  transition: d 0.1s ease-out;
  cursor: pointer;
}

.drag-handle {
  cursor: grab;
  transition: transform 0.1s ease, fill 0.2s;
}

.drag-handle:hover {
  fill: var(--text-primary);
}

.drag-handle:active {
  cursor: grabbing;
  transform: scale(1.1);
  fill: var(--text-primary);
}

.pie-labels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pie-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
}

.color-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>