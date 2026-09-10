<template>
  <q-page
    class="q-pa-md pm-tasks-page"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
  >
    <div style="max-width: 1400px; margin: 0 auto">
      <!-- 1. PAGE HEADER -->
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div
            class="page-title text-h5 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Tasks
          </div>
          <div class="text-body2 q-mt-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
            Track, organize, and manage work across all your active projects
          </div>
        </div>

        <div class="row items-center q-gutter-md">
          <!-- View Mode Switcher: Board / Table -->
          <q-btn-toggle
            v-model="viewMode"
            toggle-color="primary"
            toggle-text-color="white"
            color="transparent"
            :text-color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
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
            icon="add"
            label="New Task"
            color="primary"
            class="rounded-borders"
            @click="showCreateDialog = true"
          />
          <q-btn
            outline
            no-caps
            icon="refresh"
            label="Refresh"
            :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
            class="rounded-borders"
            :loading="loading"
            @click="loadData"
          />
        </div>
      </div>

      <!-- 2. STAT SUMMARY CARDS -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Total Tasks"
            :value="tasks.length"
            subtitle="All managed tasks"
            icon="task_alt"
            color="purple"
            note-class="note-purple"
            @click="filterAllTasks"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="In Progress"
            :value="inProgressCount"
            subtitle="Active work"
            icon="autorenew"
            color="blue"
            note-class="note-blue"
            @click="filterInProgressTasks"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Completed"
            :value="completedCount"
            subtitle="Done"
            icon="check_circle"
            color="green"
            note-class="note-green"
            @click="filterCompletedTasks"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Scheduled / Queued"
            :value="scheduledCount"
            subtitle="Ready to start"
            icon="schedule"
            color="purple"
            note-class="note-purple"
            @click="filterScheduledTasks"
          />
        </div>
      </div>

      <!-- 3. FILTER BAR -->
      <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders q-mb-md">
        <q-card-section class="row q-col-gutter-sm items-center">
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model="searchQuery"
              outlined
              dense
              clearable
              :dark="$q.dark.isActive"
              placeholder="Search title or description..."
            >
              <template #prepend>
                <q-icon name="search" size="18px" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="projectFilter"
              outlined
              dense
              emit-value
              map-options
              :dark="$q.dark.isActive"
              :options="projectFilterOptions"
              label="Filter Project"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="statusFilter"
              outlined
              dense
              emit-value
              map-options
              :dark="$q.dark.isActive"
              :options="statusFilterOptions"
              label="Filter Status"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="priorityFilter"
              outlined
              dense
              emit-value
              map-options
              :dark="$q.dark.isActive"
              :options="priorityFilterOptions"
              label="Filter Priority"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- LOADING STATE -->
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="44px" />
      </div>

      <!-- 4. KANBAN TASK BOARD VIEW -->
      <div v-else-if="viewMode === 'board'" class="row q-col-gutter-md">
        <div v-for="col in KANBAN_COLUMNS" :key="col.id" class="col-12 col-sm-6 col-md-3">
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
                  @click="quickCreateInColumn()"
                >
                  <q-tooltip>Add {{ col.title }} Task</q-tooltip>
                </q-btn>
              </q-card-section>

              <q-separator :dark="$q.dark.isActive" class="kanban-column-separator" />

              <!-- Column Tasks Cards List -->
              <q-card-section class="column no-wrap col-grow kanban-tasks-scroll-area">
                <q-card
                  v-for="task in getPaginatedTasks(col.id)"
                  :key="task.task_id"
                  flat
                  bordered
                  :dark="$q.dark.isActive"
                  class="rounded-borders cursor-pointer q-pa-sm column no-wrap"
                  style="height: 210px; overflow: hidden"
                  :class="$q.dark.isActive ? 'hover-bg-dark' : 'hover-bg-light'"
                  @click="openTaskDetails(task)"
                >
                  <!-- Card Header -->
                  <div class="row items-center justify-between no-wrap q-mb-xs" style="flex-shrink: 0">
                    <div class="row items-center q-gutter-xs ellipsis">
                      <q-chip
                        dense
                        square
                        size="xs"
                        :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                        :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                      >
                        {{ getProjectName(task.project_id) }}
                      </q-chip>
                      <q-badge
                        v-if="task.task_type === 'VERIFICATION' || task.priority === 'NONE'"
                        color="indigo-7"
                        text-color="white"
                        style="font-size: 10px"
                      >
                        Verification
                      </q-badge>
                      <q-badge v-else color="black" text-color="white" style="font-size: 10px">
                        {{ task.priority }}
                      </q-badge>
                    </div>

                    <!-- 3-Dot Action Menu -->
                    <q-btn flat round dense icon="more_vert" size="sm" color="grey-6" @click.stop>
                      <q-menu auto-close anchor="bottom right" self="top right">
                        <q-list dense style="min-width: 170px">
                          <q-item clickable @click="openEditModal(task)">
                            <q-item-section avatar
                              ><q-icon name="edit" size="16px" color="grey-8"
                            /></q-item-section>
                            <q-item-section>Edit Details</q-item-section>
                          </q-item>
                          <q-item clickable @click="openAssignTaskMemberDialog(task.task_id)">
                            <q-item-section avatar
                              ><q-icon name="person_add" size="16px" color="primary"
                            /></q-item-section>
                            <q-item-section>Assign Member</q-item-section>
                          </q-item>
                          <q-item clickable @click="openDependencyDialog(task)">
                            <q-item-section avatar
                              ><q-icon name="account_tree" size="16px" color="teal"
                            /></q-item-section>
                            <q-item-section>Add Dependency</q-item-section>
                          </q-item>
                          <q-item
                            v-if="task.status === 'COMPLETED' || Number(task.progress) === 100"
                            clickable
                            @click="openAssignVerification(task)"
                          >
                            <q-item-section avatar
                              ><q-icon name="verified_user" size="16px" color="indigo"
                            /></q-item-section>
                            <q-item-section>Assign Verification</q-item-section>
                          </q-item>
                          <q-separator />
                          <q-item clickable class="text-negative" @click="confirmDeleteTask(task)">
                            <q-item-section avatar
                              ><q-icon name="delete" size="16px" color="negative"
                            /></q-item-section>
                            <q-item-section>Delete Task</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-btn>
                  </div>

                  <!-- Middle content area: chips + title + description — clips at fixed height -->
                  <div class="col-grow" style="overflow: hidden; min-height: 0">
                    <!-- Verification Task Indicator -->
                    <div v-if="task.verified_task_id" class="q-mb-xs">
                      <q-chip
                        dense
                        square
                        size="xs"
                        color="indigo-1"
                        text-color="indigo-9"
                        icon="verified"
                        class="text-weight-bold"
                      >
                        Verify #{{ task.verified_task_id }}:
                        {{ task.verified_task_title || 'Deliverable' }}
                      </q-chip>
                    </div>

                    <!-- Parent Task Verification Review State -->
                    <div v-if="task.verification_task" class="q-mb-xs">
                      <q-chip
                        dense
                        square
                        size="xs"
                        color="blue-grey-1"
                        text-color="blue-grey-9"
                        icon="fact_check"
                        class="text-weight-bold"
                      >
                        Verifier: {{ task.verification_task.verifier_name || 'Assigned' }} ({{
                          task.verification_task.status
                        }})
                      </q-chip>
                    </div>

                    <!-- Self-Assigned by Resource Indicator -->
                    <div v-if="getSelfAssignedCreatorName(task)" class="q-mb-xs">
                      <q-chip
                        dense
                        square
                        size="xs"
                        :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                        :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                        icon="person"
                        class="text-weight-bold"
                      >
                        Resource {{ getSelfAssignedCreatorName(task) }} created task
                      </q-chip>
                    </div>

                    <!-- Task Title & Description -->
                    <div
                      class="text-subtitle2 text-weight-bold ellipsis-2-lines q-mb-xs"
                      :title="task.title"
                    >
                      {{ task.title }}
                    </div>
                    <div
                      v-if="task.description"
                      class="text-caption text-grey-6 ellipsis-2-lines"
                    >
                      {{ task.description }}
                    </div>
                  </div>

                  <!-- Progress Bar — always pinned at bottom -->
                  <div class="q-mt-xs" style="flex-shrink: 0">
                    <div class="row items-center justify-between text-caption q-mb-xs">
                      <span class="text-weight-bold">{{ Number(task.progress) || 0 }}%</span>
                      <span class="text-grey-6"
                        >{{ formatHours(task.expected_effort || 8) }} effort</span
                      >
                    </div>
                    <q-linear-progress
                      rounded
                      size="4px"
                      :value="(Number(task.progress) || 0) / 100"
                      :color="col.id === 'COMPLETED' ? 'positive' : 'primary'"
                      :track-color="$q.dark.isActive ? 'grey-8' : 'grey-3'"
                    />
                  </div>

                  <!-- Card Footer — always pinned at bottom -->
                  <div class="row items-center justify-between q-mt-sm text-caption" style="flex-shrink: 0">
                    <div class="row items-center q-gutter-xs">
                      <template
                        v-if="task.assigned_resource_ids && task.assigned_resource_ids.length > 0"
                      >
                        <q-avatar
                          v-for="rId in task.assigned_resource_ids.slice(0, 3)"
                          :key="rId"
                          size="20px"
                          color="primary"
                          text-color="white"
                          class="cursor-pointer text-caption"
                          @click.stop="confirmUnassignResource(task, rId)"
                        >
                          {{ getResourceName(rId).charAt(0).toUpperCase() }}
                          <q-tooltip>{{ getResourceName(rId) }} (Click to unassign)</q-tooltip>
                        </q-avatar>
                      </template>
                      <span
                        v-else
                        class="text-grey-6 cursor-pointer"
                        @click.stop="openAssignTaskMemberDialog(task.task_id)"
                      >
                        + Assign
                      </span>
                    </div>

                    <span
                      :class="
                        isTaskOverdue(task) ? 'text-negative text-weight-bold' : 'text-grey-6'
                      "
                    >
                      <q-icon name="event" size="13px" />
                      {{ task.deadline ? formatDate(task.deadline) : 'TBD' }}
                    </span>
                  </div>
                </q-card>

                <!-- Empty Column State -->
                <div
                  v-if="!tasksByStatus[col.id]?.length"
                  class="q-pa-md text-center text-grey-5 column items-center justify-center col-grow"
                >
                  <q-icon :name="col.icon" size="24px" class="q-mb-xs" />
                  <div class="text-caption">No {{ col.title.toLowerCase() }} tasks</div>
                </div>
              </q-card-section>
            </div>

            <!-- Column Pagination Footer -->
            <div v-if="tasksByStatus[col.id]?.length > 0" class="kanban-column-footer">
              <q-separator :dark="$q.dark.isActive" />
              <div
                class="row items-center justify-between no-wrap q-px-sm q-py-xs"
                :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2'"
              >
                <div class="row items-center no-wrap q-gutter-xs">
                  <span class="text-caption text-grey-6 text-weight-medium" style="font-size: 11px">
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
                      getColumnPageSize(col.id) === 999 ? 'All' : getColumnPageSize(col.id) + '/col'
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

      <!-- 5. TABLE / LIST VIEW -->
      <q-card v-else flat bordered :dark="$q.dark.isActive" class="rounded-borders">
        <q-table
          flat
          :dark="$q.dark.isActive"
          :rows="filteredTasks"
          :columns="tableColumns"
          row-key="task_id"
          no-data-label="No tasks found matching criteria"
          :pagination="{ rowsPerPage: 10 }"
          @row-click="(_evt, row) => openTaskDetails(row)"
        >
          <template #body-cell-title="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-xs">
                <span class="text-weight-bold ellipsis">{{ props.row.title }}</span>
                <q-chip
                  v-if="getSelfAssignedCreatorName(props.row)"
                  dense
                  square
                  size="xs"
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                  icon="person"
                  class="text-weight-bold"
                >
                  resource {{ getSelfAssignedCreatorName(props.row) }} created task
                </q-chip>
              </div>
              <div v-if="props.row.description" class="text-caption text-grey-6 ellipsis">
                {{ props.row.description }}
              </div>
            </q-td>
          </template>

          <template #body-cell-project="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                size="xs"
                :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
              >
                {{ getProjectName(props.row.project_id) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-resources="props">
            <q-td :props="props">
              <div
                v-if="props.row.assigned_resource_ids && props.row.assigned_resource_ids.length > 0"
                class="row q-gutter-xs wrap"
              >
                <q-chip
                  v-for="rId in props.row.assigned_resource_ids"
                  :key="rId"
                  dense
                  square
                  removable
                  :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
                  :text-color="$q.dark.isActive ? 'white' : 'dark'"
                  @click.stop
                  @remove="confirmUnassignResource(props.row, rId)"
                >
                  {{ getResourceName(rId) }}
                </q-chip>
              </div>
              <span v-else class="text-caption text-grey-5">Unassigned</span>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
                :text-color="$q.dark.isActive ? 'white' : 'dark'"
              >
                {{ formatStatus(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-priority="props">
            <q-td :props="props">
              <q-chip
                v-if="props.row.task_type === 'VERIFICATION' || props.row.priority === 'NONE'"
                dense
                square
                color="indigo-7"
                text-color="white"
              >
                Verification
              </q-chip>
              <q-chip v-else dense square color="black" text-color="white">
                {{ props.row.priority }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-progress="props">
            <q-td :props="props">
              <div style="min-width: 100px">
                <div class="row items-center justify-between text-caption q-mb-xs">
                  <span class="text-weight-bold">{{ props.row.progress || 0 }}%</span>
                  <span class="text-grey-6">{{ formatHours(props.row.expected_effort || 0) }}</span>
                </div>
                <q-linear-progress
                  rounded
                  size="4px"
                  :value="(Number(props.row.progress) || 0) / 100"
                  color="primary"
                  :track-color="$q.dark.isActive ? 'grey-8' : 'grey-3'"
                />
              </div>
            </q-td>
          </template>

          <template #body-cell-deadline="props">
            <q-td :props="props">
              {{ props.row.deadline ? formatDate(props.row.deadline) : 'TBD' }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" auto-width @click.stop>
              <div class="row items-center justify-center q-gutter-xs no-wrap">
                <q-btn
                  v-if="props.row.status === 'COMPLETED' || Number(props.row.progress) === 100"
                  flat
                  round
                  dense
                  icon="verified_user"
                  color="indigo"
                  @click="openAssignVerification(props.row)"
                >
                  <q-tooltip>Assign for Verification</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="person_add"
                  color="primary"
                  @click="openAssignTaskMemberDialog(props.row.task_id)"
                >
                  <q-tooltip>Assign Member</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="account_tree"
                  color="teal"
                  @click="openDependencyDialog(props.row)"
                >
                  <q-tooltip>Add Dependency</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="grey-7"
                  @click="openEditModal(props.row)"
                >
                  <q-tooltip>Edit Task</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click="confirmDeleteTask(props.row)"
                >
                  <q-tooltip>Delete Task</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- TASK DETAILS POPUP DIALOG -->
      <TaskDetailsDialog
        v-model="showTaskDetailsDialog"
        :task="selectedTaskDetails"
        :project-name="selectedTaskDetails ? getProjectName(selectedTaskDetails.project_id) : ''"
        :resource-names-map="resourceNamesMap"
        :predecessor-titles-map="taskTitlesMap"
        :allow-unassign="true"
        :allow-assign-member="true"
        :allow-add-dependency="true"
        :allow-remove-dependency="true"
        @edit="openEditFromDetails"
        @assign-member="openAssignFromDetails"
        @add-dependency="openDependencyFromDetails"
        @assign-verification="openAssignVerificationFromDetails"
        @unassign-member="({ resourceId }) => unassignFromDetails(resourceId)"
        @remove-dependency="
          ({ taskId, predecessorId, predecessorTitle }) =>
            confirmRemoveDependencyFromDetails(taskId, predecessorId, predecessorTitle)
        "
      />

      <!-- ASSIGN MEMBER DIALOG -->
      <q-dialog v-model="showAssignTaskMemberDialog">
        <q-card :dark="$q.dark.isActive" style="min-width: 400px" class="rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div class="text-subtitle1 text-weight-bold">Assign Member to Task</div>
            <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
          </q-card-section>

          <q-form @submit.prevent="handleAssignTaskMember">
            <q-card-section class="column q-gutter-md">
              <q-select
                v-model="assignTaskMemberForm.task_id"
                outlined
                dense
                :dark="$q.dark.isActive"
                label="Select Task"
                :options="taskSelectOptions"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Task is required']"
              />

              <q-select
                v-model="assignTaskMemberForm.user_ids"
                outlined
                dense
                multiple
                clearable
                :dark="$q.dark.isActive"
                :display-value="
                  assignTaskMemberForm.user_ids.length
                    ? `${assignTaskMemberForm.user_ids.length} selected`
                    : ''
                "
                label="Select Member(s)"
                :options="resourceMemberSelectOptions"
                emit-value
                map-options
                :rules="[(val) => (val && val.length > 0) || 'At least one member is required']"
              />
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                label="Assign to Task"
                :loading="submittingTaskMember"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- MANAGE TASK DEPENDENCY DIALOG -->
      <q-dialog v-model="showDependencyDialog">
        <q-card :dark="$q.dark.isActive" style="width: 520px; max-width: 95vw; border-radius: 12px">
          <q-card-section class="row items-center justify-between q-pb-none">
            <div>
              <div class="text-caption text-weight-bold text-primary">TASK DEPENDENCIES</div>
              <div class="text-h6 text-weight-bold">
                Manage Predecessors for "{{ selectedDependencyTaskName }}"
              </div>
            </div>
            <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
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
              :display-value="
                selectedPredecessorTaskIds.length
                  ? `${selectedPredecessorTaskIds.length} selected`
                  : ''
              "
              label="Select Predecessor Task(s)"
              :options="dependencyPredecessorOptions"
              :disable="!selectedDependencyTaskId"
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
            <q-btn v-close-popup flat no-caps label="Close" color="grey-7" />
            <q-btn
              type="button"
              unelevated
              no-caps
              color="primary"
              label="Add Selected"
              :loading="submittingDependency"
              :disable="!selectedDependencyTaskId || !selectedPredecessorTaskIds?.length"
              @click="handleAddDependency"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- CREATE TASK DIALOG -->
      <CreateTaskDialog
        v-model="showCreateDialog"
        :projects="projectSelectOptions"
        :member-options="createMemberOptions"
        :supervisor-options="createMemberOptions"
        :predecessor-options="createPredecessorOptions"
        :loading="submitting"
        @submit="handleCreateTask"
        @project-change="handleCreateProjectChange"
      />

      <!-- EDIT TASK DIALOG -->
      <q-dialog v-model="showEditDialog">
        <q-card :dark="$q.dark.isActive" style="min-width: 450px" class="rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div class="text-subtitle1 text-weight-bold">Update Task: {{ editingTaskTitle }}</div>
            <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
          </q-card-section>

          <q-form @submit.prevent="handleUpdateTask">
            <q-card-section class="column q-gutter-y-md">
              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-input
                    v-model="editForm.title"
                    outlined
                    dense
                    label="Task Title"
                    :dark="$q.dark.isActive"
                    :rules="[(val) => !!val.trim() || 'Title is required']"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-select
                    v-model="editForm.status"
                    outlined
                    dense
                    label="Status"
                    :options="['UNASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']"
                    :dark="$q.dark.isActive"
                    @update:model-value="onEditStatusChange"
                  />
                </div>
                <div class="col-6">
                  <q-select
                    v-model="editForm.priority"
                    outlined
                    dense
                    label="Priority"
                    :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                    :dark="$q.dark.isActive"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-select
                    v-model="editForm.supervisor_id"
                    outlined
                    dense
                    clearable
                    emit-value
                    map-options
                    label="Supervisor / Reviewer"
                    :options="editSupervisorOptions"
                    :dark="$q.dark.isActive"
                    hint="Designate an experienced resource to supervise and review deliverables"
                  >
                    <template #prepend>
                      <q-icon name="verified_user" color="amber-9" />
                    </template>
                  </q-select>
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input
                    v-model.number="editForm.progress"
                    outlined
                    dense
                    type="number"
                    min="0"
                    max="100"
                    label="Progress (%)"
                    :dark="$q.dark.isActive"
                    @update:model-value="onEditProgressChange"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model.number="editForm.expected_effort"
                    outlined
                    dense
                    type="number"
                    label="Effort (Hours)"
                    :dark="$q.dark.isActive"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-input
                    v-model="editForm.deadline"
                    outlined
                    dense
                    type="date"
                    label="Deadline"
                    stack-label
                    :dark="$q.dark.isActive"
                    :rules="[
                      (val) =>
                        !val ||
                        !editingTaskProject?.start_date ||
                        val >= editingTaskProject.start_date ||
                        `Deadline cannot be earlier than project start date (${editingTaskProject.start_date})`,
                      (val) =>
                        !val ||
                        !editingTaskProject?.deadline ||
                        val <= editingTaskProject.deadline ||
                        `Deadline cannot be later than project deadline (${editingTaskProject.deadline})`,
                    ]"
                  />
                </div>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                label="Save Changes"
                :loading="submitting"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- DELETE TASK CONFIRMATION DIALOG -->
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

      <!-- UNASSIGN TASK RESOURCE DIALOG -->
      <ConfirmActionDialog
        v-model="showUnassignDialog"
        title="Unassign Resource from Task"
        subtitle=""
        icon="person_remove"
        confirm-label="Unassign"
        :loading="unassigning"
        @confirm="handleExecuteUnassign"
      >
        Are you sure you want to remove <strong>{{ unassignTarget.resourceName }}</strong> from task
        <strong>"{{ unassignTarget.taskTitle }}"</strong>?
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

      <!-- ASSIGN VERIFICATION DIALOG -->
      <AssignVerificationDialog
        v-model="showAssignVerificationDialog"
        :task="verificationTargetTask"
        @saved="loadData"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import StatCard from '@/components/dashboard/StatCard.vue';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog.vue';
import TaskDetailsDialog from '@/components/tasks/TaskDetailsDialog.vue';
import AssignVerificationDialog from '@/components/tasks/AssignVerificationDialog.vue';
import CreateTaskDialog, { type CreateTaskFormData } from '@/components/tasks/CreateTaskDialog.vue';
import { formatDate, formatStatus, formatHours } from '@/utils/formatters';
import { getStatusFromProgress } from '@/utils/taskHelpers';
import {
  assignTaskResourceApi,
  addTaskDependencyApi,
  removeTaskDependencyApi,
  createTaskApi,
  deleteTaskApi,
  getProjectsApi,
  getResourcesApi,
  getTasksApi,
  unassignTaskResourceApi,
  updateTaskApi,
} from '@/services/api';
import type { Project, ResourceUser, Task, TaskPriority } from '@/services/api';

const $q = useQuasar();

const loading = ref(true);
const viewMode = ref<'board' | 'table'>('board');
const tasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);
const resources = ref<ResourceUser[]>([]);
const taskProjectMembers = ref<ResourceUser[]>([]);

const searchQuery = ref('');
const projectFilter = ref<number | 'ALL'>('ALL');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');

function resetFilters() {
  searchQuery.value = '';
  projectFilter.value = 'ALL';
  statusFilter.value = 'ALL';
  priorityFilter.value = 'ALL';
}

function filterAllTasks() {
  resetFilters();
}

function filterInProgressTasks() {
  resetFilters();
  statusFilter.value = 'IN_PROGRESS';
}

function filterCompletedTasks() {
  resetFilters();
  statusFilter.value = 'COMPLETED';
}

function filterScheduledTasks() {
  resetFilters();
  statusFilter.value = 'SCHEDULED';
}

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editingTaskId = ref<number | null>(null);
const submitting = ref(false);

const showDeleteTaskDialog = ref(false);
const deletingTask = ref(false);
const taskToDelete = ref<Task | null>(null);

interface KanbanColumn {
  id: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  title: string;
  dotColor: string;
  icon: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'UNASSIGNED',
    title: 'Unassigned',
    dotColor: '#64748b',
    icon: 'person_off',
  },
  {
    id: 'SCHEDULED',
    title: 'Scheduled',
    dotColor: '#8b6fd8',
    icon: 'calendar_month',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    dotColor: '#0284c7',
    icon: 'autorenew',
  },
  {
    id: 'COMPLETED',
    title: 'Completed',
    dotColor: '#059669',
    icon: 'check_circle',
  },
];

function quickCreateInColumn() {
  showCreateDialog.value = true;
}

function isTaskOverdue(task: Task): boolean {
  if (!task.deadline || task.status === 'COMPLETED') return false;
  return new Date(task.deadline).getTime() < new Date().setHours(0, 0, 0, 0);
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
      message: res.message || `Task "${taskToDelete.value.title}" moved to Recycle Bin`,
      position: 'top-right',
      icon: 'delete_sweep',
    });
    showDeleteTaskDialog.value = false;
    taskToDelete.value = null;
    await loadData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to move task to bin',
      position: 'top-right',
    });
  } finally {
    deletingTask.value = false;
  }
}

