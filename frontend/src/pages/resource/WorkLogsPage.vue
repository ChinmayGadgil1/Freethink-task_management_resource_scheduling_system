<template>
  <q-page
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    class="q-pa-lg work-logs-page"
  >
    <div class="q-mx-auto column q-gutter-y-md" style="max-width: 1400px">
      <!-- 1. PAGE HEADER -->
      <div class="row items-center justify-between wrap gap-md">
        <div>
          <div
            class="page-title text-h5 text-weight-bold"
            :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
          >
            Work Logs & Effort Tracking
          </div>
          <div class="text-body2 q-mt-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
            Record daily task effort, submit end-of-day checkouts, and review complete work history.
          </div>
        </div>

        <!-- Header Actions -->
        <div class="row items-center gap-sm">
          <q-btn
            flat
            round
            dense
            icon="refresh"
            :loading="loading || loadingHistory"
            @click="refreshCurrentTab"
          >
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>

          <q-btn
            v-if="
              activeTab === 'daily' &&
              isSelectedDateToday &&
              !isCheckedOut &&
              allocations.length > 0
            "
            unelevated
            no-caps
            color="positive"
            label="Submit Today's Logs"
            icon="task_alt"
            class="text-weight-bold"
            style="border-radius: 8px; height: 36px"
            :loading="loading"
            @click="submitDailyLogs"
          />
          <div
            v-else-if="activeTab === 'daily' && isSelectedDateToday && isCheckedOut"
            class="row items-center q-gutter-x-xs text-weight-bold text-caption q-px-md rounded-borders"
            :class="$q.dark.isActive ? 'bg-green-10 text-green-2' : 'bg-green-1 text-positive'"
            style="border: 1px solid rgba(16, 185, 129, 0.3); height: 36px"
          >
            <q-icon name="check_circle" size="18px" />
            <span>Checked Out</span>
          </div>
        </div>
      </div>

      <!-- 2. NAVIGATION TABS -->
      <div class="row items-center justify-between wrap gap-md border-bottom-subtle q-pb-sm">
        <q-tabs
          v-model="activeTab"
          dense
          no-caps
          active-color="primary"
          indicator-color="primary"
          align="left"
          class="work-logs-tabs"
          :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
        >
          <q-tab name="daily" icon="today" label="Daily Allocations">
            <q-badge v-if="allocations.length > 0" color="primary" floating rounded>
              {{ allocations.length }}
            </q-badge>
          </q-tab>
          <q-tab name="history" icon="history_edu" label="All Work Logs History">
            <q-badge v-if="allLogsStats.total_logs > 0" color="info" floating rounded>
              {{ allLogsStats.total_logs }}
            </q-badge>
          </q-tab>
        </q-tabs>

        <!-- Quick Log Work Button -->
        <div class="row items-center gap-xs">
          <q-btn
            v-if="availableTasksForLogging.length > 0"
            unelevated
            no-caps
            color="primary"
            icon="add_task"
            label="Log Work Effort"
            class="text-weight-bold"
            @click="openTaskSelectionOrFirst"
          />
        </div>
      </div>

      <!-- ==================== TAB 1: DAILY ALLOCATIONS ==================== -->
      <div v-if="activeTab === 'daily'" class="column q-gutter-y-sm">
        <!-- Summary Strip For Selected Day -->
        <div class="row q-col-gutter-x-md q-col-gutter-y-sm">
          <!-- Card 1: Total Allocated Today -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="summary-card"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-center justify-between">
                <span class="text-caption text-weight-bold text-grey-6">Scheduled Hours</span>
                <div class="summary-icon-wrap bg-purple-soft text-primary">
                  <q-icon name="event" size="18px" />
                </div>
              </div>
              <div class="text-h6 text-weight-bolder text-primary q-mt-xs" style="line-height: 1.2">
                {{ formatHours(totalScheduledHours) }}h
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs ellipsis"
                style="font-size: 12px; line-height: 1.35"
              >
                {{
                  totalScheduledHours > 0
                    ? 'Planned capacity for this day'
                    : allocations.length > 0
                      ? 'Active tasks available to log'
                      : isWeekend
                        ? 'Weekend — No scheduled shift'
                        : 'No scheduled slots for this day'
                }}
              </div>
            </q-card>
          </div>

          <!-- Card 2: Total Logged Today -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="summary-card"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-center justify-between">
                <span class="text-caption text-weight-bold text-grey-6">
                  {{
                    isSelectedDateFuture
                      ? 'Logged Effort'
                      : isSelectedDateToday
                        ? 'Logged Today'
                        : 'Logged on Date'
                  }}
                </span>
                <div class="summary-icon-wrap bg-blue-soft text-info">
                  <q-icon name="history_edu" size="18px" />
                </div>
              </div>
              <div class="text-h6 text-weight-bolder text-info q-mt-xs" style="line-height: 1.2">
                {{ formatHours(totalLoggedHours) }}h
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs ellipsis"
                style="font-size: 12px; line-height: 1.35"
              >
                {{
                  isSelectedDateFuture
                    ? 'No advance logs permitted'
                    : totalScheduledHours > 0
                      ? `${Math.round((totalLoggedHours / totalScheduledHours) * 100)}% of scheduled effort`
                      : totalLoggedHours > 0
                        ? 'Recorded work effort'
                        : 'No logs submitted for this day yet'
                }}
              </div>
            </q-card>
          </div>

          <!-- Card 3: Tasks Allocated -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="summary-card"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-center justify-between">
                <span class="text-caption text-weight-bold text-grey-6">
                  {{
                    isSelectedDateFuture
                      ? 'Scheduled Tasks'
                      : isSelectedDateToday
                        ? 'Active Deliverables'
                        : 'Tasks on Date'
                  }}
                </span>
                <div class="summary-icon-wrap bg-green-soft text-positive">
                  <q-icon name="assignment" size="18px" />
                </div>
              </div>
              <div
                class="text-h6 text-weight-bolder text-positive q-mt-xs"
                style="line-height: 1.2"
              >
                {{ allocations.length }}
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs ellipsis"
                style="font-size: 12px; line-height: 1.35"
              >
                {{
                  isSelectedDateFuture
                    ? 'Planned deliverables for this date'
                    : isSelectedDateToday
                      ? 'Tasks available to work on'
                      : 'Deliverables for this date'
                }}
              </div>
            </q-card>
          </div>

          <!-- Card 4: Work Logs Count -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="summary-card"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-center justify-between">
                <span class="text-caption text-weight-bold text-grey-6">Work Log Count</span>
                <div class="summary-icon-wrap bg-amber-soft text-warning">
                  <q-icon name="fact_check" size="18px" />
                </div>
              </div>
              <div class="text-h6 text-weight-bolder text-warning q-mt-xs" style="line-height: 1.2">
                {{ totalLogsCount }}
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs ellipsis"
                style="font-size: 12px; line-height: 1.35"
              >
                {{
                  isSelectedDateFuture
                    ? 'Future date — 0 entries'
                    : 'Entries submitted for this day'
                }}
              </div>
            </q-card>
          </div>
        </div>

        <!-- Date Selector & Navigation Controls -->
        <div class="row items-center justify-between wrap gap-sm" style="margin-top: 20px">
          <div class="row items-center gap-xs">
            <q-btn
              round
              flat
              dense
              icon="chevron_left"
              class="date-nav-btn"
              title="Previous Day"
              @click="changeDate(-1)"
            />

            <q-btn
              outline
              no-caps
              class="current-date-btn q-px-md text-weight-bold"
              :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-white text-dark'"
            >
              <q-icon name="event" size="18px" class="q-mr-xs text-primary" />
              <span>{{ formattedDateDisplay }}</span>
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="selectedDate"
                  mask="YYYY-MM-DD"
                  @update:model-value="loadDailyAllocations"
                />
              </q-popup-proxy>
            </q-btn>

            <q-btn
              round
              flat
              dense
              icon="chevron_right"
              class="date-nav-btn"
              title="Next Day"
              @click="changeDate(1)"
            />

            <q-btn
              dense
              outline
              no-caps
              label="Today"
              color="primary"
              class="q-px-sm q-ml-xs text-weight-medium"
              @click="goToToday"
            />
          </div>

          <div class="text-caption text-grey-6">
            Showing deliverables scheduled or logged for <b>{{ formattedDateDisplay }}</b>
          </div>
        </div>

        <!-- Helpful notice when deliverables exist but no logs submitted yet -->
        <q-banner
          v-if="allocations.length > 0 && totalLogsCount === 0 && !loading"
          dense
          rounded
          class="bg-blue-1 text-blue-9 q-pa-sm border-blue-subtle"
          :class="$q.dark.isActive ? 'bg-grey-9 text-blue-2' : ''"
        >
          <template #avatar>
            <q-icon name="info" color="primary" size="20px" />
          </template>
          <span>
            You have active deliverables for this day. Click <b>Add Work Log</b> on any task card
            below to record your hours and progress.
          </span>
        </q-banner>

        <!-- Loading State -->
        <div v-if="loading" class="row justify-center q-pa-xl">
          <q-spinner color="primary" size="44px" />
        </div>

        <!-- Error Banner -->
        <q-banner v-else-if="error" class="bg-negative text-white rounded-borders q-mb-md">
          {{ error }}
          <template #action>
            <q-btn flat no-caps label="Retry" @click="loadDailyAllocations" />
          </template>
        </q-banner>

        <!-- Allocated Tasks List for Selected Day -->
        <template v-else>
          <!-- Empty State -->
          <q-card
            v-if="allocations.length === 0"
            flat
            bordered
            class="empty-state-card text-center q-pa-xl"
            :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
          >
            <q-avatar
              size="64px"
              color="grey-2"
              text-color="grey-6"
              icon="event_available"
              class="q-mb-md"
            />
            <div
              class="text-h6 text-weight-bold"
              :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
            >
              {{
                isSelectedDateFuture
                  ? 'No Deliverables Scheduled For This Day'
                  : 'No Task Allocations For This Day'
              }}
            </div>
            <div class="text-body2 text-grey-6 q-mt-xs" style="max-width: 480px; margin: 0 auto">
              {{
                isSelectedDateFuture
                  ? `There are no deliverables scheduled for you on ${formattedDateDisplay}. Check adjacent days or your full schedule.`
                  : `There are no tasks scheduled or logged for you on ${formattedDateDisplay}. Use the arrow buttons above to check adjacent days, or view all your past submitted logs.`
              }}
            </div>
            <div class="row justify-center q-mt-md gap-sm">
              <q-btn
                outline
                no-caps
                icon="history"
                label="View All Work Logs"
                color="primary"
                @click="activeTab = 'history'"
              />
              <q-btn
                outline
                no-caps
                icon="calendar_month"
                label="View Full Schedule"
                color="primary"
                @click="router.push('/app/resource-dashboard/schedule')"
              />
              <q-btn unelevated no-caps label="Go to Today" color="primary" @click="goToToday" />
            </div>
          </q-card>

          <!-- Tasks Container -->
          <div v-else class="column q-gutter-y-md">
            <q-card
              v-for="item in allocations"
              :key="item.task_id"
              flat
              bordered
              class="task-allocation-card overflow-hidden"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="q-pa-md">
                <div class="row items-start justify-between wrap gap-md">
                  <!-- Task Info -->
                  <div class="col-12 col-md-7">
                    <div class="row items-center gap-xs q-mb-xs">
                      <q-chip
                        dense
                        square
                        size="sm"
                        :class="`prio-badge-${(item.priority || 'MEDIUM').toLowerCase()}`"
                        class="text-weight-bold"
                      >
                        {{ item.priority || 'MEDIUM' }}
                      </q-chip>
                      <q-chip
                        dense
                        square
                        size="sm"
                        :class="['status-chip', getTaskStatusClass(item.status)]"
                        class="text-weight-bold"
                      >
                        {{ formatStatusLabel(item.status) }}
                      </q-chip>
                      <span class="text-caption text-grey-6">
                        {{ item.project_name || `Project #${item.project_id}` }}
                      </span>
                    </div>

                    <div
                      class="task-title text-subtitle1 text-weight-bold cursor-pointer"
                      :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                      @click="router.push(`/app/resource-dashboard/task-details/${item.task_id}`)"
                    >
                      {{ item.title }}
                    </div>

                    <div
                      v-if="item.description"
                      class="task-desc text-caption text-grey-6 q-mt-xs ellipsis-2-lines"
                    >
                      {{ item.description }}
                    </div>

                    <!-- Metrics bar -->
                    <div class="row items-center gap-md q-mt-sm text-caption text-grey-7">
                      <div class="row items-center gap-xs">
                        <q-icon name="schedule" size="15px" color="primary" />
                        <span><b>Scheduled:</b> {{ formatHours(item.scheduled_hours) }}h</span>
                      </div>
                      <div class="row items-center gap-xs">
                        <q-icon name="timer" size="15px" color="info" />
                        <span
                          ><b>{{ isSelectedDateToday ? 'Logged Today:' : 'Logged on Date:' }}</b>
                          {{ formatHours(item.hours_logged_today) }}h</span
                        >
                      </div>
                      <div class="row items-center gap-xs">
                        <q-icon name="donut_large" size="15px" color="positive" />
                        <span><b>Total Progress:</b> {{ Number(item.progress) || 0 }}%</span>
                      </div>
                      <div v-if="item.deadline" class="row items-center gap-xs">
                        <q-icon name="event" size="15px" color="negative" />
                        <span><b>Deadline:</b> {{ formatDate(item.deadline) }}</span>
                      </div>
                      <div v-if="item.planned_start" class="row items-center gap-xs">
                        <q-icon name="flight_takeoff" size="15px" color="amber-8" />
                        <span><b>Planned Start:</b> {{ formatDateTime(item.planned_start) }}</span>
                      </div>
                      <div v-if="item.planned_end" class="row items-center gap-xs">
                        <q-icon name="flight_land" size="15px" color="amber-8" />
                        <span><b>Planned End:</b> {{ formatDateTime(item.planned_end) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Progress Bar & Actions -->
                  <div class="col-12 col-md-4 column items-end justify-between q-gutter-y-sm">
                    <!-- Progress Visual -->
                    <div class="full-width">
                      <div class="row items-center justify-between text-caption q-mb-xs">
                        <span class="text-weight-bold text-grey-7">Progress</span>
                        <span class="text-weight-bold text-primary"
                          >{{ Number(item.progress) || 0 }}%</span
                        >
                      </div>
                      <q-linear-progress
                        :value="(Number(item.progress) || 0) / 100"
                        color="primary"
                        rounded
                        size="8px"
                      />
                    </div>

                    <!-- Action Buttons -->
                    <div class="row items-center gap-xs q-mt-sm">
                      <q-btn
                        outline
                        no-caps
                        dense
                        size="sm"
                        icon="visibility"
                        label="Details"
                        color="grey-7"
                        class="q-px-sm"
                        @click="router.push(`/app/resource-dashboard/task-details/${item.task_id}`)"
                      />
                      <q-btn
                        v-if="!isSelectedDateFuture"
                        unelevated
                        no-caps
                        icon="add_task"
                        label="Add Work Log"
                        color="primary"
                        class="text-weight-bold q-px-md"
                        :disable="item.is_blocked"
                        @click="openWorkLogDialog(item)"
                      >
                        <q-tooltip v-if="item.is_blocked" class="bg-negative"
                          >Blocked: Predecessor tasks must be completed first.</q-tooltip
                        >
                      </q-btn>
                      <q-chip
                        v-else
                        dense
                        square
                        color="grey-3"
                        text-color="grey-7"
                        icon="event_busy"
                        class="text-weight-medium"
                      >
                        Future Date
                        <q-tooltip
                          >Work logs cannot be submitted in advance for future dates</q-tooltip
                        >
                      </q-chip>
                    </div>
                  </div>
                </div>

                <!-- Existing Work Logs Submitted on this Date -->
                <div
                  v-if="item.logs_today && item.logs_today.length > 0"
                  class="q-mt-md q-pt-sm border-top-subtle"
                >
                  <div
                    class="text-caption text-weight-bold text-grey-6 q-mb-xs row items-center gap-xs"
                  >
                    <q-icon name="history" size="14px" />
                    <span>Work Recorded on this Date ({{ item.logs_today.length }})</span>
                  </div>
                  <div class="column q-gutter-y-xs">
                    <div
                      v-for="log in item.logs_today"
                      :key="log.log_id"
                      class="existing-log-row row items-center justify-between q-pa-sm rounded-borders text-caption"
                      :class="$q.dark.isActive ? 'bg-grey-10 text-grey-3' : 'bg-grey-1 text-grey-9'"
                    >
                      <div class="row items-center gap-sm wrap">
                        <q-badge
                          color="primary"
                          text-color="white"
                          :label="`${formatHours(log.hours_logged)}h`"
                        />
                        <span class="text-weight-medium">{{ log.notes }}</span>
                        <!--
                        <q-chip
                          v-if="log.blockers"
                          dense
                          square
                          color="negative"
                          text-color="white"
                          size="xs"
                        >
                          Blocker: {{ log.blockers }}
                        </q-chip>
                        -->
                      </div>
                      <div class="row items-center gap-sm">
                        <span class="text-caption text-grey-5"
                          >Progress Logged: <b>{{ log.progress_logged }}%</b></span
                        >
                        <span class="text-caption text-grey-5">{{
                          formatTime(log.created_at)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card>
          </div>
        </template>
      </div>

      <!-- ==================== TAB 2: ALL WORK LOGS HISTORY ==================== -->
      <div v-else-if="activeTab === 'history'" class="column q-gutter-y-sm">
        <!-- History Summary Strip -->
        <div class="row q-col-gutter-x-md q-col-gutter-y-sm">
          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="summary-card"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-center justify-between">
                <span class="text-caption text-weight-bold text-grey-6">Total Hours Logged</span>
                <div class="summary-icon-wrap bg-purple-soft text-primary">
                  <q-icon name="timelapse" size="18px" />
                </div>
              </div>
              <div class="text-h6 text-weight-bolder text-primary q-mt-xs" style="line-height: 1.2">
                {{ formatHours(allLogsStats.total_hours) }}h
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs ellipsis"
                style="font-size: 12px; line-height: 1.35"
              >
                All-time recorded effort
              </div>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="summary-card"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-center justify-between">
                <span class="text-caption text-weight-bold text-grey-6">Total Entries</span>
                <div class="summary-icon-wrap bg-blue-soft text-info">
                  <q-icon name="format_list_bulleted" size="18px" />
                </div>
              </div>
              <div class="text-h6 text-weight-bolder text-info q-mt-xs" style="line-height: 1.2">
                {{ allLogsStats.total_logs }}
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs ellipsis"
                style="font-size: 12px; line-height: 1.35"
              >
                Work log updates submitted
              </div>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="summary-card"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-center justify-between">
                <span class="text-caption text-weight-bold text-grey-6">Tasks Worked On</span>
                <div class="summary-icon-wrap bg-green-soft text-positive">
                  <q-icon name="task_alt" size="18px" />
                </div>
              </div>
              <div
                class="text-h6 text-weight-bolder text-positive q-mt-xs"
                style="line-height: 1.2"
              >
                {{ distinctTasksCount }}
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs ellipsis"
                style="font-size: 12px; line-height: 1.35"
              >
                Unique deliverables touched
              </div>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card
              flat
              bordered
              class="summary-card"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-center justify-between">
                <span class="text-caption text-weight-bold text-grey-6">Average Entry Effort</span>
                <div class="summary-icon-wrap bg-amber-soft text-warning">
                  <q-icon name="speed" size="18px" />
                </div>
              </div>
              <div class="text-h6 text-weight-bolder text-warning q-mt-xs" style="line-height: 1.2">
                {{ averageHoursPerEntry }}h
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs ellipsis"
                style="font-size: 12px; line-height: 1.35"
              >
                Average hours per log
              </div>
            </q-card>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="row items-center justify-between wrap gap-sm" style="margin-top: 20px">
          <div class="row items-center gap-sm col-grow" style="max-width: 680px">
            <q-input
              v-model="searchQuery"
              placeholder="Search by task title, project, or notes..."
              outlined
              dense
              clearable
              class="col-grow"
              style="min-width: 260px"
              :dark="$q.dark.isActive"
            >
              <template #prepend>
                <q-icon name="search" size="18px" />
              </template>
            </q-input>

            <q-select
              v-model="filterStatus"
              :options="['ALL', 'IN_PROGRESS', 'COMPLETED', 'SCHEDULED']"
              label="Task Status"
              outlined
              dense
              style="width: 170px"
              :dark="$q.dark.isActive"
            />
          </div>

          <div class="row items-center">
            <span class="text-caption text-grey-6">
              Showing <b>{{ filteredLogs.length }}</b> of <b>{{ allWorkLogs.length }}</b> entries
            </span>
          </div>
        </div>

        <!-- Loading State for History -->
        <div v-if="loadingHistory" class="row justify-center q-pa-xl">
          <q-spinner color="primary" size="44px" />
        </div>

        <!-- Error State for History -->
        <q-banner v-else-if="historyError" class="bg-negative text-white rounded-borders q-mb-md">
          {{ historyError }}
          <template #action>
            <q-btn flat no-caps label="Retry" @click="loadMyWorkLogs" />
          </template>
        </q-banner>

        <!-- Logs Feed -->
        <template v-else>
          <!-- Empty State -->
          <q-card
            v-if="filteredLogs.length === 0"
            flat
            bordered
            class="empty-state-card text-center q-pa-xl"
            :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
          >
            <q-avatar
              size="64px"
              color="grey-2"
              text-color="grey-6"
              icon="history_toggle_off"
              class="q-mb-md"
            />
            <div
              class="text-h6 text-weight-bold"
              :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
            >
              No Work Logs Found
            </div>
            <div class="text-body2 text-grey-6 q-mt-xs" style="max-width: 480px; margin: 0 auto">
              {{
                searchQuery || filterStatus !== 'ALL'
                  ? 'No work logs match your current search and filter criteria.'
                  : 'You have not submitted any work logs yet. Go to Daily Allocations to record effort on your tasks.'
              }}
            </div>
            <div class="row justify-center q-mt-md gap-sm">
              <q-btn
                v-if="searchQuery || filterStatus !== 'ALL'"
                flat
                no-caps
                label="Clear Filters"
                color="primary"
                @click="clearFilters"
              />
              <q-btn
                unelevated
                no-caps
                icon="today"
                label="Go to Daily Allocations"
                color="primary"
                @click="activeTab = 'daily'"
              />
            </div>
          </q-card>

          <!-- History Logs Cards -->
          <div v-else class="column q-gutter-y-sm">
            <q-card
              v-for="log in filteredLogs"
              :key="log.log_id"
              flat
              bordered
              class="log-history-card q-pa-md"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <div class="row items-start justify-between wrap gap-md">
                <!-- Left: Date & Task Details -->
                <div class="col-12 col-md-8">
                  <div class="row items-center gap-xs q-mb-xs wrap">
                    <q-chip
                      dense
                      square
                      size="sm"
                      color="primary"
                      text-color="white"
                      icon="event"
                      class="text-weight-bold"
                    >
                      {{ formatDate(log.log_date) }}
                    </q-chip>
                    <q-chip
                      v-if="log.task_status"
                      dense
                      square
                      size="sm"
                      :class="['status-chip', getTaskStatusClass(log.task_status)]"
                      class="text-weight-bold"
                    >
                      {{ formatStatusLabel(log.task_status) }}
                    </q-chip>
                    <span class="text-caption text-grey-6">
                      {{ log.project_name || `Project #${log.project_id}` }}
                    </span>
                  </div>

                  <!-- Task Title -->
                  <div
                    class="text-subtitle1 text-weight-bold cursor-pointer task-link"
                    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
                    @click="router.push(`/app/resource-dashboard/task-details/${log.task_id}`)"
                  >
                    {{ log.task_title || `Task #${log.task_id}` }}
                  </div>

                  <!-- Notes -->
                  <div
                    v-if="log.notes"
                    class="text-body2 q-mt-xs"
                    :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-8'"
                  >
                    {{ log.notes }}
                  </div>

                  <!-- Blockers Alert -->
                  <!--
                  <div
                    v-if="log.blockers"
                    class="row items-center gap-xs q-mt-xs text-negative text-caption text-weight-medium bg-red-soft q-pa-xs rounded-borders"
                  >
                    <q-icon name="warning" size="14px" />
                    <span><b>Blocker:</b> {{ log.blockers }}</span>
                  </div>
                  -->
                </div>

                <!-- Right: Effort, Progress & Action -->
                <div class="col-12 col-md-3 column items-end justify-between q-gutter-y-xs">
                  <div class="row items-center gap-sm">
                    <div class="column items-end">
                      <span class="text-caption text-grey-5">Effort Logged</span>
                      <span class="text-h6 text-weight-bold text-primary">
                        {{ formatHours(log.hours_logged) }}h
                      </span>
                    </div>

                    <div class="column items-end q-ml-md">
                      <span class="text-caption text-grey-5">Progress</span>
                      <span class="text-h6 text-weight-bold text-positive">
                        {{ log.progress_logged }}%
                      </span>
                    </div>
                  </div>

                  <q-btn
                    outline
                    no-caps
                    dense
                    size="sm"
                    icon="open_in_new"
                    label="View Task"
                    color="grey-7"
                    class="q-px-sm q-mt-sm"
                    @click="router.push(`/app/resource-dashboard/task-details/${log.task_id}`)"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </template>
      </div>
    </div>

    <!-- ADD WORK LOG MODAL -->
    <WorkLogDialog
      v-model="showWorkLogDialog"
      :task="selectedTask"
      :default-date="selectedDate"
      :saving="savingLog"
      :resource-progress="selectedTaskResourceProgress"
      @save="handleSaveWorkLog"
    />

    <!-- TASK SELECTOR DIALOG (if quick logging without pre-selected task) -->
    <q-dialog v-model="showTaskSelectorDialog">
      <q-card style="width: 480px; max-width: 95vw" :dark="$q.dark.isActive">
        <q-card-section class="row items-center justify-between q-pb-sm">
          <div class="text-subtitle1 text-weight-bold">Select Deliverable to Log Effort</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-none">
          <q-list separator>
            <q-item
              v-for="task in availableTasksForLogging"
              :key="task.task_id"
              clickable
              v-ripple
              @click="selectTaskAndLog(task)"
            >
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ task.title }}</q-item-label>
                <q-item-label caption
                  >{{ task.project_name }} · {{ formatStatusLabel(task.status) }}</q-item-label
                >
              </q-item-section>
              <q-item-section side>
                <q-btn round flat dense icon="add" color="primary" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  getDailyAllocationsApi,
  getMyWorkLogsApi,
  createWorkLogApi,
  submitDailyLogsApi,
  type DailyAllocationTask,
  type MyWorkLogItem,
  type CreateWorkLogPayload,
} from '@/services/api';
import { getTaskStatusClass, formatStatusLabel } from '@/utils/taskHelpers';
import WorkLogDialog from '@/components/tasks/WorkLogDialog.vue';

const $q = useQuasar();
const router = useRouter();

// View navigation tab: 'daily' or 'history'
const activeTab = ref<'daily' | 'history'>('daily');

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '';
  }
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ----------------------------------------------------
// DAILY ALLOCATIONS STATE
// ----------------------------------------------------
const selectedDate = ref<string>(formatLocalDate(new Date()));
const allocations = ref<DailyAllocationTask[]>([]);
const isCheckedOut = ref<boolean>(false);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

