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
              ? 'Track, apply, and manage time off requests across all team resources'
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
      <div class="col-12 col-sm-4">
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

      <div class="col-12 col-sm-4">
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

      <div class="col-12 col-sm-4">
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
          <div v-if="isProjectManager" class="col-12 col-sm-4">
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

          <!-- Start Date Filter -->
          <div class="col-12 col-sm-3">
            <q-input
              v-model="filters.startDate"
              outlined
              dense
              clearable
              label="From Date (YYYY-MM-DD)"
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
          <div class="col-12 col-sm-3">
            <q-input
              v-model="filters.endDate"
              outlined
              dense
              clearable
              label="To Date (YYYY-MM-DD)"
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
    <q-card flat bordered class="table-card">
      <q-table
        flat
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
                {{ getResourceInitials(props.row.user_id) }}
              </q-avatar>
              <span class="text-weight-medium text-main">{{ getResourceName(props.row.user_id) }}</span>
            </div>
          </q-td>
        </template>

        <!-- Pretty Date Formatting -->
        <template #body-cell-leave_date="props">
          <q-td :props="props">
            {{ formatDate(props.row.leave_date) }}
          </q-td>
        </template>

        <!-- Hours Formatting -->
        <template #body-cell-leave_hours="props">
          <q-td :props="props">
            {{ formatHours(props.row.leave_hours) }}
          </q-td>
        </template>

        <!-- Action Buttons -->
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete"
              @click="confirmCancelLeave(props.row.leave_id)"
            >
              <q-tooltip>Cancel Leave</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 5. REQUEST LEAVE MODAL DIALOG -->
    <q-dialog v-model="showLeaveDialog">
      <q-card style="min-width: 400px; border-radius: 12px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-h6 text-weight-bold">
            {{ isProjectManager ? 'Apply Leave (On Behalf)' : 'Request Leave' }}
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
            />

            <!-- Date Picker -->
            <q-input
              v-model="leaveForm.leave_date"
              outlined
              dense
              label="Leave Date (YYYY-MM-DD) *"
              :rules="[(val) => !!val || 'Leave date is required']"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="leaveForm.leave_date" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- Hours Input -->
            <q-input
              v-model.number="leaveForm.leave_hours"
              outlined
              dense
              type="number"
              step="0.5"
              label="Leave Hours *"
              :rules="[
                (val) => !!val || 'Leave hours is required',
                (val) => val > 0 || 'Hours must be positive',
                (val) => val <= 24 || 'Hours cannot exceed 24'
              ]"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              :label="isProjectManager ? 'Apply Leave' : 'Submit Request'"
              :loading="leaveSubmitting"
            />
          </q-card-actions>
        </q-form>
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
  deleteLeaveApi,
  getResourcesApi,
  type LeaveItem,
} from '@/services/api';

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

// Filter parameters
const filters = reactive({
  user_id: undefined as number | undefined,
  startDate: '',
  endDate: '',
});

// Dialog form states
const showLeaveDialog = ref(false);
const leaveSubmitting = ref(false);
const leaveForm = reactive({
  user_id: null as number | null,
  leave_date: '',
  leave_hours: 8,
});

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
      name: 'leave_hours',
      label: 'Leave Hours',
      field: (l) => l.leave_hours,
      align: 'center',
      sortable: true,
    },
    {
      name: 'actions',
      label: 'Actions',
      field: () => '',
      align: 'center',
    }
  );

  return cols;
});

// Dropdown options for resources selection
const resourceOptions = computed(() =>
  resourcesList.value.map((r) => ({
    label: r.name,
    value: Number(r.user_id),
  }))
);

// Summary metrics computed properties
const futureLeavesCount = computed(() => {
  const todayStr = new Date().toISOString().split('T')[0]!;
  return leavesList.value.filter((l) => l.leave_date >= todayStr).length;
});

const currentMonthLeavesCount = computed(() => {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // e.g. YYYY-MM
  return leavesList.value.filter((l) => l.leave_date.startsWith(currentMonthStr)).length;
});

// Resource maps lookup
const getResourceName = (userId: number): string => {
  const res = resourcesList.value.find((r) => Number(r.user_id) === Number(userId));
  return res ? String(res.name) : `Resource #${userId}`;
};

const getResourceInitials = (userId: number): string => {
  const name = getResourceName(userId);
  return name
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
        currentUserId.value !== null ? { manager_id: currentUserId.value } : undefined
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
    const qParams: { user_id?: number; startDate?: string; endDate?: string } = {};

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
  }
);

// Reset operations
function resetFilters() {
  filters.user_id = undefined;
  filters.startDate = '';
  filters.endDate = '';
}

function openLeaveDialog() {
  leaveForm.user_id = isProjectManager.value ? null : currentUserId.value;
  leaveForm.leave_date = '';
  leaveForm.leave_hours = 8;
  showLeaveDialog.value = true;
}

// Apply leave logic
async function handleApplyLeave() {
  const targetUserId = isProjectManager.value ? leaveForm.user_id : currentUserId.value;

  if (!targetUserId || !leaveForm.leave_date) {
    $q.notify({
      type: 'warning',
      message: 'Please complete all required fields.',
    });
    return;
  }

  leaveSubmitting.value = true;
  try {
    await createLeaveApi({
      user_id: targetUserId,
      leave_date: leaveForm.leave_date,
      leave_hours: Number(leaveForm.leave_hours) || 8,
    });

    $q.notify({
      type: 'positive',
      message: 'Leave applied successfully',
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

// Delete leave logic
function confirmCancelLeave(leaveId: number) {
  $q.dialog({
    title: 'Confirm Cancellation',
    message: 'Are you sure you want to cancel this leave?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void handleCancelLeave(leaveId);
  });
}

async function handleCancelLeave(leaveId: number) {
  try {
    await deleteLeaveApi(leaveId);
    $q.notify({
      type: 'positive',
      message: 'Leave cancelled successfully',
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

<style scoped lang="scss">
.leaves-page {
  background: var(--wo-bg-page, #f7f7fa);
}

.metric-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-card, .table-card {
  border-radius: 12px;
}
</style>
