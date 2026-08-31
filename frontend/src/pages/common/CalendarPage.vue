<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg">
    <div class="q-mx-auto" style="max-width: 1400px">
      <!-- 1. PAGE HEADER & COMPACT METRICS -->
      <div class="row items-center justify-between q-mb-md wrap q-col-gutter-md">
        <!-- Left: Title & Subtitle -->
        <div>
          <div class="row items-center q-gutter-xs">
            <q-icon name="calendar_month" size="28px" color="primary" />
            <div
              class="text-h5 text-weight-bold"
              :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
            >
              Company Calendar
            </div>
          </div>
          <div class="text-body2 q-mt-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
            Track official organization holidays, weekends, and team working schedule
          </div>
        </div>

        <!-- Right: Compact Metrics & Main Actions -->
        <div class="row items-center q-gutter-sm wrap">
          <!-- Compact Summary Badge 1: Total Holidays -->
          <q-card
            flat
            bordered
            :dark="$q.dark.isActive"
            class="row items-center q-px-sm q-py-xs rounded-borders q-gutter-xs"
          >
            <q-avatar
              size="24px"
              rounded
              :color="$q.dark.isActive ? 'blue-10' : 'blue-1'"
              :text-color="$q.dark.isActive ? 'blue-2' : 'primary'"
              icon="event"
            />
            <div class="column">
              <span class="text-caption text-grey-6" style="font-size: 10px; line-height: 1"
                >Total Holidays</span
              >
              <span class="text-weight-bold" style="font-size: 13px; line-height: 1.2">{{
                holidays.length
              }}</span>
            </div>
          </q-card>

          <!-- Compact Summary Badge 2: This Month -->
          <q-card
            flat
            bordered
            :dark="$q.dark.isActive"
            class="row items-center q-px-sm q-py-xs rounded-borders q-gutter-xs"
          >
            <q-avatar
              size="24px"
              rounded
              :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'purple'"
              icon="upcoming"
            />
            <div class="column">
              <span class="text-caption text-grey-6" style="font-size: 10px; line-height: 1"
                >This Month</span
              >
              <span class="text-weight-bold" style="font-size: 13px; line-height: 1.2">{{
                currentMonthHolidaysCount
              }}</span>
            </div>
          </q-card>

          <q-separator vertical inset class="gt-xs q-mx-xs" />

          <!-- View mode toggle: Month Grid vs List -->
          <q-btn-toggle
            v-model="viewMode"
            toggle-color="primary"
            toggle-text-color="white"
            :color="$q.dark.isActive ? 'grey-9' : 'white'"
            :text-color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
            dense
            unelevated
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
            class="text-weight-bold"
            style="border-radius: 8px"
            @click="openAddHolidayDialog()"
          />

          <!-- Refresh Button -->
          <q-btn
            flat
            round
            dense
            icon="refresh"
            :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
            :loading="loading"
            @click="loadHolidays"
          >
            <q-tooltip>Refresh Calendar</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- 2. MONTH CALENDAR GRID VIEW -->
      <q-card
        v-if="viewMode === 'grid'"
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders overflow-hidden"
      >
        <!-- Calendar Toolbar & Month Switcher -->
        <q-card-section
          class="row items-center justify-between q-pa-md wrap q-col-gutter-sm border-bottom"
        >
          <!-- Month Navigation -->
          <div class="row items-center q-gutter-xs">
            <q-btn flat dense round icon="chevron_left" @click="prevMonth">
              <q-tooltip>Previous Month</q-tooltip>
            </q-btn>

            <div
              class="text-subtitle1 text-weight-bold q-px-sm"
              style="min-width: 160px; text-align: center"
            >
              {{ currentMonthName }}
              <span class="text-grey-6 text-weight-medium">{{ currentYear }}</span>
            </div>

            <q-btn flat dense round icon="chevron_right" @click="nextMonth">
              <q-tooltip>Next Month</q-tooltip>
            </q-btn>

            <q-btn
              outline
              dense
              no-caps
              label="Today"
              class="q-px-sm q-ml-sm"
              :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
              @click="goToToday"
            />
          </div>

          <!-- Visual Legend -->
          <div class="row items-center q-gutter-md text-caption text-grey-6">
            <div class="row items-center q-gutter-xs">
              <q-badge rounded color="amber-8" style="width: 8px; height: 8px" />
              <span>Holiday (No Work)</span>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-badge rounded color="grey-6" style="width: 8px; height: 8px" />
              <span>Non-Working Day (Off)</span>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-badge rounded outline color="grey-7" style="width: 8px; height: 8px" />
              <span>Working Day</span>
            </div>
          </div>
        </q-card-section>

        <!-- Days of Week Header (SUN - SAT) -->
        <div class="calendar-weekdays-header">
          <div
            v-for="(day, idx) in weekDays"
            :key="day"
            class="weekday-col-header text-caption text-weight-bold"
            :class="{ 'is-weekend-header': isWeekdayHeaderNonWorking(idx) }"
            :style="{
              background:
                isWeekdayHeaderNonWorking(idx)
                  ? $q.dark.isActive
                    ? '#10141e'
                    : '#f1f5f9'
                  : $q.dark.isActive
                    ? '#131722'
                    : '#f8fafc',
              color: $q.dark.isActive ? '#94a3b8' : '#64748b',
              borderBottom: $q.dark.isActive
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid #e2e8f0',
            }"
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
            <div class="row items-center justify-between q-mb-xs">
              <div class="row items-center q-gutter-xs">
                <span
                  class="day-number-badge"
                  :class="{
                    'today-highlight': cell.isToday,
                    'text-grey-6': cell.isWeekend && !cell.isToday,
                  }"
                >
                  {{ cell.dayNumber }}
                </span>

                <q-badge
                  v-if="cell.isWeekend && cell.isCurrentMonth"
                  :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                  :text-color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
                  class="text-weight-bold"
                  style="font-size: 9px; padding: 1px 4px"
                >
                  OFF
                </q-badge>
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
            <div class="col column justify-start" style="min-width: 0">
              <div
                v-if="cell.holiday"
                class="holiday-badge-card"
                :class="{ 'is-clickable': isProjectManager }"
                @click.stop="onHolidayClick(cell.holiday)"
              >
                <div class="row items-start justify-between no-wrap">
                  <div class="row items-start no-wrap q-gutter-xs" style="min-width: 0; flex: 1">
                    <span class="holiday-indicator-dot q-mt-xs"></span>
                    <span class="holiday-title-text" :title="cell.holiday.description">
                      {{ cell.holiday.description }}
                    </span>
                  </div>

                  <q-icon
                    v-if="isProjectManager"
                    name="edit"
                    size="12px"
                    class="q-ml-xs q-mt-xs flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- 3. LIST / TABLE VIEW -->
      <q-card
        v-else
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders overflow-hidden q-pa-md"
      >
        <q-table
          flat
          :rows="holidays"
          :columns="columns"
          row-key="holiday_id"
          :loading="loading"
          :pagination="{ rowsPerPage: 15 }"
          :dark="$q.dark.isActive"
          no-data-label="No holidays scheduled yet."
        >
          <template #body-cell-holiday_date="props">
            <q-td :props="props">
              <div class="text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                {{ formatPrettyDate(props.row.holiday_date) }}
              </div>
              <div class="text-caption text-grey-6">
                {{ getDayOfWeekName(props.row.holiday_date) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-description="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                size="sm"
                icon="event"
                :label="props.row.description"
                class="text-weight-bold"
                :style="{
                  background: $q.dark.isActive ? 'rgba(245, 158, 11, 0.14)' : '#fff8e6',
                  color: $q.dark.isActive ? '#fbbf24' : '#b45309',
                  border: $q.dark.isActive
                    ? '1px solid rgba(245, 158, 11, 0.25)'
                    : '1px solid #fde68a',
                  borderLeft: '3px solid #f59e0b',
                }"
              />
            </q-td>
          </template>

          <template v-if="isProjectManager" #body-cell-actions="props">
            <q-td :props="props" align="right">
              <div class="row items-center justify-end q-gutter-xs no-wrap">
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
    </div>

    <!-- 4. ADD / EDIT HOLIDAY MODAL (PM ONLY) -->
    <q-dialog v-model="holidayDialog.show" persistent>
      <q-card :dark="$q.dark.isActive" style="width: 480px; max-width: 92vw">
        <!-- Dialog Header -->
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center q-gutter-xs">
            <q-avatar
              size="32px"
              rounded
              :color="$q.dark.isActive ? 'blue-10' : 'blue-1'"
              :text-color="$q.dark.isActive ? 'blue-2' : 'primary'"
              icon="event"
            />
            <div class="text-subtitle1 text-weight-bold q-ml-xs">
              {{ holidayDialog.isEdit ? 'Edit Holiday' : 'Add Company Holiday' }}
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
              mask="####-##-##"
              :rules="[(val) => !!val || 'Holiday date is required', validateDate]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer text-primary">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="holidayDialog.form.holiday_date"
                      mask="YYYY-MM-DD"
                      :dark="$q.dark.isActive"
                    >
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
              :rules="[(val) => (!!val && val.trim().length > 0) || 'Description is required']"
            />
          </q-card-section>

          <q-separator />

          <!-- Dialog Actions Footer -->
          <q-card-actions class="row items-center justify-between q-pa-md">
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

            <div class="row items-center q-gutter-xs">
              <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
              <q-btn
                unelevated
                :label="holidayDialog.isEdit ? 'Save Changes' : 'Create Holiday'"
                color="primary"
                type="submit"
                :loading="holidayDialog.saving"
                no-caps
                class="text-weight-bold"
              />
            </div>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- 5. DELETE CONFIRMATION MODAL -->
    <q-dialog v-model="deleteDialog.show">
      <q-card :dark="$q.dark.isActive" style="width: 420px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="delete" color="red-1" text-color="negative" size="38px" />
          <div class="text-subtitle1 text-weight-bold q-ml-md">Remove Holiday?</div>
        </q-card-section>

        <q-card-section class="text-body2 q-pt-md">
          Are you sure you want to remove
          <strong>{{ deleteDialog.holiday?.description }}</strong> on
          <strong>{{ deleteDialog.holiday?.holiday_date }}</strong
          >? This will restore regular working capacity.
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
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
  getResourceWorkScheduleApi,
  type HolidayItem,
  type DayOfWeek,
} from '@/services/api';

