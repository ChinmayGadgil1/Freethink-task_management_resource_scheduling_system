<template>
  <q-page class="calendar-page q-pa-lg">
    <!-- 1. PAGE HEADER & COMPACT METRICS -->
    <div class="calendar-header-wrapper row items-center justify-between q-mb-md flex-wrap gap-md">
      <!-- Left: Title & Subtitle -->
      <div class="header-title-block">
        <div class="row items-center gap-xs">
          <q-icon name="calendar_month" size="28px" color="primary" />
          <h1 class="page-title q-my-none">Company Calendar</h1>
        </div>
        <p class="page-subtitle q-mb-none q-mt-xs">
          Track official organization holidays, weekends, and team working schedule
        </p>
      </div>

      <!-- Right: Compact Metrics & Main Actions -->
      <div class="header-actions-block row items-center gap-sm">
        <!-- Compact Summary Badges -->
        <div class="compact-stat-chip row items-center no-wrap gap-xs">
          <div class="stat-icon-wrapper bg-primary-soft text-primary">
            <q-icon name="event" size="14px" />
          </div>
          <div class="stat-text-group">
            <span class="stat-micro-label">Total Holidays:</span>
            <span class="stat-micro-val">{{ holidays.length }}</span>
          </div>
        </div>

        <div class="compact-stat-chip row items-center no-wrap gap-xs">
          <div class="stat-icon-wrapper bg-purple-soft text-purple">
            <q-icon name="upcoming" size="14px" />
          </div>
          <div class="stat-text-group">
            <span class="stat-micro-label">This Month:</span>
            <span class="stat-micro-val">{{ currentMonthHolidaysCount }}</span>
          </div>
        </div>

        <q-separator vertical inset class="gt-xs q-mx-xs header-sep" />

        <!-- View mode toggle: Month Grid vs List -->
        <q-btn-toggle
          v-model="viewMode"
          toggle-color="primary"
          toggle-text-color="white"
          :color="$q.dark.isActive ? 'dark' : 'white'"
          :text-color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
          dense
          unelevated
          class="view-toggle-btn shadow-subtle"
          :options="[
            { label: 'Calendar', value: 'grid', icon: 'grid_view' },
            { label: 'List View', value: 'list', icon: 'format_list_bulleted' },
          ]"
        />

        <!-- Add Holiday Button (PM Only) -->
        <q-btn
          v-if="isProjectManager"
          color="primary"
          icon="add"
          label="Add Holiday"
          unelevated
          no-caps
          class="action-btn-primary"
          @click="openAddHolidayDialog()"
        />

        <!-- Refresh Button -->
        <q-btn
          flat
          round
          dense
          icon="refresh"
          class="refresh-btn"
          :loading="loading"
          @click="loadHolidays"
        >
          <q-tooltip>Refresh Calendar</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- 2. MONTH CALENDAR GRID VIEW -->
    <q-card v-if="viewMode === 'grid'" flat class="main-calendar-card">
      <!-- Calendar Toolbar & Month Switcher -->
      <div class="calendar-toolbar row items-center justify-between q-pa-md border-bottom flex-wrap gap-sm">
        <!-- Month Navigation -->
        <div class="row items-center gap-xs">
          <q-btn
            flat
            dense
            round
            icon="chevron_left"
            class="nav-chevron-btn"
            @click="prevMonth"
          >
            <q-tooltip>Previous Month</q-tooltip>
          </q-btn>

          <div class="current-month-display text-h6 text-weight-bold q-px-sm">
            {{ currentMonthName }} <span class="year-subtext">{{ currentYear }}</span>
          </div>

          <q-btn
            flat
            dense
            round
            icon="chevron_right"
            class="nav-chevron-btn"
            @click="nextMonth"
          >
            <q-tooltip>Next Month</q-tooltip>
          </q-btn>

          <q-btn
            outline
            dense
            no-caps
            label="Today"
            class="today-btn q-ml-sm"
            @click="goToToday"
          />
        </div>

        <!-- Visual Legend -->
        <div class="legend-row row items-center gap-md text-caption">
          <div class="legend-item row items-center gap-xs">
            <span class="legend-dot dot-holiday"></span>
            <span class="legend-text">Holiday (No Work)</span>
          </div>
          <div class="legend-item row items-center gap-xs">
            <span class="legend-dot dot-weekend"></span>
            <span class="legend-text">Weekend (Off)</span>
          </div>
          <div class="legend-item row items-center gap-xs">
            <span class="legend-dot dot-workday"></span>
            <span class="legend-text">Working Day</span>
          </div>
        </div>
      </div>

      <!-- Days of Week Header (SUN - SAT) -->
      <div class="calendar-weekdays-header">
        <div
          v-for="(day, idx) in weekDays"
          :key="day"
          class="weekday-col-header text-caption text-weight-bold"
          :class="{ 'is-weekend-header': idx === 0 || idx === 6 }"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar Month Days Grid -->
      <div class="calendar-days-grid">
        <div
          v-for="cell in calendarCells"
          :key="cell.dateKey"
          class="calendar-day-cell"
          :class="{
            'is-other-month': !cell.isCurrentMonth,
            'is-today': cell.isToday,
            'is-weekend': cell.isWeekend,
            'has-holiday': !!cell.holiday,
          }"
          @click="onCellClick(cell)"
        >
          <!-- Cell Top: Day Number & Add Action -->
          <div class="cell-top-bar row items-center justify-between">
            <div class="row items-center gap-xs">
              <span
                class="day-number-badge"
                :class="{
                  'today-highlight': cell.isToday,
                  'weekend-day-num': cell.isWeekend && !cell.isToday,
                }"
              >
                {{ cell.dayNumber }}
              </span>

              <span v-if="cell.isWeekend && cell.isCurrentMonth" class="weekend-tag">
                Off
              </span>
            </div>

            <!-- Quick Add (+) on Hover for PMs -->
            <q-btn
              v-if="isProjectManager && !cell.holiday"
              flat
              round
              dense
              icon="add"
              size="xs"
              color="primary"
              class="quick-add-btn"
              @click.stop="openAddHolidayDialog(cell.dateKey)"
            >
              <q-tooltip>Add holiday on {{ cell.dateKey }}</q-tooltip>
            </q-btn>
          </div>

          <!-- Cell Center / Holiday Badge -->
          <div class="cell-content-area">
            <div
              v-if="cell.holiday"
              class="holiday-badge-card"
              :class="{ 'is-clickable': isProjectManager }"
              @click.stop="onHolidayClick(cell.holiday)"
            >
              <div class="row items-center justify-between no-wrap">
                <div class="row items-center no-wrap gap-xs ellipsis">
                  <span class="holiday-indicator-dot"></span>
                  <span class="holiday-badge-title ellipsis" :title="cell.holiday.description">
                    {{ cell.holiday.description }}
                  </span>
                </div>

                <q-icon
                  v-if="isProjectManager"
                  name="edit"
                  size="11px"
                  class="holiday-badge-edit-icon q-ml-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- 3. LIST / TABLE VIEW -->
    <q-card v-else flat class="main-calendar-card q-pa-md">
      <q-table
        flat
        :rows="holidays"
        :columns="columns"
        row-key="holiday_id"
        :loading="loading"
        :pagination="{ rowsPerPage: 15 }"
        :dark="$q.dark.isActive"
        no-data-label="No holidays scheduled yet."
        class="holidays-data-table"
      >
        <template #body-cell-holiday_date="props">
          <q-td :props="props">
            <div class="text-weight-bold table-main-text">
              {{ formatPrettyDate(props.row.holiday_date) }}
            </div>
            <div class="text-caption table-sub-text">
              {{ getDayOfWeekName(props.row.holiday_date) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-description="props">
          <q-td :props="props">
            <div class="row items-center gap-xs">
              <div class="holiday-table-badge row items-center gap-xs">
                <span class="holiday-indicator-dot"></span>
                <span class="text-weight-bold table-main-text">{{ props.row.description }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template v-if="isProjectManager" #body-cell-actions="props">
          <q-td :props="props" align="right">
            <div class="row items-center justify-end gap-xs">
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="edit"
                size="sm"
                @click="openEditHolidayDialog(props.row)"
              >
                <q-tooltip>Edit Holiday</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                size="sm"
                @click="confirmDeleteHoliday(props.row)"
              >
                <q-tooltip>Delete Holiday</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 4. ADD / EDIT HOLIDAY MODAL (PM ONLY) -->
    <q-dialog v-model="holidayDialog.show" persistent>
      <q-card class="modal-dialog-card">
        <!-- Dialog Header -->
        <q-card-section class="modal-header row items-center justify-between q-pb-none">
          <div class="row items-center gap-xs">
            <q-avatar size="32px" color="primary-soft" text-color="primary" icon="event" />
            <div class="text-subtitle1 text-weight-bold q-ml-xs modal-title-text">
              {{ holidayDialog.isEdit ? 'Edit Company Holiday' : 'Add Company Holiday' }}
            </div>
          </div>
          <q-btn flat round dense icon="close" size="sm" color="grey-6" v-close-popup />
        </q-card-section>

        <!-- Dialog Form Body -->
        <q-form @submit.prevent="saveHoliday">
          <q-card-section class="q-pt-md q-gutter-y-md">
            <!-- Date Input with Date Picker Popup -->
            <q-input
              v-model="holidayDialog.form.holiday_date"
              label="Holiday Date (YYYY-MM-DD) *"
              outlined
              dense
              stack-label
              :dark="$q.dark.isActive"
              mask="####-##-##"
              :rules="[val => !!val || 'Holiday date is required', validateDate]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer text-primary">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="holidayDialog.form.holiday_date" mask="YYYY-MM-DD" :dark="$q.dark.isActive">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- Description Input -->
            <q-input
              v-model="holidayDialog.form.description"
              label="Holiday Name / Description *"
              placeholder="e.g. Independence Day, Company Foundation Day"
              outlined
              dense
              stack-label
              :dark="$q.dark.isActive"
              :rules="[val => !!val && val.trim().length > 0 || 'Description is required']"
            />
          </q-card-section>

          <!-- Dialog Actions Footer -->
          <q-card-actions class="modal-footer row items-center justify-between q-px-md q-pb-md">
            <div>
              <q-btn
                v-if="holidayDialog.isEdit"
                flat
                color="negative"
                icon="delete"
                label="Delete Holiday"
                no-caps
                class="text-weight-bold"
                @click="handleDeleteFromEditDialog"
              />
            </div>

            <div class="row items-center gap-xs">
              <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
              <q-btn
                unelevated
                :label="holidayDialog.isEdit ? 'Save Changes' : 'Create Holiday'"
                color="primary"
                type="submit"
                :loading="holidayDialog.saving"
                no-caps
                class="action-btn-primary"
              />
            </div>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- 5. DELETE CONFIRMATION MODAL -->
    <q-dialog v-model="deleteDialog.show">
      <q-card class="modal-dialog-card" style="max-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="delete" color="red-1" text-color="negative" size="38px" />
          <div class="text-subtitle1 text-weight-bold q-ml-md modal-title-text">Remove Holiday?</div>
        </q-card-section>

        <q-card-section class="text-body2 modal-body-text q-pt-md">
          Are you sure you want to remove <strong>{{ deleteDialog.holiday?.description }}</strong> on
          <strong>{{ deleteDialog.holiday?.holiday_date }}</strong>? This will restore regular working capacity.
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
          <q-btn
            unelevated
            label="Delete Holiday"
            color="negative"
            :loading="deleteDialog.deleting"
            no-caps
            class="text-weight-bold"
            @click="executeDeleteHoliday"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import {
  getHolidaysApi,
  createHolidayApi,
  updateHolidayApi,
  deleteHolidayApi,
  type HolidayItem,
} from '@/services/api';

const $q = useQuasar();
const authStore = useAuthStore();

const isProjectManager = computed(() => authStore.user?.role === 'PROJECT_MANAGER');

const loading = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');
const holidays = ref<HolidayItem[]>([]);

// Calendar navigation state
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth()); // 0-11

const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const currentMonthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1);
  return date.toLocaleString('default', { month: 'long' });
});

