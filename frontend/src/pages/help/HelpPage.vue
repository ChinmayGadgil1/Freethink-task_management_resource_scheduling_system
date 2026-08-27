<template>
  <q-page class="pm-page">
    <div class="q-mx-auto" style="max-width: 1380px">

      <!-- ── PAGE HEADER ── matching other pages exactly -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <div class="page-title">Help &amp; Support</div>
          <div class="page-subtitle">
            Find answers, learn how TaskFlow works, or reach out to the team.
          </div>
        </div>

        <!-- Search bar in header row -->
        <q-input
          v-model="searchQuery"
          dense
          outlined
          placeholder="Search guides, FAQs..."
          clearable
          style="min-width: 280px; max-width: 360px;"
          class="gt-sm"
        >
          <template #prepend>
            <q-icon name="search" size="18px" color="grey-6" />
          </template>
        </q-input>
      </div>

      <!-- ── CATEGORY TABS ── -->
      <div class="row wrap items-center q-gutter-sm q-mb-lg">
        <q-btn
          v-for="tab in tabs"
          :key="tab.value"
          no-caps
          rounded
          :unelevated="activeTab === tab.value"
          :outline="activeTab !== tab.value"
          :color="activeTab === tab.value ? 'primary' : 'grey-7'"
          :text-color="activeTab === tab.value ? 'white' : 'grey-8'"
          :icon="tab.icon"
          :label="tab.label"
          @click="activeTab = tab.value"
        />
      </div>

      <!-- ── MAIN BODY ── -->
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
              <div class="section-icon-box bg-purple-soft text-primary">
                <q-icon name="menu_book" size="18px" />
              </div>
              <div>
                <div class="text-subtitle1 text-weight-bold text-main" style="line-height: 1.2;">
                  Getting Started Guides
                </div>
                <div class="text-caption text-grey-6">Core concepts and step-by-step workflows</div>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div v-if="matchesFilter('projects project create health priority')" class="col-12 col-md-6">
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div class="guide-icon bg-purple-soft text-primary"><q-icon name="folder" size="16px" /></div>
                      <div class="text-subtitle2 text-weight-bold text-main">Projects Management</div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
                      Project Managers create projects with title, description, priority
                      (<span class="text-weight-bold text-negative">Critical</span>,
                      <span class="text-weight-bold text-orange">High</span>,
                      <span class="text-weight-bold text-primary">Medium</span>,
                      <span class="text-weight-bold text-grey-7">Low</span>) and scheduled dates.
                      TaskFlow auto-computes progress and health flags.
                    </p>
                  </q-card-section>
                </q-card>
              </div>

              <div v-if="matchesFilter('tasks task assign effort status scheduled in_progress completed')" class="col-12 col-md-6">
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div class="guide-icon bg-teal-soft text-teal"><q-icon name="task_alt" size="16px" /></div>
                      <div class="text-subtitle2 text-weight-bold text-main">Tasks &amp; Deliverables</div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
                      Tasks belong to projects with effort hours, target dates, and priorities. Work flows
                      through
                      <span class="status-chip-inline status-scheduled">SCHEDULED</span>,
                      <span class="status-chip-inline status-inprogress">IN_PROGRESS</span>, and
                      <span class="status-chip-inline status-completed">COMPLETED</span>.
                    </p>
                  </q-card-section>
                </q-card>
              </div>

              <div v-if="matchesFilter('resource assignment team allocation members capacity')" class="col-12 col-md-6">
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div class="guide-icon bg-orange-soft text-orange-9"><q-icon name="groups" size="16px" /></div>
                      <div class="text-subtitle2 text-weight-bold text-main">Resource Assignment</div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
                      Assign team members to projects and tasks. Resources see their assigned items on the
                      Resource Dashboard and Task Specs views.
                    </p>
                  </q-card-section>
                </q-card>
              </div>

              <div v-if="matchesFilter('scheduling schedule gantt timeline dates dependencies calendar')" class="col-12 col-md-6">
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div class="guide-icon bg-blue-soft text-blue-8"><q-icon name="calendar_month" size="16px" /></div>
                      <div class="text-subtitle2 text-weight-bold text-main">Scheduling &amp; Gantt</div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
                      The Schedule page plots task start and end dates onto interactive Gantt timelines showing
                      duration bars, progress fills, priority colour coding, and assignee avatars.
                    </p>
                  </q-card-section>
                </q-card>
              </div>

              <div v-if="matchesFilter('progress work logs log hours effort actual completed')" class="col-12 col-md-6">
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div class="guide-icon bg-green-icon text-green-8"><q-icon name="insights" size="16px" /></div>
                      <div class="text-subtitle2 text-weight-bold text-main">Progress &amp; Work Logs</div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
                      Resources log actual effort hours and update completion progress. Logged work updates
                      the task's actual effort and rolls up into project-level metrics.
                    </p>
                  </q-card-section>
                </q-card>
              </div>

              <div v-if="matchesFilter('workload capacity 40h hours allocation balance overallocated')" class="col-12 col-md-6">
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div class="guide-icon bg-purple-soft text-primary"><q-icon name="pie_chart" size="16px" /></div>
                      <div class="text-subtitle2 text-weight-bold text-main">Workload &amp; Capacity</div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5;">
                      Calculated using the standard 40 h/week bandwidth. The system highlights when a
                      team member's assigned effort exceeds capacity to prevent overbooking.
                    </p>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- SECTION 2: FAQs -->
          <div v-show="activeTab === 'all' || activeTab === 'faqs'" class="q-mb-xl">
            <div class="row items-center q-gutter-x-sm q-mb-md no-wrap">
              <div class="section-icon-box bg-teal-soft text-teal">
                <q-icon name="help_outline" size="18px" />
              </div>
              <div>
                <div class="text-subtitle1 text-weight-bold text-main" style="line-height: 1.2;">
                  Frequently Asked Questions
                </div>
                <div class="text-caption text-grey-6">Answers to common operational questions</div>
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
                <q-card class="border-top-subtle" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'">
                  <q-card-section class="text-body2 text-grey-7 q-px-lg q-py-md" style="line-height: 1.6;">
                    {{ faq.answer }}
                  </q-card-section>
                </q-card>
              </q-expansion-item>

              <div v-if="filteredFaqs.length === 0" class="q-pa-lg text-center text-grey-6">
                <q-icon name="search_off" size="32px" class="q-mb-xs" />
                <div>No FAQs match "{{ searchQuery }}".</div>
              </div>
            </q-list>
          </div>
        </div>

        <!-- Right Column: Contact Support & About -->
        <div
          v-show="activeTab === 'all' || activeTab === 'contact' || activeTab === 'about'"
          class="col-12"
          :class="activeTab === 'all' ? 'col-lg-4' : 'col-lg-8'"
        >

          <!-- SECTION 3: CONTACT SUPPORT -->
          <div v-show="activeTab === 'all' || activeTab === 'contact'" class="q-mb-lg">
            <q-card flat bordered class="bg-card border-subtle">
              <q-card-section class="q-pb-xs">
                <div class="row items-center q-gutter-x-sm q-mb-xs no-wrap">
                  <div class="guide-icon bg-purple-soft text-primary" style="width: 28px; height: 28px;">
                    <q-icon name="support_agent" size="16px" />
                  </div>
                  <div class="text-subtitle1 text-weight-bold text-main">Contact Support</div>
                </div>
                <p class="text-caption text-grey-6 q-my-none">
                  Submit a ticket below — it's saved to the database. Or email us directly.
                </p>
              </q-card-section>

              <!-- Direct Email CTA -->
              <q-card-section class="q-pt-sm q-pb-xs">
                <q-btn
                  outline
                  no-caps
                  icon="mail"
                  label="Email Us Directly"
                  color="primary"
                  class="full-width"
                  style="border-radius: 8px;"
                  @click="openMailClient"
                />
              </q-card-section>

              <q-separator class="q-my-xs" />

              <q-card-section>
                <!-- Success state -->
                <div
                  v-if="formSubmitted"
                  class="q-pa-md bg-green-soft border-subtle q-mb-sm"
                  style="border-radius: 8px;"
                >
                  <div class="row items-center q-gutter-x-xs q-mb-xs text-positive text-weight-bold">
                    <q-icon name="check_circle" size="18px" />
                    <span>Ticket Saved!</span>
                  </div>
                  <p class="text-body2 text-green-9 q-mb-sm">
                    Your ticket for <em>"{{ contactForm.category }}"</em> was saved. We'll review it shortly.
                  </p>
                  <q-btn
                    unelevated
                    dense
                    no-caps
                    label="Submit Another"
                    color="primary"
                    class="q-px-sm"
                    style="border-radius: 6px;"
                    @click="resetForm"
                  />
                </div>

                <!-- Ticket form -->
                <q-form v-else @submit.prevent="submitContactForm">
                  <div class="q-gutter-y-sm">
                    <q-input
                      v-model="contactForm.name"
                      dense
                      outlined
                      label="Your Name"
                      :rules="[(val: string) => !!val || 'Name is required']"
                      hide-bottom-space
                    />
                    <q-input
                      v-model="contactForm.email"
                      dense
                      outlined
                      type="email"
                      label="Your Email"
                      :rules="[(val: string) => !!val || 'Email is required']"
                      hide-bottom-space
                    />
                    <q-select
                      v-model="contactForm.category"
                      dense
                      outlined
                      label="Issue Category"
                      :options="categoryOptions"
                      :rules="[(val: string) => !!val || 'Category is required']"
                      hide-bottom-space
                    />
                    <q-input
                      v-model="contactForm.description"
                      dense
                      outlined
                      type="textarea"
                      rows="3"
                      label="Describe your issue or question"
                      :rules="[(val: string) => !!val || 'Description is required']"
                      hide-bottom-space
                    />
                    <q-btn
                      type="submit"
                      unelevated
                      no-caps
                      label="Submit Ticket"
                      icon="send"
                      color="primary"
                      class="full-width q-mt-sm"
                      :loading="submitting"
                      style="border-radius: 8px;"
                    />
                  </div>
                </q-form>
              </q-card-section>
            </q-card>

            <!-- Your Tickets History -->
            <q-card v-if="ticketsList.length > 0" flat bordered class="bg-card border-subtle q-mt-md">
              <q-card-section class="q-pb-xs">
                <div class="row items-center q-gutter-x-sm no-wrap">
                  <div class="guide-icon bg-blue-soft text-blue-8" style="width: 28px; height: 28px;">
                    <q-icon name="list_alt" size="16px" />
                  </div>
                  <div class="text-subtitle2 text-weight-bold text-main">Your Previous Tickets</div>
                </div>
              </q-card-section>
              <q-separator />
              <q-list separator>
                <q-item v-for="ticket in ticketsList" :key="ticket.ticket_id" class="q-py-sm">
                  <q-item-section>
                    <div class="row items-center justify-between no-wrap q-mb-xs">
                      <div class="row items-center q-gutter-x-xs">
                        <span class="text-caption text-weight-bold text-grey-6">#{{ ticket.ticket_id }}</span>
                        <q-badge color="purple" outline class="text-weight-medium" style="font-size: 10px;">
                          {{ ticket.category }}
                        </q-badge>
                      </div>
                    </div>
                    <div class="text-body2 text-grey-8 q-mb-xs ellipsis" style="max-width: 300px;">
                      {{ ticket.description }}
                    </div>
                    <div class="text-caption text-grey-5">
                      {{ formatDate(ticket.created_at) }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <!-- SECTION 4: ABOUT TASKFLOW -->
          <div v-show="activeTab === 'all' || activeTab === 'about'">
            <q-card flat bordered class="bg-card border-subtle">
              <q-card-section>
                <div class="row items-center q-gutter-x-sm q-mb-md no-wrap">
                  <div class="section-icon-box bg-purple-soft text-primary">
                    <q-icon name="info" size="18px" />
                  </div>
                  <div class="text-subtitle1 text-weight-bold text-main">About TaskFlow</div>
                </div>

                <div class="text-body2 text-grey-7 q-mb-md" style="line-height: 1.6;">
                  TaskFlow is a modern Task Management and Resource Scheduling System designed to provide
                  transparent planning, capacity balancing, and live progress visibility across engineering teams.
                </div>

                <q-separator class="q-mb-md" />

                <div class="column q-gutter-y-xs">
                  <div class="row justify-between items-center text-body2 q-py-xs">
                    <span class="text-grey-6">Application</span>
                    <span class="text-weight-bold text-main">TaskFlow Workspace</span>
                  </div>
                  <div class="row justify-between items-center text-body2 q-py-xs">
                    <span class="text-grey-6">Version</span>
                    <q-badge color="primary" outline>v0.0.1</q-badge>
                  </div>
                  <div class="row justify-between items-center text-body2 q-py-xs">
                    <span class="text-grey-6">Capacity Baseline</span>
                    <span class="text-main">40 h / week</span>
                  </div>
                  <div class="row justify-between items-center text-body2 q-py-xs">
                    <span class="text-grey-6">Your Role</span>
                    <q-badge :color="isResourceRole ? 'teal' : 'primary'">
                      {{ isResourceRole ? 'Resource' : 'Project Manager' }}
                    </q-badge>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useQuasar } from 'quasar';
