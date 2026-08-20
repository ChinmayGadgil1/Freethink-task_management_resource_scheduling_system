<template>
  <q-page class="q-pa-lg workspace-page">
    <!-- ========================================================= -->
    <!-- PAGE HEADER -->
    <!-- ========================================================= -->

    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center q-gutter-sm">
        <q-avatar size="42px" color="primary" text-color="white" icon="analytics" />

        <div>
          <div class="text-h5 text-weight-bold">Progress</div>

          <div class="text-body2 text-grey-6">
            Track your work, effort, deadlines and task progress.
          </div>
        </div>
      </div>

      <q-btn
        outline
        no-caps
        dense
        icon="refresh"
        label="Refresh"
        color="primary"
        :loading="loading"
        @click="loadTasks"
      />
    </div>

    <!-- ========================================================= -->
    <!-- LOADING -->
    <!-- ========================================================= -->

    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-3">
        <q-skeleton type="rect" height="140px" animation="fade" />
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- ERROR -->
    <!-- ========================================================= -->

    <q-banner v-else-if="error" class="bg-negative text-white q-mb-lg" rounded>
      {{ error }}

      <template #action>
        <q-btn flat no-caps label="Retry" @click="loadTasks" />
      </template>
    </q-banner>

    <template v-else>
      <!-- ======================================================= -->
      <!-- A. DAILY PROGRESS -->
      <!-- ======================================================= -->

      <q-card flat bordered class="q-mb-lg">
        <q-card-section class="q-pb-md">
          <div class="row items-center">
            <q-avatar size="40px" color="primary" text-color="white" icon="edit_note" />

            <div class="q-ml-md">
              <div class="text-subtitle1 text-weight-bold">Daily Progress</div>

              <div class="text-caption text-grey-6">
                Record today's work, progress and blockers.
              </div>
            </div>

            <q-space />

            <q-chip dense color="blue-1" text-color="primary" icon="today"> Daily Update </q-chip>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- Task -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="progressForm.task_id"
                :options="taskOptions"
                option-label="title"
                option-value="task_id"
                emit-value
                map-options
                label="Task *"
                outlined
                dense
                clearable
                @update:model-value="handleTaskSelection"
              />
            </div>

            <!-- Date -->
            <div class="col-12 col-md-6">
              <q-input v-model="progressForm.log_date" type="date" label="Date *" outlined dense />
            </div>

            <!-- Hours -->
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="progressForm.hours_logged"
                type="number"
                min="0"
                step="0.5"
                label="Hours Worked *"
                outlined
                dense
              />
            </div>

            <!-- Progress -->
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="progressForm.progress_logged"
                type="number"
                min="0"
                max="100"
                label="Progress % *"
                outlined
                dense
              />
            </div>

            <!-- Status -->
            <div class="col-12 col-md-4">
              <q-select
                v-model="progressForm.status"
                :options="progressStatusOptions"
                label="Status *"
                outlined
                dense
              />
            </div>

            <!-- Notes -->
            <div class="col-12">
              <q-input
                v-model="progressForm.notes"
                type="textarea"
                label="Work Update / Notes *"
                outlined
                dense
                rows="3"
              />
            </div>

            <!-- Blockers -->
            <div class="col-12">
              <q-input
                v-model="progressForm.blockers"
                type="textarea"
                label="Blockers (optional)"
                outlined
                dense
                rows="2"
              />
            </div>
          </div>

          <div class="row justify-end q-mt-md">
            <q-btn
              color="primary"
              unelevated
              no-caps
              icon="save"
              label="Submit Progress"
              class="q-px-md"
              :loading="submittingProgress"
              :disable="!canSubmitProgress"
              @click="submitProgress"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- ======================================================= -->
      <!-- B. PROGRESS HISTORY -->
      <!-- ======================================================= -->

      <q-card flat bordered class="q-mb-lg">
        <q-card-section class="q-pb-md">
          <div class="row items-center">
            <q-avatar size="40px" color="deep-purple" text-color="white" icon="history" />

            <div class="q-ml-md">
              <div class="text-subtitle1 text-weight-bold">Progress History</div>

              <div class="text-caption text-grey-6">
                Track how your task progress changes over time.
              </div>
            </div>

            <q-space />

            <q-btn
              v-if="selectedHistoryTask"
              flat
              round
              dense
              icon="refresh"
              color="grey-7"
              :loading="historyLoading"
              @click="loadHistory(selectedHistoryTask)"
            >
              <q-tooltip> Refresh history </q-tooltip>
            </q-btn>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <!-- Task selector -->
          <q-select
            v-model="selectedHistoryTask"
            :options="taskOptions"
            option-label="title"
            option-value="task_id"
            emit-value
            map-options
            label="Select Task"
            outlined
            dense
            clearable
            class="q-mb-md"
            @update:model-value="handleHistoryTaskSelection"
          />

          <!-- Loading -->
          <div v-if="historyLoading" class="column items-center q-pa-xl">
            <q-spinner color="primary" size="36px" />

            <div class="text-caption text-grey-6 q-mt-sm">Loading progress history...</div>
          </div>

          <!-- Error -->
          <q-banner v-else-if="historyError" class="bg-negative text-white" rounded>
            {{ historyError }}

            <template #action>
              <q-btn
                flat
                no-caps
                label="Retry"
                @click="selectedHistoryTask && loadHistory(selectedHistoryTask)"
              />
            </template>
          </q-banner>

          <!-- No task -->
          <q-card v-else-if="!selectedHistoryTask" flat bordered class="bg-grey-1">
            <q-card-section class="column items-center q-pa-xl">
              <q-avatar size="52px" color="grey-3" text-color="grey-6" icon="history" />

              <div class="text-body2 text-grey-6 q-mt-md">
                Select a task to view its progress history.
              </div>
            </q-card-section>
          </q-card>

          <!-- No history -->
          <q-card v-else-if="workLogs.length === 0" flat bordered class="bg-grey-1">
            <q-card-section class="column items-center q-pa-xl">
              <q-avatar size="52px" color="grey-3" text-color="grey-6" icon="history" />

              <div class="text-body2 text-grey-6 q-mt-md">
                No progress updates have been recorded for this task yet.
              </div>
            </q-card-section>
          </q-card>

          <!-- =================================================== -->
          <!-- TREND -->
          <!-- =================================================== -->

          <div v-else>
            <div class="text-subtitle2 text-weight-bold q-mb-xs">Progress Trend</div>

            <div class="text-caption text-grey-6 q-mb-md">
              Progress recorded over time for the selected task.
            </div>

            <!-- Current progress -->
            <q-card flat bordered class="bg-blue-1 q-mb-lg">
              <q-card-section>
                <div class="row items-center">
                  <div>
                    <div class="text-caption text-primary">Current Recorded Progress</div>

                    <div class="text-h4 text-weight-bold text-primary">
                      {{ selectedTaskProgress }}%
                    </div>
                  </div>

                  <q-space />

                  <q-circular-progress
                    :value="selectedTaskProgress"
                    size="64px"
                    :thickness="0.18"
                    color="primary"
                    track-color="blue-2"
                    show-value
                  >
                    <div class="text-caption text-weight-bold">{{ selectedTaskProgress }}%</div>
                  </q-circular-progress>
                </div>

                <q-linear-progress
                  :value="selectedTaskProgress / 100"
                  color="primary"
                  rounded
                  size="9px"
                  class="q-mt-md"
                />
              </q-card-section>
            </q-card>

            <!-- Trend entries -->
            <div class="q-mb-lg">
              <q-card
                v-for="(point, index) in progressTrend"
                :key="`${point.log_id}-${index}`"
                flat
                bordered
                class="q-mb-sm"
              >
                <q-card-section class="q-pa-md">
                  <div class="row items-center no-wrap">
                    <!-- Date -->
                    <div class="col-3 col-sm-2">
                      <div class="text-caption text-weight-medium">
                        {{ formatHistoryDate(point.log_date) }}
                      </div>

                      <div class="text-caption text-grey-6">{{ point.hours }}h worked</div>
                    </div>

                    <!-- Progress -->
                    <div class="col q-px-md">
                      <q-linear-progress
                        :value="point.progress / 100"
                        color="primary"
                        rounded
                        size="10px"
                      />
                    </div>

                    <!-- Percentage -->
                    <div class="col-auto">
                      <q-badge color="primary" rounded :label="`${point.progress}%`" />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- ================================================= -->
            <!-- HISTORY LIST -->
            <!-- ================================================= -->

            <div class="text-subtitle2 text-weight-bold q-mb-sm">Daily Updates</div>

            <q-list bordered separator class="rounded-borders">
              <q-item v-for="log in workLogs" :key="log.log_id" class="q-py-md">
                <q-item-section avatar top>
                  <q-avatar color="primary" text-color="white" icon="trending_up" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ formatHistoryDate(log.log_date) }}
                  </q-item-label>

                  <q-item-label caption class="q-mt-xs">
                    {{ Number(log.hours_logged) }}h worked · {{ Number(log.progress_logged) }}%
                    progress
                  </q-item-label>

                  <q-item-label class="q-mt-sm">
                    {{ log.notes }}
                  </q-item-label>

                  <q-item-label v-if="log.blockers" caption class="text-negative q-mt-xs">
                    <q-icon name="warning_amber" size="15px" class="q-mr-xs" />

                    {{ log.blockers }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side top>
                  <q-badge :color="statusColor(log.status)" :label="statusLabel(log.status)" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>

      <!-- ======================================================= -->
      <!-- C. PROGRESS SUMMARY -->
      <!-- ======================================================= -->

      <div class="row q-col-gutter-md q-mb-lg items-stretch">
        <!-- Overall -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="full-height">
            <q-card-section class="q-pa-md">
              <div class="row items-center no-wrap">
                <q-avatar size="38px" color="primary" text-color="white" icon="insights" />

                <div class="q-ml-sm">
                  <div class="text-caption text-grey-6">Overall Progress</div>

                  <div class="text-h5 text-weight-bold">{{ overallProgress }}%</div>
                </div>
              </div>

              <q-linear-progress
                :value="overallProgress / 100"
                color="primary"
                rounded
                size="7px"
                class="q-mt-md"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- Completed -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="full-height">
            <q-card-section class="q-pa-md">
              <div class="row items-center no-wrap">
                <q-avatar size="38px" color="positive" text-color="white" icon="check_circle" />

                <div class="q-ml-sm">
                  <div class="text-caption text-grey-6">Completed</div>

                  <div class="text-h5 text-weight-bold">
                    {{ completedTasks }}
                  </div>
                </div>
              </div>

              <div class="text-caption text-grey-6 q-mt-md">
                {{ completedTasks }} of {{ tasks.length }} tasks completed
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Active -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="full-height">
            <q-card-section class="q-pa-md">
              <div class="row items-center no-wrap">
                <q-avatar size="38px" color="info" text-color="white" icon="autorenew" />

                <div class="q-ml-sm">
                  <div class="text-caption text-grey-6">Active Tasks</div>

                  <div class="text-h5 text-weight-bold">
                    {{ activeTasks }}
                  </div>
                </div>
              </div>

              <div class="text-caption text-grey-6 q-mt-md">Tasks currently in progress</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Remaining -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="full-height">
            <q-card-section class="q-pa-md">
              <div class="row items-center no-wrap">
                <q-avatar size="38px" color="warning" text-color="white" icon="hourglass_empty" />

                <div class="q-ml-sm">
                  <div class="text-caption text-grey-6">Remaining Effort</div>

                  <div class="text-h5 text-weight-bold">{{ progressBasedRemainingEffort }}h</div>
                </div>
              </div>

              <div class="q-mt-md">
                <q-chip
                  dense
                  size="sm"
                  :color="delayedTasks ? 'negative' : 'positive'"
                  text-color="white"
                  icon="schedule"
                >
                  {{ delayedTasks }} delayed
                </q-chip>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- D. STATUS + EFFORT -->
      <!-- ======================================================= -->

      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Status -->
        <div class="col-12 col-md-5">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="row items-center">
                <q-avatar size="36px" color="blue-1" text-color="primary" icon="donut_large" />

                <div class="q-ml-sm">
                  <div class="text-subtitle1 text-weight-bold">Status Distribution</div>

                  <div class="text-caption text-grey-6">
                    Current breakdown of your assigned tasks.
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="segmented-bar q-mb-md">
                <div
                  v-for="seg in statusDistribution"
                  :key="seg.label"
                  class="segment"
                  :style="{
                    width: `${(seg.value / (tasks.length || 1)) * 100}%`,
                    background: seg.color,
                  }"
                />
              </div>

              <q-list separator>
                <q-item v-for="seg in statusDistribution" :key="seg.label" dense>
                  <q-item-section avatar>
                    <span class="dot" :style="{ background: seg.color }" />
                  </q-item-section>

                  <q-item-section>
                    {{ seg.label }}
                  </q-item-section>

                  <q-item-section side>
                    <q-badge
                      outline
                      :color="seg.label === 'Overdue' ? 'negative' : 'grey-7'"
                      :label="String(seg.value)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <!-- Effort -->
        <div class="col-12 col-md-7">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="row items-center">
                <q-avatar size="36px" color="orange-1" text-color="orange-9" icon="timer" />

                <div class="q-ml-sm">
                  <div class="text-subtitle1 text-weight-bold">Effort Analysis</div>

                  <div class="text-caption text-grey-6">
                    Compare planned effort, actual hours and remaining work.
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="row q-col-gutter-md">
                <!-- Expected -->
                <div class="col-6 col-sm-3">
                  <q-card flat bordered class="bg-grey-1 full-height">
                    <q-card-section>
                      <q-icon name="schedule" color="primary" size="22px" />

                      <div class="text-caption text-grey-6 q-mt-sm">Expected</div>

                      <div class="text-h6 text-weight-bold">{{ expectedEffort }}h</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Actual -->
                <div class="col-6 col-sm-3">
                  <q-card flat bordered class="bg-grey-1 full-height">
                    <q-card-section>
                      <q-icon name="timer" color="info" size="22px" />

                      <div class="text-caption text-grey-6 q-mt-sm">Actual</div>

                      <div class="text-h6 text-weight-bold">{{ actualEffort }}h</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Progress Remaining -->
                <div class="col-6 col-sm-3">
                  <q-card flat bordered class="bg-grey-1 full-height">
                    <q-card-section>
                      <q-icon name="hourglass_bottom" color="warning" size="22px" />

                      <div class="text-caption text-grey-6 q-mt-sm">Remaining</div>

                      <div class="text-h6 text-weight-bold">
                        {{ progressBasedRemainingEffort }}h
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Actual Remaining -->
                <div class="col-6 col-sm-3">
                  <q-card flat bordered class="bg-grey-1 full-height">
                    <q-card-section>
                      <q-icon name="access_time" color="positive" size="22px" />

                      <div class="text-caption text-grey-6 q-mt-sm">Hours Left</div>

                      <div class="text-h6 text-weight-bold">{{ actualHoursRemaining }}h</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Work Progress -->
                <div class="col-12">
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-grey-7"> Work Progress </span>

                    <q-badge color="primary" :label="`${overallProgress}%`" />
                  </div>

                  <q-linear-progress
                    :value="overallProgress / 100"
                    color="primary"
                    rounded
                    size="10px"
                  />
                </div>

                <!-- Effort -->
                <div class="col-12">
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-grey-7"> Effort Consumed </span>

                    <q-badge
                      :color="effortPercentage > 90 ? 'warning' : 'primary'"
                      :label="`${effortPercentage}%`"
                    />
                  </div>

                  <q-linear-progress
                    :value="effortPercentage / 100"
                    :color="effortPercentage > 90 ? 'warning' : 'primary'"
                    rounded
                    size="10px"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- E. DEADLINE PERFORMANCE -->
      <!-- ======================================================= -->

      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="36px" color="orange-1" text-color="orange-9" icon="event" />

            <div class="q-ml-sm">
              <div class="text-subtitle1 text-weight-bold">Deadline Performance</div>

              <div class="text-caption text-grey-6">
                Overview of your upcoming and overdue deadlines.
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="d in deadlinePerformance" :key="d.label" class="col-6 col-sm-3">
              <q-card flat bordered class="full-height">
                <q-card-section>
                  <div class="row items-center no-wrap">
                    <q-avatar size="34px" :color="d.color" text-color="white" :icon="d.icon" />

                    <div class="q-ml-sm">
                      <div class="text-caption text-grey-6">
                        {{ d.label }}
                      </div>

                      <div class="text-h6 text-weight-bold">
                        {{ d.value }}
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ======================================================= -->
      <!-- F. PROJECT PROGRESS -->
      <!-- ======================================================= -->

      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="36px" color="blue-1" text-color="primary" icon="folder" />

            <div class="q-ml-sm">
              <div class="text-subtitle1 text-weight-bold">Project Progress</div>

              <div class="text-caption text-grey-6">Your tasks grouped by project.</div>
            </div>

            <q-space />

            <q-badge color="primary" rounded :label="`${projectProgress.length} projects`" />
          </div>
        </q-card-section>

        <q-separator />

        <q-list v-if="projectProgress.length" separator>
          <q-item v-for="p in projectProgress" :key="p.project" class="q-py-md">
            <q-item-section avatar>
              <q-avatar size="38px" color="blue-1" text-color="primary" icon="folder" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ p.project }}
              </q-item-label>

              <q-item-label caption>
                {{ p.completed }}/{{ p.tasks }} completed · {{ p.active }} active
              </q-item-label>

              <q-linear-progress
                :value="p.progress / 100"
                color="primary"
                rounded
                size="7px"
                class="q-mt-sm"
              />
            </q-item-section>

            <q-item-section side>
              <q-badge color="primary" rounded :label="`${p.progress}%`" />

              <div class="text-caption text-grey-6 q-mt-xs">{{ p.expectedEffort }}h est</div>

              <div class="text-caption text-grey-6">{{ p.actualEffort }}h logged</div>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card v-else flat class="bg-grey-1">
          <q-card-section class="column items-center q-pa-xl">
            <q-avatar size="48px" color="grey-3" text-color="grey-6" icon="folder_off" />

            <div class="text-caption text-grey-6 q-mt-sm">No projects to show yet.</div>
          </q-card-section>
        </q-card>
      </q-card>

      <!-- ======================================================= -->
      <!-- G. WORK INSIGHTS -->
      <!-- ======================================================= -->

      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="36px" color="amber-1" text-color="amber-9" icon="lightbulb" />

            <div class="q-ml-sm">
              <div class="text-subtitle1 text-weight-bold">Work Insights</div>

              <div class="text-caption text-grey-6">
                Computed from your current tasks and progress.
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-list v-if="insights.length" separator>
          <q-item v-for="(insight, i) in insights" :key="i" class="q-py-md">
            <q-item-section avatar>
              <q-avatar size="32px" color="blue-1" text-color="primary" icon="lightbulb" />
            </q-item-section>

            <q-item-section>
              {{ insight }}
            </q-item-section>
          </q-item>
        </q-list>

        <q-card v-else flat class="bg-grey-1">
          <q-card-section class="column items-center q-pa-xl">
            <q-avatar size="48px" color="grey-3" text-color="grey-6" icon="task_alt" />

            <div class="text-caption text-grey-6 q-mt-sm">Nothing to flag right now.</div>
          </q-card-section>
        </q-card>
      </q-card>

      <!-- ======================================================= -->
      <!-- H. TASK PROGRESS -->
      <!-- ======================================================= -->

      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="36px" color="primary" text-color="white" icon="checklist" />

            <div class="q-ml-sm">
              <div class="text-subtitle1 text-weight-bold">Task Progress</div>

              <div class="text-caption text-grey-6">
                Every assigned task with progress, effort and deadline details.
              </div>
            </div>

            <q-space />

            <q-badge color="primary" rounded :label="`${tasks.length} tasks`" />
          </div>
        </q-card-section>

        <q-separator />

        <q-table
          v-if="tasks.length"
          flat
          :rows="taskRows"
          :columns="columns"
          row-key="task_id"
          :pagination="{ rowsPerPage: 10 }"
          @row-click="(_, row) => openTask(row.task_id)"
        >
          <template #body-cell-priority="props">
            <q-td :props="props">
              <q-badge :color="priorityColor(props.row.priority)" :label="props.row.priority" />
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="statusColor(props.row.status)"
                :label="statusLabel(props.row.status)"
              />
            </q-td>
          </template>

          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-linear-progress
                  :value="props.row.progress / 100"
                  color="primary"
                  rounded
                  class="col"
                  style="min-width: 60px"
                />

                <span class="text-caption q-ml-sm"> {{ props.row.progress }}% </span>
              </div>
            </q-td>
          </template>

          <template #body-cell-deadline="props">
            <q-td
              :props="props"
              :class="{
                'text-negative text-weight-medium': props.row.overdue,
              }"
            >
              <q-chip
                v-if="props.row.overdue"
                dense
                color="red-1"
                text-color="negative"
                icon="warning"
              >
                {{ props.row.deadlineLabel }}
              </q-chip>

              <span v-else>
                {{ props.row.deadlineLabel }}
              </span>
            </q-td>
          </template>
        </q-table>

        <q-card v-else flat class="bg-grey-1">
          <q-card-section class="column items-center q-pa-xl">
            <q-avatar size="48px" color="grey-3" text-color="grey-6" icon="task_alt" />

            <div class="text-body2 text-grey-6 q-mt-sm">No tasks assigned to you.</div>
          </q-card-section>
        </q-card>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  createWorkLogApi,
  getTasksApi,
  getWorkLogsApi,
  getResourceWorkloadApi,
  type Task,
  type ResourceWorkload,
  type WorkLog,
} from '@/services/api';