const showWorkLogDialog = ref<boolean>(false);
const showTaskSelectorDialog = ref<boolean>(false);
const selectedTask = ref<DailyAllocationTask | null>(null);
const savingLog = ref<boolean>(false);

const selectedTaskResourceProgress = computed<number | null>(() => {
  if (!selectedTask.value) return null;
  const taskId = Number(selectedTask.value.task_id);
  const myLog = allWorkLogs.value.find((l) => Number(l.task_id) === taskId);
  if (myLog !== undefined) {
    return Number(myLog.progress_logged);
  }
  const assigneesCount =
    (selectedTask.value.assigned_resource_ids && selectedTask.value.assigned_resource_ids.length) ||
    (selectedTask.value.assigned_resources && selectedTask.value.assigned_resources.length) ||
    0;
  if (assigneesCount > 1) {
    return 0;
  }
  return Number(selectedTask.value.progress) || 0;
});

const formattedDateDisplay = computed(() => {
  if (!selectedDate.value) return '';
  const [yearStr, monthStr, dayStr] = selectedDate.value.split('-');
  if (!yearStr || !monthStr || !dayStr) return selectedDate.value;
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
});

const totalScheduledHours = computed(() => {
  return allocations.value.reduce((sum, item) => sum + Number(item.scheduled_hours || 0), 0);
});

