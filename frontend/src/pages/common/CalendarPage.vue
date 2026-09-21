<template>
  <q-page
    :class="[
      $q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark',
      $q.screen.lt.sm ? 'q-pa-xs q-pt-sm' : $q.screen.lt.md ? 'q-pa-md' : 'q-pa-lg',
    ]"
  >
    <div class="q-mx-auto" style="max-width: 1400px">
      <!-- 1. PAGE TITLE & SUBTITLE -->
      <div class="q-mb-md" :class="$q.screen.lt.sm ? 'q-px-xs' : ''">
        <div
          class="page-title text-weight-bold"
          :class="[
            $q.screen.lt.sm ? 'text-h6' : 'text-h5',
            $q.dark.isActive ? 'text-white' : 'text-dark',
          ]"
        >
          Company Calendar
        </div>
        <div
          class="q-mt-xs"
          :class="[
            $q.screen.lt.sm ? 'text-caption' : 'text-body2',
            $q.dark.isActive ? 'text-grey-4' : 'text-grey-6',
          ]"
        >
          Track official organization holidays, weekends, and team working schedule
        </div>
      </div>

      <!-- 2. TOOLBAR: METRICS (LEFT) & CONTROLS (RIGHT) -->
      <div class="row items-center justify-between full-width q-mb-md wrap q-col-gutter-xs">
        <!-- Left: Summary Badges -->
        <div class="row items-center q-gutter-xs q-gutter-sm-sm">
          <!-- Compact Summary Badge 1: Total Holidays -->
          <q-card
            flat
            bordered
            :dark="$q.dark.isActive"
            class="row items-center q-px-sm q-py-xs rounded-borders q-gutter-xs"
          >
            <q-avatar
              :size="$q.screen.lt.sm ? '20px' : '24px'"
              rounded
              :color="$q.dark.isActive ? 'blue-10' : 'blue-1'"
              :text-color="$q.dark.isActive ? 'blue-2' : 'primary'"
              icon="event"
            />
            <div class="column">
              <span class="text-caption text-grey-6" style="font-size: 10px; line-height: 1"
                >Total Holidays</span
              >
              <span class="text-weight-bold" style="font-size: 13px; line-height: 1.2">{{
                holidays.length
              }}</span>
            </div>
          </q-card>

          <!-- Compact Summary Badge 2: This Month -->
          <q-card
            flat
            bordered
            :dark="$q.dark.isActive"
            class="row items-center q-px-sm q-py-xs rounded-borders q-gutter-xs"
          >
            <q-avatar
              :size="$q.screen.lt.sm ? '20px' : '24px'"
              rounded
              :color="$q.dark.isActive ? 'purple-10' : 'purple-1'"
              :text-color="$q.dark.isActive ? 'purple-2' : 'purple'"
              icon="upcoming"
            />
            <div class="column">
              <span class="text-caption text-grey-6" style="font-size: 10px; line-height: 1"
                >This Month</span
              >
              <span class="text-weight-bold" style="font-size: 13px; line-height: 1.2">{{
                currentMonthHolidaysCount
              }}</span>
            </div>
          </q-card>
        </div>

        <!-- Right: Action Buttons Pushed to Right -->
        <div class="row items-center q-gutter-xs q-gutter-sm-sm wrap">
          <!-- View mode toggle: Month Grid vs List -->
          <q-btn-toggle
            v-model="viewMode"
            toggle-color="primary"
            toggle-text-color="white"
            :color="$q.dark.isActive ? 'grey-9' : 'white'"
            :text-color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
            dense
            unelevated
            :options="[
              { label: $q.screen.lt.sm ? '' : 'Calendar', value: 'grid', icon: 'grid_view' },
              {
                label: $q.screen.lt.sm ? '' : 'List View',
                value: 'list',
                icon: 'format_list_bulleted',
              },
            ]"
          >
            <template #default>
              <q-tooltip>{{ viewMode === 'grid' ? 'Calendar View' : 'List View' }}</q-tooltip>
            </template>
          </q-btn-toggle>

          <!-- Import Holidays Button (PM Only) -->
          <q-btn
            v-if="isProjectManager"
            color="primary"
            outline
            icon="upload_file"
            :label="$q.screen.lt.sm ? 'Import' : 'Import Holidays'"
            unelevated
            dense
            no-caps
            class="text-weight-bold rounded-borders q-px-sm"
            @click="openImportHolidayDialog()"
          />

          <!-- Add Holiday Button (PM Only) -->
          <q-btn
            v-if="isProjectManager"
            color="primary"
            icon="add"
            :label="$q.screen.lt.sm ? 'Add' : 'Add Holiday'"
            unelevated
            dense
            no-caps
            class="text-weight-bold rounded-borders q-px-sm"
            @click="openAddHolidayDialog()"
          />

          <!-- Delete Multiple Button (PM Only) -->
          <q-btn
            v-if="isProjectManager && holidays.length > 0"
            color="negative"
            outline
            icon="delete_sweep"
            :label="$q.screen.lt.sm ? 'Delete' : 'Delete Multiple'"
            unelevated
            dense
            no-caps
            class="text-weight-bold rounded-borders q-px-sm"
            @click="switchToListViewForBatchDelete()"
          />

          <!-- Refresh Button -->
          <q-btn
            flat
            round
            dense
            icon="refresh"
            :color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
            :loading="loading"
            @click="loadHolidays"
          >
            <q-tooltip>Refresh Calendar</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- 2. MONTH CALENDAR GRID VIEW -->
      <q-card
        v-if="viewMode === 'grid'"
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders overflow-hidden"
      >
        <!-- Calendar Toolbar & Month Switcher -->
        <q-card-section
          :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'"
          class="row items-center justify-between wrap q-col-gutter-xs"
        >
          <!-- Month Navigation -->
          <div class="row items-center q-gutter-xs">
            <q-btn flat dense round icon="chevron_left" @click="prevMonth">
              <q-tooltip>Previous Month</q-tooltip>
            </q-btn>

            <div
              class="text-weight-bold q-px-xs text-center"
              :class="$q.screen.lt.sm ? 'text-body1' : 'text-subtitle1'"
              :style="{ minWidth: $q.screen.lt.sm ? '120px' : '160px' }"
            >
              {{ currentMonthName }}
              <span class="text-grey-6 text-weight-medium">{{ currentYear }}</span>
            </div>

            <q-btn flat dense round icon="chevron_right" @click="nextMonth">
              <q-tooltip>Next Month</q-tooltip>
            </q-btn>

            <q-btn
              outline
              dense
              no-caps
              label="Today"
              class="q-px-sm q-ml-xs"
              :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
              @click="goToToday"
            />
          </div>

          <!-- Visual Legend -->
          <div
            class="row items-center q-gutter-xs q-gutter-sm-sm text-caption text-grey-6"
            :class="$q.screen.lt.sm ? 'q-mt-xs' : ''"
          >
            <div class="row items-center q-gutter-xs">
              <q-badge
                rounded
                color="amber-8"
                style="width: 7px; height: 7px; min-height: 0; padding: 0"
              />
              <span :style="$q.screen.lt.sm ? 'font-size: 11px' : ''">{{
                $q.screen.lt.sm ? 'Holiday' : 'Holiday (No Work)'
              }}</span>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-badge
                rounded
                color="grey-6"
                style="width: 7px; height: 7px; min-height: 0; padding: 0"
              />
              <span :style="$q.screen.lt.sm ? 'font-size: 11px' : ''">{{
                $q.screen.lt.sm ? 'Off Day' : 'Non-Working Day (Off)'
              }}</span>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-badge
                rounded
                outline
                color="grey-7"
                style="width: 7px; height: 7px; min-height: 0; padding: 0"
              />
              <span :style="$q.screen.lt.sm ? 'font-size: 11px' : ''">{{
                $q.screen.lt.sm ? 'Working' : 'Working Day'
              }}</span>
            </div>
          </div>
        </q-card-section>

        <q-separator :dark="$q.dark.isActive" />

        <!-- Quasar QCalendar Month Component wrapped in scroll wrapper -->
        <div class="calendar-scroll-wrapper">
          <q-calendar-month
            ref="calendarRef"
            v-model="selectedDate"
            :dark="$q.dark.isActive"
            :bordered="true"
            :hoverable="true"
            :focusable="true"
            :short-weekday-label="true"
            :day-min-height="$q.screen.lt.sm ? 70 : 115"
            :weekdays="[0, 1, 2, 3, 4, 5, 6]"
            class="q-calendar-custom full-width"
          >
            <template #day="{ scope: { timestamp } }">
              <div
                class="calendar-day-cell full-height column justify-between cursor-pointer"
                :class="[
                  $q.screen.lt.sm ? 'q-pa-xs' : 'q-pa-sm',
                  getDayBgClass(timestamp),
                  {
                    dimmed: timestamp.outside,
                    'today-cell': timestamp.current,
                  },
                ]"
                @click="onDayClick(timestamp.date, timestamp.weekday)"
              >
                <!-- Cell Top: Day Number & Add Action -->
                <div class="row items-center justify-between no-wrap q-mb-xs">
                  <div class="row items-center no-wrap" style="gap: 3px">
                    <q-avatar
                      :size="$q.screen.lt.sm ? '19px' : '24px'"
                      :font-size="$q.screen.lt.sm ? '10px' : '12px'"
                      rounded
                      :color="timestamp.current ? 'primary' : undefined"
                      :text-color="
                        timestamp.current
                          ? 'white'
                          : timestamp.outside
                            ? $q.dark.isActive
                              ? 'grey-7'
                              : 'grey-5'
                            : isDateKeyNonWorking(timestamp.date, timestamp.weekday)
                              ? $q.dark.isActive
                                ? 'grey-5'
                                : 'grey-6'
                              : $q.dark.isActive
                                ? 'grey-3'
                                : 'grey-9'
                      "
                      class="text-weight-bold"
                    >
                      {{ timestamp.day }}
                    </q-avatar>

                    <q-badge
                      v-if="
                        isDateKeyNonWorking(timestamp.date, timestamp.weekday) && !timestamp.outside
                      "
                      :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                      :text-color="$q.dark.isActive ? 'grey-4' : 'grey-7'"
                      class="text-weight-bold"
                      :style="
                        $q.screen.lt.sm
                          ? 'font-size: 8px; padding: 1px 3px; line-height: 1;'
                          : 'font-size: 9px; padding: 1px 4px;'
                      "
                    >
                      OFF
                    </q-badge>
                  </div>

                  <!-- Quick Add (+) on Hover for PMs on desktop -->
                  <q-btn
                    v-if="
                      isProjectManager && !holidaysByDate.get(timestamp.date) && !$q.screen.lt.sm
                    "
                    flat
                    round
                    dense
                    icon="add"
                    size="xs"
                    color="primary"
                    class="quick-add-btn"
                    @click.stop="openAddHolidayDialog(timestamp.date)"
                  >
                    <q-tooltip>Add holiday on {{ timestamp.date }}</q-tooltip>
                  </q-btn>
                </div>

                <!-- Cell Center / Holiday Badge -->
                <div class="col column justify-start" style="min-width: 0; width: 100%">
                  <q-card
                    v-if="holidaysByDate.get(timestamp.date)"
                    flat
                    bordered
                    :dark="$q.dark.isActive"
                    class="holiday-badge-card full-width rounded-borders cursor-pointer"
                    :class="$q.screen.lt.sm ? 'q-px-xs q-py-xs' : 'q-pa-xs'"
                    @click.stop="onHolidayClick(holidaysByDate.get(timestamp.date)!)"
                  >
                    <div class="row items-start no-wrap" style="width: 100%; min-width: 0">
                      <q-badge
                        rounded
                        color="amber-8"
                        class="flex-shrink-0 q-mt-xs"
                        :style="
                          $q.screen.lt.sm
                            ? 'width: 5px; height: 5px; min-height: 0; padding: 0; margin-right: 4px;'
                            : 'width: 6px; height: 6px; min-height: 0; padding: 0; margin-right: 5px;'
                        "
                      />
                      <div
                        class="text-caption text-weight-bold col holiday-desc-text"
                        :style="
                          $q.screen.lt.sm
                            ? 'font-size: 9.5px; line-height: 1.2'
                            : 'font-size: 11px; line-height: 1.25'
                        "
                      >
                        {{ holidaysByDate.get(timestamp.date)!.description }}
                      </div>

                      <q-icon
                        v-if="isProjectManager && !$q.screen.lt.sm"
                        name="edit"
                        size="11px"
                        class="q-ml-xs flex-shrink-0 q-mt-xs text-grey-6"
                      />
                    </div>

                    <!-- Enhanced Hover Tooltip to clearly show holiday name and date -->
                    <q-tooltip
                      :delay="100"
                      class="bg-grey-10 text-white shadow-4 q-pa-sm rounded-borders"
                      anchor="top middle"
                      self="bottom middle"
                      :offset="[0, 6]"
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <div class="row items-center q-gutter-xs no-wrap">
                        <q-icon name="celebration" color="amber-4" size="16px" />
                        <span class="text-weight-bold" style="font-size: 12px">
                          {{ holidaysByDate.get(timestamp.date)!.description }}
                        </span>
                      </div>
                      <div class="text-caption text-amber-2 q-mt-xs" style="font-size: 10.5px">
                        {{ formatPrettyDate(timestamp.date) }}
                      </div>
                    </q-tooltip>
                  </q-card>
                </div>
              </div>
            </template>
          </q-calendar-month>
        </div>
      </q-card>

      <!-- 3. LIST / TABLE VIEW -->
      <q-card
        v-else
        flat
        bordered
        :dark="$q.dark.isActive"
        class="rounded-borders overflow-hidden"
        :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'"
      >
        <q-table
          flat
          :rows="holidays"
          :columns="columns"
          row-key="holiday_id"
          :loading="loading"
          :pagination="{ rowsPerPage: 15 }"
          :dark="$q.dark.isActive"
          no-data-label="No holidays scheduled yet."
          :selection="isProjectManager ? 'multiple' : 'none'"
          v-model:selected="selectedHolidays"
        >
          <template v-if="isProjectManager && selectedHolidays.length > 0" #top>
            <div
              class="row full-width items-center justify-between q-py-sm q-px-md rounded-borders wrap q-col-gutter-xs"
              :class="$q.dark.isActive ? 'bg-grey-9 text-red-3' : 'bg-red-1 text-negative'"
            >
              <div class="row items-center q-gutter-sm">
                <q-chip color="negative" text-color="white" dense class="text-weight-bold">
                  {{ selectedHolidays.length }} selected
                </q-chip>
                <span v-if="!$q.screen.lt.sm" class="text-caption text-weight-medium">
                  Holidays selected for bulk removal
                </span>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-btn
                  flat
                  dense
                  no-caps
                  label="Clear"
                  color="grey-7"
                  @click="selectedHolidays = []"
                />
                <q-btn
                  unelevated
                  dense
                  no-caps
                  icon="delete_sweep"
                  color="negative"
                  :label="`Delete (${selectedHolidays.length})`"
                  class="q-px-sm text-weight-bold"
                  @click="openBatchDeleteDialog()"
                />
              </div>
            </div>
          </template>

          <template #body-cell-holiday_date="props">
            <q-td :props="props">
              <div class="text-weight-bold" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                {{ formatPrettyDate(props.row.holiday_date) }}
              </div>
              <div class="text-caption text-grey-6">
                {{ getDayOfWeekName(props.row.holiday_date) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-description="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                size="sm"
                icon="event"
                :label="props.row.description"
                class="holiday-badge-card text-weight-bold"
              />
            </q-td>
          </template>

          <template v-if="isProjectManager" #body-cell-actions="props">
            <q-td :props="props" align="right">
              <div class="row items-center justify-end q-gutter-xs no-wrap">
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="edit"
                  size="sm"
                  @click="openEditHolidayDialog(props.row)"
                >
                  <q-tooltip>Edit Holiday</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  size="sm"
                  @click="confirmDeleteHoliday(props.row)"
                >
                  <q-tooltip>Delete Holiday</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- 4. ADD / EDIT HOLIDAY MODAL (PM ONLY) -->
    <q-dialog v-model="holidayDialog.show" persistent>
      <q-card :dark="$q.dark.isActive" style="width: 480px; max-width: 92vw">
        <!-- Dialog Header -->
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center q-gutter-xs">
            <q-avatar
              size="32px"
              rounded
              :color="$q.dark.isActive ? 'blue-10' : 'blue-1'"
              :text-color="$q.dark.isActive ? 'blue-2' : 'primary'"
              icon="event"
            />
            <div class="text-subtitle1 text-weight-bold q-ml-xs">
              {{ holidayDialog.isEdit ? 'Edit Holiday' : 'Add Holiday' }}
            </div>
          </div>
          <q-btn flat round dense icon="close" size="sm" color="grey-6" v-close-popup />
        </q-card-section>

        <!-- Dialog Form Body -->
        <q-form @submit.prevent="saveHoliday">
          <q-card-section class="q-pt-md q-gutter-y-md">
            <!-- Date Input with Date Picker Popup -->
            <q-input
              v-model="holidayDialog.form.holiday_date"
              label="Holiday Date (YYYY-MM-DD) *"
              outlined
              dense
              stack-label
              mask="####-##-##"
              :rules="[(val) => !!val || 'Holiday date is required', validateDate]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer text-primary">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="holidayDialog.form.holiday_date"
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

            <!-- Description Input -->
            <q-input
              v-model="holidayDialog.form.description"
              label="Holiday Name / Description *"
              placeholder="e.g. Independence Day, Company Foundation Day"
              outlined
              dense
              stack-label
              :rules="[(val) => (!!val && val.trim().length > 0) || 'Description is required']"
            />
          </q-card-section>

          <q-separator />

          <!-- Dialog Actions Footer -->
          <q-card-actions class="row items-center justify-between q-pa-md">
            <div>
              <q-btn
                v-if="holidayDialog.isEdit"
                flat
                color="negative"
                icon="delete"
                label="Delete Holiday"
                no-caps
                class="text-weight-bold"
                @click="handleDeleteFromEditDialog"
              />
            </div>

            <div class="row items-center q-gutter-xs">
              <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
              <q-btn
                unelevated
                :label="holidayDialog.isEdit ? 'Save Changes' : 'Create Holiday'"
                color="primary"
                type="submit"
                :loading="holidayDialog.saving"
                no-caps
                class="text-weight-bold"
              />
            </div>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- 5. DELETE CONFIRMATION MODAL -->
    <q-dialog v-model="deleteDialog.show">
      <q-card :dark="$q.dark.isActive" style="width: 420px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="delete" color="red-1" text-color="negative" size="38px" />
          <div class="text-subtitle1 text-weight-bold q-ml-md">Remove Holiday?</div>
        </q-card-section>

        <q-card-section class="text-body2 q-pt-md">
          Are you sure you want to remove
          <strong>{{ deleteDialog.holiday?.description }}</strong> on
          <strong>{{ deleteDialog.holiday?.holiday_date }}</strong
          >? This will restore regular working capacity.
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
          <q-btn
            unelevated
            label="Delete Holiday"
            color="negative"
            :loading="deleteDialog.deleting"
            no-caps
            class="text-weight-bold"
            @click="executeDeleteHoliday"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 6. IMPORT HOLIDAYS MODAL -->
    <q-dialog v-model="importDialog.show" persistent>
      <q-card
        :dark="$q.dark.isActive"
        style="width: 640px; max-width: 95vw; max-height: 90vh"
        class="column"
      >
        <!-- Header -->
        <q-card-section class="row items-center justify-between q-pb-sm">
          <div class="row items-center">
            <q-avatar
              icon="upload_file"
              color="primary"
              text-color="white"
              size="36px"
              class="q-mr-sm"
            />
            <div>
              <div class="text-subtitle1 text-weight-bold">Import Holidays</div>
              <div class="text-caption text-grey-7">
                Upload a CSV or JSON file to batch import holidays
              </div>
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <!-- Scrollable Content -->
        <q-card-section class="q-pa-md scroll col">
          <!-- Instruction banner -->
          <div
            class="q-pa-sm q-mb-md rounded-borders row items-center justify-between"
            :class="$q.dark.isActive ? 'bg-grey-9 text-grey-3' : 'bg-blue-1 text-blue-10'"
          >
            <div class="text-caption">
              <strong>Format:</strong> <code>holiday_date</code> (YYYY-MM-DD) and
              <code>description</code>
            </div>
            <q-btn
              flat
              dense
              size="sm"
              icon="download"
              label="Sample CSV"
              href="/holidays_2026.csv"
              download="holidays_template.csv"
              color="primary"
              no-caps
            />
          </div>

          <!-- File upload picker -->
          <q-file
            v-model="importDialog.file"
            label="Select CSV or JSON file"
            outlined
            dense
            clearable
            accept=".csv, .txt, .json"
            @update:model-value="onImportFileChange"
          >
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <!-- Error message if file parse error -->
          <div
            v-if="importDialog.parseError"
            class="q-mt-sm text-caption text-negative row items-center"
          >
            <q-icon name="error" size="16px" class="q-mr-xs" />
            <span>{{ importDialog.parseError }}</span>
          </div>

          <!-- Parsed summary & preview -->
          <div v-if="importDialog.parsedItems.length > 0" class="q-mt-md">
            <!-- Counters row -->
            <div class="row q-gutter-sm q-mb-sm items-center">
              <q-chip dense color="primary" text-color="white" icon="list">
                Total: {{ importDialog.parsedItems.length }}
              </q-chip>
              <q-chip dense color="positive" text-color="white" icon="add_task">
                To Import: {{ newImportItemsCount }}
              </q-chip>
              <q-chip
                v-if="skippedImportItemsCount > 0"
                dense
                color="grey-7"
                text-color="white"
                icon="block"
              >
                Existing / Skipped: {{ skippedImportItemsCount }}
              </q-chip>
            </div>

            <!-- Preview table -->
            <q-table
              dense
              flat
              bordered
              :rows="importDialog.parsedItems"
              :columns="importTableColumns"
              row-key="index"
              :pagination="{ rowsPerPage: 5 }"
              class="q-mt-xs"
              :dark="$q.dark.isActive"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    size="sm"
                    :color="props.row.isDuplicate ? 'grey-6' : 'positive'"
                    text-color="white"
                  >
                    {{ props.row.isDuplicate ? 'Already Exists' : 'Ready' }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Actions -->
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
          <q-btn
            unelevated
            color="primary"
            icon="file_upload"
            :label="`Import ${newImportItemsCount} Holiday${newImportItemsCount === 1 ? '' : 's'}`"
            :loading="importDialog.importing"
            :disable="newImportItemsCount === 0 || importDialog.importing"
            no-caps
            class="text-weight-bold"
            @click="executeImportHolidays"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 7. BATCH DELETE CONFIRMATION MODAL -->
    <q-dialog v-model="batchDeleteDialog.show">
      <q-card :dark="$q.dark.isActive" style="width: 520px; max-width: 95vw">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="delete_sweep" color="red-1" text-color="negative" size="38px" />
          <div class="text-subtitle1 text-weight-bold q-ml-md">
            Delete {{ selectedHolidays.length }} Holidays?
          </div>
        </q-card-section>

        <q-card-section class="text-body2 q-pt-md">
          <div>
            Are you sure you want to permanently delete these
            <strong>{{ selectedHolidays.length }}</strong> holidays?
          </div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Regular working capacity will be restored and active project schedules will be
            automatically recalculated.
          </div>

          <!-- List of selected holidays to delete -->
          <q-card flat bordered class="q-mt-md q-pa-xs scroll" style="max-height: 180px">
            <q-list dense separator>
              <q-item v-for="h in selectedHolidays" :key="h.holiday_id">
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ h.description }}</q-item-label>
                  <q-item-label caption>{{ formatPrettyDate(h.holiday_date) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
          <q-btn
            unelevated
            label="Delete Holidays"
            color="negative"
            icon="delete_sweep"
            :loading="batchDeleteDialog.deleting"
            no-caps
            class="text-weight-bold"
            @click="executeBatchDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 8. DAY DETAIL DIALOG (For Resource tap & Mobile view) -->
    <q-dialog v-model="dayDetailDialog.show">
      <q-card
        :dark="$q.dark.isActive"
        style="width: 380px; max-width: 92vw"
        class="rounded-borders"
      >
        <q-card-section class="row items-center justify-between q-pb-xs">
          <div class="row items-center q-gutter-xs">
            <q-avatar
              size="32px"
              rounded
              :color="dayDetailDialog.isToday ? 'primary' : $q.dark.isActive ? 'grey-8' : 'grey-2'"
              :text-color="
                dayDetailDialog.isToday ? 'white' : $q.dark.isActive ? 'grey-2' : 'grey-9'
              "
              icon="event"
            />
            <div class="q-ml-xs">
              <div class="text-subtitle1 text-weight-bold">
                {{ dayDetailDialog.formattedDate }}
              </div>
              <div class="text-caption text-grey-6">
                {{ dayDetailDialog.dayOfWeek }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" size="sm" color="grey-6" v-close-popup />
        </q-card-section>

        <q-separator :dark="$q.dark.isActive" />

        <q-card-section class="q-py-md q-gutter-y-sm">
          <!-- Status Badge -->
          <div class="row items-center justify-between">
            <span class="text-caption text-grey-6">Status</span>
            <div>
              <q-badge
                v-if="dayDetailDialog.holiday"
                color="amber-8"
                class="text-weight-bold q-px-sm q-py-xs"
              >
                Holiday (No Work)
              </q-badge>
              <q-badge
                v-else-if="dayDetailDialog.isOffDay"
                color="grey-7"
                class="text-weight-bold q-px-sm q-py-xs"
              >
                Non-Working Day (Off)
              </q-badge>
              <q-badge v-else color="positive" class="text-weight-bold q-px-sm q-py-xs">
                Working Day
              </q-badge>
            </div>
          </div>

          <!-- Holiday Information if any -->
          <div v-if="dayDetailDialog.holiday" class="q-mt-sm">
            <div class="text-caption text-grey-6 q-mb-xs">Holiday Event</div>
            <q-card
              flat
              bordered
              :dark="$q.dark.isActive"
              class="holiday-badge-card q-pa-sm rounded-borders"
            >
              <div class="text-body2 text-weight-bold">
                {{ dayDetailDialog.holiday.description }}
              </div>
            </q-card>
          </div>

          <!-- Working capacity note -->
          <div class="text-caption text-grey-6 q-mt-xs">
            <template v-if="dayDetailDialog.holiday">
              Organization-wide holiday. No work tasks are scheduled for this day.
            </template>
            <template v-else-if="dayDetailDialog.isOffDay">
              Weekly off day according to team schedule.
            </template>
            <template v-else> Standard scheduled working day. </template>
          </div>
        </q-card-section>

        <!-- PM Actions in Dialog if PM -->
        <template v-if="isProjectManager">
          <q-separator :dark="$q.dark.isActive" />
          <q-card-actions align="right" class="q-pa-sm">
            <q-btn
              v-if="dayDetailDialog.holiday"
              flat
              dense
              color="primary"
              icon="edit"
              label="Edit Holiday"
              no-caps
              @click="onEditFromDetailDialog"
            />
            <q-btn
              v-else
              flat
              dense
              color="primary"
              icon="add"
              label="Add Holiday"
              no-caps
              @click="onAddFromDetailDialog"
            />
          </q-card-actions>
        </template>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { QCalendarMonth } from '@quasar/quasar-ui-qcalendar';
import '@quasar/quasar-ui-qcalendar/dist/QCalendarMonth.min.css';
import '@quasar/quasar-ui-qcalendar/dist/QCalendarVariables.min.css';
import { useAuthStore } from '@/stores/auth';
import {
  getHolidaysApi,
  createHolidayApi,
  batchCreateHolidaysApi,
  batchDeleteHolidaysApi,
  updateHolidayApi,
  deleteHolidayApi,
  getResourceWorkScheduleApi,
  type HolidayItem,
  type DayOfWeek,
} from '@/services/api';

const $q = useQuasar();
const authStore = useAuthStore();

const isProjectManager = computed(() => authStore.user?.role === 'PROJECT_MANAGER');

const loading = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');
const holidays = ref<HolidayItem[]>([]);
const selectedHolidays = ref<HolidayItem[]>([]);
const userNonWorkingDays = ref<DayOfWeek[]>(['SATURDAY', 'SUNDAY']);

interface QCalendarMonthInstance {
  prev: () => void;
  next: () => void;
  moveToToday: () => void;
}

const calendarRef = ref<QCalendarMonthInstance | null>(null);
const selectedDate = ref(formatDate(new Date()));

const DAY_OF_WEEK_INDEX: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

function isDateNonWorking(d: Date): boolean {
  const dayName = DAY_OF_WEEK_INDEX[d.getDay()];
  if (!dayName) return false;
  return userNonWorkingDays.value.includes(dayName);
}

function isDateKeyNonWorking(dateStr: string, weekday?: number): boolean {
  if (weekday !== undefined) {
    const dayName = DAY_OF_WEEK_INDEX[weekday];
    if (dayName) return userNonWorkingDays.value.includes(dayName);
  }
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0]! : dateStr;
  const d = new Date(`${cleanStr}T00:00:00`);
  return isDateNonWorking(d);
}

const currentYear = computed(() => {
  if (!selectedDate.value) return new Date().getFullYear();
  return parseInt(selectedDate.value.split('-')[0]!, 10);
});

const currentMonth = computed(() => {
  if (!selectedDate.value) return new Date().getMonth();
  return parseInt(selectedDate.value.split('-')[1]!, 10) - 1;
});

const currentMonthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1);
  return date.toLocaleString('default', { month: 'long' });
});

