<!-- src/components/ui/calendar.vue -->
<template>
  <div
    class="g-date-picker"
    :class="[`g-date-picker--${size}`, { 'g-date-picker--disabled': disabled }]"
    ref="wrapperRef"
  >
    <!-- Label -->
    <label v-if="label" class="g-date-picker-label">
      {{ label }}
    </label>

    <!-- Input estilo Google -->
    <div
      class="g-date-picker-field"
      :style="{ '--g-date-picker-focus': color }"
      @click="toggleOpen"
    >
      <input
        class="g-date-picker-input"
        type="text"
        :placeholder="placeholder"
        :value="displayValue"
        :disabled="disabled"
        readonly
      />

      <!-- Botón limpiar -->
      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="g-date-picker-icon-btn g-date-picker-clear"
        @click.stop="clearDate"
        aria-label="Limpiar fecha"
      >
        <span class="material-symbols-outlined">close</span>
      </button>

      <!-- Icono calendario -->
      <button
        type="button"
        class="g-date-picker-icon-btn"
        :class="{ 'g-date-picker-icon-btn--open': isOpen }"
        @click.stop="toggleOpen"
        aria-label="Abrir calendario"
      >
        <span class="material-symbols-outlined">event</span>
      </button>
    </div>

    <!-- Dropdown del calendario -->
    <transition name="g-calendar-fade">
      <div
        v-if="isOpen"
        class="g-calendar-popover"
      >
        <div class="g-calendar" :class="{ 'g-calendar--dense': dense }">
          <!-- Header -->
          <header class="g-calendar-header">
            <div class="g-calendar-header-left">
              <span class="g-calendar-month-label">
                {{ monthLabel }} {{ currentYear }}
              </span>
            </div>

            <div class="g-calendar-header-right">
              <button
                type="button"
                class="g-today-btn"
                @click.stop="goToToday"
              >
                Hoy
              </button>

              <button
                type="button"
                class="g-icon-button"
                @click.stop="prevMonth"
                aria-label="Mes anterior"
              >
                <span class="material-symbols-outlined">chevron_left</span>
              </button>

              <button
                type="button"
                class="g-icon-button"
                @click.stop="nextMonth"
                aria-label="Mes siguiente"
              >
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </header>

          <!-- Cabecera días de la semana -->
          <div class="g-calendar-weekdays">
            <div
              v-for="(d, idx) in weekdayLabels"
              :key="idx"
              class="g-calendar-weekday"
            >
              {{ d }}
            </div>
          </div>

          <!-- Grid de días -->
          <div class="g-calendar-grid">
            <button
              v-for="day in daysGrid"
              :key="day.iso"
              type="button"
              class="g-calendar-day"
              :class="{
                'g-calendar-day--other': !day.inCurrentMonth,
                'g-calendar-day--today': day.isToday,
                'g-calendar-day--selected': day.isSelected,
                'g-calendar-day--has-events': day.hasEvents,
              }"
              @click.stop="onDayClick(day)"
            >
              <span class="g-calendar-day-number">
                {{ day.date.getDate() }}
              </span>

              <!-- Indicadores de eventos -->
              <div
                v-if="day.hasEvents"
                class="g-calendar-day-events"
              >
                <span
                  v-for="(ev, i) in day.events"
                  :key="i"
                  class="g-calendar-dot"
                  :style="{ backgroundColor: ev.color || '#1a73e8' }"
                ></span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import GoogleButton from '../ui/button.vue';

export interface CalendarEvent {
  date: string; // 'YYYY-MM-DD'
  label?: string;
  color?: string;
}

type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  modelValue?: string | null;       // fecha seleccionada (YYYY-MM-DD)
  events?: CalendarEvent[];         // eventos por día
  locale?: string;                  // ej. 'es-MX'
  startWeekOnMonday?: boolean;      // true => lunes, false => domingo
  dense?: boolean;

  label?: string;
  placeholder?: string;
  size?: Size;
  color?: string;
  disabled?: boolean;
  clearable?: boolean;
}>(), {
  modelValue: null,
  events: () => [],
  locale: 'es-MX',
  startWeekOnMonday: true,
  dense: false,
  label: '',
  placeholder: 'Selecciona una fecha',
  size: 'md',
  color: '#1a73e8',
  disabled: false,
  clearable: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'change', value: string | null): void;
  (e: 'month-change', payload: { year: number; month: number }): void; // month: 0–11
  (e: 'day-click', payload: { date: string; events: CalendarEvent[] }): void;
}>();

// Helpers de fecha
function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISO(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// Estado visual del picker
const wrapperRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);

const size = computed<Size>(() => props.size ?? 'md');
const color = computed(() => props.color ?? '#1a73e8');
const disabled = computed(() => props.disabled ?? false);

// Estado interno de fecha
const today = new Date();
const selectedDate = ref<Date | null>(
  parseISO(props.modelValue) ?? null,
);