const totalLoggedHours = computed(() => {
  return allocations.value.reduce((sum, item) => sum + Number(item.hours_logged_today || 0), 0);
});

const totalLogsCount = computed(() => {
  return allocations.value.reduce(
    (sum, item) => sum + (item.logs_today ? item.logs_today.length : 0),
    0,
  );
});

function formatHours(val: unknown): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0';
  return parseFloat(Number(val).toFixed(2)).toString();
}

function changeDate(deltaDays: number) {
  const [yearStr, monthStr, dayStr] = selectedDate.value.split('-');
  const d = new Date(parseInt(yearStr!, 10), parseInt(monthStr!, 10) - 1, parseInt(dayStr!, 10));
  d.setDate(d.getDate() + deltaDays);
  selectedDate.value = formatLocalDate(d);
  void loadDailyAllocations();
}

function goToToday() {
  selectedDate.value = formatLocalDate(new Date());
  void loadDailyAllocations();
}

const todayStr = computed(() => formatLocalDate(new Date()));

const isSelectedDateFuture = computed(() => {
  return selectedDate.value > todayStr.value;
});

const isSelectedDateToday = computed(() => {
  return selectedDate.value === todayStr.value;
});

const isWeekend = computed(() => {
  if (!selectedDate.value) return false;
  const [yearStr, monthStr, dayStr] = selectedDate.value.split('-');
  const d = new Date(parseInt(yearStr!, 10), parseInt(monthStr!, 10) - 1, parseInt(dayStr!, 10));
  const day = d.getDay();
  return day === 0 || day === 6;
});

