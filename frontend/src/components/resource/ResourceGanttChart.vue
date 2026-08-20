<template>
  <GanttChart
    :tasks="tasks"
    title="My Gantt"
    subtitle="Your assigned schedule will appear here"
    empty-title="No scheduled tasks"
    empty-subtitle="Tasks assigned to you will appear on the timeline once they have scheduling information."
  />
</template>

<script setup lang="ts">
import GanttChart, { type GanttTask } from '@/components/gantt/GanttChart.vue';

export type { GanttTask };

defineProps<{
  tasks: GanttTask[];
}>();
</script>