import { createSupportTicketApi, getSupportTicketsApi, type SupportTicket } from '@/services/api';
import { formatDate } from '@/utils/formatters';

const route   = useRoute();
const authStore = useAuthStore();
const $q      = useQuasar();

const searchQuery   = ref('');
const activeTab     = ref<'all' | 'guides' | 'faqs' | 'contact' | 'about'>('all');
const formSubmitted = ref(false);
const submitting    = ref(false);
const ticketsList   = ref<SupportTicket[]>([]);

const tabs = [
  { value: 'all',     label: 'All Topics',       icon: 'apps' },
  { value: 'guides',  label: 'Getting Started',  icon: 'menu_book' },
  { value: 'faqs',    label: 'FAQs',             icon: 'help' },
  { value: 'contact', label: 'Contact Support',  icon: 'mail' },
  { value: 'about',   label: 'About',            icon: 'info' },
] as const;

const isResourceRole = computed(() =>
  route.path.includes('resource-dashboard') || authStore.user?.role === 'RESOURCE'
);

// ── Contact Form ──────────────────────────────────────────────────────────────
const contactForm = ref({
  name:        authStore.user?.name  || '',
  email:       authStore.user?.email || '',
  category:    'Task & Project Management',
  description: '',
});
const categoryOptions = [
  'Task & Project Management',
  'Resource & Workload Scheduling',
  'Progress & Work Logs',
  'Account & Access',
  'General Inquiry',
];