async function loadDailyAllocations() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getDailyAllocationsApi(selectedDate.value, todayStr.value);
    allocations.value = res.allocations || [];
    isCheckedOut.value = !!res.is_checked_out;
  } catch (err: unknown) {
    console.error('Failed to load daily allocations:', err);
    error.value = (err as Error)?.message || 'Failed to load daily work allocations';
  } finally {
    loading.value = false;
  }
}

function submitDailyLogs() {
  $q.dialog({
    title: "Submit Today's Logs",
    message:
      'Are you sure you want to submit your logs for today? This indicates you have left the office and will trigger a schedule recalculation. You cannot undo this action.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      loading.value = true;
      try {
        await submitDailyLogsApi(selectedDate.value);
        $q.notify({
          type: 'positive',
          message: 'Daily logs submitted successfully!',
          position: 'top',
        });
        await loadDailyAllocations();
        await loadMyWorkLogs();
      } catch (err: unknown) {
        console.error('Error submitting daily logs:', err);
        $q.notify({
          type: 'negative',
          message: (err as Error)?.message || 'Failed to submit logs',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    })();
  });
}

function openWorkLogDialog(task: DailyAllocationTask) {
  selectedTask.value = task;
  showWorkLogDialog.value = true;
}

// Available active tasks for quick logging
const availableTasksForLogging = computed(() => {
  return allocations.value.filter((t) => t.status !== 'COMPLETED' && !t.is_blocked);
});

function openTaskSelectionOrFirst() {
  if (availableTasksForLogging.value.length === 1) {
    openWorkLogDialog(availableTasksForLogging.value[0]!);
  } else if (availableTasksForLogging.value.length > 1) {
    showTaskSelectorDialog.value = true;
  } else if (allocations.value.length > 0) {
    openWorkLogDialog(allocations.value[0]!);
  }
}

function selectTaskAndLog(task: DailyAllocationTask) {
  showTaskSelectorDialog.value = false;
  openWorkLogDialog(task);
}

async function handleSaveWorkLog(payload: CreateWorkLogPayload) {
  if (!selectedTask.value) return;

  savingLog.value = true;
  try {
    await createWorkLogApi(selectedTask.value.task_id, payload);
    $q.notify({
      type: 'positive',
      message: 'Work log recorded successfully!',
      position: 'top',
    });
    showWorkLogDialog.value = false;
    // Reload both daily allocations and overall history in parallel
    await Promise.all([loadDailyAllocations(), loadMyWorkLogs()]);
  } catch (err: unknown) {
    console.error('Error saving work log:', err);
    $q.notify({
      type: 'negative',
      message: (err as Error)?.message || 'Failed to record work log',
      position: 'top',
    });
  } finally {
    savingLog.value = false;
  }
}

// ----------------------------------------------------
// ALL WORK LOGS HISTORY STATE
// ----------------------------------------------------
const allWorkLogs = ref<MyWorkLogItem[]>([]);
const allLogsStats = ref<{ total_hours: number; total_logs: number }>({
  total_hours: 0,
  total_logs: 0,
});
const loadingHistory = ref<boolean>(false);
const historyError = ref<string | null>(null);
const searchQuery = ref<string>('');
const filterStatus = ref<string>('ALL');

async function loadMyWorkLogs() {
  loadingHistory.value = true;
  historyError.value = null;
  try {
    const res = await getMyWorkLogsApi(100);
    allWorkLogs.value = res.logs || [];
    allLogsStats.value = {
      total_hours: res.total_hours || 0,
      total_logs: res.total_logs || 0,
    };
  } catch (err: unknown) {
    console.error('Failed to load my work logs:', err);
    historyError.value = (err as Error)?.message || 'Failed to load work log history';
  } finally {
    loadingHistory.value = false;
  }
}

const distinctTasksCount = computed(() => {
  const taskIds = new Set(allWorkLogs.value.map((l) => l.task_id));
  return taskIds.size;
});

const averageHoursPerEntry = computed(() => {
  if (!allLogsStats.value.total_logs) return '0';
  const avg = allLogsStats.value.total_hours / allLogsStats.value.total_logs;
  return parseFloat(avg.toFixed(1)).toString();
});

const filteredLogs = computed(() => {
  let list = allWorkLogs.value;

  if (filterStatus.value && filterStatus.value !== 'ALL') {
    list = list.filter((l) => l.task_status === filterStatus.value);
  }

  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(
      (l) =>
        (l.task_title && l.task_title.toLowerCase().includes(q)) ||
        (l.project_name && l.project_name.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q)) ||
        (l.blockers && l.blockers.toLowerCase().includes(q)),
    );
  }

  return list;
});

