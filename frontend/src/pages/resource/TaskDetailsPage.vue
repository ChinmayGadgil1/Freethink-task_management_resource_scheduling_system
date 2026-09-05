<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg resource-tasks-page">
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
      <div v-if="viewMode === 'board'" class="full-width overflow-auto q-pb-md resource-kanban-board">
        <div class="row q-col-gutter-md">
          <div v-for="col in KANBAN_COLUMNS" :key="col.id" class="col-12 col-md-4">
            <q-card
              flat
              bordered
              :dark="$q.dark.isActive"
              class="rounded-borders full-height column no-wrap justify-between kanban-column-card"
            >
              <div class="col-grow column no-wrap kanban-column-body">
                <!-- Column Header -->
                <q-card-section
                  class="row items-center justify-between q-py-sm kanban-column-header"
                  :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2'"
                >
                  <div class="row items-center q-gutter-xs">
                    <span
                      style="width: 8px; height: 8px; border-radius: 50%"
                      :style="{ background: col.dotColor }"
                    />
                    <span class="text-subtitle2 text-weight-bold">{{ col.title }}</span>
                    <q-badge
                      :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                      :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                      class="text-weight-bold"
                    >
                      {{ tasksByStatus[col.id]?.length || 0 }}
                    </q-badge>
                  </div>

                  <q-btn
                    flat
                    round
                    dense
                    icon="add"
                    size="sm"
                    title="Add task in this column"
                    @click="openCreateDialog"
                  >
                    <q-tooltip>Add {{ col.title }} Task</q-tooltip>
                  </q-btn>
                </q-card-section>

                <q-separator :dark="$q.dark.isActive" class="kanban-column-separator" />

                <!-- Column Tasks Cards List -->
                <q-card-section class="q-pa-xs column no-wrap q-gutter-xs col-grow kanban-tasks-scroll-area">
                  <q-card
                    v-for="item in getPaginatedTasks(col.id)"
                    :key="item.task_id"
                    flat
                    bordered
                    :dark="$q.dark.isActive"
                    class="task-board-card q-pa-sm rounded-borders cursor-pointer overflow-hidden column justify-between"
                    :class="$q.dark.isActive ? 'hover-bg-dark' : 'hover-bg-light'"
                    @click="openTask(item.task_id)"
                  >
                <!-- Top Info Section -->
                <div>
                  <!-- Card Top Row: Project, Priority & Self-Assigned Badges -->
                  <div class="row items-center q-gutter-xs wrap overflow-hidden q-mb-xs">
                    <q-chip
                      dense
                      square
                      size="sm"
                      :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                      :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                      icon="folder"
                      :label="item.project_name || `Project #${item.project_id}`"
                      class="text-weight-bold ellipsis"
                      style="max-width: 140px"
                    />

                    <q-chip
                      dense
                      square
                      size="sm"
                      :color="priorityBgColor(item.priority)"
                      :text-color="priorityTextColor(item.priority)"
                      :label="item.priority"
                      class="text-weight-bold"
                    />

                    <q-chip
                      v-if="isSelfAssigned(item)"
                      dense
                      square
                      size="sm"
                      :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                      :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                      icon="person"
                      label="Self-assigned"
                      class="text-weight-bold"
                    />
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
                </div>

                <!-- Bottom Info Section (Progress & Actions) -->
                <div>
                  <!-- Progress & Effort Bar -->
                  <div class="q-pt-sm">
                    <div class="row items-center justify-between no-wrap text-caption q-mb-xs">
                      <span
                        class="text-caption text-weight-bold"
                        :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
                      >
                        {{ Number(item.progress) || 0 }}%
                      </span>
                      <span
                        class="text-caption"
                        :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'"
                      >
                        {{ formatHours(item.expected_effort) }} effort
                      </span>
                    </div>
                    <q-linear-progress
                      rounded
                      size="5px"
                      :value="(Number(item.progress) || 0) / 100"
                      :color="col.id === 'COMPLETED' ? 'positive' : 'primary'"
                      :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                    />
                  </div>

                  <div class="q-my-xs" />

                  <!-- Card Bottom Row: Deadline & Action Buttons -->
                  <div class="row items-center justify-between no-wrap">
                    <q-chip
                      dense
                      square
                      size="sm"
                      :color="
                        isTaskOverdue(item)
                          ? $q.dark.isActive
                            ? 'red-10'
                            : 'red-1'
                          : $q.dark.isActive
                            ? 'grey-9'
                            : 'grey-2'
                      "
                      :text-color="
                        isTaskOverdue(item)
                          ? $q.dark.isActive
                            ? 'red-2'
                            : 'negative'
                          : $q.dark.isActive
                            ? 'grey-4'
                            : 'grey-7'
                      "
                      icon="event"
                      :label="item.deadline ? formatDate(item.deadline) : 'TBD'"
                      class="text-weight-medium"
                    />

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
                </div>
              </q-card>

                  <!-- Empty State for Column -->
                  <div
                    v-if="!tasksByStatus[col.id]?.length"
                    class="q-pa-md text-center text-grey-5 column items-center justify-center col-grow"
                  >
                    <q-icon
                      :name="col.icon"
                      size="24px"
                      class="q-mb-xs"
                      :color="$q.dark.isActive ? 'grey-6' : 'grey-4'"
                    />
                    <div
                      class="text-caption"
                      :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'"
                    >
                      No {{ col.title.toLowerCase() }} tasks
                    </div>
                  </div>
                </q-card-section>
              </div>

              <!-- Column Pagination Footer -->
              <div v-if="(tasksByStatus[col.id]?.length || 0) > 0" class="kanban-column-footer">
                <q-separator :dark="$q.dark.isActive" />
                <div
                  class="row items-center justify-between no-wrap q-px-sm q-py-xs"
                  :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2'"
                >
                  <div class="row items-center no-wrap q-gutter-xs">
                    <span
                      class="text-caption text-grey-6 text-weight-medium"
                      style="font-size: 11px"
                    >
                      {{ (getColumnPage(col.id) - 1) * getColumnPageSize(col.id) + 1 }}-{{
                        Math.min(
                          getColumnPage(col.id) * getColumnPageSize(col.id),
                          tasksByStatus[col.id]?.length || 0,
                        )
                      }}
                      of {{ tasksByStatus[col.id]?.length || 0 }}
                    </span>

                    <q-select
                      :model-value="getColumnPageSize(col.id)"
                      :options="pageSizeOptions"
                      :display-value="
                        getColumnPageSize(col.id) === 999
                          ? 'All'
                          : getColumnPageSize(col.id) + '/col'
                      "
                      dense
                      borderless
                      emit-value
                      map-options
                      options-dense
                      :dark="$q.dark.isActive"
                      style="font-size: 11px; width: 62px"
                      class="q-ml-xs text-caption text-weight-bold"
                      :class="$q.dark.isActive ? 'text-purple-2' : 'text-primary'"
                      @update:model-value="(val: number) => setColumnPageSize(col.id, val)"
                    >
                      <q-tooltip>Tasks shown per page in this column</q-tooltip>
                    </q-select>
                  </div>

                  <q-pagination
                    :model-value="getColumnPage(col.id)"
                    :max="getColumnTotalPages(col.id)"
                    :max-pages="3"
                    size="xs"
                    dense
                    round
                    direction-links
                    :disable="getColumnTotalPages(col.id) <= 1"
                    :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
                    active-color="primary"
                    active-text-color="white"
                    @update:model-value="(val: number) => setColumnPage(col.id, val)"
                  />
                </div>
              </div>
            </q-card>
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
                <q-chip
                  v-if="isSelfAssigned(props.row)"
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  icon="person"
                  label="Self-assigned"
                  class="text-weight-bold"
                />
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
              <q-chip
                dense
                square
                size="sm"
                :color="priorityBgColor(props.row.priority)"
                :text-color="priorityTextColor(props.row.priority)"
                :label="props.row.priority"
                class="text-weight-bold"
              />
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                size="sm"
                :color="statusBgColor(props.row.status)"
                :text-color="statusTextColor(props.row.status)"
                :label="statusLabel(props.row.status)"
                class="text-weight-bold"
              />
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
                  >
                    {{ Number(props.row.progress) }}%
                  </span>
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

          <!-- Main Hero Content Row -->
          <div class="row items-start justify-between q-col-gutter-lg">
            <!-- Left Column: Chips, Title, Subtitle, Description -->
            <div class="col-12 col-md-7">
              <!-- Top Row Chips (Task ID, Status, Priority, Risk Badges, Self-assigned) -->
              <div class="row items-center q-gutter-xs wrap overflow-hidden q-mb-sm">
                <q-chip
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  :label="`#${task.task_id}`"
                  class="text-weight-bold"
                />

                <q-chip
                  dense
                  square
                  size="sm"
                  :color="statusBgColor(task.status)"
                  :text-color="statusTextColor(task.status)"
                  :label="statusLabel(task.status)"
                  class="text-weight-bold"
                />

                <q-chip
                  dense
                  square
                  size="sm"
                  :color="priorityBgColor(task.priority)"
                  :text-color="priorityTextColor(task.priority)"
                  :label="task.priority"
                  class="text-weight-bold"
                />

                <q-chip
                  v-if="task.is_deadline_at_risk"
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'red-10' : 'red-1'"
                  :text-color="$q.dark.isActive ? 'red-2' : 'negative'"
                  icon="warning"
                  label="Deadline Risk"
                  class="text-weight-bold"
                />

                <q-chip
                  v-if="task.is_schedule_at_risk"
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'orange-10' : 'orange-1'"
                  :text-color="$q.dark.isActive ? 'orange-2' : 'orange-9'"
                  icon="schedule"
                  label="Schedule Risk"
                  class="text-weight-bold"
                />

                <q-chip
                  v-if="isSelfAssigned(task)"
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  icon="person"
                  label="Self-assigned"
                  class="text-weight-bold"
                />
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

              <!-- Co-assigned team members collaborating on this task spec -->
              <div
                v-if="task.assigned_resource_ids && task.assigned_resource_ids.length > 0"
                class="q-mt-md"
              >
                <div
                  class="text-caption text-weight-bold q-mb-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                >
                  ASSIGNED TEAM MEMBERS (CO-ASSIGNEES)
                </div>
                <div class="row items-center q-gutter-xs wrap">
                  <q-chip
                    v-for="rId in task.assigned_resource_ids"
                    :key="rId"
                    dense
                    square
                    :color="
                      Number(rId) === getCurrentUserId()
                        ? $q.dark.isActive
                          ? 'purple-10'
                          : 'purple-1'
                        : $q.dark.isActive
                          ? 'grey-9'
                          : 'grey-2'
                    "
                    :text-color="
                      Number(rId) === getCurrentUserId()
                        ? $q.dark.isActive
                          ? 'purple-2'
                          : 'primary'
                        : $q.dark.isActive
                          ? 'grey-3'
                          : 'grey-8'
                    "
                    class="text-weight-medium"
                  >
                    <q-avatar
                      size="20px"
                      :color="Number(rId) === getCurrentUserId() ? 'primary' : 'grey-6'"
                      text-color="white"
                    >
                      {{ getInitials(resolveMemberName(Number(rId)), 'R') }}
                    </q-avatar>
                    {{ resolveMemberName(Number(rId)) }}
                    <!-- Highlight (You) badge if current logged-in resource -->
                    <span
                      v-if="Number(rId) === getCurrentUserId()"
                      class="q-ml-xs text-weight-bold text-primary"
                    >
                      (You)
                    </span>
                  </q-chip>
                </div>
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
                      <q-avatar
                        size="34px"
                        rounded
                        :color="
                          isTaskOverdue(task)
                            ? $q.dark.isActive
                              ? 'red-10'
                              : 'red-1'
                            : $q.dark.isActive
                              ? 'blue-10'
                              : 'blue-1'
                        "
                        :text-color="
                          isTaskOverdue(task)
                            ? $q.dark.isActive
                              ? 'red-2'
                              : 'negative'
                            : $q.dark.isActive
                              ? 'blue-2'
                              : 'blue-8'
                        "
                        icon="event_available"
                      />
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
              <div class="column gap-sm q-mt-md full-width" style="max-width: 320px">
                <!-- Primary Actions Row -->
                <div class="row q-col-gutter-sm">
                  <div class="col-12">
                    <q-btn
                      v-if="!isCurrentTaskSessionActive"
                      unelevated
                      no-caps
                      color="positive"
                      icon="play_arrow"
                      label="Start"
                      class="full-width text-weight-bold"
                      style="border-radius: 8px; height: 40px"
                      :loading="sessionStore.loading"
                      @click="handleStartSession(task.task_id)"
                    />
                    <q-btn
                      v-else
                      unelevated
                      no-caps
                      color="negative"
                      icon="stop"
                      label="Stop"
                      class="full-width text-weight-bold"
                      style="border-radius: 8px; height: 40px"
                      :loading="sessionStore.loading"
                      @click="promptStopSession"
                    />
                  </div>
                  <!-- <div class="col-6">
                    <q-btn
                      unelevated
                      no-caps
                      color="primary"
                      icon="edit_note"
                      label="Add Update"
                      class="full-width text-weight-bold"
                      style="border-radius: 8px; height: 40px"
                      @click="updateDialog = true"
                    />
                  </div> -->
                </div>

                <!-- Secondary Action Row -->
                <div class="row">
                  <div class="col-12">
                    <q-btn
                      outline
                      no-caps
                      color="primary"
                      icon="edit"
                      label="Edit Task Details"
                      class="full-width text-weight-bold"
                      style="border-radius: 8px; height: 40px"
                      @click="openUpdateTaskDialog(task)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- 2. TASK PROGRESS & EFFORT BREAKDOWN CARD -->
      <q-card
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders q-mb-lg overflow-hidden"
      >
        <q-card-section class="row items-center justify-between q-pa-md">
          <div class="row items-center">
            <q-avatar
              size="34px"
              rounded
              :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
              icon="insights"
              class="q-mr-sm"
            />
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
          <q-chip
            dense
            square
            size="sm"
            :color="statusBgColor(task.status)"
            :text-color="statusTextColor(task.status)"
            :label="`${Number(task.progress)}% Completed`"
            class="text-weight-bold"
          />
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
              <span class="text-h6 text-primary text-weight-bolder">
                {{ Number(task.progress) }}%
              </span>
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
                  <q-avatar
                    size="36px"
                    rounded
                    :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                    :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                    icon="schedule"
                  />
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
                  <q-avatar
                    size="36px"
                    rounded
                    :color="$q.dark.isActive ? 'blue-10' : 'blue-1'"
                    :text-color="$q.dark.isActive ? 'blue-2' : 'blue-8'"
                    icon="timer"
                  />
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
                  <q-avatar
                    size="36px"
                    rounded
                    :color="$q.dark.isActive ? 'green-10' : 'green-1'"
                    :text-color="$q.dark.isActive ? 'green-2' : 'green-8'"
                    icon="hourglass_empty"
                  />
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
                      {{ formatNumber(remainingHours) }}
                      <span class="text-caption text-weight-bold">hrs</span>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- 3. DAILY UPDATES & START/STOP SESSION LOG SECTION -->
      <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders overflow-hidden">
        <q-card-section class="row items-center justify-between q-pa-md">
          <div class="row items-center">
            <q-avatar
              size="34px"
              rounded
              :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
              icon="history"
              class="q-mr-sm"
            />
            <div>
              <div
                class="text-subtitle1 text-weight-bold"
                :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
              >
                Daily Updates & Session History
              </div>
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Collaborative timeline of start/stop sessions, work notes, and progress logged by
                all assigned resources.
              </div>
            </div>
          </div>
          <!-- Total updates count chip -->
          <q-chip
            v-if="workLogs.length > 0"
            dense
            square
            :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
            :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'"
            class="text-caption text-weight-bold"
          >
            {{ workLogs.length }} update{{ workLogs.length === 1 ? '' : 's' }}
          </q-chip>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <!-- Live Active Session Banner for co-assigned resources currently working on this task -->
          <q-banner
            v-if="otherActiveSessions.length > 0"
            class="bg-blue-1 text-primary q-mb-md rounded-borders"
            rounded
          >
            <template #avatar>
              <q-spinner-dots color="primary" size="24px" />
            </template>
            <div class="text-weight-medium text-caption">
              <!-- Render notice for each co-assignee with an active timer -->
              <span v-for="s in otherActiveSessions" :key="s.session_id" class="q-mr-md">
                🟢 <b>{{ s.user_name || resolveMemberName(s.user_id) }}</b> is currently working on
                this task (started {{ formatHistoryTime(s.start_time) }}).
              </span>
            </div>
          </q-banner>

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

          <!-- List of work logs & session updates from all assigned co-resources -->
          <q-list v-else bordered separator :dark="$q.dark.isActive" class="rounded-borders">
            <q-item v-for="log in workLogs" :key="log.log_id" class="q-py-md">
              <!-- Author Avatar with Initials -->
              <q-item-section avatar top style="min-width: 40px">
                <q-avatar
                  size="36px"
                  :color="
                    Number(log.user_id) === getCurrentUserId()
                      ? $q.dark.isActive
                        ? 'purple-10'
                        : 'purple-1'
                      : $q.dark.isActive
                        ? 'teal-10'
                        : 'teal-1'
                  "
                  :text-color="
                    Number(log.user_id) === getCurrentUserId()
                      ? $q.dark.isActive
                        ? 'purple-2'
                        : 'primary'
                      : $q.dark.isActive
                        ? 'teal-2'
                        : 'teal-9'
                  "
                  class="text-weight-bold"
                >
                  {{ getInitials(log.author_name || resolveMemberName(log.user_id), 'U') }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <!-- Header row: Author name, You badge, timestamp, status -->
                <div class="row items-center justify-between no-wrap">
                  <div class="row items-center q-gutter-xs wrap">
                    <!-- Author Resource Name -->
                    <span
                      class="text-weight-bold"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    >
                      {{ log.author_name || resolveMemberName(log.user_id) }}
                    </span>

                    <!-- (You) Badge for current user's logs -->
                    <q-badge
                      v-if="Number(log.user_id) === getCurrentUserId()"
                      color="primary"
                      label="You"
                      class="text-weight-bold q-ml-xs"
                    />

                    <span class="text-caption text-grey-5">·</span>

                    <!-- Date & time of the update -->
                    <span class="text-caption text-grey-6 text-weight-medium">
                      {{ formatHistoryDate(log.log_date || log.created_at) }}
                    </span>
                  </div>

                  <!-- Task status associated with this update -->
                  <q-chip
                    dense
                    square
                    size="sm"
                    :color="statusBgColor(log.status)"
                    :text-color="statusTextColor(log.status)"
                    :label="statusLabel(log.status)"
                    class="text-weight-bold"
                  />
                </div>

                <!-- Hours logged & progress metrics -->
                <div class="row items-center gap-xs q-mt-xs text-caption text-grey-7">
                  <q-icon name="timer" size="14px" color="primary" class="q-mr-xs" />
                  <span
                    class="text-weight-medium"
                    :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
                  >
                    {{ formatHours(log.hours_logged) }} logged
                  </span>
                  <span class="q-mx-xs">·</span>
                  <span class="text-weight-medium text-primary"
                    >{{ Number(log.progress_logged) }}% progress</span
                  >
                </div>

                <!-- Session summary / update notes -->
                <div
                  v-if="log.notes"
                  class="q-mt-sm text-body2"
                  :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
                  style="white-space: pre-wrap; word-break: break-word"
                >
                  {{ log.notes }}
                </div>

                <!-- Blocker details if reported -->
                <div
                  v-if="log.blockers"
                  class="row items-center text-negative q-mt-xs text-weight-medium text-caption"
                >
                  <q-icon name="warning_amber" size="15px" class="q-mr-xs" />
                  <span>Blocker: {{ log.blockers }}</span>
                </div>
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
              <div
                class="text-caption text-weight-bold"
                :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
              >
                Progress
                <span class="text-primary text-weight-bold">
                  {{ stopSessionForm.progress_logged }}%
                </span>
              </div>
              <div class="row items-center q-gutter-xs">
                <span class="text-caption text-grey-6 text-weight-medium">Status:</span>
                <q-chip
                  dense
                  square
                  size="sm"
                  :color="statusBgColor(getStatusFromProgress(stopSessionForm.progress_logged))"
                  :text-color="
                    statusTextColor(getStatusFromProgress(stopSessionForm.progress_logged))
                  "
                  :label="formatStatusLabel(getStatusFromProgress(stopSessionForm.progress_logged))"
                  class="text-weight-bold"
                />
              </div>
            </div>
            <q-slider
              v-model="stopSessionForm.progress_logged"
              :min="0"
              :max="100"
              :step="5"
              color="primary"
              label
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
                <q-input
                  v-model="createForm.deadline"
                  label="Deadline"
                  type="date"
                  outlined
                  dense
                  stack-label
                  :rules="[
                    (val) =>
                      !val ||
                      !selectedCreateProject?.start_date ||
                      val >= selectedCreateProject.start_date ||
                      `Deadline cannot be earlier than project start date (${selectedCreateProject.start_date})`,
                    (val) =>
                      !val ||
                      !selectedCreateProject?.deadline ||
                      val <= selectedCreateProject.deadline ||
                      `Deadline cannot be later than project deadline (${selectedCreateProject.deadline})`,
                  ]"
                >
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  createWorkLogApi,
  createTaskApi,
  getProjectsApi,
  getTasksApi,
  getWorkLogsApi,
  getTaskActiveSessionsApi, // Added API to fetch live active sessions of co-assigned resources
  updateTaskApi,
} from '@/services/api';
import type {
  CreateWorkLogPayload,
  Project,
  Task,
  TaskSession, // Added TaskSession type for active session states
  WorkLog,
} from '@/services/api';

