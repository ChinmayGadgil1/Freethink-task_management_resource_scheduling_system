<template>
  <q-page class="q-pa-lg">
    <!-- LOADING STATE -->
    <div v-if="loading" class="row justify-center items-center q-pa-xl" style="min-height: 300px">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else>
      <!-- BREADCRUMBS & TOP BAR -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center text-subtitle1">
          <q-btn
            flat
            dense
            no-caps
            icon="arrow_back"
            label="Resources"
            color="primary"
            class="q-mr-xs"
            @click="goToResources"
          />
          <span class="text-grey-5 q-mx-xs">/</span>
          <span class="text-weight-bold">{{ resourceName }}</span>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn
            outline
            color="primary"
            icon="edit_calendar"
            label="Work Schedule"
            no-caps
            @click="openScheduleDialog"
          />
          <q-btn
            color="primary"
            icon="add_task"
            label="Assign Task"
            no-caps
            unelevated
            @click="showAssignDialog = true"
          />
          <q-btn outline color="grey-8" icon="refresh" label="Refresh" no-caps @click="loadData" />
        </div>
      </div>

      <!-- HERO PROFILE CARD -->
      <q-card flat bordered class="dashboard-card q-mb-lg">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar color="primary" text-color="white" size="64px" class="q-mr-md">
              {{ getInitials(resourceName) }}
            </q-avatar>

            <div>
              <div class="row items-center q-gutter-xs">
                <span class="text-h5 text-weight-bold">{{ resourceName }}</span>
                <q-chip
                  dense
                  square
                  :color="
                    utilization > 100 ? 'negative' : utilization >= 75 ? 'warning' : 'positive'
                  "
                  text-color="white"
                  class="text-caption text-weight-bold"
                >
                  {{
                    utilization > 100
                      ? 'Overallocated'
                      : utilization >= 75
                        ? 'High Load'
                        : 'Available'
                  }}
                </q-chip>
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                Registered Team Resource Member in Backend Database
              </div>
            </div>
          </div>

          <div class="row q-gutter-lg text-center">
            <div>
              <div class="text-caption text-grey-6">Workload Utilization</div>
              <div class="text-h6 text-weight-bold text-primary">{{ utilization }}%</div>
              <div class="text-caption text-grey-7">
                {{ formatHours(totalEffort) }} / {{ weeklyStandardCapacity }}h
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-6">Assigned Tasks</div>
              <div class="text-h6 text-weight-bold text-teal">{{ resourceTasks.length }}</div>
              <div class="text-caption text-grey-7">{{ completedTasksCount }} completed</div>
            </div>

            <div>
              <div class="text-caption text-grey-6">Active Projects</div>
              <div class="text-h6 text-weight-bold text-amber-9">{{ resourceProjects.length }}</div>
              <div class="text-caption text-grey-7">Memberships</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- TABS & PANEL CONTENT -->
      <q-card flat bordered class="dashboard-card">
        <q-tabs
          v-model="activeTab"
          dense
          no-caps
          align="left"
          active-color="primary"
          indicator-color="primary"
          class="bg-grey-2 text-grey-7"
        >
          <q-tab name="tasks" icon="task_alt" label="Assigned Tasks" />
          <q-tab name="projects" icon="folder_open" label="Projects" />
          <q-tab name="gantt" icon="timeline" label="Gantt Timeline" />
          <q-tab name="availability" icon="event_available" label="Daily Availability" />
          <q-tab name="workload" icon="speed" label="Capacity & Workload" />
          <q-tab name="leaves" icon="event_busy" label="Leaves & Time Off" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- TAB 1: ASSIGNED TASKS -->
          <q-tab-panel name="tasks" class="q-pa-md">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-weight-bold">Tasks Assigned to {{ resourceName }}</div>
              <q-chip dense color="deep-purple-1" text-color="primary">
                {{ resourceTasks.length }} Total Tasks
              </q-chip>
            </div>

            <q-table
              flat
              bordered
              :rows="resourceTasks"
              :columns="taskColumns"
              row-key="task_id"
              no-data-label="No tasks currently assigned to this resource"
              :pagination="{ rowsPerPage: 10 }"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    square
                    :color="getTaskStatusColor(props.row.status)"
                    text-color="white"
                    class="text-caption text-weight-bold"
                  >
                    {{ props.row.status }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-priority="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    square
                    outline
                    :color="getPriorityColor(props.row.priority)"
                    class="text-caption text-weight-bold"
                  >
                    {{ props.row.priority }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-progress="props">
                <q-td :props="props">
                  <div style="min-width: 100px">
                    <div class="row justify-between text-caption">
                      <span>{{ props.row.progress || 0 }}%</span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="5px"
                      :value="(Number(props.row.progress) || 0) / 100"
                      color="primary"
                      track-color="grey-3"
                    />
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- TAB 2: PROJECTS -->
          <q-tab-panel name="projects" class="q-pa-md">
            <div class="text-h6 text-weight-bold q-mb-md">Project Memberships</div>

            <div v-if="resourceProjects.length === 0" class="text-grey-6 text-center q-pa-lg">
              Not currently assigned to any projects.
            </div>

            <div v-else class="row q-col-gutter-md">
              <div v-for="proj in resourceProjects" :key="proj.project_id" class="col-12 col-sm-6">
                <q-card
                  flat
                  bordered
                  class="bg-grey-2 cursor-pointer"
                  @click="goToProject(proj.project_id)"
                >
                  <q-card-section>
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="text-subtitle1 text-weight-bold">{{ proj.name }}</div>
                      <q-chip dense color="primary" text-color="white">{{ proj.status }}</q-chip>
                    </div>
                    <div class="text-caption text-grey-7 q-mb-sm">
                      {{ proj.description || 'No description' }}
                    </div>
                    <div class="row justify-between text-caption text-grey-8">
                      <span
                        >Progress: <strong>{{ proj.progress }}%</strong></span
                      >
                      <span>Deadline: {{ proj.deadline || 'TBD' }}</span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="6px"
                      :value="(Number(proj.progress) || 0) / 100"
                      color="primary"
                      track-color="grey-3"
                      class="q-mt-xs"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <!-- TAB 3: GANTT TIMELINE -->
          <q-tab-panel name="gantt" class="q-pa-md">
            <div class="row items-center justify-between q-mb-md">
              <div>
                <div class="text-h6 text-weight-bold">Gantt Timeline: {{ resourceName }}</div>
                <div class="text-caption text-grey-6">
                  Schedule timeline for tasks under your managed projects.
                </div>
              </div>
              <q-chip dense color="deep-purple-1" text-color="primary">
                {{ resourceGanttTasks.length }} Scheduled Tasks
              </q-chip>
            </div>

            <DhtmlxGanttTimeline
              :tasks="resourceGanttTasks"
              :projects="allProjects"
              :resources="resourceInfo ? [resourceInfo] : []"
              :title="`Schedule Roadmap: ${resourceName}`"
              :group-by-project="false"
              @task-click="handleGanttTaskClick"
            />
          </q-tab-panel>

          <!-- TAB 4: DAILY AVAILABILITY -->
          <q-tab-panel name="availability" class="q-pa-md">
            <ResourceAvailabilityCalendar
              v-if="resourceId"
              :resource-id="resourceId"
              initial-days-range="14"
            />
          </q-tab-panel>

          <!-- TAB 4: WORKLOAD -->
          <q-tab-panel name="workload" class="q-pa-md">
            <div class="text-h6 text-weight-bold q-mb-md">Weekly Capacity Breakdown</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-card flat bordered class="bg-grey-2">
                  <q-card-section class="q-gutter-sm">
                    <div class="row justify-between text-subtitle2">
                      <span class="text-grey-7">Standard Weekly Capacity</span>
                      <strong>{{ weeklyStandardCapacity }} Hours</strong>
                    </div>
                    <div class="row justify-between text-subtitle2">
                      <span class="text-grey-7">Allocated Task Effort</span>
                      <strong class="text-primary">{{ formatNumber(totalEffort) }} Hours</strong>
                    </div>
                    <div class="row justify-between text-subtitle2">
                      <span class="text-grey-7">Remaining Capacity</span>
                      <strong
                        :class="
                          weeklyStandardCapacity - totalEffort < 0
                            ? 'text-negative'
                            : 'text-positive'
                        "
                      >
                        {{ formatNumber(Math.max(0, weeklyStandardCapacity - totalEffort)) }} Hours
                      </strong>
                    </div>
                    <q-separator />
                    <div>
                      <div class="text-caption text-grey-7 q-mb-xs">Capacity Utilization Gauge</div>
                      <q-linear-progress
                        rounded
                        size="10px"
                        :value="Math.min(100, utilization) / 100"
                        :color="
                          utilization > 100
                            ? 'negative'
                            : utilization >= 75
                              ? 'warning'
                              : 'positive'
                        "
                        track-color="grey-3"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <q-card flat bordered class="bg-grey-2">
                  <q-card-section class="q-gutter-xs">
                    <div class="row items-center justify-between">
                      <div class="text-subtitle2 text-weight-bold">
                        Work Schedule & Working Days
                      </div>
                      <q-btn
                        flat
                        dense
                        no-caps
                        color="primary"
                        icon="edit"
                        label="Edit"
                        @click="openScheduleDialog"
                      />
                    </div>
                    <div class="text-caption text-grey-8 q-mt-xs">
                      <strong>Daily Capacity:</strong>
                      {{ scheduleConfig?.daily_working_hours || 8 }}h / day
                    </div>
                    <div class="text-caption text-grey-8">
                      <strong>Working Days:</strong>
                      {{
                        activeWorkingDaysList.length === 0
                          ? 'None'
                          : activeWorkingDaysList.map(formatDayName).join(', ')
                      }}
                      ({{ activeWorkingDaysList.length }} days)
                    </div>
                    <div class="text-caption text-grey-8">
                      <strong>Non-Working Days:</strong>
                      <span class="text-deep-orange text-weight-medium">
                        {{
                          (scheduleConfig?.non_working_days?.length || 0) === 0
                            ? 'None'
                            : scheduleConfig?.non_working_days?.map(formatDayName).join(', ')
                        }}
                      </span>
                    </div>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      Completed Tasks: {{ completedTasksCount }} / {{ resourceTasks.length }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <!-- TAB 4: LEAVES & TIME OFF -->
          <q-tab-panel name="leaves" class="q-pa-md">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-weight-bold">Leaves & Time Off</div>
              <q-btn
                color="primary"
                icon="add"
                label="Apply Leave"
                no-caps
                unelevated
                @click="openLeaveDialog"
              />
            </div>

            <q-table
              flat
              bordered
              :rows="leavesList"
              :columns="leaveColumns"
              row-key="leave_id"
              no-data-label="No leave records found for this resource"
              :pagination="{ rowsPerPage: 5 }"
            >
              <!-- Date / Range Formatting -->
              <template #body-cell-leave_date="props">
                <q-td :props="props">
                  <template v-if="props.row.start_date && props.row.end_date && props.row.start_date !== props.row.end_date">
                    <div class="text-weight-medium text-primary">
                      {{ formatDate(props.row.start_date) }} – {{ formatDate(props.row.end_date) }}
                    </div>
                    <div class="text-caption text-grey-6 q-mb-xs">
                      {{ props.row.total_days }} working days ({{ props.row.start_date }} to {{ props.row.end_date }})
                    </div>
                    <div class="row items-center gap-xs wrap">
                      <q-badge
                        :color="props.row.start_day_type === 'SECOND_HALF' ? 'primary' : 'blue-grey-6'"
                        :label="props.row.start_day_type === 'SECOND_HALF' ? 'Start: Second Half' : 'Start: Full Day'"
                        class="text-weight-bold"
                        style="font-size: 10px"
                      />
                      <q-badge
                        :color="props.row.end_day_type === 'FIRST_HALF' ? 'primary' : 'blue-grey-6'"
                        :label="props.row.end_day_type === 'FIRST_HALF' ? 'End: First Half' : 'End: Full Day'"
                        class="text-weight-bold"
                        style="font-size: 10px"
                      />
                    </div>
                  </template>
                  <template v-else>
                    <div class="text-weight-medium">{{ formatDate(props.row.leave_date || props.row.start_date) }}</div>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      <q-badge
                        color="primary"
                        :label="
                          props.row.leave_type === 'FIRST_HALF'
                            ? 'First Half'
                            : props.row.leave_type === 'SECOND_HALF'
                              ? 'Second Half'
                              : 'Full Day'
                        "
                        class="text-weight-bold"
                        style="font-size: 10px"
                      />
                    </div>
                  </template>
                </q-td>
              </template>

              <!-- Leave Type / Hours Formatting -->
              <template #body-cell-leave_type="props">
                <q-td :props="props">
                  <template v-if="props.row.start_date && props.row.end_date && props.row.start_date !== props.row.end_date">
                    <div class="text-weight-medium">Multi-Day Leave</div>
                    <div class="text-caption text-grey-6">
                      {{ formatHours(props.row.total_hours || props.row.leave_hours) }} ({{ props.row.total_days }} days)
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

              <template #body-cell-status="props">
                <q-td :props="props" auto-width>
                  <q-chip
                    dense
                    square
                    :color="
                      props.row.status === 'APPROVED'
                        ? 'positive'
                        : props.row.status === 'PENDING'
                          ? 'amber-2'
                          : 'negative'
                    "
                    :text-color="
                      props.row.status === 'APPROVED' || props.row.status === 'REJECTED'
                        ? 'white'
                        : 'brown-10'
                    "
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
                    class="text-caption text-grey-7 q-mt-xs row items-center no-wrap gap-xs"
                    style="font-size: 11px"
                  >
                    <q-icon name="verified_user" size="13px" color="positive" />
                    <span>Approved by <strong>{{ props.row.approver_name || 'Project Manager' }}</strong></span>
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

              <template #body-cell-actions="props">
                <q-td :props="props" auto-width>
                  <div class="row items-center q-gutter-xs no-wrap">
                    <template v-if="props.row.status === 'PENDING'">
                      <q-btn
                        v-if="canApproveLeave(props.row.start_date || props.row.leave_date)"
                        flat
                        round
                        dense
                        icon="check"
                        color="positive"
                        :loading="leaveActionLoadingId === (props.row.request_id || props.row.leave_id)"
                        @click="handleApproveLeave(props.row.request_id || props.row.leave_id)"
                      >
                        <q-tooltip>Approve Leave & Recalculate Schedule</q-tooltip>
                      </q-btn>
                      <q-btn v-else flat round dense disable icon="check" color="grey-5">
                        <q-tooltip
                          >Cannot approve: Leave start date has already arrived or passed</q-tooltip
                        >
                      </q-btn>

                      <q-btn
                        flat
                        round
                        dense
                        icon="close"
                        color="negative"
                        :loading="leaveActionLoadingId === (props.row.request_id || props.row.leave_id)"
                        @click="handleRejectLeave(props.row.request_id || props.row.leave_id)"
                      >
                        <q-tooltip>Reject Leave</q-tooltip>
                      </q-btn>
                    </template>

                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="grey-7"
                      @click="handleDeleteLeave(props.row.request_id || props.row.leave_id)"
                    >
                      <q-tooltip>Delete / Cancel Leave</q-tooltip>
                    </q-btn>
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>

      <!-- ASSIGN TASK DIALOG -->
      <q-dialog v-model="showAssignDialog">
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6 text-weight-bold">Assign Task to {{ resourceName }}</div>
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>

          <q-form @submit.prevent="handleAssignTask">
            <q-card-section class="q-gutter-md">
              <q-select
                v-model="assignForm.project_id"
                outlined
                dense
                label="Select Project *"
                :options="allProjects"
                option-value="project_id"
                option-label="name"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Project is required']"
              />

              <q-input
                v-model="assignForm.title"
                outlined
                dense
                label="Task Title *"
                :rules="[(val) => !!val || 'Title is required']"
              />

              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-input
                    v-model="assignForm.description"
                    outlined
                    dense
                    type="textarea"
                    label="Description"
                    autogrow
                  />
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-select
                    v-model="assignForm.priority"
                    outlined
                    dense
                    label="Priority"
                    :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model.number="assignForm.expected_effort"
                    outlined
                    dense
                    type="number"
                    label="Effort (Hours)"
                  />
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
                label="Assign Task"
                :loading="submitting"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- APPLY LEAVE DIALOG -->
      <q-dialog v-model="showLeaveDialog">
        <q-card style="min-width: 380px">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6 text-weight-bold">Apply Leave for {{ resourceName }}</div>
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>

          <q-form @submit.prevent="handleApplyLeave">
            <q-card-section class="q-gutter-md">
              <!-- Date Pickers (Start Date & End Date) -->
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="leaveForm.start_date"
                    outlined
                    dense
                    label="Start Date (YYYY-MM-DD) *"
                    :rules="[(val) => !!val || 'Start date is required']"
                    @update:model-value="(val) => { if (val && (!leaveForm.end_date || leaveForm.end_date < String(val))) leaveForm.end_date = String(val); }"
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
                      (val) => !leaveForm.start_date || val >= leaveForm.start_date || 'End date must be on or after start date',
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
                  Intermediate days between start and end date will be treated as Full Days. Non-working days and holidays are automatically excluded.
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
                label="Apply Leave"
                :loading="leaveSubmitting"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- PM WORK SCHEDULE CONFIGURATION DIALOG -->
      <q-dialog v-model="showScheduleDialog" persistent>
        <q-card style="min-width: 440px; max-width: 520px; border-radius: 14px">
          <q-card-section class="row items-center justify-between q-pb-xs">
            <div class="row items-center q-gutter-xs">
              <q-icon name="edit_calendar" size="24px" color="primary" />
              <div class="text-h6 text-weight-bold">Work Schedule: {{ resourceName }}</div>
            </div>
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section class="text-caption text-grey-6 q-pt-none">
            As a Project Manager, you can configure non-working days (days off) and daily capacity
            for this resource.
          </q-card-section>

          <q-separator />

          <q-card-section
            v-if="scheduleModalLoading"
            class="row justify-center items-center q-pa-xl"
          >
            <q-spinner color="primary" size="36px" />
          </q-card-section>

          <q-card-section v-else class="q-pt-md q-gutter-md">
            <!-- Non-Working Days Selector -->
            <div>
              <div class="text-subtitle2 text-weight-bold q-mb-xs">
                Weekly Non-Working Days (Days Off)
              </div>
              <div class="text-caption text-grey-6 q-mb-sm">
                Click days to mark them as non-working. Unmarked days are active working days.
              </div>

              <div class="row q-gutter-xs wrap">
                <q-chip
                  v-for="day in weekDayOptions"
                  :key="day.value"
                  clickable
                  :color="isNonWorkingDay(day.value) ? 'deep-orange-7' : 'grey-3'"
                  :text-color="isNonWorkingDay(day.value) ? 'white' : 'grey-8'"
                  :icon="isNonWorkingDay(day.value) ? 'event_busy' : 'check_circle_outline'"
                  class="text-weight-bold cursor-pointer transition-all"
                  @click="toggleNonWorkingDay(day.value)"
                >
                  {{ day.label }}
                </q-chip>
              </div>
              <div
                v-if="modalNonWorkingDays.length >= 7"
                class="text-caption text-negative q-mt-xs"
              >
                * A resource must have at least one active working day.
              </div>
            </div>

            <!-- Daily Working Hours Input (Informational - Fixed 8h) -->
            <div class="q-mt-sm">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-subtitle2 text-weight-bold">Daily Working Capacity</span>
                <q-badge
                  color="primary"
                  class="text-weight-bold q-px-sm q-py-xs"
                  style="font-size: 0.85rem"
                >
                  8 Hours / Day
                </q-badge>
              </div>
              <div class="text-caption text-grey-6">
                Fixed standard working capacity per working day (8.0 Hours / Day).
              </div>
            </div>

            <!-- Schedule Summary Breakdown -->
            <q-card
              flat
              bordered
              class="q-pa-sm"
              :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'"
            >
              <div class="q-gutter-xs text-caption">
                <div class="row items-center justify-between">
                  <span class="text-weight-medium">Non-Working Days:</span>
                  <span class="text-weight-bold text-deep-orange">
                    {{
                      modalNonWorkingDays.length === 0
                        ? 'None (Full 7-day schedule)'
                        : modalNonWorkingDays.map(formatDayName).join(', ')
                    }}
                    ({{ modalNonWorkingDays.length }} days off)
                  </span>
                </div>
                <div class="row items-center justify-between q-mt-xs">
                  <span class="text-weight-medium">Active Working Days:</span>
                  <span class="text-weight-bold text-primary">
                    {{
                      modalActiveWorkingDays.length === 0
                        ? 'None'
                        : modalActiveWorkingDays.map(formatDayName).join(', ')
                    }}
                    ({{ modalActiveWorkingDays.length }} working days)
                  </span>
                </div>
                <div class="row items-center justify-between q-mt-xs">
                  <span class="text-weight-medium">Weekly Total Capacity:</span>
                  <span class="text-weight-bold text-teal">
                    {{ (modalActiveWorkingDays.length * 8.0).toFixed(1) }} Hours / Week
                  </span>
                </div>
              </div>
            </q-card>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" no-caps v-close-popup color="grey-7" />
            <q-btn
              unelevated
              label="Save Schedule"
              color="primary"
              no-caps
              class="text-weight-bold q-px-md"
              :loading="scheduleModalSubmitting"
              :disable="modalNonWorkingDays.length >= 7 || scheduleModalLoading"
              @click="handleSaveSchedule"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- TASK DETAILS POPUP DIALOG -->
      <TaskDetailsDialog
        v-model="showTaskDetailsDialog"
        :task="selectedTaskDetails"
        :project-name="selectedTaskDetails ? getProjectName(selectedTaskDetails.project_id) : ''"
        :resource-names-map="resourceNamesMap"
        :allow-unassign="false"
        :allow-assign-member="false"
        :allow-add-dependency="false"
        :show-dependencies="false"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { getInitials, formatHours, formatNumber, formatDate } from '@/utils/formatters';
import ResourceAvailabilityCalendar from '@/components/resource/ResourceAvailabilityCalendar.vue';
import DhtmlxGanttTimeline from '@/components/gantt/DhtmlxGanttTimeline.vue';
import TaskDetailsDialog from '@/components/tasks/TaskDetailsDialog.vue';
import {
  createTaskApi,
  getProjectsApi,
  getResourceByIdApi,
  getResourceProjectsApi,
  getResourceWorkloadApi,
  getResourceScheduleDataApi,
  getTasksApi,
  getLeavesApi,
  createLeaveApi,
  approveLeaveApi,
  rejectLeaveApi,
  deleteLeaveApi,
  getResourceWorkScheduleApi,
  updateResourceWorkScheduleApi,
} from '@/services/api';
import type {
  Project,
  ResourceUser,
  Task,
  ResourceWorkload,
  ResourceScheduleResponse,
  LeaveItem,
  DayOfWeek,
  ResourceScheduleConfig,
} from '@/services/api';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const resourceId = computed(() => Number(route.params.id) || 1);
const loading = ref(true);
const activeTab = ref('tasks');
const resourceInfo = ref<ResourceUser | null>(null);

const resourceName = computed(() => resourceInfo.value?.name || 'Team Resource');

// PM Work Schedule State
const ALL_WEEK_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
const weekDayOptions: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
];

const scheduleConfig = ref<ResourceScheduleConfig | null>(null);
const showScheduleDialog = ref(false);
const scheduleModalLoading = ref(false);
const scheduleModalSubmitting = ref(false);
const modalNonWorkingDays = ref<DayOfWeek[]>(['SATURDAY', 'SUNDAY']);
const modalDailyHours = ref(8.0);

const activeWorkingDaysList = computed(() => {
  const rawNonWorking = scheduleConfig.value?.non_working_days ??
    resourceInfo.value?.non_working_days ?? ['SATURDAY', 'SUNDAY'];
  let nonWorking: string[] = ['SATURDAY', 'SUNDAY'];
  if (Array.isArray(rawNonWorking)) {
    nonWorking = rawNonWorking;
  } else if (typeof rawNonWorking === 'string') {
    try {
      nonWorking = JSON.parse(rawNonWorking);
    } catch {
      nonWorking = ['SATURDAY', 'SUNDAY'];
    }
  }
  return ALL_WEEK_DAYS.filter((d) => !nonWorking.includes(d));
});

const modalActiveWorkingDays = computed(() => {
  return ALL_WEEK_DAYS.filter((d) => !modalNonWorkingDays.value.includes(d));
});

const weeklyStandardCapacity = computed(() => {
  const daysCount = activeWorkingDaysList.value.length;
  const rawHours =
    scheduleConfig.value?.daily_working_hours ?? resourceInfo.value?.daily_working_hours ?? 8.0;
  const hours = Number(rawHours) || 8.0;
  return daysCount * hours;
});

function formatDayName(day: DayOfWeek): string {
  const match = weekDayOptions.find((o) => o.value === day);
  return match ? match.label : day;
}

function isNonWorkingDay(day: DayOfWeek): boolean {
  return modalNonWorkingDays.value.includes(day);
}

function toggleNonWorkingDay(day: DayOfWeek) {
  if (modalNonWorkingDays.value.includes(day)) {
    modalNonWorkingDays.value = modalNonWorkingDays.value.filter((d) => d !== day);
  } else {
    modalNonWorkingDays.value = [...modalNonWorkingDays.value, day];
  }
}

async function openScheduleDialog() {
  showScheduleDialog.value = true;
  scheduleModalLoading.value = true;
  try {
    const config = await getResourceWorkScheduleApi(resourceId.value);
    scheduleConfig.value = config;
    modalNonWorkingDays.value = Array.isArray(config.non_working_days)
      ? config.non_working_days
      : ['SATURDAY', 'SUNDAY'];
    modalDailyHours.value = 8.0;
  } catch (error) {
    const err = error as Error;
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to load schedule configuration',
    });
  } finally {
    scheduleModalLoading.value = false;
  }
}