const router = useRouter();

/* =========================================================
   TASK DATA
   ========================================================= */

const tasks = ref<Task[]>([]);
const workloadData = ref<ResourceWorkload | null>(null);

const loading = ref(true);
const error = ref('');

/* =========================================================
   DAILY PROGRESS
   ========================================================= */

const submittingProgress = ref(false);

const progressStatusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] as const;

const today = new Date().toISOString().split('T')[0] ?? '';

interface ProgressForm {
  task_id: number | null;
  log_date: string;
  hours_logged: number;
  progress_logged: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  notes: string;
  blockers: string;
}

const progressForm = ref<ProgressForm>({
  task_id: null,
  log_date: today,
  hours_logged: 0,
  progress_logged: 0,
  status: 'IN_PROGRESS',
  notes: '',
  blockers: '',
});

const taskOptions = computed(() => tasks.value);

const canSubmitProgress = computed(() => {
  return (
    progressForm.value.task_id !== null &&
    progressForm.value.log_date !== '' &&
    Number(progressForm.value.hours_logged) > 0 &&
    Number(progressForm.value.progress_logged) >= 0 &&
    Number(progressForm.value.progress_logged) <= 100 &&
    progressForm.value.notes.trim().length > 0
  );
});

function resetProgressForm() {
  progressForm.value = {
    task_id: null,
    log_date: new Date().toISOString().split('T')[0] ?? '',
    hours_logged: 0,
    progress_logged: 0,
    status: 'IN_PROGRESS',
    notes: '',
    blockers: '',
  };
}

