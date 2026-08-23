<template>
  <q-page class="pm-page projects-page">
    <div class="projects-dashboard-container">
      <!-- 1. PAGE HEADER & GREETING -->
      <div class="dashboard-header-row row items-center justify-between">
        <div class="header-titles">
          <div class="greeting-badge">
            <span class="sparkle-icon">✦</span>
            <span>Project Management</span>
          </div>
          <h1 class="dashboard-title">Hey, {{ currentPmName }}!</h1>
          <p class="dashboard-subtitle">
            Plan, track, and manage everything your team is working on with complete clarity.
          </p>
        </div>

        <div class="header-actions row items-center q-gutter-sm">
          <q-btn
            unelevated
            no-caps
            icon="add"
            label="New Project"
            class="action-btn-primary"
            @click="showCreateDialog = true"
          />
        </div>
      </div>

      <!-- 2. SUMMARY / KPI STATS GRID (4 Widgets) -->
      <div class="stats-grid">
        <StatCard
          title="Total Projects"
          :value="totalProjects"
          subtitle="Active Workspace"
          icon="folder"
          color="purple"
          note-class="note-purple"
        />

        <StatCard
          title="On Track"
          :value="onTrackProjects"
          :subtitle="`${totalProjects ? Math.round((onTrackProjects / totalProjects) * 100) : 0}% of total`"
          icon="check_circle"
          color="green"
          note-class="note-green"
        />

        <StatCard
          title="At Risk"
          :value="atRiskProjects"
          :subtitle="`${totalProjects ? Math.round((atRiskProjects / totalProjects) * 100) : 0}% of total`"
          icon="warning_amber"
          color="orange"
          note-class="note-orange"
        />

        <StatCard
          title="Delayed"
          :value="delayedProjects"
          :subtitle="`${totalProjects ? Math.round((delayedProjects / totalProjects) * 100) : 0}% of total`"
          icon="schedule"
          color="red"
          note-class="note-red"
          :negative="delayedProjects > 0"
        />
      </div>

      <!-- 3. TODAY'S FOCUS / FEATURED PROJECT HERO CARD (Visual Hero on Left + Text Overlay) -->
      <div class="section-row">
        <q-card flat bordered class="featured-hero-card">
          <div v-if="featuredProject" class="featured-card-layout">
            <!-- Left Side: Hero Workspace Image Container with Overlaid Text & Actions -->
            <div class="hero-image-overlay-box">
              <!-- Top Badge Row -->
              <div class="hero-overlay-top">
                <div class="hero-focus-pill">
                  <span class="sparkle-dot">✦</span>
                  <span>TODAY'S FOCUS</span>
                </div>
                <div class="hero-play-bubble" title="View Project" @click="goToProject(featuredProject.project_id)">
                  <q-icon name="play_arrow" size="20px" class="text-purple" />
                </div>
              </div>

              <!-- Center/Middle: Overlaid Project Name & Description -->
              <div class="hero-overlay-middle">
                <h2 class="hero-project-title" :title="featuredProject.name">
                  {{ featuredProject.name }}
                </h2>
                <p class="hero-project-desc">
                  {{ featuredProject.description || 'Deliver project milestones on schedule, coordinate with assigned resources, and review open deliverables.' }}
                </p>
              </div>

              <!-- Bottom: Primary Action CTA & Suggested Tags -->
              <div class="hero-overlay-bottom">
                <q-btn
                  unelevated
                  no-caps
                  label="View Project"
                  icon-right="arrow_forward"
                  class="hero-cta-btn"
                  @click="goToProject(featuredProject.project_id)"
                />
                <div class="hero-tags-row gt-xs">
                  <span class="hero-tag-chip">
                    <q-icon name="flag" size="13px" color="amber-4" />
                    <span>Core Focus</span>
                  </span>
                  <span class="hero-tag-chip">
                    <q-icon name="trending_up" size="13px" color="green-4" />
                    <span>{{ Number(featuredProject.progress) || 0 }}% Done</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Right Side: Compact Structured Project Metadata Panel -->
            <div class="hero-supporting-panel">
              <div class="panel-header-row">
                <span class="panel-header-label">PROJECT DETAILS</span>
                <q-chip
                  dense
                  square
                  :class="['health-chip', `health-${getProjectHealth(featuredProject).toLowerCase()}`]"
                >
                  {{ getHealthLabel(featuredProject) }}
                </q-chip>
              </div>

              <!-- 4-Box Metadata Grid -->
              <div class="panel-meta-grid">
                <div class="panel-meta-item">
                  <span class="meta-item-label">HEALTH</span>
                  <span class="meta-item-val" :class="`text-${getProjectHealth(featuredProject).toLowerCase()}`">
                    {{ getHealthLabel(featuredProject) }}
                  </span>
                </div>

                <div class="panel-meta-item">
                  <span class="meta-item-label">STATUS</span>
                  <span class="meta-item-val">{{ formatStatus(featuredProject.status) }}</span>
                </div>

                <div class="panel-meta-item">
                  <span class="meta-item-label">DEADLINE</span>
                  <span class="meta-item-val">{{ formatDate(featuredProject.deadline) }}</span>
                </div>

                <div class="panel-meta-item">
                  <span class="meta-item-label">PRIORITY</span>
                  <span class="meta-item-val">{{ featuredProject.priority }}</span>
                </div>
              </div>

              <!-- Completion Progress Bar -->
              <div class="panel-progress-wrapper">
                <div class="panel-progress-header">
                  <span class="progress-title">Project Completion</span>
                  <span class="progress-percent">{{ Number(featuredProject.progress) || 0 }}%</span>
                </div>
                <div class="panel-progress-track">
                  <div
                    class="panel-progress-fill"
                    :style="{ width: `${Math.min(100, Math.max(0, Number(featuredProject.progress) || 0))}%` }"
                  />
                </div>
              </div>

              <!-- Supporting Milestone Tags -->
              <div class="panel-footer-tags">
                <span class="footer-tag-label">Milestone targets:</span>
                <div class="row items-center gap-xs">
                  <div class="panel-tag-item">
                    <q-icon name="schedule" size="13px" color="primary" />
                    <span>Scheduled Delivery</span>
                  </div>
                  <div class="panel-tag-item">
                    <q-icon name="check_circle" size="13px" color="teal" />
                    <span>Quality Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Focus State if No Projects Available -->
          <div v-else class="focus-empty-state">
            <q-avatar size="60px" class="bg-purple-tint text-purple q-mb-sm">
              <q-icon name="folder_open" size="30px" />
            </q-avatar>
            <div class="empty-title">No projects available</div>
            <p class="empty-sub">Create your first project to start planning your team's workflow and focus.</p>
            <q-btn
              unelevated
              no-caps
              label="Create New Project"
              icon="add"
              class="action-btn-primary q-mt-xs"
              @click="showCreateDialog = true"
            />
          </div>
        </q-card>
      </div>

      <!-- 4. SECONDARY DASHBOARD WIDGETS (Health Donut, Upcoming Deadlines) -->
      <div class="row q-col-gutter-lg section-row">
        <!-- Project Health Distribution (40%) -->
        <div class="col-12 col-md-5">
          <q-card flat bordered class="dashboard-widget-card health-distribution-card">
            <q-card-section class="widget-header">
              <div>
                <div class="widget-title">Project Health</div>
                <div class="widget-sub">Delivery status balance</div>
              </div>
              <q-chip dense class="health-summary-chip">
                {{ totalProjects }} Total
              </q-chip>
            </q-card-section>

            <q-card-section class="health-visual-section">
              <!-- Donut Ring Chart with Clean SVG -->
              <div class="donut-chart-container">
                <svg viewBox="0 0 120 120" class="donut-svg">
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#F1F3F7"
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
                    class="donut-segment"
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
                    class="donut-segment"
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
                    class="donut-segment"
                  />
                </svg>
                <div class="donut-center-label">
                  <div class="center-val">{{ onTrackRatio }}%</div>
                  <div class="center-sub">On Track</div>
                </div>
              </div>

              <!-- Health Legend List -->
              <div class="health-legend-list">
                <div class="legend-row">
                  <div class="legend-label-col">
                    <span class="legend-bullet bullet-green" />
                    <span class="legend-name">On Track</span>
                  </div>
                  <div class="legend-stats-col">
                    <span class="legend-count">{{ onTrackProjects }}</span>
                    <span class="legend-pct">({{ totalProjects ? Math.round((onTrackProjects / totalProjects) * 100) : 0 }}%)</span>
                  </div>
                </div>

                <div class="legend-row">
                  <div class="legend-label-col">
                    <span class="legend-bullet bullet-orange" />
                    <span class="legend-name">At Risk</span>
                  </div>
                  <div class="legend-stats-col">
                    <span class="legend-count">{{ atRiskProjects }}</span>
                    <span class="legend-pct">({{ totalProjects ? Math.round((atRiskProjects / totalProjects) * 100) : 0 }}%)</span>
                  </div>
                </div>

                <div class="legend-row">
                  <div class="legend-label-col">
                    <span class="legend-bullet bullet-red" />
                    <span class="legend-name">Delayed</span>
                  </div>
                  <div class="legend-stats-col">
                    <span class="legend-count">{{ delayedProjects }}</span>
                    <span class="legend-pct">({{ totalProjects ? Math.round((delayedProjects / totalProjects) * 100) : 0 }}%)</span>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Upcoming Deadlines (60%) -->
        <div class="col-12 col-md-7">
          <q-card flat bordered class="dashboard-widget-card">
            <q-card-section class="widget-header">
              <div>
                <div class="widget-title">Upcoming Deadlines</div>
                <div class="widget-sub">Chronological milestone schedule</div>
              </div>
              <span class="text-caption text-grey-6">{{ upcomingDeadlinesList.length }} scheduled</span>
            </q-card-section>

            <q-card-section class="deadlines-list-section">
              <div v-if="upcomingDeadlinesList.length === 0" class="deadlines-empty-state">
                <q-icon name="event_available" size="32px" color="grey-5" />
                <span class="q-mt-xs">No upcoming project deadlines</span>
              </div>

              <div v-else class="deadlines-list">
                <div
                  v-for="item in upcomingDeadlinesList"
                  :key="item.project.project_id"
                  class="deadline-row cursor-pointer"
                  @click="goToProject(item.project.project_id)"
                >
                  <!-- Date Badge Box -->
                  <div class="date-badge-box">
                    <span class="date-month">{{ item.month }}</span>
                    <span class="date-day">{{ item.day }}</span>
                  </div>

                  <!-- Project Info -->
                  <div class="deadline-info">
                    <div class="deadline-name-row">
                      <span class="deadline-project-name" :title="item.project.name">{{ item.project.name }}</span>
                      <q-chip
                        dense
                        square
                        :class="['health-chip', `health-${getProjectHealth(item.project).toLowerCase()}`]"
                      >
                        {{ getHealthLabel(item.project) }}
                      </q-chip>
                    </div>
                    <div class="deadline-sub-row">
                      <span class="deadline-relative">{{ item.relativeText }}</span>
                      <span class="deadline-progress">{{ Number(item.project.progress) || 0 }}% completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 5. ACTIVE PROJECTS EXPLORER (Toolbar + Cards / Table View) -->
      <div class="projects-explorer-section section-row">
        <q-card flat bordered class="table-card">
          <!-- Toolbar Header -->
          <q-card-section class="table-toolbar row items-center justify-between">
            <div class="toolbar-left-title row items-center gap-sm">
              <span class="toolbar-title">Active Projects</span>
              <q-badge color="deep-purple-1" text-color="primary" class="q-px-sm q-py-xs text-weight-bold">
                {{ filteredProjects.length }} Projects
              </q-badge>
            </div>

            <div class="toolbar-actions row items-center q-gutter-sm">
              <q-select
                v-model="groupBy"
                dense
                outlined
                options-dense
                :options="['None', 'Status', 'Health']"
                label="Group by"
                class="toolbar-select"
              />

              <q-btn-toggle
                v-model="viewMode"
                unelevated
                dense
                toggle-color="primary"
                toggle-text-color="white"
                color="transparent"
                text-color="grey-7"
                class="view-segmented-toggle"
                :options="[
                  { icon: 'grid_view', value: 'cards' },
                  { icon: 'format_list_bulleted', value: 'table' },
                ]"
              />
            </div>
          </q-card-section>

          <!-- Filter Search & Selects Bar -->
          <q-card-section class="filter-toolbar-section">
            <div class="filter-grid-row">
              <q-input
                v-model="searchQuery"
                outlined
                dense
                clearable
                placeholder="Search projects..."
                class="filter-search-input"
              >
                <template #prepend>
                  <q-icon name="search" size="18px" color="grey-6" />
                </template>
              </q-input>

              <q-select
                v-model="statusFilter"
                outlined
                dense
                emit-value
                map-options
                :options="statusFilterOptions"
                label="Status"
                class="filter-select-item"
              />

              <q-select
                v-model="healthFilter"
                outlined
                dense
                emit-value
                map-options
                :options="healthFilterOptions"
                label="Health"
                class="filter-select-item"
              />

              <q-input
                v-model="startDateFilter"
                outlined
                dense
                label="Start Date"
                type="date"
                class="filter-date-item"
              />

              <q-input
                v-model="endDateFilter"
                outlined
                dense
                label="End Date"
                type="date"
                class="filter-date-item"
              />

              <q-btn
                outline
                no-caps
                icon="filter_list"
                label="More Filters"
                class="more-filter-btn"
                @click="showMoreFilters = !showMoreFilters"
              />
            </div>

            <!-- More Filters Collapsible Row -->
            <q-slide-transition>
              <div v-show="showMoreFilters" class="more-filters-box q-mt-sm">
                <div class="row q-col-gutter-sm items-center">
                  <div class="col-12 col-sm-4">
                    <q-select
                      outlined
                      dense
                      label="Owner"
                      :options="['All Owners', currentPmName]"
                      model-value="All Owners"
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-select
                      outlined
                      dense
                      label="Priority"
                      :options="['All Priorities', 'Low', 'Medium', 'High', 'Critical']"
                      model-value="All Priorities"
                    />
                  </div>
                  <div class="col-12 col-sm-4 text-right">
                    <q-btn
                      flat
                      dense
                      no-caps
                      color="primary"
                      label="Reset Filters"
                      @click="resetAllFilters"
                    />
                  </div>
                </div>
              </div>
            </q-slide-transition>
          </q-card-section>

          <q-separator />

          <!-- A. CARDS VIEW -->
          <div v-if="viewMode === 'cards'" class="q-pa-md">
            <div v-if="loading" class="state-container">
              <q-spinner size="36px" color="primary" />
              <span>Loading projects...</span>
            </div>

            <div v-else-if="filteredProjects.length === 0" class="state-container empty-overview">
              <q-avatar size="60px" class="empty-avatar">
                <q-icon name="folder_open" size="30px" />
              </q-avatar>
              <div class="empty-title">No projects found</div>
              <div class="empty-copy">Try adjusting your search terms or active filters.</div>
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

            <div v-else class="cards-view-content">
              <div
                v-for="group in groupedProjectCards"
                :key="group.label || 'all'"
                class="project-group-block q-mb-md"
              >
                <!-- Group Category Header (if grouped) -->
                <div v-if="group.label" class="group-header row items-center gap-xs q-mb-sm">
                  <q-icon name="category" size="16px" color="primary" />
                  <span class="group-title">{{ group.label }}</span>
                  <q-chip dense size="sm" class="group-count">{{ group.projects.length }}</q-chip>
                </div>

                <div class="projects-cards-grid">
                  <q-card
                    v-for="(project, index) in group.projects"
                    :key="project.project_id"
                    flat
                    bordered
                    :class="['overview-project-card', `theme-${getProjectTheme(project, index).id}`, 'cursor-pointer']"
                    :style="{ '--card-accent': getProjectTheme(project, index).accent }"
                    @click="goToProject(project.project_id)"
                  >
                    <!-- Visual Hero Header Area with Decorative CSS Abstract Elements -->
                    <div class="card-visual-hero" :style="{ background: getProjectTheme(project, index).gradient }">
                      <!-- Decorative Abstract Shapes Layer (CSS-only) -->
                      <div class="visual-decor-layer">
                        <div class="abstract-shape shape-orb-1" />
                        <div class="abstract-shape shape-orb-2" />
                        <div class="abstract-shape shape-wave-pattern" />
                        <div class="abstract-shape shape-ring" />
                      </div>

                      <!-- Hero Top Row: Theme Icon Monogram + Priority Pill + 3-Dot Action Menu -->
                      <div class="hero-top-row row items-center justify-between no-wrap">
                        <div class="hero-icon-pill">
                          <q-icon :name="getProjectTheme(project, index).iconName" size="17px" />
                        </div>

                        <div class="row items-center gap-xs">
                          <div class="hero-priority-pill">
                            <q-icon
                              :name="project.priority === 'CRITICAL' || project.priority === 'HIGH' ? 'local_fire_department' : (project.priority === 'LOW' ? 'check' : 'bolt')"
                              size="12px"
                            />
                            <span>{{ project.priority || 'Medium' }}</span>
                          </div>

                          <q-btn
                            flat
                            round
                            dense
                            icon="more_vert"
                            color="white"
                            size="sm"
                            class="hero-menu-btn"
                            @click.stop
                          >
                            <q-menu auto-close>
                              <q-list style="min-width: 150px">
                                <q-item clickable @click="goToProject(project.project_id)">
                                  <q-item-section avatar>
                                    <q-icon name="visibility" size="18px" color="primary" />
                                  </q-item-section>
                                  <q-item-section>View Details</q-item-section>
                                </q-item>
                                <q-item
                                  clickable
                                  class="text-negative"
                                  @click="confirmDeleteProject(project)"
                                >
                                  <q-item-section avatar>
                                    <q-icon name="delete" size="18px" color="negative" />
                                  </q-item-section>
                                  <q-item-section>Delete Project</q-item-section>
                                </q-item>
                              </q-list>
                            </q-menu>
                          </q-btn>
                        </div>
                      </div>

                      <!-- Hero Content: Title & Description -->
                      <div class="hero-content-block">
                        <div class="hero-title" :title="project.name">{{ project.name }}</div>
                        <div class="hero-description">
                          {{ project.description || 'Sprint deliverables, task assignments, and progress tracking.' }}
                        </div>
                      </div>

                      <!-- Hero Bottom: Resource Avatars Stack -->
                      <div class="hero-team-row row items-center">
                        <q-avatar size="24px" class="hero-avatar">
                          {{ project.name.charAt(0).toUpperCase() }}
                        </q-avatar>
                        <q-avatar size="24px" class="hero-avatar">
                          {{ currentPmName.charAt(0).toUpperCase() }}
                        </q-avatar>
                        <span class="hero-team-more">+1</span>
                      </div>
                    </div>

                    <!-- Lower White Card Body -->
                    <q-card-section class="overview-card-body">
                      <!-- Stat Badges Row -->
                      <div class="stats-pills-row row items-center justify-between gap-xs">
                        <div class="stat-pill-item">
                          <q-icon name="assignment" size="13px" color="grey-7" class="q-mr-xs" />
                          <span class="stat-pill-label">Status:</span>
                          <span class="stat-pill-val">{{ formatStatus(project.status) }}</span>
                        </div>

                        <div class="stat-pill-item">
                          <q-icon name="event" size="13px" color="grey-7" class="q-mr-xs" />
                          <span class="stat-pill-label">Due:</span>
                          <span class="stat-pill-val">{{ formatDate(project.deadline) }}</span>
                        </div>
                      </div>

                      <!-- Completion Progress Bar -->
                      <div class="card-progress-section">
                        <div class="row items-center justify-between q-mb-xs">
                          <span class="card-progress-label">Progress</span>
                          <span class="card-progress-val">{{ Number(project.progress) || 0 }}%</span>
                        </div>
                        <div class="custom-progress-track">
                          <div
                            class="custom-progress-fill"
                            :style="{
                              width: `${Math.min(100, Math.max(0, Number(project.progress) || 0))}%`,
                              background: getProjectTheme(project, index).accent
                            }"
                          />
                        </div>
                      </div>

                      <!-- Semantic Health Chip -->
                      <div class="card-footer-row row items-center justify-between no-wrap q-pt-xs">
                        <span class="footer-health-label">Health:</span>
                        <q-chip
                          dense
                          square
                          :class="['health-chip', `health-${getProjectHealth(project).toLowerCase()}`]"
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

          <!-- B. TABLE VIEW -->
          <q-table
            v-else
            v-model:selected="selectedProjects"
            flat
            :rows="filteredProjects"
            :columns="projectColumns"
            row-key="project_id"
            selection="multiple"
            :loading="loading"
            :pagination="pagination"
            :rows-per-page-options="[8, 16, 24]"
            class="projects-table"
            table-header-class="projects-table-header"
            no-data-label="No projects found"
          >
            <template #loading>
              <q-inner-loading showing color="primary" />
            </template>

            <template #body-cell-project="props">
              <q-td :props="props">
                <div class="project-cell cursor-pointer" @click="goToProject(props.row.project_id)">
                  <q-avatar size="28px" class="project-icon">
                    <q-icon name="folder" size="16px" />
                  </q-avatar>
                  <span class="project-cell-name">{{ props.row.name }}</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-owner="props">
              <q-td :props="props">
                <div class="owner-cell">
                  <q-avatar size="26px" class="owner-avatar">
                    {{ currentPmName.charAt(0).toUpperCase() }}
                  </q-avatar>
                  <span>{{ currentPmName }}</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip dense square class="status-chip">
                  {{ formatStatus(props.row.status) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-health="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :class="['health-chip', `health-${getProjectHealth(props.row).toLowerCase()}`]"
                >
                  {{ getHealthLabel(props.row) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-progress="props">
              <q-td :props="props">
                <div class="table-progress-cell">
                  <q-linear-progress
                    rounded
                    size="6px"
                    :value="Math.min(100, Math.max(0, Number(props.row.progress) || 0)) / 100"
                    color="primary"
                    track-color="grey-3"
                    class="table-progress"
                  />
                  <span>{{ Number(props.row.progress) || 0 }}%</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-start_date="props">
              <q-td :props="props">
                {{ formatDate(props.row.start_date) }}
              </q-td>
            </template>

            <template #body-cell-deadline="props">
              <q-td :props="props">
                {{ formatDate(props.row.deadline) }}
              </q-td>
            </template>

            <template #body-cell-team="props">
              <q-td :props="props">
                <div class="team-stack">
                  <q-avatar size="22px" class="stack-avatar avatar-purple">
                    {{ props.row.name.charAt(0).toUpperCase() }}
                  </q-avatar>
                  <q-avatar size="22px" class="stack-avatar avatar-dark">P</q-avatar>
                  <span>+1</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-tasks="props">
              <q-td :props="props" class="muted-cell">—</q-td>
            </template>

            <template #body-cell-overdue="props">
              <q-td :props="props">
                <span
                  :class="getProjectHealth(props.row) === 'DELAYED' ? 'overdue-value' : 'zero-value'"
                >
                  {{ getProjectHealth(props.row) === 'DELAYED' ? 1 : 0 }}
                </span>
              </q-td>
            </template>

            <template #body-cell-last_update="props">
              <q-td :props="props" class="muted-cell">Recently</q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" auto-width>
                <q-btn flat round dense icon="more_horiz" color="grey-6">
                  <q-menu auto-close>
                    <q-list style="min-width: 150px">
                      <q-item clickable @click="goToProject(props.row.project_id)">
                        <q-item-section avatar>
                          <q-icon name="visibility" size="18px" color="primary" />
                        </q-item-section>
                        <q-item-section>View Details</q-item-section>
                      </q-item>
                      <q-item
                        clickable
                        class="text-negative"
                        @click="confirmDeleteProject(props.row)"
                      >
                        <q-item-section avatar>
                          <q-icon name="delete" size="18px" color="negative" />
                        </q-item-section>
                        <q-item-section>Delete Project</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-td>
            </template>

            <template #bottom>
              <div class="table-bottom">
                <span>Showing {{ filteredProjects.length }} of {{ projects.length }} projects</span>
                <div class="bottom-spacer" />
                <span class="rows-label">Rows per page</span>
                <q-select
                  v-model="pagination.rowsPerPage"
                  dense
                  borderless
                  options-dense
                  :options="[8, 16, 24]"
                  class="rows-select"
                />
                <q-pagination
                  v-model="pagination.page"
                  :max="Math.max(1, Math.ceil(filteredProjects.length / pagination.rowsPerPage))"
                  direction-links
                  flat
                  active-color="primary"
                  color="grey-7"
                  size="sm"
                />
              </div>
            </template>
          </q-table>
        </q-card>
      </div>

      <!-- 6. PROJECT INSIGHTS BOTTOM STRIP -->
      <div class="project-insights-section">
        <q-card flat bordered class="insights-panel-card">
          <div class="insights-grid">
            <div class="insight-stat-item">
              <div class="insight-icon-box bg-green-tint text-green">
                <q-icon name="trending_up" size="20px" />
              </div>
              <div class="insight-copy">
                <span class="insight-label">Highest Progress</span>
                <strong class="insight-val">{{ Math.max(...projects.map((p) => Number(p.progress) || 0), 0) }}%</strong>
              </div>
            </div>

            <q-separator vertical class="gt-sm" />

            <div class="insight-stat-item">
              <div class="insight-icon-box bg-purple-tint text-purple">
                <q-icon name="pie_chart" size="20px" />
              </div>
              <div class="insight-copy">
                <span class="insight-label">Average Progress</span>
                <strong class="insight-val">{{ completionAverage }}%</strong>
              </div>
            </div>

            <q-separator vertical class="gt-sm" />

            <div class="insight-stat-item">
              <div class="insight-icon-box bg-orange-tint text-orange">
                <q-icon name="priority_high" size="20px" />
              </div>
              <div class="insight-copy">
                <span class="insight-label">Projects Needing Attention</span>
                <strong class="insight-val">{{ atRiskProjects + delayedProjects }}</strong>
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- CREATE PROJECT DIALOG (Existing Logic & State Preserved) -->
    <q-dialog v-model="showCreateDialog">
      <q-card class="create-project-dialog">
        <q-card-section class="dialog-header">
          <div>
            <div class="dialog-eyebrow">NEW PROJECT</div>
            <div class="dialog-title">Create a project</div>
          </div>
          <q-btn v-close-popup flat round dense icon="close" color="grey-7" />
        </q-card-section>

        <q-form @submit.prevent="handleCreateProject">
          <q-card-section class="dialog-form">
            <q-input
              v-model="form.name"
              outlined
              label="Project name"
              :rules="[(val) => !!val.trim() || 'Project name is required']"
            />
            <q-input
              v-model="form.description"
              outlined
              type="textarea"
              label="Description"
              autogrow
            />

            <div class="form-row">
              <q-select
                v-model="form.status"
                outlined
                label="Status"
                :options="statusOptions"
                emit-value
                map-options
                class="form-field"
              />
              <q-select
                v-model="form.priority"
                outlined
                label="Priority"
                :options="priorityOptions"
                emit-value
                map-options
                class="form-field"
              />
            </div>

            <div class="form-row">
              <q-input
                v-model="form.start_date"
                outlined
                type="date"
                label="Start date"
                stack-label
                class="form-field"
              />
              <q-input
                v-model="form.deadline"
                outlined
                type="date"
                label="Deadline"
                stack-label
                class="form-field"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
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
      Are you sure you want to delete project
      <strong>"{{ projectToDelete?.name }}"</strong>? All associated tasks, dependencies, and
      team assignments will be permanently removed.
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
import {
  createProjectApi,
  deleteProjectApi,
  getProjectsApi,
  type CreateProjectPayload,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
} from '@/services/api';
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
const showMoreFilters = ref(false);
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
    name: 'team',
    label: 'Team',
    field: () => '',
    align: 'left',
  },
  {
    name: 'tasks',
    label: 'Tasks',
    field: () => '',
    align: 'left',
  },
  {
    name: 'overdue',
    label: 'Overdue',
    field: (row) => (getProjectHealth(row) === 'DELAYED' ? 1 : 0),
    align: 'left',
  },
  {
    name: 'last_update',
    label: 'Last Update',
    field: () => 'Recently',
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
    id: 'lavender',
    name: 'Lavender Purple',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b6fd8 50%, #a78bfa 100%)',
    accent: '#8b6fd8',
    bgTint: '#f5f3ff',
    iconName: 'auto_awesome',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
    accent: '#0284c7',
    bgTint: '#f0f9ff',
    iconName: 'layers',
  },
  {
    id: 'peach',
    name: 'Peach Coral',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
    accent: '#ea580c',
    bgTint: '#fff7ed',
    iconName: 'wb_sunny',
  },
  {
    id: 'mint',
    name: 'Mint Green',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
    accent: '#059669',
    bgTint: '#ecfdf5',
    iconName: 'spa',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
    accent: '#d97706',
    bgTint: '#fffbeb',
    iconName: 'bolt',
  },
  {
    id: 'rose',
    name: 'Blush Rose',
    gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f472b6 100%)',
    accent: '#db2777',
    bgTint: '#fdf2f8',
    iconName: 'flare',
  },
];

function getProjectTheme(project: Project, index?: number): ProjectCardTheme {
  const idNum = Number(project.project_id) || (index !== undefined ? index : 0);
  const themeIndex = Math.abs(idNum) % PROJECT_THEMES.length;
  const theme = PROJECT_THEMES[themeIndex];
  if (!theme) return PROJECT_THEMES[0] as ProjectCardTheme;
  return theme;
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

// Featured Project Selection Logic
const featuredProject = computed(() => {
  if (!projects.value.length) return null;

  // 1. Prefer an active/in-progress project with the nearest upcoming deadline
  const activeWithDeadline = projects.value
    .filter((p) => (p.status === 'ACTIVE' || p.status === 'PUBLISHED') && !!p.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  if (activeWithDeadline.length > 0) return activeWithDeadline[0];

  // 2. If no suitable deadline exists, use the first active project
  const activeProjects = projects.value.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'PUBLISHED',
  );
  if (activeProjects.length > 0) return activeProjects[0];

  // 3. Fallback: first available project
  return projects.value[0];
});

// Health Donut Chart Circumference calculations (Radius = 46, Circumference ≈ 289)
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

// Upcoming Deadlines List
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
      message: 'Please sign in again',
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
.projects-page {
  min-height: 100%;
  padding: 24px 32px 40px;
  background: var(--wo-bg-page, #f7f7fa);
  color: var(--wo-text-main, #181d28);
}

.projects-dashboard-container {
  max-width: 1440px;
  margin: 0 auto;
}

/* 1. Header & Greeting */
.dashboard-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.greeting-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(139, 111, 216, 0.12);
  color: var(--wo-primary, #8b6fd8);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 4px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sparkle-icon {
  font-size: 10px;
}

.dashboard-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--wo-text-main, #121620);
  margin: 0 0 4px 0;
  line-height: 1.15;
}

.dashboard-subtitle {
  font-size: 13px;
  color: var(--wo-text-muted, #64748b);
  margin: 0;
}

.action-btn-primary {
  background: var(--wo-primary, #8b6fd8) !important;
  color: #ffffff !important;
  font-size: 13.5px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(139, 111, 216, 0.28);
  transition: all 0.2s ease;

  &:hover {
    background: #7554cc !important;
    transform: translateY(-1px);
    box-shadow: 0 5px 14px rgba(139, 111, 216, 0.38);
  }
}

/* 2. KPI Summary Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.kpi-widget-card {
  border-radius: 16px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #edf0f5);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  transition: all 0.2s ease;
  min-height: 86px;
  display: flex;
  align-items: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  }
}

.kpi-section {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.kpi-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-purple-tint {
  background: var(--wo-primary-light, #f5f3ff);
}
.text-purple {
  color: var(--wo-primary, #8b6fd8);
}

.bg-green-tint {
  background: rgba(16, 185, 129, 0.14);
}
.text-green {
  color: #10b981;
}

.bg-orange-tint {
  background: rgba(245, 158, 11, 0.14);
}
.text-orange {
  color: #f59e0b;
}

.bg-red-tint {
  background: rgba(239, 68, 68, 0.14);
}
.text-red {
  color: #ef4444;
}

.kpi-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-dot {
  display: inline-flex;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--wo-bg-tag, #f1f5f9);
  color: var(--wo-text-muted, #94a3b8);
  font-size: 8.5px;
  align-items: center;
  justify-content: center;
  cursor: help;
}

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--wo-text-main, #121620);
  line-height: 1.15;
  margin: 1px 0;
}

.kpi-note {
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;

  &.note-green {
    color: #10b981;
  }
  &.note-orange {
    color: #f59e0b;
  }
  &.note-red {
    color: #ef4444;
  }
  &.note-purple {
    color: var(--wo-primary, #8b6fd8);
  }
  &.note-blue {
    color: #3b82f6;
  }
}

/* Sections Gap */
.section-row {
  margin-bottom: 22px;
}

/* 3. TODAY'S FOCUS / FEATURED HERO CARD (Reversed with Visual Hero Image on Left) */
.featured-hero-card {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #edf0f5);
  border-radius: 20px;
  padding: 14px;
  box-shadow: var(--wo-card-shadow, 0 4px 20px rgba(16, 24, 40, 0.04));
}

.featured-card-layout {
  display: grid;
  grid-template-columns: 1.35fr 0.95fr;
  align-items: stretch;
  gap: 16px;
}

/* Left Hero Box: Image Background with Overlaid Text */
.hero-image-overlay-box {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  min-height: 290px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 26px;
  background-image: url('/projects/todays_focus_hero.jpg');
  background-size: cover;
  background-position: center;
  box-shadow: 0 8px 24px rgba(18, 22, 32, 0.12);

  /* Subtle Dark Gradient Overlay for Maximum Readability */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.52) 55%, rgba(15, 23, 42, 0.22) 100%);
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
  }
}

.hero-overlay-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-focus-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.3);

  .sparkle-dot {
    color: #fde047;
    font-size: 11px;
  }
}