async function handleSaveSchedule() {
  if (modalNonWorkingDays.value.length >= 7) {
    $q.notify({
      type: 'warning',
      message: 'A resource must have at least one active working day.',
    });
    return;
  }

  scheduleModalSubmitting.value = true;
  try {
    const updated = await updateResourceWorkScheduleApi(resourceId.value, {
      non_working_days: modalNonWorkingDays.value,
    });
    scheduleConfig.value = updated;
    $q.notify({
      type: 'positive',
      message: `Work schedule for ${resourceName.value} updated successfully`,
    });
    showScheduleDialog.value = false;
  } catch (error) {
    const err = error as Error;
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to update schedule configuration',
    });
  } finally {
    scheduleModalSubmitting.value = false;
  }
}

const allTasks = ref<Task[]>([]);
const allProjects = ref<Project[]>([]);
const directMemberProjects = ref<Project[]>([]);
const backendWorkload = ref<ResourceWorkload | null>(null);
const resourceScheduleData = ref<ResourceScheduleResponse | null>(null);
const resourceGanttTasks = computed(() => resourceScheduleData.value?.tasks || []);

const showTaskDetailsDialog = ref(false);
const selectedTaskDetails = ref<Task | null>(null);

const resourceNamesMap = computed(() => {
  const map: Record<number, string> = {};
  if (resourceInfo.value) {
    map[resourceInfo.value.user_id] = resourceInfo.value.name;
  }
  return map;
});