// Map of holidays by date key (YYYY-MM-DD)
const holidaysByDate = computed(() => {
  const map = new Map<string, HolidayItem>();
  for (const h of holidays.value) {
    map.set(h.holiday_date, h);
  }
  return map;
});

// Count of holidays in the currently selected month
const currentMonthHolidaysCount = computed(() => {
  const monthStr = String(currentMonth.value + 1).padStart(2, '0');
  const prefix = `${currentYear.value}-${monthStr}`;
  return holidays.value.filter((h) => h.holiday_date.startsWith(prefix)).length;
});

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatPrettyDate(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0]! : dateStr;
  const d = new Date(`${cleanStr}T00:00:00`);
  return d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0]! : dateStr;
  const d = new Date(`${cleanStr}T00:00:00`);
  return d.toLocaleDateString('default', { weekday: 'long' });
}

function validateDate(val: string): boolean | string {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(val)) return 'Date format must be YYYY-MM-DD';
  return true;
}

function prevMonth() {
  const cur = new Date(currentYear.value, currentMonth.value - 1, 1);
  selectedDate.value = formatDate(cur);
  if (calendarRef.value) {
    calendarRef.value.prev();
  }
}

function nextMonth() {
  const cur = new Date(currentYear.value, currentMonth.value + 1, 1);
  selectedDate.value = formatDate(cur);
  if (calendarRef.value) {
    calendarRef.value.next();
  }
}