const currentYear = ref(
  selectedDate.value?.getFullYear() ?? today.getFullYear(),
);
const currentMonth = ref(
  selectedDate.value?.getMonth() ?? today.getMonth(), // 0–11
);

// Valor mostrado en el input (localizado)
const displayValue = computed(() => {
  if (!props.modelValue) return '';
  const dt = parseISO(props.modelValue);
  if (!dt) return '';
  try {
    return dt.toLocaleDateString(props.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return props.modelValue;
  }
});

// Reaccionar a cambios externos en modelValue
watch(
  () => props.modelValue,
  (val) => {
    const parsed = parseISO(val);
    selectedDate.value = parsed;
    if (parsed) {
      currentYear.value = parsed.getFullYear();
      currentMonth.value = parsed.getMonth();
    }
  },
);

// Mapa de eventos por día
const eventsMap = computed(() => {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of props.events || []) {
    const key = ev.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
});

// Etiquetas de mes y días
const monthLabel = computed(() => {
  const dt = new Date(currentYear.value, currentMonth.value, 1);
  return dt.toLocaleDateString(props.locale, {
    month: 'long',
  });
});

const weekdayLabels = computed(() => {
  const base = props.startWeekOnMonday
    ? [1, 2, 3, 4, 5, 6, 0]
    : [0, 1, 2, 3, 4, 5, 6];

  return base.map((dow) => {
    const refDate = new Date(2021, 0, 3 + dow); // domingo 3-ene-2021
    return refDate
      .toLocaleDateString(props.locale, { weekday: 'short' })
      .replace('.', '')
      .substring(0, 2)
      .toUpperCase();
  });
});

// Grid de días (6 semanas = 42 celdas)
interface DayCell {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
  events: CalendarEvent[];
}

const daysGrid = computed<DayCell[]>(() => {
  const cells: DayCell[] = [];

  const firstOfMonth = new Date(currentYear.value, currentMonth.value, 1);
  const startWeekDay = props.startWeekOnMonday ? 1 : 0; // 1=Lunes, 0=Domingo

  let offset = firstOfMonth.getDay() - startWeekDay;
  if (offset < 0) offset += 7;

  // 42 celdas (6 filas * 7 columnas)
  for (let i = 0; i < 42; i++) {
    const dt = new Date(
      currentYear.value,
      currentMonth.value,
      1 - offset + i,
    );
    const iso = toISO(dt);

    const inCurrentMonth =
      dt.getMonth() === currentMonth.value &&
      dt.getFullYear() === currentYear.value;

    const isToday =
      dt.getFullYear() === today.getFullYear() &&
      dt.getMonth() === today.getMonth() &&
      dt.getDate() === today.getDate();

    const isSelected = selectedDate.value
      ? dt.getFullYear() === selectedDate.value.getFullYear() &&
        dt.getMonth() === selectedDate.value.getMonth() &&
        dt.getDate() === selectedDate.value.getDate()
      : false;

    const evts = eventsMap.value.get(iso) || [];

    cells.push({
      date: dt,
      iso,
      inCurrentMonth,
      isToday,
      isSelected,
      hasEvents: evts.length > 0,
      events: evts,
    });
  }

  return cells;
});

// Navegación de mes
function changeMonth(delta: number) {
  let m = currentMonth.value + delta;
  let y = currentYear.value;

  if (m < 0) {
    m = 11;
    y -= 1;
  } else if (m > 11) {
    m = 0;
    y += 1;
  }

  currentMonth.value = m;
  currentYear.value = y;
  emit('month-change', { year: y, month: m });
}

function prevMonth() {
  changeMonth(-1);
}

function nextMonth() {
  changeMonth(1);
}

function goToToday() {
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth();
  const iso = toISO(today);
  selectedDate.value = today;
  emit('update:modelValue', iso);
  emit('change', iso);
  isOpen.value = false;
}

// Selección de día
function onDayClick(day: DayCell) {
  selectedDate.value = day.date;
  const iso = day.iso;
  emit('update:modelValue', iso);
  emit('change', iso);
  emit('day-click', { date: iso, events: day.events });
  isOpen.value = false;
}

// Limpiar fecha
function clearDate() {
  selectedDate.value = null;
  emit('update:modelValue', null);
  emit('change', null);
}

// Abrir/cerrar
function toggleOpen() {
  if (disabled.value) return;
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    // al abrir, si hay fecha seleccionada, centramos ese mes
    const base = parseISO(props.modelValue) ?? today;
    currentYear.value = base.getFullYear();
    currentMonth.value = base.getMonth();
  }
}

