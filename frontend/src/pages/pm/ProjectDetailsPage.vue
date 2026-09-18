<template>
  <q-page
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    class="q-pa-lg project-details-page"
    style="overflow-x: hidden; width: 100%; max-width: 100%"
  >
    <div
      class="q-mx-auto column q-gutter-y-lg project-details-container"
      style="max-width: 1400px; width: 100%; min-width: 0"
    >
      <!-- BREADCRUMBS -->
      <div>
        <q-breadcrumbs active-color="primary">
          <template #separator>
            <q-icon size="14px" name="chevron_right" color="grey-5" />
          </template>
          <q-breadcrumbs-el label="Projects" icon="folder" to="/pm/projects" />
          <q-breadcrumbs-el :label="project.name || 'Project Details'" icon="folder_open" />
        </q-breadcrumbs>
      </div>

      <!-- 01 HERO CARD -->
      <q-card
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders q-pa-lg"
        style="min-width: 0; width: 100%"
      >
        <div class="row q-col-gutter-lg justify-between items-start">
          <div class="col-12 col-md-7 col-lg-8 column q-gutter-y-md" style="min-width: 0">
            <!-- Badges Row -->
            <div class="row items-center q-gutter-xs wrap">
              <q-chip
                dense
                square
                :color="statusColor(project.status)"
                :text-color="statusTextColor(project.status)"
                class="text-caption text-weight-bold"
              >
                {{ formatStatus(project.status) }}
              </q-chip>

              <q-chip
                dense
                square
                :color="priorityColor(project.priority)"
                :text-color="priorityTextColor(project.priority)"
                class="text-caption text-weight-bold"
              >
                {{ project.priority || 'Medium' }} Priority
              </q-chip>
              <span class="text-caption text-grey-5">ID: #{{ project.project_id }}</span>
            </div>

            <!-- Title & Description -->
            <div style="min-width: 0; overflow-wrap: break-word; word-break: break-word">
              <div
                class="page-title text-h5 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                style="overflow-wrap: break-word; word-break: break-word"
              >
                {{ project.name }}
              </div>
              <div
                class="text-body2 q-mt-xs"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
              >
                {{
                  project.description ||
                  'Comprehensive project plan tracking milestones, resource allocations, and task deliverables across engineering and product teams.'
                }}
              </div>
            </div>

            <!-- Meta info grid -->
            <div class="row q-col-gutter-md q-mt-xs">
              <div class="col-6 col-md-6 col-lg-3">
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  Project Manager
                </div>
                <div class="row items-center q-gutter-xs q-mt-xs">
                  <q-avatar
                    size="22px"
                    color="primary"
                    text-color="white"
                    class="text-weight-bold"
                    >{{ currentPmName.charAt(0) }}</q-avatar
                  >
                  <span
                    class="text-caption text-weight-bold ellipsis"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >{{ currentPmName }}</span
                  >
                </div>
              </div>

              <div class="col-6 col-md-6 col-lg-3" style="min-width: 0">
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  Timeline
                </div>
                <div
                  class="text-caption text-weight-bold q-mt-xs"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  style="overflow-wrap: break-word; word-break: break-word"
                >
                  {{ formatDate(project.start_date) }}&thinsp;&mdash;&thinsp;{{
                    formatDate(project.deadline)
                  }}
                </div>
              </div>

              <div class="col-6 col-md-6 col-lg-3">
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  Days Remaining
                </div>
                <div
                  class="text-caption text-weight-bold q-mt-xs"
                  :class="daysRemaining < 0 ? 'text-negative' : 'text-primary'"
                >
                  {{ daysRemainingText }}
                </div>
              </div>

              <div class="col-6 col-md-6 col-lg-3">
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  Team Members
                </div>
                <div class="row items-center q-gutter-xs q-mt-xs wrap">
                  <q-avatar
                    v-for="m in teamMembers.slice(0, 3)"
                    :key="m.id"
                    size="24px"
                    color="primary"
                    text-color="white"
                    class="text-caption text-weight-bold"
                  >
                    {{ m.name.charAt(0) }}
                  </q-avatar>
                  <q-chip
                    v-if="teamMembers.length > 3"
                    dense
                    square
                    color="grey-3"
                    text-color="dark"
                    class="text-caption text-weight-bold"
                  >
                    +{{ teamMembers.length - 3 }}
                  </q-chip>
                </div>
              </div>
            </div>
          </div>

          <!-- Hero Sidebar: Progress & Actions -->
          <div class="col-12 col-md-5 col-lg-4" style="min-width: 0">
            <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders q-pa-md q-mb-md">
              <div class="row items-center justify-between no-wrap">
                <span
                  class="text-caption text-weight-bold"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                  >Overall Completion</span
                >
                <span class="text-h6 text-weight-bolder text-primary q-ml-sm"
                  >{{ overallProgress }}%</span
                >
              </div>

              <q-linear-progress
                rounded
                size="10px"
                :value="overallProgress / 100"
                color="primary"
                class="q-mt-sm"
                :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
              />

              <div class="row items-center justify-between text-caption text-grey-5 q-mt-xs wrap">
                <span>{{ completedTasksCount }} of {{ totalTasksCount }} tasks done</span>
                <span class="q-ml-xs"
                  >{{ formatHours(totalEffortLogged) }} /
                  {{ formatHours(totalEffortExpected) }} effort</span
                >
              </div>
            </q-card>

            <div class="row items-center no-wrap q-gutter-xs">
              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="add_task"
                label="Add Task"
                class="col text-weight-bold"
                style="min-width: 0"
                @click="showCreateTaskDialog = true"
              />
              <q-btn
                outline
                no-caps
                :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
                icon="edit"
                label="Edit"
                class="text-weight-bold"
                @click="openEditDialog"
              />
              <q-btn
                flat
                round
                dense
                icon="more_vert"
                :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
              >
                <q-menu auto-close>
                  <q-list style="min-width: 170px">
                    <q-item clickable @click="refreshData"
                      ><q-item-section avatar><q-icon name="refresh" size="18px" /></q-item-section
                      ><q-item-section>Refresh Data</q-item-section></q-item
                    >
                    <q-item clickable @click="exportProjectSummary"
                      ><q-item-section avatar><q-icon name="download" size="18px" /></q-item-section
                      ><q-item-section>Export Report</q-item-section></q-item
                    >
                    <q-separator />
                    <q-item
                      v-if="project.status !== 'COMPLETED' && project.status !== 'ARCHIVED'"
                      clickable
                      @click="markProjectComplete"
                    >
                      <q-item-section avatar
                        ><q-icon name="task_alt" size="18px" color="positive" /></q-item-section
                      ><q-item-section class="text-positive">Mark Complete</q-item-section></q-item
                    >
                    <q-item
                      v-if="project.status === 'COMPLETED'"
                      clickable
                      @click="confirmArchiveProject"
                    >
                      <q-item-section avatar
                        ><q-icon name="archive" size="18px" color="primary" /></q-item-section
                      ><q-item-section class="text-primary">Archive Project</q-item-section></q-item
                    >
                    <q-item
                      v-if="project.status === 'ARCHIVED'"
                      clickable
                      @click="confirmUnarchiveProject"
                    >
                      <q-item-section avatar
                        ><q-icon name="unarchive" size="18px" color="primary" /></q-item-section
                      ><q-item-section class="text-primary"
                        >Unarchive Project</q-item-section
                      ></q-item
                    >
                    <q-separator />
                    <q-item clickable class="text-negative" @click="confirmDeleteProject"
                      ><q-item-section avatar
                        ><q-icon name="delete" size="18px" color="negative" /></q-item-section
                      ><q-item-section>Delete Project</q-item-section></q-item
                    >
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>
        </div>
      </q-card>

      <!-- 02 KPI METRIC CARDS -->
      <div class="row q-col-gutter-md items-stretch" style="min-width: 0">
        <div class="col-12 col-sm-6 col-md-4 col-lg-2" style="min-width: 0">
          <StatCard
            title="Overall Progress"
            :value="`${overallProgress}%`"
            :subtitle="`${completedTasksCount} completed`"
            icon="donut_large"
            color="purple"
            note-class="note-green"
            @click="filterAllTasks"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4 col-lg-2" style="min-width: 0">
          <StatCard
            title="Total Tasks"
            :value="totalTasksCount"
            :subtitle="`${inProgressTasksCount} in progress`"
            icon="task_alt"
            color="teal"
            note-class="note-teal"
            @click="filterAllTasks"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4 col-lg-2" style="min-width: 0">
          <StatCard
            title="Completed Tasks"
            :value="completedTasksCount"
            :subtitle="`${taskCompletionRate}% done`"
            icon="check_circle"
            color="green"
            note-class="note-green"
            @click="filterCompletedTasks"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4 col-lg-2" style="min-width: 0">
          <StatCard
            title="Overdue Tasks"
            :value="overdueTasksCount"
            :subtitle="overdueTasksCount > 0 ? 'Requires attention' : 'All on schedule'"
            icon="schedule"
            color="red"
            :note-class="overdueTasksCount > 0 ? 'note-red' : 'note-green'"
            :negative="overdueTasksCount > 0"
            @click="filterOverdueTasks"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4 col-lg-2" style="min-width: 0">
          <StatCard
            title="Team Members"
            :value="teamMembers.length"
            :subtitle="`${activeAssigneesCount} assigned`"
            icon="groups"
            color="orange"
            note-class="note-orange"
            @click="scrollToTeam"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4 col-lg-2" style="min-width: 0">
          <StatCard
            title="Days Remaining"
            :value="
              daysRemaining > 0
                ? daysRemaining
                : daysRemaining === 0
                  ? 'Due today'
                  : Math.abs(daysRemaining) + 'd ago'
            "
            :subtitle="`Due ${formatDate(project.deadline)}`"
            icon="event_available"
            color="blue"
            note-class="note-blue"
            :negative="daysRemaining < 0"
            @click="filterAllTasks"
          />
        </div>
      </div>

      <!-- 03 & 04 PROGRESS BREAKDOWN & MILESTONES -->
      <div class="row q-col-gutter-md items-stretch" style="min-width: 0">
        <div class="col-12 col-md-6" style="min-width: 0">
          <q-card
            flat
            bordered
            :dark="$q.dark.isActive"
            class="rounded-borders full-height column justify-between"
          >
            <div>
              <q-card-section class="row items-center justify-between">
                <div class="row items-center">
                  <q-icon name="insights" size="20px" color="primary" class="q-mr-xs" />
                  <div
                    class="text-subtitle1 text-weight-bold"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    Progress & Effort Breakdown
                  </div>
                </div>
                <q-chip
                  dense
                  square
                  :color="statusColor(project.status)"
                  :text-color="statusTextColor(project.status)"
                  class="text-caption text-weight-bold"
                >
                  {{ formatStatus(project.status) }}
                </q-chip>
              </q-card-section>

              <q-separator />

              <q-card-section class="column q-gutter-y-md">
                <div class="row q-col-gutter-xs text-center">
                  <div class="col-3">
                    <div class="text-caption text-grey-5">Pending</div>
                    <div class="text-h6 text-weight-bold">{{ pendingTasksCount }}</div>
                  </div>
                  <div class="col-3">
                    <div class="text-caption text-grey-5">In Progress</div>
                    <div class="text-h6 text-weight-bold text-info">{{ inProgressTasksCount }}</div>
                  </div>
                  <div class="col-3">
                    <div class="text-caption text-grey-5">Completed</div>
                    <div class="text-h6 text-weight-bold text-positive">
                      {{ completedTasksCount }}
                    </div>
                  </div>
                  <div class="col-3">
                    <div class="text-caption text-grey-5">On Hold</div>
                    <div class="text-h6 text-weight-bold text-warning">{{ onHoldTasksCount }}</div>
                  </div>
                </div>

                <!-- Multi Segmented Bar -->
                <div
                  class="row no-wrap rounded-borders overflow-hidden"
                  style="height: 10px; background: rgba(200, 200, 200, 0.2)"
                >
                  <div
                    :style="{
                      width: `${totalTasksCount ? (completedTasksCount / totalTasksCount) * 100 : 0}%`,
                      background: '#27ae60',
                    }"
                  />
                  <div
                    :style="{
                      width: `${totalTasksCount ? (inProgressTasksCount / totalTasksCount) * 100 : 0}%`,
                      background: '#2e90fa',
                    }"
                  />
                  <div
                    :style="{
                      width: `${totalTasksCount ? (onHoldTasksCount / totalTasksCount) * 100 : 0}%`,
                      background: '#f5841f',
                    }"
                  />
                  <div
                    :style="{
                      width: `${totalTasksCount ? (pendingTasksCount / totalTasksCount) * 100 : 0}%`,
                      background: '#8b6fd8',
                    }"
                  />
                </div>

                <!-- Effort vs Expected -->
                <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders q-pa-md">
                  <div class="row items-center justify-between text-caption">
                    <div>
                      <span :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                        >Logged Effort:
                      </span>
                      <strong :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{
                        formatHours(totalEffortLogged)
                      }}</strong>
                    </div>
                    <div>
                      <span :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                        >Expected Effort:
                      </span>
                      <strong :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{
                        formatHours(totalEffortExpected)
                      }}</strong>
                    </div>
                  </div>

                  <q-linear-progress
                    rounded
                    size="6px"
                    :value="
                      totalEffortExpected ? Math.min(1, totalEffortLogged / totalEffortExpected) : 0
                    "
                    color="primary"
                    class="q-mt-sm"
                    :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                  />
                </q-card>

                <!-- Priority Health Distribution Pill Row -->
                <div
                  class="rounded-borders q-pa-sm"
                  :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-1'"
                  style="border: 1px solid var(--wo-border-subtle, #edf0f5)"
                >
                  <div class="text-caption text-grey-6 text-weight-medium q-mb-xs">
                    Task Priority Distribution
                  </div>
                  <div class="row q-gutter-xs wrap">
                    <q-chip
                      dense
                      square
                      color="negative"
                      text-color="white"
                      class="text-caption text-weight-bold"
                    >
                      Critical: {{ criticalTasksCount }}
                    </q-chip>
                    <q-chip
                      dense
                      square
                      color="warning"
                      text-color="white"
                      class="text-caption text-weight-bold"
                    >
                      High: {{ highTasksCount }}
                    </q-chip>
                    <q-chip
                      dense
                      square
                      color="primary"
                      text-color="white"
                      class="text-caption text-weight-bold"
                    >
                      Medium: {{ mediumTasksCount }}
                    </q-chip>
                    <q-chip
                      dense
                      square
                      color="grey-6"
                      text-color="white"
                      class="text-caption text-weight-bold"
                    >
                      Low: {{ lowTasksCount }}
                    </q-chip>
                  </div>
                </div>
              </q-card-section>
            </div>

            <q-card-section class="q-pt-none">
              <div
                class="row items-center justify-between text-caption text-grey-6 q-pt-sm"
                style="border-top: 1px solid var(--wo-border-subtle, #edf0f5)"
              >
                <span
                  >Remaining:
                  <strong class="text-primary">{{ remainingEffortHours }}h</strong></span
                >
                <span
                  >Completion:
                  <strong class="text-positive">{{ taskCompletionRate }}%</strong></span
                >
                <span
                  >Avg Task Effort:
                  <strong :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >{{
                      totalTasksCount
                        ? Math.round((totalEffortExpected / totalTasksCount) * 10) / 10
                        : 0
                    }}h</strong
                  ></span
                >
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Milestones Card -->
        <div class="col-12 col-md-6" style="min-width: 0">
          <q-card
            flat
            bordered
            :dark="$q.dark.isActive"
            class="rounded-borders full-height column justify-between"
            style="min-width: 0"
          >
            <div>
              <q-card-section class="row items-center justify-between wrap q-gutter-xs">
                <div class="row items-center">
                  <q-icon name="flag" size="20px" color="primary" class="q-mr-xs" />
                  <div
                    class="text-subtitle1 text-weight-bold"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    Project Milestones
                  </div>
                </div>
                <span
                  class="text-caption"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                >
                  {{ completedMilestonesCount }}/{{ milestones.length }} Completed
                </span>
              </q-card-section>

              <q-separator />

              <div style="max-height: 380px; overflow-y: auto">
                <q-list v-if="milestones.length" separator :dark="$q.dark.isActive">
                  <q-item v-for="m in milestones" :key="m.id" class="q-py-md">
                    <q-item-section avatar>
                      <q-avatar
                        size="28px"
                        :color="
                          m.progress === 100 ? 'positive' : m.progress > 0 ? 'primary' : 'grey-5'
                        "
                        text-color="white"
                      >
                        <q-icon
                          :name="
                            m.progress === 100
                              ? 'check'
                              : m.progress > 0
                                ? 'sync'
                                : 'hourglass_empty'
                          "
                          size="14px"
                        />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section style="min-width: 0">
                      <div class="row items-center justify-between no-wrap q-gutter-xs">
                        <span
                          class="text-weight-bold ellipsis"
                          :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                          style="min-width: 0"
                          :title="m.name"
                          >{{ m.name }}</span
                        >
                        <q-chip
                          dense
                          square
                          color="primary"
                          text-color="white"
                          class="text-caption text-weight-bold flex-shrink-0"
                        >
                          {{ m.status.replace('_', ' ') }}
                        </q-chip>
                      </div>

                      <q-linear-progress
                        :value="m.progress / 100"
                        color="primary"
                        rounded
                        size="5px"
                        class="q-mt-xs"
                        :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                      />

                      <div
                        class="row items-center justify-between text-caption q-mt-xs"
                        :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                      >
                        <span>Due {{ m.dueDate }}</span>
                        <span>{{ m.completedTasks }}/{{ m.totalTasks }} tasks</span>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>

                <div v-else class="column items-center q-pa-xl text-grey-5">
                  <q-icon name="flag" size="36px" />
                  <div class="text-caption q-mt-xs">No milestones derived from tasks yet.</div>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- 05 TASK BREAKDOWN TABLE CARD -->
      <q-card
        id="task-breakdown-card"
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders"
        style="min-width: 0; width: 100%; max-width: 100%; overflow: hidden"
      >
        <q-card-section class="row items-center justify-between wrap q-gutter-y-sm">
          <div class="row items-center">
            <q-icon name="format_list_bulleted" size="20px" color="primary" class="q-mr-xs" />
            <div>
              <div
                class="text-subtitle1 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                Task Breakdown
              </div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Manage deliverables, statuses, assignees, and deadlines
              </div>
            </div>
            <q-badge
              color="primary"
              rounded
              :label="`${filteredTasks.length} tasks`"
              class="q-ml-sm"
            />
          </div>

          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="New Task"
            class="text-weight-bold"
            @click="showCreateTaskDialog = true"
          />
        </q-card-section>

        <q-separator />

        <!-- Filter Bar -->
        <q-card-section class="row items-center q-gutter-xs wrap">
          <q-input
            v-model="taskSearch"
            outlined
            dense
            clearable
            placeholder="Search tasks..."
            style="min-width: 180px"
          >
            <template #prepend><q-icon name="search" size="18px" /></template>
          </q-input>

          <q-select
            v-model="statusFilter"
            outlined
            dense
            emit-value
            map-options
            :options="taskStatusOptions"
            label="Status"
            style="width: 130px"
          />
          <q-select
            v-model="priorityFilter"
            outlined
            dense
            emit-value
            map-options
            :options="taskPriorityOptions"
            label="Priority"
            style="width: 130px"
          />
          <q-select
            v-model="assigneeFilter"
            outlined
            dense
            emit-value
            map-options
            :options="assigneeOptions"
            label="Assignee"
            style="width: 140px"
          />

          <q-btn
            flat
            dense
            no-caps
            icon="refresh"
            label="Reset"
            :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
            @click="resetTaskFilters"
          />
        </q-card-section>

        <q-separator />

        <!-- Table Container to prevent horizontal page overflow -->
        <div
          class="task-table-wrapper"
          style="width: 100%; max-width: 100%; min-width: 0; overflow: hidden"
        >
          <q-table
            flat
            :dark="$q.dark.isActive"
            :rows="filteredTasks"
            :columns="taskColumns"
            row-key="task_id"
            :loading="tasksLoading"
            :pagination="taskPagination"
            :rows-per-page-options="[5, 10, 20]"
            no-data-label="No tasks found for this project"
            class="full-width"
            table-style="min-width: 760px"
          >
            <template #body-cell-title="props">
              <q-td :props="props">
                <div class="row items-center no-wrap q-gutter-xs">
                  <q-icon
                    :name="getPriorityIcon(props.row.priority)"
                    size="16px"
                    :color="
                      props.row.priority === 'CRITICAL'
                        ? 'negative'
                        : props.row.priority === 'HIGH'
                          ? 'warning'
                          : 'primary'
                    "
                  />
                  <div>
                    <div
                      class="text-weight-bold ellipsis"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      {{ props.row.title }}
                    </div>
                    <div
                      v-if="props.row.description"
                      class="text-caption ellipsis"
                      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                      style="max-width: 280px"
                    >
                      {{ props.row.description }}
                    </div>
                  </div>
                </div>
              </q-td>
            </template>

            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :color="statusColor(props.row.status)"
                  :text-color="statusTextColor(props.row.status)"
                  class="text-caption text-weight-bold"
                >
                  {{ formatStatus(props.row.status) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-priority="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :color="priorityColor(props.row.priority)"
                  :text-color="priorityTextColor(props.row.priority)"
                  class="text-caption text-weight-bold"
                >
                  {{ props.row.priority }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-assignee="props">
              <q-td :props="props">
                <div
                  v-if="getAssigneeMembers(props.row).length"
                  class="row items-center no-wrap q-gutter-xs"
                >
                  <div class="row items-center no-wrap" style="margin-right: 4px">
                    <q-avatar
                      v-for="(member, idx) in getAssigneeMembers(props.row).slice(0, 3)"
                      :key="member.id"
                      size="24px"
                      color="primary"
                      text-color="white"
                      class="text-weight-bold shadow-1 cursor-pointer"
                      :style="idx > 0 ? 'margin-left: -8px; border: 2px solid white;' : ''"
                    >
                      {{ member.name.charAt(0) }}
                      <q-tooltip>{{ member.name }} (Click to unassign)</q-tooltip>
                      <q-menu touch-position context-menu>
                        <q-list dense>
                          <q-item
                            clickable
                            v-close-popup
                            @click="confirmUnassignTaskResource(props.row, member.id, member.name)"
                          >
                            <q-item-section avatar
                              ><q-icon name="person_remove" color="negative" size="18px"
                            /></q-item-section>
                            <q-item-section class="text-negative"
                              >Unassign {{ member.name }}</q-item-section
                            >
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-avatar>
                  </div>
                  <q-badge
                    v-if="getAssigneeMembers(props.row).length > 3"
                    color="grey-6"
                    text-color="white"
                    rounded
                    :label="`+${getAssigneeMembers(props.row).length - 3}`"
                    class="cursor-pointer"
                  >
                    <q-tooltip>
                      {{
                        getAssigneeMembers(props.row)
                          .slice(3)
                          .map((m: any) => m.name)
                          .join(', ')
                      }}
                    </q-tooltip>
                  </q-badge>
                  <span
                    v-if="
                      getAssigneeMembers(props.row).length === 1 && getAssigneeMembers(props.row)[0]
                    "
                    class="text-caption text-weight-medium q-ml-xs ellipsis"
                    style="max-width: 90px"
                    :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
                  >
                    {{ getAssigneeMembers(props.row)[0]?.name }}
                  </span>
                </div>
                <div
                  v-else
                  class="row items-center q-gutter-xs text-caption"
                  :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
                >
                  <q-avatar
                    size="22px"
                    color="primary"
                    text-color="white"
                    class="text-weight-bold"
                    >{{ getAssigneeName(props.row).charAt(0) }}</q-avatar
                  >
                  <span class="ellipsis" style="max-width: 100px">{{
                    getAssigneeName(props.row)
                  }}</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-progress="props">
              <q-td :props="props">
                <div class="row items-center no-wrap q-gutter-xs">
                  <q-linear-progress
                    rounded
                    size="6px"
                    :value="getTaskProgressNumber(props.row.progress) / 100"
                    color="primary"
                    class="col"
                    style="min-width: 60px"
                    :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                  />
                  <span
                    class="text-caption text-weight-bold"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >{{ getTaskProgressNumber(props.row.progress) }}%</span
                  >
                </div>
              </q-td>
            </template>

            <template #body-cell-deadline="props">
              <q-td :props="props">
                <div
                  class="row items-center no-wrap text-caption"
                  :class="
                    isTaskOverdue(props.row)
                      ? 'text-negative text-weight-bold'
                      : $q.dark.isActive
                        ? 'text-grey-4'
                        : 'text-grey-7'
                  "
                >
                  <q-icon
                    :name="isTaskOverdue(props.row) ? 'warning' : 'event'"
                    size="14px"
                    class="q-mr-xs"
                  />
                  <span>{{ formatDate(props.row.deadline) }}</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-effort="props">
              <q-td :props="props">
                <span
                  class="text-caption text-weight-bold"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                >
                  {{ formatHours(props.row.actual_effort) }} /
                  {{ formatHours(props.row.expected_effort) }}
                </span>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" auto-width>
                <q-btn
                  flat
                  round
                  dense
                  icon="more_horiz"
                  :color="$q.dark.isActive ? 'grey-4' : 'grey-6'"
                >
                  <q-menu auto-close>
                    <q-list style="min-width: 140px">
                      <q-item clickable @click="openQuickUpdate(props.row)"
                        ><q-item-section avatar
                          ><q-icon name="edit_note" size="18px" color="primary" /></q-item-section
                        ><q-item-section>Update Progress</q-item-section></q-item
                      >
                      <q-item clickable @click="openDependencyDialog(props.row)"
                        ><q-item-section avatar
                          ><q-icon
                            name="account_tree"
                            size="18px"
                            color="primary" /></q-item-section
                        ><q-item-section>Manage Dependencies</q-item-section></q-item
                      >
                      <q-item clickable @click="toggleTaskComplete(props.row)"
                        ><q-item-section avatar
                          ><q-icon
                            :name="props.row.status === 'COMPLETED' ? 'replay' : 'check_circle'"
                            size="18px"
                            :color="
                              props.row.status === 'COMPLETED' ? 'orange' : 'positive'
                            " /></q-item-section
                        ><q-item-section>{{
                          props.row.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Complete'
                        }}</q-item-section></q-item
                      >
                      <q-separator />
                      <q-item clickable class="text-negative" @click="confirmDeleteTask(props.row)"
                        ><q-item-section avatar
                          ><q-icon name="delete" size="18px" color="negative" /></q-item-section
                        ><q-item-section>Delete Task</q-item-section></q-item
                      >
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </div>
      </q-card>

      <!-- 06 & 07 TEAM & RECENT ACTIVITY -->
      <div class="row q-col-gutter-md items-stretch" style="min-width: 0">
        <!-- Team Card -->
        <div class="col-12 col-md-6" style="min-width: 0">
          <q-card
            id="team-workload-card"
            flat
            bordered
            :dark="$q.dark.isActive"
            class="rounded-borders full-height"
          >
            <q-card-section class="row items-center justify-between">
              <div class="row items-center">
                <q-icon name="badge" size="20px" color="primary" class="q-mr-xs" />
                <div
                  class="text-subtitle1 text-weight-bold"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                >
                  Assigned Team & Workload
                </div>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-badge color="primary" rounded :label="`${teamMembers.length} Members`" />
                <q-btn
                  outline
                  dense
                  no-caps
                  icon="person_add"
                  label="Add"
                  color="primary"
                  class="q-px-xs text-caption text-weight-bold"
                  @click="openAddMemberDialog"
                />
              </div>
            </q-card-section>

            <q-separator />

            <div style="max-height: 380px; overflow-y: auto">
              <q-list separator :dark="$q.dark.isActive">
                <q-item v-for="member in teamMembers" :key="member.id" class="q-py-md">
                  <q-item-section avatar>
                    <q-avatar
                      size="36px"
                      color="primary"
                      text-color="white"
                      class="text-weight-bold"
                      >{{ member.name.charAt(0) }}</q-avatar
                    >
                  </q-item-section>

                  <q-item-section>
                    <q-item-label
                      class="text-weight-bold"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                      >{{ member.name }}</q-item-label
                    >
                    <q-item-label
                      caption
                      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                      >{{ member.role }}</q-item-label
                    >
                  </q-item-section>

                  <q-item-section side>
                    <div class="row items-center q-gutter-xs">
                      <q-chip
                        dense
                        square
                        color="primary"
                        text-color="white"
                        class="text-caption text-weight-bold"
                        >{{ member.assignedTasks }} Tasks</q-chip
                      >
                      <div style="width: 80px">
                        <q-linear-progress
                          rounded
                          size="4px"
                          :value="member.capacity / 100"
                          :color="member.capacity > 80 ? 'orange' : 'primary'"
                          :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                        />
                        <div class="text-caption text-grey-5 text-center" style="font-size: 9px">
                          {{ member.capacity }}% capacity
                        </div>
                      </div>
                      <q-btn
                        flat
                        round
                        dense
                        icon="person_remove"
                        :color="$q.dark.isActive ? 'grey-4' : 'grey-6'"
                        size="sm"
                        @click="confirmRemoveProjectMember(member)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card>
        </div>

        <!-- Activity Card -->
        <div class="col-12 col-md-6" style="min-width: 0">
          <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders full-height">
            <q-card-section class="row items-center justify-between">
              <div class="row items-center">
                <q-icon name="history" size="20px" color="primary" class="q-mr-xs" />
                <div
                  class="text-subtitle1 text-weight-bold"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                >
                  Recent Activity
                </div>
              </div>
              <span class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                >Live Stream</span
              >
            </q-card-section>

            <q-separator />

            <div style="max-height: 380px; overflow-y: auto">
              <q-list separator :dark="$q.dark.isActive">
                <q-item v-for="act in activityLogs" :key="act.id" class="q-py-md">
                  <q-item-section avatar>
                    <q-avatar
                      size="28px"
                      :color="
                        act.type === 'complete'
                          ? 'positive'
                          : act.type === 'create'
                            ? 'info'
                            : 'primary'
                      "
                      text-color="white"
                    >
                      <q-icon :name="act.icon" size="14px" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <div class="row items-center justify-between">
                      <span
                        class="text-weight-bold text-caption"
                        :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                        >{{ act.user }}</span
                      >
                      <span
                        class="text-caption"
                        :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                        >{{ act.time }}</span
                      >
                    </div>
                    <div
                      class="text-caption q-mt-xs"
                      :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-8'"
                    >
                      {{ act.message }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card>
        </div>
      </div>

      <!-- ALL DIALOGS -->
      <!-- DIALOG: CREATE TASK -->
      <CreateTaskDialog
        v-model="showCreateTaskDialog"
        :fixed-project-id="project.project_id"
        :fixed-project-name="project.name"
        :project-start-date="project.start_date"
        :project-deadline="project.deadline"
        :member-options="createTaskAssigneeOptions"
        :supervisor-options="createTaskAssigneeOptions"
        :show-dependencies="false"
        :loading="taskCreating"
        @submit="handleCreateTask"
      />

      <!-- DIALOG: EDIT PROJECT -->
      <q-dialog v-model="showEditProjectDialog">
        <q-card :dark="$q.dark.isActive" style="width: 520px; max-width: 95vw; border-radius: 12px">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-weight-bold text-primary">EDIT PROJECT</div>
              <div class="text-h6 text-weight-bold">Update Project Information</div>
            </div>
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>

          <q-form @submit.prevent="handleSaveProject">
            <q-card-section class="column q-gutter-y-sm">
              <q-input
                v-model="editProjectForm.name"
                outlined
                dense
                label="Project Name *"
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val.trim() || 'Project name is required']"
              />
              <q-input
                v-model="editProjectForm.description"
                outlined
                dense
                type="textarea"
                label="Description"
                autogrow
                :dark="$q.dark.isActive"
              />
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-select
                    v-model="editProjectForm.status"
                    outlined
                    dense
                    label="Status"
                    :options="projectStatusOptions"
                    emit-value
                    map-options
                    :dark="$q.dark.isActive"
                  />
                </div>
                <div class="col-6">
                  <q-select
                    v-model="editProjectForm.priority"
                    outlined
                    dense
                    label="Priority"
                    :options="projectPriorityOptions"
                    emit-value
                    map-options
                    :dark="$q.dark.isActive"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input
                    v-model="editProjectForm.start_date"
                    outlined
                    dense
                    type="date"
                    label="Start Date"
                    stack-label
                    :dark="$q.dark.isActive"
                    :rules="[
                      (val) =>
                        !editProjectForm.deadline ||
                        !val ||
                        val <= editProjectForm.deadline ||
                        'Start date cannot be after deadline',
                    ]"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model="editProjectForm.deadline"
                    outlined
                    dense
                    type="date"
                    label="Deadline"
                    stack-label
                    :dark="$q.dark.isActive"
                    :rules="[
                      (val) =>
                        !editProjectForm.start_date ||
                        !val ||
                        val >= editProjectForm.start_date ||
                        'Deadline cannot be before start date',
                    ]"
                  />
                </div>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn v-close-popup flat no-caps label="Cancel" />
              <q-btn
                type="submit"
                no-caps
                unelevated
                label="Save Changes"
                color="primary"
                :loading="savingProject"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- DIALOG: QUICK UPDATE TASK -->
      <q-dialog v-model="showQuickUpdateDialog">
        <q-card :dark="$q.dark.isActive" style="width: 460px; max-width: 95vw; border-radius: 12px">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-weight-bold text-primary">TASK PROGRESS</div>
              <div class="text-h6 text-weight-bold">{{ selectedTaskForUpdate?.title }}</div>
            </div>
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>

          <q-card-section v-if="selectedTaskForUpdate" class="column q-gutter-y-sm">
            <div>
              <span class="text-caption text-weight-bold">Status</span>
              <div class="row q-gutter-xs q-mt-xs">
                <q-btn
                  v-for="st in taskStatusFormOptions"
                  :key="st.value"
                  dense
                  no-caps
                  unelevated
                  :color="
                    selectedTaskForUpdate.status === st.value
                      ? 'primary'
                      : $q.dark.isActive
                        ? 'grey-9'
                        : 'grey-3'
                  "
                  :text-color="
                    selectedTaskForUpdate.status === st.value
                      ? 'white'
                      : $q.dark.isActive
                        ? 'grey-3'
                        : 'dark'
                  "
                  :label="st.label"
                  class="q-px-sm text-caption text-weight-bold"
                  @click="onQuickUpdateStatusClick(st.value)"
                />
              </div>
            </div>

            <div>
              <div class="row justify-between items-center">
                <span class="text-caption text-weight-bold">Progress</span>
                <span class="text-caption text-weight-bold text-primary"
                  >{{ selectedTaskForUpdateProgress }}%</span
                >
              </div>
              <q-slider
                v-model="selectedTaskForUpdateProgress"
                :min="0"
                :max="100"
                :step="5"
                color="primary"
                label
                @update:model-value="
                  (val) => {
                    if (selectedTaskForUpdate)
                      selectedTaskForUpdate.status = getStatusFromProgress(val);
                  }
                "
              />
            </div>

            <div>
              <span class="text-caption text-weight-bold">Logged Effort (Hours)</span>
              <q-input
                v-model.number="selectedTaskForUpdate.actual_effort"
                outlined
                dense
                type="number"
                min="0"
                step="0.5"
                :dark="$q.dark.isActive"
                class="q-mt-xs"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              no-caps
              unelevated
              label="Save Update"
              color="primary"
              @click="saveQuickUpdate"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- DIALOG: MANAGE TASK DEPENDENCIES -->
      <q-dialog v-model="showDependencyDialog">
        <q-card :dark="$q.dark.isActive" style="width: 520px; max-width: 95vw; border-radius: 12px">
          <q-card-section class="row items-center justify-between q-pb-none">
            <div>
              <div class="text-caption text-weight-bold text-primary">TASK DEPENDENCIES</div>
              <div class="text-h6 text-weight-bold">
                Manage Predecessors for "{{ selectedDependencyTaskName }}"
              </div>
            </div>
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>

          <!-- Currently active dependencies -->
          <q-card-section class="q-pt-md">
            <div class="text-caption text-weight-bold q-mb-xs">
              Current Predecessor Dependencies:
            </div>
            <div v-if="currentTaskPredecessors.length > 0" class="row q-gutter-xs wrap q-mb-md">
              <q-chip
                v-for="pred in currentTaskPredecessors"
                :key="pred.task_id"
                removable
                dense
                square
                :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                class="text-weight-bold text-caption"
                icon="account_tree"
                @remove="confirmRemoveDependency(pred)"
              >
                {{ pred.title }} (#{{ pred.task_id }})
                <q-tooltip>Remove this dependency</q-tooltip>
              </q-chip>
            </div>
            <div v-else class="text-caption text-grey-6 q-mb-md">
              No predecessor dependencies linked yet. This task can start independently.
            </div>

            <q-separator class="q-mb-md" />

            <!-- Add new dependencies -->
            <div class="text-caption text-weight-bold q-mb-xs">Add New Predecessor:</div>
            <q-select
              v-model="selectedPredecessorTaskIds"
              outlined
              dense
              multiple
              clearable
              emit-value
              map-options
              :dark="$q.dark.isActive"
              :options="dependencyPredecessorOptions"
              label="Select Predecessor Task(s)"
              :display-value="
                selectedPredecessorTaskIds.length
                  ? `${selectedPredecessorTaskIds.length} predecessor(s) selected`
                  : ''
              "
            >
              <template #option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps" :disable="opt.disable">
                  <q-item-section side>
                    <q-checkbox
                      :model-value="selected || opt.alreadyDependent"
                      :disable="opt.disable"
                      color="primary"
                      @update:model-value="toggleOption(opt)"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label :class="{ 'text-grey-6': opt.disable }">
                      {{ opt.label }}
                    </q-item-label>
                    <q-item-label
                      v-if="opt.isCyclic"
                      caption
                      class="text-negative text-weight-medium"
                    >
                      Cannot select: would create circular dependency
                    </q-item-label>
                  </q-item-section>
                  <q-item-section v-if="opt.alreadyDependent" side>
                    <q-chip dense square color="grey-3" text-color="grey-8" style="font-size: 10px">
                      Linked
                    </q-chip>
                  </q-item-section>
                  <q-item-section v-else-if="opt.isCyclic" side>
                    <q-chip
                      dense
                      square
                      color="negative"
                      text-color="white"
                      style="font-size: 10px"
                    >
                      Cycle
                    </q-chip>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn v-close-popup flat no-caps label="Close" />
            <q-btn
              no-caps
              unelevated
              color="primary"
              label="Add Selected"
              :loading="dependencySubmitting"
              :disable="!selectedPredecessorTaskIds.length"
              @click="handleAddDependency"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- DIALOG: ADD RESOURCE TO PROJECT -->
      <q-dialog v-model="showAddMemberDialog">
        <q-card :dark="$q.dark.isActive" style="width: 480px; max-width: 95vw; border-radius: 12px">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-weight-bold text-primary">PROJECT TEAM</div>
              <div class="text-h6 text-weight-bold">Add Resource to Project</div>
            </div>
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>

          <q-card-section>
            <q-select
              v-model="selectedMembersToAdd"
              outlined
              dense
              multiple
              clearable
              emit-value
              map-options
              :dark="$q.dark.isActive"
              :display-value="
                selectedMembersToAdd.length ? `${selectedMembersToAdd.length} selected` : ''
              "
              label="Resource Member(s)"
              :options="availableResourcesToAdd"
              :disable="addingMember"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              no-caps
              unelevated
              color="primary"
              label="Add to Project"
              :loading="addingMember"
              :disable="!selectedMembersToAdd.length"
              @click="handleAddProjectMember"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- DELETE CONFIRMATION DIALOGS -->
      <ConfirmActionDialog
        v-model="showDeleteProjectDialog"
        title="Move Project to Recycle Bin"
        subtitle="You can restore it anytime from the Recycle Bin"
        confirm-label="Move to Bin"
        :loading="deletingProject"
        @confirm="handleExecuteDeleteProject"
      >
        Are you sure you want to move project <strong>"{{ project.name }}"</strong> to the Recycle
        Bin?
      </ConfirmActionDialog>

      <ConfirmActionDialog
        v-model="showDeleteTaskDialog"
        title="Move Task to Recycle Bin"
        subtitle="You can restore it anytime from the Recycle Bin"
        confirm-label="Move to Bin"
        :loading="deletingTask"
        @confirm="handleExecuteDeleteTask"
      >
        Are you sure you want to move task <strong>"{{ taskToDelete?.title }}"</strong> to the
        Recycle Bin?
      </ConfirmActionDialog>

      <ConfirmActionDialog
        v-model="showUnassignTaskDialog"
        title="Unassign Resource"
        subtitle="Remove assignment from this task"
        confirm-label="Unassign Resource"
        :loading="unassigningTask"
        @confirm="handleExecuteUnassignTask"
      >
        Are you sure you want to unassign
        <strong>{{ unassignTaskTarget.resourceName }}</strong> from task
        <strong>"{{ unassignTaskTarget.taskTitle }}"</strong>?
      </ConfirmActionDialog>

      <ConfirmActionDialog
        v-model="showRemoveMemberDialog"
        title="Remove Member from Project"
        subtitle="Remove resource from project team"
        confirm-label="Remove Member"
        :loading="removingMember"
        @confirm="handleExecuteRemoveMember"
      >
        Are you sure you want to remove <strong>{{ memberToRemove?.name }}</strong> from this
        project?
      </ConfirmActionDialog>

      <!-- CONFIRM REMOVE DEPENDENCY DIALOG -->
      <ConfirmActionDialog
        v-model="showRemoveDependencyDialog"
        title="Remove Task Dependency"
        subtitle="Unlink dependency constraint"
        confirm-label="Remove Dependency"
        :loading="dependencyRemoving"
        @confirm="handleExecuteRemoveDependency"
      >
        Are you sure you want to remove the dependency on
        <strong>"{{ dependencyToRemove?.title }}"</strong>?
      </ConfirmActionDialog>

      <!-- CONFIRM ARCHIVE PROJECT DIALOG -->
      <ConfirmActionDialog
        v-model="showArchiveProjectDialog"
        title="Archive Completed Project"
        subtitle="Move completed project to archives"
        confirm-label="Archive Project"
        :loading="archivingProject"
        @confirm="handleExecuteArchiveProject"
      >
        Are you sure you want to archive project <strong>"{{ project.name }}"</strong>? The project
        history and completed deliverables will remain safely preserved in your archives.
      </ConfirmActionDialog>

      <!-- CONFIRM UNARCHIVE PROJECT DIALOG -->
      <ConfirmActionDialog
        v-model="showUnarchiveProjectDialog"
        title="Unarchive Project"
        subtitle="Restore project to Completed status"
        confirm-label="Unarchive Project"
        :loading="unarchivingProject"
        @confirm="handleExecuteUnarchiveProject"
      >
        Are you sure you want to unarchive project <strong>"{{ project.name }}"</strong>? Its status
        will be restored to <strong>Completed</strong>.
      </ConfirmActionDialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import StatCard from '@/components/dashboard/StatCard.vue';
import CreateTaskDialog, { type CreateTaskFormData } from '@/components/tasks/CreateTaskDialog.vue';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog.vue';
import { formatDate, formatStatus, formatHours } from '@/utils/formatters';
import { isTaskOverdue, getStatusFromProgress, isVerificationTask } from '@/utils/taskHelpers';

import {
  getProjectByIdApi,
  getTasksApi,
  getResourcesApi,
  createTaskApi,
  updateTaskApi,
  updateProjectApi,
  deleteTaskApi,
  deleteProjectApi,
  assignProjectMemberApi,
  removeProjectMemberApi,
  unassignTaskResourceApi,
  addTaskDependencyApi,
  removeTaskDependencyApi,
  archiveProjectApi,
  unarchiveProjectApi,
  getGlobalProgressFeedApi,
  calculateResourceWeeklyCapacity,
  type Project,
  type Task,
  type ResourceUser,
  type CreateTaskPayload,
  type ProjectStatus,
  type ProjectPriority,
} from '@/services/api';

import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const projectIdParam = computed(() => Number(route.params.id) || 1);
const currentPmName = computed(() => authStore.user?.name ?? 'Project Manager');

const loading = ref(true);
const tasksLoading = ref(false);
const taskCreating = ref(false);
const deletingProject = ref(false);
const deletingTask = ref(false);
const removingMember = ref(false);
const unassigningTask = ref(false);
const dependencySubmitting = ref(false);
const addingMember = ref(false);

const showCreateTaskDialog = ref(false);
const showEditProjectDialog = ref(false);
const showQuickUpdateDialog = ref(false);
const showDependencyDialog = ref(false);
const showAddMemberDialog = ref(false);
const showDeleteProjectDialog = ref(false);
const showDeleteTaskDialog = ref(false);
const showRemoveMemberDialog = ref(false);
const showUnassignTaskDialog = ref(false);
const showRemoveDependencyDialog = ref(false);
const dependencyRemoving = ref(false);
const dependencyToRemove = ref<{ task_id: number; title: string } | null>(null);

const showArchiveProjectDialog = ref(false);
const archivingProject = ref(false);
const showUnarchiveProjectDialog = ref(false);
const unarchivingProject = ref(false);

const selectedTaskForUpdate = ref<Task | null>(null);
const selectedTaskForUpdateProgress = ref(0);
const selectedDependencyTaskId = ref<number | null>(null);
const selectedPredecessorTaskIds = ref<number[]>([]);
const existingTaskDependencies = reactive<Record<number, number[]>>({});
const selectedMembersToAdd = ref<number[]>([]);

const projectMembersResources = ref<ResourceUser[]>([]);
const allSystemResources = ref<ResourceUser[]>([]);

const taskToDelete = ref<Task | null>(null);
const memberToRemove = ref<TeamMember | null>(null);

const unassignTaskTarget = reactive({
  taskId: 0,
  taskTitle: '',
  resourceId: 0,
  resourceName: '',
});

const project = reactive<Project>({
  project_id: 1,
  name: '',
  description: '',
  status: 'ACTIVE',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
  progress: 0,
  project_manager_id: authStore.user?.user_id ?? 1,
});

const tasks = ref<Task[]>([]);

interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  assignedTasks: number;
  capacity: number;
}

const teamMembers = computed<TeamMember[]>(() => {
  return projectMembersResources.value.map((resource) => {
    const rId = Number(resource.user_id);
    const assigned = tasks.value.filter((task) => {
      const ids = (task.assigned_resource_ids || []).map(Number);
      if (ids.includes(rId)) return true;
      if (task.assigned_resources?.some((ar) => Number(ar.user_id) === rId)) return true;
      return false;
    });
    const effort = assigned.reduce((sum, task) => sum + (Number(task.expected_effort) || 0), 0);
    const cap = calculateResourceWeeklyCapacity(resource);
    return {
      id: rId,
      name: resource.name,
      role: resource.role || 'Team Resource',
      assignedTasks: assigned.length,
      capacity: Math.min(100, Math.round((effort / Math.max(1, cap)) * 100)),
    };
  });
});

interface Milestone {
  id: number;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  dueDate: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
}

const milestones = ref<Milestone[]>([]);

interface ActivityLog {
  id: number;
  user: string;
  message: string;
  time: string;
  type: 'complete' | 'update' | 'create' | 'comment';
  icon: string;
}

const activityLogs = ref<ActivityLog[]>([]);

const editProjectForm = reactive<{
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  deadline: string;
}>({
  name: '',
  description: '',
  status: 'IN_PROGRESS',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
});

const taskSearch = ref('');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');
const assigneeFilter = ref('ALL');

const taskPagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: '',
  descending: false,
});

