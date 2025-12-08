<!-- src/components/ui/select.vue -->
<template>
  <div
    class="g-select-wrapper"
    :class="[`g-select--${size}`, { 'g-select--disabled': disabled }]"
    ref="wrapperRef"
  >
    <label v-if="label" class="g-select-label">
      {{ label }}
    </label>

    <div
      class="g-select-container"
      :style="{ '--g-select-focus': color }"
      @click="onContainerClick"
    >
      <input
        class="g-select-input"
        type="text"
        :placeholder="placeholder"
        v-model="search"
        :disabled="disabled"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.down.prevent="focusNext"
        @keydown.up.prevent="focusPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc.prevent="close"
        autocomplete="off"
      />

      <span
        class="material-symbols-outlined g-select-icon"
        :class="{ 'g-select-icon-open': isOpen }"
      >
        expand_more
      </span>
    </div>

    <!-- Lista desplegable -->
    <transition name="g-select-fade">
      <ul
        v-if="isOpen && filteredOptions.length"
        class="g-select-list"
      >
        <li
          v-for="(opt, index) in filteredOptions"
          :key="opt.value"
          class="g-select-option"
          :class="{
            'g-select-option--selected': opt.value === modelValue,
            'g-select-option--highlighted': index === highlightedIndex,
          }"
          @mousedown.prevent="selectOption(opt)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </transition>

    <p v-if="error" class="g-select-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
} from 'vue';

type Size = 'sm' | 'md' | 'lg';

export interface SelectOption {
  label: string;
  value: string | number;
}

const props = defineProps<{
  modelValue?: string | number | null;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  size?: Size;
  color?: string;
  disabled?: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
  (e: 'change', value: string | number | null): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();

const size = computed<Size>(() => props.size ?? 'md');
const color = computed(() => props.color ?? '#1a73e8');
const disabled = computed(() => props.disabled ?? false);
const error = computed(() => props.errorMessage ?? null);

const wrapperRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const search = ref('');
const highlightedIndex = ref<number>(-1);

// Opción seleccionada (si el padre manda un valor)
const selectedOption = computed(() =>
  props.options.find((o) => o.value === props.modelValue) ?? null,
);

// Sincroniza el texto mostrado con el valor seleccionado SOLO cuando está cerrado
watch(
  () => [props.modelValue, props.options],
  ([model]) => {
    if (!isOpen.value) {
      // 🔹 Si no hay valor (null / undefined / ''), dejamos el input vacío
      //    y se ve el placeholder "Selecciona..."
      if (model === null || model === undefined || model === '') {
        search.value = '';
      } else {
        search.value = selectedOption.value?.label ?? '';
      }
    }
  },
  { immediate: true },
);

// Opciones filtradas
const filteredOptions = computed(() => {
  const term = search.value.toLowerCase().trim();
  if (!term) return props.options;
  return props.options.filter((o) =>
    o.label.toLowerCase().includes(term),
  );
});

// Abrir/cerrar
function open() {
  if (disabled.value) return;
  isOpen.value = true;

  // Al abrir limpiamos el texto para mostrar TODAS las opciones
  search.value = '';

  highlightedIndex.value = filteredOptions.value.findIndex(
    (o) => o.value === props.modelValue,
  );
}

function close() {
  isOpen.value = false;
  highlightedIndex.value = -1;

  // Al cerrar, si hay valor, mostramos su etiqueta;
  // si NO hay valor, dejamos el input vacío → placeholder visible
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    search.value = '';
  } else {
    search.value = selectedOption.value?.label ?? '';
  }
}

// Click en el contenedor
function onContainerClick() {
  if (disabled.value) return;
  if (!isOpen.value) {
    open();
  } else {
    close();
  }
}

// Selección
function selectOption(opt: SelectOption) {
  search.value = opt.label;
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
  close();
}

// Manejo de teclado
function focusNext() {
  if (!isOpen.value) open();
  const max = filteredOptions.value.length - 1;
  if (max < 0) return;
  if (highlightedIndex.value < max) {
    highlightedIndex.value += 1;
  } else {
    highlightedIndex.value = 0;
  }
}

function focusPrev() {
  if (!isOpen.value) open();
  const max = filteredOptions.value.length - 1;
  if (max < 0) return;
  if (highlightedIndex.value > 0) {
    highlightedIndex.value -= 1;
  } else {
    highlightedIndex.value = max;
  }
}

function selectHighlighted() {
  if (!isOpen.value) return;

  const idx = highlightedIndex.value;
  const opt = filteredOptions.value[idx];
  if (!opt) return;

  selectOption(opt);
}

function onFocus() {
  emit('focus');
  open();
}

function onBlur() {
  // Pequeño delay por si se hace click en la lista
  setTimeout(() => {
    if (!wrapperRef.value) {
      close();
      emit('blur');
      return;
    }

    const active = document.activeElement;
    if (!active || !wrapperRef.value.contains(active)) {
      close();
      emit('blur');
    }
  }, 100);
}

// Cerrar al hacer click fuera
function handleClickOutside(e: MouseEvent) {
  if (!wrapperRef.value) return;
  if (!wrapperRef.value.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.g-select-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif;
}

.g-select-label {
  font-size: 0.8rem;
  color: #5f6368;
}

.g-select-container {
  border-radius: 999px;
  border: 1px solid #dadce0;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  padding-right: 0.6rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.g-select-input {
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

.g-select-input::placeholder {
  color: #9aa0a6;
}

/* Tamaños */
.g-select--sm .g-select-input {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.g-select--md .g-select-input {
  padding: 0.4rem 0.7rem;
  font-size: 0.9rem;
}

.g-select--lg .g-select-input {
  padding: 0.55rem 0.9rem;
  font-size: 1rem;
}

/* Focus */
.g-select-container:focus-within {
  border-color: var(--g-select-focus, #1a73e8);
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
}

/* Icono */
.g-select-icon {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
  font-size: 20px;
  color: #5f6368;
  transition: transform 0.15s ease;
}

.g-select-icon-open {
  transform: rotate(180deg);
}

/* Lista ABAJO del input */
.g-select-list {
  position: absolute;
  z-index: 10;
  left: 0;
  top: 100%;          /* siempre debajo */
  margin-top: 0.25rem;
  padding: 0.25rem 0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 8px rgba(60, 64, 67, 0.25);
  max-height: 220px;
  overflow-y: auto;
  list-style: none;
}

.g-select-option {
  padding: 0.35rem 0.8rem;
  font-size: 0.9rem;
  color: #202124;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.g-select-option:hover {
  background-color: #f1f3f4;
}

.g-select-option--selected {
  font-weight: 500;
  background-color: #e8f0fe;
}

.g-select-option--highlighted {
  background-color: #e8f0fe;
}

/* Fade hacia abajo */
.g-select-fade-enter-active,
.g-select-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.g-select-fade-enter-from,
.g-select-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Disabled */
.g-select--disabled .g-select-container {
  background-color: #f1f3f4;
  cursor: default;
}

.g-select--disabled .g-select-input {
  cursor: default;
}

.g-select-error {
  font-size: 0.75rem;
  color: #d93025;
}
</style>
