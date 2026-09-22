<template>
  <q-page class="pm-page">
    <div class="q-mx-auto" style="max-width: 1380px">
      <!-- ── PAGE HEADER ── matching other pages exactly -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <div class="page-title">Help &amp; Support</div>
          <div class="page-subtitle">
            {{
              isResourceRole
                ? 'Resource Guide: Tracking tasks, logging work, and managing availability.'
                : 'Project Manager Guide: Planning projects, balancing capacity, and scheduling.'
            }}
          </div>
        </div>

        <!-- Search bar in header row -->
        <q-input
          v-model="searchQuery"
          dense
          outlined
          placeholder="Search guides, FAQs..."
          clearable
          style="min-width: 280px; max-width: 360px"
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
                <div class="text-subtitle1 text-weight-bold text-main" style="line-height: 1.2">
                  Getting Started Guides
                </div>
                <div class="text-caption text-grey-6">
                  {{
                    isResourceRole
                      ? 'Workflows and tools for Team Resources'
                      : 'Workflows and tools for Project Managers'
                  }}
                </div>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div v-for="(guide, index) in filteredGuides" :key="index" class="col-12 col-md-6">
                <q-card flat bordered class="guide-card">
                  <q-card-section>
                    <div class="row items-center q-gutter-x-sm q-mb-sm">
                      <div :class="['guide-icon', guide.iconBgClass, guide.iconColorClass]">
                        <q-icon :name="guide.icon" size="16px" />
                      </div>
                      <div class="text-subtitle2 text-weight-bold text-main">
                        {{ guide.title }}
                      </div>
                    </div>
                    <p class="text-body2 text-grey-7 q-mb-none" style="line-height: 1.5">
                      {{ guide.description }}
                    </p>
                  </q-card-section>
                </q-card>
              </div>

              <div
                v-if="filteredGuides.length === 0"
                class="col-12 text-center q-pa-lg text-grey-6"
              >
                <q-icon name="search_off" size="32px" class="q-mb-xs" />
                <div>No guides match "{{ searchQuery }}".</div>
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
                <div class="text-subtitle1 text-weight-bold text-main" style="line-height: 1.2">
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
                <q-card
                  class="border-top-subtle"
                  :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'"
                >
                  <q-card-section
                    class="text-body2 text-grey-7 q-px-lg q-py-md"
                    style="line-height: 1.6"
                  >
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

        <!-- Right Column: About TaskFlow -->
        <div
          v-show="activeTab === 'all' || activeTab === 'about'"
          class="col-12"
          :class="activeTab === 'all' ? 'col-lg-4' : 'col-lg-8'"
        >
          <!-- SECTION 3: ABOUT TASKFLOW -->
          <div class="row items-center q-gutter-x-sm q-mb-md no-wrap">
            <div class="section-icon-box bg-purple-soft text-primary">
              <q-icon name="info" size="18px" />
            </div>
            <div>
              <div class="text-subtitle1 text-weight-bold text-main" style="line-height: 1.2">
                About TaskFlow
              </div>
              <div class="text-caption text-grey-6">Workspace overview &amp; environment</div>
            </div>
          </div>

          <q-card flat bordered class="bg-card border-subtle">
            <q-card-section>
              <div class="text-body2 text-grey-7 q-mb-md" style="line-height: 1.6">
                TaskFlow is an enterprise Task Management and Resource Scheduling System designed to
                provide transparent planning, capacity balancing, and live progress visibility
                across engineering teams.
              </div>

              <q-separator class="q-mb-md" />

              <div class="column q-gutter-y-xs">
                <div class="row justify-between items-center text-body2 q-py-xs">
                  <span class="text-grey-6">Application</span>
                  <span class="text-weight-bold text-main">TaskFlow Workspace</span>
                </div>
                <div class="row justify-between items-center text-body2 q-py-xs">
                  <span class="text-grey-6">Version</span>
                  <q-badge color="primary" outline>v1.0.0</q-badge>
                </div>
                <div class="row justify-between items-center text-body2 q-py-xs">
                  <span class="text-grey-6">Capacity Baseline</span>
                  <span class="text-main">40 h / week</span>
                </div>
                <div class="row justify-between items-center text-body2 q-py-xs">
                  <span class="text-grey-6">Logged-in Role</span>
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const searchQuery = ref('');
const activeTab = ref<'all' | 'guides' | 'faqs' | 'about'>('all');

const tabs = [
  { value: 'all', label: 'All Topics', icon: 'apps' },
  { value: 'guides', label: 'Getting Started', icon: 'menu_book' },
  { value: 'faqs', label: 'FAQs', icon: 'help' },
  { value: 'about', label: 'About', icon: 'info' },
] as const;

const isResourceRole = computed(
  () => route.path.includes('resource-dashboard') || authStore.user?.role === 'RESOURCE',
);

