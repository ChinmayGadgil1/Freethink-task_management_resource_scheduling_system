<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="45px" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center q-pa-xl">
      <q-icon name="error_outline" size="50px" color="negative" />
      <div class="text-body1 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
        {{ error }}
      </div>

      <q-btn
        flat
        no-caps
        color="primary"
        icon="refresh"
        label="Try Again"
        class="q-mt-md"
        @click="loadTasks"
      />
    </div>

    <!-- ALL TASKS -->
    <div v-else-if="!hasTaskId">
      <!-- 1. PAGE HEADER -->
      <div class="row items-end justify-between q-mb-lg q-col-gutter-md">
        <div>
          <div
            class="text-h5 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Task Specs
          </div>
          <div class="text-body2 q-mt-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
            Track, organize, and manage all your assigned task specifications.
          </div>
        </div>

        <div class="row items-center q-gutter-md">
          <!-- View Mode Switcher -->
          <q-btn-toggle
            v-model="viewMode"
            toggle-color="primary"
            toggle-text-color="white"
            :color="$q.dark.isActive ? 'grey-9' : 'white'"
            :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'"
            dense
            
            unelevated
            :options="[
              { label: 'Board', value: 'board', icon: 'view_kanban' },
              { label: 'List', value: 'table', icon: 'view_list' },
            ]"
          />

          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Create Task"
            @click="openCreateDialog"
          />

          <q-btn
            outline
            no-caps
            :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
            icon="refresh"
            label="Refresh"
            :loading="loading"
            @click="loadTasks"
          />
        </div>
      </div>

      <!-- 2. STAT SUMMARY CARDS -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Total Tasks"
            :value="tasks.length"
            subtitle="All assigned tasks"
            icon="task_alt"
            color="purple"
            note-class="note-purple"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="In Progress"
            :value="tasks.filter((t) => t.status === 'IN_PROGRESS').length"
            subtitle="Active work"
            icon="autorenew"
            color="blue"
            note-class="note-blue"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Completed"
            :value="tasks.filter((t) => t.status === 'COMPLETED').length"
            subtitle="Done"
            icon="check_circle"
            color="green"
            note-class="note-green"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Delayed"
            :value="tasks.filter(isOverdue).length"
            subtitle="Need attention"
            icon="warning_amber"
            color="red"
            note-class="note-red"
            :negative="tasks.filter(isOverdue).length > 0"
          />
        </div>
      </div>

      <!-- 3. FILTER TOOLBAR -->
      <q-card flat bordered :dark="$q.dark.isActive" class="q-mb-md rounded-borders">
        <q-card-section class="row q-col-gutter-sm items-center q-pa-sm">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            clearable
            placeholder="Search tasks or projects..."
            class="col-12 col-md-6"
          >
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>

          <q-select
            v-model="projectFilter"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="projectOptions"
            label="Filter Project"
            class="col-12 col-sm-4 col-md-2"
          />

          <q-select
            v-model="statusFilter"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="statusOptions"
            label="Filter Status"
            class="col-12 col-sm-4 col-md-2"
          />

          <q-select
            v-model="priorityFilter"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="priorityOptions"
            label="Filter Priority"
            class="col-12 col-sm-4 col-md-2"
          />
        </q-card-section>
      </q-card>

      <!-- 4. KANBAN BOARD VIEW -->
      <div v-if="viewMode === 'board'" class="full-width overflow-auto q-pb-md">
        <div class="row q-col-gutter-md">
          <div
            v-for="col in KANBAN_COLUMNS"
            :key="col.id"
            class="col-12 col-md-4 rounded-borders overflow-hidden"
            :class="$q.dark.isActive ? 'bg-dark' : 'bg-white shadow-1'"
          >
            <!-- Column Header -->
            <div
              class="row items-center justify-between no-wrap q-pa-sm"
              :style="{ background: col.headerBg, borderBottom: `1px solid ${col.borderColor}` }"
            >
              <div class="row items-center q-gutter-xs no-wrap">
                <q-badge
                  rounded
                  :style="{ background: col.dotColor, width: '8px', height: '8px' }"
                />
                <span
                  class="text-subtitle2 text-weight-bold"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                >
                  {{ col.title }}
                </span>
                <q-badge
                  rounded
                  :style="{ background: col.badgeBg, color: col.badgeColor }"
                  class="text-weight-bold"
                >
                  {{ tasksByStatus[col.id]?.length || 0 }}
                </q-badge>
              </div>
            </div>

            <!-- Column Tasks Cards List -->
            <div class="column q-gutter-sm q-pa-sm">
              <q-card
                v-for="item in tasksByStatus[col.id]"
                :key="item.task_id"
                flat
                bordered
                :dark="$q.dark.isActive"
                class="q-pa-md rounded-borders cursor-pointer overflow-hidden"
                @click="openTask(item.task_id)"
              >
                <!-- Card Top Row: Project, Priority & Self-Assigned Badges (Wraps gracefully & Truncates) -->
                <div class="row items-center q-gutter-xs wrap overflow-hidden q-mb-xs">
                  <span
                    class="task-project-pill ellipsis"
                    :title="item.project_name || `Project #${item.project_id}`"
                  >
                    <q-icon name="folder" size="12px" class="q-mr-xs" />
                    {{ item.project_name || `Project #${item.project_id}` }}
                  </span>

                  <span :class="['task-priority-pill', `priority-${item.priority.toLowerCase()}`]">
                    {{ item.priority }}
                  </span>

                  <span v-if="isSelfAssigned(item)" class="task-self-pill">
                    <q-icon name="person" size="11px" class="q-mr-xs" />
                    Self-assigned
                  </span>
                </div>

                <!-- Task Title -->
                <div
                  class="text-subtitle2 text-weight-medium ellipsis-2-lines q-mb-xs"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  :title="item.title"
                >
                  {{ item.title }}
                </div>

                <!-- Task Description -->
                <div
                  v-if="item.description"
                  class="text-caption ellipsis-2-lines q-mb-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                >
                  {{ item.description }}
                </div>

                <!-- Progress & Effort Bar -->
                <div class="q-mt-sm">
                  <div class="row items-center justify-between no-wrap text-caption q-mb-xs">
                    <span
                      class="text-caption text-weight-bold"
                      :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
                      >{{ Number(item.progress) || 0 }}%</span
                    >
                    <span
                      class="text-caption"
                      :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'"
                      >{{ formatHours(item.expected_effort) }} effort</span
                    >
                  </div>
                  <q-linear-progress
                    rounded
                    size="5px"
                    :value="(Number(item.progress) || 0) / 100"
                    :color="col.id === 'COMPLETED' ? 'positive' : 'primary'"
                    :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                  />
                </div>

                <div class="q-my-sm" />

                <!-- Card Bottom Row: Deadline & Action Buttons -->
                <div class="task-card-footer row items-center justify-between no-wrap">
                  <span :class="['task-deadline-tag', { 'deadline-overdue': isTaskOverdue(item) }]">
                    <q-icon name="event" size="13px" class="q-mr-xs" />
                    {{ item.deadline ? formatDate(item.deadline) : 'TBD' }}
                  </span>

                  <div class="row items-center q-gutter-xs">
                    <q-btn
                      outline
                      no-caps
                      dense
                      color="primary"
                      size="sm"
                      label="Specs"
                      icon="article"
                      @click.stop="openTask(item.task_id)"
                    />

                    <q-btn
                      unelevated
                      no-caps
                      dense
                      color="primary"
                      size="sm"
                      label="Edit"
                      icon="edit"
                      @click.stop="openUpdateTaskDialog(item)"
                    />
                  </div>
                </div>
              </q-card>

              <!-- Empty State for Column -->
              <q-card
                v-if="!tasksByStatus[col.id]?.length"
                flat
                bordered
                :dark="$q.dark.isActive"
                class="column items-center justify-center q-pa-lg text-center rounded-borders"
                style="border-style: dashed"
              >
                <q-icon
                  :name="col.icon"
                  size="26px"
                  :color="$q.dark.isActive ? 'grey-6' : 'grey-4'"
                  class="q-mb-xs"
                />
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'">
                  No {{ col.title.toLowerCase() }} tasks
                </div>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. TABLE / LIST VIEW -->
      <q-card v-else flat bordered :dark="$q.dark.isActive" class="rounded-borders overflow-hidden">
        <q-table
          v-if="filteredTasks.length"
          flat
          :dark="$q.dark.isActive"
          :rows="filteredTasks"
          :columns="taskColumns"
          row-key="task_id"
          :pagination="{ rowsPerPage: 10 }"
          @row-click="(_, row) => openTask(row.task_id)"
        >
          <template #body-cell-task="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-xs wrap">
                <div
                  class="text-weight-medium ellipsis"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                >
                  {{ props.row.title }}
                </div>
                <span v-if="isSelfAssigned(props.row)" class="task-self-pill">
                  <q-icon name="person" size="11px" class="q-mr-xs" />
                  Self-assigned
                </span>
              </div>
              <div
                class="text-caption q-mt-xs ellipsis"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
              >
                {{ props.row.project_name || `Project #${props.row.project_id}` }}
              </div>
            </q-td>
          </template>

          <template #body-cell-priority="props">
            <q-td :props="props">
              <span :class="['task-priority-pill', `priority-${props.row.priority.toLowerCase()}`]">
                {{ props.row.priority }}
              </span>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <span :class="['status-chip', `status-${props.row.status.toLowerCase()}`]">
                {{ statusLabel(props.row.status) }}
              </span>
            </q-td>
          </template>

          <template #body-cell-deadline="props">
            <q-td :props="props">
              <div :class="{ 'text-negative': isTaskOverdue(props.row) }">
                {{ props.row.deadline ? formatDate(props.row.deadline) : 'TBD' }}
              </div>
            </q-td>
          </template>

          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="q-gutter-xs">
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-weight-medium">Progress</span>
                  <span
                    class="text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                    >{{ Number(props.row.progress) }}%</span
                  >
                </div>

                <q-linear-progress
                  :value="Number(props.row.progress) / 100"
                  rounded
                  size="6px"
                  color="primary"
                  :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                />
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" auto-width>
              <div class="row items-center q-gutter-xs no-wrap">
                <q-btn
                  outline
                  no-caps
                  dense
                  color="primary"
                  label="Specs"
                  icon="article"
                  @click.stop="openTask(props.row.task_id)"
                />

                <q-btn
                  unelevated
                  no-caps
                  dense
                  color="primary"
                  label="Edit"
                  icon="edit"
                  @click.stop="openUpdateTaskDialog(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>

        <div
          v-else-if="tasks.length"
          class="q-pa-xl text-center"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
        >
          <q-avatar
            size="56px"
            :color="$q.dark.isActive ? 'purple-10' : 'blue-1'"
            :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
            icon="manage_search"
          />
          <div class="text-body1 text-weight-medium q-mt-md">
            No tasks match the current filters.
          </div>
          <div class="text-caption q-mt-xs">
            Clear the filters to bring back your full task list.
          </div>
        </div>

        <div
          v-else
          class="q-pa-xl text-center"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
        >
          <q-avatar
            size="56px"
            :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
            :text-color="$q.dark.isActive ? 'grey-4' : 'grey-6'"
            icon="task_alt"
          />
          <div class="text-body1 text-weight-medium q-mt-md">No tasks assigned to you.</div>
          <div class="text-caption q-mt-xs">Your task specs will appear here once assigned.</div>
        </div>
      </q-card>
    </div>

    <!-- SINGLE TASK SPEC DETAIL VIEW -->
    <div v-else-if="task" class="q-mx-auto" style="max-width: 1200px">
      <!-- 1. HERO / TOP HEADER CARD -->
      <q-card
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders q-mb-lg overflow-hidden"
      >
        <q-card-section class="q-pa-md">
          <!-- Back Button -->
          <q-btn
            flat
            no-caps
            icon="arrow_back"
            label="Back to Task Specs"
            :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
            class="q-mb-sm"
            @click="router.push('/app/resource-dashboard/task-details')"
          />

          <!-- Main Hero Content Row (Left & Right start at the top) -->
          <div class="row items-start justify-between q-col-gutter-lg">
            <!-- Left Column: Chips, Title, Subtitle, Description -->
            <div class="col-12 col-md-7">
              <!-- Top Row Chips (Task ID, Status, Priority, Self-assigned) -->
              <div class="row items-center q-gutter-xs wrap overflow-hidden q-mb-sm">
                <span class="task-project-pill"> #{{ task.task_id }} </span>
                <span :class="['status-chip', `status-${task.status.toLowerCase()}`]">
                  {{ statusLabel(task.status) }}
                </span>
                <span :class="['task-priority-pill', `priority-${task.priority.toLowerCase()}`]">
                  {{ task.priority }}
                </span>
                <span v-if="task.is_deadline_at_risk" class="task-priority-pill priority-critical" style="background: rgba(239, 68, 68, 0.15); color: #ef4444">
                  <q-icon name="warning" size="12px" class="q-mr-xs" />
                  Deadline Risk
                </span>
                <span v-if="task.is_schedule_at_risk" class="task-priority-pill priority-high" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b">
                  <q-icon name="schedule" size="12px" class="q-mr-xs" />
                  Schedule Risk
                </span>
                <span v-if="isSelfAssigned(task)" class="task-self-pill">
                  <q-icon name="person" size="12px" class="q-mr-xs" />
                  Self-assigned
                </span>
              </div>

              <div
                class="text-h4 text-weight-bolder"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                {{ task.title }}
              </div>
              <div
                class="text-subtitle2 q-mt-xs"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
              >
                <q-icon name="folder" size="14px" color="primary" class="q-mr-xs" />
                <span>Belongs to {{ task.project_name || `Project #${task.project_id}` }}</span>
              </div>

              <div
                class="text-body1 q-mt-md"
                :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
              >
                {{ task.description || 'No description provided.' }}
              </div>
            </div>

            <!-- Right Column: Deadline (Compact, Aligned at Top Right) + Action Buttons -->
            <div class="col-12 col-md-5 column items-end justify-start">
              <!-- Dates Container -->
              <div class="column gap-xs q-mb-xs full-width" style="max-width: 320px">
                <!-- Deadline Card -->
                <q-card flat bordered :dark="$q.dark.isActive" class="q-pa-xs">
                  <q-item dense>
                    <q-item-section avatar style="min-width: 32px">
                      <div
                        :class="[
                          'hero-date-avatar',
                          isTaskOverdue(task) ? 'avatar-red' : 'avatar-blue',
                        ]"
                      >
                        <q-icon name="event_available" size="16px" />
                      </div>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label
                        caption
                        class="text-weight-bold"
                        :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                      >
                        DEADLINE
                      </q-item-label>
                      <q-item-label
                        class="text-weight-bold"
                        :class="
                          isTaskOverdue(task)
                            ? 'text-negative'
                            : $q.dark.isActive
                              ? 'text-white'
                              : 'text-dark'
                        "
                      >
                        {{ formatDate(task.deadline) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-card>
              </div>

              <!-- Action Buttons -->
              <div class="row items-center q-gutter-xs q-mt-xs">
                <q-btn
                  v-if="!isCurrentTaskSessionActive"
                  unelevated
                  no-caps
                  color="positive"
                  icon="play_arrow"
                  label="Start Session"
                  class="text-weight-bold"
                  :loading="sessionStore.loading"
                  @click="handleStartSession(task.task_id)"
                />
                <q-btn
                  v-else
                  unelevated
                  no-caps
                  color="negative"
                  icon="stop"
                  label="Stop Session"
                  class="text-weight-bold"
                  :loading="sessionStore.loading"
                  @click="promptStopSession"
                />
                <q-btn
                  outline
                  no-caps
                  color="primary"
                  icon="edit"
                  label="Edit Task"
                  class="text-weight-bold"
                  @click="openUpdateTaskDialog(task)"
                />
                <q-btn
                  unelevated
                  no-caps
                  color="primary"
                  icon="edit_note"
                  label="Add Daily Update"
                  class="text-weight-bold"
                  @click="updateDialog = true"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- 2. TASK PROGRESS & EFFORT BREAKDOWN CARD (PM-style Progress Card) -->
      <q-card
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders q-mb-lg overflow-hidden"
      >
        <q-card-section class="row items-center justify-between q-pa-md">
          <div class="row items-center">
            <div class="hero-date-avatar avatar-purple q-mr-sm">
              <q-icon name="insights" size="18px" />
            </div>
            <div>
              <div
                class="text-subtitle1 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                Task Progress & Effort
              </div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Track completion percentage, hours logged, and effort metrics.
              </div>
            </div>
          </div>
          <span :class="['status-chip', `status-${task.status.toLowerCase()}`]">
            {{ Number(task.progress) }}% Completed
          </span>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-lg">
          <!-- Main Progress Bar -->
          <div class="q-mb-lg">
            <div class="row items-center justify-between q-mb-xs">
              <span
                class="text-subtitle2 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                Overall Completion Progress
              </span>
              <span class="text-h6 text-primary text-weight-bolder"
                >{{ Number(task.progress) }}%</span
              >
            </div>
            <q-linear-progress
              :value="Number(task.progress) / 100"
              rounded
              size="12px"
              color="primary"
              :track-color="$q.dark.isActive ? 'grey-9' : 'purple-1'"
            />
          </div>

          <!-- Effort Breakdown KPI Grid (Estimated, Actual, Remaining) -->
          <div class="row q-col-gutter-md">
            <!-- Estimated Effort -->
            <div class="col-12 col-sm-4">
              <q-card flat bordered :dark="$q.dark.isActive">
                <q-card-section class="row items-center no-wrap q-pa-md">
                  <div class="hero-date-avatar avatar-purple">
                    <q-icon name="schedule" size="20px" />
                  </div>
                  <div class="q-ml-md">
                    <div
                      class="text-caption text-weight-bold"
                      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                    >
                      ESTIMATED EFFORT
                    </div>
                    <div
                      class="text-h6 text-weight-bolder"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      {{ formatNumber(task.expected_effort) }}
                      <span class="text-caption text-weight-bold">hrs</span>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Actual Effort Logged -->
            <div class="col-12 col-sm-4">
              <q-card flat bordered :dark="$q.dark.isActive">
                <q-card-section class="row items-center no-wrap q-pa-md">
                  <div class="hero-date-avatar avatar-blue">
                    <q-icon name="timer" size="20px" />
                  </div>
                  <div class="q-ml-md">
                    <div
                      class="text-caption text-weight-bold"
                      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                    >
                      ACTUAL EFFORT LOGGED
                    </div>
                    <div
                      class="text-h6 text-weight-bolder"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      {{ formatNumber(task.actual_effort) }}
                      <span class="text-caption text-weight-bold">hrs</span>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Remaining Effort -->
            <div class="col-12 col-sm-4">
              <q-card flat bordered :dark="$q.dark.isActive">
                <q-card-section class="row items-center no-wrap q-pa-md">
                  <div class="hero-date-avatar avatar-green">
                    <q-icon name="hourglass_empty" size="20px" />
                  </div>
                  <div class="q-ml-md">
                    <div
                      class="text-caption text-weight-bold"
                      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                    >
                      REMAINING EFFORT
                    </div>
                    <div
                      class="text-h6 text-weight-bolder"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      {{ formatNumber(remainingHours) }} <span class="text-caption text-weight-bold">hrs</span>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- 3. DAILY UPDATES LOG SECTION -->
      <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders overflow-hidden">
        <q-card-section class="row items-center justify-between q-pa-md">
          <div class="row items-center">
            <div class="hero-date-avatar avatar-purple q-mr-sm">
              <q-icon name="history" size="18px" />
            </div>
            <div>
              <div
                class="text-subtitle1 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                Daily Updates History
              </div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Work log notes, progress reports, and blockers logged for this task.
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div v-if="historyLoading" class="column items-center q-pa-xl">
            <q-spinner color="primary" size="32px" />
            <div
              class="text-caption q-mt-sm"
              :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
            >
              Loading updates...
            </div>
          </div>

          <q-banner v-else-if="historyError" class="bg-negative text-white" rounded>
            {{ historyError }}
            <template #action>
              <q-btn flat no-caps label="Retry" @click="loadHistory(task.task_id)" />
            </template>
          </q-banner>

          <q-card
            v-else-if="workLogs.length === 0"
            flat
            bordered
            :dark="$q.dark.isActive"
            class="rounded-borders"
          >
            <q-card-section class="column items-center q-pa-xl">
              <q-avatar
                size="52px"
                :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                :text-color="$q.dark.isActive ? 'grey-4' : 'grey-6'"
                icon="event_note"
              />
              <div
                class="text-body2 q-mt-md"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
              >
                No daily updates recorded for this task yet.
              </div>
              <q-btn
                outline
                no-caps
                color="primary"
                label="Log First Update"
                icon="edit_note"
                class="q-mt-md"
                @click="updateDialog = true"
              />
            </q-card-section>
          </q-card>

          <q-list v-else bordered separator :dark="$q.dark.isActive" class="rounded-borders">
            <q-item v-for="log in workLogs" :key="log.log_id" class="q-py-md">
              <q-item-section avatar top>
                <div class="hero-date-avatar avatar-purple">
                  <q-icon name="trending_up" size="18px" />
                </div>
              </q-item-section>

              <q-item-section>
                <q-item-label
                  class="text-weight-bold"
                  :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                >
                  {{ formatHistoryDate(log.log_date) }}
                </q-item-label>

                <q-item-label
                  caption
                  class="q-mt-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                >
                  {{ formatHours(log.hours_logged) }} worked · {{ Number(log.progress_logged) }}%
                  progress
                </q-item-label>

                <q-item-label
                  class="q-mt-sm text-body2"
                  :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
                >
                  {{ log.notes }}
                </q-item-label>

                <q-item-label
                  v-if="log.blockers"
                  caption
                  class="text-negative q-mt-xs text-weight-medium"
                >
                  <q-icon name="warning_amber" size="15px" class="q-mr-xs" />
                  {{ log.blockers }}
                </q-item-label>
              </q-item-section>

              <q-item-section side top>
                <span :class="['status-chip', `status-${log.status.toLowerCase()}`]">
                  {{ statusLabel(log.status) }}
                </span>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>

    <!-- Task ID exists but task doesn't -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="search_off" size="50px" :color="$q.dark.isActive ? 'grey-6' : 'grey-5'" />
      <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
        Task not found
      </div>

      <q-btn
        flat
        no-caps
        color="primary"
        label="Back to Task Specs"
        class="q-mt-md"
        @click="router.push('/app/resource-dashboard/task-details')"
      />
    </div>

    <DailyProgressDialog v-model="updateDialog" :task="task" @save="saveDailyUpdate" />

    <!-- STOP SESSION DIALOG -->
    <q-dialog v-model="showStopSessionDialog" persistent>
      <q-card :dark="$q.dark.isActive" style="width: 480px; max-width: 92vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">Stop Working Session</div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <div>
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-weight-bold">Progress (%) *</div>
              <div class="row items-center q-gutter-xs">
                <span class="text-caption text-grey-6">Status:</span>
                <q-chip
                  dense
                  square
                  :class="['status-chip', getTaskStatusClass(getStatusFromProgress(stopSessionForm.progress_logged))]"
                  class="text-weight-bold"
                  style="font-size: 11px; height: 20px"
                >
                  {{ formatStatusLabel(getStatusFromProgress(stopSessionForm.progress_logged)) }}
                </q-chip>
              </div>
            </div>
            <q-input
              v-model.number="stopSessionForm.progress_logged"
              type="number"
              min="0"
              max="100"
              outlined
              dense
            />
          </div>
          <q-input
            v-model="stopSessionForm.notes"
            type="textarea"
            label="Session Notes / Summary *"
            outlined
            dense
            rows="3"
          />
          <q-input
            v-model="stopSessionForm.blockers"
            type="textarea"
            label="Blockers (optional)"
            outlined
            dense
            rows="2"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Stop & Log Work"
            :loading="sessionStore.loading"
            :disable="!stopSessionForm.notes.trim()"
            @click="confirmStopSession"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <UpdateTaskDialog
      v-model="updateTaskDialog"
      :task="selectedTaskForUpdate"
      :is-self-assigned="isSelfAssigned(selectedTaskForUpdate)"
      @save="saveTaskSpecUpdate"
    />

    <!-- CREATE TASK DIALOG -->
    <q-dialog v-model="createDialog" persistent>
      <q-card :dark="$q.dark.isActive" style="width: 520px; max-width: 92vw">
        <q-card-section class="q-pb-md">
          <div class="row items-center no-wrap">
            <q-avatar size="42px" color="primary" text-color="white" icon="add_task" />

            <div class="q-ml-md">
              <div
                class="text-h6 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                Create Task
              </div>
              <div
                class="text-caption q-mt-xs"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
              >
                Add a task directly from the task specs page.
              </div>
            </div>

            <q-space />

            <q-btn
              flat
              round
              dense
              icon="close"
              :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
              @click="createDialog = false"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-lg">
          <div class="column q-gutter-y-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="createForm.project_id"
                  :options="projectOptionsForCreate"
                  option-label="name"
                  option-value="project_id"
                  emit-value
                  map-options
                  label="Project *"
                  outlined
                  dense
                  options-dense
                  :loading="loadingCreateProjects"
                >
                  <template #prepend>
                    <q-icon name="folder" :color="$q.dark.isActive ? 'grey-4' : 'grey-7'" />
                  </template>
                </q-select>
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input v-model="createForm.title" label="Task Title *" outlined dense>
                  <template #prepend>
                    <q-icon name="task" :color="$q.dark.isActive ? 'grey-4' : 'grey-7'" />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="createForm.description"
                  label="Description"
                  type="textarea"
                  outlined
                  dense
                  rows="3"
                  autogrow
                >
                  <template #prepend>
                    <q-icon name="description" :color="$q.dark.isActive ? 'grey-4' : 'grey-7'" />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="createForm.priority"
                  :options="priorityOptions"
                  label="Priority"
                  outlined
                  dense
                  options-dense
                >
                  <template #prepend>
                    <q-icon name="flag" :color="$q.dark.isActive ? 'grey-4' : 'grey-7'" />
                  </template>
                </q-select>
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input v-model="createForm.deadline" label="Deadline" type="date" outlined dense>
                  <template #prepend>
                    <q-icon
                      name="event_available"
                      :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
                    />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model.number="createForm.expected_effort"
                  label="Expected Effort (hours) *"
                  type="number"
                  min="0"
                  step="0.5"
                  outlined
                  dense
                >
                  <template #prepend>
                    <q-icon name="schedule" :color="$q.dark.isActive ? 'grey-4' : 'grey-7'" />
                  </template>
                </q-input>
              </div>
            </div>

            <q-banner
              v-if="!canCreateTask"
              dense
              rounded
              :class="$q.dark.isActive ? 'bg-purple-10 text-purple-2' : 'bg-blue-1 text-primary'"
            >
              <template #avatar>
                <q-icon name="info" />
              </template>
              Project, task title and expected effort are required.
            </q-banner>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Cancel"
            :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
            @click="createDialog = false"
          />

          <q-btn
            color="primary"
            unelevated
            no-caps
            icon="add_task"
            label="Create Task"
            :loading="creatingTask"
            :disable="!canCreateTask"
            @click="createTask"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  createWorkLogApi,
  createTaskApi,
  getProjectsApi,
  getTasksApi,
  getWorkLogsApi,
  updateTaskApi,
  type CreateWorkLogPayload,
  type Project,
  type Task,
  type WorkLog,
} from '@/services/api';

import { Notify, useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { useSessionStore } from '@/stores/session';

import type { ResourceTask } from '@/components/tasks/task-types';
import DailyProgressDialog from '@/components/tasks/DailyProgressDialog.vue';
import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import { formatDate, formatHours, formatNumber } from '@/utils/formatters';
import {
  isOverdue,
  isTaskOverdue,
  getStatusFromProgress,
  getTaskStatusClass,
  formatStatusLabel,
} from '@/utils/taskHelpers';

const $q = useQuasar();
const authStore = useAuthStore();
const viewMode = ref<'board' | 'table'>('board');

type UserLike = { user_id?: number | string; id?: number | string; userId?: number | string };
type TaskLike = {
  created_by?: number | string;
  createdBy?: number | string;
  created_by_id?: number | string;
  isSelfAssigned?: boolean;
};

function getCurrentUserId(): number | null {
  const u = (authStore.user || authStore.currentUser) as UserLike | null;
  if (u) {
    const id = u.user_id ?? u.id ?? u.userId;
    if (id) return Number(id);
  }
  try {
    const rawAuth = sessionStorage.getItem('auth');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth) as { user?: UserLike };
      const id = parsed?.user?.user_id ?? parsed?.user?.id ?? parsed?.user?.userId;
      if (id) return Number(id);
    }
    const rawUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser) as UserLike;
      const id = parsed?.user_id ?? parsed?.id ?? parsed?.userId;
      if (id) return Number(id);
    }
  } catch {
    // ignore
  }
  return null;
}

