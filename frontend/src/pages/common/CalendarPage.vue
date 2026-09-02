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
            class="text-weight-bold rounded-borders"
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
        <!-- Calendar Toolbar & Month Switcher -->
        <q-card-section
          class="row items-center justify-between q-pa-md wrap q-col-gutter-sm"
        >
          <!-- Month Navigation -->
          <div class="row items-center q-gutter-xs">
            <q-btn flat dense round icon="chevron_left" @click="prevMonth">
              <q-tooltip>Previous Month</q-tooltip>
            </q-btn>

            <div
              class="text-subtitle1 text-weight-bold q-px-sm text-center"
              style="min-width: 160px"
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

        <q-separator :dark="$q.dark.isActive" />

        <!-- Quasar QCalendar Month Component -->
        <q-calendar-month
          ref="calendarRef"
          v-model="selectedDate"
          :dark="$q.dark.isActive"
          :bordered="true"
          :hoverable="true"
          :focusable="true"
          :day-min-height="115"
          :weekdays="[0, 1, 2, 3, 4, 5, 6]"
          class="q-calendar-custom full-width"
        >
          <template #day="{ scope: { timestamp } }">
            <div
              class="calendar-day-cell full-height column justify-between q-pa-sm cursor-pointer"
              :class="[
                getDayBgClass(timestamp),
                {
                  'dimmed': timestamp.outside,
                  'today-cell': timestamp.current,
                },
              ]"
              @click="onDayClick(timestamp.date)"
            >
              <!-- Cell Top: Day Number & Add Action -->
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-xs">
                  <q-avatar
                    size="24px"
                    font-size="12px"
                    rounded
                    :color="timestamp.current ? 'primary' : undefined"
                    :text-color="
                      timestamp.current
                        ? 'white'
                        : timestamp.outside
                          ? ($q.dark.isActive ? 'grey-7' : 'grey-5')
                          : isDateKeyNonWorking(timestamp.date, timestamp.weekday)
                            ? ($q.dark.isActive ? 'grey-5' : 'grey-6')
                            : ($q.dark.isActive ? 'grey-3' : 'grey-9')
                    "
                    class="text-weight-bold"
                  >
                    {{ timestamp.day }}
                  </q-avatar>

                  <q-badge
                    v-if="
                      isDateKeyNonWorking(timestamp.date, timestamp.weekday) && !timestamp.outside
                    "
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
                  v-if="isProjectManager && !holidaysByDate.get(timestamp.date)"
                  flat
                  round
                  dense
                  icon="add"
                  size="xs"
                  color="primary"
                  class="quick-add-btn"
                  @click.stop="openAddHolidayDialog(timestamp.date)"
                >
                  <q-tooltip>Add holiday on {{ timestamp.date }}</q-tooltip>
                </q-btn>
              </div>

              <!-- Cell Center / Holiday Badge -->
              <div class="col column justify-start" style="min-width: 0">
                <q-card
                  v-if="holidaysByDate.get(timestamp.date)"
                  flat
                  bordered
                  :dark="$q.dark.isActive"
                  class="holiday-badge-card full-width q-pa-xs rounded-borders"
                  :class="isProjectManager ? 'cursor-pointer' : ''"
                  @click.stop="onHolidayClick(holidaysByDate.get(timestamp.date)!)"
                >
                  <div class="row items-start justify-between no-wrap">
                    <div class="row items-start no-wrap q-gutter-xs col">
                      <q-badge
                        rounded
                        color="amber-8"
                        class="q-mt-xs flex-shrink-0"
                        style="width: 6px; height: 6px; min-height: 0; padding: 0"
                      />
                      <div
                        class="text-caption text-weight-bold col"
                        style="font-size: 11px; line-height: 1.25"
                        :title="holidaysByDate.get(timestamp.date)!.description"
                      >
                        {{ holidaysByDate.get(timestamp.date)!.description }}
                      </div>
                    </div>

                    <q-icon
                      v-if="isProjectManager"
                      name="edit"
                      size="12px"
                      class="q-ml-xs q-mt-xs flex-shrink-0"
                    />
                  </div>
                </q-card>
              </div>
            </div>
          </template>
        </q-calendar-month>
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
                class="holiday-badge-card text-weight-bold"
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
import { QCalendarMonth } from '@quasar/quasar-ui-qcalendar';
import '@quasar/quasar-ui-qcalendar/dist/QCalendarMonth.min.css';
import '@quasar/quasar-ui-qcalendar/dist/QCalendarVariables.min.css';
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

interface QCalendarMonthInstance {
  prev: () => void;
  next: () => void;
  moveToToday: () => void;
}

const calendarRef = ref<QCalendarMonthInstance | null>(null);
const selectedDate = ref(formatDate(new Date()));

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

