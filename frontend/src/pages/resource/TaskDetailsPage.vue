<template>
  <q-page class="q-pa-lg workspace-page">
    <!-- Page Title & Navigation -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="row items-center q-gutter-sm q-mb-xs">
          <q-btn
            flat
            dense
            round
            icon="arrow_back"
            color="grey-7"
            @click="router.push('/app/resource-dashboard/tasks')"
          >
            <q-tooltip>Back to My Tasks</q-tooltip>
          </q-btn>
          <div class="text-h5 text-weight-bold">Task Specifications</div>
        </div>
        <div class="text-body2 text-grey-6">
          Detailed specifications, technical contracts, and work logs for assigned tasks.
        </div>
      </div>

      <!-- Task Selector & Quick Actions -->
      <div class="row items-center q-gutter-sm q-mt-sm-none q-mt-md">
        <q-select
          v-model="selectedTaskId"
          :options="taskSelectOptions"
          option-value="id"
          option-label="name"
          emit-value
          map-options
          dense
          outlined
          bg-color="white"
          style="min-width: 260px"
          label="Active Task"
        >
          <template #prepend>
            <q-icon name="swap_horiz" size="18px" color="primary" />
          </template>
        </q-select>

        <q-btn
          unelevated
          color="primary"
          icon="add_alarm"
          label="Log Work"
          no-caps
          @click="openWorkLogDialog"
        />

        <q-btn
          outlined
          color="grey-8"
          icon="edit"
          label="Update Progress"
          no-caps
          @click="openUpdateDialog"
        />
      </div>
    </div>

    <!-- 01 — OVERVIEW -->
    <WorkspaceSection
      number="01"
      label="Task Header"
      title="Task overview & status"
      description="Key metadata, status, deadlines, and assigned personnel for this task."
    >
      <q-card flat bordered class="q-pa-md bg-white rounded-borders">
        <div class="row items-start justify-between">
          <div>
            <div class="row items-center q-gutter-xs q-mb-xs">
              <q-badge color="purple-1" text-color="primary" class="text-weight-bold">
                #TASK-{{ currentTask.id }}
              </q-badge>

              <q-chip
                dense
                size="11px"
                :color="getPriorityBg(currentTask.priority)"
                :text-color="getPriorityColor(currentTask.priority)"
                class="text-weight-bold"
              >
                {{ currentTask.priority }} Priority
              </q-chip>

              <q-chip
                dense
                size="11px"
                :color="getStatusBg(currentTask.status)"
                :text-color="getStatusColor(currentTask.status)"
                class="text-weight-bold"
              >
                {{ formatStatus(currentTask.status) }}
              </q-chip>

              <q-chip
                v-if="isOverdue"
                dense
                size="11px"
                color="red-1"
                text-color="negative"
                class="text-weight-bold"
              >
                <q-icon name="warning" size="12px" class="q-mr-xs" /> Overdue
              </q-chip>
            </div>

            <div class="text-h6 text-weight-bold text-dark q-mb-xs">
              {{ currentTask.name }}
            </div>

            <div class="row items-center text-caption text-grey-7 q-gutter-x-md">
              <div>
                <q-icon name="folder_open" size="15px" color="primary" class="q-mr-xs" />
                <span class="text-weight-medium">{{ currentTask.project }}</span>
              </div>
              <div>
                <q-icon name="event" size="15px" color="grey-6" class="q-mr-xs" />
                <span>Created: {{ formatDate(currentTask.createdDate) }}</span>
              </div>
              <div>
                <q-icon name="schedule" size="15px" :color="isOverdue ? 'negative' : 'grey-6'" class="q-mr-xs" />
                <span :class="{ 'text-negative text-weight-bold': isOverdue }">
                  Deadline: {{ formatDate(currentTask.deadline) }}
                </span>
              </div>
            </div>
          </div>

          <div class="row q-gutter-md q-mt-xs-none q-mt-sm">
            <div class="text-right">
              <div class="text-caption text-grey-6">Assignee</div>
              <div class="row items-center q-gutter-xs q-mt-xs">
                <q-avatar size="24px" color="purple-2" text-color="purple-9" class="text-weight-bold">
                  {{ userInitial }}
                </q-avatar>
                <span class="text-weight-medium text-body2">{{ userName }}</span>
              </div>
            </div>

            <q-separator vertical />

            <div class="text-right">
              <div class="text-caption text-grey-6">Project Manager</div>
              <div class="row items-center q-gutter-xs q-mt-xs">
                <q-avatar size="24px" color="blue-2" text-color="blue-9" class="text-weight-bold">
                  {{ currentTask.reporterInitial }}
                </q-avatar>
                <span class="text-weight-medium text-body2">{{ currentTask.reporter }}</span>
              </div>
            </div>
          </div>
        </div>

        <q-separator class="q-my-md" />

        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-4">
            <div class="row items-center justify-between text-caption q-mb-xs">
              <span class="text-weight-medium text-grey-8">Task Completion</span>
              <span class="text-weight-bold text-primary">{{ currentTask.progress }}%</span>
            </div>
            <q-linear-progress
              :value="currentTask.progress / 100"
              size="8px"
              rounded
              color="primary"
              track-color="grey-3"
            />
          </div>

          <div class="col-6 col-sm-3 col-md-2 text-center">
            <div class="text-caption text-grey-6">Estimated</div>
            <div class="text-subtitle1 text-weight-bold">{{ currentTask.estimatedHours }} hrs</div>
          </div>

          <div class="col-6 col-sm-3 col-md-2 text-center">
            <div class="text-caption text-grey-6">Logged Work</div>
            <div class="text-subtitle1 text-weight-bold text-primary">{{ currentTask.hoursWorked }} hrs</div>
          </div>

          <div class="col-6 col-sm-3 col-md-2 text-center">
            <div class="text-caption text-grey-6">Remaining</div>
            <div class="text-subtitle1 text-weight-bold text-deep-orange">
              {{ Math.max(0, currentTask.estimatedHours - currentTask.hoursWorked) }} hrs
            </div>
          </div>

          <div class="col-6 col-sm-3 col-md-2 text-center">
            <div class="text-caption text-grey-6">Efficiency</div>
            <div class="text-subtitle1 text-weight-bold text-positive">
              {{ currentTask.hoursWorked > 0 ? Math.round((currentTask.progress / (currentTask.hoursWorked / currentTask.estimatedHours * 100)) * 100) : 100 }}%
            </div>
          </div>
        </div>
      </q-card>
    </WorkspaceSection>

    <!-- 02 — SPECIFICATIONS -->
    <WorkspaceSection
      number="02"
      label="Requirements"
      title="Specifications & criteria"
      description="Detailed objectives, subtasks, tech stack requirements, and resource attachments."
    >
      <div class="row q-col-gutter-md">
        <!-- Scope & Description -->
        <div class="col-12">
          <q-card flat bordered class="q-pa-md bg-white">
            <div class="row items-center q-gutter-xs text-subtitle1 text-weight-bold text-grey-9 q-mb-xs">
              <q-icon name="subject" color="primary" size="20px" />
              <span>Overview & Objective Scope</span>
            </div>
            <div class="text-body2 text-grey-8">
              {{ currentTask.description }}
            </div>
          </q-card>
        </div>

        <!-- Acceptance Criteria Checklist -->
        <div class="col-12 col-md-7">
          <q-card flat bordered class="q-pa-md bg-white full-height">
            <div class="row items-center justify-between q-mb-sm">
              <div class="row items-center q-gutter-xs text-subtitle1 text-weight-bold text-grey-9">
                <q-icon name="checklist" color="primary" size="20px" />
                <span>Acceptance Criteria</span>
              </div>
              <q-badge color="purple-1" text-color="primary" class="text-weight-bold">
                {{ completedCriteriaCount }} / {{ currentTask.criteria.length }} Done
              </q-badge>
            </div>

            <q-list separator dense class="q-mt-sm">
              <q-item
                v-for="(item, idx) in currentTask.criteria"
                :key="idx"
                clickable
                v-ripple
                @click="toggleCriteria(idx)"
              >
                <q-item-section side>
                  <q-checkbox v-model="item.done" dense color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label :class="{ 'text-strike text-grey-6': item.done }" class="text-body2">
                    {{ item.text }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <!-- Attachments & Tech Stack -->
        <div class="col-12 col-md-5">
          <q-card flat bordered class="q-pa-md bg-white full-height">
            <div class="row items-center q-gutter-xs text-subtitle1 text-weight-bold text-grey-9 q-mb-sm">
              <q-icon name="attachment" color="primary" size="20px" />
              <span>Attachments & Stack</span>
            </div>

            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">Resource Files</div>
            <q-list dense separator class="q-mb-md">
              <q-item v-for="(file, idx) in currentTask.attachments" :key="idx">
                <q-item-section avatar>
                  <q-icon :name="getFileIcon(file.type)" size="20px" :color="getFileColor(file.type)" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-caption text-weight-medium">{{ file.name }}</q-item-label>
                  <q-item-label caption>{{ file.size }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round dense icon="download" color="grey-7" size="11px" />
                </q-item-section>
              </q-item>
            </q-list>

            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">Required Stack</div>
            <div class="row q-gutter-xs">
              <q-chip
                v-for="tech in currentTask.techStack"
                :key="tech"
                dense
                outlined
                color="purple-7"
                class="bg-purple-1 text-weight-medium text-caption"
              >
                {{ tech }}
              </q-chip>
            </div>
          </q-card>
        </div>
      </div>
    </WorkspaceSection>

    <!-- 03 — CONTRACTS -->
    <WorkspaceSection
      number="03"
      label="API Specs"
      title="Technical endpoint contracts"
      description="API route definitions, expected request methods, payloads, and integration statuses."
    >
      <q-card flat bordered class="bg-white">
        <q-card-section class="q-pa-none">
          <q-markup-table flat dense>
            <thead>
              <tr class="bg-grey-2">
                <th class="text-left">Method</th>
                <th class="text-left">Endpoint Path</th>
                <th class="text-left">Description</th>
                <th class="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ep, idx) in currentTask.endpoints" :key="idx">
                <td>
                  <q-chip
                    dense
                    size="10px"
                    :color="getMethodBg(ep.method)"
                    :text-color="getMethodColor(ep.method)"
                    class="text-weight-bolder"
                  >
                    {{ ep.method }}
                  </q-chip>
                </td>
                <td class="text-weight-medium font-mono text-caption">{{ ep.path }}</td>
                <td class="text-caption text-grey-8">{{ ep.description }}</td>
                <td>
                  <q-badge
                    :color="ep.status === 'Ready' ? 'green-1' : ep.status === 'In Review' ? 'blue-1' : 'amber-1'"
                    :text-color="ep.status === 'Ready' ? 'green-9' : ep.status === 'In Review' ? 'blue-9' : 'amber-9'"
                    class="text-weight-bold"
                  >
                    {{ ep.status }}
                  </q-badge>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </WorkspaceSection>

    <!-- 04 — WORK LOG -->
    <WorkspaceSection
      number="04"
      label="Work Log"
      title="Timesheet & progress entry"
      description="Log your daily progress and review historical work logs recorded for this task."
    >
      <div class="row q-col-gutter-md">
        <!-- Log Entry Form -->
        <div class="col-12 col-md-5">
          <q-card flat bordered class="q-pa-md bg-white">
            <div class="row items-center q-gutter-xs text-subtitle1 text-weight-bold text-grey-9 q-mb-xs">
              <q-icon name="more_time" color="primary" size="20px" />
              <span>Log Daily Work</span>
            </div>
            <div class="text-caption text-grey-6 q-mb-md">Record hours worked and progress notes for today.</div>

            <q-form @submit.prevent="submitWorkLog" class="q-gutter-y-sm">
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input
                    v-model.number="logForm.hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    outlined
                    dense
                    label="Hours Worked *"
                    suffix="hrs"
                    bg-color="white"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model.number="logForm.progress"
                    type="number"
                    min="0"
                    max="100"
                    outlined
                    dense
                    label="New Progress %"
                    suffix="%"
                    bg-color="white"
                  />
                </div>
              </div>

              <q-input
                v-model="logForm.date"
                type="date"
                outlined
                dense
                label="Date of Work"
                bg-color="white"
              />

              <q-input
                v-model="logForm.notes"
                type="textarea"
                rows="3"
                outlined
                dense
                label="Work Update & Notes *"
                placeholder="What did you complete or debug today?"
                bg-color="white"
              />

              <q-btn
                type="submit"
                unelevated
                color="primary"
                icon="save"
                label="Submit Work Log Entry"
                no-caps
                class="full-width q-mt-sm"
              />
            </q-form>
          </q-card>
        </div>

        <!-- Log History Timeline -->
        <div class="col-12 col-md-7">
          <q-card flat bordered class="q-pa-md bg-white">
            <div class="row items-center justify-between q-mb-md">
              <div class="row items-center q-gutter-xs text-subtitle1 text-weight-bold text-grey-9">
                <q-icon name="history" color="primary" size="20px" />
                <span>Work Log History</span>
              </div>
              <q-badge color="grey-3" text-color="grey-9">
                {{ currentTask.workLogs.length }} Entries
              </q-badge>
            </div>

            <div v-if="currentTask.workLogs.length === 0" class="text-center q-pa-md text-grey-6">
              No work logs recorded yet.
            </div>

            <q-timeline color="primary" dense>
              <q-timeline-entry
                v-for="log in currentTask.workLogs"
                :key="log.id"
                :subtitle="log.date"
                icon="check"
                color="primary"
              >
                <template #title>
                  <div class="row items-center justify-between no-wrap">
                    <span class="text-subtitle2 text-weight-bold text-dark">{{ log.author }}</span>
                    <q-badge color="purple-1" text-color="purple-9" class="text-weight-bold">
                      +{{ log.hours }} hrs ({{ log.progressAtTime }}%)
                    </q-badge>
                  </div>
                </template>

                <div class="text-body2 text-grey-8 q-mt-xs q-pa-sm bg-grey-2 rounded-borders">
                  {{ log.notes }}
                </div>
              </q-timeline-entry>
            </q-timeline>
          </q-card>
        </div>
      </div>
    </WorkspaceSection>

    <!-- Update Task Dialog -->
    <UpdateTaskDialog
      v-model="updateDialog"
      :task="currentTaskForDialog"
      @save="handleSaveTaskUpdate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkspaceSection from '@/components/resource/WorkspaceSection.vue'
import UpdateTaskDialog from '@/components/tasks/UpdateTaskDialog.vue'
import type { ResourceTask, TaskPriority, TaskStatus } from '@/components/tasks/task-types'

const route = useRoute()
const router = useRouter()

// Get user profile from localStorage
const storedUser = localStorage.getItem('user')
const userObj = computed(() => {
  if (!storedUser) return { name: 'Resource Member' }
  try {
    return JSON.parse(storedUser) as { name?: string }
  } catch {
    return { name: 'Resource Member' }
  }
})
const userName = computed(() => userObj.value.name || 'Resource Member')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

// Extended Task interface for specifications & work logs
export interface DetailedTaskSpec extends ResourceTask {
  createdDate: string
  reporter: string
  reporterInitial: string
  description: string
  criteria: Array<{ text: string; done: boolean }>
  endpoints: Array<{ method: string; path: string; description: string; status: 'Ready' | 'In Review' | 'Pending' }>
  techStack: string[]
  attachments: Array<{ name: string; size: string; type: 'figma' | 'pdf' | 'json' | 'code' }>
  workLogs: Array<{ id: number; author: string; date: string; hours: number; progressAtTime: number; notes: string }>
}

// Master mock data of detailed task specifications
const detailedTasks = ref<DetailedTaskSpec[]>([
  {
    id: 1,
    name: 'API Integration - OAuth2 & JWT Auth Flow',
    project: 'Resource Management System',
    priority: 'High',
    status: 'IN_PROGRESS',
    progress: 60,
    deadline: '2026-08-20',
    createdDate: '2026-08-10',
    hoursWorked: 4,
    estimatedHours: 8,
    workUpdate: 'Authentication API integration is in progress with JWT validation.',
    reporter: 'Alex Rivera (PM)',
    reporterInitial: 'A',
    description:
      'Design, implement, and integrate secure OAuth2 and JWT token authentication pipelines across frontend and backend services. Ensure proper refresh token rotation, bearer token validation in Vue router guards, and error handling for expired sessions.',
    criteria: [
      { text: 'Implement JWT access token generation & validation middleware', done: true },
      { text: 'Add HTTPS secure cookie storage for refresh tokens', done: true },
      { text: 'Configure frontend router navigation guards for auth routes', done: true },
      { text: 'Implement automatic token refresh on HTTP 401 Unauthorized responses', done: false },
      { text: 'Write integration test suite covering login, logout, and token expiry', done: false },
    ],
    endpoints: [
      { method: 'POST', path: '/api/v1/auth/login', description: 'Authenticate user credentials & issue JWT tokens', status: 'Ready' },
      { method: 'POST', path: '/api/v1/auth/refresh', description: 'Refresh expired access token using refresh token cookie', status: 'In Review' },
      { method: 'GET', path: '/api/v1/auth/me', description: 'Fetch authenticated user profile & permissions', status: 'Ready' },
      { method: 'POST', path: '/api/v1/auth/logout', description: 'Invalidate refresh token session', status: 'Pending' },
    ],
    techStack: ['Node.js', 'TypeScript', 'Express', 'JWT', 'Quasar / Vue 3', 'PostgreSQL'],
    attachments: [
      { name: 'OAuth2_Architecture_Diagram.pdf', size: '1.4 MB', type: 'pdf' },
      { name: 'Auth_UI_Wireframes.figma', size: '4.2 MB', type: 'figma' },
      { name: 'swagger-auth-api-spec.json', size: '240 KB', type: 'json' },
    ],
    workLogs: [
      {
        id: 101,
        author: 'You',
        date: '16 Aug 2026',
        hours: 2.5,
        progressAtTime: 35,
        notes: 'Set up JWT middleware and payload signing using RSA-256 keys.',
      },
      {
        id: 102,
        author: 'You',
        date: '17 Aug 2026',
        hours: 1.5,
        progressAtTime: 60,
        notes: 'Wired frontend Login component with token storage and Quasar Notify alerts.',
      },
    ],
  },
  {
    id: 2,
    name: 'Dashboard UI & Resource Capacity Cards',
    project: 'Task Management System',
    priority: 'Medium',
    status: 'IN_PROGRESS',
    progress: 40,
    deadline: '2026-08-22',
    createdDate: '2026-08-12',
    hoursWorked: 3,
    estimatedHours: 6,
    workUpdate: 'Dashboard layout and capacity visualizers are being built.',
    reporter: 'Sarah Chen (PM)',
    reporterInitial: 'S',
    description:
      'Build responsive resource dashboard cards showing daily workload capacity, upcoming deadlines, status distribution, and individual Gantt charts.',
    criteria: [
      { text: 'Create responsive grid layout for desktop & mobile breakpoints', done: true },
      { text: 'Build Workload Progress & Stat Cards with progress bars', done: true },
      { text: 'Implement Resource Gantt Timeline visualization component', done: false },
      { text: 'Add quick-filter controls for deadline date range', done: false },
    ],
    endpoints: [
      { method: 'GET', path: '/api/v1/resource/dashboard/stats', description: 'Retrieve resource metrics summary', status: 'Ready' },
      { method: 'GET', path: '/api/v1/resource/workload', description: 'Fetch workload breakdown & allocated hours', status: 'In Review' },
    ],
    techStack: ['Vue 3', 'Quasar UI', 'Sass / SCSS', 'Chart.js'],
    attachments: [
      { name: 'Dashboard_Design_v2.figma', size: '3.8 MB', type: 'figma' },
      { name: 'Component_Specs.pdf', size: '890 KB', type: 'pdf' },
    ],
    workLogs: [
      {
        id: 103,
        author: 'You',
        date: '17 Aug 2026',
        hours: 3.0,
        progressAtTime: 40,
        notes: 'Completed StatCards and WorkloadCard layout using Quasar grid system.',
      },
    ],
  },
  {
    id: 3,
    name: 'Database Integration & Schema Migration',
    project: 'Resource Management System',
    priority: 'High',
    status: 'PARTIALLY_COMPLETED',
    progress: 45,
    deadline: '2026-08-14',
    createdDate: '2026-08-05',
    hoursWorked: 5,
    estimatedHours: 10,
    workUpdate: 'Database schema migration completed, query optimization in progress.',
    reporter: 'Alex Rivera (PM)',
    reporterInitial: 'A',
    description:
      'Establish database migrations for Tasks, Resource Allocations, and Work Logs. Ensure foreign key indexes, constraint triggers, and query performance.',
    criteria: [
      { text: 'Define PostgreSQL schema migrations using Prisma/Knative', done: true },
      { text: 'Create foreign key relationships for resources and tasks', done: true },
      { text: 'Add indexing on status, priority, and deadline columns', done: false },
      { text: 'Write seed data scripts for local dev environments', done: false },
    ],
    endpoints: [
      { method: 'POST', path: '/api/v1/db/migrate', description: 'Execute database schema migrations', status: 'Ready' },
    ],
    techStack: ['PostgreSQL', 'Prisma ORM', 'SQL', 'Node.js'],
    attachments: [
      { name: 'ER_Diagram_v1.pdf', size: '2.1 MB', type: 'pdf' },
    ],
    workLogs: [
      {
        id: 104,
        author: 'You',
        date: '14 Aug 2026',
        hours: 5.0,
        progressAtTime: 45,
        notes: 'Wrote initial migration scripts and executed seeds.',
      },
    ],
  },
])

// Fallback task default
const defaultTask = detailedTasks.value[0] as DetailedTaskSpec

// Select active task ID from route param or default to task #1
const selectedTaskId = ref<number>(
  route.query.id ? Number(route.query.id) : (route.params.id ? Number(route.params.id) : defaultTask.id)
)

// Synchronize query or route param with selection
watch(
  () => [route.query.id, route.params.id],
  ([newQueryId, newParamId]) => {
    if (newQueryId) selectedTaskId.value = Number(newQueryId)
    else if (newParamId) selectedTaskId.value = Number(newParamId)
  }
)

const currentTask = computed<DetailedTaskSpec>(() => {
  const found = detailedTasks.value.find(t => t.id === selectedTaskId.value)
  return found ?? defaultTask
})

const taskSelectOptions = computed(() =>
  detailedTasks.value.map(t => ({
    id: t.id,
    name: `#${t.id} - ${t.name}`,
  }))
)

// Computed helpers
const isOverdue = computed(() => {
  if (currentTask.value.status === 'COMPLETED') return false
  return new Date(currentTask.value.deadline) < new Date(new Date().toDateString())
})

const completedCriteriaCount = computed(() => {
  return currentTask.value.criteria.filter(c => c.done).length
})

function toggleCriteria(idx: number) {
  const item = currentTask.value.criteria[idx]
  if (item) {
    item.done = !item.done
  }
}

// Work Log Form State
const logForm = ref({
  hours: 1.5,
  progress: currentTask.value.progress,
  date: new Date().toISOString().substring(0, 10),
  notes: '',
})

watch(
  () => currentTask.value.id,
  () => {
    logForm.value.progress = currentTask.value.progress
  }
)

function submitWorkLog() {
  if (!logForm.value.notes.trim()) return

  // Update current task stats
  currentTask.value.hoursWorked += Number(logForm.value.hours)
  currentTask.value.progress = Number(logForm.value.progress)

  if (currentTask.value.progress >= 100) {
    currentTask.value.status = 'COMPLETED'
  } else if (currentTask.value.progress > 0 && currentTask.value.status === 'TODO') {
    currentTask.value.status = 'IN_PROGRESS'
  }

  // Add work log entry
  const newEntry = {
    id: Date.now(),
    author: 'You',
    date: new Date(logForm.value.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    hours: Number(logForm.value.hours),
    progressAtTime: Number(logForm.value.progress),
    notes: logForm.value.notes,
  }

  currentTask.value.workLogs.unshift(newEntry)
  currentTask.value.workUpdate = logForm.value.notes

  // Reset form notes
  logForm.value.notes = ''
}

// Dialog control
const updateDialog = ref(false)
const currentTaskForDialog = computed<ResourceTask>(() => ({
  id: currentTask.value.id,
  name: currentTask.value.name,
  project: currentTask.value.project,
  priority: currentTask.value.priority,
  status: currentTask.value.status,
  progress: currentTask.value.progress,
  deadline: currentTask.value.deadline,
  hoursWorked: currentTask.value.hoursWorked,
  estimatedHours: currentTask.value.estimatedHours,
  workUpdate: currentTask.value.workUpdate,
}))

function openWorkLogDialog() {
  window.scrollTo({ top: 500, behavior: 'smooth' })
}

function openUpdateDialog() {
  updateDialog.value = true
}

function handleSaveTaskUpdate(payload: { id: number; status: TaskStatus; progress: number; hoursWorked: number; workUpdate: string }) {
  currentTask.value.status = payload.status
  currentTask.value.progress = payload.progress
  currentTask.value.hoursWorked = payload.hoursWorked
  if (payload.workUpdate) currentTask.value.workUpdate = payload.workUpdate
}

// Formatting helpers
function formatStatus(status: TaskStatus) {
  const labels: Record<TaskStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    PARTIALLY_COMPLETED: 'Partially Completed',
    COMPLETED: 'Completed',
  }
  return labels[status]
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getPriorityBg(priority: TaskPriority) {
  switch (priority) {
    case 'Low': return 'green-1'
    case 'Medium': return 'amber-1'
    case 'High': return 'orange-1'
    case 'Critical': return 'red-1'
  }
}

function getPriorityColor(priority: TaskPriority) {
  switch (priority) {
    case 'Low': return 'green-9'
    case 'Medium': return 'amber-9'
    case 'High': return 'deep-orange-9'
    case 'Critical': return 'red-9'
  }
}

function getStatusBg(status: TaskStatus) {
  switch (status) {
    case 'TODO': return 'grey-2'
    case 'IN_PROGRESS': return 'blue-1'
    case 'PARTIALLY_COMPLETED': return 'amber-1'
    case 'COMPLETED': return 'green-1'
  }
}

function getStatusColor(status: TaskStatus) {
  switch (status) {
    case 'TODO': return 'grey-8'
    case 'IN_PROGRESS': return 'blue-9'
    case 'PARTIALLY_COMPLETED': return 'amber-9'
    case 'COMPLETED': return 'green-9'
  }
}

function getMethodBg(method: string) {
  switch (method) {
    case 'GET': return 'blue-1'
    case 'POST': return 'green-1'
    case 'PUT': return 'amber-1'
    case 'DELETE': return 'red-1'
    default: return 'grey-2'
  }
}

function getMethodColor(method: string) {
  switch (method) {
    case 'GET': return 'blue-9'
    case 'POST': return 'green-9'
    case 'PUT': return 'amber-9'
    case 'DELETE': return 'red-9'
    default: return 'grey-8'
  }
}

function getFileIcon(type: string) {
  switch (type) {
    case 'figma': return 'brush'
    case 'pdf': return 'picture_as_pdf'
    case 'json': return 'data_object'
    default: return 'insert_drive_file'
  }
}

function getFileColor(type: string) {
  switch (type) {
    case 'figma': return 'purple-6'
    case 'pdf': return 'red-6'
    case 'json': return 'amber-8'
    default: return 'blue-6'
  }
}
</script>

<style scoped lang="scss">
.workspace-page {
  background: var(--wo-bg-page, #f8f9fa);
}

.font-mono {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
}
</style>
