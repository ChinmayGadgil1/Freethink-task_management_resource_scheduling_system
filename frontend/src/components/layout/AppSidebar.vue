<template>
  <q-drawer
    :model-value="modelValue"
    :mini="isMini"
    :width="250"
    :mini-width="72"
    show-if-above
    side="left"
    bordered
    class="app-sidebar-drawer"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- 1. SLIM LEFT ICON RAIL (ONLY in Mini Mode) -->
    <div v-if="isMini" class="slim-icon-rail column items-center justify-between full-height">
      <!-- Top Section: Expand & Quick Icons -->
      <div class="column items-center gap-sm full-width q-pt-sm">
        <!-- Toggle / Expand Button (») -->
        <button
          class="rail-icon-btn menu-toggle-btn flex flex-center"
          title="Expand Sidebar (»)"
          @click="toggleMini"
        >
          <q-icon name="keyboard_double_arrow_right" size="18px" />
        </button>

        <!-- Quick Action Button (+) -->
        <button
          class="rail-quick-add-btn flex flex-center"
          :title="quickActionTitle || 'Quick Action'"
          @click="handleQuickAction"
        >
          <q-icon name="add" size="18px" />
        </button>

        <div class="rail-divider" />

        <!-- Core App Icons -->
        <router-link
          v-for="item in navItems"
          :key="`rail-${item.to}`"
          :to="item.to"
          class="rail-icon-item flex flex-center"
          :class="{ 'rail-item-active': isLinkActive(item.to) }"
          :title="item.title"
        >
          <div class="rail-icon-box flex flex-center" :class="item.bgClass">
            <q-icon :name="item.icon" size="18px" />
          </div>
          <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">
            {{ item.title }}
          </q-tooltip>
        </router-link>

        <!-- Help & Support (Mini Mode) -->
        <router-link
          :to="computedHelpRoute"
          class="rail-icon-item flex flex-center"
          :class="{ 'rail-item-active': isLinkActive(computedHelpRoute) }"
          title="Help & Support"
        >
          <div class="rail-icon-box flex flex-center bg-teal-soft">
            <q-icon name="help_outline" size="18px" />
          </div>
          <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">
            Help & Support
          </q-tooltip>
        </router-link>
      </div>
    </div>

    <!-- 2. EXPANDED FULL SIDEBAR MENU (ONLY in Expanded Mode) -->
    <div v-else class="expandable-sidebar-body column justify-between full-height">
      <!-- Upper Panel: Brand, Navigation Lists -->
      <div class="scroll-content q-pa-sm">
        <!-- Brand Header + Shrink Button -->
        <div class="sidebar-brand-row row items-center justify-between no-wrap q-py-xs q-px-xs">
          <div class="row items-center gap-xs cursor-pointer" @click="goToHome">
            <div class="brand-badge-icon flex flex-center">
              <span class="brand-sparkle">✦</span>
            </div>
            <div class="brand-title-wrap">
              <span class="brand-title-text">TaskFlow</span>
            </div>
          </div>

          <!-- Shrink Button («) -->
          <button
            class="sidebar-shrink-btn flex flex-center"
            title="Collapse Sidebar"
            @click="$emit('update:isMini', true)"
          >
            <q-icon name="keyboard_double_arrow_left" size="16px" />
          </button>
        </div>

        <q-separator class="q-my-sm" />

        <!-- Main Menu Section -->
        <div class="menu-category-block q-mt-xs">
          <div class="category-header-label">MAIN MENU</div>

          <nav class="category-nav-list column gap-xs">
            <router-link
              v-for="item in navItems"
              :key="`menu-${item.to}`"
              :to="item.to"
              class="menu-nav-link"
              :class="{ 'menu-nav-link-active': isLinkActive(item.to) }"
            >
              <q-icon :name="item.icon" size="17px" class="q-mr-sm" :class="item.colorClass" />
              <span class="nav-text" :class="{ 'font-bold': isLinkActive(item.to) }">
                {{ item.title }}
              </span>
              <q-badge
                v-if="item.count !== undefined"
                color="grey-3"
                text-color="dark"
                class="count-pill"
              >
                {{ item.count }}
              </q-badge>
              <span v-if="isLinkActive(item.to)" class="active-indicator-bar" />
            </router-link>
          </nav>
        </div>

        <!-- System Section -->
        <div class="menu-category-block q-mt-md">
          <div class="category-header-label">SYSTEM</div>

          <div class="system-menu-list column gap-xs">
            <router-link
              :to="computedHelpRoute"
              class="menu-nav-link"
              :class="{ 'menu-nav-link-active': isLinkActive(computedHelpRoute) }"
            >
              <q-icon name="help_outline" size="17px" class="q-mr-sm text-teal" />
              <span class="nav-text" :class="{ 'font-bold': isLinkActive(computedHelpRoute) }">
                Help & Support
              </span>
              <span v-if="isLinkActive(computedHelpRoute)" class="active-indicator-bar" />
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export interface SidebarNavItem {
  title: string;
  to: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  count?: number | string;
}

