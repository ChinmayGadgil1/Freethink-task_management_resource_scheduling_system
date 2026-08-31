<template>
  <q-page class="q-pa-md" :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'">
    <div style="max-width: 1400px; margin: 0 auto">
      <!-- 1. PAGE HEADER & GREETING -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <div
            class="row items-center q-gutter-xs text-caption text-weight-bold text-primary q-mb-xs"
          >
            <span>✦</span>
            <span>Project Management</span>
          </div>
          <h1 class="text-h4 text-weight-bolder q-ma-none">Hey, {{ currentPmName }}!</h1>
          <p
            class="text-subtitle2 q-mt-xs q-mb-none"
            :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
          >
            Plan, track, and manage everything your team is working on with complete clarity.
          </p>
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
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Total Projects"
            :value="totalProjects"
            subtitle="Active Workspace"
            badge="WORKSPACE"
            icon="folder"
            color="purple"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="On Track"
            :value="onTrackProjects"
            :subtitle="`${totalProjects ? Math.round((onTrackProjects / totalProjects) * 100) : 0}% of total`"
            badge="ON TRACK"
            icon="check_circle"
            color="green"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="At Risk"
            :value="atRiskProjects"
            :subtitle="`${totalProjects ? Math.round((atRiskProjects / totalProjects) * 100) : 0}% of total`"
            badge="AT RISK"
            icon="warning_amber"
            color="orange"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <StatCard
            title="Delayed"
            :value="delayedProjects"
            :subtitle="`${totalProjects ? Math.round((delayedProjects / totalProjects) * 100) : 0}% of total`"
            badge="URGENT"
            icon="schedule"
            color="red"
            :negative="delayedProjects > 0"
          />
        </div>
      </div>

      <!-- 3. TODAY'S FOCUS / FEATURED PROJECT HERO CARD (PRESERVING /projects/todays_focus_hero.jpg IMAGE BACKGROUND) -->
      <div class="q-mb-lg">
        <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders overflow-hidden">
          <div v-if="featuredProject" class="row">
            <!-- Left Side: Hero Workspace Image Container with Overlaid Text & Actions -->
            <div
              class="col-12 col-md-7 q-pa-lg text-white row column justify-between"
              :style="{
                backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.3) 100%), url('/projects/todays_focus_hero.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '280px',
              }"
            >
              <div>
                <div class="row items-center justify-between q-mb-md">
                  <q-chip dense color="white" text-color="purple-9" class="text-weight-bold">
                    ✦ TODAY'S FOCUS
                  </q-chip>
                  <q-btn
                    round
                    flat
                    dense
                    icon="play_arrow"
                    color="white"
                    title="View Project"
                    @click="goToProject(featuredProject.project_id)"
                  />
                </div>

                <h2
                  class="text-h5 text-weight-bold q-ma-none q-mb-xs"
                  :title="featuredProject.name"
                >
                  {{ featuredProject.name }}
                </h2>
                <p class="text-body2 text-white-8 q-mb-md">
                  {{
                    featuredProject.description ||
                    'Deliver project milestones on schedule, coordinate with assigned resources, and review open deliverables.'
                  }}
                </p>
              </div>

              <div class="row items-center justify-between">
                <q-btn
                  unelevated
                  no-caps
                  label="View Project"
                  icon-right="arrow_forward"
                  color="white"
                  text-color="primary"
                  class="text-weight-bold"
                  @click="goToProject(featuredProject.project_id)"
                />
                <div class="row items-center q-gutter-xs gt-xs">
                  <q-chip dense color="black" text-color="amber-4" icon="flag">Core Focus</q-chip>
                  <q-chip dense color="black" text-color="green-4" icon="trending_up">
                    {{ Number(featuredProject.progress) || 0 }}% Done
                  </q-chip>
                </div>
              </div>
            </div>

            <!-- Right Side: Structured Metadata Panel -->
            <div
              class="col-12 col-md-5 q-pa-lg row column justify-between border-left-subtle bg-card text-main"
            >
              <div>
                <div class="row items-center justify-between q-mb-sm">
                  <span class="text-caption text-weight-bolder text-grey-6">PROJECT DETAILS</span>
                  <q-chip
                    dense
                    square
                    :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                    :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                    class="text-weight-bold"
                  >
                    {{ getHealthLabel(featuredProject) }}
                  </q-chip>
                </div>

                <!-- 4-Box Metadata Grid -->
                <div class="row q-col-gutter-xs q-mb-md">
                  <div class="col-6 q-pa-xs">
                    <div class="q-pa-sm rounded-borders border-subtle bg-subtle">
                      <div class="text-caption text-grey-6">HEALTH</div>
                      <div
                        class="text-weight-bold"
                        :class="`text-${getProjectHealth(featuredProject).toLowerCase()}`"
                      >
                        {{ getHealthLabel(featuredProject) }}
                      </div>
                    </div>
                  </div>
                  <div class="col-6 q-pa-xs">
                    <div class="q-pa-sm rounded-borders border-subtle bg-subtle">
                      <div class="text-caption text-grey-6">STATUS</div>
                      <div class="text-weight-bold text-main">
                        {{ formatStatus(featuredProject.status) }}
                      </div>
                    </div>
                  </div>
                  <div class="col-6 q-pa-xs">
                    <div class="q-pa-sm rounded-borders border-subtle bg-subtle">
                      <div class="text-caption text-grey-6">DEADLINE</div>
                      <div class="text-weight-bold text-main">
                        {{ formatDate(featuredProject.deadline) }}
                      </div>
                    </div>
                  </div>
                  <div class="col-6 q-pa-xs">
                    <div class="q-pa-sm rounded-borders border-subtle bg-subtle">
                      <div class="text-caption text-grey-6">PRIORITY</div>
                      <div class="text-weight-bold text-main">{{ featuredProject.priority }}</div>
                    </div>
                  </div>
                </div>

                <!-- Completion Progress Bar -->
                <div>
                  <div
                    class="row items-center justify-between text-caption text-weight-bold q-mb-xs"
                  >
                    <span>Project Completion</span>
                    <span>{{ Number(featuredProject.progress) || 0 }}%</span>
                  </div>
                  <q-linear-progress
                    rounded
                    size="8px"
                    :value="Math.min(100, Math.max(0, Number(featuredProject.progress) || 0)) / 100"
                    color="primary"
                    :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                  />
                </div>
              </div>

              <!-- Footer Tags -->
              <div class="row items-center justify-between text-caption text-grey-6 q-mt-sm">
                <span>Targets: Scheduled Delivery, Quality Review</span>
              </div>
            </div>
          </div>

          <!-- Empty Focus State -->
          <div v-else class="q-pa-xl text-center">
            <q-avatar size="60px" color="purple-1" text-color="primary" class="q-mb-sm">
              <q-icon name="folder_open" size="30px" />
            </q-avatar>
            <div class="text-h6 text-weight-bold">No projects available</div>
            <p class="text-caption text-grey-6">
              Create your first project to start planning your team's workflow and focus.
            </p>
            <q-btn
              unelevated
              no-caps
              label="Create New Project"
              icon="add"
              color="primary"
              @click="showCreateDialog = true"
            />
          </div>
        </q-card>
      </div>

      <!-- 4. SECONDARY DASHBOARD WIDGETS (Health Donut, Upcoming Deadlines) -->
      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Project Health Distribution (5 cols) -->
        <div class="col-12 col-md-5">
          <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders full-height">
            <q-card-section class="row items-center justify-between q-pb-xs">
              <div>
                <div class="text-subtitle1 text-weight-bold">Project Health</div>
                <div class="text-caption text-grey-6">Delivery status balance</div>
              </div>
              <q-chip
                dense
                :color="$q.dark.isActive ? 'grey-9' : 'grey-2'"
                :text-color="$q.dark.isActive ? 'white' : 'dark'"
              >
                {{ totalProjects }} Total
              </q-chip>
            </q-card-section>

            <q-card-section class="row items-center justify-around">
              <!-- SVG Donut Chart -->
              <div style="position: relative; width: 120px; height: 120px">
                <svg
                  viewBox="0 0 120 120"
                  style="width: 100%; height: 100%; transform: rotate(-90deg)"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    :stroke="$q.dark.isActive ? '#333' : '#F1F3F7'"
                    stroke-width="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#34D399"
                    stroke-width="12"
                    :stroke-dasharray="healthDonut.onTrackDash"
                    :stroke-dashoffset="healthDonut.onTrackOffset"
                    stroke-linecap="round"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#FB923C"
                    stroke-width="12"
                    :stroke-dasharray="healthDonut.atRiskDash"
                    :stroke-dashoffset="healthDonut.atRiskOffset"
                    stroke-linecap="round"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#FB7185"
                    stroke-width="12"
                    :stroke-dasharray="healthDonut.delayedDash"
                    :stroke-dashoffset="healthDonut.delayedOffset"
                    stroke-linecap="round"
                  />
                </svg>
                <div
                  style="position: absolute; inset: 0"
                  class="column items-center justify-center"
                >
                  <div class="text-subtitle1 text-weight-bolder">{{ onTrackRatio }}%</div>
                  <div class="text-caption text-grey-6" style="font-size: 10px">On Track</div>
                </div>
              </div>

              <!-- Health Legend -->
              <div class="column q-gutter-xs">
                <div class="row items-center justify-between gap-md" style="min-width: 140px">
                  <div class="row items-center q-gutter-xs">
                    <span
                      style="width: 8px; height: 8px; border-radius: 50%; background: #34d399"
                    />
                    <span class="text-caption">On Track</span>
                  </div>
                  <span class="text-caption text-weight-bold">{{ onTrackProjects }}</span>
                </div>
                <div class="row items-center justify-between gap-md" style="min-width: 140px">
                  <div class="row items-center q-gutter-xs">
                    <span
                      style="width: 8px; height: 8px; border-radius: 50%; background: #fb923c"
                    />
                    <span class="text-caption">At Risk</span>
                  </div>
                  <span class="text-caption text-weight-bold">{{ atRiskProjects }}</span>
                </div>
                <div class="row items-center justify-between gap-md" style="min-width: 140px">
                  <div class="row items-center q-gutter-xs">
                    <span
                      style="width: 8px; height: 8px; border-radius: 50%; background: #fb7185"
                    />
                    <span class="text-caption">Delayed</span>
                  </div>
                  <span class="text-caption text-weight-bold">{{ delayedProjects }}</span>
                </div>
              </div>
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
              <span class="text-caption text-grey-6"
                >{{ upcomingDeadlinesList.length }} scheduled</span
              >
            </q-card-section>

            <q-card-section>
              <div
                v-if="upcomingDeadlinesList.length === 0"
                class="q-pa-md text-center text-grey-6"
              >
                <q-icon name="event_available" size="32px" />
                <div class="q-mt-xs">No upcoming project deadlines</div>
              </div>

              <div v-else class="column q-gutter-xs">
                <div
                  v-for="item in upcomingDeadlinesList"
                  :key="item.project.project_id"
                  class="row items-center justify-between q-pa-sm rounded-borders cursor-pointer"
                  :class="$q.dark.isActive ? 'hover-bg-dark' : 'hover-bg-light'"
                  @click="goToProject(item.project.project_id)"
                >
                  <div class="row items-center q-gutter-md">
                    <!-- Date Badge -->
                    <div
                      class="column items-center justify-center rounded-borders q-px-xs q-py-xs"
                      style="min-width: 44px"
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

                    <div>
                      <div class="row items-center q-gutter-xs">
                        <span class="text-weight-bold">{{ item.project.name }}</span>
                        <q-chip
                          dense
                          square
                          size="xs"
                          :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                          :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                        >
                          {{ getHealthLabel(item.project) }}
                        </q-chip>
                      </div>
                      <div class="text-caption text-grey-6">
                        {{ item.relativeText }} • {{ Number(item.project.progress) || 0 }}%
                        completed
                      </div>
                    </div>
                  </div>

                  <q-icon name="chevron_right" color="grey-6" />
                </div>
              </div>
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
                  type="date"
                  label="Start Date"
                  :dark="$q.dark.isActive"
                  stack-label
                />
              </div>

              <div class="col-6 col-md-2">
                <q-input
                  v-model="endDateFilter"
                  outlined
                  dense
                  type="date"
                  label="End Date"
                  :dark="$q.dark.isActive"
                  stack-label
                />
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
              <div v-for="group in groupedProjectCards" :key="group.label || 'all'" class="q-mb-md">
                <div v-if="group.label" class="row items-center q-gutter-xs q-mb-sm">
                  <q-icon name="category" size="16px" color="primary" />
                  <span class="text-subtitle2 text-weight-bold">{{ group.label }}</span>
                  <q-chip dense size="sm" color="purple-1" text-color="primary">{{
                    group.projects.length
                  }}</q-chip>
                </div>

                <div class="row q-col-gutter-lg">
                  <div
                    v-for="(project, index) in group.projects"
                    :key="project.project_id"
                    class="col-12 col-sm-6 col-md-4"
                  >
                    <q-card
                      flat
                      bordered
                      :dark="$q.dark.isActive"
                      class="project-grid-card cursor-pointer full-height row column justify-between"
                      @click="goToProject(project.project_id)"
                    >
                      <!-- Card Header with Soft Pastel / Vibrant Gradient (Image 4 Style) -->
                      <div
                        class="text-white q-px-lg q-pt-lg q-pb-md relative-position overflow-hidden"
                        :style="{
                          background: getProjectTheme(project, index).gradient,
                        }"
                      >
                        <div class="row items-center justify-between no-wrap q-mb-sm">
                          <q-avatar
                            size="32px"
                            color="white"
                            :style="{ color: getProjectTheme(project, index).accent }"
                            class="shadow-1"
                          >
                            <q-icon :name="getProjectTheme(project, index).iconName" size="18px" />
                          </q-avatar>

                          <div class="row items-center q-gutter-xs no-wrap">
                            <span class="priority-frosted-pill">
                              {{ project.priority || 'Medium' }}
                            </span>
                            <q-btn
                              flat
                              round
                              dense
                              icon="more_vert"
                              color="white"
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
                          class="text-subtitle1 text-weight-bold ellipsis text-white"
                          :title="project.name"
                        >
                          {{ project.name }}
                        </div>
                        <div
                          class="text-caption text-white-8 ellipsis-2-lines q-mt-xs"
                          style="line-height: 1.35"
                        >
                          {{
                            project.description ||
                            'Sprint deliverables, task assignments, and progress tracking.'
                          }}
                        </div>
                      </div>

                      <!-- Card Body -->
                      <q-card-section class="q-pa-md column justify-between col">
                        <!-- Dual Pill Info Badges (like Image 4) -->
                        <div class="row q-col-gutter-xs q-mb-md">
                          <div class="col-6">
                            <div
                              class="row items-center no-wrap gap-xs q-px-sm q-py-xs rounded-borders text-caption text-grey-7 border-subtle bg-subtle"
                            >
                              <q-icon name="assignment" size="13px" color="grey-6" />
                              <div class="ellipsis">
                                <span>Status: </span>
                                <strong class="text-main">{{
                                  formatStatus(project.status)
                                }}</strong>
                              </div>
                            </div>
                          </div>
                          <div class="col-6">
                            <div
                              class="row items-center no-wrap gap-xs q-px-sm q-py-xs rounded-borders text-caption text-grey-7 border-subtle bg-subtle"
                            >
                              <q-icon name="event" size="13px" color="grey-6" />
                              <div class="ellipsis">
                                <span>Due: </span>
                                <strong class="text-main">{{
                                  formatDate(project.deadline)
                                }}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Progress Bar with matching theme color -->
                        <div class="q-mb-md">
                          <div class="row items-center justify-between text-caption q-mb-xs">
                            <span class="text-grey-6 text-weight-medium">Progress</span>
                            <span
                              class="text-weight-bold"
                              :style="{ color: getProjectTheme(project, index).accent }"
                            >
                              {{ Number(project.progress) || 0 }}%
                            </span>
                          </div>
                          <q-linear-progress
                            rounded
                            size="6px"
                            :value="Math.min(100, Math.max(0, Number(project.progress) || 0)) / 100"
                            :style="{ color: getProjectTheme(project, index).accent }"
                            :track-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                          />
                        </div>

                        <!-- Health Footer -->
                        <div class="row items-center justify-between">
                          <span class="text-caption text-grey-6">Health</span>
                          <q-chip
                            dense
                            square
                            :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
                            :text-color="$q.dark.isActive ? 'purple-2' : 'primary'"
                            class="text-weight-bold"
                          >
                            {{ getHealthLabel(project) }}
                          </q-chip>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TABLE VIEW -->
          <q-table
            v-else
            v-model:selected="selectedProjects"
            flat
            :dark="$q.dark.isActive"
            :rows="filteredProjects"
            :columns="projectColumns"
            row-key="project_id"
            selection="multiple"
            :loading="loading"
            :pagination="pagination"
            :rows-per-page-options="[8, 16, 24]"
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
                    {{ currentPmName.charAt(0).toUpperCase() }}
                  </q-avatar>
                  <span>{{ currentPmName }}</span>
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
                  <span class="text-caption text-weight-bold"
                    >{{ Number(props.row.progress) || 0 }}%</span
                  >
                </div>
              </q-td>
            </template>

            <template #body-cell-start_date="props">
              <q-td :props="props">{{ formatDate(props.row.start_date) }}</q-td>
            </template>

            <template #body-cell-deadline="props">
              <q-td :props="props">{{ formatDate(props.row.deadline) }}</q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" auto-width>
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
        </q-card>
      </div>

      <!-- 6. INSIGHTS STRIP -->
      <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders q-pa-md">
        <div class="row q-col-gutter-md items-center justify-around text-center">
          <div class="row items-center q-gutter-sm">
            <q-avatar size="36px" color="green-1" text-color="green"
              ><q-icon name="trending_up"
            /></q-avatar>
            <div class="text-left">
              <div class="text-caption text-grey-6">Highest Progress</div>
              <div class="text-subtitle1 text-weight-bolder">
                {{ Math.max(...projects.map((p) => Number(p.progress) || 0), 0) }}%
              </div>
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-avatar size="36px" color="purple-1" text-color="primary"
              ><q-icon name="pie_chart"
            /></q-avatar>
            <div class="text-left">
              <div class="text-caption text-grey-6">Average Progress</div>
              <div class="text-subtitle1 text-weight-bolder">{{ completionAverage }}%</div>
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-avatar size="36px" color="orange-1" text-color="orange"
              ><q-icon name="priority_high"
            /></q-avatar>
            <div class="text-left">
              <div class="text-caption text-grey-6">Projects Needing Attention</div>
              <div class="text-subtitle1 text-weight-bolder">
                {{ atRiskProjects + delayedProjects }}
              </div>
            </div>
          </div>
        </div>
      </q-card>
    </div>

    <!-- CREATE PROJECT DIALOG -->
    <q-dialog v-model="showCreateDialog">
      <q-card :dark="$q.dark.isActive" style="min-width: 450px" class="rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-caption text-primary text-weight-bold">NEW PROJECT</div>
            <div class="text-h6 text-weight-bold">Create a project</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleCreateProject">
          <q-card-section class="column q-gutter-y-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="form.name"
                  outlined
                  dense
                  label="Project name"
                  :dark="$q.dark.isActive"
                  :rules="[(val) => !!val.trim() || 'Project name is required']"
                />
              </div>
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="form.description"
                  outlined
                  dense
                  type="textarea"
                  label="Description"
                  autogrow
                  :dark="$q.dark.isActive"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select
                  v-model="form.status"
                  outlined
                  dense
                  label="Status"
                  :options="statusOptions"
                  emit-value
                  map-options
                  :dark="$q.dark.isActive"
                />
              </div>
              <div class="col-6">
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
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="form.start_date"
                  outlined
                  dense
                  type="date"
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
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="form.deadline"
                  outlined
                  dense
                  type="date"
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
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
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
      title="Delete Project"
      subtitle="This action cannot be undone"
      confirm-label="Delete Project"
      :loading="deletingProject"
      @confirm="handleExecuteDeleteProject"
    >
      Are you sure you want to delete project <strong>"{{ projectToDelete?.name }}"</strong>? All
      associated tasks, dependencies, and team assignments will be permanently removed.
    </ConfirmActionDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import StatCard from '@/components/dashboard/StatCard.vue';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog.vue';
