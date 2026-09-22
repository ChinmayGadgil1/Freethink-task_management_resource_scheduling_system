<template>
  <q-page class="pm-page projects-page">
    <!-- 1. PAGE HEADER & GREETING -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="page-title">Hey, {{ currentPmName }}!</div>
        <div class="page-subtitle">
          Plan, track, and manage everything your team is working on with complete clarity.
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          icon="add"
          label="New Project"
          color="primary"
          class="rounded-borders"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- 2. SUMMARY / KPI STATS GRID (4 Widgets matching Resource Dashboard) -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <StatCard
          title="Total Projects"
          :value="totalProjects"
          subtitle="Active Workspace"
          icon="folder"
          color="purple"
          note-class="note-purple"
          @click="filterAllProjects"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <StatCard
          title="On Track"
          :value="onTrackProjects"
          :subtitle="`${totalProjects ? Math.round((onTrackProjects / totalProjects) * 100) : 0}% of total`"
          icon="check_circle"
          color="green"
          note-class="note-green"
          @click="filterOnTrackProjects"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <StatCard
          title="At Risk"
          :value="atRiskProjects"
          :subtitle="`${totalProjects ? Math.round((atRiskProjects / totalProjects) * 100) : 0}% of total`"
          icon="warning_amber"
          color="orange"
          note-class="note-orange"
          @click="filterAtRiskProjects"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <StatCard
          title="Delayed"
          :value="delayedProjects"
          :subtitle="`${totalProjects ? Math.round((delayedProjects / totalProjects) * 100) : 0}% of total`"
          icon="schedule"
          color="red"
          note-class="note-red"
          :negative="delayedProjects > 0"
          @click="filterDelayedProjects"
        />
      </div>
    </div>

    <!-- 4. SECONDARY DASHBOARD WIDGETS (Health Donut, Upcoming Deadlines) -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Active Resource Allocations (5 cols) -->
      <div class="col-12 col-md-5">
        <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders full-height">
          <q-card-section class="row items-center justify-between q-pb-xs">
            <div>
              <div class="text-subtitle1 text-weight-bold">Active Resource Allocations</div>
              <div class="text-caption text-grey-6">Team engagement across active projects</div>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-chip
                dense
                :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                class="text-weight-bold"
              >
                {{ activeAssignedCount }} / {{ totalResourceCount }} Active
              </q-chip>
              <q-btn
                flat
                round
                dense
                icon="open_in_new"
                size="sm"
                color="grey-6"
                title="View All Resources"
                @click="goToResourcesList"
              />
            </div>
          </q-card-section>

          <q-card-section class="q-pt-xs">
            <div v-if="resourceAllocations.length === 0" class="q-pa-md text-center text-grey-6">
              <q-icon name="group_off" size="32px" />
              <div class="q-mt-xs">No resources found</div>
            </div>

            <q-scroll-area
              v-else
              style="height: 220px"
              :thumb-style="{
                right: '2px',
                borderRadius: '4px',
                background: $q.dark.isActive ? '#a855f7' : '#7c3aed',
                width: '5px',
                opacity: '0.6',
              }"
            >
              <div class="column q-gutter-xs q-pr-sm">
                <div
                  v-for="item in resourceAllocations"
                  :key="item.user.user_id"
                  class="row items-center justify-between q-pa-sm rounded-borders cursor-pointer no-wrap"
                  :class="$q.dark.isActive ? 'hover-bg-dark' : 'hover-bg-light'"
                  @click="goToResource(item.user.user_id)"
                >
                  <!-- Resource Avatar & Info -->
                  <div class="row items-center q-gutter-sm no-wrap" style="min-width: 0; flex: 1">
                    <div style="position: relative; display: inline-block">
                      <q-avatar
                        size="34px"
                        :color="item.hasActiveTasks ? 'primary' : 'grey-5'"
                        text-color="white"
                        class="text-weight-bold text-caption"
                      >
                        {{ item.user.name.charAt(0).toUpperCase() }}
                      </q-avatar>
                      <span
                        style="
                          position: absolute;
                          bottom: 0;
                          right: 0;
                          width: 10px;
                          height: 10px;
                          border-radius: 50%;
                          border: 2px solid;
                        "
                        :style="{
                          background: item.hasActiveTasks ? '#10b981' : '#94a3b8',
                          borderColor: $q.dark.isActive ? '#1e293b' : '#ffffff',
                        }"
                      />
                    </div>

                    <div class="column justify-center" style="min-width: 0; flex: 1">
                      <div class="row items-center q-gutter-xs no-wrap">
                        <span
                          class="text-weight-bold text-caption ellipsis"
                          style="font-size: 13px"
                        >
                          {{ item.user.name }}
                        </span>
                      </div>

                      <!-- Project Assignment Badges -->
                      <div class="row items-center q-gutter-xs wrap q-mt-xs">
                        <template v-if="item.projects.length > 0">
                          <q-chip
                            v-for="p in item.projects.slice(0, 2)"
                            :key="p.id"
                            dense
                            size="xs"
                            square
                            :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                            :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                            class="q-ma-none text-weight-medium ellipsis"
                            style="max-width: 120px"
                          >
                            {{ p.name }}
                          </q-chip>
                          <span
                            v-if="item.projects.length > 2"
                            class="text-caption text-grey-6"
                            style="font-size: 10px"
                          >
                            +{{ item.projects.length - 2 }} more
                          </span>
                        </template>
                        <q-chip
                          v-else
                          dense
                          size="xs"
                          square
                          :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
                          :text-color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
                          class="q-ma-none"
                        >
                          Available
                        </q-chip>
                      </div>
                    </div>
                  </div>

                  <!-- Active Task Badge & Action -->
                  <div class="row items-center q-gutter-xs no-wrap" style="flex-shrink: 0">
                    <q-badge
                      :color="
                        item.hasActiveTasks
                          ? $q.dark.isActive
                            ? 'teal-10'
                            : 'teal-1'
                          : $q.dark.isActive
                            ? 'grey-9'
                            : 'grey-2'
                      "
                      :text-color="
                        item.hasActiveTasks ? ($q.dark.isActive ? 'teal-2' : 'teal-8') : 'grey-6'
                      "
                      class="text-weight-bold"
                    >
                      {{ item.activeTasksCount }}
                      {{ item.activeTasksCount === 1 ? 'task' : 'tasks' }}
                    </q-badge>
                    <q-icon name="chevron_right" color="grey-6" size="16px" />
                  </div>
                </div>
              </div>
            </q-scroll-area>
          </q-card-section>
        </q-card>
      </div>

      <!-- Upcoming Deadlines (7 cols) -->
      <div class="col-12 col-md-7">
        <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders full-height">
          <q-card-section class="row items-center justify-between q-pb-xs">
            <div>
              <div class="text-subtitle1 text-weight-bold">Upcoming Deadlines</div>
              <div class="text-caption text-grey-6">Chronological milestone schedule</div>
            </div>
            <q-chip
              dense
              :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
              class="text-weight-bold"
            >
              {{ upcomingDeadlinesList.length }} scheduled
            </q-chip>
          </q-card-section>

          <q-card-section class="q-pt-xs">
            <div v-if="upcomingDeadlinesList.length === 0" class="q-pa-md text-center text-grey-6">
              <q-icon name="event_available" size="32px" />
              <div class="q-mt-xs">No upcoming project deadlines</div>
            </div>

            <q-scroll-area
              v-else
              style="height: 220px"
              :thumb-style="{
                right: '2px',
                borderRadius: '4px',
                background: $q.dark.isActive ? '#a855f7' : '#7c3aed',
                width: '5px',
                opacity: '0.6',
              }"
            >
              <div class="column q-gutter-xs q-pr-sm">
                <div
                  v-for="item in upcomingDeadlinesList"
                  :key="item.project.project_id"
                  class="row items-center justify-between q-pa-sm rounded-borders cursor-pointer no-wrap"
                  :class="$q.dark.isActive ? 'hover-bg-dark' : 'hover-bg-light'"
                  @click="goToProject(item.project.project_id)"
                >
                  <div class="row items-center q-gutter-md no-wrap" style="min-width: 0; flex: 1">
                    <!-- Date Badge -->
                    <div
                      class="column items-center justify-center rounded-borders q-px-xs q-py-xs"
                      style="min-width: 44px; flex-shrink: 0"
                      :class="
                        $q.dark.isActive ? 'bg-purple-10 text-purple-2' : 'bg-purple-1 text-primary'
                      "
                    >
                      <span class="text-caption text-weight-bold" style="font-size: 10px">{{
                        item.month
                      }}</span>
                      <span class="text-subtitle2 text-weight-bolder" style="line-height: 1">{{
                        item.day
                      }}</span>
                    </div>

                    <div style="min-width: 0; flex: 1">
                      <div class="row items-center q-gutter-xs no-wrap">
                        <span class="text-weight-bold ellipsis">{{ item.project.name }}</span>
                        <q-chip
                          dense
                          square
                          size="xs"
                          :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                          :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                          class="q-ma-none text-weight-medium"
                          style="flex-shrink: 0"
                        >
                          {{ getHealthLabel(item.project) }}
                        </q-chip>
                      </div>
                      <div class="text-caption text-grey-6 ellipsis">
                        {{ item.relativeText }} • {{ Number(item.project.progress) || 0 }}%
                        completed
                      </div>
                    </div>
                  </div>

                  <q-icon name="chevron_right" color="grey-6" style="flex-shrink: 0" />
                </div>
              </div>
            </q-scroll-area>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 5. ACTIVE PROJECTS EXPLORER -->
    <div class="q-mb-lg">
      <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders">
        <!-- Toolbar Header -->
        <q-card-section class="row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <span class="text-subtitle1 text-weight-bold">Active Projects</span>
            <q-badge
              :color="$q.dark.isActive ? 'purple-10' : 'deep-purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
              class="text-weight-bold"
            >
              {{ filteredProjects.length }} Projects
            </q-badge>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-select
              v-model="groupBy"
              dense
              outlined
              options-dense
              :dark="$q.dark.isActive"
              :options="['None', 'Status', 'Health']"
              label="Group by"
              style="min-width: 120px"
            />

            <q-btn-toggle
              v-model="viewMode"
              unelevated
              dense
              toggle-color="primary"
              toggle-text-color="white"
              color="transparent"
              :text-color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
              :options="[
                { icon: 'grid_view', value: 'cards' },
                { icon: 'format_list_bulleted', value: 'table' },
              ]"
            />
          </div>
        </q-card-section>

        <!-- Filter Toolbar -->
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-4 col-md-3">
              <q-input
                v-model="searchQuery"
                outlined
                dense
                clearable
                :dark="$q.dark.isActive"
                placeholder="Search projects..."
              >
                <template #prepend>
                  <q-icon name="search" size="18px" />
                </template>
              </q-input>
            </div>

            <div class="col-6 col-sm-4 col-md-2">
              <q-select
                v-model="statusFilter"
                outlined
                dense
                emit-value
                map-options
                :dark="$q.dark.isActive"
                :options="statusFilterOptions"
                label="Status"
              />
            </div>

            <div class="col-6 col-sm-4 col-md-2">
              <q-select
                v-model="healthFilter"
                outlined
                dense
                emit-value
                map-options
                :dark="$q.dark.isActive"
                :options="healthFilterOptions"
                label="Health"
              />
            </div>

            <div class="col-6 col-md-2">
              <q-input
                v-model="startDateFilter"
                outlined
                dense
                mask="####-##-##"
                label="Start Date"
                :dark="$q.dark.isActive"
                stack-label
                clearable
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer text-primary">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="startDateFilter" mask="YYYY-MM-DD" :dark="$q.dark.isActive">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-6 col-md-2">
              <q-input
                v-model="endDateFilter"
                outlined
                dense
                mask="####-##-##"
                label="End Date"
                :dark="$q.dark.isActive"
                stack-label
                clearable
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer text-primary">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="endDateFilter" mask="YYYY-MM-DD" :dark="$q.dark.isActive">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-1 text-right">
              <q-btn flat dense no-caps color="primary" label="Reset" @click="resetAllFilters" />
            </div>
          </div>
        </q-card-section>

        <q-separator :dark="$q.dark.isActive" />

        <!-- CARDS VIEW -->
        <div v-if="viewMode === 'cards'" class="q-pa-md">
          <div v-if="loading" class="q-pa-xl text-center">
            <q-spinner size="36px" color="primary" />
            <div class="q-mt-sm text-caption">Loading projects...</div>
          </div>

          <div v-else-if="filteredProjects.length === 0" class="q-pa-xl text-center">
            <q-avatar size="60px" color="purple-1" text-color="primary" class="q-mb-sm">
              <q-icon name="folder_open" size="30px" />
            </q-avatar>
            <div class="text-h6 text-weight-bold">No projects found</div>
            <div class="text-caption text-grey-6">
              Try adjusting your search terms or active filters.
            </div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Clear Filters"
              class="q-mt-sm"
              @click="resetAllFilters"
            />
          </div>

          <div v-else>
            <div class="active-projects-scroll-container custom-scrollbar">
              <div v-for="group in groupedProjectCards" :key="group.label || 'all'" class="q-mb-md">
                <div v-if="group.label" class="row items-center q-gutter-xs q-mb-sm">
                  <q-icon name="category" size="16px" color="primary" />
                  <span class="text-subtitle2 text-weight-bold">{{ group.label }}</span>
                  <q-chip dense size="sm" color="purple-1" text-color="primary">{{
                    group.projects.length
                  }}</q-chip>
                </div>

                <div class="projects-cards-grid">
                  <q-card
                    v-for="project in group.projects"
                    :key="project.project_id"
                    flat
                    bordered
                    :dark="$q.dark.isActive"
                    class="project-grid-card cursor-pointer full-height column justify-between"
                    @click="goToProject(project.project_id)"
                  >
                    <!-- Consistent Clean Card Header -->
                    <div
                      class="q-px-md q-pt-md q-pb-sm relative-position overflow-hidden project-card-header"
                    >
                      <div class="row items-center justify-between no-wrap q-mb-xs">
                        <q-avatar
                          size="36px"
                          :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                          :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                          class="shadow-1"
                        >
                          <q-icon name="folder" size="20px" />
                        </q-avatar>

                        <div class="row items-center q-gutter-xs no-wrap">
                          <q-chip
                            dense
                            square
                            :color="getPriorityChipColor(project.priority)"
                            :text-color="getPriorityTextColor(project.priority)"
                            class="text-caption text-weight-bold q-px-sm"
                          >
                            {{ (project.priority || 'MEDIUM').toUpperCase() }}
                          </q-chip>
                          <q-btn
                            flat
                            round
                            dense
                            icon="more_vert"
                            :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
                            size="sm"
                            @click.stop
                          >
                            <q-menu auto-close>
                              <q-list style="min-width: 150px">
                                <q-item clickable @click="goToProject(project.project_id)">
                                  <q-item-section avatar
                                    ><q-icon name="visibility" color="primary"
                                  /></q-item-section>
                                  <q-item-section>View Details</q-item-section>
                                </q-item>
                                <q-item
                                  v-if="project.status === 'COMPLETED'"
                                  clickable
                                  class="text-primary"
                                  @click="confirmArchiveProject(project)"
                                >
                                  <q-item-section avatar
                                    ><q-icon name="archive" color="primary"
                                  /></q-item-section>
                                  <q-item-section>Archive Project</q-item-section>
                                </q-item>
                                <q-item
                                  v-if="project.status === 'ARCHIVED'"
                                  clickable
                                  class="text-primary"
                                  @click="confirmUnarchiveProject(project)"
                                >
                                  <q-item-section avatar
                                    ><q-icon name="unarchive" color="primary"
                                  /></q-item-section>
                                  <q-item-section>Unarchive Project</q-item-section>
                                </q-item>
                                <q-separator />
                                <q-item
                                  clickable
                                  class="text-negative"
                                  @click="confirmDeleteProject(project)"
                                >
                                  <q-item-section avatar
                                    ><q-icon name="delete" color="negative"
                                  /></q-item-section>
                                  <q-item-section>Delete Project</q-item-section>
                                </q-item>
                              </q-list>
                            </q-menu>
                          </q-btn>
                        </div>
                      </div>

                      <div
                        class="text-subtitle1 text-weight-bold project-card-title q-mb-xs"
                        :title="project.name"
                      >
                        {{ project.name }}
                      </div>
                      <div
                        class="text-caption text-grey-6 project-card-desc"
                        :title="project.description || ''"
                      >
                        {{
                          project.description ||
                          'Sprint deliverables, task assignments, and progress tracking.'
                        }}
                      </div>
                    </div>

                    <!-- Card Body -->
                    <q-card-section class="q-pa-md column justify-between col">
                      <!-- Dual Pill Info Badges -->
                      <div class="row q-col-gutter-xs q-mb-md">
                        <div class="col-6">
                          <div
                            class="row items-center no-wrap gap-xs q-px-sm q-py-xs rounded-borders text-caption"
                            :class="
                              $q.dark.isActive ? 'bg-dark text-grey-3' : 'bg-grey-1 text-grey-8'
                            "
                            style="border: 1px solid rgba(0, 0, 0, 0.07)"
                          >
                            <q-icon
                              name="assignment"
                              size="13px"
                              :color="getStatusIconColor(project.status)"
                            />
                            <div class="ellipsis">
                              <span class="text-grey-6">Status: </span>
                              <strong :class="`text-${getStatusIconColor(project.status)}`">{{
                                formatStatus(project.status)
                              }}</strong>
                            </div>
                          </div>
                        </div>
                        <div class="col-6">
                          <div
                            class="row items-center no-wrap gap-xs q-px-sm q-py-xs rounded-borders text-caption"
                            :class="
                              $q.dark.isActive ? 'bg-dark text-grey-3' : 'bg-grey-1 text-grey-8'
                            "
                            style="border: 1px solid rgba(0, 0, 0, 0.07)"
                            :title="`Due: ${formatDate(project.deadline)}`"
                          >
                            <q-icon
                              name="event"
                              size="13px"
                              :color="
                                isOverdue(project.deadline, project.status) ? 'negative' : 'grey-6'
                              "
                            />
                            <div class="ellipsis">
                              <span class="text-grey-6">Due: </span>
                              <strong
                                :class="
                                  isOverdue(project.deadline, project.status)
                                    ? 'text-negative text-weight-bold'
                                    : 'text-main'
                                "
                                >{{ formatDate(project.deadline) }}</strong
                              >
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Progress Bar with soft Quasar theme -->
                      <div class="q-mb-xs">
                        <div class="row items-center justify-between text-caption q-mb-xs">
                          <span class="text-grey-6 text-weight-medium">Progress</span>
                          <span class="text-weight-bold text-primary">
                            {{ Number(project.progress) || 0 }}%
                          </span>
                        </div>
                        <q-linear-progress
                          rounded
                          size="6px"
                          :value="Math.min(100, Math.max(0, Number(project.progress) || 0)) / 100"
                          color="primary"
                          :track-color="$q.dark.isActive ? 'grey-9' : 'purple-1'"
                        />
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- Cards Pagination Toolbar -->
            <div
              v-if="filteredProjects.length > 0"
              class="row items-center justify-between q-mt-md q-px-xs wrap gap-sm"
            >
              <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                Showing {{ (cardPagination.page - 1) * cardPagination.rowsPerPage + 1 }} -
                {{
                  Math.min(
                    cardPagination.page * cardPagination.rowsPerPage,
                    filteredProjects.length,
                  )
                }}
                of {{ filteredProjects.length }} project{{ filteredProjects.length === 1 ? '' : 's' }}
              </div>
              <div class="row items-center q-gutter-sm">
                <q-select
                  v-model="cardPagination.rowsPerPage"
                  :options="[4, 6, 8, 12, 24]"
                  dense
                  outlined
                  options-dense
                  :dark="$q.dark.isActive"
                  style="width: 105px"
                  label="Per page"
                />
                <q-pagination
                  v-if="cardTotalPages > 1"
                  v-model="cardPagination.page"
                  :max="cardTotalPages"
                  :max-pages="5"
                  direction-links
                  boundary-links
                  color="primary"
                  dense
                  size="sm"
                  :dark="$q.dark.isActive"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- TABLE VIEW -->
        <div v-else class="q-pa-md">
          <!-- BULK ACTIONS TOOLBAR -->
          <transition
            appear
            enter-active-class="animated fadeInDown"
            leave-active-class="animated fadeOutUp"
          >
            <div
              v-if="selectedProjects.length > 0"
              class="row items-center justify-between q-pa-sm q-mb-sm rounded-borders"
              :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-purple-1 text-primary'"
              style="border: 1px solid var(--q-primary)"
            >
              <div class="row items-center q-gutter-sm">
                <q-icon name="check_circle" color="primary" size="20px" />
                <span class="text-weight-bold"
                  >{{ selectedProjects.length }} project(s) selected</span
                >
              </div>
              <div class="row items-center q-gutter-xs">
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="archive"
                  label="Bulk Archive"
                  :loading="bulkActionLoading"
                  @click="handleBulkArchive"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="delete"
                  color="negative"
                  label="Bulk Move to Bin"
                  :loading="bulkActionLoading"
                  @click="handleBulkDelete"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="file_download"
                  label="Bulk Export (JSON)"
                  @click="handleBulkExport"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="close"
                  label="Clear"
                  @click="selectedProjects = []"
                />
              </div>
            </div>
          </transition>

          <q-table
            v-model:selected="selectedProjects"
            flat
            :dark="$q.dark.isActive"
            :rows="filteredProjects"
            :columns="projectColumns"
            row-key="project_id"
            selection="multiple"
            :loading="loading"
            :pagination="pagination"
            :rows-per-page-options="[6, 12, 18, 24]"
            no-data-label="No projects found"
          >
            <template #body-cell-project="props">
              <q-td :props="props">
                <div
                  class="row items-center q-gutter-xs cursor-pointer"
                  @click="goToProject(props.row.project_id)"
                >
                  <q-avatar size="26px" color="purple-1" text-color="primary">
                    <q-icon name="folder" size="14px" />
                  </q-avatar>
                  <span class="text-weight-bold">{{ props.row.name }}</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-owner="props">
              <q-td :props="props">
                <div class="row items-center q-gutter-xs">
                  <q-avatar size="24px" color="primary" text-color="white" class="text-caption">
                    {{ (props.row.project_manager_name || '—').charAt(0).toUpperCase() }}
                  </q-avatar>
                  <span>{{ props.row.project_manager_name || '—' }}</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
                  :text-color="$q.dark.isActive ? 'white' : 'dark'"
                >
                  {{ formatStatus(props.row.status) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-health="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                  :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                >
                  {{ getHealthLabel(props.row) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-progress="props">
              <q-td :props="props">
                <div class="row items-center q-gutter-xs" style="min-width: 120px">
                  <q-linear-progress
                    rounded
                    size="6px"
                    :value="Math.min(100, Math.max(0, Number(props.row.progress) || 0)) / 100"
                    color="primary"
                    class="col"
                  />
                  <span class="text-caption text-weight-bold text-grey-7" style="font-size: 11px">
                    {{ Math.round(Number(props.row.progress) || 0) }}%
                  </span>
                </div>
              </q-td>
            </template>

            <template #body-cell-start_date="props">
              <q-td :props="props">
                <span class="text-caption text-grey-8">{{ formatDate(props.row.start_date) }}</span>
              </q-td>
            </template>

            <template #body-cell-deadline="props">
              <q-td :props="props">
                <span class="text-caption text-grey-8">{{ formatDate(props.row.deadline) }}</span>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" align="right">
                <q-btn flat round dense icon="more_horiz" color="grey-6">
                  <q-menu auto-close>
                    <q-list style="min-width: 150px">
                      <q-item clickable @click="goToProject(props.row.project_id)">
                        <q-item-section avatar
                          ><q-icon name="visibility" color="primary"
                        /></q-item-section>
                        <q-item-section>View Details</q-item-section>
                      </q-item>
                      <q-item
                        v-if="props.row.status === 'COMPLETED'"
                        clickable
                        class="text-primary"
                        @click="confirmArchiveProject(props.row)"
                      >
                        <q-item-section avatar
                          ><q-icon name="archive" color="primary"
                        /></q-item-section>
                        <q-item-section>Archive Project</q-item-section>
                      </q-item>
                      <q-item
                        v-if="props.row.status === 'ARCHIVED'"
                        clickable
                        class="text-primary"
                        @click="confirmUnarchiveProject(props.row)"
                      >
                        <q-item-section avatar
                          ><q-icon name="unarchive" color="primary"
                        /></q-item-section>
                        <q-item-section>Unarchive Project</q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item
                        clickable
                        class="text-negative"
                        @click="confirmDeleteProject(props.row)"
                      >
                        <q-item-section avatar
                          ><q-icon name="delete" color="negative"
                        /></q-item-section>
                        <q-item-section>Delete Project</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </div>
      </q-card>
    </div>

    <!-- 6. INSIGHTS STRIP -->
    <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders q-pa-md q-mt-md">
      <div class="row q-col-gutter-md items-center">
        <!-- Highest Progress -->
        <div class="col-12 col-sm-4">
          <div class="row items-center justify-start justify-sm-center q-gutter-md no-wrap q-py-xs">
            <q-avatar
              size="40px"
              :color="$q.dark.isActive ? 'green-10' : 'green-1'"
              :text-color="$q.dark.isActive ? 'green-3' : 'green'"
              class="flex-shrink-0"
            >
              <q-icon name="trending_up" size="22px" />
            </q-avatar>
            <div class="text-left" style="min-width: 0">
              <div class="text-caption text-grey-6 ellipsis">Highest Progress</div>
              <div class="text-subtitle1 text-weight-bolder">
                {{ Math.max(...projects.map((p) => Number(p.progress) || 0), 0) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Average Progress -->
        <div class="col-12 col-sm-4">
          <div class="row items-center justify-start justify-sm-center q-gutter-md no-wrap q-py-xs">
            <q-avatar
              size="40px"
              :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
              class="flex-shrink-0"
            >
              <q-icon name="pie_chart" size="22px" />
            </q-avatar>
            <div class="text-left" style="min-width: 0">
              <div class="text-caption text-grey-6 ellipsis">Average Progress</div>
              <div class="text-subtitle1 text-weight-bolder">{{ completionAverage }}%</div>
            </div>
          </div>
        </div>

        <!-- Projects Needing Attention -->
        <div class="col-12 col-sm-4">
          <div class="row items-center justify-start justify-sm-center q-gutter-md no-wrap q-py-xs">
            <q-avatar
              size="40px"
              :color="$q.dark.isActive ? 'orange-10' : 'orange-1'"
              :text-color="$q.dark.isActive ? 'orange-3' : 'orange'"
              class="flex-shrink-0"
            >
              <q-icon name="priority_high" size="22px" />
            </q-avatar>
            <div class="text-left" style="min-width: 0">
              <div class="text-caption text-grey-6 ellipsis" title="Projects Needing Attention">
                Projects Needing Attention
              </div>
              <div class="text-subtitle1 text-weight-bolder">
                {{ atRiskProjects + delayedProjects }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- CREATE PROJECT DIALOG -->
    <q-dialog v-model="showCreateDialog">
      <q-card
        :dark="$q.dark.isActive"
        style="width: 500px; max-width: 95vw"
        class="rounded-borders"
      >
        <q-card-section class="row items-center justify-between q-pb-sm">
          <div>
            <div class="text-caption text-primary text-weight-bold">NEW PROJECT</div>
            <div class="text-h6 text-weight-bold">Create a project</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="handleCreateProject">
          <q-card-section class="q-pt-md q-pb-xs q-px-md">
            <q-input
              v-model="form.name"
              outlined
              dense
              label="Project name"
              :dark="$q.dark.isActive"
              :rules="[(val) => !!val.trim() || 'Project name is required']"
            />
          </q-card-section>

          <q-card-section class="q-pt-xs q-pb-xs q-px-md">
            <q-input
              v-model="form.description"
              outlined
              dense
              type="textarea"
              label="Description"
              autogrow
              :dark="$q.dark.isActive"
            />
          </q-card-section>

          <q-card-section class="q-pt-sm q-pb-xs q-px-md">
            <q-select
              v-model="form.priority"
              outlined
              dense
              label="Priority"
              :options="priorityOptions"
              emit-value
              map-options
              :dark="$q.dark.isActive"
            />
          </q-card-section>

          <q-card-section class="q-pt-sm q-pb-sm q-px-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.start_date"
                  outlined
                  dense
                  mask="####-##-##"
                  label="Start date"
                  stack-label
                  :dark="$q.dark.isActive"
                  :rules="[
                    (val) =>
                      !form.deadline ||
                      !val ||
                      val <= form.deadline ||
                      'Start date cannot be after deadline',
                  ]"
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer text-primary">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date
                          v-model="form.start_date"
                          mask="YYYY-MM-DD"
                          :dark="$q.dark.isActive"
                        >
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.deadline"
                  outlined
                  dense
                  mask="####-##-##"
                  label="Deadline"
                  stack-label
                  :dark="$q.dark.isActive"
                  :rules="[
                    (val) =>
                      !form.start_date ||
                      !val ||
                      val >= form.start_date ||
                      'Deadline cannot be before start date',
                  ]"
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer text-primary">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="form.deadline" mask="YYYY-MM-DD" :dark="$q.dark.isActive">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-xs">
            <q-btn v-close-popup flat no-caps label="Cancel" color="grey-7" />
            <q-btn
              type="submit"
              no-caps
              unelevated
              label="Create Project"
              color="primary"
              :loading="creating"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- DELETE PROJECT CONFIRMATION DIALOG -->
    <ConfirmActionDialog
      v-model="showDeleteDialog"
      title="Move Project to Bin"
      subtitle="The project will be moved to the Recycle Bin"
      confirm-label="Move to Bin"
      :loading="deletingProject"
      @confirm="handleExecuteDeleteProject"
    >
      Are you sure you want to move project <strong>"{{ projectToDelete?.name }}"</strong> to the
      Recycle Bin? All associated tasks will also be moved to the bin and can be restored later.
    </ConfirmActionDialog>

    <!-- ARCHIVE PROJECT CONFIRMATION DIALOG -->
    <ConfirmActionDialog
      v-model="showArchiveDialog"
      title="Archive Completed Project"
      subtitle="Move completed project to archives"
      confirm-label="Archive Project"
      :loading="archivingProject"
      @confirm="handleExecuteArchiveProject"
    >
      Are you sure you want to archive completed project
      <strong>"{{ projectToArchive?.name }}"</strong>? The project and its history will be safely
      preserved in your archives.
    </ConfirmActionDialog>

    <!-- UNARCHIVE PROJECT CONFIRMATION DIALOG -->
    <ConfirmActionDialog
      v-model="showUnarchiveDialog"
      title="Unarchive Project"
      subtitle="Restore project to Completed status"
      confirm-label="Unarchive Project"
      :loading="unarchivingProject"
      @confirm="handleExecuteUnarchiveProject"
    >
      Are you sure you want to unarchive project
      <strong>"{{ projectToUnarchive?.name }}"</strong>? Its status will be restored to
      <strong>Completed</strong>.
    </ConfirmActionDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import StatCard from '@/components/dashboard/StatCard.vue';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog.vue';
import { formatDate, formatStatus } from '@/utils/formatters';
import {
  createProjectApi,
  deleteProjectApi,
  getProjectsApi,
  archiveProjectApi,
  unarchiveProjectApi,
  getResourcesApi,
  getTasksApi,
} from '@/services/api';
import type {
  CreateProjectPayload,
  Project,
  ProjectPriority,
  ResourceUser,
  Task,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

function goToProject(projectId: number) {
  void router.push(`/pm/projects/${projectId}`);
}

function goToResource(userId: number) {
  void router.push(`/pm/resources/${userId}`);
}

function goToResourcesList() {
  void router.push('/pm/resources');
}

const projects = ref<Project[]>([]);
const resourcesList = ref<ResourceUser[]>([]);
const tasksList = ref<Task[]>([]);
const loading = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const startDateFilter = ref('');
const endDateFilter = ref('');

const showDeleteDialog = ref(false);
const deletingProject = ref(false);
const projectToDelete = ref<Project | null>(null);

const showArchiveDialog = ref(false);
const archivingProject = ref(false);
const projectToArchive = ref<Project | null>(null);

const showUnarchiveDialog = ref(false);
const unarchivingProject = ref(false);
const projectToUnarchive = ref<Project | null>(null);

function confirmDeleteProject(project: Project) {
  projectToDelete.value = project;
  showDeleteDialog.value = true;
}

function confirmArchiveProject(project: Project) {
  projectToArchive.value = project;
  showArchiveDialog.value = true;
}

function confirmUnarchiveProject(project: Project) {
  projectToUnarchive.value = project;
  showUnarchiveDialog.value = true;
}

async function handleExecuteArchiveProject() {
  if (!projectToArchive.value) return;

  archivingProject.value = true;
  try {
    await archiveProjectApi(projectToArchive.value.project_id);
    $q.notify({
      type: 'positive',
      message: `Project "${projectToArchive.value.name}" archived successfully`,
    });
    showArchiveDialog.value = false;
    projectToArchive.value = null;
    await loadProjects();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to archive project',
    });
  } finally {
    archivingProject.value = false;
  }
}

async function handleExecuteUnarchiveProject() {
  if (!projectToUnarchive.value) return;

  unarchivingProject.value = true;
  try {
    await unarchiveProjectApi(projectToUnarchive.value.project_id);
    $q.notify({
      type: 'positive',
      message: `Project "${projectToUnarchive.value.name}" unarchived (status restored to Completed)`,
    });
    showUnarchiveDialog.value = false;
    projectToUnarchive.value = null;
    await loadProjects();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to unarchive project',
    });
  } finally {
    unarchivingProject.value = false;
  }
}

async function handleExecuteDeleteProject() {
  if (!projectToDelete.value) return;

  deletingProject.value = true;
  try {
    await deleteProjectApi(projectToDelete.value.project_id);
    $q.notify({
      type: 'positive',
      message: `Project "${projectToDelete.value.name}" moved to Recycle Bin`,
    });
    showDeleteDialog.value = false;
    projectToDelete.value = null;
    await loadProjects();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to delete project',
    });
  } finally {
    deletingProject.value = false;
  }
}