function goToToday() {
  selectedDate.value = formatDate(new Date());
  if (calendarRef.value) {
    calendarRef.value.moveToToday();
  }
}

async function loadHolidays() {
  loading.value = true;
  try {
    holidays.value = await getHolidaysApi();
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load holidays.',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

const holidayDialog = ref({
  show: false,
  isEdit: false,
  saving: false,
  holidayId: null as number | null,
  form: {
    holiday_date: '',
    description: '',
  },
});

function openAddHolidayDialog(prefilledDate?: string) {
  holidayDialog.value = {
    show: true,
    isEdit: false,
    saving: false,
    holidayId: null,
    form: {
      holiday_date: prefilledDate || formatDate(new Date()),
      description: '',
    },
  };
}

function openEditHolidayDialog(holiday: HolidayItem) {
  holidayDialog.value = {
    show: true,
    isEdit: true,
    saving: false,
    holidayId: holiday.holiday_id,
    form: {
      holiday_date: holiday.holiday_date,
      description: holiday.description,
    },
  };
}

const dayDetailDialog = ref({
  show: false,
  dateKey: '',
  formattedDate: '',
  dayOfWeek: '',
  isToday: false,
  holiday: null as HolidayItem | null,
  isOffDay: false,
});

function openDayDetailDialog(dateKey: string, weekday?: number) {
  const cleanStr = dateKey.includes('T') ? dateKey.split('T')[0]! : dateKey;
  const d = new Date(`${cleanStr}T00:00:00`);
  const holiday = holidaysByDate.value.get(cleanStr) || null;
  const isOffDay = isDateKeyNonWorking(cleanStr, weekday);
  const todayStr = formatDate(new Date());

  dayDetailDialog.value = {
    show: true,
    dateKey: cleanStr,
    formattedDate: formatPrettyDate(cleanStr),
    dayOfWeek: d.toLocaleDateString('default', { weekday: 'long' }),
    isToday: cleanStr === todayStr,
    holiday,
    isOffDay,
  };
}

function onEditFromDetailDialog() {
  if (dayDetailDialog.value.holiday) {
    const h = dayDetailDialog.value.holiday;
    dayDetailDialog.value.show = false;
    openEditHolidayDialog(h);
  }
}

function onAddFromDetailDialog() {
  const dt = dayDetailDialog.value.dateKey;
  dayDetailDialog.value.show = false;
  openAddHolidayDialog(dt);
}

function onDayClick(dateKey: string, weekday?: number) {
  if (!isProjectManager.value || $q.screen.lt.sm) {
    openDayDetailDialog(dateKey, weekday);
    return;
  }
  const holiday = holidaysByDate.value.get(dateKey);
  if (holiday) {
    openEditHolidayDialog(holiday);
  } else {
    openAddHolidayDialog(dateKey);
  }
}

function onHolidayClick(holiday: HolidayItem) {
  if (isProjectManager.value && !$q.screen.lt.sm) {
    openEditHolidayDialog(holiday);
  } else {
    openDayDetailDialog(holiday.holiday_date);
  }
}

async function saveHoliday() {
  const { form, isEdit, holidayId } = holidayDialog.value;

  const existing = holidaysByDate.value.get(form.holiday_date);
  if (existing && (!isEdit || existing.holiday_id !== holidayId)) {
    $q.notify({
      type: 'warning',
      message: `A holiday is already scheduled for ${form.holiday_date} ("${existing.description}").`,
      position: 'top',
    });
    return;
  }

  holidayDialog.value.saving = true;
  try {
    if (isEdit && holidayId) {
      await updateHolidayApi(holidayId, form);
      $q.notify({
        type: 'positive',
        message: 'Holiday updated successfully!',
        position: 'top',
      });
    } else {
      await createHolidayApi(form);
      $q.notify({
        type: 'positive',
        message: 'Holiday added successfully!',
        position: 'top',
      });
    }

    holidayDialog.value.show = false;
    await loadHolidays();
    window.dispatchEvent(new CustomEvent('holidays-updated'));
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save holiday.',
      position: 'top',
    });
  } finally {
    holidayDialog.value.saving = false;
  }
}

