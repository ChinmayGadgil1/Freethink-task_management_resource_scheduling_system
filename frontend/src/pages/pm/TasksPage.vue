<template>
  <q-page class="q-pa-md" :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'">
    <div style="max-width: 1400px; margin: 0 auto">
      <!-- 1. PAGE HEADER -->
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h4 text-weight-bolder">Tasks</div>
          <div class="text-subtitle2" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
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
          <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders full-height">
            <!-- Column Header -->
            <q-card-section
              class="row items-center justify-between q-py-sm"
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
                @click="quickCreateInColumn(col.id)"
              >
                <q-tooltip>Add {{ col.title }} Task</q-tooltip>
              </q-btn>
            </q-card-section>

            <q-separator :dark="$q.dark.isActive" />

            <!-- Column Tasks Cards List -->
            <q-card-section class="q-pa-xs column q-gutter-xs" style="min-height: 200px">
              <q-card
                v-for="task in tasksByStatus[col.id]"
                :key="task.task_id"
                flat
                bordered
                :dark="$q.dark.isActive"
                class="rounded-borders cursor-pointer q-pa-sm"
                :class="$q.dark.isActive ? 'hover-bg-dark' : 'hover-bg-light'"
                @click="openTaskDetails(task)"
              >
                <!-- Card Header -->
                <div class="row items-center justify-between no-wrap q-mb-xs">
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
                    <q-badge color="black" text-color="white" style="font-size: 10px">
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

                <!-- Task Title & Description -->
                <div
                  class="text-subtitle2 text-weight-bold ellipsis-2-lines q-mb-xs"
                  :title="task.title"
                >
                  {{ task.title }}
                </div>
                <div
                  v-if="task.description"
                  class="text-caption text-grey-6 ellipsis-2-lines q-mb-xs"
                >
                  {{ task.description }}
                </div>

                <!-- Progress Bar -->
                <div class="q-mt-xs">
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

                <!-- Card Footer -->
                <div class="row items-center justify-between q-mt-sm text-caption">
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
                    :class="isTaskOverdue(task) ? 'text-negative text-weight-bold' : 'text-grey-6'"
                  >
                    <q-icon name="event" size="13px" />
                    {{ task.deadline ? formatDate(task.deadline) : 'TBD' }}
                  </span>
                </div>
              </q-card>

              <!-- Empty Column State -->
              <div
                v-if="!tasksByStatus[col.id]?.length"
                class="q-pa-md text-center text-grey-5 column items-center justify-center"
              >
                <q-icon :name="col.icon" size="24px" class="q-mb-xs" />
                <div class="text-caption">No {{ col.title.toLowerCase() }} tasks</div>
              </div>
            </q-card-section>
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
              <div class="text-weight-bold ellipsis">{{ props.row.title }}</div>
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
              <q-chip dense square color="black" text-color="white">
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
        @edit="openEditFromDetails"
        @assign-member="openAssignFromDetails"
        @add-dependency="openDependencyFromDetails"
        @unassign-member="({ resourceId }) => unassignFromDetails(resourceId)"
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

      <!-- ADD TASK DEPENDENCY DIALOG -->
      <q-dialog v-model="showDependencyDialog">
        <q-card :dark="$q.dark.isActive" style="min-width: 450px" class="rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Add Task Dependency</div>
              <div class="text-caption text-grey-6">Selected task will depend on predecessor.</div>
            </div>
            <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
          </q-card-section>

          <q-form @submit.prevent="handleAddDependency">
            <q-card-section class="column q-gutter-md">
              <q-select
                v-model="selectedDependencyTaskId"
                outlined
                dense
                :dark="$q.dark.isActive"
                label="Task"
                :options="taskSelectOptions"
                emit-value
                map-options
                :rules="[(value) => !!value || 'Task is required']"
              />

              <q-select
                v-model="selectedPredecessorTaskIds"
                outlined
                dense
                multiple
                clearable
                :dark="$q.dark.isActive"
                :display-value="
                  selectedPredecessorTaskIds.length
                    ? `${selectedPredecessorTaskIds.length} selected`
                    : ''
                "
                label="Depends On Predecessor(s)"
                :options="dependencyPredecessorOptions"
                emit-value
                map-options
                :rules="[
                  (val) => (val && val.length > 0) || 'At least one predecessor task is required',
                ]"
                :disable="!selectedDependencyTaskId"
              />
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                label="Add Dependency"
                :loading="submittingDependency"
                :disable="!selectedDependencyTaskId || !selectedPredecessorTaskIds?.length"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- CREATE TASK DIALOG -->
      <CreateTaskDialog
        v-model="showCreateDialog"
        :projects="projectSelectOptions"
        :member-options="createMemberOptions"
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
        title="Delete Task"
        subtitle="This action cannot be undone"
        confirm-label="Delete Task"
        :loading="deletingTask"
        @confirm="handleExecuteDeleteTask"
      >
        Are you sure you want to delete task <strong>"{{ taskToDelete?.title }}"</strong>? All
        associated dependencies and work logs will be removed.
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
import CreateTaskDialog, { type CreateTaskFormData } from '@/components/tasks/CreateTaskDialog.vue';
import { formatDate, formatStatus, formatHours } from '@/utils/formatters';
import { getStatusFromProgress } from '@/utils/taskHelpers';
import {
  assignTaskResourceApi,
  addTaskDependencyApi,
  createTaskApi,
  deleteTaskApi,
  getProjectsApi,
  getResourcesApi,
  getTasksApi,
  unassignTaskResourceApi,
  updateTaskApi,
} from '@/services/api';
import type { Project, ResourceUser, Task } from '@/services/api';

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

