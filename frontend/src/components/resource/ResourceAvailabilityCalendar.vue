<template>
  <div class="resource-availability-container">
    <!-- 1. TOOLBAR & RANGE CONTROLS -->
    <div v-if="showHeader" class="row items-center justify-between q-mb-md wrap gap-sm">
      <div class="row items-center gap-xs">
        <q-icon name="date_range" size="24px" color="primary" />
        <div>
          <div class="text-subtitle1 text-weight-bold">Resource Availability & Capacity</div>
          <div class="text-caption text-grey-6">
            Day-by-day availability considering working hours, leaves, holidays, and allocations
          </div>
        </div>
      </div>

      <div class="row items-center q-gutter-sm wrap">
        <!-- Preset Range Toggles -->
        <q-btn-toggle
          v-model="rangePreset"
          dense
          unelevated
          toggle-color="primary"
          toggle-text-color="white"
          :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
          :text-color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
          :options="[
            { label: '7 Days', value: '7' },
            { label: '14 Days', value: '14' },
            { label: '30 Days', value: '30' },
            { label: 'Custom', value: 'custom' },
          ]"
          @update:model-value="handlePresetChange"
        />

        <!-- Custom Date Range Pickers (Visible when 'custom' is selected) -->
        <template v-if="rangePreset === 'custom'">
          <q-input
            v-model="customStartDate"
            outlined
            dense
            label="From"
            style="width: 140px"
            @update:model-value="loadAvailability"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="customStartDate"
                    mask="YYYY-MM-DD"
                    @update:model-value="loadAvailability"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-input
            v-model="customEndDate"
            outlined
            dense
            label="To"
            style="width: 140px"
            @update:model-value="loadAvailability"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="customEndDate"
                    mask="YYYY-MM-DD"
                    @update:model-value="loadAvailability"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </template>

        <!-- View Mode: Cards Grid vs Table -->
        <q-btn-toggle
          v-model="viewLayout"
          dense
          unelevated
          toggle-color="primary"
          toggle-text-color="white"
          :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
          :text-color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
          :options="[
            { icon: 'grid_view', value: 'grid' },
            { icon: 'table_rows', value: 'table' },
          ]"
        />

        <!-- Refresh Button -->
        <q-btn
          outline
          dense
          no-caps
          color="grey-7"
          icon="refresh"
          label="Refresh"
          :loading="loading"
          class="q-px-sm"
          @click="loadAvailability"
        />
      </div>
    </div>

    <!-- 2. SUMMARY METRICS CARDS -->
    <div v-if="showSummaryCards && availabilityData" class="row q-col-gutter-sm q-mb-md">
      <!-- Card 1: Total Available Hours -->
      <div class="col-6 col-sm-3">
        <q-card flat bordered class="metric-mini-card bg-avail-soft">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-7">Available Capacity</div>
            <div class="text-h6 text-weight-bold text-positive">
              {{ formatHours(availabilityData.total_available_hours) }}h
            </div>
            <div class="text-caption text-grey-6" style="font-size: 11px">
              Free headroom to schedule
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Card 2: Total Allocated Hours -->
      <div class="col-6 col-sm-3">
        <q-card flat bordered class="metric-mini-card bg-alloc-soft">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-7">Allocated Effort</div>
            <div class="text-h6 text-weight-bold text-primary">
              {{ formatHours(availabilityData.total_allocated_hours) }}h
            </div>
            <div class="text-caption text-grey-6" style="font-size: 11px">
              Booked tasks across projects
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Card 3: Total Leave Hours -->
      <div class="col-6 col-sm-3">
        <q-card flat bordered class="metric-mini-card bg-leave-soft">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-7">Total Leave Hours</div>
            <div class="text-h6 text-weight-bold text-purple-8">
              {{ formatHours(totalLeaveHours) }}h
            </div>
            <div class="text-caption text-grey-6" style="font-size: 11px">
              Approved leave in range
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Card 4: Daily Standard Hours & Non-Working Days -->
      <div class="col-6 col-sm-3">
        <q-card flat bordered class="metric-mini-card bg-grey-soft">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-7">Daily Standard Base</div>
            <div class="text-h6 text-weight-bold text-grey-9">
              {{ formatHours(availabilityData.daily_working_hours) }}h / day
            </div>
            <div class="text-caption text-grey-6 ellipsis" style="font-size: 11px">
              Days off: {{ formatNonWorkingDays(availabilityData.non_working_days) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 3. LOADING STATE -->
    <div v-if="loading" class="row justify-center items-center q-pa-xl" style="min-height: 200px">
      <q-spinner color="primary" size="38px" />
      <span class="q-ml-sm text-grey-7">Fetching availability schedule...</span>
    </div>

    <!-- 4. ERROR STATE -->
    <q-banner
      v-else-if="errorMessage"
      class="bg-red-1 text-negative rounded-borders q-mb-md"
      rounded
    >
      <template #avatar>
        <q-icon name="error_outline" color="negative" />
      </template>
      <div class="row items-center justify-between">
        <span>{{ errorMessage }}</span>
        <q-btn flat dense no-caps label="Retry" color="negative" @click="loadAvailability" />
      </div>
    </q-banner>

    <!-- 5. EMPTY STATE -->
    <div
      v-else-if="!availabilityData || availabilityData.days.length === 0"
      class="text-center q-pa-xl text-grey-6"
    >
      <q-icon name="event_busy" size="48px" />
      <div class="text-subtitle1 q-mt-sm">No availability data found for this date range.</div>
    </div>

    <!-- 6. DATA PRESENTATION -->
    <template v-else>
      <!-- LAYOUT OPTION A: GRID / CARDS VIEW -->
      <div v-if="viewLayout === 'grid'" class="availability-grid">
        <div
          v-for="day in availabilityData.days"
          :key="day.date"
          class="day-card column justify-between"
          :class="[
            getStatusMeta(day.status).cardClass,
            isToday(day.date) ? 'today-highlight' : '',
          ]"
        >
          <!-- Top Row: Date & Status Badge -->
          <div>
            <div class="row items-center justify-between no-wrap q-mb-xs">
              <div class="column">
                <div class="row items-center gap-xs no-wrap">
                  <span class="day-date text-weight-bold">{{ formatShortDate(day.date) }}</span>
                  <q-badge
                    v-if="isToday(day.date)"
                    color="primary"
                    label="TODAY"
                    class="today-badge"
                  />
                </div>
                <span class="day-weekday text-caption text-grey-6">{{ day.weekday }}</span>
              </div>

              <!-- Status Badge -->
              <span class="status-pill" :class="getStatusMeta(day.status).pillClass">
                <q-icon :name="getStatusMeta(day.status).icon" size="12px" class="q-mr-xs" />
                {{ getStatusMeta(day.status).label }}
              </span>
            </div>

            <!-- State Banners / Working Info -->
            <div v-if="day.status === 'NON_WORKING_DAY'" class="day-state-banner state-nwd">
              <span class="text-caption text-grey-6">Weekend / Off Day</span>
            </div>

            <div v-else-if="day.status === 'HOLIDAY'" class="day-state-banner state-holiday">
              <span class="text-caption text-amber-9 text-weight-medium">Company Holiday</span>
            </div>

            <div v-else-if="day.status === 'ON_LEAVE'" class="day-state-banner state-leave">
              <span class="text-caption text-purple-9 text-weight-medium"
                >Approved Leave ({{ formatHours(day.leave_hours) }}h)</span
              >
            </div>

            <div v-else class="day-working-info q-my-xs">
              <div class="row items-center justify-between text-caption q-mb-xs">
                <span class="text-grey-7" style="font-size: 11px">
                  Base: <strong>{{ formatHours(day.daily_working_hours) }}h</strong>
                </span>
                <span
                  :class="
                    day.available_hours > 0
                      ? 'text-positive text-weight-bold'
                      : 'text-grey-7 text-weight-medium'
                  "
                  style="font-size: 11px"
                >
                  {{ formatHours(day.available_hours) }}h Free
                </span>
              </div>

              <!-- Sleek Progress Track -->
              <div class="capacity-progress-track">
                <div
                  v-if="day.allocated_hours > 0"
                  class="progress-seg seg-allocated"
                  :style="{ width: `${getBarPct(day.allocated_hours, day.daily_working_hours)}%` }"
                  :title="`Allocated: ${formatHours(day.allocated_hours)}h`"
                />
                <div
                  v-if="day.leave_hours > 0"
                  class="progress-seg seg-leave"
                  :style="{ width: `${getBarPct(day.leave_hours, day.daily_working_hours)}%` }"
                  :title="`Leave: ${formatHours(day.leave_hours)}h`"
                />
                <div
                  v-if="day.available_hours > 0"
                  class="progress-seg seg-available"
                  :style="{ width: `${getBarPct(day.available_hours, day.daily_working_hours)}%` }"
                  :title="`Available: ${formatHours(day.available_hours)}h`"
                />
              </div>
            </div>
          </div>

          <!-- Bottom Footer Details -->
          <div class="day-footer q-mt-xs">
            <div
              v-if="
                day.status !== 'NON_WORKING_DAY' &&
                day.status !== 'HOLIDAY' &&
                (day.allocated_hours > 0 || day.leave_hours > 0)
              "
              class="row q-gutter-xs wrap items-center"
            >
              <span v-if="day.allocated_hours > 0" class="breakdown-tag tag-alloc">
                Booked: <strong>{{ formatHours(day.allocated_hours) }}h</strong>
              </span>
              <span v-if="day.leave_hours > 0" class="breakdown-tag tag-leave">
                Leave: <strong>{{ formatHours(day.leave_hours) }}h</strong>
              </span>
              <span v-if="day.available_hours > 0" class="breakdown-tag tag-avail">
                Free: <strong>{{ formatHours(day.available_hours) }}h</strong>
              </span>
            </div>
            <div
              v-else-if="day.status === 'AVAILABLE'"
              class="text-caption text-positive text-weight-medium"
              style="font-size: 11px"
            >
              100% Free Headroom
            </div>
            <div v-else class="text-caption text-grey-5" style="font-size: 11px">
              No tasks scheduled
            </div>
          </div>
        </div>
      </div>

      <!-- LAYOUT OPTION B: TABLE VIEW -->
      <q-card v-else flat bordered class="table-card overflow-hidden">
        <q-table
          flat
          dense
          :rows="availabilityData.days"
          :columns="tableColumns"
          row-key="date"
          :pagination="{ rowsPerPage: 31 }"
          hide-bottom
          no-data-label="No availability data available"
        >
          <template #body-cell-date="props">
            <q-td :props="props">
              <div class="row items-center gap-xs">
                <span class="text-weight-bold">{{ props.row.date }}</span>
                <q-badge v-if="isToday(props.row.date)" color="primary" label="TODAY" size="xs" />
              </div>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props" class="text-center">
              <span class="status-pill" :class="getStatusMeta(props.row.status).pillClass">
                <q-icon :name="getStatusMeta(props.row.status).icon" size="12px" class="q-mr-xs" />
                {{ getStatusMeta(props.row.status).label }}
              </span>
            </q-td>
          </template>

          <template #body-cell-available_hours="props">
            <q-td :props="props">
              <span
                class="text-weight-bold"
                :class="props.row.available_hours > 0 ? 'text-positive' : 'text-grey-6'"
              >
                {{ formatHours(props.row.available_hours) }}h
              </span>
            </q-td>
          </template>

          <template #body-cell-allocated_hours="props">
            <q-td :props="props">
              <span
                :class="
                  props.row.allocated_hours > 0 ? 'text-primary text-weight-medium' : 'text-grey-5'
                "
              >
                {{ formatHours(props.row.allocated_hours) }}h
              </span>
            </q-td>
          </template>

          <template #body-cell-leave_hours="props">
            <q-td :props="props">
              <span
                :class="
                  props.row.leave_hours > 0 ? 'text-purple-8 text-weight-medium' : 'text-grey-5'
                "
              >
                {{ formatHours(props.row.leave_hours) }}h
              </span>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import {
  getResourceAvailabilityApi,
  type AvailabilityStatus,
  type DailyAvailabilityDTO,
  type ResourceAvailabilityResponseDTO,
  type DayOfWeek,
} from '@/services/api';

const props = withDefaults(
  defineProps<{
    resourceId?: number | 'me';
    initialDaysRange?: '7' | '14' | '30' | 'custom';
    showHeader?: boolean;
    showSummaryCards?: boolean;
  }>(),
  {
    resourceId: 'me',
    initialDaysRange: '7',
    showHeader: true,
    showSummaryCards: true,
  },
);

const emit = defineEmits<{
  (e: 'availability-loaded', data: ResourceAvailabilityResponseDTO): void;
  (e: 'error', err: Error): void;
}>();

const $q = useQuasar();

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const availabilityData = ref<ResourceAvailabilityResponseDTO | null>(null);

const rangePreset = ref<'7' | '14' | '30' | 'custom'>(props.initialDaysRange);
const viewLayout = ref<'grid' | 'table'>('grid');

const customStartDate = ref<string>(formatLocalDate(new Date()));
const customEndDate = ref<string>(formatLocalDate(addDays(new Date(), 6)));

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function handlePresetChange(val: '7' | '14' | '30' | 'custom') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (val === '7') {
    customStartDate.value = formatLocalDate(today);
    customEndDate.value = formatLocalDate(addDays(today, 6));
  } else if (val === '14') {
    customStartDate.value = formatLocalDate(today);
    customEndDate.value = formatLocalDate(addDays(today, 13));
  } else if (val === '30') {
    customStartDate.value = formatLocalDate(today);
    customEndDate.value = formatLocalDate(addDays(today, 29));
  }
  void loadAvailability();
}

