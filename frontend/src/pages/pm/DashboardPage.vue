<template>
  <q-page
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    class="q-pa-lg pm-dashboard-page"
  >
    <div class="q-mx-auto column q-gutter-y-lg" style="max-width: 1400px">
      <!-- 01. HEADER & ACTIONS ROW -->
      <div class="row items-center justify-between wrap gap-md">
        <div>
          <div class="page-title">Welcome back, {{ currentPmName }}</div>
          <div class="page-subtitle">
            Executive workspace overview — projects, deadlines, workload, and deliverables.
          </div>
        </div>

        <!-- Clean, unified action buttons -->
        <div class="row items-center q-gutter-xs wrap">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="New Project"
            class="action-btn text-weight-bold"
            @click="openNewProjectDialog"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            icon="add_task"
            label="Add Task"
            class="action-btn text-weight-medium"
            :class="$q.dark.isActive ? 'bg-dark-subtle' : 'bg-white'"
            @click="openAddTaskDialog"
          />
          <q-btn
            flat
            no-caps
            icon="person_add"
            label="Allocate"
            class="action-btn text-weight-medium"
            :class="$q.dark.isActive ? 'bg-dark-subtle' : 'bg-white'"
            @click="openAllocateResourceDialog"
          />
          <q-btn
            flat
            no-caps
            icon="edit_calendar"
            label="Log Progress"
            class="action-btn text-weight-medium gt-xs"
            :class="$q.dark.isActive ? 'bg-dark-subtle' : 'bg-white'"
            @click="openLogProgressDialog"
          />
          <q-btn flat round dense icon="download" class="q-ml-xs" @click="openGenerateReportDialog">
            <q-tooltip>Generate Project Report</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- 02. KEY METRICS STRIP -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="kpi-card cursor-pointer" @click="goToProjects">
            <div class="row items-center justify-between">
              <span class="kpi-label">Active Projects</span>
              <div class="kpi-icon-wrap kpi-purple">
                <q-icon name="folder_open" size="18px" />
              </div>
            </div>
            <div class="kpi-value q-mt-xs">{{ totalProjects }}</div>
            <div class="kpi-meta text-muted">
              {{
                totalProjects === 1 ? '1 active workspace' : `${totalProjects} active workspaces`
              }}
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="kpi-card cursor-pointer" @click="goToTasks">
            <div class="row items-center justify-between">
              <span class="kpi-label">Active Deliverables</span>
              <div class="kpi-icon-wrap kpi-blue">
                <q-icon name="task_alt" size="18px" />
              </div>
            </div>
            <div class="kpi-value q-mt-xs">{{ activeTasks }}</div>
            <div class="kpi-meta text-muted">
              {{
                tasks.length
                  ? `${Math.round((activeTasks / tasks.length) * 100)}% of total tasks`
                  : 'No active tasks'
              }}
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="kpi-card cursor-pointer" @click="goToTasks">
            <div class="row items-center justify-between">
              <span class="kpi-label">Completed Tasks</span>
              <div class="kpi-icon-wrap kpi-green">
                <q-icon name="check_circle_outline" size="18px" />
              </div>
            </div>
            <div class="kpi-value q-mt-xs">{{ completedTasks }}</div>
            <div class="kpi-meta text-muted">
              {{
                tasks.length
                  ? `${Math.round((completedTasks / tasks.length) * 100)}% completion rate`
                  : '0% completed'
              }}
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card
            flat
            bordered
            class="kpi-card cursor-pointer"
            :class="{ 'kpi-card-warning': overdueTasks > 0 }"
            @click="goToSchedule"
          >
            <div class="row items-center justify-between">
              <span class="kpi-label">Overdue Tasks</span>
              <div class="kpi-icon-wrap" :class="overdueTasks > 0 ? 'kpi-red' : 'kpi-neutral'">
                <q-icon name="alarm_on" size="18px" />
              </div>
            </div>
            <div class="kpi-value q-mt-xs" :class="{ 'text-negative': overdueTasks > 0 }">
              {{ overdueTasks }}
            </div>
            <div
              class="kpi-meta"
              :class="overdueTasks > 0 ? 'text-negative text-weight-bold' : 'text-muted'"
            >
              {{
                overdueTasks > 0
                  ? `${overdueTasks} deliverable${overdueTasks === 1 ? '' : 's'} need attention`
                  : 'All tasks on schedule'
              }}
            </div>
          </q-card>
        </div>
      </div>

      <!-- 03. MAIN DASHBOARD SPLIT VIEW (70% Work / 30% Context & Team) -->
      <div class="row q-col-gutter-lg">
        <!-- LEFT COLUMN: Projects & Timeline -->
        <div class="col-12 col-lg-8 column q-gutter-y-lg">
          <!-- Active Projects Section -->
          <q-card flat bordered class="content-panel">
            <div class="panel-header row items-center justify-between q-pa-md">
              <div>
                <div class="panel-title">Active Projects</div>
                <div class="panel-subtitle">Current status and delivery progress</div>
              </div>
              <q-btn
                flat
                no-caps
                dense
                color="primary"
                label="View all projects"
                icon-right="chevron_right"
                @click="goToProjects"
              />
            </div>

            <q-separator />

            <div v-if="projects.length > 0" class="panel-body q-pa-none">
              <q-list separator class="clean-list">
                <q-item
                  v-for="project in projects.slice(0, 5)"
                  :key="project.project_id"
                  clickable
                  v-ripple
                  class="project-item q-py-md q-px-md"
                  @click="goToProject(project.project_id)"
                >
                  <q-item-section avatar>
                    <div class="project-indicator">
                      <q-icon name="folder" size="20px" />
                    </div>
                  </q-item-section>

                  <q-item-section>
                    <div class="row items-center gap-xs">
                      <span class="project-name text-weight-bold">{{ project.name }}</span>
                      <q-badge
                        v-if="project.priority"
                        dense
                        :class="getPriorityBadgeClass(project.priority)"
                        class="priority-badge"
                      >
                        {{ project.priority }}
                      </q-badge>
                    </div>
                    <div class="project-desc text-muted text-caption ellipsis q-mt-xs">
                      {{ project.description || 'No description provided' }}
                    </div>
                  </q-item-section>

                  <q-item-section side class="project-progress-col">
                    <div class="column items-end" style="min-width: 150px">
                      <div class="row items-center justify-between full-width q-mb-xs">
                        <span class="text-caption text-muted">
                          {{
                            project.deadline
                              ? `Due ${formatDateShort(project.deadline)}`
                              : 'No deadline'
                          }}
                        </span>
                        <span class="text-caption text-weight-bold"
                          >{{ Math.round(Number(project.progress) || 0) }}%</span
                        >
                      </div>
                      <q-linear-progress
                        rounded
                        size="5px"
                        :value="(Number(project.progress) || 0) / 100"
                        color="primary"
                        track-color="grey-3"
                        class="full-width"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div v-else class="column items-center justify-center q-pa-xl text-muted">
              <q-icon name="folder_open" size="36px" color="grey-5" />
              <div class="text-body2 q-mt-sm">No active projects created yet</div>
              <q-btn
                flat
                no-caps
                color="primary"
                label="Create your first project"
                class="q-mt-xs"
                @click="openNewProjectDialog"
              />
            </div>
          </q-card>

          <!-- Timeline & Upcoming Schedule -->
          <q-card flat bordered class="content-panel" id="timeline-section">
            <div class="panel-header row items-center justify-between q-pa-md">
              <div>
                <div class="panel-title">Schedule & Milestone Horizon</div>
                <div class="panel-subtitle">Deliverable dates for {{ timelineMonthLabel }}</div>
              </div>
              <q-btn
                flat
                no-caps
                dense
                color="primary"
                label="Full Schedule"
                icon-right="chevron_right"
                @click="goToSchedule"
              />
            </div>

            <q-separator />

            <div class="panel-body q-pa-md overflow-hidden">
              <div v-if="positionedTimelineRows.length" class="overflow-auto q-pb-xs">
                <!-- Timeline Dates Header -->
                <div
                  class="timeline-header-grid"
                  :style="{ minWidth: `${160 + timelineDays.length * 48}px` }"
                >
                  <div class="timeline-col-header text-caption text-weight-bold text-muted">
                    Deliverable
                  </div>
                  <div
                    class="timeline-days-track"
                    :style="{
                      gridTemplateColumns: `repeat(${timelineDays.length}, minmax(48px, 1fr))`,
                    }"
                  >
                    <div
                      v-for="day in timelineDays"
                      :key="day.key"
                      class="timeline-day-cell text-center"
                      :class="{ 'today-cell': day.isToday }"
                    >
                      <div class="text-weight-bold" style="font-size: 11px">{{ day.label }}</div>
                      <div class="text-muted" style="font-size: 9px">{{ day.weekday }}</div>
                    </div>
                  </div>
                </div>

                <!-- Timeline Rows -->
                <div class="timeline-rows-container q-mt-xs">
                  <div
                    v-for="row in positionedTimelineRows"
                    :key="row.id"
                    class="timeline-row-item"
                    :style="{ minWidth: `${160 + timelineDays.length * 48}px` }"
                  >
                    <div
                      class="row-title-col cursor-pointer ellipsis"
                      :title="`${row.title} (${row.projectName})`"
                      @click="row.projectId ? goToProject(row.projectId) : goToTasks()"
                    >
                      <div class="text-caption text-weight-bold ellipsis">{{ row.title }}</div>
                      <div class="text-muted ellipsis" style="font-size: 10px">
                        {{ row.projectName }}
                      </div>
                    </div>

                    <div class="row-track-col">
                      <!-- Grid lines -->
                      <div
                        class="timeline-grid-overlay"
                        :style="{
                          gridTemplateColumns: `repeat(${timelineDays.length}, minmax(48px, 1fr))`,
                        }"
                      >
                        <div v-for="day in timelineDays" :key="day.key" class="track-line" />
                      </div>

                      <!-- Progress bar -->
                      <div
                        class="timeline-pill cursor-pointer"
                        :class="`status-${row.status.toLowerCase()}`"
                        :style="{ left: `${row.left}%`, width: `${row.width}%` }"
                        @click="row.projectId ? goToProject(row.projectId) : goToTasks()"
                      >
                        <span class="timeline-pill-text ellipsis">
                          {{ row.title }} ({{ row.progress }}%)
                        </span>
                        <q-tooltip>
                          <div class="text-weight-bold">{{ row.title }}</div>
                          <div>Project: {{ row.projectName }}</div>
                          <div>Window: {{ row.startLabel }} → {{ row.endLabel }}</div>
                          <div>Status: {{ row.statusLabel }} ({{ row.progress }}% complete)</div>
                        </q-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="column items-center justify-center q-pa-xl text-muted">
                <q-icon name="event_busy" size="36px" color="grey-5" />
                <div class="text-caption q-mt-sm">
                  No scheduled deliverables with dates found for this timeframe.
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <!-- RIGHT COLUMN: Tasks Focus & Team Capacity -->
        <div class="col-12 col-lg-4 column q-gutter-y-lg">
          <!-- Priority Tasks Focus Card -->
          <q-card flat bordered class="content-panel">
            <div class="panel-header row items-center justify-between q-pa-md">
              <div>
                <div class="panel-title">Tasks Requiring Attention</div>
                <div class="panel-subtitle">Overdue and high priority items</div>
              </div>
              <q-btn
                flat
                no-caps
                dense
                color="primary"
                label="View all"
                icon-right="chevron_right"
                @click="goToTasks"
              />
            </div>

            <q-separator />

            <div class="panel-body q-pa-none">
              <q-tabs
                v-model="taskFocusTab"
                dense
                no-caps
                align="justify"
                class="text-muted border-bottom-subtle"
                active-color="primary"
                indicator-color="primary"
              >
                <q-tab name="urgent" label="Urgent / Overdue">
                  <q-badge v-if="urgentTasks.length" color="negative" floating rounded>{{
                    urgentTasks.length
                  }}</q-badge>
                </q-tab>
                <q-tab name="in_progress" label="In Progress" />
                <q-tab name="recent" label="Recent" />
              </q-tabs>

              <q-tab-panels v-model="taskFocusTab" animated class="bg-transparent">
                <!-- Urgent Panel -->
                <q-tab-panel name="urgent" class="q-pa-none">
                  <q-list v-if="urgentTasks.length" separator class="clean-list">
                    <q-item
                      v-for="task in urgentTasks.slice(0, 5)"
                      :key="task.task_id"
                      clickable
                      v-ripple
                      class="task-focus-item q-py-sm q-px-md"
                      @click="task.project_id ? goToProject(task.project_id) : goToTasks()"
                    >
                      <q-item-section>
                        <div class="row items-center gap-xs">
                          <span class="text-body2 text-weight-bold ellipsis">{{ task.title }}</span>
                          <q-badge
                            dense
                            :color="isTaskOverdue(task) ? 'red-1' : 'amber-1'"
                            :text-color="isTaskOverdue(task) ? 'negative' : 'warning'"
                            class="text-weight-bold"
                          >
                            {{ isTaskOverdue(task) ? 'Overdue' : task.priority }}
                          </q-badge>
                        </div>
                        <div class="row items-center gap-xs text-muted text-caption q-mt-xs">
                          <span class="ellipsis">{{
                            task.project_name || `Project #${task.project_id}`
                          }}</span>
                          <span>•</span>
                          <span>{{
                            task.deadline ? formatDateShort(task.deadline) : 'No due date'
                          }}</span>
                        </div>
                      </q-item-section>
                      <q-item-section side>
                        <span class="text-caption text-weight-bold">{{ task.progress }}%</span>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div v-else class="column items-center justify-center q-pa-lg text-muted">
                    <q-icon name="check_circle" color="positive" size="30px" />
                    <div class="text-caption q-mt-xs">No urgent or overdue tasks!</div>
                  </div>
                </q-tab-panel>

                <!-- In Progress Panel -->
                <q-tab-panel name="in_progress" class="q-pa-none">
                  <q-list v-if="inProgressTasks.length" separator class="clean-list">
                    <q-item
                      v-for="task in inProgressTasks.slice(0, 5)"
                      :key="task.task_id"
                      clickable
                      v-ripple
                      class="task-focus-item q-py-sm q-px-md"
                      @click="task.project_id ? goToProject(task.project_id) : goToTasks()"
                    >
                      <q-item-section>
                        <div class="text-body2 text-weight-bold ellipsis">{{ task.title }}</div>
                        <div class="row items-center gap-xs text-muted text-caption q-mt-xs">
                          <span class="ellipsis">{{
                            task.project_name || `Project #${task.project_id}`
                          }}</span>
                          <span>•</span>
                          <span>{{
                            task.deadline ? formatDateShort(task.deadline) : 'Ongoing'
                          }}</span>
                        </div>
                      </q-item-section>
                      <q-item-section side>
                        <span class="text-caption text-weight-bold">{{ task.progress }}%</span>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div v-else class="column items-center justify-center q-pa-lg text-muted">
                    <div class="text-caption">No deliverables currently in progress.</div>
                  </div>
                </q-tab-panel>

                <!-- Recent Panel -->
                <q-tab-panel name="recent" class="q-pa-none">
                  <q-list v-if="tasks.length" separator class="clean-list">
                    <q-item
                      v-for="task in tasks.slice(0, 5)"
                      :key="task.task_id"
                      clickable
                      v-ripple
                      class="task-focus-item q-py-sm q-px-md"
                      @click="task.project_id ? goToProject(task.project_id) : goToTasks()"
                    >
                      <q-item-section>
                        <div class="text-body2 text-weight-bold ellipsis">{{ task.title }}</div>
                        <div class="row items-center gap-xs text-muted text-caption q-mt-xs">
                          <span class="ellipsis">{{
                            task.project_name || `Project #${task.project_id}`
                          }}</span>
                          <span>•</span>
                          <span class="text-capitalize">{{
                            task.status.toLowerCase().replace('_', ' ')
                          }}</span>
                        </div>
                      </q-item-section>
                      <q-item-section side>
                        <span class="text-caption text-weight-bold">{{ task.progress }}%</span>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-tab-panel>
              </q-tab-panels>
            </div>
          </q-card>

          <!-- Team Capacity & Workload Card -->
          <q-card flat bordered class="content-panel">
            <div class="panel-header row items-center justify-between q-pa-md">
              <div>
                <div class="panel-title">Team Capacity</div>
                <div class="panel-subtitle">Resource allocation and load</div>
              </div>
              <q-btn
                flat
                no-caps
                dense
                color="primary"
                label="Manage team"
                icon-right="chevron_right"
                @click="goToResources"
              />
            </div>

            <q-separator />

            <div v-if="teamCapacityList.length" class="panel-body q-pa-none">
              <q-list separator class="clean-list">
                <q-item
                  v-for="member in teamCapacityList.slice(0, 6)"
                  :key="member.user_id"
                  clickable
                  v-ripple
                  class="q-py-sm q-px-md"
                  @click="goToResourceDetails(member.user_id)"
                >
                  <q-item-section avatar>
                    <q-avatar size="32px" class="member-avatar">
                      {{ getInitials(member.name) }}
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <div class="row items-center justify-between">
                      <span class="text-body2 text-weight-bold ellipsis">{{ member.name }}</span>
                      <span
                        class="text-caption text-weight-bold"
                        :class="getWorkloadTextColor(member.workload)"
                      >
                        {{ member.workload }}%
                      </span>
                    </div>
                    <div class="row items-center justify-between q-mt-xs">
                      <span class="text-muted text-caption ellipsis">{{
                        member.role || 'Team Member'
                      }}</span>
                      <span class="text-muted" style="font-size: 10px">{{ member.status }}</span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="4px"
                      :value="Math.min(1, member.workload / 100)"
                      :color="getWorkloadProgressColor(member.workload)"
                      track-color="grey-3"
                      class="q-mt-xs"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div v-else class="column items-center justify-center q-pa-xl text-muted">
              <q-icon name="group" size="36px" color="grey-5" />
              <div class="text-caption q-mt-sm">No resources available.</div>
              <q-btn
                flat
                no-caps
                color="primary"
                label="View resources"
                class="q-mt-xs"
                @click="goToResources"
              />
            </div>
          </q-card>
        </div>
      </div>

      <!-- MODALS & DIALOGS (100% PRESERVED FOR FULL FUNCTIONALITY) -->
      <!-- DIALOG 1: CREATE PROJECT -->
      <q-dialog v-model="showNewProjectModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 460px; max-width: 90vw; border-radius: 12px"
        >
          <q-card-section class="row items-center q-pb-sm">
            <div class="text-h6 text-weight-bold">Create New Project</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-separator />

          <q-form @submit="handleCreateProject">
            <q-card-section class="q-pt-md q-pb-xs q-px-md">
              <q-input
                v-model="newProjectForm.name"
                label="Project Name *"
                outlined
                dense
                :dark="$q.dark.isActive"
                :rules="[(val) => (val && val.length > 0) || 'Project name is required']"
              />
            </q-card-section>

            <q-card-section class="q-pt-xs q-pb-xs q-px-md">
              <q-input
                v-model="newProjectForm.description"
                label="Description"
                type="textarea"
                outlined
                dense
                :dark="$q.dark.isActive"
                rows="3"
              />
            </q-card-section>

            <q-card-section class="q-pt-sm q-pb-xs q-px-md">
              <q-select
                v-model="newProjectForm.priority"
                :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                label="Priority"
                outlined
                dense
                :dark="$q.dark.isActive"
              />
            </q-card-section>

            <q-card-section class="q-pt-sm q-pb-sm q-px-md">
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input
                    v-model="newProjectForm.start_date"
                    label="Start Date"
                    type="date"
                    outlined
                    dense
                    stack-label
                    :dark="$q.dark.isActive"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model="newProjectForm.deadline"
                    label="Deadline"
                    type="date"
                    outlined
                    dense
                    stack-label
                    :dark="$q.dark.isActive"
                  />
                </div>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md q-pt-xs">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                unelevated
                color="primary"
                label="Create Project"
                type="submit"
                :loading="projectSubmitting"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- DIALOG 2: ADD TASK -->
      <q-dialog v-model="showAddTaskModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 480px; max-width: 90vw; border-radius: 12px"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold">Add New Task</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-form @submit="handleCreateTask" class="q-gutter-md">
              <q-select
                v-model="newTaskForm.project_id"
                :options="projectOptions"
                label="Select Project *"
                outlined
                dense
                emit-value
                map-options
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val || 'Project is required']"
              />
              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-input
                    v-model="newTaskForm.title"
                    label="Task Title *"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
                    :rules="[(val) => (val && val.length > 0) || 'Task title is required']"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-input
                    v-model="newTaskForm.description"
                    label="Description"
                    type="textarea"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
                    rows="2"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-select
                    v-model="newTaskForm.priority"
                    :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                    label="Priority"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model.number="newTaskForm.expected_effort"
                    label="Effort (Hours)"
                    type="number"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-select
                    v-model="newTaskForm.assigned_resource_ids"
                    :options="taskAssigneeOptions"
                    label="Assign Team Members (Optional)"
                    outlined
                    dense
                    multiple
                    emit-value
                    map-options
                    use-chips
                    clearable
                    :dark="$q.dark.isActive"
                    :hint="newTaskForm.assigned_resource_ids.length > 0 ? 'Task will be created as Scheduled' : 'No assignees — task will be Unassigned'"
                  />
                </div>
              </div>

              <!-- Deadline (Required when at least one member is assigned) -->
              <div
                v-if="newTaskForm.assigned_resource_ids && newTaskForm.assigned_resource_ids.length > 0"
                class="row q-col-gutter-sm"
              >
                <div class="col-12">
                  <q-input
                    v-model="newTaskForm.deadline"
                    label="Deadline *"
                    type="date"
                    outlined
                    dense
                    stack-label
                    :dark="$q.dark.isActive"
                    :rules="[
                      (val) => !!val || 'Deadline is required when assigning members',
                      (val) => {
                        if (!val || !selectedNewTaskProject?.start_date) return true;
                        const pStart = String(selectedNewTaskProject.start_date).split('T')[0] || '';
                        return !pStart || val >= pStart || `Deadline cannot be earlier than project start date (${pStart})`;
                      },
                      (val) => {
                        if (!val || !selectedNewTaskProject?.deadline) return true;
                        const pDeadline = String(selectedNewTaskProject.deadline).split('T')[0] || '';
                        return !pDeadline || val <= pDeadline || `Deadline cannot be later than project deadline (${pDeadline})`;
                      },
                    ]"
                  />
                </div>
              </div>

              <div class="row justify-end q-mt-md q-gutter-sm">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn
                  unelevated
                  color="primary"
                  label="Add Task"
                  type="submit"
                  :loading="taskSubmitting"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- DIALOG 3: ALLOCATE RESOURCE -->
      <q-dialog v-model="showAllocateResourceModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 440px; max-width: 90vw; border-radius: 12px"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold">Allocate Resource</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-form @submit="handleAllocateResource" class="q-gutter-md">
              <q-select
                v-model="allocateForm.project_id"
                :options="projectOptions"
                label="Select Project *"
                outlined
                dense
                emit-value
                map-options
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val || 'Project is required']"
              />
              <q-select
                v-model="allocateForm.user_id"
                :options="resourceOptions"
                label="Select Resource Member *"
                outlined
                dense
                emit-value
                map-options
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val || 'Resource member is required']"
              />
              <q-select
                v-model="allocateForm.task_id"
                :options="allocateTaskOptions"
                label="Assign Specific Task (Optional)"
                outlined
                dense
                emit-value
                map-options
                clearable
                :dark="$q.dark.isActive"
              />

              <div class="row justify-end q-mt-md q-gutter-sm">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn
                  unelevated
                  color="primary"
                  label="Allocate Member"
                  type="submit"
                  :loading="allocatingResource"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- DIALOG 4: LOG PROGRESS -->
      <q-dialog v-model="showLogProgressModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 460px; max-width: 90vw; border-radius: 12px"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold">Log Progress & Effort</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-form @submit="handleLogProgressSubmit" class="q-gutter-md">
              <q-select
                v-model="logProgressForm.task_id"
                :options="allTaskOptions"
                label="Select Task *"
                outlined
                dense
                emit-value
                map-options
                :dark="$q.dark.isActive"
                :rules="[(val) => !!val || 'Task is required']"
              />
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input
                    v-model.number="logProgressForm.hours_logged"
                    label="Hours Logged *"
                    type="number"
                    step="0.5"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
                    :rules="[(val) => (val !== null && val >= 0) || 'Valid hours required']"
                  />
                </div>
                <div class="col-6">
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-weight-bold">Progress (%) *</span>
                    <q-chip
                      dense
                      square
                      :class="[
                        'status-chip',
                        getTaskStatusClass(getStatusFromProgress(logProgressForm.progress_logged)),
                      ]"
                      class="text-weight-bold"
                      style="font-size: 11px; height: 18px"
                    >
                      {{
                        formatStatusLabel(getStatusFromProgress(logProgressForm.progress_logged))
                      }}
                    </q-chip>
                  </div>
                  <q-input
                    v-model.number="logProgressForm.progress_logged"
                    type="number"
                    min="0"
                    max="100"
                    outlined
                    dense
                    :dark="$q.dark.isActive"
                    :rules="[
                      (val) => (val !== null && val >= 0 && val <= 100) || '0-100% required',
                    ]"
                  />
                </div>
              </div>
              <q-input
                v-model="logProgressForm.notes"
                label="Work Notes / Details"
                type="textarea"
                outlined
                dense
                rows="2"
                :dark="$q.dark.isActive"
              />

              <div class="row justify-end q-mt-md q-gutter-sm">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn
                  unelevated
                  color="primary"
                  label="Submit Progress"
                  type="submit"
                  :loading="loggingProgress"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- DIALOG 5: GENERATE REPORT -->
      <q-dialog v-model="showGenerateReportModal">
        <q-card
          :dark="$q.dark.isActive"
          style="min-width: 440px; max-width: 90vw; border-radius: 12px"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold">Generate Project Report</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <div class="text-body2 text-muted">
              Generate a real-time status & workload summary report.
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-4">
                <div class="report-stat-box">
                  <div class="text-h6 text-weight-bold text-primary">{{ projects.length }}</div>
                  <div class="text-caption text-muted">Projects</div>
                </div>
              </div>
              <div class="col-4">
                <div class="report-stat-box">
                  <div class="text-h6 text-weight-bold text-positive">{{ completedTasks }}</div>
                  <div class="text-caption text-muted">Done Tasks</div>
                </div>
              </div>
              <div class="col-4">
                <div class="report-stat-box">
                  <div class="text-h6 text-weight-bold text-negative">{{ overdueTasks }}</div>
                  <div class="text-caption text-muted">Overdue</div>
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-lg q-gutter-sm">
              <q-btn flat label="Close" v-close-popup />
              <q-btn
                unelevated
                color="primary"
                icon="download"
                label="Download Summary"
                @click="downloadReport"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import {
  getProjectsApi,
  getTasksApi,
  getResourcesApi,
  getResourceWorkloadApi,
  calculateResourceWeeklyCapacity,
  createProjectApi,
  createTaskApi,
  assignProjectMemberApi,
  assignTaskResourceApi,
  createWorkLogApi,
  type Project,
  type Task,
  type ResourceUser,
  type CreateProjectPayload,
  type TaskPriority,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import {
  getStatusFromProgress,
  formatStatusLabel,
  getTaskStatusClass,
  isTaskOverdue,
} from '@/utils/taskHelpers';
import { getInitials, formatDateShort } from '@/utils/formatters';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const currentPmName = computed(() => {
  return authStore.user?.name || 'Project Manager';
});

const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);
const resources = ref<ResourceUser[]>([]);
const taskFocusTab = ref<'urgent' | 'in_progress' | 'recent'>('urgent');

