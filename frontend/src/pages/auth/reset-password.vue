<template>
  <div class="col-12 col-sm-9 col-md-6 col-lg-5 q-px-md" style="width: 100%; max-width: 540px">
    <q-card
      flat
      class="bg-white q-pa-xl"
      style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08)"
    >
      <!-- Card Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-weight-bold">Reset Password</div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Enter the reset token and your new password below.
        </div>
      </q-card-section>

      <!-- Reset Password Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleResetPassword"
          style="display: flex; flex-direction: column; gap: 18px"
        >
          <!-- Reset Token -->
          <q-input
            v-model="form.token"
            outlined
            dense
            hide-bottom-space
            label="Reset Token"
            :rules="[(val) => !!val || 'Reset token is required']"
          >
            <template #prepend>
              <q-icon name="key" />
            </template>
          </q-input>

          <!-- New Password -->
          <q-input
            v-model="form.password"
            outlined
            dense
            hide-bottom-space
            label="New Password"
            :type="showPassword ? 'text' : 'password'"
            :rules="passwordRules"
          >
            <template #prepend>
              <q-icon name="lock_outline" />
            </template>
            <template #append>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
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
            :type="showConfirmPassword ? 'text' : 'password'"
            :rules="[
              (val) => !!val || 'Please confirm your password',
              (val) => val === form.password || 'Passwords do not match',
            ]"
          >
            <template #prepend>
              <q-icon name="lock_outline" />
            </template>
            <template #append>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                :label="showConfirmPassword ? 'Hide' : 'Show'"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <!-- Update Password Button -->
          <q-btn
            type="submit"
            elevated
            no-caps
            label="Update Password"
            color="orange-3"
            text-color="dark"
            class="full-width rounded-borders q-mt-sm"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <!-- Back to Login -->
      <q-card-section class="text-center q-pt-sm">
        <div class="text-caption text-grey-7">
          Remembered your password?
          <q-btn
            flat
            dense
            no-caps
            label="Sign in"
            color="dark"
            class="q-pa-none text-weight-bold"
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

const $q = useQuasar();
const router = useRouter();

const form = reactive({
  token: '',
  password: '',
  confirmPassword: '',
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);

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
    console.log('Reset Password:', {
      token: form.token,
      newPassword: form.password,
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
    $q.notify({
      type: 'positive',
      message: 'Password reset successful!',
    });
    void router.push('/');
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Password reset failed',
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  void router.push('/');
};
</script>
