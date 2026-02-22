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
  background: #fdeceb;
  color: #b3261e;
  border: 1px solid #f6c8c4;
}

.table-state {
  padding: 1.2rem;
  text-align: center;
  color: #5f6368;
  border: 1px dashed #dadce0;
  border-radius: 12px;
  background: #fafbfc;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e4e7eb;
  border-radius: 14px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.users-table th,
.users-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eef1f3;
  text-align: left;
  font-size: 0.85rem;
  vertical-align: middle;
}

.users-table th {
  background: #f8f9fa;
  color: #3c4043;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.username-cell {
  font-weight: 600;
  color: #174ea6;
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
  background: #e6f4ea;
  color: #137333;
}

.status-inactivo {
  background: #fdeceb;
  color: #b3261e;
}

.status-pendiente {
  background: #fff3cd;
  color: #8a6100;
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
  background: #e8f0fe;
  color: #174ea6;
  border-color: #c6dafc;
}

.access-off {
  background: #f1f3f4;
  color: #5f6368;
  border-color: #e0e3e7;
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
  border: 1px solid #d7dce1;
  background: #fff;
  color: #3c4043;
  border-radius: 8px;
  padding: 0.35rem 0.55rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.row-action-edit {
  border-color: #c6dafc;
  color: #174ea6;
  background: #e8f0fe;
}

.row-action-enable {
  border-color: #b7dfc7;
  background: #e6f4ea;
  color: #137333;
}

.row-action-disable {
  border-color: #f6c8c4;
  background: #fdeceb;
  color: #b3261e;
}
</style>
