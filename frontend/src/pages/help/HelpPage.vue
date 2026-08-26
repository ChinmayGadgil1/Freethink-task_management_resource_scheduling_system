<template>
  <q-page class="help-page-container q-pa-lg">
    <!-- Header Section -->
    <div class="help-header-panel q-mb-lg">
      <div class="row items-center justify-between no-wrap q-mb-sm">
        <div class="row items-center gap-sm">
          <q-btn flat round dense icon="arrow_back" color="grey-8" class="back-btn" @click="goBack">
            <q-tooltip>Go Back</q-tooltip>
          </q-btn>
          <div>
            <div class="row items-center gap-xs q-mb-xs">
              <q-badge :color="isResourceRole ? 'teal' : 'primary'" class="role-context-badge">
                {{ isResourceRole ? 'Resource Workspace' : 'Project Manager Workspace' }}
              </q-badge>
            </div>
            <h1 class="help-page-title">Help & Support</h1>
          </div>
        </div>
      </div>
      <p class="help-page-subtitle">
        Find answers, learn how TaskFlow works, or reach out for assistance.
      </p>

      <!-- Quick Search / Filter Bar -->
      <div class="search-filter-box q-mt-md">
        <q-input
          v-model="searchQuery"
          dense
          outlined
          placeholder="Search guides, FAQs, and concepts (e.g. create task, workload, gantt, progress)..."
          class="help-search-input"
          clearable
        >
          <template #prepend>
            <q-icon name="search" size="20px" color="grey-6" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Quick Navigation Category Tabs -->
    <div class="category-pills-row row wrap items-center q-gutter-xs q-mb-lg">
      <button
        class="category-pill"
        :class="{ 'category-pill-active': activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        All Topics
      </button>
      <button
        class="category-pill"
        :class="{ 'category-pill-active': activeTab === 'guides' }"
        @click="activeTab = 'guides'"
      >
        <q-icon name="menu_book" size="14px" class="q-mr-xs" />
        Getting Started
      </button>
      <button
        class="category-pill"
        :class="{ 'category-pill-active': activeTab === 'faqs' }"
        @click="activeTab = 'faqs'"
      >
        <q-icon name="help" size="14px" class="q-mr-xs" />
        FAQs
      </button>
      <button
        class="category-pill"
        :class="{ 'category-pill-active': activeTab === 'contact' }"
        @click="activeTab = 'contact'"
      >
        <q-icon name="mail" size="14px" class="q-mr-xs" />
        Contact Support
      </button>
      <button
        class="category-pill"
        :class="{ 'category-pill-active': activeTab === 'about' }"
        @click="activeTab = 'about'"
      >
        <q-icon name="info" size="14px" class="q-mr-xs" />
        About
      </button>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Left Column: Guides & FAQs -->
      <div
        v-show="activeTab === 'all' || activeTab === 'guides' || activeTab === 'faqs'"
        class="col-12"
        :class="activeTab === 'all' ? 'col-lg-8' : 'col-lg-12'"
      >
        <!-- SECTION 1: GETTING STARTED GUIDES -->
        <div v-show="activeTab === 'all' || activeTab === 'guides'" class="help-section q-mb-xl">
          <div class="section-title-row row items-center gap-xs q-mb-md">
            <div class="section-icon-box flex flex-center bg-purple-soft">
              <q-icon name="menu_book" size="18px" color="primary" />
            </div>
            <div>
              <h2 class="section-main-title">Getting Started Guides</h2>
              <div class="section-sub-desc">
                Core concepts and step-by-step workflows in TaskFlow
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <!-- Guide 1: Projects -->
            <div
              v-if="matchesFilter('projects project create health priority')"
              class="col-12 col-md-6"
            >
              <q-card class="guide-card">
                <q-card-section>
                  <div class="guide-header row items-center gap-sm q-mb-sm">
                    <div class="guide-icon-pill flex flex-center bg-purple-soft">
                      <q-icon name="folder" size="16px" color="primary" />
                    </div>
                    <div class="guide-title">Projects Management</div>
                  </div>
                  <p class="guide-text">
                    Project Managers create projects with title, description, priority (<span
                      class="text-weight-bold text-negative"
                      >Critical</span
                    >, <span class="text-weight-bold text-orange">High</span>,
                    <span class="text-weight-bold text-primary">Medium</span>,
                    <span class="text-weight-bold text-grey-7">Low</span>), and scheduled dates.
                    TaskFlow calculates overall progress (%) and health flags (<span
                      class="text-weight-bold text-positive"
                      >On Track</span
                    >, <span class="text-weight-bold text-warning">At Risk</span>,
                    <span class="text-weight-bold text-negative">Delayed</span>).
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <!-- Guide 2: Tasks -->
            <div
              v-if="
                matchesFilter(
                  'tasks task assign effort status scheduled in_progress completed blocked',
                )
              "
              class="col-12 col-md-6"
            >
              <q-card class="guide-card">
                <q-card-section>
                  <div class="guide-header row items-center gap-sm q-mb-sm">
                    <div class="guide-icon-pill flex flex-center bg-teal-soft">
                      <q-icon name="task_alt" size="16px" color="teal" />
                    </div>
                    <div class="guide-title">Tasks & Deliverables</div>
                  </div>
                  <p class="guide-text">
                    Tasks belong to projects with expected effort hours, target date ranges,
                    assigned resources, and priorities. Work is tracked across four core statuses:
                    <span class="status-chip-inline status-scheduled">SCHEDULED</span>,
                    <span class="status-chip-inline status-inprogress">IN_PROGRESS</span>,
                    <span class="status-chip-inline status-blocked">BLOCKED</span>, and
                    <span class="status-chip-inline status-completed">COMPLETED</span>.
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <!-- Guide 3: Resource Assignment -->
            <div
              v-if="matchesFilter('resource assignment team allocation members skills capacity')"
              class="col-12 col-md-6"
            >
              <q-card class="guide-card">
                <q-card-section>
                  <div class="guide-header row items-center gap-sm q-mb-sm">
                    <div class="guide-icon-pill flex flex-center bg-orange-soft">
                      <q-icon name="groups" size="16px" color="orange-9" />
                    </div>
                    <div class="guide-title">Resource Assignment</div>
                  </div>
                  <p class="guide-text">
                    Assign team members to projects and tasks based on roles and skills. Project
                    Managers select assignees during task creation. Resources see their assigned
                    items on their Resource Dashboard and Task Specs views.
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <!-- Guide 4: Scheduling & Gantt -->
            <div
              v-if="matchesFilter('scheduling schedule gantt timeline dates dependencies calendar')"
              class="col-12 col-md-6"
            >
              <q-card class="guide-card">
                <q-card-section>
                  <div class="guide-header row items-center gap-sm q-mb-sm">
                    <div class="guide-icon-pill flex flex-center bg-blue-soft">
                      <q-icon name="calendar_month" size="16px" color="blue-8" />
                    </div>
                    <div class="guide-title">Scheduling & Gantt</div>
                  </div>
                  <p class="guide-text">
                    The Schedule page plots task start and end dates onto interactive Gantt
                    timelines. Tasks show duration bars, progress fills, priority color coding, and
                    assignee avatar badges across 7, 14, or 30-day viewing windows.
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <!-- Guide 5: Progress & Work Logs -->
            <div
              v-if="matchesFilter('progress work logs log hours effort actual completed')"
              class="col-12 col-md-6"
            >
              <q-card class="guide-card">
                <q-card-section>
                  <div class="guide-header row items-center gap-sm q-mb-sm">
                    <div class="guide-icon-pill flex flex-center bg-green-soft">
                      <q-icon name="insights" size="16px" color="green-8" />
                    </div>
                    <div class="guide-title">Progress & Work Logs</div>
                  </div>
                  <p class="guide-text">
                    Resources log actual effort hours and update completion progress on their
                    assigned tasks. Logged work records time spent and notes, updating the task's
                    actual effort and rolling up into project-level completion metrics.
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <!-- Guide 6: Workload & Capacity -->
            <div
              v-if="
                matchesFilter(
                  'workload capacity 40h hours allocation balance burnout overallocated',
                )
              "
              class="col-12 col-md-6"
            >
              <q-card class="guide-card">
                <q-card-section>
                  <div class="guide-header row items-center gap-sm q-mb-sm">
                    <div class="guide-icon-pill flex flex-center bg-purple-soft">
                      <q-icon name="pie_chart" size="16px" color="primary" />
                    </div>
                    <div class="guide-title">Workload & Capacity</div>
                  </div>
                  <p class="guide-text">
                    Calculated using standard 40h weekly bandwidth. The system tracks effort
                    consumed (actual hours logged vs allocated hours) and highlights when a team
                    member's assigned effort exceeds capacity to prevent overbooking.
                  </p>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <!-- SECTION 2: FREQUENTLY ASKED QUESTIONS -->
        <div v-show="activeTab === 'all' || activeTab === 'faqs'" class="help-section q-mb-xl">
          <div class="section-title-row row items-center gap-xs q-mb-md">
            <div class="section-icon-box flex flex-center bg-teal-soft">
              <q-icon name="help_outline" size="18px" color="teal" />
            </div>
            <div>
              <h2 class="section-main-title">Frequently Asked Questions</h2>
              <div class="section-sub-desc">
                Answers to common operational questions in TaskFlow
              </div>
            </div>
          </div>

          <div class="faqs-accordion-list column q-gutter-y-xs">
            <q-expansion-item
              v-for="(faq, index) in filteredFaqs"
              :key="index"
              group="help-faqs"
              header-class="faq-header"
              class="faq-expansion-item"
              expand-icon-class="faq-expand-icon"
            >
              <template #header>
                <q-item-section avatar style="min-width: 32px">
                  <q-icon name="help" size="16px" color="primary" />
                </q-item-section>
                <q-item-section class="faq-question-text">
                  {{ faq.question }}
                </q-item-section>
              </template>

              <q-card class="faq-answer-card">
                <q-card-section class="faq-answer-text">
                  {{ faq.answer }}
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <div
              v-if="filteredFaqs.length === 0"
              class="no-faqs-found q-pa-lg text-center text-grey-6"
            >
              <q-icon name="search_off" size="32px" class="q-mb-xs" />
              <div>No FAQs match your search query "{{ searchQuery }}".</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Contact Support Form & About Section -->
      <div
        v-show="activeTab === 'all' || activeTab === 'contact' || activeTab === 'about'"
        class="col-12"
        :class="activeTab === 'all' ? 'col-lg-4' : 'col-lg-8'"
      >
        <!-- SECTION 3: CONTACT SUPPORT FORM -->
        <div v-show="activeTab === 'all' || activeTab === 'contact'" class="help-section q-mb-lg">
          <q-card class="contact-support-card">
            <q-card-section class="q-pb-xs">
              <div class="row items-center gap-xs q-mb-xs">
                <div class="guide-icon-pill flex flex-center bg-purple-soft">
                  <q-icon name="support_agent" size="16px" color="primary" />
                </div>
                <h3 class="support-card-title">Contact Support</h3>
              </div>
              <p class="support-card-subtitle">
                Submit an inquiry or describe an issue with your workspace.
              </p>
            </q-card-section>

            <q-card-section>
              <!-- Submission Feedback State -->
              <div v-if="formSubmitted" class="support-feedback-panel q-pa-md q-mb-md">
                <div class="row items-center gap-xs q-mb-xs text-positive text-weight-bold">
                  <q-icon name="check_circle" size="20px" />
                  <span>Support Request Recorded</span>
                </div>
                <p class="feedback-text">
                  Thank you, <strong>{{ contactForm.name }}</strong
                  >! Your inquiry regarding <em>"{{ contactForm.category }}"</em> has been recorded
                  locally.
                </p>
                <div class="feedback-subtext text-caption text-grey-7 q-mb-sm">
                  (Note: Live ticket dispatch service is not currently connected in this development
                  environment.)
                </div>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="sm"
                  label="Submit Another Inquiry"
                  color="primary"
                  @click="resetForm"
                />
              </div>

              <!-- Contact Form -->
              <q-form v-else @submit.prevent="submitContactForm">
                <div class="q-gutter-y-sm">
                  <q-input
                    v-model="contactForm.name"
                    dense
                    outlined
                    label="Your Name"
                    :rules="[(val) => !!val || 'Name is required']"
                    hide-bottom-space
                  />

                  <q-input
                    v-model="contactForm.email"
                    dense
                    outlined
                    type="email"
                    label="Your Email"
                    :rules="[(val) => !!val || 'Email is required']"
                    hide-bottom-space
                  />

                  <q-select
                    v-model="contactForm.category"
                    dense
                    outlined
                    label="Issue Category"
                    :options="categoryOptions"
                    :rules="[(val) => !!val || 'Category is required']"
                    hide-bottom-space
                  />

                  <q-input
                    v-model="contactForm.description"
                    dense
                    outlined
                    type="textarea"
                    rows="3"
                    label="Description of issue or question"
                    :rules="[(val) => !!val || 'Description is required']"
                    hide-bottom-space
                  />

                  <q-btn
                    type="submit"
                    unelevated
                    no-caps
                    label="Submit Request"
                    icon="send"
                    color="primary"
                    class="full-width q-mt-md support-submit-btn"
                  />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </div>

        <!-- SECTION 4: ABOUT TASKFLOW -->
        <div v-show="activeTab === 'all' || activeTab === 'about'" class="help-section">
          <q-card class="about-card">
            <q-card-section>
              <div class="row items-center gap-xs q-mb-xs">
                <div class="brand-badge-mini flex flex-center">
                  <span>✦</span>
                </div>
                <h3 class="about-title">About TaskFlow</h3>
              </div>

              <div class="about-desc q-mt-xs">
                TaskFlow is a modern Task Management and Resource Scheduling System designed to
                provide transparent planning, capacity balancing, and live progress visibility
                across engineering teams.
              </div>

              <q-separator class="q-my-sm" />

              <div class="system-spec-list column q-gutter-y-xs">
                <div class="spec-row row justify-between">
                  <span class="spec-label">Application:</span>
                  <span class="spec-value text-weight-bold">TaskFlow Workspace</span>
                </div>
                <div class="spec-row row justify-between">
                  <span class="spec-label">Version:</span>
                  <span class="spec-value text-weight-bold">v0.0.1</span>
                </div>
                <div class="spec-row row justify-between">
                  <span class="spec-label">Capacity Baseline:</span>
                  <span class="spec-value">40 Hours / Week</span>
                </div>
                <div class="spec-row row justify-between">
                  <span class="spec-label">Current Role:</span>
                  <span class="spec-value text-primary text-weight-bold">
                    {{ isResourceRole ? 'Resource' : 'Project Manager' }}
                  </span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const searchQuery = ref('');
