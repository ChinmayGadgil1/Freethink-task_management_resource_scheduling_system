<template>
  <div class="q-px-md" style="width: 100%; max-width: 480px">
    <q-card class="auth-card q-pa-xl">
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
    console.log('Forgot Password:', email.value);
    await new Promise((resolve) => setTimeout(resolve, 800));
    $q.notify({
      type: 'positive',
      message: 'Reset instructions will be sent to your email.',
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Something went wrong. Please try again.',
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