async function loadAvailability() {
  loading.value = true;
  errorMessage.value = null;

  try {
    const data = await getResourceAvailabilityApi(
      props.resourceId,
      customStartDate.value,
      customEndDate.value,
    );
    availabilityData.value = data;
    emit('availability-loaded', data);
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    errorMessage.value = errorObj.message || 'Failed to load resource availability.';
    emit('error', errorObj);
  } finally {
    loading.value = false;
  }
}

const totalLeaveHours = computed(() => {
  if (!availabilityData.value) return 0;
  const sum = availabilityData.value.days.reduce((acc, d) => acc + (d.leave_hours || 0), 0);
  return Number(sum.toFixed(1));
});

function isToday(dateStr: string): boolean {
  const todayStr = formatLocalDate(new Date());
  return dateStr === todayStr;
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthIdx = Number(parts[1]) - 1;
  return `${parts[2]} ${monthNames[monthIdx] ?? parts[1]}`;
}

function formatNonWorkingDays(days?: DayOfWeek[]): string {
  if (!days || days.length === 0) return 'None (Full 7-day schedule)';
  return days.map((d) => d.charAt(0) + d.slice(1).toLowerCase()).join(', ');
}

function getBarPct(value: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function getStatusMeta(status: AvailabilityStatus) {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'Available',
        badgeColor: 'positive',
        icon: 'check_circle',
        pillClass: 'pill-available',
        cardClass: 'card-available',
      };
    case 'PARTIALLY_AVAILABLE':
      return {
        label: 'Partially Available',
        badgeColor: 'cyan-8',
        icon: 'timelapse',
        pillClass: 'pill-partial',
        cardClass: 'card-partial',
      };
    case 'FULLY_BOOKED':
      return {
        label: 'Fully Booked',
        badgeColor: 'blue-8',
        icon: 'event_busy',
        pillClass: 'pill-booked',
        cardClass: 'card-booked',
      };
    case 'ON_LEAVE':
      return {
        label: 'On Leave',
        badgeColor: 'purple-8',
        icon: 'beach_access',
        pillClass: 'pill-leave',
        cardClass: 'card-leave',
      };
    case 'PARTIAL_LEAVE':
      return {
        label: 'Partial Leave',
        badgeColor: 'indigo-7',
        icon: 'event_repeat',
        pillClass: 'pill-partial-leave',
        cardClass: 'card-partial-leave',
      };
    case 'HOLIDAY':
      return {
        label: 'Holiday',
        badgeColor: 'amber-9',
        icon: 'celebration',
        pillClass: 'pill-holiday',
        cardClass: 'card-holiday',
      };
    case 'NON_WORKING_DAY':
      return {
        label: 'Off Day',
        badgeColor: 'grey-7',
        icon: 'nightlight_round',
        pillClass: 'pill-nwd',
        cardClass: 'card-nwd',
      };
    default:
      return {
        label: status,
        badgeColor: 'grey-6',
        icon: 'help_outline',
        pillClass: 'pill-default',
        cardClass: 'card-default',
      };
  }
}

