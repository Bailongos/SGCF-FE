<template>
    <section class="page g-page-animate">
        <!-- Header estilo Google -->
        <header class="page-header">
            <div>
                <h2 class="page-title">Conceptos de pago</h2>
                <p class="page-subtitle">
                    Catálogo de conceptos, clave, monto base y generación automática de cuentas.
                </p>
            </div>

            <div class="page-header-meta">
                <span class="chip chip-soft">
                    Conceptos: <strong>{{ conceptos.length }}</strong>
                </span>
                <span class="chip chip-soft">
                    Generan cuenta:
                    <strong>{{ totalGeneranCuenta }}</strong>
                </span>

                <GoogleButton size="sm" @click="openCreateForm">
                    <span class="material-symbols-outlined">add</span>
                    Nuevo concepto
                </GoogleButton>
            </div>
        </header>

        <!-- Tabla genérica googlesca -->
        <GoogleTable :rows="conceptos" :columns="conceptosColumns" rowKey="clave" :loading="loadingList"
            v-model:search="search"
            title="Listado de conceptos" subtitle="Consulta, edita o elimina conceptos de pago." icon="sell"
            :showReload="true" :useDefaultActions="true"
            emptyMessage="No hay conceptos que coincidan con el filtro." @reload="loadConceptos" @edit="onEdit"
            @delete="onDelete" />

        <!-- Modal Crear / Editar concepto -->
        <GoogleModal v-model="showFormModal" :icon="isEditing ? 'edit' : 'note_add'"
            :title="isEditing ? 'Editar concepto' : 'Nuevo concepto'"
            subtitle="Define la clave, descripción, monto base y si el concepto genera cuenta automáticamente."
            maxWidth="640px" density="comfortable" :confirmLoading="loadingSave"
            :confirmText="isEditing ? 'Actualizar' : 'Guardar'" cancelText="Cancelar" @confirm="handleFormSubmit"
            @cancel="handleCancelForm" :showAddAnother="!isEditing" v-model:addAnother="addAnother">
            <form @submit.prevent="handleFormSubmit" class="concepto-form">
                <template v-if="isEditing">
                    <div class="concepto-form-grid">
                        <GoogleInput v-model.trim="form.clave" label="Clave *" placeholder="Ej. UADEC, ESCUELA"
                            :disabled="isEditing" required />
                        <GoogleInput v-model.trim="form.descripcion" label="Descripción *"
                            placeholder="Ej. Colegiatura UADEC" required />
                        <GoogleInput v-model="form.monto_default" label="Monto base *" type="number" step="0.01" min="0"
                            placeholder="0.00" required />
                        <label class="field-checkbox span-2">
                            <input v-model="form.genera_cuenta_default" type="checkbox" />
                            <span>Generar cuenta automáticamente por este concepto</span>
                        </label>
                    </div>
                </template>

                <template v-else>
                    <div v-for="(item, index) in formsList" :key="index" class="concepto-form-row">
                        <div class="concepto-form-grid">
                            <GoogleInput v-model.trim="item.clave" :label="`Clave ${index + 1} *`"
                                placeholder="Ej. UADEC, ESCUELA" required />
                            <GoogleInput v-model.trim="item.descripcion" label="Descripción *"
                                placeholder="Ej. Colegiatura UADEC" required />
                            <GoogleInput v-model="item.monto_default" label="Monto base *" type="number" step="0.01"
                                min="0" placeholder="0.00" required />
                            <label class="field-checkbox">
                                <input v-model="item.genera_cuenta_default" type="checkbox" />
                                <span>Generar auto.</span>
                            </label>
                        </div>
                        <button v-if="formsList.length > 1" type="button" class="icon-button icon-danger remove-btn"
                            title="Eliminar" @click="removeForm(index)">
                            <span class="material-symbols-outlined">remove_circle</span>
                        </button>
                    </div>

                    <div class="add-more-container">
                        <GoogleButton type="button" variant="text" size="sm" @click="addForm"
                            style="margin-top: 0.5rem;">
                            <span class="material-symbols-outlined">add_circle</span>
                            Añadir otro concepto
                        </GoogleButton>
                    </div>
                </template>

                <p class="concepto-hint mt-3">
                    La clave se usa como identificador único del concepto. El monto base se puede
                    ajustar después en las cuentas específicas.
                </p>
            </form>
        </GoogleModal>

        <ConfirmModal v-model="showDeleteConfirm" title="Eliminar concepto"
          :message="`¿Eliminar concepto ${deleteTarget?.clave}?`" variant="danger" confirmText="Eliminar"
          @confirm="onDeleteConfirm" />
    </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from '../../composables/useToast';

