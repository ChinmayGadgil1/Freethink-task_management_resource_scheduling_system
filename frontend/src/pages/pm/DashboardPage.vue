<template>
  <q-page class="pm-dashboard">
    <!-- 01 OVERVIEW -->
    <DashboardSection
      number="01"
      label="OVERVIEW"
      title="Everything at a glance"
      description="Quick snapshot of all ongoing work and progress."
      action-label="See full overview"
    >
      <div class="stats-strip">
        <StatCard
          title="Total Projects"
          :value="totalProjects"
          subtitle="↑ 20% vs last week"
          icon="folder"
          color="#8B6FD8"
          icon-bg="#F4F0FD"
        />
        <StatCard
          title="Active Tasks"
          :value="activeTasks"
          subtitle="↑ 12% vs last week"
          icon="task_alt"
          color="#1ABC9C"
          icon-bg="#E6F7F5"
        />
        <StatCard
          title="Resources"
          value="21"
          subtitle="↑ 8% vs last week"
          icon="groups"
          color="#F5841F"
          icon-bg="#FFF4EB"
        />
        <StatCard
          title="Tasks Completed"
          :value="completedTasks"
          subtitle="↑ 18% vs last week"
          icon="check_circle"
          color="#27AE60"
          icon-bg="#EAF7F0"
        />
        <StatCard
          title="Overdue Tasks"
          :value="overdueTasks"
          subtitle="↓ 5% vs last week"
          icon="schedule"
          color="#E15263"
          icon-bg="#FDEEF0"
          :negative="true"
        />
      </div>

      <div class="strip-scroll-container">
        <div class="strip-scroll-thumb" />
      </div>
    </DashboardSection>

    <!-- 02 PROJECTS PANORAMA -->
    <DashboardSection
      number="02"
      label="PROJECTS PANORAMA"
      title="All your projects, beautifully visualized"
      description="Track progress, health and deadlines across all projects."
      action-label="See all projects"
    >
      <ProjectSummary :projects="projects" />
    </DashboardSection>

    <!-- 03 MY WORK CENTER -->
    <DashboardSection
      number="03"
      label="MY WORK CENTER"
      title="Your tasks, prioritized"
      description="Focus on what matters most today."
      action-label="View my tasks"
    >
      <TaskSummary />
    </DashboardSection>

    <!-- 04 RESOURCE WORKLOAD -->
    <DashboardSection
      number="04"
      label="RESOURCE WORKLOAD"
      title="Know your team capacity"
      description="Balance workloads and avoid overbooking."
      action-label="View all resources"
    >
      <WorkloadSummary />
    </DashboardSection>

    <!-- 05 TIMELINE & SCHEDULE -->
    <DashboardSection
      number="05"
      label="TIMELINE & SCHEDULE"
      title="What's happening next"
      description="Upcoming milestones and important dates."
      action-label="View full timeline"
    >
      <div class="timeline-shell">
        <div class="timeline-header-row">
          <div class="timeline-month-badge">May 2025</div>
          <div class="timeline-dates-grid">
            <div
              v-for="day in days"
              :key="day.date"
              class="timeline-date-cell"
              :class="{ today: day.today }"
            >
              <span class="day-number">{{ day.date }}</span>
              <span class="day-name">{{ day.weekday }}</span>
            </div>
          </div>
        </div>

        <div class="timeline-body">
          <!-- Website Redesign Row -->
          <div class="timeline-project-row">
            <div class="project-label">Website Redesign</div>
            <div class="project-track">
              <div class="timeline-grid-lines">
                <div v-for="i in 17" :key="i" class="grid-line" />
              </div>
              <div class="timeline-bar bar-purple ui-phase">UI Design Phase</div>
              <div class="milestone-badge milestone-purple design-review">
                <q-icon name="bookmark" size="11px" />
                Design Review
              </div>
              <div class="timeline-bar bar-purple dev-phase">Development Phase</div>
              <div class="timeline-bar bar-purple-light test-phase">Testing</div>
            </div>
          </div>

          <!-- Mobile App Development Row -->
          <div class="timeline-project-row">
            <div class="project-label">Mobile App Development</div>
            <div class="project-track">
              <div class="timeline-grid-lines">
                <div v-for="i in 17" :key="i" class="grid-line" />
              </div>
              <div class="timeline-bar bar-teal auth-module">Authentication Module</div>
              <div class="timeline-bar bar-teal payment-module">Payment Integration</div>
              <div class="milestone-badge milestone-teal beta-release">
                <q-icon name="bookmark" size="11px" />
                Beta Release
              </div>
            </div>
          </div>

          <!-- Marketing Campaign Row -->
          <div class="timeline-project-row">
            <div class="project-label">Marketing Campaign</div>
            <div class="project-track">
              <div class="timeline-grid-lines">
                <div v-for="i in 17" :key="i" class="grid-line" />
              </div>
              <div class="timeline-bar bar-orange content-phase">Content Creation</div>
              <div class="milestone-badge milestone-orange launch-milestone">
                <q-icon name="star" size="11px" />
                Launch Campaign
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardSection>

    <!-- FLOATING BOTTOM QUICK ACTIONS TOOLBAR -->
    <div class="quick-actions-bar">
      <div class="quick-actions-title">
        <q-icon name="bolt" color="primary" size="18px" />
        <span>Quick Actions</span>
      </div>

      <div class="quick-actions-buttons">
        <q-btn flat no-caps class="action-btn action-purple">
          <q-icon name="add" size="14px" class="q-mr-xs" />
          <span>New Project</span>
        </q-btn>
        <q-btn flat no-caps class="action-btn action-teal">
          <q-icon name="add" size="14px" class="q-mr-xs" />
          <span>Add Task</span>
        </q-btn>
        <q-btn flat no-caps class="action-btn action-orange">
          <q-icon name="add" size="14px" class="q-mr-xs" />
          <span>Allocate Resource</span>
        </q-btn>
        <q-btn flat no-caps class="action-btn action-blue">
          <q-icon name="edit_note" size="15px" class="q-mr-xs" />
          <span>Log Progress</span>
        </q-btn>
        <q-btn flat no-caps class="action-btn action-yellow">
          <q-icon name="description" size="14px" class="q-mr-xs" />
          <span>Generate Report</span>
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import DashboardSection from '@/components/dashboard/DashboardSection.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import ProjectSummary from '@/components/dashboard/ProjectSummary.vue';
import TaskSummary from '@/components/dashboard/TaskSummary.vue';
import WorkloadSummary from '@/components/dashboard/WorkloadSummary.vue';
import { onMounted, ref, computed } from 'vue';