const showTaskDetailsDialog = ref(false);
const selectedTaskDetails = ref<Task | null>(null);

function openTaskDetails(task: Task) {
  selectedTaskDetails.value = task;
  showTaskDetailsDialog.value = true;
}

function openEditFromDetails() {
  showTaskDetailsDialog.value = false;
  if (selectedTaskDetails.value) {
    openEditModal(selectedTaskDetails.value);
  }
}

function openAssignFromDetails() {
  showTaskDetailsDialog.value = false;
  if (selectedTaskDetails.value) {
    openAssignTaskMemberDialog(selectedTaskDetails.value.task_id);
  }
}

function openDependencyFromDetails() {
  showTaskDetailsDialog.value = false;
  if (selectedTaskDetails.value) {
    openDependencyDialog(selectedTaskDetails.value);
  }
}

function unassignFromDetails(rId: number) {
  if (selectedTaskDetails.value) {
    confirmUnassignResource(selectedTaskDetails.value, rId);
  }
}

const showAssignVerificationDialog = ref(false);
const verificationTargetTask = ref<Task | null>(null);

function openAssignVerification(task: Task) {
  verificationTargetTask.value = task;
  showAssignVerificationDialog.value = true;
}

function openAssignVerificationFromDetails(task: Task) {
  showTaskDetailsDialog.value = false;
  openAssignVerification(task);
}

const taskTitlesMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {};
  for (const t of tasks.value) {
    map[t.task_id] = t.title;
  }
  return map;
});

const showUnassignDialog = ref(false);
const unassigning = ref(false);
const unassignTarget = reactive({
  taskId: 0,
  taskTitle: '',
  resourceId: 0,
  resourceName: '',
});

function confirmUnassignResource(task: Task, rId: number) {
  unassignTarget.taskId = task.task_id;
  unassignTarget.taskTitle = task.title;
  unassignTarget.resourceId = rId;
  unassignTarget.resourceName = getResourceName(rId);
  showUnassignDialog.value = true;
}

async function handleExecuteUnassign() {
  if (!unassignTarget.taskId || !unassignTarget.resourceId) return;

  unassigning.value = true;
  try {
    await unassignTaskResourceApi(unassignTarget.taskId, unassignTarget.resourceId);
    $q.notify({
      type: 'positive',
      message: `Unassigned ${unassignTarget.resourceName} successfully`,
    });
    showUnassignDialog.value = false;
    await loadData();

    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === unassignTarget.taskId) {
      const updated = tasks.value.find((t) => t.task_id === unassignTarget.taskId);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to unassign resource',
    });
  } finally {
    unassigning.value = false;
  }
}

const showAssignTaskMemberDialog = ref(false);
const submittingTaskMember = ref(false);