/** Open the user's default mail client with pre-filled fields */
function openMailClient() {
  const to      = 'support@taskflow.dev';
  const subject = encodeURIComponent(`[TaskFlow Support] ${contactForm.value.category}`);
  const body    = encodeURIComponent(
    `Name: ${contactForm.value.name}\nEmail: ${contactForm.value.email}\n\n${contactForm.value.description || 'Please describe your issue here.'}`
  );
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

async function loadTickets() {
  try {
    ticketsList.value = await getSupportTicketsApi();
  } catch (err) {
    console.error('Failed to load tickets:', err);
  }
}

onMounted(() => { void loadTickets(); });

async function submitContactForm() {
  if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.description) return;
  submitting.value = true;
  try {
    await createSupportTicketApi({
      name:        contactForm.value.name,
      email:       contactForm.value.email,
      category:    contactForm.value.category,
      description: contactForm.value.description,
    });
    $q.notify({ type: 'positive', message: 'Support ticket submitted!' });
    formSubmitted.value = true;
    void loadTickets();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit support request.';
    $q.notify({ type: 'negative', message: msg });
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  contactForm.value.description = '';
  formSubmitted.value = false;
}

// ── Search filter ─────────────────────────────────────────────────────────────
function matchesFilter(text: string): boolean {
  if (!searchQuery.value) return true;
  return text.toLowerCase().includes(searchQuery.value.toLowerCase().trim());
}

// ── FAQs ──────────────────────────────────────────────────────────────────────
const faqs = [
  {
    question: 'How do I create a project?',
    answer: 'Navigate to the Projects page and click "+ New Project". Provide the name, description, priority, and dates, then save.',
    tags: 'create project new pm priority deadline',
  },
  {
    question: 'How do I create a task?',
    answer: 'Open the Tasks page or a project details view and click "+ Create Task". Enter the title, expected effort hours, priority, dates, and assign resources.',
    tags: 'create task new effort hours assignee',
  },
  {
    question: 'How do I assign a resource to a task?',
    answer: 'When creating or editing a task, choose team members from the Assignees multi-select dropdown.',
    tags: 'assign resource allocation member team',
  },
  {
    question: 'How does the Gantt / Schedule view work?',
    answer: 'The Schedule page maps task dates onto an interactive Gantt timeline with duration bars, priority colours, and assignee avatars across 7, 14, or 30-day windows.',
    tags: 'scheduling gantt timeline calendar duration dates',
  },
  {
    question: 'How is resource workload calculated?',
    answer: 'Workload compares total allocated hours against the 40 h/week capacity baseline and highlights overallocation.',
    tags: 'workload capacity 40h calculation allocated hours effort',
  },
  {
    question: 'How do I log work hours and update progress?',
    answer: 'Open your assigned task and click "Add Update". Enter actual hours worked and progress notes; these roll up into project-level metrics.',
    tags: 'progress work logs log hours actual effort',
  },
  {
    question: "Why isn't a task appearing on my dashboard?",
    answer: 'For PMs, check that the project filter shows "All Projects" and clear any search queries. For resources, ensure the task is explicitly assigned to your account.',
    tags: 'missing task resource filter dashboard not appearing',
  },
  {
    question: 'What do the task statuses mean?',
    answer: 'SCHEDULED = planned but not started. IN_PROGRESS = actively being worked on. COMPLETED = fully delivered.',
    tags: 'status meaning scheduled in_progress completed',
  },
  {
    question: 'What happens when a task is overdue?',
    answer: "If a task's deadline has passed and status isn't COMPLETED, TaskFlow flags it as overdue and marks the project as At Risk or Delayed.",
    tags: 'overdue late deadline delayed at risk',
  },
];

const filteredFaqs = computed(() => {
  if (!searchQuery.value) return faqs;
  const q = searchQuery.value.toLowerCase().trim();
  return faqs.filter(
    (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.tags.includes(q)
  );
});
</script>

<style scoped lang="scss">
/* ── Section icon boxes ───────────────────────────────── */
.section-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.guide-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
}

/* ── Guide cards ──────────────────────────────────────── */
.guide-card {
  height: 100%;
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 24, 40, 0.07);
    border-color: #d8b4fe;
  }
}