// Map of holidays by date key (YYYY-MM-DD)
const holidaysByDate = computed(() => {
  const map = new Map<string, HolidayItem>();
  for (const h of holidays.value) {
    map.set(h.holiday_date, h);
  }
  return map;
});

// Count of holidays in the currently selected month
const currentMonthHolidaysCount = computed(() => {
  const monthStr = String(currentMonth.value + 1).padStart(2, '0');
  const prefix = `${currentYear.value}-${monthStr}`;
  return holidays.value.filter(h => h.holiday_date.startsWith(prefix)).length;
});

// Generate 35-42 calendar grid cells for current month view
interface CalendarCell {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holiday?: HolidayItem | undefined;
}

const calendarCells = computed<CalendarCell[]>(() => {
  const cells: CalendarCell[] = [];
  const year = currentYear.value;
  const month = currentMonth.value;

  const todayStr = formatDate(new Date());

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
  const lastDateOfPrevMonth = new Date(year, month, 0).getDate();

  // 1. Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = lastDateOfPrevMonth - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateKey = formatDate(prevDate);
    cells.push({
      dateKey,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateKey === todayStr,
      isWeekend: prevDate.getDay() === 0 || prevDate.getDay() === 6,
      holiday: holidaysByDate.value.get(dateKey),
    });
  }

  // 2. Current month days
  for (let day = 1; day <= lastDateOfMonth; day++) {
    const curDate = new Date(year, month, day);
    const dateKey = formatDate(curDate);
    cells.push({
      dateKey,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateKey === todayStr,
      isWeekend: curDate.getDay() === 0 || curDate.getDay() === 6,
      holiday: holidaysByDate.value.get(dateKey),
    });
  }

  // 3. Next month leading days to complete grid (multiples of 7)
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateKey = formatDate(nextDate);
      cells.push({
        dateKey,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6,
        holiday: holidaysByDate.value.get(dateKey),
      });
    }
  }

  return cells;
});