// Click fuera para cerrar
function handleClickOutside(e: MouseEvent) {
  if (!wrapperRef.value) return;
  if (!wrapperRef.value.contains(e.target as Node)) {
    isOpen.value = false;
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
.g-date-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif;
}

/* Label */
.g-date-picker-label {
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
}

/* Campo principal */
.g-date-picker-field {
  border-radius: 4px 4px 0 0;
  border-bottom: 2px solid var(--md-sys-color-outline);
  background-color: var(--md-sys-color-surface-variant);
  display: flex;
  align-items: center;
  padding-right: 0.4rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.g-date-picker-field:hover {
  background-color: var(--md-sys-color-surface-container);
}

.g-date-picker-field:focus-within {
  border-bottom-color: var(--g-date-picker-focus, var(--md-sys-color-primary));
}

.g-date-picker-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.4rem 0.7rem;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface);
}

.g-date-picker-input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.7;
}

/* Tamaños */
.g-date-picker--sm .g-date-picker-input {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.g-date-picker--md .g-date-picker-input {
  padding: 0.4rem 0.7rem;
  font-size: 0.9rem;
}

.g-date-picker--lg .g-date-picker-input {
  padding: 0.55rem 0.9rem;
  font-size: 1rem;
}

/* Iconos dentro del campo */
.g-date-picker-icon-btn {
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 0.15rem 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: none; /* Reset global button shadow */
  transition: background-color 0.15s ease;
}

.g-date-picker-icon-btn .material-symbols-outlined {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant);
}

.g-date-picker-icon-btn:hover {
  background: var(--md-sys-color-surface-container);
}

.g-date-picker-icon-btn--open {
  background: var(--md-sys-color-primary-container);
}

.g-date-picker-clear .material-symbols-outlined {
  font-size: 16px;
}

/* Disabled */
.g-date-picker--disabled .g-date-picker-field {
  background-color: var(--md-sys-color-surface-variant);
  cursor: default;
}

.g-date-picker--disabled .g-date-picker-input {
  cursor: default;
}

/* Popover calendario */
.g-calendar-popover {
  position: absolute;
  z-index: 30;
  left: 0;
  top: 100%;
  margin-top: 0.25rem;
}

/* Calendario interno */
.g-calendar {
  background: var(--md-sys-color-surface);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--md-sys-color-on-surface);
  min-width: 280px;
}

.g-calendar--dense {
  padding: 0.6rem 0.7rem 0.7rem;
}

/* Header */
.g-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--md-sys-color-surface-container);
  margin-bottom: 0.25rem;
}

.g-calendar-month-label {
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--md-sys-color-on-surface);
}

.g-calendar-header-right {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.g-today-btn {
  border: none;
  background: transparent;
  color: var(--md-sys-color-primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  box-shadow: none;
  transition: background-color 0.15s ease;
}

.g-today-btn:hover {
  background-color: var(--md-sys-color-primary-container);
}

/* Icon button */
.g-icon-button {
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 0.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: none;
  transition: background-color 0.15s ease;
}

.g-icon-button .material-symbols-outlined {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant);
}

.g-icon-button:hover {
  background: var(--md-sys-color-surface-container);
}

/* Weekdays */
.g-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-top: 0.25rem;
}

.g-calendar-weekday {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant);
  padding: 0.2rem 0;
}

/* Grid days */
.g-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: 2.4rem;
  margin-top: 0.25rem;
  gap: 0.2rem;
}

.g-calendar--dense .g-calendar-grid {
  grid-auto-rows: 2rem;
}

/* Day cell */
.g-calendar-day {
  position: relative;
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  outline: none;
  box-shadow: none; /* Reset global button shadow */
  color: var(--md-sys-color-on-surface);
  transition:
    background-color 0.12s ease,
    transform 0.08s ease;
}

.g-calendar-day-number {
  font-size: 0.82rem;
  z-index: 1;
}

/* Estados visuales */
.g-calendar-day--other .g-calendar-day-number {
  color: var(--md-sys-color-outline);
}

.g-calendar-day--today .g-calendar-day-number {
  color: var(--md-sys-color-primary);
  font-weight: 500;
}

.g-calendar-day--selected {
  background: var(--md-sys-color-primary);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.4);
}

.g-calendar-day--selected .g-calendar-day-number {
  color: var(--md-sys-color-on-primary);
  font-weight: 600;
}

.g-calendar-day:hover:not(.g-calendar-day--selected) {
  background: var(--md-sys-color-surface-container-high);
}

.g-calendar-day--selected:hover {
  filter: brightness(0.9);
}

/* Eventos */
.g-calendar-day-events {
  position: absolute;
  bottom: 3px;
  display: flex;
  gap: 2px;
}

.g-calendar-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
}

/* Fade calendario */
.g-calendar-fade-enter-active,
.g-calendar-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.g-calendar-fade-enter-from,
.g-calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Responsive sm */
@media (max-width: 640px) {
  .g-calendar {
    padding: 0.7rem 0.6rem 0.8rem;
  }

  .g-calendar-month-label {
    font-size: 0.95rem;
  }

  .g-calendar-grid {
    grid-auto-rows: 2rem;
  }
}
</style>