function isSelfAssigned(item: Task | ResourceTask | null | undefined): boolean {
  if (!item) return false;
  const t = item as TaskLike;
  if (typeof t.isSelfAssigned === 'boolean') {
    return t.isSelfAssigned;
  }
  const currentUserId = getCurrentUserId();
  const createdBy = Number(t.created_by ?? t.createdBy ?? t.created_by_id);
  if (currentUserId && createdBy && currentUserId === createdBy) {
    return true;
  }
  return false;
}

const KANBAN_COLUMNS = computed(() => [
  {
    id: 'SCHEDULED',
    title: 'Scheduled',
    headerBg: $q.dark.isActive ? '#1e1b2e' : '#fbf9ff',
    borderColor: $q.dark.isActive ? '#2e2845' : '#ede9fe',
    dotColor: '#8b6fd8',
    badgeBg: $q.dark.isActive ? 'rgba(139, 111, 216, 0.3)' : 'rgba(139, 111, 216, 0.15)',
    badgeColor: $q.dark.isActive ? '#b89bf8' : '#8b6fd8',
    icon: 'schedule',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    headerBg: $q.dark.isActive ? '#182232' : '#f0f7ff',
    borderColor: $q.dark.isActive ? '#1e3048' : '#dbeafe',
    dotColor: '#2e90fa',
    badgeBg: $q.dark.isActive ? 'rgba(46, 144, 250, 0.3)' : 'rgba(46, 144, 250, 0.15)',
    badgeColor: $q.dark.isActive ? '#60a5fa' : '#2e90fa',
    icon: 'autorenew',
  },
  {
    id: 'COMPLETED',
    title: 'Completed',
    headerBg: $q.dark.isActive ? '#14271e' : '#f0fdf4',
    borderColor: $q.dark.isActive ? '#1c3d2c' : '#dcfce7',
    dotColor: '#13ae76',
    badgeBg: $q.dark.isActive ? 'rgba(19, 174, 118, 0.3)' : 'rgba(19, 174, 118, 0.15)',
    badgeColor: $q.dark.isActive ? '#4ade80' : '#13ae76',
    icon: 'check_circle',
  },
]);