function handleDeleteFromEditDialog() {
  if (!holidayDialog.value.holidayId) return;
  const holidayToDelete: HolidayItem = {
    holiday_id: holidayDialog.value.holidayId,
    holiday_date: holidayDialog.value.form.holiday_date,
    description: holidayDialog.value.form.description,
  };
  holidayDialog.value.show = false;
  confirmDeleteHoliday(holidayToDelete);
}

const deleteDialog = ref({
  show: false,
  deleting: false,
  holiday: null as HolidayItem | null,
});

function confirmDeleteHoliday(holiday: HolidayItem) {
  deleteDialog.value = {
    show: true,
    deleting: false,
    holiday,
  };
}

async function executeDeleteHoliday() {
  if (!deleteDialog.value.holiday) return;
  deleteDialog.value.deleting = true;
  try {
    await deleteHolidayApi(deleteDialog.value.holiday.holiday_id);
    $q.notify({
      type: 'positive',
      message: 'Holiday removed successfully!',
      position: 'top',
    });
    deleteDialog.value.show = false;
    await loadHolidays();
    window.dispatchEvent(new CustomEvent('holidays-updated'));
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to delete holiday.',
      position: 'top',
    });
  } finally {
    deleteDialog.value.deleting = false;
  }
}

const batchDeleteDialog = ref({
  show: false,
  deleting: false,
});