import GoogleButton from '../../components/ui/button.vue';
import GoogleInput from '../../components/ui/input.vue';
import GoogleModal from '../../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../../components/ui/table.vue';
import ConfirmModal from '../../components/modal/ConfirmModal.vue';

import {
    getConceptos,
    createConcepto,
    updateConcepto,
    deleteConcepto,
    type Concepto,
    type ConceptoPayload,
} from '../../services/conceptos';

const emit = defineEmits(['update']);
const toast = useToast();

// ---- STATE ----
const conceptos = ref<Concepto[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);

const isEditing = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Concepto | null>(null);
const addAnother = ref(false);
const search = ref('');

// Modal formulario
const showFormModal = ref(false);

type ConceptoForm = ConceptoPayload;

const form = ref<ConceptoForm>({
    clave: '',
    descripcion: '',
    monto_default: 0,
    genera_cuenta_default: false,
});

const formsList = ref<ConceptoForm[]>([
    { clave: '', descripcion: '', monto_default: 0, genera_cuenta_default: false }
]);

function addForm() {
    formsList.value.push({ clave: '', descripcion: '', monto_default: 0, genera_cuenta_default: false });
}

function removeForm(index: number) {
    formsList.value.splice(index, 1);
}


// ---- HELPERS ----
function resetForm() {
    form.value = {
        clave: '',
        descripcion: '',
        monto_default: 0,
        genera_cuenta_default: false,
    };
    formsList.value = [
        { clave: '', descripcion: '', monto_default: 0, genera_cuenta_default: false }
    ];
    isEditing.value = false;
}

function formatMoney(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    });
}

const totalGeneranCuenta = computed(
    () => conceptos.value.filter((c) => c.genera_cuenta_default).length,
);

// Columnas para GoogleTable
const conceptosColumns: TableColumn[] = [
    { key: 'clave', label: 'Clave', width: '120px' },
    { key: 'descripcion', label: 'Descripción' },
    {
        key: 'monto_default',
        label: 'Monto base',
        align: 'right',
        formatter: (row: Concepto) => formatMoney(row.monto_default),
    },
    {
        key: 'genera_cuenta_default',
        label: 'Genera cuenta',
        width: '130px',
        align: 'center',
        formatter: (row: Concepto) => (row.genera_cuenta_default ? 'Sí' : 'No'),
    },
];

// ---- API CALLS ----
async function loadConceptos() {
    try {
        loadingList.value = true;
        const resp = await getConceptos();
        conceptos.value = resp;
    } catch (e) {
        console.error('[ConceptosManager] Error al cargar conceptos', e);
        toast.error('Error al cargar conceptos');
    } finally {
        loadingList.value = false;
    }
}

// Abre modal para nuevo concepto
function openCreateForm() {
    resetForm();
    isEditing.value = false;
    showFormModal.value = true;
}

// Lógica central para guardar/actualizar
async function saveConcepto() {
    try {
        loadingSave.value = true;

        if (isEditing.value) {
            const payload: ConceptoPayload = {
                clave: form.value.clave.trim(),
                descripcion: form.value.descripcion.trim(),
                monto_default: Number(form.value.monto_default) || 0,
                genera_cuenta_default: form.value.genera_cuenta_default,
            };

            if (!payload.clave || !payload.descripcion) {
                toast.error('La clave y la descripción son obligatorias.');
                return false;
            }
            const updated = await updateConcepto(payload.clave, payload);
            conceptos.value = conceptos.value.map((c) =>
                c.clave === updated.clave ? updated : c,
            );
            toast.success('Concepto actualizado correctamente');
        } else {
            // Guardar multiples
            const newItems = [];
            for (const item of formsList.value) {
                if (!item.clave.trim() || !item.descripcion.trim()) continue;
                const payload: ConceptoPayload = {
                    clave: item.clave.trim(),
                    descripcion: item.descripcion.trim(),
                    monto_default: Number(item.monto_default) || 0,
                    genera_cuenta_default: item.genera_cuenta_default,
                };
                const created = await createConcepto(payload);
                newItems.push(created);
            }

            if (newItems.length === 0) {
                toast.error('Debe rellenar la clave y descripcion para guardar.');
                return false;
            }

            conceptos.value.push(...newItems);
            toast.success(`${newItems.length} concepto(s) creado(s) correctamente`);
        }

        emit('update');
        resetForm();
        return true;
    } catch (e) {
        console.error('[ConceptosManager] Error al guardar concepto', e);
        toast.error(isEditing.value
            ? 'Error al actualizar el concepto'
            : 'Error al crear el/los concepto(s)');
        return false;
    } finally {
        loadingSave.value = false;
    }
}