const taskColumns = [
  {
    name: 'task',
    label: 'Task',
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'priority',
    label: 'Priority',
    field: 'priority',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: 'deadline',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'progress',
    label: 'Progress',
    field: 'progress',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right' as const,
  },
];

const route = useRoute();
const router = useRouter();

const tasks = ref<Task[]>([]);
const loading = ref(false);
const error = ref('');
const createDialog = ref(false);
const creatingTask = ref(false);
const loadingCreateProjects = ref(false);
const updateDialog = ref(false);
const updateTaskDialog = ref(false);
const workLogs = ref<WorkLog[]>([]);
const historyLoading = ref(false);
const historyError = ref('');
const selectedTaskForUpdate = ref<ResourceTask | null>(null);

const searchQuery = ref('');
const projectFilter = ref<string | null>(null);
const statusFilter = ref<Task['status'] | null>(null);
const priorityFilter = ref<Task['priority'] | null>(null);

const statusOptions: Array<{ label: string; value: Task['status'] | null }> = [
  { label: 'All Statuses', value: null },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const priorityOptions: Array<{ label: string; value: Task['priority'] | null }> = [
  { label: 'All Priorities', value: null },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const createProjects = ref<Project[]>([]);

interface CreateTaskForm {
  project_id: number | null;
  title: string;
  description: string;
  priority: Task['priority'];
  deadline: string;
  expected_effort: number;
}

const createForm = ref<CreateTaskForm>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  deadline: '',
  expected_effort: 0,
});