// Format Date object to YYYY-MM-DD
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatPrettyDate(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0]! : dateStr;
  const d = new Date(`${cleanStr}T00:00:00`);
  return d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0]! : dateStr;
  const d = new Date(`${cleanStr}T00:00:00`);
  return d.toLocaleDateString('default', { weekday: 'long' });
}

function validateDate(val: string): boolean | string {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(val)) return 'Date format must be YYYY-MM-DD';
  return true;
}

// Navigation helpers
function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function goToToday() {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth();
}

// Load holidays
async function loadHolidays() {
  loading.value = true;
  try {
    holidays.value = await getHolidaysApi();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load holidays.',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

// Holiday Dialog state
const holidayDialog = ref({
  show: false,
  isEdit: false,
  saving: false,
  holidayId: null as number | null,
  form: {
    holiday_date: '',
    description: '',
  },
});

function openAddHolidayDialog(prefilledDate?: string) {
  holidayDialog.value = {
    show: true,
    isEdit: false,
    saving: false,
    holidayId: null,
    form: {
      holiday_date: prefilledDate || formatDate(new Date()),
      description: '',
    },
  };
}

function openEditHolidayDialog(holiday: HolidayItem) {
  holidayDialog.value = {
    show: true,
    isEdit: true,
    saving: false,
    holidayId: holiday.holiday_id,
    form: {
      holiday_date: holiday.holiday_date,
      description: holiday.description,
    },
  };
}

function onCellClick(cell: CalendarCell) {
  if (!isProjectManager.value) return;
  if (cell.holiday) {
    openEditHolidayDialog(cell.holiday);
  } else {
    openAddHolidayDialog(cell.dateKey);
  }
}

function onHolidayClick(holiday: HolidayItem) {
  if (isProjectManager.value) {
    openEditHolidayDialog(holiday);
  }
}

// Save (Create or Update) Holiday
async function saveHoliday() {
  const { form, isEdit, holidayId } = holidayDialog.value;

  // Duplicate pre-check on client
  const existing = holidaysByDate.value.get(form.holiday_date);
  if (existing && (!isEdit || existing.holiday_id !== holidayId)) {
    $q.notify({
      type: 'warning',
      message: `A holiday is already scheduled for ${form.holiday_date} ("${existing.description}").`,
      position: 'top',
    });
    return;
  }

  holidayDialog.value.saving = true;
  try {
    if (isEdit && holidayId) {
      await updateHolidayApi(holidayId, form);
      $q.notify({
        type: 'positive',
        message: 'Holiday updated successfully!',
        position: 'top',
      });
    } else {
      await createHolidayApi(form);
      $q.notify({
        type: 'positive',
        message: 'Holiday added successfully!',
        position: 'top',
      });
    }

    holidayDialog.value.show = false;
    await loadHolidays();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save holiday.',
      position: 'top',
    });
  } finally {
    holidayDialog.value.saving = false;
  }
}