function handleTaskSelection(taskId: number | null) {
  if (!taskId) {
    progressForm.value.progress_logged = 0;
    progressForm.value.status = 'IN_PROGRESS';
    return;
  }

  const task = tasks.value.find((item) => item.task_id === taskId);

  if (!task) {
    return;
  }

  progressForm.value.progress_logged = Number(task.progress) || 0;

  progressForm.value.status = task.status;
}

async function submitProgress() {
  if (!canSubmitProgress.value) {
    return;
  }

  const taskId = progressForm.value.task_id;

  if (!taskId) {
    return;
  }

  submittingProgress.value = true;

  try {
    await createWorkLogApi(taskId, {
      hours_logged: Number(progressForm.value.hours_logged),
      progress_logged: Number(progressForm.value.progress_logged),
      status: progressForm.value.status,
      notes: progressForm.value.notes.trim(),
      blockers: progressForm.value.blockers.trim() || null,
      log_date: progressForm.value.log_date,
    });

    resetProgressForm();

    await loadTasks();

    selectedHistoryTask.value = taskId;

    await loadHistory(taskId);

    window.alert('Daily progress submitted successfully.');
  } catch (err) {
    console.error('Failed to submit progress:', err);

    window.alert(err instanceof Error ? err.message : 'Failed to submit daily progress.');
  } finally {
    submittingProgress.value = false;
  }
}