const showDependencyDialog = ref(false);
const selectedDependencyTaskId = ref<number | null>(null);
const selectedPredecessorTaskIds = ref<number[]>([]);
const submittingDependency = ref(false);

const assignTaskMemberForm = reactive({
  task_id: null as number | null,
  user_ids: [] as number[],
});

watch(
  () => assignTaskMemberForm.task_id,
  async (newTaskId) => {
    if (newTaskId) {
      const t = tasks.value.find((item) => item.task_id === newTaskId);
      if (t?.project_id) {
        taskProjectMembers.value = await getResourcesApi(t.project_id).catch(() => []);
        return;
      }
    }
    taskProjectMembers.value = [];
  },
  { immediate: true },
);

const resourceNamesMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {};
  for (const r of resources.value) {
    map[r.user_id] = r.name;
  }
  return map;
});

function getResourceName(id: number): string {
  return resourceNamesMap.value[id] || `Resource #${id}`;
}

function getSelfAssignedCreatorName(task: Task | null | undefined): string | null {
  if (!task) return null;
  const rawTask = task as unknown as Record<string, unknown>;
  const rawCreatedBy = task.created_by ?? rawTask.createdBy ?? rawTask.created_by_id;
  const createdById = Number(rawCreatedBy);
  if (!createdById) return null;

  const resource = resources.value.find((r) => r.user_id === createdById);
  if (resource) {
    return resource.name;
  }

  if (rawTask.created_by_role === 'RESOURCE' && typeof rawTask.created_by_name === 'string') {
    return rawTask.created_by_name;
  }

  return null;
}

