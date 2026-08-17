<template>
  <q-page class="projects-page">
    <div class="projects-header">
      <div>
        <div class="eyebrow">PROJECTS</div>
        <h1>Projects</h1>
        <p>Manage your projects, progress and deadlines.</p>
      </div>

      <q-btn
        no-caps
        unelevated
        icon="add"
        label="New Project"
        class="new-project-btn"
        @click="showCreateDialog = true"
      />
    </div>

    <div v-if="loading" class="state-container">
      <q-spinner color="primary" size="32px" />
      <span>Loading projects...</span>
    </div>

    <div v-else-if="projects.length === 0" class="empty-state">
      <div class="empty-icon">
        <q-icon name="folder_open" size="32px" />
      </div>

      <h2>No projects yet</h2>

      <p>
        Create your first project to start organizing tasks,
        resources and deadlines.
      </p>

      <q-btn
        no-caps
        unelevated
        label="Create Project"
        icon="add"
        class="new-project-btn"
        @click="showCreateDialog = true"
      />
    </div>

    <div v-else class="projects-grid">
      <div
        v-for="project in projects"
        :key="project.project_id"
        class="project-card"
      >
        <div class="project-card-top">
          <span
            class="priority-badge"
            :class="`priority-${project.priority.toLowerCase()}`"
          >
            {{ project.priority }}
          </span>

          <q-btn
            flat
            round
            dense
            icon="more_horiz"
            color="grey-6"
          />
        </div>

        <h3>{{ project.name }}</h3>

        <p class="project-description">
          {{ project.description || 'No description provided.' }}
        </p>

        <div class="project-progress-row">
          <span>Progress</span>
          <strong>{{ project.progress }}%</strong>
        </div>

        <q-linear-progress
          :value="Number(project.progress) / 100"
          rounded
          size="6px"
          color="deep-purple-4"
          track-color="grey-3"
        />

        <div class="project-meta">
          <div>
            <q-icon name="calendar_today" size="15px" />
            {{ formatDate(project.deadline) }}
          </div>

          <span class="status-badge">
            {{ formatStatus(project.status) }}
          </span>
        </div>
      </div>
    </div>

    <q-dialog v-model="showCreateDialog">
      <q-card class="create-project-dialog">
        <q-card-section class="dialog-header">
          <div>
            <div class="eyebrow">NEW PROJECT</div>
            <div class="dialog-title">Create a project</div>
          </div>

          <q-btn
            v-close-popup
            flat
            round
            dense
            icon="close"
            color="grey-7"
          />
        </q-card-section>

        <q-form @submit.prevent="handleCreateProject">
          <q-card-section class="dialog-form">
            <q-input
              v-model="form.name"
              outlined
              label="Project name"
              :rules="[val => !!val.trim() || 'Project name is required']"
            />

            <q-input
              v-model="form.description"
              outlined
              type="textarea"
              label="Description"
              autogrow
            />

            <div class="form-row">
              <q-select
                v-model="form.status"
                outlined
                label="Status"
                :options="statusOptions"
                emit-value
                map-options
                class="form-field"
              />

              <q-select
                v-model="form.priority"
                outlined
                label="Priority"
                :options="priorityOptions"
                emit-value
                map-options
                class="form-field"
              />
            </div>

            <div class="form-row">
              <q-input
                v-model="form.start_date"
                outlined
                type="date"
                label="Start date"
                stack-label
                class="form-field"
              />

              <q-input
                v-model="form.deadline"
                outlined
                type="date"
                label="Deadline"
                stack-label
                class="form-field"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
            <q-btn
              v-close-popup
              flat
              no-caps
              label="Cancel"
              color="grey-7"
            />

            <q-btn
              type="submit"
              no-caps
              unelevated
              label="Create Project"
              class="new-project-btn"
              :loading="creating"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import {
  createProjectApi,
  getProjectsApi,
  type CreateProjectPayload,
  type Project,
  type ProjectPriority,
  type ProjectStatus
} from '@/services/api'

const $q = useQuasar()

const projects = ref<Project[]>([])
const loading = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)

interface ProjectForm {
  name: string
  description: string
  status: ProjectStatus
  priority: ProjectPriority
  start_date: string
  deadline: string
}