/* =========================================================
   PROGRESS HISTORY
   ========================================================= */

const selectedHistoryTask = ref<number | null>(null);

const workLogs = ref<WorkLog[]>([]);

const historyLoading = ref(false);
const historyError = ref('');

async function handleHistoryTaskSelection(taskId: number | null) {
  workLogs.value = [];
  historyError.value = '';

  if (!taskId) {
    return;
  }

  await loadHistory(taskId);
}

async function loadHistory(taskId: number) {
  historyLoading.value = true;
  historyError.value = '';

  try {
    workLogs.value = await getWorkLogsApi(taskId);
  } catch (err) {
    console.error('Failed to load progress history:', err);

    historyError.value = err instanceof Error ? err.message : 'Failed to load progress history.';
  } finally {
    historyLoading.value = false;
  }
}

function formatHistoryDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* =========================================================
   PROGRESS TREND
   ========================================================= */

const progressTrend = computed(() => {
  return [...workLogs.value]
    .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
    .map((log) => ({
      log_id: log.log_id,
      log_date: log.log_date,
      progress: Math.min(100, Math.max(0, Number(log.progress_logged) || 0)),
      hours: Number(log.hours_logged) || 0,
    }));
});

const selectedTaskProgress = computed(() => {
  if (!progressTrend.value.length) {
    return 0;
  }

  return progressTrend.value[progressTrend.value.length - 1]?.progress ?? 0;
});

