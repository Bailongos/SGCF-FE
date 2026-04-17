<template>
  <section class="page analytics-page g-page-animate">
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" variant="text" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <header class="page-header">
      <div>
        <h2 class="page-title">Analítica de Cobranza</h2>
        <p class="page-subtitle">
          Módulo visual para priorizar decisiones con base en riesgo, concentración de adeudos y recuperación.
        </p>
      </div>

      <div class="page-header-meta">
        <GoogleSelect v-model="selectedCareer" :options="careerFilterOptions" placeholder="Todos los planes" size="sm" />
        <GoogleSelect v-model="topDebtorsLimit" :options="topLimitOptions" placeholder="Top" size="sm" />
        <GoogleButton variant="text" :disabled="loading" @click="loadData">Recargar</GoogleButton>
      </div>
    </header>

    <section class="visibility-panel">
      <div class="visibility-header">
        <h3>Visualizaciones</h3>
        <div class="visibility-actions">
          <GoogleButton variant="text" size="sm" @click="selectAllCharts">Ver todo</GoogleButton>
          <GoogleButton variant="text" size="sm" @click="clearAllCharts">Limpiar</GoogleButton>
        </div>
      </div>

      <div class="visibility-grid">
        <label class="toggle-item">
          <input v-model="visible.metrics" type="checkbox" />
          <span>Indicadores clave</span>
        </label>
        <label class="toggle-item">
          <input v-model="visible.career" type="checkbox" />
          <span>Adeudo por carrera</span>
        </label>
        <label class="toggle-item">
          <input v-model="visible.debtors" type="checkbox" />
          <span>Top deudores</span>
        </label>
        <label class="toggle-item">
          <input v-model="visible.cycle" type="checkbox" />
          <span>Evolución por ciclo</span>
        </label>
      </div>
    </section>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading" class="loading-shell">
      Cargando analítica...
    </div>

    <p v-else-if="!hasAnyChartVisible" class="empty-state">
      Activa al menos una visualización para mostrar la analítica.
    </p>

    <DecisionCharts
      v-else
      :debt-by-career="debtByCareerChart"
      :top-debtors="topDebtorsChart"
      :debt-by-cycle="debtByCycleChart"
      :total-pendiente="totalPendiente"
      :total-pagado="totalPagado"
      :alumnos-con-adeudo="alumnosConAdeudo"
      :show-metrics="visible.metrics"
      :show-career="visible.career"
      :show-debtors="visible.debtors"
      :show-cycle="visible.cycle"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import GoogleButton from '../components/ui/button.vue';
import GoogleSelect from '../components/ui/select.vue';
import DecisionCharts from '../components/dashboard/DecisionCharts.vue';

import { getAlumnos, type Alumno } from '../services/alumnos';
import { getCuentas, type Cuenta } from '../services/cuentas';
import { getCarreras, type Carrera } from '../services/carreras';
import { getCiclosEscolares, type CicloEscolar } from '../services/ciclos-escolares';
import { formatCarreraLabel } from '../utils/carreras';

type VisibleCharts = {
  metrics: boolean;
  career: boolean;
  debtors: boolean;
  cycle: boolean;
};

const STORAGE_KEY = 'analytics.visible.charts';

const loading = ref(false);
const error = ref<string | null>(null);

const alumnos = ref<Alumno[]>([]);
const cuentas = ref<Cuenta[]>([]);
const carreras = ref<Carrera[]>([]);
const ciclos = ref<CicloEscolar[]>([]);

const selectedCareer = ref<number | ''>('');
const topDebtorsLimit = ref<number>(8);

const visible = ref<VisibleCharts>({
  metrics: true,
  career: true,
  debtors: true,
  cycle: true,
});

const topLimitOptions = [
  { value: 5, label: 'Top 5 deudores' },
  { value: 8, label: 'Top 8 deudores' },
  { value: 10, label: 'Top 10 deudores' },
  { value: 15, label: 'Top 15 deudores' },
];

const careerFilterOptions = computed(() => [
  { value: '', label: 'Todos los planes' },
  ...carreras.value.map((carrera) => ({
    value: carrera.id_carrera,
    label: formatCarreraLabel(carrera),
  })),
]);

const filteredAlumnos = computed(() => {
  if (selectedCareer.value === '' || selectedCareer.value === null) {
    return alumnos.value;
  }

  return alumnos.value.filter(
    (alumno) => Number(alumno.id_carrera) === Number(selectedCareer.value),
  );
});

const filteredMatriculaSet = computed(() =>
  new Set(filteredAlumnos.value.map((alumno) => alumno.matricula)),
);

const filteredCuentas = computed(() =>
  cuentas.value.filter((cuenta) => filteredMatriculaSet.value.has(cuenta.matricula)),
);

const pendingByMatricula = computed(() => {
  const grouped = new Map<string, number>();

  filteredCuentas.value.forEach((cuenta) => {
    if (cuenta.pagado) return;
    const current = grouped.get(cuenta.matricula) ?? 0;
    grouped.set(cuenta.matricula, current + Number(cuenta.monto || 0));
  });

  return grouped;
});

const totalPendiente = computed(() =>
  Array.from(pendingByMatricula.value.values()).reduce((sum, monto) => sum + monto, 0),
);

