<template>
  <GoogleModal
    v-model="visible"
    :icon="icon"
    :title="title"
    :subtitle="subtitle"
    :confirm-text="confirmText"
    :cancel-text="cancelText"
    :confirm-loading="loading"
    :persistent="loading"
    :close-on-overlay="!loading"
    max-width="420px"
    density="compact"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <div class="confirm-body">
      <div class="confirm-icon-wrapper" :class="`confirm-icon-wrapper--${variant}`">
        <span class="material-symbols-outlined confirm-icon">{{ iconSymbol }}</span>
      </div>
      <p class="confirm-message">{{ message }}</p>
    </div>
  </GoogleModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GoogleModal from './modal.vue'

type Variant = 'danger' | 'warning' | 'info'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  subtitle?: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: Variant
}>(), {
  title: 'Confirmar acción',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  loading: false,
  variant: 'danger',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const iconSymbol = computed(() => {
  switch (props.variant) {
    case 'danger': return 'warning'
    case 'warning': return 'error'
    case 'info': return 'info'
    default: return 'warning'
  }
})

const icon = computed(() => {
  switch (props.variant) {
    case 'danger': return 'warning'
    case 'warning': return 'error'
    case 'info': return 'info'
    default: return 'warning'
  }
})

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.25rem 0 0;
  gap: 0.75rem;
}

.confirm-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-icon-wrapper--danger {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-error);
}

.confirm-icon-wrapper--warning {
  background: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-warning);
}

.confirm-icon-wrapper--info {
  background: var(--md-sys-color-info-container);
  color: var(--md-sys-color-info);
}

.confirm-icon {
  font-size: 24px;
}

.confirm-message {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--md-sys-color-on-surface-variant);
  max-width: 320px;
}

@media (max-width: 480px) {
  .confirm-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .confirm-icon {
    font-size: 20px;
  }

  .confirm-message {
    font-size: 0.85rem;
    max-width: 100%;
  }
}
</style>