/* =========================================================
   LOAD TASKS
   ========================================================= */

async function loadTasks() {
  loading.value = true;
  error.value = '';

  try {
    const [fetchedTasks, fetchedWorkload] = await Promise.all([
      getTasksApi(),
      getResourceWorkloadApi().catch(() => null),
    ]);

    tasks.value = fetchedTasks;
    workloadData.value = fetchedWorkload;

    if (
      selectedHistoryTask.value &&
      !tasks.value.some((task) => task.task_id === selectedHistoryTask.value)
    ) {
      selectedHistoryTask.value = null;
      workLogs.value = [];
    }
  } catch (err) {
    console.error('Failed to load progress:', err);

    error.value = err instanceof Error ? err.message : 'Failed to load your progress.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadTasks();
});

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function isOverdue(task: Task): boolean {
  if (task.status === 'COMPLETED' || !task.deadline) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return new Date(task.deadline) < today;
}

function daysUntil(deadline: string): number {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const d = new Date(deadline);

  d.setHours(0, 0, 0, 0);

  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function formatDate(date: string | null) {
  if (!date) {
    return 'No deadline';
  }

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* =========================================================
   SUMMARY
   ========================================================= */

const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'COMPLETED').length);

const activeTasks = computed(() => tasks.value.filter((t) => t.status !== 'COMPLETED').length);