function openBatchDeleteDialog() {
  if (selectedHolidays.value.length === 0) return;
  batchDeleteDialog.value = {
    show: true,
    deleting: false,
  };
}

function switchToListViewForBatchDelete() {
  viewMode.value = 'list';
  $q.notify({
    type: 'info',
    message: 'Select holidays using the checkboxes in the table to delete multiple.',
    position: 'top',
  });
}

async function executeBatchDelete() {
  const ids = selectedHolidays.value.map((h) => h.holiday_id);
  if (ids.length === 0) return;

  batchDeleteDialog.value.deleting = true;
  try {
    const res = await batchDeleteHolidaysApi(ids);
    $q.notify({
      type: 'positive',
      message: `Successfully deleted ${res.deletedCount} holiday${res.deletedCount === 1 ? '' : 's'}!`,
      position: 'top',
    });
    batchDeleteDialog.value.show = false;
    selectedHolidays.value = [];
    await loadHolidays();
    window.dispatchEvent(new CustomEvent('holidays-updated'));
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to delete holidays.',
      position: 'top',
    });
  } finally {
    batchDeleteDialog.value.deleting = false;
  }
}

interface ParsedHolidayItem {
  index: number;
  holiday_date: string;
  description: string;
  isDuplicate: boolean;
}

const importDialog = ref({
  show: false,
  file: null as File | null,
  importing: false,
  parseError: '',
  parsedItems: [] as ParsedHolidayItem[],
});

