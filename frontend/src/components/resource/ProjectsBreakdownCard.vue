<template>
  <q-card flat bordered class="rounded-borders overflow-hidden column">
    <q-card-section class="q-pa-md row items-center justify-between no-wrap">
      <div style="min-width: 0" class="q-pr-sm col">
        <div
          class="text-subtitle1 text-weight-bold ellipsis"
          :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
        >
          Tasks Across Projects
        </div>
        <div
          class="text-caption ellipsis"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
        >
          Your assigned work grouped by project
        </div>
      </div>
      <q-badge
        :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
        :text-color="$q.dark.isActive ? 'grey-3' : 'dark'"
        :label="`${projects.length} Projects`"
        class="text-weight-bold q-px-sm q-py-xs col-auto"
      />
    </q-card-section>

    <q-separator />

    <div v-if="!projects.length" class="q-pa-xl text-center text-grey-6 col column items-center justify-center">
      <q-icon name="folder_open" size="40px" color="grey-5" />
      <div class="text-body2 q-mt-sm">No active projects assigned.</div>
    </div>

    <q-list v-else separator class="col column justify-start">
      <q-item
        v-for="(row, idx) in projects"
        :key="row.project"
        clickable
        v-ripple
        class="q-py-md q-px-md cursor-pointer project-breakdown-item"
        @click="goToProjectTasks(row.project)"
      >
        <q-item-section avatar style="min-width: 32px; max-width: 34px; padding-right: 8px">
          <q-avatar
            size="32px"
            rounded
            :color="getProjectTheme(idx).bg"
            :text-color="getProjectTheme(idx).color"
            :icon="getProjectIcon(idx)"
          />
        </q-item-section>

        <q-item-section style="min-width: 0; flex: 1 1 auto; overflow: hidden">
          <q-item-label
            class="text-weight-bold ellipsis"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
            :title="row.project"
            style="font-size: 13px"
          >
            {{ row.project }}
          </q-item-label>
          <q-item-label caption class="text-grey-6 ellipsis" style="font-size: 11px; margin-top: 2px">
            {{ row.tasks }} tasks · Due {{ row.deadline }}
          </q-item-label>
        </q-item-section>

        <!-- Progress Bar & % (Desktop/Tablet only) -->
        <q-item-section
          side
          class="gt-xs"
          style="width: 140px; min-width: 130px; padding-left: 12px; padding-right: 6px"
        >
          <div class="row items-center no-wrap gap-sm full-width">
            <div class="col">
              <q-linear-progress
                :value="row.progress / 100"
                size="6px"
                rounded
                :color="getProgressColor(row.status)"
                :track-color="$q.dark.isActive ? 'grey-8' : 'grey-3'"
              />
            </div>
            <span
              class="text-caption text-weight-bold col-auto"
              style="min-width: 32px; text-align: right"
              :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-8'"
            >
              {{ row.progress }}%
            </span>
          </div>
        </q-item-section>

        <!-- Status Badge -->
        <q-item-section side style="padding-left: 6px; flex-shrink: 0">
          <q-chip
            dense
            square
            :color="getStatusChipColor(row.status).bg"
            :text-color="getStatusChipColor(row.status).text"
            class="text-caption text-weight-bold"
            style="font-size: 10.5px; margin: 0"
          >
            {{ row.status }}
          </q-chip>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

export interface ProjectBreakdownRow {
  project: string;
  tasks: number;
  status: 'On Track' | 'At Risk' | 'Delayed';
  progress: number;
  deadline: string;
}

defineProps<{ projects: ProjectBreakdownRow[] }>();

const $q = useQuasar();
const router = useRouter();

function goToProjectTasks(projectName: string) {
  void router.push({
    path: '/app/resource-dashboard/task-details',
    query: { project: projectName },
  });
}

function getStatusChipColor(status: ProjectBreakdownRow['status']) {
  const isDark = $q.dark.isActive;
  if (status === 'Delayed') {
    return {
      bg: isDark ? 'red-10' : 'red-1',
      text: isDark ? 'red-2' : 'negative',
    };
  }
  if (status === 'At Risk') {
    return {
      bg: isDark ? 'orange-10' : 'orange-1',
      text: isDark ? 'orange-2' : 'deep-orange',
    };
  }
  return {
    bg: isDark ? 'green-10' : 'green-1',
    text: isDark ? 'green-2' : 'positive',
  };
}

function getProgressColor(status: ProjectBreakdownRow['status']): string {
  if (status === 'Delayed') return 'negative';
  if (status === 'At Risk') return 'warning';
  return 'primary';
}

function getProjectTheme(idx: number): { bg: string; color: string } {
  const isDark = $q.dark.isActive;
  const themes = isDark
    ? [
        { bg: 'purple-10', color: 'purple-2' },
        { bg: 'blue-10', color: 'blue-2' },
        { bg: 'orange-10', color: 'orange-2' },
        { bg: 'teal-10', color: 'teal-2' },
      ]
    : [
        { bg: 'purple-1', color: 'primary' },
        { bg: 'blue-1', color: 'blue-8' },
        { bg: 'orange-1', color: 'orange-9' },
        { bg: 'teal-1', color: 'teal-8' },
      ];
  return (
    themes[idx % themes.length] ??
    (isDark ? { bg: 'purple-10', color: 'purple-2' } : { bg: 'purple-1', color: 'primary' })
  );
}

function getProjectIcon(idx: number): string {
  const icons = ['folder', 'layers', 'widgets', 'auto_awesome'];
  return icons[idx % icons.length] ?? 'folder';
}
</script>

<style scoped lang="scss">
@media (max-width: 600px) {
  .q-item {
    padding: 10px 10px;
  }
}
</style>
