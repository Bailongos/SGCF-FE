<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-backdrop"
      @click="onBackdrop"
    >
      <div class="modal-panel" @click.stop>
        <header class="modal-header">
          <div>
            <h3 class="modal-title">{{ title }}</h3>
            <p v-if="subtitle" class="modal-subtitle">
              {{ subtitle }}
            </p>
          </div>
          <button
            type="button"
            class="icon-button"
            @click="close"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <section class="modal-body">
          <slot />
        </section>

        <footer v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  title: string;
  subtitle?: string;
  closeOnBackdrop?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const onBackdrop = () => {
  if (props.closeOnBackdrop === false) return;
  close();
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(32, 33, 36, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.modal-panel {
  width: 100%;
  max-width: 720px;
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(32, 33, 36, 0.35);
  padding: 1.25rem 1.5rem 1rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #202124;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: #5f6368;
  margin-top: 0.15rem;
}

.modal-body {
  max-height: 420px;
  overflow: auto;
  padding-right: 0.25rem;
}

.modal-footer {
  margin-top: 0.75rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Reutiliza estilos de icon-button del resto de la app */
.icon-button {
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 999px;
  padding: 0.25rem 0.4rem;
  font-size: 0.9rem;
}

.icon-button:hover {
  background: rgba(60, 64, 67, 0.08);
}
</style>
