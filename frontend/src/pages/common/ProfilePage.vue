<template>
  <q-page :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'" class="q-pa-lg">
    <div class="q-mx-auto column q-gutter-y-lg" style="max-width: 1400px">
      <!-- 1. BREADCRUMBS -->
      <div>
        <q-breadcrumbs active-color="primary">
          <template #separator>
            <q-icon size="14px" name="chevron_right" color="grey-5" />
          </template>
          <q-breadcrumbs-el
            :label="isPM ? 'Projects' : 'Dashboard'"
            :to="isPM ? '/pm/projects' : '/app/resource-dashboard'"
            icon="home"
          />
          <q-breadcrumbs-el label="My Profile" icon="account_circle" />
        </q-breadcrumbs>
      </div>

      <!-- 2. UNIFIED PROFILE CARD -->
      <q-card flat bordered :dark="$q.dark.isActive" class="rounded-borders overflow-hidden">
        <!-- Profile Header Area -->
        <div
          class="q-pa-lg"
          :style="{
            background: $q.dark.isActive
              ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
            borderBottom: $q.dark.isActive
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid #e2e8f0',
          }"
        >
          <div class="row items-center justify-between wrap q-col-gutter-md">
            <!-- User Avatar & Identity -->
            <div class="row items-center q-gutter-md">
              <q-avatar
                size="68px"
                class="text-weight-bolder text-white text-h5 shadow-2"
                :style="{
                  background: isPM
                    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                }"
              >
                {{ userInitial }}
              </q-avatar>

              <div class="column q-gutter-xs">
                <div class="row items-center q-gutter-xs wrap">
                  <span class="text-h6 text-weight-bolder">{{
                    profileData.name || 'User Profile'
                  }}</span>
                  <q-chip
                    dense
                    square
                    :color="isPM ? 'indigo-10' : 'teal-10'"
                    :text-color="isPM ? 'indigo-1' : 'teal-1'"
                    class="text-caption text-weight-bold q-ml-xs"
                  >
                    <q-icon
                      :name="isPM ? 'workspace_premium' : 'engineering'"
                      size="13px"
                      class="q-mr-xs"
                    />
                    {{ isPM ? 'Project Manager' : 'Resource' }}
                  </q-chip>
                </div>

                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  @{{ profileData.username || 'username' }} • {{ profileData.email }}
                </div>

                <div class="text-caption text-grey-5 row items-center q-gutter-xs">
                  <q-icon name="calendar_today" size="11px" />
                  <span>Joined {{ formatMemberSince(profileData.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <q-card-section class="q-pa-lg">
          <!-- Personal Information Section -->
          <div class="q-mb-lg">
            <div class="row items-center q-gutter-xs q-mb-sm">
              <q-icon name="person_outline" size="20px" color="primary" />
              <span class="text-subtitle1 text-weight-bold">Personal Information</span>
            </div>
            <div class="text-caption text-grey-6 q-mb-md">
              Update your display name and unique handle.
            </div>

            <q-form @submit="handleSaveProfile" class="column q-gutter-y-md">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="editForm.name"
                    outlined
                    dense
                    label="Full Name *"
                    :dark="$q.dark.isActive"
                    :rules="[(val) => (val && val.trim().length > 0) || 'Name is required']"
                  >
                    <template #prepend>
                      <q-icon name="person" size="18px" />
                    </template>
                  </q-input>
                </div>

                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="editForm.username"
                    outlined
                    dense
                    label="Username *"
                    :dark="$q.dark.isActive"
                    :rules="[
                      (val) =>
                        (val && val.trim().length >= 3) || 'Username must be at least 3 characters',
                      (val) =>
                        /^[a-zA-Z0-9_.-]+$/.test(val) ||
                        'Only letters, numbers, underscores, dots, and hyphens allowed',
                    ]"
                  >
                    <template #prepend>
                      <q-icon name="alternate_email" size="18px" />
                    </template>
                  </q-input>
                </div>
              </div>

              <q-input
                v-model="profileData.email"
                outlined
                dense
                label="Email Address"
                readonly
                disable
                :dark="$q.dark.isActive"
                hint="Your email address is managed by your organization"
              >
                <template #prepend>
                  <q-icon name="email" size="18px" />
                </template>
                <template #append>
                  <q-icon name="lock" size="16px" color="grey-6" />
                </template>
              </q-input>

              <div class="row justify-end q-mt-xs">
                <q-btn
                  type="submit"
                  no-caps
                  unelevated
                  color="primary"
                  label="Save Changes"
                  icon="save"
                  :loading="savingProfile"
                  :disable="!hasProfileChanges"
                />
              </div>
            </q-form>
          </div>

          <q-separator class="q-my-lg" />

          <!-- Work Schedule & Non-Working Days Section (Resource Only) -->
          <template v-if="!isPM">
            <div class="q-mb-lg">
              <div class="row items-center q-gutter-xs q-mb-sm">
                <q-icon name="event_busy" size="20px" color="primary" />
                <span class="text-subtitle1 text-weight-bold">Work Schedule & Availability</span>
              </div>
              <div class="text-caption text-grey-6 q-mb-md">
                View or configure your regular weekly working schedule and days off.
              </div>

              <q-card
                flat
                bordered
                :dark="$q.dark.isActive"
                class="rounded-borders q-pa-md row items-center justify-between wrap q-gutter-sm"
                :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'"
              >
                <div class="column q-gutter-xs">
                  <div class="row items-center q-gutter-xs">
                    <span class="text-weight-bold text-subtitle2">Weekly Non-Working Days</span>
                    <q-chip
                      dense
                      square
                      :color="isScheduleConfigured ? 'amber-9' : 'teal-8'"
                      text-color="white"
                      class="text-caption text-weight-bold q-ml-xs"
                    >
                      <q-icon
                        :name="isScheduleConfigured ? 'lock' : 'edit'"
                        size="12px"
                        class="q-mr-xs"
                      />
                      {{ isScheduleConfigured ? 'Locked' : 'Configurable' }}
                    </q-chip>
                  </div>
                  <span class="text-caption text-grey-6">
                    {{
                      isScheduleConfigured
                        ? `Days off: ${selectedNonWorkingDays.length === 0 ? 'None (7-day work week)' : selectedNonWorkingDays.map(formatDayName).join(', ')} • 8.0 hrs/day`
                        : 'Set your regular weekly days off (non-working days) and work capacity.'
                    }}
                  </span>
                </div>

                <q-btn
                  outline
                  no-caps
                  color="primary"
                  :label="isScheduleConfigured ? 'View Schedule' : 'Configure Schedule'"
                  :icon="isScheduleConfigured ? 'visibility' : 'event_busy'"
                  @click="openWorkingDaysDialog"
                />
              </q-card>
            </div>

            <q-separator class="q-my-lg" />
          </template>

          <!-- Security & Password Section -->
          <div>
            <div class="row items-center q-gutter-xs q-mb-sm">
              <q-icon name="lock_outline" size="20px" color="primary" />
              <span class="text-subtitle1 text-weight-bold">Security</span>
            </div>

            <q-card
              flat
              bordered
              :dark="$q.dark.isActive"
              class="rounded-borders q-pa-md row items-center justify-between wrap q-gutter-sm"
              :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'"
            >
              <div class="column q-gutter-xs">
                <span class="text-weight-bold text-subtitle2">Account Password</span>
                <span class="text-caption text-grey-6">
                  Keep your account secure by using a strong, unique password.
                </span>
              </div>

              <q-btn
                outline
                no-caps
                color="primary"
                label="Change Password"
                icon="key"
                @click="openChangePasswordDialog"
              />
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- CHANGE PASSWORD MODAL DIALOG -->
    <q-dialog v-model="showPasswordDialog" persistent>
      <q-card
        style="min-width: 400px; max-width: 460px"
        :dark="$q.dark.isActive"
        class="rounded-borders q-pa-sm"
      >
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center q-gutter-xs">
            <q-icon name="lock_reset" size="22px" color="primary" />
            <div class="text-h6 text-weight-bold">Change Password</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="text-caption text-grey-6 q-pt-xs">
          Must contain at least 6 characters, start with a capital letter, and include a number and
          special character.
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="handleChangePassword" class="column q-gutter-y-md">
            <q-input
              v-model="passwordForm.oldPassword"
              outlined
              dense
              :type="showOldPassword ? 'text' : 'password'"
              label="Current Password *"
              :dark="$q.dark.isActive"
              :rules="[(val) => (val && val.length > 0) || 'Current password is required']"
            >
              <template #prepend>
                <q-icon name="key" size="18px" />
              </template>
              <template #append>
                <q-icon
                  :name="showOldPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  size="18px"
                  @click="showOldPassword = !showOldPassword"
                />
              </template>
            </q-input>

            <q-input
              v-model="passwordForm.newPassword"
              outlined
              dense
              :type="showNewPassword ? 'text' : 'password'"
              label="New Password *"
              :dark="$q.dark.isActive"
              :rules="[
                (val) => (val && val.length >= 6) || 'Password must be at least 6 characters',
                (val) => /^[A-Z]/.test(val) || 'Must start with a capital letter',
                (val) => /[0-9]/.test(val) || 'Must contain at least one number',
                (val) => /[^A-Za-z0-9]/.test(val) || 'Must contain at least one special character',
              ]"
            >
              <template #prepend>
                <q-icon name="lock_outline" size="18px" />
              </template>
              <template #append>
                <q-icon
                  :name="showNewPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  size="18px"
                  @click="showNewPassword = !showNewPassword"
                />
              </template>
            </q-input>

            <q-input
              v-model="passwordForm.confirmPassword"
              outlined
              dense
              :type="showConfirmPassword ? 'text' : 'password'"
              label="Confirm New Password *"
              :dark="$q.dark.isActive"
              :rules="[
                (val) => (val && val === passwordForm.newPassword) || 'Passwords do not match',
              ]"
            >
              <template #prepend>
                <q-icon name="check_circle_outline" size="18px" />
              </template>
              <template #append>
                <q-icon
                  :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  size="18px"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>

            <q-card-actions align="right" class="q-px-none q-pt-md">
              <q-btn flat no-caps label="Cancel" color="grey-7" v-close-popup />
              <q-btn
                type="submit"
                no-caps
                unelevated
                color="primary"
                label="Update Password"
                :loading="savingPassword"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- NON-WORKING DAYS / WORK SCHEDULE MODAL DIALOG -->
    <q-dialog v-model="workingDaysDialog" persistent>
      <q-card
        style="min-width: 440px; max-width: 520px"
        :dark="$q.dark.isActive"
        class="rounded-borders"
      >
        <q-card-section class="row items-center justify-between q-pb-xs">
          <div class="row items-center q-gutter-xs">
            <q-icon
              :name="isScheduleConfigured ? 'lock' : 'event_busy'"
              size="24px"
              color="primary"
            />
            <div class="text-h6 text-weight-bold">My Work Schedule</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="text-caption text-grey-6 q-pt-none">
          <span v-if="isScheduleConfigured">
            Your weekly work schedule has been configured. View your non-working days and daily
            capacity below.
          </span>
          <span v-else>
            Select your weekly non-working days (days off). This configuration is set once during
            setup. Any unmarked day is treated as a regular working day.
          </span>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="scheduleLoading" class="row justify-center items-center q-pa-xl">
          <q-spinner color="primary" size="36px" />
        </q-card-section>

        <q-card-section v-else class="q-pt-md q-gutter-md">
          <!-- Locked Notice Banner for Configured Schedule -->
          <q-banner
            v-if="isScheduleConfigured"
            rounded
            class="q-pa-sm"
            :class="$q.dark.isActive ? 'bg-grey-9 text-amber-3' : 'bg-amber-1 text-brown-9'"
            style="border: 1px solid rgba(245, 158, 11, 0.3)"
          >
            <template #avatar>
              <q-icon name="lock" color="amber-8" size="22px" />
            </template>
            <div class="text-weight-bold text-caption">Schedule Configuration Locked</div>
            <div class="text-caption" style="font-size: 0.78rem">
              🔒 Schedule configuration is locked after initial setup. Contact your Project Manager
              if your schedule needs to be changed.
            </div>
          </q-banner>

          <!-- Non-Working Days Selector / Display -->
          <div>
            <div class="text-subtitle2 text-weight-bold q-mb-xs">
              Weekly Non-Working Days (Days Off)
            </div>
            <div class="text-caption text-grey-6 q-mb-sm">
              <span v-if="isScheduleConfigured">
                Saved non-working days (days off) for scheduling:
              </span>
              <span v-else>
                Click days to mark them as non-working. Unmarked days are your active working days.
              </span>
            </div>

            <div class="row q-gutter-xs wrap">
              <q-chip
                v-for="day in weekDayOptions"
                :key="day.value"
                :clickable="!isScheduleConfigured"
                :color="
                  isNonWorkingDay(day.value)
                    ? 'deep-orange-7'
                    : $q.dark.isActive
                      ? 'grey-9'
                      : 'grey-3'
                "
                :text-color="
                  isNonWorkingDay(day.value) ? 'white' : $q.dark.isActive ? 'grey-4' : 'grey-8'
                "
                :icon="isNonWorkingDay(day.value) ? 'event_busy' : 'check_circle_outline'"
                :class="[
                  'text-weight-bold transition-all',
                  isScheduleConfigured ? 'cursor-default' : 'cursor-pointer',
                ]"
                @click="!isScheduleConfigured && toggleNonWorkingDay(day.value)"
              >
                {{ day.label }}
              </q-chip>
            </div>
            <div
              v-if="!isScheduleConfigured && selectedNonWorkingDays.length >= 7"
              class="text-caption text-negative q-mt-xs"
            >
              * A resource must have at least one active working day.
            </div>
          </div>

          <!-- Fixed Daily Working Hours -->
          <div class="q-mt-sm">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-subtitle2 text-weight-bold">Daily Working Capacity</span>
              <q-badge
                color="primary"
                class="text-weight-bold q-px-sm q-py-xs"
                style="font-size: 0.85rem"
              >
                8 Hours / Day
              </q-badge>
            </div>
            <div class="text-caption text-grey-6">
              Standard fixed working capacity per working day (8.0 Hours / Day).
            </div>
          </div>

          <!-- Schedule Summary Breakdown -->
          <q-card flat bordered class="q-pa-sm" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'">
            <div class="q-gutter-xs text-caption">
              <div class="row items-center justify-between">
                <span class="text-weight-medium">Non-Working Days:</span>
                <span class="text-weight-bold text-deep-orange">
                  {{
                    selectedNonWorkingDays.length === 0
                      ? 'None (Full 7-day schedule)'
                      : selectedNonWorkingDays.map(formatDayName).join(', ')
                  }}
                  ({{ selectedNonWorkingDays.length }} days off)
                </span>
              </div>
              <div class="row items-center justify-between q-mt-xs">
                <span class="text-weight-medium">Active Working Days:</span>
                <span class="text-weight-bold text-primary">
                  {{
                    activeWorkingDays.length === 0
                      ? 'None'
                      : activeWorkingDays.map(formatDayName).join(', ')
                  }}
                  ({{ activeWorkingDays.length }} working days)
                </span>
              </div>
              <div class="row items-center justify-between q-mt-xs">
                <span class="text-weight-medium">Weekly Total Capacity:</span>
                <span class="text-weight-bold text-teal">
                  {{ (activeWorkingDays.length * 8.0).toFixed(1) }} Hours / Week
                </span>
              </div>
            </div>
          </q-card>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <template v-if="isScheduleConfigured">
            <q-btn
              unelevated
              label="Close"
              no-caps
              v-close-popup
              color="primary"
              class="text-weight-bold q-px-lg"
            />
          </template>
          <template v-else>
            <q-btn flat label="Cancel" no-caps v-close-popup color="grey-7" />
            <q-btn
              unelevated
              label="Save Settings"
              color="primary"
              no-caps
              class="text-weight-bold q-px-md"
              :loading="scheduleSubmitting"
              :disable="selectedNonWorkingDays.length >= 7 || scheduleLoading"
              @click="handleSaveScheduleConfig"
            />
          </template>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import {
  getUserProfileApi,
  updateUserProfileApi,
  resetPasswordApi,
  getResourceWorkScheduleApi,
  updateResourceWorkScheduleApi,
  type UserProfileData,
  type DayOfWeek,
} from '@/services/api';