const resourceMemberSelectOptions = computed(() => {
  const source =
    assignTaskMemberForm.task_id && taskProjectMembers.value.length > 0
      ? taskProjectMembers.value
      : resources.value;
  const currentTask = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
  const alreadyAssignedIds = currentTask?.assigned_resource_ids || [];

  const seen = new Set<number>();
  const opts: Array<{
    label: string;
    value: number;
    alreadyAssigned: boolean;
    disable: boolean;
  }> = [];

  for (const r of source) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      const isAssigned = alreadyAssignedIds.includes(id);
      opts.push({
        label: r.name,
        value: id,
        alreadyAssigned: isAssigned,
        disable: isAssigned,
      });
    }
  }

  return opts;
});

const createProjectMembers = ref<ResourceUser[]>([]);

const createForm = reactive<{
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expected_effort: number;
  deadline: string;
  assigned_resource_ids: number[];
  predecessor_task_ids: number[];
  supervisor_id?: number | null;
}>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  expected_effort: 8,
  deadline: '',
  assigned_resource_ids: [],
  predecessor_task_ids: [],
  supervisor_id: null,
});

watch(
  () => createForm.project_id,
  async (newProjectId) => {
    createForm.assigned_resource_ids = [];
    createForm.predecessor_task_ids = [];
    createForm.supervisor_id = null;
    if (newProjectId) {
      const members = await getResourcesApi(newProjectId).catch(() => []);
      createProjectMembers.value = members;
    } else {
      createProjectMembers.value = [];
    }
  },
  { immediate: true },
);