const projectOptionsForCreate = computed(() => createProjects.value);

const hasTaskId = computed(() => Boolean(route.params.id));

const taskId = computed(() => Number(route.params.id));

const task = computed<Task | null>(() => {
  if (!hasTaskId.value) return null;

  return tasks.value.find((item) => item.task_id === taskId.value) ?? null;
});

const projectOptions = computed(() => {
  const uniqueProjects = new Set(
    tasks.value.map((item) => item.project_name || `Project #${item.project_id}`),
  );

  return [...uniqueProjects].sort();
});

const filteredTasks = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();

  return tasks.value.filter((item) => {
    const projectName = item.project_name || `Project #${item.project_id}`;

    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      projectName.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);

    const matchesProject = !projectFilter.value || projectName === projectFilter.value;

    const matchesStatus = !statusFilter.value || item.status === statusFilter.value;

    const matchesPriority = !priorityFilter.value || item.priority === priorityFilter.value;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });
});

const tasksByStatus = computed(() => {
  const map: Record<string, Task[]> = {
    SCHEDULED: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  };

  filteredTasks.value.forEach((item) => {
    const s = item.status && item.status in map ? item.status : 'SCHEDULED';
    const arr = map[s];
    if (arr) {
      arr.push(item);
    }
  });

  return map;
});

