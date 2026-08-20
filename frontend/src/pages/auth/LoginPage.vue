<template>
  <div class="col-12 col-sm-9 col-md-6 col-lg-5 q-px-md" style="width: 100%; max-width: 540px">
    <q-card
      elevated
      class="auth-card q-pa-xl"
    >
      <!-- Card Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-weight-bold auth-title">Login</div>
        <div class="text-body2 text-grey-7 q-mt-sm auth-subtitle">
          Hey, Enter your details to get sign in
          <br />
          to your account
        </div>
      </q-card-section>

      <!-- Login Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleLogin"
          style="display: flex; flex-direction: column; gap: 18px"
        >
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
              <q-icon name="person_outline" class="auth-icon" />
            </template>
          </q-input>

          <!-- Password -->
          <q-input
            v-model="form.password"
            outlined
            dense
            hide-bottom-space
            label="Password"
            class="auth-input"
            :type="showPassword ? 'text' : 'password'"
            :rules="[(val) => !!val || 'Password is required']"
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

          <!-- Forgot Password -->
          <div class="row justify-end" style="margin-top: -8px">
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              label="Forgot password?"
              class="auth-link-muted text-weight-medium"
              @click="goToForgotPassword"
            />
          </div>

          <!-- Sign In Button -->
          <q-btn
            type="submit"
            unelevated
            no-caps
            label="Sign in"
            color="deep-purple"
            text-color="white"
            class="full-width rounded-borders auth-submit-btn"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <!-- Register Link -->
      <q-card-section class="text-center q-pt-sm">
        <div class="text-caption auth-footer-text">
          Don't have an account?
          <q-btn
            flat
            dense
            no-caps
            label="Sign up"
            class="q-pa-none text-weight-bold auth-signup-link"
            @click="goToRegister"
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
import { signinApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const showPassword = ref(false);
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  try {
    const data = await signinApi({
      email: form.email,
      password: form.password,
    });

    console.log('Sign in response:', data);

    if (data.user) {
      const token = data.user.token || data.token || '';
      authStore.setAuth(token, data.user);
      localStorage.removeItem('user');
    }

    const messageText = data.user?.name
      ? `Signed in successfully! Welcome ${data.user.name}`
      : data.message || 'Sign in successful!';

    sessionStorage.setItem('flashMessage', messageText);

    $q.notify({
      type: 'positive',
      message: messageText,
      position: 'top',
      timeout: 3000,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Redirect based on user role
    const role = data.user?.role;
    if (role === 'PROJECT_MANAGER') {
      void router.push('/pm/projects');
    } else if (role === 'RESOURCE') {
      void router.push('/app/resource-dashboard');
    } else {
      void router.push('/app');
    }
  } catch (error: unknown) {
    console.error('Login error:', error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Login failed',
      position: 'top',
      timeout: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  void router.push('/signup');
};

const goToForgotPassword = () => {
  void router.push('/forgot-password');
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

.auth-link-muted {
  color: var(--wo-text-muted, #667085);
}

.auth-footer-text {
  color: var(--wo-text-muted, #667085);
}

.auth-signup-link {
  color: var(--wo-primary, #8b6fd8);
}

/* Dark mode specific fine-tuning */
body.body--dark {
  .auth-card {
    background: var(--wo-bg-card, #181d28) !important;
    border-color: var(--wo-border, #283042);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
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
}
</style>