export interface WorkspaceItem {
  title: string;
  to: string;
  iconColor: string;
}

export interface AppSidebarProps {
  modelValue?: boolean;
  isMini?: boolean;
  homeRoute?: string;
  helpRoute?: string;
  navItems: SidebarNavItem[];
  workspaces?: WorkspaceItem[];
  quickActionTitle?: string;
  quickActionRoute?: string;
}

const props = withDefaults(defineProps<AppSidebarProps>(), {
  modelValue: true,
  isMini: false,
  homeRoute: '/pm/projects',
  helpRoute: '',
  workspaces: () => [],
  quickActionTitle: 'Quick Action',
  quickActionRoute: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:isMini', value: boolean): void;
  (e: 'quickAction'): void;
}>();

const router = useRouter();
const route = useRoute();

const computedHelpRoute = computed(() => {
  if (props.helpRoute) return props.helpRoute;
  if (props.homeRoute.includes('resource-dashboard') || route.path.includes('resource-dashboard')) {
    return '/app/resource-dashboard/help';
  }
  return '/pm/help';
});

function toggleMini() {
  emit('update:isMini', !props.isMini);
}

function isLinkActive(path: string): boolean {
  if (path === '/pm/projects') {
    return route.path === '/pm/projects' || route.path.startsWith('/pm/projects/');
  }
  if (path === '/app/resource-dashboard') {
    return route.path === '/app/resource-dashboard';
  }
  return route.path.startsWith(path);
}

function goToHome() {
  void router.push(props.homeRoute || '/');
}

function handleQuickAction() {
  if (props.quickActionRoute) {
    void router.push(props.quickActionRoute);
  } else {
    emit('quickAction');
  }
}
</script>

<style scoped lang="scss">
/* ----------------------------------------------------
   SHARED DUAL-RAIL SIDEBAR STYLES
   ---------------------------------------------------- */
.app-sidebar-drawer {
  background: var(--wo-bg-card, #ffffff);
  border-right: 1px solid var(--wo-border, #eaecef);
}

.sidebar-dual-container {
  height: 100%;
}

/* 1. SLIM ICON RAIL */
.slim-icon-rail {
  width: 72px;
  flex: 0 0 72px;
  background: var(--wo-bg-subtle, #fcfcfd);
  padding: 8px 0;
  height: 100%;
}

.rail-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--wo-text-muted, #667085);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--wo-bg-hover, #f2f4f7);
    color: var(--wo-text-main, #1d2433);
  }
}

.rail-quick-add-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: var(--wo-primary, #8b6fd8);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(139, 111, 216, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.05);
    background: #7a5ec7;
  }
}

.rail-divider {
  width: 32px;
  height: 1px;
  background: var(--wo-border, #eaecef);
  margin: 6px 0;
}

.rail-icon-item {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  margin-bottom: 6px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: var(--wo-bg-hover, #f2f4f7);
  }

  &.rail-item-active .rail-icon-box {
    box-shadow: 0 0 0 2px var(--wo-primary, #8b6fd8);
    transform: scale(1.05);
  }
}

.rail-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.bg-purple-soft {
  background: rgba(139, 111, 216, 0.15);
  color: #8b6fd8;
}

.bg-teal-soft {
  background: rgba(14, 147, 132, 0.15);
  color: #0e9384;
}

.bg-orange-soft {
  background: rgba(247, 144, 9, 0.15);
  color: #f79009;
}

.bg-blue-soft {
  background: rgba(46, 144, 250, 0.15);
  color: #2e90fa;
}

.bg-green-soft {
  background: rgba(18, 183, 106, 0.15);
  color: #12b76a;
}

.rail-avatar {
  background: var(--wo-primary, #8b6fd8);
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.08);
  }
}

/* 2. EXPANDED MAIN SIDEBAR BODY */
.expandable-sidebar-body {
  width: 100%;
  height: 100%;
  background: var(--wo-bg-card, #ffffff);
  overflow-y: auto;
}

.sidebar-brand-row {
  margin-bottom: 4px;
}

.brand-badge-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #8b6fd8 0%, #6f4fc7 100%);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(139, 111, 216, 0.3);
}

.brand-sparkle {
  font-size: 14px;
  line-height: 1;
}

.brand-title-text {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--wo-text-main, #1d2433);
}

.sidebar-shrink-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--wo-border, #eaecef);
  background: transparent;
  color: var(--wo-text-muted, #667085);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--wo-bg-hover, #f2f4f7);
    color: var(--wo-text-main, #1d2433);
  }
}

.category-header-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--wo-text-muted, #98a2b3);
  letter-spacing: 0.05em;
  padding: 0 8px;
  margin-bottom: 6px;
}

.menu-nav-link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--wo-text-main, #344054);
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    background: var(--wo-bg-hover, #f4f5f8);
    color: var(--wo-text-main, #1d2433);
  }

  &.menu-nav-link-active {
    background: rgba(139, 111, 216, 0.1);
    color: var(--wo-primary, #8b6fd8);
    font-weight: 700;

    .active-indicator-bar {
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 0 4px 4px 0;
      background: var(--wo-primary, #8b6fd8);
    }
  }

  .nav-text {
    flex: 1;
  }

  .count-pill {
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
  }
}

.menu-sub-link {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--wo-text-muted, #667085);
  transition: all 0.15s ease;

  &:hover {
    background: var(--wo-bg-hover, #f4f5f8);
    color: var(--wo-text-main, #1d2433);
  }
}

.system-item {
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--wo-text-muted, #667085);
  transition: all 0.15s ease;

  &:hover {
    background: var(--wo-bg-hover, #f4f5f8);
    color: var(--wo-text-main, #1d2433);
  }
}

.sidebar-user-footer {
  margin-top: auto;
}

.user-profile-pill {
  padding: 6px 8px;
  border-radius: 10px;
  background: var(--wo-bg-subtle, #f9fafb);
  border: 1px solid var(--wo-border, #eaecef);
}

.footer-avatar {
  background: var(--wo-primary, #8b6fd8);
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
}

.user-text-wrap {
  min-width: 0;
  max-width: 110px;
}

.user-name-line {
  font-size: 12px;
  font-weight: 700;
  color: var(--wo-text-main, #1d2433);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email-line {
  font-size: 10px;
  color: var(--wo-text-muted, #667085);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dark mode adjustments */
body.body--dark {
  .app-sidebar-drawer,
  .expandable-sidebar-body {
    background: var(--wo-bg-card, #181d28);
    border-color: var(--wo-border, #1e2433);
  }

  .slim-icon-rail {
    background: #131720;
    border-color: var(--wo-border, #1e2433);
  }

  .rail-divider {
    background: var(--wo-border, #1e2433);
  }

  .rail-icon-btn:hover,
  .rail-icon-item:hover,
  .sidebar-shrink-btn:hover,
  .menu-nav-link:hover,
  .menu-sub-link:hover,
  .system-item:hover {
    background: #1e2433;
    color: #f3f4f6;
  }

  .brand-title-text,
  .menu-nav-link,
  .user-name-line {
    color: #f3f4f6;
  }

  .sidebar-shrink-btn {
    border-color: #1e2433;
  }

  .user-profile-pill {
    background: #131720;
    border-color: #1e2433;
  }
}
</style>