import { formatDate, formatStatus } from '@/utils/formatters';
import { createProjectApi, deleteProjectApi, getProjectsApi } from '@/services/api';
import type { CreateProjectPayload, Project, ProjectPriority, ProjectStatus } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

function goToProject(projectId: number) {
  void router.push(`/pm/projects/${projectId}`);
}

const projects = ref<Project[]>([]);
const loading = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const startDateFilter = ref('');
const endDateFilter = ref('');

const showDeleteDialog = ref(false);
const deletingProject = ref(false);
const projectToDelete = ref<Project | null>(null);

function confirmDeleteProject(project: Project) {
  projectToDelete.value = project;
  showDeleteDialog.value = true;
}

async function handleExecuteDeleteProject() {
  if (!projectToDelete.value) return;

  deletingProject.value = true;
  try {
    await deleteProjectApi(projectToDelete.value.project_id);
    $q.notify({
      type: 'positive',
      message: `Project "${projectToDelete.value.name}" deleted successfully`,
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
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  deadline: string;
}

const form = reactive<ProjectForm>({
  name: '',
  description: '',
  status: 'DRAFT',
  priority: 'MEDIUM',
  start_date: '',
  deadline: '',
});

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

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

const pagination = ref({
  page: 1,
  rowsPerPage: 8,
  sortBy: '',
  descending: false,
});

const statusFilterOptions = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
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
    field: () => currentPmName.value,
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

export interface ProjectCardTheme {
  id: string;
  name: string;
  gradient: string;
  accent: string;
  bgTint: string;
  iconName: string;
}

const PROJECT_THEMES: ProjectCardTheme[] = [
  {
    id: 'sky',
    name: 'Product Blue',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    accent: '#0284c7',
    bgTint: '#f0f9ff',
    iconName: 'web',
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    gradient: 'linear-gradient(135deg, #db2777 0%, #f43f5e 100%)',
    accent: '#db2777',
    bgTint: '#fdf2f8',
    iconName: 'auto_awesome',
  },
  {
    id: 'amber',
    name: 'Golden Orange',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
    accent: '#ea580c',
    bgTint: '#fff7ed',
    iconName: 'diamond',
  },
  {
    id: 'purple',
    name: 'Lavender Purple',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    accent: '#7c3aed',
    bgTint: '#f5f3ff',
    iconName: 'groups',
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    accent: '#059669',
    bgTint: '#ecfdf5',
    iconName: 'spa',
  },
  {
    id: 'indigo',
    name: 'Indigo Blue',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
    accent: '#4f46e5',
    bgTint: '#eef2ff',
    iconName: 'layers',
  },
];

function getProjectTheme(project: Project, index?: number): ProjectCardTheme {
  const idNum = Number(project.project_id) || (index !== undefined ? index : 0);
  const themeIndex = Math.abs(idNum) % PROJECT_THEMES.length;
  return PROJECT_THEMES[themeIndex] || (PROJECT_THEMES[0] as ProjectCardTheme);
}

function getProjectHealth(project: Project) {
  if (project.status === 'COMPLETED') return 'ON_TRACK';

  if (project.deadline) {
    const deadline = new Date(project.deadline);
    const today = new Date();

    if (deadline < today) {
      return 'DELAYED';
    }
  }

  const progress = Number(project.progress) || 0;

  if (progress < 30) return 'AT_RISK';

  return 'ON_TRACK';
}

function getHealthLabel(project: Project) {
  const health = getProjectHealth(project);

  if (health === 'AT_RISK') return 'At Risk';
  if (health === 'DELAYED') return 'Delayed';

  return 'On Track';
}

const filteredProjects = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return projects.value.filter((project) => {
    const matchesSearch =
      !query ||
      project.name.toLowerCase().includes(query) ||
      (project.description ?? '').toLowerCase().includes(query);

    const matchesStatus = statusFilter.value === 'ALL' || project.status === statusFilter.value;

    const health = getProjectHealth(project);

    const matchesHealth = healthFilter.value === 'ALL' || health === healthFilter.value;

    let matchesStartDate = true;
    if (startDateFilter.value && project.start_date) {
      matchesStartDate = new Date(project.start_date) >= new Date(startDateFilter.value);
    }

    let matchesEndDate = true;
    if (endDateFilter.value && project.deadline) {
      matchesEndDate = new Date(project.deadline) <= new Date(endDateFilter.value);
    }

    return matchesSearch && matchesStatus && matchesHealth && matchesStartDate && matchesEndDate;
  });
});

const groupedProjectCards = computed(() => {
  if (groupBy.value === 'Status') {
    const map = new Map<string, Project[]>();
    for (const p of filteredProjects.value) {
      const s = formatStatus(p.status);
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(p);
    }
    return Array.from(map.entries()).map(([label, projs]) => ({ label, projects: projs }));
  }

  if (groupBy.value === 'Health') {
    const map = new Map<string, Project[]>();
    for (const p of filteredProjects.value) {
      const h = getHealthLabel(p);
      if (!map.has(h)) map.set(h, []);
      map.get(h)!.push(p);
    }
    return Array.from(map.entries()).map(([label, projs]) => ({ label, projects: projs }));
  }

  return [{ label: '', projects: filteredProjects.value }];
});

const totalProjects = computed(() => projects.value.length);

const onTrackProjects = computed(
  () => projects.value.filter((project) => getProjectHealth(project) === 'ON_TRACK').length,
);

const atRiskProjects = computed(
  () => projects.value.filter((project) => getProjectHealth(project) === 'AT_RISK').length,
);

const delayedProjects = computed(
  () => projects.value.filter((project) => getProjectHealth(project) === 'DELAYED').length,
);

const completionAverage = computed(() => {
  if (!projects.value.length) return 0;

  const total = projects.value.reduce((sum, project) => sum + Number(project.progress || 0), 0);

  return Math.round(total / projects.value.length);
});

const onTrackRatio = computed(() => {
  if (!totalProjects.value) return 0;
  return Math.round((onTrackProjects.value / totalProjects.value) * 100);
});

const featuredProject = computed(() => {
  if (!projects.value.length) return null;

  const activeWithDeadline = projects.value
    .filter((p) => (p.status === 'ACTIVE' || p.status === 'PUBLISHED') && !!p.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  if (activeWithDeadline.length > 0) return activeWithDeadline[0];

  const activeProjects = projects.value.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'PUBLISHED',
  );
  if (activeProjects.length > 0) return activeProjects[0];

  return projects.value[0];
});

const CIRCUMFERENCE = 289.02;
const healthDonut = computed(() => {
  const total = totalProjects.value || 1;
  const onTrackLen = (onTrackProjects.value / total) * CIRCUMFERENCE;
  const atRiskLen = (atRiskProjects.value / total) * CIRCUMFERENCE;
  const delayedLen = (delayedProjects.value / total) * CIRCUMFERENCE;

  return {
    onTrackDash: `${Math.max(0, onTrackLen - 2)} ${CIRCUMFERENCE}`,
    onTrackOffset: '0',
    atRiskDash: `${Math.max(0, atRiskLen - 2)} ${CIRCUMFERENCE}`,
    atRiskOffset: `-${onTrackLen}`,
    delayedDash: `${Math.max(0, delayedLen - 2)} ${CIRCUMFERENCE}`,
    delayedOffset: `-${onTrackLen + atRiskLen}`,
  };
});

const upcomingDeadlinesList = computed(() => {
  return [...projects.value]
    .filter((p) => !!p.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4)
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
    projects.value = await getProjectsApi();
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
      status: form.status,
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
  form.status = 'DRAFT';
  form.priority = 'MEDIUM';
  form.start_date = '';
  form.deadline = '';
}

onMounted(() => {
  void loadProjects();
});
</script>

<style scoped lang="scss">
.project-grid-card {
  border-radius: 16px;
  transition:
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.22s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    border-color: var(--wo-primary, #8b6fd8) !important;
  }
}

.priority-frosted-pill {
  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 255, 255, 0.35);
}
</style>