const taskStatusOptions = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Unassigned', value: 'UNASSIGNED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const taskPriorityOptions = [
  { label: 'All Priorities', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const assigneeOptions = computed(() => {
  const seen = new Set<string>();
  const opts: Array<{ label: string; value: string }> = [{ label: 'All Assignees', value: 'ALL' }];
  for (const m of teamMembers.value) {
    const idStr = String(m.id);
    if (m.id && !seen.has(idStr)) {
      seen.add(idStr);
      opts.push({ label: m.name, value: idStr });
    }
  }
  return opts;
});

const taskStatusFormOptions: {
  label: string;
  value: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}[] = [
  { label: 'Unassigned', value: 'UNASSIGNED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const savingProject = ref(false);

const projectStatusOptions = [
  { label: 'Not Started', value: 'NOT_STARTED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const projectPriorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const createTaskAssigneeOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: number }> = [];
  for (const m of teamMembers.value) {
    const id = Number(m.id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({ label: m.name, value: id });
    }
  }
  return opts;
});

const availableResourcesToAdd = computed(() => {
  const currentMemberIds = new Set(teamMembers.value.map((m) => m.id));
  const seen = new Set<number>();
  const opts: Array<{
    label: string;
    value: number;
    alreadyMember: boolean;
  }> = [];

  for (const r of allSystemResources.value) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({
        label: `${r.name} (${r.role || 'Team Member'})`,
        value: id,
        alreadyMember: currentMemberIds.has(id),
      });
    }
  }
  return opts;
});

const selectedDependencyTaskName = computed(() => {
  if (!selectedDependencyTaskId.value) return '';
  const found = tasks.value.find(
    (t) => Number(t.task_id) === Number(selectedDependencyTaskId.value),
  );
  return found ? `${found.title} (#${found.task_id})` : `Task #${selectedDependencyTaskId.value}`;
});

const currentTaskPredecessors = computed(() => {
  if (!selectedDependencyTaskId.value) return [];
  const currentTaskId = Number(selectedDependencyTaskId.value);
  const predIds = existingTaskDependencies[currentTaskId] || [];
  return tasks.value.filter((t) => predIds.includes(Number(t.task_id)));
});

const dependencyPredecessorOptions = computed(() => {
  if (!selectedDependencyTaskId.value) return [];

  const currentTaskId = Number(selectedDependencyTaskId.value);
  const alreadyDeps = new Set(existingTaskDependencies[currentTaskId] || []);

  // Compute downstream descendants of currentTaskId to prevent cycles
  // Graph: predecessor -> successor (where task_id depends on predecessor)
  const adjList: Record<number, number[]> = {};
  for (const t of tasks.value) {
    const tId = Number(t.task_id);
    const preds = existingTaskDependencies[tId] || (t.predecessor_task_ids || []).map(Number);
    for (const pred of preds) {
      if (!adjList[pred]) adjList[pred] = [];
      adjList[pred].push(tId);
    }
  }

  // BFS from currentTaskId
  const cyclicTaskIds = new Set<number>();
  const queue = [currentTaskId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const successors = adjList[curr] || [];
    for (const succ of successors) {
      if (!cyclicTaskIds.has(succ)) {
        cyclicTaskIds.add(succ);
        queue.push(succ);
      }
    }
  }

  return tasks.value
    .filter((t) => Number(t.task_id) !== currentTaskId)
    .map((t) => {
      const tId = Number(t.task_id);
      const isAlready = alreadyDeps.has(tId);
      const isCyclic = cyclicTaskIds.has(tId);
      return {
        label: `${t.title} (#${t.task_id})`,
        value: tId,
        alreadyDependent: isAlready,
        isCyclic: isCyclic,
        disable: isAlready || isCyclic,
      };
    });
});

const taskColumns: QTableColumn<Task>[] = [
  {
    name: 'title',
    label: 'Task Details',
    field: (row) => row.title,
    align: 'left',
    sortable: true,
  },
  { name: 'status', label: 'Status', field: (row) => row.status, align: 'left', sortable: true },
  {
    name: 'priority',
    label: 'Priority',
    field: (row) => row.priority,
    align: 'left',
    sortable: true,
  },
  { name: 'assignee', label: 'Assignee', field: (row) => getAssigneeName(row), align: 'left' },
  {
    name: 'progress',
    label: 'Progress',
    field: (row) => getTaskProgressNumber(row.progress),
    align: 'left',
    sortable: true,
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: (row) => row.deadline ?? '',
    align: 'left',
    sortable: true,
  },
  {
    name: 'effort',
    label: 'Effort (Actual/Plan)',
    field: (row) => Number(row.expected_effort) || 0,
    align: 'left',
  },
  { name: 'actions', label: '', field: () => '', align: 'right' },
];

const daysRemaining = computed(() => {
  if (!project.deadline) return 0;
  const deadline = new Date(project.deadline);
  const today = new Date();
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
});

const daysRemainingText = computed(() => {
  if (!project.deadline) return 'No deadline';
  if (project.status === 'COMPLETED') return 'Completed';
  if (daysRemaining.value > 0) return `${daysRemaining.value} days left`;
  if (daysRemaining.value === 0) return 'Due today';
  return `Overdue by ${Math.abs(daysRemaining.value)} days`;
});

const totalTasksCount = computed(() => tasks.value.length);
const completedTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'COMPLETED').length,
);
const inProgressTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
);
const pendingTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'UNASSIGNED' || t.status === 'SCHEDULED').length,
);
const onHoldTasksCount = computed(() => {
  return project.status === 'ON_HOLD'
    ? tasks.value.filter((t) => t.status !== 'COMPLETED').length
    : 0;
});