function getProjectName(projectId?: number) {
  if (!projectId) return 'Other Project';
  const p = allProjects.value.find((proj) => proj.project_id === projectId);
  return p ? p.name : `Project #${projectId}`;
}

function handleGanttTaskClick(task: Task) {
  if (task.is_external) {
    $q.notify({
      type: 'info',
      icon: 'lock',
      message:
        'This task belongs to another project not managed by you. Detailed information is private.',
    });
    return;
  }
  selectedTaskDetails.value = task;
  showTaskDetailsDialog.value = true;
}

const showAssignDialog = ref(false);
const submitting = ref(false);

const assignForm = reactive<{
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expected_effort: number;
}>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  expected_effort: 8,
});

const leavesList = ref<LeaveItem[]>([]);
const showLeaveDialog = ref(false);
const leaveSubmitting = ref(false);
const leaveActionLoadingId = ref<number | string | null>(null);
const leaveForm = reactive<{
  start_date: string;
  end_date: string;
  leave_type: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
  start_day_type: 'FULL_DAY' | 'SECOND_HALF';
  end_day_type: 'FULL_DAY' | 'FIRST_HALF';
}>({
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

// Resource leaves map per date
const userLeaveMap = computed(() => {
  const map = new Map<string, { hasFull: boolean; hasFirstHalf: boolean; hasSecondHalf: boolean }>();

  for (const l of leavesList.value) {
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

const singleDayLeaveOptions = computed<Array<{ label: string; value: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF' }>>(() => {
  if (!leaveForm.start_date) {
    return [
      { label: 'Full Day', value: 'FULL_DAY' },
      { label: 'First Half', value: 'FIRST_HALF' },
      { label: 'Second Half', value: 'SECOND_HALF' },
    ];
  }
  const entry = userLeaveMap.value.get(leaveForm.start_date);
  if (entry) {
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

const startDayTypeOptions = computed<Array<{ label: string; value: 'FULL_DAY' | 'SECOND_HALF' }>>(() => {
  if (!leaveForm.start_date) {
    return [
      { label: 'Full Day', value: 'FULL_DAY' },
      { label: 'Second Half', value: 'SECOND_HALF' },
    ];
  }
  const entry = userLeaveMap.value.get(leaveForm.start_date);
  if (entry?.hasFirstHalf) {
    return [{ label: 'Second Half', value: 'SECOND_HALF' }];
  }
  return [
    { label: 'Full Day', value: 'FULL_DAY' },
    { label: 'Second Half', value: 'SECOND_HALF' },
  ];
});

const endDayTypeOptions = computed<Array<{ label: string; value: 'FULL_DAY' | 'FIRST_HALF' }>>(() => {
  if (!leaveForm.end_date) {
    return [
      { label: 'Full Day', value: 'FULL_DAY' },
      { label: 'First Half', value: 'FIRST_HALF' },
    ];
  }
  const entry = userLeaveMap.value.get(leaveForm.end_date);
  if (entry?.hasSecondHalf) {
    return [{ label: 'First Half', value: 'FIRST_HALF' }];
  }
  return [
    { label: 'Full Day', value: 'FULL_DAY' },
    { label: 'First Half', value: 'FIRST_HALF' },
  ];
});

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

const leaveColumns: QTableColumn<LeaveItem>[] = [
  { name: 'leave_date', label: 'Date', field: (l) => l.leave_date, align: 'left', sortable: true },
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
  { name: 'actions', label: 'Actions', field: () => '', align: 'center' },
];

function canApproveLeave(leaveDateStr: string): boolean {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return todayStr < leaveDateStr;
}

async function handleApproveLeave(identifier: number | string) {
  leaveActionLoadingId.value = identifier;
  try {
    await approveLeaveApi(identifier);
    $q.notify({
      type: 'positive',
      message: 'Leave approved! Project schedules have been recalculated.',
    });
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to approve leave';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    leaveActionLoadingId.value = null;
  }
}

function handleRejectLeave(identifier: number | string) {
  $q.dialog({
    title: 'Reject Leave Request',
    message: 'Enter rejection reason (optional):',
    prompt: {
      model: '',
      type: 'text',
    },
    cancel: true,
    persistent: true,
  }).onOk((reason: string) => {
    leaveActionLoadingId.value = identifier;
    void (async () => {
      try {
        await rejectLeaveApi(identifier, reason);
        $q.notify({
          type: 'info',
          message: 'Leave request has been rejected.',
        });
        void loadData();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to reject leave';
        $q.notify({
          type: 'negative',
          message: msg,
        });
      } finally {
        leaveActionLoadingId.value = null;
      }
    })();
  });
}

function handleDeleteLeave(identifier: number | string) {
  confirmCancelLeave(identifier);
}

const taskColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: (t) => t.title, align: 'left' },
  { name: 'project', label: 'Project ID', field: (t) => t.project_id, align: 'center' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  {
    name: 'effort',
    label: 'Effort (Hrs)',
    field: (t) => Number(t.expected_effort) || 0,
    align: 'center',
  },
  { name: 'progress', label: 'Progress', field: (t) => Number(t.progress) || 0, align: 'left' },
  { name: 'deadline', label: 'Deadline', field: (t) => t.deadline || 'TBD', align: 'left' },
];

async function loadData() {
  loading.value = true;
  try {
    const [tasks, projects, workload, resUser, memberProjs, leaves, sched, schedData] =
      await Promise.all([
        getTasksApi(),
        getProjectsApi(),
        getResourceWorkloadApi(resourceId.value).catch(() => null),
        getResourceByIdApi(resourceId.value).catch(() => null),
        getResourceProjectsApi(resourceId.value).catch(() => []),
        getLeavesApi({ user_id: resourceId.value }).catch(() => []),
        getResourceWorkScheduleApi(resourceId.value).catch(() => null),
        getResourceScheduleDataApi(resourceId.value).catch(() => null),
      ]);
    allTasks.value = tasks;
    allProjects.value = projects;
    directMemberProjects.value = memberProjs;
    leavesList.value = leaves;
    if (workload) {
      backendWorkload.value = workload;
    }
    if (resUser) {
      resourceInfo.value = resUser;
    }
    if (sched) {
      scheduleConfig.value = sched;
    }
    if (schedData) {
      resourceScheduleData.value = schedData;
    }
    if (projects.length > 0) {
      assignForm.project_id = projects[0]!.project_id;
    }
  } catch (error) {
    console.error('Failed to load resource details from backend:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadData();
});

const resourceTasks = computed(() => {
  const id = resourceId.value;
  return allTasks.value.filter(
    (t) => t.assigned_resource_ids && t.assigned_resource_ids.includes(id),
  );
});

const resourceProjects = computed(() => {
  const taskProjectIds = resourceTasks.value.map((t) => t.project_id);
  const memberProjectIds = directMemberProjects.value.map((p) => p.project_id);
  const allIds = new Set([...taskProjectIds, ...memberProjectIds]);
  return allProjects.value.filter((p) => allIds.has(p.project_id));
});

const completedTasksCount = computed(
  () => resourceTasks.value.filter((t) => t.status === 'COMPLETED').length,
);

const totalEffort = computed(() => {
  if (backendWorkload.value?.total_expected_effort !== undefined) {
    return Number(backendWorkload.value.total_expected_effort) || 0;
  }
  return resourceTasks.value.reduce((acc, t) => acc + (Number(t.expected_effort) || 0), 0);
});

const utilization = computed(() => {
  const cap = Math.max(1, weeklyStandardCapacity.value || 40);
  return Math.min(150, Math.round((totalEffort.value / cap) * 100));
});

function getTaskStatusColor(status: string): string {
  if (status === 'COMPLETED') return 'positive';
  if (status === 'IN_PROGRESS') return 'info';
  if (status === 'SCHEDULED') return 'purple-7';
  return 'grey-7';
}

function getPriorityColor(priority: string): string {
  if (priority === 'CRITICAL') return 'negative';
  if (priority === 'HIGH') return 'warning';
  if (priority === 'MEDIUM') return 'primary';
  return 'grey';
}

function goToResources() {
  void router.push('/pm/resources');
}

function goToProject(id: number) {
  void router.push(`/pm/projects/${id}`);
}

async function handleAssignTask() {
  if (!assignForm.project_id || !assignForm.title.trim()) {
    return;
  }

  submitting.value = true;
  try {
    await createTaskApi({
      project_id: assignForm.project_id,
      title: assignForm.title.trim(),
      description: assignForm.description || null,
      priority: assignForm.priority,
      status: 'SCHEDULED',
      expected_effort: Number(assignForm.expected_effort) || 8,
      assigned_resource_ids: [resourceId.value],
    });

    $q.notify({
      type: 'positive',
      message: 'Task assigned to resource successfully',
    });

    showAssignDialog.value = false;
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to assign task';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submitting.value = false;
  }
}

function openLeaveDialog() {
  leaveForm.start_date = '';
  leaveForm.end_date = '';
  leaveForm.leave_type = 'FULL_DAY';
  leaveForm.start_day_type = 'FULL_DAY';
  leaveForm.end_day_type = 'FULL_DAY';
  showLeaveDialog.value = true;
}

async function handleApplyLeave() {
  if (!leaveForm.start_date || !leaveForm.end_date) {
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
      user_id: resourceId.value,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      leave_type: !isMultiDayLeave.value ? leaveForm.leave_type : undefined,
      start_day_type: isMultiDayLeave.value ? leaveForm.start_day_type : undefined,
      end_day_type: isMultiDayLeave.value ? leaveForm.end_day_type : undefined,
    });
    $q.notify({
      type: 'positive',
      message: 'Leave applied successfully. Project schedules recalculated.',
    });
    showLeaveDialog.value = false;
    void loadData();
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

function confirmCancelLeave(identifier: number | string) {
  $q.dialog({
    title: 'Confirm Cancellation',
    message: 'Are you sure you want to cancel this leave request?',
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
      message: 'Leave cancelled successfully',
    });
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to cancel leave';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  }
}
</script>
