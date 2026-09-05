<template>
  <q-page class="leaves-page q-pa-lg">
    <!-- 1. PAGE HEADER & COMPACT METRICS -->
    <div class="row items-center justify-between q-mb-md flex-wrap gap-md">
      <!-- Left: Title & Subtitle -->
      <div>
        <div class="row items-center gap-xs">
          <q-icon name="event_busy" size="28px" color="primary" />
          <h1 class="page-title q-my-none">Leaves & Time Off</h1>
        </div>
        <p class="page-subtitle q-mb-none q-mt-xs">
          {{
            isProjectManager
              ? 'Track, review, approve, and manage time off requests across team resources'
              : 'Review your scheduled leaves, check your capacity, and request new time off'
          }}
        </p>
      </div>

      <!-- Right: Main Actions -->
      <div class="row items-center q-gutter-sm">
        <q-btn
          color="primary"
          icon="add"
          label="Request Time Off"
          unelevated
          no-caps
          class="action-btn-primary"
          @click="openLeaveDialog"
        />
        <q-btn
          outline
          no-caps
          icon="refresh"
          label="Refresh"
          class="action-btn-outline"
          :loading="loading"
          @click="loadData"
        />
      </div>
    </div>

    <!-- 2. SUMMARY METRICS CARDS -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-3">
        <q-card flat bordered class="metric-card bg-purple-soft text-purple q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-grey-7">Total Applied Leaves</div>
              <div class="text-h5 text-weight-bold">{{ leavesList.length }}</div>
            </div>
            <q-avatar color="white" text-color="primary" icon="assignment_turned_in" size="44px" />
          </div>
        </q-card>
      </div>

      <div class="col-12 col-sm-3">
        <q-card flat bordered class="metric-card bg-amber-soft text-amber-9 q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-grey-7">Pending Approval</div>
              <div class="text-h5 text-weight-bold">{{ pendingLeavesCount }}</div>
            </div>
            <q-avatar color="white" text-color="amber-9" icon="pending_actions" size="44px" />
          </div>
        </q-card>
      </div>

      <div class="col-12 col-sm-3">
        <q-card flat bordered class="metric-card bg-blue-soft text-blue q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-grey-7">Future Time Off</div>
              <div class="text-h5 text-weight-bold">{{ futureLeavesCount }}</div>
            </div>
            <q-avatar color="white" text-color="blue" icon="upcoming" size="44px" />
          </div>
        </q-card>
      </div>

      <div class="col-12 col-sm-3">
        <q-card flat bordered class="metric-card bg-orange-soft text-orange q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-grey-7">Leaves This Month</div>
              <div class="text-h5 text-weight-bold">{{ currentMonthLeavesCount }}</div>
            </div>
            <q-avatar color="white" text-color="orange" icon="calendar_today" size="44px" />
          </div>
        </q-card>
      </div>
    </div>

    <!-- 3. FILTERS CARD -->
    <q-card flat bordered class="q-mb-lg filter-card">
      <q-card-section class="q-py-md">
        <div class="row q-col-gutter-md items-center">
          <!-- Resource Selector (PM Only) -->
          <div v-if="isProjectManager" class="col-12 col-sm-3">
            <q-select
              v-model="filters.user_id"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Filter by Resource"
              :options="resourceOptions"
              @update:model-value="loadLeaves"
            />
          </div>

          <!-- Status Filter -->
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filters.status"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Filter by Status"
              :options="statusFilterOptions"
              @update:model-value="loadLeaves"
            />
          </div>

          <!-- Start Date Filter -->
          <div class="col-12 col-sm-2">
            <q-input
              v-model="filters.startDate"
              outlined
              dense
              clearable
              label="From Date"
              @update:model-value="loadLeaves"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="filters.startDate" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- End Date Filter -->
          <div class="col-12 col-sm-2">
            <q-input
              v-model="filters.endDate"
              outlined
              dense
              clearable
              label="To Date"
              @update:model-value="loadLeaves"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="filters.endDate" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Reset Button -->
          <div class="col-12 col-sm-2 text-right">
            <q-btn
              label="Reset Filters"
              flat
              no-caps
              color="primary"
              icon="clear"
              @click="resetFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 4. LEAVES DATA TABLE -->
    <q-card flat bordered :dark="$q.dark.isActive" class="table-card">
      <q-table
        flat
        :dark="$q.dark.isActive"
        :rows="leavesList"
        :columns="tableColumns"
        row-key="leave_id"
        no-data-label="No leave records matching the search criteria"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
        class="text-main"
      >
        <!-- Custom Resource Cell (PM View Only) -->
        <template v-if="isProjectManager" #body-cell-user_id="props">
          <q-td :props="props">
            <div class="row items-center gap-xs">
              <q-avatar color="primary" text-color="white" size="24px">
                {{ getResourceInitials(props.row.user_id, props.row.user_name) }}
              </q-avatar>
              <div class="column">
                <span class="text-weight-medium text-main">{{
                  props.row.user_name || getResourceName(props.row.user_id)
                }}</span>
                <span v-if="props.row.user_email" class="text-caption text-grey-6">{{
                  props.row.user_email
                }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <!-- Date / Range Formatting -->
        <template #body-cell-leave_date="props">
          <q-td :props="props">
            <template
              v-if="
                props.row.start_date &&
                props.row.end_date &&
                props.row.start_date !== props.row.end_date
              "
            >
              <div class="text-weight-medium text-primary">
                {{ formatDate(props.row.start_date) }} – {{ formatDate(props.row.end_date) }}
              </div>
              <div class="text-caption text-grey-6 q-mb-xs">
                {{ props.row.total_days }} working days ({{ props.row.start_date }} to
                {{ props.row.end_date }})
              </div>
              <div class="row items-center gap-xs wrap">
                <q-badge
                  v-if="props.row.start_day_type === 'SECOND_HALF'"
                  color="primary"
                  label="Starts: 2nd Half"
                  class="text-weight-bold"
                  style="font-size: 10px"
                />
                <q-badge
                  v-if="props.row.end_day_type === 'FIRST_HALF'"
                  color="primary"
                  label="Ends: 1st Half"
                  class="text-weight-bold"
                  style="font-size: 10px"
                />
              </div>
            </template>
            <template v-else>
              <div class="text-weight-medium">
                {{ formatDate(props.row.leave_date || props.row.start_date) }}
              </div>
            </template>
          </q-td>
        </template>

        <!-- Leave Type / Hours Formatting -->
        <template #body-cell-leave_type="props">
          <q-td :props="props">
            <template
              v-if="
                props.row.start_date &&
                props.row.end_date &&
                props.row.start_date !== props.row.end_date
              "
            >
              <div class="text-weight-medium">Multi-Day Leave</div>
              <div class="text-caption text-grey-6">
                {{ formatHours(props.row.total_hours || props.row.leave_hours) }} ({{
                  props.row.total_days
                }}
                days)
              </div>
            </template>
            <template v-else>
              <div class="text-weight-medium">
                {{
                  props.row.leave_type === 'FIRST_HALF'
                    ? 'First Half'
                    : props.row.leave_type === 'SECOND_HALF'
                      ? 'Second Half'
                      : 'Full Day'
                }}
              </div>
              <div class="text-caption text-grey-6">{{ formatHours(props.row.leave_hours) }}</div>
            </template>
          </q-td>
        </template>

        <!-- Status Column -->
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              dense
              square
              :color="getStatusColor(props.row.status)"
              :text-color="getStatusTextColor(props.row.status)"
              class="text-caption text-weight-bold"
            >
              <q-icon
                :name="
                  props.row.status === 'APPROVED'
                    ? 'check_circle'
                    : props.row.status === 'PENDING'
                      ? 'hourglass_empty'
                      : 'cancel'
                "
                size="12px"
                class="q-mr-xs"
              />
              {{ props.row.status }}
            </q-chip>
            <div
              v-if="props.row.status === 'APPROVED'"
              class="text-caption text-grey-7 q-mt-xs row items-center no-wrap justify-center gap-xs"
              style="font-size: 11px"
            >
              <q-icon name="verified_user" size="13px" color="positive" />
              <span
                >Approved by
                <strong>{{ props.row.approver_name || 'Project Manager' }}</strong></span
              >
            </div>
            <div
              v-else-if="props.row.status === 'REJECTED'"
              class="text-caption text-negative q-mt-xs"
              style="font-size: 11px"
            >
              <div>{{ props.row.rejection_reason || 'Rejected' }}</div>
              <div v-if="props.row.approver_name" class="text-grey-6" style="font-size: 10px">
                by {{ props.row.approver_name }}
              </div>
            </div>
            <div
              v-else-if="props.row.status === 'PENDING'"
              class="text-caption text-grey-6 q-mt-xs"
              style="font-size: 10px"
            >
              Pending Approval
            </div>
          </q-td>
        </template>

        <!-- Action Buttons -->
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <div class="row items-center justify-center q-gutter-xs no-wrap">
              <!-- PM Approve Button -->
              <template v-if="isProjectManager && props.row.status === 'PENDING'">
                <!-- Can only approve if earliest date is in the future -->
                <q-btn
                  v-if="canApproveLeave(props.row.start_date || props.row.leave_date)"
                  dense
                  flat
                  round
                  color="positive"
                  icon="check"
                  :loading="actionInProgressId === (props.row.request_id || props.row.leave_id)"
                  @click="handleApproveLeave(props.row.request_id || props.row.leave_id)"
                >
                  <q-tooltip>Approve Leave & Recalculate Schedule</q-tooltip>
                </q-btn>
                <div v-else>
                  <q-btn dense flat round disable color="grey-5" icon="check">
                    <q-tooltip
                      >Cannot approve: Leave start date has already arrived or passed</q-tooltip
                    >
                  </q-btn>
                </div>

                <!-- PM Reject Button -->
                <q-btn
                  dense
                  flat
                  round
                  color="negative"
                  icon="close"
                  :loading="actionInProgressId === (props.row.request_id || props.row.leave_id)"
                  @click="openRejectDialog(props.row.request_id || props.row.leave_id)"
                >
                  <q-tooltip>Reject Leave</q-tooltip>
                </q-btn>
              </template>

              <!-- Delete / Cancel Button -->
              <q-btn
                flat
                round
                dense
                color="grey-7"
                icon="delete"
                @click="confirmCancelLeave(props.row.request_id || props.row.leave_id)"
              >
                <q-tooltip>Delete / Cancel Leave</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 5. REQUEST LEAVE MODAL DIALOG -->
    <q-dialog v-model="showLeaveDialog">
      <q-card :dark="$q.dark.isActive" style="min-width: 400px; border-radius: 12px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div
            class="text-h6 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            {{
              isProjectManager
                ? 'Apply Leave (On Behalf - Pre-approved)'
                : 'Request Leave (Pending PM Approval)'
            }}
          </div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form @submit.prevent="handleApplyLeave">
          <q-card-section class="q-gutter-md q-pt-md">
            <!-- Resource Selection Dropdown (PM View Only) -->
            <q-select
              v-if="isProjectManager"
              v-model="leaveForm.user_id"
              outlined
              dense
              emit-value
              map-options
              label="Select Team Resource *"
              :options="resourceOptions"
              :rules="[(val) => !!val || 'Resource selection is required']"
              @update:model-value="onResourceSelectChange"
            />

            <!-- Date Pickers (Start Date & End Date) -->
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="leaveForm.start_date"
                  outlined
                  dense
                  label="Start Date (YYYY-MM-DD) *"
                  :rules="[(val) => !!val || 'Start date is required']"
                  @update:model-value="
                    (val) => {
                      if (val && (!leaveForm.end_date || leaveForm.end_date < String(val)))
                        leaveForm.end_date = String(val);
                    }
                  "
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date
                          v-model="leaveForm.start_date"
                          mask="YYYY-MM-DD"
                          :options="isStartDateAllowed"
                        >
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="leaveForm.end_date"
                  outlined
                  dense
                  label="End Date (YYYY-MM-DD) *"
                  :rules="[
                    (val) => !!val || 'End date is required',
                    (val) =>
                      !leaveForm.start_date ||
                      val >= leaveForm.start_date ||
                      'End date must be on or after start date',
                  ]"
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date
                          v-model="leaveForm.end_date"
                          mask="YYYY-MM-DD"
                          :options="isEndDateAllowed"
                        >
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Single Day Leave Type Input -->
            <div v-if="!isMultiDayLeave">
              <q-select
                v-model="leaveForm.leave_type"
                outlined
                dense
                emit-value
                map-options
                label="Leave Type *"
                :options="singleDayLeaveOptions"
              />
            </div>

            <!-- Multi-Day Half-Day Configuration -->
            <div v-else class="q-gutter-sm bg-grey-1 q-pa-sm rounded-borders">
              <div class="text-caption text-weight-medium text-grey-8">Half-Day Settings:</div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="leaveForm.start_day_type"
                    outlined
                    dense
                    emit-value
                    map-options
                    label="Start Day *"
                    :options="startDayTypeOptions"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="leaveForm.end_day_type"
                    outlined
                    dense
                    emit-value
                    map-options
                    label="End Day *"
                    :options="endDayTypeOptions"
                  />
                </div>
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Intermediate days between start and end date will be treated as Full Days.
                Non-working days and holidays are automatically excluded.
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              :label="isProjectManager ? 'Apply & Approve Leave' : 'Submit Request'"
              :loading="leaveSubmitting"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- 6. REJECT LEAVE MODAL DIALOG -->
    <q-dialog v-model="showRejectModal">
      <q-card :dark="$q.dark.isActive" style="min-width: 400px; border-radius: 12px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-h6 text-weight-bold text-negative">Reject Leave Request</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-card-section class="q-gutter-md q-pt-md">
          <div class="text-body2 text-grey-7">
            Please specify the reason for rejecting this leave request (optional):
          </div>
          <q-input
            v-model="rejectionReason"
            outlined
            dense
            type="textarea"
            rows="3"
            label="Rejection Reason"
            maxlength="255"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn v-close-popup flat no-caps label="Cancel" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Confirm Rejection"
            :loading="rejectSubmitting"
            @click="handleRejectLeaveConfirm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { formatDate, formatHours } from '@/utils/formatters';
