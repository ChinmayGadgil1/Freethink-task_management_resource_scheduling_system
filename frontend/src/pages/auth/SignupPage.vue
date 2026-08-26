<template>
  <div class="q-px-md" style="width: 100%; max-width: 480px">
    <q-card class="auth-card q-pa-xl">
      <!-- Card Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-weight-bold auth-title">Create Account</div>
        <div class="text-body2 auth-subtitle q-mt-sm">Create your account to get started</div>
      </q-card-section>

      <!-- Signup Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleSignup"
          style="display: flex; flex-direction: column; gap: 18px"
        >
          <!-- Full Name -->
          <q-input
            v-model="form.name"
            outlined
            dense
            hide-bottom-space
            label="Full Name"
            class="auth-input"
            :rules="[(val) => !!val || 'Name is required']"
          >
            <template #prepend>
              <q-icon name="person_outline" class="auth-icon" />
            </template>
          </q-input>

          <!-- Username -->
          <q-input
            v-model="form.username"
            outlined
            dense
            hide-bottom-space
            label="Username"
            class="auth-input"
            :rules="[
              (val) => !!val || 'Username is required',
              (val) => val.length >= 3 || 'Username must be at least 3 characters',
              (val) => val.length <= 50 || 'Username must be at most 50 characters',
            ]"
          >
            <template #prepend>
              <q-icon name="account_circle" class="auth-icon" />
            </template>
          </q-input>

          <!-- Email -->
          <q-input
            v-model="form.email"
            outlined
            dense
            hide-bottom-space
            label="Enter Email-id"
            type="email"
            class="auth-input"
            :rules="[
              (val) => !!val || 'Email is required',
              (val) => /.+@.+\..+/.test(val) || 'Enter a valid email',
            ]"
          >
            <template #prepend>
              <q-icon name="mail_outline" class="auth-icon" />
            </template>
          </q-input>

          <!-- Role -->
          <q-select
            v-model="form.role"
            outlined
            dense
            hide-bottom-space
            label="Select Role"
            class="auth-input"
            popup-content-class="auth-select-popup"
            :options="roleOptions"
            emit-value
            map-options
            :dark="$q.dark.isActive"
            :rules="[(val) => !!val || 'Role is required']"
          >
            <template #prepend>
              <q-icon name="badge" class="auth-icon" />
            </template>
          </q-select>

          <!-- Password -->
          <q-input
            v-model="form.password"
            outlined
            dense
            hide-bottom-space
            label="Password"
            class="auth-input"
            :type="showPassword ? 'text' : 'password'"
            :rules="[
              (val) => !!val || 'Password is required',
              (val) => val.length >= 6 || 'Password must be at least 6 characters',
              (val) => /^[A-Z]/.test(val) || 'First character must be uppercase',
              (val) => /[0-9]/.test(val) || 'Password must contain at least one number',
              (val) =>
                /[^A-Za-z0-9]/.test(val) || 'Password must contain at least one special character',
            ]"
          >
            <template #prepend>
              <q-icon name="lock_outline" class="auth-icon" />
            </template>
            <template #append>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                class="auth-show-btn"
                :label="showPassword ? 'Hide' : 'Show'"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <!-- Confirm Password -->
          <q-input
            v-model="form.confirmPassword"
            outlined
            dense
            hide-bottom-space
            label="Confirm Password"
            class="auth-input"
            :type="showConfirmPassword ? 'text' : 'password'"
            :rules="[
              (val) => !!val || 'Please confirm your password',
              (val) => val === form.password || 'Passwords do not match',
            ]"
          >
            <template #prepend>
              <q-icon name="lock_outline" class="auth-icon" />
            </template>
            <template #append>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                class="auth-show-btn"
                :label="showConfirmPassword ? 'Hide' : 'Show'"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <!-- Create Account Button -->
          <q-btn
            type="submit"
            unelevated
            no-caps
            label="Create Account"
            color="deep-purple"
            text-color="white"
            class="full-width rounded-borders auth-submit-btn q-mt-sm"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <!-- Login Link -->
      <q-card-section class="text-center q-pt-sm">
        <div class="text-caption auth-footer-text">
          Already have an account?
          <q-btn
            flat
            dense
            no-caps
            label="Sign in"
            class="q-pa-none text-weight-bold auth-login-link"
            @click="goToLogin"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { signupApi } from '@/services/api';

const $q = useQuasar();
const router = useRouter();