const workloadMap = ref<
  Record<
    number,
    {
      workload: number;
      totalExpectedEffort: number;
      status: string;
    }
  >
>({});

const showNewProjectModal = ref(false);
const projectSubmitting = ref(false);

const showAddTaskModal = ref(false);
const taskSubmitting = ref(false);

const showAllocateResourceModal = ref(false);
const allocatingResource = ref(false);

const showLogProgressModal = ref(false);
const loggingProgress = ref(false);

const showGenerateReportModal = ref(false);

const newProjectForm = reactive<CreateProjectPayload>({
  name: '',
  description: '',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
  project_manager_id: authStore.user?.user_id ?? 1,
});

const newTaskForm = reactive({
  project_id: null as number | null,
  assigned_resource_ids: [] as number[],
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'UNASSIGNED',
  deadline: '',
  expected_effort: 8,
});

const allocateForm = reactive({
  project_id: null as number | null,
  user_id: null as number | null,
  task_id: null as number | null,
});

const logProgressForm = reactive({
  task_id: null as number | null,
  hours_logged: 2,
  progress_logged: 50,
  notes: '',
});

onMounted(() => {
  void loadDashboardData();
});

async function loadDashboardData() {
  try {
    const [p, t, r] = await Promise.all([getProjectsApi(), getTasksApi(), getResourcesApi()]);
    projects.value = p;
    tasks.value = t;
    resources.value = r;
  } catch (error) {
    console.error('Failed to load PM dashboard:', error);
  }
}