import { useAuthStore } from '@/stores/auth';
import {
  getLeavesApi,
  createLeaveApi,
  approveLeaveApi,
  rejectLeaveApi,
  deleteLeaveApi,
  getResourcesApi,
} from '@/services/api';
import type { LeaveItem, LeaveStatus } from '@/services/api';

const $q = useQuasar();
const authStore = useAuthStore();

const isProjectManager = computed(() => authStore.user?.role === 'PROJECT_MANAGER');

const currentUserId = computed(() => {
  const u = authStore.user;
  if (u && u.user_id) {
    return Number(u.user_id);
  }
  return null;
});

interface ResourceListItem {
  user_id: number;
  name: string;
  email: string;
  role?: string;
}

// State definitions
const loading = ref(false);
const leavesList = ref<LeaveItem[]>([]);
const resourcesList = ref<ResourceListItem[]>([]);
const actionInProgressId = ref<number | string | null>(null);

// Reject Modal State
const showRejectModal = ref(false);
const rejectingLeaveId = ref<number | string | null>(null);
const rejectionReason = ref('');
const rejectSubmitting = ref(false);

// Filter parameters
const filters = reactive<{
  user_id?: number | undefined;
  startDate: string;
  endDate: string;
  status?: LeaveStatus | undefined;
}>({
  user_id: undefined,
  startDate: '',
  endDate: '',
  status: undefined,
});

