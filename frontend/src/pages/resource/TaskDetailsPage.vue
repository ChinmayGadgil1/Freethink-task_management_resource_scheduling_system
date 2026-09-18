<template>
  <q-page
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    class="q-pa-lg resource-tasks-page"
  >
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
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div
            class="page-title text-h5 text-weight-bold"
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
            class="rounded-borders"
            @click="openCreateDialog"
          />

          <q-btn
            outline
            no-caps
            :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
            icon="refresh"
            label="Refresh"
            class="rounded-borders"
            :loading="loading"
            @click="loadTasks"
          />
        </div>
      </div>

      <!-- Scope Filter Toggle -->
      <div class="row items-center q-mb-md">
        <q-btn-toggle
          v-model="scopeFilter"
          toggle-color="primary"
          toggle-text-color="white"
          :color="$q.dark.isActive ? 'grey-9' : 'white'"
          :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'"
          dense
          unelevated
          no-caps
          :options="[
            { label: 'All Tasks', value: 'all', icon: 'dashboard' },
            { label: 'Assigned to Me', value: 'assigned', icon: 'assignment_ind' },
            { label: 'Supervised by Me', value: 'supervised', icon: 'verified_user' },
            { label: 'Verifications', value: 'verifications', icon: 'verified' },
            { label: 'Upstream (Prerequisites)', value: 'upstream', icon: 'call_made' },
            { label: 'Downstream (Dependents)', value: 'downstream', icon: 'call_received' },
          ]"
        />
      </div>

      <!-- 2. STAT SUMMARY CARDS -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Total Tasks"
            :value="tasks.length"
            subtitle="Visible deliverables"
            icon="task_alt"
            color="purple"
            note-class="note-purple"
            @click="filterAllTasks"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="In Progress"
            :value="tasks.filter((t) => t.status === 'IN_PROGRESS').length"
            subtitle="Active deliverables"
            icon="autorenew"
            color="blue"
            note-class="note-blue"
            @click="filterInProgressTasks"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Supervised by Me"
            :value="tasks.filter((t) => Number(t.supervisor_id) === currentUserId).length"
            subtitle="Oversight & review"
            icon="verified_user"
            color="amber"
            note-class="note-purple"
            @click="filterSupervisedTasks"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="At Risk / Delayed"
            :value="
              tasks.filter((t) => isOverdue(t) || t.is_schedule_at_risk || t.is_deadline_at_risk)
                .length
            "
            subtitle="Need attention"
            icon="warning_amber"
            color="red"
            note-class="note-red"
            :negative="
              tasks.filter((t) => isOverdue(t) || t.is_schedule_at_risk || t.is_deadline_at_risk)
                .length > 0
            "
            @click="filterAtRiskTasks"
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
      <div
        v-if="viewMode === 'board'"
        class="full-width overflow-auto q-pb-md resource-kanban-board"
      >
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
                <q-card-section class="column no-wrap col-grow kanban-tasks-scroll-area">
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
                          v-if="item.task_type === 'VERIFICATION' || item.priority === 'NONE'"
                          dense
                          square
                          size="sm"
                          color="purple-1"
                          text-color="purple-9"
                          icon="verified"
                          label="Verification"
                          class="text-weight-bold"
                        />
                        <q-chip
                          v-else
                          dense
                          square
                          size="sm"
                          :color="priorityBgColor(item.priority)"
                          :text-color="priorityTextColor(item.priority)"
                          :label="item.priority"
                          class="text-weight-bold"
                        />

                        <!-- Verification info on completed task -->
                        <q-chip
                          v-if="
                            item.status === 'COMPLETED' &&
                            item.task_type !== 'VERIFICATION' &&
                            item.verification_task
                          "
                          dense
                          square
                          size="sm"
                          :color="
                            item.verification_task.status === 'COMPLETED' ? 'green-1' : 'purple-1'
                          "
                          :text-color="
                            item.verification_task.status === 'COMPLETED' ? 'green-9' : 'purple-9'
                          "
                          icon="verified"
                          :label="
                            item.verification_task.status === 'COMPLETED'
                              ? 'Verified (100%)'
                              : `Under Review (${item.verification_task.progress}%)`
                          "
                          class="text-weight-bold"
                        >
                          <q-tooltip
                            >Verified by {{ item.verification_task.verifier_name }}</q-tooltip
                          >
                        </q-chip>

                        <q-chip
                          v-if="Number(item.supervisor_id) === currentUserId"
                          dense
                          square
                          size="sm"
                          color="amber-9"
                          text-color="white"
                          icon="verified_user"
                          label="Supervised by You"
                          class="text-weight-bold"
                        />

                        <q-chip
                          v-else-if="item.supervisor_name"
                          dense
                          square
                          size="sm"
                          :color="$q.dark.isActive ? 'grey-8' : 'amber-1'"
                          :text-color="$q.dark.isActive ? 'amber-2' : 'amber-10'"
                          icon="shield"
                          :label="'Sup: ' + item.supervisor_name"
                          class="text-weight-medium"
                        />

                        <!-- Blocked By Tag -->
                        <q-chip
                          v-if="getResourceTaskBlockedBySummary(item).list.length > 0"
                          dense
                          square
                          size="sm"
                          :color="
                            getResourceTaskBlockedBySummary(item).isAllCompleted
                              ? $q.dark.isActive
                                ? 'green-10'
                                : 'green-1'
                              : getResourceTaskBlockedBySummary(item).hasRisk
                                ? $q.dark.isActive
                                  ? 'red-10'
                                  : 'red-1'
                                : $q.dark.isActive
                                  ? 'teal-10'
                                  : 'teal-1'
                          "
                          :text-color="
                            getResourceTaskBlockedBySummary(item).isAllCompleted
                              ? $q.dark.isActive
                                ? 'green-2'
                                : 'green-9'
                              : getResourceTaskBlockedBySummary(item).hasRisk
                                ? $q.dark.isActive
                                  ? 'red-2'
                                  : 'negative'
                                : $q.dark.isActive
                                  ? 'teal-2'
                                  : 'teal-9'
                          "
                          icon="link"
                          :label="getResourceTaskBlockedBySummary(item).label"
                          class="text-weight-bold"
                        >
                          <q-tooltip>
                            <div class="text-weight-bold q-mb-xs">Blocked By (Prerequisites):</div>
                            <div
                              v-for="bl in getResourceTaskBlockedBySummary(item).list"
                              :key="bl.title"
                            >
                              • {{ bl.title }}
                              {{ bl.status ? `(${formatStatusLabel(bl.status)})` : '' }}
                            </div>
                          </q-tooltip>
                        </q-chip>

                        <!-- Blocks Tag -->
                        <q-chip
                          v-if="getResourceTaskBlocksSummary(item).list.length > 0"
                          dense
                          square
                          size="sm"
                          :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                          :text-color="$q.dark.isActive ? 'purple-2' : 'purple-9'"
                          icon="call_split"
                          :label="getResourceTaskBlocksSummary(item).label"
                          class="text-weight-bold"
                        >
                          <q-tooltip>
                            <div class="text-weight-bold q-mb-xs">Blocks (Dependents):</div>
                            <div
                              v-for="tTitle in getResourceTaskBlocksSummary(item).list"
                              :key="tTitle"
                            >
                              • {{ tTitle }}
                            </div>
                          </q-tooltip>
                        </q-chip>

                        <q-chip
                          v-if="getCreatedByResourceName(item)"
                          dense
                          square
                          size="sm"
                          :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                          :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                          icon="person"
                          :label="`Resource ${getCreatedByResourceName(item)} created task`"
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
                            class="rounded-borders"
                            @click.stop="openTask(item.task_id)"
                          />

                          <q-btn
                            v-if="isSelfAssigned(item)"
                            unelevated
                            no-caps
                            dense
                            color="primary"
                            size="sm"
                            label="Edit"
                            icon="edit"
                            class="rounded-borders"
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
                  v-if="Number(props.row.supervisor_id) === currentUserId"
                  dense
                  square
                  size="sm"
                  color="amber-9"
                  text-color="white"
                  icon="verified_user"
                  label="Supervised by You"
                  class="text-weight-bold"
                />
                <q-chip
                  v-else-if="props.row.supervisor_name"
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'grey-8' : 'amber-1'"
                  :text-color="$q.dark.isActive ? 'amber-2' : 'amber-10'"
                  icon="shield"
                  :label="'Sup: ' + props.row.supervisor_name"
                  class="text-weight-medium"
                />
                <!-- Blocked By Tag (Table) -->
                <q-chip
                  v-if="getResourceTaskBlockedBySummary(props.row).list.length > 0"
                  dense
                  square
                  size="sm"
                  :color="
                    getResourceTaskBlockedBySummary(props.row).isAllCompleted
                      ? $q.dark.isActive
                        ? 'green-10'
                        : 'green-1'
                      : getResourceTaskBlockedBySummary(props.row).hasRisk
                        ? $q.dark.isActive
                          ? 'red-10'
                          : 'red-1'
                        : $q.dark.isActive
                          ? 'teal-10'
                          : 'teal-1'
                  "
                  :text-color="
                    getResourceTaskBlockedBySummary(props.row).isAllCompleted
                      ? $q.dark.isActive
                        ? 'green-2'
                        : 'green-9'
                      : getResourceTaskBlockedBySummary(props.row).hasRisk
                        ? $q.dark.isActive
                          ? 'red-2'
                          : 'negative'
                        : $q.dark.isActive
                          ? 'teal-2'
                          : 'teal-9'
                  "
                  icon="link"
                  :label="getResourceTaskBlockedBySummary(props.row).label"
                  class="text-weight-bold"
                >
                  <q-tooltip>
                    <div class="text-weight-bold q-mb-xs">Blocked By (Prerequisites):</div>
                    <div
                      v-for="bl in getResourceTaskBlockedBySummary(props.row).list"
                      :key="bl.title"
                    >
                      • {{ bl.title }} {{ bl.status ? `(${formatStatusLabel(bl.status)})` : '' }}
                    </div>
                  </q-tooltip>
                </q-chip>

                <!-- Blocks Tag (Table) -->
                <q-chip
                  v-if="getResourceTaskBlocksSummary(props.row).list.length > 0"
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'purple-9'"
                  icon="call_split"
                  :label="getResourceTaskBlocksSummary(props.row).label"
                  class="text-weight-bold"
                >
                  <q-tooltip>
                    <div class="text-weight-bold q-mb-xs">Blocks (Dependents):</div>
                    <div
                      v-for="tTitle in getResourceTaskBlocksSummary(props.row).list"
                      :key="tTitle"
                    >
                      • {{ tTitle }}
                    </div>
                  </q-tooltip>
                </q-chip>

                <q-chip
                  v-if="getCreatedByResourceName(props.row)"
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  icon="person"
                  :label="`Resource ${getCreatedByResourceName(props.row)} created task`"
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
                v-if="props.row.task_type === 'VERIFICATION' || props.row.priority === 'NONE'"
                dense
                square
                size="sm"
                color="purple-1"
                text-color="purple-9"
                icon="verified"
                label="Verification"
                class="text-weight-bold"
              />
              <q-chip
                v-else
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
                  v-if="isSelfAssigned(props.row)"
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
    <div v-else-if="task" class="full-width">
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
              <!-- Top Row Chips (Status, Priority, Risk Badges, Self-assigned) -->
              <div class="row items-center q-gutter-xs wrap overflow-hidden q-mb-sm">
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
                  v-if="task.task_type === 'VERIFICATION' || task.priority === 'NONE'"
                  dense
                  square
                  size="sm"
                  color="purple-1"
                  text-color="purple-9"
                  icon="verified"
                  label="Verification"
                  class="text-weight-bold"
                />
                <q-chip
                  v-else
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
                  v-if="getCreatedByResourceName(task)"
                  dense
                  square
                  size="sm"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  icon="person"
                  :label="`Resource ${getCreatedByResourceName(task)} created task`"
                  class="text-weight-bold"
                />
              </div>

              <div
                class="page-title text-h5 text-weight-bold"
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

              <!-- Deliverable link for Verification Tasks -->
              <div
                v-if="
                  task.task_type === 'VERIFICATION' &&
                  (task.verified_task_title || task.verified_task_id)
                "
                class="q-banner bg-purple-1 text-purple-10 rounded-borders q-mt-md row items-center gap-xs q-pa-sm"
              >
                <q-icon name="fact_check" color="purple-8" size="22px" class="q-mr-xs" />
                <div>
                  <div class="text-caption text-weight-bold">VERIFYING COMPLETED DELIVERABLE:</div>
                  <div class="text-body2 text-weight-bold">
                    {{ task.verified_task_title }}
                  </div>
                </div>
              </div>

              <!-- Peer Verification Block on Completed Standard Tasks -->
              <div
                v-if="
                  task.status === 'COMPLETED' &&
                  task.task_type !== 'VERIFICATION' &&
                  task.verification_task
                "
                class="q-mt-md"
              >
                <div
                  class="text-caption text-weight-bold q-mb-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                >
                  PEER VERIFICATION REVIEW
                </div>
                <q-card
                  flat
                  bordered
                  :dark="$q.dark.isActive"
                  class="q-pa-sm rounded-borders bg-purple-1 text-purple-10"
                >
                  <div class="row items-center justify-between no-wrap">
                    <div class="row items-center gap-xs">
                      <q-icon name="verified" size="20px" color="purple-8" />
                      <div>
                        <div class="text-weight-bold text-caption">
                          Verifier: {{ task.verification_task.verifier_name }}
                        </div>
                        <div class="text-caption text-grey-7" style="font-size: 11px">
                          Progress: {{ Number(task.verification_task.progress) || 0 }}% · Status:
                          {{ formatStatusLabel(task.verification_task.status) }}
                        </div>
                      </div>
                    </div>
                    <q-chip
                      dense
                      square
                      size="xs"
                      :color="
                        task.verification_task.status === 'COMPLETED' ? 'green-1' : 'purple-2'
                      "
                      :text-color="
                        task.verification_task.status === 'COMPLETED' ? 'green-9' : 'purple-9'
                      "
                      class="text-weight-bold"
                    >
                      {{
                        task.verification_task.status === 'COMPLETED'
                          ? 'VERIFIED & APPROVED'
                          : 'UNDER REVIEW'
                      }}
                    </q-chip>
                  </div>
                  <q-linear-progress
                    rounded
                    size="4px"
                    :value="(Number(task.verification_task.progress) || 0) / 100"
                    :color="task.verification_task.status === 'COMPLETED' ? 'positive' : 'purple-8'"
                    track-color="purple-2"
                    class="q-mt-xs"
                  />
                </q-card>
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

              <!-- Task Supervisor / Reviewer Details -->
              <div v-if="!isVerificationTask(task)" class="q-mt-md">
                <div
                  class="text-caption text-weight-bold q-mb-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
                >
                  SUPERVISOR / REVIEWER
                </div>
                <div
                  v-if="task.supervisor_name || task.supervisor_id"
                  class="row items-center gap-xs"
                >
                  <q-chip
                    dense
                    square
                    :color="
                      Number(task.supervisor_id) === getCurrentUserId()
                        ? 'amber-9'
                        : $q.dark.isActive
                          ? 'grey-9'
                          : 'amber-1'
                    "
                    :text-color="
                      Number(task.supervisor_id) === getCurrentUserId() ? 'white' : 'amber-10'
                    "
                    class="text-weight-bold"
                  >
                    <q-avatar
                      size="20px"
                      :color="
                        Number(task.supervisor_id) === getCurrentUserId() ? 'amber-10' : 'amber-8'
                      "
                      text-color="white"
                      icon="verified_user"
                    />
                    {{ task.supervisor_name || `Resource #${task.supervisor_id}` }}
                    <span
                      v-if="Number(task.supervisor_id) === getCurrentUserId()"
                      class="q-ml-xs text-weight-bolder"
                    >
                      (You)
                    </span>
                  </q-chip>
                  <q-badge outline color="amber-9" class="q-ml-xs text-weight-bold">
                    20% Effort ({{ (Number(task.expected_effort || 0) * 0.2).toFixed(1) }}h)
                  </q-badge>
                  <span v-if="task.supervisor_email" class="text-caption text-grey-6">
                    {{ task.supervisor_email }}
                  </span>
                </div>
                <div v-else class="text-caption text-grey-5">No supervisor designated</div>
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

              <!-- Action Buttons (For assigned resources and supervisors) -->
              <div class="column gap-sm q-mt-md full-width" style="max-width: 320px">
                <template v-if="isAssignedToMe(task)">
                  <!-- Assign Verifier Action (if task completed and no verifier assigned) -->
                  <div
                    v-if="
                      task.status === 'COMPLETED' &&
                      task.task_type !== 'VERIFICATION' &&
                      !task.verification_task
                    "
                    class="row q-mb-xs"
                  >
                    <div class="col-12">
                      <q-btn
                        unelevated
                        no-caps
                        color="primary"
                        text-color="white"
                        icon="verified"
                        label="Assign Verifier"
                        class="full-width text-weight-bold"
                        style="border-radius: 8px; height: 40px"
                        @click="openAssignVerification(task)"
                      />
                    </div>
                  </div>

                  <!-- Active Session Toggle Buttons -->
                  <div v-if="isCurrentTaskSessionActive" class="row q-mb-xs">
                    <div class="col-12">
                      <q-btn
                        unelevated
                        no-caps
                        color="negative"
                        icon="stop"
                        label="Stop Work Session"
                        class="full-width text-weight-bold"
                        style="border-radius: 8px; height: 40px"
                        @click="promptStopSession"
                      />
                    </div>
                  </div>
                  <div v-else-if="task.status !== 'COMPLETED'" class="row q-mb-xs">
                    <div class="col-12">
                      <q-btn
                        outline
                        no-caps
                        color="primary"
                        icon="play_arrow"
                        label="Start Work Session"
                        class="full-width text-weight-bold"
                        style="border-radius: 8px; height: 40px"
                        @click="handleStartSession(task.task_id)"
                      />
                    </div>
                  </div>

                  <!-- Primary Work Log Action -->
                  <div class="row q-col-gutter-sm">
                    <div class="col-12">
                      <q-btn
                        unelevated
                        no-caps
                        color="primary"
                        icon="history_edu"
                        label="Add Work Log"
                        class="full-width text-weight-bold"
                        style="border-radius: 8px; height: 42px"
                        @click="updateDialog = true"
                      />
                    </div>
                  </div>

                  <!-- Secondary Action Row (Only for self-assigned tasks) -->
                  <div v-if="isSelfAssigned(task)" class="row">
                    <div class="col-12">
                      <q-btn
                        outline
                        no-caps
                        color="primary"
                        icon="edit"
                        label="Edit Task Specs"
                        class="full-width text-weight-bold"
                        style="border-radius: 8px; height: 40px"
                        @click="openUpdateTaskDialog(task)"
                      />
                    </div>
                  </div>
                </template>

                <!-- Supervisor Active Oversight Controls -->
                <template v-else-if="Number(task.supervisor_id) === getCurrentUserId()">
                  <q-banner
                    dense
                    rounded
                    :class="
                      $q.dark.isActive ? 'bg-amber-10 text-amber-1' : 'bg-amber-1 text-amber-10'
                    "
                    class="q-pa-sm text-caption text-weight-medium q-mb-xs"
                  >
                    <template #avatar>
                      <q-icon
                        name="verified_user"
                        :color="$q.dark.isActive ? 'amber-2' : 'amber-9'"
                      />
                    </template>
                    <span>
                      <b>Supervisor Active Oversight Mode</b>: You have 20% review effort (<b
                        >{{ (Number(task.expected_effort) * 0.2).toFixed(1) }}h</b
                      >) allocated to this task.
                    </span>
                  </q-banner>

                  <!-- Supervisor Work Log Action -->
                  <div class="row q-col-gutter-sm">
                    <div class="col-12">
                      <q-btn
                        unelevated
                        no-caps
                        color="amber-9"
                        text-color="white"
                        icon="history_edu"
                        label="Log Review Work"
                        class="full-width text-weight-bold"
                        style="border-radius: 8px; height: 42px"
                        @click="updateDialog = true"
                      />
                    </div>
                  </div>
                </template>

                <template v-else>
                  <q-banner
                    dense
                    rounded
                    :class="$q.dark.isActive ? 'bg-grey-9 text-grey-3' : 'bg-amber-1 text-amber-10'"
                    class="q-pa-sm text-caption text-weight-medium"
                  >
                    <template #avatar>
                      <q-icon name="visibility" :color="$q.dark.isActive ? 'amber-2' : 'amber-9'" />
                    </template>
                    <span>
                      <b>Dependency View Mode (Read-only)</b>. You can monitor progress and specs
                      for your dependent work without modifying effort.
                    </span>
                  </q-banner>
                </template>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- 2. DETAIL TABS CARD (PROGRESS & EFFORT, DEPENDENCIES, DAILY UPDATES) -->
      <q-card
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders q-mb-lg overflow-hidden"
      >
        <q-tabs
          v-model="taskDetailTab"
          dense
          no-caps
          align="left"
          active-color="primary"
          indicator-color="primary"
          class="task-detail-tabs"
        >
          <q-tab
            name="progress"
            icon="insights"
            label="Task Progress & Effort"
            class="task-detail-tab"
          />
          <q-tab
            name="dependencies"
            icon="account_tree"
            label="Task Dependencies & Impact Flow"
            class="task-detail-tab"
          />
          <q-tab
            v-if="canViewTaskHistory"
            name="history"
            icon="history"
            label="Daily Updates & Session History"
            class="task-detail-tab"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="taskDetailTab"
          animated
          :dark="$q.dark.isActive"
          class="bg-transparent"
        >
          <!-- TAB 1: TASK PROGRESS & EFFORT -->
          <q-tab-panel name="progress" class="q-pa-none">
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
                  <div
                    class="text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
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
                        <div
                          v-if="task.supervisor_id"
                          class="text-caption text-weight-medium text-amber-9 q-mt-xs"
                        >
                          + {{ (Number(task.expected_effort || 0) * 0.2).toFixed(1) }}h supervisor
                          (Total: {{ (Number(task.expected_effort || 0) * 1.2).toFixed(1) }}h)
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
          </q-tab-panel>

          <!-- TAB 2: TASK DEPENDENCIES & IMPACT FLOW -->
          <q-tab-panel name="dependencies" class="q-pa-none">
            <q-card-section class="row items-center justify-between q-pa-md wrap gap-sm">
              <div class="row items-center">
                <q-avatar
                  size="34px"
                  rounded
                  :color="$q.dark.isActive ? 'teal-10' : 'teal-1'"
                  :text-color="$q.dark.isActive ? 'teal-2' : 'teal-9'"
                  icon="account_tree"
                  class="q-mr-sm"
                />
                <div>
                  <div
                    class="text-subtitle1 text-weight-bold"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                  >
                    Task Dependencies & Impact Flow
                  </div>
                  <div
                    class="text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Explore both incoming prerequisites and outgoing dependent tasks connected to
                    this deliverable.
                  </div>
                </div>
              </div>

              <!-- Filter Tabs for Upstream / Downstream / All -->
              <div class="row items-center gap-xs">
                <q-tabs
                  v-model="specDependencyFilterTab"
                  dense
                  no-caps
                  class="text-grey-7"
                  active-color="primary"
                  indicator-color="primary"
                >
                  <q-tab name="all">
                    <div class="row items-center gap-xs no-wrap">
                      <span>All</span>
                      <q-badge color="grey-7" rounded size="xs">
                        {{
                          currentTaskUpstreamDependencies.length +
                          currentTaskDownstreamDependencies.length
                        }}
                      </q-badge>
                    </div>
                  </q-tab>
                  <q-tab name="upstream">
                    <div class="row items-center gap-xs no-wrap">
                      <q-icon name="arrow_upward" size="14px" color="teal" />
                      <span>Upstream (Prerequisites)</span>
                      <q-badge
                        v-if="currentTaskUpstreamDependencies.length > 0"
                        color="teal"
                        rounded
                        size="xs"
                      >
                        {{ currentTaskUpstreamDependencies.length }}
                      </q-badge>
                    </div>
                  </q-tab>
                  <q-tab name="downstream">
                    <div class="row items-center gap-xs no-wrap">
                      <q-icon name="arrow_downward" size="14px" color="indigo" />
                      <span>Downstream (Dependents)</span>
                      <q-badge
                        v-if="currentTaskDownstreamDependencies.length > 0"
                        color="indigo"
                        rounded
                        size="xs"
                      >
                        {{ currentTaskDownstreamDependencies.length }}
                      </q-badge>
                    </div>
                  </q-tab>
                </q-tabs>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pa-md">
              <div v-if="currentTaskFilteredDependencies.length > 0" class="row q-col-gutter-md">
                <div
                  v-for="dep in currentTaskFilteredDependencies"
                  :key="dep.task_id"
                  class="col-12"
                >
                  <q-card
                    flat
                    bordered
                    :dark="$q.dark.isActive"
                    class="rounded-borders q-pa-sm full-height column justify-between"
                    :style="
                      dep.direction === 'UPSTREAM'
                        ? 'border-left: 3px solid #00897b;'
                        : 'border-left: 3px solid #7c4dff;'
                    "
                  >
                    <div>
                      <div class="row items-center justify-between no-wrap q-mb-xs">
                        <div class="row items-center gap-xs ellipsis" style="max-width: 65%">
                          <q-icon
                            :name="dep.direction === 'UPSTREAM' ? 'link' : 'call_split'"
                            size="16px"
                            :color="dep.direction === 'UPSTREAM' ? 'teal' : 'indigo'"
                          />
                          <span class="text-subtitle2 text-weight-bold ellipsis" :title="dep.title">
                            {{ dep.title }}
                          </span>
                        </div>
                        <div class="row items-center gap-xs">
                          <q-chip
                            dense
                            square
                            size="xs"
                            :color="
                              dep.direction === 'UPSTREAM'
                                ? $q.dark.isActive
                                  ? 'teal-10'
                                  : 'teal-1'
                                : $q.dark.isActive
                                  ? 'indigo-10'
                                  : 'indigo-1'
                            "
                            :text-color="
                              dep.direction === 'UPSTREAM'
                                ? $q.dark.isActive
                                  ? 'teal-2'
                                  : 'teal-9'
                                : $q.dark.isActive
                                  ? 'indigo-2'
                                  : 'indigo-9'
                            "
                            class="text-weight-bold"
                          >
                            {{ dep.direction === 'UPSTREAM' ? 'Blocked By' : 'Blocks' }}
                          </q-chip>
                          <q-chip
                            dense
                            square
                            size="xs"
                            :color="statusBgColor(dep.status)"
                            :text-color="statusTextColor(dep.status)"
                            class="text-weight-bold"
                          >
                            {{ formatStatusLabel(dep.status) }}
                          </q-chip>
                        </div>
                      </div>

                      <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 11px">
                        {{ dep.relationshipNote }}
                      </div>

                      <div
                        class="row items-center q-gutter-xs wrap q-my-xs text-caption text-grey-6"
                        style="font-size: 11px"
                      >
                        <span
                          v-if="
                            dep.assigned_resource_names && dep.assigned_resource_names.length > 0
                          "
                        >
                          <q-icon name="people" size="13px" />
                          {{ dep.assigned_resource_names.join(', ') }}
                        </span>
                        <span v-if="dep.deadline">
                          · <q-icon name="event" size="13px" /> Due: {{ formatDate(dep.deadline) }}
                        </span>
                        <span v-if="dep.expected_effort">
                          · {{ dep.expected_effort }}h effort
                        </span>
                      </div>

                      <!-- Progress Bar -->
                      <div class="q-mt-sm">
                        <div class="row items-center justify-between text-caption q-mb-xs">
                          <span
                            class="text-weight-bold"
                            :class="Number(dep.progress) === 100 ? 'text-positive' : 'text-primary'"
                          >
                            {{ Number(dep.progress) || 0 }}% Complete
                          </span>
                          <q-badge
                            v-if="dep.status === 'COMPLETED'"
                            color="positive"
                            class="text-caption text-weight-bold"
                          >
                            {{ dep.direction === 'UPSTREAM' ? 'Unblocked & Done' : 'Finished' }}
                          </q-badge>
                          <q-badge
                            v-else-if="dep.is_schedule_at_risk || dep.is_deadline_at_risk"
                            color="negative"
                            class="text-caption text-weight-bold"
                          >
                            Possible Delay Risk
                          </q-badge>
                        </div>
                        <q-linear-progress
                          rounded
                          size="7px"
                          :value="(Number(dep.progress) || 0) / 100"
                          :color="
                            dep.status === 'COMPLETED'
                              ? 'positive'
                              : dep.is_schedule_at_risk || dep.is_deadline_at_risk
                                ? 'warning'
                                : dep.direction === 'UPSTREAM'
                                  ? 'teal'
                                  : 'primary'
                          "
                          :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                        />
                      </div>
                    </div>

                    <div class="row justify-end q-mt-sm">
                      <q-btn
                        flat
                        no-caps
                        dense
                        size="sm"
                        color="primary"
                        icon="visibility"
                        :label="
                          dep.direction === 'UPSTREAM'
                            ? 'View Prerequisite Spec'
                            : 'View Dependent Spec'
                        "
                        @click="openTask(dep.task_id)"
                      />
                    </div>
                  </q-card>
                </div>
              </div>

              <div v-else class="text-center text-grey-5 q-pa-lg column items-center">
                <q-avatar
                  size="44px"
                  :color="$q.dark.isActive ? 'teal-10' : 'teal-1'"
                  :text-color="$q.dark.isActive ? 'teal-2' : 'teal-8'"
                  icon="account_tree"
                  class="q-mb-xs"
                />
                <div
                  class="text-body2 text-weight-medium"
                  :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-8'"
                >
                  {{
                    specDependencyFilterTab === 'upstream'
                      ? 'No upstream prerequisites linked to this task.'
                      : specDependencyFilterTab === 'downstream'
                        ? 'No downstream tasks depend on this deliverable.'
                        : 'No dependencies linked to this task.'
                  }}
                </div>
                <div class="text-caption text-grey-5 q-mt-xs">
                  {{
                    specDependencyFilterTab === 'upstream'
                      ? 'This deliverable can start independently without blocking prerequisites.'
                      : specDependencyFilterTab === 'downstream'
                        ? 'Other tasks can proceed independently without waiting on this deliverable.'
                        : 'This deliverable operates independently without upstream blockers or downstream dependents.'
                  }}
                </div>
              </div>
            </q-card-section>
          </q-tab-panel>

          <!-- TAB 3: DAILY UPDATES & SESSION HISTORY -->
          <q-tab-panel v-if="canViewTaskHistory" name="history" class="q-pa-none">
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
                  <div
                    class="text-caption"
                    :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
                  >
                    Collaborative timeline of start/stop sessions, work notes, and progress logged
                    by all assigned resources.
                  </div>
                </div>
              </div>
              <!-- Total updates count chip & Add Update button -->
              <div class="row items-center q-gutter-sm">
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
                <q-btn
                  v-if="isAssignedToMe(task) || isSupervisedByMe(task)"
                  outline
                  no-caps
                  color="primary"
                  icon="edit_note"
                  label="Add Daily Update"
                  class="text-weight-bold"
                  style="border-radius: 8px"
                  @click="updateDialog = true"
                />
              </div>
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
                    🟢 <b>{{ s.user_name || resolveMemberName(s.user_id) }}</b> is currently working
                    on this task (started {{ formatHistoryTime(s.start_time) }}).
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
                    v-if="isAssignedToMe(task) || isSupervisedByMe(task)"
                    outline
                    no-caps
                    color="primary"
                    :label="
                      isSupervisedByMe(task) && !isAssignedToMe(task)
                        ? 'Log Review Update'
                        : 'Log First Update'
                    "
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

                        <!-- Supervisor Review Chip -->
                        <q-chip
                          v-if="
                            log.is_supervisor_log ||
                            (task.supervisor_id &&
                              Number(log.user_id) === Number(task.supervisor_id))
                          "
                          dense
                          square
                          size="xs"
                          color="amber-9"
                          text-color="white"
                          icon="verified_user"
                          label="Supervisor Review"
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
          </q-tab-panel>
        </q-tab-panels>
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
                <q-select
                  v-model="createForm.supervisor_id"
                  :options="projectMembersForCreate"
                  label="Supervisor / Reviewer (Optional)"
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                  options-dense
                  hint="Designate an experienced resource to supervise and review deliverables"
                >
                  <template #prepend>
                    <q-icon name="verified_user" color="primary" />
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

    <!-- Assign Verification Dialog -->
    <AssignVerificationDialog
      v-model="showAssignVerificationDialog"
      :task="verificationTargetTask"
      @saved="onVerificationSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  createWorkLogApi,
  createTaskApi,
  getProjectsApi,
  getResourcesApi,
  getTasksApi,
  getTaskByIdApi,
  getWorkLogsApi,
  getTaskActiveSessionsApi, // Added API to fetch live active sessions of co-assigned resources
  updateTaskApi,
} from '@/services/api';
import type {
  CreateWorkLogPayload,
  PredecessorTaskInfo,
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
import AssignVerificationDialog from '@/components/tasks/AssignVerificationDialog.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import { formatDate, formatHours, formatNumber, getInitials } from '@/utils/formatters'; // Added getInitials for avatar rendering
import {
  isOverdue,
  isTaskOverdue,
  getStatusFromProgress,
  formatStatusLabel,
  isVerificationTask,
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
  if (!userId) return 'Team Member';
  const numId = Number(userId);

  if (resourceNamesMap.value[numId]) {
    return resourceNamesMap.value[numId];
  }

  // Check current task assigned_resources or assigned_resource_names
  if (task.value?.assigned_resource_ids && task.value?.assigned_resource_names) {
    const idx = task.value.assigned_resource_ids.findIndex((id) => Number(id) === numId);
    if (idx !== -1 && task.value.assigned_resource_names[idx]) {
      resourceNamesMap.value[numId] = task.value.assigned_resource_names[idx];
      return task.value.assigned_resource_names[idx];
    }
  }

  const assigned = task.value?.assigned_resources?.find((r) => Number(r.user_id) === numId);
  if (assigned?.name) {
    resourceNamesMap.value[numId] = assigned.name;
    return assigned.name;
  }

  // Check current task schedules directly
  const sched = task.value?.schedules?.find((s) => Number(s.user_id) === numId);
  if (sched?.resource_name) {
    resourceNamesMap.value[numId] = sched.resource_name;
    return sched.resource_name;
  }

  // Check all tasks for any matching assigned_resources
  for (const t of tasks.value) {
    const ar = t.assigned_resources?.find((r) => Number(r.user_id) === numId);
    if (ar?.name) {
      resourceNamesMap.value[numId] = ar.name;
      return ar.name;
    }
    const sc = t.schedules?.find((s) => Number(s.user_id) === numId);
    if (sc?.resource_name) {
      resourceNamesMap.value[numId] = sc.resource_name;
      return sc.resource_name;
    }
  }

  const currentUserId = getCurrentUserId();
  if (currentUserId && numId === currentUserId) {
    const u = authStore.user as UserLike | null;
    return u?.name || 'You';
  }

  return `Resource #${numId}`;
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
  created_by_name?: string | null;
  created_by_role?: string | null;
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

function getCreatedByResourceName(item: Task | ResourceTask | null | undefined): string | null {
  if (!item) return null;
  const t = item as TaskLike;

  if (t.created_by_role === 'PROJECT_MANAGER') {
    return null;
  }

  if (t.created_by_role === 'RESOURCE' && t.created_by_name) {
    return t.created_by_name;
  }

  const createdById = Number(t.created_by ?? t.createdBy ?? t.created_by_id);
  const currentUserId = getCurrentUserId();

  if (currentUserId && createdById && currentUserId === createdById) {
    const u = authStore.user as UserLike | null;
    return u?.name || t.created_by_name || 'You';
  }

  if (!createdById) return null;

  if (resourceNamesMap.value[createdById]) {
    return resourceNamesMap.value[createdById];
  }

  const taskObj = item as Task;
  if (Array.isArray(taskObj.assigned_resources)) {
    const ar = taskObj.assigned_resources.find((r) => Number(r.user_id) === createdById);
    if (ar?.name) {
      resourceNamesMap.value[createdById] = ar.name;
      return ar.name;
    }
  }

  for (const tk of tasks.value) {
    if (Number(tk.created_by) === createdById && tk.created_by_name) {
      resourceNamesMap.value[createdById] = tk.created_by_name;
      return tk.created_by_name;
    }
    const ar = tk.assigned_resources?.find((r) => Number(r.user_id) === createdById);
    if (ar?.name) {
      resourceNamesMap.value[createdById] = ar.name;
      return ar.name;
    }
    const sc = tk.schedules?.find((s) => Number(s.user_id) === createdById);
    if (sc?.resource_name) {
      resourceNamesMap.value[createdById] = sc.resource_name;
      return sc.resource_name;
    }
  }

  if (typeof t.created_by_name === 'string' && t.created_by_name) {
    return t.created_by_name;
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

function isAssignedToMe(item: Task | ResourceTask | null | undefined): boolean {
  if (!item) return false;
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return false;
  const taskObj = item as Task;
  if (Array.isArray(taskObj.assigned_resource_ids) && taskObj.assigned_resource_ids.length > 0) {
    return taskObj.assigned_resource_ids.map(Number).includes(currentUserId);
  }
  if (isSelfAssigned(item)) {
    return true;
  }
  return false;
}

function isSupervisedByMe(item: Task | ResourceTask | null | undefined): boolean {
  if (!item) return false;
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return false;
  const taskObj = item as Task;
  return Boolean(taskObj.supervisor_id && Number(taskObj.supervisor_id) === currentUserId);
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
const atRiskOnly = ref(false);

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
  { label: 'Verification (No Priority)', value: 'NONE' },
];

const scopeFilter = ref<
  'all' | 'assigned' | 'supervised' | 'upstream' | 'downstream' | 'verifications'
>('all');
const currentUserId = computed(() => getCurrentUserId());

const showAssignVerificationDialog = ref(false);
const verificationTargetTask = ref<Task | null>(null);

function openAssignVerification(targetTask: Task) {
  verificationTargetTask.value = targetTask;
  showAssignVerificationDialog.value = true;
}

function onVerificationSaved() {
  void loadTasks();
}

// Parser helper for IDs that may be numbers, arrays, or comma-separated strings
function parseDependencyIds(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((x) => Number(x)).filter((n) => !isNaN(n) && n > 0);
  }
  if (typeof val === 'number') {
    return val > 0 ? [val] : [];
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }
  return [];
}

// Compute tasks directly assigned to or created/supervised by current user
const myAssignedTasks = computed(() => {
  const myId = currentUserId.value;
  return tasks.value.filter((t) => isAssignedToMe(t) || Number(t.supervisor_id) === myId);
});

// Unified repository of all known task metadata across the session
const allKnownTasksMap = computed<Map<number, PredecessorTaskInfo | Task>>(() => {
  const map = new Map<number, PredecessorTaskInfo | Task>();

  // Extract from loaded task list
  tasks.value.forEach((t) => {
    if (t.task_id) map.set(Number(t.task_id), t);
    if (Array.isArray(t.predecessors)) {
      t.predecessors.forEach((p) => {
        if (p.task_id && !map.has(Number(p.task_id))) {
          map.set(Number(p.task_id), p);
        }
      });
    }
    if (Array.isArray(t.successors)) {
      t.successors.forEach((s) => {
        if (s.task_id && !map.has(Number(s.task_id))) {
          map.set(Number(s.task_id), s);
        }
      });
    }
  });

  // Extract from individual viewed task
  if (individualTask.value?.task_id) {
    map.set(Number(individualTask.value.task_id), individualTask.value);
    if (Array.isArray(individualTask.value.predecessors)) {
      individualTask.value.predecessors.forEach((p) => {
        if (p.task_id && !map.has(Number(p.task_id))) {
          map.set(Number(p.task_id), p);
        }
      });
    }
    if (Array.isArray(individualTask.value.successors)) {
      individualTask.value.successors.forEach((s) => {
        if (s.task_id && !map.has(Number(s.task_id))) {
          map.set(Number(s.task_id), s);
        }
      });
    }
  }

  return map;
});

// Helper to convert any task reference or ID to a PredecessorTaskInfo representation
function resolveTaskInfo(
  taskId: number,
  fallbackObj?: Partial<PredecessorTaskInfo | Task>,
): PredecessorTaskInfo {
  const existing = allKnownTasksMap.value.get(Number(taskId));
  return {
    task_id: Number(taskId),
    project_id: Number(existing?.project_id || fallbackObj?.project_id || 0),
    project_name: existing?.project_name || fallbackObj?.project_name || undefined,
    title: existing?.title || fallbackObj?.title || `Task #${taskId}`,
    status: existing?.status || fallbackObj?.status || 'SCHEDULED',
    priority: existing?.priority || fallbackObj?.priority || 'MEDIUM',
    deadline: existing?.deadline || fallbackObj?.deadline || null,
    planned_start: existing?.planned_start || fallbackObj?.planned_start || null,
    planned_end: existing?.planned_end || fallbackObj?.planned_end || null,
    expected_effort: existing?.expected_effort ?? fallbackObj?.expected_effort ?? 0,
    actual_effort: existing?.actual_effort ?? fallbackObj?.actual_effort ?? 0,
    progress: existing?.progress ?? fallbackObj?.progress ?? 0,
    is_schedule_at_risk: Boolean(existing?.is_schedule_at_risk || fallbackObj?.is_schedule_at_risk),
    is_deadline_at_risk: Boolean(existing?.is_deadline_at_risk || fallbackObj?.is_deadline_at_risk),
    assigned_resource_names:
      existing?.assigned_resource_names || fallbackObj?.assigned_resource_names || [],
    supervisor_name: existing?.supervisor_name || fallbackObj?.supervisor_name || null,
  };
}

// Map of task_id -> all tasks that must finish before this task (Upstream / Blocked By)
const taskPredecessorsMap = computed<Map<number, PredecessorTaskInfo[]>>(() => {
  const map = new Map<number, Map<number, PredecessorTaskInfo>>();

  function addPred(
    childTaskId: number,
    predId: number,
    predFallback?: Partial<PredecessorTaskInfo | Task>,
  ) {
    if (!childTaskId || !predId || childTaskId === predId) return;
    if (!map.has(childTaskId)) map.set(childTaskId, new Map());
    const childMap = map.get(childTaskId)!;
    if (!childMap.has(predId)) {
      childMap.set(predId, resolveTaskInfo(predId, predFallback));
    }
  }

  // Scan all tasks in tasks.value
  tasks.value.forEach((t) => {
    const tId = Number(t.task_id);
    if (Array.isArray(t.predecessors)) {
      t.predecessors.forEach((p) => addPred(tId, Number(p.task_id), p));
    }
    parseDependencyIds(t.predecessor_task_ids).forEach((pId) => addPred(tId, pId));
    if (Array.isArray(t.successors)) {
      t.successors.forEach((s) => addPred(Number(s.task_id), tId, t));
    }
    parseDependencyIds(t.successor_task_ids).forEach((sId) => addPred(sId, tId, t));
  });

  // Scan individual viewed task if any
  if (individualTask.value?.task_id) {
    const t = individualTask.value;
    const tId = Number(t.task_id);
    if (Array.isArray(t.predecessors)) {
      t.predecessors.forEach((p) => addPred(tId, Number(p.task_id), p));
    }
    parseDependencyIds(t.predecessor_task_ids).forEach((pId) => addPred(tId, pId));
    if (Array.isArray(t.successors)) {
      t.successors.forEach((s) => addPred(Number(s.task_id), tId, t));
    }
    parseDependencyIds(t.successor_task_ids).forEach((sId) => addPred(sId, tId, t));
  }

  const result = new Map<number, PredecessorTaskInfo[]>();
  map.forEach((innerMap, tId) => {
    result.set(tId, Array.from(innerMap.values()));
  });
  return result;
});

// Map of task_id -> all tasks that are waiting on this task (Downstream / Blocks)
const taskSuccessorsMap = computed<Map<number, PredecessorTaskInfo[]>>(() => {
  const map = new Map<number, Map<number, PredecessorTaskInfo>>();

  function addSucc(
    parentTaskId: number,
    succId: number,
    succFallback?: Partial<PredecessorTaskInfo | Task>,
  ) {
    if (!parentTaskId || !succId || parentTaskId === succId) return;
    if (!map.has(parentTaskId)) map.set(parentTaskId, new Map());
    const parentMap = map.get(parentTaskId)!;
    if (!parentMap.has(succId)) {
      parentMap.set(succId, resolveTaskInfo(succId, succFallback));
    }
  }

  // Scan all tasks in tasks.value
  tasks.value.forEach((t) => {
    const tId = Number(t.task_id);
    if (Array.isArray(t.successors)) {
      t.successors.forEach((s) => addSucc(tId, Number(s.task_id), s));
    }
    parseDependencyIds(t.successor_task_ids).forEach((sId) => addSucc(tId, sId));
    if (Array.isArray(t.predecessors)) {
      t.predecessors.forEach((p) => addSucc(Number(p.task_id), tId, t));
    }
    parseDependencyIds(t.predecessor_task_ids).forEach((pId) => addSucc(pId, tId, t));
  });

  // Scan individual viewed task if any
  if (individualTask.value?.task_id) {
    const t = individualTask.value;
    const tId = Number(t.task_id);
    if (Array.isArray(t.successors)) {
      t.successors.forEach((s) => addSucc(tId, Number(s.task_id), s));
    }
    parseDependencyIds(t.successor_task_ids).forEach((sId) => addSucc(tId, sId));
    if (Array.isArray(t.predecessors)) {
      t.predecessors.forEach((p) => addSucc(Number(p.task_id), tId, t));
    }
    parseDependencyIds(t.predecessor_task_ids).forEach((pId) => addSucc(pId, tId, t));
  }

  const result = new Map<number, PredecessorTaskInfo[]>();
  map.forEach((innerMap, tId) => {
    result.set(tId, Array.from(innerMap.values()));
  });
  return result;
});

function getResourceTaskBlockedBySummary(taskItem: Task | ResourceTask | PredecessorTaskInfo): {
  label: string;
  isAllCompleted: boolean;
  hasRisk: boolean;
  list: { title: string; status?: string | undefined }[];
} {
  const itemAny = taskItem as unknown as Record<string, unknown>;
  const tId = Number(itemAny.task_id || itemAny.id || itemAny.taskId);
  const preds = taskPredecessorsMap.value.get(tId) || [];
  if (preds.length === 0) {
    return { label: '', isAllCompleted: false, hasRisk: false, list: [] };
  }

  const isAllCompleted = preds.every((p) => p.status === 'COMPLETED');
  const hasRisk = preds.some((p) => p.is_schedule_at_risk || p.is_deadline_at_risk);
  const list = preds.map((p) => ({
    title: p.title || `Task #${p.task_id}`,
    status: p.status,
  }));

  const first = list[0]!.title;
  const extra = list.length - 1;
  const shortFirst = first.length > 18 ? first.slice(0, 18) + '...' : first;
  const label = `Blocked By: ${shortFirst}${extra > 0 ? ` (+${extra})` : ''}`;
  return { label, isAllCompleted, hasRisk, list };
}

function getResourceTaskBlocksSummary(taskItem: Task | ResourceTask | PredecessorTaskInfo): {
  label: string;
  list: string[];
} {
  const itemAny = taskItem as unknown as Record<string, unknown>;
  const tId = Number(itemAny.task_id || itemAny.id || itemAny.taskId);
  const succs = taskSuccessorsMap.value.get(tId) || [];
  if (succs.length === 0) {
    return { label: '', list: [] };
  }

  const list = succs.map((s) => s.title || `Task #${s.task_id}`);
  const first = list[0]!;
  const extra = list.length - 1;
  const shortFirst = first.length > 18 ? first.slice(0, 18) + '...' : first;
  const label = `Blocks: ${shortFirst}${extra > 0 ? ` (+${extra})` : ''}`;
  return { label, list };
}

const specDependencyFilterTab = ref<'all' | 'upstream' | 'downstream'>('all');
const taskDetailTab = ref<'progress' | 'dependencies' | 'history'>('progress');

interface DependencyCardItem {
  task_id: number;
  project_id: number;
  project_name?: string | null | undefined;
  title: string;
  status: Task['status'];
  priority: Task['priority'];
  deadline?: string | null | undefined;
  planned_start?: string | null | undefined;
  planned_end?: string | null | undefined;
  expected_effort?: number | string | undefined;
  actual_effort?: number | string | undefined;
  progress?: number | string | undefined;
  is_schedule_at_risk?: boolean | undefined;
  is_deadline_at_risk?: boolean | undefined;
  assigned_resource_names?: string[] | undefined;
  supervisor_name?: string | null | undefined;
  direction: 'UPSTREAM' | 'DOWNSTREAM';
  relationshipNote: string;
}

const currentTaskUpstreamDependencies = computed<DependencyCardItem[]>(() => {
  if (!task.value) return [];
  const preds = taskPredecessorsMap.value.get(Number(task.value.task_id)) || [];
  return preds.map((p) => ({
    ...p,
    direction: 'UPSTREAM' as const,
    relationshipNote: 'Prerequisite that must be finished before this deliverable can proceed.',
  }));
});

const currentTaskDownstreamDependencies = computed<DependencyCardItem[]>(() => {
  if (!task.value) return [];
  const succs = taskSuccessorsMap.value.get(Number(task.value.task_id)) || [];
  return succs.map((s) => ({
    ...s,
    direction: 'DOWNSTREAM' as const,
    relationshipNote: 'Dependent deliverable waiting for this task to be completed.',
  }));
});

const currentTaskFilteredDependencies = computed<DependencyCardItem[]>(() => {
  if (specDependencyFilterTab.value === 'upstream') {
    return currentTaskUpstreamDependencies.value;
  }
  if (specDependencyFilterTab.value === 'downstream') {
    return currentTaskDownstreamDependencies.value;
  }
  return [...currentTaskUpstreamDependencies.value, ...currentTaskDownstreamDependencies.value];
});

// Card Click Filter Handlers
function filterAllTasks() {
  scopeFilter.value = 'all';
  statusFilter.value = null;
  priorityFilter.value = null;
  projectFilter.value = null;
  atRiskOnly.value = false;
}

function filterInProgressTasks() {
  scopeFilter.value = 'all';
  priorityFilter.value = null;
  projectFilter.value = null;
  atRiskOnly.value = false;
  statusFilter.value = statusFilter.value === 'IN_PROGRESS' ? null : 'IN_PROGRESS';
}

function filterSupervisedTasks() {
  statusFilter.value = null;
  priorityFilter.value = null;
  projectFilter.value = null;
  atRiskOnly.value = false;
  scopeFilter.value = scopeFilter.value === 'supervised' ? 'all' : 'supervised';
}

function filterAtRiskTasks() {
  atRiskOnly.value = !atRiskOnly.value;
}

// Watch route query to support navigation with ?scope=supervised, ?scope=upstream, ?status=IN_PROGRESS, or ?project=...
watch(
  () => route.query,
  (query) => {
    if (query.scope && typeof query.scope === 'string') {
      if (
        ['all', 'assigned', 'supervised', 'upstream', 'downstream', 'verifications'].includes(
          query.scope,
        )
      ) {
        scopeFilter.value = query.scope as
          'all' | 'assigned' | 'supervised' | 'upstream' | 'downstream' | 'verifications';
      }
    }
    if (query.status && typeof query.status === 'string') {
      statusFilter.value = query.status as Task['status'];
    }
    if (query.project && typeof query.project === 'string') {
      projectFilter.value = query.project;
    }
    if (query.atRisk === 'true') {
      atRiskOnly.value = true;
    }
  },
  { immediate: true },
);

const createProjects = ref<Project[]>([]);
const projectMembersForCreate = ref<Array<{ label: string; value: number }>>([]);

interface CreateTaskForm {
  project_id: number | null;
  title: string;
  description: string;
  priority: Task['priority'];
  deadline: string;
  expected_effort: number;
  supervisor_id: number | null;
}

const createForm = ref<CreateTaskForm>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  deadline: '',
  expected_effort: 0,
  supervisor_id: null,
});

watch(
  () => createForm.value.project_id,
  async (newProjectId) => {
    if (!newProjectId) {
      projectMembersForCreate.value = [];
      createForm.value.supervisor_id = null;
      return;
    }
    try {
      const res = await getResourcesApi({ project_id: newProjectId });
      const seen = new Set<number>();
      const opts: Array<{ label: string; value: number }> = [];
      const myId = currentUserId.value;
      for (const r of res) {
        const id = Number(r.user_id);
        if (id && !isNaN(id) && id !== myId && !seen.has(id)) {
          seen.add(id);
          opts.push({
            label: `${r.name || r.email || `User #${r.user_id}`} (${r.role || 'RESOURCE'})`,
            value: id,
          });
        }
      }
      projectMembersForCreate.value = opts;
    } catch (err) {
      console.warn('Failed to load project members for supervisor select:', err);
      projectMembersForCreate.value = [];
    }
  },
);

const projectOptionsForCreate = computed(() => {
  const seen = new Set<number>();
  const opts: Project[] = [];
  for (const p of createProjects.value) {
    const id = Number(p.project_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push(p);
    }
  }
  return opts;
});

const hasTaskId = computed(() => Boolean(route.params.id));

const taskId = computed(() => Number(route.params.id));

const individualTask = ref<Task | null>(null);

const task = computed<Task | null>(() => {
  if (!hasTaskId.value) return null;

  return tasks.value.find((item) => item.task_id === taskId.value) ?? individualTask.value ?? null;
});

const projectOptions = computed(() => {
  const uniqueProjects = new Set(
    tasks.value.map((item) => item.project_name || `Project #${item.project_id}`),
  );

  return [...uniqueProjects].sort();
});

const filteredTasks = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  const myId = currentUserId.value;

  // Determine base source list of tasks depending on scope
  const sourceTasks: Task[] = (() => {
    if (scopeFilter.value === 'upstream') {
      // Upstream Scope: strictly tasks that are BLOCKED BY prerequisite tasks
      const upstreamMap = new Map<number, Task>();

      tasks.value.forEach((t) => {
        const preds = taskPredecessorsMap.value.get(Number(t.task_id)) || [];
        if (preds.length > 0) {
          upstreamMap.set(Number(t.task_id), t);
        }
      });

      return Array.from(upstreamMap.values());
    }
    if (scopeFilter.value === 'downstream') {
      // Downstream Scope: strictly tasks that BLOCK downstream deliverables
      const downstreamMap = new Map<number, Task>();

      // 1. Check loaded tasks that block other tasks
      tasks.value.forEach((t) => {
        const succs = taskSuccessorsMap.value.get(Number(t.task_id)) || [];
        if (succs.length > 0) {
          downstreamMap.set(Number(t.task_id), t);
        }
      });

      // 2. Also check if any task in allKnownTasksMap blocks one of my tasks
      allKnownTasksMap.value.forEach((kTask, kId) => {
        const succs = taskSuccessorsMap.value.get(Number(kId)) || [];
        if (succs.length > 0 && !downstreamMap.has(Number(kId))) {
          const isRelatedToMe =
            isAssignedToMe(kTask as Task) ||
            succs.some((s) =>
              myAssignedTasks.value.some((m) => Number(m.task_id) === Number(s.task_id)),
            );
          if (isRelatedToMe) {
            const full = allKnownTasksMap.value.get(Number(kId)) as Task;
            downstreamMap.set(Number(kId), {
              task_id: Number(kId),
              project_id: kTask.project_id,
              project_name: kTask.project_name,
              title: kTask.title,
              description: full?.description || null,
              priority: kTask.priority,
              status: kTask.status,
              deadline: kTask.deadline,
              planned_start: kTask.planned_start,
              planned_end: kTask.planned_end,
              expected_effort: kTask.expected_effort,
              actual_effort: kTask.actual_effort,
              progress: kTask.progress,
              is_schedule_at_risk: kTask.is_schedule_at_risk,
              is_deadline_at_risk: kTask.is_deadline_at_risk,
              assigned_resource_names: kTask.assigned_resource_names,
              supervisor_name: kTask.supervisor_name,
            } as Task);
          }
        }
      });

      return Array.from(downstreamMap.values());
    }
    return tasks.value;
  })();

  return sourceTasks.filter((item) => {
    // Scope filter for non-upstream
    if (scopeFilter.value === 'assigned') {
      if (Number(item.supervisor_id) === myId && !isSelfAssigned(item)) {
        if (Number(item.supervisor_id) === myId && item.created_by !== myId) {
          return false;
        }
      }
    } else if (scopeFilter.value === 'supervised') {
      if (Number(item.supervisor_id) !== myId) {
        return false;
      }
    } else if (scopeFilter.value === 'verifications') {
      if (item.task_type !== 'VERIFICATION' && !item.verified_task_id) {
        return false;
      }
    }

    if (atRiskOnly.value) {
      const isAtRisk = isOverdue(item) || item.is_schedule_at_risk || item.is_deadline_at_risk;
      if (!isAtRisk) {
        return false;
      }
    }

    const projectName = item.project_name || `Project #${item.project_id}`;

    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      projectName.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.supervisor_name || '').toLowerCase().includes(q);

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

watch([searchQuery, projectFilter, statusFilter, priorityFilter], () => {
  for (const key of Object.keys(columnPages)) {
    columnPages[key] = 1;
  }
});

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
    supervisor_id: null,
  };
  projectMembersForCreate.value = [];
}