const createMemberOptions = computed(() => {
  const source =
    createProjectMembers.value.length > 0 ? createProjectMembers.value : resources.value;
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: number }> = [];
  for (const r of source) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({
        label: r.name,
        value: id,
      });
    }
  }
  return opts;
});

const createPredecessorOptions = computed(() => {
  if (!createForm.project_id) return [];
  return tasks.value
    .filter((t) => t.project_id === createForm.project_id)
    .map((t) => ({
      label: `${t.title} (#${t.task_id})`,
      value: t.task_id,
    }));
});

const editingTaskTitle = computed(() => {
  const t = tasks.value.find((task) => Number(task.task_id) === Number(editingTaskId.value));
  return t ? t.title : `Task #${editingTaskId.value}`;
});

const editForm = reactive<{
  title: string;
  status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  priority: TaskPriority;
  progress: number;
  expected_effort: number;
  deadline: string;
  supervisor_id: number | null;
}>({
  title: '',
  status: 'UNASSIGNED',
  priority: 'MEDIUM',
  progress: 0,
  expected_effort: 8,
  deadline: '',
  supervisor_id: null,
});

const editSupervisorOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: number }> = [];

  const getSource = () => {
    if (!editingTaskId.value) return resources.value;
    const t = tasks.value.find((task) => Number(task.task_id) === Number(editingTaskId.value));
    if (!t?.project_id) return resources.value;
    return taskProjectMembers.value.length > 0 ? taskProjectMembers.value : resources.value;
  };

  for (const r of getSource()) {
    const id = Number(r.user_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({ label: r.name, value: id });
    }
  }

  return opts;
});

const statusFilterOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Unassigned', value: 'UNASSIGNED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const priorityFilterOptions = [
  { label: 'All Priorities', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const projectFilterOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{ label: string; value: string | number }> = [
    { label: 'All Projects', value: 'ALL' },
  ];
  for (const p of projects.value) {
    const id = Number(p.project_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({ label: p.name, value: id });
    }
  }
  return opts;
});

const projectSelectOptions = computed(() => {
  const seen = new Set<number>();
  const opts: Array<{
    label: string;
    value: number;
    start_date?: string | null;
    deadline?: string | null;
  }> = [];
  for (const p of projects.value) {
    const id = Number(p.project_id);
    if (id && !isNaN(id) && !seen.has(id)) {
      seen.add(id);
      opts.push({
        label: p.name,
        value: id,
        start_date: p.start_date,
        deadline: p.deadline,
      });
    }
  }
  return opts;
});

const editingTaskProject = computed(() => {
  if (!editingTaskId.value) return null;
  const t = tasks.value.find((item) => Number(item.task_id) === Number(editingTaskId.value));
  if (!t) return null;
  return projects.value.find((p) => Number(p.project_id) === Number(t.project_id)) || null;
});

const taskSelectOptions = computed(() =>
  tasks.value.map((t) => ({ label: `${t.title} (#${t.task_id})`, value: t.task_id })),
);

const existingTaskDependencies = reactive<Record<number, number[]>>({});

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

const dependencyToRemove = ref<{
  task_id: number;
  title: string;
  successorTaskId?: number | undefined;
} | null>(null);
const showRemoveDependencyDialog = ref(false);
const dependencyRemoving = ref(false);