function quickCreateInColumn(status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') {
  createForm.status = status;
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
    await deleteTaskApi(taskToDelete.value.task_id);
    $q.notify({
      type: 'positive',
      message: `Task "${taskToDelete.value.title}" deleted successfully`,
    });
    showDeleteTaskDialog.value = false;
    taskToDelete.value = null;
    await loadData();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to delete task',
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

const resourceMemberSelectOptions = computed(() => {
  const source =
    assignTaskMemberForm.task_id && taskProjectMembers.value.length > 0
      ? taskProjectMembers.value
      : resources.value;
  const currentTask = tasks.value.find((t) => t.task_id === assignTaskMemberForm.task_id);
  const alreadyAssignedIds = currentTask?.assigned_resource_ids || [];

  return source.map((r) => {
    const isAssigned = alreadyAssignedIds.includes(r.user_id);
    return {
      label: r.name,
      value: r.user_id,
      alreadyAssigned: isAssigned,
      disable: isAssigned,
    };
  });
});

const createProjectMembers = ref<ResourceUser[]>([]);

const createForm = reactive<{
  project_id: number | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  expected_effort: number;
  deadline: string;
  assigned_resource_ids: number[];
  predecessor_task_ids: number[];
}>({
  project_id: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'UNASSIGNED',
  expected_effort: 8,
  deadline: '',
  assigned_resource_ids: [],
  predecessor_task_ids: [],
});

watch(
  () => createForm.project_id,
  async (newProjectId) => {
    createForm.assigned_resource_ids = [];
    createForm.predecessor_task_ids = [];
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
  return source.map((r) => ({
    label: r.name,
    value: r.user_id,
  }));
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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress: number;
  expected_effort: number;
  deadline: string;
}>({
  title: '',
  status: 'UNASSIGNED',
  priority: 'MEDIUM',
  progress: 0,
  expected_effort: 8,
  deadline: '',
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

const projectFilterOptions = computed(() => [
  { label: 'All Projects', value: 'ALL' },
  ...projects.value.map((p) => ({ label: p.name, value: p.project_id })),
]);

const projectSelectOptions = computed(() =>
  projects.value.map((p) => ({
    label: p.name,
    value: p.project_id,
    start_date: p.start_date,
    deadline: p.deadline,
  })),
);

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

const dependencyPredecessorOptions = computed(() => {
  const selectedTask = tasks.value.find(
    (task) => Number(task.task_id) === Number(selectedDependencyTaskId.value),
  );
  const currentTaskDeps = selectedDependencyTaskId.value
    ? [
        ...(existingTaskDependencies[selectedDependencyTaskId.value] || []),
        ...(selectedTask?.predecessor_task_ids || []).map(Number),
      ]
    : [];

  const existingSet = new Set(currentTaskDeps);

  return tasks.value
    .filter(
      (task) =>
        Number(task.task_id) !== Number(selectedDependencyTaskId.value) &&
        Number(task.project_id) === Number(selectedTask?.project_id),
    )
    .map((task) => {
      const tId = Number(task.task_id);
      const isDep = existingSet.has(tId);
      return {
        label: `${task.title} (#${task.task_id})`,
        value: tId,
        alreadyDependent: isDep,
        disable: isDep,
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
