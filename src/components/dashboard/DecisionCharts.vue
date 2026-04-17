<template>
  <section class="decision-charts">
    <div v-if="showMetrics" class="decision-metrics">
      <article class="metric-card">
        <span class="metric-label">Cartera pendiente</span>
        <strong class="metric-value">{{ money(totalPendiente) }}</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">Cartera recuperada</span>
        <strong class="metric-value">{{ money(totalPagado) }}</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">Riesgo de morosidad</span>
        <strong class="metric-value">{{ porcentajeMorosidad }}%</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">Alumnos con adeudo</span>
        <strong class="metric-value">{{ alumnosConAdeudo }}</strong>
      </article>
    </div>

    <div class="chart-grid">
      <article v-if="showCareer" class="chart-card">
        <header>
          <h3>Adeudo por carrera</h3>
          <p>Detecta dónde se concentra el riesgo financiero.</p>
        </header>
        <VueApexCharts type="donut" height="320" :options="careerOptions" :series="careerSeries" />
      </article>

      <article v-if="showDebtors" class="chart-card">
        <header>
          <h3>Top alumnos con adeudo</h3>
          <p>Prioriza acciones de cobranza con mayor impacto.</p>
        </header>
        <VueApexCharts type="bar" height="320" :options="debtorOptions" :series="debtorSeries" />
      </article>

      <article v-if="showCycle" class="chart-card chart-card-wide">
        <header>
          <h3>Evolución por ciclo</h3>
          <p>Compara cartera pendiente vs. recuperación para decidir ajustes operativos.</p>
        </header>
        <VueApexCharts type="area" height="320" :options="cycleOptions" :series="cycleSeries" />
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

type MoneyPoint = {
  label: string;
  value: number;
};

type CyclePoint = {
  ciclo: string;
  pendiente: number;
  pagado: number;
};

const props = defineProps<{
  debtByCareer: MoneyPoint[];
  topDebtors: MoneyPoint[];
  debtByCycle: CyclePoint[];
  totalPendiente: number;
  totalPagado: number;
  alumnosConAdeudo: number;
  showMetrics?: boolean;
  showCareer?: boolean;
  showDebtors?: boolean;
  showCycle?: boolean;
}>();

const isMounted = ref(false);
onMounted(() => {
  setTimeout(() => {
    isMounted.value = true;
  }, 150); // Small buffer for DOM stability
});

const showMetrics = computed(() => isMounted.value && (props.showMetrics ?? true));
const showCareer = computed(() => isMounted.value && (props.showCareer ?? true));
const showDebtors = computed(() => isMounted.value && (props.showDebtors ?? true));
const showCycle = computed(() => isMounted.value && (props.showCycle ?? true));

const colorPalette = ['#1a73e8', '#137333', '#f9ab00', '#d93025', '#9334e6', '#00acc1', '#c26401'];

const porcentajeMorosidad = computed(() => {
  const total = Number(props.totalPendiente) + Number(props.totalPagado);
  if (!total) return 0;
  return ((Number(props.totalPendiente) / total) * 100).toFixed(1);
});

const careerSeries = computed(() => {
  const data = props.debtByCareer.map((item) => Number(item.value || 0)).filter((value) => value > 0);
  return data.length ? data : [1];
});

const careerLabels = computed(() => {
  const labels = props.debtByCareer.map((item) => item.label);
  return labels.length ? labels : ['Sin adeudos'];
});

const careerOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
  },
  labels: careerLabels.value,
  colors: colorPalette,
  legend: {
    position: 'bottom' as const,
  },
  dataLabels: {
    formatter: (val: number) => `${val.toFixed(1)}%`,
  },
  tooltip: {
    y: {
      formatter: (value: number) => money(value),
    },
  },
  stroke: {
    width: 0,
  },
}));

const debtorSeries = computed(() => [
  {
    name: 'Adeudo',
    data: props.topDebtors.length
      ? props.topDebtors.map((item) => Number(item.value || 0))
      : [0],
  },
]);

const debtorOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
    },
  },
  colors: ['#d93025'],
  xaxis: {
    categories: props.topDebtors.length ? props.topDebtors.map((item) => item.label) : ['Sin registros'],
    labels: {
      formatter: (value: number) => compactMoney(value),
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => money(value),
    },
  },
  dataLabels: {
    enabled: false,
  },
}));

const cycleSeries = computed(() => [
  {
    name: 'Pendiente',
    data: props.debtByCycle.length
      ? props.debtByCycle.map((item) => Number(item.pendiente || 0))
      : [0],
  },
  {
    name: 'Pagado',
    data: props.debtByCycle.length
      ? props.debtByCycle.map((item) => Number(item.pagado || 0))
      : [0],
  },
]);

const cycleOptions = computed(() => ({
  chart: {
    stacked: false,
    toolbar: { show: false },
  },
  colors: ['#d93025', '#137333'],
  stroke: {
    curve: 'smooth' as const,
    width: 2,
  },
  fill: {
    type: 'gradient' as const,
    gradient: {
      opacityFrom: 0.42,
      opacityTo: 0.06,
    },
  },
  xaxis: {
    categories: props.debtByCycle.length ? props.debtByCycle.map((item) => item.ciclo) : ['Sin ciclos'],
  },
  yaxis: {
    labels: {
      formatter: (value: number) => compactMoney(value),
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => money(value),
    },
  },
  legend: {
    position: 'top' as const,
  },
}));

function money(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function compactMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}
</script>

<style scoped>
.decision-charts {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.decision-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.metric-card {
  border: 1px solid #e8eaed;
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.metric-label {
  display: block;
  color: #5f6368;
  font-size: 0.76rem;
}

.metric-value {
  color: #202124;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.chart-card {
  border: 1px solid #e8eaed;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.8rem;
}

.chart-card h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #202124;
}

.chart-card p {
  margin: 0.2rem 0 0.5rem;
  color: #5f6368;
  font-size: 0.8rem;
}

.chart-card-wide {
  grid-column: 1 / -1;
}

@media (max-width: 1120px) {
  .decision-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }

  .chart-card-wide {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .decision-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
