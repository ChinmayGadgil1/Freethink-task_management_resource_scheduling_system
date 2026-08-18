<template>
  <q-card flat bordered class="dashboard-card">
    <q-card-section>
      <div class="text-subtitle1 text-weight-bold">Tasks Across Projects</div>
      <div class="text-caption text-grey-6">Your assigned work grouped by project</div>
    </q-card-section>
    <q-separator />

    <div v-for="row in projects" :key="row.project" class="project-row">
      <div class="project-main">
        <div class="project-name">{{ row.project }}</div>
        <div class="text-caption text-grey-6">
          {{ row.tasks }} assigned tasks · Due {{ row.deadline }}
        </div>
      </div>

      <q-linear-progress
        :value="row.progress / 100"
        size="7px"
        rounded
        class="project-progress"
        color="primary"
        track-color="grey-3"
      />

      <div class="project-side">
        <span class="status-pill" :class="statusClass(row.status)">{{ row.status }}</span>
        <span class="text-caption text-weight-medium">{{ row.progress }}%</span>
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
</script>

<style scoped lang="scss">
.project-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(140px, 220px) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-top: 1px solid var(--wo-border-subtle, #f0f2f5);
}
.project-row:first-of-type {
  border-top: none;
}

.project-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--wo-text-main, #1d2433);
}
.project-progress {
  min-width: 0;
}

.project-side {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}

.status-pill {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
.status-ok {
  background: #eaf7f0;
  color: #27ae60;
}
.status-warn {
  background: #fff4e8;
  color: #e89532;
}
.status-bad {
  background: #fdeef0;
  color: #e15263;
}

@media (max-width: 700px) {
  .project-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
  .project-side {
    justify-content: flex-start;
  }
}
</style>