// KPI stats
const totalProjects = computed(() => projects.value.length);
const activeTasks = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'SCHEDULED').length,
);
const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);
const overdueTasks = computed(() => {
  return tasks.value.filter((t) => isTaskOverdue(t)).length;
});

// Focused task lists
const urgentTasks = computed(() => {
  return tasks.value.filter((t) => {
    if (t.status === 'COMPLETED') return false;
    return isTaskOverdue(t) || t.priority === 'CRITICAL' || t.priority === 'HIGH';
  });
});

const inProgressTasks = computed(() => {
  return tasks.value.filter((t) => t.status === 'IN_PROGRESS');
});

// Workload calculation
async function loadTeamWorkloads() {
  if (!resources.value.length) {
    workloadMap.value = {};
    return;
  }

  const entries = await Promise.all(
    resources.value.map(async (res) => {
      try {
        const wl = await getResourceWorkloadApi(res.user_id);
        const expectedHours = Number(wl.total_expected_effort) || 0;
        const cap = Math.max(1, calculateResourceWeeklyCapacity(res));
        const pct = Math.round((expectedHours / cap) * 100);

        let statusText = 'Optimal';
        if (pct > 100) statusText = 'Overloaded';
        else if (pct > 80) statusText = 'High Load';
        else if (pct < 30) statusText = 'Available';

        return [
          res.user_id,
          {
            workload: Math.max(0, pct),
            totalExpectedEffort: expectedHours,
            status: statusText,
          },
        ] as const;
      } catch {
        return [res.user_id, { workload: 0, totalExpectedEffort: 0, status: 'Available' }] as const;
      }
    }),
  );

  workloadMap.value = Object.fromEntries(entries);
}