function handleDeleteFromEditDialog() {
  if (!holidayDialog.value.holidayId) return;
  const holidayToDelete: HolidayItem = {
    holiday_id: holidayDialog.value.holidayId,
    holiday_date: holidayDialog.value.form.holiday_date,
    description: holidayDialog.value.form.description,
  };
  holidayDialog.value.show = false;
  confirmDeleteHoliday(holidayToDelete);
}

// Delete confirmation dialog state
const deleteDialog = ref({
  show: false,
  deleting: false,
  holiday: null as HolidayItem | null,
});

function confirmDeleteHoliday(holiday: HolidayItem) {
  deleteDialog.value = {
    show: true,
    deleting: false,
    holiday,
  };
}

async function executeDeleteHoliday() {
  if (!deleteDialog.value.holiday) return;
  deleteDialog.value.deleting = true;
  try {
    await deleteHolidayApi(deleteDialog.value.holiday.holiday_id);
    $q.notify({
      type: 'positive',
      message: 'Holiday removed successfully!',
      position: 'top',
    });
    deleteDialog.value.show = false;
    await loadHolidays();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to delete holiday.',
      position: 'top',
    });
  } finally {
    deleteDialog.value.deleting = false;
  }
}

// Table columns definition (Actions column only included for Project Managers)
const columns = computed<QTableColumn[]>(() => {
  const baseCols: QTableColumn[] = [
    {
      name: 'holiday_date',
      label: 'Date',
      align: 'left',
      field: 'holiday_date',
      sortable: true,
    },
    {
      name: 'description',
      label: 'Holiday Name',
      align: 'left',
      field: 'description',
      sortable: true,
    },
  ];

  if (isProjectManager.value) {
    baseCols.push({
      name: 'actions',
      label: 'Actions',
      align: 'right',
      field: 'holiday_id',
    });
  }

  return baseCols;
});