const canCreateTask = computed(() => {
  return (
    createForm.value.project_id !== null &&
    createForm.value.title.trim().length > 0 &&
    Number(createForm.value.expected_effort) > 0
  );
});

function resetCreateForm() {
  createForm.value = {
    project_id: null,
    title: '',
    description: '',
    priority: 'MEDIUM',
    deadline: '',
    expected_effort: 0,
  };
}

const sessionStore = useSessionStore();

const isCurrentTaskSessionActive = computed(() => {
  return !!task.value && sessionStore.isTaskSessionActive(task.value.task_id);
});

const showStopSessionDialog = ref(false);
const stopSessionForm = reactive({
  progress_logged: 0,
  notes: '',
  blockers: '',
});

async function handleStartSession(tId: number) {
  if (sessionStore.hasActiveSession && sessionStore.activeTaskId !== tId) {
    Notify.create({
      type: 'warning',
      message: `You already have an active work session on Task #${sessionStore.activeTaskId}. Please stop your current session before starting a new one.`,
      position: 'top-right',
    });
    return;
  }

  try {
    await sessionStore.startSession(tId);
    Notify.create({
      type: 'positive',
      message: 'Session started successfully.',
      position: 'top-right',
    });
    await loadTasks();
  } catch (err) {
    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to start session.',
      position: 'top-right',
    });
  }
}