const $q = useQuasar();
const authStore = useAuthStore();

const isPM = computed(() => authStore.user?.role === 'PROJECT_MANAGER');
const userInitial = computed(() =>
  profileData.value.name ? profileData.value.name.charAt(0).toUpperCase() : 'U',
);

const loading = ref(false);
const savingProfile = ref(false);
const savingPassword = ref(false);

const showPasswordDialog = ref(false);
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const profileData = ref<UserProfileData>({
  user_id: authStore.user?.user_id || 0,
  name: authStore.user?.name || '',
  username: authStore.user?.username || '',
  email: authStore.user?.email || '',
  role: authStore.user?.role || 'RESOURCE',
  created_at: '',
  updated_at: '',
});

const editForm = reactive({
  name: '',
  username: '',
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Non-Working Days State
const ALL_WEEK_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
const workingDaysDialog = ref(false);
const scheduleLoading = ref(false);
const scheduleSubmitting = ref(false);
const isScheduleConfigured = ref(false);
const selectedNonWorkingDays = ref<DayOfWeek[]>(['SATURDAY', 'SUNDAY']);
const dailyHours = ref(8.0);

const weekDayOptions: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
];

const activeWorkingDays = computed(() => {
  return ALL_WEEK_DAYS.filter((day) => !selectedNonWorkingDays.value.includes(day));
});

function formatDayName(day: DayOfWeek): string {
  const match = weekDayOptions.find((o) => o.value === day);
  return match ? match.label : day;
}

function isNonWorkingDay(day: DayOfWeek): boolean {
  return selectedNonWorkingDays.value.includes(day);
}

function toggleNonWorkingDay(day: DayOfWeek) {
  if (isScheduleConfigured.value) return;
  if (selectedNonWorkingDays.value.includes(day)) {
    selectedNonWorkingDays.value = selectedNonWorkingDays.value.filter((d) => d !== day);
  } else {
    selectedNonWorkingDays.value = [...selectedNonWorkingDays.value, day];
  }
}

async function loadScheduleConfig() {
  if (isPM.value) return;
  try {
    const config = await getResourceWorkScheduleApi('me');
    selectedNonWorkingDays.value = Array.isArray(config.non_working_days)
      ? config.non_working_days
      : ['SATURDAY', 'SUNDAY'];
    isScheduleConfigured.value = Boolean(config.schedule_configured);
    dailyHours.value = 8.0;
  } catch (error) {
    console.error('Failed to fetch schedule config on profile load:', error);
  }
}

async function openWorkingDaysDialog() {
  workingDaysDialog.value = true;
  scheduleLoading.value = true;
  try {
    const config = await getResourceWorkScheduleApi('me');
    selectedNonWorkingDays.value = Array.isArray(config.non_working_days)
      ? config.non_working_days
      : ['SATURDAY', 'SUNDAY'];
    isScheduleConfigured.value = Boolean(config.schedule_configured);
    dailyHours.value = 8.0;
  } catch (error) {
    const err = error as Error;
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to load schedule settings',
    });
  } finally {
    scheduleLoading.value = false;
  }
}

