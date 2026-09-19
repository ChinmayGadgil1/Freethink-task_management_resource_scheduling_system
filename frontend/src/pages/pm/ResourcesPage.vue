<template>
  <q-page class="pm-page resources-page">
    <!-- PAGE HEADER -->
    <div class="page-header-row">
      <div>
        <div class="page-title">PM Task & Resource Management</div>
        <div class="page-subtitle">
          List tasks assigned by PM and assign team resources to projects
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          icon="person_add"
          label="Assign Resource to Project"
          class="action-btn-primary"
          @click="showProjectMemberDialog = true"
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

    <!-- STAT SUMMARY CARDS -->
    <div class="stats-grid q-mb-md">
      <StatCard
        title="Assigned Resources"
        :value="resourceMap.length"
        subtitle="Active in backend"
        icon="groups"
        color="purple"
        note-class="note-purple"
        @click="mainTab = 'resources'"
      />

      <StatCard
        title="Tasks Assigned by PM"
        :value="taskList.length"
        subtitle="Across projects"
        icon="task_alt"
        color="blue"
        note-class="note-blue"
        @click="mainTab = 'tasks'"
      />

      <StatCard
        title="Total Effort Allocated"
        :value="formatHours(totalEffortHours)"
        subtitle="Expected effort hours"
        icon="schedule"
        color="green"
        note-class="note-green"
        @click="mainTab = 'tasks'"
      />

      <StatCard
        title="Managed Projects"
        :value="projectList.length"
        subtitle="Active projects"
        icon="folder"
        color="orange"
        note-class="note-orange"
        @click="router.push('/pm/projects')"
      />
    </div>

    <!-- MAIN TABS: RESOURCE ALLOCATION VS TASKS ASSIGNED BY PM -->
    <q-card flat bordered class="table-card q-mb-lg">
      <q-tabs
        v-model="mainTab"
        dense
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="resource-tabs"
      >
        <q-tab
          name="resources"
          icon="groups"
          label="Resource Directory & Allocation"
          class="resource-tab"
        />
        <q-tab name="tasks" icon="task_alt" label="Tasks Assigned by PM" class="resource-tab" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="mainTab" animated>
        <!-- TAB 1: RESOURCES -->
        <q-tab-panel name="resources" class="q-pa-md">
          <!-- SEARCH & FILTER BAR -->
          <div class="filter-card q-pa-sm q-mb-md">
            <div class="row items-center q-col-gutter-sm">
              <div class="col-12 col-md-4">
                <q-input
                  v-model="searchQuery"
                  outlined
                  dense
                  clearable
                  placeholder="Search resources..."
                  class="filter-search"
                >
                  <template #prepend>
                    <q-icon name="search" size="18px" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  v-model="projectFilter"
                  outlined
                  dense
                  emit-value
                  map-options
                  :options="projectFilterOptions"
                  label="Filter by Project"
                  class="filter-select"
                  @update:model-value="loadData"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  v-model="statusFilter"
                  outlined
                  dense
                  emit-value
                  map-options
                  :options="statusOptions"
                  label="Workload Status"
                  class="filter-select"
                />
              </div>

              <div class="col-12 col-md-2 row justify-end items-center">
                <q-btn-toggle
                  v-model="viewMode"
                  unelevated
                  dense
                  toggle-color="primary"
                  toggle-text-color="white"
                  color="grey-2"
                  text-color="grey-8"
                  class="view-toggle-btn"
                  :options="[
                    { icon: 'grid_view', value: 'grid' },
                    { icon: 'format_list_bulleted', value: 'table' },
                  ]"
                />
              </div>
            </div>
          </div>

          <!-- LOADING / EMPTY STATES -->
          <div v-if="loading" class="row justify-center q-pa-xl">
            <q-spinner color="primary" size="40px" />
          </div>

          <div
            v-else-if="filteredResources.length === 0"
            class="row justify-center q-pa-xl text-center"
          >
            <q-card flat bordered class="table-card q-pa-lg">
              <q-avatar size="58px" class="stat-purple">
                <q-icon name="person_off" size="28px" />
              </q-avatar>
              <div class="text-subtitle1 text-weight-bold text-dark q-mt-sm">
                No Resource Allocations Found
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Assign a resource to a project or assign tasks to populate resource allocation
                metrics.
              </div>
              <q-btn
                unelevated
                no-caps
                icon="person_add"
                label="Assign Resource to Project"
                class="action-btn-primary q-mt-md"
                @click="showProjectMemberDialog = true"
              />
            </q-card>
          </div>

          <!-- GRID VIEW -->
          <!-- GRID VIEW -->
          <div v-else-if="viewMode === 'grid'" class="resources-cards-grid">
            <q-card
              v-for="res in filteredResources"
              :key="res.resource_id"
              flat
              bordered
              class="resource-grid-card column justify-between cursor-pointer"
              @click="goToDetails(res.resource_id)"
            >
              <q-card-section class="q-pa-md">
                <!-- CARD TOP: AVATAR, NAME, CHIP -->
                <div class="row items-center justify-between no-wrap q-mb-md">
                  <div class="row items-center no-wrap col q-mr-sm" style="min-width: 0">
                    <q-avatar
                      size="42px"
                      class="resource-card-avatar avatar-purple q-mr-sm flex-shrink-0"
                    >
                      {{ getInitials(res.name) }}
                    </q-avatar>
                    <div class="col" style="min-width: 0">
                      <div class="resource-name ellipsis" :title="res.name">
                        {{ res.name }}
                      </div>
                      <div class="resource-role">Team Resource</div>
                    </div>
                  </div>

                  <q-chip dense square :class="['status-chip', getWorkloadChipClass(res.status)]">
                    {{ formatWorkloadStatus(res.status) }}
                  </q-chip>
                </div>

                <!-- WORKLOAD METRICS BOX -->
                <div class="workload-metric-box q-pa-sm q-mb-sm">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span class="text-grey-7 text-weight-medium">Weekly Workload</span>
                    <span class="text-weight-bold text-dark"
                      >{{ formatHours(res.totalEffort) }} / {{ res.weeklyCapacity }}h ({{
                        res.utilization
                      }}%)</span
                    >
                  </div>
                  <q-linear-progress
                    rounded
                    size="6px"
                    :value="Math.min(100, res.utilization) / 100"
                    :color="getUtilizationColor(res.utilization)"
                    track-color="grey-3"
                    class="workload-progress"
                  />
                </div>

                <!-- STAT COUNTS -->
                <div class="row justify-between text-caption text-grey-7 q-pt-xs q-mb-sm">
                  <div class="row items-center">
                    <q-icon name="task_alt" size="15px" color="teal" class="q-mr-xs" />
                    <span class="text-weight-medium text-dark">{{ res.tasks.length }} Tasks</span>
                  </div>
                  <div class="row items-center">
                    <q-icon name="folder" size="15px" color="primary" class="q-mr-xs" />
                    <span class="text-weight-medium text-dark"
                      >{{ res.projectsCount }} Projects</span
                    >
                  </div>
                </div>

                <!-- PROJECTS WORKING ON -->
                <div class="q-mt-xs">
                  <div class="text-caption text-grey-7 text-weight-medium q-mb-xs">
                    Projects Working On:
                  </div>
                  <div
                    v-if="res.projectNames && res.projectNames.length > 0"
                    class="row q-gutter-xs wrap"
                  >
                    <q-chip
                      v-for="pName in res.projectNames"
                      :key="pName"
                      dense
                      square
                      class="project-badge"
                      :title="pName"
                    >
                      <q-icon name="folder" size="12px" class="q-mr-xs flex-shrink-0" />
                      <span class="ellipsis" style="max-width: 250px">{{ pName }}</span>
                    </q-chip>
                  </div>
                  <div v-else class="text-caption text-grey-5 italic">
                    No active project assignments
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <!-- CARD ACTIONS -->
              <q-card-actions class="q-pa-sm row no-wrap gap-xs">
                <q-btn
                  outline
                  dense
                  no-caps
                  label="Profile"
                  class="col action-btn-outline"
                  @click.stop="goToDetails(res.resource_id)"
                />
                <q-btn
                  outline
                  dense
                  no-caps
                  icon="edit_calendar"
                  label="Schedule"
                  class="col action-btn-outline"
                  @click.stop="openResourceScheduleDialog(res)"
                />
                <q-btn
                  unelevated
                  dense
                  no-caps
                  icon="add_task"
                  label="Assign"
                  class="col action-btn-primary"
                  @click.stop="openAssignModal(res.resource_id)"
                />
              </q-card-actions>
            </q-card>
          </div>

          <!-- TABLE VIEW -->
          <q-card v-else flat bordered class="table-card">
            <q-table
              flat
              :rows="filteredResources"
              :columns="tableColumns"
              row-key="resource_id"
              :pagination="{ rowsPerPage: 10 }"
              class="resources-table"
            >
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div
                    class="row items-center cursor-pointer"
                    @click="goToDetails(props.row.resource_id)"
                  >
                    <q-avatar size="32px" class="avatar-purple q-mr-sm">
                      {{ getInitials(props.row.name) }}
                    </q-avatar>
                    <div>
                      <div class="text-weight-bold text-dark">{{ props.row.name }}</div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template #body-cell-projects="props">
                <q-td :props="props">
                  <div
                    v-if="props.row.projectNames && props.row.projectNames.length > 0"
                    class="row q-gutter-xs wrap"
                  >
                    <q-chip
                      v-for="pName in props.row.projectNames"
                      :key="pName"
                      dense
                      square
                      class="project-badge"
                    >
                      <q-icon name="folder" size="12px" class="q-mr-xs" />
                      {{ pName }}
                    </q-chip>
                  </div>
                  <span v-else class="text-caption text-grey-5">Unassigned</span>
                </q-td>
              </template>

              <template #body-cell-utilization="props">
                <q-td :props="props">
                  <div style="min-width: 130px">
                    <div class="row justify-between text-caption progress-label-row">
                      <span class="text-weight-bold">{{ props.row.utilization }}%</span>
                      <span class="text-grey-6">({{ formatHours(props.row.totalEffort) }})</span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="5px"
                      :value="Math.min(100, props.row.utilization) / 100"
                      :color="getUtilizationColor(props.row.utilization)"
                      track-color="grey-3"
                    />
                  </div>
                </q-td>
              </template>

              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    square
                    :class="['status-chip', getWorkloadChipClass(props.row.status)]"
                  >
                    {{ formatWorkloadStatus(props.row.status) }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" auto-width>
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit_calendar"
                    color="primary"
                    class="q-mr-xs"
                    @click.stop="openResourceScheduleDialog(props.row)"
                  >
                    <q-tooltip>Edit Work Schedule</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    dense
                    icon="visibility"
                    color="primary"
                    @click="goToDetails(props.row.resource_id)"
                  >
                    <q-tooltip>View Profile Details</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card>
        </q-tab-panel>

        <!-- TAB 2: TASKS ASSIGNED BY PM -->
        <q-tab-panel name="tasks" class="q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <div
              class="text-subtitle1 text-weight-bold"
              :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
            >
              Tasks Assigned across Managed Projects
            </div>
            <q-chip dense square class="project-badge text-weight-bold">
              {{ taskList.length }} Total Tasks
            </q-chip>
          </div>

          <q-table
            flat
            :dark="$q.dark.isActive"
            :rows="taskList"
            :columns="pmTaskColumns"
            row-key="task_id"
            no-data-label="No tasks currently assigned by PM"
            :pagination="{ rowsPerPage: 10 }"
            class="resources-table"
          >
            <template #body-cell-project="props">
              <q-td :props="props">
                <q-chip dense square class="project-badge">
                  <q-icon name="folder" size="12px" class="q-mr-xs" />
                  {{ getProjectName(props.row.project_id) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip dense square :class="['status-chip', getTaskStatusClass(props.row.status)]">
                  {{ formatTaskStatus(props.row.status) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-priority="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :class="['priority-chip', getPriorityClass(props.row.priority)]"
                >
                  {{ props.row.priority }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-resources="props">
              <q-td :props="props">
                <div
                  v-if="
                    props.row.assigned_resource_ids && props.row.assigned_resource_ids.length > 0
                  "
                  class="row q-gutter-xs wrap"
                >
                  <q-chip
                    v-for="rId in props.row.assigned_resource_ids"
                    :key="rId"
                    dense
                    square
                    removable
                    class="resource-chip"
                    @remove="confirmUnassignTaskResource(props.row, rId)"
                  >
                    <q-avatar size="16px" class="avatar-purple q-mr-xs">
                      {{ getResourceName(rId).charAt(0).toUpperCase() }}
                    </q-avatar>
                    {{ getResourceName(rId) }}
                    <q-tooltip>Click X to unassign this resource</q-tooltip>
                  </q-chip>
                </div>
                <span v-else class="text-caption text-grey-5">Unassigned</span>
              </q-td>
            </template>

            <template #body-cell-effort="props">
              <q-td :props="props" class="text-center">
                <span
                  v-if="props.row.supervisor_id"
                  class="text-purple-7 text-weight-bold"
                  :title="`Base Effort: ${props.row.expected_effort}h + Supervisor: ${(Number(props.row.expected_effort) * 0.2).toFixed(1)}h`"
                >
                  {{ (Number(props.row.expected_effort || 0) * 1.2).toFixed(1) }}h <span class="text-caption text-grey-6">({{ props.row.expected_effort }}+{{ (Number(props.row.expected_effort || 0) * 0.2).toFixed(1) }})</span>
                </span>
                <span
                  v-else-if="(props.row.assigned_resource_ids?.length || 1) > 1"
                  class="text-primary text-weight-medium"
                  :title="`Total: ${props.row.expected_effort}h (${(Number(props.row.expected_effort) / props.row.assigned_resource_ids.length).toFixed(1)}h each across ${props.row.assigned_resource_ids.length} assignees)`"
                >
                  {{ props.row.expected_effort }}h <span class="text-caption text-grey-6">(${(Number(props.row.expected_effort) / props.row.assigned_resource_ids.length).toFixed(1)}h ea)</span>
                </span>
                <span v-else>
                  {{ props.row.expected_effort || 0 }}h
                </span>
              </q-td>
            </template>

            <template #body-cell-deadline="props">
              <q-td :props="props" class="date-cell">
                {{ formatDate(props.row.deadline) }}
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- ASSIGN RESOURCE TO PROJECT DIALOG (POST /api/projects/:id/members) -->
    <q-dialog v-model="showProjectMemberDialog">
      <q-card
        class="dialog-card"
        :dark="$q.dark.isActive"
        style="min-width: 440px; max-width: 95vw"
      >
        <q-card-section class="row items-center justify-between q-pb-none">
          <div
            class="text-subtitle1 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Assign Resource to Project
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignProjectMember">
          <q-card-section class="q-gutter-md q-pt-md">
            <q-select
              v-model="projectMemberForm.project_id"
              outlined
              dense
              label="Select Project"
              :options="projectOptions"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Project is required']"
            />

            <q-select
              v-model="projectMemberForm.user_ids"
              outlined
              dense
              multiple
              clearable
              emit-value
              map-options
              :display-value="
                projectMemberForm.user_ids.length
                  ? `${projectMemberForm.user_ids.length} selected`
                  : ''
              "
              label="Select Resource Member(s)"
              :options="resourceMemberSelectOptions"
              :rules="[
                (val) => (val && val.length > 0) || 'At least one Resource Member is required',
              ]"
            >
              <template #option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps" :disable="opt.alreadyMember">
                  <q-item-section side>
                    <q-checkbox
                      :model-value="selected || opt.alreadyMember"
                      :disable="opt.alreadyMember"
                      color="primary"
                      @update:model-value="toggleOption(opt)"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      :class="{
                        'text-grey-6': opt.alreadyMember,
                        'text-weight-medium': !opt.alreadyMember,
                      }"
                    >
                      {{ opt.label }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section v-if="opt.alreadyMember" side>
                    <q-chip dense square color="grey-3" text-color="grey-8" style="font-size: 10px">
                      <q-icon name="check" size="13px" class="q-mr-xs" color="positive" />
                      Already Member
                    </q-chip>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn
              v-close-popup
              flat
              no-caps
              label="Cancel"
              color="grey-7"
              class="text-weight-medium"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Assign to Project"
              class="action-btn-primary"
              :loading="submittingMember"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ASSIGN TASK DIALOG (POST /api/tasks) -->
    <q-dialog v-model="showAssignDialog">
      <q-card
        class="dialog-card"
        :dark="$q.dark.isActive"
        style="min-width: 440px; max-width: 95vw"
      >
        <q-card-section class="row items-center justify-between q-pb-none">
          <div
            class="text-subtitle1 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Assign Task to {{ getResourceName(selectedResourceId || 0) }}
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleAssignTask">
          <q-card-section class="q-gutter-y-md q-pt-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="assignForm.project_id"
                  outlined
                  dense
                  label="Select Project"
                  :options="projectOptions"
                  emit-value
                  map-options
                  :rules="[(val) => !!val || 'Project is required']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="assignForm.title"
                  outlined
                  dense
                  label="Task Title"
                  :rules="[(val) => !!val.trim() || 'Title is required']"
                />
              </div>
            </div>

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

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="assignForm.supervisor_id"
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                  label="Supervisor / Reviewer (Optional)"
                  :options="assignSupervisorOptions"
                  :disable="!assignForm.project_id"
                >
                  <template #prepend>
                    <q-icon name="supervisor_account" size="18px" />
                  </template>
                  <template #hint>
                    Supervisor receives +20% effort overhead and can log work (cannot be the
                    assigned resource)
                  </template>
                </q-select>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn
              v-close-popup
              flat
              no-caps
              label="Cancel"
              color="grey-7"
              class="text-weight-medium"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Assign Task"
              class="action-btn-primary"
              :loading="submitting"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- CONFIRM UNASSIGN TASK RESOURCE DIALOG -->
    <ConfirmActionDialog
      v-model="showUnassignTaskDialog"
      title="Unassign Resource from Task"
      subtitle=""
      icon="person_remove"
      confirm-label="Unassign"
      :loading="unassigningTask"
      @confirm="handleExecuteUnassignTask"
    >
      Are you sure you want to remove
      <strong>{{ unassignTaskTarget.resourceName }}</strong> from the task
      <strong>"{{ unassignTaskTarget.taskTitle }}"</strong>?
    </ConfirmActionDialog>

    <!-- PM WORK SCHEDULE CONFIGURATION DIALOG -->
    <q-dialog v-model="showScheduleDialog" persistent>
      <q-card
        :dark="$q.dark.isActive"
        style="min-width: 440px; max-width: 520px; border-radius: 14px"
      >
        <q-card-section class="row items-center justify-between q-pb-xs">
          <div class="row items-center q-gutter-xs">
            <q-icon name="edit_calendar" size="24px" color="primary" />
            <div
              class="text-h6 text-weight-bold"
              :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
            >
              Work Schedule: {{ scheduleTargetResource?.name || 'Resource' }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="text-caption text-grey-6 q-pt-none">
          Configure weekly non-working days (days off) and daily working hours capacity for this
          resource.
        </q-card-section>

        <q-separator />

        <q-card-section v-if="scheduleModalLoading" class="row justify-center items-center q-pa-xl">
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
                :color="isScheduleNonWorkingDay(day.value) ? 'deep-orange-7' : 'grey-3'"
                :text-color="isScheduleNonWorkingDay(day.value) ? 'white' : 'grey-8'"
                :icon="isScheduleNonWorkingDay(day.value) ? 'event_busy' : 'check_circle_outline'"
                class="text-weight-bold cursor-pointer transition-all"
                @click="toggleScheduleNonWorkingDay(day.value)"
              >
                {{ day.label }}
              </q-chip>
            </div>
            <div v-if="modalNonWorkingDays.length >= 7" class="text-caption text-negative q-mt-xs">
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
          <q-card flat bordered class="q-pa-sm" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'">
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
            @click="handleSaveResourceSchedule"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import StatCard from '@/components/dashboard/StatCard.vue';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog.vue';
import {
  formatDate,
  formatStatus as formatTaskStatus,
  formatHours,
  formatNumber,
  getInitials,
} from '@/utils/formatters';
import { getTaskStatusClass, getPriorityClass } from '@/utils/taskHelpers';
import {
  assignProjectMemberApi,
  createTaskApi,
  getProjectsApi,
  getResourcesApi,
  getResourceProjectsApi,
  getTasksApi,
  unassignTaskResourceApi,
  getResourceWorkScheduleApi,
  updateResourceWorkScheduleApi,
  calculateResourceWeeklyCapacity,
  getResourceWorkloadApi,
} from '@/services/api';
import type { Project, ResourceUser, Task, DayOfWeek, ResourceWorkload } from '@/services/api';

const $q = useQuasar();
const router = useRouter();

// PM Work Schedule Modal State
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

const showScheduleDialog = ref(false);
const scheduleModalLoading = ref(false);
const scheduleModalSubmitting = ref(false);
const scheduleTargetResource = ref<{
  resource_id?: number;
  user_id?: number;
  name?: string;
} | null>(null);
const modalNonWorkingDays = ref<DayOfWeek[]>(['SATURDAY', 'SUNDAY']);
const modalDailyHours = ref(8.0);

const modalActiveWorkingDays = computed(() => {
  return ALL_WEEK_DAYS.filter((d) => !modalNonWorkingDays.value.includes(d));
});

function formatDayName(day: DayOfWeek): string {
  const match = weekDayOptions.find((o) => o.value === day);
  return match ? match.label : day;
}

function isScheduleNonWorkingDay(day: DayOfWeek): boolean {
  return modalNonWorkingDays.value.includes(day);
}

function toggleScheduleNonWorkingDay(day: DayOfWeek) {
  if (modalNonWorkingDays.value.includes(day)) {
    modalNonWorkingDays.value = modalNonWorkingDays.value.filter((d) => d !== day);
  } else {
    modalNonWorkingDays.value = [...modalNonWorkingDays.value, day];
  }
}

async function openResourceScheduleDialog(resource: {
  resource_id?: number;
  user_id?: number;
  name?: string;
}) {
  scheduleTargetResource.value = resource;
  const targetId = resource.resource_id || resource.user_id;
  if (!targetId) return;

  showScheduleDialog.value = true;
  scheduleModalLoading.value = true;
  try {
    const config = await getResourceWorkScheduleApi(targetId);
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

async function handleSaveResourceSchedule() {
  const targetId =
    scheduleTargetResource.value?.resource_id || scheduleTargetResource.value?.user_id;
  if (!targetId) return;

  if (modalNonWorkingDays.value.length >= 7) {
    $q.notify({
      type: 'warning',
      message: 'A resource must have at least one active working day.',
    });
    return;
  }

  scheduleModalSubmitting.value = true;
  try {
    await updateResourceWorkScheduleApi(targetId, {
      non_working_days: modalNonWorkingDays.value,
    });
    $q.notify({
      type: 'positive',
      message: `Work schedule for ${scheduleTargetResource.value?.name || 'Resource'} updated successfully`,
    });
    showScheduleDialog.value = false;
    void loadData();
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

const loading = ref(true);
const searchQuery = ref('');
const statusFilter = ref('ALL');
const projectFilter = ref<number | 'ALL'>('ALL');
const mainTab = ref<'resources' | 'tasks'>('resources');
const viewMode = ref<'grid' | 'table'>('grid');

const projectList = ref<Project[]>([]);
const taskList = ref<Task[]>([]);
const resourceList = ref<ResourceUser[]>([]);
const resourceProjectsMap = ref<Record<number, Project[]>>({});
const resourceWorkloadsMap = ref<Record<number, ResourceWorkload>>({});

const showAssignDialog = ref(false);
const selectedResourceId = ref<number | null>(null);
const submitting = ref(false);

const showProjectMemberDialog = ref(false);
const submittingMember = ref(false);

const showUnassignTaskDialog = ref(false);
const unassigningTask = ref(false);
const unassignTaskTarget = reactive({
  taskId: 0,
  taskTitle: '',
  resourceId: 0,
  resourceName: '',
});

function confirmUnassignTaskResource(task: Task, rId: number) {
  unassignTaskTarget.taskId = task.task_id;
  unassignTaskTarget.taskTitle = task.title;
  unassignTaskTarget.resourceId = rId;
  unassignTaskTarget.resourceName = getResourceName(rId);
  showUnassignTaskDialog.value = true;
}

async function handleExecuteUnassignTask() {
  if (!unassignTaskTarget.taskId || !unassignTaskTarget.resourceId) return;

  unassigningTask.value = true;
  try {
    await unassignTaskResourceApi(unassignTaskTarget.taskId, unassignTaskTarget.resourceId);
    $q.notify({
      type: 'positive',
      message: `Unassigned ${unassignTaskTarget.resourceName} successfully`,
    });
    showUnassignTaskDialog.value = false;
    await loadData();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to unassign resource',
    });
  } finally {
    unassigningTask.value = false;
  }
}

const projectMemberForm = reactive({
  project_id: null as number | null,
  user_ids: [] as number[],
});

const assignForm = reactive<{
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expected_effort: number;
  supervisor_id: number | null;
}>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  expected_effort: 8,
  supervisor_id: null,
});

const assignSupervisorOptions = computed(() => {
  if (!assignForm.project_id) return [];
  const targetPid = assignForm.project_id;
  return resourceList.value
    .filter((r) => {
      const isNotAssignee = r.user_id !== selectedResourceId.value;
      const projs = resourceProjectsMap.value[r.user_id] || [];
      const isMember = projs.length === 0 || projs.some((p) => p.project_id === targetPid);
      return isNotAssignee && isMember;
    })
    .map((r) => ({
      label: `${r.name} (${r.email || 'Resource'})`,
      value: r.user_id,
    }));
});

const statusOptions = [
  { label: 'All Workloads', value: 'ALL' },
  { label: 'Available (<75%)', value: 'AVAILABLE' },
  { label: 'High Load (75-100%)', value: 'HIGH_LOAD' },
  { label: 'Overallocated (>100%)', value: 'OVERALLOCATED' },
];

const projectFilterOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: string | number }> = [
    { label: 'All Projects', value: 'ALL' },
  ];
  for (const p of projectList.value) {
    const id = Number(p.project_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({
        label: p.name,
        value: id,
      });
    }
  }
  return opts;
});

interface ResourceAggregate {
  resource_id: number;
  name: string;
  tasks: Task[];
  activeTasksCount: number;
  projectsCount: number;
  projectNames: string[];
  totalEffort: number;
  weeklyCapacity: number;
  utilization: number;
  status: 'AVAILABLE' | 'HIGH_LOAD' | 'OVERALLOCATED';
}

const tableColumns: QTableColumn<ResourceAggregate>[] = [
  { name: 'name', label: 'Resource Member', field: (r) => r.name, align: 'left' },
  { name: 'tasks', label: 'Assigned Tasks', field: (r) => r.tasks.length, align: 'center' },
  { name: 'projects', label: 'Projects Working On', field: (r) => r.projectsCount, align: 'left' },
  {
    name: 'effort',
    label: 'Allocated Hours',
    field: (r) => formatNumber(r.totalEffort),
    align: 'center',
  },
  { name: 'utilization', label: 'Utilization', field: (r) => r.utilization, align: 'left' },
  { name: 'status', label: 'Status', field: (r) => r.status, align: 'center' },
  { name: 'actions', label: 'Actions', field: () => '', align: 'center' },
];

const pmTaskColumns: QTableColumn<Task>[] = [
  { name: 'title', label: 'Task Title', field: (t) => t.title, align: 'left' },
  {
    name: 'project',
    label: 'Project Name',
    field: (t) => getProjectName(t.project_id),
    align: 'left',
  },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'resources', label: 'Assigned Resources', field: () => '', align: 'left' },
  {
    name: 'effort',
    label: 'Effort (Hrs)',
    field: (t) => formatNumber(t.expected_effort || 0),
    align: 'center',
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: (t) => (t.deadline ? t.deadline.split('T')[0] : 'TBD'),
    align: 'left',
  },
];

function getProjectName(id: number): string {
  const p = projectList.value.find((item) => item.project_id === id);
  return p ? p.name : `Project #${id}`;
}

async function loadData() {
  loading.value = true;
  try {
    const selectedProjectId =
      projectFilter.value === 'ALL' ? undefined : Number(projectFilter.value);
    const [projects, tasks, resources] = await Promise.all([
      getProjectsApi(),
      getTasksApi(selectedProjectId),
      getResourcesApi(selectedProjectId),
    ]);
    projectList.value = projects;
    taskList.value = tasks;
    resourceList.value = resources;

    const [resourceProjectsList, resourceWorkloadsList] = await Promise.all([
      Promise.all(resources.map((r) => getResourceProjectsApi(r.user_id).catch(() => []))),
      Promise.all(resources.map((r) => getResourceWorkloadApi(r.user_id).catch(() => null))),
    ]);
    const pMap: Record<number, Project[]> = {};
    const wMap: Record<number, ResourceWorkload> = {};
    resources.forEach((r, idx) => {
      pMap[r.user_id] = resourceProjectsList[idx] || [];
      if (resourceWorkloadsList[idx]) {
        wMap[r.user_id] = resourceWorkloadsList[idx]!;
      }
    });
    resourceProjectsMap.value = pMap;
    resourceWorkloadsMap.value = wMap;

    if (projects.length > 0 && !projectMemberForm.project_id) {
      projectMemberForm.project_id = projects[0]!.project_id;
    }
  } catch (error) {
    console.error('Failed to load backend data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadData();
});

const resourceNamesMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {};
  for (const r of resourceList.value) {
    map[r.user_id] = r.name;
  }
  return map;
});

function getResourceName(id: number): string {
  return resourceNamesMap.value[id] || 'Team Resource';
}

const projectMemberFormExistingMembers = ref<ResourceUser[]>([]);

watch(
  () => projectMemberForm.project_id,
  async (newProjectId) => {
    if (newProjectId) {
      projectMemberFormExistingMembers.value = await getResourcesApi(newProjectId).catch(() => []);
    } else {
      projectMemberFormExistingMembers.value = [];
    }
  },
  { immediate: true },
);

watch(
  () => showProjectMemberDialog.value,
  async (isOpen) => {
    if (isOpen) {
      if (!projectMemberForm.project_id && projectList.value.length > 0) {
        projectMemberForm.project_id = projectList.value[0]!.project_id;
      }
      if (projectMemberForm.project_id) {
        projectMemberFormExistingMembers.value = await getResourcesApi(
          projectMemberForm.project_id,
        ).catch(() => []);
      }
      projectMemberForm.user_ids = [];
    }
  },
);

const resourceMemberSelectOptions = computed(() => {
  const existingIds = new Set(
    projectMemberFormExistingMembers.value
      .map((m) => Number(m.user_id))
      .filter((id) => !isNaN(id) && id > 0),
  );
  const seen = new Set<number>();
  const opts: Array<{
    label: string;
    value: number;
    alreadyMember: boolean;
    disable: boolean;
  }> = [];

  for (const r of resourceList.value) {
    const rId = Number(r.user_id);
    if (rId && !isNaN(rId) && !seen.has(rId)) {
      seen.add(rId);
      const isMember = existingIds.has(rId);
      opts.push({
        label: r.name,
        value: rId,
        alreadyMember: isMember,
        disable: isMember,
      });
    }
  }
  return opts;
});

const resourceMap = computed(() => {
  const map = new Map<number, ResourceAggregate>();

  for (const r of resourceList.value) {
    const weeklyCap = calculateResourceWeeklyCapacity(r);
    map.set(r.user_id, {
      resource_id: r.user_id,
      name: r.name,
      tasks: [],
      activeTasksCount: 0,
      projectsCount: 0,
      projectNames: [],
      totalEffort: 0,
      weeklyCapacity: weeklyCap,
      utilization: 0,
      status: 'AVAILABLE',
    });
  }

  for (const t of taskList.value) {
    const rIds = t.assigned_resource_ids || [];

    for (const rid of rIds) {
      if (!map.has(rid)) {
        const rObj = resourceList.value.find((r) => r.user_id === rid);
        const weeklyCap = calculateResourceWeeklyCapacity(rObj);
        map.set(rid, {
          resource_id: rid,
          name: getResourceName(rid),
          tasks: [],
          activeTasksCount: 0,
          projectsCount: 0,
          projectNames: [],
          totalEffort: 0,
          weeklyCapacity: weeklyCap,
          utilization: 0,
          status: 'AVAILABLE',
        });
      }

      const item = map.get(rid)!;
      item.tasks.push(t);
      if (t.status !== 'COMPLETED') {
        item.activeTasksCount++;
      }
    }
  }

  const projectMap = new Map<number, string>();
  for (const p of projectList.value) {
    projectMap.set(p.project_id, p.name);
  }

  // Compute stats for each resource combining task assignments and direct project memberships
  const result: ResourceAggregate[] = [];
  for (const item of map.values()) {
    const taskProjectIds = item.tasks.map((t) => t.project_id);
    const memberProjects = resourceProjectsMap.value[item.resource_id] || [];
    const memberProjectIds = memberProjects.map((p) => p.project_id);

    const allProjectIds = new Set([...taskProjectIds, ...memberProjectIds]);
    item.projectsCount = allProjectIds.size;

    const names = new Set<string>();
    for (const pid of allProjectIds) {
      const name = projectMap.get(pid);
      if (name) {
        names.add(name);
      }
    }
    for (const mp of memberProjects) {
      if (mp.name) {
        names.add(mp.name);
      }
    }
    item.projectNames = Array.from(names);

    // Compute weekly scheduled workload effort from backend schedule engine
    const workload = resourceWorkloadsMap.value[item.resource_id];
    let scheduledEffort: number;

    if (workload?.daily_allocations && workload.daily_allocations.length > 0) {
      // Sum scheduled hours from active schedule dates (backend filters >= CURDATE())
      scheduledEffort = workload.daily_allocations.reduce(
        (sum, d) => sum + (Number(d.allocated_hours) || 0),
        0,
      );
    } else if (workload?.tasks && workload.tasks.length > 0) {
      // Fallback: active remaining effort from resource workload tasks distributed among co-assignees
      scheduledEffort = workload.tasks.reduce((sum, t) => {
        const hasAssigneesCount = Boolean((t as unknown as { assignees_count?: number }).assignees_count);
        const assigneesCount = Math.max(
          1,
          t.assigned_resource_ids?.length ||
            (t as unknown as { assigned_resources?: unknown[] }).assigned_resources?.length ||
            (t as unknown as { assignees_count?: number }).assignees_count ||
            1,
        );
        const remEffort = Math.max(
          0,
          (Number(t.expected_effort) || 0) - (Number(t.actual_effort) || 0),
        );
        return sum + (hasAssigneesCount ? remEffort : remEffort / assigneesCount);
      }, 0);
    } else {
      // Fallback: local active task remaining effort distributed among co-assignees
      const activeTasks = item.tasks.filter((t) => t.status !== 'COMPLETED');
      scheduledEffort = activeTasks.reduce((sum, t) => {
        const assigneesCount = Math.max(
          1,
          t.assigned_resource_ids?.length ||
            (t as unknown as { assigned_resources?: unknown[] }).assigned_resources?.length ||
            1,
        );
        const remEffort = Math.max(
          0,
          (Number(t.expected_effort) || 0) - (Number(t.actual_effort) || 0),
        );
        return sum + remEffort / assigneesCount;
      }, 0);
    }

    item.totalEffort = Math.round(scheduledEffort * 10) / 10;

    // Dynamic weekly capacity derived from actual resource work schedule
    const cap = Math.max(1, item.weeklyCapacity || 40);
    // True utilization percentage without artificial 150% clamp
    item.utilization = Math.round((item.totalEffort / cap) * 100);

    if (item.utilization > 100) item.status = 'OVERALLOCATED';
    else if (item.utilization >= 75) item.status = 'HIGH_LOAD';
    else item.status = 'AVAILABLE';

    result.push(item);
  }

  return result;
});

const totalEffortHours = computed(() =>
  resourceMap.value.reduce((acc, r) => acc + r.totalEffort, 0),
);

const filteredResources = computed(() => {
  return resourceMap.value.filter((r) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchesSearch =
      !q || r.name.toLowerCase().includes(q) || String(r.resource_id).includes(q);

    const matchesStatus = statusFilter.value === 'ALL' || r.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

const projectOptions = computed(() =>
  projectList.value.map((p) => ({
    label: p.name,
    value: p.project_id,
  })),
);

function getUtilizationColor(util: number): string {
  if (util > 100) return 'negative';
  if (util >= 75) return 'warning';
  return 'positive';
}

function formatWorkloadStatus(status: string): string {
  if (status === 'OVERALLOCATED') return 'Overallocated';
  if (status === 'HIGH_LOAD') return 'High Load';
  return 'Available';
}

function getWorkloadChipClass(status: string): string {
  if (status === 'OVERALLOCATED') return 'chip-soft-red';
  if (status === 'HIGH_LOAD') return 'chip-soft-orange';
  return 'chip-soft-green';
}

function goToDetails(id: number) {
  void router.push(`/pm/resources/${id}`);
}

function openAssignModal(resourceId: number) {
  selectedResourceId.value = resourceId;
  assignForm.project_id = projectList.value[0]?.project_id ?? null;
  assignForm.title = '';
  assignForm.description = '';
  assignForm.priority = 'MEDIUM';
  assignForm.expected_effort = 8;
  assignForm.supervisor_id = null;
  showAssignDialog.value = true;
}

async function handleAssignProjectMember() {
  if (!projectMemberForm.project_id || !projectMemberForm.user_ids.length) return;

  submittingMember.value = true;
  try {
    for (const uId of projectMemberForm.user_ids) {
      await assignProjectMemberApi(projectMemberForm.project_id, uId);
    }
    $q.notify({
      type: 'positive',
      message: `${projectMemberForm.user_ids.length} resource(s) assigned to project successfully`,
    });
    showProjectMemberDialog.value = false;
    projectMemberForm.user_ids = [];
    void loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to assign resource(s) to project';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submittingMember.value = false;
  }
}

async function handleAssignTask() {
  if (!selectedResourceId.value || !assignForm.project_id || !assignForm.title.trim()) {
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
      assigned_resource_ids: [selectedResourceId.value],
      supervisor_id: assignForm.supervisor_id || undefined,
    });

    $q.notify({
      type: 'positive',
      message: 'Task assigned successfully',
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
</script>

<style scoped lang="scss">
.resource-tabs {
  background: var(--wo-bg-page, #fafbfc);
  border-bottom: 1px solid var(--wo-border, #e9ebef);
}

.resource-tab {
  font-size: 13px;
  font-weight: 600;
  min-height: 46px;
}

.filter-search :deep(.q-field__control),
.filter-select :deep(.q-field__control) {
  min-height: 38px;
  border-radius: 8px;
}

.filter-search :deep(.q-field__label),
.filter-search :deep(.q-field__native),
.filter-search :deep(.q-field__input),
.filter-select :deep(.q-field__label),
.filter-select :deep(.q-field__native) {
  font-size: 12px;
}

.view-toggle-btn {
  border-radius: 8px;
  border: 1px solid var(--wo-border, #e5e7ec);
  overflow: hidden;
}

.resources-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.resource-grid-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-radius: 14px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  cursor: pointer;
  overflow: hidden;
  box-sizing: border-box;
  transition:
    transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.18s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(124, 94, 212, 0.14);
    border-color: var(--q-primary);
  }
}

.resource-card-avatar {
  border-radius: 10px;
}

.resource-name {
  color: var(--wo-text-main, #172033);
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.25;
}

.resource-role {
  color: var(--wo-text-muted, #64748b);
  font-size: 11.5px;
  margin-top: 1px;
}

.workload-metric-box {
  background: var(--wo-bg-page, #f8f9fc);
  border: 1px solid var(--wo-border-subtle, #edf0f5);
  border-radius: 8px;
}

.workload-progress {
  height: 6px;
  border-radius: 3px;
}

.project-badge {
  background: rgba(139, 111, 216, 0.12);
  color: var(--wo-primary, #8b6fd8);
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  padding: 3px 8px;
  max-width: 100%;
  box-sizing: border-box;
}

.resource-chip {
  background: var(--wo-bg-page, #f1f3f7);
  color: var(--wo-text-main, #334155);
  font-size: 11px;
  font-weight: 500;
  border-radius: 6px;
}

.status-chip,
.priority-chip {
  min-height: 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
}

.resources-table :deep(th) {
  height: 40px;
  padding: 0 14px;
  background: var(--wo-bg-page, #fafbfc);
  color: var(--wo-text-muted, #647087);
  font-size: 11px;
  font-weight: 600;
  border-bottom: 1px solid var(--wo-border, #e9ebef);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.resources-table :deep(td) {
  height: 52px;
  padding: 8px 14px;
  color: var(--wo-text-main, #334155);
  font-size: 12.5px;
  border-bottom: 1px solid var(--wo-border-subtle, #eef0f3);
}

.resources-table :deep(tbody tr:hover) {
  background: var(--wo-bg-card-hover, #faf9ff);
}

.progress-label-row {
  font-size: 11.5px;
  margin-bottom: 4px;
  color: var(--wo-text-main, #1e293b);
}

.date-cell {
  color: var(--wo-text-muted, #64748b);
  font-size: 12px;
  white-space: nowrap;
}
</style>