const activeTab = ref<'all' | 'guides' | 'faqs' | 'contact' | 'about'>('all');
const formSubmitted = ref(false);

const isResourceRole = computed(() => {
  return route.path.includes('resource-dashboard') || authStore.user?.role === 'RESOURCE';
});

function goBack() {
  if (isResourceRole.value) {
    void router.push('/app/resource-dashboard');
  } else {
    void router.push('/pm/projects');
  }
}

// Contact Form State
const contactForm = ref({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  category: 'Task & Project Management',
  description: '',
});
const categoryOptions = [
  'Task & Project Management',
  'Resource & Workload Scheduling',
  'Progress & Work Logs',
  'Account & Access',
  'General Inquiry',
];

function submitContactForm() {
  if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.description) {
    return;
  }
  formSubmitted.value = true;
}

function resetForm() {
  contactForm.value.description = '';
  formSubmitted.value = false;
}

function matchesFilter(text: string): boolean {
  if (!searchQuery.value) return true;
  const q = searchQuery.value.toLowerCase().trim();
  return text.toLowerCase().includes(q);
}

// Real FAQs based on TaskFlow architecture
const faqs = [
  {
    question: 'How do I create a project?',
    answer:
      'Navigate to the Projects page (/pm/projects) and click "+ New Project". Provide the project name, description, priority (Critical, High, Medium, Low), and planned start and delivery dates, then save.',
    tags: 'create project new pm priority deadline',
  },
  {
    question: 'How do I create a task?',
    answer:
      'Open the Tasks page (/pm/tasks) or a specific project details view and click "+ Create Task". Enter the task title, description, expected effort in hours, priority level, target dates, and select assigned resources.',
    tags: 'create task new effort hours assignee',
  },
  {
    question: 'How do I assign a resource to a project or task?',
    answer:
      'When creating or editing a task, choose team members from the Assignees multi-select dropdown. In the Resources section, you can also view which projects and deliverables each team member is allocated to.',
    tags: 'assign resource allocation member team',
  },
  {
    question: 'How does task scheduling and Gantt flow work?',
    answer:
      'TaskFlow schedules work based on task start and end dates. On the Schedule page, tasks are mapped onto an interactive Gantt timeline displaying duration bars, priority color codes, progress fills, and resource assignee avatar badges.',
    tags: 'scheduling gantt timeline calendar duration dates',
  },
  {
    question: 'How is resource workload calculated?',
    answer:
      'Workload is calculated by comparing total allocated effort hours against the standard 40 hours/week capacity baseline. The system tracks effort consumed (actual logged hours vs allocated hours) and highlights when a team member is overallocated.',
    tags: 'workload capacity 40h calculation allocated hours effort',
  },
  {
    question: 'How do I update task progress and log work hours?',
    answer:
      'Resources open their assigned task on the Resource Dashboard or Task Details page, adjust the progress slider or status, and submit a Work Log entry with actual hours worked and progress notes.',
    tags: 'progress work logs log hours actual effort',
  },
  {
    question: "Why isn't a task or resource appearing on my dashboard?",
    answer:
      'For Project Managers, verify that the project filter is set to "All Projects" and clear any search queries. For Resources, ensure the task has been explicitly assigned to your user account and that the project is in an active status (PLANNED or IN_PROGRESS).',
    tags: 'missing task resource filter dashboard not appearing',
  },
  {
    question: 'What do the different task statuses mean?',
    answer:
      'SCHEDULED indicates planned work not yet started. IN_PROGRESS means active execution. BLOCKED represents work halted due to dependencies. COMPLETED means all criteria and deliverables are fulfilled. CANCELLED indicates discontinued items.',
    tags: 'status meaning scheduled in_progress blocked completed cancelled',
  },
  {
    question: 'What happens when a task is overdue?',
    answer:
      'If a task end date has passed and the status is not COMPLETED, TaskFlow flags the task as overdue with a warning pill and updates the parent project health status to "At Risk" or "Delayed".',
    tags: 'overdue late deadline delayed at risk',
  },
];