const importTableColumns: QTableColumn[] = [
  { name: 'holiday_date', label: 'Date', field: 'holiday_date', align: 'left', sortable: true },
  {
    name: 'description',
    label: 'Holiday Name',
    field: 'description',
    align: 'left',
    sortable: true,
  },
  { name: 'status', label: 'Status', field: 'isDuplicate', align: 'center' },
];

const newImportItemsCount = computed(() => {
  return importDialog.value.parsedItems.filter((item) => !item.isDuplicate).length;
});

const skippedImportItemsCount = computed(() => {
  return importDialog.value.parsedItems.filter((item) => item.isDuplicate).length;
});

function openImportHolidayDialog() {
  importDialog.value = {
    show: true,
    file: null,
    importing: false,
    parseError: '',
    parsedItems: [],
  };
}

function normalizeDate(rawDate: string): string | null {
  const trimmed = rawDate.trim();
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1]!;
    const m = isoMatch[2]!.padStart(2, '0');
    const d = isoMatch[3]!.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1]!.padStart(2, '0');
    const m = dmyMatch[2]!.padStart(2, '0');
    const y = dmyMatch[3]!;
    return `${y}-${m}-${d}`;
  }
  return null;
}

async function onImportFileChange(file: File | null) {
  if (!file) {
    importDialog.value.parsedItems = [];
    importDialog.value.parseError = '';
    return;
  }

  try {
    const text = await file.text();
    const existingDates = new Set(holidays.value.map((h) => h.holiday_date.split('T')[0]));
    const parsed: ParsedHolidayItem[] = [];
    const seenInFile = new Set<string>();

    const trimmed = text.trim();
    if (trimmed.startsWith('[') || (trimmed.startsWith('{') && !trimmed.startsWith('{\\'))) {
      const json = JSON.parse(trimmed);
      const list = Array.isArray(json) ? json : [json];
      for (const item of list) {
        const rawDate = item.holiday_date || item.date || item.HolidayDate;
        const desc = item.description || item.name || item.holiday || item.Description || '';
        const normDate = rawDate ? normalizeDate(String(rawDate)) : null;
        if (normDate && desc) {
          const isDup = existingDates.has(normDate) || seenInFile.has(normDate);
          seenInFile.add(normDate);
          parsed.push({
            index: parsed.length + 1,
            holiday_date: normDate,
            description: String(desc).trim(),
            isDuplicate: isDup,
          });
        }
      }
    } else {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const delimiter = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
        const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 2) continue;

        const p0Lower = parts[0]!.toLowerCase();
        const p1Lower = parts[1]!.toLowerCase();
        if (
          (p0Lower.includes('date') || p0Lower.includes('holiday')) &&
          (p1Lower.includes('desc') || p1Lower.includes('name') || p1Lower.includes('title'))
        ) {
          continue;
        }

        let normDate = normalizeDate(parts[0]!);
        let desc = parts[1]!;

        if (!normDate && parts.length >= 2) {
          normDate = normalizeDate(parts[1]!);
          desc = parts[0]!;
        }

        if (normDate && desc) {
          const isDup = existingDates.has(normDate) || seenInFile.has(normDate);
          seenInFile.add(normDate);
          parsed.push({
            index: parsed.length + 1,
            holiday_date: normDate,
            description: desc,
            isDuplicate: isDup,
          });
        }
      }
    }

    if (parsed.length === 0) {
      importDialog.value.parseError =
        'No valid holidays found. Please ensure the file contains dates (YYYY-MM-DD) and holiday names.';
      importDialog.value.parsedItems = [];
    } else {
      importDialog.value.parseError = '';
      importDialog.value.parsedItems = parsed;
    }
  } catch (err: unknown) {
    importDialog.value.parseError =
      err instanceof Error ? err.message : 'Failed to parse file. Please verify format.';
    importDialog.value.parsedItems = [];
  }
}