interface GuideItem {
  title: string;
  description: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  role: 'ALL' | 'PROJECT_MANAGER' | 'RESOURCE';
  tags: string;
}

const allGuides: GuideItem[] = [
  // PM GUIDES
  {
    title: 'Project Planning & Lifecycle',
    description:
      'Create projects, set priority (Critical, High, Medium, Low), establish start and deadline dates, and track overall progress milestones.',
    icon: 'folder',
    iconBgClass: 'bg-purple-soft',
    iconColorClass: 'text-primary',
    role: 'PROJECT_MANAGER',
    tags: 'projects project create health priority deadline lifecycle pm',
  },
  {
    title: 'Resource Allocation & Workload',
    description:
      'Assign team members to projects and tasks. Monitor weekly 40h bandwidth and prevent overallocation across concurrent deliverables.',
    icon: 'groups',
    iconBgClass: 'bg-orange-soft',
    iconColorClass: 'text-orange-9',
    role: 'PROJECT_MANAGER',
    tags: 'resource assignment team allocation members capacity workload overallocated pm',
  },
  {
    title: 'Gantt Timeline & Scheduling',
    description:
      'Use the interactive Gantt chart to sequence tasks, establish predecessor dependencies, and track deliverable timelines in real time.',
    icon: 'calendar_month',
    iconBgClass: 'bg-blue-soft',
    iconColorClass: 'text-blue-8',
    role: 'PROJECT_MANAGER',
    tags: 'scheduling schedule gantt timeline dates dependencies calendar pm',
  },
  {
    title: 'Reviewing & Approving Leaves',
    description:
      'Review pending leave requests from team members, approve or reject applications, and trigger automatic Gantt schedule recalculations.',
    icon: 'event_busy',
    iconBgClass: 'bg-teal-soft',
    iconColorClass: 'text-teal',
    role: 'PROJECT_MANAGER',
    tags: 'leave leaves approval approve reject calendar holiday pm',
  },
  {
    title: 'Recycle Bin & Safe Restoration',
    description:
      'Soft-deleted projects and tasks are preserved in the Recycle Bin. Restore items at any time without losing schedule history or dependencies.',
    icon: 'delete_outline',
    iconBgClass: 'bg-purple-soft',
    iconColorClass: 'text-purple-8',
    role: 'PROJECT_MANAGER',
    tags: 'bin recycle restore deleted tasks projects pm',
  },

  // RESOURCE GUIDES
  {
    title: 'My Daily Work Center',
    description:
      'View tasks actively assigned to you, check deadlines, review task specifications, and prioritize high-impact deliverables.',
    icon: 'task_alt',
    iconBgClass: 'bg-teal-soft',
    iconColorClass: 'text-teal',
    role: 'RESOURCE',
    tags: 'tasks task dashboard deliverables my work resource',
  },
  {
    title: 'Progress Logging & Effort Tracking',
    description:
      'Log actual hours worked on assigned tasks, submit completion progress percentages, and attach work notes directly from your dashboard.',
    icon: 'insights',
    iconBgClass: 'bg-green-icon',
    iconColorClass: 'text-green-8',
    role: 'RESOURCE',
    tags: 'progress work logs log hours actual effort resource',
  },
  {
    title: 'Applying for Leave & Time-Off',
    description:
      'Request single-day or multi-day leaves with full-day or half-day options. Check your remaining schedule and track PM approval status.',
    icon: 'event_available',
    iconBgClass: 'bg-blue-soft',
    iconColorClass: 'text-blue-8',
    role: 'RESOURCE',
    tags: 'leaves leave request vacation timeoff approval resource',
  },
  {
    title: 'Schedule & Capacity Overview',
    description:
      'View your personal working days, configured daily working hours, and company holidays on your interactive timeline calendar.',
    icon: 'pie_chart',
    iconBgClass: 'bg-purple-soft',
    iconColorClass: 'text-primary',
    role: 'RESOURCE',
    tags: 'capacity schedule hours allocation calendar resource',
  },

  // SHARED GUIDES
  {
    title: 'Task Status Lifecycle',
    description:
      'Work moves transparently through SCHEDULED (planned), IN_PROGRESS (under active delivery), and COMPLETED (finished).',
    icon: 'trending_up',
    iconBgClass: 'bg-teal-soft',
    iconColorClass: 'text-teal',
    role: 'ALL',
    tags: 'status lifecycle scheduled in_progress completed all',
  },
];

const filteredGuides = computed(() => {
  const currentRole = isResourceRole.value ? 'RESOURCE' : 'PROJECT_MANAGER';
  const q = searchQuery.value.toLowerCase().trim();

  return allGuides.filter((g) => {
    const roleMatches = g.role === 'ALL' || g.role === currentRole;
    if (!roleMatches) return false;
    if (!q) return true;
    return (
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.tags.includes(q)
    );
  });
});