function promptStopSession() {
  if (!sessionStore.hasActiveSession) return;
  const activeId = sessionStore.activeTaskId;
  const targetTask = tasks.value.find((t) => t.task_id === activeId) || task.value;
  if (targetTask) {
    stopSessionForm.progress_logged = Number(targetTask.progress) || 0;
  } else {
    stopSessionForm.progress_logged = 0;
  }
  stopSessionForm.notes = '';
  stopSessionForm.blockers = '';
  showStopSessionDialog.value = true;
}

async function confirmStopSession() {
  if (!sessionStore.hasActiveSession) return;
  const targetTaskId = sessionStore.activeTaskId;
  try {
    await sessionStore.stopSession({
      progress_logged: Math.min(100, Math.max(0, Number(stopSessionForm.progress_logged) || 0)),
      notes: stopSessionForm.notes.trim(),
      blockers: stopSessionForm.blockers.trim() || null,
    });
    showStopSessionDialog.value = false;
    Notify.create({
      type: 'positive',
      message: 'Session stopped and work logged successfully.',
      position: 'top-right',
    });
    await loadTasks();
    if (task.value && targetTaskId && task.value.task_id === targetTaskId) {
      await loadHistory(targetTaskId);
    }
  } catch (err) {
    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to stop session.',
      position: 'top-right',
    });
  }
}

