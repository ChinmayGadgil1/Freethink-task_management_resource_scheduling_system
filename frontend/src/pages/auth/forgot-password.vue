<template>
  <div class="q-px-md" style="width: 100%; max-width: 480px">
    <q-card class="auth-card q-pa-xl relative-position">
      <!-- Back Navigation Button -->
      <div class="absolute-top-left q-pa-md" style="z-index: 2">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
          aria-label="Go back"
          @click="handleGoBack"
        >
          <q-tooltip>Back</q-tooltip>
        </q-btn>
      </div>

      <!-- Card Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-weight-bold auth-title">Forgot Password?</div>
        <div class="text-body2 auth-subtitle q-mt-sm">
          Enter your email address and we'll send you instructions to reset your password.
        </div>
      </q-card-section>

      <!-- Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleForgotPassword"
          style="display: flex; flex-direction: column; gap: 18px"
        >
          <!-- Email -->
          <q-input
            v-model="email"
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

          <!-- Send Reset Link Button -->
          <q-btn
            type="submit"
            unelevated
            no-caps
            label="Send Reset Link"
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
            label="login"
            class="q-pa-none text-weight-bold auth-login-link"
            @click="goToLogin"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const email = ref('');
const loading = ref(false);

const handleForgotPassword = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    $q.notify({
      type: 'positive',
      message: 'If that email is registered, a reset link has been sent. Check your inbox.',
      timeout: 5000,
    });

    email.value = '';
  } catch (error: unknown) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  void router.push('/login');
};

const handleGoBack = () => {
  if (window.history.state?.back) {
    router.back();
  } else {
    void router.push('/');
  }
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

  .auth-icon {
    color: var(--wo-text-muted, #94a3b8) !important;
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