const filteredFaqs = computed(() => {
  if (!searchQuery.value) return faqs;
  const q = searchQuery.value.toLowerCase().trim();
  return faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.tags.toLowerCase().includes(q),
  );
});
</script>

<style scoped lang="scss">
.help-page-container {
  max-width: 1280px;
  margin: 0 auto;
}

.help-header-panel {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 16px;
  padding: 20px 24px;
}

.help-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: #f4f0fd;
  border: 1px solid #e9ddfd;
  border-radius: 9999px;
  color: #8b6fd8;
  font-size: 11.5px;
  font-weight: 700;
}

.role-context-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 9999px;
}

.help-page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--wo-text-main, #121620);
  margin: 2px 0 0 0;
  line-height: 1.2;
}

.help-page-subtitle {
  font-size: 14px;
  color: var(--wo-text-muted, #64748b);
  margin: 4px 0 0 0;
}

.search-filter-box {
  max-width: 680px;

  :deep(.q-field__control) {
    border-radius: 10px;
    background: var(--wo-bg-subtle, #f8fafc);
  }
}

.category-pill {
  border: 1px solid var(--wo-border, #eaecef);
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-muted, #64748b);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--wo-bg-hover, #f1f5f9);
    color: var(--wo-text-main, #1e293b);
  }

  &.category-pill-active {
    background: #8b6fd8;
    color: #ffffff;
    border-color: #8b6fd8;
    box-shadow: 0 2px 6px rgba(139, 111, 216, 0.25);
  }
}

.section-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.section-main-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--wo-text-main, #121620);
  margin: 0;
  line-height: 1.2;
}

.section-sub-desc {
  font-size: 12px;
  color: var(--wo-text-muted, #64748b);
}

.guide-card {
  height: 100%;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 24, 40, 0.06);
    border-color: #d8b4fe;
  }
}

.guide-icon-pill {
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.guide-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
}

.guide-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--wo-text-muted, #64748b);
  margin: 0;
}