.hero-play-bubble {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    background: #ffffff;
  }
}

.hero-overlay-middle {
  margin: 12px 0;
}

.hero-project-title {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.025em;
  margin: 0 0 6px 0;
  line-height: 1.2;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.hero-project-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
  max-width: 480px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-overlay-bottom {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hero-cta-btn {
  background: #ffffff !important;
  color: #121620 !important;
  font-size: 13.5px;
  font-weight: 700;
  padding: 8px 22px;
  border-radius: 11px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  }
}

.hero-tags-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
}

/* Right Supporting Panel */
.hero-supporting-panel {
  background: var(--wo-bg-page, #f8fafc);
  border: 1px solid var(--wo-border, #edf0f5);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}

.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--wo-text-muted, #64748b);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #edf0f5);
  border-radius: 12px;
  padding: 10px 14px;
}

.panel-meta-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.meta-item-label {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--wo-text-muted, #94a3b8);
  letter-spacing: 0.06em;
}

.meta-item-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);

  &.text-on_track {
    color: #10b981;
  }
  &.text-at_risk {
    color: #f59e0b;
  }
  &.text-delayed {
    color: #ef4444;
  }
}

.panel-progress-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;

  .progress-title {
    color: var(--wo-text-main, #475569);
  }
  .progress-percent {
    color: var(--wo-primary, #8b6fd8);
    font-size: 12px;
  }
}

.panel-progress-track {
  height: 7px;
  background: var(--wo-border-subtle, #e2e8f0);
  border-radius: 9999px;
  overflow: hidden;
}

.panel-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b6fd8 0%, #a78bfa 100%);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.panel-footer-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-tag-label {
  font-size: 10px;
  color: var(--wo-text-muted, #94a3b8);
  font-weight: 600;
}

.panel-tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e2e8f0);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--wo-text-main, #475569);
}