interface FaqItem {
  question: string;
  answer: string;
  role: 'ALL' | 'PROJECT_MANAGER' | 'RESOURCE';
  tags: string;
}

const allFaqs: FaqItem[] = [
  // PM FAQS
  {
    question: 'How do I create a new project?',
    answer:
      'Navigate to the Projects page and click "+ New Project". Fill in the title, description, priority, and scheduled dates, then click Create.',
    role: 'PROJECT_MANAGER',
    tags: 'create project new pm priority deadline',
  },
  {
    question: 'How do I assign team members to a project or task?',
    answer:
      'From the Project Details page, click "Add Member" in the Members tab. When creating or editing tasks, pick team members from the Assignees selector.',
    role: 'PROJECT_MANAGER',
    tags: 'assign resource allocation member team pm',
  },
  {
    question: 'How do I review and approve leave requests?',
    answer:
      "Open the Leaves page or a resource's detail view. Pending requests display with Approve and Reject actions. Approving a leave automatically recalculates project timelines.",
    role: 'PROJECT_MANAGER',
    tags: 'approve reject leave request schedule recalculate pm',
  },
  {
    question: 'How do I restore binned items?',
    answer:
      'Open the Recycle Bin page from the sidebar. You can view all binned projects and tasks and click "Restore" to safely re-introduce them to active schedules.',
    role: 'PROJECT_MANAGER',
    tags: 'restore bin recycle undelete pm',
  },

  // RESOURCE FAQS
  {
    question: 'How do I log work hours and update task progress?',
    answer:
      'Click on any assigned task on your dashboard or Progress page and select "Add Update". Enter the hours logged, update the progress slider, and add any work notes.',
    role: 'RESOURCE',
    tags: 'log hours progress actual effort work update resource',
  },
  {
    question: 'How do I request a leave of absence?',
    answer:
      'Navigate to the Leaves page from your sidebar and click "Request Leave". Choose your date range, select full-day or half-day options, and submit for PM review.',
    role: 'RESOURCE',
    tags: 'apply request leave timeoff vacation resource',
  },
  {
    question: "Why isn't a task appearing on my dashboard?",
    answer:
      'Ensure that the task has been assigned to your account by the Project Manager. If you were recently added to a project, check your assigned task specs list.',
    role: 'RESOURCE',
    tags: 'missing task dashboard assigned resource',
  },

  // SHARED FAQS
  {
    question: 'What do the task statuses mean?',
    answer:
      'SCHEDULED = planned and assigned but work has not started. IN_PROGRESS = active work is underway. COMPLETED = deliverable is 100% finished.',
    role: 'ALL',
    tags: 'status meaning scheduled in_progress completed',
  },
  {
    question: 'What happens when a task passes its deadline?',
    answer:
      "If a task's deadline passes before it reaches COMPLETED, TaskFlow flags it as Overdue and highlights it on dashboards and project health indicators.",
    role: 'ALL',
    tags: 'overdue late deadline delayed at risk',
  },
];

const filteredFaqs = computed(() => {
  const currentRole = isResourceRole.value ? 'RESOURCE' : 'PROJECT_MANAGER';
  const q = searchQuery.value.toLowerCase().trim();

  return allFaqs.filter((f) => {
    const roleMatches = f.role === 'ALL' || f.role === currentRole;
    if (!roleMatches) return false;
    if (!q) return true;
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.tags.includes(q)
    );
  });
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
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

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

  &.status-scheduled {
    background: #f1f5f9;
    color: #475569;
  }
  &.status-inprogress {
    background: #eff6ff;
    color: #0284c7;
  }
  &.status-blocked {
    background: #fef2f2;
    color: #dc2626;
  }
  &.status-completed {
    background: #ecfdf5;
    color: #059669;
  }
}

/* ── Soft colour helpers ──────────────────────────────── */
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
.bg-green-icon {
  background: rgba(34, 197, 94, 0.12);
}
.bg-green-soft {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

/* ── Borders ──────────────────────────────────────────── */
.border-subtle {
  border: 1px solid var(--wo-border, #eaecef);
}
.border-top-subtle {
  border-top: 1px solid var(--wo-border, #f1f3f7);
}

/* ── FAQ expansion items ──────────────────────────────── */
.faq-expansion-item {
  border-bottom: 1px solid var(--wo-border, #f1f3f7);
  &:last-child {
    border-bottom: none;
  }
}

/* ── Dark mode ────────────────────────────────────────── */
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
  .bg-teal-soft {
    background: rgba(14, 147, 132, 0.18);
  }
  .bg-orange-soft {
    background: rgba(247, 144, 9, 0.18);
  }
  .bg-blue-soft {
    background: rgba(46, 144, 250, 0.18);
  }
  .bg-green-icon {
    background: rgba(34, 197, 94, 0.18);
  }

  .bg-green-soft {
    background: #064e3b;
    border-color: #059669;
    color: #ecfdf5;
  }
}
</style>