.status-chip-inline {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;

  &.status-scheduled {
    background: #ede9fe;
    color: #6b21a8;
  }
  &.status-inprogress {
    background: #dbeafe;
    color: #1e40af;
  }
  &.status-blocked {
    background: #fee2e2;
    color: #991b1b;
  }
  &.status-completed {
    background: #dcfce7;
    color: #166534;
  }
}

/* FAQs */
.faqs-accordion-list {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 14px;
  overflow: hidden;
}

.faq-expansion-item {
  border-bottom: 1px solid var(--wo-border, #f1f3f7);

  &:last-child {
    border-bottom: none;
  }
}

:deep(.faq-header) {
  padding: 12px 16px;
}

.faq-question-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--wo-text-main, #1e293b);
}

.faq-answer-card {
  background: var(--wo-bg-subtle, #f8fafc);
  border-top: 1px solid var(--wo-border, #f1f3f7);
}

.faq-answer-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--wo-text-muted, #475569);
  padding: 12px 18px;
}

/* Contact Support */
.contact-support-card {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
}

.support-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--wo-text-main, #121620);
  margin: 0;
}

.support-card-subtitle {
  font-size: 12.5px;
  color: var(--wo-text-muted, #64748b);
  margin: 0;
}

.support-feedback-panel {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
}

.feedback-text {
  font-size: 12.5px;
  color: #166534;
  margin: 0 0 6px 0;
}

.support-submit-btn {
  border-radius: 8px;
  font-weight: 600;
}

/* About Card */
.about-card {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 14px;
}

.brand-badge-mini {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #8b6fd8;
  color: #ffffff;
  font-size: 11px;
}

.about-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #121620);
  margin: 0;
}

