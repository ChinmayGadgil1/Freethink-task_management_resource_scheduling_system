<template>
  <div class="workload-wrapper">
    <div class="resource-grid">
      <div
        v-for="(resource, index) in resources"
        :key="resource.user_id"
        class="resource-card cursor-pointer"
        @click="goToResources"
      >
        <div class="resource-top">
          <q-avatar size="36px" class="resource-avatar">
            {{ resource.initials }}
          </q-avatar>
          <q-icon name="more_horiz" size="18px" class="resource-menu" @click.stop>
            <q-menu anchor="bottom end" self="top end">
              <q-list dense style="min-width: 150px">
                <q-item clickable v-close-popup @click="goToResources">
                  <q-item-section avatar style="min-width: 24px">
                    <q-icon name="person" size="14px" color="primary" />
                  </q-item-section>
                  <q-item-section>View Workload</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goToProjects">
                  <q-item-section avatar style="min-width: 24px">
                    <q-icon name="assignment_ind" size="14px" color="grey-7" />
                  </q-item-section>
                  <q-item-section>Assign to Project</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-icon>
        </div>

        <div class="resource-name">{{ resource.name }}</div>
        <div class="resource-role">{{ resource.role }}</div>

        <div class="resource-workload">{{ resource.workload }}%</div>
        <div class="resource-label">Workload</div>

        <!-- Sparkline with Area Fill -->
        <svg class="sparkline" viewBox="0 0 170 46" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient :id="`grad-${index}`" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" :stop-color="resource.stroke" stop-opacity="0.25" />
              <stop offset="100%" :stop-color="resource.stroke" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <path :d="resource.areaPath" :fill="`url(#grad-${index})`" />
          <path
            :d="resource.path"
            fill="none"
            :stroke="resource.stroke"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <div class="resource-bottom">
          <span
            class="workload-status"
            :style="{ color: resource.statusColor, backgroundColor: resource.statusBg }"
          >
            {{ resource.status }}
          </span>
        </div>
      </div>
    </div>

    <div class="strip-scroll-container">
      <div class="strip-scroll-thumb" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getResourceWorkloadApi, type ResourceUser } from '@/services/api';

const props = defineProps<{
  resources: ResourceUser[];
}>();

const router = useRouter();
const workloadMap = ref<Record<number, {
  workload: number;
  totalExpectedEffort: number;
  status: string;
}>>({});

function goToResources() {
  void router.push('/app/resource-dashboard');
}

function goToProjects() {
  void router.push('/pm/projects');
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getWorkloadMeta(workload: number) {
  if (workload > 100) {
    return {
      status: 'Overloaded',
      statusColor: '#E15263',
      statusBg: '#FDEEF0',
      stroke: '#E15263',
    };
  }

  if (workload > 80) {
    return {
      status: 'High',
      statusColor: '#F5841F',
      statusBg: '#FFF4EB',
      stroke: '#F5841F',
    };
  }

  if (workload > 50) {
    return {
      status: 'Medium',
      statusColor: '#D97706',
      statusBg: '#FEF7E6',
      stroke: '#F59E0B',
    };
  }

  if (workload > 25) {
    return {
      status: 'Normal',
      statusColor: '#27AE60',
      statusBg: '#EAF7F0',
      stroke: '#27AE60',
    };
  }

  return {
    status: 'Light',
    statusColor: '#1ABC9C',
    statusBg: '#E6F7F5',
    stroke: '#1ABC9C',
  };
}

function buildSparkline(workload: number): { path: string; areaPath: string } {
  const level = Math.max(4, Math.min(38, workload * 0.35));
  const p1 = Math.max(8, 32 - level * 0.35);
  const p2 = Math.max(6, 30 - level * 0.55);
  const p3 = Math.max(5, 28 - level * 0.75);
  const p4 = Math.max(5, 26 - level * 0.95);

  const path = `M 0,32 C 25,${p1} 50,${p2} 85,${p2 + 3} C 115,${p3 + 5} 140,${p4} 170,${p4 + 2}`;
  const areaPath = `${path} L 170,46 L 0,46 Z`;

  return { path, areaPath };
}

const resources = computed(() =>
  props.resources.map((resource) => {
    const data = workloadMap.value[resource.user_id];
    const workload = data?.workload ?? 0;
    const meta = getWorkloadMeta(workload);
    const sparkline = buildSparkline(workload);

    return {
      ...resource,
      workload,
      totalExpectedEffort: data?.totalExpectedEffort ?? 0,
      status: meta.status,
      statusColor: meta.statusColor,
      statusBg: meta.statusBg,
      stroke: meta.stroke,
      initials: getInitials(resource.name),
      path: sparkline.path,
      areaPath: sparkline.areaPath,
    };
  }),
);

async function loadWorkloads() {
  if (!props.resources.length) {
    workloadMap.value = {};
    return;
  }

  const entries = await Promise.all(
    props.resources.map(async (resource) => {
      try {
        const workload = await getResourceWorkloadApi(resource.user_id);
        const expectedHours = Number(workload.total_expected_effort) || 0;

        // Existing backend workload exposes allocated effort.
        // Use a standard 40h working week to express that effort as a percentage.
        const percentage = Math.round((expectedHours / 40) * 100);

        return [
          resource.user_id,
          {
            workload: Math.max(0, percentage),
            totalExpectedEffort: expectedHours,
            status: getWorkloadMeta(percentage).status,
          },
        ] as const;
      } catch (error) {
        console.error(`Failed to load workload for resource ${resource.user_id}:`, error);
        return [
          resource.user_id,
          {
            workload: 0,
            totalExpectedEffort: 0,
            status: 'Light',
          },
        ] as const;
      }
    }),
  );

  workloadMap.value = Object.fromEntries(entries);
}

watch(
  () => props.resources.map((resource) => resource.user_id),
  () => {
    void loadWorkloads();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.workload-wrapper {
  min-width: 0;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0;
}

.resource-card {
  min-width: 0;
  padding: 4px 14px 8px;
  border-right: 1px solid #f0f2f5;
  display: flex;
  flex-direction: column;
}

.resource-card:first-child {
  padding-left: 0;
}

.resource-card:last-child {
  padding-right: 0;
  border-right: none;
}

.resource-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.resource-avatar {
  border: 1.5px solid #eaecf0;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}

.resource-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resource-menu {
  color: #98a2b3;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px;
}

.resource-menu:hover {
  color: #1d2433;
  background: #f2f4f7;
}

.resource-name {
  margin-top: 10px;
  color: #1d2433;
  font-size: 11px;
  font-weight: 700;
}

.resource-role {
  margin-top: 2px;
  color: #98a2b3;
  font-size: 9px;
}

.resource-workload {
  margin-top: 14px;
  color: #1d2433;
  font-size: 24px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.resource-label {
  margin-top: 3px;
  color: #98a2b3;
  font-size: 9px;
}

.sparkline {
  display: block;
  width: 100%;
  height: 42px;
  margin-top: 6px;
}

.resource-bottom {
  margin-top: 8px;
}

.workload-status {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 9px;
  line-height: 1.3;
  font-weight: 700;
}

.strip-scroll-container {
  height: 4px;
  margin-top: 10px;
  border-radius: 4px;
  background: #f0f2f5;
}

.strip-scroll-thumb {
  width: 60%;
  height: 100%;
  margin-left: 15%;
  border-radius: 4px;
  background: #d0d5dd;
}

@media (max-width: 1200px) {
  .resource-grid {
    overflow-x: auto;
  }
  .resource-card {
    min-width: 190px;
  }
}
</style>