watch(
  () => resources.value.map((r) => r.user_id),
  () => {
    void loadTeamWorkloads();
  },
  { immediate: true },
);

const teamCapacityList = computed(() => {
  return resources.value.map((res) => {
    const data = workloadMap.value[res.user_id];
    return {
      ...res,
      workload: data?.workload ?? 0,
      status: data?.status ?? 'Available',
    };
  });
});

function getWorkloadTextColor(workload: number) {
  if (workload > 100) return 'text-negative';
  if (workload > 80) return 'text-warning';
  return 'text-primary';
}

function getWorkloadProgressColor(workload: number) {
  if (workload > 100) return 'negative';
  if (workload > 80) return 'warning';
  return 'primary';
}

function getPriorityBadgeClass(priority: string) {
  const p = (priority || '').toUpperCase();
  if (p === 'CRITICAL') return 'bg-red-1 text-negative';
  if (p === 'HIGH') return 'bg-orange-1 text-warning';
  if (p === 'MEDIUM') return 'bg-blue-1 text-info';
  return 'bg-grey-2 text-grey-8';
}

const projectOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: number }> = [];
  for (const p of projects.value) {
    const id = Number(p.project_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({ label: p.name, value: id });
    }
  }
  return opts;
});

const selectedNewTaskProject = computed(() => {
  if (!newTaskForm.project_id) return null;
  return projects.value.find((p) => Number(p.project_id) === Number(newTaskForm.project_id)) || null;
});

const resourceOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: number }> = [];
  for (const r of resources.value) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({ label: r.name, value: id });
    }
  }
  return opts.sort((a, b) => a.label.localeCompare(b.label));
});

const allocateTaskOptions = computed(() => {
  if (!allocateForm.project_id) return [];
  return tasks.value
    .filter((t) => Number(t.project_id) === Number(allocateForm.project_id))
    .map((t) => ({ label: t.title, value: t.task_id }));
});

const allTaskOptions = computed(() =>
  tasks.value.map((t) => ({
    label: `${t.title} (${t.project_name || `Project #${t.project_id}`})`,
    value: t.task_id,
  })),
);

// Assignee options for the Add Task dialog — all resources (PM can assign anyone)
const taskAssigneeOptions = computed(() => resourceOptions.value);

function goToProjects() {
  void router.push('/pm/projects');
}
function goToProject(projectId: number) {
  void router.push(`/pm/projects/${projectId}`);
}
function goToResources() {
  void router.push('/pm/resources');
}
function goToResourceDetails(userId?: number) {
  if (userId) void router.push(`/pm/resources/${userId}`);
  else void router.push('/pm/resources');
}
function goToTasks() {
  void router.push('/pm/tasks');
}
function goToSchedule() {
  void router.push('/pm/schedule');
}

