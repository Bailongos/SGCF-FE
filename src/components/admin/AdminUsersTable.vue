<template>
  <div class="users-table-shell">
    <p v-if="error" class="table-error">{{ error }}</p>

    <div v-else-if="loading" class="table-state">Cargando usuarios...</div>

    <div v-else-if="!rows.length" class="table-state">
      No hay usuarios que coincidan con los filtros.
    </div>

    <div v-else class="table-wrapper">
      <table class="users-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Carrera</th>
            <th>Estado</th>
            <th>Metodos de acceso</th>
            <th v-if="showCreatedAt">Creacion</th>
            <th class="actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id_usuario">
            <td class="username-cell">{{ row.username }}</td>
            <td>{{ row.email || '-' }}</td>
            <td>{{ row.rolLabel }}</td>
            <td>{{ row.carreraLabel }}</td>
            <td>
              <span class="status-badge" :class="`status-${row.status}`">
                {{ row.statusLabel }}
              </span>
            </td>
            <td>
              <div class="access-chips">
                <span class="access-chip" :class="row.hasLocal ? 'access-on' : 'access-off'">Local</span>
                <span class="access-chip" :class="row.hasGoogle ? 'access-on' : 'access-off'">Google</span>
                <span class="access-chip" :class="row.hasMicrosoft ? 'access-on' : 'access-off'">Microsoft</span>
              </div>
            </td>
            <td v-if="showCreatedAt">{{ row.createdAtLabel || '-' }}</td>
            <td class="actions-cell">
              <button type="button" class="row-action row-action-edit" @click="emit('edit', row)">
                Editar
              </button>
              <button
                type="button"
                class="row-action"
                :class="row.isActive ? 'row-action-disable' : 'row-action-enable'"
                @click="emit('toggle-active', row)"
              >
                {{ row.isActive ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface AdminUserTableRow {
  id_usuario: number;
  username: string;
  email: string;
  rolLabel: string;
  carreraLabel: string;
  status: 'activo' | 'inactivo' | 'pendiente';
  statusLabel: string;
  isActive: boolean;
  hasLocal: boolean;
  hasGoogle: boolean;
  hasMicrosoft: boolean;
  createdAtLabel?: string;
}

defineProps<{
  rows: AdminUserTableRow[];
  loading: boolean;
  error: string | null;
  showCreatedAt: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', row: AdminUserTableRow): void;
  (e: 'toggle-active', row: AdminUserTableRow): void;
}>();
</script>

<style scoped>
.table-error {
  margin: 0;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border: 1px solid var(--md-sys-color-error);
}

.table-state {
  padding: 1.2rem;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  border: 1px dashed var(--md-sys-color-outline-variant);
  border-radius: 12px;
  background: var(--md-sys-color-surface-container);
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 14px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--md-sys-color-surface);
}

.users-table th,
.users-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  text-align: left;
  font-size: 0.85rem;
  vertical-align: middle;
  color: var(--md-sys-color-on-surface);
}

.users-table th {
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.username-cell {
  font-weight: 600;
  color: var(--md-sys-color-primary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
  font-size: 0.73rem;
  font-weight: 600;
}

.status-activo {
  background: var(--md-sys-color-success-container);
  color: var(--md-sys-color-on-success-container);
}

.status-inactivo {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.status-pendiente {
  background: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-on-warning-container);
}

.access-chips {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.access-chip {
  border-radius: 999px;
  padding: 0.15rem 0.45rem;
  font-size: 0.72rem;
  border: 1px solid transparent;
}

.access-on {
  background: var(--md-sys-color-info-container);
  color: var(--md-sys-color-on-info-container);
  border-color: var(--md-sys-color-info);
}

.access-off {
  background: var(--md-sys-color-surface-variant);
  color: var(--md-sys-color-on-surface-variant);
  border-color: var(--md-sys-color-outline-variant);
}

.actions-col,
.actions-cell {
  text-align: right;
}

.actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}

.row-action {
  border: 1px solid var(--md-sys-color-outline);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  border-radius: 8px;
  padding: 0.35rem 0.55rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.row-action-edit {
  border-color: var(--md-sys-color-info);
  color: var(--md-sys-color-on-info-container);
  background: var(--md-sys-color-info-container);
}

.row-action-enable {
  border-color: var(--md-sys-color-success);
  background: var(--md-sys-color-success-container);
  color: var(--md-sys-color-on-success-container);
}

.row-action-disable {
  border-color: var(--md-sys-color-error);
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}
</style>