const dependencyPredecessorOptions = computed(() => {
  const selectedTask = tasks.value.find(
    (task) => Number(task.task_id) === Number(selectedDependencyTaskId.value),
  );
  if (!selectedTask) return [];

  const currentTaskId = Number(selectedDependencyTaskId.value);
  const currentTaskDeps = [
    ...(existingTaskDependencies[currentTaskId] || []),
    ...(selectedTask.predecessor_task_ids || []).map(Number),
  ];

  const existingSet = new Set(currentTaskDeps);

  // Compute downstream descendants of currentTaskId within this project
  const adjList: Record<number, number[]> = {};
  for (const t of tasks.value) {
    if (Number(t.project_id) === Number(selectedTask.project_id)) {
      const tId = Number(t.task_id);
      const preds = existingTaskDependencies[tId] || (t.predecessor_task_ids || []).map(Number);
      for (const pred of preds) {
        if (!adjList[pred]) adjList[pred] = [];
        adjList[pred].push(tId);
      }
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
    .filter(
      (task) =>
        Number(task.task_id) !== currentTaskId &&
        Number(task.project_id) === Number(selectedTask.project_id),
    )
    .map((task) => {
      const tId = Number(task.task_id);
      const isDep = existingSet.has(tId);
      const isCyclic = cyclicTaskIds.has(tId);
      return {
        label: `${task.title} (#${task.task_id})`,
        value: tId,
        alreadyDependent: isDep,
        isCyclic: isCyclic,
        disable: isDep || isCyclic,
      };
    });
});

const tableColumns: QTableColumn<Task>[] = [
  {
    name: 'title',
    label: 'Task Title',
    field: (t) => t.title,
    align: 'left',
  },
  { name: 'project', label: 'Project', field: (t) => t.project_id, align: 'left' },
  { name: 'resources', label: 'Assigned Resources', field: () => '', align: 'left' },
  { name: 'priority', label: 'Priority', field: (t) => t.priority, align: 'center' },
  { name: 'status', label: 'Status', field: (t) => t.status, align: 'center' },
  { name: 'progress', label: 'Progress', field: (t) => Number(t.progress) || 0, align: 'left' },
  {
    name: 'deadline',
    label: 'Deadline',
    field: (t) => (t.deadline ? t.deadline.split('T')[0] : 'TBD'),
    align: 'left',
  },
  { name: 'actions', label: 'Actions', field: () => '', align: 'center' },
];

async function loadData() {
  loading.value = true;
  try {
    const [tList, pList, rList] = await Promise.all([
      getTasksApi(),
      getProjectsApi(),
      getResourcesApi(),
    ]);
    tasks.value = tList;
    projects.value = pList;
    resources.value = rList;
    if (pList.length > 0 && pList[0] && !createForm.project_id) {
      createForm.project_id = pList[0].project_id;
    }
  } catch (error) {
    console.error('Failed to fetch tasks/projects/resources from backend:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadData();
});

const inProgressCount = computed(
  () => tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
);

const completedCount = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);

const scheduledCount = computed(
  () => tasks.value.filter((t) => t.status === 'SCHEDULED' || t.status === 'UNASSIGNED').length,
);

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q));

    const matchesProject = projectFilter.value === 'ALL' || t.project_id === projectFilter.value;

    const matchesStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;

    const matchesPriority = priorityFilter.value === 'ALL' || t.priority === priorityFilter.value;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });
});

const tasksByStatus = computed(() => {
  const map: Record<'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED', Task[]> = {
    UNASSIGNED: [],
    SCHEDULED: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  };

  for (const task of filteredTasks.value) {
    if (task.status in map) {
      map[task.status].push(task);
    } else {
      map.UNASSIGNED.push(task);
    }
  }

  return map;
});

const columnTasksPerPage = reactive<Record<string, number>>({
  UNASSIGNED: 10,
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
  UNASSIGNED: 1,
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
  const count = tasksByStatus.value[colId as keyof typeof tasksByStatus.value]?.length || 0;
  return Math.max(1, Math.ceil(count / getColumnPageSize(colId)));
}

function getColumnPage(colId: string): number {
  return columnPages[colId] ?? 1;
}

function setColumnPage(colId: string, page: number): void {
  columnPages[colId] = page;
}

function getPaginatedTasks(colId: string): Task[] {
  const all = tasksByStatus.value[colId as keyof typeof tasksByStatus.value] || [];
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

function getProjectName(projectId: number): string {
  const p = projects.value.find((proj) => proj.project_id === projectId);
  return p ? p.name : `Project #${projectId}`;
}

function openAssignTaskMemberDialog(taskId: number | null) {
  assignTaskMemberForm.task_id = taskId || (tasks.value[0]?.task_id ?? null);
  assignTaskMemberForm.user_ids = [];
  showAssignTaskMemberDialog.value = true;
}

async function handleAssignTaskMember() {
  if (!assignTaskMemberForm.task_id || !assignTaskMemberForm.user_ids?.length) return;

  const currentTask = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
  const alreadyAssignedIds = currentTask?.assigned_resource_ids || [];
  const toAssignIds = assignTaskMemberForm.user_ids.filter(
    (id) => !alreadyAssignedIds.includes(id),
  );

  if (toAssignIds.length === 0) {
    $q.notify({
      type: 'info',
      message: 'Selected member(s) are already assigned to this task',
    });
    showAssignTaskMemberDialog.value = false;
    assignTaskMemberForm.user_ids = [];
    return;
  }

  submittingTaskMember.value = true;
  try {
    for (const userId of toAssignIds) {
      await assignTaskResourceApi(assignTaskMemberForm.task_id, userId);
    }
    $q.notify({
      type: 'positive',
      message: `${toAssignIds.length} member(s) assigned to task successfully`,
    });
    showAssignTaskMemberDialog.value = false;
    assignTaskMemberForm.user_ids = [];
    await loadData();
    if (
      selectedTaskDetails.value &&
      selectedTaskDetails.value.task_id === assignTaskMemberForm.task_id
    ) {
      const updated = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to assign members to task';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submittingTaskMember.value = false;
  }
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
  const currentDeps = existingTaskDependencies[taskId] || [];
  const toAdd = selectedPredecessorTaskIds.value.filter((id) => !currentDeps.includes(id));

  if (toAdd.length === 0) {
    $q.notify({
      type: 'info',
      message: 'Selected predecessor(s) are already dependencies of this task',
    });
    showDependencyDialog.value = false;
    selectedPredecessorTaskIds.value = [];
    return;
  }

  submittingDependency.value = true;
  try {
    for (const predId of toAdd) {
      await addTaskDependencyApi(taskId, predId);
    }

    if (!existingTaskDependencies[taskId]) {
      existingTaskDependencies[taskId] = [];
    }
    existingTaskDependencies[taskId].push(...toAdd);

    const successor = tasks.value.find((task) => Number(task.task_id) === Number(taskId));
    if (successor) {
      if (!successor.predecessor_task_ids) {
        successor.predecessor_task_ids = [];
      }
      successor.predecessor_task_ids.push(...toAdd);
    }

    $q.notify({
      type: 'positive',
      message: `Added ${toAdd.length} dependency/dependencies to "${successor?.title ?? 'Task'}"`,
    });

    showDependencyDialog.value = false;
    selectedDependencyTaskId.value = null;
    selectedPredecessorTaskIds.value = [];
    await loadData();
    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === taskId) {
      const updated = tasks.value.find((t) => t.task_id === taskId);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to add task dependency',
    });
  } finally {
    submittingDependency.value = false;
  }
}

function confirmRemoveDependency(pred: { task_id: number; title: string }) {
  dependencyToRemove.value = {
    task_id: pred.task_id,
    title: pred.title,
    successorTaskId: selectedDependencyTaskId.value || undefined,
  };
  showRemoveDependencyDialog.value = true;
}

function confirmRemoveDependencyFromDetails(
  taskId: number,
  predecessorId: number,
  predecessorTitle: string,
) {
  dependencyToRemove.value = {
    task_id: predecessorId,
    title: predecessorTitle,
    successorTaskId: taskId,
  };
  showRemoveDependencyDialog.value = true;
}

async function handleExecuteRemoveDependency() {
  if (!dependencyToRemove.value) return;
  const successorId = dependencyToRemove.value.successorTaskId || selectedDependencyTaskId.value;
  if (!successorId) return;

  const predId = dependencyToRemove.value.task_id;
  dependencyRemoving.value = true;
  try {
    await removeTaskDependencyApi(successorId, predId);
    $q.notify({
      type: 'positive',
      message: `Removed dependency on "${dependencyToRemove.value.title}"`,
    });
    showRemoveDependencyDialog.value = false;
    dependencyToRemove.value = null;
    await loadData();

    // Update local reactive record
    const updatedTask = tasks.value.find((t) => t.task_id === successorId);
    if (updatedTask) {
      existingTaskDependencies[successorId] = (updatedTask.predecessor_task_ids || []).map(Number);
    }
    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === successorId) {
      selectedTaskDetails.value = updatedTask || null;
    }
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to remove dependency',
    });
  } finally {
    dependencyRemoving.value = false;
  }
}