import { getProjectsApi, getTasksApi } from '@/services/api';
import type { Project, Task } from '@/services/api';
const projects = ref<Project[]>([]);

const tasks = ref<Task[]>([]);

const projectsLoading = ref(false);
const tasksLoading = ref(false);
async function loadProjects() {
  projectsLoading.value = true;

  try {
    projects.value = await getProjectsApi();
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    projectsLoading.value = false;
  }
}

async function loadTasks() {
  tasksLoading.value = true;

  try {
    tasks.value = await getTasksApi();
  } catch (error) {
    console.error('Failed to load tasks:', error);
  } finally {
    tasksLoading.value = false;
  }
}
const totalProjects = computed(() => projects.value.length);

const activeTasks = computed(
  () =>
    tasks.value.filter((task) => task.status === 'PENDING' || task.status === 'IN_PROGRESS').length,
);

const completedTasks = computed(
  () => tasks.value.filter((task) => task.status === 'COMPLETED').length,
);

const overdueTasks = computed(() => {
  const today = new Date();

  return tasks.value.filter((task) => {
    if (!task.deadline || task.status === 'COMPLETED') {
      return false;
    }

    return new Date(task.deadline) < today;
  }).length;
});

onMounted(() => {
  void loadProjects();
  void loadTasks();
});
const days = [
  { date: '18', weekday: 'Sun' },
  { date: '19', weekday: 'Mon' },
  { date: '20', weekday: 'Tue' },
  { date: '21', weekday: 'Wed', today: true },
  { date: '22', weekday: 'Thu' },
  { date: '23', weekday: 'Fri' },
  { date: '24', weekday: 'Sat' },
  { date: '25', weekday: 'Sun' },
  { date: '26', weekday: 'Mon' },
  { date: '27', weekday: 'Tue' },
  { date: '28', weekday: 'Wed' },
  { date: '29', weekday: 'Thu' },
  { date: '30', weekday: 'Fri' },
  { date: '31', weekday: 'Sat' },
  { date: '1', weekday: 'Sun' },
  { date: '2', weekday: 'Mon' },
  { date: '3', weekday: 'Tue' },
];
</script>

<style scoped lang="scss">
.pm-dashboard {
  width: 100%;
  max-width: 1540px;
  margin: 0 auto;
  padding: 16px 24px 60px;
}

.stats-strip {
  display: flex;
  gap: 14px;
}