const delayedTasks = computed(() => tasks.value.filter(isOverdue).length);

const overallProgress = computed(() => {
  if (!tasks.value.length) {
    return 0;
  }

  return Math.round(
    tasks.value.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / tasks.value.length,
  );
});

/* =========================================================
   EFFORT
   ========================================================= */

const expectedEffort = computed(() => {
  if (workloadData.value) {
    return Number(workloadData.value.total_expected_effort) || 0;
  }

  return tasks.value.reduce((s, t) => s + (Number(t.expected_effort) || 0), 0);
});

const actualEffort = computed(() => {
  if (workloadData.value) {
    return Number(workloadData.value.total_actual_effort) || 0;
  }

  return tasks.value.reduce((s, t) => s + (Number(t.actual_effort) || 0), 0);
});

const progressBasedRemainingEffort = computed(() => {
  if (!expectedEffort.value) {
    return 0;
  }

  return Number(((expectedEffort.value * (100 - overallProgress.value)) / 100).toFixed(2));
});

const actualHoursRemaining = computed(() =>
  Math.max(Number((expectedEffort.value - actualEffort.value).toFixed(2)), 0),
);

const effortPercentage = computed(() =>
  expectedEffort.value
    ? Math.min(100, Math.round((actualEffort.value / expectedEffort.value) * 100))
    : 0,
);