/* ── Status chips inline ──────────────────────────────── */
.status-chip-inline {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  margin: 0 2px;

  &.status-scheduled  { background: #ede9fe; color: #6b21a8; }
  &.status-inprogress { background: #dbeafe; color: #1e40af; }
  &.status-blocked    { background: #fee2e2; color: #991b1b; }
  &.status-completed  { background: #dcfce7; color: #166534; }
}

/* ── Soft colour helpers ──────────────────────────────── */
.bg-purple-soft { background: rgba(139, 111, 216, 0.12); }
.bg-teal-soft   { background: rgba(14,  147, 132, 0.12); }
.bg-orange-soft { background: rgba(247, 144,   9, 0.12); }
.bg-blue-soft   { background: rgba(46,  144, 250, 0.12); }
.bg-green-icon  { background: rgba(34,  197,  94, 0.12); }
.bg-green-soft  {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

/* ── Borders ──────────────────────────────────────────── */
.border-subtle     { border: 1px solid var(--wo-border, #eaecef); }
.border-top-subtle { border-top: 1px solid var(--wo-border, #f1f3f7); }

/* ── FAQ expansion items ──────────────────────────────── */
.faq-expansion-item {
  border-bottom: 1px solid var(--wo-border, #f1f3f7);
  &:last-child { border-bottom: none; }
}

/* ── Dark mode ────────────────────────────────────────── */
body.body--dark {
  .guide-card {
    background: var(--wo-bg-card, #181d28);
    border-color: var(--wo-border, #1e2433);
    &:hover { border-color: var(--wo-primary, #8b6fd8); }
  }

  .bg-purple-soft { background: rgba(139, 111, 216, 0.18); }
  .bg-teal-soft   { background: rgba(14,  147, 132, 0.18); }
  .bg-orange-soft { background: rgba(247, 144,   9, 0.18); }
  .bg-blue-soft   { background: rgba(46,  144, 250, 0.18); }
  .bg-green-icon  { background: rgba(34,  197,  94, 0.18); }

  .bg-green-soft {
    background: #064e3b;
    border-color: #059669;
    color: #ecfdf5;
  }
}
</style>