.focus-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 36px 16px;
}

/* 4. Dashboard Widgets & Charts */
.dashboard-widget-card {
  border-radius: 18px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #edf0f5);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  height: 100%;
}

.widget-header {
  padding: 16px 20px 8px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.widget-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #121620);
  letter-spacing: -0.01em;
}

.widget-sub {
  font-size: 11.5px;
  color: var(--wo-text-muted, #64748b);
  margin-top: 2px;
}

.health-summary-chip {
  background: var(--wo-bg-tag, #f1f5f9);
  color: var(--wo-text-main, #475569);
  font-size: 10.5px;
  font-weight: 700;
}

.health-visual-section {
  padding: 6px 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 16px;
}

.donut-chart-container {
  position: relative;
  width: 104px;
  height: 104px;
  flex-shrink: 0;
}

.donut-svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.donut-center-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.center-val {
  font-size: 16px;
  font-weight: 800;
  color: var(--wo-text-main, #121620);
  line-height: 1;
}

.center-sub {
  font-size: 9px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
  margin-top: 2px;
}

.health-legend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
}

.legend-label-col {
  display: flex;
  align-items: center;
  gap: 7px;
}

.legend-bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.bullet-green {
    background: #34d399;
  }
  &.bullet-orange {
    background: #fb923c;
  }
  &.bullet-red {
    background: #fb7185;
  }
}

.legend-name {
  color: var(--wo-text-main, #334155);
  font-weight: 600;
}

.legend-stats-col {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-count {
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
}

.legend-pct {
  color: var(--wo-text-muted, #64748b);
  font-size: 10.5px;
}

/* Upcoming Deadlines */
.deadlines-list-section {
  padding: 4px 18px 14px;
}

.deadlines-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22px 0;
  color: var(--wo-text-muted, #94a3b8);
  font-size: 12px;
}

.deadlines-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.deadline-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 10px;
  border-radius: 12px;
  background: var(--wo-bg-tag, #fafafc);
  border: 1px solid var(--wo-border-subtle, #f1f3f7);
  transition: all 0.2s ease;

  &:hover {
    background: var(--wo-bg-card-hover, #f5f3ff);
    border-color: var(--wo-border, #e9ddfd);
    transform: translateX(2px);
  }
}

.date-badge-box {
  width: 40px;
  height: 40px;
  border-radius: 9px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #e2e8f0);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.date-month {
  font-size: 8.5px;
  font-weight: 800;
  color: var(--wo-primary, #8b6fd8);
  letter-spacing: 0.06em;
}

.date-day {
  font-size: 13px;
  font-weight: 800;
  color: var(--wo-text-main, #1e293b);
  line-height: 1;
}

.deadline-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.deadline-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.deadline-project-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deadline-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
}

.deadline-relative {
  color: var(--wo-text-muted, #64748b);
  font-weight: 500;
}

.deadline-progress {
  color: var(--wo-primary, #8b6fd8);
  font-weight: 600;
}

/* 5. Explorer Toolbar & Filters */
.table-card {
  border-radius: 18px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #edf0f5);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.03));
  overflow: hidden;
}

.table-toolbar {
  padding: 14px 18px;
  border-bottom: 1px solid var(--wo-border-subtle, #f1f5f9);
}

.toolbar-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wo-text-main, #121620);
}

.toolbar-select {
  width: 125px;
}

.toolbar-select :deep(.q-field__control) {
  min-height: 32px;
  border-radius: 8px;
}

.filter-toolbar-section {
  padding: 12px 18px;
  background: var(--wo-bg-page, #fafafc);
  border-bottom: 1px solid var(--wo-border-subtle, #f1f5f9);
}

.filter-grid-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.filter-grid-row :deep(.q-field__control) {
  min-height: 35px;
  border-radius: 8px;
  background: var(--wo-bg-input, #ffffff);
}

.filter-grid-row :deep(.q-field__label),
.filter-grid-row :deep(.q-field__native),
.filter-grid-row :deep(.q-field__input) {
  font-size: 11px;
}

.more-filter-btn {
  min-height: 35px;
  padding: 0 12px;
  border-radius: 8px;
  color: var(--wo-text-main, #475569);
  border-color: var(--wo-border, #cbd5e1);
  font-size: 11px;
}

.more-filters-box {
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, #edf0f5);
  border-radius: 10px;
  padding: 12px;
}

.view-segmented-toggle {
  background: var(--wo-bg-tag, #f1f5f9);
  border-radius: 8px;
  padding: 2px;
}

.view-segmented-toggle :deep(.q-btn) {
  min-height: 26px;
  padding: 0 8px;
  border-radius: 6px !important;
}

.view-segmented-toggle :deep(.q-btn--active) {
  background: var(--wo-primary, #8b6fd8) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(139, 111, 216, 0.35);
}

/* Cards View & Themed Project Cards */
.cards-view-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-header {
  border-bottom: 1px solid var(--wo-border-subtle, #f1f5f9);
  padding-bottom: 6px;
}

.group-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--wo-text-main, #334155);
}

.group-count {
  background: var(--wo-bg-tag, #f1f5f9);
  color: var(--wo-text-main, #475569);
  font-weight: 700;
}

.projects-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 18px;
}

.overview-project-card {
  border-radius: 18px;
  border: 1px solid var(--wo-border, #edf0f5);
  overflow: hidden;
  background: var(--wo-bg-card, #ffffff);
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--wo-card-shadow, 0 2px 6px rgba(16, 24, 40, 0.04));
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    border-color: var(--card-accent, #8b6fd8);
    box-shadow: 0 12px 28px -4px rgba(16, 24, 40, 0.12);
  }
}

/* Card Visual Hero Area */
.card-visual-hero {
  position: relative;
  overflow: hidden;
  border-radius: 17px 17px 0 0;
  min-height: 156px;
  padding: 14px 16px;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.15);
}

/* Decorative CSS Shapes */
.visual-decor-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.abstract-shape {
  position: absolute;
  pointer-events: none;
}

.shape-orb-1 {
  right: -25px;
  top: -30px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(2px);
}

.shape-orb-2 {
  right: 35px;
  bottom: -45px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.shape-wave-pattern {
  left: -25px;
  bottom: -25px;
  width: 105px;
  height: 105px;
  border-radius: 38%;
  background: rgba(255, 255, 255, 0.08);
  transform: rotate(25deg);
}

.shape-ring {
  right: 15px;
  top: 15px;
  width: 55px;
  height: 55px;
  border: 1.5px solid rgba(255, 255, 255, 0.24);
  border-radius: 50%;
}

.hero-top-row,
.hero-content-block,
.hero-team-row {
  position: relative;
  z-index: 2;
}

.hero-icon-pill {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.hero-priority-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 9999px;
  letter-spacing: 0.02em;
}

.hero-menu-btn {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.hero-content-block {
  margin: 10px 0 6px;
}

.hero-title {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.015em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-description {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.35;
  margin-top: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-team-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.hero-avatar {
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  margin-left: -5px;

  &:first-child {
    margin-left: 0;
  }
}

.hero-team-more {
  margin-left: 5px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

/* Lower Card Body */
.overview-card-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--wo-bg-card, #ffffff);
}

.stats-pills-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-pill-item {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--wo-bg-tag, #f8fafc);
  border: 1px solid var(--wo-border-subtle, #edf0f5);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 10.5px;
  min-width: 0;
}

.stat-pill-label {
  color: var(--wo-text-muted, #64748b);
  font-weight: 600;
  margin-right: 3px;
}

.stat-pill-val {
  color: var(--wo-text-main, #1e293b);
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-progress-section {
  display: flex;
  flex-direction: column;
}

.card-progress-label {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
}

.card-progress-val {
  font-size: 11px;
  font-weight: 700;
  color: var(--wo-text-main, #1e293b);
}

.custom-progress-track {
  height: 6px;
  background: var(--wo-border-subtle, #f1f5f9);
  border-radius: 9999px;
  overflow: hidden;
}

.custom-progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.35s ease;
}

.card-footer-row {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--wo-border-subtle, #f8fafc);
  padding-top: 4px;
}

.footer-health-label {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--wo-text-muted, #64748b);
}

/* Status & Health Chips */
.health-chip,
.status-chip {
  min-height: 20px;
  border-radius: 6px;
  font-size: 9.5px;
  font-weight: 700;
}

.health-on_track {
  background: rgba(16, 185, 129, 0.14);
  color: #10b981;
}

.health-at_risk {
  background: rgba(245, 158, 11, 0.14);
  color: #f59e0b;
}

.health-delayed {
  background: rgba(239, 68, 68, 0.14);
  color: #ef4444;
}

.status-chip {
  background: var(--wo-primary-light, #f5f3ff);
  color: var(--wo-primary, #8b6fd8);
}

/* Table View Styling */
.projects-table :deep(.q-table__middle) {
  overflow-x: auto;
}

.projects-table :deep(table) {
  min-width: 1050px;
}

.projects-table :deep(th) {
  height: 40px;
  padding: 0 10px;
  background: var(--wo-bg-page, #fafafc);
  color: var(--wo-text-muted, #64748b);
  border-bottom: 1px solid var(--wo-border, #edf0f5);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.projects-table :deep(td) {
  height: 52px;
  padding: 8px 10px;
  color: var(--wo-text-main, #334155);
  font-size: 12.5px;
  border-bottom: 1px solid var(--wo-border-subtle, #f1f3f7);
}

.projects-table :deep(tbody tr:hover) {
  background: var(--wo-bg-card-hover, #faf9ff);
}

.project-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
}

.project-icon {
  background: #f5f3ff;
  color: #8b6fd8;
}

.project-cell-name {
  font-weight: 700;
  color: #121620;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.owner-cell {
  display: flex;
  align-items: center;
  gap: 7px;
}

.owner-avatar {
  background: #f1f5f9;
  color: #475569;
  font-weight: 700;
}

.table-progress-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 95px;
}

.table-progress {
  width: 60px;
}

.team-stack {
  display: flex;
  align-items: center;
}

.stack-avatar {
  border: 2px solid #ffffff;
}

.stack-avatar + .stack-avatar {
  margin-left: -5px;
}

.team-stack span {
  margin-left: 5px;
  color: #64748b;
  font-size: 9.5px;
}

.muted-cell {
  color: #94a3b8 !important;
}

.overdue-value {
  color: #ef4444;
  font-weight: 700;
}

.zero-value {
  color: #10b981;
  font-weight: 600;
}

.table-bottom {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 4px 14px;
  color: #64748b;
  font-size: 10.5px;
}

.bottom-spacer {
  flex: 1;
}

.rows-label {
  margin-right: 4px;
}

.rows-select {
  width: 50px;
  margin-right: 10px;
}

/* Empty State */
.state-container {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #64748b;
  font-size: 12.5px;

  &.empty-overview {
    flex-direction: column;
    gap: 5px;
    padding: 30px 0;
  }
}

.empty-avatar {
  background: #f5f3ff;
  color: #8b6fd8;
}

.empty-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #121620;
}

.empty-copy {
  font-size: 11.5px;
  color: #64748b;
}

/* 6. Bottom Insights Panel */
.insights-panel-card {
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid var(--wo-border, #edf0f5);
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.03);
}

.insights-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  padding: 16px 20px;
}

.insight-stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.insight-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.insight-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.insight-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #64748b;
}

.insight-val {
  font-size: 19px;
  font-weight: 800;
  color: #121620;
  line-height: 1.1;
}

/* Dialogs */
.create-project-dialog {
  width: 600px;
  max-width: 92vw;
  border-radius: 18px;
  background: #ffffff;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px 10px;
}

.dialog-eyebrow {
  color: #8b6fd8;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 3px;
}

.dialog-title {
  font-size: 20px;
  font-weight: 800;
  color: #121620;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 24px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-field {
  flex: 1;
}

.dialog-actions {
  padding: 10px 24px 22px;
}

/* Responsive Media Queries */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .kpi-completion {
    grid-column: span 2;
  }
  .featured-card-layout {
    grid-template-columns: 1.2fr 0.9fr;
    gap: 14px;
  }
  .filter-grid-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .kpi-completion {
    grid-column: span 2;
  }
  .featured-card-layout {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .filter-grid-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .insights-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

@media (max-width: 600px) {
  .projects-page {
    padding: 14px;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .kpi-completion {
    grid-column: auto;
  }
  .featured-hero-card {
    padding: 10px;
  }
  .hero-image-overlay-box {
    padding: 18px 16px;
    min-height: 240px;
  }
  .hero-project-title {
    font-size: 20px;
  }
  .filter-grid-row {
    grid-template-columns: 1fr;
  }
  .form-row {
    flex-direction: column;
  }
  .dashboard-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .health-visual-section {
    flex-direction: column;
  }
}
</style>
