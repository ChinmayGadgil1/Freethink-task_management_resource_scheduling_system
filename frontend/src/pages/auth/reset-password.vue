<template>
  <div class="q-px-md" style="width: 100%; max-width: 480px">
    <q-card class="auth-card q-pa-xl">
      <!-- Card Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-weight-bold auth-title">Reset Password</div>
        <div class="text-body2 auth-subtitle q-mt-sm">Enter your new password below.</div>
      </q-card-section>

      <!-- Reset Password Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleResetPassword"
          style="display: flex; flex-direction: column; gap: 18px"
        >
          <!-- New Password -->
          <q-input
            v-model="form.password"
            outlined
            dense
            hide-bottom-space
            label="New Password"
            class="auth-input"
            :type="showPassword ? 'text' : 'password'"
            :rules="passwordRules"
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
            label="Confirm New Password"
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

          <!-- Update Password Button -->
          <q-btn
            type="submit"
            unelevated
            no-caps
            label="Update Password"
            color="deep-purple"
            text-color="white"
            class="full-width rounded-borders auth-submit-btn q-mt-sm"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <!-- Back to Login -->
      <q-card-section class="text-center q-pt-sm">
        <div class="text-caption auth-footer-text">
          Remembered your password?
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
import { reactive, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const form = reactive({
  token: '',
  password: '',
  confirmPassword: '',
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);

// Auto-fill token from URL query param: /reset-password?token=abc123
onMounted(() => {
  const tokenFromUrl = route.query.token;
  if (tokenFromUrl && typeof tokenFromUrl === 'string') {
    form.token = tokenFromUrl;
  }
});

const passwordRules = [
  (val: string) => !!val || 'Password is required',
  (val: string) => val.length >= 6 || 'Password must be at least 6 characters',
  (val: string) => /^[A-Z]/.test(val) || 'First character must be uppercase',
  (val: string) => /[0-9]/.test(val) || 'Password must contain at least one number',
  (val: string) =>
    /[^A-Za-z0-9]/.test(val) || 'Password must contain at least one special character',
];

const handleResetPassword = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:3000/api/auth/reset-password-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: form.token,
        newPassword: form.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed');
    }

    $q.notify({
      type: 'positive',
      message: 'Password reset successful! Please log in with your new password.',
      timeout: 4000,
    });
    void router.push('/login');
  } catch (error: unknown) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'Password reset failed. The link may have expired.',
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