function formatHours(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0';
  const num = Number(val);
  return parseFloat(num.toFixed(2)).toString();
}

const tableColumns: QTableColumn<DailyAvailabilityDTO>[] = [
  { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
  { name: 'weekday', label: 'Day', field: 'weekday', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  {
    name: 'daily_working_hours',
    label: 'Capacity',
    field: 'daily_working_hours',
    align: 'right',
    format: (val) => `${formatHours(val)}h`,
  },
  {
    name: 'available_hours',
    label: 'Available',
    field: 'available_hours',
    align: 'right',
    format: (val) => `${formatHours(val)}h`,
  },
  {
    name: 'allocated_hours',
    label: 'Allocated',
    field: 'allocated_hours',
    align: 'right',
    format: (val) => `${formatHours(val)}h`,
  },
  {
    name: 'leave_hours',
    label: 'Leave',
    field: 'leave_hours',
    align: 'right',
    format: (val) => `${formatHours(val)}h`,
  },
];

watch(
  () => props.resourceId,
  () => {
    void loadAvailability();
  },
);

onMounted(() => {
  handlePresetChange(rangePreset.value);
});
</script>

<style scoped lang="scss">
.resource-availability-container {
  min-width: 0;
}

.metric-mini-card {
  border-radius: 10px;
  transition: transform 0.15s ease;

  &.bg-avail-soft {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  &.bg-alloc-soft {
    background: rgba(139, 111, 216, 0.08);
    border: 1px solid rgba(139, 111, 216, 0.2);
  }

  &.bg-leave-soft {
    background: rgba(147, 51, 234, 0.08);
    border: 1px solid rgba(147, 51, 234, 0.2);
  }

  &.bg-grey-soft {
    background: rgba(100, 116, 139, 0.06);
    border: 1px solid rgba(100, 116, 139, 0.15);
  }
}

.availability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
}

.day-card {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  min-height: 120px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
    border-color: #cbd5e1;
  }

  &.today-highlight {
    border-color: #7c3aed !important;
    background: linear-gradient(
      180deg,
      rgba(124, 58, 237, 0.03) 0%,
      rgba(255, 255, 255, 0.9) 100%
    );
    box-shadow:
      0 0 0 1px #7c3aed,
      0 4px 12px rgba(124, 58, 237, 0.08);
  }

  &.card-nwd {
    background: #f8fafc;
    border-color: #f1f5f9;
    opacity: 0.85;
  }

  &.card-holiday {
    background: #fffbeb;
    border-color: #fef3c7;
  }

  &.card-leave {
    background: #faf5ff;
    border-color: #f3e8ff;
  }
}

.day-date {
  font-size: 14px;
  color: #1e293b;
}

.today-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 4px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  line-height: 1.4;

  &.pill-available {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  &.pill-partial {
    background: #ecfeff;
    color: #155e75;
    border: 1px solid #a5f3fc;
  }
  &.pill-booked {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }
  &.pill-leave {
    background: #faf5ff;
    color: #6b21a8;
    border: 1px solid #e9d5ff;
  }
  &.pill-partial-leave {
    background: #eef2ff;
    color: #3730a3;
    border: 1px solid #c7d2fe;
  }
  &.pill-holiday {
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fed7aa;
  }
  &.pill-nwd {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  &.pill-default {
    background: #f8fafc;
    color: #64748b;
  }
}

.day-state-banner {
  padding: 6px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  margin: 6px 0;

  &.state-nwd {
    background: rgba(148, 163, 184, 0.12);
  }
  &.state-holiday {
    background: rgba(245, 158, 11, 0.12);
  }
  &.state-leave {
    background: rgba(147, 51, 234, 0.1);
  }
}

.capacity-progress-track {
  height: 5px;
  border-radius: 3px;
  background: #f1f5f9;
  display: flex;
  overflow: hidden;
}

.progress-seg {
  height: 100%;

  &.seg-allocated {
    background: #3b82f6;
  }
  &.seg-leave {
    background: #a855f7;
  }
  &.seg-available {
    background: #10b981;
  }
}

.breakdown-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;

  &.tag-avail {
    background: #ecfdf5;
    color: #065f46;
  }
  &.tag-alloc {
    background: #eff6ff;
    color: #1e40af;
  }
  &.tag-leave {
    background: #faf5ff;
    color: #6b21a8;
  }
}
</style>
