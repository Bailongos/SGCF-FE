<template>
  <div
    class="g-input-wrapper"
    :class="[
      `g-input--${size}`,
      { 'g-input--error': !!error, 'g-input--textarea': type === 'textarea' },
      attrsClass,
    ]"
    :style="attrsStyle"
  >
    <label v-if="label" class="g-input-label">
      {{ label }}
    </label>

    <div class="g-input-container" :style="{ '--g-input-focus': color }">
      <textarea
        v-if="type === 'textarea'"
        class="g-input"
        v-bind="inputAttrs"
        :value="stringValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        :rows="rows"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
      ></textarea>

      <input
        v-else
        class="g-input"
        v-bind="inputAttrs"
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

    <p v-else-if="hint" class="g-input-hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, type StyleValue } from 'vue';

defineOptions({
  inheritAttrs: false,
});

type InputType = 'text' | 'number' | 'email' | 'password' | 'textarea' | 'date';
type Size = 'sm' | 'md' | 'lg';
type Validation = 'none' | 'email';

const props = defineProps<{
  modelValue?: string | number | null;
  label?: string;
  placeholder?: string;
  type?: InputType;
  size?: Size;
  color?: string;
  disabled?: boolean;
  maxlength?: number;
  hint?: string;
  validation?: Validation;
  errorMessage?: string;
  rows?: number; // Para textarea
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}>();

const type = computed<InputType>(() => props.type ?? 'text');
const size = computed<Size>(() => props.size ?? 'md');
const color = computed(() => props.color ?? '#1a73e8');
const disabled = computed(() => props.disabled ?? false);
const validation = computed<Validation>(() => props.validation ?? 'none');
const rows = computed(() => props.rows ?? 3);
const attrs = useAttrs();

const internalError = ref<string | null>(null);

const stringValue = computed(() =>
  props.modelValue != null ? String(props.modelValue) : '',
);

const inputType = computed(() => {
  if (type.value === 'email') return 'email';
  if (type.value === 'password') return 'password';
  if (type.value === 'number') return 'number';
  if (type.value === 'date') return 'date';
  return 'text';
});

const inputMode = computed(() => {
  if (type.value === 'number') return 'numeric';
  if (type.value === 'email') return 'email';
  return 'text';
});

const error = computed(() => props.errorMessage ?? internalError.value);

const attrsClass = computed(() => attrs.class as unknown);
const attrsStyle = computed(() => attrs.style as StyleValue | undefined);

const inputAttrs = computed(() => {
  const rest = { ...attrs } as Record<string, unknown>;
  delete rest.class;
  delete rest.style;
  return rest;
});

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const value = target.value;

  internalError.value = null;
  emit('update:modelValue', value === '' ? null : value);
}

function onBlur() {
  if (type.value === 'email' && validation.value === 'email') {
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
  color: var(--md-sys-color-on-surface-variant);
}

.g-input-container {
  border-radius: 4px 4px 0 0; /* MD3 text field style */
  border-bottom: 2px solid var(--md-sys-color-outline);
  background-color: var(--md-sys-color-surface-variant);
  display: flex;
  align-items: center;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.g-input-container:hover {
  background-color: var(--md-sys-color-surface-container);
}

.g-input {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface);
}

.g-input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.7;
}

.g-input--textarea .g-input-container {
  border-radius: 8px;
}

.g-input--textarea .g-input {
  min-height: 60px;
  resize: vertical;
}

.g-input-container:focus-within {
  border-bottom-color: var(--g-input-focus, var(--md-sys-color-primary));
}

.g-input--error .g-input-container {
  border-color: var(--md-sys-color-error);
  box-shadow: 0 0 0 1px rgba(var(--md-sys-color-error-rgb), 0.12);
}

.g-input-error {
  font-size: 0.75rem;
  color: var(--md-sys-color-error);
  margin: 0.1rem 0 0 0;
}

.g-input-hint {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  margin: 0.1rem 0 0 0;
}
</style>
