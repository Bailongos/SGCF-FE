<template>
  <section class="g-form">
    <!-- Header -->
    <header class="g-form-header">
      <div>
        <h2 class="g-form-title">{{ titleToShow }}</h2>
        <p v-if="subtitleToShow" class="g-form-subtitle">
          {{ subtitleToShow }}
        </p>
      </div>
    </header>

    <!-- Mensaje de error simple -->
    <p v-if="alertMessage" class="g-form-error">
      {{ alertMessage }}
    </p>

    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="g-form-body">
      <div class="g-form-grid">
        <!-- Nombre -->
        <GoogleInput
          v-model="form.nombre"
          label="Nombre"
          placeholder="Ej. Juan Pérez"
        />

        <!-- Email -->
        <GoogleInput
          v-model="form.email"
          label="Correo electrónico"
          type="email"
          placeholder="ejemplo@correo.com"
        />

        <!-- Fecha -->
        <GoogleInput
          v-model="form.fecha"
          label="Fecha"
          type="date"
        />

        <!-- Monto -->
        <GoogleInput
          v-model="form.monto"
          label="Monto"
          type="number"
          placeholder="0.00"
        />

        <!-- Select / Combobox -->
        <GoogleSelect
          v-model="form.metodo"
          label="Método / concepto"
          :options="selectOptionsToUse"
          placeholder="Selecciona o escribe para filtrar..."
        />
      </div>

      <!-- Acciones -->
      <div class="g-form-actions">
        <GoogleButton
          v-if="showCancel"
          type="button"
          variant="text"
          color="#5f6368"
          @click="onCancelClick"
        >
          {{ cancelLabelToShow }}
        </GoogleButton>

        <GoogleButton
          type="submit"
          :loading="submitting"
          :disabled="submitting"
        >
          {{ submitLabelToShow }}
        </GoogleButton>
      </div>
    </form>

    <!-- Toast de éxito -->
    <GoogleToast
      v-model="toastVisible"
      :message="toastMessage"
      type="success"
    />

    <!-- Confirm para cancelar -->
    <GoogleConfirmDialog
      v-model="confirmVisible"
      type="danger"
      title="¿Descartar cambios?"
      message="Perderás la información capturada en el formulario."
      confirmText="Sí, descartar"
      cancelText="Seguir editando"
      @confirm="doCancel"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// RUTAS SEGÚN TU ESTRUCTURA (components/formulario/formulario.vue)
import GoogleButton from '../ui/button.vue';
import GoogleInput from '../ui/input.vue';
import GoogleSelect from '../ui/select.vue';
import GoogleToast from '../modal/toast.vue';
import GoogleConfirmDialog from '../modal/alert.vue';

// Si tu GoogleSelect exporta el tipo, puedes importarlo desde ahí.
// Por ahora definimos uno local:
type SelectOption = {
  value: string | number;
  label: string;
};

const props = defineProps<{
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;

  // Opciones para el select
  selectOptions?: SelectOption[];

  // ¿Mostrar toast de éxito?
  showSuccessToast?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: FormDataShape): void;
  (e: 'cancel'): void;
}>();

// Forma base del formulario: la exporto para que la puedas usar en otros componentes
export interface FormDataShape {
  nombre: string;
  email: string;
  fecha: string;
  monto: number | null;
  metodo: string | number | null;
}

const form = ref<FormDataShape>({
  nombre: '',
  email: '',
  fecha: '',
  monto: null,
  metodo: '',
});

const submitting = ref(false);

const alertMessage = ref('');
const toastVisible = ref(false);
const toastMessage = ref('Formulario enviado con éxito');

const confirmVisible = ref(false);

// Textos con default
const titleToShow = computed(
  () => props.title ?? 'Formulario',
);

const subtitleToShow = computed(
  () =>
    props.subtitle ??
    'Captura la información requerida y guarda los cambios.',
);

const submitLabelToShow = computed(
  () => props.submitLabel ?? 'Guardar',
);

const cancelLabelToShow = computed(
  () => props.cancelLabel ?? 'Cancelar',
);

const showCancel = computed(
  () => props.showCancel ?? true,
);

const selectOptionsToUse = computed<SelectOption[]>(() => {
  if (props.selectOptions?.length) return props.selectOptions;
  // Opciones por defecto de ejemplo
  return [
    { value: 'UADEC', label: 'UADEC' },
    { value: 'ESCUELA', label: 'Escuela' },
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta débito/crédito' },
  ];
});

// Helpers
function resetForm() {
  form.value = {
    nombre: '',
    email: '',
    fecha: '',
    monto: null,
    metodo: '',
  };
}

// Validación básica
function validate(): boolean {
  alertMessage.value = '';

  if (!form.value.nombre.trim()) {
    alertMessage.value = 'El nombre es obligatorio.';
    return false;
  }

  if (!form.value.email.trim()) {
    alertMessage.value = 'El correo electrónico es obligatorio.';
    return false;
  }

  if (!form.value.email.includes('@')) {
    alertMessage.value = 'El correo electrónico no es válido.';
    return false;
  }

  if (!form.value.fecha) {
    alertMessage.value = 'La fecha es obligatoria.';
    return false;
  }

  if (form.value.monto == null || Number.isNaN(form.value.monto)) {
    alertMessage.value = 'El monto es obligatorio.';
    return false;
  }

  if (Number(form.value.monto) < 0) {
    alertMessage.value = 'El monto no puede ser negativo.';
    return false;
  }

  if (!form.value.metodo) {
    alertMessage.value = 'Selecciona un método / concepto.';
    return false;
  }

  return true;
}

// Enviar
async function handleSubmit() {
  if (!validate()) return;

  try {
    submitting.value = true;
    const payload: FormDataShape = { ...form.value };

    emit('submit', payload);

    if (props.showSuccessToast ?? true) {
      toastMessage.value = 'Formulario enviado con éxito';
      toastVisible.value = true;
    }

    // Si quieres, descomenta para limpiar después de enviar
    // resetForm();
  } finally {
    submitting.value = false;
  }
}

// Cancelar
function onCancelClick() {
  if (!showCancel.value) return;
  confirmVisible.value = true;
}

function doCancel() {
  resetForm();
  emit('cancel');
}
</script>

<style scoped>
.g-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.g-form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.g-form-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #202124;
}

.g-form-subtitle {
  font-size: 0.9rem;
  color: #5f6368;
  margin-top: 0.25rem;
}

.g-form-error {
  font-size: 0.85rem;
  color: #d93025;
  margin-top: -0.25rem;
}

.g-form-body {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.1rem 1.2rem;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.g-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1rem;
}

@media (max-width: 768px) {
  .g-form-grid {
    grid-template-columns: 1fr;
  }
}

.g-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