function openNewProjectDialog() {
  newProjectForm.name = '';
  newProjectForm.description = '';
  newProjectForm.priority = 'MEDIUM';
  newProjectForm.start_date = '';
  newProjectForm.deadline = '';
  showNewProjectModal.value = true;
}

async function handleCreateProject() {
  if (!newProjectForm.name.trim()) return;
  projectSubmitting.value = true;
  try {
    await createProjectApi(newProjectForm);
    $q.notify({ type: 'positive', message: 'Project created successfully' });
    showNewProjectModal.value = false;
    await loadDashboardData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to create project',
    });
  } finally {
    projectSubmitting.value = false;
  }
}

function openAddTaskDialog() {
  newTaskForm.project_id = projects.value[0]?.project_id ?? null;
  newTaskForm.assigned_resource_ids = [];
  newTaskForm.title = '';
  newTaskForm.description = '';
  newTaskForm.priority = 'MEDIUM';
  newTaskForm.status = 'UNASSIGNED';
  newTaskForm.deadline = '';
  newTaskForm.expected_effort = 8;
  showAddTaskModal.value = true;
}

async function handleCreateTask() {
  if (!newTaskForm.project_id || !newTaskForm.title.trim()) return;
  const hasAssignees = newTaskForm.assigned_resource_ids.length > 0;
  if (hasAssignees && !newTaskForm.deadline) {
    $q.notify({
      type: 'warning',
      message: 'Deadline is required when assigning team members',
    });
    return;
  }
  taskSubmitting.value = true;
  try {
    await createTaskApi({
      project_id: newTaskForm.project_id,
      title: newTaskForm.title.trim(),
      description: newTaskForm.description || null,
      priority: newTaskForm.priority as TaskPriority,
      status: hasAssignees ? 'SCHEDULED' : 'UNASSIGNED',
      deadline: hasAssignees ? (newTaskForm.deadline || null) : null,
      expected_effort: Number(newTaskForm.expected_effort) || 8,
      assigned_resource_ids: newTaskForm.assigned_resource_ids,
    });
    $q.notify({ type: 'positive', message: 'Task created successfully' });
    showAddTaskModal.value = false;
    await loadDashboardData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to create task',
    });
  } finally {
    taskSubmitting.value = false;
  }
}

