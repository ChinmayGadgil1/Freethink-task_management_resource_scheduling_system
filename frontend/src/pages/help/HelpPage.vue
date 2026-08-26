<template>
  <q-page class="q-pa-lg row justify-center">
    <div class="full-width q-mx-auto" style="max-width: 1280px">
      <!-- Header Section -->
      <q-card flat bordered class="q-mb-lg q-pa-lg bg-card border-subtle">
        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="row items-center q-gutter-x-sm">
            <q-btn flat round dense icon="arrow_back" color="grey-8" @click="goBack">
              <q-tooltip>Go Back</q-tooltip>
            </q-btn>
            <div>
              <div class="row items-center q-gutter-x-xs q-mb-xs">
                <q-badge
                  :color="isResourceRole ? 'teal' : 'primary'"
                  class="text-weight-bold q-px-sm q-py-xs text-uppercase"
                  style="border-radius: 9999px; font-size: 11px;"
                >
                  {{ isResourceRole ? 'Resource Workspace' : 'Project Manager Workspace' }}
                </q-badge>
              </div>
              <h1 class="text-h5 text-weight-bold text-main q-my-none" style="line-height: 1.2;">
                Help & Support
              </h1>
            </div>
          </div>
        </div>
        <p class="text-body2 text-grey-7 q-mt-sm q-mb-none">
          Find answers, learn how TaskFlow works, or reach out for assistance.
        </p>

        <!-- Quick Search / Filter Bar -->
        <div class="search-filter-box q-mt-md">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Search guides, FAQs, and concepts (e.g. create task, workload, gantt, progress)..."
            clearable
          >
            <template #prepend>
              <q-icon name="search" size="20px" color="grey-6" />
            </template>
          </q-input>
        </div>
      </q-card>

      <!-- Quick Navigation Category Tabs -->
      <div class="row wrap items-center q-gutter-sm q-mb-lg">
        <q-btn
          no-caps
          rounded
          :unelevated="activeTab === 'all'"
          :outline="activeTab !== 'all'"
          :color="activeTab === 'all' ? 'primary' : 'grey-7'"
          :text-color="activeTab === 'all' ? 'white' : 'grey-8'"
          label="All Topics"
          @click="activeTab = 'all'"
        />
        <q-btn
          no-caps
          rounded
          :unelevated="activeTab === 'guides'"
          :outline="activeTab !== 'guides'"
          :color="activeTab === 'guides' ? 'primary' : 'grey-7'"
          :text-color="activeTab === 'guides' ? 'white' : 'grey-8'"
          icon="menu_book"
          label="Getting Started"
          @click="activeTab = 'guides'"
        />
        <q-btn
          no-caps
          rounded
          :unelevated="activeTab === 'faqs'"
          :outline="activeTab !== 'faqs'"
          :color="activeTab === 'faqs' ? 'primary' : 'grey-7'"
          :text-color="activeTab === 'faqs' ? 'white' : 'grey-8'"
          icon="help"
          label="FAQs"
          @click="activeTab = 'faqs'"
        />
        <q-btn
          no-caps
          rounded
          :unelevated="activeTab === 'contact'"
          :outline="activeTab !== 'contact'"
          :color="activeTab === 'contact' ? 'primary' : 'grey-7'"
          :text-color="activeTab === 'contact' ? 'white' : 'grey-8'"
          icon="mail"
          label="Contact Support"
          @click="activeTab = 'contact'"
        />
        <q-btn
          no-caps
          rounded
          :unelevated="activeTab === 'about'"
          :outline="activeTab !== 'about'"
          :color="activeTab === 'about' ? 'primary' : 'grey-7'"
          :text-color="activeTab === 'about' ? 'white' : 'grey-8'"
          icon="info"
          label="About"
          @click="activeTab = 'about'"
        />
      </div>

      <div class="row q-col-gutter-lg">
        <!-- Left Column: Guides & FAQs -->
        <div
          v-show="activeTab === 'all' || activeTab === 'guides' || activeTab === 'faqs'"
          class="col-12"
          :class="activeTab === 'all' ? 'col-lg-8' : 'col-lg-12'"
        >
          <!-- SECTION 1: GETTING STARTED GUIDES -->
          <div v-show="activeTab === 'all' || activeTab === 'guides'" class="q-mb-xl">
            <div class="row items-center q-gutter-x-sm q-mb-md no-wrap">
              <div
                class="flex flex-center bg-purple-soft text-primary"
                style="width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;"
              >
                <q-icon name="menu_book" size="18px" />
              </div>
              <div>
                <h2 class="text-subtitle1 text-weight-bold text-main q-my-none" style="line-height: 1.2;">
                  Getting Started Guides
                </h2>
                <div class="text-caption text-grey-6">
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
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div
                        class="flex flex-center bg-purple-soft text-primary"
                        style="width: 28px; height: 28px; border-radius: 6px;"
                      >
                        <q-icon name="folder" size="16px" />
                      </div>
                      <div class="text-subtitle2 text-weight-bold text-main">
                        Projects Management
                      </div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
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
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div
                        class="flex flex-center bg-teal-soft text-teal"
                        style="width: 28px; height: 28px; border-radius: 6px;"
                      >
                        <q-icon name="task_alt" size="16px" />
                      </div>
                      <div class="text-subtitle2 text-weight-bold text-main">
                        Tasks & Deliverables
                      </div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
                      Tasks belong to projects with expected effort hours, target date ranges,
                      assigned resources, and priorities. Work is tracked across four core statuses:
                      <span class="status-chip-inline status-scheduled q-mx-xs">SCHEDULED</span>,
                      <span class="status-chip-inline status-inprogress q-mx-xs">IN_PROGRESS</span>,
                      <span class="status-chip-inline status-blocked q-mx-xs">BLOCKED</span>, and
                      <span class="status-chip-inline status-completed q-mx-xs">COMPLETED</span>.
                    </p>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Guide 3: Resource Assignment -->
              <div
                v-if="matchesFilter('resource assignment team allocation members skills capacity')"
                class="col-12 col-md-6"
              >
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div
                        class="flex flex-center bg-orange-soft text-orange-9"
                        style="width: 28px; height: 28px; border-radius: 6px;"
                      >
                        <q-icon name="groups" size="16px" />
                      </div>
                      <div class="text-subtitle2 text-weight-bold text-main">
                        Resource Assignment
                      </div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
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
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div
                        class="flex flex-center bg-blue-soft text-blue-8"
                        style="width: 28px; height: 28px; border-radius: 6px;"
                      >
                        <q-icon name="calendar_month" size="16px" />
                      </div>
                      <div class="text-subtitle2 text-weight-bold text-main">
                        Scheduling & Gantt
                      </div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
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
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div
                        class="flex flex-center bg-green-soft text-green-8"
                        style="width: 28px; height: 28px; border-radius: 6px;"
                      >
                        <q-icon name="insights" size="16px" />
                      </div>
                      <div class="text-subtitle2 text-weight-bold text-main">
                        Progress & Work Logs
                      </div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
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
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div
                        class="flex flex-center bg-purple-soft text-primary"
                        style="width: 28px; height: 28px; border-radius: 6px;"
                      >
                        <q-icon name="pie_chart" size="16px" />
                      </div>
                      <div class="text-subtitle2 text-weight-bold text-main">
                        Workload & Capacity
                      </div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
                      Calculated using standard 40h weekly bandwidth. The system tracks effort
                      consumed (actual logged hours vs allocated hours) and highlights when a team
                      member's assigned effort exceeds capacity to prevent overbooking.
                    </p>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- SECTION 2: FREQUENTLY ASKED QUESTIONS -->
          <div v-show="activeTab === 'all' || activeTab === 'faqs'" class="q-mb-xl">
            <div class="row items-center q-gutter-x-sm q-mb-md no-wrap">
              <div
                class="flex flex-center bg-teal-soft text-teal"
                style="width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;"
              >
                <q-icon name="help_outline" size="18px" />
              </div>
              <div>
                <h2 class="text-subtitle1 text-weight-bold text-main q-my-none" style="line-height: 1.2;">
                  Frequently Asked Questions
                </h2>
                <div class="text-caption text-grey-6">
                  Answers to common operational questions in TaskFlow
                </div>
              </div>
            </div>

            <q-list bordered class="rounded-borders bg-card border-subtle">
              <q-expansion-item
                v-for="(faq, index) in filteredFaqs"
                :key="index"
                group="help-faqs"
                class="faq-expansion-item"
              >
                <template #header>
                  <q-item-section avatar style="min-width: 32px">
                    <q-icon name="help" size="16px" color="primary" />
                  </q-item-section>
                  <q-item-section class="text-subtitle2 text-weight-bold text-main">
                    {{ faq.question }}
                  </q-item-section>
                </template>

                <q-card class="bg-grey-1 border-top-subtle">
                  <q-card-section class="text-body2 text-grey-8 q-px-lg q-py-md" style="line-height: 1.6;">
                    {{ faq.answer }}
                  </q-card-section>
                </q-card>
              </q-expansion-item>

              <div v-if="filteredFaqs.length === 0" class="q-pa-lg text-center text-grey-6">
                <q-icon name="search_off" size="32px" class="q-mb-xs" />
                <div>No FAQs match your search query "{{ searchQuery }}".</div>
              </div>
            </q-list>
          </div>
        </div>

        <!-- Right Column: Contact Support Form & About Section -->
        <div
          v-show="activeTab === 'all' || activeTab === 'contact' || activeTab === 'about'"
          class="col-12"
          :class="activeTab === 'all' ? 'col-lg-4' : 'col-lg-8'"
        >
          <!-- SECTION 3: CONTACT SUPPORT FORM -->
          <div v-show="activeTab === 'all' || activeTab === 'contact'" class="q-mb-lg">
            <q-card flat bordered class="bg-card border-subtle">
              <q-card-section class="q-pb-xs">
                <div class="row items-center q-gutter-x-sm q-mb-xs no-wrap">
                  <div
                    class="flex flex-center bg-purple-soft text-primary"
                    style="width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;"
                  >
                    <q-icon name="support_agent" size="16px" />
                  </div>
                  <h3 class="text-subtitle1 text-weight-bold text-main q-my-none" style="line-height: 1.2;">
                    Contact Support
                  </h3>
                </div>
                <p class="text-caption text-grey-6 q-my-none">
                  Submit an inquiry or describe an issue with your workspace.
                </p>
              </q-card-section>

              <q-card-section>
                <!-- Submission Feedback State -->
                <div v-if="formSubmitted" class="q-pa-md q-mb-md bg-green-soft border-subtle">
                  <div class="row items-center q-gutter-x-xs q-mb-xs text-positive text-weight-bold">
                    <q-icon name="check_circle" size="20px" />
                    <span>Support Request Recorded</span>
                  </div>
                  <p class="text-body2 text-green-9 q-mb-xs">
                    Thank you, <strong>{{ contactForm.name }}</strong
                    >! Your inquiry regarding <em>"{{ contactForm.category }}"</em> has been recorded locally.
                  </p>
                  <div class="text-caption text-grey-7 q-mb-sm">
                    (Note: Live ticket dispatch service is not currently connected in this development environment.)
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
                      class="full-width q-mt-md"
                      style="border-radius: 8px; font-weight: 600;"
                    />
                  </div>
                </q-form>
              </q-card-section>
            </q-card>
          </div>

          <!-- SECTION 4: ABOUT TASKFLOW -->
          <div v-show="activeTab === 'all' || activeTab === 'about'">
            <q-card flat bordered class="bg-card border-subtle">
              <q-card-section>
                <div class="row items-center q-gutter-x-sm q-mb-xs no-wrap">
                  <div
                    class="flex flex-center bg-primary text-white"
                    style="width: 22px; height: 22px; border-radius: 6px; font-size: 11px; flex-shrink: 0;"
                  >
                    <span>✦</span>
                  </div>
                  <h3 class="text-subtitle1 text-weight-bold text-main q-my-none" style="line-height: 1.2;">
                    About TaskFlow
                  </h3>
                </div>

                <div class="text-body2 text-grey-7 q-mt-sm">
                  TaskFlow is a modern Task Management and Resource Scheduling System designed to
                  provide transparent planning, capacity balancing, and live progress visibility
                  across engineering teams.
                </div>

                <q-separator class="q-my-sm" />

                <div class="column q-gutter-y-xs">
                  <div class="row justify-between text-body2 q-py-xs">
                    <span class="text-grey-6">Application:</span>
                    <span class="text-weight-bold text-main">TaskFlow Workspace</span>
                  </div>
                  <div class="row justify-between text-body2 q-py-xs">
                    <span class="text-grey-6">Version:</span>
                    <span class="text-weight-bold text-main">v0.0.1</span>
                  </div>
                  <div class="row justify-between text-body2 q-py-xs">
                    <span class="text-grey-6">Capacity Baseline:</span>
                    <span class="text-main">40 Hours / Week</span>
                  </div>
                  <div class="row justify-between text-body2 q-py-xs">
                    <span class="text-grey-6">Current Role:</span>
                    <span class="text-primary text-weight-bold">
                      {{ isResourceRole ? 'Resource' : 'Project Manager' }}
                    </span>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
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
.guide-card {
  height: 100%;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 24, 40, 0.06);
    border-color: #d8b4fe;
  }
}

.search-filter-box {
  max-width: 680px;

  :deep(.q-field__control) {
    border-radius: 10px;
    background: var(--wo-bg-subtle, #f8fafc);
  }
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
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.border-subtle {
  border: 1px solid var(--wo-border, #eaecef);
}

.border-top-subtle {
  border-top: 1px solid var(--wo-border, #f1f3f7);
}

.faq-expansion-item {
  border-bottom: 1px solid var(--wo-border, #f1f3f7);

  &:last-child {
    border-bottom: none;
  }
}

/* Dark mode overrides */
body.body--dark {
  .guide-card {
    background: var(--wo-bg-card, #181d28);
    border-color: var(--wo-border, #1e2433);

    &:hover {
      border-color: var(--wo-primary, #8b6fd8);
    }
  }

  .bg-purple-soft {
    background: rgba(139, 111, 216, 0.18);
  }

  .bg-green-soft {
    background: #064e3b;
    border-color: #059669;
    color: #ecfdf5;
  }
}
</style>