async function executeImportHolidays() {
  const itemsToImport = importDialog.value.parsedItems
    .filter((i) => !i.isDuplicate)
    .map((i) => ({ holiday_date: i.holiday_date, description: i.description }));

  if (itemsToImport.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No new holidays to import.',
      position: 'top',
    });
    return;
  }

  importDialog.value.importing = true;
  try {
    const res = await batchCreateHolidaysApi(itemsToImport);
    $q.notify({
      type: 'positive',
      message: `Successfully imported ${res.inserted} holiday${res.inserted === 1 ? '' : 's'}!`,
      position: 'top',
    });
    if (res.skipped > 0) {
      $q.notify({
        type: 'info',
        message: `${res.skipped} holiday(s) already existed and were skipped.`,
        position: 'top',
      });
    }

    importDialog.value.show = false;
    await loadHolidays();
    window.dispatchEvent(new CustomEvent('holidays-updated'));
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to import holidays.',
      position: 'top',
    });
  } finally {
    importDialog.value.importing = false;
  }
}

const columns = computed<QTableColumn[]>(() => {
  const baseCols: QTableColumn[] = [
    {
      name: 'holiday_date',
      label: 'Date',
      align: 'left',
      field: 'holiday_date',
      sortable: true,
    },
    {
      name: 'description',
      label: 'Holiday Name',
      align: 'left',
      field: 'description',
      sortable: true,
    },
  ];

  if (isProjectManager.value) {
    baseCols.push({
      name: 'actions',
      label: 'Actions',
      align: 'right',
      field: 'holiday_id',
    });
  }

  return baseCols;
});

