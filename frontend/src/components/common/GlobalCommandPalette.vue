<template>
  <q-dialog
    v-model="isOpen"
    position="top"
    transition-show="jump-down"
    transition-hide="jump-up"
    class="command-palette-dialog"
    @hide="onDialogHide"
  >
    <q-card class="command-palette-card" :class="{ 'palette-dark': $q.dark.isActive }">
      <!-- Search Input Header -->
      <div class="palette-input-wrapper row items-center no-wrap">
        <q-icon name="search" size="22px" class="q-ml-md palette-search-icon" />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="palette-native-input"
          :placeholder="
            isResource
              ? 'Search tasks, deliverables, leaves, quick actions...'
              : 'Search projects, tasks, team resources, schedule, actions...'
          "
          autocomplete="off"
          spellcheck="false"
          @keydown="handleInputKeydown"
        />
        <q-btn
          v-if="query"
          flat
          round
          dense
          icon="close"
          size="sm"
          class="q-mr-sm text-grey-6"
          @click="query = ''"
        />
        <div class="palette-esc-badge gt-xs q-mr-md">ESC</div>
      </div>

      <q-separator />

      <!-- Results Body -->
      <div ref="resultsContainerRef" class="palette-results-container">
        <!-- Loading Indicator -->
        <div v-if="loading" class="row items-center justify-center q-pa-lg text-grey-6">
          <q-spinner color="primary" size="24px" class="q-mr-sm" />
          <span class="text-caption">Searching workspace...</span>
        </div>

        <!-- Grouped Results -->
        <div v-else-if="flattenedItems.length > 0" class="palette-list q-py-xs">
          <template v-for="group in groupedResults" :key="group.category">
            <div class="palette-group-header">
              <span class="palette-group-title">{{ group.category }}</span>
              <span class="palette-group-count">{{ group.items.length }}</span>
            </div>

            <div
              v-for="item in group.items"
              :key="item.id"
              :id="`palette-item-${item.flatIndex}`"
              class="palette-item row items-center justify-between"
              :class="{
                'palette-item-active': selectedIndex === item.flatIndex,
              }"
              @click="executeItem(item)"
              @mouseenter="selectedIndex = item.flatIndex"
            >
              <div class="row items-center no-wrap ellipsis q-pr-sm" style="flex: 1">
                <div class="palette-item-icon-box flex flex-center" :class="item.iconBg">
                  <q-icon :name="item.icon" size="18px" :class="item.iconColor" />
                </div>
                <div class="column q-ml-sm ellipsis">
                  <div class="palette-item-title ellipsis">
                    <span v-html="highlightMatch(item.title, query)"></span>
                  </div>
                  <div v-if="item.subtitle" class="palette-item-subtitle ellipsis text-caption">
                    {{ item.subtitle }}
                  </div>
                </div>
              </div>

              <!-- Item Badges / Right tags -->
              <div class="row items-center gap-xs no-wrap">
                <q-chip
                  v-if="item.badge"
                  dense
                  square
                  size="xs"
                  :color="item.badgeColor || 'grey-3'"
                  :text-color="item.badgeTextColor || 'grey-8'"
                  class="text-weight-bold"
                >
                  {{ item.badge }}
                </q-chip>
                <q-icon
                  name="subdirectory_arrow_left"
                  size="14px"
                  class="palette-enter-hint text-grey-5"
                />
              </div>
            </div>
          </template>
        </div>

        <!-- Empty State -->
        <div v-else-if="query.trim()" class="palette-empty text-center q-pa-xl">
          <q-icon name="search_off" size="36px" color="grey-5" class="q-mb-xs" />
          <div class="text-weight-medium text-body2">No results for "{{ query }}"</div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Try searching with a different term or project keyword.
          </div>
        </div>

        <!-- Default Recent / Quick Suggestions -->
        <div v-else class="palette-initial-hints q-pa-md">
          <div class="text-caption text-grey-6 text-weight-bold q-mb-sm q-px-xs">
            QUICK SHORTCUTS & NAVIGATION
          </div>
          <div class="row q-col-gutter-xs">
            <div v-for="action in defaultActions" :key="action.id" class="col-12 col-sm-6">
              <div
                class="palette-shortcut-card row items-center q-pa-sm rounded-borders cursor-pointer"
                @click="executeItem(action)"
              >
                <div class="palette-item-icon-box flex flex-center q-mr-sm" :class="action.iconBg">
                  <q-icon :name="action.icon" size="16px" :class="action.iconColor" />
                </div>
                <div class="column ellipsis" style="flex: 1">
                  <span class="text-weight-medium text-caption ellipsis">{{ action.title }}</span>
                  <span class="text-grey-6 text-caption ellipsis" style="font-size: 11px">{{
                    action.subtitle
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="palette-footer row items-center justify-between q-px-md q-py-xs text-grey-6">
        <div class="row items-center q-gutter-md text-caption">
          <span class="row items-center q-gutter-xs">
            <kbd class="palette-kbd">↑</kbd>
            <kbd class="palette-kbd">↓</kbd>
            <span class="gt-xs">to navigate</span>
          </span>
          <span class="row items-center q-gutter-xs">
            <kbd class="palette-kbd">↵</kbd>
            <span class="gt-xs">to select</span>
          </span>
          <span class="row items-center q-gutter-xs">
            <kbd class="palette-kbd">esc</kbd>
            <span class="gt-xs">to close</span>
          </span>
        </div>
        <div class="text-caption text-grey-5 gt-xs">
          <span>Global Palette</span>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import {
  getProjectsApi,
  getTasksApi,
  getResourcesApi,
  type Project,
  type Task,
  type ResourceUser,
} from '@/services/api';

export interface PaletteItem {
  id: string;
  category: 'Projects' | 'Tasks' | 'Team & Resources' | 'Navigation' | 'Actions';
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  action: () => void;
  flatIndex: number;
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
  }>(),
  {
    modelValue: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const isResource = computed(() => authStore.user?.role === 'RESOURCE');

const query = ref('');
const loading = ref(false);
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const resultsContainerRef = ref<HTMLElement | null>(null);

const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);
const resources = ref<ResourceUser[]>([]);
const isDataLoaded = ref(false);

async function loadData() {
  if (isDataLoaded.value) return;
  loading.value = true;
  try {
    const [pList, tList, rList] = await Promise.all([
      getProjectsApi().catch(() => [] as Project[]),
      getTasksApi().catch(() => [] as Task[]),
      isResource.value ? Promise.resolve([]) : getResourcesApi().catch(() => [] as ResourceUser[]),
    ]);
    projects.value = pList;
    tasks.value = tList;
    resources.value = rList;
    isDataLoaded.value = true;
  } finally {
    loading.value = false;
  }
}

watch(isOpen, async (newVal) => {
  if (newVal) {
    query.value = '';
    selectedIndex.value = 0;
    await loadData();
    await nextTick();
    inputRef.value?.focus();
  }
});

const defaultActions = computed<Omit<PaletteItem, 'flatIndex'>[]>(() => {
  if (isResource.value) {
    return [
      {
        id: 'act-res-dash',
        category: 'Navigation',
        title: 'Resource Dashboard',
        subtitle: "View overall workload & today's focus",
        icon: 'space_dashboard',
        iconColor: 'text-purple',
        iconBg: 'bg-purple-1',
        action: () => {
          void router.push('/app/resource-dashboard');
        },
      },
      {
        id: 'act-res-tasks',
        category: 'Navigation',
        title: 'Tasks & Worklogs',
        subtitle: 'Track tasks, log hours & progress',
        icon: 'assignment',
        iconColor: 'text-teal',
        iconBg: 'bg-teal-1',
        action: () => {
          void router.push('/app/resource-dashboard/task-details');
        },
      },
      {
        id: 'act-res-sched',
        category: 'Navigation',
        title: 'My Interactive Schedule',
        subtitle: 'View your Gantt timeline & capacity',
        icon: 'calendar_month',
        iconColor: 'text-blue',
        iconBg: 'bg-blue-1',
        action: () => {
          void router.push('/app/resource-dashboard/schedule');
        },
      },
      {
        id: 'act-res-leaves',
        category: 'Navigation',
        title: 'Leaves & Absences',
        subtitle: 'Apply for time-off or check leave status',
        icon: 'event_busy',
        iconColor: 'text-red-7',
        iconBg: 'bg-red-1',
        action: () => {
          void router.push('/app/resource-dashboard/leaves');
        },
      },
      {
        id: 'act-res-calendar',
        category: 'Navigation',
        title: 'Company Calendar',
        subtitle: 'Check holidays & company events',
        icon: 'event_available',
        iconColor: 'text-amber-9',
        iconBg: 'bg-amber-1',
        action: () => {
          void router.push('/app/resource-dashboard/calendar');
        },
      },
      {
        id: 'act-res-profile',
        category: 'Navigation',
        title: 'My Profile & Work Hours',
        subtitle: 'Manage account info & schedule rules',
        icon: 'person',
        iconColor: 'text-grey-8',
        iconBg: 'bg-grey-2',
        action: () => {
          void router.push('/app/resource-dashboard/profile');
        },
      },
    ];
  }

  return [
    {
      id: 'act-pm-dash',
      category: 'Navigation',
      title: 'Project Manager Dashboard',
      subtitle: 'System metrics, pacing, and executive stats',
      icon: 'dashboard',
      iconColor: 'text-purple',
      iconBg: 'bg-purple-1',
      action: () => {
        void router.push('/pm/projects');
      },
    },
    {
      id: 'act-pm-projects',
      category: 'Navigation',
      title: 'Projects Directory',
      subtitle: 'Manage all ongoing and archived projects',
      icon: 'folder',
      iconColor: 'text-purple',
      iconBg: 'bg-purple-1',
      action: () => {
        void router.push('/pm/projects');
      },
    },
    {
      id: 'act-pm-tasks',
      category: 'Navigation',
      title: 'Tasks Hub',
      subtitle: 'Kanban board & list view for deliverables',
      icon: 'task_alt',
      iconColor: 'text-teal',
      iconBg: 'bg-teal-1',
      action: () => {
        void router.push('/pm/tasks');
      },
    },
    {
      id: 'act-pm-resources',
      category: 'Navigation',
      title: 'Resource Allocation & Workload',
      subtitle: 'Team capacity, availability, and assignments',
      icon: 'groups',
      iconColor: 'text-orange',
      iconBg: 'bg-orange-1',
      action: () => {
        void router.push('/pm/resources');
      },
    },
    {
      id: 'act-pm-schedule',
      category: 'Navigation',
      title: 'Interactive Gantt Master Schedule',
      subtitle: 'Visual project timelines and dependencies',
      icon: 'event',
      iconColor: 'text-blue',
      iconBg: 'bg-blue-1',
      action: () => {
        void router.push('/pm/schedule');
      },
    },
    {
      id: 'act-pm-analytics',
      category: 'Navigation',
      title: 'System Analytics & Performance Metrics',
      subtitle: 'Resource capacity, workload, effort variance, and project health',
      icon: 'insights',
      iconColor: 'text-purple',
      iconBg: 'bg-purple-1',
      action: () => {
        void router.push('/pm/analytics');
      },
    },
    {
      id: 'act-pm-leaves',
      category: 'Navigation',
      title: 'Leave Approvals & Calendar',
      subtitle: 'Approve team time-off and view holidays',
      icon: 'event_busy',
      iconColor: 'text-red-7',
      iconBg: 'bg-red-1',
      action: () => {
        void router.push('/pm/leaves');
      },
    },
  ];
});

const searchResults = computed<Omit<PaletteItem, 'flatIndex'>[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];

  const items: Omit<PaletteItem, 'flatIndex'>[] = [];

  // 1. Projects
  projects.value.forEach((p) => {
    if (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    ) {
      items.push({
        id: `proj-${p.project_id}`,
        category: 'Projects',
        title: p.name,
        subtitle: `${p.status} • ${p.priority} Priority • ${p.progress || 0}% Complete`,
        icon: 'folder',
        iconColor: 'text-purple',
        iconBg: 'bg-purple-1',
        badge: `${p.progress || 0}%`,
        badgeColor: 'purple-1',
        badgeTextColor: 'purple-9',
        action: () => {
          if (isResource.value) {
            void router.push('/app/resource-dashboard');
          } else {
            void router.push(`/pm/projects/${p.project_id}`);
          }
        },
      });
    }
  });

  // 2. Tasks
  tasks.value.forEach((t) => {
    if (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.project_name && t.project_name.toLowerCase().includes(q))
    ) {
      items.push({
        id: `task-${t.task_id}`,
        category: 'Tasks',
        title: t.title,
        subtitle: `${t.project_name ? t.project_name + ' • ' : ''}${t.status} • ${t.priority}`,
        icon: 'task_alt',
        iconColor: 'text-teal',
        iconBg: 'bg-teal-1',
        badge: t.priority,
        badgeColor:
          t.priority === 'CRITICAL' ? 'red-1' : t.priority === 'HIGH' ? 'orange-1' : 'teal-1',
        badgeTextColor:
          t.priority === 'CRITICAL' ? 'red-9' : t.priority === 'HIGH' ? 'orange-9' : 'teal-9',
        action: () => {
          if (isResource.value) {
            void router.push(`/app/resource-dashboard/task-details/${t.task_id}`);
          } else {
            void router.push(`/pm/projects/${t.project_id}`);
          }
        },
      });
    }
  });

  // 3. Team Resources (PM only)
  if (!isResource.value) {
    const seenResourceIds = new Set<number>();
    resources.value.forEach((r) => {
      const rId = Number(r.user_id);
      if (
        rId &&
        !seenResourceIds.has(rId) &&
        (r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.role && r.role.toLowerCase().includes(q)))
      ) {
        seenResourceIds.add(rId);
        items.push({
          id: `res-${r.user_id}`,
          category: 'Team & Resources',
          title: r.name,
          subtitle: `${r.email} • ${r.role}`,
          icon: 'person',
          iconColor: 'text-orange',
          iconBg: 'bg-orange-1',
          badge: 'Team Member',
          badgeColor: 'orange-1',
          badgeTextColor: 'orange-9',
          action: () => {
            void router.push(`/pm/resources/${r.user_id}`);
          },
        });
      }
    });
  }

  // 4. Navigation & Shortcuts matching query
  defaultActions.value.forEach((a) => {
    if (a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q))) {
      items.push(a);
    }
  });

  return items;
});

