<template>
  <q-card flat bordered class="rounded-borders overflow-hidden">
    <q-card-section class="q-pa-md">
      <div class="row items-center justify-between no-wrap q-mb-md">
        <div style="min-width: 0" class="q-pr-sm">
          <div
            class="text-subtitle1 text-weight-bold ellipsis"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Task Overview
          </div>
          <div
            class="text-caption ellipsis"
            :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
          >
            Status distribution of your assigned tasks
          </div>
        </div>
        <q-badge
          :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
          :text-color="$q.dark.isActive ? 'grey-3' : 'dark'"
          :label="`${totalTasks} Total`"
          class="text-weight-bold q-px-sm q-py-xs col-auto"
        />
      </div>

      <!-- Segmented distribution bar -->
      <div
        class="row no-wrap overflow-hidden rounded-borders q-mb-md"
        :style="{
          height: '10px',
          background: $q.dark.isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
        }"
      >
        <div
          v-for="item in items"
          :key="item.label"
          class="cursor-pointer"
          :style="{
            width: `${totalTasks ? (item.value / totalTasks) * 100 : 0}%`,
            background: item.color,
            transition: 'width 0.3s ease',
          }"
          @click="goToStatus(item.label)"
        />
      </div>

      <!-- Status Legend List -->
      <div class="column q-gutter-y-xs">
        <div
          v-for="item in items"
          :key="item.label"
          class="row items-center justify-between q-py-xs q-px-sm rounded-borders cursor-pointer transition-bg"
          :class="$q.dark.isActive ? 'hover-dark' : 'hover-light'"
          @click="goToStatus(item.label)"
        >
          <div class="row items-center no-wrap gap-sm">
            <span
              style="width: 8px; height: 8px; border-radius: 50%"
              :style="{ background: item.color }"
            />
            <span
              class="text-caption text-weight-medium"
              :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-9'"
            >
              {{ item.label }}
            </span>
          </div>
          <div class="row items-center no-wrap gap-xs">
            <span
              class="text-caption text-weight-bold"
              :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
            >
              {{ item.value }}
            </span>
            <span class="text-caption text-grey-6">
              ({{ totalTasks ? Math.round((item.value / totalTasks) * 100) : 0 }}%)
            </span>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

export interface TaskStatusItem {
  label: string;
  value: number;
  color: string;
}

const props = defineProps<{ items: TaskStatusItem[] }>();
const router = useRouter();
const $q = useQuasar();

const totalTasks = computed(() => props.items.reduce((sum, item) => sum + item.value, 0));

function goToStatus(label: string) {
  let statusKey = 'SCHEDULED';
  if (label.toLowerCase().includes('progress')) {
    statusKey = 'IN_PROGRESS';
  } else if (label.toLowerCase().includes('completed') || label.toLowerCase().includes('done')) {
    statusKey = 'COMPLETED';
  } else if (label.toLowerCase().includes('scheduled')) {
    statusKey = 'SCHEDULED';
  }
  void router.push({
    path: '/app/resource-dashboard/task-details',
    query: { status: statusKey },
  });
}
</script>

<style scoped>
.transition-bg {
  transition: background-color 0.15s ease;
}
.hover-light:hover {
  background-color: #f8fafc;
}
.hover-dark:hover {
  background-color: rgba(255, 255, 255, 0.04);
}
</style>