const form = reactive<ProjectForm>({
  name: '',
  description: '',
  status: 'DRAFT',
  priority: 'MEDIUM',
  start_date: '',
  deadline: ''
})

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' }
]

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' }
]

async function loadProjects() {
  loading.value = true

  try {
    projects.value = await getProjectsApi()
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to load projects'
    })
  } finally {
    loading.value = false
  }
}

async function handleCreateProject() {
  const storedUser = localStorage.getItem('user')

  if (!storedUser) {
    $q.notify({
      type: 'negative',
      message: 'Please sign in again'
    })
    return
  }

  const user = JSON.parse(storedUser) as {
    user_id: number
  }

  creating.value = true

  try {
    const payload: CreateProjectPayload = {
      project_manager_id: user.user_id,
      name: form.name.trim(),
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      deadline: form.deadline || null
    }

    if (form.description.trim()) {
      payload.description = form.description.trim()
    }

    await createProjectApi(payload)

    $q.notify({
      type: 'positive',
      message: 'Project created successfully'
    })

    showCreateDialog.value = false
    resetForm()

    // GET again so the UI reflects the database.
    await loadProjects()
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create project'
    })
  } finally {
    creating.value = false
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.status = 'DRAFT'
  form.priority = 'MEDIUM'
  form.start_date = ''
  form.deadline = ''
}

function formatDate(date: string | null) {
  if (!date) return 'No deadline'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date))
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

onMounted(() => {
  void loadProjects()
})
</script>

<style scoped>
.projects-page {
  min-height: 100vh;
  padding: 32px 38px;
  background: #f8f9fb;
  color: #111827;
}

.projects-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.eyebrow {
  margin-bottom: 5px;
  color: #8b6fd8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.projects-header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
}

.projects-header p {
  margin: 7px 0 0;
  color: #7c8496;
  font-size: 14px;
}

.new-project-btn {
  border-radius: 9px;
  background: #8b6fd8;
  color: white;
  padding: 4px 14px;
}

.state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 300px;
  color: #7c8496;
}

.empty-state {
  display: flex;
  min-height: 390px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8e9ee;
  border-radius: 14px;
  background: white;
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 18px;
  background: #f4f0fd;
  color: #8b6fd8;
}

.empty-state h2 {
  margin: 18px 0 6px;
  font-size: 20px;
}

.empty-state p {
  max-width: 420px;
  margin: 0 0 20px;
  color: #7c8496;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.project-card {
  padding: 20px;
  border: 1px solid #e7e8ed;
  border-radius: 13px;
  background: white;
}

.project-card-top,
.project-progress-row,
.project-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-card h3 {
  margin: 16px 0 7px;
  font-size: 17px;
}

.project-description {
  min-height: 42px;
  margin: 0 0 22px;
  color: #7c8496;
  font-size: 13px;
  line-height: 1.55;
}

.project-progress-row {
  margin-bottom: 8px;
  color: #7c8496;
  font-size: 12px;
}

.project-progress-row strong {
  color: #252a34;
}

.project-meta {
  margin-top: 18px;
  color: #8b93a5;
  font-size: 12px;
}

.project-meta > div {
  display: flex;
  align-items: center;
  gap: 6px;
}

.priority-badge,
.status-badge {
  border-radius: 20px;
  padding: 5px 9px;
  font-size: 10px;
  font-weight: 700;
}

.priority-low {
  background: #eaf7f0;
  color: #27ae60;
}

.priority-medium {
  background: #fff4e8;
  color: #e89532;
}

.priority-high {
  background: #fff0eb;
  color: #e56b45;
}

.priority-critical {
  background: #fdeef0;
  color: #e15263;
}

.status-badge {
  background: #f4f0fd;
  color: #8b6fd8;
}

.create-project-dialog {
  width: 620px;
  max-width: 92vw;
  border-radius: 16px;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 26px 12px;
}

.dialog-title {
  font-size: 22px;
  font-weight: 700;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 16px 26px;
}

.form-row {
  display: flex;
  gap: 14px;
}

.form-field {
  flex: 1;
}

.dialog-actions {
  padding: 12px 26px 24px;
}

@media (max-width: 1000px) {
  .projects-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .projects-page {
    padding: 22px 18px;
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    flex-direction: column;
  }
}
</style>