.strip-scroll-container {
  height: 4px;
  margin-top: 12px;
  border-radius: 4px;
  background: var(--wo-border-subtle, #f0f2f5);
}

.strip-scroll-thumb {
  width: 60%;
  height: 100%;
  margin-left: 15%;
  border-radius: 4px;
  background: var(--wo-border, #d0d5dd);
}

/* Timeline Styling */
.timeline-shell {
  position: relative;
  min-width: 0;
}

.timeline-header-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: center;
  padding-bottom: 12px;
}

.timeline-month-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 4px 10px;
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 6px;
  background: var(--wo-bg-card, #ffffff);
  color: var(--wo-text-main, #1d2433);
  font-size: 11px;
  font-weight: 700;
}

.timeline-dates-grid {
  display: grid;
  grid-template-columns: repeat(17, minmax(0, 1fr));
  gap: 2px;
}

.timeline-date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--wo-text-subtle, #98a2b3);
  font-size: 11px;
  font-weight: 500;
}

.day-number {
  line-height: 1.2;
}

.day-name {
  font-size: 9px;
  margin-top: 2px;
}

.timeline-date-cell.today .day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--wo-primary, #8b6fd8);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(139, 111, 216, 0.35);
}

.timeline-date-cell.today .day-name {
  color: var(--wo-primary, #8b6fd8);
  font-weight: 700;
}

.timeline-body {
  border-top: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.timeline-project-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.timeline-project-row:last-child {
  border-bottom: none;
}

.project-label {
  color: var(--wo-text-main, #344054);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

.project-track {
  position: relative;
  height: 38px;
  display: flex;
  align-items: center;
}

.timeline-grid-lines {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(17, minmax(0, 1fr));
  pointer-events: none;
}

.grid-line {
  border-right: 1px dashed var(--wo-border-subtle, #f2f4f7);
}

.grid-line:last-child {
  border-right: none;
}

.timeline-bar {
  position: absolute;
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  z-index: 2;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}

.bar-purple {
  background: rgba(139, 111, 216, 0.15);
  color: #8b6fd8;
  border: 1px solid rgba(139, 111, 216, 0.3);
}

.bar-purple-light {
  background: rgba(155, 130, 227, 0.15);
  color: #9b82e3;
  border: 1px solid rgba(155, 130, 227, 0.3);
}

.bar-teal {
  background: rgba(26, 188, 156, 0.15);
  color: #1abc9c;
  border: 1px solid rgba(26, 188, 156, 0.3);
}

.bar-orange {
  background: rgba(245, 132, 31, 0.15);
  color: #f5841f;
  border: 1px solid rgba(245, 132, 31, 0.3);
}

.ui-phase {
  left: 17.6%;
  width: 29.4%;
}

.dev-phase {
  left: 52.9%;
  width: 29.4%;
}

.test-phase {
  left: 88.2%;
  width: 11.7%;
}

.auth-module {
  left: 5.8%;
  width: 29.4%;
}

.payment-module {
  left: 41.1%;
  width: 23.5%;
}

.content-phase {
  left: 17.6%;
  width: 41.1%;
}

.milestone-badge {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
  z-index: 3;
}

.milestone-purple {
  color: #8b6fd8;
}

.milestone-teal {
  color: #1abc9c;
}

.milestone-orange {
  color: #f5841f;
}

.design-review {
  left: 48%;
}

.beta-release {
  left: 66%;
}

.launch-milestone {
  left: 60%;
}

/* Quick Actions Bar */
.quick-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 10px 16px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  border-radius: 12px;
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  margin-top: 4px;
}

.quick-actions-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--wo-text-main, #1d2433);
  font-size: 12px;
  font-weight: 700;
  padding-right: 12px;
  border-right: 1px solid var(--wo-border-subtle, #f0f2f5);
  white-space: nowrap;
}

.quick-actions-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.action-purple {
  color: #8b6fd8;
  background: rgba(139, 111, 216, 0.12);
  border-color: rgba(139, 111, 216, 0.25);
}
.action-purple:hover {
  background: rgba(139, 111, 216, 0.22);
}

.action-teal {
  color: #1abc9c;
  background: rgba(26, 188, 156, 0.12);
  border-color: rgba(26, 188, 156, 0.25);
}
.action-teal:hover {
  background: rgba(26, 188, 156, 0.22);
}

.action-orange {
  color: #f5841f;
  background: rgba(245, 132, 31, 0.12);
  border-color: rgba(245, 132, 31, 0.25);
}
.action-orange:hover {
  background: rgba(245, 132, 31, 0.22);
}

.action-blue {
  color: #2e90fa;
  background: rgba(46, 144, 250, 0.12);
  border-color: rgba(46, 144, 250, 0.25);
}
.action-blue:hover {
  background: rgba(46, 144, 250, 0.22);
}

.action-yellow {
  color: #d97706;
  background: rgba(217, 119, 6, 0.12);
  border-color: rgba(217, 119, 6, 0.25);
}
.action-yellow:hover {
  background: rgba(217, 119, 6, 0.22);
}

@media (max-width: 1100px) {
  .stats-strip {
    overflow-x: auto;
  }

  .timeline-shell {
    overflow-x: auto;
  }

  .timeline-header-row,
  .timeline-project-row {
    min-width: 900px;
  }
}
</style>