async function handleCreateProjectChange(newProjectId: number | null) {
  createForm.project_id = newProjectId;
  createForm.assigned_resource_ids = [];
  createForm.predecessor_task_ids = [];
  if (newProjectId) {
    const members = await getResourcesApi(newProjectId).catch(() => []);
    createProjectMembers.value = members;
  } else {
    createProjectMembers.value = [];
  }
}

async function handleCreateTask(formData?: CreateTaskFormData) {
  const data = formData || createForm;
  if (!data.project_id || !data.title.trim()) return;

  submitting.value = true;
  try {
    const newTask = await createTaskApi({
      project_id: data.project_id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority,
      expected_effort: Number(data.expected_effort) || 8,
      deadline: data.deadline || null,
      assigned_resource_ids: data.assigned_resource_ids,
      supervisor_id: data.supervisor_id || undefined,
    });

    const newTaskId = newTask?.task_id;
    let depErrors = 0;

    if (newTaskId && data.predecessor_task_ids && data.predecessor_task_ids.length > 0) {
      for (const predId of data.predecessor_task_ids) {
        try {
          await addTaskDependencyApi(newTaskId, predId);
        } catch {
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
      $q.notify({
        type: 'positive',
        message: 'Task created successfully',
      });
    }

    showCreateDialog.value = false;
    createForm.title = '';
    createForm.description = '';
    createForm.assigned_resource_ids = [];
    createForm.predecessor_task_ids = [];
    createForm.supervisor_id = null;
    await loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create task';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submitting.value = false;
  }
}

function openEditModal(task: Task) {
  editingTaskId.value = task.task_id;
  editForm.title = task.title;
  editForm.status = task.status;
  editForm.priority = task.priority;
  editForm.progress = Number(task.progress) || 0;
  editForm.expected_effort = Number(task.expected_effort) || 8;
  editForm.deadline = task.deadline?.split('T')[0] ?? '';
  editForm.supervisor_id = task.supervisor_id ? Number(task.supervisor_id) : null;
  showEditDialog.value = true;
}

function onEditProgressChange(val: number | string | null) {
  const num = Math.min(100, Math.max(0, Number(val) || 0));
  editForm.status = getStatusFromProgress(num);
}

function onEditStatusChange(newStatus: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') {
  if (newStatus === 'COMPLETED') {
    editForm.progress = 100;
  } else if (newStatus === 'SCHEDULED') {
    editForm.progress = 0;
  } else if (
    newStatus === 'IN_PROGRESS' &&
    (editForm.progress === 0 || editForm.progress === 100)
  ) {
    editForm.progress = 50;
  }
}

async function handleUpdateTask() {
  if (!editingTaskId.value || !editForm.title.trim()) return;

  submitting.value = true;
  try {
    await updateTaskApi(editingTaskId.value, {
      title: editForm.title.trim(),
      status: editForm.status,
      priority: editForm.priority,
      progress: Number(editForm.progress) || 0,
      expected_effort: Number(editForm.expected_effort) || 8,
      deadline: editForm.deadline || null,
      supervisor_id: editForm.supervisor_id ?? null,
    });

    $q.notify({
      type: 'positive',
      message: 'Task updated successfully',
    });

    showEditDialog.value = false;
    await loadData();
    if (selectedTaskDetails.value && selectedTaskDetails.value.task_id === editingTaskId.value) {
      const updated = tasks.value.find((t) => t.task_id === editingTaskId.value);
      selectedTaskDetails.value = updated || null;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update task';
    $q.notify({
      type: 'negative',
      message: msg,
    });
  } finally {
    submitting.value = false;
  }
}
</script>