function clearFilters() {
  searchQuery.value = '';
  filterStatus.value = 'ALL';
}

function refreshCurrentTab() {
  if (activeTab.value === 'daily') {
    void loadDailyAllocations();
  } else {
    void loadMyWorkLogs();
  }
}

watch(activeTab, (tab) => {
  if (tab === 'history' && allWorkLogs.value.length === 0) {
    void loadMyWorkLogs();
  }
});

onMounted(() => {
  void loadDailyAllocations();
  void loadMyWorkLogs();
});
</script>

<style scoped>
.work-logs-page {
  min-height: 100vh;
}

.border-bottom-subtle {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.border-blue-subtle {
  border: 1px solid rgba(14, 165, 233, 0.2);
}

.date-nav-btn {
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.summary-card {
  padding: 13px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  min-height: 98px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.summary-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-purple-soft {
  background: rgba(124, 58, 237, 0.12);
}

.bg-blue-soft {
  background: rgba(14, 165, 233, 0.12);
}

.bg-green-soft {
  background: rgba(16, 185, 129, 0.12);
}

.bg-amber-soft {
  background: rgba(245, 158, 11, 0.12);
}

.bg-red-soft {
  background: rgba(239, 68, 68, 0.1);
}

.task-allocation-card,
.log-history-card {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition:
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

.task-allocation-card:hover,
.log-history-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.border-top-subtle {
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.task-link:hover {
  color: var(--q-primary);
  text-decoration: underline;
}

.prio-badge-critical {
  background: #fee2e2;
  color: #b91c1c;
}
.prio-badge-high {
  background: #ffedd5;
  color: #c2410c;
}
.prio-badge-medium {
  background: #fef3c7;
  color: #b45309;
}
.prio-badge-low {
  background: #f1f5f9;
  color: #475569;
}
</style>
