<!-- src/components/formulario/AlumnosForm.vue -->
<template>
  <GenericForm :title="isEditing ? 'Editar alumno' : 'Nuevo alumno'" :subtitle="formSubtitle"
    :submit-label="isEditing ? 'Actualizar alumno' : 'Guardar alumno'" cancel-label="Cancelar edición"
    :show-cancel="isEditing" :submitting="loading" @submit="onSubmitWrapper" @cancel="onCancelWrapper"
    class="alumnos-form">
    <!-- Chip "Editando" en el header derecho -->
    <template #header-right>
      <span v-if="isEditing && form.matricula" class="chip chip-primary">
        Editando: {{ form.matricula }}
      </span>
    </template>

    <!-- 👇 Campos del formulario (slot por defecto del GenericForm) -->

    <!-- Matrícula -->
    <GoogleInput v-model="form.matricula" label="Matrícula *" placeholder="Ej. 190123" :disabled="isEditing" required />

    <!-- Nombre completo -->
    <GoogleInput v-model="form.nombre_completo" label="Nombre completo *" placeholder="Nombre y apellidos" required />

    <!-- Email institucional -->
    <GoogleInput v-model="form.email_institucional" label="Email institucional" type="email"
      placeholder="nombre@uadec.mx" />

    <!-- Teléfono -->
    <GoogleInput v-model="form.telefono_contacto" label="Teléfono" placeholder="871-000-0000" />

    <!-- Carrera (select googlesco) -->
    <GoogleSelect v-model="form.id_carrera" label="Plan de Estudio *" :options="carreraOptions"
      placeholder="Selecciona un plan de estudio" required />
    <small v-if="!carreras.length" class="hint">
      No hay planes de estudio cargados. Ve al módulo correspondiente para crear algunos.
    </small>

    <!-- Semestre -->
    <GoogleInput v-model="form.semestre_actual" label="Semestre *" type="number" min="1" required />

    <!-- Activo -->
    <label class="field field-checkbox active-status-field">
      <input v-model="form.activo" type="checkbox" />
      <span>Activo</span>
    </label>

    <!-- Sección: Cuentas por cobrar iniciales (opcional) solo si no estamos editando -->
    <div v-if="!isEditing && enableInitialDebt" class="initial-debt-section">
      <div class="divider"></div>
      <div class="debt-header-row">
        <p class="font-bold">Cuentas por cobrar iniciales (opcional)</p>
        <GoogleButton type="button" variant="text" size="sm" @click="addAdeudo" style="color: #1a73e8;">
          <span class="material-symbols-outlined">add_circle</span>
          Añadir concepto
        </GoogleButton>
      </div>

      <p v-if="!form.adeudos?.length" class="hint">
        Puedes guardar el alumno sin adeudos o añadir uno o varios conceptos.
      </p>

      <div v-if="form.adeudos?.length" class="g-page-animate">
        <div v-for="(adeudo, idx) in form.adeudos" :key="idx" class="adeudo-card border-card">
          <div class="adeudo-grid">
            <GoogleSelect v-model="adeudo.concepto" label="Concepto *" :options="conceptoOptions"
              placeholder="Selecciona concepto..." required @update:modelValue="onConceptoChange($event, adeudo)" />
            <GoogleSelect v-model="adeudo.id_ciclo" label="Ciclo Escolar *" :options="cicloOptions"
              placeholder="Selecciona ciclo..." required />
            <GoogleInput v-model.number="adeudo.monto" label="Monto *" type="number" step="0.01" min="0"
              placeholder="0.00" required />
            <div class="field-full">
              <label class="field field-checkbox">
                <input v-model="adeudo.pagado" type="checkbox" />
                <span>Ya está pagado</span>
              </label>
            </div>

            <template v-if="adeudo.pagado">
              <GoogleInput v-model="adeudo.fecha_pago" label="Fecha de pago" type="date" />
              <GoogleSelect v-model="adeudo.id_metodo" label="Método de pago" :options="metodoOptions"
                placeholder="Selecciona método..." />
            </template>
          </div>
          <button type="button" class="icon-button icon-danger remove-btn-adeudo" title="Eliminar concepto"
            @click="removeAdeudo(idx)">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Acciones extra a la derecha (plantilla y carga masiva) -->
    <template #actions-right>
      <GoogleButton type="button" variant="text" @click="emit('download-template')">
        ⬇️ Plantilla Excel
      </GoogleButton>

      <GoogleButton type="button" variant="outlined" @click="emit('open-bulk-modal')">
        📤 Carga masiva
      </GoogleButton>

      <GoogleButton type="submit" :loading="loading" :disabled="loading">
        <span v-if="isEditing">Actualizar alumno</span>
        <span v-else>Guardar alumno</span>
      </GoogleButton>
    </template>
  </GenericForm>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AlumnoCreate } from '../../services/alumnos';
