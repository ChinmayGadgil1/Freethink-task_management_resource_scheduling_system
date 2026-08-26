<template>
  <div class="landing-projects-card">
    <div class="card-header row items-center justify-between no-wrap q-pa-md">
      <div>
        <div class="card-title">Tasks Across Projects</div>
        <div class="card-subtitle">Your assigned work grouped by project</div>
      </div>
      <span class="projects-count-badge">4 Projects</span>
    </div>

    <div class="card-divider" />

    <div class="projects-list-body">
      <div v-for="(row, idx) in showcaseProjects" :key="row.project" class="project-row row items-center gap-md">
        <div class="project-info-col row items-center gap-sm">
          <div class="project-icon-box flex flex-center no-shrink" :class="getProjectThemeClass(idx)">
            <q-icon :name="getProjectIcon(idx)" size="18px" />
          </div>
          <div class="project-text-wrap">
            <div class="project-name ellipsis">{{ row.project }}</div>
            <div class="project-meta-caption ellipsis">
              {{ row.tasks }} assigned tasks · Due {{ row.deadline }}
            </div>
          </div>
        </div>

        <div class="project-progress-col col">
          <div class="progress-track">
            <div
              class="progress-fill"
              :class="getProgressFillClass(row.status)"
              :style="{ width: `${row.progress}%` }"
            />
          </div>
        </div>

        <div class="project-side-col row items-center gap-xs">
          <span class="status-pill" :class="getStatusClass(row.status)">{{ row.status }}</span>
          <span class="progress-pct-label">{{ row.progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ProjectRow {
  project: string;
  tasks: number;
  status: 'On Track' | 'At Risk' | 'Delayed';
  progress: number;
  deadline: string;
}

const showcaseProjects: ProjectRow[] = [
  {
    project: 'Website Revamp & CMS',
    tasks: 12,
    status: 'On Track',
    progress: 85,
    deadline: 'In 4 days',
  },
  {
    project: 'Mobile Application v2.0',
    tasks: 18,
    status: 'On Track',
    progress: 60,
    deadline: 'In 12 days',
  },
  {
    project: 'Resource Allocation Engine',
    tasks: 9,
    status: 'At Risk',
    progress: 42,
    deadline: 'Tomorrow',
  },
  {
    project: 'Enterprise Reporting Portal',
    tasks: 14,
    status: 'Delayed',
    progress: 28,
    deadline: 'Overdue by 2d',
  },
];

function getStatusClass(status: ProjectRow['status']): string {
  if (status === 'On Track') return 'status-ok';
  if (status === 'At Risk') return 'status-warn';
  return 'status-bad';
}

function getProgressFillClass(status: ProjectRow['status']): string {
  if (status === 'On Track') return 'fill-ok';
  if (status === 'At Risk') return 'fill-warn';
  return 'fill-bad';
}

function getProjectThemeClass(idx: number): string {
  const classes = ['theme-purple', 'theme-blue', 'theme-orange', 'theme-teal'];
  return classes[idx % classes.length] ?? 'theme-purple';
}

function getProjectIcon(idx: number): string {
  const icons = ['folder', 'layers', 'widgets', 'auto_awesome'];
  return icons[idx % icons.length] ?? 'folder';
}
</script>

<style scoped lang="scss">
.landing-projects-card {
  background: #ffffff;
  border: 1px solid #eaecef;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
  overflow: hidden;
}

.card-header {
  background: #ffffff;
}

.card-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.card-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.projects-count-badge {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 9999px;
}

.card-divider {
  height: 1px;
  background: #f1f3f7;
}

.projects-list-body {
  padding: 8px 16px 12px 16px;
  background: #ffffff;
}

.project-row {
  padding: 11px 0;
  border-bottom: 1px solid #f8fafc;

  &:last-child {
    border-bottom: none;
  }
}

.project-info-col {
  width: 230px;
  flex-shrink: 0;
}

.project-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;

  &.theme-purple {
    background: #f3e8ff;
    color: #8b6fd8;
  }
  &.theme-blue {
    background: #e0f2fe;
    color: #0284c7;
  }
  &.theme-orange {
    background: #ffedd5;
    color: #ea580c;
  }
  &.theme-teal {
    background: #ccfbf1;
    color: #0d9488;
  }
}

.project-text-wrap {
  min-width: 0;
}

.project-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.project-meta-caption {
  font-size: 11px;
  color: #64748b;
  margin-top: 1px;
}

.project-progress-col {
  min-width: 80px;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;

  &.fill-ok {
    background: #8b6fd8;
  }
  &.fill-warn {
    background: #f79009;
  }
  &.fill-bad {
    background: #f04438;
  }
}

.project-side-col {
  flex-shrink: 0;
}

.status-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;

  &.status-ok {
    background: #dcfce7;
    color: #15803d;
  }
  &.status-warn {
    background: #fef3c7;
    color: #b45309;
  }
  &.status-bad {
    background: #fee2e2;
    color: #b91c1c;
  }
}

.progress-pct-label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  min-width: 32px;
  text-align: right;
}

body.body--dark {
  .landing-projects-card {
    background: #181d28;
    border-color: #283042;
  }

  .card-header {
    background: #181d28;
  }

  .card-title {
    color: #f3f4f6;
  }

  .card-subtitle {
    color: #94a3b8;
  }

  .projects-count-badge {
    background: #202636;
    color: #c4b5fd;
  }

  .card-divider {
    background: #283042;
  }

  .projects-list-body {
    background: #181d28;
  }

  .project-row {
    border-bottom-color: #283042;

    &:hover {
      background: #202636;
    }
  }

  .project-icon-box {
    &.theme-purple {
      background: rgba(139, 111, 216, 0.18);
      color: #a78bfa;
    }
    &.theme-blue {
      background: rgba(2, 132, 199, 0.18);
      color: #38bdf8;
    }
    &.theme-orange {
      background: rgba(234, 88, 12, 0.18);
      color: #fb923c;
    }
    &.theme-teal {
      background: rgba(13, 148, 136, 0.18);
      color: #2dd4bf;
    }
  }

  .project-name {
    color: #f3f4f6;
  }

  .project-meta-caption {
    color: #94a3b8;
  }

  .progress-track {
    background: #283042;
  }

  .progress-pct-label {
    color: #cbd5e1;
  }

  .status-pill {
    &.status-ok {
      background: rgba(18, 183, 106, 0.2);
      color: #34d399;
    }
    &.status-warn {
      background: rgba(247, 144, 9, 0.2);
      color: #fbbf24;
    }
    &.status-bad {
      background: rgba(240, 68, 56, 0.2);
      color: #f87171;
    }
  }
}
</style>
