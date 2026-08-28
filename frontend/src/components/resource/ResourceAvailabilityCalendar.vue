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
                  <q-date v-model="customStartDate" mask="YYYY-MM-DD" @update:model-value="loadAvailability">
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
                  <q-date v-model="customEndDate" mask="YYYY-MM-DD" @update:model-value="loadAvailability">
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
              {{ availabilityData.total_available_hours }}h
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
              {{ availabilityData.total_allocated_hours }}h
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
              {{ totalLeaveHours }}h
            </div>
            <div class="text-caption text-grey-6" style="font-size: 11px">
              Approved time off in range
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
              {{ availabilityData.daily_working_hours }}h / day
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
    <q-banner v-else-if="errorMessage" class="bg-red-1 text-negative rounded-borders q-mb-md" rounded>
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
            getStatusMeta(day.status).borderClass,
            isToday(day.date) ? 'today-highlight' : '',
          ]"
        >
          <!-- Top Row: Date & Status Badge -->
          <div>
            <div class="row items-center justify-between q-mb-xs">
              <div class="column">
                <div class="row items-center gap-xs">
                  <span class="day-date text-weight-bolder">{{ formatShortDate(day.date) }}</span>
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
              <q-chip
                dense
                square
                :color="getStatusMeta(day.status).badgeColor"
                text-color="white"
                class="status-chip text-weight-bold"
                :icon="getStatusMeta(day.status).icon"
              >
                {{ getStatusMeta(day.status).label }}
              </q-chip>
            </div>

            <!-- Visual Capacity Bar -->
            <div class="capacity-bar-container q-my-sm">
              <div class="row items-center justify-between text-caption q-mb-xs" style="font-size: 11px">
                <span class="text-grey-7">Daily Base: <strong>{{ day.daily_working_hours }}h</strong></span>
                <span :class="day.available_hours > 0 ? 'text-positive text-weight-bold' : 'text-grey-6'">
                  {{ day.available_hours }}h Free
                </span>
              </div>
              <div class="capacity-progress-track">
                <!-- Allocated Segment -->
                <div
                  v-if="day.allocated_hours > 0"
                  class="progress-seg seg-allocated"
                  :style="{ width: `${getBarPct(day.allocated_hours, day.daily_working_hours)}%` }"
                  :title="`Allocated: ${day.allocated_hours}h`"
                />
                <!-- Leave Segment -->
                <div
                  v-if="day.leave_hours > 0"
                  class="progress-seg seg-leave"
                  :style="{ width: `${getBarPct(day.leave_hours, day.daily_working_hours)}%` }"
                  :title="`Leave: ${day.leave_hours}h`"
                />
                <!-- Available Headroom Segment -->
                <div
                  v-if="day.available_hours > 0"
                  class="progress-seg seg-available"
                  :style="{ width: `${getBarPct(day.available_hours, day.daily_working_hours)}%` }"
                  :title="`Available: ${day.available_hours}h`"
                />
              </div>
            </div>
          </div>

          <!-- Bottom Breakdown Chips -->
          <div class="row q-gutter-xs wrap items-center q-mt-xs">
            <span class="breakdown-tag tag-avail">
              Avail: <strong>{{ day.available_hours }}h</strong>
            </span>
            <span v-if="day.allocated_hours > 0" class="breakdown-tag tag-alloc">
              Booked: <strong>{{ day.allocated_hours }}h</strong>
            </span>
            <span v-if="day.leave_hours > 0" class="breakdown-tag tag-leave">
              Leave: <strong>{{ day.leave_hours }}h</strong>
            </span>
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
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="getStatusMeta(props.row.status).badgeColor"
                text-color="white"
                class="status-chip text-weight-bold"
                :icon="getStatusMeta(props.row.status).icon"
              >
                {{ getStatusMeta(props.row.status).label }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-available_hours="props">
            <q-td :props="props">
              <span
                class="text-weight-bold"
                :class="props.row.available_hours > 0 ? 'text-positive' : 'text-grey-6'"
              >
                {{ props.row.available_hours }}h
              </span>
            </q-td>
          </template>

          <template #body-cell-allocated_hours="props">
            <q-td :props="props">
              <span :class="props.row.allocated_hours > 0 ? 'text-primary text-weight-medium' : 'text-grey-5'">
                {{ props.row.allocated_hours }}h
              </span>
            </q-td>
          </template>

          <template #body-cell-leave_hours="props">
            <q-td :props="props">
              <span :class="props.row.leave_hours > 0 ? 'text-purple-8 text-weight-medium' : 'text-grey-5'">
                {{ props.row.leave_hours }}h
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
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = Number(parts[1]) - 1;
  return `${parts[2]} ${monthNames[monthIdx] ?? parts[1]}`;
}