const $q = useQuasar();
const authStore = useAuthStore();

const isProjectManager = computed(() => authStore.user?.role === 'PROJECT_MANAGER');

const loading = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');
const holidays = ref<HolidayItem[]>([]);
const userNonWorkingDays = ref<DayOfWeek[]>(['SATURDAY', 'SUNDAY']);

const DAY_OF_WEEK_INDEX: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

function isDateNonWorking(d: Date): boolean {
  const dayName = DAY_OF_WEEK_INDEX[d.getDay()];
  if (!dayName) return false;
  return userNonWorkingDays.value.includes(dayName);
}

function isWeekdayHeaderNonWorking(dayIdx: number): boolean {
  const dayName = DAY_OF_WEEK_INDEX[dayIdx];
  if (!dayName) return false;
  return userNonWorkingDays.value.includes(dayName);
}

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
  return holidays.value.filter((h) => h.holiday_date.startsWith(prefix)).length;
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
      isWeekend: isDateNonWorking(prevDate),
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
      isWeekend: isDateNonWorking(curDate),
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
        isWeekend: isDateNonWorking(nextDate),
        holiday: holidaysByDate.value.get(dateKey),
      });
    }
  }

  return cells;
});

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

async function saveHoliday() {
  const { form, isEdit, holidayId } = holidayDialog.value;

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

async function loadUserData() {
  if (authStore.user?.role === 'RESOURCE') {
    try {
      const schedule = await getResourceWorkScheduleApi('me');
      if (schedule && Array.isArray(schedule.non_working_days)) {
        userNonWorkingDays.value = schedule.non_working_days;
      }
    } catch (e) {
      console.error('Failed to load user schedule in calendar:', e);
    }
  }
}

onMounted(() => {
  void loadHolidays();
  void loadUserData();
});
</script>

<style scoped lang="scss">
.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.calendar-weekdays-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  width: 100%;
}

