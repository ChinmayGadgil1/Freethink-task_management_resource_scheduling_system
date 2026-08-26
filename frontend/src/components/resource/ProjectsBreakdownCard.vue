<template>
  <q-card flat bordered class="projects-breakdown-card">
    <q-card-section class="q-pa-lg">
      <div class="row items-center justify-between">
        <div>
          <div class="card-section-title">Tasks Across Projects</div>
          <div class="card-section-subtitle text-caption text-grey-6 q-mt-xs">
            Your assigned work grouped by project
          </div>
        </div>
        <q-badge color="grey-3" text-color="dark" :label="`${projects.length} Projects`" class="projects-badge" />
      </div>
    </q-card-section>
    <q-separator />

    <div v-if="!projects.length" class="empty-projects-state q-pa-lg text-center">
      <q-icon name="folder_open" size="36px" color="grey-5" />
      <div class="text-body2 text-grey-6 q-mt-sm">No active projects assigned.</div>
    </div>

    <div v-else class="projects-list-body">
      <div v-for="(row, idx) in projects" :key="row.project" class="project-row">
        <div class="project-info-col row items-center gap-sm">
          <div class="project-icon-box flex flex-center no-shrink" :class="getProjectThemeClass(idx)">
            <q-icon :name="getProjectIcon(idx)" size="18px" />
          </div>
          <div class="project-text-wrap">
            <div class="project-name ellipsis">{{ row.project }}</div>
            <div class="project-meta-caption">
              {{ row.tasks }} assigned tasks · Due {{ row.deadline }}
            </div>
          </div>
        </div>

        <div class="project-progress-col">
          <q-linear-progress
            :value="row.progress / 100"
            size="7px"
            rounded
            class="project-progress-bar"
            :color="getProgressColor(row.status)"
            track-color="grey-3"
          />
        </div>

        <div class="project-side-col row items-center justify-end gap-xs">
          <span class="status-pill" :class="statusClass(row.status)">{{ row.status }}</span>
          <span class="progress-pct-label">{{ row.progress }}%</span>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
export interface ProjectBreakdownRow {
  project: string;
  tasks: number;
  status: 'On Track' | 'At Risk' | 'Delayed';
  progress: number;
  deadline: string;
}

defineProps<{ projects: ProjectBreakdownRow[] }>();

function statusClass(status: ProjectBreakdownRow['status']) {
  return { 'On Track': 'status-ok', 'At Risk': 'status-warn', Delayed: 'status-bad' }[status];
}

function getProgressColor(status: ProjectBreakdownRow['status']): string {
  if (status === 'Delayed') return 'negative';
  if (status === 'At Risk') return 'warning';
  return 'primary';
}

function getProjectThemeClass(idx: number): string {
  const classes = ['theme-purple', 'theme-blue', 'theme-orange', 'theme-mint'];
  return classes[idx % classes.length] ?? 'theme-purple';
}

function getProjectIcon(idx: number): string {
  const icons = ['folder', 'layers', 'widgets', 'auto_awesome'];
  return icons[idx % icons.length] ?? 'folder';
}
</script>

<style scoped lang="scss">
.projects-breakdown-card {
  border-radius: 16px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #eaecef);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  overflow: hidden;
}

.card-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
  letter-spacing: -0.01em;
}

.projects-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
  background: var(--wo-bg-tag, #f1f5f9) !important;
  color: var(--wo-text-main, #1e293b) !important;
}

.projects-list-body {
  display: flex;
  flex-direction: column;
}

.project-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(130px, 1.5fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-top: 1px solid var(--wo-border-subtle, #f0f2f5);
  transition: background 0.15s ease;

  &:hover {
    background: var(--wo-bg-page, #f8fafc);
  }

  &:first-child {
    border-top: none;
  }
}

.project-info-col {
  min-width: 0;
}

.project-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;

  &.theme-purple {
    background: rgba(139, 111, 216, 0.14);
    color: #8b6fd8;
  }
  &.theme-blue {
    background: rgba(59, 130, 246, 0.14);
    color: #3b82f6;
  }
  &.theme-orange {
    background: rgba(245, 158, 11, 0.14);
    color: #f59e0b;
  }
  &.theme-mint {
    background: rgba(16, 185, 129, 0.14);
    color: #10b981;
  }
}

.project-text-wrap {
  min-width: 0;
}

.project-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
}

.project-meta-caption {
  font-size: 11px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 2px;
}

.project-progress-col {
  min-width: 0;
}

.project-progress-bar {
  border-radius: 4px;
}

.progress-pct-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
  min-width: 32px;
  text-align: right;
}

.status-pill {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;

  &.status-ok {
    background: #eaf7f0;
    color: #27ae60;
  }
  &.status-warn {
    background: #fff4e8;
    color: #e89532;
  }
  &.status-bad {
    background: #fdeef0;
    color: #e15263;
  }
}

@media (max-width: 768px) {
  .project-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
  .project-side-col {
    justify-content: flex-start;
  }
}
</style>