/* =========================================================
   STATUS DISTRIBUTION
   ========================================================= */

const statusDistribution = computed(() => [
  {
    label: 'Completed',
    value: tasks.value.filter((t) => t.status === 'COMPLETED').length,
    color: '#27AE60',
  },
  {
    label: 'In Progress',
    value: tasks.value.filter((t) => t.status === 'IN_PROGRESS').length,
    color: '#2E90FA',
  },
  {
    label: 'Pending',
    value: tasks.value.filter((t) => t.status === 'PENDING').length,
    color: '#98A2B3',
  },
  {
    label: 'On Hold',
    value: tasks.value.filter((t) => t.status === 'ON_HOLD').length,
    color: '#E89532',
  },
  {
    label: 'Overdue',
    value: delayedTasks.value,
    color: '#E15263',
  },
]);

/* =========================================================
   DEADLINE PERFORMANCE
   ========================================================= */

const deadlinePerformance = computed(() => {
  const noDeadline = tasks.value.filter((t) => !t.deadline).length;

  const overdue = tasks.value.filter(isOverdue).length;

  const completed = tasks.value.filter((t) => t.status === 'COMPLETED').length;

  const dueSoon = tasks.value.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) {
      return false;
    }

    const days = daysUntil(t.deadline);

    return days >= 0 && days <= 7;
  }).length;

  return [
    {
      label: 'Completed',
      value: completed,
      icon: 'check_circle',
      color: 'positive',
    },
    {
      label: 'Due within 7 days',
      value: dueSoon,
      icon: 'schedule',
      color: 'warning',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: 'warning',
      color: 'negative',
    },
    {
      label: 'No deadline',
      value: noDeadline,
      icon: 'event_busy',
      color: 'grey-6',
    },
  ];
});

/* =========================================================
   PROJECT PROGRESS
   ========================================================= */