async function loadUserData() {
  if (authStore.user?.role === 'RESOURCE') {
    try {
      const schedule = await getResourceWorkScheduleApi('me');
      if (schedule && Array.isArray(schedule.non_working_days)) {
        userNonWorkingDays.value = schedule.non_working_days;
      }
    } catch (e) {
      console.error('Failed to load user schedule in calendar:', e);
    }
  }
}

function getDayBgClass(timestamp: { date: string; weekday: number; current?: boolean }) {
  if (timestamp.current) return 'is-today-day';
  if (holidaysByDate.value.has(timestamp.date)) return 'has-holiday-day';
  if (isDateKeyNonWorking(timestamp.date, timestamp.weekday)) return 'is-weekend-day';
  return 'is-default-day';
}

onMounted(() => {
  void loadHolidays();
  void loadUserData();
});
</script>

<style scoped lang="scss">
.q-calendar-custom {
  width: 100%;
  --cal-border: #cbd5e1;
  --cal-head-bg: #f8fafc;
  --cal-day-bg: #ffffff;
  --cal-weekend-bg: #f8fafc;
  --cal-today-bg: #eff6ff;
  --cal-holiday-bg: #fffbeb;
  --cal-card-bg: #fff8e6;
  --cal-card-color: #b45309;
  --cal-card-border: #fde68a;

  :deep(.q-calendar-month__head) {
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.04em;
    background: var(--cal-head-bg);
    border-bottom: 1px solid var(--cal-border);
  }

  :deep(.q-calendar-month__head--weekday) {
    border-right: 1px solid var(--cal-border);
    padding: 10px 0;
    text-align: center;
    &:last-child {
      border-right: none;
    }
  }

  :deep(.q-calendar-month__week--wrapper) {
    border-bottom: 1px solid var(--cal-border);
    &:last-child {
      border-bottom: none;
    }
  }

  :deep(.q-calendar-month__day) {
    padding: 0;
    vertical-align: top;
    border-right: 1px solid var(--cal-border);
    &:last-child {
      border-right: none;
    }
  }

  :deep(.q-calendar-month__day--label__wrapper) {
    display: none !important;
  }
}

.is-default-day {
  background: var(--cal-day-bg);
}
.is-weekend-day {
  background: var(--cal-weekend-bg);
}
.has-holiday-day {
  background: var(--cal-holiday-bg);
}
.is-today-day {
  background: var(--cal-today-bg);
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.holiday-badge-card {
  background: var(--cal-card-bg);
  color: var(--cal-card-color);
  border: 1px solid var(--cal-card-border);
  border-left: 3px solid #f59e0b;
  transition: all 0.15s ease-in-out;

  &:hover {
    filter: brightness(0.96);
    border-color: #f59e0b;
    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.22);
    transform: translateY(-1px);
  }
}

.calendar-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.holiday-desc-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  white-space: normal;
}

.calendar-day-cell {
  min-height: 120px;
  box-sizing: border-box;
  transition: filter 0.12s ease;

  &:hover {
    filter: brightness(0.97);
  }

  .quick-add-btn {
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  &:hover .quick-add-btn {
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .q-calendar-custom {
    :deep(.q-calendar-month__head) {
      font-size: 11px;
    }
    :deep(.q-calendar-month__head--weekday) {
      padding: 6px 0;
    }
  }

  .calendar-day-cell {
    min-height: 70px !important;
    padding: 3px 2px !important;
  }

  .holiday-badge-card {
    padding: 2px 3px !important;
    border-left-width: 2px !important;
  }
}

body.body--dark {
  .q-calendar-custom {
    --cal-border: #334155;
    --cal-head-bg: #181d28;
    --cal-day-bg: #11151f;
    --cal-weekend-bg: #161c28;
    --cal-today-bg: rgba(59, 130, 246, 0.14);
    --cal-holiday-bg: rgba(245, 158, 11, 0.1);
    --cal-card-bg: rgba(245, 158, 11, 0.16);
    --cal-card-color: #fbbf24;
    --cal-card-border: rgba(245, 158, 11, 0.35);

    :deep(.q-calendar-month__head) {
      color: #94a3b8;
    }
  }

  .calendar-day-cell:hover {
    filter: brightness(1.15);
  }

  .holiday-badge-card:hover {
    filter: brightness(1.2);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
  }
}
</style>
