<template>
  <q-card flat bordered class="dashboard-card">
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle1 text-weight-bold">Upcoming Tasks</div>
      <q-btn flat no-caps dense color="primary" label="View all" @click="$emit('view-all')" />
    </q-card-section>
    <q-separator />

    <div v-if="tasks.length === 0" class="empty-block">
      <q-icon name="event_available" size="28px" color="grey-5" />
      <div class="text-caption text-grey-6 q-mt-sm">Nothing coming up — you're all caught up.</div>
    </div>

    <div v-for="task in tasks" :key="task.id" class="task-row">
      <div class="task-info">
        <div class="task-title">{{ task.name }}</div>
        <div class="task-project">{{ task.project }}</div>
        <q-linear-progress
          :value="task.progress / 100" size="5px" rounded class="q-mt-sm"
          color="primary" track-color="grey-3" style="max-width: 200px"
        />
      </div>
      <div class="task-side">
        <span class="priority-pill" :class="`priority-${task.priority.toLowerCase()}`">{{ task.priority }}</span>
        <div class="task-due">{{ task.due }}</div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
export interface UpcomingTask {
  id: number
  name: string
  project: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  progress: number
  due: string
}

defineProps<{ tasks: UpcomingTask[] }>()
defineEmits<{ (e: 'view-all'): void }>()
</script>

<style scoped lang="scss">
.empty-block {
  padding: 32px 16px;
  text-align: center;
}

.task-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid var(--wo-border-subtle, #f0f2f5);
}
.task-row:first-of-type { border-top: none; }

.task-info { min-width: 0; }
.task-title { font-size: 13px; font-weight: 600; color: var(--wo-text-main, #1d2433); }
.task-project { margin-top: 2px; font-size: 11px; color: var(--wo-text-subtle, #98a2b3); }

.task-side { text-align: right; flex-shrink: 0; }
.task-due { margin-top: 6px; font-size: 11px; color: var(--wo-text-muted, #667085); }

.priority-pill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}
.priority-low { background: #eaf7f0; color: #27ae60; }
.priority-medium { background: #fff4e8; color: #e89532; }
.priority-high { background: #fff0eb; color: #e56b45; }
.priority-critical { background: #fdeef0; color: #e15263; }
</style>
