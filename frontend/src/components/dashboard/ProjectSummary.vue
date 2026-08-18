<template>
  <div class="projects-wrapper">
    <div class="project-grid">
      <article
        v-for="project in projects"
        :key="project.name"
        class="project-card cursor-pointer"
        @click="goToProject(project.project_id)"
      >
        <!-- Project Cover Image -->
        <div class="project-cover">
          <img :src="project.image" :alt="project.name" class="cover-image" />
          <div class="cover-overlay" />
        </div>

        <div class="project-body">
          <div class="project-top">
            <div class="project-name">{{ project.name }}</div>
            <span
              class="project-percent"
              :style="{ color: project.color, backgroundColor: project.bgColor }"
            >
              {{ project.progress }}%
            </span>
          </div>

          <div class="project-progress-track">
            <div
              class="project-progress-bar"
              :style="{ width: `${project.progress}%`, backgroundColor: project.color }"
            />
          </div>

          <div class="project-meta">
            <span>{{ project.deadline }}</span>
          </div>

          <div class="project-bottom">
            <div class="avatars-stack">
              <q-avatar
                v-for="(member, idx) in project.members ?? []"
                :key="idx"
                size="22px"
                class="project-avatar"
              >
                <img :src="member.avatar" :alt="member.name" />
              </q-avatar>
              <div v-if="project.extraMembers" class="project-avatar-extra">
                +{{ project.extraMembers }}
              </div>
            </div>
            <span class="project-tasks">{{ project.tasks ?? 0 }} tasks</span>
          </div>
        </div>
      </article>
    </div>

    <div class="strip-scroll-container">
      <div class="strip-scroll-thumb" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Project } from '@/services/api';

const router = useRouter();

function goToProject(projectId: number) {
  void router.push(`/pm/projects/${projectId}`);
}

interface ProjectMember {
  name: string;
  avatar: string;
}

interface ProjectCard extends Project {
  color: string;
  bgColor: string;
  image: string;
  members?: ProjectMember[];
  extraMembers?: number;
  tasks?: number;
}

const props = defineProps<{
  projects: Project[];
}>();

const projectColors = [
  {
    color: '#8B6FD8',
    bgColor: '#F4F0FD',
    image: '/projects/website.jpg',
  },
  {
    color: '#1ABC9C',
    bgColor: '#E6F7F5',
    image: '/projects/mobile.jpg',
  },
  {
    color: '#F5841F',
    bgColor: '#FFF4EB',
    image: '/projects/marketing.jpg',
  },
  {
    color: '#27AE60',
    bgColor: '#EAF7F0',
    image: '/projects/tools.jpg',
  },
  {
    color: '#E15263',
    bgColor: '#FDEEF0',
    image: '/projects/portal.jpg',
  },
];

const projects = computed<ProjectCard[]>(() =>
  props.projects.slice(0, 5).map((project, index) => {
    const theme = projectColors[index % projectColors.length]!;

    return {
      ...project,
      color: theme.color,
      bgColor: theme.bgColor,
      image: theme.image,
      members: [],
      extraMembers: 0,
      tasks: 0,
    };
  }),
);
</script>

<style scoped lang="scss">
.projects-wrapper {
  min-width: 0;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 14px;
}

.project-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #eaecef;
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;
}

.project-card:hover {
  border-color: #d0d5dd;
  box-shadow: 0 4px 10px rgba(16, 24, 40, 0.04);
}

.project-cover {
  position: relative;
  height: 80px;
  overflow: hidden;
  background: #f2f4f7;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;
}

.project-card:hover .cover-image {
  transform: scale(1.04);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.08) 100%);
}

.project-body {
  padding: 12px 12px 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.project-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.project-name {
  color: #1d2433;
  font-size: 11px;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.project-percent {
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.project-progress-track {
  height: 4px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f0f2f5;
}

.project-progress-bar {
  height: 100%;
  border-radius: inherit;
  transition: width 0.3s ease;
}

.project-meta {
  margin-top: 7px;
  color: #98a2b3;
  font-size: 9px;
  font-weight: 500;
}

.project-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 6px;
}

.avatars-stack {
  display: flex;
  align-items: center;
}

.project-avatar {
  margin-left: -5px;
  border: 1.5px solid #ffffff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}

.project-avatar:first-child {
  margin-left: 0;
}

.project-avatar-extra {
  margin-left: -5px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #ffffff;
  border-radius: 50%;
  background: #f4f0fd;
  color: #8b6fd8;
  font-size: 8px;
  font-weight: 700;
}

.project-tasks {
  color: #98a2b3;
  font-size: 9px;
  font-weight: 500;
}

.strip-scroll-container {
  height: 4px;
  margin-top: 12px;
  border-radius: 4px;
  background: #f0f2f5;
}

.strip-scroll-thumb {
  width: 65%;
  height: 100%;
  margin-left: 12%;
  border-radius: 4px;
  background: #d0d5dd;
}

@media (max-width: 1250px) {
  .project-grid {
    grid-template-columns: repeat(3, minmax(180px, 1fr));
    overflow-x: auto;
  }
}
</style>