function formatNonWorkingDays(days?: DayOfWeek[]): string {
  if (!days || days.length === 0) return 'None (Full 7-day schedule)';
  return days
    .map((d) => d.charAt(0) + d.slice(1).toLowerCase())
    .join(', ');
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
        borderClass: 'border-status-avail',
      };
    case 'PARTIALLY_AVAILABLE':
      return {
        label: 'Partially Available',
        badgeColor: 'cyan-8',
        icon: 'timelapse',
        borderClass: 'border-status-partial-avail',
      };
    case 'FULLY_BOOKED':
      return {
        label: 'Fully Booked',
        badgeColor: 'amber-9',
        icon: 'event_busy',
        borderClass: 'border-status-booked',
      };
    case 'ON_LEAVE':
      return {
        label: 'On Leave',
        badgeColor: 'purple-8',
        icon: 'beach_access',
        borderClass: 'border-status-leave',
      };
    case 'PARTIAL_LEAVE':
      return {
        label: 'Partial Leave',
        badgeColor: 'indigo-7',
        icon: 'event_repeat',
        borderClass: 'border-status-partial-leave',
      };
    case 'HOLIDAY':
      return {
        label: 'Holiday',
        badgeColor: 'deep-orange-8',
        icon: 'celebration',
        borderClass: 'border-status-holiday',
      };
    case 'NON_WORKING_DAY':
      return {
        label: 'Off Day',
        badgeColor: 'grey-7',
        icon: 'nightlight_round',
        borderClass: 'border-status-nwd',
      };
    default:
      return {
        label: status,
        badgeColor: 'grey-6',
        icon: 'help_outline',
        borderClass: 'border-status-default',
      };
  }
}

const tableColumns: QTableColumn<DailyAvailabilityDTO>[] = [
  { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
  { name: 'weekday', label: 'Day', field: 'weekday', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'daily_working_hours', label: 'Capacity', field: 'daily_working_hours', align: 'right', format: (val) => `${val}h` },
  { name: 'available_hours', label: 'Available', field: 'available_hours', align: 'right' },
  { name: 'allocated_hours', label: 'Allocated', field: 'allocated_hours', align: 'right' },
  { name: 'leave_hours', label: 'Leave', field: 'leave_hours', align: 'right' },
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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.day-card {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecf0);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
  min-height: 140px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.08);
  }

  &.today-highlight {
    border-color: var(--wo-primary, #8b6fd8) !important;
    background: rgba(139, 111, 216, 0.02);
  }

  &.border-status-avail {
    border-left: 4px solid #10b981;
  }
  &.border-status-partial-avail {
    border-left: 4px solid #06b6d4;
  }
  &.border-status-booked {
    border-left: 4px solid #f59e0b;
  }
  &.border-status-leave {
    border-left: 4px solid #8b5cf6;
  }
  &.border-status-partial-leave {
    border-left: 4px solid #6366f1;
  }
  &.border-status-holiday {
    border-left: 4px solid #f97316;
  }
  &.border-status-nwd {
    border-left: 4px solid #94a3b8;
    background: var(--wo-bg-subtle, #f9fafb);
  }
}

.day-date {
  font-size: 14px;
  color: var(--wo-text-main, #1e293b);
}

.today-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 4px;
}

.status-chip {
  font-size: 10px;
  padding: 0 6px;
  height: 20px;
}

.capacity-progress-track {
  height: 6px;
  border-radius: 3px;
  background: var(--wo-border-subtle, #f0f2f5);
  display: flex;
  overflow: hidden;
}

.progress-seg {
  height: 100%;

  &.seg-allocated {
    background: #3b82f6;
  }
  &.seg-leave {
    background: #8b5cf6;
  }
  &.seg-available {
    background: #10b981;
  }
}

.breakdown-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;

  &.tag-avail {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }
  &.tag-alloc {
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;
  }
  &.tag-leave {
    background: rgba(139, 92, 246, 0.1);
    color: #7c3aed;
  }
}
</style>
