<template>
  <section class="page g-page-animate">
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <div class="cards-grid">
      <!-- CARD 1: Roles -->
      <SectionCard icon="shield_person" title="Roles" subtitle="Selecciona un rol." density="compact">
        <div v-if="!roles.length && !loadingList" class="empty-msg">
          <span class="material-symbols-outlined">shield_person</span>
          <p>No hay roles registrados.</p>
        </div>
        <div v-else class="role-list">
          <div
            v-for="r in roles"
            :key="r.id_rol"
            class="role-row"
            :class="{ selected: selectedRoleId === r.id_rol }"
            @click="selectRole(r.id_rol)"
          >
            <div class="role-row-left">
              <span class="material-symbols-outlined role-row-icon">shield_person</span>
              <div class="role-row-info">
                <span class="role-row-name">{{ r.nombre_rol }}</span>
                <div class="role-row-meta">
                  <span v-if="isRoleAdmin(r.id_rol)" class="role-row-badge">Full Access</span>
                  <span class="role-row-ucount">{{ usersByRole[r.id_rol]?.length ?? 0 }} usr</span>
                </div>
              </div>
            </div>
            <div class="role-row-actions" @click.stop>
              <button class="row-icon-btn" title="Editar" @click="onEdit(r)">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button v-if="!isRoleAdmin(r.id_rol)" class="row-icon-btn row-icon-btn--danger" title="Eliminar" @click="onDelete(r)">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="card-footer">
            <GoogleChip variant="soft"><strong>{{ roles.length }}</strong> roles</GoogleChip>
            <GoogleButton variant="filled" size="sm" @click="openCreateForm">
              <span class="material-symbols-outlined">add</span>
              Nuevo
            </GoogleButton>
          </div>
        </template>
      </SectionCard>

      <!-- CARD 2: Permisos -->
      <SectionCard icon="rule" title="Permisos" :subtitle="selectedRole ? selectedRole.nombre_rol : 'Ningún rol seleccionado.'" density="compact">
        <div v-if="!selectedRole" class="empty-msg">
          <span class="material-symbols-outlined">touch_app</span>
          <p>Selecciona un rol de la lista.</p>
        </div>
        <div v-else-if="isRoleAdmin(selectedRole.id_rol)" class="admin-placeholder">
          <span class="material-symbols-outlined">verified</span>
          <p>El rol Administrador tiene todos los permisos. No se puede modificar.</p>
        </div>
        <div v-else class="permissions-list">
          <div v-for="(groupPerms, category) in permissionsByCategory" :key="category" class="perm-group">
            <h4 class="perm-category">{{ formatCategoryName(category) }}</h4>
            <div class="perm-items">
              <label
                v-for="perm in groupPerms"
                :key="perm.id_permiso"
                class="perm-item"
                :class="{ 'perm-item--active': isPermissionChecked(perm.id_permiso) }"
              >
                <div class="perm-toggle">
                  <input type="checkbox" :checked="isPermissionChecked(perm.id_permiso)"
                    @change="togglePermission(perm.id_permiso)"
                    :disabled="loadingSavePerms" />
                  <span class="perm-toggle-track"></span>
                </div>
                <div class="perm-info">
                  <span class="perm-clave">{{ perm.clave }}</span>
                  <span class="perm-desc" v-if="perm.descripcion">{{ perm.descripcion }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <template #footer v-if="selectedRole && !isRoleAdmin(selectedRole.id_rol)">
          <div class="card-footer card-footer--perms">
            <span class="perms-count">{{ activePermCount }} / {{ permissions.length }} activos</span>
            <GoogleButton variant="filled" size="sm" :loading="loadingSavePerms" @click="savePermissions">
              <span class="material-symbols-outlined">save</span>
              Guardar
            </GoogleButton>
          </div>
        </template>
      </SectionCard>

      <!-- CARD 3: Usuarios -->
      <SectionCard icon="group" title="Usuarios" :subtitle="selectedRole ? selectedRole.nombre_rol : 'Ningún rol seleccionado.'" density="compact">
        <div v-if="!selectedRole" class="empty-msg">
          <span class="material-symbols-outlined">touch_app</span>
          <p>Selecciona un rol de la lista.</p>
        </div>
        <div v-else-if="!usersByRole[selectedRole.id_rol]?.length" class="empty-msg">
          <span class="material-symbols-outlined">person_off</span>
          <p>No hay usuarios con este rol.</p>
        </div>
        <div v-else class="users-list">
          <div v-for="user in usersByRole[selectedRole.id_rol]" :key="user.id_usuario" class="user-item">
            <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
            <div class="user-info">
              <span class="user-name">{{ user.username }}</span>
              <span class="user-status" :class="user.activo ? 'active' : 'inactive'">
                {{ user.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>

    <GoogleModal v-model="showFormModal" :icon="isEditing ? 'shield_person' : 'group_add'"
      :title="isEditing ? 'Editar rol' : 'Nuevo rol'"
      subtitle="Define el nombre del rol." maxWidth="480px"
      density="comfortable" :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar' : 'Guardar'"
      cancelText="Cancelar" @confirm="handleFormSubmit" @cancel="handleCancelForm">
      <form @submit.prevent="handleFormSubmit" class="rol-form">
        <GoogleInput v-model="form.nombre_rol" label="Nombre del rol *"
          placeholder="Ej. Administrador, Coordinador, Caja" required />
      </form>
    </GoogleModal>

    <ConfirmModal v-model="showDeleteConfirm" title="Eliminar rol"
      :message="`¿Eliminar el rol ${deleteTarget?.nombre_rol}?`" variant="danger" confirmText="Eliminar"
      @confirm="onDeleteConfirm" />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';

import SectionCard from '../components/layout/sideCard.vue';
import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleChip from '../components/ui/chip.vue';
import ConfirmModal from '../components/modal/ConfirmModal.vue';

import {
  getRolesPermisos,
  updateRolesPermisos,
  createRol,
  updateRol,
  deleteRol,
  type Rol,
  type RolPayload,
  type Permiso,
  type RolPermiso,
} from '../services/roles';

import { useToast } from '../composables/useToast';

import { getUsuarios, type Usuario } from '../services/usuarios';

const roles = ref<Rol[]>([]);
const permissions = ref<Permiso[]>([]);
const rolPermisos = ref<RolPermiso[]>([]);
const usuarios = ref<Usuario[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const loadingSavePerms = ref(false);
const toast = useToast();

const isEditing = ref(false);
const editingId = ref<number | null>(null);

const selectedRoleId = ref<number | null>(null);
const selectedPermissions = ref<Set<number>>(new Set());

const showFormModal = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Rol | null>(null);

const form = ref<RolPayload>({
  nombre_rol: '',
});

const selectedRole = computed(() =>
  roles.value.find(r => r.id_rol === selectedRoleId.value) ?? null
);

const activePermCount = computed(() => selectedPermissions.value.size);

const usersByRole = computed(() => {
  const map: Record<number, Usuario[]> = {};
  for (const user of usuarios.value) {
    const rol = user.id_rol ?? 0;
    if (!map[rol]) map[rol] = [];
    map[rol].push(user);
  }
  return map;
});

function resetForm() {
  form.value = { nombre_rol: '' };
  isEditing.value = false;
  editingId.value = null;
}

async function loadData() {
  try {
    loadingList.value = true;

    const [rolesData, usersData] = await Promise.all([
      getRolesPermisos(),
      getUsuarios(),
    ]);

    roles.value = rolesData.roles;
    permissions.value = rolesData.permisos;
    rolPermisos.value = rolesData.rol_permisos;
    usuarios.value = usersData;

    if (roles.value.length > 0) {
      const currentId = selectedRoleId.value;
      if (currentId && roles.value.some(r => r.id_rol === currentId)) {
        selectRole(currentId);
      } else {
        const first = roles.value[0];
        if (first) selectRole(first.id_rol);
      }
    }
  } catch (e) {
    console.error(e);
    toast.error('Error al cargar datos');
  } finally {
    loadingList.value = false;
  }
}

function selectRole(id_rol: number) {
  selectedRoleId.value = id_rol;
  const activePermIds = rolPermisos.value
    .filter(rp => rp.id_rol === id_rol)
    .map(rp => rp.id_permiso);
  selectedPermissions.value = new Set(activePermIds);
}

function togglePermission(id_permiso: number) {
  if (selectedPermissions.value.has(id_permiso)) {
    selectedPermissions.value.delete(id_permiso);
  } else {
    selectedPermissions.value.add(id_permiso);
  }
}

function isPermissionChecked(id_permiso: number): boolean {
  return selectedPermissions.value.has(id_permiso);
}

function isRoleAdmin(id_rol: number): boolean {
  const role = roles.value.find(r => r.id_rol === id_rol);
  return role ? /admin/i.test(role.nombre_rol) : false;
}

function formatCategoryName(category: string): string {
  if (!category) return 'Otros';
  const s = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  if (/view|vistas/i.test(s)) return 'Vistas (Pantallas)';
  if (/action|acciones/i.test(s)) return 'Acciones';
  if (/filter|filtros/i.test(s)) return 'Filtros';
  return s;
}

const permissionsByCategory = computed(() => {
  const groups: Record<string, Permiso[]> = {};
  for (const perm of permissions.value) {
    const cat = perm.categoria || 'Otros';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(perm);
  }
  return groups;
});

async function savePermissions() {
  if (!selectedRoleId.value) return;
  if (isRoleAdmin(selectedRoleId.value)) return;

  try {
    loadingSavePerms.value = true;

    const permissionIds = Array.from(selectedPermissions.value);
    await updateRolesPermisos(selectedRoleId.value, permissionIds);

    rolPermisos.value = rolPermisos.value.filter(rp => rp.id_rol !== selectedRoleId.value);
    for (const id_perm of permissionIds) {
      rolPermisos.value.push({ id_rol: selectedRoleId.value, id_permiso: id_perm });
    }

    toast.success('Permisos guardados correctamente');
  } catch (e: any) {
    console.error(e);
    toast.error(`Error al guardar permisos: ${e?.response?.data?.message ?? e?.message ?? 'Error'}`);
  } finally {
    loadingSavePerms.value = false;
  }
}

function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

async function saveRol() {
  try {
    loadingSave.value = true;

    const payload: RolPayload = { nombre_rol: form.value.nombre_rol.trim() };
    if (!payload.nombre_rol) {
      toast.error('El nombre del rol es obligatorio.');
      return;
    }

    if (isEditing.value && editingId.value !== null) {
      const updated = await updateRol(editingId.value, payload);
      roles.value = roles.value.map(r => r.id_rol === updated.id_rol ? updated : r);
    } else {
      const created = await createRol(payload);
      roles.value.push(created);
      selectedRoleId.value = created.id_rol;
      selectRole(created.id_rol);
    }

    resetForm();
  } catch (e: any) {
    console.error(e);
    toast.error(`No se pudo guardar el rol: ${e?.response?.data?.message ?? e?.message ?? 'Error desconocido'}`);
  } finally {
    loadingSave.value = false;
  }
}

async function handleFormSubmit() {
  await saveRol();
  showFormModal.value = false;
}

function handleCancelForm() {
  resetForm();
  showFormModal.value = false;
}

function onEdit(row: Rol) {
  isEditing.value = true;
  editingId.value = row.id_rol;
  form.value = { nombre_rol: row.nombre_rol };
  showFormModal.value = true;
}

function onDelete(row: Rol) {
  deleteTarget.value = row;
  showDeleteConfirm.value = true;
}

async function onDeleteConfirm() {
  const row = deleteTarget.value;
  if (!row) return;
  try {
    await deleteRol(row.id_rol);
    roles.value = roles.value.filter(r => r.id_rol !== row.id_rol);
    if (selectedRoleId.value === row.id_rol) {
      const next = roles.value[0];
      if (next) selectRole(next.id_rol);
      else selectedRoleId.value = null;
    }
  } catch (e: any) {
    toast.error(`Error al eliminar: ${e?.response?.data?.message ?? e?.message ?? 'Error'}`);
  } finally {
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
}

onMounted(loadData);
</script>

<style scoped>
.g-page-animate {
  animation: g-fade-in 180ms ease-out;
}

@keyframes g-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.back-to-home { margin-bottom: 0.75rem; }

/* ── 3-column grid ── */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .cards-grid {
    grid-template-columns: 1fr 1fr;
  }
  .cards-grid > :nth-child(3) {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
  .cards-grid > :nth-child(3) {
    grid-column: auto;
  }
}

/* ── Shared ── */
.empty-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 2rem 0;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-msg p { margin: 0; font-size: 0.85rem; }
.empty-msg span { font-size: 2.2rem; opacity: 0.35; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.card-footer--perms {
  flex-wrap: wrap;
  gap: 0.5rem;
}

.perms-count {
  font-size: 0.78rem;
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}

/* ── Card 1: Roles ── */
.role-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.role-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.65rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s ease;
  border: 1.5px solid transparent;
}

.role-row:hover {
  background: var(--md-sys-color-surface-container);
}

.role-row.selected {
  background: var(--md-sys-color-primary-container);
  border-color: var(--md-sys-color-primary);
}

.role-row-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.role-row-icon {
  font-size: 1.3rem;
  color: var(--md-sys-color-primary);
  background: var(--md-sys-color-surface);
  padding: 0.3rem;
  border-radius: 9px;
  flex-shrink: 0;
}

.role-row.selected .role-row-icon {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.role-row-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.role-row-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.role-row-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.role-row-badge {
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--md-sys-color-primary);
  background: var(--md-sys-color-primary-container);
  padding: 0.06rem 0.4rem;
  border-radius: 999px;
}

.role-row.selected .role-row-badge {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.role-row-ucount {
  font-size: 0.7rem;
  color: var(--md-sys-color-on-surface-variant);
}

.role-row.selected .role-row-ucount {
  color: var(--md-sys-color-primary);
  font-weight: 500;
}

.role-row-actions {
  display: flex;
  gap: 0.15rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.role-row:hover .role-row-actions,
.role-row.selected .role-row-actions {
  opacity: 1;
}

.row-icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.row-icon-btn span { font-size: 1.1rem; }

.row-icon-btn:hover { background: var(--md-sys-color-surface-container); color: var(--md-sys-color-primary); }
.row-icon-btn--danger:hover { background: var(--md-sys-color-error-container); color: var(--md-sys-color-error); }

/* ── Card 2: Permisos ── */
.admin-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 2rem 0;
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
}

.admin-placeholder span {
  font-size: 2.5rem;
  color: var(--md-sys-color-secondary);
}

.admin-placeholder p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.perm-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.perm-category {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--md-sys-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--md-sys-color-outline);
}

.perm-items {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.perm-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s ease;
}

.perm-item:hover { background: var(--md-sys-color-surface-container); }

.perm-item--active { background: var(--md-sys-color-primary-container); }

.perm-item--active:hover {
  background: color-mix(in srgb, var(--md-sys-color-primary-container), var(--md-sys-color-surface-container));
}

.perm-toggle {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.perm-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.perm-toggle-track {
  width: 30px;
  height: 17px;
  border-radius: 999px;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline);
  transition: all 0.2s ease;
  position: relative;
}

.perm-toggle-track::after {
  content: '';
  position: absolute;
  top: 1.5px;
  left: 1.5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--md-sys-color-on-surface-variant);
  transition: all 0.2s ease;
}

.perm-toggle input:checked + .perm-toggle-track {
  background: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-primary);
}

.perm-toggle input:checked + .perm-toggle-track::after {
  transform: translateX(13px);
  background: var(--md-sys-color-on-primary);
}

.perm-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.perm-clave {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  font-family: 'SF Mono', 'Cascadia Code', monospace;
}

.perm-desc {
  font-size: 0.68rem;
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Card 3: Usuarios ── */
.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-height: 500px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.6rem;
  border-radius: 9px;
  transition: background 0.12s ease;
}

.user-item:hover { background: var(--md-sys-color-surface-container); }

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--gradient-primary);
  color: var(--md-sys-color-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.user-status {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.user-status.active { color: var(--md-sys-color-success); }
.user-status.inactive { color: var(--md-sys-color-on-surface-variant); }

/* ── Modal ── */
.rol-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