import type { Carrera } from '../../services/carreras';
import type { Concepto } from '../../services/conceptos';
import type { CicloEscolar } from '../../services/ciclos-escolares';
import type { MetodoPago } from '../../services/metodo-pago';

// Shell de formulario genérico
import GenericForm from './formulario.vue';

// Inputs/UI
import GoogleInput from '../ui/input.vue';
import GoogleSelect from '../ui/select.vue';
import GoogleButton from '../ui/button.vue';

export type AdeudoFormModel = {
  concepto: string;
  monto: number;
  pagado: boolean;
  id_ciclo?: number;
  fecha_pago?: string | null;
  id_metodo?: number | null;
};

export type AlumnoFormModel = AlumnoCreate & {
  activo: boolean;
  // Campos extra para adeudo inicial
  con_adeudo?: boolean;
  adeudos?: AdeudoFormModel[];
};

const props = defineProps<{
  form: AlumnoFormModel;
  carreras: Carrera[];
  conceptos?: Concepto[];
  ciclos?: CicloEscolar[];
  metodosPago?: MetodoPago[];
  enableInitialDebt?: boolean;
  isEditing: boolean;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel-edit'): void;
  (e: 'download-template'): void;
  (e: 'open-bulk-modal'): void;
}>();

// Texto del subtítulo
const formSubtitle = computed(() =>
  props.isEditing
    ? 'Completa los campos obligatorios para actualizar el registro seleccionado.'
    : 'Completa los campos obligatorios para registrar un nuevo alumno.',
);

const enableInitialDebt = computed(() => props.enableInitialDebt ?? false);

// Options para el GoogleSelect
const carreraOptions = computed(() =>
  props.carreras.map((c) => ({
    value: c.id_carrera,
    label: `${c.nombre} (${c.duracion_semestres} semestres)`,
  })),
);

const conceptoOptions = computed(() =>
  (props.conceptos || []).map((c) => ({
    value: c.clave,
    label: `${c.descripcion} ($${c.monto_default})`,
  })),
);

const cicloOptions = computed(() =>
  (props.ciclos || []).map((c) => ({
    value: c.id_ciclo,
    label: c.nombre,
  })),
);

const metodoOptions = computed(() =>
  (props.metodosPago || []).map((m) => ({
    value: m.id_metodo,
    label: m.nombre,
  })),
);

// Wrappers para conectar GenericForm con el padre (vista)
function onSubmitWrapper() {
  emit('submit');
}

function onCancelWrapper() {
  emit('cancel-edit');
}

function addAdeudo() {
  if (!props.form.adeudos) {
    props.form.adeudos = [];
  }

  const defaultCiclo = props.ciclos?.find(c => c.es_actual)?.id_ciclo ?? props.ciclos?.[0]?.id_ciclo;
  const defaultConcepto = props.conceptos?.[0];

  props.form.adeudos.push({
    concepto: defaultConcepto?.clave ?? '',
    monto: Number(defaultConcepto?.monto_default ?? 0),
    pagado: false,
    id_ciclo: defaultCiclo,
    fecha_pago: null,
    id_metodo: null
  });
}

function removeAdeudo(index: number) {
  if (props.form.adeudos) {
    props.form.adeudos.splice(index, 1);
  }
}

function onConceptoChange(val: string | number | null, adeudo: AdeudoFormModel) {
  if (val === null) return;
  const concepto = props.conceptos?.find((c) => c.clave === String(val));
  if (concepto) {
    adeudo.monto = Number(concepto.monto_default ?? 0);
  }
}
</script>

<style scoped>
/* Solo estilos específicos de este form, el card y layout los pone GenericForm+SectionCard */

.field-checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.active-status-field {
  grid-column: 1 / -1;
  margin-top: 0.25rem;
  margin-bottom: 0.15rem;
}

.initial-debt-section {
  grid-column: 1 / -1;
}

.debt-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.font-bold {
  font-weight: 600;
}

.divider {
  height: 1px;
  background: #e0e0e0;
  margin: 1.5rem 0;
}

.adeudo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.border-card {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e8eaed;
  gap: 1rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.1);
  transition: box-shadow 0.2s;
}

.border-card:hover {
  box-shadow: 0 4px 12px rgba(60, 64, 67, 0.08);
}

.adeudo-card .adeudo-grid {
  flex: 1;
}

.remove-btn-adeudo {
  margin-top: 1.5rem;
}

.add-more-container {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.5rem;
}

.field-full {
  grid-column: span 2;
}

/* Animación suave */
.g-page-animate {
  animation: g-fade-in 180ms ease-out;
}

@keyframes g-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hint {
  font-size: 0.75rem;
  color: #a0a4a8;
  margin-top: 0.15rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  border: 1px solid transparent;
}

.chip-primary {
  background: #e8f0fe;
  border-color: #d2e3fc;
  color: #1a73e8;
}
</style>