onMounted(() => {
  void loadHolidays();
});
</script>

<style scoped>
.calendar-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* ===================================================
   Header & Action Styles
   =================================================== */
.page-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--wo-text-main, #1d2433);
}

.page-subtitle {
  font-size: 13px;
  color: var(--wo-text-muted, #667085);
}

.compact-stat-chip {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e2e8f0);
  border-radius: 8px;
  padding: 4px 10px;
  box-shadow: var(--wo-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.03));
}

.stat-icon-wrapper {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-primary-soft {
  background-color: var(--wo-primary-light, #f0f4ff);
}

.bg-purple-soft {
  background-color: rgba(139, 111, 216, 0.12);
}

.stat-text-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-micro-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--wo-text-muted, #64748b);
}

.stat-micro-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
}

.header-sep {
  border-color: var(--wo-border, #e2e8f0);
}

.view-toggle-btn {
  border: 1px solid var(--wo-border, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
  background: var(--wo-bg-card, #ffffff);
}

:deep(.view-toggle-btn .q-btn) {
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 12px;
}

.action-btn-primary {
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 14px;
}

.refresh-btn {
  border: 1px solid var(--wo-border, #e2e8f0);
  border-radius: 8px;
  color: var(--wo-text-muted, #64748b);
}

/* ===================================================
   Main Calendar Card
   =================================================== */
.main-calendar-card {
  border-radius: 12px;
  border: 1px solid var(--wo-border, #e2e8f0);
  background: var(--wo-bg-card, #ffffff);
  box-shadow: var(--wo-card-shadow, 0 1px 4px rgba(15, 23, 42, 0.04));
  overflow: hidden;
}

.border-bottom {
  border-bottom: 1px solid var(--wo-border, #e2e8f0);
}

.nav-chevron-btn {
  border: 1px solid var(--wo-border, #e2e8f0);
  border-radius: 6px;
  color: var(--wo-text-main, #475569);
}

.nav-chevron-btn:hover {
  background: var(--wo-bg-card-hover, #f1f5f9);
  color: var(--wo-text-main, #1e293b);
}

.current-month-display {
  font-size: 16px;
  letter-spacing: -0.01em;
  min-width: 160px;
  text-align: center;
  color: var(--wo-text-main, #1e293b);
}

.year-subtext {
  font-weight: 500;
  color: var(--wo-text-muted, #64748b);
}

.today-btn {
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 6px;
  color: var(--wo-text-main, #334155);
  border-color: var(--wo-border, #cbd5e1);
}

.legend-row {
  color: var(--wo-text-muted, #64748b);
}

.legend-text {
  font-weight: 500;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-holiday {
  background: #f59e0b;
}

.dot-weekend {
  background: #64748b;
}

.dot-workday {
  background: var(--wo-bg-card, #ffffff);
  border: 1.5px solid var(--wo-border, #94a3b8);
}

/* Weekday Columns Header */
.calendar-weekdays-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--wo-bg-subtle, #f8fafc);
  border-bottom: 1px solid var(--wo-border, #e2e8f0);
}

.weekday-col-header {
  padding: 10px 4px;
  text-align: center;
  color: var(--wo-text-muted, #475569);
  font-size: 11.5px;
  letter-spacing: 0.04em;
}

.is-weekend-header {
  color: var(--wo-text-muted, #64748b);
  background: var(--wo-border-subtle, #edf2f7);
}

/* ===================================================
   Calendar Grid & Day Cells
   =================================================== */
.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(118px, 1fr);
}

.calendar-day-cell {
  border-right: 1px solid var(--wo-border, #e2e8f0);
  border-bottom: 1px solid var(--wo-border, #e2e8f0);
  padding: 8px;
  position: relative;
  background: var(--wo-bg-card, #ffffff);
  transition: all 0.12s ease;
  display: flex;
  flex-direction: column;
}

.calendar-day-cell:nth-child(7n) {
  border-right: none;
}

.calendar-day-cell:hover {
  background: var(--wo-bg-card-hover, #f8fafc);
}

/* WEEKENDS (SATURDAY & SUNDAY) */
.calendar-day-cell.is-weekend {
  background: #f1f5f9;
}

.calendar-day-cell.is-weekend:hover {
  background: #e2e8f0;
}

.calendar-day-cell.is-other-month {
  background: #fafafa;
  opacity: 0.45;
}

.calendar-day-cell.is-today {
  background: #f0f7ff;
  border: 1.5px solid var(--wo-primary, #3b82f6) !important;
  z-index: 2;
}

.calendar-day-cell.has-holiday {
  background: #fffdf5;
}

.cell-top-bar {
  margin-bottom: 6px;
}

.day-number-badge {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--wo-text-main, #334155);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.today-highlight {
  background: var(--wo-primary, #2563eb);
  color: #ffffff !important;
}

.weekend-day-num {
  color: var(--wo-text-muted, #64748b);
}

.weekend-tag {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  background: #e2e8f0;
  padding: 1px 5px;
  border-radius: 4px;
}

.quick-add-btn {
  opacity: 0;
  transition: opacity 0.12s ease;
}

.calendar-day-cell:hover .quick-add-btn {
  opacity: 1;
}

/* Professional Holiday Badge inside day cell */
.cell-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.holiday-badge-card {
  background: #fff8e6;
  color: #b45309;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  border-radius: 5px;
  padding: 3px 6px;
  font-size: 11.5px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.holiday-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

.holiday-badge-title {
  max-width: 110px;
  letter-spacing: -0.01em;
}

.holiday-badge-edit-icon {
  color: #b45309;
}

.holiday-badge-card.is-clickable {
  cursor: pointer;
  transition: all 0.12s ease;
}

.holiday-badge-card.is-clickable:hover {
  background: #fef3c7;
  border-color: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.15);
}

.holiday-table-badge {
  background: #fff8e6;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  border-radius: 5px;
  padding: 4px 10px;
}

/* Modals & Dialogs */
.modal-dialog-card {
  min-width: 420px;
  max-width: 500px;
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-main, #1d2433);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--wo-border, #e2e8f0);
}

.modal-header {
  border-bottom: 1px solid var(--wo-border, #f1f5f9);
  padding-bottom: 12px;
}

.modal-footer {
  border-top: 1px solid var(--wo-border, #f1f5f9);
  padding-top: 12px;
}

.modal-title-text {
  color: var(--wo-text-main, #1d2433);
}

.modal-body-text {
  color: var(--wo-text-main, #334155);
}

.table-main-text {
  color: var(--wo-text-main, #1d2433);
}

.table-sub-text {
  color: var(--wo-text-muted, #64748b);
}

/* ===================================================
   DARK MODE OVERRIDES (body.body--dark)
   =================================================== */
body.body--dark {
  .calendar-day-cell {
    background: #181d28;
    border-color: #283042;
  }

  .calendar-day-cell:hover {
    background: #202636;
  }

  .calendar-day-cell.is-weekend {
    background: #10141e; /* Distinct deeper grey-tint for weekends */
  }

  .calendar-day-cell.is-weekend:hover {
    background: #151a26;
  }

  .calendar-day-cell.is-other-month {
    background: #0d1017;
    opacity: 0.35;
  }

  .calendar-day-cell.is-today {
    background: rgba(139, 111, 216, 0.12);
    border-color: var(--wo-primary, #9e84ec) !important;
  }

  .calendar-day-cell.has-holiday {
    background: rgba(245, 158, 11, 0.08);
  }

  .weekend-tag {
    background: #1e2535;
    color: #94a3b8;
  }

  .holiday-badge-card {
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-left: 3px solid #f59e0b;
  }

  .holiday-badge-card.is-clickable:hover {
    background: rgba(245, 158, 11, 0.22);
    border-color: #fbbf24;
  }

  .holiday-badge-edit-icon {
    color: #fbbf24;
  }

  .holiday-table-badge {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-left: 3px solid #f59e0b;
  }

  .calendar-weekdays-header {
    background: #131722;
    border-color: #283042;
  }

  .is-weekend-header {
    background: #0f121a;
  }
}
</style>