const criticalTasksCount = computed(
  () => tasks.value.filter((t) => t.priority === 'CRITICAL').length,
);
const highTasksCount = computed(() => tasks.value.filter((t) => t.priority === 'HIGH').length);
const mediumTasksCount = computed(() => tasks.value.filter((t) => t.priority === 'MEDIUM').length);
const lowTasksCount = computed(() => tasks.value.filter((t) => t.priority === 'LOW').length);
const remainingEffortHours = computed(() =>
  Math.max(0, Math.round((totalEffortExpected.value - totalEffortLogged.value) * 10) / 10),
);

const overdueTasksCount = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.value.filter((t) => {
    if (t.status === 'COMPLETED' || !t.deadline) return false;
    return new Date(t.deadline) < today;
  }).length;
});

const taskCompletionRate = computed(() => {
  if (!totalTasksCount.value) return 0;
  return Math.round((completedTasksCount.value / totalTasksCount.value) * 100);
});

const overallProgress = computed(() => {
  const deliverableTasks = tasks.value.filter((t) => !isVerificationTask(t));
  if (!deliverableTasks.length) return Number(project.progress) || 0;
  const totalEffort = deliverableTasks.reduce(
    (sum, t) => sum + (Number(t.expected_effort) || 0),
    0,
  );
  if (totalEffort > 0) {
    const weightedSum = deliverableTasks.reduce(
      (sum, t) => sum + getTaskProgressNumber(t.progress) * (Number(t.expected_effort) || 0),
      0,
    );
    return Math.round(weightedSum / totalEffort);
  }
  const total = deliverableTasks.reduce((sum, t) => sum + getTaskProgressNumber(t.progress), 0);
  return Math.round(total / deliverableTasks.length);
});