function openAllocateResourceDialog() {
  allocateForm.project_id = projects.value[0]?.project_id ?? null;
  allocateForm.user_id = resources.value[0]?.user_id ?? null;
  allocateForm.task_id = null;
  showAllocateResourceModal.value = true;
}

async function handleAllocateResource() {
  if (!allocateForm.project_id || !allocateForm.user_id) return;
  allocatingResource.value = true;
  try {
    await assignProjectMemberApi(allocateForm.project_id, allocateForm.user_id);
    if (allocateForm.task_id) {
      await assignTaskResourceApi(allocateForm.task_id, allocateForm.user_id);
    }
    $q.notify({
      type: 'positive',
      message: allocateForm.task_id
        ? 'Resource allocated to project and assigned to task'
        : 'Resource allocated to project',
    });
    showAllocateResourceModal.value = false;
    await loadDashboardData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to allocate resource',
    });
  } finally {
    allocatingResource.value = false;
  }
}

function openLogProgressDialog() {
  logProgressForm.task_id = tasks.value[0]?.task_id ?? null;
  logProgressForm.hours_logged = 2;
  logProgressForm.progress_logged = 50;
  logProgressForm.notes = '';
  showLogProgressModal.value = true;
}

async function handleLogProgressSubmit() {
  if (!logProgressForm.task_id) return;
  loggingProgress.value = true;
  try {
    const computedStatus = getStatusFromProgress(logProgressForm.progress_logged);
    await createWorkLogApi(logProgressForm.task_id, {
      hours_logged: logProgressForm.hours_logged,
      progress_logged: logProgressForm.progress_logged,
      status: computedStatus,
      notes: logProgressForm.notes,
      log_date: getLocalDateIso(),
    });
    $q.notify({ type: 'positive', message: 'Progress logged successfully' });
    showLogProgressModal.value = false;
    await loadDashboardData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to log progress',
    });
  } finally {
    loggingProgress.value = false;
  }
}

function openGenerateReportDialog() {
  showGenerateReportModal.value = true;
}

function downloadReport() {
  try {
    const today = getLocalDateIso();
    const escapeCsv = (str: string | number | null | undefined) => {
      const val = str === null || str === undefined ? '' : String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    const lines: string[] = [];
    lines.push('=== PM EXECUTIVE DASHBOARD SUMMARY REPORT ===');
    lines.push(`Generated On,${today}`);
    lines.push(`Project Manager,${escapeCsv(currentPmName.value)}`);
    lines.push(`Total Active Projects,${totalProjects.value}`);
    lines.push(`Active Deliverables,${activeTasks.value}`);
    lines.push(`Completed Tasks,${completedTasks.value}`);
    lines.push(`Overdue Tasks,${overdueTasks.value}`);
    lines.push('');

    lines.push('=== PROJECTS BREAKDOWN ===');
    lines.push('Project ID,Project Name,Priority,Status,Progress (%),Start Date,Deadline');
    projects.value.forEach((p) => {
      lines.push(
        [
          p.project_id,
          escapeCsv(p.name),
          p.priority || 'MEDIUM',
          p.status,
          Math.round(Number(p.progress) || 0),
          p.start_date || 'N/A',
          p.deadline || 'N/A',
        ].join(','),
      );
    });
    lines.push('');

    lines.push('=== DELIVERABLES BREAKDOWN ===');
    lines.push(
      'Task ID,Title,Project Name,Priority,Status,Progress (%),Expected Effort (h),Actual Effort (h),Deadline',
    );
    tasks.value.forEach((t) => {
      lines.push(
        [
          t.task_id,
          escapeCsv(t.title),
          escapeCsv(t.project_name || `Project #${t.project_id}`),
          t.priority,
          t.status,
          Math.round(Number(t.progress) || 0),
          Number(t.expected_effort) || 0,
          Number(t.actual_effort) || 0,
          t.deadline || 'N/A',
        ].join(','),
      );
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pm_dashboard_summary_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    $q.notify({ type: 'positive', message: 'Dashboard summary report exported successfully' });
    showGenerateReportModal.value = false;
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to export dashboard report',
    });
  }
}

// Compact Timeline Horizon
function getLocalDateIso(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateMs(dateStr: string): number {
  if (!dateStr) return Date.now();
  const cleanStr = dateStr.includes('T') ? (dateStr.split('T')[0] ?? dateStr) : dateStr;
  const parts = cleanStr.split('-').map(Number);
  const p0 = parts[0];
  const p1 = parts[1];
  const p2 = parts[2];
  if (p0 === undefined || p1 === undefined || p2 === undefined || isNaN(p0) || isNaN(p1) || isNaN(p2)) {
    return new Date(cleanStr).getTime();
  }
  return new Date(p0, p1 - 1, p2).getTime();
}

const timelineDays = computed(() => {
  const result: { key: string; label: number; weekday: string; isToday: boolean }[] = [];
  const start = new Date();
  start.setDate(start.getDate() - 2);

  const todayStr = getLocalDateIso();

  for (let i = 0; i < 14; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    const key = getLocalDateIso(cur);
    const label = cur.getDate();
    const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' }).format(cur);

    result.push({
      key,
      label,
      weekday,
      isToday: key === todayStr,
    });
  }
  return result;
});

const timelineMonthLabel = computed(() => {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date());
});

const positionedTimelineRows = computed(() => {
  const days = timelineDays.value;
  if (!days.length) return [];

  const firstDayMs = parseLocalDateMs(days[0]!.key);
  const lastDayMs = parseLocalDateMs(days[days.length - 1]!.key);
  const totalRangeMs = Math.max(1, lastDayMs - firstDayMs);

  return tasks.value.slice(0, 8).map((t) => {
    const rawStart = t.planned_start || t.actual_start || t.start_date;
    const startStr = rawStart ? rawStart.slice(0, 10) : days[0]!.key;
    const endStr = t.planned_end
      ? t.planned_end.slice(0, 10)
      : t.deadline
        ? t.deadline.slice(0, 10)
        : days[days.length - 1]!.key;

    const startMs = parseLocalDateMs(startStr);
    const endMs = parseLocalDateMs(endStr);

    const left = Math.max(0, Math.min(100, ((startMs - firstDayMs) / totalRangeMs) * 100));
    const right = Math.max(0, Math.min(100, ((endMs - firstDayMs) / totalRangeMs) * 100));
    const width = Math.max(8, right - left);

    return {
      id: t.task_id,
      title: t.title,
      projectId: t.project_id,
      projectName: t.project_name || `Project #${t.project_id}`,
      status: t.status,
      statusLabel: t.status.replace('_', ' '),
      progress: Number(t.progress) || 0,
      left,
      width,
      startLabel: startStr,
      endLabel: endStr,
    };
  });
});
</script>

<style scoped lang="scss">
.pm-dashboard-page {
  font-family: var(--font-primary, sans-serif);
}

.page-title {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.page-subtitle {
  font-size: 13px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 4px;
}

.text-muted {
  color: var(--wo-text-muted, #64748b);
}

.action-btn {
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid var(--wo-border, #e5e7ec);
}

.bg-dark-subtle {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* KPI CARDS */
.kpi-card {
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.02);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--wo-primary, #8b6fd8);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.05);
  }
}

.kpi-card-warning {
  border-left: 3px solid #f04438;
}

.kpi-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
}

.kpi-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--wo-text-main, #172033);
}

.kpi-meta {
  font-size: 11.5px;
  margin-top: 6px;
}

.kpi-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-purple {
  background: rgba(139, 111, 216, 0.12);
  color: #8b6fd8;
}

.kpi-blue {
  background: rgba(46, 144, 250, 0.12);
  color: #2e90fa;
}

.kpi-green {
  background: rgba(18, 183, 106, 0.12);
  color: #12b76a;
}

.kpi-red {
  background: rgba(240, 68, 56, 0.12);
  color: #f04438;
}

.kpi-neutral {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

/* PANELS */
.content-panel {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e5e7ec);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.02);
  overflow: hidden;
}

