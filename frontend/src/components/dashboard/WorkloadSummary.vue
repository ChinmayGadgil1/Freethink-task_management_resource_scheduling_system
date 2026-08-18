<template>
  <div class="workload-wrapper">
    <div class="resource-grid">
      <div
        v-for="(resource, index) in resources"
        :key="resource.name"
        class="resource-card cursor-pointer"
        @click="goToResources"
      >
        <div class="resource-top">
          <q-avatar size="36px" class="resource-avatar">
            <img :src="resource.avatar" :alt="resource.name" />
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
import { useRouter } from 'vue-router';

const router = useRouter();

function goToResources() {
  void router.push('/app/resource-dashboard');
}

function goToProjects() {
  void router.push('/pm/projects');
}

const avatarRohit =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80';
const avatarSneha =
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80';
const avatarArjun =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80';
const avatarPriya =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80';
const avatarVikram =
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80';

const resources = [
  {
    name: 'Rohit Verma',
    role: 'UI/UX Designer',
    workload: 85,
    status: 'Overloaded',
    statusColor: '#E15263',
    statusBg: '#FDEEF0',
    stroke: '#E15263',
    avatar: avatarRohit,
    path: 'M 0,32 C 20,20 35,36 55,22 C 75,8 95,28 115,16 C 135,4 150,24 170,18',
    areaPath:
      'M 0,32 C 20,20 35,36 55,22 C 75,8 95,28 115,16 C 135,4 150,24 170,18 L 170,46 L 0,46 Z',
  },
  {
    name: 'Sneha Iyer',
    role: 'Frontend Developer',
    workload: 72,
    status: 'High',
    statusColor: '#F5841F',
    statusBg: '#FFF4EB',
    stroke: '#F5841F',
    avatar: avatarSneha,
    path: 'M 0,30 C 25,32 40,16 65,22 C 90,28 110,14 135,20 C 150,24 160,18 170,22',
    areaPath:
      'M 0,30 C 25,32 40,16 65,22 C 90,28 110,14 135,20 C 150,24 160,18 170,22 L 170,46 L 0,46 Z',
  },
  {
    name: 'Arjun Mehta',
    role: 'Backend Developer',
    workload: 60,
    status: 'Medium',
    statusColor: '#D97706',
    statusBg: '#FEF7E6',
    stroke: '#F59E0B',
    avatar: avatarArjun,
    path: 'M 0,28 C 20,24 35,30 55,20 C 75,10 95,26 120,18 C 140,10 155,22 170,16',
    areaPath:
      'M 0,28 C 20,24 35,30 55,20 C 75,10 95,26 120,18 C 140,10 155,22 170,16 L 170,46 L 0,46 Z',
  },
  {
    name: 'Priya Singh',
    role: 'QA Engineer',
    workload: 45,
    status: 'Normal',
    statusColor: '#27AE60',
    statusBg: '#EAF7F0',
    stroke: '#27AE60',
    avatar: avatarPriya,
    path: 'M 0,26 C 20,20 35,30 55,22 C 75,14 95,20 120,12 C 140,6 155,16 170,14',
    areaPath:
      'M 0,26 C 20,20 35,30 55,22 C 75,14 95,20 120,12 C 140,6 155,16 170,14 L 170,46 L 0,46 Z',
  },
  {
    name: 'Vikram Patel',
    role: 'DevOps Engineer',
    workload: 30,
    status: 'Light',
    statusColor: '#1ABC9C',
    statusBg: '#E6F7F5',
    stroke: '#1ABC9C',
    avatar: avatarVikram,
    path: 'M 0,24 C 20,22 35,28 55,20 C 75,12 95,16 120,12 C 140,14 155,18 170,16',
    areaPath:
      'M 0,24 C 20,22 35,28 55,20 C 75,12 95,16 120,12 C 140,14 155,18 170,16 L 170,46 L 0,46 Z',
  },
];
</script>

<style scoped lang="scss">
.workload-wrapper {
  min-width: 0;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(170px, 1fr));
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