const totalEffortExpected = computed(() =>
  tasks.value.reduce((sum, t) => sum + (Number(t.expected_effort) || 0), 0),
);
const totalEffortLogged = computed(() =>
  tasks.value.reduce((sum, t) => sum + (Number(t.actual_effort) || 0), 0),
);
const completedMilestonesCount = computed(
  () => milestones.value.filter((m) => m.progress === 100).length,
);
const activeAssigneesCount = computed(
  () => teamMembers.value.filter((m) => m.assignedTasks > 0).length,
);

const filteredTasks = computed(() => {
  const q = taskSearch.value.trim().toLowerCase();
  return tasks.value.filter((task) => {
    const matchesSearch =
      !q ||
      task.title.toLowerCase().includes(q) ||
      (task.description ?? '').toLowerCase().includes(q);
    const matchesStatus = statusFilter.value === 'ALL' || task.status === statusFilter.value;
    const matchesPriority =
      priorityFilter.value === 'ALL' || task.priority === priorityFilter.value;
    const matchesAssignee =
      assigneeFilter.value === 'ALL' ||
      (task.assigned_resource_ids &&
        task.assigned_resource_ids.includes(Number(assigneeFilter.value)));
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });
});

onMounted(() => {
  void refreshData();
});

function getTaskProgressNumber(progress: number | string | undefined): number {
  return Math.min(100, Math.max(0, Number(progress) || 0));
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return 'error';
    case 'HIGH':
      return 'priority_high';
    case 'MEDIUM':
      return 'remove';
    case 'LOW':
      return 'arrow_downward';
    default:
      return 'radio_button_unchecked';
  }
}