async function handleSaveScheduleConfig() {
  if (isScheduleConfigured.value) {
    $q.notify({
      type: 'warning',
      message: 'Your working schedule has already been configured and cannot be changed.',
    });
    return;
  }

  if (selectedNonWorkingDays.value.length >= 7) {
    $q.notify({
      type: 'warning',
      message: 'You cannot mark all 7 days as non-working. At least 1 working day is required.',
    });
    return;
  }

  scheduleSubmitting.value = true;
  try {
    const updated = await updateResourceWorkScheduleApi('me', {
      non_working_days: selectedNonWorkingDays.value,
    });
    isScheduleConfigured.value = Boolean(updated.schedule_configured);
    selectedNonWorkingDays.value = updated.non_working_days || [];
    $q.notify({
      type: 'positive',
      message: 'Schedule settings saved successfully',
    });
    workingDaysDialog.value = false;
  } catch (error) {
    const err = error as Error;
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to update schedule settings',
    });
  } finally {
    scheduleSubmitting.value = false;
  }
}

const hasProfileChanges = computed(() => {
  return (
    editForm.name.trim() !== profileData.value.name ||
    editForm.username.trim() !== (profileData.value.username || '')
  );
});

function formatMemberSince(dateStr?: string) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function openChangePasswordDialog() {
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  showOldPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
  showPasswordDialog.value = true;
}