interface ProjectForm {
  name: string;
  description: string;
  priority: ProjectPriority;
  start_date: string;
  deadline: string;
}

const form = reactive<ProjectForm>({
  name: '',
  description: '',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
});

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const searchQuery = ref('');
const statusFilter = ref('ALL');
const healthFilter = ref('ALL');
const groupBy = ref('None');
const viewMode = ref<'cards' | 'table'>('cards');

const selectedProjects = ref<Project[]>([]);
const bulkActionLoading = ref(false);

async function handleBulkArchive() {
  if (selectedProjects.value.length === 0) return;
  bulkActionLoading.value = true;
  try {
    let successCount = 0;
    for (const p of selectedProjects.value) {
      await archiveProjectApi(p.project_id);
      successCount++;
    }
    $q.notify({
      type: 'positive',
      message: `Successfully archived ${successCount} project(s)`,
    });
    selectedProjects.value = [];
    await loadProjects();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to archive selected projects',
    });
  } finally {
    bulkActionLoading.value = false;
  }
}

function handleBulkDelete() {
  if (selectedProjects.value.length === 0) return;
  $q.dialog({
    title: 'Bulk Move to Recycle Bin',
    message: `Are you sure you want to move ${selectedProjects.value.length} project(s) to the Recycle Bin?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      bulkActionLoading.value = true;
      try {
        let successCount = 0;
        for (const p of selectedProjects.value) {
          await deleteProjectApi(p.project_id);
          successCount++;
        }
        $q.notify({
          type: 'positive',
          message: `Successfully moved ${successCount} project(s) to Recycle Bin`,
        });
        selectedProjects.value = [];
        await loadProjects();
      } catch (error: unknown) {
        $q.notify({
          type: 'negative',
          message:
            error instanceof Error ? error.message : 'Failed to move projects to Recycle Bin',
        });
      } finally {
        bulkActionLoading.value = false;
      }
    })();
  });
}

function handleBulkExport() {
  if (selectedProjects.value.length === 0) return;
  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(selectedProjects.value, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute(
    'download',
    `projects_export_${new Date().toISOString().slice(0, 10)}.json`,
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  $q.notify({
    type: 'positive',
    message: `Exported ${selectedProjects.value.length} project(s)`,
  });
}

const pagination = ref({
  page: 1,
  rowsPerPage: 6,
  sortBy: '',
  descending: false,
});

const statusFilterOptions = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Not Started', value: 'NOT_STARTED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const healthFilterOptions = [
  { label: 'All Health', value: 'ALL' },
  { label: 'On Track', value: 'ON_TRACK' },
  { label: 'At Risk', value: 'AT_RISK' },
  { label: 'Delayed', value: 'DELAYED' },
];

function resetAllFilters() {
  searchQuery.value = '';
  statusFilter.value = 'ALL';
  healthFilter.value = 'ALL';
  startDateFilter.value = '';
  endDateFilter.value = '';
}

function filterAllProjects() {
  resetAllFilters();
}

function filterOnTrackProjects() {
  resetAllFilters();
  healthFilter.value = 'ON_TRACK';
}

function filterAtRiskProjects() {
  resetAllFilters();
  healthFilter.value = 'AT_RISK';
}

function filterDelayedProjects() {
  resetAllFilters();
  healthFilter.value = 'DELAYED';
}

const currentPmName = computed(() => {
  return authStore.user?.name || 'Project Manager';
});

const projectColumns: QTableColumn<Project>[] = [
  {
    name: 'project',
    label: 'Project',
    field: (row) => row.name,
    align: 'left',
  },
  {
    name: 'owner',
    label: 'Owner',
    field: (row) =>
      (row as Project & { project_manager_name?: string }).project_manager_name || '—',
    align: 'left',
  },
  {
    name: 'status',
    label: 'Status',
    field: (row) => row.status,
    align: 'left',
  },
  {
    name: 'health',
    label: 'Health',
    field: (row) => getProjectHealth(row),
    align: 'left',
  },
  {
    name: 'progress',
    label: 'Progress',
    field: (row) => Number(row.progress) || 0,
    align: 'left',
  },
  {
    name: 'start_date',
    label: 'Start Date',
    field: (row) => row.start_date,
    align: 'left',
  },
  {
    name: 'deadline',
    label: 'End Date',
    field: (row) => row.deadline,
    align: 'left',
  },
  {
    name: 'actions',
    label: '',
    field: () => '',
    align: 'right',
  },
];

function getPriorityChipColor(priority?: string): string {
  switch ((priority || '').toUpperCase()) {
    case 'CRITICAL':
      return $q.dark.isActive ? 'red-10' : 'red-1';
    case 'HIGH':
      return $q.dark.isActive ? 'orange-10' : 'orange-1';
    case 'MEDIUM':
      return $q.dark.isActive ? 'purple-10' : 'purple-1';
    case 'LOW':
      return $q.dark.isActive ? 'teal-10' : 'teal-1';
    default:
      return $q.dark.isActive ? 'grey-9' : 'grey-2';
  }
}

function getPriorityTextColor(priority?: string): string {
  switch ((priority || '').toUpperCase()) {
    case 'CRITICAL':
      return $q.dark.isActive ? 'red-2' : 'negative';
    case 'HIGH':
      return $q.dark.isActive ? 'amber-2' : 'deep-orange-9';
    case 'MEDIUM':
      return $q.dark.isActive ? 'purple-2' : 'primary';
    case 'LOW':
      return $q.dark.isActive ? 'teal-2' : 'teal-9';
    default:
      return $q.dark.isActive ? 'grey-4' : 'grey-8';
  }
}

function getStatusIconColor(status?: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'positive';
    case 'IN_PROGRESS':
      return 'primary';
    case 'ON_HOLD':
      return 'warning';
    case 'CANCELLED':
      return 'negative';
    case 'ARCHIVED':
      return 'grey-6';
    default:
      return 'grey-7';
  }
}

function isOverdue(deadline?: string | null, status?: string): boolean {
  if (status === 'COMPLETED' || status === 'ARCHIVED' || !deadline) return false;
  const d = new Date(deadline);
  d.setHours(23, 59, 59, 999);
  return d < new Date();
}

function getProjectHealth(project: Project): 'ON_TRACK' | 'AT_RISK' | 'DELAYED' {
  if (project.status === 'COMPLETED') return 'ON_TRACK';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. If deadline has passed and project is not completed -> DELAYED
  if (project.deadline) {
    const deadline = new Date(project.deadline);
    deadline.setHours(23, 59, 59, 999);
    if (deadline < today && (Number(project.progress) || 0) < 100) {
      return 'DELAYED';
    }
  }

  // 2. If project is NOT STARTED:
  if (project.status === 'NOT_STARTED') {
    if (project.start_date) {
      const startDate = new Date(project.start_date);
      startDate.setHours(0, 0, 0, 0);
      // If planned start date is in the future, it is fully on track
      if (startDate > today) {
        return 'ON_TRACK';
      }
      // If planned start date has already passed by more than 7 days and work hasn't begun
      const daysOverdueStart = Math.ceil(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysOverdueStart > 7) {
        return 'AT_RISK';
      }
    }
    // Default for newly planned or future projects: on track
    return 'ON_TRACK';
  }

  // 3. If project is paused or on hold -> AT RISK
  if (project.status === 'ON_HOLD') {
    return 'AT_RISK';
  }

  // 4. If project is IN PROGRESS: evaluate schedule pace
  const progress = Number(project.progress) || 0;

  // Grace period: newly created projects (created within the last 48 hours) with 0 progress are on track
  const createdAtMs = project.created_at ? new Date(project.created_at).getTime() : 0;
  if (createdAtMs > 0 && Date.now() - createdAtMs < 48 * 60 * 60 * 1000 && progress === 0) {
    return 'ON_TRACK';
  }

  if (project.start_date && project.deadline) {
    const startMs = new Date(project.start_date).getTime();
    const deadlineMs = new Date(project.deadline).getTime();
    const nowMs = today.getTime();

    if (deadlineMs > startMs) {
      const totalDuration = deadlineMs - startMs;
      const elapsed = Math.max(0, nowMs - startMs);
      const timeElapsedPct = Math.min(100, Math.round((elapsed / totalDuration) * 100));

      // If more than 25% of timeline has passed and progress is lagging far behind (>30% behind expected)
      if (timeElapsedPct >= 25 && progress < timeElapsedPct - 30) {
        return 'AT_RISK';
      }
    }
  } else if (project.deadline) {
    const deadline = new Date(project.deadline);
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // If less than 7 days remaining and progress is under 50%
    if (daysRemaining <= 7 && progress < 50) {
      return 'AT_RISK';
    }
  }

  return 'ON_TRACK';
}

function getHealthLabel(project: Project) {
  const health = getProjectHealth(project);

  if (health === 'AT_RISK') return 'At Risk';
  if (health === 'DELAYED') return 'Delayed';

  return 'On Track';
}

const filteredProjects = computed(() => {
  const query = (searchQuery.value || '').trim().toLowerCase();

  return projects.value.filter((project) => {
    const matchesSearch =
      !query ||
      project.name.toLowerCase().includes(query) ||
      (project.description ?? '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter.value === 'ALL'
        ? project.status !== 'ARCHIVED'
        : project.status === statusFilter.value;

    const health = getProjectHealth(project);

    const matchesHealth = healthFilter.value === 'ALL' || health === healthFilter.value;

    let matchesStartDate = true;
    if (startDateFilter.value) {
      matchesStartDate = project.start_date
        ? new Date(project.start_date) >= new Date(startDateFilter.value)
        : false;
    }

    let matchesEndDate = true;
    if (endDateFilter.value) {
      matchesEndDate = project.deadline
        ? new Date(project.deadline) <= new Date(endDateFilter.value)
        : false;
    }

    return matchesSearch && matchesStatus && matchesHealth && matchesStartDate && matchesEndDate;
  });
});

const cardPagination = ref({
  page: 1,
  rowsPerPage: 6,
});

const cardTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProjects.value.length / (cardPagination.value.rowsPerPage || 6))),
);

const paginatedProjects = computed(() => {
  const start = (cardPagination.value.page - 1) * cardPagination.value.rowsPerPage;
  return filteredProjects.value.slice(start, start + cardPagination.value.rowsPerPage);
});

watch(
  [
    searchQuery,
    statusFilter,
    healthFilter,
    startDateFilter,
    endDateFilter,
    groupBy,
    () => cardPagination.value.rowsPerPage,
  ],
  () => {
    cardPagination.value.page = 1;
    pagination.value.page = 1;
  },
);

const groupedProjectCards = computed(() => {
  const projs = paginatedProjects.value;
  if (groupBy.value === 'Status') {
    const map = new Map<string, Project[]>();
    for (const p of projs) {
      const s = formatStatus(p.status);
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(p);
    }
    return Array.from(map.entries()).map(([label, projs]) => ({ label, projects: projs }));
  }

  if (groupBy.value === 'Health') {
    const map = new Map<string, Project[]>();
    for (const p of projs) {
      const h = getHealthLabel(p);
      if (!map.has(h)) map.set(h, []);
      map.get(h)!.push(p);
    }
    return Array.from(map.entries()).map(([label, projs]) => ({ label, projects: projs }));
  }

  return [{ label: '', projects: projs }];
});

const activeWorkspaceProjects = computed(() =>
  projects.value.filter((p) => p.status !== 'ARCHIVED'),
);

const totalProjects = computed(() => activeWorkspaceProjects.value.length);

const onTrackProjects = computed(
  () =>
    activeWorkspaceProjects.value.filter((project) => getProjectHealth(project) === 'ON_TRACK')
      .length,
);

const atRiskProjects = computed(
  () =>
    activeWorkspaceProjects.value.filter((project) => getProjectHealth(project) === 'AT_RISK')
      .length,
);

const delayedProjects = computed(
  () =>
    activeWorkspaceProjects.value.filter((project) => getProjectHealth(project) === 'DELAYED')
      .length,
);

const completionAverage = computed(() => {
  if (!activeWorkspaceProjects.value.length) return 0;

  const total = activeWorkspaceProjects.value.reduce(
    (sum, project) => sum + Number(project.progress || 0),
    0,
  );

  return Math.round(total / activeWorkspaceProjects.value.length);
});

export interface ResourceAllocationItem {
  user: ResourceUser;
  activeTasksCount: number;
  hasActiveTasks: boolean;
  projects: Array<{ id: number; name: string; taskCount: number }>;
}

const resourceAllocations = computed<ResourceAllocationItem[]>(() => {
  return resourcesList.value
    .map((r) => {
      const activeTasks = tasksList.value.filter((t) => {
        if (t.status === 'COMPLETED') return false;
        const isAssignedViaList = t.assigned_resources?.some(
          (ar) => Number(ar.user_id) === Number(r.user_id),
        );
        const isAssignedViaIds = t.assigned_resource_ids?.some(
          (id) => Number(id) === Number(r.user_id),
        );
        const isDirectAssigned =
          (t as unknown as { assigned_to?: number }).assigned_to !== undefined &&
          Number((t as unknown as { assigned_to?: number }).assigned_to) === Number(r.user_id);
        return Boolean(isAssignedViaList || isAssignedViaIds || isDirectAssigned);
      });

      const projMap = new Map<number, { id: number; name: string; taskCount: number }>();
      activeTasks.forEach((t) => {
        const p = projects.value.find((proj) => proj.project_id === t.project_id);
        const pName = p?.name || t.project_name || `Project #${t.project_id}`;
        const existing = projMap.get(t.project_id);
        if (!existing) {
          projMap.set(t.project_id, { id: t.project_id, name: pName, taskCount: 1 });
        } else {
          existing.taskCount += 1;
        }
      });

      return {
        user: r,
        activeTasksCount: activeTasks.length,
        hasActiveTasks: activeTasks.length > 0,
        projects: Array.from(projMap.values()),
      };
    })
    .sort((a, b) => {
      if (a.hasActiveTasks && !b.hasActiveTasks) return -1;
      if (!a.hasActiveTasks && b.hasActiveTasks) return 1;
      if (b.activeTasksCount !== a.activeTasksCount) {
        return b.activeTasksCount - a.activeTasksCount;
      }
      return a.user.name.localeCompare(b.user.name);
    });
});