async function openCreateDialog() {
  createDialog.value = true;

  if (createProjects.value.length === 0) {
    await loadCreateProjects();
  }
}

async function loadCreateProjects() {
  loadingCreateProjects.value = true;

  try {
    createProjects.value = await getProjectsApi();
  } catch (err) {
    console.error('Failed to load resource projects:', err);

    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to load projects.',
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    loadingCreateProjects.value = false;
  }
}

async function createTask() {
  if (!canCreateTask.value) {
    return;
  }

  const projectId = createForm.value.project_id;

  if (projectId === null) {
    return;
  }

  creatingTask.value = true;

  try {
    await createTaskApi({
      project_id: projectId,
      title: createForm.value.title.trim(),
      description: createForm.value.description.trim(),
      priority: createForm.value.priority,
      deadline: createForm.value.deadline || null,
      expected_effort: Number(createForm.value.expected_effort),
    });

    createDialog.value = false;
    resetCreateForm();

    await loadTasks();

    Notify.create({
      type: 'positive',
      message: 'Task created successfully.',
      icon: 'check_circle',
      position: 'top-right',
    });
  } catch (err) {
    console.error('Failed to create task:', err);

    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to create task.',
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    creatingTask.value = false;
  }
}

const remainingHours = computed(() => {
  if (!task.value) return 0;

  return Math.max(Number(task.value.expected_effort) - Number(task.value.actual_effort), 0).toFixed(
    1,
  );
});

watch(taskId, (id) => {
  if (!id) {
    workLogs.value = [];
    historyError.value = '';

    return;
  }

  if (task.value) {
    void loadHistory(id);
  }
});

async function loadTasks() {
  loading.value = true;
  error.value = '';

  try {
    tasks.value = await getTasksApi();

    if (task.value) {
      await loadHistory(task.value.task_id);
    } else if (hasTaskId.value) {
      workLogs.value = [];
      historyError.value = '';
    }
  } catch (err) {
    console.error(err);

    error.value = err instanceof Error ? err.message : 'Failed to load tasks.';
  } finally {
    loading.value = false;
  }
}

function openTask(id: number) {
  void router.push(`/app/resource-dashboard/task-details/${id}`);
}

function mapToResourceTask(item: Task): ResourceTask {
  return {
    id: item.task_id,
    name: item.title,
    project: item.project_name || `Project #${item.project_id}`,
    priority: item.priority,
    status: item.status,
    progress: Number(item.progress) || 0,
    deadline: item.deadline,
    hoursWorked: Number(item.actual_effort) || 0,
    estimatedHours: Number(item.expected_effort) || 0,
    workUpdate: '',
    description: item.description || '',
    created_by: item.created_by,
    isSelfAssigned: isSelfAssigned(item),
  };
}

function openUpdateTaskDialog(item: Task) {
  selectedTaskForUpdate.value = mapToResourceTask(item);
  updateTaskDialog.value = true;
}