.panel-header {
  background: transparent;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #172033);
  letter-spacing: -0.01em;
}

.panel-subtitle {
  font-size: 11.5px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 1px;
}

.border-bottom-subtle {
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
}

/* LISTS & ITEMS */
.clean-list {
  padding: 0;
}

.project-item {
  transition: background-color 0.15s ease;
  &:hover {
    background-color: var(--wo-bg-card-hover, #f8fafc);
  }
}

.project-indicator {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wo-primary-light, rgba(139, 111, 216, 0.12));
  color: var(--wo-primary, #8b6fd8);
}

.project-name {
  font-size: 13.5px;
  color: var(--wo-text-main, #172033);
}

.priority-badge {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.project-progress-col {
  min-width: 160px;
}

.task-focus-item {
  transition: background-color 0.15s ease;
  &:hover {
    background-color: var(--wo-bg-card-hover, #f8fafc);
  }
}

.member-avatar {
  background: var(--wo-primary-light, rgba(139, 111, 216, 0.12));
  color: var(--wo-primary, #8b6fd8);
  font-weight: 700;
  font-size: 11px;
}

/* COMPACT TIMELINE HORIZON */
.timeline-header-grid {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.timeline-days-track {
  display: grid;
  gap: 1px;
}

.timeline-day-cell {
  padding: 4px 0;
  border-radius: 4px;

  &.today-cell {
    background: rgba(139, 111, 216, 0.1);
    color: var(--wo-primary, #8b6fd8);
  }
}

.timeline-row-item {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: center;
  height: 38px;
  border-bottom: 1px dashed var(--wo-border-subtle, #f0f2f5);

  &:last-child {
    border-bottom: none;
  }
}

.row-title-col {
  padding-right: 12px;
}

.row-track-col {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.timeline-grid-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  pointer-events: none;
}

.track-line {
  border-right: 1px dashed var(--wo-border-subtle, #f0f2f5);
}

.timeline-pill {
  position: absolute;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 600;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.1);
  overflow: hidden;
  white-space: nowrap;

  &.status-unassigned,
  &.status-scheduled {
    background: #8b6fd8;
  }
  &.status-in_progress {
    background: #2e90fa;
  }
  &.status-completed {
    background: #12b76a;
  }
}

.report-stat-box {
  padding: 12px;
  background: var(--wo-bg-tag, rgba(200, 200, 200, 0.08));
  border: 1px solid var(--wo-border-subtle, #eaecf0);
  border-radius: 8px;
  text-align: center;
}

/* DARK MODE OVERRIDES */
body.body--dark {
  .page-title {
    color: #f3f4f6;
  }
  .panel-title {
    color: #f3f4f6;
  }
  .project-name {
    color: #f3f4f6;
  }
  .kpi-value {
    color: #f3f4f6;
  }
  .action-btn {
    border-color: rgba(255, 255, 255, 0.1);
  }
  .content-panel,
  .kpi-card {
    background: var(--wo-bg-card, #181d28);
    border-color: var(--wo-border, #283042);
  }
  .project-item:hover,
  .task-focus-item:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
  .border-bottom-subtle,
  .timeline-header-grid {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
  .timeline-row-item {
    border-bottom-color: rgba(255, 255, 255, 0.04);
  }
  .track-line {
    border-right-color: rgba(255, 255, 255, 0.04);
  }
  .report-stat-box {
    border-color: rgba(255, 255, 255, 0.08);
  }
}
</style>
