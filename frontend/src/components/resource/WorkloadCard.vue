<template>
  <q-card flat bordered class="rounded-borders overflow-hidden">
    <q-card-section class="q-pa-md">
      <div class="row items-start justify-between">
        <div>
          <div
            class="text-subtitle1 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Effort & Workload
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Expected effort across your active tasks
          </div>
        </div>
        <q-chip
          dense
          square
          :color="consumedPct > 100 ? ($q.dark.isActive ? 'red-10' : 'red-1') : ($q.dark.isActive ? 'purple-10' : 'deep-purple-1')"
          :text-color="consumedPct > 100 ? ($q.dark.isActive ? 'red-2' : 'negative') : ($q.dark.isActive ? 'purple-2' : 'primary')"
          class="text-caption text-weight-bold"
        >
          {{ consumedPct > 100 ? 'Effort Overload' : 'Allocated Effort' }}
        </q-chip>
      </div>

      <div class="column q-mt-md">
        <div class="row items-baseline gap-xs">
          <span
            class="text-h4 text-weight-bolder"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            {{ formatNumber(allocatedHours) }}
          </span>
          <span class="text-subtitle1 text-weight-medium text-grey-6">h</span>
        </div>

        <div class="q-mt-xs">
          <div class="row justify-between items-center text-caption q-mb-xs">
            <span
              class="text-weight-medium"
              :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
            >
              Effort consumed
            </span>
            <span
              class="text-weight-bolder"
              :class="consumedPct > 100 ? 'text-negative' : 'text-primary'"
            >
              {{ consumedPct }}%
            </span>
          </div>
          <q-linear-progress
            :value="Math.min(1, consumedPct / 100)"
            size="8px"
            rounded
            :color="consumedPct > 100 ? 'negative' : 'primary'"
            :track-color="$q.dark.isActive ? 'grey-8' : 'grey-3'"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm q-mt-md">
        <div class="col-4">
          <q-card
            flat
            class="q-pa-sm text-center rounded-borders cursor-pointer"
            :class="$q.dark.isActive ? 'bg-purple-10 text-purple-2' : 'bg-purple-1 text-purple-9'"
            @click="goToTaskDetails"
          >
            <div class="text-caption text-weight-medium" style="font-size: 11px">Active Tasks</div>
            <div class="text-h6 text-weight-bolder q-mt-xs">{{ assignedTasks }}</div>
          </q-card>
        </div>
        <div class="col-4">
          <q-card
            flat
            class="q-pa-sm text-center rounded-borders cursor-pointer"
            :class="$q.dark.isActive ? 'bg-blue-10 text-blue-2' : 'bg-blue-1 text-blue-9'"
            @click="goToProgress"
          >
            <div class="text-caption text-weight-medium" style="font-size: 11px">Actual Effort</div>
            <div class="text-h6 text-weight-bolder q-mt-xs">{{ formatHours(actualHours) }}</div>
          </q-card>
        </div>
        <div class="col-4">
          <q-card
            flat
            class="q-pa-sm text-center rounded-borders cursor-pointer"
            :class="$q.dark.isActive ? 'bg-teal-10 text-teal-2' : 'bg-teal-1 text-teal-9'"
            @click="goToProgress"
          >
            <div class="text-caption text-weight-medium" style="font-size: 11px">Remaining</div>
            <div class="text-h6 text-weight-bolder q-mt-xs">{{ formatHours(remainingHours) }}</div>
          </q-card>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { formatHours, formatNumber } from '@/utils/formatters';

const props = defineProps<{
  allocatedHours: number;
  actualHours: number;
  remainingHours: number;
  assignedTasks: number;
}>();

const $q = useQuasar();
const router = useRouter();

const consumedPct = computed(() =>
  props.allocatedHours
    ? Math.round((props.actualHours / props.allocatedHours) * 100)
    : 0,
);

function goToTaskDetails() {
  void router.push('/app/resource-dashboard/task-details');
}

function goToProgress() {
  void router.push('/app/resource-dashboard/progress');
}
</script>