function isDateKeyNonWorking(dateStr: string, weekday?: number): boolean {
  if (weekday !== undefined) {
    const dayName = DAY_OF_WEEK_INDEX[weekday];
    if (dayName) return userNonWorkingDays.value.includes(dayName);
  }
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0]! : dateStr;
  const d = new Date(`${cleanStr}T00:00:00`);
  return isDateNonWorking(d);
}

const currentYear = computed(() => {
  if (!selectedDate.value) return new Date().getFullYear();
  return parseInt(selectedDate.value.split('-')[0]!, 10);
});

const currentMonth = computed(() => {
  if (!selectedDate.value) return new Date().getMonth();
  return parseInt(selectedDate.value.split('-')[1]!, 10) - 1;
});

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
  if (calendarRef.value) {
    calendarRef.value.prev();
  } else {
    const cur = new Date(currentYear.value, currentMonth.value - 1, 1);
    selectedDate.value = formatDate(cur);
  }
}

function nextMonth() {
  if (calendarRef.value) {
    calendarRef.value.next();
  } else {
    const cur = new Date(currentYear.value, currentMonth.value + 1, 1);
    selectedDate.value = formatDate(cur);
  }
}

function goToToday() {
  selectedDate.value = formatDate(new Date());
  if (calendarRef.value) {
    calendarRef.value.moveToToday();
  }
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

function onDayClick(dateKey: string) {
  if (!isProjectManager.value) return;
  const holiday = holidaysByDate.value.get(dateKey);
  if (holiday) {
    openEditHolidayDialog(holiday);
  } else {
    openAddHolidayDialog(dateKey);
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

function getDayBgClass(timestamp: { date: string; weekday: number; current?: boolean }) {
  if (timestamp.current) return 'is-today-day';
  if (holidaysByDate.value.has(timestamp.date)) return 'has-holiday-day';
  if (isDateKeyNonWorking(timestamp.date, timestamp.weekday)) return 'is-weekend-day';
  return 'is-default-day';
}

onMounted(() => {
  void loadHolidays();
  void loadUserData();
});
</script>

<style scoped lang="scss">
.q-calendar-custom {
  width: 100%;
  --cal-border: #cbd5e1;
  --cal-head-bg: #f8fafc;
  --cal-day-bg: #ffffff;
  --cal-weekend-bg: #f8fafc;
  --cal-today-bg: #eff6ff;
  --cal-holiday-bg: #fffbeb;
  --cal-card-bg: #fff8e6;
  --cal-card-color: #b45309;
  --cal-card-border: #fde68a;

  :deep(.q-calendar-month__head) {
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.04em;
    background: var(--cal-head-bg);
    border-bottom: 1px solid var(--cal-border);
  }

  :deep(.q-calendar-month__head--weekday) {
    border-right: 1px solid var(--cal-border);
    padding: 10px 0;
    text-align: center;
    &:last-child {
      border-right: none;
    }
  }

  :deep(.q-calendar-month__week--wrapper) {
    border-bottom: 1px solid var(--cal-border);
    &:last-child {
      border-bottom: none;
    }
  }

  :deep(.q-calendar-month__day) {
    padding: 0;
    vertical-align: top;
    border-right: 1px solid var(--cal-border);
    &:last-child {
      border-right: none;
    }
  }

  :deep(.q-calendar-month__day--label__wrapper) {
    display: none !important;
  }
}

.is-default-day {
  background: var(--cal-day-bg);
}
.is-weekend-day {
  background: var(--cal-weekend-bg);
}
.has-holiday-day {
  background: var(--cal-holiday-bg);
}
.is-today-day {
  background: var(--cal-today-bg);
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.holiday-badge-card {
  background: var(--cal-card-bg);
  color: var(--cal-card-color);
  border: 1px solid var(--cal-card-border);
  border-left: 3px solid #f59e0b;
}

.calendar-day-cell {
  min-height: 120px;
  box-sizing: border-box;
  transition: filter 0.12s ease;

  &:hover {
    filter: brightness(0.97);
  }

  .quick-add-btn {
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  &:hover .quick-add-btn {
    opacity: 1;
  }
}

body.body--dark {
  .q-calendar-custom {
    --cal-border: #334155;
    --cal-head-bg: #181d28;
    --cal-day-bg: #11151f;
    --cal-weekend-bg: #161c28;
    --cal-today-bg: rgba(59, 130, 246, 0.14);
    --cal-holiday-bg: rgba(245, 158, 11, 0.1);
    --cal-card-bg: rgba(245, 158, 11, 0.16);
    --cal-card-color: #fbbf24;
    --cal-card-border: rgba(245, 158, 11, 0.35);

    :deep(.q-calendar-month__head) {
      color: #94a3b8;
    }
  }

  .calendar-day-cell:hover {
    filter: brightness(1.15);
  }
}
</style>