async function saveTaskSpecUpdate(payload: {
  id: number;
  expected_effort: number;
  description: string;
}) {
  const existing = tasks.value.find((item) => item.task_id === payload.id);

  if (!existing && (!task.value || task.value.task_id !== payload.id)) {
    return;
  }

  try {
    const updated = await updateTaskApi(payload.id, {
      expected_effort: payload.expected_effort,
      description: payload.description,
    });

    const index = tasks.value.findIndex((item) => item.task_id === updated.task_id);

    if (index !== -1) {
      const prev = tasks.value[index];
      const projName = updated.project_name || prev?.project_name;
      tasks.value[index] = {
        ...prev,
        ...updated,
        ...(projName ? { project_name: projName } : {}),
      };
    }

    updateTaskDialog.value = false;

    Notify.create({
      type: 'positive',
      message: 'Task updated successfully.',
      icon: 'check_circle',
      position: 'top-right',
    });
  } catch (err) {
    console.error('Failed to update task:', err);

    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to update task.',
      icon: 'error',
      position: 'top-right',
    });
  }
}

async function loadHistory(currentTaskId: number) {
  historyLoading.value = true;
  historyError.value = '';

  try {
    workLogs.value = await getWorkLogsApi(currentTaskId);
  } catch (err) {
    console.error('Failed to load task history:', err);

    historyError.value = err instanceof Error ? err.message : 'Failed to load task history.';
  } finally {
    historyLoading.value = false;
  }
}

async function saveDailyUpdate(payload: CreateWorkLogPayload) {
  if (!task.value) return;

  const currentTaskId = task.value.task_id;

  try {
    await createWorkLogApi(currentTaskId, payload);

    await loadTasks();

    await loadHistory(currentTaskId);

    updateDialog.value = false;

    Notify.create({
      type: 'positive',
      message: 'Daily update recorded successfully.',
      icon: 'check_circle',
      position: 'top-right',
    });
  } catch (err) {
    console.error(err);

    error.value = err instanceof Error ? err.message : 'Failed to submit daily progress.';

    Notify.create({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to submit daily progress.',
      icon: 'error',
      position: 'top-right',
    });
  }
}

function formatHistoryDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status: Task['status']) {
  return (
    {
      UNASSIGNED: 'Unassigned',
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
    }[status] || status
  );
}

onMounted(() => {
  void loadTasks();
  void sessionStore.fetchActiveSession();
});
</script>

<style scoped lang="scss">
.task-project-pill,
.task-self-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--wo-primary, #8b6fd8);
  background: rgba(139, 111, 216, 0.12);
  padding: 2px 7px;
  border-radius: 6px;
  max-width: 120px;
}

.task-priority-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  &.priority-low {
    background: #eff6ff;
    color: #1d4ed8;
  }
  &.priority-medium {
    background: rgba(139, 111, 216, 0.12);
    color: #8b6fd8;
  }
  &.priority-high {
    background: #fff7ed;
    color: #c2410c;
  }
  &.priority-critical {
    background: #fef2f2;
    color: #b91c1c;
  }
}

.status-chip {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;

  &.status-scheduled {
    background: rgba(139, 111, 216, 0.12);
    color: #8b6fd8;
  }
  &.status-in_progress {
    background: rgba(46, 144, 250, 0.12);
    color: #2e90fa;
  }
  &.status-completed {
    background: rgba(19, 174, 118, 0.12);
    color: #13ae76;
  }
}

.task-deadline-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
  background: var(--wo-bg-tag, #f1f5f9);
  padding: 2px 7px;
  border-radius: 6px;

  &.deadline-overdue {
    background: #fef2f2;
    color: #ef4444;
  }
}

.hero-date-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.avatar-purple {
    background: rgba(139, 111, 216, 0.12);
    color: var(--wo-primary, #8b6fd8);
  }
  &.avatar-blue {
    background: rgba(46, 144, 250, 0.12);
    color: #2e90fa;
  }
  &.avatar-green {
    background: rgba(19, 174, 118, 0.12);
    color: #13ae76;
  }
  &.avatar-red {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }
}

body.body--dark {
  .task-project-pill,
  .task-self-pill,
  .priority-medium,
  .status-scheduled {
    background: rgba(139, 111, 216, 0.18) !important;
    color: #b89bf8 !important;
  }

  .priority-low {
    background: rgba(46, 144, 250, 0.18) !important;
    color: #60a5fa !important;
  }
  .priority-high {
    background: rgba(249, 115, 22, 0.18) !important;
    color: #fb923c !important;
  }
  .priority-critical {
    background: rgba(239, 68, 68, 0.18) !important;
    color: #f87171 !important;
  }
  .status-in_progress {
    background: rgba(46, 144, 250, 0.18) !important;
    color: #60a5fa !important;
  }
  .status-completed {
    background: rgba(39, 174, 96, 0.18) !important;
    color: #4ade80 !important;
  }
  .task-deadline-tag {
    background: #222938 !important;
    color: #94a3b8 !important;

    &.deadline-overdue {
      background: rgba(239, 68, 68, 0.18) !important;
      color: #f87171 !important;
    }
  }
  .hero-date-avatar {
    &.avatar-purple {
      background: rgba(139, 111, 216, 0.18) !important;
      color: #b89bf8 !important;
    }
    &.avatar-blue {
      background: rgba(46, 144, 250, 0.18) !important;
      color: #60a5fa !important;
    }
    &.avatar-green {
      background: rgba(39, 174, 96, 0.18) !important;
      color: #4ade80 !important;
    }
    &.avatar-red {
      background: rgba(239, 68, 68, 0.18) !important;
      color: #f87171 !important;
    }
  }
}
</style>