// submit desde el modal (botón footer o Enter en el form)
async function handleFormSubmit() {
    const ok = await saveConcepto();
    if (ok) {
        showFormModal.value = false;
    }
}

// cancelar desde el modal
function handleCancelForm() {
    resetForm();
    showFormModal.value = false;
}

// Editar desde la tabla
function onEdit(concepto: Concepto) {
    isEditing.value = true;
    form.value = {
        clave: concepto.clave,
        descripcion: concepto.descripcion,
        monto_default: concepto.monto_default,
        genera_cuenta_default: concepto.genera_cuenta_default,
    };
    showFormModal.value = true;
}

// Eliminar desde la tabla
function onDelete(row: Concepto) {
  deleteTarget.value = row;
  showDeleteConfirm.value = true;
}

async function onDeleteConfirm() {
  const row = deleteTarget.value;
  if (!row) return;
  const clave = row.clave;
  try {
    await deleteConcepto(clave);
    conceptos.value = conceptos.value.filter(
      (c) => c.clave !== clave,
    );
    if (form.value.clave === clave) {
      resetForm();
    }
    toast.success('Concepto eliminado correctamente');
    emit('update');
  } catch (e) {
    console.error('[ConceptosManager] Error al eliminar concepto', e);
    toast.error('Error al eliminar el concepto');
  } finally {
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
}

function animateEntrance() {
    const tableRows = document.querySelectorAll('.g-table tbody tr');
    const chips = document.querySelectorAll('.chip');

    if (tableRows.length === 0 && chips.length === 0) return;

    import('animejs').then(({ animate, stagger }) => {
        if (tableRows.length > 0) {
            animate('.g-table tbody tr', {
                opacity: [0, 1],
                translateX: [-12, 0],
                delay: stagger(35),
                duration: 650,
                easing: 'easeOutQuart'
            });
        }

        if (chips.length > 0) {
            animate('.chip', {
                scale: [0.8, 1],
                opacity: [0, 1],
                delay: stagger(55, { start: 150 }),
                duration: 550,
                easing: 'easeOutElastic(1, .8)'
            });
        }
    });
}

onMounted(async () => {
    await loadConceptos();
    setTimeout(animateEntrance, 100);
});
</script>

<style scoped>
.page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Animación suave tipo Google */
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

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
}

.page-subtitle {
    font-size: 0.9rem;
    color: var(--md-sys-color-on-surface-variant);
    margin-top: 0.25rem;
}

.page-header-meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

/* Chips */

.chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
    font-size: 0.78rem;
    border: 1px solid transparent;
}

.chip-soft {
    background: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface-variant);
}

.chip-primary {
    background: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-on-primary-container);
}

.chip-success {
    background: var(--md-sys-color-tertiary-container);
    border-color: var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-on-tertiary-container);
}

.chip-muted {
    background: var(--md-sys-color-surface-container-high);
    border-color: var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-on-surface-variant);
}

/* Formulario dentro del modal */

.concepto-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.concepto-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem 1rem;
}

@media (max-width: 768px) {
    .concepto-form-grid {
        grid-template-columns: 1fr;
    }
}

.field-checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.25rem;
    font-size: 0.9rem;
    color: var(--md-sys-color-on-surface-variant);
}

.concepto-hint {
    font-size: 0.8rem;
    color: var(--md-sys-color-outline);
    margin-top: 0.15rem;
}


.concepto-form-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px dashed var(--md-sys-color-outline-variant);
}

.concepto-form-row:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.concepto-form-row .concepto-form-grid {
    flex: 1;
}

.remove-btn {
    margin-top: 0.5rem;
    /* Alineado al input, saltando el label */
}

.add-more-container {
    display: flex;
    justify-content: flex-start;
    margin-top: 0.5rem;
}

.span-2 {
    grid-column: span 2;
}

.mt-3 {
    margin-top: 1rem;
}
</style>