import { Notify, useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { useSessionStore } from '@/stores/session';

import type { ResourceTask } from '@/components/tasks/task-types';
import DailyProgressDialog from '@/components/tasks/DailyProgressDialog.vue';
import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import { formatDate, formatHours, formatNumber, getInitials } from '@/utils/formatters'; // Added getInitials for avatar rendering
import {
  isOverdue,
  isTaskOverdue,
  getStatusFromProgress,
  formatStatusLabel,
} from '@/utils/taskHelpers';

const $q = useQuasar();
const authStore = useAuthStore();
const viewMode = ref<'board' | 'table'>('board');

// Active working sessions currently in progress on this task by any assigned resource
const activeCoAssigneeSessions = ref<
  Array<TaskSession & { user_name?: string; user_email?: string }>
>([]);

// Map of resource user ID to display name populated from logs and sessions
const resourceNamesMap = ref<Record<number, string>>({});

// Compute active sessions from other co-assignees (excluding current user's session if already active)
const otherActiveSessions = computed(() => {
  const currentUserId = getCurrentUserId();
  return activeCoAssigneeSessions.value.filter((s) => Number(s.user_id) !== currentUserId);
});

// Resolve a resource's readable name by their user_id (supports optional/nullable ID)
function resolveMemberName(userId?: number | null): string {
  if (userId && resourceNamesMap.value[userId]) {
    return resourceNamesMap.value[userId];
  }
  const currentUserId = getCurrentUserId();
  if (currentUserId && userId && userId === currentUserId) {
    const u = authStore.user as UserLike | null;
    return u?.name || 'You';
  }
  return userId ? `Resource #${userId}` : 'Team Member';
}

// Format time for active session banner (e.g., '10:30 AM')
function formatHistoryTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? String(dateStr)
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type UserLike = {
  user_id?: number | string;
  id?: number | string;
  userId?: number | string;
  name?: string;
};
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
    const rawUser = sessionStorage.getItem('user');
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

function priorityBgColor(priority: string | null | undefined): string {
  const p = (priority || '').toUpperCase();
  if ($q.dark.isActive) {
    if (p === 'CRITICAL') return 'red-10';
    if (p === 'HIGH') return 'orange-10';
    if (p === 'MEDIUM') return 'purple-10';
    return 'blue-10';
  }
  if (p === 'CRITICAL') return 'red-1';
  if (p === 'HIGH') return 'orange-1';
  if (p === 'MEDIUM') return 'purple-1';
  return 'blue-1';
}

function priorityTextColor(priority: string | null | undefined): string {
  const p = (priority || '').toUpperCase();
  if ($q.dark.isActive) {
    if (p === 'CRITICAL') return 'red-2';
    if (p === 'HIGH') return 'orange-2';
    if (p === 'MEDIUM') return 'purple-2';
    return 'blue-2';
  }
  if (p === 'CRITICAL') return 'red-9';
  if (p === 'HIGH') return 'orange-9';
  if (p === 'MEDIUM') return 'purple-9';
  return 'blue-9';
}

function statusBgColor(status: string | null | undefined): string {
  const s = (status || '').toUpperCase();
  if ($q.dark.isActive) {
    if (s === 'COMPLETED') return 'green-10';
    if (s === 'IN_PROGRESS') return 'blue-10';
    return 'purple-10';
  }
  if (s === 'COMPLETED') return 'green-1';
  if (s === 'IN_PROGRESS') return 'blue-1';
  return 'purple-1';
}

function statusTextColor(status: string | null | undefined): string {
  const s = (status || '').toUpperCase();
  if ($q.dark.isActive) {
    if (s === 'COMPLETED') return 'green-2';
    if (s === 'IN_PROGRESS') return 'blue-2';
    return 'purple-2';
  }
  if (s === 'COMPLETED') return 'green-9';
  if (s === 'IN_PROGRESS') return 'blue-9';
  return 'purple-9';
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

const columnTasksPerPage = reactive<Record<string, number>>({
  SCHEDULED: 10,
  IN_PROGRESS: 10,
  COMPLETED: 10,
});

const pageSizeOptions = [
  { label: '5 tasks', value: 5 },
  { label: '10 tasks (Default)', value: 10 },
  { label: '15 tasks', value: 15 },
  { label: '20 tasks', value: 20 },
  { label: 'All tasks', value: 999 },
];

const columnPages = reactive<Record<string, number>>({
  SCHEDULED: 1,
  IN_PROGRESS: 1,
  COMPLETED: 1,
});

function getColumnPageSize(colId: string): number {
  return columnTasksPerPage[colId] ?? 10;
}

function setColumnPageSize(colId: string, size: number): void {
  columnTasksPerPage[colId] = size;
  columnPages[colId] = 1;
}

function getColumnTotalPages(colId: string): number {
  const count = tasksByStatus.value[colId]?.length || 0;
  return Math.max(1, Math.ceil(count / getColumnPageSize(colId)));
}

function getColumnPage(colId: string): number {
  return columnPages[colId] ?? 1;
}

function setColumnPage(colId: string, page: number): void {
  columnPages[colId] = page;
}

function getPaginatedTasks(colId: string): Task[] {
  const all = tasksByStatus.value[colId] || [];
  const pageSize = getColumnPageSize(colId);
  const totalPages = getColumnTotalPages(colId);
  const currentPage = Math.min(Math.max(1, getColumnPage(colId)), totalPages);
  const start = (currentPage - 1) * pageSize;
  return all.slice(start, start + pageSize);
}

watch(
  [searchQuery, projectFilter, statusFilter, priorityFilter],
  () => {
    for (const key of Object.keys(columnPages)) {
      columnPages[key] = 1;
    }
  },
);

const selectedCreateProject = computed(() => {
  if (!createForm.value.project_id) return null;
  return createProjects.value.find((p) => p.project_id === createForm.value.project_id) || null;
});

const canCreateTask = computed(() => {
  const d = createForm.value.deadline;
  const p = selectedCreateProject.value;
  if (d && p) {
    if (p.start_date && d < p.start_date) return false;
    if (p.deadline && d > p.deadline) return false;
  }
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

let liveSyncTimer: ReturnType<typeof setInterval> | null = null;

async function syncActiveSessions(currentTaskId: number) {
  if (!currentTaskId) return;
  try {
    const activeRes = await getTaskActiveSessionsApi(currentTaskId);
    activeCoAssigneeSessions.value = activeRes.sessions || [];
    activeCoAssigneeSessions.value.forEach((s) => {
      if (s.user_id && s.user_name) {
        resourceNamesMap.value[s.user_id] = s.user_name;
      }
    });
    void sessionStore.fetchActiveSession(true);
  } catch {
    // Silent fail on background polling
  }
}

function startLiveSync(tId: number) {
  stopLiveSync();
  void syncActiveSessions(tId);
  liveSyncTimer = setInterval(() => {
    if (task.value && task.value.task_id === tId) {
      void syncActiveSessions(tId);
    }
  }, 10000);
}

function stopLiveSync() {
  if (liveSyncTimer) {
    clearInterval(liveSyncTimer);
    liveSyncTimer = null;
  }
}

watch(taskId, (id) => {
  if (!id) {
    workLogs.value = [];
    historyError.value = '';
    stopLiveSync();
    return;
  }

  if (task.value) {
    void loadHistory(id);
    startLiveSync(id);
  }
});

async function loadTasks() {
  loading.value = true;
  error.value = '';

  try {
    tasks.value = await getTasksApi();

    if (task.value) {
      await loadHistory(task.value.task_id);
      startLiveSync(task.value.task_id);
    } else if (hasTaskId.value) {
      workLogs.value = [];
      historyError.value = '';
      stopLiveSync();
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

// Load all work logs and active working sessions for this task so co-assignees can view complete progress
async function loadHistory(currentTaskId: number) {
  historyLoading.value = true;
  historyError.value = '';

  try {
    // 1. Fetch work logs submitted for this task (includes entries from all co-assigned resources)
    const logs = await getWorkLogsApi(currentTaskId);
    workLogs.value = logs || [];

    // Populate resource names map from authors for co-assignee label resolution
    workLogs.value.forEach((log) => {
      if (log.user_id && log.author_name) {
        resourceNamesMap.value[log.user_id] = log.author_name;
      }
    });

    // 2. Fetch live active sessions on this task by co-assigned resources
    try {
      const activeRes = await getTaskActiveSessionsApi(currentTaskId);
      activeCoAssigneeSessions.value = activeRes.sessions || [];

      // Add active session user names to the map
      activeCoAssigneeSessions.value.forEach((s) => {
        if (s.user_id && s.user_name) {
          resourceNamesMap.value[s.user_id] = s.user_name;
        }
      });
    } catch (activeErr) {
      console.warn('Failed to load active task sessions:', activeErr);
      activeCoAssigneeSessions.value = [];
    }
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

onUnmounted(() => {
  stopLiveSync();
});
</script>

<style scoped lang="scss">
.task-board-card {
  height: 215px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(124, 94, 212, 0.1);
  }
}
</style>