const projectProgress = computed(() => {
  const groups = new Map<
    string,
    {
      project: string;
      tasks: number;
      completed: number;
      active: number;
      progressTotal: number;
      expectedEffort: number;
      actualEffort: number;
    }
  >();

  for (const task of tasks.value) {
    const project = task.project_name ?? `Project #${task.project_id}`;

    const existing = groups.get(project);

    if (existing) {
      existing.tasks += 1;

      existing.completed += task.status === 'COMPLETED' ? 1 : 0;

      existing.active += task.status !== 'COMPLETED' ? 1 : 0;

      existing.progressTotal += Number(task.progress) || 0;

      existing.expectedEffort += Number(task.expected_effort) || 0;

      existing.actualEffort += Number(task.actual_effort) || 0;
    } else {
      groups.set(project, {
        project,
        tasks: 1,
        completed: task.status === 'COMPLETED' ? 1 : 0,
        active: task.status !== 'COMPLETED' ? 1 : 0,
        progressTotal: Number(task.progress) || 0,
        expectedEffort: Number(task.expected_effort) || 0,
        actualEffort: Number(task.actual_effort) || 0,
      });
    }
  }

  return Array.from(groups.values()).map((p) => ({
    project: p.project,
    tasks: p.tasks,
    completed: p.completed,
    active: p.active,

    progress: p.tasks ? Math.round(p.progressTotal / p.tasks) : 0,

    expectedEffort: p.expectedEffort,

    actualEffort: p.actualEffort,

    remainingEffort: Math.max(p.expectedEffort - p.actualEffort, 0),
  }));
});

/* =========================================================
   WORK INSIGHTS
   ========================================================= */

const insights = computed(() => {
  const result: string[] = [];

  if (delayedTasks.value > 0) {
    result.push(
      `${delayedTasks.value} task${delayedTasks.value > 1 ? 's are' : ' is'} currently overdue.`,
    );
  }

  if (actualEffort.value > expectedEffort.value) {
    result.push('Actual effort has exceeded the expected effort.');
  }

  const dueSoon = tasks.value.filter((t) => {
    if (!t.deadline || t.status === 'COMPLETED' || isOverdue(t)) {
      return false;
    }

    const days = daysUntil(t.deadline);

    return days >= 0 && days <= 7;
  }).length;

  if (dueSoon > 0) {
    result.push(`${dueSoon} task${dueSoon > 1 ? 's are' : ' is'} due within the next 7 days.`);
  }

  if (completedTasks.value === tasks.value.length && tasks.value.length > 0) {
    result.push('All assigned tasks are completed.');
  }

  if (actualEffort.value > expectedEffort.value && expectedEffort.value > 0) {
    result.push(
      'Logged effort is higher than the planned effort. Review remaining work and task estimates.',
    );
  }

  return result;
});

/* =========================================================
   TASK TABLE
   ========================================================= */

const columns = [
  {
    name: 'title',
    label: 'Task',
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'project',
    label: 'Project',
    field: 'project',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'priority',
    label: 'Priority',
    field: 'priority',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'progress',
    label: 'Progress',
    field: 'progress',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'deadline',
    label: 'Deadline',
    field: 'deadlineLabel',
    align: 'left' as const,
    sortable: true,
  },
];

const taskRows = computed(() =>
  tasks.value.map((task) => ({
    ...task,

    project: task.project_name ?? `Project #${task.project_id}`,

    progress: Number(task.progress) || 0,

    deadlineLabel: formatDate(task.deadline),

    overdue: isOverdue(task),
  })),
);

function priorityColor(priority: Task['priority']) {
  switch (priority) {
    case 'CRITICAL':
      return 'negative';

    case 'HIGH':
      return 'orange';

    case 'MEDIUM':
      return 'primary';

    case 'LOW':
      return 'grey';

    default:
      return 'grey';
  }
}

function statusColor(status: Task['status']) {
  switch (status) {
    case 'COMPLETED':
      return 'positive';

    case 'IN_PROGRESS':
      return 'primary';

    case 'ON_HOLD':
      return 'orange';

    case 'PENDING':
      return 'grey';

    default:
      return 'grey';
  }
}

function statusLabel(status: Task['status']) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';

    case 'ON_HOLD':
      return 'On Hold';

    case 'COMPLETED':
      return 'Completed';

    case 'PENDING':
      return 'Pending';

    default:
      return status;
  }
}

function openTask(taskId: number) {
  void router.push(`/app/resource-dashboard/task-details?id=${taskId}`);
}
</script>

<style scoped lang="scss">
.workspace-page {
  background: var(--wo-bg-page, #f8f9fa);
}

.segmented-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #eaecf0;
}

.segment {
  min-width: 2px;
  height: 100%;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.empty-block {
  padding: 40px 16px;
  text-align: center;
}

.rounded-borders {
  border-radius: 8px;
}
</style>