const groupedResults = computed(() => {
  const items = searchResults.value;
  const groups: { category: string; items: PaletteItem[] }[] = [];
  const categories = ['Projects', 'Tasks', 'Team & Resources', 'Navigation', 'Actions'] as const;

  let counter = 0;
  categories.forEach((cat) => {
    const groupItems = items.filter((it) => it.category === cat);
    if (groupItems.length > 0) {
      const mapped: PaletteItem[] = groupItems.map((item) => ({
        ...item,
        flatIndex: counter++,
      }));
      groups.push({
        category: cat,
        items: mapped,
      });
    }
  });

  return groups;
});

const flattenedItems = computed<PaletteItem[]>(() => {
  return groupedResults.value.flatMap((g) => g.items);
});

watch(query, () => {
  selectedIndex.value = 0;
});

function handleInputKeydown(e: KeyboardEvent) {
  const total = flattenedItems.value.length;
  if (total === 0) {
    if (e.key === 'Escape') {
      isOpen.value = false;
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % total;
    scrollToActive();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + total) % total;
    scrollToActive();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const current = flattenedItems.value[selectedIndex.value];
    if (current) {
      executeItem(current);
    }
  } else if (e.key === 'Escape') {
    isOpen.value = false;
  }
}

function scrollToActive() {
  void nextTick(() => {
    const el = document.getElementById(`palette-item-${selectedIndex.value}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

function executeItem(item: Omit<PaletteItem, 'flatIndex'>) {
  isOpen.value = false;
  item.action();
}

function onDialogHide() {
  query.value = '';
}

function highlightMatch(text: string, search: string): string {
  if (!search.trim()) return text;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="palette-highlight">$1</mark>');
}
</script>

<style scoped lang="scss">
.command-palette-card {
  width: 640px;
  max-width: 92vw;
  border-radius: 16px;
  background: var(--wo-bg-card, #ffffff);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22);
  border: 1px solid var(--wo-border, #e2e8f0);
  overflow: hidden;
  margin-top: 10vh;
}

.palette-dark {
  background: #181f2c;
  border-color: rgba(255, 255, 255, 0.12);
  color: #f1f5f9;
}

.palette-input-wrapper {
  padding: 8px 6px;
  background: transparent;
}

.palette-search-icon {
  color: var(--wo-primary, #8b6fd8);
}

.palette-native-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  padding: 8px 12px;
  color: inherit;

  &::placeholder {
    color: #94a3b8;
    font-size: 14px;
  }
}

.palette-esc-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 6px;
  background: var(--wo-bg-tag, #f1f5f9);
  color: #64748b;
  border: 1px solid var(--wo-border, #e2e8f0);
}

body.body--dark .palette-esc-badge {
  background: #232d3f;
  border-color: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.palette-results-container {
  max-height: 420px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.palette-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 4px 16px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #94a3b8;
  text-transform: uppercase;
}

.palette-group-count {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.15);
}

.palette-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 8px;
  margin: 2px 8px;

  &:hover,
  &.palette-item-active {
    background: rgba(139, 111, 216, 0.1);
  }
}

body.body--dark .palette-item:hover,
body.body--dark .palette-item.palette-item-active {
  background: rgba(139, 111, 216, 0.22);
}

.palette-item-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.palette-item-title {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.25;
}

.palette-item-subtitle {
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.2;
}

body.body--dark .palette-item-subtitle {
  color: #94a3b8;
}

.palette-shortcut-card {
  border: 1px solid var(--wo-border, #edf0f5);
  background: var(--wo-bg-subtle, #f8fafc);
  transition: all 0.15s ease;

  &:hover {
    background: rgba(139, 111, 216, 0.08);
    border-color: rgba(139, 111, 216, 0.3);
  }
}

body.body--dark .palette-shortcut-card {
  background: #1f2736;
  border-color: rgba(255, 255, 255, 0.08);

  &:hover {
    background: #253043;
    border-color: rgba(139, 111, 216, 0.5);
  }
}

.palette-footer {
  border-top: 1px solid var(--wo-border, #edf0f5);
  background: var(--wo-bg-subtle, #f8fafc);
  font-size: 11.5px;
}

body.body--dark .palette-footer {
  background: #141b26;
  border-color: rgba(255, 255, 255, 0.08);
}

.palette-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 5px;
  min-width: 18px;
  border-radius: 4px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #cbd5e1);
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

body.body--dark .palette-kbd {
  background: #20293a;
  border-color: rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
}

:deep(.palette-highlight) {
  background: rgba(250, 204, 21, 0.35);
  color: inherit;
  font-weight: 700;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