async function loadProfile() {
  loading.value = true;
  try {
    const data = await getUserProfileApi();
    profileData.value = data.user;

    editForm.name = data.user.name;
    editForm.username = data.user.username || '';

    // Sync auth store
    if (authStore.user) {
      authStore.setUser({
        ...authStore.user,
        name: data.user.name,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
      });
    }
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load profile',
    });
  } finally {
    loading.value = false;
  }
}

async function handleSaveProfile() {
  if (!hasProfileChanges.value) return;

  savingProfile.value = true;
  try {
    const res = await updateUserProfileApi({
      name: editForm.name.trim(),
      username: editForm.username.trim(),
    });

    profileData.value.name = res.user.name;
    profileData.value.username = res.user.username;

    // Update global store
    if (authStore.user) {
      authStore.setUser({
        ...authStore.user,
        name: res.user.name,
        username: res.user.username,
      });
    }

    $q.notify({
      type: 'positive',
      message: 'Profile updated successfully',
    });
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update profile',
    });
  } finally {
    savingProfile.value = false;
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    $q.notify({ type: 'negative', message: 'Passwords do not match' });
    return;
  }

  savingPassword.value = true;
  try {
    await resetPasswordApi({
      email: profileData.value.email,
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });

    $q.notify({
      type: 'positive',
      message: 'Password changed successfully',
    });

    showPasswordDialog.value = false;
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch (error: unknown) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update password',
    });
  } finally {
    savingPassword.value = false;
  }
}

onMounted(() => {
  void loadProfile();
  if (!isPM.value) {
    void loadScheduleConfig();
  }
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 12px;
}
</style>