function priorityColor(priority: string | null | undefined): string {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'LOW':
        return 'blue-10';
      case 'MEDIUM':
        return 'purple-10';
      case 'HIGH':
        return 'orange-10';
      case 'CRITICAL':
        return 'red-10';
      default:
        return 'grey-9';
    }
  }
  switch (priority) {
    case 'LOW':
      return 'blue-1';
    case 'MEDIUM':
      return 'deep-purple-1';
    case 'HIGH':
      return 'orange-1';
    case 'CRITICAL':
      return 'red-1';
    default:
      return 'grey-2';
  }
}

function priorityTextColor(priority: string | null | undefined): string {
  if ($q.dark.isActive) {
    switch (priority) {
      case 'LOW':
        return 'blue-2';
      case 'MEDIUM':
        return 'purple-2';
      case 'HIGH':
        return 'orange-2';
      case 'CRITICAL':
        return 'red-2';
      default:
        return 'grey-2';
    }
  }
  switch (priority) {
    case 'LOW':
      return 'blue-8';
    case 'MEDIUM':
      return 'primary';
    case 'HIGH':
      return 'orange-8';
    case 'CRITICAL':
      return 'red-8';
    default:
      return 'grey-8';
  }
}

function statusColor(status: string | null | undefined): string {
  if ($q.dark.isActive) {
    switch (status) {
      case 'SCHEDULED':
        return 'purple-10';
      case 'IN_PROGRESS':
        return 'blue-10';
      case 'COMPLETED':
        return 'green-10';
      case 'ARCHIVED':
        return 'blue-grey-10';
      default:
        return 'grey-9';
    }
  }
  switch (status) {
    case 'SCHEDULED':
      return 'deep-purple-1';
    case 'IN_PROGRESS':
      return 'blue-1';
    case 'COMPLETED':
      return 'green-1';
    case 'ARCHIVED':
      return 'blue-grey-1';
    default:
      return 'grey-2';
  }
}

