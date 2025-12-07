<template>
  <div class="g-input-wrapper" :class="[`g-input--${size}`, { 'g-input--error': !!error }]">
    <label v-if="label" class="g-input-label">
      {{ label }}
    </label>

    <div
      class="g-input-container"
      :style="{ '--g-input-focus': color }"
    >
      <input
        class="g-input"
        :type="inputType"
        :value="stringValue"
        :placeholder="placeholder"
        :inputmode="inputMode"
        :disabled="disabled"
        :maxlength="maxlength"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
      />
    </div>

    <p v-if="error" class="g-input-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

type Kind = 'text' | 'number' | 'email';
type Size = 'sm' | 'md' | 'lg';
type Validation = 'none' | 'email';

const props = defineProps<{
  modelValue?: string | number | null;
  label?: string;
  placeholder?: string;
  kind?: Kind;              // text | number | email
  size?: Size;              // sm | md | lg
  color?: string;           // color del foco (border/shadow)
  disabled?: boolean;
  maxlength?: number;
  validation?: Validation;  // 'none' | 'email'
  errorMessage?: string;    // error externo opcional
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}>();

const kind = computed<Kind>(() => props.kind ?? 'text');
const size = computed<Size>(() => props.size ?? 'md');
const color = computed(() => props.color ?? '#1a73e8'); // azul Google
const disabled = computed(() => props.disabled ?? false);
const validation = computed<Validation>(() => props.validation ?? 'none');

const internalError = ref<string | null>(null);

// Valor como string para el input
const stringValue = computed(() =>
  props.modelValue != null ? String(props.modelValue) : '',
);

// Tipo real del input
const inputType = computed(() => {
  if (kind.value === 'email') return 'email';
  // Para number usamos type="text" y filtramos, así evitamos flechitas feas
  if (kind.value === 'number') return 'text';
  return 'text';
});

// inputmode para móviles
const inputMode = computed(() => {
  if (kind.value === 'number') return 'numeric';
  if (kind.value === 'email') return 'email';
  return 'text';
});

// Error final a mostrar (externo o interno)
const error = computed(() => props.errorMessage ?? internalError.value);

// Handlers
function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  let value = target.value;

  if (kind.value === 'number') {
    // Solo dígitos
    value = value.replace(/[^\d]/g, '');
    target.value = value;
  }

  internalError.value = null;

  // Emitimos string, el padre puede usar v-model.number si quiere número
  emit('update:modelValue', value === '' ? null : value);
}

function onBlur() {
  if (kind.value === 'email' && validation.value === 'email') {
    const value = stringValue.value.trim();
    if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      internalError.value = emailRegex.test(value)
        ? null
        : 'Correo electrónico no válido.';
    } else {
      internalError.value = null;
    }
  }

  emit('blur');
}

function onFocus() {
  emit('focus');
}
</script>

<style scoped>
.g-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

/* Tamaños */
.g-input--sm .g-input {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.g-input--md .g-input {
  padding: 0.4rem 0.7rem;
  font-size: 0.9rem;
}

.g-input--lg .g-input {
  padding: 0.55rem 0.9rem;
  font-size: 1rem;
}

.g-input-label {
  font-size: 0.8rem;
  color: #5f6368;
}

/* Contenedor del input */
.g-input-container {
  border-radius: 999px;
  border: 1px solid #dadce0;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.g-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;

  font-family: inherit;
  font-size: 0.9rem;
  color: #202124;
}

.g-input::placeholder {
  color: #9aa0a6;
}

/* Focus dentro del contenedor */
.g-input:focus-visible,
.g-input:focus {
  outline: none;
}

.g-input:focus + .dummy {
  outline: none;
}

/* Focus mediante :has (solo soportado en navegadores modernos).
   Si no lo soporta, de todos modos el input se ve bien. */
.g-input-container:focus-within {
  border-color: var(--g-input-focus, #1a73e8);
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
}

/* Error */
.g-input--error .g-input-container {
  border-color: #d93025;
  box-shadow: 0 0 0 1px rgba(217, 48, 37, 0.12);
}

.g-input-error {
  font-size: 0.75rem;
  color: #d93025;
}
</style>