const statusFilterOptions = [
  { label: 'All Statuses', value: undefined },
  { label: 'Pending Approval', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

// Dialog form states
const showLeaveDialog = ref(false);
const leaveSubmitting = ref(false);
const leaveForm = reactive<{
  user_id: number | null;
  start_date: string;
  end_date: string;
  leave_type: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
  start_day_type: 'FULL_DAY' | 'SECOND_HALF';
  end_day_type: 'FULL_DAY' | 'FIRST_HALF';
}>({
  user_id: null,
  start_date: '',
  end_date: '',
  leave_type: 'FULL_DAY',
  start_day_type: 'FULL_DAY',
  end_day_type: 'FULL_DAY',
});

const isMultiDayLeave = computed(() => {
  return !!(
    leaveForm.start_date &&
    leaveForm.end_date &&
    leaveForm.start_date < leaveForm.end_date
  );
});

// Dialog leaves data for accurate resource availability checks
const dialogLeavesList = ref<LeaveItem[]>([]);

async function onResourceSelectChange(userId: number | null) {
  if (userId) {
    try {
      dialogLeavesList.value = await getLeavesApi({ user_id: Number(userId) });
    } catch {
      dialogLeavesList.value = [];
    }
  } else {
    dialogLeavesList.value = [];
  }
  if (leaveForm.start_date && isDateFullyBooked(leaveForm.start_date)) {
    leaveForm.start_date = '';
    leaveForm.end_date = '';
  }
}

// User leaves map per date
const userLeaveMap = computed(() => {
  const map = new Map<
    string,
    { hasFull: boolean; hasFirstHalf: boolean; hasSecondHalf: boolean }
  >();
  const targetId = isProjectManager.value ? leaveForm.user_id : currentUserId.value;
  const listToUse =
    isProjectManager.value && dialogLeavesList.value.length > 0
      ? dialogLeavesList.value
      : leavesList.value;

  for (const l of listToUse) {
    if (targetId && Number(l.user_id) !== Number(targetId)) continue;
    if (l.status === 'REJECTED') continue;

    if (l.days_breakdown && l.days_breakdown.length > 0) {
      for (const d of l.days_breakdown) {
        if (d.status === 'REJECTED') continue;
        const dStr = String(d.leave_date).split('T')[0]!;
        if (!map.has(dStr)) {
          map.set(dStr, { hasFull: false, hasFirstHalf: false, hasSecondHalf: false });
        }
        const entry = map.get(dStr)!;
        if (d.leave_type === 'FULL_DAY') entry.hasFull = true;
        else if (d.leave_type === 'FIRST_HALF') entry.hasFirstHalf = true;
        else if (d.leave_type === 'SECOND_HALF') entry.hasSecondHalf = true;
      }
    } else {
      const dStr = String(l.leave_date || l.start_date).split('T')[0]!;
      if (!map.has(dStr)) {
        map.set(dStr, { hasFull: false, hasFirstHalf: false, hasSecondHalf: false });
      }
      const entry = map.get(dStr)!;
      if (l.leave_type === 'FULL_DAY') entry.hasFull = true;
      else if (l.leave_type === 'FIRST_HALF') entry.hasFirstHalf = true;
      else if (l.leave_type === 'SECOND_HALF') entry.hasSecondHalf = true;
    }
  }
  return map;
});

function isDateFullyBooked(dateStr: string): boolean {
  const entry = userLeaveMap.value.get(dateStr);
  if (!entry) return false;
  return entry.hasFull || (entry.hasFirstHalf && entry.hasSecondHalf);
}

function isStartDateAllowed(date: string): boolean {
  const dateStr = date.replaceAll('/', '-');
  return !isDateFullyBooked(dateStr);
}

function isEndDateAllowed(date: string): boolean {
  const dateStr = date.replaceAll('/', '-');
  if (leaveForm.start_date && dateStr < leaveForm.start_date) return false;
  return !isDateFullyBooked(dateStr);
}

const singleDayLeaveOptions = computed<
  Array<{ label: string; value: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF' }>
>(() => {
  if (!leaveForm.start_date) {
    return [
      { label: 'Full Day', value: 'FULL_DAY' },
      { label: 'First Half', value: 'FIRST_HALF' },
      { label: 'Second Half', value: 'SECOND_HALF' },
    ];
  }
  const entry = userLeaveMap.value.get(leaveForm.start_date);
  if (entry) {
    if (entry.hasFull || (entry.hasFirstHalf && entry.hasSecondHalf)) {
      return [];
    }
    if (entry.hasFirstHalf && !entry.hasSecondHalf) {
      return [{ label: 'Second Half', value: 'SECOND_HALF' }];
    }
    if (entry.hasSecondHalf && !entry.hasFirstHalf) {
      return [{ label: 'First Half', value: 'FIRST_HALF' }];
    }
  }
  return [
    { label: 'Full Day', value: 'FULL_DAY' },
    { label: 'First Half', value: 'FIRST_HALF' },
    { label: 'Second Half', value: 'SECOND_HALF' },
  ];
});

const startDayTypeOptions = computed<Array<{ label: string; value: 'FULL_DAY' | 'SECOND_HALF' }>>(
  () => {
    if (!leaveForm.start_date) {
      return [
        { label: 'Full Day', value: 'FULL_DAY' },
        { label: 'Second Half', value: 'SECOND_HALF' },
      ];
    }
    const entry = userLeaveMap.value.get(leaveForm.start_date);
    if (entry) {
      if (entry.hasFull || (entry.hasFirstHalf && entry.hasSecondHalf) || entry.hasSecondHalf) {
        return [];
      }
      if (entry.hasFirstHalf) {
        return [{ label: 'Second Half', value: 'SECOND_HALF' }];
      }
    }
    return [
      { label: 'Full Day', value: 'FULL_DAY' },
      { label: 'Second Half', value: 'SECOND_HALF' },
    ];
  },
);

const endDayTypeOptions = computed<Array<{ label: string; value: 'FULL_DAY' | 'FIRST_HALF' }>>(
  () => {
    if (!leaveForm.end_date) {
      return [
        { label: 'Full Day', value: 'FULL_DAY' },
        { label: 'First Half', value: 'FIRST_HALF' },
      ];
    }
    const entry = userLeaveMap.value.get(leaveForm.end_date);
    if (entry) {
      if (entry.hasFull || (entry.hasFirstHalf && entry.hasSecondHalf) || entry.hasFirstHalf) {
        return [];
      }
      if (entry.hasSecondHalf) {
        return [{ label: 'First Half', value: 'FIRST_HALF' }];
      }
    }
    return [
      { label: 'Full Day', value: 'FULL_DAY' },
      { label: 'First Half', value: 'FIRST_HALF' },
    ];
  },
);

// Watchers to synchronize selected leave types when options change
watch(
  () => [leaveForm.start_date, singleDayLeaveOptions.value],
  () => {
    const valid = singleDayLeaveOptions.value.map((o) => o.value);
    if (!valid.includes(leaveForm.leave_type) && valid[0]) {
      leaveForm.leave_type = valid[0];
    }
  },
);

watch(
  () => [leaveForm.start_date, startDayTypeOptions.value],
  () => {
    const valid = startDayTypeOptions.value.map((o) => o.value);
    if (!valid.includes(leaveForm.start_day_type) && valid[0]) {
      leaveForm.start_day_type = valid[0];
    }
  },
);

watch(
  () => [leaveForm.end_date, endDayTypeOptions.value],
  () => {
    const valid = endDayTypeOptions.value.map((o) => o.value);
    if (!valid.includes(leaveForm.end_day_type) && valid[0]) {
      leaveForm.end_day_type = valid[0];
    }
  },
);

// Columns based on User Role
const tableColumns = computed<QTableColumn<LeaveItem>[]>(() => {
  const cols: QTableColumn<LeaveItem>[] = [];

  if (isProjectManager.value) {
    cols.push({
      name: 'user_id',
      label: 'Team Resource',
      field: (l) => l.user_id,
      align: 'left',
      sortable: true,
    });
  }

  cols.push(
    {
      name: 'leave_date',
      label: 'Date',
      field: (l) => l.leave_date,
      align: 'left',
      sortable: true,
    },
    {
      name: 'leave_type',
      label: 'Leave Type / Hours',
      field: (l) => l.leave_type,
      align: 'center',
      sortable: true,
    },
    {
      name: 'status',
      label: 'Status',
      field: (l) => l.status,
      align: 'center',
      sortable: true,
    },
    {
      name: 'actions',
      label: 'Actions',
      field: () => '',
      align: 'center',
    },
  );

  return cols;
});

// Helper functions for status styling
function getStatusColor(status: LeaveStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'positive';
    case 'PENDING':
      return 'amber-2';
    case 'REJECTED':
      return 'negative';
    default:
      return 'grey';
  }
}

function getStatusTextColor(status: LeaveStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'white';
    case 'PENDING':
      return 'brown-10';
    case 'REJECTED':
      return 'white';
    default:
      return 'white';
  }
}

// Rule check: Leave can only be approved before the date the resource applied for
function canApproveLeave(leaveDateStr: string): boolean {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return todayStr < leaveDateStr;
}

// Dropdown options for resources selection
const resourceOptions = computed(() =>
  resourcesList.value.map((r) => ({
    label: r.name,
    value: Number(r.user_id),
  })),
);

// Summary metrics computed properties
const pendingLeavesCount = computed(() => {
  return leavesList.value.filter((l) => l.status === 'PENDING').length;
});

const futureLeavesCount = computed(() => {
  const todayStr = new Date().toISOString().split('T')[0]!;
  return leavesList.value.filter((l) => (l.end_date || l.leave_date) >= todayStr).length;
});

const currentMonthLeavesCount = computed(() => {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // e.g. YYYY-MM
  return leavesList.value.filter(
    (l) =>
      (l.start_date || l.leave_date).startsWith(currentMonthStr) ||
      (l.end_date || l.leave_date).startsWith(currentMonthStr),
  ).length;
});

// Resource maps lookup
const getResourceName = (userId: number): string => {
  const res = resourcesList.value.find((r) => Number(r.user_id) === Number(userId));
  return res ? String(res.name) : `Resource #${userId}`;
};

const getResourceInitials = (userId: number, name?: string): string => {
  const resName = name || getResourceName(userId);
  return resName
    .split(' ')
    .map((n: string) => n[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

// Data loaders
async function loadData() {
  loading.value = true;
  try {
    if (isProjectManager.value) {
      const dbResources = await getResourcesApi(
        currentUserId.value !== null ? { manager_id: currentUserId.value } : undefined,
      );
      resourcesList.value = dbResources;
    }
    await loadLeaves();
  } catch (error) {
    console.error('Failed to load LeavesPage configuration:', error);
  } finally {
    loading.value = false;
  }
}

async function loadLeaves() {
  try {
    const qParams: {
      user_id?: number;
      startDate?: string;
      endDate?: string;
      status?: LeaveStatus;
    } = {};

    // Map filters
    if (isProjectManager.value) {
      if (filters.user_id !== undefined && filters.user_id !== null) {
        qParams.user_id = filters.user_id;
      }
    } else {
      if (currentUserId.value !== null) {
        qParams.user_id = currentUserId.value;
      }
    }

    if (filters.status) qParams.status = filters.status;
    if (filters.startDate) qParams.startDate = filters.startDate;
    if (filters.endDate) qParams.endDate = filters.endDate;

    leavesList.value = await getLeavesApi(qParams);
  } catch (error) {
    console.error('Failed to fetch leaves:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to retrieve leaves data',
    });
  }
}

// Watch filters object changes to reload list automatically
watch(
  () => ({ ...filters }),
  () => {
    void loadLeaves();
  },
);

// Reset operations
function resetFilters() {
  filters.user_id = undefined;
  filters.status = undefined;
  filters.startDate = '';
  filters.endDate = '';
}

async function openLeaveDialog() {
  leaveForm.user_id = isProjectManager.value ? null : currentUserId.value;
  leaveForm.start_date = '';
  leaveForm.end_date = '';
  leaveForm.leave_type = 'FULL_DAY';
  leaveForm.start_day_type = 'FULL_DAY';
  leaveForm.end_day_type = 'FULL_DAY';
  dialogLeavesList.value = [];
  if (!isProjectManager.value && currentUserId.value) {
    try {
      dialogLeavesList.value = await getLeavesApi({ user_id: currentUserId.value });
    } catch {
      dialogLeavesList.value = leavesList.value;
    }
  }
  showLeaveDialog.value = true;
}

// Apply leave logic
async function handleApplyLeave() {
  const targetUserId = isProjectManager.value ? leaveForm.user_id : currentUserId.value;

  if (!targetUserId || !leaveForm.start_date || !leaveForm.end_date) {
    $q.notify({
      type: 'warning',
      message: 'Please complete all required fields.',
    });
    return;
  }

  if (leaveForm.start_date > leaveForm.end_date) {
    $q.notify({
      type: 'warning',
      message: 'Start date cannot be after end date.',
    });
    return;
  }

  leaveSubmitting.value = true;
  try {
    await createLeaveApi({
      user_id: targetUserId,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      leave_type: !isMultiDayLeave.value ? leaveForm.leave_type : undefined,
      start_day_type: isMultiDayLeave.value ? leaveForm.start_day_type : undefined,
      end_day_type: isMultiDayLeave.value ? leaveForm.end_day_type : undefined,
    });

    $q.notify({
      type: 'positive',
      message: isProjectManager.value
        ? 'Leave applied & approved. Project schedules recalculated.'
        : 'Leave request submitted successfully (pending PM approval).',
    });
    showLeaveDialog.value = false;
    void loadLeaves();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to apply leave';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    leaveSubmitting.value = false;
  }
}

// PM Approve Leave Logic
async function handleApproveLeave(identifier: number | string) {
  actionInProgressId.value = identifier;
  try {
    await approveLeaveApi(identifier);
    $q.notify({
      type: 'positive',
      message: 'Leave approved! Project schedules have been automatically recalculated.',
    });
    void loadLeaves();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to approve leave';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    actionInProgressId.value = null;
  }
}

// PM Reject Leave Logic
function openRejectDialog(identifier: number | string) {
  rejectingLeaveId.value = identifier;
  rejectionReason.value = '';
  showRejectModal.value = true;
}

async function handleRejectLeaveConfirm() {
  if (!rejectingLeaveId.value) return;
  rejectSubmitting.value = true;
  try {
    await rejectLeaveApi(rejectingLeaveId.value, rejectionReason.value);
    $q.notify({
      type: 'info',
      message: 'Leave request has been rejected.',
    });
    showRejectModal.value = false;
    void loadLeaves();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to reject leave';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    rejectSubmitting.value = false;
    rejectingLeaveId.value = null;
  }
}

// Delete leave logic
function confirmCancelLeave(identifier: number | string) {
  $q.dialog({
    title: 'Confirm Cancellation',
    message: 'Are you sure you want to remove this leave request?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void handleCancelLeave(identifier);
  });
}

async function handleCancelLeave(identifier: number | string) {
  try {
    await deleteLeaveApi(identifier);
    $q.notify({
      type: 'positive',
      message: 'Leave record removed successfully',
    });
    void loadLeaves();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to cancel leave';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  }
}

onMounted(() => {
  void loadData();
});
</script>