const sessionStore = useSessionStore();

const canViewTaskHistory = computed(() => {
  if (!task.value) return false;
  return isAssignedToMe(task.value) || Number(task.value.supervisor_id) === currentUserId.value;
});

watch(canViewTaskHistory, (canView) => {
  if (!canView && taskDetailTab.value === 'history') {
    taskDetailTab.value = 'progress';
  }
});

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
      supervisor_id: createForm.value.supervisor_id || undefined,
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
  if (task.value && !canViewTaskHistory.value) return;
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

watch(taskId, async (id) => {
  taskDetailTab.value = 'progress';
  if (!id) {
    individualTask.value = null;
    workLogs.value = [];
    historyError.value = '';
    stopLiveSync();
    return;
  }

  // If task is not present in tasks list, load it individually (e.g. upstream dependency task)
  if (!tasks.value.some((t) => t.task_id === id)) {
    try {
      individualTask.value = await getTaskByIdApi(id);
    } catch {
      individualTask.value = null;
    }
  }

  if (task.value && canViewTaskHistory.value) {
    void loadHistory(id);
    startLiveSync(id);
  } else {
    workLogs.value = [];
    activeCoAssigneeSessions.value = [];
    historyError.value = '';
    stopLiveSync();
  }
});

async function loadTasks() {
  loading.value = true;
  error.value = '';

  try {
    tasks.value = await getTasksApi();

    // Populate resource names map from assigned_resources and schedules across tasks
    tasks.value.forEach((t) => {
      if (t.created_by && t.created_by_name) {
        resourceNamesMap.value[Number(t.created_by)] = t.created_by_name;
      }
      if (Array.isArray(t.assigned_resources)) {
        t.assigned_resources.forEach((ar) => {
          if (ar.user_id && ar.name) {
            resourceNamesMap.value[ar.user_id] = ar.name;
          }
        });
      }
      if (Array.isArray(t.schedules)) {
        t.schedules.forEach((sch) => {
          if (sch.user_id && sch.resource_name) {
            resourceNamesMap.value[sch.user_id] = sch.resource_name;
          }
        });
      }
    });

    if (hasTaskId.value && !tasks.value.some((t) => t.task_id === taskId.value)) {
      try {
        individualTask.value = await getTaskByIdApi(taskId.value);
      } catch {
        individualTask.value = null;
      }
    }

    if (task.value && canViewTaskHistory.value) {
      await loadHistory(task.value.task_id);
      startLiveSync(task.value.task_id);
    } else {
      workLogs.value = [];
      activeCoAssigneeSessions.value = [];
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
    created_by_name: item.created_by_name,
    created_by_role: item.created_by_role,
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
  if (task.value && !canViewTaskHistory.value) {
    workLogs.value = [];
    activeCoAssigneeSessions.value = [];
    historyError.value = '';
    historyLoading.value = false;
    return;
  }
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
.task-detail-tabs {
  background: var(--wo-bg-page, #fafbfc);
  border-bottom: 1px solid var(--wo-border, #e9ebef);
}

.task-detail-tab {
  font-size: 13px;
  font-weight: 600;
  min-height: 46px;
}

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