.weekday-col-header {
  padding: 10px 4px;
  text-align: center;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  min-width: 0;
  overflow: hidden;
}

.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: minmax(118px, 1fr);
  width: 100%;
}

.calendar-day-cell {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px;
  display: flex;
  flex-direction: column;
  background: transparent;
  min-width: 0;
  overflow: hidden;
  transition: background 0.12s ease;

  &:nth-child(7n) {
    border-right: none;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
  &.is-weekend {
    background: rgba(0, 0, 0, 0.03);
  }
  &.is-other-month {
    opacity: 0.4;
  }
  &.is-today {
    background: rgba(59, 130, 246, 0.08);
    outline: 2px solid var(--q-primary);
    outline-offset: -2px;
  }
  &.has-holiday {
    background: rgba(245, 158, 11, 0.06);
  }
}

.day-number-badge {
  font-size: 12.5px;
  font-weight: 700;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  &.today-highlight {
    background: var(--q-primary);
    color: #ffffff !important;
  }
}

.quick-add-btn {
  opacity: 0;
  transition: opacity 0.12s ease;
}

.calendar-day-cell:hover .quick-add-btn {
  opacity: 1;
}

.holiday-badge-card {
  background: #fff8e6;
  color: #b45309;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  width: 100%;
  box-sizing: border-box;

  &.is-clickable {
    cursor: pointer;
    &:hover {
      background: #fef3c7;
      border-color: #f59e0b;
      transform: translateY(-1px);
    }
  }
}

.holiday-title-text {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.25;
}

.holiday-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

body.body--dark {
  .border-bottom {
    border-color: rgba(255, 255, 255, 0.08);
  }
  .calendar-day-cell {
    border-color: rgba(255, 255, 255, 0.08);
    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }
    &.is-weekend {
      background: #10141e;
    }
    &.is-other-month {
      background: #0d1017;
    }
    &.has-holiday {
      background: rgba(245, 158, 11, 0.08);
    }
  }
  .holiday-badge-card {
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.25);
    border-left: 3px solid #f59e0b;
  }
}
</style>