const totalPagado = computed(() =>
  filteredCuentas.value
    .filter((cuenta) => cuenta.pagado)
    .reduce((sum, cuenta) => sum + Number(cuenta.monto || 0), 0),
);

const alumnosConAdeudo = computed(() =>
  Array.from(pendingByMatricula.value.values()).filter((monto) => monto > 0).length,
);

const debtByCareerChart = computed(() => {
  const grouped = new Map<number, number>();

  filteredAlumnos.value.forEach((alumno) => {
    const pending = pendingByMatricula.value.get(alumno.matricula) ?? 0;
    if (!pending) return;

    const idCarrera = Number(alumno.id_carrera);
    const current = grouped.get(idCarrera) ?? 0;
    grouped.set(idCarrera, current + pending);
  });

  return Array.from(grouped.entries())
    .map(([idCarrera, value]) => ({
      label: getCarreraLabel(idCarrera),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
});

const topDebtorsChart = computed(() =>
  filteredAlumnos.value
    .map((alumno) => ({
      label: `${alumno.matricula} · ${alumno.nombre_completo}`,
      value: pendingByMatricula.value.get(alumno.matricula) ?? 0,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, Number(topDebtorsLimit.value || 8)),
);

const debtByCycleChart = computed(() => {
  const grouped = new Map<number, { pendiente: number; pagado: number }>();

  filteredCuentas.value.forEach((cuenta) => {
    const idCiclo = Number(cuenta.id_ciclo);
    if (!Number.isFinite(idCiclo)) return;

    const current = grouped.get(idCiclo) ?? { pendiente: 0, pagado: 0 };
    const monto = Number(cuenta.monto || 0);

    if (cuenta.pagado) {
      current.pagado += monto;
    } else {
      current.pendiente += monto;
    }

    grouped.set(idCiclo, current);
  });

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([idCiclo, totals]) => ({
      ciclo: getCicloLabel(idCiclo),
      pendiente: totals.pendiente,
      pagado: totals.pagado,
    }));
});

const hasAnyChartVisible = computed(
  () => visible.value.metrics || visible.value.career || visible.value.debtors || visible.value.cycle,
);

function getCarreraLabel(idCarrera: number): string {
  const found = carreras.value.find((carrera) => Number(carrera.id_carrera) === Number(idCarrera));
  return found ? formatCarreraLabel(found) : `Carrera ${idCarrera}`;
}

function getCicloLabel(idCiclo: number): string {
  const found = ciclos.value.find((ciclo) => Number(ciclo.id_ciclo) === Number(idCiclo));
  return found?.nombre ?? `Ciclo ${idCiclo}`;
}

function selectAllCharts() {
  visible.value = {
    metrics: true,
    career: true,
    debtors: true,
    cycle: true,
  };
}

function clearAllCharts() {
  visible.value = {
    metrics: false,
    career: false,
    debtors: false,
    cycle: false,
  };
}

function restoreVisibleCharts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Partial<VisibleCharts>;
    visible.value = {
      metrics: parsed.metrics ?? true,
      career: parsed.career ?? true,
      debtors: parsed.debtors ?? true,
      cycle: parsed.cycle ?? true,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const [alumnosData, cuentasData, carrerasData, ciclosData] = await Promise.all([
      getAlumnos(),
      getCuentas(),
      getCarreras(),
      getCiclosEscolares(),
    ]);

    alumnos.value = alumnosData;
    cuentas.value = cuentasData;
    carreras.value = carrerasData;
    ciclos.value = ciclosData;
  } catch (err: any) {
    console.error(err);
    error.value = `No se pudo cargar la analítica: ${err?.response?.data?.message ?? err?.message ?? 'Error desconocido'}`;
  } finally {
    loading.value = false;
  }
}

watch(
  () => visible.value,
  (current) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  },
  { deep: true },
);

onMounted(async () => {
  restoreVisibleCharts();
  await loadData();
});
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.back-to-home {
  margin-bottom: 0.35rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
}

.page-title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  font-size: 1.48rem;
}

.page-subtitle {
  margin: 0.2rem 0 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.9rem;
}

.page-header-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 460px;
}

.visibility-panel {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 14px;
  background: var(--md-sys-color-surface-container);
  padding: 0.8rem 0.9rem;
}

.visibility-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.visibility-header h3 {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  font-size: 0.92rem;
}

.visibility-actions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.visibility-grid {
  margin-top: 0.65rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
}

.toggle-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--md-sys-color-on-surface);
  font-size: 0.84rem;
  user-select: none;
}

.toggle-item input {
  width: 16px;
  height: 16px;
  accent-color: var(--md-sys-color-primary);
}

.loading-shell,
.empty-state {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 12px;
  padding: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  background: var(--md-sys-color-surface);
}

.error {
  color: var(--md-sys-color-error);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 12px;
  padding: 0.75rem;
  background: var(--md-sys-color-error-container);
}

@media (max-width: 1100px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header-meta {
    min-width: 0;
    width: 100%;
  }

  .visibility-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-header-meta {
    flex-direction: column;
    align-items: stretch;
  }

  .visibility-grid {
    grid-template-columns: 1fr;
  }
}
</style>