const totalResourceCount = computed(() => resourcesList.value.length);
const activeAssignedCount = computed(
  () => resourceAllocations.value.filter((r) => r.hasActiveTasks).length,
);

const upcomingDeadlinesList = computed(() => {
  return [...activeWorkspaceProjects.value]
    .filter((p) => !!p.deadline && p.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .map((p) => {
      const d = new Date(p.deadline!);
      const monthStr = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const dayStr = String(d.getDate()).padStart(2, '0');

      const today = new Date();
      const diffTime = d.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let relativeText = `Due in ${diffDays} days`;
      if (diffDays < 0) {
        relativeText = `Overdue by ${Math.abs(diffDays)} days`;
      } else if (diffDays === 0) {
        relativeText = 'Due Today';
      } else if (diffDays === 1) {
        relativeText = 'Due Tomorrow';
      }

      return {
        project: p,
        month: monthStr,
        day: dayStr,
        relativeText,
      };
    });
});

async function loadProjects() {
  loading.value = true;

  try {
    const [projs, tsks, res] = await Promise.all([
      getProjectsApi(),
      getTasksApi().catch(() => [] as Task[]),
      getResourcesApi().catch(() => [] as ResourceUser[]),
    ]);
    projects.value = projs;
    tasksList.value = tsks;
    resourcesList.value = res;
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load projects',
    });
  } finally {
    loading.value = false;
  }
}