type SignupForm = {
  name: string;
  username: string;
  email: string;
  role: 'RESOURCE' | 'PROJECT_MANAGER';
  password: string;
  confirmPassword: string;
};

const form = reactive<SignupForm>({
  name: '',
  username: '',
  email: '',
  role: 'RESOURCE',
  password: '',
  confirmPassword: '',
});

const roleOptions = [
  { label: 'Resource', value: 'RESOURCE' },
  { label: 'Project Manager', value: 'PROJECT_MANAGER' },
];

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);

const handleSignup = async () => {
  if (form.password !== form.confirmPassword) {
    $q.notify({
      type: 'negative',
      message: 'Passwords do not match',
    });
    return;
  }

  loading.value = true;
  try {
    const data = await signupApi({
      name: form.name,
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role,
    });

    $q.notify({
      type: 'positive',
      message: data.message || 'Account created successfully!',
    });

    void router.push('/login');
  } catch (error: unknown) {
    console.error('Signup error:', error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Signup failed',
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  void router.push('/login');
};
</script>

<style scoped lang="scss">
.auth-card {
  border-radius: 20px;
  background: var(--wo-bg-card, #ffffff);
  border: 1px solid var(--wo-border, rgba(0, 0, 0, 0.06));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  color: var(--wo-text-main, #1d2433);
}

.auth-title {
  color: var(--wo-text-main, #1d2433);
}

.auth-subtitle {
  color: var(--wo-text-muted, #667085);
}

.auth-input :deep(.q-field__control) {
  border-radius: 8px;
  background: var(--wo-bg-input, #ffffff);
  min-height: 42px;
}

.auth-input :deep(.q-field__native),
.auth-input :deep(.q-field__input) {
  color: var(--wo-text-main, #1d2433);
  font-size: 13.5px;
}

.auth-input :deep(.q-field__label) {
  color: var(--wo-text-muted, #667085);
  font-size: 13px;
}

.auth-icon {
  color: var(--wo-text-muted, #667085);
}

.auth-show-btn {
  color: var(--wo-text-muted, #667085);
  background: transparent !important;
}

.auth-submit-btn {
  background: #8b6fd8 !important;
  border-radius: 8px;
  font-weight: 700;
  height: 42px;
}

.auth-footer-text {
  color: var(--wo-text-muted, #667085);
}

.auth-login-link {
  color: var(--wo-primary, #8b6fd8);
}

/* Dark mode specific fine-tuning */
body.body--dark {
  .auth-card {
    background: var(--wo-bg-card, #181d28) !important;
    border-color: var(--wo-border, #283042);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
  }

  .auth-input :deep(.q-field__control) {
    background: var(--wo-bg-input, #121622) !important;
    border-color: var(--wo-border, #283042);
  }

  .auth-input :deep(.q-field__control:before) {
    border-color: var(--wo-border, #283042) !important;
  }

  .auth-input :deep(.q-field__control:hover:before) {
    border-color: var(--wo-text-subtle, #64748b) !important;
  }

  .auth-input :deep(.q-field__native),
  .auth-input :deep(.q-field__input) {
    color: var(--wo-text-main, #f3f4f6) !important;
  }

  .auth-input :deep(.q-field__label) {
    color: var(--wo-text-muted, #94a3b8) !important;
  }

  .auth-icon,
  .auth-show-btn {
    color: var(--wo-text-muted, #94a3b8) !important;
    background: transparent !important;
  }

  .auth-title {
    color: #f3f4f6;
  }

  .auth-subtitle,
  .auth-footer-text {
    color: #94a3b8;
  }

  .auth-login-link {
    color: #a78bfa;
  }
}
</style>

<!-- Global style for teleported select popup menu -->
<style lang="scss">
.auth-select-popup {
  background: #ffffff !important;
  color: #1d2433 !important;
  border-radius: 10px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
  z-index: 9999 !important;

  .q-item {
    font-size: 13.5px;
    border-radius: 6px;
    margin: 2px 4px;
    min-height: 40px;
    color: #1d2433 !important;

    &:hover,
    &.q-manual-focusable--focused,
    &.q-item--active {
      background: #f4f0fd !important;
      color: #8b6fd8 !important;
    }
  }
}

body.body--dark .auth-select-popup {
  background: #181d28 !important;
  border: 1px solid #283042 !important;

  .q-item {
    color: #f3f4f6 !important;

    &:hover,
    &.q-manual-focusable--focused,
    &.q-item--active {
      background: #232a3b !important;
      color: #a78bfa !important;
    }
  }
}
</style>