function statusTextColor(status: string | null | undefined): string {
  if ($q.dark.isActive) {
    switch (status) {
      case 'SCHEDULED':
        return 'purple-2';
      case 'IN_PROGRESS':
        return 'blue-2';
      case 'COMPLETED':
        return 'green-2';
      case 'ARCHIVED':
        return 'blue-grey-2';
      default:
        return 'grey-3';
    }
  }
  switch (status) {
    case 'SCHEDULED':
      return 'primary';
    case 'IN_PROGRESS':
      return 'blue-8';
    case 'COMPLETED':
      return 'green-8';
    case 'ARCHIVED':
      return 'blue-grey-8';
    default:
      return 'grey-8';
  }
}

function getAssigneeMembers(task: Task): { id: number; name: string }[] {
  if (task.assigned_resource_ids && task.assigned_resource_ids.length > 0) {
    return task.assigned_resource_ids
      .map((id) => {
        const m = teamMembers.value.find((tm) => tm.id === id);
        return m ? { id: m.id, name: m.name } : null;
      })
      .filter((m): m is { id: number; name: string } => m !== null);
  }
  return [];
}

function getAssigneeName(task: Task): string {
  if (task.assigned_resource_ids && task.assigned_resource_ids.length > 0) {
    const names = task.assigned_resource_ids
      .map((id) => teamMembers.value.find((m) => m.id === id)?.name)
      .filter(Boolean);
    if (names.length > 0) return names.join(', ');
  }
  return currentPmName.value;
}