.about-desc {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--wo-text-muted, #64748b);
}

.spec-row {
  font-size: 12px;
  padding: 3px 0;
}

.spec-label {
  color: var(--wo-text-muted, #64748b);
}

.spec-value {
  color: var(--wo-text-main, #1e293b);
}

/* Soft Color Boxes */
.bg-purple-soft {
  background: rgba(139, 111, 216, 0.12);
}
.bg-teal-soft {
  background: rgba(14, 147, 132, 0.12);
}
.bg-orange-soft {
  background: rgba(247, 144, 9, 0.12);
}
.bg-blue-soft {
  background: rgba(46, 144, 250, 0.12);
}
.bg-green-soft {
  background: rgba(18, 183, 106, 0.12);
}

/* Dark mode adjustments */
body.body--dark {
  .help-header-panel,
  .guide-card,
  .faqs-accordion-list,
  .contact-support-card,
  .about-card,
  .category-pill {
    background: var(--wo-bg-card, #181d28);
    border-color: var(--wo-border, #1e2433);
  }

  .faq-answer-card {
    background: #131720;
    border-color: #1e2433;
  }

  .help-badge-pill {
    background: rgba(139, 111, 216, 0.18);
    border-color: rgba(139, 111, 216, 0.3);
  }

  .support-feedback-panel {
    background: #064e3b;
    border-color: #059669;
    color: #ecfdf5;

    .feedback-text {
      color: #ecfdf5;
    }
  }
}
</style>