async function handleCreateProject() {
  const userId = authStore.user?.user_id;

  if (!userId) {
    $q.notify({
      type: 'negative',
      message: 'Please login again',
    });
    return;
  }

  creating.value = true;

  try {
    const payload: CreateProjectPayload = {
      project_manager_id: userId,
      name: form.name.trim(),
      priority: form.priority,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }

    await createProjectApi(payload);

    $q.notify({
      type: 'positive',
      message: 'Project created successfully',
    });

    showCreateDialog.value = false;
    resetForm();
    await loadProjects();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to create project',
    });
  } finally {
    creating.value = false;
  }
}

function resetForm() {
  form.name = '';
  form.description = '';
  form.priority = 'MEDIUM';
  form.start_date = '';
  form.deadline = '';
}

onMounted(() => {
  void loadProjects();
});
</script>

<style scoped lang="scss">
.active-projects-scroll-container {
  max-height: 580px;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 4px 6px 12px 4px;
  box-sizing: border-box;

  @media (max-width: 1023px) {
    max-height: 860px;
  }

  @media (max-width: 600px) {
    max-height: 580px;
  }
}

.projects-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;

  @media (max-width: 1023px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.project-grid-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-radius: 16px;
  overflow: hidden;
  box-sizing: border-box;
  transition:
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.22s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(118, 84, 214, 0.12);
    border-color: var(--q-primary, #7654d6) !important;
  }
}

.project-card-header {
  background: var(--wo-bg-card-hover, #f8fafc);
  border-bottom: 1px solid var(--wo-border-subtle, #f0f2f5);
}

.body--dark .project-card-header {
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.project-card-avatar {
  background: var(--wo-primary-light, rgba(139, 111, 216, 0.12));
  color: var(--wo-primary, #8b6fd8);
}

.project-card-title {
  color: var(--wo-text-main, #172033);
  min-height: 44px;
  font-size: 15.5px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card-desc {
  min-height: 36px;
  font-size: 12.5px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.9;
}

.custom-scrollbar {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(140, 110, 220, 0.35) transparent;

  &::-webkit-scrollbar {
    width: 6px;
    height: 0px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(140, 110, 220, 0.3);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(140, 110, 220, 0.6);
  }
}
</style>