function resetTaskFilters() {
  taskSearch.value = '';
  statusFilter.value = 'ALL';
  priorityFilter.value = 'ALL';
  assigneeFilter.value = 'ALL';
}

function scrollToTaskBreakdown() {
  const el = document.getElementById('task-breakdown-card');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterAllTasks() {
  resetTaskFilters();
  scrollToTaskBreakdown();
}

function filterCompletedTasks() {
  resetTaskFilters();
  statusFilter.value = 'COMPLETED';
  scrollToTaskBreakdown();
}

function filterOverdueTasks() {
  resetTaskFilters();
  // Filter for in-progress or scheduled tasks and scroll to task breakdown
  scrollToTaskBreakdown();
}

function scrollToTeam() {
  const el = document.getElementById('team-workload-card');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadProjectDetails() {
  loading.value = true;
  try {
    const found = await getProjectByIdApi(projectIdParam.value);
    if (found) Object.assign(project, found);
  } catch (error) {
    console.error('Failed to load project details:', error);
  } finally {
    loading.value = false;
  }
}

async function loadProjectTasks() {
  tasksLoading.value = true;
  try {
    const fetchedTasks = await getTasksApi(projectIdParam.value);
    tasks.value = fetchedTasks ?? [];
    updateDerivedMilestones();
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasks.value = [];
    updateDerivedMilestones();
  } finally {
    tasksLoading.value = false;
  }
}

function updateDerivedMilestones() {
  milestones.value = tasks.value
    .filter((task) => task.planned_start || task.actual_start || task.start_date || task.deadline)
    .map((task) => {
      const progress = getTaskProgressNumber(task.progress);
      const status: Milestone['status'] =
        task.status === 'COMPLETED'
          ? 'COMPLETED'
          : task.status === 'IN_PROGRESS'
            ? 'IN_PROGRESS'
            : 'UPCOMING';
      return {
        id: task.task_id,
        name: task.title,
        status,
        dueDate: formatDate(task.deadline),
        progress,
        completedTasks: task.status === 'COMPLETED' ? 1 : 0,
        totalTasks: 1,
      };
    });
}

function formatRelativeTime(date: string | undefined): string {
  if (!date) return 'Recently';
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function updateActivityLogs() {
  try {
    const feedLogs = await getGlobalProgressFeedApi(50).catch(() => []);
    const projectTaskIds = new Set(tasks.value.map((t) => t.task_id));
    const projectLogs = feedLogs.filter(
      (log) =>
        (log.task_id && projectTaskIds.has(log.task_id)) ||
        (log.project_name &&
          project.name &&
          log.project_name.toLowerCase() === project.name.toLowerCase()),
    );

    if (projectLogs.length > 0) {
      activityLogs.value = projectLogs.slice(0, 10).map((log) => ({
        id: log.log_id,
        user: log.author_name || currentPmName.value,
        message: `Logged ${formatHours(log.hours_logged)} (${log.progress_logged}% progress) on "${log.task_title || 'Task'}": ${log.notes}`,
        time: formatRelativeTime(log.created_at || log.log_date),
        type: log.status === 'COMPLETED' ? 'complete' : 'update',
        icon: log.status === 'COMPLETED' ? 'check_circle' : 'edit_note',
      }));
      return;
    }
  } catch (error) {
    console.warn('Failed to load activity feed:', error);
  }

  activityLogs.value = tasks.value.slice(0, 5).map((t) => ({
    id: t.task_id,
    user: getAssigneeName(t),
    message: t.status === 'COMPLETED' ? `Completed task "${t.title}"` : `Updated task "${t.title}"`,
    time: formatRelativeTime(t.updated_at || t.created_at),
    type: t.status === 'COMPLETED' ? 'complete' : 'update',
    icon: t.status === 'COMPLETED' ? 'check_circle' : 'sync',
  }));
}

function openEditDialog() {
  editProjectForm.name = project.name;
  editProjectForm.description = project.description || '';
  editProjectForm.status = project.status as ProjectStatus;
  editProjectForm.priority = (project.priority || 'MEDIUM') as ProjectPriority;
  editProjectForm.start_date = project.start_date || '';
  editProjectForm.deadline = project.deadline || '';
  showEditProjectDialog.value = true;
}

async function handleSaveProject() {
  if (!project.project_id) return;
  savingProject.value = true;
  try {
    const updated = await updateProjectApi(project.project_id, {
      name: editProjectForm.name.trim(),
      description: editProjectForm.description || null,
      status: editProjectForm.status,
      priority: editProjectForm.priority,
      start_date: editProjectForm.start_date || null,
      deadline: editProjectForm.deadline || null,
    });
    project.name = updated.name;
    project.description = updated.description;
    project.status = updated.status;
    project.priority = updated.priority;
    project.start_date = updated.start_date;
    project.deadline = updated.deadline;
    $q.notify({ type: 'positive', message: 'Project details updated successfully' });
    showEditProjectDialog.value = false;
    await loadProjectDetails();
    await loadProjectTasks();
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to update project details',
    });
  } finally {
    savingProject.value = false;
  }
}

function openQuickUpdate(task: Task) {
  selectedTaskForUpdate.value = task;
  selectedTaskForUpdateProgress.value = getTaskProgressNumber(task.progress);
  showQuickUpdateDialog.value = true;
}

function onQuickUpdateStatusClick(stVal: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') {
  if (!selectedTaskForUpdate.value) return;
  selectedTaskForUpdate.value.status = stVal;
  if (stVal === 'COMPLETED') {
    selectedTaskForUpdateProgress.value = 100;
  } else if (stVal === 'SCHEDULED') {
    selectedTaskForUpdateProgress.value = 0;
  } else if (
    stVal === 'IN_PROGRESS' &&
    (selectedTaskForUpdateProgress.value === 0 || selectedTaskForUpdateProgress.value === 100)
  ) {
    selectedTaskForUpdateProgress.value = 50;
  }
}

async function saveQuickUpdate() {
  if (!selectedTaskForUpdate.value) return;
  try {
    const finalStatus = getStatusFromProgress(selectedTaskForUpdateProgress.value);
    await updateTaskApi(selectedTaskForUpdate.value.task_id, {
      status: finalStatus,
      progress: selectedTaskForUpdateProgress.value,
      actual_effort: Number(selectedTaskForUpdate.value.actual_effort) || 0,
    });
    $q.notify({ type: 'positive', message: 'Task updated' });
    showQuickUpdateDialog.value = false;
    await refreshData();
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update task' });
  }
}

async function toggleTaskComplete(task: Task) {
  const newStatus = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
  const newProg = newStatus === 'COMPLETED' ? 100 : 50;
  try {
    await updateTaskApi(task.task_id, { status: newStatus, progress: newProg });
    $q.notify({ type: 'positive', message: `Task marked as ${formatStatus(newStatus)}` });
    await refreshData();
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update task status' });
  }
}

function confirmDeleteProject() {
  showDeleteProjectDialog.value = true;
}
async function handleExecuteDeleteProject() {
  deletingProject.value = true;
  try {
    const res = await deleteProjectApi(projectIdParam.value);
    $q.notify({
      type: 'positive',
      message: res.message || 'Project moved to Recycle Bin',
      position: 'top-right',
      icon: 'delete_sweep',
    });
    showDeleteProjectDialog.value = false;
    void router.push('/pm/projects');
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to move project to bin',
      position: 'top-right',
    });
  } finally {
    deletingProject.value = false;
  }
}

function confirmDeleteTask(task: Task) {
  taskToDelete.value = task;
  showDeleteTaskDialog.value = true;
}
async function handleExecuteDeleteTask() {
  if (!taskToDelete.value) return;
  deletingTask.value = true;
  try {
    const res = await deleteTaskApi(taskToDelete.value.task_id);
    $q.notify({
      type: 'positive',
      message: res.message || 'Task moved to Recycle Bin',
      position: 'top-right',
      icon: 'delete_sweep',
    });
    showDeleteTaskDialog.value = false;
    taskToDelete.value = null;
    await refreshData();
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to move task to bin',
      position: 'top-right',
    });
  } finally {
    deletingTask.value = false;
  }
}

function confirmUnassignTaskResource(task: Task, rId: number, rName: string) {
  unassignTaskTarget.taskId = task.task_id;
  unassignTaskTarget.taskTitle = task.title;
  unassignTaskTarget.resourceId = rId;
  unassignTaskTarget.resourceName = rName;
  showUnassignTaskDialog.value = true;
}

async function handleExecuteUnassignTask() {
  if (!unassignTaskTarget.taskId || !unassignTaskTarget.resourceId) return;
  unassigningTask.value = true;
  try {
    await unassignTaskResourceApi(unassignTaskTarget.taskId, unassignTaskTarget.resourceId);
    $q.notify({ type: 'positive', message: `Unassigned ${unassignTaskTarget.resourceName}` });
    showUnassignTaskDialog.value = false;
    await refreshData();
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to unassign resource' });
  } finally {
    unassigningTask.value = false;
  }
}

function confirmRemoveProjectMember(member: TeamMember) {
  memberToRemove.value = member;
  showRemoveMemberDialog.value = true;
}
async function handleExecuteRemoveMember() {
  if (!memberToRemove.value) return;
  removingMember.value = true;
  try {
    await removeProjectMemberApi(projectIdParam.value, memberToRemove.value.id);
    $q.notify({ type: 'positive', message: `Removed ${memberToRemove.value.name}` });
    showRemoveMemberDialog.value = false;
    memberToRemove.value = null;
    await refreshData();
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to remove member' });
  } finally {
    removingMember.value = false;
  }
}

