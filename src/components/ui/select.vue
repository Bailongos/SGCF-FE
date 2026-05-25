<template>
  <div
    class="g-select-wrapper"
    :class="[`g-select--${size}`, { 'g-select--disabled': disabled }, attrsClass]"
    :style="attrsStyle"
    ref="wrapperRef"
  >
    <label v-if="label" class="g-select-label">
      {{ label }}
    </label>

    <div
      class="g-select-container"
      :style="{ '--g-select-focus': color }"
      @click="onContainerClick"
      ref="containerRef"
    >
      <input
        class="g-select-input"
        type="text"
        v-bind="inputAttrs"
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

    <Teleport to="body">
      <transition name="g-select-fade">
        <ul
          v-if="isOpen && filteredOptions.length"
          class="g-select-list"
          :style="dropdownStyle"
        >
          <li
            v-for="(opt, index) in filteredOptions"
            :key="String(opt.value)"
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
    </Teleport>

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
  nextTick,
  useAttrs,
  type StyleValue,
} from 'vue';

defineOptions({
  inheritAttrs: false,
});

type Size = 'sm' | 'md' | 'lg';

export interface SelectOption {
  label: string;
  value: string | number | null;
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
const color = computed(() => props.color ?? 'var(--md-sys-color-primary)');
const disabled = computed(() => props.disabled ?? false);
const error = computed(() => props.errorMessage ?? null);
const attrs = useAttrs();

const attrsClass = computed(() => attrs.class as unknown);
const attrsStyle = computed(() => attrs.style as StyleValue | undefined);

const inputAttrs = computed(() => {
  const rest = { ...attrs } as Record<string, unknown>;
  delete rest.class;
  delete rest.style;
  return rest;
});

const wrapperRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const search = ref('');
const highlightedIndex = ref<number>(-1);

const dropdownStyle = ref<{ top: string; left: string; width: string }>({
  top: '0',
  left: '0',
  width: '150px',
});

const selectedOption = computed(() =>
  props.options.find((o) => o.value === props.modelValue) ?? null,
);

watch(
  () => [props.modelValue, props.options],
  ([model]) => {
    if (!isOpen.value) {
      if (model === null || model === undefined || model === '') {
        search.value = '';
      } else {
        search.value = selectedOption.value?.label ?? '';
      }
    }
  },
  { immediate: true },
);

const filteredOptions = computed(() => {
  const term = search.value.toLowerCase().trim();
  if (!term) return props.options;
  return props.options.filter((o) =>
    o.label.toLowerCase().includes(term),
  );
});

function updateDropdownPosition() {
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const vw = window.innerWidth;
  const gap = 8;

  let left = rect.left;
  let width = rect.width;

  if (left + width > vw - gap) {
    const overflow = left + width - (vw - gap);
    left = Math.max(gap, left - overflow);
    width = Math.min(width, vw - left - gap);
  }

  dropdownStyle.value = {
    top: `${rect.bottom + 2}px`,
    left: `${left}px`,
    width: `${width}px`,
  };
}

function addDropdownListeners() {
  window.addEventListener('resize', updateDropdownPosition);
  window.addEventListener('scroll', updateDropdownPosition, true);
}

function removeDropdownListeners() {
  window.removeEventListener('resize', updateDropdownPosition);
  window.removeEventListener('scroll', updateDropdownPosition, true);
}

function open() {
  if (disabled.value) return;
  isOpen.value = true;
  search.value = '';
  highlightedIndex.value = filteredOptions.value.findIndex(
    (o) => o.value === props.modelValue,
  );
  nextTick(() => {
    updateDropdownPosition();
    addDropdownListeners();
  });
}

function close() {
  isOpen.value = false;
  highlightedIndex.value = -1;
  removeDropdownListeners();
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    search.value = '';
  } else {
    search.value = selectedOption.value?.label ?? '';
  }
}

function onContainerClick() {
  if (disabled.value) return;
  if (!isOpen.value) open();
}

function selectOption(opt: SelectOption) {
  search.value = opt.label;
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
  close();
}

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
  removeDropdownListeners();
});
</script>

<style scoped>
.g-select-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.g-select-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.g-select-container {
  border-radius: 4px;
  border: 1px solid var(--md-sys-color-outline);
  background: var(--md-sys-color-surface);
  display: flex;
  align-items: center;
  padding-right: 0.4rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.g-select-container:hover {
  border-color: var(--md-sys-color-on-surface-variant);
}

.g-select-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.45rem 0.75rem;
  border-radius: 4px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface);
}

.g-select-input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.6;
}

.g-select--sm .g-select-input {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.g-select--md .g-select-input {
  padding: 0.45rem 0.75rem;
  font-size: 0.875rem;
}

.g-select--lg .g-select-input {
  padding: 0.55rem 0.9rem;
  font-size: 1rem;
}

.g-select-container:focus-within {
  border-color: var(--g-select-focus, var(--md-sys-color-primary));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-sys-color-primary), transparent 85%);
}

.g-select-icon {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant);
  transition: transform 0.15s ease;
}

.g-select-icon-open {
  transform: rotate(180deg);
}

.g-select-list {
  position: fixed;
  z-index: 9999;
  padding: 0.25rem;
  border-radius: 4px;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline);
  box-shadow: var(--shadow-lg);
  max-height: 240px;
  overflow-y: auto;
  list-style: none;
}

.g-select-option {
  padding: 0.4rem 0.7rem;
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: background 0.12s ease;
}

.g-select-option:hover {
  background: var(--md-sys-color-surface-container);
}

.g-select-option--selected {
  font-weight: 600;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-primary);
}

.g-select-option--highlighted {
  background: var(--md-sys-color-surface-container-high);
}

.g-select-fade-enter-active,
.g-select-fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.g-select-fade-enter-from,
.g-select-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.g-select--disabled .g-select-container {
  background: var(--md-sys-color-surface-variant);
  opacity: 0.5;
  cursor: not-allowed;
}

.g-select--disabled .g-select-input {
  cursor: not-allowed;
}

.g-select-error {
  font-size: 0.72rem;
  color: var(--md-sys-color-error);
  margin: 0.1rem 0 0 0;
  font-weight: 500;
}

@media (max-width: 600px) {
  .g-select-input {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
  }

  .g-select-list {
    max-width: calc(100vw - 16px);
    left: 8px !important;
    right: 8px !important;
  }
}
</style>