async function loadProjectTeamMembers() {
  try {
    const [fetchedProjectMembers, fetchedAllResources] = await Promise.all([
      getResourcesApi(projectIdParam.value).catch(() => []),
      getResourcesApi().catch(() => []),
    ]);
    projectMembersResources.value = fetchedProjectMembers;
    allSystemResources.value = fetchedAllResources;
  } catch (error) {
    console.warn('Failed to load team resources:', error);
  } finally {
    void updateActivityLogs();
  }
}

async function openAddMemberDialog() {
  try {
    const [fetchedProjectMembers, fetchedAllResources] = await Promise.all([
      getResourcesApi(projectIdParam.value).catch(() => []),
      getResourcesApi().catch(() => []),
    ]);
    projectMembersResources.value = fetchedProjectMembers;
    allSystemResources.value = fetchedAllResources;
    selectedMembersToAdd.value = [];
    showAddMemberDialog.value = true;
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load resources' });
  }
}

async function handleAddProjectMember() {
  if (!selectedMembersToAdd.value.length) return;
  addingMember.value = true;
  try {
    for (const rId of selectedMembersToAdd.value) {
      await assignProjectMemberApi(project.project_id, rId);
    }
    $q.notify({ type: 'positive', message: 'Member(s) added to project' });
    showAddMemberDialog.value = false;
    selectedMembersToAdd.value = [];
    await refreshData();
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to assign resource' });
  } finally {
    addingMember.value = false;
  }
}

async function refreshData() {
  await Promise.all([loadProjectDetails(), loadProjectTasks(), loadProjectTeamMembers()]);
  await updateActivityLogs();
}

function openDependencyDialog(task: Task) {
  selectedDependencyTaskId.value = task.task_id;
  const predIds = (task.predecessor_task_ids || []).map(Number);
  existingTaskDependencies[task.task_id] = predIds;
  selectedPredecessorTaskIds.value = [];
  showDependencyDialog.value = true;
}

async function handleAddDependency() {
  if (!selectedDependencyTaskId.value || !selectedPredecessorTaskIds.value?.length) return;
  const taskId = selectedDependencyTaskId.value;
  dependencySubmitting.value = true;
  try {
    for (const predId of selectedPredecessorTaskIds.value) {
      await addTaskDependencyApi(taskId, predId);
    }
    $q.notify({ type: 'positive', message: 'Dependency added successfully' });
    selectedPredecessorTaskIds.value = [];
    await refreshData();
    // Update local reactive record
    const updatedTask = tasks.value.find((t) => t.task_id === taskId);
    if (updatedTask) {
      existingTaskDependencies[taskId] = (updatedTask.predecessor_task_ids || []).map(Number);
    }
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to add dependency',
    });
  } finally {
    dependencySubmitting.value = false;
  }
}

function confirmRemoveDependency(pred: { task_id: number; title: string }) {
  dependencyToRemove.value = pred;
  showRemoveDependencyDialog.value = true;
}

async function handleExecuteRemoveDependency() {
  if (!selectedDependencyTaskId.value || !dependencyToRemove.value) return;
  const taskId = selectedDependencyTaskId.value;
  const predId = dependencyToRemove.value.task_id;
  dependencyRemoving.value = true;
  try {
    await removeTaskDependencyApi(taskId, predId);
    $q.notify({
      type: 'positive',
      message: `Removed dependency on "${dependencyToRemove.value.title}"`,
    });
    showRemoveDependencyDialog.value = false;
    dependencyToRemove.value = null;
    await refreshData();
    // Update local reactive record
    const updatedTask = tasks.value.find((t) => t.task_id === taskId);
    if (updatedTask) {
      existingTaskDependencies[taskId] = (updatedTask.predecessor_task_ids || []).map(Number);
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to remove dependency' });
  } finally {
    dependencyRemoving.value = false;
  }
}

async function handleCreateTask(formData?: CreateTaskFormData) {
  taskCreating.value = true;
  try {
    const payload: CreateTaskPayload = {
      project_id: project.project_id,
      title: formData ? formData.title.trim() : '',
      description: formData ? formData.description?.trim() || null : null,
      priority: formData ? formData.priority : 'MEDIUM',
      deadline: formData ? formData.deadline || null : null,
      expected_effort: formData ? Number(formData.expected_effort) || 4 : 4,
      assigned_resource_ids: formData ? formData.assigned_resource_ids : [],
      supervisor_id: formData ? formData.supervisor_id || undefined : undefined,
    };
    const created = await createTaskApi(payload);
    const newTaskId = Number(created?.task_id);

    let depErrors = 0;
    if (newTaskId && formData?.predecessor_task_ids && formData.predecessor_task_ids.length > 0) {
      for (const predId of formData.predecessor_task_ids) {
        try {
          await addTaskDependencyApi(newTaskId, predId);
        } catch (e) {
          console.warn('Failed to add dependency on task create:', e);
          depErrors++;
        }
      }
    }

    if (depErrors > 0) {
      $q.notify({
        type: 'warning',
        message: `Task created, but ${depErrors} dependency/dependencies could not be linked`,
      });
    } else {
      $q.notify({ type: 'positive', message: 'Task created successfully' });
    }
    showCreateTaskDialog.value = false;
    await refreshData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create task';
    $q.notify({ type: 'negative', message: msg });
  } finally {
    taskCreating.value = false;
  }
}

function exportProjectSummary() {
  try {
    const rows: string[][] = [];
    rows.push(['Project Name', `"${project.name.replace(/"/g, '""')}"`]);
    rows.push(['Project Status', project.status]);
    rows.push(['Priority', project.priority]);
    rows.push(['Start Date', project.start_date || 'N/A']);
    rows.push(['Deadline', project.deadline || 'N/A']);
    rows.push(['Overall Progress', `${overallProgress.value}%`]);
    rows.push(['Total Tasks', `${tasks.value.length}`]);
    rows.push(['Completed Tasks', `${completedTasksCount.value}`]);
    rows.push(['Active Tasks', `${inProgressTasksCount.value + pendingTasksCount.value}`]);
    rows.push(['On Hold Tasks', `${onHoldTasksCount.value}`]);
    rows.push([]);
    rows.push([
      'Task ID',
      'Title',
      'Status',
      'Priority',
      'Progress (%)',
      'Expected Effort (hrs)',
      'Actual Effort (hrs)',
      'Deadline',
      'Assignees',
    ]);

    for (const t of tasks.value) {
      let assigneesStr = 'Unassigned';
      if (Array.isArray(t.assigned_resources) && t.assigned_resources.length > 0) {
        assigneesStr = t.assigned_resources.map((r) => r.name).join('; ');
      } else if (typeof t.assigned_resource_names === 'string' && t.assigned_resource_names) {
        assigneesStr = t.assigned_resource_names;
      }
      rows.push([
        String(t.task_id),
        `"${(t.title || '').replace(/"/g, '""')}"`,
        t.status || 'UNASSIGNED',
        t.priority || 'MEDIUM',
        `${t.progress || 0}`,
        `${t.expected_effort || 0}`,
        `${t.actual_effort || 0}`,
        t.deadline ? (t.deadline.split('T')[0] ?? 'N/A') : 'N/A',
        `"${assigneesStr.replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute(
      'download',
      `${safeName}_summary_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    $q.notify({ type: 'positive', message: 'Project summary report exported successfully' });
  } catch (err) {
    console.error('Failed to export project summary:', err);
    $q.notify({ type: 'negative', message: 'Failed to export project summary' });
  }
}

async function markProjectComplete() {
  try {
    const updated = await updateProjectApi(project.project_id, {
      name: project.name,
      description: project.description,
      status: 'COMPLETED',
      priority: project.priority as ProjectPriority,
      start_date: project.start_date,
      deadline: project.deadline,
    });
    if (updated) Object.assign(project, updated);
    $q.notify({ type: 'positive', message: 'Project marked as completed' });
    await refreshData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to complete project',
    });
  }
}

function confirmArchiveProject() {
  showArchiveProjectDialog.value = true;
}

function confirmUnarchiveProject() {
  showUnarchiveProjectDialog.value = true;
}

async function handleExecuteArchiveProject() {
  archivingProject.value = true;
  try {
    const result = await archiveProjectApi(project.project_id);
    if (result.project) Object.assign(project, result.project);
    $q.notify({
      type: 'positive',
      message: `Project "${project.name}" archived successfully`,
    });
    showArchiveProjectDialog.value = false;
    await refreshData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to archive project',
    });
  } finally {
    archivingProject.value = false;
  }
}

async function handleExecuteUnarchiveProject() {
  unarchivingProject.value = true;
  try {
    const result = await unarchiveProjectApi(project.project_id);
    if (result.project) Object.assign(project, result.project);
    $q.notify({
      type: 'positive',
      message: `Project "${project.name}" unarchived (status restored to Completed)`,
    });
    showUnarchiveProjectDialog.value = false;
    await refreshData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to unarchive project',
    });
  } finally {
    unarchivingProject.value = false;
  }
}
</script>

<style scoped lang="scss">
.project-details-page {
  box-sizing: border-box;
}

.project-details-container {
  box-sizing: border-box;
  width: 100%;
  max-width: 1400px;

  /* Every card direct child takes exactly 100% of the container width */
  > .q-card {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  /* Grid rows using q-col-gutter-md offset margin-left: -16px with width: calc(100% + 16px),
     ensuring both the left and right outer boundaries match the cards above and below */
  > .row.q-col-gutter-md {
    width: calc(100% + 16px) !important;
    max-width: calc(100% + 16px) !important;
    min-width: 0 !important;
    margin-right: 0 !important;
    box-sizing: border-box !important;
  }

  > .row.q-col-gutter-lg {
    width: calc(100% + 24px) !important;
    max-width: calc(100% + 24px) !important;
    min-width: 0 !important;
    margin-right: 0 !important;
    box-sizing: border-box !important;
  }

  /* Ensure table container never expands beyond card boundary */
  :deep(.q-table__container) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  :deep(.q-table__middle) {
    max-width: 100% !important;
    overflow-x: auto !important;
  }
}
</style>
